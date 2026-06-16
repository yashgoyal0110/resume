# Resume visit tracking — setup

Every time someone opens `cv.yashgoyal.sbs`, a new row is added to a Google Sheet
you own. The row number is the running visit count. Each row also logs the
metadata the browser is allowed to share (see "What you get" below).

## One-time setup (~10 min)

1. Go to https://sheets.google.com and create a new blank spreadsheet.
   Name it something like **Resume visits**.
2. In that sheet's menu: **Extensions → Apps Script**.
3. Delete the sample code in `Code.gs`, then paste the full contents of
   [Code.gs](Code.gs) from this repo. Click the **Save** (disk) icon.
4. Click **Deploy → New deployment**.
   - Click the gear ⚙ next to "Select type" → choose **Web app**.
   - **Execute as:** Me
   - **Who has access:** **Anyone** (required — visitors aren't logged in)
   - Click **Deploy**, then **Authorize access** and allow the permissions
     (it's your own script, the warning screen is normal — click
     "Advanced → Go to <project> (unsafe)").
5. Copy the **Web app URL** it gives you. It looks like:
   `https://script.google.com/macros/s/AKfy....../exec`
6. Open [index.html](index.html), find this line near the bottom:
   ```js
   var ENDPOINT = "REPLACE_WITH_APPS_SCRIPT_URL";
   ```
   Replace the placeholder with your Web app URL (keep the quotes).
7. Commit and push:
   ```sh
   git add index.html Code.gs TRACKING_SETUP.md
   git commit -m "Add visit tracking"
   git push
   ```

GitHub Pages will redeploy in a minute. Open the site, then check your sheet —
you should see a new row. To verify the endpoint directly, open the Web app URL
in your browser; it prints "Resume tracker live. Visits so far: N".

## What you get per visit

| Column | Example |
|---|---|
| # (count) | 1, 2, 3 … |
| Logged at / Visit time | timestamps |
| City / Region / Country | Mumbai, Maharashtra, India |
| IP / ISP | 49.x.x.x, Jio |
| Browser / OS | the full User-Agent (Chrome on Windows, etc.) |
| Referrer | where they clicked from (LinkedIn, email, direct) |
| Language / Timezone / Screen | en-US, Asia/Kolkata, 1920x1080 |

## What is NOT possible (and why)

Browsers deliberately hide these — no website can read them:
- The visitor's **name** or email
- Which **Chrome profile** they're signed into
- Their precise GPS location (only IP-based city, which can be off / VPN-masked)

The list above is the maximum a site is allowed to know about a visitor.

## Notes / limits

- Location comes from a free IP lookup (`ipwho.is`). VPNs/proxies will show the
  VPN's location. If the lookup is down, the visit is still counted (geo blank).
- `ipwho.is` is free with no API key. If you ever hit limits, swap the URL in
  index.html for `https://ipapi.co/json/` (same idea, free tier 1k/day).
- A reload counts as a new visit. If you want unique-per-day instead, say so and
  I'll add a localStorage guard.
- To re-deploy after editing Code.gs later: **Deploy → Manage deployments →**
  pencil ✏ → **Version: New version → Deploy** (the URL stays the same).
