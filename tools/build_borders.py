"""Build data/borders.json from aourednik/historical-basemaps.

Usage: python3 tools/build_borders.py <dir with world_*.geojson> <source commit sha>

For each era, picks the snapshot year that best represents it and copies the
matching polygons, renamed in Mongolian. Eras without a usable polygon get a
note instead. Coordinates are rounded to 3 decimals to keep the file small.
"""
import json, sys

src_dir, sha = sys.argv[1], sys.argv[2]

# era id -> (snapshot file year, [(source NAME, Mongolian label, role)], note)
# role "main" is the era's own state; "vassal" is a subject or dependent territory.
ERAS = {
    "chuluun": (None, [], "Энэ үед улс төрийн хил хязгаар байгаагүй тул газрын зураг үзүүлэхгүй."),
    "khurel": ("bc3000", [("Afanasevo", "Афанасьевын соёл", "main")], "МЭӨ 3000 оны байдлаар. Зөвхөн Афанасьевын соёлын тархалтыг харуулав."),
    "tumur": ("bc500", [("Proto-Altaic pastoralists", "Нүүдэлчин малчин аймгууд", "main")], "МЭӨ 500 оны байдлаар."),
    "khunnu": ("bc200", [("Xiongnu", "Хүннү", "main")], "МЭӨ 200 оны байдлаар."),
    "syanbi": (None, [], "Эх сурвалжид Сяньби улсын хилийн өгөгдөл байхгүй."),
    "nirun": ("500", [("Ruanruan", "Нирун (Жужан)", "main")], "МЭ 500 оны байдлаар."),
    "tureg": ("600", [("Göktürks", "Түрэг", "main")], "МЭ 600 оны байдлаар."),
    "uigur": ("800", [("Uyghurs", "Уйгур", "main")], "МЭ 800 оны байдлаар."),
    "kidan": ("1000", [("Liao", "Кидан (Ляо)", "main")], "МЭ 1000 оны байдлаар."),
    "ikh-mongol": ("1279", [
        ("Great Khanate", "Их Юань улс", "main"),
        ("Chagatai Khanate", "Цагаадайн улс", "main"),
        ("Khanate of the Golden Horde", "Алтан Ордны улс", "main"),
        ("Ilkhanate", "Ил хаант улс", "main"),
        ("Tibet", "Төвд (харьяат)", "vassal"),
        ("Novgorod", "Новгород (харьяат)", "vassal"),
        ("Ryazan", "Рязань (харьяат)", "vassal"),
        ("Seljuk Caliphate", "Сельжук (харьяат)", "vassal"),
    ], "1279 оны байдлаар — эзэнт гүрэн дөрвөн улсад хуваагдсан үе."),
    "khoit-yuan": ("1650", [("central Asian khanates", "Монголын хаант улсууд", "main")], "1650 оны байдлаар — Халх, Ойрадын хаант улсууд."),
    "manj": ("1800", [("Qing Empire", "Манж Чин улс", "main")], "1800 оны байдлаар — Монгол нутаг Чин улсын бүрэлдэхүүнд."),
    "bogd": ("1914", [("Mongolia", "Богд хаант Монгол Улс", "main")], "1914 оны байдлаар."),
    "bnmau": ("1960", [("Mongolia", "БНМАУ", "main")], "1960 оны байдлаар."),
    "ardchilsan": ("2010", [("Mongolia", "Монгол Улс", "main")], "2010 оны байдлаар."),
}


def is_speck(geom):
    # Some snapshots carry stray slivers under a degree across; they would only add a duplicate label
    ps = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
    xs = [c[0] for p in ps for c in p[0]]
    ys = [c[1] for p in ps for c in p[0]]
    return max(xs) - min(xs) < 1 and max(ys) - min(ys) < 1


def rnd(c):
    if isinstance(c[0], (int, float)):
        return [round(c[0], 3), round(c[1], 3)]
    return [rnd(x) for x in c]


out = {"source": f"https://github.com/aourednik/historical-basemaps/tree/{sha}", "license": "GPL-3.0", "eras": {}}
for era_id, (year, picks, note) in ERAS.items():
    features = []
    if year:
        fc = json.load(open(f"{src_dir}/world_{year}.geojson"))
        for name, label, role in picks:
            found = [
                f for f in fc["features"]
                if f["properties"].get("NAME") == name and f.get("geometry") and not is_speck(f["geometry"])
            ]
            if not found:
                sys.exit(f"{era_id}: no feature named {name!r} in world_{year}")
            for f in found:
                g = f["geometry"]
                features.append({
                    "type": "Feature",
                    "properties": {"name": label, "role": role},
                    "geometry": {"type": g["type"], "coordinates": rnd(g["coordinates"])},
                })
    out["eras"][era_id] = {"sourceYear": year, "note": note, "geojson": {"type": "FeatureCollection", "features": features}}

json.dump(out, open("data/borders.json", "w"), ensure_ascii=False, separators=(",", ":"))
print("wrote data/borders.json")
