class_name Hud
extends CanvasLayer
## HUD im Stil von GTA III: Uhr und Ruf (grüne Ziffern) oben rechts mit Rang-Symbol,
## Hilfe-Box oben links, Radar unten links, Missionstitel unten rechts,
## Ziel-Untertitel unten, "MISSION PASSED" in der Mitte.

const GRUEN_ZIFFERN := Color(0.4, 0.78, 0.42)
const UHR_FARBE := Color(0.82, 0.88, 1.0)

var minimap: Minimap
var _wurzel: Control
var _ziel_klein: Label
var _untertitel: Label
var _uhr: Label
var _ruf_zahl: Label
var _rang: Label
var _rang_symbol: Control
var _sammel: Label
var _hilfe_box: PanelContainer
var _hilfe_titel: Label
var _hilfe_text: Label
var _prompt_box: PanelContainer
var _prompt: Label
var _titel_box: VBoxContainer
var _titel: Label
var _titel_unter: Label
var _passed_box: VBoxContainer
var _passed: Label
var _passed_unter: Label
var _radio_box: VBoxContainer
var _radio_sender: Label
var _radio_text: Label
var _hilfe_tween: Tween
var _radio_tween: Tween
var _untertitel_tween: Tween
var _ort: Label
var _ort_tween: Tween
var _letztes_ziel := ""
var _titel_aktiv := false
var _wartender_untertitel := ""


