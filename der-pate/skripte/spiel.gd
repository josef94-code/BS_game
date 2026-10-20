extends Node3D
## Spielablauf: baut Welt, Figuren und Oberfläche auf und steuert die Missionen
## (Auftrag beim Paten annehmen -> Anlage reparieren -> Beweis finden -> beim Paten melden).

var keller: Keller
var spieler: Spieler
var pate: Pate
var hud: Hud
var dialog: DialogUI
var aufgaben: AufgabenPanel
var brett: Beweisbrett
var pause: PauseMenue
var sequenz: Sequenz
var seq_kamera: Camera3D

var _naechstes: Interaktiv = null
var _beschaeftigt := false
var _radio_an := true
var _radio_timer := 25.0
var _radio_index := 0
var _leerlauf_index := 0


func _ready() -> void:
	get_tree().paused = false
	Spielstand.ui_zuruecksetzen()
	keller = Keller.new()
	add_child(keller)
	pate = Pate.new()
	pate.position = keller.pate_pos
	add_child(pate)
	spieler = Spieler.new()
	add_child(spieler)
	spieler.position = keller.spawn
	spieler.setze_blick(keller.spawn_blick)
	var pos: Array = Spielstand.d.get("pos", [])
	if Spielstand.geladen and pos.size() == 3:
		spieler.position = Vector3(pos[0], pos[1], pos[2])
		spieler.setze_blick(float(Spielstand.d.get("blick", 0.0)))
	seq_kamera = Camera3D.new()
	seq_kamera.fov = 50
	add_child(seq_kamera)

	_nachbearbeitung()
	hud = Hud.new()
	add_child(hud)
	hud.minimap.welt = keller
	hud.minimap.spieler = spieler
	dialog = DialogUI.new()
	add_child(dialog)
	aufgaben = AufgabenPanel.new()
	add_child(aufgaben)
	brett = Beweisbrett.new()
	add_child(brett)
	sequenz = Sequenz.new()
	sequenz.kamera = seq_kamera
	add_child(sequenz)
	pause = PauseMenue.new()
	pause.vor_dem_speichern = _zustand_sichern
	add_child(pause)

	_welt_aus_spielstand()
	_ziel_aktualisieren()
	Audio.musik_an(true)
	if Spielstand.autotest:
		var t := preload("res://skripte/autotest.gd").new()
		t.spiel = self
		add_child(t)
		return
	if not Spielstand.d["intro_gesehen"]:
		await intro()


## PS2-Look (GTA III): Filter über dem 3D-Bild, unter der Oberfläche
func _nachbearbeitung() -> void:
	var ebene := CanvasLayer.new()
	ebene.layer = 1
	add_child(ebene)
	var r := ColorRect.new()
	r.set_anchors_preset(Control.PRESET_FULL_RECT)
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var m := ShaderMaterial.new()
	m.shader = preload("res://shader/ps2_look.gdshader")
	r.material = m
	ebene.add_child(r)


# ---------------------------------------------------------------- Zustand

func _welt_aus_spielstand() -> void:
	for q in Daten.quests:
		if Spielstand.quest_status(q["id"]) in ["zurueck", "erledigt"]:
			_anlage_reparieren(q["id"])
	for id in Spielstand.d["sammel"]:
		keller.sammel_entfernen(id)


func _anlage_reparieren(quest_id: String) -> void:
	match quest_id:
		"q01_licht":
			keller.licht_reparieren()
			keller.schraubendreher_entfernen()
		"q02_glocke":
			keller.glocke_reparieren()
		"q03_band":
			keller.band_starten()


func _zustand_sichern() -> void:
	var p := spieler.global_position
	Spielstand.d["pos"] = [snappedf(p.x, 0.01), snappedf(p.y, 0.01), snappedf(p.z, 0.01)]
	Spielstand.d["blick"] = snappedf(spieler.blick(), 0.001)


func pate_vorne() -> Vector3:
	return keller.pate_pos + Vector3(0, 0, -1.9)


