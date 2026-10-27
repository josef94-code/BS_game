class_name Statisten
## Aussehen der Schülerinnen und Schüler, die durch die Schule laufen (Statisten).
## Zufällig aus Bausteinen zusammengesetzt, aber reproduzierbar (Saat).

const HAUT := [Color(0.93, 0.76, 0.63), Color(0.86, 0.66, 0.5), Color(0.74, 0.54, 0.4), Color(0.58, 0.4, 0.28),
	Color(0.42, 0.28, 0.2), Color(0.95, 0.8, 0.7)]
const HAARE := [Color(0.06, 0.05, 0.04), Color(0.16, 0.1, 0.06), Color(0.3, 0.18, 0.09), Color(0.72, 0.56, 0.32),
	Color(0.42, 0.18, 0.08), Color(0.1, 0.08, 0.07)]
const OBEN := [Color(0.15, 0.2, 0.35), Color(0.5, 0.08, 0.12), Color(0.2, 0.2, 0.22), Color(0.25, 0.4, 0.3),
	Color(0.85, 0.85, 0.82), Color(0.9, 0.55, 0.15), Color(0.35, 0.3, 0.45), Color(0.6, 0.6, 0.62), Color(0.12, 0.3, 0.55)]
const UNTEN := [[Color(0.3, 0.4, 0.6), "jeans"], [Color(0.18, 0.22, 0.32), "jeans"], [Color(0.12, 0.12, 0.14), ""],
	[Color(0.5, 0.45, 0.35), ""], [Color(0.45, 0.45, 0.47), "strick"]]
const SCHUHE := [[Color(0.92, 0.92, 0.9), Color(0.8, 0.8, 0.78)], [Color(0.08, 0.08, 0.08), Color(0.9, 0.9, 0.88)],
	[Color(0.7, 0.12, 0.12), Color(0.95, 0.95, 0.95)], [Color(0.25, 0.18, 0.1), Color(0.1, 0.08, 0.06)]]
const AUFDRUCK := ["LIONS", "#23", "MT11", "LINCOLN", "", "", "ELEKTRO", "#7", "LIONS\nFAN", "", "KFZ 10B"]
const AUSDRUCK := ["ernst", "skeptisch", "muede", "arrogant", "angespannt", "ernst", "muede", "warm"]


## anzahl Stile ab Saat; jeder Stil ist ein Dictionary für Figur/Person
static func stile(anzahl: int, saat: int) -> Array[Dictionary]:
	var liste: Array[Dictionary] = []
	for i in anzahl:
		liste.append(stil(saat * 97 + i * 13))
	return liste


static func stil(saat: int) -> Dictionary:
	var rng := RandomNumberGenerator.new()
	rng.seed = saat
	var weiblich := rng.randf() < 0.42
	var haar: Color = HAARE[rng.randi_range(0, HAARE.size() - 1)]
	var oben: Color = OBEN[rng.randi_range(0, OBEN.size() - 1)]
	var unten: Array = UNTEN[rng.randi_range(0, UNTEN.size() - 1)]
	var schuh: Array = SCHUHE[rng.randi_range(0, SCHUHE.size() - 1)]
	var s := {
		"haut": HAUT[rng.randi_range(0, HAUT.size() - 1)],
		"haare": haar,
		"augenfarbe": [Color(0.3, 0.2, 0.1), Color(0.2, 0.35, 0.5), Color(0.25, 0.35, 0.2)][rng.randi_range(0, 2)],
		"ausdruck": AUSDRUCK[rng.randi_range(0, AUSDRUCK.size() - 1)],
		"jacke": oben,
		"jacke_textur": "strick" if rng.randf() < 0.6 else "",
		"hose": unten[0],
		"hose_textur": unten[1],
		"schuhe": schuh[0],
		"sohle": schuh[1],
		"anzug": false,
		"kapuze": rng.randf() < 0.45,
		"einfach": true,
		"haaransatz": rng.randf_range(0.27, 0.34),
		"breite": rng.randf_range(0.88, 0.98),
	}
	if weiblich:
		s["frisur"] = ["lang", "zopf", "dutt", "lang", "locken"][rng.randi_range(0, 4)]
		s["wimpern"] = true
		s["huefte"] = 1.1
		s["breite"] = rng.randf_range(0.85, 0.9)
		s["kiefer"] = 0.8
		s["haaransatz"] = 0.25
		s["lippen"] = Color(s["haut"]).darkened(0.25).lerp(Color(0.7, 0.3, 0.32), 0.45)
	else:
		s["frisur"] = ["kurz", "buzz", "locken", "kurz", "gegelt"][rng.randi_range(0, 4)]
		s["bart"] = rng.randf_range(0.0, 0.2)
		s["kiefer"] = rng.randf_range(1.0, 1.15)
	if rng.randf() < 0.5:
		s["rucksack"] = [Color(0.15, 0.15, 0.17), Color(0.2, 0.3, 0.5), Color(0.55, 0.12, 0.12), Color(0.3, 0.35, 0.25)][rng.randi_range(0, 3)]
	if rng.randf() < 0.2 and s["frisur"] != "dutt":
		s["muetze"] = [Color(0.1, 0.1, 0.12), Color(0.52, 0.08, 0.11), Color(0.95, 0.75, 0.2)][rng.randi_range(0, 2)]
	elif rng.randf() < 0.15:
		s["kopfhoerer"] = [Color(0.05, 0.05, 0.05), Color(0.9, 0.9, 0.9), Color(0.8, 0.15, 0.2)][rng.randi_range(0, 2)]
	s["aufdruck_hinten"] = AUFDRUCK[rng.randi_range(0, AUFDRUCK.size() - 1)]
	return s


## Mitglied der „Black Roses“: schwarze Jacke, Rose, Sonnenbrille, gelangweilt-arroganter Blick
static func black_rose(saat: int) -> Dictionary:
	var s := stil(saat)
	s["jacke"] = Color(0.07, 0.07, 0.08)
	s["jacke_textur"] = ""
	s["kapuze"] = false
	s["hose"] = Color(0.1, 0.1, 0.12)
	s["hose_textur"] = "jeans"
	s["ausdruck"] = "arrogant"
	s["aufdruck_hinten"] = "BLACK\nROSES"
	s["aufdruck_farbe"] = Color(0.75, 0.1, 0.15)
	s.erase("rucksack")
	s.erase("kopfhoerer")
	if saat % 2 == 0:
		s["sonnenbrille"] = true
	return s
