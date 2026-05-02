const COL_BG = new Color("#f5efe2");
const COL_INK = new Color("#4a3829");
const COL_SOFT = new Color("#8a7558");
const COL_LIGHT = new Color("#f5efe2");
const COL_LINE = new Color("#4a3829", 0.25);
const COL_LINE_DARK = new Color("#4a3829", 1);

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIAS = ["DOM","LUN","MAR","MIE","JUE","VIE","SAB"];
const DAYS = 7;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(d.getDate() + n);
  return x;
}

function getWeekNumber(d) {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
}

function truncate(s, n) {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "...";
}

function drawLine(thickness, color) {
  const ctx = new DrawContext();
  ctx.size = new Size(800, thickness);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  ctx.setFillColor(color);
  ctx.fillRect(new Rect(0, 0, 800, thickness));
  return ctx.getImage();
}

async function loadByDay(today) {
  const end = addDays(today, DAYS);
  const items = await Reminder.incompleteDueBetween(today, end);
  const byDay = {};
  for (const r of items) {
    if (!r.dueDate) continue;
    const key = startOfDay(r.dueDate).toISOString().slice(0,10);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(r);
  }
  return byDay;
}

function addLine(w, thickness, color) {
  const img = drawLine(thickness, color);
  const s = w.addStack();
  const i = s.addImage(img);
  i.imageSize = new Size(800, thickness);
}

function addDayRow(w, d, items, isToday) {
  const row = w.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.setPadding(3, 4, 3, 4);
  if (isToday) {
    row.backgroundColor = COL_INK;
    row.cornerRadius = 4;
  }

  const dateText = row.addText(String(d.getDate()));
  dateText.font = Font.lightSystemFont(13);
  dateText.textColor = isToday ? COL_LIGHT : COL_INK;

  row.addSpacer(6);

  const dayText = row.addText(isToday ? "HOY" : DIAS[d.getDay()]);
  dayText.font = Font.semiboldSystemFont(6.5);
  dayText.textColor = isToday ? COL_LIGHT : COL_SOFT;

  row.addSpacer(8);

  const titleText = items.length > 0 ? truncate(items[0].title, 20) : "libre";
  const title = row.addText(titleText);
  title.font = Font.italicSystemFont(11);
  if (items.length === 0) {
    title.textColor = isToday ? COL_LIGHT : new Color("#4a3829", 0.4);
  } else {
    title.textColor = isToday ? COL_LIGHT : COL_INK;
  }
  title.lineLimit = 1;

  row.addSpacer();

  if (items.length > 0) {
    const cnt = row.addText(String(items.length));
    cnt.font = Font.lightSystemFont(11);
    cnt.textColor = isToday ? COL_LIGHT : COL_SOFT;
  }
}

async function buildWidget() {
  const today = startOfDay(new Date());
  const byDay = await loadByDay(today);

  const w = new ListWidget();
  w.backgroundColor = COL_BG;
  w.setPadding(12, 14, 10, 14);

  const titleStack = w.addStack();
  titleStack.layoutHorizontally();
  titleStack.addSpacer();
  const title = titleStack.addText("Mi agenda personal");
  title.font = Font.boldSystemFont(15);
  title.textColor = COL_INK;
  titleStack.addSpacer();

  w.addSpacer(5);
  addLine(w, 1.2, COL_LINE_DARK);
  w.addSpacer(2);
  addLine(w, 0.5, COL_LINE_DARK);
  w.addSpacer(5);

  const meta = w.addStack();
  meta.layoutHorizontally();
  const wnum = getWeekNumber(today);
  const m1 = meta.addText("SEMANA " + wnum);
  m1.font = Font.mediumSystemFont(7);
  m1.textColor = COL_INK;
  meta.addSpacer();
  const end = addDays(today, DAYS - 1);
  const sameMonth = today.getMonth() === end.getMonth();
  const rangeStr = sameMonth ? today.getDate() + " - " + end.getDate() + " " + MESES[today.getMonth()] : today.getDate() + " " + MESES[today.getMonth()] + " - " + end.getDate() + " " + MESES[end.getMonth()];
  const m2 = meta.addText(rangeStr);
  m2.font = Font.mediumSystemFont(7);
  m2.textColor = COL_SOFT;
  meta.addSpacer();
  const m3 = meta.addText(String(today.getFullYear()));
  m3.font = Font.mediumSystemFont(7);
  m3.textColor = COL_SOFT;

  w.addSpacer(5);
  addLine(w, 0.5, COL_LINE_DARK);

  let total = 0;
  for (const k in byDay) total += byDay[k].length;

  w.addSpacer(8);
  const featStack = w.addStack();
  featStack.layoutHorizontally();
  featStack.addSpacer();
  const featNum = featStack.addText(String(total));
  featNum.font = Font.italicSystemFont(38);
  featNum.textColor = COL_INK;
  featStack.addSpacer();

  const featLblStack = w.addStack();
  featLblStack.layoutHorizontally();
  featLblStack.addSpacer();
  const featLbl = featLblStack.addText("pendientes esta semana");
  featLbl.font = Font.italicSystemFont(10);
  featLbl.textColor = COL_SOFT;
  featLblStack.addSpacer();

  w.addSpacer(8);
  addLine(w, 0.5, COL_LINE);
  w.addSpacer(2);

  const size = config.widgetFamily || "medium";
  const showDays = size === "large" ? 7 : 3;

  for (let i = 0; i < showDays; i++) {
    const d = addDays(today, i);
    const key = d.toISOString().slice(0,10);
    const items = byDay[key] || [];
    addDayRow(w, d, items, i === 0);
    if (i < showDays - 1) {
      addLine(w, 0.5, COL_LINE);
    }
  }

  return w;
}

const widget = await buildWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentLarge();
}
Script.complete();
