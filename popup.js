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

    chrome.tabs.sendMessage(tab.id, { action: "getProductDetails" }, (response) => {
        if (response && !response.error) {
            // Add target price to the product object
            response.targetPrice = targetPrice;
            saveProduct(response);
        } else {
            alert("Error: " + (response ? response.error : "Reload the page and try again."));
        }
    });
});

// 2. Save to Storage
function saveProduct(product) {
    chrome.storage.local.get({ watchlist: [] }, (result) => {
        const watchlist = result.watchlist;
        const exists = watchlist.find(item => item.url === product.url);
        
        if (!exists) {
            watchlist.push(product);
            chrome.storage.local.set({ watchlist }, () => {
                displayList();
                alert(`Tracking started! Target: ${product.targetPrice > 0 ? '৳' + product.targetPrice : 'Any Drop'}`);
            });
        } else {
            alert("Already tracking this item.");
        }
    });
}

// 3. Display List (Updated to show Target Price)
function displayList() {
    chrome.storage.local.get({ watchlist: [] }, (result) => {
        const listDiv = document.getElementById('list');
        listDiv.innerHTML = "";
        
        if (result.watchlist.length === 0) {
            listDiv.innerHTML = "<p style='text-align:center; color:#999; font-size:12px;'>No items yet.</p>";
            return;
        }

        result.watchlist.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = "item";
            
            // Show Target Price if it exists
            const targetDisplay = item.targetPrice > 0 
                ? `<span style="color:#666; font-size:11px;">(Target: ৳${item.targetPrice})</span>` 
                : "";

            div.innerHTML = `
                <div class="item-info">
                    <div class="item-title" title="${item.title}">${item.title}</div>
                    <div class="item-price">৳ ${item.price} ${targetDisplay}</div>
                    <a href="${item.url}" target="_blank" class="item-link">Visit Product</a>
                </div>
                <div class="delete-btn" data-index="${index}">×</div>
            `;
            listDiv.appendChild(div);
        });

        // Add delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                removeFromList(index);
            });
        });
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