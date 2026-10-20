class_name Hud
extends CanvasLayer
## HUD im GTA-Stil: Minimap unten links, Ruf-Anzeige oben rechts, Ziel oben,
## große Missionstitel, "MISSION PASSED", Meldungen und Schulradio.

var minimap: Minimap
var _wurzel: Control
var _ziel_box: PanelContainer
var _ziel_text: Label
var _rang: Label
var _ruf_balken: ColorRect
var _ruf_fuell: ColorRect
var _ruf_zahl: Label
var _sammel: Label
var _prompt_box: PanelContainer
var _prompt: Label
var _titel_box: VBoxContainer
var _titel: Label
var _titel_unter: Label
var _passed_box: VBoxContainer
var _passed: Label
var _passed_unter: Label
var _toast_box: PanelContainer
var _toast_titel: Label
var _toast_text: Label
var _radio_box: PanelContainer
var _radio_text: Label
var _toast_tween: Tween
var _radio_tween: Tween


func _ready() -> void:
	layer = 2
	_wurzel = Stil.wurzel(self)

	# --- Ziel oben
	var oben := CenterContainer.new()
	oben.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_wurzel.add_child(oben)
	Stil.setze(oben, Control.PRESET_TOP_WIDE, 380, 20, -380, 80)
	_ziel_box = PanelContainer.new()
	_ziel_box.add_theme_stylebox_override("panel", Stil.box(Color(0, 0, 0, 0.6), Color(0, 0, 0, 0), 0, 6))
	oben.add_child(_ziel_box)
	_ziel_text = Stil.label("", 24, Color.WHITE, 4)
	_ziel_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_ziel_box.add_child(_ziel_text)

	# --- Ruf oben rechts
	var ruf := VBoxContainer.new()
	ruf.add_theme_constant_override("separation", 2)
	_wurzel.add_child(ruf)
	Stil.setze(ruf, Control.PRESET_TOP_RIGHT, -340, 16, -24, 160)
	_rang = Stil.label("LAUFBURSCHE", 34, Stil.GOLD_HELL, 8, Stil.fett())
	_rang.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	ruf.add_child(_rang)
	_ruf_balken = ColorRect.new()
	_ruf_balken.color = Color(0, 0, 0, 0.7)
	_ruf_balken.custom_minimum_size = Vector2(310, 16)
	ruf.add_child(_ruf_balken)
	_ruf_fuell = ColorRect.new()
	_ruf_fuell.color = Stil.GOLD
	_ruf_fuell.position = Vector2(2, 2)
	_ruf_fuell.size = Vector2(0, 12)
	_ruf_balken.add_child(_ruf_fuell)
	_ruf_zahl = Stil.label("RUF 0", 22, Color.WHITE, 5, Stil.fett())
	_ruf_zahl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	ruf.add_child(_ruf_zahl)
	_sammel = Stil.label("", 18, Color(0.85, 0.85, 0.85), 4)
	_sammel.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	ruf.add_child(_sammel)

	# --- Minimap unten links
	minimap = Minimap.new()
	_wurzel.add_child(minimap)
	Stil.setze(minimap, Control.PRESET_BOTTOM_LEFT, 26, -Minimap.GROESSE - 26, 26 + Minimap.GROESSE, -26)

	# --- Interaktion unten Mitte
	var unten := CenterContainer.new()
	unten.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_wurzel.add_child(unten)
	Stil.setze(unten, Control.PRESET_BOTTOM_WIDE, 300, -190, -300, -120)
	_prompt_box = PanelContainer.new()
	_prompt_box.add_theme_stylebox_override("panel", Stil.box(Color(0, 0, 0, 0.65), Stil.GOLD, 2, 8))
	_prompt_box.visible = false
	unten.add_child(_prompt_box)
	_prompt = Stil.label("", 24, Color.WHITE)
	_prompt_box.add_child(_prompt)

	# --- Hilfe unten rechts
	var hilfe := Stil.label("[E] benutzen   [B] Beweisbrett   [Esc] Menü", 17, Color(1, 1, 1, 0.55), 3)
	hilfe.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_wurzel.add_child(hilfe)
	Stil.setze(hilfe, Control.PRESET_BOTTOM_RIGHT, -620, -44, -24, -14)

	# --- Missionstitel
	_titel_box = VBoxContainer.new()
	_titel_box.visible = false
	Stil.mitte(_wurzel).add_child(_titel_box)
	_titel_unter = Stil.label("", 26, Color(0.9, 0.9, 0.9), 6, Stil.schreibmaschine())
	_titel_unter.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_titel_box.add_child(_titel_unter)
	_titel = Stil.label("", 92, Stil.GOLD_HELL, 18, Stil.fett())
	_titel.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_titel_box.add_child(_titel)

	# --- MISSION PASSED
	_passed_box = VBoxContainer.new()
	_passed_box.visible = false
	Stil.mitte(_wurzel).add_child(_passed_box)
	_passed = Stil.label("MISSION PASSED", 96, Color(1.0, 0.72, 0.1), 20, Stil.fett())
	_passed.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_passed_box.add_child(_passed)
	_passed_unter = Stil.label("", 40, Color.WHITE, 10, Stil.fett())
	_passed_unter.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_passed_box.add_child(_passed_unter)

	# --- Meldungen (links Mitte)
	_toast_box = PanelContainer.new()
	_toast_box.add_theme_stylebox_override("panel", Stil.box(Color(0.03, 0.03, 0.04, 0.88), Stil.GOLD, 2, 8))
	_toast_box.visible = false
	_wurzel.add_child(_toast_box)
	Stil.setze(_toast_box, Control.PRESET_CENTER_LEFT, 26, -200, 470, -100)
	var tv := VBoxContainer.new()
	_toast_box.add_child(tv)
	_toast_titel = Stil.label("", 22, Stil.GOLD_HELL, 0, Stil.fett())
	tv.add_child(_toast_titel)
	_toast_text = Stil.label("", 19, Color.WHITE)
	_toast_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_toast_text.custom_minimum_size.x = 400
	tv.add_child(_toast_text)

	# --- Radio (unten rechts)
	_radio_box = PanelContainer.new()
	_radio_box.add_theme_stylebox_override("panel", Stil.box(Color(0.1, 0.04, 0.02, 0.85), Color(1.0, 0.55, 0.3), 2, 8))
	_radio_box.visible = false
	_radio_box.grow_vertical = Control.GROW_DIRECTION_BEGIN
	_wurzel.add_child(_radio_box)
	Stil.setze(_radio_box, Control.PRESET_BOTTOM_RIGHT, -580, -150, -24, -70)
	var rv := VBoxContainer.new()
	_radio_box.add_child(rv)
	rv.add_child(Stil.label("♪  " + str(Daten.radio.get("sender", "WLHS")), 17, Color(1.0, 0.6, 0.35), 0, Stil.fett()))
	_radio_text = Stil.label("", 19, Color(1, 0.95, 0.9), 0, Stil.schreibmaschine())
	_radio_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_radio_text.custom_minimum_size.x = 500
	rv.add_child(_radio_text)

	Spielstand.geaendert.connect(aktualisiere)
	aktualisiere()


