const $timeline = document.getElementById("timeline");
const $search = document.getElementById("search");
const $count = document.getElementById("count");
const $status = document.getElementById("status");

let eras = [];

function highlight(text, q) {
  const safe = escapeHtml(text);
  if (!q) return safe;
  const re = new RegExp(`(${escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return safe.replace(re, "<mark>$1</mark>");
}

function matches(era, q) {
  if (!q) return true;
  const haystack = [era.name, era.group, era.summary, era.capital ?? "", ...(era.figures ?? []), ...era.events.map((e) => e.title)]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function renderEra(era, q) {
  const capital = era.capital ? `<div class="meta">Нийслэл: ${highlight(era.capital, q)}</div>` : "";
  const figures = era.figures?.length
    ? `<div class="tags">${era.figures.map((f) => `<span class="tag">${highlight(f, q)}</span>`).join("")}</div>`
    : "";
  const events = era.events.length
    ? `<ol class="events">${era.events
        .map((ev) => `<li><span class="y">${ev.approx ? "~" : ""}${formatYear(ev.year)}</span><span>${highlight(ev.title, q)}</span></li>`)
        .join("")}</ol>`
    : "";

  return `
    <li class="era" id="${era.id}">
      <div class="years">${formatRange(era)}</div>
      <h3>${highlight(era.name, q)}</h3>
      ${capital}
      <p>${highlight(era.summary, q)}</p>
      ${figures}
      ${events}
    </li>`;
}

function render() {
  const q = $search.value.trim();
  const visible = eras.filter((e) => matches(e, q));

  // Consecutive eras that share a group are shown under one heading
  const groups = [];
  for (const era of visible) {
    const last = groups.at(-1);
    if (last && last.name === era.group) last.eras.push(era);
    else groups.push({ name: era.group, eras: [era] });
  }

  $timeline.innerHTML = groups
    .map(
      (g) => `
      <section class="group">
        <h2>${highlight(g.name, q)}</h2>
        <ol class="line">${g.eras.map((era) => renderEra(era, q)).join("")}</ol>
      </section>`
    )
    .join("");

  $count.textContent = `${visible.length} / ${eras.length} үе`;
  $status.textContent = visible.length ? "" : "Илэрц олдсонгүй.";
}

$search.addEventListener("input", render);

async function init() {
  $status.textContent = "Ачааллаж байна…";
  try {
    eras = (await loadJson("data/eras.json")).sort((a, b) => a.start - b.start);
    render();
  } catch (err) {
    console.error(err);
    $status.textContent = LOAD_ERROR;
  }
}

init();
