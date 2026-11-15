import os
import subprocess

OUT_DIR = os.path.abspath("store_assets")
EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

# Base CSS styles common to all promotional banners
COMMON_HEAD = """
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1280px;
      height: 800px;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: radial-gradient(circle at 85% 15%, #0d2850 0%, #061024 55%, #030814 100%);
      color: #ffffff;
      position: relative;
    }
    /* Subtle decorative background grids and glows */
    .bg-glow-1 {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(248, 86, 6, 0.15) 0%, rgba(248, 86, 6, 0) 70%);
      top: -150px;
      right: 100px;
      pointer-events: none;
    }
    .bg-glow-2 {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(0, 230, 118, 0.12) 0%, rgba(0, 230, 118, 0) 70%);
      bottom: -100px;
      left: 300px;
      pointer-events: none;
    }
    .grid-lines {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }
    /* Left info panel */
    .content-container {
      position: relative;
      z-index: 10;
      width: 1280px;
      height: 800px;
      padding: 60px 70px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .left-col {
      width: 480px;
      display: flex;
      flex-direction: column;
    }
    .pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #00e676;
      width: fit-content;
      margin-bottom: 22px;
    }
    .main-title {
      font-size: 44px;
      line-height: 1.15;
      font-weight: 800;
      letter-spacing: -1px;
      margin-bottom: 18px;
    }
    .accent-green { color: #00e676; }
    .accent-orange { color: #f85606; }
    .subtitle {
      font-size: 16px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 30px;
    }
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 40px;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 15px;
      font-weight: 500;
      color: #e2e8f0;
    }
    .check-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(0, 230, 118, 0.2);
      color: #00e676;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      flex-shrink: 0;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #64748b;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .footer-brand span {
      color: #f85606;
      font-weight: 800;
    }
    /* Right visuals mockup area */
    .right-col {
      width: 620px;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
"""