func aktualisiere() -> void:
	var ruf := Spielstand.ruf()
	var rang := Daten.rang_fuer(ruf)
	var naechster := Daten.naechster_rang(ruf)
	_rang.text = String(rang["name"]).to_upper()
	var anteil := 1.0
	if not naechster.is_empty():
		anteil = float(ruf - int(rang["ab"])) / float(int(naechster["ab"]) - int(rang["ab"]))
		_ruf_zahl.text = "RUF %d  /  %d" % [ruf, int(naechster["ab"])]
	else:
		_ruf_zahl.text = "RUF %d" % ruf
	_ruf_fuell.size.x = 306.0 * clampf(anteil, 0.0, 1.0)
	_sammel.text = "Beweise %d   ·   Bauteile %d/%d" % [Spielstand.d["beweise"].size(), Spielstand.d["sammel"].size(),
		Daten.beweise.get("sammel", {}).size()]


func ziel(text: String) -> void:
	_ziel_text.text = text
	_ziel_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART if text.length() > 58 else TextServer.AUTOWRAP_OFF
	_ziel_text.custom_minimum_size.x = 720.0 if text.length() > 58 else 0.0
	_ziel_box.visible = text != ""


func prompt(text: String) -> void:
	_prompt_box.visible = text != ""
	if text != "":
		_prompt.text = "[E]  " + text


