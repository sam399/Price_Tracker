# 📉 Daraz BD Price Tracker (Chrome Extension)


A lightweight, privacy-focused Chrome Extension that tracks product prices on [Daraz.com.bd](https://www.daraz.com.bd) and select Bangladeshi e-commerce sites, notifying users of price drops and allowing export of your watchlist.

**Current State:**
- Fully working for Daraz BD, with support for Startech, Rokomari, and Pickaboo (basic tracking, selectors may need updates for non-Daraz sites).
- Features target price tracking, CSV export, and a simple UI for managing your watchlist.

Built with **Manifest V3** and vanilla JavaScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)


## 🚀 Key Features

* **Multi-Site Support:** Track products from Daraz.com.bd, Startech.com.bd, Rokomari.com, and Pickaboo.com.
* **One-Click Tracking:** Instantly add any supported product to your watchlist with a single click.
* **Target Price Alerts:** Set a custom target price for each product and get notified only when the price drops below your threshold (or track any drop).
* **Smart Background Checks:** Automatically checks prices every 60 minutes in the background without user intervention.
* **Anti-Bot Bypass:** Uses a "Hidden Tab" worker to scrape data reliably, bypassing anti-bot/CAPTCHA protection without external proxies.
* **Cloud Database Sync:** Automatically syncs all price data to a MongoDB cloud database for backup and cross-device access.
* **Price History Tracking:** Full price history stored in cloud database for each product—view trends and price patterns over time.
* **Export to CSV:** Download your entire watchlist as a CSV file for backup, sharing, or analysis.
* **Privacy First:** 100% Client-side extension. All data also stored securely in cloud database. No third-party tracking.
* **Simple UI:** Clean popup interface to manage, delete, and view your tracked products with current prices and target prices.
* **Clickable Notifications:** System notifications trigger immediately when a discount or your target price is detected—click to open the product page.
* **5-Second Intervals:** Smart throttling between checks to prevent browser freezing and respect server resources.

## 🛠️ Technical Architecture

This project solves the challenge of scraping dynamic Single Page Applications (SPAs) that employ anti-bot measures, while providing a user-friendly interface for price tracking with cloud database integration.

* **Manifest V3:** Uses modern service workers instead of deprecated background pages for better performance and security.
* **Dual Scraping Strategy:** First attempts to extract price data from SEO-embedded JSON-LD (`application/ld+json`), then falls back to DOM selectors for reliability.
* **Tab-Based Worker:** Instead of standard `fetch()` requests (which are often blocked by CORS or bot detection), the extension creates a temporary background tab, injects a content script to read the DOM, and closes the tab—mimicking real user behavior.
* **Chrome Storage API:** Uses `chrome.storage.local` to persist watchlist data across browser sessions for local backup.
* **Cloud Database Integration:** Node.js/Express backend syncs all price data to MongoDB Atlas for secure cloud storage and cross-device access.
* **Chrome Notifications API:** Delivers native system notifications with clickable links to product pages when price drops are detected.
* **Alarm API:** Leverages `chrome.alarms` for efficient periodic price checks that don't drain system resources.
* **Smart Throttling:** 5-second delays between item checks prevent overwhelming the browser and respect target website server limits.
* **RESTful API:** Backend provides `/api/sync` endpoint for price synchronization and `/api/history` for retrieving historical price data.

## 📦 Installation

Since this is a portfolio project (not on the Chrome Web Store), you must install it in **Developer Mode**:

1.  Clone or download this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Toggle **Developer mode** (top right corner).
4.  Click **Load unpacked**.
5.  Select the folder containing the source code.
6.  Go to [Daraz.com.bd](https://www.daraz.com.bd) or another supported site, open a product, and click the extension icon!

## 📂 Project Structure

```text
Price_Tracker/
├── manifest.json              # Extension configuration (Permissions: storage, alarms, scripting, activeTab, notifications)
├── background.js              # Service worker (Handles alarms, hidden tab logic, notifications, cloud sync)
├── content.js                 # Content script (Scrapes data from the active tab)
├── popup.html                 # Extension UI structure
├── popup.js                   # UI logic (Saving/Deleting items, CSV export, target price, cloud sync)
├── popup.css                  # Styling (Daraz color theme)
├── icon.png                   # App Icon
│
└── bd-price-server/           # Node.js Backend (Optional Cloud Sync)
    ├── server.js              # Express server with MongoDB integration
    ├── model.js               # MongoDB schemas (Product & History)
    ├── package.json           # Dependencies (express, mongoose, dotenv, cors)
    └── .env                   # Environment variables (MONGO_URI, PORT)
```

## ⚠️ Disclaimer
**Educational Purpose Only.**
This project is created for educational and portfolio purposes to demonstrate browser automation capabilities and cloud database integration. It is not affiliated with, endorsed by, or connected to Daraz or Alibaba Group.
* Users are responsible for complying with the target website's Terms of Service.
* The developer is not responsible for any misuse of this software.

## 🔌 Backend Server Setup (Optional)

To enable cloud database sync, run the included Node.js server:

```bash
cd bd-price-server
npm install
node server.js
```

**Requirements:**
- Node.js v14+
- MongoDB Atlas account (free tier available at [mongodb.com](https://www.mongodb.com))
- Update `.env` with your MongoDB connection string

**Environment variables (production-ready defaults):**

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/price-tracker
PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com,chrome-extension://your-extension-id  # empty = allow all
HISTORY_TTL_DAYS=90           # auto-delete history older than this (min 7)
HISTORY_MAX_PER_PRODUCT=120   # keep at most this many history rows per product
```

**Data retention & storage controls:**
- One history entry per product per day (deduped by date) to avoid noisy growth.
- TTL index removes entries older than `HISTORY_TTL_DAYS`.
- Per-product cap deletes oldest entries beyond `HISTORY_MAX_PER_PRODUCT`.

**What the server does:**
- Receives price data from the extension via POST `/api/sync`
- Stores products and one price history row per day in MongoDB
- Provides GET `/api/history?url=<product_url>` for historical data
- Enables price tracking across devices (sync MongoDB data to your account)