func _ziel_aktualisieren() -> void:
	var q := Spielstand.aktuelle_quest()
	if q.is_empty():
		hud.ziel("Alle Aufträge erledigt. Erkunde den Keller – vielleicht findest du noch verlorene Bauteile.")
		keller.marker_setzen(null)
		hud.minimap.pate_hat_auftrag = false
		return
	match Spielstand.quest_status(q["id"]):
		"offen":
			hud.ziel("Sprich mit dem Paten in seinem Büro.")
			keller.marker_setzen(pate_vorne())
		"aktiv":
			hud.ziel(q["ziel_hin"])
			var st: Interaktiv = keller.stationen.get(q["station"])
			keller.marker_setzen(st.global_position if st else null)
		"zurueck":
			hud.ziel(q["ziel_zurueck"])
			keller.marker_setzen(pate_vorne())
	hud.minimap.pate_hat_auftrag = Spielstand.quest_status(q["id"]) in ["offen", "zurueck"]


# ---------------------------------------------------------------- Schleife & Eingabe

func gesperrt() -> bool:
	return Spielstand.ui_offen() or _beschaeftigt or pause.offen


func _process(delta: float) -> void:
	var g := gesperrt()
	spieler.gesperrt = g
	hud.alles_zeigen(not sequenz.aktiv and not dialog.ist_aktiv())
	if g:
		_naechstes = null
		hud.prompt("")
		if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
			Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	else:
		if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED and not Spielstand.autotest:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
		_naechstes = _suche_interaktiv()
		hud.prompt(_naechstes.hinweis if _naechstes else "")
	# Schulradio
	if _radio_an and not g:
		_radio_timer -= delta
		if _radio_timer <= 0.0:
			_radio_timer = 55.0
			_radio_spielen()


func _unhandled_input(e: InputEvent) -> void:
	if e.is_action_pressed("pause"):
		if brett.offen:
			brett.schliessen()
		elif not sequenz.aktiv and not pause.offen:
			pause.oeffnen()
		get_viewport().set_input_as_handled()
	elif e.is_action_pressed("beweisbrett"):
		if brett.offen:
			brett.schliessen()
		elif not gesperrt():
			brett.oeffnen()
		get_viewport().set_input_as_handled()
	elif e.is_action_pressed("interagieren") and not gesperrt() and _naechstes:
		get_viewport().set_input_as_handled()
		interagieren(_naechstes.id)
	elif e is InputEventMouseButton and e.pressed and not gesperrt():
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _suche_interaktiv() -> Interaktiv:
	var bester: Interaktiv = null
	var abstand := 999.0
	var p := spieler.global_position
	for n in get_tree().get_nodes_in_group("interaktiv"):
		var i := n as Interaktiv
		if i == null or not i.aktiv or not i.is_inside_tree():
			continue
		var d := Vector2(i.global_position.x - p.x, i.global_position.z - p.z).length()
		if d < i.radius and d < abstand:
			abstand = d
			bester = i
	return bester


# ---------------------------------------------------------------- Interaktionen

func interagieren(id: String) -> void:
	_beschaeftigt = true
	if id == "pate":
		await _pate_gespraech()
	elif id == "tuer":
		Audio.spiele("tuer")
		hud.toast("Abgeschlossen", "Die Tür nach oben ist zu. Im Prototyp gibt es nur den Keller – Flure, Cafeteria, Turnhalle und Werkstatt folgen.")
	elif id == "radio":
		_radio_an = not _radio_an
		hud.toast("Schulradio WLHS 88.3", "Radio an." if _radio_an else "Radio aus. Ruhe im Keller.")
		if _radio_an:
			_radio_spielen()
	elif id.begins_with("sammel:"):
		_sammeln(id.substr(7))
	else:
		await _station(id)
	_beschaeftigt = false
	_ziel_aktualisieren()


func _radio_spielen() -> void:
	var zeilen: Array = Daten.radio.get("akt1", [])
	if zeilen.is_empty():
		return
	hud.radio(zeilen[_radio_index % zeilen.size()])
	_radio_index += 1