# -------------------------------------------------------------
# IMAGE 1: "Is it a real deal? Know before you buy."
# -------------------------------------------------------------
html_promo_1 = f"""<!DOCTYPE html>
<html>
{COMMON_HEAD}
<body>
  <div class="grid-lines"></div>
  <div class="bg-glow-1"></div>
  <div class="bg-glow-2"></div>
  <div class="content-container">
    <div class="left-col">
      <div class="pill-badge">ON DARAZ.COM.BD</div>
      <h1 class="main-title">Is it a <span class="accent-green">real deal?</span><br>Know before you buy.</h1>
      <p class="subtitle">Don't get tricked by fake discounts. BD Price Tracker reveals the true selling price, active 11.11 campaign rates, and verified savings.</p>
      
      <div class="features-list">
        <div class="feature-item">
          <div class="check-icon">✓</div>
          <span>Spots genuine Flash Sale & 11.11 deals</span>
        </div>
        <div class="feature-item">
          <div class="check-icon">✓</div>
          <span>Fake MRPs caught: see the real discount</span>
        </div>
        <div class="feature-item">
          <div class="check-icon">✓</div>
          <span>100% Free, and works without an account</span>
        </div>
      </div>

      <div class="footer-brand">
        🛍️ <span>BD PRICE TRACKER</span> &nbsp;|&nbsp; DARAZ BANGLADESH
      </div>
    </div>

    <div class="right-col">
      <!-- Browser window mockup -->
      <div style="width: 580px; background: #ffffff; border-radius: 14px; box-shadow: 0 25px 60px rgba(0,0,0,0.55); overflow: hidden; border: 1px solid rgba(255,255,255,0.15);">
        <!-- Title bar -->
        <div style="background: #edf2f7; padding: 10px 14px; display: flex; align-items: center; gap: 14px; border-bottom: 1px solid #e2e8f0;">
          <div style="display:flex; gap:6px;">
            <div style="width:10px; height:10px; border-radius:50%; background:#ff5f56;"></div>
            <div style="width:10px; height:10px; border-radius:50%; background:#ffbd2e;"></div>
            <div style="width:10px; height:10px; border-radius:50%; background:#27c93f;"></div>
          </div>
          <div style="background:#ffffff; border-radius:6px; padding:3px 12px; font-size:11px; color:#718096; flex:1; text-align:center; font-family:'JetBrains Mono', monospace;">
            daraz.com.bd/products/supercare-face-wash-bogo.html
          </div>
        </div>

        <!-- Product page content preview -->
        <div style="padding: 22px; color: #2d3748; display:flex; gap: 20px;">
          <!-- Product image -->
          <div style="width: 170px; height: 170px; background: #f8fafc; border-radius: 10px; display:flex; align-items:center; justify-content:center; border: 1px solid #e2e8f0; position:relative; overflow:hidden;">
            <img src="https://bd-live-21.slatic.net/kf/Sda97481c94414bf0bef0a81e560010a5c.jpg" style="width:100%; height:100%; object-fit:cover;">
            <div style="position:absolute; top:8px; left:8px; background:#f85606; color:white; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px;">BUY 1 GET 1</div>
          </div>

          <!-- Product Details -->
          <div style="flex:1;">
            <div style="font-size: 16px; font-weight: 700; color: #1a202c; line-height: 1.3; margin-bottom: 8px;">
              SuperCare Oil Control Face Wash (BOGO)
            </div>
            <div style="font-size: 11px; color: #718096; margin-bottom: 14px;">Brand: SUPER CARE &nbsp;|&nbsp; DarazMall Certified</div>

            <div style="background: #4a154b; color: #f6e05e; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px; display:inline-block; margin-bottom: 12px; letter-spacing: 0.5px;">
              ⚡ 11.11 FLASH SALE &nbsp;•&nbsp; Ends soon
            </div>

            <div style="display:flex; align-items:baseline; gap: 10px;">
              <span style="font-size: 32px; font-weight: 800; color: #f85606;">৳ 250</span>
              <span style="font-size: 16px; color: #a0aec0; text-decoration: line-through;">৳ 500</span>
              <span style="font-size: 13px; font-weight: 700; color: #e53e3e; background: #fff5f5; padding: 2px 6px; border-radius: 4px;">-50%</span>
            </div>
          </div>
        </div>

        <!-- Floating Verified Deal Callout Box -->
        <div style="margin: 0 16px 16px 16px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; padding: 14px 18px; display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap: 12px;">
            <div style="width:34px; height:34px; border-radius:8px; background:#22c55e; color:white; display:flex; align-items:center; justify-content:center; font-size:18px;">🎯</div>
            <div>
              <div style="font-size: 13px; font-weight: 700; color: #15803d;">Verified Deal: Lowest in 6 Months!</div>
              <div style="font-size: 11px; color: #166534;">Original price ৳500 verified. You save ৳250 today.</div>
            </div>
          </div>
          <span style="background: #22c55e; color:white; font-size: 12px; font-weight: 800; padding: 5px 12px; border-radius: 6px;">SAVE 50%</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
"""

# -------------------------------------------------------------
# IMAGE 2: "Track prices. Get notified when it drops."
# -------------------------------------------------------------
html_promo_2 = f"""<!DOCTYPE html>
<html>
{COMMON_HEAD}
<body>
  <div class="grid-lines"></div>
  <div class="bg-glow-1" style="right: auto; left: 100px;"></div>
  <div class="bg-glow-2"></div>
  <div class="content-container">
    <div class="left-col">
      <div class="pill-badge">PRICE DROP ALERTS</div>
      <h1 class="main-title">Track prices.<br><span class="accent-orange">Get notified</span><br>when it drops.</h1>
      <p class="subtitle">Add any Daraz product with one click. We watch the price in the background and deliver native desktop alerts the second a discount is detected.</p>
      
      <div class="features-list">
        <div class="feature-item">
          <div class="check-icon">✓</div>
          <span>Instant Windows desktop notifications</span>
        </div>
        <div class="feature-item">
          <div class="check-icon">✓</div>
          <span>Shows exact ৳ and % saved</span>
        </div>
        <div class="feature-item">
          <div class="check-icon">✓</div>
          <span>Silent background checks (No annoying tabs!)</span>
        </div>
      </div>

      <div class="footer-brand">
        🔔 <span>BD PRICE TRACKER</span> &nbsp;|&nbsp; AUTOMATIC ALERTS
      </div>
    </div>

    <div class="right-col" style="flex-direction: column; gap: 24px;">
      <!-- Action card mockup -->
      <div style="width: 500px; background: #ffffff; border-radius: 12px; padding: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); text-align: center;">
        <div style="font-size: 13px; color: #16a34a; font-weight: 600; margin-bottom: 10px; display:flex; align-items:center; justify-content:center; gap:6px;">
          <span>●</span> Daraz BD product detected!
        </div>
        <button style="width: 100%; padding: 14px; background: #f85606; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(248, 86, 6, 0.4);">
          + Track This Product
        </button>
      </div>

      <!-- Arrow down indicator -->
      <div style="font-size: 26px; color: #00e676; animation: bounce 1s infinite;">↓</div>

      <!-- Windows Notification Toast Card -->
      <div style="width: 520px; background: rgba(30, 41, 59, 0.9); backdrop-filter: blur(16px); border: 1.5px solid rgba(255,255,255,0.18); border-radius: 14px; padding: 18px 22px; box-shadow: 0 25px 60px rgba(0,0,0,0.6); display:flex; gap: 16px; align-items:center;">
        <img src="https://bd-live-21.slatic.net/kf/S2862261898014320b9ef652cf4ddc5b8e.png" style="width: 72px; height: 72px; object-fit: cover; border-radius: 10px; background: #334155;">
        <div style="flex:1;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
            <span style="font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">BD Price Tracker • Just now</span>
            <span style="background: #22c55e; color: white; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 4px;">-42% OFF</span>
          </div>
          <div style="font-size: 16px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">
            🔥 Price Drop: ৳409 ➔ ৳239!
          </div>
          <div style="font-size: 12px; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 380px;">
            Rexona Shower Clean Roll On 45ml dropped to its lowest price.
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
"""