func mission_titel(titel: String, unter: String) -> void:
	_titel.text = titel.to_upper()
	_titel_unter.text = unter
	_titel_box.visible = true
	_titel_box.modulate.a = 0.0
	Audio.spiele("mission_start", -2.0)
	var t := create_tween()
	t.tween_property(_titel_box, "modulate:a", 1.0, 0.5)
	t.tween_interval(2.6)
	t.tween_property(_titel_box, "modulate:a", 0.0, 0.8)
	await t.finished
	_titel_box.visible = false


func mission_passed(ruf: int, bonus: int) -> void:
	_passed.text = "MISSION PASSED"
	_passed_unter.text = "+%d RUF" % ruf + ("   (davon %d Bonus)" % bonus if bonus > 0 else "")
	await _gross_anzeigen(Color(1.0, 0.72, 0.1), "mission_passed")


func befoerdert(rang: String) -> void:
	_passed.text = "BEFÖRDERT"
	_passed_unter.text = "Neuer Rang in der Familie: " + rang.to_upper()
	await _gross_anzeigen(Stil.GOLD_HELL, "befoerderung")


func _gross_anzeigen(farbe: Color, klang: String) -> void:
	_passed.add_theme_color_override("font_color", farbe)
	_passed_box.visible = true
	_passed_box.modulate.a = 0.0
	await get_tree().process_frame
	_passed_box.pivot_offset = _passed_box.size * 0.5
	_passed_box.scale = Vector2(1.3, 1.3)
	Audio.musik_leiser(true)
	Audio.spiele(klang, -1.0)
	var t := create_tween().set_parallel(true)
	t.tween_property(_passed_box, "modulate:a", 1.0, 0.3)
	t.tween_property(_passed_box, "scale", Vector2.ONE, 0.4).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	t.chain().tween_interval(2.8)
	t.chain().tween_property(_passed_box, "modulate:a", 0.0, 0.6)
	await t.finished
	_passed_box.visible = false
	Audio.musik_leiser(false)


func toast(titel: String, text: String, dauer: float = 5.0, breite: float = 400.0) -> void:
	_toast_text.custom_minimum_size.x = breite
	_toast_box.size = Vector2.ZERO
	_toast_titel.text = titel
	_toast_text.text = text
	_toast_box.visible = true
	_toast_box.modulate.a = 1.0
	if _toast_tween:
		_toast_tween.kill()
	_toast_tween = create_tween()
	_toast_tween.tween_interval(dauer)
	_toast_tween.tween_property(_toast_box, "modulate:a", 0.0, 0.6)
	_toast_tween.tween_callback(func(): _toast_box.visible = false)


func radio(text: String) -> void:
	Audio.spiele("radio", -12.0)
	_radio_text.text = "„" + text + "“"
	_radio_box.visible = true
	_radio_box.modulate.a = 1.0
	if _radio_tween:
		_radio_tween.kill()
	_radio_tween = create_tween()
	_radio_tween.tween_interval(9.0)
	_radio_tween.tween_property(_radio_box, "modulate:a", 0.0, 1.0)
	_radio_tween.tween_callback(func(): _radio_box.visible = false)


func alles_zeigen(an: bool) -> void:
	_wurzel.visible = an
