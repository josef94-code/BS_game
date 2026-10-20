extends Node
## Automatischer Durchlauf aller Missionen mit Bildschirmfotos (Start mit --autotest).
## Dient zur Qualitätssicherung: prüft, dass das Spiel von vorne bis hinten durchläuft.

var spiel
var _ordner := "user://autotest"
var _nr := 0


func _ready() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--shots="):
			_ordner = a.substr(8)
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

	for q in Daten.quests:
		# Auftrag beim Paten annehmen
		spiel.spieler.global_position = spiel.pate_vorne()
		spiel.spieler.setze_blick(PI)
		await _warte(0.4)
		await _foto(q["id"] + "_buero")
		spiel.interagieren("pate")
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
		var st: Interaktiv = spiel.keller.stationen[q["station"]]
		var richtung: Vector3 = (st.global_position - spiel.keller.pate_pos).normalized()
		spiel.spieler.global_position = st.global_position - richtung * 0.6
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
		spiel.spieler.global_position = spiel.pate_vorne()
		spiel.interagieren("pate")
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
	var pfad := _ordner + "/test.pate"
	var f := Spielstand.speichern(pfad)
	var ruf := Spielstand.ruf()
	var l := Spielstand.laden(pfad)
	if f != "" or l != "" or Spielstand.ruf() != ruf:
		push_error("Speichern/Laden fehlerhaft: %s %s" % [f, l])
		fehler += 1
	print("AUTOTEST ENDE – Ruf %d, Rang %s, Fehler: %d" % [Spielstand.ruf(), Spielstand.rang(), fehler])
	get_tree().quit(1 if fehler > 0 else 0)
