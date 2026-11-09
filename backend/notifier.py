# Free notifications via Telegram Bot API (100% free, unlimited, instant push alerts)
import os
import logging
import httpx
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

async def send_telegram_alert(
    chat_id: str,
    title: str,
    old_price: float,
    new_price: float,
    url: str,
    image_url: Optional[str] = None
) -> bool:
    """Send a rich formatted price drop notification directly to user's Telegram."""
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        logger.warning("TELEGRAM_BOT_TOKEN not configured. Skipping alert.")
        return False

    drop_amount = old_price - new_price
    percent = round((drop_amount / old_price) * 100) if old_price > 0 else 0

    caption = (
        f"🔥 *PRICE DROP ALERT!*\n\n"
        f"📦 *{title[:70]}*\n"
        f"💰 *Price:* ~৳{old_price:,.0f}~ ➔ *৳{new_price:,.0f}*\n"
        f"📉 *You Save:* ৳{drop_amount:,.0f} (-{percent}%)\n\n"
        f"🛒 [Click to Buy on Daraz]({url})"
    )

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # If image is available, send photo with caption
            if image_url and image_url.startswith("http"):
                endpoint = f"https://api.telegram.org/bot{bot_token}/sendPhoto"
                payload = {
                    "chat_id": chat_id,
                    "photo": image_url,
                    "caption": caption,
                    "parse_mode": "Markdown"
                }
            else:
                endpoint = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                payload = {
                    "chat_id": chat_id,
                    "text": caption,
                    "parse_mode": "Markdown",
                    "disable_web_page_preview": False
                }

            res = await client.post(endpoint, json=payload)
            if res.status_code == 200:
                logger.info(f"✅ Telegram alert sent to chat {chat_id}")
                return True
            else:
                logger.error(f"Telegram API error {res.status_code}: {res.text}")
                return False
        except Exception as e:
            logger.error(f"Failed to send Telegram alert: {e}")
            return False

async def notify_subscribers(
    subscribers: List[Dict[str, Any]],
    title: str,
    old_price: float,
    new_price: float,
    url: str,
    image_url: Optional[str] = None
):
    """Notify all subscribed Telegram users if the new price meets their threshold."""
    for sub in subscribers:
        chat_id = sub.get("chat_id")
        target_price = sub.get("target_price")

        if not chat_id:
            continue

        # If user set a target price, only notify if new price is below or equal to target
        if target_price and new_price > float(target_price):
            logger.info(f"Price ৳{new_price} is above user's target ৳{target_price}. Skipping.")
            continue

        await send_telegram_alert(
            chat_id=chat_id,
            title=title,
            old_price=old_price,
            new_price=new_price,
            url=url,
            image_url=image_url
        )