func _ready() -> void:
	layer = 2
	_wurzel = Stil.wurzel(self)
	var hud_schrift := Stil.hud_schrift()

	# --- Oben rechts: Rang-Symbol, Uhr, Ruf
	var rechts := HBoxContainer.new()
	rechts.add_theme_constant_override("separation", 14)
	rechts.alignment = BoxContainer.ALIGNMENT_END
	_wurzel.add_child(rechts)
	Stil.setze(rechts, Control.PRESET_TOP_RIGHT, -470, 18, -28, 150)
	var symbol_spalte := VBoxContainer.new()
	symbol_spalte.add_theme_constant_override("separation", 2)
	rechts.add_child(symbol_spalte)
	_rang_symbol = Control.new()
	_rang_symbol.custom_minimum_size = Vector2(96, 96)
	_rang_symbol.draw.connect(_rang_symbol_zeichnen)
	symbol_spalte.add_child(_rang_symbol)
	_rang = Stil.label("", 17, Color.WHITE, 4, hud_schrift)
	_rang.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	symbol_spalte.add_child(_rang)
	var zahlen := VBoxContainer.new()
	zahlen.add_theme_constant_override("separation", -6)
	rechts.add_child(zahlen)
	_uhr = Stil.label("21:30", 54, UHR_FARBE, 8, hud_schrift)
	_uhr.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	zahlen.add_child(_uhr)
	_ruf_zahl = Stil.label("R00000000", 46, GRUEN_ZIFFERN, 8, hud_schrift)
	_ruf_zahl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	zahlen.add_child(_ruf_zahl)
	_sammel = Stil.label("", 17, Color(0.9, 0.9, 0.9), 4, hud_schrift)
	_sammel.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	zahlen.add_child(_sammel)
	var abstand := Control.new()
	abstand.custom_minimum_size.y = 14
	zahlen.add_child(abstand)

	# --- Ziel (dauerhaft, klein, unter Uhr und Ruf)
	_ziel_klein = Stil.label("", 19, Color(1, 1, 1, 0.92), 5, hud_schrift)
	_ziel_klein.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_ziel_klein.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_wurzel.add_child(_ziel_klein)
	Stil.setze(_ziel_klein, Control.PRESET_TOP_RIGHT, -470, 200, -28, 300)

	# --- Radar unten links
	minimap = Minimap.new()
	_wurzel.add_child(minimap)
	Stil.setze(minimap, Control.PRESET_BOTTOM_LEFT, 30, -Minimap.GROESSE - 30, 30 + Minimap.GROESSE, -30)

	# --- Hilfe-Box oben links (Meldungen) und Interaktionshinweis
	var links := VBoxContainer.new()
	links.add_theme_constant_override("separation", 8)
	_wurzel.add_child(links)
	Stil.setze(links, Control.PRESET_TOP_LEFT, 28, 24, 520, 400)
	links.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hilfe_box = PanelContainer.new()
	_hilfe_box.add_theme_stylebox_override("panel", _hilfe_stil())
	_hilfe_box.visible = false
	links.add_child(_hilfe_box)
	var hv := VBoxContainer.new()
	_hilfe_box.add_child(hv)
	_hilfe_titel = Stil.label("", 20, Color(1.0, 0.85, 0.35), 0, hud_schrift)
	hv.add_child(_hilfe_titel)
	_hilfe_text = Stil.label("", 19, Color.WHITE)
	_hilfe_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_hilfe_text.custom_minimum_size.x = 440
	hv.add_child(_hilfe_text)
	_prompt_box = PanelContainer.new()
	_prompt_box.add_theme_stylebox_override("panel", _hilfe_stil())
	_prompt_box.visible = false
	links.add_child(_prompt_box)
	_prompt = Stil.label("", 20, Color.WHITE)
	_prompt_box.add_child(_prompt)

	# --- Tastenhilfe unten rechts
	var tasten := Stil.label("E benutzen  ·  B Beweisbrett  ·  Esc Menü", 16, Color(1, 1, 1, 0.5), 3, hud_schrift)
	tasten.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_wurzel.add_child(tasten)
	Stil.setze(tasten, Control.PRESET_BOTTOM_RIGHT, -620, -38, -24, -12)

	# --- Ortsname unten rechts (beim Betreten eines Raums, wie die Stadtteile in GTA III)
	_ort = Stil.label("", 46, Color(0.72, 0.84, 1.0), 10, Stil.titel_schrift())
	_ort.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_ort.visible = false
	_wurzel.add_child(_ort)
	Stil.setze(_ort, Control.PRESET_BOTTOM_RIGHT, -800, -120, -44, -50)

	# --- Untertitel unten Mitte (neues Ziel)
	_untertitel = Stil.label("", 30, Color.WHITE, 8, hud_schrift)
	_untertitel.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_untertitel.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_untertitel.visible = false
	_wurzel.add_child(_untertitel)
	Stil.setze(_untertitel, Control.PRESET_BOTTOM_WIDE, 320, -170, -320, -80)

	# --- Missionstitel unten rechts
	_titel_box = VBoxContainer.new()
	_titel_box.alignment = BoxContainer.ALIGNMENT_END
	_titel_box.visible = false
	_wurzel.add_child(_titel_box)
	Stil.setze(_titel_box, Control.PRESET_BOTTOM_RIGHT, -1100, -260, -50, -60)
	_titel_unter = Stil.label("", 26, Color(0.9, 0.88, 0.8), 6, hud_schrift)
	_titel_unter.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_titel_box.add_child(_titel_unter)
	_titel = Stil.label("", 96, Color(0.96, 0.8, 0.45), 16, Stil.titel_schrift())
	_titel.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_titel_box.add_child(_titel)

	# --- MISSION PASSED
	_passed_box = VBoxContainer.new()
	_passed_box.visible = false
	Stil.mitte(_wurzel).add_child(_passed_box)
	_passed = Stil.label("MISSION PASSED!", 104, Color(1.0, 0.7, 0.15), 18, Stil.titel_schrift())
	_passed.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_passed_box.add_child(_passed)
	_passed_unter = Stil.label("", 48, Color.WHITE, 12, Stil.titel_schrift())
	_passed_unter.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_passed_box.add_child(_passed_unter)

	# --- Radio: Sendername oben Mitte, Spruch darunter
	_radio_box = VBoxContainer.new()
	_radio_box.visible = false
	_wurzel.add_child(_radio_box)
	Stil.setze(_radio_box, Control.PRESET_TOP_WIDE, 420, 80, -420, 220)
	_radio_sender = Stil.label(str(Daten.radio.get("sender", "WLHS")), 34, Color(1.0, 0.6, 0.25), 8, Stil.titel_schrift())
	_radio_sender.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_radio_box.add_child(_radio_sender)
	_radio_text = Stil.label("", 21, Color(1, 0.95, 0.88), 5)
	_radio_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_radio_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_radio_box.add_child(_radio_text)

	Spielstand.geaendert.connect(aktualisiere)
	aktualisiere()


