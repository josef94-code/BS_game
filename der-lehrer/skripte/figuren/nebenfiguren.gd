class_name Nebenfiguren
## Aussehen der Auftraggeber (außer dem Lehrer).


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


## Coach Bradley: Sportlehrer im Trainingsanzug in Schulfarben, Kappe und Trillerpfeife
static func bradley() -> Person:
	return Person.new({
		"haut": Color(0.55, 0.38, 0.27),
		"haare": Color(0.07, 0.05, 0.04),
		"frisur": "kurz",
		"augenfarbe": Color(0.2, 0.13, 0.08),
		"bart": 0.4,
		"haaransatz": 0.36,
		"jacke": Color(0.52, 0.08, 0.11),
		"jacke_textur": "strick",
		"hose": Color(0.52, 0.08, 0.11),
		"schuhe": Color(0.95, 0.95, 0.93),
		"sohle": Color(0.2, 0.2, 0.2),
		"muetze": Color(0.95, 0.75, 0.2),
		"pfeife": true,
		"anzug": false,
		"aufdruck_vorne": "LIONS",
		"aufdruck_hinten": "COACH",
		"breite": 1.1,
	})


## Sparky Russo: Abschlussklasse, Werkstattdienst – Arbeitsjacke, Schutzbrille auf der Stirn
static func sparky() -> Person:
	return Person.new({
		"haut": Color(0.92, 0.75, 0.6),
		"haare": Color(0.12, 0.08, 0.05),
		"frisur": "tolle",
		"augenfarbe": Color(0.25, 0.45, 0.3),
		"bart": 0.12,
		"haaransatz": 0.3,
		"jacke": Color(0.88, 0.45, 0.12),
		"jacke_textur": "strick",
		"hose": Color(0.22, 0.24, 0.28),
		"hose_textur": "jeans",
		"schuhe": Color(0.3, 0.2, 0.1),
		"sohle": Color(0.1, 0.08, 0.06),
		"brille": Color(0.75, 0.9, 1.0, 0.45),
		"anzug": false,
		"aufdruck_hinten": "SPARKY",
		"breite": 0.98,
	})


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


## Vince Moretti, Abschlussklasse, Anführer der Black Roses: schwarze Jacke mit Rosen-Schriftzug
static func vince() -> Person:
	return Person.new({
		"haut": Color(0.9, 0.73, 0.6),
		"haare": Color(0.05, 0.04, 0.04),
		"frisur": "tolle",
		"augenfarbe": Color(0.2, 0.18, 0.15),
		"bart": 0.25,
		"haaransatz": 0.28,
		"jacke": Color(0.07, 0.07, 0.08),
		"hose": Color(0.12, 0.13, 0.16),
		"hose_textur": "jeans",
		"schuhe": Color(0.05, 0.05, 0.05),
		"sohle": Color(0.9, 0.9, 0.88),
		"anzug": false,
		"aufdruck_hinten": "BLACK ROSES",
		"breite": 0.97,
	})
