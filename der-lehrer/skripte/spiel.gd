extends Node3D
## Spielablauf: baut Welt, Figuren und Oberfläche auf und steuert die Missionen
## (Auftrag annehmen -> Anlage reparieren -> Beweis finden -> beim Auftraggeber melden).
## Die Welt besteht aus Bereichen (Keller, Erdgeschoss, Turnhalle, Werkstatt), die über Türen verbunden sind.

const ZIEL_START := {
	"lehrer": "Sprich mit dem Lehrer in seinem Büro im Keller.",
	"kowalski": "Sprich mit Hausmeister Kowalski im Flur.",
	"rosalita": "Sprich mit Rosalita an der Essensausgabe in der Cafeteria.",
	"bradley": "Sprich mit Coach Bradley in der Turnhalle.",
	"sparky": "Sprich mit Sparky in der Werkstatt.",
}
## Meldung, wenn eine Tür noch abgeschlossen ist
const TUER_ZU := {
	"tuer": "Die Tür nach oben ist zu. Erst muss im Keller alles laufen – der Lehrer sagt dir, wann.",
	"turnhalle": "Die Turnhalle ist abgeschlossen. Erst müssen Flur und Cafeteria laufen.",
	"werkstatt": "Die Werkstatt ist abgeschlossen. Coach Bradley weiß, wer den Schlüssel hat.",
}
const VERSCHLOSSEN := {
	"oben": ["Abgesperrt", "Das Treppenhaus nach oben ist Baustelle von Sterling Bau. Hier kommst du noch nicht weiter."],
	"mt10": ["R 104 · MT10", "Dein Klassenzimmer. Abgeschlossen – um diese Uhrzeit ist hier niemand mehr."],
	"sekretariat": ["Sekretariat", "Abgeschlossen. Durch die Glasscheibe siehst du einen Stapel Rechnungen von Sterling Bau."],
	"geraeteraum": ["Geräteraum", "Abgeschlossen. Coach Bradley lässt hier niemanden rein – „Da drin ist Ordnung, und so bleibt das.“"],
}

var keller: Keller
var erdgeschoss: Erdgeschoss
var turnhalle: Turnhalle
var werkstatt: Werkstatt
var bereiche: Array[Bereich] = []
var aktueller_bereich: Bereich
var spieler: Spieler
var lehrer: Lehrer
## Auftraggeber: id -> {"node": Person, "bereich": Bereich, "blick": float, "abstand": float}
var personen := {}
var marker: Zielmarker
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
var _leerlauf_index := {}
var _umgebung: WorldEnvironment
var _raum := ""
var _blende: ColorRect


func _ready() -> void:
	get_tree().paused = false
	Spielstand.ui_zuruecksetzen()
	keller = Keller.new()
	add_child(keller)
	erdgeschoss = Erdgeschoss.new()
	erdgeschoss.position = Vector3(0, 0, -80)
	add_child(erdgeschoss)
	turnhalle = Turnhalle.new()
	turnhalle.position = Vector3(0, 0, -160)
	add_child(turnhalle)
	werkstatt = Werkstatt.new()
	werkstatt.position = Vector3(0, 0, -240)
	add_child(werkstatt)
	bereiche = [keller, erdgeschoss, turnhalle, werkstatt]
	_umgebung = WorldEnvironment.new()
	add_child(_umgebung)
	marker = Zielmarker.new()
	add_child(marker)
	lehrer = Lehrer.new()
	_person_neu("lehrer", lehrer, keller, keller.lehrer_pos, 0.0, 1.9)
	_person_neu("kowalski", Nebenfiguren.kowalski(), erdgeschoss, erdgeschoss.kowalski_pos, erdgeschoss.kowalski_blick, 1.6)
	_person_neu("rosalita", Nebenfiguren.rosalita(), erdgeschoss, erdgeschoss.rosalita_pos, erdgeschoss.rosalita_blick, 2.5)
	_person_neu("bradley", Nebenfiguren.bradley(), turnhalle, turnhalle.bradley_pos, turnhalle.bradley_blick, 1.8)
	_person_neu("sparky", Nebenfiguren.sparky(), werkstatt, werkstatt.sparky_pos, werkstatt.sparky_blick, 1.6)
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
	hud.minimap.spieler = spieler
	hud.minimap.marker = marker
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
	_blende_bauen()

	_bereich_pruefen()
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


