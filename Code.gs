/**
 * AAP Consumable Stock Tracker — Google Apps Script backend
 * Armstrong Auto Parts Sdn. Bhd. (Seremban) — DM Line
 *
 * VERSI 5 — Tambah tab PLAN:
 *   • Sheet baru auto-create: Plan, Delivery, Config
 *   • API baru: meta (baca plan/delivery/config), simpan plan/delivery/config
 *   • dailyStockAlert() — email auto bila baki <= safety stock (set trigger harian)
 * Versi 4: fix date handling (dateKey/tsNum) + fixBalances()
 *
 * RE-DEPLOY perlu selepas paste versi ni.
 */

var SHEET_NAME = "Records";
var PLAN_SHEET = "Plan";
var DELIVERY_SHEET = "Delivery";
var CONFIG_SHEET = "Config";

// ====================== ROUTES ======================

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "ping";
  if (action === "ping") return jsonOut({ ok: true, message: "AAP Tracker backend hidup (v5)" });
  if (action === "list") return jsonOut({ ok: true, records: getAllRecords() });
  if (action === "meta") {
    return jsonOut({ ok: true, config: getConfig(), plan: getPlan(), delivery: getDelivery() });
  }
  if (action === "delete") {
    var id = e.parameter.id;
    if (!id) return jsonOut({ ok: false, error: "ID tiada" });
    var res = deleteRecord(id);
    recalcBalances();
    return jsonOut(res);
  }
  if (action === "deleteDelivery") {
    var did = e.parameter.id;
    if (!did) return jsonOut({ ok: false, error: "ID tiada" });
    return jsonOut(deleteRow(DELIVERY_SHEET, did));
  }
  return jsonOut({ ok: false, error: "Unknown action: " + action });
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var kind = data.kind || "record";

    if (kind === "config") return jsonOut(saveConfig(data.material, data.safetyStock, data.shipmentSize, data.leadTime, data.alertEmail));
    if (kind === "plan")     return jsonOut(savePlan(data.material, data.rows));
    if (kind === "delivery") return jsonOut(saveDelivery(data));

    // default: rekod stok (macam biasa)
    var sheet = getSheet();
    var id = data.id || String(Date.now());
    if (data.type === "OPENING") removeOpeningSameDate(data.material, data.date);
    sheet.appendRow([
      id, new Date(), data.material || "", data.type || "",
      Number(data.qty) || 0, data.unit || "", data.line || "",
      data.shift || "", data.operator || "", data.date || "",
      data.remarks || "", ""
    ]);
    recalcBalances();
    return jsonOut({ ok: true, message: "Rekod disimpan", id: id });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

// ====================== HELPERS TARIKH ======================

/** Normalize tarikh ke "yyyy-MM-dd" — handle teks ATAU Date object. */
function dateKey(v) {
  if (!v) return "";
  if (Object.prototype.toString.call(v) === "[object Date]") {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  var s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  var d = new Date(s);
  if (!isNaN(d.getTime())) return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
  return s;
}

function tsNum(v) {
  if (!v) return 0;
  if (Object.prototype.toString.call(v) === "[object Date]") return v.getTime();
  var d = new Date(String(v));
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

// ====================== RECORDS ======================

function removeOpeningSameDate(material, dateStr) {
  var sheet = getSheet();
  var values = sheet.getDataRange().getValues();
  var target = dateKey(dateStr);
  for (var i = values.length - 1; i >= 1; i--) {
    if (values[i][3] === "OPENING" && values[i][2] === material && dateKey(values[i][9]) === target) {
      sheet.deleteRow(i + 1);
    }
  }
}

function deleteRecord(id) {
  var sheet = getSheet();
  var values = sheet.getDataRange().getValues();
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { ok: true, message: "Rekod dipadam", id: id };
    }
  }
  return { ok: false, error: "ID tak dijumpai: " + id };
}

function recalcBalances() {
  var sheet = getSheet();
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return;

  var rows = [];
  for (var i = 1; i < values.length; i++) {
    rows.push({
      idx: i,
      material: values[i][2],
      type: values[i][3],
      qty: Number(values[i][4]) || 0,
      dkey: dateKey(values[i][9]),
      tnum: tsNum(values[i][1])
    });
  }
  rows.sort(function (a, b) {
    if (a.material !== b.material) return a.material < b.material ? -1 : 1;
    if (a.dkey !== b.dkey) return a.dkey < b.dkey ? -1 : 1;
    return a.tnum - b.tnum;
  });

  var runBal = {}, balByIdx = {};
  rows.forEach(function (r) {
    if (runBal[r.material] === undefined) runBal[r.material] = 0;
    if (r.type === "OPENING") runBal[r.material] = r.qty;
    else if (r.type === "OUT") runBal[r.material] -= r.qty;
    else runBal[r.material] += r.qty;
    balByIdx[r.idx] = runBal[r.material];
  });

  for (var j = 1; j < values.length; j++) {
    sheet.getRange(j + 1, 12).setValue(balByIdx[j] !== undefined ? balByIdx[j] : "");
  }
}

