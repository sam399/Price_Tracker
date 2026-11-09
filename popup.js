// BD Price Tracker - Popup Logic (Local + Optional Cloud 24/7 Sync)

const pageStatusEl = document.getElementById('pageStatus');
const trackBtn = document.getElementById('trackBtn');
const refreshBtn = document.getElementById('refreshBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsDrawer = document.getElementById('settingsDrawer');
const backendUrlInput = document.getElementById('backendUrlInput');
const telegramChatIdInput = document.getElementById('telegramChatIdInput');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const listDiv = document.getElementById('list');
const itemCountEl = document.getElementById('itemCount');
const toastEl = document.getElementById('toast');

let activeTabInfo = null;

// Show lightweight toast message
function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
        toastEl.classList.add('hidden');
    }, 2500);
}

// 1. Initialize popup & inspect active tab
async function init() {
    displayList();
    loadSettings();

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        activeTabInfo = tab;

        if (!tab || !tab.url) {
            pageStatusEl.textContent = "Open a Daraz BD page to start tracking.";
            trackBtn.disabled = true;
            return;
        }

        const isDaraz = tab.url.includes("daraz.com.bd");
        const isProduct = tab.url.includes("/products/") || tab.url.includes("-i");

        if (isDaraz && isProduct) {
            pageStatusEl.textContent = "Daraz product detected!";
            pageStatusEl.style.color = "#2e7d32";
            trackBtn.disabled = false;
        } else if (isDaraz) {
            pageStatusEl.textContent = "Go to a specific product page to track it.";
            trackBtn.disabled = true;
        } else {
            pageStatusEl.textContent = "Browse to daraz.com.bd to track prices.";
            trackBtn.disabled = true;
        }
    } catch (e) {
        console.error("Tab query failed:", e);
    }
}

// 2. Settings toggle and persistence
settingsBtn.addEventListener('click', () => {
    settingsDrawer.classList.toggle('hidden');
});

async function loadSettings() {
    const { backendUrl = '', telegramChatId = '' } = await chrome.storage.local.get(['backendUrl', 'telegramChatId']);
    backendUrlInput.value = backendUrl;
    telegramChatIdInput.value = telegramChatId;
}

saveSettingsBtn.addEventListener('click', async () => {
    let url = backendUrlInput.value.trim().replace(/\/$/, '');
    const chatId = telegramChatIdInput.value.trim();

    await chrome.storage.local.set({ backendUrl: url, telegramChatId: chatId });
    settingsDrawer.classList.add('hidden');
    showToast("Cloud settings saved! ☁️");
    displayList();
});

// 3. Track current product button handler
trackBtn.addEventListener('click', async () => {
    if (!activeTabInfo || !activeTabInfo.id) return;

    trackBtn.disabled = true;
    trackBtn.textContent = "Extracting...";

    try {
        chrome.tabs.sendMessage(activeTabInfo.id, { action: "getProductDetails" }, async (response) => {
            trackBtn.textContent = "+ Track This Product";
            trackBtn.disabled = false;

            if (chrome.runtime.lastError) {
                showToast("Please refresh the Daraz page and try again.");
                return;
            }

            if (response && response.success && response.product) {
                await saveProduct(response.product);
            } else {
                showToast(response?.error || "Could not extract product details.");
            }
        });
    } catch (err) {
        trackBtn.textContent = "+ Track This Product";
        trackBtn.disabled = false;
        showToast("Error communicating with page.");
    }
});

