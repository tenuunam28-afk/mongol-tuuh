const $slider = document.getElementById("era-slider");
const $sliderMin = document.getElementById("slider-min");
const $sliderMax = document.getElementById("slider-max");
const $info = document.getElementById("era-info");
const $status = document.getElementById("status");

// Centre of present-day Mongolia, used when an era has no borders to fit
const HOME = { center: [47, 103], zoom: 4 };

// Below this zoom the labels would pile on top of each other, so they only show on hover or tap
const LABEL_ZOOM = 2.5;

const map = L.map("map", { zoomControl: false, zoomSnap: 0.25, minZoom: 1, maxZoom: 7, worldCopyJump: true }).setView(
  HOME.center,
  HOME.zoom
);
L.control.zoom({ zoomInTitle: "Томруулах", zoomOutTitle: "Жижигрүүлэх" }).addTo(map);
map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
map.attributionControl.addAttribution(
  'Хил хязгаар: <a href="https://github.com/aourednik/historical-basemaps">historical-basemaps</a> (GPL-3.0) · ' +
    'Газрын зураг: <a href="https://www.naturalearthdata.com">Natural Earth</a>'
);

let eras = [];
let borders = {};
let layer = null;

function styleFor(feature) {
  return feature.properties.role === "vassal"
    ? { className: "border vassal", weight: 1.5, dashArray: "4 4", fillOpacity: 0.15 }
    : { className: "border main", weight: 2, fillOpacity: 0.3 };
}

function updateLabels() {
  if (!layer) return;
  const permanent = map.getZoom() >= LABEL_ZOOM;
  layer.eachLayer((l) => {
    l.unbindTooltip();
    l.bindTooltip(escapeHtml(l.feature.properties.name), { permanent, direction: "center", className: "map-label" });
  });
}

map.on("zoomend", updateLabels);

function show(index) {
  const era = eras[index];
  const entry = borders[era.id];
  const features = entry?.geojson.features ?? [];

  if (layer) layer.remove();
  layer = L.geoJSON(entry?.geojson, {
    style: styleFor,
    onEachFeature: (f, l) => l.on("click", () => l.openTooltip()),
  }).addTo(map);

  if (features.length) map.fitBounds(layer.getBounds(), { padding: [16, 16], maxZoom: 5 });
  else map.setView(HOME.center, HOME.zoom);
  updateLabels();

  $info.innerHTML = `
    <div class="years">${formatRange(era)} · ${escapeHtml(era.group)}</div>
    <h2>${escapeHtml(era.name)}</h2>
    <p>${escapeHtml(era.summary)}</p>
    <p class="meta">${escapeHtml(entry?.note ?? "Энэ үеийн газрын зураг байхгүй.")}</p>`;

  $slider.setAttribute("aria-valuetext", `${era.name}, ${formatRange(era)}`);
  history.replaceState(null, "", `#${era.id}`);
}

$slider.addEventListener("input", () => show(Number($slider.value)));

// Open the era named in the URL (map.html#ikh-mongol), else the first
function showFromHash() {
  const i = eras.findIndex((e) => e.id === location.hash.slice(1));
  $slider.value = Math.max(i, 0);
  show(Number($slider.value));
}

window.addEventListener("hashchange", showFromHash);

async function init() {
  $status.textContent = "Ачааллаж байна…";
  try {
    const [eraData, borderData, land] = await Promise.all([
      loadJson("data/eras.json"),
      loadJson("data/borders.json"),
      loadJson("data/land.json"),
    ]);
    L.geoJSON(land.land, { interactive: false, style: { className: "land", stroke: false, fillOpacity: 1 } }).addTo(map);
    L.geoJSON(land.lakes, { interactive: false, style: { className: "lake", stroke: false, fillOpacity: 1 } }).addTo(map);
    eras = eraData.sort((a, b) => a.start - b.start);
    borders = borderData.eras;

    $slider.max = eras.length - 1;
    $slider.disabled = false;
    $sliderMin.textContent = formatYear(eras[0].start);
    $sliderMax.textContent = "Өнөө үе";

    showFromHash();
    $status.textContent = "";
  } catch (err) {
    console.error(err);
    $status.textContent = LOAD_ERROR;
  }
}

init();
