// BD Price Tracker - Background Service Worker

// 1. Setup periodic alarm on install/update
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("checkPrices", { periodInMinutes: 60 });
    console.log("BD Price Tracker initialized. Check alarm scheduled every 60m.");
});

// 2. Listen for alarm triggers
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkPrices") {
        checkAllPrices();
    }
});

// 3. Listen for manual check requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "refreshAllPrices") {
        checkAllPrices().then((summary) => {
            sendResponse({ success: true, summary });
        }).catch((err) => {
            sendResponse({ success: false, error: err.message });
        });
        return true; // Keep message channel open for async response
    }
});

// 4. Main price check runner (Runs silently via fetch, NO tabs opened!)
async function checkAllPrices() {
    console.log("🚀 Starting silent price check...");
    const { watchlist = [] } = await chrome.storage.local.get({ watchlist: [] });

    if (watchlist.length === 0) {
        console.log("Watchlist is empty.");
        return { total: 0, drops: 0 };
    }

    let dropsCount = 0;
    let hasUpdates = false;

    for (let i = 0; i < watchlist.length; i++) {
        const item = watchlist[i];
        if (!item.url) continue;

        try {
            const latestData = await fetchProductData(item.url);
            if (latestData && latestData.price > 0) {
                const oldPrice = item.price;
                const newPrice = latestData.price;

                // Ensure price history exists
                if (!Array.isArray(item.history)) {
                    item.history = [{ price: oldPrice, date: item.dateAdded || new Date().toISOString() }];
                }

                // If image was missing, save it now
                if (!item.image && latestData.image) {
                    item.image = latestData.image;
                    hasUpdates = true;
                }

                // Detect price drop
                if (newPrice < oldPrice) {
                    dropsCount++;
                    const diff = oldPrice - newPrice;
                    const percent = Math.round((diff / oldPrice) * 100);

                    triggerPriceDropNotification(item, oldPrice, newPrice, percent);
                    item.lowestPrice = Math.min(item.lowestPrice || oldPrice, newPrice);
                }

                // Record new price if changed
                if (newPrice !== oldPrice) {
                    item.price = newPrice;
                    item.history.push({ price: newPrice, date: new Date().toISOString() });
                    hasUpdates = true;
                }

                item.lastChecked = new Date().toISOString();
                item.status = "active";
            }
        } catch (err) {
            console.error(`Failed to check item ${item.title}:`, err);
            item.status = "error";
        }

        // Polite delay between background requests to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    if (hasUpdates) {
        await chrome.storage.local.set({ watchlist });
    }

    console.log(`✅ Price check completed. Checked: ${watchlist.length}, Drops: ${dropsCount}`);
    return { total: watchlist.length, drops: dropsCount };
}

// 5. Silent background fetch & HTML extraction (No CORS issues in MV3 Service Worker with host_permissions)
async function fetchProductData(url) {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }

    const html = await response.text();
    return parseDarazHtml(html);
}

// 6. Resilient HTML parser: uses embedded pdpTrackingData or JSON-LD
function parseDarazHtml(html) {
    // Strategy 1: pdpTrackingData (Server-rendered JSON in Daraz HTML)
    try {
        const pdpMatch = html.match(/var\s+pdpTrackingData\s*=\s*"([\s\S]*?)";/);
        if (pdpMatch) {
            const rawJson = pdpMatch[1].replace(/\\"/g, '"').replace(/\\\//g, '/');
            const data = JSON.parse(rawJson);
            const priceStr = data.pdt_price || "";
            const price = parseFloat(priceStr.replace(/[^\d.]/g, ""));

            if (price > 0) {
                return {
                    title: data.pdt_name || "",
                    price: price,
                    image: data.pdt_photo || ""
                };
            }
        }
    } catch (e) {
        console.warn("pdpTrackingData parse error:", e);
    }

    // Strategy 2: application/ld+json (Schema.org metadata)
    try {
        const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
        for (const match of scripts) {
            const parsed = JSON.parse(match[1]);
            if (parsed["@type"] === "Product" && parsed.offers) {
                const offerPrice = parseFloat(parsed.offers.price || parsed.offers.lowPrice || 0);
                const image = Array.isArray(parsed.image) ? parsed.image[0] : (parsed.image || "");
                if (offerPrice > 0) {
                    return {
                        title: parsed.name || "",
                        price: offerPrice,
                        image: image
                    };
                }
            }
        }
    } catch (e) {
        console.warn("ld+json parse error:", e);
    }

    // Strategy 3: Regex fallbacks for Open Graph & visual tags
    const priceMatch = html.match(/"pdt_price":\s*"৳?\s*([0-9,.]+)"/);
    if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ""));
        const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
        return {
            title: ogTitleMatch ? ogTitleMatch[1] : "",
            price: price,
            image: ogImageMatch ? ogImageMatch[1] : ""
        };
    }

    return null;
}

// 7. Desktop notification helper
function triggerPriceDropNotification(item, oldPrice, newPrice, percent) {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: `🔥 Price Drop: ৳${oldPrice} ➔ ৳${newPrice} (-${percent}%)`,
        message: `${item.title.substring(0, 60)}...`
    });
}
