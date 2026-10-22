class_name Lehrer
extends Person
## Der Lehrer (Lehrer Josef): stilisierte Figur nach Foto – kurze braune Haare mit Tolle,
## freundliches Lächeln, dunkler Nadelstreifenanzug, weinrote Krawatte.


func _init() -> void:
	super({
		"haut": Color(0.93, 0.75, 0.62),
		"haare": Color(0.27, 0.16, 0.08),
		"frisur": "tolle",
		"augenfarbe": Color(0.36, 0.3, 0.2),
		"bart": 0.18,
		"haaransatz": 0.27,
		"jacke": Color(0.42, 0.44, 0.5),
		"jacke_textur": "nadelstreifen",
		"hose": Color(0.42, 0.44, 0.5),
		"hose_textur": "nadelstreifen",
		"anzug": true,
		"breite": 1.02,
	})
