const CURRENT_YEAR = new Date().getFullYear();

const $eras = document.getElementById("eras");
const $ribbon = document.getElementById("ribbon");
const $search = document.getElementById("search");
const $count = document.getElementById("count");
const $status = document.getElementById("status");
const $detail = document.getElementById("detail");
const $detailBody = document.getElementById("detail-body");

let eras = [];

// Negative years are BCE ("МЭӨ"), positive are CE ("МЭ")
function formatYear(y) {
  if (y === null) return "өнөөг хүртэл";
  return y < 0 ? `МЭӨ ${-y}` : `${y}`;
}

function formatRange(era) {
  const start = era.start < 0 ? formatYear(era.start) : `МЭ ${era.start}`;
  return `${start} – ${formatYear(era.end)}`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function highlight(text, q) {
  const safe = escapeHtml(text);
  if (!q) return safe;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return safe.replace(re, "<mark>$1</mark>");
}

function matches(era, q) {
  if (!q) return true;
  const haystack = [era.name, era.summary, era.capital, ...era.figures, ...era.events.map((e) => e.text)]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function renderRibbon() {
  $ribbon.innerHTML = "";
  for (const era of eras) {
    const span = (era.end ?? CURRENT_YEAR) - era.start;
    const a = document.createElement("a");
    a.href = `#${era.id}`;
    a.title = `${era.name} (${formatRange(era)})`;
    a.style.flexGrow = span;
    a.dataset.id = era.id;
    $ribbon.appendChild(a);
  }
}

function renderEras() {
  const q = $search.value.trim();
  const visible = eras.filter((e) => matches(e, q));

  $eras.innerHTML = visible
    .map(
      (era) => `
      <article class="era" id="${era.id}" tabindex="0" data-id="${era.id}">
        <div class="years">${formatRange(era)}</div>
        <h2>${highlight(era.name, q)}</h2>
        <p>${highlight(era.summary, q)}</p>
        <div class="tags">${era.figures.map((f) => `<span class="tag">${highlight(f, q)}</span>`).join("")}</div>
      </article>`
    )
    .join("");

  $count.textContent = `${visible.length} / ${eras.length} үе`;
  $status.textContent = visible.length ? "" : "Илэрц олдсонгүй.";

  const ids = new Set(visible.map((e) => e.id));
  for (const a of $ribbon.children) a.classList.toggle("on", q !== "" && ids.has(a.dataset.id));
}

function openDetail(id) {
  const era = eras.find((e) => e.id === id);
  if (!era) return;
  $detailBody.innerHTML = `
    <div class="years meta">${formatRange(era)} · Нийслэл: ${escapeHtml(era.capital)}</div>
    <h2>${escapeHtml(era.name)}</h2>
    <p>${escapeHtml(era.summary)}</p>
    <h3>Түүхэн хүмүүс</h3>
    <div class="tags">${era.figures.map((f) => `<span class="tag">${escapeHtml(f)}</span>`).join("")}</div>
    <h3>Гол үйл явдлууд</h3>
    <ul class="events">
      ${era.events.map((ev) => `<li><span class="y">${formatYear(ev.year)}</span><span>${escapeHtml(ev.text)}</span></li>`).join("")}
    </ul>`;
  $detail.showModal();
}

$eras.addEventListener("click", (e) => {
  const card = e.target.closest(".era");
  if (card) openDetail(card.dataset.id);
});

$eras.addEventListener("keydown", (e) => {
  const card = e.target.closest(".era");
  if (card && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    openDetail(card.dataset.id);
  }
});

$detail.querySelector(".close").addEventListener("click", () => $detail.close());
$detail.addEventListener("click", (e) => {
  if (e.target === $detail) $detail.close();
});

$search.addEventListener("input", renderEras);

async function init() {
  $status.textContent = "Ачааллаж байна…";
  try {
    const res = await fetch("data/eras.json");
    if (!res.ok) throw new Error(res.status);
    eras = (await res.json()).sort((a, b) => a.start - b.start);
    renderRibbon();
    renderEras();
  } catch (err) {
    console.error(err);
    $status.textContent =
      "Өгөгдөл ачаалж чадсангүй. Файлыг шууд нээхэд хөтөч JSON-г хаадаг тул локал сервер ажиллуулна уу (жишээ нь: python3 -m http.server).";
  }
}

init();
