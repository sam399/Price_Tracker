# 📉 Daraz BD Price Tracker (Chrome Extension)

A lightweight, privacy-focused Chrome Extension that tracks product prices on [Daraz.com.bd](https://www.daraz.com.bd) and notifies users of price drops. 

Built with **Manifest V3** and vanilla JavaScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## 🚀 Key Features

* **One-Click Tracking:** Instantly add any Daraz product to your watchlist.
* **Smart Background Checks:** Automatically checks prices every 60 minutes.
* **Anti-Bot Bypass:** Uses a "Hidden Tab" worker to scrape data reliably, bypassing Daraz's strict anti-bot/CAPTCHA protection without needing external proxies.
* **Privacy First:** 100% Client-side. No external servers or databases. All data is stored in the user's browser (`chrome.storage.local`).
* **Price Drop Alerts:** System notifications trigger immediately when a discount is detected.

## 🛠️ Technical Architecture

This project solves the challenge of scraping dynamic Single Page Applications (SPAs) that employ anti-bot measures.

* **Manifest V3:** Uses modern service workers instead of background pages.
* **DOM Scraping:** Extracts price data from SEO-embedded JSON (`application/ld+json`) for maximum reliability.
* **Tab-Based Worker:** Instead of standard `fetch()` requests (which are often blocked by CORS or Bot detection), the extension creates a temporary background tab, injects a content script to read the DOM, and closes the tab—mimicking real user behavior.

## 📦 Installation

Since this is a portfolio project (not on the Chrome Web Store), you must install it in **Developer Mode**:

1.  Clone or download this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Toggle **Developer mode** (top right corner).
4.  Click **Load unpacked**.
5.  Select the folder containing the source code.
6.  Go to [Daraz.com.bd](https://www.daraz.com.bd), open a product, and click the extension icon!

## 📂 Project Structure

```text
├── manifest.json      # Extension configuration (Permissions: storage, alarms, scripting)
├── background.js      # Service worker (Handles alarms & hidden tab logic)
├── content.js         # Content script (Scrapes data from the active tab)
├── popup.html         # Extension UI structure
├── popup.js           # UI logic (Saving/Deleting items)
├── popup.css          # Styling (Daraz color theme)
└── icon.png           # App Icon

⚠️ Disclaimer
Educational Purpose Only. This project is created for educational and portfolio purposes to demonstrate browser automation capabilities. It is not affiliated with, endorsed by, or connected to Daraz or Alibaba Group.

Users are responsible for complying with the target website's Terms of Service.

The developer is not responsible for any misuse of this software.