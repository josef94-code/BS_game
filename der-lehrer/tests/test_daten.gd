extends SceneTree
## Prüft die JSON-Daten: Verweise, Rechenausdrücke, Musterlösungen.
## Aufruf: godot --headless -s tests/test_daten.gd

const Logik := preload("res://skripte/autoload/aufgaben_logik.gd")
const DatenSkript := preload("res://skripte/autoload/daten.gd")

var fehler := 0


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

	for q in quests["quests"]:
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
				# vertauschte Parallelzweige sind ebenfalls richtig
				var tausch := {"L1": "SJ1_NC", "L2": "QA1_NO", "L3": "SJ2_NO"}
				pruefe(Logik.schaltung_richtig(a, tausch), id + ": vertauschte Parallelzweige abgelehnt")
				# typische Fehler müssen erkannt werden
				var falsch := [
					{"L1": "SJ1_NC", "L2": "SJ2_NO", "L3": "BRUECKE"},
					{"L1": "SJ1_NC", "L2": "SJ2_NO", "L3": "QA1_NC"},
					{"L1": "SJ2_NO", "L2": "SJ1_NC", "L3": "QA1_NO"},
					{"L1": "BRUECKE", "L2": "SJ2_NO", "L3": "QA1_NO"},
				]
				for b in falsch:
					pruefe(not Logik.schaltung_richtig(a, b), "%s: falsche Schaltung akzeptiert: %s" % [id, b])

	# Zahlen lesen
	pruefe(is_equal_approx(Logik.zahl_lesen("0,25 A"), 0.25), "zahl_lesen Komma")
	pruefe(is_equal_approx(Logik.zahl_lesen(" 11.5Ω"), 11.5), "zahl_lesen Punkt")
	pruefe(is_nan(Logik.zahl_lesen("abc")), "zahl_lesen Text")
	pruefe(Logik.zahl_gueltig(0.15652) == "0,157", "drei gültige Stellen 0,157")
	pruefe(Logik.zahl_gueltig(60.0) == "60,0", "drei gültige Stellen 60,0")
	pruefe(Logik.zahl_gueltig(28.75) == "28,8", "drei gültige Stellen 28,8")

	print("Datenprüfung: %d Aufgaben, %d Quests – %s" % [aufgaben.size(), quests["quests"].size(), "OK" if fehler == 0 else "%d FEHLER" % fehler])
	quit(1 if fehler > 0 else 0)
