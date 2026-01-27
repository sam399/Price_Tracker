/*
 * DARAZ PRICE TRACKER
 * -------------------
 * DISCLAIMER: This script is for educational purposes only.
 * It is not affiliated with Daraz.com.bd.
 * Use responsibly and do not use for aggressive scraping.
 */

// CONFIG: Server URL for syncing prices
const API_URL = "https://price-tracker-bd.onrender.com/api/sync";

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("checkPrices", { periodInMinutes: 60 });
});

//chrome.alarms.onAlarm.addListener((alarm) => {
    //if (alarm.name === "checkPrices") {
        //checkAllPrices();
   // }    
//});
chrome.action.onClicked.addListener(() => {
    console.log("🖱 Extension icon clicked — running price check now");
    checkAllPrices();
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
                        // ... inside the success block ...

                        console.log(`   💰 Found Price: ${currentPrice}`);

// NEW: Send data to your Node.js server

                        syncPriceToServer(item, currentPrice);


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
            const product = data.watchlist[index];
            
            // 1. Update Current Price
            product.price = newPrice;

            // 2. Initialize History if it doesn't exist (for old items)
            if (!product.history) product.history = [];

            // 3. Add Entry to History (Date + Price)
            const today = new Date().toLocaleDateString();
            
            // Prevent duplicate entries for the same day
            const lastEntry = product.history[product.history.length - 1];
            if (!lastEntry || lastEntry.date !== today) {
                product.history.push({ date: today, price: newPrice });
            } else {
                // If we already have an entry for today, update the price to the latest one
                lastEntry.price = newPrice;
            }

            // 4. Save & Notify
            data.watchlist[index] = product;
            chrome.storage.local.set({ watchlist: data.watchlist });
            
            if (dropPercent > 0) {
                 chrome.notifications.create(item.url, {
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: `Price Dropped by ${dropPercent}%!`,
                    message: `Now ৳${newPrice}. Click to buy!`,
                    priority: 2
                });
            }
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
// --- CLOUD SYNC FUNCTION ---
async function syncPriceToServer(item, currentPrice) {
    try {
        console.log(`☁️ Syncing to server: ${item.title.substring(0, 15)}...`);
        
        const payload = {
            url: item.url,
            title: item.title,
            price: currentPrice,
            image: "https://via.placeholder.com/150"
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.success) {
            console.log("   ✅ Server confirmed:", result.message);
        } else {
            console.log("   ⚠️ Server rejected:", result.error);
        }

    } catch (err) {
        console.log("   ❌ Sync Failed (Is server running?):", err);
    }
}