# -------------------------------------------------------------
# IMAGE 3: "Every price it's been, one click away." (Popup showcase)
# -------------------------------------------------------------
html_promo_3 = f"""<!DOCTYPE html>
<html>
{COMMON_HEAD}
<body>
  <div class="grid-lines"></div>
  <div class="bg-glow-1"></div>
  <div class="bg-glow-2"></div>
  <div class="content-container">
    <div class="left-col">
      <div class="pill-badge">YOUR WATCHLIST</div>
      <h1 class="main-title">Every price,<br><span class="accent-green">one click away.</span></h1>
      <p class="subtitle">All your tracked Daraz items in one clean, beautiful popup. Check live prices, discount pills, and visit the product page with a single tap.</p>
      
      <div class="features-list">
        <div class="feature-item">
          <div class="check-icon">✓</div>
          <span>Dynamic discount tags (▼ 41%, ▼ 50%, ▼ 42%)</span>
        </div>
        <div class="feature-item">
          <div class="check-icon">✓</div>
          <span>Instant manual refresh (🔄) button</span>
        </div>
        <div class="feature-item">
          <div class="check-icon">✓</div>
          <span>Automatic duplicate URL cleaning (?spm=...)</span>
        </div>
      </div>

      <div class="footer-brand">
        ⭐ <span>BD PRICE TRACKER</span> &nbsp;|&nbsp; 100% CLIENT-SIDE
      </div>
    </div>

    <div class="right-col" style="gap: 30px;">
      <!-- Exact Extension Popup Mockup -->
      <div style="width: 370px; background: #f7f8fa; border-radius: 14px; box-shadow: 0 30px 70px rgba(0,0,0,0.6); overflow: hidden; border: 1.5px solid rgba(255,255,255,0.2);">
        <!-- Header -->
        <div style="background: #f85606; color: white; padding: 14px 18px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap: 8px;">
            <div style="width: 24px; height: 24px; border-radius: 6px; background: white; color: #f85606; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:13px;">৳</div>
            <span style="font-size: 15px; font-weight: 700;">Daraz BD Price Tracker</span>
          </div>
          <div style="display:flex; gap: 8px;">
            <div style="width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; font-size:13px; cursor:pointer;">🔄</div>
            <div style="width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; font-size:13px; cursor:pointer;">⚙️</div>
          </div>
        </div>

        <!-- Watchlist header -->
        <div style="padding: 14px 16px 8px 16px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size: 12px; font-weight: 700; color: #475569; text-transform:uppercase; letter-spacing:0.5px;">YOUR WATCHLIST</span>
          <span style="background: #e2e8f0; color: #334155; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px;">3 items</span>
        </div>

        <!-- Watchlist items -->
        <div style="padding: 0 14px 16px 14px; display:flex; flex-direction:column; gap: 10px;">
          <!-- Item 1: Sauvage -->
          <div style="background: white; border-radius: 8px; padding: 10px; display:flex; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #edf2f7;">
            <div style="width: 56px; height: 56px; border-radius: 6px; background: #0f172a; display:flex; align-items:center; justify-content:center; color:white; font-size:22px; flex-shrink:0;">🧴</div>
            <div style="flex:1; min-width:0;">
              <div style="font-size: 12px; font-weight: 600; color: #1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Sauvage Inspired Perfume for Men</div>
              <div style="display:flex; align-items:baseline; gap: 6px; margin: 3px 0;">
                <span style="font-size: 15px; font-weight: 800; color: #f85606;">৳ 177</span>
                <span style="font-size: 11px; color: #94a3b8; text-decoration:line-through;">৳ 300</span>
                <span style="font-size: 10px; font-weight: 800; color: #16a34a; background: #dcfce7; padding: 1px 5px; border-radius: 4px;">▼ 41%</span>
              </div>
              <span style="font-size: 11px; color: #2563eb; font-weight: 500;">Buy on Daraz ↗</span>
            </div>
          </div>

          <!-- Item 2: Rexona -->
          <div style="background: white; border-radius: 8px; padding: 10px; display:flex; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #edf2f7;">
            <img src="https://bd-live-21.slatic.net/kf/S2862261898014320b9ef652cf4ddc5b8e.png" style="width: 56px; height: 56px; border-radius: 6px; object-fit: cover; flex-shrink:0; background: #f1f5f9;">
            <div style="flex:1; min-width:0;">
              <div style="font-size: 12px; font-weight: 600; color: #1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Rexona Shower Clean Roll On 45ml</div>
              <div style="display:flex; align-items:baseline; gap: 6px; margin: 3px 0;">
                <span style="font-size: 15px; font-weight: 800; color: #f85606;">৳ 239</span>
                <span style="font-size: 11px; color: #94a3b8; text-decoration:line-through;">৳ 409</span>
                <span style="font-size: 10px; font-weight: 800; color: #16a34a; background: #dcfce7; padding: 1px 5px; border-radius: 4px;">▼ 42%</span>
              </div>
              <span style="font-size: 11px; color: #2563eb; font-weight: 500;">Buy on Daraz ↗</span>
            </div>
          </div>

          <!-- Item 3: SuperCare Face Wash -->
          <div style="background: white; border-radius: 8px; padding: 10px; display:flex; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: 1px solid #edf2f7;">
            <img src="https://bd-live-21.slatic.net/kf/Sda97481c94414bf0bef0a81e560010a5c.jpg" style="width: 56px; height: 56px; border-radius: 6px; object-fit: cover; flex-shrink:0; background: #f1f5f9;">
            <div style="flex:1; min-width:0;">
              <div style="font-size: 12px; font-weight: 600; color: #1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">SuperCare Oil Control Face Wash (BOGO)</div>
              <div style="display:flex; align-items:baseline; gap: 6px; margin: 3px 0;">
                <span style="font-size: 15px; font-weight: 800; color: #f85606;">৳ 250</span>
                <span style="font-size: 11px; color: #94a3b8; text-decoration:line-through;">৳ 500</span>
                <span style="font-size: 10px; font-weight: 800; color: #16a34a; background: #dcfce7; padding: 1px 5px; border-radius: 4px;">▼ 50%</span>
              </div>
              <span style="font-size: 11px; color: #2563eb; font-weight: 500;">Buy on Daraz ↗</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Callout Badges on Right -->
      <div style="display:flex; flex-direction:column; gap: 16px;">
        <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 14px 18px; width: 220px;">
          <div style="font-size: 13px; font-weight: 700; color: #00e676; margin-bottom: 3px;">1-Click Refresh</div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Verify background checks anytime with the refresh button.</div>
        </div>

        <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 14px 18px; width: 220px;">
          <div style="font-size: 13px; font-weight: 700; color: #38bdf8; margin-bottom: 3px;">Discount Pills</div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Automatic percentage calculation against original MRP.</div>
        </div>

        <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 14px 18px; width: 220px;">
          <div style="font-size: 13px; font-weight: 700; color: #f85606; margin-bottom: 3px;">Clean URLs</div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.4;">Strips tracking clutter (?spm=...) for clean bookmarks.</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
"""