func _person_neu(id: String, p: Person, b: Bereich, lokal: Vector3, blick: float, abstand: float) -> void:
	p.position = b.position + lokal
	p.rotation.y = blick
	add_child(p)
	personen[id] = {"node": p, "bereich": b, "blick": blick, "abstand": abstand}


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
	# auf "Niedrig" ohne Filter (spart eine Bildschirmkopie)
	var umschalten := func(): ebene.visible = Grafik.ist("mittel")
	Grafik.geaendert.connect(umschalten)
	umschalten.call()


# ---------------------------------------------------------------- Zustand

func _welt_aus_spielstand() -> void:
	for q in Daten.quests:
		if Spielstand.quest_status(q["id"]) in ["zurueck", "erledigt"]:
			_anlage_reparieren(q["id"])
	for id in Spielstand.d["sammel"]:
		for b in bereiche:
			b.sammel_entfernen(id)


func _anlage_reparieren(quest_id: String) -> void:
	match quest_id:
		"q01_licht":
			keller.licht_reparieren()
			keller.schraubendreher_entfernen()
		"q02_glocke":
			keller.glocke_reparieren()
		"q03_band":
			keller.band_starten()
		"q04_netz":
			keller.netz_reparieren()
		"q05_leitung":
			erdgeschoss.leitung_reparieren()
		"q06_funk":
			erdgeschoss.funk_reparieren()
			erdgeschoss.funk_abschliessen()
		"q07_bedienstelle":
			erdgeschoss.bedienstelle_reparieren()
		"q08_halle":
			turnhalle.anzeige_reparieren()
			turnhalle.usb_entfernen()
		"q09_vorhang":
			turnhalle.vorhang_reparieren()
		"q10_absaugung":
			werkstatt.absaugung_reparieren()
		"q11_lauscher":
			werkstatt.netz_reparieren()
			werkstatt.lauscher_zeigen(false)


func _zustand_sichern() -> void:
	var p := spieler.global_position
	Spielstand.d["pos"] = [snappedf(p.x, 0.01), snappedf(p.y, 0.01), snappedf(p.z, 0.01)]
	Spielstand.d["blick"] = snappedf(spieler.blick(), 0.001)


## Stelle vor einer Person, an der man mit ihr spricht (dort steht auch der Zielmarker)
func person_vorne(id: String) -> Vector3:
	var p: Dictionary = personen[id]
	var b: float = p["blick"]
	return (p["node"] as Node3D).global_position + Vector3(-sin(b), 0, -cos(b)) * float(p["abstand"])


func lehrer_vorne() -> Vector3:
	return person_vorne("lehrer")


func station_finden(id: String) -> Interaktiv:
	for b in bereiche:
		if b.stationen.has(id):
			return b.stationen[id]
	return null


func bereich_an(p: Vector3) -> Bereich:
	for b in bereiche:
		if b.enthaelt(p):
			return b
	return null


## Ist eine Tür offen? Türen ohne Eintrag in quests.json ("tueren") sind immer offen.
func _tuer_offen(id: String) -> bool:
	var nach := String(Daten.quest_info.get("tueren", {}).get(id, ""))
	return nach == "" or Spielstand.quest_status(nach) == "erledigt"


func _bereich_mit_titel(t: String) -> Bereich:
	for b in bereiche:
		if b.titel == t:
			return b
	return null


