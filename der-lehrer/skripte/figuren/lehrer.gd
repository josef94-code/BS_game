class_name Lehrer
extends Person
## Der Lehrer (Türschild „Mr. Hö“): stilisierte Figur nach Foto – kurze braune Haare, an den Seiten kurz,
## oben leicht hochgestellt; schmales Gesicht mit Wangenknochen, heller Bartschatten, blaugraue Augen,
## graues Hemd. Im Stil eines Paten: Nadelstreifen-Sakko, weinrote Krawatte, Einstecktuch, Siegelring,
## überlegenes halbes Grinsen, im Stand mit verschränkten Armen.


func _init() -> void:
	super({
		"haut": Color(0.94, 0.77, 0.67),
		"haare": Color(0.24, 0.17, 0.12),
		"frisur": "kurz_hoch",
		"augenfarbe": Color(0.36, 0.46, 0.5),
		"bart": 0.32,
		"haaransatz": 0.25,
		"wangen": 1.4,
		"ausdruck": "ueberlegen",
		"augenringe": 0.35,
		"kiefer": 0.82,
		"kopfbreite": 0.9,
		"ohren": 1.2,
		"jacke": Color(0.24, 0.25, 0.29),
		"jacke_textur": "nadelstreifen",
		"hose": Color(0.24, 0.25, 0.29),
		"hose_textur": "nadelstreifen",
		"hemd": Color(0.58, 0.6, 0.64),
		"krawatte": Color(0.45, 0.04, 0.09),
		"einstecktuch": Color(0.5, 0.05, 0.1),
		"ring": true,
		"anzug": true,
		"haltung": "verschraenkt",
		"breite": 1.0,
	})
