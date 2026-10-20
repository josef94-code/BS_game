class_name Stil
## Einheitlicher Look der Oberfläche: dunkle Panels, Gold-Akzente, kräftige Konturen.

const GOLD := Color(0.83, 0.63, 0.09)
const GOLD_HELL := Color(1.0, 0.82, 0.3)
const ROT := Color(0.62, 0.08, 0.1)
const DUNKEL := Color(0.05, 0.04, 0.05, 0.9)
const PAPIER := Color(0.96, 0.92, 0.82)
const TEXT := Color(0.95, 0.93, 0.88)
const GRUEN := Color(0.35, 0.85, 0.4)
const BLAU := Color(0.5, 0.78, 1.0)

static var _theme: Theme
static var _fett: FontVariation
static var _schreibmaschine: FontFile


static func fett() -> Font:
	if _fett == null:
		_fett = FontVariation.new()
		_fett.base_font = ThemeDB.fallback_font
		_fett.variation_embolden = 1.1
		_fett.spacing_glyph = 1
	return _fett


static func schreibmaschine() -> Font:
	if _schreibmaschine == null:
		_schreibmaschine = load("res://fonts/SpecialElite-latin.woff2")
	return _schreibmaschine


static func theme() -> Theme:
	if _theme:
		return _theme
	var t := Theme.new()
	t.default_font_size = 22
	t.set_color("font_color", "Label", TEXT)
	# Knöpfe
	var normal := box(Color(0.12, 0.1, 0.1, 0.95), GOLD.darkened(0.3), 2, 6)
	var hover := box(Color(0.25, 0.18, 0.08, 0.98), GOLD_HELL, 2, 6)
	var gedrueckt := box(Color(0.45, 0.32, 0.06, 1.0), GOLD_HELL, 2, 6)
	var aus := box(Color(0.1, 0.1, 0.1, 0.6), Color(0.3, 0.3, 0.3), 1, 6)
	for typ in ["Button", "OptionButton"]:
		t.set_stylebox("normal", typ, normal)
		t.set_stylebox("hover", typ, hover)
		t.set_stylebox("pressed", typ, gedrueckt)
		t.set_stylebox("focus", typ, box(Color(0, 0, 0, 0), GOLD_HELL, 2, 6))
		t.set_stylebox("disabled", typ, aus)
		t.set_color("font_color", typ, TEXT)
		t.set_color("font_hover_color", typ, Color.WHITE)
		t.set_color("font_pressed_color", typ, Color.WHITE)
		t.set_color("font_disabled_color", typ, Color(0.5, 0.5, 0.5))
		t.set_font("font", typ, fett())
		t.set_font_size("font_size", typ, 22)
	# Eingabefeld
	t.set_stylebox("normal", "LineEdit", box(Color(0.98, 0.96, 0.9), GOLD, 2, 4))
	t.set_stylebox("focus", "LineEdit", box(Color(1, 1, 1, 0), GOLD_HELL, 3, 4))
	t.set_color("font_color", "LineEdit", Color(0.08, 0.06, 0.05))
	t.set_color("caret_color", "LineEdit", Color.BLACK)
	t.set_font_size("font_size", "LineEdit", 28)
	# Panels
	t.set_stylebox("panel", "PanelContainer", box(DUNKEL, GOLD.darkened(0.2), 2, 10))
	t.set_stylebox("panel", "Panel", box(DUNKEL, GOLD.darkened(0.2), 2, 10))
	# Checkbox
	t.set_color("font_color", "CheckBox", TEXT)
	t.set_color("font_hover_color", "CheckBox", GOLD_HELL)
	t.set_color("font_pressed_color", "CheckBox", GOLD_HELL)
	t.set_font_size("font_size", "CheckBox", 21)
	t.set_stylebox("hover", "CheckBox", box(Color(1, 1, 1, 0.06), Color(0, 0, 0, 0), 0, 4))
	t.set_stylebox("normal", "CheckBox", box(Color(0, 0, 0, 0), Color(0, 0, 0, 0), 0, 4))
	t.set_stylebox("pressed", "CheckBox", box(Color(1, 1, 1, 0.08), Color(0, 0, 0, 0), 0, 4))
	# RichText
	t.set_color("default_color", "RichTextLabel", TEXT)
	t.set_font_size("normal_font_size", "RichTextLabel", 22)
	t.set_font_size("bold_font_size", "RichTextLabel", 22)
	t.set_font("bold_font", "RichTextLabel", fett())
	# Scrollbalken
	t.set_stylebox("scroll", "VScrollBar", box(Color(0, 0, 0, 0.3), Color(0, 0, 0, 0), 0, 4))
	t.set_stylebox("grabber", "VScrollBar", box(GOLD.darkened(0.3), Color(0, 0, 0, 0), 0, 4))
	_theme = t
	return t


static func box(bg: Color, rand: Color, breite: int = 2, radius: int = 8) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = rand
	s.set_border_width_all(breite)
	s.set_corner_radius_all(radius)
	s.content_margin_left = 14
	s.content_margin_right = 14
	s.content_margin_top = 8
	s.content_margin_bottom = 8
	return s


static func label(text: String, groesse: int = 22, farbe: Color = TEXT, kontur: int = 0,
		schrift: Font = null) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", groesse)
	l.add_theme_color_override("font_color", farbe)
	if kontur > 0:
		l.add_theme_constant_override("outline_size", kontur)
		l.add_theme_color_override("font_outline_color", Color.BLACK)
	if schrift:
		l.add_theme_font_override("font", schrift)
	return l


static func knopf(text: String, aktion: Callable = Callable(), breite: int = 0) -> Button:
	var b := Button.new()
	b.text = text
	if breite > 0:
		b.custom_minimum_size.x = breite
	b.custom_minimum_size.y = 46
	if aktion.is_valid():
		b.pressed.connect(aktion)
	b.pressed.connect(func(): Audio.spiele("klick", -6.0))
	return b


## Vollbild-Wurzel für eine Oberfläche
static func wurzel(ebene: CanvasLayer) -> Control:
	var c := Control.new()
	c.set_anchors_preset(Control.PRESET_FULL_RECT)
	c.theme = theme()
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ebene.add_child(c)
	return c


static func farbe(hex: String) -> Color:
	return Color.html(hex) if Color.html_is_valid(hex) else TEXT


## Anker setzen und Abstände (Offsets) relativ zu den Ankern
static func setze(c: Control, preset: int, links: float, oben: float, rechts: float, unten: float) -> void:
	c.set_anchors_preset(preset)
	c.offset_left = links
	c.offset_top = oben
	c.offset_right = rechts
	c.offset_bottom = unten


## Vollflächiger CenterContainer (für mittige Einblendungen)
static func mitte(eltern: Control) -> CenterContainer:
	var cc := CenterContainer.new()
	cc.set_anchors_preset(Control.PRESET_FULL_RECT)
	cc.mouse_filter = Control.MOUSE_FILTER_IGNORE
	eltern.add_child(cc)
	return cc
