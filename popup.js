// 1. Setup the "Track" button
document.getElementById('trackBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check supported sites
    const supportedSites = ["daraz.com.bd", "startech.com.bd", "rokomari.com", "pickaboo.com"];
    const isSupported = supportedSites.some(site => tab.url.includes(site));

    if (!isSupported) {
        alert("This site is not supported yet!");
        return;
    }

    // Get the User's Target Price
    const targetInput = document.getElementById('targetPrice').value;
    const targetPrice = targetInput ? parseFloat(targetInput) : 0; // 0 means "notify on any drop"

    // Try sending message first (content script might already be loaded)
    chrome.tabs.sendMessage(tab.id, { action: "getProductDetails" }, (response) => {
        // Must check lastError synchronously to consume it
        const error = chrome.runtime.lastError;
        
        if (error) {
            // Content script not loaded, inject it
            console.log("Content script not found, injecting...");
            chrome.scripting.executeScript(
                { target: { tabId: tab.id }, files: ["content.js"] },
                () => {
                    const injectError = chrome.runtime.lastError;
                    if (injectError) {
                        alert("Error injecting script: " + injectError.message);
                        return;
                    }
                    // Wait and try again after injection
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tab.id, { action: "getProductDetails" }, (response) => {
                            const retryError = chrome.runtime.lastError;
                            if (retryError) {
                                console.log("Message error:", retryError.message);
                                return;
                            }
                            if (response && !response.error) {
                                response.targetPrice = targetPrice;
                                saveProduct(response);
                            } else {
                                alert("Error: " + (response ? response.error : "Reload the page and try again."));
                            }
                        });
                    }, 100);
                }
            );
        } else if (response && !response.error) {
            // Content script already loaded, process response
            response.targetPrice = targetPrice;
            saveProduct(response);
        } else {
            alert("Error: " + (response ? response.error : "Reload the page and try again."));
        }
    });
});

// 2. Save to Storage
// 1. UPDATED: Save Product with History Initialization
function saveProduct(product) {
    chrome.storage.local.get({ watchlist: [] }, (result) => {
        const watchlist = result.watchlist;
        const exists = watchlist.find(item => item.url === product.url);
        
        if (!exists) {
            console.log("🚀 Tracking new product:", product.title);// Init history with the starting price
            product.history = [{ 
                date: new Date().toLocaleDateString(), 
                price: product.price 
            }]; 
            
            watchlist.push(product);
            chrome.storage.local.set({ watchlist }, () => {
                displayList();
                
                // Send to server when product is tracked
                syncToServer(product);
                
                alert("Tracking started!");
            });
        } else {
            alert("Already tracking.");
        }
    });
}// Sync product to server
async function syncToServer(product) {
    const API_URL = "https://price-tracker-bd.onrender.com/api/sync";
    try {
        const payload = {
            url: product.url,
            title: product.title,
            price: product.price,
            image: "https://via.placeholder.com/150"
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("✅ Synced to server:", result.message);
    } catch (err) {
        console.log("⚠️ Server sync failed:", err);
    }
}
// 2. UPDATED: Display List with Chart Button
function displayList() {
    chrome.storage.local.get({ watchlist: [] }, (result) => {
        const listDiv = document.getElementById('list');
        listDiv.innerHTML = "";
        
        if (result.watchlist.length === 0) {
            listDiv.innerHTML = "<p style='color:#999; text-align:center;'>No items yet.</p>";
            return;
        }

        result.watchlist.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = "item";
            // We need a unique ID for each canvas
            const canvasId = `chart-${index}`;
            
            div.innerHTML = `
                <div class="item-info">
                    <div class="item-title" title="${item.title}">${item.title}</div>
                    <div class="item-price">৳ ${item.price}</div>
                    <div style="margin-top:5px;">
                        <a href="${item.url}" target="_blank" class="item-link">Visit</a> | 
                        <span class="item-link show-chart-btn" data-index="${index}" style="cursor:pointer; color:#f85606;">
                            📊 History
                        </span>
                    </div>
                </div>
                <div class="delete-btn" data-index="${index}">×</div>
                
                <div id="container-${index}" class="chart-container" style="display:none;">
                    <canvas id="${canvasId}"></canvas>
                </div>
            `;
            listDiv.appendChild(div);
        });

        // Add Event Listeners
        addClickListeners(result.watchlist);
    });
}

// 3. NEW: Handle Chart Clicks
function addClickListeners(watchlist) {
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            removeFromList(e.target.getAttribute('data-index'));
        });
    });

    // Chart buttons
    document.querySelectorAll('.show-chart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            const container = document.getElementById(`container-${index}`);
            const canvas = document.getElementById(`chart-${index}`);
            
            // Toggle visibility
            if (container.style.display === "none") {
                container.style.display = "block";
                drawChart(canvas, watchlist[index].history || []);
            } else {
                container.style.display = "none";
            }
        });
    });
}

// 4. NEW: Draw the Chart using Chart.js
function drawChart(canvas, historyData) {
    // If no history exists, fake one entry so chart doesn't crash
    if (historyData.length === 0) {
        historyData = [{ date: 'Today', price: 0 }];
    }

    // Destroy old chart instance if it exists (to prevent glitches)
    if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    canvas.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: historyData.map(h => h.date),
            datasets: [{
                label: 'Price (৳)',
                data: historyData.map(h => h.price),
                borderColor: '#f85606',
                backgroundColor: 'rgba(248, 86, 6, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: false } // Price usually doesn't drop to 0
            },
            plugins: {
                legend: { display: false } // Hide legend to save space
            }
        }
    });
}
function removeFromList(index) {
    chrome.storage.local.get({ watchlist: [] }, (result) => {
        const watchlist = result.watchlist;
        watchlist.splice(index, 1);
        chrome.storage.local.set({ watchlist }, () => { displayList(); });
    });
}

// 4. NEW: Export to CSV Logic
document.getElementById('exportBtn').addEventListener('click', () => {
    chrome.storage.local.get({ watchlist: [] }, (result) => {
        const watchlist = result.watchlist;
        if (watchlist.length === 0) {
            alert("Nothing to export!");
            return;
        }

        // Create CSV Content
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Title,Price,Target Price,URL\n"; // Headers

        watchlist.forEach(item => {
            // Escape commas in titles so CSV doesn't break
            const cleanTitle = item.title.replace(/,/g, " "); 
            csvContent += `${cleanTitle},${item.price},${item.targetPrice || 0},${item.url}\n`;
        });

        // Trigger Download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "daraz_watchlist.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});

// Load on start
document.addEventListener('DOMContentLoaded', displayList);