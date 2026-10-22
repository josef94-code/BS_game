extends Node
## Automatischer Durchlauf aller Missionen mit Bildschirmfotos (Start mit --autotest).
## Dient zur Qualitätssicherung: prüft, dass das Spiel von vorne bis hinten durchläuft.

var spiel
var _ordner := "user://autotest"
var _nr := 0
var _fehler_bereiche := 0
## --ab=<quest-id>: frühere Missionen als erledigt setzen (schneller Test späterer Akte)
var _ab := ""


func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--shots="):
			_ordner = a.substr(8)
		elif a.begins_with("--ab="):
			_ab = a.substr(5)
	DirAccess.make_dir_recursive_absolute(_ordner)
	_ablauf.call_deferred()


func _warte(s: float) -> void:
	await get_tree().create_timer(s).timeout


func _foto(name: String) -> void:
	await RenderingServer.frame_post_draw
	_nr += 1
	var img := get_viewport().get_texture().get_image()
	img.save_png("%s/%02d_%s.png" % [_ordner, _nr, name])
	print("Foto: ", name)


## Wartet, bis das Spiel wieder frei ist: klickt Dialoge weiter und schließt die Bilanz.
func _bis_frei(max_sekunden: float = 90.0) -> void:
	var zeit := 0.0
	var bilanz_foto := false
	while (spiel._beschaeftigt or spiel.dialog.ist_aktiv()) and zeit < max_sekunden:
		await _warte(0.2)
		zeit += 0.2
		if spiel.dialog.ist_aktiv():
			spiel.dialog.automatisch_weiter()
		var bilanz: Node = spiel.get_node_or_null("Bilanz")
		if bilanz:
			if not bilanz_foto:
				bilanz_foto = true
				await _warte(0.5)
				await _foto("bilanz")
			for b in bilanz.find_children("*", "Button", true, false):
				(b as Button).pressed.emit()
	if zeit >= max_sekunden:
		push_error("Zeitüberschreitung beim Warten")


