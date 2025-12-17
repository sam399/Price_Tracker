// 1.The "Track" button
document.getElementById('trackBtn').addEventListener('click', async () => {
    // Gets the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Checks if we are on Daraz
    if (!tab.url.includes("daraz.com.bd")) {
        alert("Please go to a Daraz product page first.");
        return;
    }

    // Asks content.js for the data
    chrome.tabs.sendMessage(tab.id, { action: "getProductDetails" }, (response) => {
        if (response && !response.error) {
            saveProduct(response);
        } else {
            alert("Error: " + (response ? response.error : "Script blocked"));
        }
    });
});

// 2. Saves to Chrome Storage
function saveProduct(product) {
    chrome.storage.local.get({ watchlist: [] }, (result) => {
        const watchlist = result.watchlist;
        
        // Avoid duplicates
        const exists = watchlist.find(item => item.url === product.url);
        if (!exists) {
            watchlist.push(product);
            chrome.storage.local.set({ watchlist }, () => {
                displayList(); // Refresh UI
                alert("Added to watchlist!");
            });
        } else {
            alert("Already tracking this item.");
        }
    });
}

// 3. Display the list
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
            div.innerHTML = `
                <div class="item-info">
                    <div class="item-title" title="${item.title}">${item.title}</div>
                    <div class="item-price">৳ ${item.price}</div>
                    <a href="${item.url}" target="_blank" class="item-link">Visit Product</a>
                </div>
                <div class="delete-btn" data-index="${index}">×</div>
            `;
            listDiv.appendChild(div);
        });

        //  Delete functionality
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                removeFromList(index);
            });
        });
    });
}

// Helper function to delete items
function removeFromList(index) {
    chrome.storage.local.get({ watchlist: [] }, (result) => {
        const watchlist = result.watchlist;
        watchlist.splice(index, 1); // Remove item at index
        chrome.storage.local.set({ watchlist }, () => {
            displayList(); // Refresh UI
        });
    });
}

// Load list on popup open
document.addEventListener('DOMContentLoaded', displayList);