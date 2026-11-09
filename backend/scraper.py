# Scraper module for Daraz BD and other Bangladeshi ecommerce stores
import re
import json
import logging
import httpx
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache"
}

async def scrape_daraz_product(url: str) -> Optional[Dict[str, Any]]:
    """Fetch and extract product data from Daraz BD using server-side metadata."""
    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=15.0) as client:
        try:
            response = await client.get(url)
            if response.status_code != 200:
                logger.warning(f"HTTP {response.status_code} for {url}")
                return None
            html = response.text
        except Exception as e:
            logger.error(f"Network error fetching {url}: {e}")
            return None

    # Strategy 1: pdpTrackingData (Alibaba server-rendered payload)
    try:
        pdp_match = re.search(r'var\s+pdpTrackingData\s*=\s*"([\s\S]*?)";', html)
        if pdp_match:
            raw_json = pdp_match.group(1).replace(r'\"', '"').replace(r'\/', '/')
            data = json.loads(raw_json)
            price_str = data.get("pdt_price", "")
            price = float(re.sub(r"[^\d.]", "", price_str))
            
            if price > 0:
                return {
                    "title": data.get("pdt_name", "").strip(),
                    "price": price,
                    "image": data.get("pdt_photo", ""),
                    "sku": str(data.get("pdt_sku", "")),
                    "url": url,
                    "store": "daraz_bd"
                }
    except Exception as e:
        logger.debug(f"pdpTrackingData parse error: {e}")

    # Strategy 2: Schema.org ld+json
    try:
        ld_matches = re.finditer(r'<script type="application/ld\+json">([\s\S]*?)</script>', html, re.IGNORECASE)
        for match in ld_matches:
            data = json.loads(match.group(1))
            if data.get("@type") == "Product" and "offers" in data:
                offers = data["offers"]
                price_val = offers.get("price") or offers.get("lowPrice")
                if price_val:
                    images = data.get("image", [])
                    image_url = images[0] if isinstance(images, list) and images else (images if isinstance(images, str) else "")
                    return {
                        "title": data.get("name", "").strip(),
                        "price": float(price_val),
                        "image": image_url,
                        "sku": str(data.get("sku", "")),
                        "url": url,
                        "store": "daraz_bd"
                    }
    except Exception as e:
        logger.debug(f"ld+json parse error: {e}")

    # Strategy 3: Open Graph and price regex fallback
    price_match = re.search(r'"pdt_price":\s*"৳?\s*([0-9,.]+)"', html)
    if price_match:
        price = float(price_match.group(1).replace(",", ""))
        og_title = re.search(r'<meta property="og:title" content="([^"]+)"', html, re.IGNORECASE)
        og_image = re.search(r'<meta property="og:image" content="([^"]+)"', html, re.IGNORECASE)
        return {
            "title": og_title.group(1).replace(" | Daraz.com.bd", "").strip() if og_title else "Daraz Product",
            "price": price,
            "image": og_image.group(1) if og_image else "",
            "sku": "",
            "url": url,
            "store": "daraz_bd"
        }

    return None

async def scrape_product(url: str) -> Optional[Dict[str, Any]]:
    """Universal dispatcher for scraping products across different stores."""
    if "daraz.com.bd" in url:
        return await scrape_daraz_product(url)
    
    # Ready for future stores:
    # elif "startech.com.bd" in url:
    #     return await scrape_startech_product(url)
    # elif "ryans.com" in url:
    #     return await scrape_ryans_product(url)
    
    logger.warning(f"Unsupported store URL: {url}")
    return None