function fixBalances() {
  recalcBalances();
  SpreadsheetApp.getActiveSpreadsheet().toast("Balance dah dikira semula ✓", "AAP Tracker", 5);
}

function getAllRecords() {
  var sheet = getSheet();
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  return values.slice(1).map(function (r) {
    return {
      id: String(r[0]), timestamp: r[1], material: r[2], type: r[3],
      qty: Number(r[4]) || 0, unit: r[5], line: r[6], shift: r[7],
      operator: r[8], date: r[9] ? dateKey(r[9]) : "", remarks: r[10],
      balance: r[11]
    };
  });
}

/** Baki semasa satu material (anchor model: OPENING terkini + IN - OUT selepas tu). */
function currentBalance(material) {
  var recs = getAllRecords().filter(function (r) { return r.material === material; });
  var ops = recs.filter(function (r) { return r.type === "OPENING" && r.date; })
                .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
  var base = ops.length ? Number(ops[0].qty) : 0;
  var from = ops.length ? ops[0].date : "0000-00-00";
  var bal = base;
  recs.forEach(function (r) {
    if (!r.date || r.date < from) return;
    if (r.type === "IN") bal += Number(r.qty);
    else if (r.type === "OUT") bal -= Number(r.qty);
  });
  return bal;
}

// ====================== CONFIG / PLAN / DELIVERY ======================

function getConfig() {
  var sh = getNamedSheet(CONFIG_SHEET, ["Material", "SafetyStock", "ShipmentSize", "LeadTime", "AlertEmail"]);
  var v = sh.getDataRange().getValues();
  var out = {};
  for (var i = 1; i < v.length; i++) {
    if (!v[i][0]) continue;
    out[v[i][0]] = {
      safetyStock: Number(v[i][1]) || 0,
      shipmentSize: Number(v[i][2]) || 0,
      leadTime: Number(v[i][3]) || 0,
      alertEmail: String(v[i][4] || "")
    };
  }
  return out;
}

function saveConfig(material, safetyStock, shipmentSize, leadTime, alertEmail) {
  var sh = getNamedSheet(CONFIG_SHEET, ["Material", "SafetyStock", "ShipmentSize", "LeadTime", "AlertEmail"]);
  var v = sh.getDataRange().getValues();
  var row = [material, Number(safetyStock) || 0, Number(shipmentSize) || 0, Number(leadTime) || 0, alertEmail || ""];
  for (var i = 1; i < v.length; i++) {
    if (v[i][0] === material) {
      sh.getRange(i + 1, 1, 1, 5).setValues([row]);
      return { ok: true, message: "Config disimpan" };
    }
  }
  sh.appendRow(row);
  return { ok: true, message: "Config disimpan" };
}

function getPlan() {
  var sh = getNamedSheet(PLAN_SHEET, ["Date", "Material", "PlanPcs"]);
  var v = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < v.length; i++) {
    if (!v[i][0]) continue;
    out.push({ date: dateKey(v[i][0]), material: v[i][1], planPcs: Number(v[i][2]) || 0 });
  }
  return out;
}

/** rows = [{date, planPcs}] — ganti plan sedia ada utk material + tarikh sama. */
function savePlan(material, rows) {
  var sh = getNamedSheet(PLAN_SHEET, ["Date", "Material", "PlanPcs"]);
  if (!rows || !rows.length) return { ok: false, error: "Tiada data plan" };

  var v = sh.getDataRange().getValues();
  var incoming = {};
  rows.forEach(function (r) { incoming[dateKey(r.date)] = Number(r.planPcs) || 0; });

  // buang yang bertindih (material + tarikh sama)
  for (var i = v.length - 1; i >= 1; i--) {
    if (v[i][1] === material && incoming[dateKey(v[i][0])] !== undefined) sh.deleteRow(i + 1);
  }
  var add = rows.map(function (r) { return [dateKey(r.date), material, Number(r.planPcs) || 0]; });
  sh.getRange(sh.getLastRow() + 1, 1, add.length, 3).setValues(add);
  return { ok: true, message: "Plan disimpan (" + add.length + " hari)" };
}

function getDelivery() {
  var sh = getNamedSheet(DELIVERY_SHEET, ["ID", "Material", "Date", "Qty", "Unit", "Status", "Remarks"]);
  var v = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < v.length; i++) {
    if (!v[i][0]) continue;
    out.push({
      id: String(v[i][0]), material: v[i][1], date: dateKey(v[i][2]),
      qty: Number(v[i][3]) || 0, unit: v[i][4], status: v[i][5], remarks: v[i][6]
    });
  }
  return out;
}

