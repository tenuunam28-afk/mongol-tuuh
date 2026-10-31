// Helpers shared by the timeline (script.js) and the map (map.js)

// Group digits with a space once a year gets long: 800000 -> "800 000"
function groupDigits(n) {
  return n >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") : String(n);
}

// Negative years are BCE ("МЭӨ"), positive are CE ("МЭ")
function formatYear(y) {
  if (y === null) return "өнөөг хүртэл";
  return y < 0 ? `МЭӨ ${groupDigits(-y)}` : `${y}`;
}

// A range that starts BCE and ends CE gets an explicit "МЭ" so the switch is clear
function formatRange(era) {
  const start = formatYear(era.start);
  const end = era.start < 0 && era.end > 0 ? `МЭ ${era.end}` : formatYear(era.end);
  return `${start} – ${end}`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function loadJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

const LOAD_ERROR =
  "Өгөгдөл ачаалж чадсангүй. Файлыг шууд нээхэд хөтөч JSON-г хаадаг тул локал сервер ажиллуулна уу (жишээ нь: python3 -m http.server).";