// 4. Save product locally + sync with Cloud Backend if configured
async function saveProduct(product) {
    const { watchlist = [], backendUrl = '', telegramChatId = '' } = await chrome.storage.local.get(['watchlist', 'backendUrl', 'telegramChatId']);

    const cleanUrl = product.url.split('?')[0];
    const exists = watchlist.some(item => (item.url || '').split('?')[0] === cleanUrl);

    if (exists) {
        showToast("Already tracking this item!");
        return;
    }

    const newItem = {
        id: product.id || ('item_' + Date.now()),
        title: product.title,
        price: product.price,
        initialPrice: product.price,
        lowestPrice: product.price,
        image: product.image || '',
        url: product.url,
        dateAdded: new Date().toLocaleDateString('en-GB'),
        history: [{ price: product.price, date: new Date().toISOString() }],
        backendId: null
    };

    // If Cloud backend is configured, register for 24/7 tracking
    if (backendUrl) {
        try {
            const cloudRes = await fetch(`${backendUrl}/api/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: product.url,
                    telegram_chat_id: telegramChatId || null
                })
            });
            if (cloudRes.ok) {
                const cloudData = await cloudRes.json();
                newItem.backendId = cloudData?.product?.id;
                showToast("Tracked locally & in Cloud 24/7! 🚀");
            } else {
                showToast("Saved locally (Cloud sync skipped).");
            }
        } catch (e) {
            console.warn("Cloud backend unreachable:", e);
            showToast("Saved locally (Cloud offline).");
        }
    } else {
        showToast("Added to your watchlist! 🎯");
    }

    watchlist.unshift(newItem);
    await chrome.storage.local.set({ watchlist });

    displayList();
}

// 5. Render watchlist (XSS-safe DOM construction)
async function displayList() {
    const { watchlist = [], backendUrl = '' } = await chrome.storage.local.get(['watchlist', 'backendUrl']);
    listDiv.innerHTML = "";
    itemCountEl.textContent = watchlist.length;

    if (watchlist.length === 0) {
        const empty = document.createElement('div');
        empty.className = "empty-state";
        empty.innerHTML = `
            <div style="font-size: 28px;">📦</div>
            <p><strong>Your watchlist is empty</strong></p>
            <p>Visit any Daraz product page and click "+ Track This Product".</p>
        `;
        listDiv.appendChild(empty);
        return;
    }

    watchlist.forEach((item) => {
        const card = document.createElement('div');
        card.className = "item-card";

        // Thumbnail Image
        const img = document.createElement('img');
        img.className = "item-thumb";
        img.src = item.image || "icons/icon48.png";
        img.alt = item.title;
        img.onerror = () => { img.src = "icons/icon48.png"; };

        // Details container
        const details = document.createElement('div');
        details.className = "item-details";

        // Title
        const title = document.createElement('a');
        title.className = "item-title";
        title.href = item.url;
        title.target = "_blank";
        title.title = item.title;
        title.textContent = item.title;

        // Price Row
        const priceRow = document.createElement('div');
        priceRow.className = "price-row";

        const currentPrice = document.createElement('span');
        currentPrice.className = "current-price";
        currentPrice.textContent = `৳ ${item.price.toLocaleString()}`;
        priceRow.appendChild(currentPrice);

        // Price drop badge
        if (item.initialPrice && item.price < item.initialPrice) {
            const oldPrice = document.createElement('span');
            oldPrice.className = "original-price";
            oldPrice.textContent = `৳ ${item.initialPrice.toLocaleString()}`;
            priceRow.appendChild(oldPrice);

            const dropPercent = Math.round(((item.initialPrice - item.price) / item.initialPrice) * 100);
            const dropBadge = document.createElement('span');
            dropBadge.className = "drop-pill";
            dropBadge.textContent = `▼ ${dropPercent}%`;
            priceRow.appendChild(dropBadge);
        }

        // Footer Row
        const footer = document.createElement('div');
        footer.className = "item-footer";

        const linksGroup = document.createElement('div');
        linksGroup.className = "item-links";

        const link = document.createElement('a');
        link.className = "item-link";
        link.href = item.url;
        link.target = "_blank";
        link.textContent = "Buy ↗";
        linksGroup.appendChild(link);

        // Keepa-style price chart link if backendId exists or backendUrl is configured
        if (backendUrl && item.backendId) {
            const chartLink = document.createElement('a');
            chartLink.className = "chart-link";
            chartLink.href = `${backendUrl}/api/products/${item.backendId}/chart`;
            chartLink.target = "_blank";
            chartLink.textContent = "📈 Chart";
            linksGroup.appendChild(chartLink);
        }

        const delBtn = document.createElement('button');
        delBtn.className = "delete-btn";
        delBtn.title = "Remove item";
        delBtn.textContent = "×";
        delBtn.setAttribute('data-id', item.id);
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeItem(item.id);
        });

        footer.appendChild(linksGroup);
        footer.appendChild(delBtn);

        details.appendChild(title);
        details.appendChild(priceRow);
        details.appendChild(footer);

        card.appendChild(img);
        card.appendChild(details);

        listDiv.appendChild(card);
    });
}

// 6. Remove item by unique ID
async function removeItem(id) {
    const { watchlist = [] } = await chrome.storage.local.get({ watchlist: [] });
    const updated = watchlist.filter(item => item.id !== id);
    await chrome.storage.local.set({ watchlist: updated });
    displayList();
    showToast("Item removed.");
}

// 7. Manual Refresh All Prices Button
refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spinning');
    showToast("Checking prices in background...");

    chrome.runtime.sendMessage({ action: "refreshAllPrices" }, (response) => {
        refreshBtn.classList.remove('spinning');
        if (response && response.success) {
            displayList();
            showToast(`Done! Checked ${response.summary.total} items (${response.summary.drops} drops).`);
        } else {
            showToast("Failed to refresh prices.");
        }
    });
});

document.addEventListener('DOMContentLoaded', init);