func _ziel_aktualisieren() -> void:
	var q := Spielstand.aktuelle_quest()
	keller.stationen["tuer"].hinweis = "Treppe nach oben" if _tuer_offen("tuer") else "Tür nach oben"
	var ziel: Variant = null
	var geber := ""
	var status := ""
	if q.is_empty():
		hud.ziel("Alle Aufträge erledigt. Erkunde die Schule – vielleicht findest du noch verlorene Bauteile.")
	else:
		geber = q.get("auftraggeber", "lehrer")
		status = Spielstand.quest_status(q["id"])
		match status:
			"offen":
				hud.ziel(ZIEL_START.get(geber, "Sprich mit deinem Auftraggeber."))
				ziel = person_vorne(geber)
			"aktiv":
				hud.ziel(q["ziel_hin"])
				var st := station_finden(q["station"])
				ziel = st.global_position if st else null
			"zurueck":
				hud.ziel(q["ziel_zurueck"])
				ziel = person_vorne(geber)
	# Liegt das Ziel in einem anderen Bereich, zeigt der Marker auf die Tür dorthin
	if ziel != null and aktueller_bereich:
		var zb := bereich_an(ziel)
		if zb and zb != aktueller_bereich:
			var tuer := aktueller_bereich.ausgang_nach(zb.titel)
			if tuer:
				ziel = tuer.global_position
	marker.setzen(ziel)
	var liste := []
	for id in personen:
		liste.append({"pos": (personen[id]["node"] as Node3D).global_position, "art": id,
			"aktiv": id == geber and status in ["offen", "zurueck"]})
	hud.minimap.personen = liste


# ---------------------------------------------------------------- Bereiche

## Bereich anhand der Spielerposition bestimmen; Umgebung, Sichtbarkeit und Ortsanzeige umschalten
func _bereich_pruefen() -> void:
	var p := spieler.global_position
	var b := bereich_an(p)
	if b == null:
		return
	if b != aktueller_bereich:
		aktueller_bereich = b
		for x in bereiche:
			x.visible = x == b
		for id in personen:
			(personen[id]["node"] as Node3D).visible = personen[id]["bereich"] == b
		_umgebung.environment = b.umwelt
		hud.minimap.bereich = b
		_ziel_aktualisieren()
	var raum := b.raum_an(p)
	if raum != "" and raum != _raum:
		_raum = raum
		hud.ort(raum)


func _blende_bauen() -> void:
	var ebene := CanvasLayer.new()
	ebene.layer = 9
	add_child(ebene)
	_blende = ColorRect.new()
	_blende.color = Color.BLACK
	_blende.set_anchors_preset(Control.PRESET_FULL_RECT)
	_blende.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_blende.modulate.a = 0.0
	ebene.add_child(_blende)


## Durch eine Tür in einen anderen Bereich wechseln (schwarze Überblendung)
func _wechseln(ziel: Bereich, lokal: Vector3, blick: float) -> void:
	Audio.spiele("tuer")
	var t := create_tween()
	t.tween_property(_blende, "modulate:a", 1.0, 0.35)
	await t.finished
	spieler.global_position = ziel.position + lokal
	spieler.velocity = Vector3.ZERO
	spieler.setze_blick(blick)
	_bereich_pruefen()
	await get_tree().create_timer(0.25).timeout
	t = create_tween()
	t.tween_property(_blende, "modulate:a", 0.0, 0.45)
	await t.finished


# ---------------------------------------------------------------- Schleife & Eingabe

func gesperrt() -> bool:
	return Spielstand.ui_offen() or _beschaeftigt or pause.offen


func _process(delta: float) -> void:
	var g := gesperrt()
	spieler.gesperrt = g
	Grafik.aktiv_messen = not g and not Spielstand.autotest
	hud.alles_zeigen(not sequenz.aktiv and not dialog.ist_aktiv())
	marker.versteckt = sequenz.aktiv or dialog.ist_aktiv()
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
	_bereich_pruefen()
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
	if personen.has(id):
		await _gespraech(id)
	elif _tuer_bereich(id):
		var von := _tuer_bereich(id)
		if _tuer_offen(id):
			var ziel := _bereich_mit_titel(von.tueren[id])
			var ank: Array = ziel.ankunft.get(von.titel, [Vector3.ZERO, 0.0])
			await _wechseln(ziel, ank[0], ank[1])
		else:
			Audio.spiele("tuer")
			hud.toast("Abgeschlossen", TUER_ZU.get(id, "Diese Tür ist abgeschlossen."))
	elif id.begins_with("verschlossen:"):
		var v: Array = VERSCHLOSSEN.get(id.substr(13), ["Abgeschlossen", "Hier kommst du nicht weiter."])
		Audio.spiele("tuer", -6.0)
		hud.toast(v[0], v[1])
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


