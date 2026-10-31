"""Build data/land.json, the background map, from Natural Earth (public domain).

Usage: python3 tools/build_land.py <ne_50m_land.geojson> <ne_50m_lakes.geojson>

Keeps land and large lakes from Europe to the Pacific, rounded to 2 decimals.
Drawing our own land layer means the map has no foreign-language place names
and does not depend on a tile service.
"""
import json, sys

land_path, lakes_path = sys.argv[1:3]

# Europe, the Middle East, Central and East Asia
WEST, EAST, SOUTH, NORTH = -15, 180, 0, 82
MIN_LAND_SPAN = 0.5  # degrees; drops tiny islands
MIN_LAKE_SPAN = 1.5  # degrees; drops small lakes that would only add noise


def rings(geom):
    return [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]


def bbox(polygon):
    xs = [c[0] for c in polygon[0]]
    ys = [c[1] for c in polygon[0]]
    return min(xs), min(ys), max(xs), max(ys)


def in_view(b):
    return b[0] < EAST and b[2] > WEST and b[1] < NORTH and b[3] > SOUTH


def rnd(polygon):
    return [[[round(x, 2), round(y, 2)] for x, y, *_ in ring] for ring in polygon]


def keep(path, min_span=0):
    out = []
    for f in json.load(open(path))["features"]:
        for p in rings(f["geometry"]):
            b = bbox(p)
            if in_view(b) and max(b[2] - b[0], b[3] - b[1]) >= min_span:
                out.append(rnd(p))
    return {"type": "MultiPolygon", "coordinates": out}


out = {
    "source": "Natural Earth 1:50m (public domain), https://www.naturalearthdata.com",
    "land": keep(land_path, MIN_LAND_SPAN),
    "lakes": keep(lakes_path, MIN_LAKE_SPAN),
}
json.dump(out, open("data/land.json", "w"), separators=(",", ":"))
print("wrote data/land.json:", len(out["land"]["coordinates"]), "land polygons,", len(out["lakes"]["coordinates"]), "lakes")