func _sammeln(id: String) -> void:
	Spielstand.sammel_dazu(id)
	keller.sammel_entfernen(id)
	Audio.spiele("sammel")
	var s := Daten.sammelobjekt(id)
	hud.toast("VERLORENES BAUTEIL  %d/%d" % [Spielstand.d["sammel"].size(), Daten.beweise.get("sammel", {}).size()],
		"%s\n%s" % [s.get("titel", ""), s.get("text", "")], 9.0)


func _station(id: String) -> void:
	var q := Spielstand.aktuelle_quest()
	if not q.is_empty() and q["station"] == id and Spielstand.quest_status(q["id"]) == "aktiv":
		if id == "schaltschrank_band":
			keller.schrank_oeffnen(false)
		var ok := await aufgaben.starte(q, Spielstand.fortschritt(q["id"]))
		if ok:
			await _auftrag_geloest(q)
		return
	var texte := {
		"verteiler_licht": ["Die Leuchte flackert. Die Abzweigdose -XD3 sieht unauffällig aus … Vielleicht weiß der Pate mehr.",
			"Die Leuchte brennt ruhig. Saubere Arbeit."],
		"klingel": ["Die Klingelanlage: Zeitschaltuhr -KF1, Taster -SF3, Glocke -PB1. Irgendwas stimmt hier nicht.",
			"Die Glocke schweigt – bis zur nächsten Pause. So soll es sein."],
		"schaltschrank_band": ["Schaltschrank +S1 für das Förderband. Die Störungsleuchte brennt.",
			"Schaltschrank +S1: Betriebsleuchte an, das Band läuft."],
	}
	var fertig := false
	match id:
		"verteiler_licht": fertig = keller.licht_ok
		"klingel": fertig = keller.glocke_ok
		"schaltschrank_band": fertig = keller.band_laeuft
	if texte.has(id):
		hud.toast("Untersucht", texte[id][1 if fertig else 0])


func _auftrag_geloest(q: Dictionary) -> void:
	Spielstand.setze_quest_status(q["id"], "zurueck")
	await _fund_sequenz(q)
	Spielstand.beweis_dazu(q["beweis"])
	Audio.spiele("beweis")
	hud.toast("BEWEISSTÜCK GEFUNDEN", "%s\nAuf dem Beweisbrett [B] siehst du alle Hinweise." % Daten.beweis(q["beweis"]).get("titel", ""), 7.0)


func _fund_sequenz(q: Dictionary) -> void:
	var fund: Array = q.get("fund", ["", ""])
	var shots := []
	match q["id"]:
		"q01_licht":
			shots = [
				{"von": Vector3(-7.4, 2.3, 1.8), "nach": Vector3(-8.0, 2.5, 0.8), "blick_von": Vector3(-5.5, 3.0, -1.0),
					"dauer": 3.5, "t": fund[0], "aktion": func(): keller.licht_reparieren(); Audio.spiele("richtig", -6.0)},
				{"von": Vector3(-10.4, 3.0, 0.6), "nach": Vector3(-10.8, 2.95, 0.2), "blick_von": Vector3(-11.9, 2.75, -0.3),
					"dauer": 4.0, "t": fund[1], "aktion": func(): Audio.spiele("beweis", -4.0)},
			]
		"q02_glocke":
			shots = [
				{"von": Vector3(-4.0, 2.0, -5.0), "nach": Vector3(-4.0, 2.4, -6.0), "blick_von": Vector3(-4.0, 3.0, -8.9),
					"dauer": 3.5, "t": fund[0], "aktion": func(): keller.glocke_reparieren(); Audio.spiele("richtig", -6.0)},
				{"von": Vector3(-3.2, 1.7, -7.3), "nach": Vector3(-3.6, 1.6, -7.9), "blick_von": Vector3(-4.0, 1.5, -8.9),
					"dauer": 4.0, "t": fund[1], "aktion": func(): Audio.spiele("beweis", -4.0)},
			]
		"q03_band":
			shots = [
				{"von": Vector3(2.5, 2.2, -1.2), "nach": Vector3(4.5, 2.4, -1.6), "blick_von": Vector3(6.0, 1.0, -4.5),
					"dauer": 4.0, "t": fund[0], "aktion": func(): keller.band_starten(); Audio.spiele("richtig", -6.0)},
				{"von": Vector3(8.4, 1.7, -6.6), "nach": Vector3(8.2, 1.5, -7.5), "blick_von": Vector3(8.05, 1.3, -8.45),
					"dauer": 5.0, "t": fund[1], "aktion": func(): keller.schrank_oeffnen(true); Audio.spiele("beweis", -2.0)},
			]
	if not shots.is_empty():
		await sequenz.spiele(shots)
	_anlage_reparieren(q["id"])
	if q["id"] == "q03_band":
		keller.rose_entfernen()


