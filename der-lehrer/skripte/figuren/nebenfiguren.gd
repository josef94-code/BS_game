class_name Nebenfiguren
## Aussehen der Auftraggeber im Erdgeschoss.


## Hausmeister Kowalski: grauer Schnauzer, Schirmmütze, Arbeitsanzug aus Jeansstoff
static func kowalski() -> Person:
	var p := Person.new({
		"haut": Color(0.9, 0.72, 0.6),
		"haare": Color(0.58, 0.57, 0.55),
		"frisur": "kurz",
		"augenfarbe": Color(0.3, 0.42, 0.58),
		"bart": 0.45,
		"schnurrbart": true,
		"haaransatz": 0.36,
		"jacke": Color(0.3, 0.4, 0.55),
		"jacke_textur": "jeans",
		"hose": Color(0.3, 0.4, 0.55),
		"hose_textur": "jeans",
		"schuhe": Color(0.22, 0.14, 0.08),
		"sohle": Color(0.1, 0.08, 0.06),
		"muetze": Color(0.16, 0.22, 0.32),
		"anzug": false,
		"aufdruck_hinten": "HAUSMEISTER",
		"breite": 1.12,
	})
	return p


## Rosalita, Chefin der Cafeteria: Haarknoten, weiße Kochjacke, rosa Schürze
static func rosalita() -> Person:
	var p := Person.new({
		"haut": Color(0.8, 0.58, 0.43),
		"haare": Color(0.1, 0.06, 0.05),
		"frisur": "dutt",
		"augenfarbe": Color(0.25, 0.15, 0.08),
		"lippen": Color(0.72, 0.12, 0.2),
		"wangen": 1.6,
		"wimpern": true,
		"haaransatz": 0.25,
		"jacke": Color(0.95, 0.95, 0.93),
		"hose": Color(0.18, 0.18, 0.2),
		"schuhe": Color(0.9, 0.9, 0.88),
		"sohle": Color(0.3, 0.3, 0.3),
		"schuerze": Color(0.88, 0.36, 0.5),
		"anzug": false,
		"breite": 0.95,
	})
	p.arbeitet = true
	return p
