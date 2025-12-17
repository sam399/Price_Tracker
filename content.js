// Function to clean price string (e.g., "৳ 1,500" -> 1500)
function parsePrice(priceText) {
    if (!priceText) return 0;
    // Remove "৳", commas, and spaces
    return parseFloat(priceText.replace(/[^\d.]/g, ''));
}

// Listens for messages from the Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getProductDetails") {
        
        // SELECTORS: These are the HTML classes Daraz uses. 
        // IMPORTANT: If Daraz updates their site, you only need to fix these lines.
        const titleEl = document.querySelector('.pdp-mod-product-badge-title') || document.querySelector('h1');
        const priceEl = document.querySelector('.pdp-price_type_normal') || document.querySelector('.pdp-price');

        if (titleEl && priceEl) {
            const product = {
                title: titleEl.innerText,
                price: parsePrice(priceEl.innerText),
                url: window.location.href,
                date: new Date().toLocaleDateString()
            };
            sendResponse(product);
        } else {
            sendResponse({ error: "Could not find product info. Check selectors." });
        }
    }
});