## Bereich, in dem eine Tür mit dieser ID steht (sonst null)
func _tuer_bereich(id: String) -> Bereich:
	for b in bereiche:
		if b.tueren.has(id):
			return b
	return null


func _radio_spielen() -> void:
	var akt := "akt1"
	if _tuer_offen("turnhalle"):
		akt = "akt3"
	elif _tuer_offen("tuer"):
		akt = "akt2"
	var zeilen: Array = Daten.radio.get(akt, [])
	if zeilen.is_empty():
		return
	hud.radio(zeilen[_radio_index % zeilen.size()])
	_radio_index += 1


func _sammeln(id: String) -> void:
	Spielstand.sammel_dazu(id)
	for b in bereiche:
		b.sammel_entfernen(id)
	Audio.spiele("sammel")
	var s := Daten.sammelobjekt(id)
	hud.toast("VERLORENES BAUTEIL  %d/%d" % [Spielstand.d["sammel"].size(), Daten.beweise.get("sammel", {}).size()],
		"%s\n%s" % [s.get("titel", ""), s.get("text", "")], 9.0)


func _station(id: String) -> void:
	var q := Spielstand.aktuelle_quest()
	if not q.is_empty() and q["station"] == id and Spielstand.quest_status(q["id"]) == "aktiv":
		match id:
			"schaltschrank_band": keller.schrank_oeffnen(false)
			"unterverteilung": erdgeschoss.uv_oeffnen(true)
			"bedienstelle": erdgeschoss.bedienstelle_oeffnen(true)
			"absaugung": werkstatt.schrank_oeffnen(true)
		var ok := await aufgaben.starte(q, Spielstand.fortschritt(q["id"]))
		if ok:
			await _auftrag_geloest(q)
		else:
			match id:
				"unterverteilung": erdgeschoss.uv_oeffnen(false)
				"bedienstelle": erdgeschoss.bedienstelle_oeffnen(false)
				"absaugung": werkstatt.schrank_oeffnen(false)
		return
	var texte := {
		"verteiler_licht": ["Die Leuchte flackert. Die Abzweigdose -XD3 sieht unauffällig aus … Vielleicht weiß der Lehrer mehr.",
			"Die Leuchte brennt ruhig. Saubere Arbeit."],
		"klingel": ["Die Klingelanlage: Zeitschaltuhr -KF1, Taster -SJ3, Glocke -PB1. Irgendwas stimmt hier nicht.",
			"Die Glocke schweigt – bis zur nächsten Pause. So soll es sein."],
		"schaltschrank_band": ["Schaltschrank +S1 für das Förderband. Die Störungsleuchte brennt.",
			"Schaltschrank +S1: Betriebsleuchte an, das Band läuft."],
		"netzwerkschrank": ["Netzwerkschrank +N1 von Sterling Bau: Switch, Router, Firewall, NAS. An der NAS blinkt eine rote Leuchte.",
			"Netzwerkschrank +N1: Die Sicherung läuft, das Fernwartungskonto ist gesperrt."],
		"unterverteilung": ["Unterverteilung UV-EG. Die dünne graue Leitung zum Snackautomaten ist warm – und der Automat geht immer wieder aus.",
			"UV-EG: Neue Zuleitung NYM 3 × 2,5 mm², sauber im Kanal verlegt."],
		"infoscreen": ["Der Infoscreen zeigt nur Bildsalat. Am Access Point an der Decke blinkt eine orange LED.",
			"Der Infoscreen zeigt den Vertretungsplan. Das fremde Funknetz ist verschwunden."],
		"bedienstelle": ["Bedienstelle Band 1: -SG0, -SJ3, -SJ4 und -PF1. Das Band läuft – aber die grüne Leuchte ist aus.",
			"Bedienstelle Band 1: -PF1 leuchtet, das Band läuft. Ehrliche Lampe."],
		"anzeigetafel": ["Steuerrechner der Anzeigetafel. Die Tafel flackert „88:88“, das Hallenlicht flackert mit.",
			"Die Anzeigetafel zeigt den Spielstand. Jedes Gerät hängt einzeln am Switch."],
		"vorhang": ["Steuerung des Trennvorhangs: -SJ1 AUS, -SJ2 HOCH, -SJ3 RUNTER. Der Vorhang hängt schief.",
			"Der Trennvorhang ist oben. Taster- und Schützverriegelung sind drin."],
		"absaugung": ["Schaltschrank +S3 für Absaugung und Säge. Die Säge läuft, die Absaugung steht – überall Staub.",
			"+S3: Erst die Absaugung, dann die Säge. Die Luft ist klar."],
		"werkstatt_pc": ["Der Werkstatt-PC zeigt den 1. Januar 2000. Daneben blinkt ein alter Hub wie wild.",
			"Neuer Switch, richtige Uhrzeit, ein ordentlicher Stuhl. So arbeitet man."],
	}
	var fertig := false
	match id:
		"verteiler_licht": fertig = keller.licht_ok
		"klingel": fertig = keller.glocke_ok
		"schaltschrank_band": fertig = keller.band_laeuft
		"netzwerkschrank": fertig = keller.netz_ok
		"unterverteilung": fertig = erdgeschoss.leitung_ok
		"infoscreen": fertig = erdgeschoss.funk_ok
		"bedienstelle": fertig = erdgeschoss.bedienstelle_ok
		"anzeigetafel": fertig = turnhalle.anzeige_ok
		"vorhang": fertig = turnhalle.vorhang_ok
		"absaugung": fertig = werkstatt.absaugung_ok
		"werkstatt_pc": fertig = werkstatt.netz_ok
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
		"q04_netz":
			var b := Keller.B
			shots = [
				{"von": Vector3(b - 3.2, 1.8, 2.4), "nach": Vector3(b - 2.6, 1.6, 1.9), "blick_von": Vector3(b - 0.4, 1.2, 1.4),
					"dauer": 4.0, "t": fund[0], "aktion": func(): keller.netz_reparieren(); Audio.spiele("richtig", -6.0)},
				{"von": Vector3(b - 1.6, 1.35, 0.7), "nach": Vector3(b - 1.35, 1.2, 0.55), "blick_von": Vector3(b - 0.8, 0.95, 0.45),
					"dauer": 5.0, "t": fund[1], "aktion": func(): Audio.spiele("beweis", -2.0)},
			]
		"q05_leitung":
			var eg := erdgeschoss
			shots = [
				{"von": eg.to_global(Vector3(-3.4, 1.7, -0.2)), "nach": eg.to_global(Vector3(-2.8, 1.6, 0.4)), "blick_von": eg.to_global(Vector3(-0.4, 1.0, 2.3)),
					"dauer": 4.0, "t": fund[0], "aktion": func(): eg.leitung_reparieren(); Audio.spiele("richtig", -6.0)},
				{"von": eg.to_global(Vector3(-0.4, 1.45, 1.5)), "nach": eg.to_global(Vector3(-0.6, 1.4, 1.75)), "blick_von": eg.to_global(Vector3(-0.88, 1.0, 2.35)),
					"dauer": 5.0, "t": fund[1], "aktion": func(): eg.lieferschein_zeigen(true); Audio.spiele("beweis", -2.0)},
			]
		"q06_funk":
			var eg := erdgeschoss
			shots = [
				{"von": eg.to_global(Vector3(7.6, 1.6, 1.2)), "nach": eg.to_global(Vector3(8.3, 1.7, 0.6)), "blick_von": eg.to_global(Vector3(9.0, 1.75, -2.5)),
					"dauer": 4.0, "t": fund[0], "aktion": func(): eg.funk_reparieren(); Audio.spiele("richtig", -6.0)},
				{"von": eg.to_global(Vector3(9.0, 1.5, 1.4)), "nach": eg.to_global(Vector3(9.4, 1.7, 1.0)), "blick_von": eg.to_global(Vector3(10.2, 3.3, 0.4)),
					"dauer": 5.0, "t": fund[1], "aktion": func(): eg.router_zeigen(true); Audio.spiele("beweis", -2.0)},
			]
		"q07_bedienstelle":
			var eg := erdgeschoss
			shots = [
				{"von": eg.to_global(Vector3(25.5, 2.0, -2.5)), "nach": eg.to_global(Vector3(26.6, 1.8, -3.4)), "blick_von": eg.to_global(Vector3(29.2, 1.2, -6.4)),
					"dauer": 4.0, "t": fund[0], "aktion": func(): eg.bedienstelle_reparieren(); Audio.spiele("richtig", -6.0)},
				{"von": eg.to_global(Vector3(28.85, 1.5, -5.3)), "nach": eg.to_global(Vector3(29.0, 1.45, -5.6)), "blick_von": eg.to_global(Vector3(29.2, 1.35, -6.2)),
					"dauer": 5.0, "t": fund[1], "aktion": func(): eg.bedienstelle_oeffnen(true, true); Audio.spiele("beweis", -2.0)},
			]
		"q08_halle":
			var th := turnhalle
			shots = [
				{"von": th.to_global(Vector3(2.0, 2.5, 4.0)), "nach": th.to_global(Vector3(5.0, 2.8, 3.0)), "blick_von": th.to_global(Vector3(14.8, 5.0, 0.0)),
					"dauer": 4.0, "t": fund[0], "aktion": func(): th.anzeige_reparieren(); Audio.spiele("richtig", -6.0)},
				{"von": th.to_global(Vector3(-3.6, 1.5, 6.6)), "nach": th.to_global(Vector3(-3.5, 1.35, 6.9)), "blick_von": th.to_global(Vector3(-3.45, 0.87, 7.7)),
					"dauer": 5.0, "t": fund[1], "aktion": func(): th.usb_zeigen(true); Audio.spiele("beweis", -2.0)},
			]
		"q09_vorhang":
			var th := turnhalle
			shots = [
				{"von": th.to_global(Vector3(-6.0, 2.0, 3.0)), "nach": th.to_global(Vector3(-4.0, 2.2, 2.0)), "blick_von": th.to_global(Vector3(0.0, 5.0, 0.0)),
					"dauer": 4.5, "t": fund[0], "aktion": func(): th.vorhang_reparieren(); Audio.spiele("richtig", -6.0)},
				{"von": th.to_global(Vector3(0.9, 1.65, 8.8)), "nach": th.to_global(Vector3(1.1, 1.62, 9.1)), "blick_von": th.to_global(Vector3(1.3, 1.6, 9.78)),
					"dauer": 5.0, "t": fund[1], "aktion": func(): th.schluessel_zeigen(true); Audio.spiele("beweis", -2.0)},
			]
		"q10_absaugung":
			var ws := werkstatt
			shots = [
				{"von": ws.to_global(Vector3(1.5, 2.0, -0.5)), "nach": ws.to_global(Vector3(0.5, 1.8, 0.0)), "blick_von": ws.to_global(Vector3(-4.0, 1.0, 4.5)),
					"dauer": 4.0, "t": fund[0], "aktion": func(): ws.absaugung_reparieren(); Audio.spiele("richtig", -6.0)},
				{"von": ws.to_global(Vector3(-10.3, 1.6, 1.6)), "nach": ws.to_global(Vector3(-10.6, 1.55, 1.75)), "blick_von": ws.to_global(Vector3(-11.44, 1.5, 1.8)),
					"dauer": 5.0, "t": fund[1], "aktion": func(): ws.schrank_oeffnen(true, true); Audio.spiele("beweis", -2.0)},
			]
		"q11_lauscher":
			var ws := werkstatt
			shots = [
				{"von": ws.to_global(Vector3(7.0, 1.7, 3.8)), "nach": ws.to_global(Vector3(7.6, 1.6, 4.4)), "blick_von": ws.to_global(Vector3(8.4, 1.0, 6.8)),
					"dauer": 4.0, "t": fund[0], "aktion": func(): ws.netz_reparieren(); Audio.spiele("richtig", -6.0)},
				{"von": ws.to_global(Vector3(9.0, 1.3, 5.6)), "nach": ws.to_global(Vector3(9.1, 1.2, 5.85)), "blick_von": ws.to_global(Vector3(9.22, 0.8, 6.45)),
					"dauer": 5.0, "t": fund[1], "aktion": func(): ws.lauscher_zeigen(true); Audio.spiele("beweis", -2.0)},
			]
	if not shots.is_empty():
		spieler.visible = false
		await sequenz.spiele(shots)
		spieler.visible = true
	_anlage_reparieren(q["id"])
	match q["id"]:
		"q03_band":
			keller.rose_entfernen()
		"q05_leitung":
			erdgeschoss.lieferschein_zeigen(false)
			erdgeschoss.uv_oeffnen(false)
		"q07_bedienstelle":
			erdgeschoss.bedienstelle_oeffnen(false)
		"q09_vorhang":
			turnhalle.schluessel_zeigen(false)
		"q10_absaugung":
			werkstatt.vertrag_entfernen()


