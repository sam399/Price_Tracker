// BD Price Tracker - Content Script (runs inside active Daraz product page)

function parsePrice(priceText) {
    if (!priceText) return 0;
    // Extract first valid numeric amount (handles "৳ 177", "৳ 1,490", "Tk. 250", "239")
    const match = priceText.match(/(?:৳|Tk\.?|BDT)?\s*([\d,]+(?:\.\d+)?)/i);
    if (match && match[1]) {
        return parseFloat(match[1].replace(/,/g, '')) || 0;
    }
    return parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
}

function getCleanUrl() {
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink && canonicalLink.href) {
        return canonicalLink.href;
    }
    return window.location.origin + window.location.pathname;
}

function extractProductDetails() {
    // -------------------------------------------------------------
    // STRATEGY 1 (HIGHEST PRIORITY): Live Visual DOM Price
    // Handles Flash Sales, 11.11 campaigns, and user-selected variants!
    // -------------------------------------------------------------
    let livePrice = 0;
    let originalPrice = 0;

    const priceContainer = document.querySelector('.pdp-mod-product-price') || 
                           document.querySelector('.pdp-product-price') || 
                           document.querySelector('#module_product_price_1');

    if (priceContainer) {
        // Active selling price element (explicitly avoid deleted/strikethrough classes)
        const activePriceEl = priceContainer.querySelector('.pdp-price_type_normal') ||
                              priceContainer.querySelector('.pdp-price_color_orange') ||
                              priceContainer.querySelector('.pdp-price_size_xl') ||
                              priceContainer.querySelector('.pdp-v-price') ||
                              priceContainer.querySelector('.pdp-price:not(.pdp-price_type_deleted)') ||
                              priceContainer.querySelector('span:not(.pdp-price_type_deleted)');

        if (activePriceEl) {
            livePrice = parsePrice(activePriceEl.innerText);
        }

        // Strikethrough / Original price element if discounted
        const deletedPriceEl = priceContainer.querySelector('.pdp-price_type_deleted') ||
                               priceContainer.querySelector('.origin-price-value') ||
                               priceContainer.querySelector('.pdp-mod-product-price-origin') ||
                               priceContainer.querySelector('.origin-block') ||
                               priceContainer.querySelector('del');

        if (deletedPriceEl) {
            originalPrice = parsePrice(deletedPriceEl.innerText);
        }
    }

    // Fallback: Generic visual price selector
    if (!livePrice) {
        const anyPriceEl = document.querySelector('.pdp-price_color_orange') ||
                           document.querySelector('.pdp-price_size_xl') ||
                           document.querySelector('.pdp-price_type_normal') ||
                           document.querySelector('.pdp-price');
        if (anyPriceEl) {
            livePrice = parsePrice(anyPriceEl.innerText);
        }
    }

    // Product Title
    const titleEl = document.querySelector('.pdp-mod-product-badge-title') || 
                    document.querySelector('.pdp-product-title') || 
                    document.querySelector('h1');

    // Product Image
    const imgEl = document.querySelector('.gallery-preview-panel__image') || 
                  document.querySelector('.pdp-mod-common-image') ||
                  document.querySelector('meta[property="og:image"]');

    const title = titleEl ? titleEl.innerText.trim() : document.title.replace(/\|.*$/, '').trim();
    const imageUrl = imgEl ? (imgEl.src || imgEl.getAttribute('content') || '') : '';
    const cleanUrl = getCleanUrl();
    const idMatch = cleanUrl.match(/-i(\d+)/);
    const productId = idMatch ? ('daraz_' + idMatch[1]) : ('daraz_' + Date.now());

    // -------------------------------------------------------------
    // STRATEGY 2 (FALLBACK ONLY): Check script metadata if DOM had no price
    // -------------------------------------------------------------
    if (!livePrice) {
        try {
            const pdpMatch = document.documentElement.innerHTML.match(/var\s+pdpTrackingData\s*=\s*"([\s\S]*?)";/);
            if (pdpMatch) {
                const data = JSON.parse(pdpMatch[1].replace(/\\"/g, '"').replace(/\\\//g, '/'));
                livePrice = parsePrice(data.pdt_price);
            }
        } catch (e) {}
    }

    if (!livePrice) {
        try {
            const jsonEl = document.querySelector('script[type="application/ld+json"]');
            if (jsonEl) {
                const data = JSON.parse(jsonEl.innerText);
                if (data['@type'] === 'Product' && data.offers) {
                    livePrice = parseFloat(data.offers.price || data.offers.lowPrice || 0);
                }
            }
        } catch (e) {}
    }

    if (livePrice > 0) {
        return {
            id: productId,
            title: title,
            price: livePrice,
            initialPrice: originalPrice > livePrice ? originalPrice : livePrice,
            image: imageUrl,
            url: cleanUrl
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
