# 📉 Daraz BD Price Tracker (Chrome Extension)


A lightweight, privacy-focused Chrome Extension that tracks product prices on [Daraz.com.bd](https://www.daraz.com.bd) and select Bangladeshi e-commerce sites, notifying users of price drops and allowing export of your watchlist.

**Current State:**
- Fully working for Daraz BD, with support for Startech, Rokomari, and Pickaboo (basic tracking, selectors may need updates for non-Daraz sites).
- Features target price tracking, CSV export, and a simple UI for managing your watchlist.

Built with **Manifest V3** and vanilla JavaScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)


## 🚀 Key Features

* **One-Click Tracking:** Instantly add any supported product to your watchlist from Daraz, Startech, Rokomari, or Pickaboo.
* **Target Price Alerts:** Set a target price for each product and get notified when the price drops below your threshold (or any drop).
* **Smart Background Checks:** Automatically checks prices every 60 minutes in the background.
* **Anti-Bot Bypass:** Uses a "Hidden Tab" worker to scrape data reliably, bypassing anti-bot/CAPTCHA protection without external proxies.
* **Export to CSV:** Download your entire watchlist as a CSV file for backup or analysis.
* **Privacy First:** 100% Client-side. No external servers or databases. All data is stored in the user's browser (`chrome.storage.local`).
* **Simple UI:** Manage, delete, and view your tracked products easily from the popup.
* **Price Drop Alerts:** System notifications trigger immediately when a discount or your target price is detected.

## 🛠️ Technical Architecture


This project solves the challenge of scraping dynamic Single Page Applications (SPAs) that employ anti-bot measures.

* **Manifest V3:** Uses modern service workers instead of background pages.
* **DOM Scraping:** Extracts price data from the DOM (selectors may need updates if sites change their layout).
* **Tab-Based Worker:** Instead of standard `fetch()` requests (which are often blocked by CORS or Bot detection), the extension creates a temporary background tab, injects a content script to read the DOM, and closes the tab—mimicking real user behavior.

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

├── manifest.json      # Extension configuration (Permissions: storage, alarms, scripting, activeTab)
├── background.js      # Service worker (Handles alarms & hidden tab logic)
├── content.js         # Content script (Scrapes data from the active tab)
├── popup.html         # Extension UI structure
├── popup.js           # UI logic (Saving/Deleting items, export, target price)
├── popup.css          # Styling (Daraz color theme)
└── icon.png           # App Icon

## ⚠️ Disclaimer
**Educational Purpose Only.**
This project is created for educational and portfolio purposes to demonstrate browser automation capabilities. It is not affiliated with, endorsed by, or connected to Daraz or Alibaba Group.
* Users are responsible for complying with the target website's Terms of Service.
* The developer is not responsible for any misuse of this software.