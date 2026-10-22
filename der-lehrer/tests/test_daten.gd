extends SceneTree
## Prüft die JSON-Daten: Verweise, Rechenausdrücke, Musterlösungen.
## Aufruf: godot --headless -s tests/test_daten.gd

const Logik := preload("res://skripte/autoload/aufgaben_logik.gd")
const DatenSkript := preload("res://skripte/autoload/daten.gd")

var fehler := 0

## Testfälle je Schaltungsaufgabe: gleichwertige richtige Belegungen und typische Fehler
const SCHALTUNG_VARIANTEN := {
	"st_selbsthaltung": {
		"richtig": [{"L1": "SJ1_NC", "L2": "QA1_NO", "L3": "SJ2_NO"}],
		"falsch": [
			{"L1": "SJ1_NC", "L2": "SJ2_NO", "L3": "BRUECKE"},
			{"L1": "SJ1_NC", "L2": "SJ2_NO", "L3": "QA1_NC"},
			{"L1": "SJ2_NO", "L2": "SJ1_NC", "L3": "QA1_NO"},
			{"L1": "BRUECKE", "L2": "SJ2_NO", "L3": "QA1_NO"},
		],
	},
	"st_zwei_stellen": {
		"richtig": [
			{"L1": "SJ3_NC", "L2": "SJ1_NC", "L3": "SJ2_NO", "L4": "SJ4_NO", "L5": "QA1_NO"},
			{"L1": "SJ1_NC", "L2": "SJ3_NC", "L3": "QA1_NO", "L4": "SJ2_NO", "L5": "SJ4_NO"},
			{"L1": "SJ1_NC", "L2": "SJ3_NC", "L3": "SJ4_NO", "L4": "QA1_NO", "L5": "SJ2_NO"},
		],
		"falsch": [
			{"L1": "SJ1_NC", "L2": "SJ3_NO", "L3": "SJ2_NO", "L4": "SJ4_NO", "L5": "QA1_NO"},
			{"L1": "SJ1_NC", "L2": "BRUECKE", "L3": "SJ2_NO", "L4": "SJ4_NO", "L5": "QA1_NO"},
			{"L1": "SJ1_NC", "L2": "SJ3_NC", "L3": "SJ2_NO", "L4": "SJ4_NO", "L5": "BRUECKE"},
			{"L1": "SJ1_NC", "L2": "SJ3_NC", "L3": "SJ2_NO", "L4": "SJ4_NO", "L5": "SJ3_NO"},
			{"L1": "SJ1_NC", "L2": "SJ3_NC", "L3": "SJ2_NO", "L4": "BRUECKE", "L5": "QA1_NO"},
			{"L1": "SJ2_NO", "L2": "SJ4_NO", "L3": "SJ1_NC", "L4": "SJ3_NC", "L5": "QA1_NO"},
			{"L1": "SJ1_NC", "L2": "QA1_NO", "L3": "SJ2_NO", "L4": "SJ4_NO", "L5": "SJ3_NC"},
		],
	},
	"st_wende": {
		"richtig": [{"L1": "QA3_NC", "L2": "SJ3_NC", "L3": "QA2_NC", "L4": "SJ2_NC"}],
		"falsch": [
			{"L1": "SJ3_NC", "L2": "QA2_NC", "L3": "SJ2_NC", "L4": "QA3_NC"},
			{"L1": "SJ2_NC", "L2": "QA3_NC", "L3": "SJ3_NC", "L4": "QA2_NC"},
			{"L1": "SJ3_NC", "L2": "QA3_NO", "L3": "SJ2_NC", "L4": "QA2_NC"},
			{"L1": "QA3_NC", "L2": "QA2_NO", "L3": "SJ2_NC", "L4": "QA2_NC"},
		],
	},
	"st_folge": {
		"richtig": [
			{"L1": "SJ3_NC", "L2": "QA2_NO", "L3": "SJ4_NO", "L4": "QA1_NO"},
			{"L1": "QA2_NO", "L2": "SJ3_NC", "L3": "QA1_NO", "L4": "SJ4_NO"},
			# Selbsthaltung über den zweiten Schließer 43–44 funktioniert ebenso
			{"L1": "QA2_NO", "L2": "SJ3_NC", "L3": "SJ4_NO", "L4": "QA1_43"},
		],
		"falsch": [
			{"L1": "BRUECKE", "L2": "SJ3_NC", "L3": "SJ4_NO", "L4": "QA1_NO"},
			{"L1": "QA2_NC", "L2": "SJ3_NC", "L3": "SJ4_NO", "L4": "QA1_NO"},
			{"L1": "QA1_43", "L2": "SJ3_NC", "L3": "SJ4_NO", "L4": "QA1_NO"},
			{"L1": "QA2_NO", "L2": "SJ3_NC", "L3": "SJ4_NO", "L4": "BRUECKE"},
			{"L1": "QA2_NO", "L2": "BRUECKE", "L3": "SJ4_NO", "L4": "QA1_NO"},
		],
	},
}


func pruefe(bedingung: bool, text: String) -> void:
	if not bedingung:
		fehler += 1
		printerr("FEHLER: " + text)