func _ablauf() -> void:
	var fehler := 0
	await _warte(1.0)
	spiel.intro()
	await _warte(2.5)
	await _foto("intro")
	await _warte(5.0)
	await _foto("intro_lampe")
	spiel.sequenz.ueberspringen()
	await _warte(0.6)
	await _foto("start")
	spiel.spieler.global_position = Vector3(-4, 0, 3)
	spiel.spieler.setze_blick(-2.3)
	await _warte(0.5)
	await _foto("keller_ueberblick")

	if _ab != "":
		for q in Daten.quests:
			if q["id"] == _ab:
				break
			Spielstand.setze_quest_status(q["id"], "erledigt")
			Spielstand.beweis_dazu(q["beweis"])
			Spielstand.ruf_dazu(int(q["ruf"]))
		spiel._welt_aus_spielstand()
		spiel._ziel_aktualisieren()
	for q in Daten.quests:
		if Spielstand.quest_status(q["id"]) == "erledigt":
			continue
		var geber: String = q.get("auftraggeber", "lehrer")
		match q["id"]:
			"q05_leitung":
				await _tuer_testen("tuer", spiel.erdgeschoss, [["flur_west", Vector3(-12.0, 0, 0.0), -PI / 2.0],
					["flur_ost", Vector3(4.0, 0, 0.5), -PI / 2.0], ["flur_rueck", Vector3(6.0, 0, -0.5), PI / 2.0],
					["cafeteria", Vector3(16.0, 0, 0.0), -PI / 2.0 - 0.3], ["cafeteria_band", Vector3(22.0, 0, -1.5), -PI / 2.0 + 0.5],
					["cafeteria_theke", Vector3(26.0, 0, 1.5), -PI / 2.0 + 0.2]])
			"q08_halle":
				await _tuer_testen("turnhalle", spiel.turnhalle, [["turnhalle_eingang", Vector3(-10.0, 0, 7.0), -0.6],
					["turnhalle_feld", Vector3(-8.0, 0, 0.0), -PI / 2.0], ["turnhalle_tribuene", Vector3(4.0, 0, 5.0), 0.2],
					["turnhalle_tafel", Vector3(4.0, 0, -2.0), -PI / 2.0 - 0.2]])
			"q10_absaugung":
				await _tuer_testen("turnhalle_raus", spiel.erdgeschoss, [])
				await _tuer_testen("werkstatt", spiel.werkstatt, [["werkstatt_eingang", Vector3(-9.0, 0, -5.5), PI + 0.6],
					["werkstatt_saege", Vector3(3.0, 0, -1.0), PI / 2.0 + 0.4], ["werkstatt_bank", Vector3(4.0, 0, 1.0), -PI / 2.0 + 0.5],
					["werkstatt_labor", Vector3(1.0, 0, -1.5), 0.0]])
		# Auftrag beim Auftraggeber annehmen
		_vor_person(geber)
		await _warte(0.5)
		await _foto(q["id"] + "_auftraggeber")
		spiel.interagieren(geber)
		await _warte(1.2)
		await _foto(q["id"] + "_dialog")
		while spiel.dialog.ist_aktiv():
			spiel.dialog.automatisch_weiter()
			await _warte(0.15)
		await _warte(1.3)
		await _foto(q["id"] + "_titel")
		await _bis_frei()
		if Spielstand.quest_status(q["id"]) != "aktiv":
			push_error("Quest nicht aktiv: " + q["id"])
			fehler += 1
		# Zur Station
		var st: Interaktiv = spiel.station_finden(q["station"])
		var richtung: Vector3 = (st.global_position - spiel.person_vorne(geber)).normalized()
		spiel.spieler.global_position = st.global_position - richtung * 0.6
		spiel.spieler.setze_blick(atan2(-richtung.x, -richtung.z))
		await _warte(0.5)
		await _foto(q["id"] + "_station")
		spiel.interagieren(q["station"])
		await _warte(0.6)
		var n := 0
		while spiel.aufgaben.ist_offen() and n < 12:
			n += 1
			await _foto(q["id"] + "_aufgabe")
			spiel.aufgaben.automatisch()
			await _warte(0.3)
			if n == 2:
				await _foto(q["id"] + "_geloest")
			spiel.aufgaben.automatisch()
			await _warte(0.4)
		if spiel.aufgaben.ist_offen():
			push_error("Aufgaben nicht lösbar: " + q["id"])
			fehler += 1
			break
		await _warte(1.5)
		await _foto(q["id"] + "_fund")
		await _bis_frei()
		await _warte(1.0)
		if Spielstand.quest_status(q["id"]) != "zurueck":
			push_error("Quest nicht gelöst: " + q["id"])
			fehler += 1
		# Melden
		_vor_person(geber)
		await _warte(0.2)
		spiel.interagieren(geber)
		var m := 0
		while spiel.dialog.ist_aktiv() or m == 0:
			m += 1
			await _warte(0.15)
			spiel.dialog.automatisch_weiter()
		await _warte(0.8)
		await _foto(q["id"] + "_passed")
		await _bis_frei()
		if Spielstand.quest_status(q["id"]) != "erledigt":
			push_error("Quest nicht erledigt: " + q["id"])
			fehler += 1

	# Zurück in den Keller
	spiel.interagieren("treppe")
	await _warte(1.5)
	if spiel.aktueller_bereich != spiel.keller:
		push_error("Treppe in den Keller funktioniert nicht")
		fehler += 1
	# Sammelobjekt, Beweisbrett, Pause
	spiel.interagieren("sammel:s_diode")
	await _warte(0.5)
	await _foto("sammel")
	spiel.brett.oeffnen()
	await _warte(0.4)
	await _foto("beweisbrett")
	spiel.brett.schliessen()
	spiel.pause.oeffnen()
	await _warte(0.3)
	await _foto("pause")
	spiel.pause.schliessen()
	# Speichern und Laden
	spiel._zustand_sichern()
	var pfad := _ordner + "/test.lehrer"
	var f := Spielstand.speichern(pfad)
	var ruf := Spielstand.ruf()
	var l := Spielstand.laden(pfad)
	if f != "" or l != "" or Spielstand.ruf() != ruf:
		push_error("Speichern/Laden fehlerhaft: %s %s" % [f, l])
		fehler += 1
	fehler += _fehler_bereiche
	print("AUTOTEST ENDE – Ruf %d, Rang %s, Fehler: %d" % [Spielstand.ruf(), Spielstand.rang(), fehler])
	get_tree().quit(1 if fehler > 0 else 0)


## Spielfigur vor eine Person stellen, Blick zur Person
func _vor_person(id: String) -> void:
	var vorne: Vector3 = spiel.person_vorne(id)
	var p: Vector3 = (spiel.personen[id]["node"] as Node3D).global_position
	spiel.spieler.global_position = vorne
	var d := p - vorne
	spiel.spieler.setze_blick(atan2(-d.x, -d.z))


## Durch eine Tür gehen, Ankunftsbereich prüfen und Ansichten fotografieren
func _tuer_testen(id: String, ziel: Bereich, ansichten: Array) -> void:
	var tuer: Interaktiv = spiel.station_finden(id)
	spiel.spieler.global_position = tuer.global_position
	await _warte(0.6)
	await _foto("tuer_" + id)
	spiel.interagieren(id)
	await _warte(1.6)
	if spiel.aktueller_bereich != ziel:
		push_error("Tür %s führt nicht nach %s" % [id, ziel.titel])
		_fehler_bereiche += 1
	await _foto("ankunft_" + ziel.titel.to_lower())
	for ansicht in ansichten:
		spiel.spieler.global_position = ziel.to_global(ansicht[1])
		spiel.spieler.setze_blick(ansicht[2])
		await _warte(0.8)
		await _foto(ansicht[0])
