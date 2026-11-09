# BD Price Tracker - FastAPI Cloud Backend
import os
import asyncio
import logging
from typing import Optional, List
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, HttpUrl

from .database import db
from .scraper import scrape_product
from .notifier import notify_subscribers

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB connection on startup
    try:
        db.connect()
    except Exception as e:
        logger.warning(f"Initial MongoDB connection failed. Will retry on request: {e}")
    yield
    if db.client:
        db.client.close()

app = FastAPI(
    title="BD Price Tracker API",
    description="24/7 Cloud backend for tracking prices on Daraz BD with Telegram alerts and price history.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS so browser extension and web dashboards can communicate with API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class TrackRequest(BaseModel):
    url: str
    target_price: Optional[float] = None
    telegram_chat_id: Optional[str] = None

# Routes
@app.get("/")
def root():
    return {
        "status": "online",
        "service": "BD Price Tracker Cloud Backend",
        "database_connected": db.is_healthy(),
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    db_healthy = db.is_healthy()
    return {
        "status": "healthy" if db_healthy else "degraded",
        "mongodb": "connected" if db_healthy else "disconnected"
    }

@app.post("/api/track")
async def track_product(payload: TrackRequest):
    """Register a new product to track or subscribe to an existing one."""
    url = str(payload.url)
    
    # 1. Scrape current data from store
    scraped = await scrape_product(url)
    if not scraped or scraped.get("price", 0) <= 0:
        raise HTTPException(
            status_code=400,
            detail="Could not scrape product. Verify the URL is a valid product page on Daraz BD."
        )

    # 2. Save or update in MongoDB Atlas
    try:
        product = db.get_or_create_product(
            product_data=scraped,
            chat_id=payload.telegram_chat_id,
            target_price=payload.target_price
        )
        return {
            "success": True,
            "message": "Product is now tracked 24/7!",
            "product": {
                "id": str(product.get("_id") or product.get("id")),
                "title": product["title"],
                "price": product["current_price"],
                "image": product["image"],
                "url": product["url"]
            }
        }
    except Exception as e:
        logger.error(f"Database error during track: {e}")
        raise HTTPException(status_code=500, detail="Database error. Check MongoDB connection.")

@app.get("/api/products")
def list_products():
    """Retrieve all tracked products with current prices and lowest prices."""
    try:
        return db.get_all_products()
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve products from database.")

@app.get("/api/products/{product_id}/history")
def get_price_history(product_id: str):
    """Retrieve price history data points for graphing (Keepa / CamelCamelCamel style)."""
    product = db.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return {
        "id": product["id"],
        "title": product["title"],
        "current_price": product["current_price"],
        "lowest_price": product.get("lowest_price", product["current_price"]),
        "highest_price": product.get("highest_price", product["current_price"]),
        "history": product.get("price_history", [])
    }

@app.get("/api/products/{product_id}/chart", response_class=HTMLResponse)
def render_price_chart(product_id: str):
    """Interactive Keepa-style Price History Graph in HTML using Chart.js."""
    product = db.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    history = product.get("price_history", [])
    labels = [h.get("timestamp", "")[:10] for h in history]
    prices = [h.get("price", 0) for h in history]

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{product['title']} - Price History</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; padding: 20px; }}
            .container {{ max-width: 800px; margin: 0 auto; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }}
            .header {{ display: flex; gap: 16px; align-items: center; margin-bottom: 20px; }}
            .thumb {{ width: 80px; height: 80px; object-fit: cover; border-radius: 8px; }}
            .stats {{ display: flex; gap: 20px; margin-bottom: 20px; padding: 12px; background: #fff3ed; border-radius: 8px; }}
            .stat-box strong {{ display: block; font-size: 11px; color: #666; text-transform: uppercase; }}
            .stat-box span {{ font-size: 18px; font-weight: bold; color: #f85606; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="{product.get('image', '')}" class="thumb" onerror="this.style.display='none'">
                <div>
                    <h2>{product['title']}</h2>
                    <a href="{product['url']}" target="_blank" style="color: #007bff; text-decoration: none;">View on Daraz ↗</a>
                </div>
            </div>
            <div class="stats">
                <div class="stat-box"><strong>Current</strong><span>৳{product['current_price']:,}</span></div>
                <div class="stat-box"><strong>Lowest</strong><span>৳{product.get('lowest_price', product['current_price']):,}</span></div>
                <div class="stat-box"><strong>Highest</strong><span>৳{product.get('highest_price', product['current_price']):,}</span></div>
            </div>
            <canvas id="priceChart" width="400" height="200"></canvas>
        </div>
        <script>
            const ctx = document.getElementById('priceChart').getContext('2d');
            new Chart(ctx, {{
                type: 'line',
                data: {{
                    labels: {labels},
                    datasets: [{{
                        label: 'Price (BDT ৳)',
                        data: {prices},
                        borderColor: '#f85606',
                        backgroundColor: 'rgba(248, 86, 6, 0.1)',
                        fill: true,
                        tension: 0.2,
                        pointRadius: 5
                    }}]
                }},
                options: {{
                    responsive: true,
                    scales: {{
                        y: {{ beginAtZero: false, ticks: {{ callback: value => '৳' + value }} }}
                    }}
                }}
            }});
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.post("/api/cron/check-prices")
async def scheduled_price_check(background_tasks: BackgroundTasks):
    """Triggered every 4-6 hours by external cron (cron-job.org or GitHub Actions)."""
    logger.info("⏰ Starting scheduled 24/7 price check...")
    products = db.get_all_products()
    
    if not products:
        return {"status": "ok", "message": "No products in database."}

    results = {"total": len(products), "updated": 0, "drops": 0, "alerts_sent": 0}

    for prod in products:
        try:
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

                if update_res.get("old_price") != new_price:
                    results["updated"] += 1

                if update_res.get("dropped"):
                    results["drops"] += 1
                    # Dispatch Telegram notifications to subscribers
                    subscribers = update_res.get("subscribers", [])
                    if subscribers:
                        background_tasks.add_task(
                            notify_subscribers,
                            subscribers=subscribers,
                            title=prod["title"],
                            old_price=update_res["old_price"],
                            new_price=new_price,
                            url=prod["url"],
                            image_url=prod.get("image")
                        )
                        results["alerts_sent"] += len(subscribers)

            # Polite 1.5s delay between store requests
            await asyncio.sleep(1.5)
        except Exception as e:
            logger.error(f"Error checking product {prod.get('title')}: {e}")

    logger.info(f"✅ Price check finished: {results}")
    return {"status": "success", "results": results}
