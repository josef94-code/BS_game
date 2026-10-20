class_name Sequenz
extends CanvasLayer
## Zwischensequenzen: Kamerafahrten mit Letterbox-Balken und Untertiteln.
## Ein Shot: {"von": Vector3, "nach": Vector3, "blick_von": Vector3, "blick_nach": Vector3,
##            "dauer": float, "s": Sprecher, "t": Text}

var kamera: Camera3D
var _wurzel: Control
var _oben: ColorRect
var _unten: ColorRect
var _name: Label
var _text: Label
var _skip: Label
var _ueberspringen := false
var aktiv := false


func _ready() -> void:
	layer = 8
	_wurzel = Stil.wurzel(self)
	_oben = ColorRect.new()
	_oben.color = Color.BLACK
	_wurzel.add_child(_oben)
	Stil.setze(_oben, Control.PRESET_TOP_WIDE, 0, 0, 0, 110)
	_unten = ColorRect.new()
	_unten.color = Color.BLACK
	_wurzel.add_child(_unten)
	Stil.setze(_unten, Control.PRESET_BOTTOM_WIDE, 0, -150, 0, 0)
	var v := VBoxContainer.new()
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	_unten.add_child(v)
	Stil.setze(v, Control.PRESET_FULL_RECT, 200, 6, -200, -6)
	_name = Stil.label("", 22, Stil.GOLD_HELL, 0, Stil.fett())
	_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_name)
	_text = Stil.label("", 28, Color.WHITE, 0)
	_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(_text)
	_skip = Stil.label("Leertaste: überspringen", 16, Color(1, 1, 1, 0.4))
	_wurzel.add_child(_skip)
	Stil.setze(_skip, Control.PRESET_TOP_RIGHT, -280, 40, -30, 70)
	_wurzel.visible = false


func spiele(shots: Array) -> void:
	aktiv = true
	_ueberspringen = false
	Spielstand.ui_sperren(true)
	var vorher := get_viewport().get_camera_3d()
	kamera.current = true
	_wurzel.visible = true
	_wurzel.modulate.a = 0.0
	create_tween().tween_property(_wurzel, "modulate:a", 1.0, 0.4)
	for shot in shots:
		if _ueberspringen:
			break
		var sp := Daten.sprecher(shot.get("s", "erzaehler"))
		_name.text = String(sp.get("name", "")).replace("{name}", Spielstand.d["name"])
		_name.add_theme_color_override("font_color", Stil.farbe(sp.get("farbe", "#ffffff")))
		_text.text = String(shot.get("t", "")).replace("{name}", Spielstand.d["name"])
		var dauer: float = shot.get("dauer", 4.0)
		var zeit := 0.0
		if shot.has("aktion"):
			(shot["aktion"] as Callable).call()
		while zeit < dauer and not _ueberspringen:
			var t := clampf(zeit / dauer, 0.0, 1.0)
			var e := t * t * (3.0 - 2.0 * t)
			var pos: Vector3 = shot["von"].lerp(shot.get("nach", shot["von"]), e)
			var ziel: Vector3 = shot["blick_von"].lerp(shot.get("blick_nach", shot["blick_von"]), e)
			kamera.global_position = pos
			if not pos.is_equal_approx(ziel):
				kamera.look_at(ziel)
			await get_tree().process_frame
			zeit += get_process_delta_time()
	_wurzel.visible = false
	if vorher:
		vorher.current = true
	Spielstand.ui_sperren(false)
	aktiv = false


func _unhandled_input(e: InputEvent) -> void:
	if aktiv and e is InputEventKey and e.pressed and not e.echo and e.keycode in [KEY_SPACE, KEY_ENTER, KEY_ESCAPE]:
		_ueberspringen = true
		get_viewport().set_input_as_handled()


func ueberspringen() -> void:
	_ueberspringen = true
