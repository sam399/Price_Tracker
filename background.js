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

// 3. Listen for manual refresh requests from popup
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

// 4. Main price check runner
async function checkAllPrices() {
    console.log("🚀 Starting background price check...");
    const { watchlist = [] } = await chrome.storage.local.get({ watchlist: [] });

    if (watchlist.length === 0) {
        console.log("Watchlist is empty.");
        return { total: 0, updated: 0, drops: 0 };
    }

    let dropsCount = 0;
    let updatedCount = 0;
    let hasUpdates = false;

    for (let i = 0; i < watchlist.length; i++) {
        const item = watchlist[i];
        if (!item.url) continue;

        try {
            const latestData = await fetchProductData(item.url);
            if (latestData && latestData.price > 0) {
                const oldPrice = item.price;
                const newPrice = latestData.price;

                // Ensure price history array exists
                if (!Array.isArray(item.history)) {
                    item.history = [{ price: oldPrice, date: item.dateAdded || new Date().toISOString() }];
                }

                // If image was missing, save it now
                if (!item.image && latestData.image) {
                    item.image = latestData.image;
                    hasUpdates = true;
                }

                // If title was missing, save it
                if (!item.title && latestData.title) {
                    item.title = latestData.title;
                    hasUpdates = true;
                }

                // Preserve or set initialPrice / originalPrice for discount badges
                if (latestData.originalPrice && latestData.originalPrice > newPrice) {
                    if (!item.initialPrice || item.initialPrice < latestData.originalPrice) {
                        item.initialPrice = latestData.originalPrice;
                        hasUpdates = true;
                    }
                }

                // Detect price change
                if (newPrice !== oldPrice) {
                    updatedCount++;
                    hasUpdates = true;

                    // Detect price drop
                    if (newPrice < oldPrice) {
                        dropsCount++;
                        const diff = oldPrice - newPrice;
                        const percent = Math.round((diff / oldPrice) * 100);

                        triggerPriceDropNotification(item, oldPrice, newPrice, percent);
                        item.lowestPrice = Math.min(item.lowestPrice || oldPrice, newPrice);
                    }

                    item.price = newPrice;
                    item.history.push({ price: newPrice, date: new Date().toISOString() });
                }

                item.lastChecked = new Date().toISOString();
                item.status = "active";
            }
        } catch (err) {
            console.error(`Failed to check item ${item.title}:`, err);
            item.status = "error";
        }

        // Polite delay between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (hasUpdates) {
        await chrome.storage.local.set({ watchlist });
    }

    console.log(`✅ Price check completed. Checked: ${watchlist.length}, Updated: ${updatedCount}, Drops: ${dropsCount}`);
    return { total: watchlist.length, updated: updatedCount, drops: dropsCount };
}

// 5. Smart Product Fetcher: Uses Daraz Catalog AJAX API for live flash sale/campaign prices, with HTML fallback
async function fetchProductData(url) {
    // -------------------------------------------------------------
    // STRATEGY 1: Daraz Catalog AJAX API (Accurate live campaign/flash sale price)
    // -------------------------------------------------------------
    const idMatch = url.match(/-i(\d+)/);
    if (idMatch) {
        const itemId = idMatch[1];
        try {
            const apiUrl = `https://www.daraz.com.bd/catalog/?ajax=true&q=${itemId}`;
            const apiRes = await fetch(apiUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "application/json"
                }
            });

            if (apiRes.ok) {
                const json = await apiRes.json();
                const items = json.mods?.listItems || [];
                // Match exact item by itemId or nid
                const matched = items.find(i => String(i.itemId || i.nid) === String(itemId)) || items[0];

                if (matched && matched.price) {
                    const priceNum = parseFloat(String(matched.price).replace(/[^\d.]/g, ''));
                    const origNum = matched.originalPrice ? parseFloat(String(matched.originalPrice).replace(/[^\d.]/g, '')) : 0;
                    const imgUrl = matched.image ? (matched.image.startsWith('//') ? 'https:' + matched.image : matched.image) : "";

                    if (priceNum > 0) {
                        return {
                            title: matched.name || "",
                            price: priceNum,
                            originalPrice: origNum > priceNum ? origNum : priceNum,
                            image: imgUrl
                        };
                    }
                }
            }
        } catch (e) {
            console.warn("Daraz catalog API query failed, falling back to HTML fetch:", e);
        }
    }

    // -------------------------------------------------------------
    // STRATEGY 2: Fallback to HTML fetch & extraction
    // -------------------------------------------------------------
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

// 6. Resilient HTML parser fallback
function parseDarazHtml(html) {
    // Strategy A: pdpTrackingData
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
    } catch (e) {}

    // Strategy B: application/ld+json
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
    } catch (e) {}

    // Strategy C: Regex fallback
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