# ---------------------------------------------------------------- Der Pate

func _pate_gespraech() -> void:
	var q := Spielstand.aktuelle_quest()
	pate.sprich_mit(spieler)
	_dialog_kamera(true)
	if q.is_empty():
		var zeilen: Array = Daten.dialog("pate_leerlauf")
		await dialog.starte([zeilen[_leerlauf_index % zeilen.size()]])
		_leerlauf_index += 1
	else:
		match Spielstand.quest_status(q["id"]):
			"offen":
				var ok := await dialog.starte(Daten.dialog(q["dialog_start"]))
				if ok:
					Spielstand.setze_quest_status(q["id"], "aktiv")
					Spielstand.setze_fortschritt(q["id"], 0)
					_dialog_kamera(false)
					pate.fertig()
					_ziel_aktualisieren()
					await hud.mission_titel(q["titel"], q.get("akt", ""))
					return
				await dialog.starte(Daten.dialog("pate_abgelehnt"))
			"aktiv":
				await dialog.starte(Daten.dialog("pate_aktiv"))
			"zurueck":
				await dialog.starte(Daten.dialog(q["dialog_ende"]))
				_dialog_kamera(false)
				pate.fertig()
				await _mission_abschluss(q)
				return
	_dialog_kamera(false)
	pate.fertig()


func _dialog_kamera(an: bool) -> void:
	if not an:
		spieler.kamera.current = true
		return
	var sp := spieler.global_position
	var richtung := pate.global_position - sp
	richtung.y = 0
	richtung = richtung.normalized()
	spieler.figur.rotation.y = atan2(-richtung.x, -richtung.z)
	var rechts := richtung.cross(Vector3.UP)
	var ziel_pos := sp + Vector3(0, 1.8, 0) - richtung * 1.2 + rechts * 0.75
	seq_kamera.global_transform = spieler.kamera.global_transform
	seq_kamera.current = true
	var blick := pate.figur.kopf_position() - Vector3(0, 0.1, 0)
	var ziel := Transform3D(Basis(), ziel_pos).looking_at(blick)
	create_tween().tween_property(seq_kamera, "global_transform", ziel, 0.6).set_trans(Tween.TRANS_SINE)


func _mission_abschluss(q: Dictionary) -> void:
	var bonus := 0
	for aid in q["aufgaben"]:
		if Spielstand.erster_versuch(aid):
			bonus += int(Daten.quest_info.get("bonus_pro_aufgabe", 2))
	var rang_vorher := Spielstand.rang()
	Spielstand.ruf_dazu(int(q["ruf"]) + bonus)
	Spielstand.setze_quest_status(q["id"], "erledigt")
	_ziel_aktualisieren()
	await hud.mission_passed(int(q["ruf"]) + bonus, bonus)
	if Spielstand.rang() != rang_vorher:
		await hud.befoerdert(Spielstand.rang())
	if Spielstand.alle_quests_erledigt():
		pate.sprich_mit(spieler)
		_dialog_kamera(true)
		await dialog.starte(Daten.dialog("pate_ende"))
		_dialog_kamera(false)
		pate.fertig()
		await _bilanz()


