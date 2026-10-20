class_name Minimap
extends Control
## Runder Radar unten links (wie bei GTA III): dreht sich mit der Kamera, zeigt den Auftraggeber
## (Hut-Symbol) und das aktuelle Ziel (gelbes Quadrat).

const GROESSE := 230.0
const SKALA := 9.5   # Pixel pro Meter

var welt: Keller
var spieler: Spieler
var pate_hat_auftrag := false
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


func _draw() -> void:
	if welt == null or spieler == null:
		return
	var mitte := Vector2(GROESSE, GROESSE) * 0.5
	var r := GROESSE * 0.5
	draw_circle(mitte, r, Color(0.16, 0.19, 0.16, 0.9))
	# Raum
	var ecken := [Vector3(-Keller.B, 0, -Keller.T), Vector3(Keller.B, 0, -Keller.T),
		Vector3(Keller.B, 0, Keller.T), Vector3(-Keller.B, 0, Keller.T)]
	var poly := PackedVector2Array()
	for e in ecken:
		poly.append(_abb(e))
	draw_colored_polygon(poly, Color(0.42, 0.44, 0.42, 0.95))
	poly.append(poly[0])
	draw_polyline(poly, Color(0.9, 0.9, 0.85), 3.0)
	# Einrichtung
	for f in welt.formen:
		var rect: Rect2 = f["r"]
		var p := PackedVector2Array([
			_abb(Vector3(rect.position.x, 0, rect.position.y)),
			_abb(Vector3(rect.end.x, 0, rect.position.y)),
			_abb(Vector3(rect.end.x, 0, rect.end.y)),
			_abb(Vector3(rect.position.x, 0, rect.end.y))])
		draw_colored_polygon(p, Color(f["f"]).darkened(0.15))
	# Tür
	_symbol_text(_abb(Vector3(-Keller.B + 0.4, 0, 7.0)), "↑", Color(0.3, 1.0, 0.5))
	# Ziel-Markierung
	var ziel = welt.marker_pos()
	if ziel != null:
		var zp := _begrenzen(_abb(ziel))
		var puls := 1.0 + sin(_zeit * 5.0) * 0.15
		draw_rect(Rect2(zp - Vector2(8, 8) * puls, Vector2(16, 16) * puls), Color(0, 0, 0))
		draw_rect(Rect2(zp - Vector2(6, 6) * puls, Vector2(12, 12) * puls), Color(1.0, 0.82, 0.1))
	# Pate (Hut-Symbol); größer und gold, wenn er einen Auftrag hat
	var pp := _begrenzen(_abb(welt.pate_pos))
	_hut(pp, 1.25 if pate_hat_auftrag else 0.85, Stil.GOLD_HELL if pate_hat_auftrag else Color(0.85, 0.85, 0.85))
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
