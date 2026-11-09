# 📉 BD Price Tracker (Edge & Chrome Extension)

A lightweight, privacy-focused browser extension that tracks product prices on [Daraz.com.bd](https://www.daraz.com.bd) and sends instant desktop notifications when prices drop.

Built with **Manifest V3**, modern JavaScript, and clean store packaging for Microsoft Edge Add-ons and Google Chrome Web Store.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.1-green.svg)
![Platform](https://img.shields.io/badge/platform-Edge%20%7C%20Chrome-orange.svg)

---

## 🚀 Key Features

* **One-Click Tracking:** Automatically detects Daraz product pages and extracts title, price, and thumbnail image.
* **Silent Background Price Checks:** Performs periodic background checks without opening distracting tabs or disrupting user browsing.
* **Instant Price Drop Alerts:** Desktop notifications with product thumbnail and percentage discount when prices fall.
* **Price History & Drop Badges:** Visual indicators showing original price, current price, and percentage saved.
* **Duplicate Prevention:** Strips tracking parameters (`?spm=...`) to ensure canonical product matching.
* **Privacy First:** 100% client-side storage (`chrome.storage.local`). Zero external tracking or telemetry.
* **Security Hardened:** XSS-safe DOM rendering compliant with Microsoft Store and Chrome Web Store policies.

---

## 🛠️ Technical Architecture

* **Manifest V3:** Adheres strictly to MV3 service worker lifecycle constraints.
* **Server-Side Data Extraction:** Extracts data directly from Daraz's server-rendered `pdpTrackingData` and Schema.org `application/ld+json`.
* **Standard Multi-Resolution Icons:** 16px, 32px, 48px, and 128px icons included for complete store compatibility.

---

## 📦 Store Packaging Instructions (Microsoft Edge Add-ons)

To avoid rejection code **1.3 Product is Testable ("Failed to install")**:

1. Select **the files inside this folder directly** (do NOT zip the parent folder itself):
   * `manifest.json`
   * `background.js`
   * `content.js`
   * `popup.html`
   * `popup.css`
   * `popup.js`
   * `icons/` (directory containing icon16, icon32, icon48, icon128)
2. Right-click the selected files ➔ **Send to ➔ Compressed (zipped) folder** (or use 7-Zip).
3. Verify that opening the zip shows `manifest.json` right at the root level, NOT inside a subfolder.
4. Upload to **Microsoft Partner Center** under your Extension submission.

---

## 💻 Local Testing (Developer Mode)

1. Open Microsoft Edge (`edge://extensions`) or Google Chrome (`chrome://extensions`).
2. Turn on **Developer mode** (toggle in the left or top-right menu).
3. Click **Load unpacked**.
4. Select this directory (`BD Price Tracker`).
5. Open any product on [Daraz Bangladesh](https://www.daraz.com.bd), open the extension popup, and click **+ Track This Product**!
