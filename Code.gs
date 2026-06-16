/**
 * Resume visit tracker — Google Apps Script web app.
 * Receives a POST from index.html on every page load and appends one row
 * per visit to the "Visits" sheet. The row number IS the running count.
 *
 * Setup steps are in TRACKING_SETUP.md.
 */

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
    sheet.appendRow([
      count,
      new Date(),
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

    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the web-app URL in a browser to confirm it's deployed,
// and shows the current visit count.
function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Visits");
  var count = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
  return ContentService.createTextOutput("Resume tracker live. Visits so far: " + count);
}