function saveDelivery(d) {
  var sh = getNamedSheet(DELIVERY_SHEET, ["ID", "Material", "Date", "Qty", "Unit", "Status", "Remarks"]);
  var id = d.id || String(Date.now());
  sh.appendRow([id, d.material || "", dateKey(d.date), Number(d.qty) || 0, d.unit || "", d.status || "Planned", d.remarks || ""]);
  return { ok: true, message: "Delivery disimpan", id: id };
}

function deleteRow(sheetName, id) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) return { ok: false, error: "Sheet tiada" };
  var v = sh.getDataRange().getValues();
  for (var i = v.length - 1; i >= 1; i--) {
    if (String(v[i][0]) === String(id)) {
      sh.deleteRow(i + 1);
      return { ok: true, message: "Dipadam", id: id };
    }
  }
  return { ok: false, error: "ID tak dijumpai" };
}

// ====================== EMAIL ALERT ======================

/**
 * Hantar email bila baki <= safety stock.
 * SETUP: Apps Script → ikon Triggers (⏰) → + Add Trigger
 *        Function: dailyStockAlert | Time-driven | Day timer | 8am-9am → Save
 */
function dailyStockAlert() {
  var cfg = getConfig();
  var plan = getPlan();
  var lines = [];

  Object.keys(cfg).forEach(function (material) {
    var c = cfg[material];
    if (!c.safetyStock) return;

    var bal = currentBalance(material);
    if (bal > c.safetyStock) return; // selamat — tak perlu alert

    // anggar guna/hari dari plan (purata plan 14 hari lepas, dalam unit)
    var pcsPerUnit = pcsPerUnitOf(material);
    var recent = plan.filter(function (p) { return p.material === material && p.planPcs > 0; }).slice(-10);
    var avgPcs = recent.length
      ? recent.reduce(function (s, p) { return s + p.planPcs; }, 0) / recent.length
      : 0;
    var perDay = (avgPcs && pcsPerUnit) ? (avgPcs / pcsPerUnit) : 0;
    var daysLeft = perDay > 0 ? (bal / perDay) : 0;

    lines.push(
      "• " + material + "\n" +
      "    Baki semasa   : " + bal + "\n" +
      "    Safety stock  : " + c.safetyStock + "\n" +
      (perDay ? "    Guna/hari     : " + perDay.toFixed(1) + "\n" : "") +
      (perDay ? "    Jangkaan habis: ~" + Math.max(0, Math.floor(daysLeft)) + " hari kerja lagi\n" : "") +
      "    Status        : " + (bal <= 0 ? "STOK HABIS!" : "HANTAR SEGERA") + "\n"
    );
  });

  if (!lines.length) return; // semua ok — senyap

  var to = firstAlertEmail(cfg) || Session.getActiveUser().getEmail();
  if (!to) return;

  var body =
    "AAP Consumable Stock Tracker — ALERT\n" +
    "Armstrong Auto Parts (Seremban) · DM Line\n" +
    "Tarikh: " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd MMM yyyy") + "\n\n" +
    "Material di bawah safety stock:\n\n" +
    lines.join("\n") + "\n" +
    "Sila buat work order / hubungi supplier.\n\n" +
    "— Auto-alert dari AAP Stock Tracker";

  MailApp.sendEmail({
    to: to,
    subject: "⚠️ AAP Stock Alert — " + lines.length + " material bawah safety stock",
    body: body
  });
}

function firstAlertEmail(cfg) {
  var email = "";
  Object.keys(cfg).forEach(function (m) {
    if (!email && cfg[m].alertEmail) email = cfg[m].alertEmail;
  });
  return email;
}

function pcsPerUnitOf(material) {
  var map = { "Bubble Wrap": 200, "Glue Tribond": 1020, "NPC Grease": 15 };
  return map[material] || 0;
}

/** Test email sekarang (run dari editor untuk cuba). */
function testAlertNow() {
  dailyStockAlert();
  SpreadsheetApp.getActiveSpreadsheet().toast("dailyStockAlert dijalankan — semak email", "AAP Tracker", 5);
}

// ====================== SHEET UTIL ======================

function getSheet() {
  return getNamedSheet(SHEET_NAME,
    ["ID","Timestamp","Material","Type","Qty","Unit","Line","Shift","Operator","Date","Remarks","Balance"]);
}

function getNamedSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold").setBackground("#1d4a7a").setFontColor("#ffffff");
    sh.setFrozenRows(1);
  }
  return sh;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