# -------------------------------------------------------------
# IMAGE 4: "Everything you follow, in one place." (3-Step Guide)
# -------------------------------------------------------------
html_promo_4 = f"""<!DOCTYPE html>
<html>
{COMMON_HEAD}
<style>
  .step-card {{
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(12px);
    border-radius: 16px;
    padding: 34px 28px;
    width: 350px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  }}
  .step-num {{
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: #f85606;
    color: white;
    font-size: 20px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    box-shadow: 0 6px 18px rgba(248, 86, 6, 0.4);
  }}
  .step-title {{
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 12px;
  }}
  .step-desc {{
    font-size: 14px;
    color: #94a3b8;
    line-height: 1.6;
  }}
</style>
<body>
  <div class="grid-lines"></div>
  <div class="bg-glow-1" style="top:50%; left:50%; transform:translate(-50%, -50%); width:800px; height:800px;"></div>
  
  <div style="padding: 60px 80px; display:flex; flex-direction:column; align-items:center; text-align:center;">
    <div class="pill-badge" style="margin-bottom: 16px;">EFFORTLESS SAVINGS</div>
    <h1 style="font-size: 44px; font-weight: 800; letter-spacing: -1px; margin-bottom: 14px;">
      How It Works: <span class="accent-orange">Save in 3 Simple Steps</span>
    </h1>
    <p style="font-size: 16px; color: #94a3b8; max-width: 650px; margin-bottom: 50px;">
      No registration, zero accounts, and no technical setup required. Install the extension and start saving money on Daraz Bangladesh today.
    </p>

    <!-- 3 Steps Grid -->
    <div style="display:flex; gap: 26px; justify-content:center; width: 100%;">
      <!-- Step 1 -->
      <div class="step-card">
        <div class="step-num">1</div>
        <div style="font-size: 32px; margin-bottom: 14px;">🛒</div>
        <div class="step-title">Browse Daraz BD</div>
        <div class="step-desc">Go to any product page on daraz.com.bd — gadgets, fashion, groceries, or beauty items.</div>
      </div>

      <!-- Step 2 -->
      <div class="step-card" style="border-color: rgba(248, 86, 6, 0.4);">
        <div class="step-num">2</div>
        <div style="font-size: 32px; margin-bottom: 14px;">🎯</div>
        <div class="step-title">1-Click Track</div>
        <div class="step-desc">Open the BD Price Tracker extension and click "+ Track This Product". The item is instantly saved.</div>
      </div>

      <!-- Step 3 -->
      <div class="step-card" style="border-color: rgba(0, 230, 118, 0.4);">
        <div class="step-num" style="background:#22c55e; box-shadow: 0 6px 18px rgba(34, 197, 94, 0.4);">3</div>
        <div style="font-size: 32px; margin-bottom: 14px;">🔔</div>
        <div class="step-title">Get Drop Alerts</div>
        <div class="step-desc">We silently watch the price in the background and pop up a desktop notification when it drops!</div>
      </div>
    </div>

    <!-- Bottom Features Strip -->
    <div style="margin-top: 48px; display:flex; gap: 36px; color: #cbd5e1; font-size: 13px; font-weight: 600;">
      <span>🔒 100% Private (Local Storage)</span>
      <span>•</span>
      <span>⚡ Lightweight Manifest V3</span>
      <span>•</span>
      <span>🇧🇩 Tailored for Bangladesh Shoppers</span>
    </div>
  </div>
</body>
</html>
"""

TEMPLATES = [
    ("promo_1_real_deal.html", "promo_1_real_deal.png", html_promo_1),
    ("promo_2_price_drops.html", "promo_2_price_drops.png", html_promo_2),
    ("promo_3_watchlist.html", "promo_3_watchlist.png", html_promo_3),
    ("promo_4_how_it_works.html", "promo_4_how_it_works.png", html_promo_4),
]

def main():
    print(f"Creating 4 store promotional images in {OUT_DIR}...")
    for html_name, png_name, content in TEMPLATES:
        html_path = os.path.join(OUT_DIR, html_name)
        png_path = os.path.join(OUT_DIR, png_name)
        
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(content)
        
        print(f"Rendering {png_name} (1280x800)...")
        file_url = "file:///" + html_path.replace("\\", "/")
        cmd = [
            EDGE_PATH,
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            f"--screenshot={png_path}",
            "--window-size=1280,800",
            "--hide-scrollbars",
            file_url
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        if os.path.exists(png_path) and os.path.getsize(png_path) > 1000:
            print(f"✅ Generated: {png_name} ({os.path.getsize(png_path)} bytes)")
        else:
            print(f"❌ Failed to generate {png_name}: {res.stderr}")

if __name__ == "__main__":
    main()
