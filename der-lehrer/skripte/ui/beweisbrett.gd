class_name Beweisbrett
extends CanvasLayer
## Notizbuch / Beweisbrett: gesammelte Beweisstücke (mit rotem Faden), offene Fragen,
## verlorene Bauteile und der eigene Rang in der Familie.

var _wurzel: Control
var _karten: Control
var _faeden: Control
var _rechts: VBoxContainer
var offen := false


func _ready() -> void:
	layer = 6
	_wurzel = Stil.wurzel(self)
	_wurzel.visible = false


func umschalten() -> void:
	if offen:
		schliessen()
	else:
		oeffnen()


func oeffnen() -> void:
	offen = true
	Spielstand.ui_sperren(true)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_aufbauen()
	_wurzel.visible = true
	Audio.spiele("auswahl", -6.0, 0.7)


func schliessen() -> void:
	if not offen:
		return
	offen = false
	_wurzel.visible = false
	Spielstand.ui_sperren(false)


func _aufbauen() -> void:
	for c in _wurzel.get_children():
		_wurzel.remove_child(c)
		c.queue_free()
	var dunkel := ColorRect.new()
	dunkel.color = Color(0, 0, 0, 0.7)
	dunkel.set_anchors_preset(Control.PRESET_FULL_RECT)
	_wurzel.add_child(dunkel)
	# Korkbrett
	var brett := Panel.new()
	var kork := StyleBoxTexture.new()
	kork.texture = Bau.tex("kork")
	kork.axis_stretch_horizontal = StyleBoxTexture.AXIS_STRETCH_MODE_TILE
	kork.axis_stretch_vertical = StyleBoxTexture.AXIS_STRETCH_MODE_TILE
	brett.add_theme_stylebox_override("panel", kork)
	_wurzel.add_child(brett)
	Stil.setze(brett, Control.PRESET_FULL_RECT, 60, 36, -60, -36)
	var rahmen := Panel.new()
	rahmen.add_theme_stylebox_override("panel", Stil.box(Color(0, 0, 0, 0), Color(0.35, 0.2, 0.1), 14, 4))
	rahmen.set_anchors_preset(Control.PRESET_FULL_RECT)
	rahmen.mouse_filter = Control.MOUSE_FILTER_IGNORE
	brett.add_child(rahmen)

	var titel := Stil.label("BEWEISBRETT", 46, Color(0.12, 0.06, 0.04), 0, Stil.schreibmaschine())
	brett.add_child(titel)
	titel.position = Vector2(40, 22)
	var unter := Stil.label("Wer sabotiert die Lincoln High?", 22, Color(0.25, 0.12, 0.08), 0, Stil.schreibmaschine())
	brett.add_child(unter)
	unter.position = Vector2(44, 80)
	var zu := Stil.knopf("Schließen  [B]", schliessen, 200)
	brett.add_child(zu)
	Stil.setze(zu, Control.PRESET_TOP_RIGHT, -240, 24, -30, 70)

	# Beweiskarten
	_karten = Control.new()
	brett.add_child(_karten)
	Stil.setze(_karten, Control.PRESET_FULL_RECT, 40, 130, -520, -30)
	_karten.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var gefunden: Array = Spielstand.d["beweise"]
	var positionen := [Vector2(10, 10), Vector2(370, 60), Vector2(130, 330), Vector2(500, 360), Vector2(20, 560)]
	# je mehr Beweise, desto kleiner die Karten (0 = groß, 1 = kompakt, 2 = Mini, 3 = nur Titel)
	var stufe := 0
	if gefunden.size() > 12:
		stufe = 3
		positionen = []
		for i in 16:
			positionen.append(Vector2((i % 4) * 250 + (i / 4 % 2) * 14, (i / 4) * 172 + (i % 2) * 12))
	elif gefunden.size() > 9:
		stufe = 2
		positionen = []
		for i in 12:
			positionen.append(Vector2((i % 4) * 228 + (i / 4 % 2) * 12, (i / 4) * 225 + (i % 2) * 14))
	elif gefunden.size() > positionen.size():
		stufe = 1
		positionen = [Vector2(0, 0), Vector2(300, 30), Vector2(600, 0), Vector2(20, 225), Vector2(320, 250),
			Vector2(620, 220), Vector2(0, 450), Vector2(300, 470), Vector2(600, 440)]
	var mitten := []
	if gefunden.is_empty():
		var leer := Stil.label("Noch keine Beweise.\nErledige Aufträge für den Lehrer …", 26, Color(0.2, 0.1, 0.05), 0, Stil.schreibmaschine())
		leer.position = Vector2(60, 80)
		_karten.add_child(leer)
	for i in gefunden.size():
		var b := Daten.beweis(gefunden[i])
		var k := _karte(b, i, stufe)
		k.position = positionen[i % positionen.size()]
		k.rotation = deg_to_rad([-3.0, 2.5, -1.5, 3.0, -2.0][i % 5])
		_karten.add_child(k)
		mitten.append(k.position + Vector2([160, 140, 105, 112][stufe], 20))
	# Roter Faden zwischen den Karten
	_faeden = Control.new()
	_faeden.set_anchors_preset(Control.PRESET_FULL_RECT)
	_faeden.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_faeden.draw.connect(func():
		for j in range(mitten.size() - 1):
			_faeden.draw_line(mitten[j], mitten[j + 1], Color(0.75, 0.05, 0.05), 3.0, true)
		for m in mitten:
			_faeden.draw_circle(m, 9.0, Color(0.8, 0.1, 0.1))
			_faeden.draw_circle(m + Vector2(-2, -2), 3.0, Color(1, 0.6, 0.6)))
	_karten.add_child(_faeden)

	# Rechte Spalte: Notizzettel
	_rechts = VBoxContainer.new()
	_rechts.add_theme_constant_override("separation", 16)
	brett.add_child(_rechts)
	Stil.setze(_rechts, Control.PRESET_RIGHT_WIDE, -490, 100, -36, -30)
	var fragen := []
	for f in Daten.beweise.get("fragen", []):
		if Spielstand.hat_beweis(f["ab"]):
			fragen.append("?  " + f["text"])
	if fragen.is_empty():
		fragen.append("?  Warum geht in der frisch sanierten Schule so viel kaputt?")
	# nur die neuesten Fragen, damit die Notizen auf das Brett passen
	if fragen.size() > 5:
		var aeltere := fragen.size() - 5
		fragen = fragen.slice(aeltere)
		fragen.push_front("(… %d ältere Fragen)" % aeltere)
	_rechts.add_child(_zettel("OFFENE FRAGEN", "\n".join(fragen), Color(1.0, 0.95, 0.55)))
	var verdaechtige := "???"
	if Spielstand.hat_beweis("b_rose"):
		verdaechtige = "Eine rivalisierende „Familie“? Ihr Zeichen: die schwarze Rose."
	if Spielstand.hat_beweis("b_protokoll"):
		verdaechtige += "\nSterling Bau? Ihr Fernwartungskonto war um 22:47 Uhr aktiv."
	if Spielstand.hat_beweis("b_foto"):
		verdaechtige += "\nVince Moretti (Abschlussklasse) – Kopf der „Black Roses“? Er trifft sich mit Sterling Bau."
	if Spielstand.hat_beweis("b_schluessel"):
		verdaechtige += "\nCoach Bradley? Entlastet – sein Schlüssel hängt noch am Bund. Jemand hat ihn kopiert."
	if Spielstand.hat_beweis("b_vertrag"):
		verdaechtige = "Sterling Bau: will einen Wartungsvertrag über 480 000 $ – das Motiv.\nVince Moretti und die „Black Roses“ machen die Drecksarbeit."
	if Spielstand.hat_beweis("b_klon"):
		verdaechtige += "\nDer falsche Prüfungsserver ist auf Vince Moretti registriert. Zuschlagen wollen sie am Prüfungstag um 9:00 Uhr."
	if Spielstand.hat_beweis("b_tablet"):
		verdaechtige = "ÜBERFÜHRT: Vince Moretti und die „Black Roses“ – im Auftrag von Sterling Bau.\nDer Wartungsvertrag wird nicht unterschrieben. Fall abgeschlossen."
	_rechts.add_child(_zettel("VERDÄCHTIGE", verdaechtige, Color(0.75, 0.88, 1.0)))
	var teile := []
	var fehlen := 0
	for id in Daten.beweise.get("sammel", {}):
		if Spielstand.hat_sammel(id):
			teile.append("✔  " + Daten.sammelobjekt(id)["titel"])
		else:
			fehlen += 1
	if fehlen > 0:
		teile.append("–  %d noch nicht gefunden" % fehlen)
	_rechts.add_child(_zettel("VERLORENE BAUTEILE  %d/%d" % [Spielstand.d["sammel"].size(), Daten.beweise.get("sammel", {}).size()], "\n".join(teile), Color(0.85, 1.0, 0.8)))
	var rang := "%s  ·  Ruf %d" % [Spielstand.rang(), Spielstand.ruf()]
	_rechts.add_child(_zettel(String(Spielstand.d["name"]).to_upper(), rang, Color(0.98, 0.98, 0.95)))