# ---------------------------------------------------------------- Gespräche mit Auftraggebern

func _gespraech(id: String) -> void:
	var person: Person = personen[id]["node"]
	var q := Spielstand.aktuelle_quest()
	person.sprich_mit(spieler)
	_dialog_kamera(true, person)
	if q.is_empty() or q.get("auftraggeber", "lehrer") != id:
		# Kein Auftrag von dieser Person: Spruch oder Hinweis auf den richtigen Auftraggeber
		var zeilen: Array = Daten.dialog(id + ("_leerlauf" if q.is_empty() else "_verweis"))
		if zeilen.is_empty():
			zeilen = Daten.dialog(id + "_leerlauf")
		var n: int = _leerlauf_index.get(id, 0)
		if not zeilen.is_empty():
			await dialog.starte([zeilen[n % zeilen.size()]])
		_leerlauf_index[id] = n + 1
	else:
		match Spielstand.quest_status(q["id"]):
			"offen":
				var ok := await dialog.starte(Daten.dialog(q["dialog_start"]))
				if ok:
					Spielstand.setze_quest_status(q["id"], "aktiv")
					Spielstand.setze_fortschritt(q["id"], 0)
					_dialog_kamera(false)
					person.fertig()
					_ziel_aktualisieren()
					await hud.mission_titel(q["titel"], q.get("akt", ""))
					return
				await dialog.starte(Daten.dialog(id + "_abgelehnt"))
			"aktiv":
				await dialog.starte(Daten.dialog(id + "_aktiv"))
			"zurueck":
				await dialog.starte(Daten.dialog(q["dialog_ende"]))
				_dialog_kamera(false)
				person.fertig()
				await _mission_abschluss(q)
				return
	_dialog_kamera(false)
	person.fertig()


