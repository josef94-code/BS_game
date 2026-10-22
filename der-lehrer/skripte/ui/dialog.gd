class_name DialogUI
extends CanvasLayer
## Dialogfenster mit Namensschild, Schreibmaschinen-Effekt, Letterbox-Balken und Antwortauswahl.

signal _weiter_gedrueckt
signal _gewaehlt(ok: bool)

var _wurzel: Control
var _balken_oben: ColorRect
var _balken_unten: ColorRect
var _box: PanelContainer
var _name: Label
var _text: RichTextLabel
var _weiter: Label
var _wahl_box: VBoxContainer
var _aktiv := false
var _tippen := 0.0
const ZEICHEN_PRO_SEKUNDE := 55.0


func _ready() -> void:
	layer = 4
	_wurzel = Stil.wurzel(self)
	_balken_oben = ColorRect.new()
	_balken_oben.color = Color.BLACK
	_wurzel.add_child(_balken_oben)
	Stil.setze(_balken_oben, Control.PRESET_TOP_WIDE, 0, -90, 0, 0)
	_balken_unten = ColorRect.new()
	_balken_unten.color = Color.BLACK
	_wurzel.add_child(_balken_unten)
	Stil.setze(_balken_unten, Control.PRESET_BOTTOM_WIDE, 0, 0, 0, 90)

	_box = PanelContainer.new()
	_box.add_theme_stylebox_override("panel", StyleBoxEmpty.new())
	_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_wurzel.add_child(_box)
	Stil.setze(_box, Control.PRESET_CENTER_BOTTOM, -620, -250, 620, -20)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 8)
	_box.add_child(v)
	_name = Stil.label("", 24, Stil.GOLD_HELL, 6, Stil.hud_schrift())
	_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_name)
	_text = RichTextLabel.new()
	_text.bbcode_enabled = true
	_text.fit_content = true
	_text.scroll_active = false
	_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_text.custom_minimum_size = Vector2(1180, 90)
	_text.add_theme_font_override("normal_font", Stil.hud_schrift())
	_text.add_theme_font_size_override("normal_font_size", 31)
	_text.add_theme_font_size_override("italics_font_size", 29)
	_text.add_theme_constant_override("outline_size", 9)
	_text.add_theme_color_override("font_outline_color", Color.BLACK)
	v.add_child(_text)
	_wahl_box = VBoxContainer.new()
	_wahl_box.add_theme_constant_override("separation", 6)
	v.add_child(_wahl_box)
	_weiter = Stil.label("E / Leertaste / Klick  ▶", 16, Color(1, 1, 1, 0.45), 3, Stil.hud_schrift())
	_weiter.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	v.add_child(_weiter)
	_wurzel.visible = false


## Spielt einen Dialog ab. Rückgabe: true, wenn eine Auswahl mit ok = true getroffen wurde
## (oder der Dialog keine Auswahl enthält).
func starte(eintraege: Array) -> bool:
	_aktiv = true
	Spielstand.ui_sperren(true)
	_wurzel.visible = true
	_balken_rein(true)
	var ergebnis := true
	for e in eintraege:
		if e.has("wahl"):
			ergebnis = await _waehlen(e["wahl"])
		else:
			_zeige(e)
			await _weiter_gedrueckt
	_balken_rein(false)
	_wurzel.visible = false
	_aktiv = false
	Spielstand.ui_sperren(false)
	return ergebnis


func _zeige(e: Dictionary) -> void:
	var sp := Daten.sprecher(e.get("s", "erzaehler"))
	var name: String = String(sp.get("name", "")).replace("{name}", Spielstand.d["name"])
	_name.text = name
	_name.visible = name != ""
	_name.add_theme_color_override("font_color", Stil.farbe(sp.get("farbe", "#ffffff")))
	var t: String = String(e.get("t", "")).replace("{name}", Spielstand.d["name"])
	_text.text = "[center]%s[/center]" % (("[i]%s[/i]" % t) if e.get("s", "") == "erzaehler" else t)
	_text.visible_ratio = 0.0
	_tippen = 0.0
	_weiter.visible = true
	_wahl_box.visible = false


func _waehlen(optionen: Array) -> bool:
	_weiter.visible = false
	_text.visible_ratio = 1.0
	for c in _wahl_box.get_children():
		c.queue_free()
	_wahl_box.visible = true
	var nr := 1
	for o in optionen:
		var b := Stil.knopf("%d.  %s" % [nr, o["t"]])
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		var ok: bool = o.get("ok", true)
		b.pressed.connect(func(): _gewaehlt.emit(ok))
		_wahl_box.add_child(b)
		if nr == 1:
			b.grab_focus.call_deferred()
		nr += 1
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	var r: bool = await _gewaehlt
	_wahl_box.visible = false
	return r


func _balken_rein(rein: bool) -> void:
	var t := create_tween().set_parallel(true)
	t.tween_property(_balken_oben, "offset_bottom", 90.0 if rein else 0.0, 0.35)
	t.tween_property(_balken_oben, "offset_top", 0.0 if rein else -90.0, 0.35)
	t.tween_property(_balken_unten, "offset_top", -90.0 if rein else 0.0, 0.35)
	t.tween_property(_balken_unten, "offset_bottom", 0.0 if rein else 90.0, 0.35)


func _process(delta: float) -> void:
	if not _aktiv:
		return
	if _text.visible_ratio < 1.0:
		_tippen += delta * ZEICHEN_PRO_SEKUNDE
		var n := _text.get_total_character_count()
		_text.visible_ratio = 1.0 if n == 0 else minf(1.0, _tippen / n)


func _unhandled_input(e: InputEvent) -> void:
	if not _aktiv or _wahl_box.visible:
		if _aktiv and _wahl_box.visible and e is InputEventKey and e.pressed and not e.echo:
			var idx := int(e.keycode) - KEY_1
			var buttons := _wahl_box.get_children()
			if idx >= 0 and idx < buttons.size():
				(buttons[idx] as Button).pressed.emit()
				get_viewport().set_input_as_handled()
		return
	var klick: bool = e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT
	if e.is_action_pressed("weiter") or klick:
		get_viewport().set_input_as_handled()
		if _text.visible_ratio < 1.0:
			_text.visible_ratio = 1.0
			_tippen = 99999.0
		else:
			Audio.spiele("klick", -10.0)
			_weiter_gedrueckt.emit()


## Für den Autotest: Dialog ohne Eingabe weiterschalten
func automatisch_weiter() -> void:
	if not _aktiv:
		return
	if _wahl_box.visible:
		var b := _wahl_box.get_child(0) as Button
		if b:
			b.pressed.emit()
	else:
		_text.visible_ratio = 1.0
		_weiter_gedrueckt.emit()


func ist_aktiv() -> bool:
	return _aktiv