## Auswertung am Ende des Prototyps (auch für die Lehrkraft interessant)
func _bilanz() -> void:
	var ebene := CanvasLayer.new()
	ebene.name = "Bilanz"
	ebene.layer = 7
	add_child(ebene)
	var w := Stil.wurzel(ebene)
	var dunkel := ColorRect.new()
	dunkel.color = Color(0, 0, 0, 0.75)
	dunkel.set_anchors_preset(Control.PRESET_FULL_RECT)
	w.add_child(dunkel)
	var p := PanelContainer.new()
	Stil.mitte(w).add_child(p)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	p.add_child(v)
	v.add_child(Stil.label("ENDE DES PROTOTYPS", 54, Stil.GOLD_HELL, 12, Stil.fett()))
	var gesamt := 0
	var erster := 0
	var geloest := 0
	var aufgeloest := 0
	for q in Daten.quests:
		for aid in q["aufgaben"]:
			gesamt += 1
			var s: Dictionary = Spielstand.d["statistik"].get(aid, {})
			if s.get("erster_versuch", false):
				erster += 1
			if s.get("geloest", false):
				geloest += 1
			if s.get("aufgeloest", false):
				aufgeloest += 1
	var zeit := int(Spielstand.d["spielzeit"])
	var zeilen := [
		"Spieler/-in:  %s" % Spielstand.d["name"],
		"Rang:  %s   (Ruf %d)" % [Spielstand.rang(), Spielstand.ruf()],
		"Fachaufgaben gelöst:  %d / %d   –   davon beim ersten Versuch: %d" % [geloest, gesamt, erster],
		"Lösung anzeigen lassen:  %d×" % aufgeloest,
		"Beweisstücke:  %d / %d" % [Spielstand.d["beweise"].size(), Daten.beweise.get("beweise", {}).size()],
		"Verlorene Bauteile:  %d / %d" % [Spielstand.d["sammel"].size(), Daten.beweise.get("sammel", {}).size()],
		"Spielzeit:  %d min %02d s" % [zeit / 60, zeit % 60],
	]
	for z in zeilen:
		v.add_child(Stil.label(z, 24))
	v.add_child(Stil.label("„Die Familie vergisst nicht.“", 24, Color(0.85, 0.85, 0.85), 0, Stil.schreibmaschine()))
	var weiter := Stil.knopf("Weiter erkunden", Callable(), 300)
	v.add_child(weiter)
	Spielstand.ui_sperren(true)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	await weiter.pressed
	Spielstand.ui_sperren(false)
	ebene.queue_free()


# ---------------------------------------------------------------- Intro

func intro() -> void:
	var t: Array = Daten.dialog("intro")
	var shots := [
		{"von": Vector3(-9.5, 3.0, 6.5), "nach": Vector3(-5.0, 2.8, 4.5), "blick_von": Vector3(-2.0, 1.2, 0.0),
			"blick_nach": Vector3(2.0, 1.0, -3.5), "dauer": 6.5, "s": t[0]["s"], "t": t[0]["t"]},
		{"von": Vector3(-3.0, 1.8, 2.0), "nach": Vector3(-3.8, 2.0, 1.0), "blick_von": Vector3(-5.5, 3.2, -1.0),
			"dauer": 6.5, "s": t[1]["s"], "t": t[1]["t"], "aktion": keller.glocke_laeuten},
		{"von": Vector3(5.5, 2.2, 0.5), "nach": Vector3(6.8, 1.9, 2.0), "blick_von": Vector3(9.0, 1.7, 7.0),
			"dauer": 6.0, "s": t[2]["s"], "t": t[2]["t"]},
		{"von": Vector3(9.0, 1.85, 4.9), "nach": Vector3(9.0, 1.85, 5.4), "blick_von": Vector3(9.0, 1.8, 7.25),
			"dauer": 5.0, "s": t[3]["s"], "t": t[3]["t"], "aktion": func(): pate.figur.gestik = 0.6},
	]
	_beschaeftigt = true
	await sequenz.spiele(shots)
	pate.figur.gestik = 0.0
	Spielstand.d["intro_gesehen"] = true
	_beschaeftigt = false
	hud.toast("Steuerung", PauseMenue.steuerung_text(), 10.0, 640.0)