func _dialog_kamera(an: bool, person: Person = null) -> void:
	if not an:
		spieler.kamera.current = true
		return
	var sp := spieler.global_position
	var richtung := person.global_position - sp
	richtung.y = 0
	richtung = richtung.normalized()
	spieler.figur.rotation.y = atan2(-richtung.x, -richtung.z)
	var rechts := richtung.cross(Vector3.UP)
	var ziel_pos := sp + Vector3(0, 1.8, 0) - richtung * 1.2 + rechts * 0.75
	seq_kamera.global_transform = spieler.kamera.global_transform
	seq_kamera.current = true
	var blick := person.figur.kopf_position() - Vector3(0, 0.1, 0)
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
		# Der Lehrer meldet sich über die Sprechanlage
		await get_tree().create_timer(0.6).timeout
		Audio.spiele("radio", -6.0)
		await dialog.starte(Daten.dialog("lehrer_ende"))
		await _bilanz()


## Auswertung nach der letzten Mission (auch für die Lehrkraft interessant)
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
	v.add_child(Stil.label(String(Daten.quest_info.get("bilanz_titel", "ENDE")), 54, Stil.GOLD_HELL, 12, Stil.fett()))
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
		"Spieler/-in:  %s   ·   Klasse MT10" % Spielstand.d["name"],
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
			"dauer": 5.0, "s": t[3]["s"], "t": t[3]["t"], "aktion": func(): lehrer.figur.gestik = 0.6},
	]
	_beschaeftigt = true
	await sequenz.spiele(shots)
	lehrer.figur.gestik = 0.0
	Spielstand.d["intro_gesehen"] = true
	_beschaeftigt = false
	hud.toast("Steuerung", PauseMenue.steuerung_text(), 10.0, 640.0)