func _hilfe_stil() -> StyleBoxFlat:
	var s := Stil.box(Color(0.12, 0.12, 0.13, 0.78), Color(0, 0, 0, 0), 0, 3)
	s.content_margin_left = 16
	s.content_margin_right = 16
	s.content_margin_top = 10
	s.content_margin_bottom = 10
	return s


func _process(_delta: float) -> void:
	var minuten := int(Spielstand.d.get("uhrzeit", 1290.0))
	_uhr.text = "%02d:%02d" % [(minuten / 60) % 24, minuten % 60]


func aktualisiere() -> void:
	var ruf := Spielstand.ruf()
	_ruf_zahl.text = "R%08d" % ruf
	_rang.text = String(Daten.rang_fuer(ruf)["name"]).to_upper()
	_sammel.text = "BEWEISE %d   BAUTEILE %d/%d" % [Spielstand.d["beweise"].size(), Spielstand.d["sammel"].size(),
		Daten.beweise.get("sammel", {}).size()]
	_rang_symbol.queue_redraw()


## Rang-Symbol (wie das Waffen-Symbol bei GTA): Hut mit so vielen Streifen wie der Rang hoch ist
func _rang_symbol_zeichnen() -> void:
	var c := _rang_symbol
	var r := Rect2(Vector2.ZERO, c.size)
	c.draw_rect(r, Color(0.05, 0.05, 0.06, 0.7))
	c.draw_rect(r, Color(0, 0, 0), false, 3.0)
	var m := r.get_center() + Vector2(0, 6)
	var krempe := PackedVector2Array()
	for i in 32:
		var w := TAU * i / 32.0
		krempe.append(m + Vector2(cos(w) * 38.0, sin(w) * 10.0 + 8.0))
	c.draw_colored_polygon(krempe, Color(0.12, 0.12, 0.13))
	c.draw_rect(Rect2(m + Vector2(-22, -30), Vector2(44, 38)), Color(0.15, 0.15, 0.16))
	var stufe := 0
	for x in Daten.raenge():
		if Spielstand.ruf() >= int(x["ab"]):
			stufe += 1
	for i in stufe:
		c.draw_rect(Rect2(m + Vector2(-22, -2 - i * 8), Vector2(44, 5)), Color(0.75, 0.1, 0.12) if i == 0 else Stil.GOLD)
	c.draw_polyline(PackedVector2Array([m + Vector2(-22, 8), m + Vector2(-22, -30), m + Vector2(22, -30), m + Vector2(22, 8)]), Color(0, 0, 0), 2.0)


func ziel(text: String) -> void:
	_ziel_klein.text = ("ZIEL: " + text) if text != "" else ""
	if text != "" and text != _letztes_ziel:
		_letztes_ziel = text
		if _titel_aktiv:
			_wartender_untertitel = text
			return
		_untertitel_zeigen(text)
	_letztes_ziel = text


func _untertitel_zeigen(text: String) -> void:
	_untertitel.text = text
	_untertitel.visible = true
	_untertitel.modulate.a = 1.0
	if _untertitel_tween:
		_untertitel_tween.kill()
	_untertitel_tween = create_tween()
	_untertitel_tween.tween_interval(6.0)
	_untertitel_tween.tween_property(_untertitel, "modulate:a", 0.0, 0.8)
	_untertitel_tween.tween_callback(func(): _untertitel.visible = false)


