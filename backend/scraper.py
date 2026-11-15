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
    """Fetch and extract live product data from Daraz BD, including flash sales & campaign discounts."""
    
    # -----------------------------------------------------------------
    # STRATEGY 1: Daraz Catalog AJAX API (Matches live campaign/flash sale price)
    # -----------------------------------------------------------------
    id_match = re.search(r'-i(\d+)', url)
    if id_match:
        item_id = id_match.group(1)
        api_url = f"https://www.daraz.com.bd/catalog/?ajax=true&q={item_id}"
        async with httpx.AsyncClient(headers=HEADERS, timeout=12.0) as client:
            try:
                api_res = await client.get(api_url)
                if api_res.status_code == 200:
                    json_data = api_res.json()
                    items = json_data.get("mods", {}).get("listItems", [])
                    matched = next((i for i in items if str(i.get("itemId") or i.get("nid")) == str(item_id)), None)
                    if not matched and items:
                        matched = items[0]

                    if matched and matched.get("price"):
                        price_num = float(re.sub(r"[^\d.]", "", str(matched["price"])))
                        orig_num = float(re.sub(r"[^\d.]", "", str(matched.get("originalPrice", "")))) if matched.get("originalPrice") else price_num
                        img_url = matched.get("image", "")
                        if img_url.startswith("//"):
                            img_url = "https:" + img_url

                        if price_num > 0:
                            return {
                                "title": matched.get("name", "").strip(),
                                "price": price_num,
                                "original_price": orig_num if orig_num > price_num else price_num,
                                "image": img_url,
                                "sku": str(matched.get("skuId") or item_id),
                                "url": url,
                                "store": "daraz_bd"
                            }
            except Exception as e:
                logger.debug(f"Catalog AJAX API failed for {item_id}: {e}")

    # -----------------------------------------------------------------
    # STRATEGY 2: Server-rendered HTML fallback
    # -----------------------------------------------------------------
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

    # Strategy 2A: pdpTrackingData
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

    # Strategy 2B: Schema.org ld+json
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

    return None

async def scrape_product(url: str) -> Optional[Dict[str, Any]]:
    """Universal dispatcher for scraping products across different stores."""
    if "daraz.com.bd" in url:
        return await scrape_daraz_product(url)
    
    logger.warning(f"Unsupported store URL: {url}")
    return None
