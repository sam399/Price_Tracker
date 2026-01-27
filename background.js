/*
 * DARAZ PRICE TRACKER
 * -------------------
 * DISCLAIMER: This script is for educational purposes only.
 * It is not affiliated with Daraz.com.bd.
 * Use responsibly and do not use for aggressive scraping.
 */

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
        // Waits 5 seconds between checks so your browser doesn't freeze
        await new Promise(r => setTimeout(r, 5000));
    }
}

function checkItemWithTab(item) {
    return new Promise((resolve) => {
        console.log(`🔎 Opening tab for: ${item.title.substring(0, 15)}...`);

        // 1. Creates a tab (active: false means it opens in background)
        chrome.tabs.create({ url: item.url, active: false }, (tab) => {
            
            // 2. Waits 5 seconds for Daraz to load completely
            setTimeout(() => {
                
                // 3. Injects a script into that tab to read the price
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: scrapePriceFromPage, // The function below runs inside the tab
                }, (results) => {
                    
                    // 4. Closes the tab immediately
                    chrome.tabs.remove(tab.id);

                // 5. Handles the result
                    if (chrome.runtime.lastError || !results || !results[0]) {
                        console.log("   ❌ Failed to scrape tab.");
                    } else {
                        const currentPrice = results[0].result;
                        console.log(`   💰 Found Price: ${currentPrice} | Saved: ${item.price}`);

                        if (currentPrice > 0 && currentPrice < item.price) {
                            // 1. Calculate Percentage Drop
                            const dropAmount = item.price - currentPrice;
                            const dropPercent = Math.round((dropAmount / item.price) * 100);

                            // 2. Check Target Logic
                            // Notify IF: (No target set) OR (Price is below Target)
                            const targetMet = !item.targetPrice || (item.targetPrice > 0 && currentPrice <= item.targetPrice);

                            if (targetMet) {
                                console.log(`   🔥 PRICE DROP! -${dropPercent}%`);
                                
                                // Update Price in Storage
                                item.price = currentPrice;
                                // Important: We need to write this update back to the main watchlist array
                                // (This requires passing the whole watchlist or re-fetching it, 
                                //  but for now let's use the helper function below)
                                updatePriceAndNotify(item, currentPrice, dropPercent);
                            } else {
                                console.log(`   📉 Dropped to ${currentPrice}, but waiting for target (${item.targetPrice})`);
                            }
                        } else {
                            console.log("   ✅ Price Stable");
                        }
                    }
                    resolve(); // Done with this item
                }); // end of chrome.scripting.executeScript callback
            }, 5000); // 5 second load time
        }); // end of chrome.tabs.create callback
    }); // end of Promise
}

// Helper to update storage and notify
function updatePriceAndNotify(item, newPrice, dropPercent) {
    chrome.storage.local.get({ watchlist: [] }, (data) => {
        const index = data.watchlist.findIndex(i => i.url === item.url);
        if (index !== -1) {
            // Update storage
            data.watchlist[index].price = newPrice;
            chrome.storage.local.set({ watchlist: data.watchlist });
            
            // Smart Notification
            chrome.notifications.create(item.url, {
                type: 'basic',
                iconUrl: 'icon.png',
                title: `Price Dropped by ${dropPercent}%!`,
                message: `Now ৳${newPrice} (was ৳${item.price + (item.price - newPrice)}). Click to buy!`,
                priority: 2
            });
        }
    });
}

// Handle notification clicks (placed outside to avoid duplicate listeners)
chrome.notifications.onClicked.addListener((notificationId) => {
    // notificationId is the product URL we passed during creation
    chrome.tabs.create({ url: notificationId });
    chrome.notifications.clear(notificationId);
});
// --- THIS FUNCTION RUNS INSIDE THE DARAZ PAGE ---
function scrapePriceFromPage() {
    
    try {
        const jsonEl = document.querySelector('script[type="application/ld+json"]');
        if (jsonEl) {
            const data = JSON.parse(jsonEl.innerText);
            if (data.offers && data.offers.price) return parseFloat(data.offers.price);
            if (data.offers && data.offers.lowPrice) return parseFloat(data.offers.lowPrice);
        }
    } catch (e) {}

    
        const priceEl = document.querySelector('.pdp-price_type_normal') || 
                        document.querySelector('.pdp-price') ||
                        document.querySelector('[data-spm-anchor-id] span'); // Generic fallback
                        
        if (priceEl) {
            return parseFloat(priceEl.innerText.replace(/[^\d.]/g, ''));
        }
        return 0; // Failed to find price
    }