func ort(text: String) -> void:
	_ort.text = text.to_upper()
	_ort.visible = true
	_ort.modulate.a = 0.0
	if _ort_tween:
		_ort_tween.kill()
	_ort_tween = create_tween()
	_ort_tween.tween_property(_ort, "modulate:a", 1.0, 0.4)
	_ort_tween.tween_interval(2.6)
	_ort_tween.tween_property(_ort, "modulate:a", 0.0, 0.8)
	_ort_tween.tween_callback(func(): _ort.visible = false)


func prompt(text: String) -> void:
	_prompt_box.visible = text != ""
	if text != "":
		_prompt.text = "Drücke  E :  " + text


func mission_titel(titel: String, unter: String) -> void:
	_titel.text = titel
	_titel_unter.text = unter
	_titel_box.visible = true
	_titel_box.modulate.a = 0.0
	_titel_aktiv = true
	if _untertitel.visible:
		_wartender_untertitel = _untertitel.text
		_untertitel.visible = false
	Audio.spiele("mission_start", -2.0)
	var t := create_tween()
	t.tween_property(_titel_box, "modulate:a", 1.0, 0.5)
	t.tween_interval(3.0)
	t.tween_property(_titel_box, "modulate:a", 0.0, 0.8)
	await t.finished
	_titel_box.visible = false
	_titel_aktiv = false
	if _wartender_untertitel != "":
		_untertitel_zeigen(_wartender_untertitel)
		_wartender_untertitel = ""


func mission_passed(ruf: int, bonus: int) -> void:
	_passed.text = "MISSION PASSED!"
	_passed_unter.text = "+%d RUF" % ruf + ("   (BONUS %d)" % bonus if bonus > 0 else "")
	await _gross_anzeigen(Color(1.0, 0.7, 0.15), "mission_passed")


func befoerdert(rang: String) -> void:
	_passed.text = "BEFÖRDERT!"
	_passed_unter.text = "NEUER RANG: " + rang.to_upper()
	await _gross_anzeigen(Color(0.95, 0.82, 0.35), "befoerderung")


func _gross_anzeigen(farbe: Color, klang: String) -> void:
	_passed.add_theme_color_override("font_color", farbe)
	_passed_box.visible = true
	_passed_box.modulate.a = 0.0
	Audio.musik_leiser(true)
	Audio.spiele(klang, -1.0)
	var t := create_tween()
	t.tween_property(_passed_box, "modulate:a", 1.0, 0.25)
	t.tween_interval(3.2)
	t.tween_property(_passed_box, "modulate:a", 0.0, 0.6)
	await t.finished
	_passed_box.visible = false
	Audio.musik_leiser(false)


## Meldung in der Hilfe-Box oben links
func toast(titel: String, text: String, dauer: float = 5.0, breite: float = 440.0) -> void:
	_hilfe_text.custom_minimum_size.x = breite
	_hilfe_box.size = Vector2.ZERO
	_hilfe_titel.text = titel
	_hilfe_titel.visible = titel != ""
	_hilfe_text.text = text
	_hilfe_box.visible = true
	_hilfe_box.modulate.a = 1.0
	Audio.spiele("auswahl", -14.0, 0.6)
	if _hilfe_tween:
		_hilfe_tween.kill()
	_hilfe_tween = create_tween()
	_hilfe_tween.tween_interval(dauer)
	_hilfe_tween.tween_property(_hilfe_box, "modulate:a", 0.0, 0.5)
	_hilfe_tween.tween_callback(func(): _hilfe_box.visible = false)


func radio(text: String) -> void:
	Audio.spiele("radio", -12.0)
	_radio_text.text = "„" + text + "“"
	_radio_box.visible = true
	_radio_box.modulate.a = 1.0
	if _radio_tween:
		_radio_tween.kill()
	_radio_tween = create_tween()
	_radio_tween.tween_interval(8.0)
	_radio_tween.tween_property(_radio_box, "modulate:a", 0.0, 1.0)
	_radio_tween.tween_callback(func(): _radio_box.visible = false)


func alles_zeigen(an: bool) -> void:
	_wurzel.visible = an