func _init() -> void:
	var aufgaben: Dictionary = DatenSkript.lade("res://daten/aufgaben.json")
	aufgaben.erase("_info")
	var quests: Dictionary = DatenSkript.lade("res://daten/quests.json")
	var dialoge: Dictionary = DatenSkript.lade("res://daten/dialoge.json")
	var beweise: Dictionary = DatenSkript.lade("res://daten/beweise.json")

	var personen := ["lehrer", "kowalski", "rosalita", "bradley", "sparky"]
	for q in quests["quests"]:
		var geber: String = q.get("auftraggeber", "lehrer")
		pruefe(geber in personen, "%s: unbekannter Auftraggeber %s" % [q["id"], geber])
		pruefe(dialoge.get("sprecher", {}).has(geber), "%s: Sprecher %s fehlt" % [q["id"], geber])
		for k in ["_aktiv", "_abgelehnt", "_leerlauf"]:
			pruefe(dialoge.has(geber + k), "%s: Dialog %s fehlt" % [q["id"], geber + k])
		for k in ["dialog_start", "dialog_ende"]:
			pruefe(dialoge.has(q[k]), "%s: Dialog %s fehlt" % [q["id"], q[k]])
		pruefe(beweise["beweise"].has(q["beweis"]), "%s: Beweis fehlt" % q["id"])
		for aid in q["aufgaben"]:
			pruefe(aufgaben.has(aid), "%s: Aufgabe %s fehlt" % [q["id"], aid])

	for id in aufgaben:
		var a: Dictionary = aufgaben[id]
		pruefe(a.has("tipps") and a["tipps"].size() >= 1, id + ": keine Tipps")
		pruefe(a.has("erklaerung"), id + ": keine Erklärung")
		match a["typ"]:
			"berechnung":
				for saat in 60:
					var w := Logik.werte(id, aufgaben, saat)
					var erg := float(w["ERG"])
					pruefe(not is_nan(erg) and erg > 0.0, "%s: Ergebnis ungültig (%s)" % [id, w])
					var text := Logik.text(a["frage"], w)
					pruefe(not text.contains("{"), "%s: Platzhalter nicht ersetzt: %s" % [id, text])
					# Eingabe mit Komma und gerundetem Wert muss akzeptiert werden
					var eingabe := Logik.zahl_gueltig(erg)
					pruefe(Logik.zahl_richtig(Logik.zahl_lesen(eingabe), erg, float(a["toleranz"])),
						"%s: gerundete Lösung %s wird nicht akzeptiert" % [id, eingabe])
			"mc":
				for r in a["richtig"]:
					pruefe(int(r) >= 0 and int(r) < a["optionen"].size(), id + ": richtig-Index ungültig")
				pruefe(Logik.mc_richtig(a, a["richtig"].map(func(x): return int(x))), id + ": Musterlösung falsch")
			"sortieren":
				pruefe(Logik.sortieren_richtig(a, a["elemente"].duplicate()), id + ": Sortierung")
			"fehlersuche":
				var n := 0
				for k in a["bauteile"]:
					if a["bauteile"][k].get("fehler", false):
						n += 1
				pruefe(n == 1, id + ": genau ein Fehler erwartet")
			"schaltung":
				pruefe(Logik.schaltung_richtig(a, a["loesung_belegung"]), id + ": Musterlösung besteht Prüfung nicht")
				for schritt in a["pruefung"]:
					for sp in Logik.spulen(a):
						pruefe(schritt.has(sp), "%s: Prüfschritt ohne Sollwert für %s: %s" % [id, sp, schritt["text"]])
				var v: Dictionary = SCHALTUNG_VARIANTEN.get(id, {})
				pruefe(not v.is_empty(), id + ": keine Testvarianten in SCHALTUNG_VARIANTEN")
				# gleichwertige Lösungen (vertauschte Reihen- oder Parallelzweige) sind ebenfalls richtig
				for b in v.get("richtig", []):
					pruefe(Logik.schaltung_richtig(a, b), "%s: richtige Variante abgelehnt: %s" % [id, b])
				# typische Fehler müssen erkannt werden
				for b in v.get("falsch", []):
					pruefe(not Logik.schaltung_richtig(a, b), "%s: falsche Schaltung akzeptiert: %s" % [id, b])

	# Zahlen lesen
	pruefe(is_equal_approx(Logik.zahl_lesen("0,25 A"), 0.25), "zahl_lesen Komma")
	pruefe(is_equal_approx(Logik.zahl_lesen(" 11.5Ω"), 11.5), "zahl_lesen Punkt")
	pruefe(is_nan(Logik.zahl_lesen("abc")), "zahl_lesen Text")
	pruefe(Logik.zahl_gueltig(0.15652) == "0,157", "drei gültige Stellen 0,157")
	pruefe(Logik.zahl_gueltig(60.0) == "60,0", "drei gültige Stellen 60,0")
	pruefe(Logik.zahl_gueltig(28.75) == "28,8", "drei gültige Stellen 28,8")

	# Türen und Beweise
	for tuer in quests.get("tueren", {}):
		var nach: String = quests["tueren"][tuer]
		pruefe(quests["quests"].any(func(q): return q["id"] == nach), "Tür %s: Mission %s fehlt" % [tuer, nach])
	print("Datenprüfung: %d Aufgaben, %d Quests – %s" % [aufgaben.size(), quests["quests"].size(), "OK" if fehler == 0 else "%d FEHLER" % fehler])
	quit(1 if fehler > 0 else 0)
