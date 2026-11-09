# Database connection & models for MongoDB Atlas
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pymongo import MongoClient, ASCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None

    def connect(self):
        """Connect to MongoDB Atlas with connection pooling and retry logic."""
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        db_name = os.getenv("MONGODB_DB_NAME", "bd_price_tracker")
        
        try:
            # maxPoolSize ensures we stay well within Atlas M0 limit (500 connections)
            # serverSelectionTimeoutMS prevents requests from hanging if IP is not whitelisted
            self.client = MongoClient(
                mongo_uri,
                maxPoolSize=10,
                minPoolSize=1,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            self.db = self.client[db_name]
            
            # Quick ping to verify network connectivity
            self.client.admin.command('ping')
            logger.info(" Connected successfully to MongoDB Atlas!")
            
            # Create indexes for fast lookup
            self.db.products.create_index([("url_clean", ASCENDING)], unique=True)
            self.db.products.create_index([("last_checked", ASCENDING)])
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            logger.error("Tip: In MongoDB Atlas, verify 'Network Access' has '0.0.0.0/0' whitelisted!")
            raise e

    def is_healthy(self) -> bool:
        if not self.client:
            return False
        try:
            self.client.admin.command('ping')
            return True
        except Exception:
            return False

    def get_or_create_product(self, product_data: Dict[str, Any], chat_id: Optional[str] = None, target_price: Optional[float] = None) -> Dict[str, Any]:
        """Insert a newly tracked product or attach a new subscriber if it already exists."""
        clean_url = product_data["url"].split("?")[0]
        now = datetime.now(timezone.utc).isoformat()
        
        existing = self.db.products.find_one({"url_clean": clean_url})
        
        if existing:
            # If product already tracked, update subscriber list
            if chat_id:
                subscribers = existing.get("subscribers", [])
                # Avoid duplicate subscriptions from same chat
                if not any(sub.get("chat_id") == str(chat_id) for sub in subscribers):
                    self.db.products.update_one(
                        {"_id": existing["_id"]},
                        {"$push": {"subscribers": {"chat_id": str(chat_id), "target_price": target_price}}}
                    )
            return self.db.products.find_one({"_id": existing["_id"]})

        # New product record
        new_doc = {
            "title": product_data["title"],
            "url": product_data["url"],
            "url_clean": clean_url,
            "image": product_data.get("image", ""),
            "sku": product_data.get("sku", ""),
            "store": "daraz_bd",
            "current_price": product_data["price"],
            "initial_price": product_data["price"],
            "lowest_price": product_data["price"],
            "highest_price": product_data["price"],
            "created_at": now,
            "last_checked": now,
            "price_history": [
                {"price": product_data["price"], "timestamp": now}
            ],
            "subscribers": [{"chat_id": str(chat_id), "target_price": target_price}] if chat_id else []
        }
        
        res = self.db.products.insert_one(new_doc)
        new_doc["_id"] = res.inserted_id
        return new_doc

    def get_all_products(self) -> List[Dict[str, Any]]:
        cursor = self.db.products.find().sort("last_checked", -1)
        products = []
        for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            products.append(doc)
        return products

    def get_product_by_id(self, product_id: str) -> Optional[Dict[str, Any]]:
        from bson import ObjectId
        try:
            doc = self.db.products.find_one({"_id": ObjectId(product_id)})
            if doc:
                doc["id"] = str(doc.pop("_id"))
            return doc
        except Exception:
            return None

    def update_product_price(self, product_id: Any, new_price: float, new_title: Optional[str] = None, new_image: Optional[str] = None) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        product = self.db.products.find_one({"_id": product_id})
        if not product:
            return {}

        old_price = product.get("current_price", new_price)
        lowest_price = min(product.get("lowest_price", new_price), new_price)
        highest_price = max(product.get("highest_price", new_price), new_price)

        update_fields = {
            "current_price": new_price,
            "lowest_price": lowest_price,
            "highest_price": highest_price,
            "last_checked": now
        }
        if new_title:
            update_fields["title"] = new_title
        if new_image and not product.get("image"):
            update_fields["image"] = new_image

        update_query = {"$set": update_fields}

        # If price changed, push to history
        if new_price != old_price:
            update_query["$push"] = {"price_history": {"price": new_price, "timestamp": now}}

        self.db.products.update_one({"_id": product_id}, update_query)
        return {
            "old_price": old_price,
            "new_price": new_price,
            "dropped": new_price < old_price,
            "subscribers": product.get("subscribers", [])
        }

db = Database()
