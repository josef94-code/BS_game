class_name Lehrer
extends Person
## Der Lehrer (Türschild „Mr. Hö“): stilisierte Figur nach Foto – braune Haare mit Tolle,
## dunkler Nadelstreifenanzug, weinrote Krawatte. Im Stil eines Paten: gegelt, Bartschatten,
## prüfender Blick, Einstecktuch und Siegelring, im Stand mit verschränkten Armen.


func _init() -> void:
	super({
		"haut": Color(0.9, 0.72, 0.6),
		"haare": Color(0.25, 0.15, 0.08),
		"frisur": "tolle",
		"augenfarbe": Color(0.33, 0.27, 0.18),
		"bart": 0.42,
		"haaransatz": 0.27,
		"ausdruck": "ernst",
		"augenringe": 0.6,
		"kiefer": 1.15,
		"jacke": Color(0.25, 0.26, 0.3),
		"jacke_textur": "nadelstreifen",
		"hose": Color(0.25, 0.26, 0.3),
		"hose_textur": "nadelstreifen",
		"hemd": Color(0.93, 0.92, 0.88),
		"krawatte": Color(0.45, 0.04, 0.09),
		"einstecktuch": Color(0.5, 0.05, 0.1),
		"ring": true,
		"anzug": true,
		"haltung": "verschraenkt",
		"breite": 1.04,
	})
