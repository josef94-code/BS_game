class_name Minimap
extends Control
## Runder Radar unten links (wie bei GTA III): dreht sich mit der Kamera, zeigt die Auftraggeber
## (Hut für den Lehrer, Buchstaben für die anderen) und das aktuelle Ziel (gelbes Quadrat).

const GROESSE := 230.0
const SKALA := 9.5   # Pixel pro Meter

const FARBEN := {"kowalski": Color(0.45, 0.68, 0.95), "rosalita": Color(0.95, 0.5, 0.65),
	"bradley": Color(0.98, 0.78, 0.25), "sparky": Color(1.0, 0.55, 0.25)}

var bereich: Bereich
var spieler: Spieler
var marker: Zielmarker
## [{"pos": Vector3, "art": String, "aktiv": bool}]
var personen: Array = []
var _zeit := 0.0


func _ready() -> void:
	custom_minimum_size = Vector2(GROESSE, GROESSE)
	size = custom_minimum_size
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	var m := ShaderMaterial.new()
	m.shader = preload("res://shader/minimap_maske.gdshader")
	m.set_shader_parameter("mitte", Vector2(GROESSE, GROESSE) * 0.5)
	m.set_shader_parameter("radius", GROESSE * 0.5 - 1.0)
	material = m


func _process(delta: float) -> void:
	_zeit += delta
	queue_redraw()


func _abb(p: Vector3) -> Vector2:
	var yaw := spieler.blick()
	var rel := Vector2(p.x - spieler.global_position.x, p.z - spieler.global_position.z)
	var rechts := Vector2(cos(yaw), -sin(yaw))
	var vorne := Vector2(-sin(yaw), -cos(yaw))
	return Vector2(GROESSE, GROESSE) * 0.5 + Vector2(rel.dot(rechts), -rel.dot(vorne)) * SKALA


func _rechteck(r: Rect2, o: Vector3) -> PackedVector2Array:
	return PackedVector2Array([
		_abb(o + Vector3(r.position.x, 0, r.position.y)),
		_abb(o + Vector3(r.end.x, 0, r.position.y)),
		_abb(o + Vector3(r.end.x, 0, r.end.y)),
		_abb(o + Vector3(r.position.x, 0, r.end.y))])


func _draw() -> void:
	if bereich == null or spieler == null:
		return
	var mitte := Vector2(GROESSE, GROESSE) * 0.5
	var r := GROESSE * 0.5
	draw_circle(mitte, r, Color(0.16, 0.19, 0.16, 0.9))
	var o := bereich.position
	# Räume
	for b in bereich.boeden:
		draw_colored_polygon(_rechteck(b["r"], o), Color(b["f"]))
	for b in bereich.boeden:
		var poly := _rechteck(b["r"], o)
		poly.append(poly[0])
		draw_polyline(poly, Color(0.9, 0.9, 0.85), 3.0)
	# Einrichtung
	for f in bereich.formen:
		draw_colored_polygon(_rechteck(f["r"], o), Color(f["f"]).darkened(0.15))
	# Türen und Treppen
	for sy in bereich.symbole:
		_symbol_text(_abb(o + Vector3(sy["p"])), sy["t"], sy["f"])
	# Ziel-Markierung
	var ziel = marker.ziel() if marker else null
	if ziel != null:
		var zp := _begrenzen(_abb(ziel))
		var puls := 1.0 + sin(_zeit * 5.0) * 0.15
		draw_rect(Rect2(zp - Vector2(8, 8) * puls, Vector2(16, 16) * puls), Color(0, 0, 0))
		draw_rect(Rect2(zp - Vector2(6, 6) * puls, Vector2(12, 12) * puls), Color(1.0, 0.82, 0.1))
	# Auftraggeber: größer und farbig, wenn sie einen Auftrag haben (nur im selben Bereich)
	for p in personen:
		if not bereich.enthaelt(p["pos"]):
			continue
		var pp := _begrenzen(_abb(p["pos"]))
		var aktiv: bool = p["aktiv"]
		if p["art"] == "lehrer":
			_hut(pp, 1.25 if aktiv else 0.85, Stil.GOLD_HELL if aktiv else Color(0.85, 0.85, 0.85))
		else:
			var s := 1.25 if aktiv else 0.85
			var farbe: Color = FARBEN.get(p["art"], Color.WHITE) if aktiv else Color(0.8, 0.8, 0.8)
			draw_circle(pp, 12.0 * s, Color(0, 0, 0, 0.8))
			draw_circle(pp, 9.5 * s, farbe)
			_symbol_text(pp, String(p["art"]).substr(0, 1).to_upper(), Color(0.05, 0.05, 0.05))
	# Spieler-Pfeil (zeigt Blickrichtung der Figur relativ zur Kamera)
	var winkel := -(spieler.figur.rotation.y - spieler.blick())
	var pfeil := PackedVector2Array([Vector2(0, -11), Vector2(8, 8), Vector2(0, 4), Vector2(-8, 8)])
	var gedreht := PackedVector2Array()
	for p in pfeil:
		gedreht.append(mitte + p.rotated(winkel))
	draw_colored_polygon(gedreht, Color.WHITE)
	gedreht.append(gedreht[0])
	draw_polyline(gedreht, Color.BLACK, 1.5)
	# Norden
	var nord := (_abb(spieler.global_position + Vector3(0, 0, -100)) - mitte).normalized() * (r - 14.0) + mitte
	draw_circle(nord, 11, Color(0.05, 0.05, 0.05, 0.9))
	_symbol_text(nord, "N", Color.WHITE)
	# Rand
	draw_arc(mitte, r - 4.0, 0, TAU, 64, Color(0.02, 0.02, 0.02), 8.0)
	draw_arc(mitte, r - 8.5, 0, TAU, 64, Color(0.85, 0.85, 0.85, 0.6), 1.5)


func _begrenzen(p: Vector2) -> Vector2:
	var mitte := Vector2(GROESSE, GROESSE) * 0.5
	var d := p - mitte
	var maxr := GROESSE * 0.5 - 16.0
	if d.length() > maxr:
		return mitte + d.normalized() * maxr
	return p


func _hut(p: Vector2, s: float, farbe: Color) -> void:
	draw_circle(p, 13.0 * s, Color(0, 0, 0, 0.75))
	var krempe := PackedVector2Array()
	for i in 32:
		var w := TAU * i / 32.0
		krempe.append(p + Vector2(cos(w) * 11.0, sin(w) * 3.5 + 2.0) * s)
	draw_colored_polygon(krempe, farbe)
	draw_rect(Rect2(p + Vector2(-6.0, -8.0) * s, Vector2(12.0, 10.0) * s), farbe)
	draw_rect(Rect2(p + Vector2(-6.0, -1.5) * s, Vector2(12.0, 2.5) * s), Stil.ROT)


func _symbol_text(p: Vector2, t: String, farbe: Color) -> void:
	var f := Stil.fett()
	var gr := 16
	var b := f.get_string_size(t, HORIZONTAL_ALIGNMENT_LEFT, -1, gr)
	draw_string(f, p + Vector2(-b.x * 0.5, b.y * 0.32), t, HORIZONTAL_ALIGNMENT_LEFT, -1, gr, farbe)
