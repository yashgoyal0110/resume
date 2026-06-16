/**
 * Resume visit tracker — Google Apps Script web app.
 * Receives a POST from index.html on every page load and appends one row
 * per visit to the "Visits" sheet. The row number IS the running count.
 * It also emails you a formatted notification for each visit.
 *
 * Setup steps are in TRACKING_SETUP.md.
 */

// Where to send visit notifications. Set "" to disable email.
var NOTIFY_EMAIL = "yg364550@gmail.com";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // avoid two visits writing the same row at once
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Visits") || ss.insertSheet("Visits");

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "#", "Logged at (server)", "Visit time (browser)",
        "City", "Region", "Country", "IP", "ISP",
        "Browser / OS (User-Agent)", "Referrer",
        "Language", "Timezone", "Screen", "Page"
      ]);
      sheet.setFrozenRows(1);
    }

    var d = {};
    try { d = JSON.parse(e.postData.contents); } catch (err) {}

    var count = sheet.getLastRow(); // header = row 1, so first visit -> 1
    var now = new Date();
    sheet.appendRow([
      count,
      now,
      d.time || "",
      d.city || "",
      d.region || "",
      d.country || "",
      d.ip || "",
      d.isp || "",
      d.userAgent || "",
      d.referrer || "",
      d.language || "",
      d.timezone || "",
      d.screen || "",
      d.page || ""
    ]);

    // Runs on Google's servers after the visitor's browser has moved on,
    // so it adds zero latency to the page load.
    sendVisitEmail(count, now, d);

    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}

function sendVisitEmail(count, now, d) {
  if (!NOTIFY_EMAIL) return;
  try {
    var place = [d.city, d.region, d.country].filter(function (x) { return x; }).join(", ") || "Unknown location";
    var when = Utilities.formatDate(now, Session.getScriptTimeZone(), "EEE, d MMM yyyy, h:mm a z");
    var subject = "📄 Resume opened — visit #" + count + " (" + place + ")";

    var rows = [
      ["Visit #", String(count)],
      ["When", when],
      ["Location", place],
      ["IP", d.ip || "—"],
      ["ISP / Network", d.isp || "—"],
      ["Browser / OS", d.userAgent || "—"],
      ["Came from", d.referrer || "(direct)"],
      ["Language", d.language || "—"],
      ["Timezone", d.timezone || "—"],
      ["Screen", d.screen || "—"],
      ["Page", d.page || "—"]
    ];

    var trs = rows.map(function (r) {
      return '<tr>' +
        '<td style="padding:8px 14px;border-bottom:1px solid #eee;color:#666;white-space:nowrap;vertical-align:top;font-weight:600;">' + r[0] + '</td>' +
        '<td style="padding:8px 14px;border-bottom:1px solid #eee;color:#111;word-break:break-word;">' + escapeHtml(r[1]) + '</td>' +
        '</tr>';
    }).join("");

    var html =
      '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:auto;">' +
        '<h2 style="margin:0 0 4px;color:#111;">Someone opened your resume</h2>' +
        '<p style="margin:0 0 16px;color:#888;font-size:13px;">cv.yashgoyal.sbs · visit #' + count + '</p>' +
        '<table style="border-collapse:collapse;width:100%;font-size:14px;border:1px solid #eee;border-radius:8px;overflow:hidden;">' +
          trs +
        '</table>' +
        '<p style="margin:16px 0 0;color:#aaa;font-size:12px;">Browsers can\'t reveal a visitor\'s name or Google profile — this is the full set of data a website is allowed to see.</p>' +
      '</div>';

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: subject,
      htmlBody: html,
      body: subject + "\n\n" + rows.map(function (r) { return r[0] + ": " + r[1]; }).join("\n")
    });
  } catch (err) {
    // Never let a mail failure break the logging.
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Lets you open the web-app URL in a browser to confirm it's deployed,
// and shows the current visit count.
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Visits");
  var count = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
  return ContentService.createTextOutput("Resume tracker live. Visits so far: " + count);
}
