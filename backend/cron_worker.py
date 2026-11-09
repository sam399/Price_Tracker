# Standalone Cron Worker: Runs independently without a web server
# Ideal for GitHub Actions (2,000 free minutes/mo) or a local cron job
import os
import asyncio
import logging
from .database import db
from .scraper import scrape_product
from .notifier import notify_subscribers

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("cron_worker")

async def run_worker():
    logger.info(" Starting standalone 24/7 price check...")
    try:
        db.connect()
    except Exception as e:
        logger.error(f"Cannot connect to database: {e}")
        return

    products = db.get_all_products()
    if not products:
        logger.info("No products currently in watchlist.")
        return

    logger.info(f"Checking {len(products)} products...")

    for prod in products:
        try:
            logger.info(f"Checking: {prod['title'][:30]}...")
            scraped = await scrape_product(prod["url"])
            if scraped and scraped.get("price", 0) > 0:
                new_price = scraped["price"]
                product_object_id = db.db.products.find_one({"url_clean": prod["url_clean"]})["_id"]

                update_res = db.update_product_price(
                    product_id=product_object_id,
                    new_price=new_price,
                    new_title=scraped.get("title"),
                    new_image=scraped.get("image")
                )

                if update_res.get("dropped"):
                    logger.info(f"🔥 Price dropped for {prod['title']}! {update_res['old_price']} -> {new_price}")
                    subscribers = update_res.get("subscribers", [])
                    await notify_subscribers(
                        subscribers=subscribers,
                        title=prod["title"],
                        old_price=update_res["old_price"],
                        new_price=new_price,
                        url=prod["url"],
                        image_url=prod.get("image")
                    )
            await asyncio.sleep(1.5)
        except Exception as e:
            logger.error(f"Error checking {prod.get('title')}: {e}")

    logger.info("✅ Finished 24/7 price check cycle.")

if __name__ == "__main__":
    asyncio.run(run_worker())