func _karte(b: Dictionary, i: int, stufe: int = 0) -> Control:
	var kompakt := stufe > 0
	var breite: float = [330.0, 280.0, 215.0, 228.0][stufe]
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", Stil.box(Stil.PAPIER, Color(0.5, 0.4, 0.3), 1, 2))
	p.custom_minimum_size = Vector2(breite, 0)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 3 if kompakt else 6)
	p.add_child(v)
	var foto := ColorRect.new()
	foto.color = Stil.farbe(b.get("farbe", "#444444")).darkened(0.1)
	foto.custom_minimum_size = Vector2(breite - 30.0, 38 if kompakt else 70)
	var nr := Stil.label("BEWEIS #%d" % (i + 1), 19 if kompakt else 22, Color.WHITE, 4, Stil.fett())
	nr.position = Vector2(10, 6 if kompakt else 18)
	foto.add_child(nr)
	v.add_child(foto)
	var t := Stil.label(b.get("titel", ""), [22, 19, 15, 15][stufe], Color(0.1, 0.05, 0.03), 0, Stil.schreibmaschine())
	t.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	t.custom_minimum_size.x = breite - 30.0
	v.add_child(t)
	var text: String = b.get("text", "")
	if stufe == 2 and text.length() > 120:
		text = text.substr(0, 117) + " …"
	elif stufe == 3 and text.length() > 70:
		text = text.substr(0, 67) + " …"
	var txt := Stil.label(text, [17, 14, 12, 11][stufe], Color(0.15, 0.1, 0.08))
	txt.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	txt.custom_minimum_size.x = breite - 30.0
	v.add_child(txt)
	v.add_child(Stil.label("Fundort: " + b.get("ort", ""), 13 if kompakt else 15, Color(0.4, 0.3, 0.25)))
	return p


func _zettel(titel: String, text: String, farbe: Color) -> Control:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", Stil.box(farbe, Color(0, 0, 0, 0.3), 1, 2))
	var v := VBoxContainer.new()
	p.add_child(v)
	v.add_child(Stil.label(titel, 21, Color(0.1, 0.05, 0.03), 0, Stil.schreibmaschine()))
	var l := Stil.label(text, 18, Color(0.12, 0.08, 0.06))
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = 420
	v.add_child(l)
	return p

