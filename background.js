chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("checkPrices", { periodInMinutes: 60 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkPrices") {
        checkAllPrices();
    }
});

async function checkAllPrices() {
    console.log("🚀 Starting Tab-Based Price Check...");
    
    const result = await chrome.storage.local.get({ watchlist: [] });
    const watchlist = result.watchlist;

    if (watchlist.length === 0) {
        console.log("⚠️ Watchlist is empty.");
        return;
    }

    // Check items one by one
    for (const item of watchlist) {
        await checkItemWithTab(item);
        // Wait 5 seconds between checks so your browser doesn't freeze
        await new Promise(r => setTimeout(r, 5000));
    }
}

function checkItemWithTab(item) {
    return new Promise((resolve) => {
        console.log(`🔎 Opening tab for: ${item.title.substring(0, 15)}...`);

        // 1. Create a tab (active: false means it opens in background)
        chrome.tabs.create({ url: item.url, active: false }, (tab) => {
            
            // 2. Wait 5 seconds for Daraz to load completely
            setTimeout(() => {
                
                // 3. Inject a script into that tab to read the price
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: scrapePriceFromPage, // The function below runs inside the tab
                }, (results) => {
                    
                    // 4. Close the tab immediately
                    chrome.tabs.remove(tab.id);

                    // 5. Handle the result
                    if (chrome.runtime.lastError || !results || !results[0]) {
                        console.log("   ❌ Failed to scrape tab.");
                    } else {
                        const currentPrice = results[0].result;
                        console.log(`   💰 Found Price: ${currentPrice} | Saved: ${item.price}`);

                        if (currentPrice > 0 && currentPrice < item.price) {
                            console.log("   🔥 PRICE DROP!");
                            updatePriceAndNotify(item, currentPrice);
                        } else {
                            console.log("   ✅ Price Stable");
                        }
                    }
                    resolve(); // Done with this item
                });
            }, 5000); // 5 second load time
        });
    });
}

// Helper to update storage and notify
function updatePriceAndNotify(item, newPrice) {
    chrome.storage.local.get({ watchlist: [] }, (data) => {
        const index = data.watchlist.findIndex(i => i.url === item.url);
        if (index !== -1) {
            data.watchlist[index].price = newPrice;
            chrome.storage.local.set({ watchlist: data.watchlist });
            
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.png',
                title: 'Price Drop!',
                message: `Price dropped to ৳${newPrice}!`
            });
        }
    });
}

// --- THIS FUNCTION RUNS INSIDE THE DARAZ PAGE ---
function scrapePriceFromPage() {
    // Strategy 1: Look for the JSON data (Best)
    try {
        const jsonEl = document.querySelector('script[type="application/ld+json"]');
        if (jsonEl) {
            const data = JSON.parse(jsonEl.innerText);
            if (data.offers && data.offers.price) return parseFloat(data.offers.price);
            if (data.offers && data.offers.lowPrice) return parseFloat(data.offers.lowPrice);
        }
    } catch (e) {}

    // Strategy 2: Look for the visual price (Backup)
    const priceEl = document.querySelector('.pdp-price_type_normal') || 
                    document.querySelector('.pdp-price') ||
                    document.querySelector('[data-spm-anchor-id] span'); // Generic fallback
                    
    if (priceEl) {
        return parseFloat(priceEl.innerText.replace(/[^\d.]/g, ''));
    }
    return 0; // Failed
}