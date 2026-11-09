// BD Price Tracker - Content Script (runs inside active Daraz product page)

function parsePrice(priceText) {
    if (!priceText) return 0;
    return parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
}

function getCleanUrl() {
    // Return canonical link or origin + pathname without marketing ?spm=... tags
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink && canonicalLink.href) {
        return canonicalLink.href;
    }
    return window.location.origin + window.location.pathname;
}

function extractProductDetails() {
    // 1. Try ld+json first
    try {
        const jsonEl = document.querySelector('script[type="application/ld+json"]');
        if (jsonEl) {
            const data = JSON.parse(jsonEl.innerText);
            if (data['@type'] === 'Product') {
                const title = data.name || document.title;
                const price = data.offers ? parseFloat(data.offers.price || data.offers.lowPrice || 0) : 0;
                const image = Array.isArray(data.image) ? data.image[0] : (data.image || '');
                if (title && price > 0) {
                    return {
                        id: 'daraz_' + (data.sku || Date.now()),
                        title: title.trim(),
                        price: price,
                        image: image,
                        url: getCleanUrl()
                    };
                }
            }
        }
    } catch (e) {
        // Fallback to DOM elements below
    }

    // 2. DOM selectors fallback
    const titleEl = document.querySelector('.pdp-mod-product-badge-title') || 
                    document.querySelector('.pdp-product-title') || 
                    document.querySelector('h1');

    const priceEl = document.querySelector('.pdp-price_type_normal') || 
                    document.querySelector('.pdp-price') ||
                    document.querySelector('.pdp-v-price');

    const imgEl = document.querySelector('.gallery-preview-panel__image') || 
                  document.querySelector('.pdp-mod-common-image') ||
                  document.querySelector('meta[property="og:image"]');

    if (titleEl && priceEl) {
        const rawPrice = parsePrice(priceEl.innerText);
        const imageUrl = imgEl ? (imgEl.src || imgEl.getAttribute('content') || '') : '';
        
        return {
            id: 'daraz_' + Date.now(),
            title: titleEl.innerText.trim(),
            price: rawPrice,
            image: imageUrl,
            url: getCleanUrl()
        };
    }

    return null;
}

// Listen for messages from the extension popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getProductDetails") {
        const product = extractProductDetails();
        if (product && product.price > 0) {
            sendResponse({ success: true, product: product });
        } else {
            sendResponse({ 
                success: false, 
                error: "Could not detect product price on this page. Please ensure the page has loaded completely." 
            });
        }
    }
    return true;
});
