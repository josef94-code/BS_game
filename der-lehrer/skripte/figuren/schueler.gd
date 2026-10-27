class_name Schueler
extends Node3D
## Statist (Schülerin oder Schüler): läuft einen Weg ab, steht in einer Gruppe oder sitzt.
## Bleibt stehen, wenn die Spielfigur im Weg ist, schaut sie an und lässt sich mit [E] ansprechen.

const TEMPO := 1.1

var figur: Figur
var art := "stehen"              # laufen, stehen, sitzen
var weg: Array[Vector3] = []     # Weltpunkte für "laufen" (Rundweg)
var anzeigename := ""
var sprueche := ""               # Schlüssel der Sprüche in dialoge.json
var spieler: Node3D
var interaktiv: Interaktiv

var _stil := {}
var _ziel := 0
var _pause := 0.0
var _blockiert := 0.0
var _ruhe_blick := 0.0
var _redet := false
var _gestik := 0.0
var _gestik_takt := 0.0


func _init(p_stil: Dictionary, p_art: String) -> void:
	_stil = p_stil
	art = p_art


func _ready() -> void:
	figur = Figur.new(_stil)
	figur.sitzt = art == "sitzen"
	add_child(figur)
	_ruhe_blick = rotation.y
	_gestik_takt = randf_range(2.0, 8.0)
	if art != "sitzen":
		var sb := StaticBody3D.new()
		var cs := CollisionShape3D.new()
		var k := CapsuleShape3D.new()
		k.radius = 0.3
		k.height = 1.7
		cs.shape = k
		cs.position.y = 0.85
		sb.add_child(cs)
		add_child(sb)
	if art == "laufen" and weg.size() > 1:
		# beim nächstgelegenen Wegpunkt einsteigen
		var bester := 0
		for i in weg.size():
			if weg[i].distance_to(global_position) < weg[bester].distance_to(global_position):
				bester = i
		_ziel = (bester + 1) % weg.size()


## Wird angesprochen: stehen bleiben, zur Spielfigur drehen, Mund bewegen
func reden(an: bool) -> void:
	_redet = an
	figur.spricht = an
	figur.gestik = 0.5 if an else 0.0


func _process(delta: float) -> void:
	if not is_visible_in_tree():
		return
	var nah := false
	if spieler:
		var zu_spieler := spieler.global_position - global_position
		zu_spieler.y = 0.0
		nah = zu_spieler.length() < 3.5
		figur.blick_ziel = spieler.global_position + Vector3(0, 1.6, 0) if nah else null
		if _redet:
			figur.bewegung = 0.0
			rotation.y = lerp_angle(rotation.y, atan2(-zu_spieler.x, -zu_spieler.z), minf(1.0, delta * 5.0)) if art != "sitzen" else rotation.y
			return
	match art:
		"laufen":
			_laufen(delta)
		"stehen":
			rotation.y = lerp_angle(rotation.y, _ruhe_blick, minf(1.0, delta * 3.0))
			_gestikulieren(delta)
		"sitzen":
			_gestikulieren(delta)


func _gestikulieren(delta: float) -> void:
	# ab und zu mit der Hand reden (Gespräch in der Gruppe)
	_gestik_takt -= delta
	if _gestik_takt <= 0.0:
		_gestik = 0.45 if _gestik == 0.0 else 0.0
		_gestik_takt = randf_range(1.2, 2.5) if _gestik > 0.0 else randf_range(3.0, 9.0)
	figur.gestik = lerpf(figur.gestik, _gestik, minf(1.0, delta * 3.0))


func _laufen(delta: float) -> void:
	if weg.size() < 2:
		figur.bewegung = 0.0
		return
	if _pause > 0.0:
		_pause -= delta
		figur.bewegung = lerpf(figur.bewegung, 0.0, minf(1.0, delta * 8.0))
		return
	var ziel := weg[_ziel]
	var d := ziel - global_position
	d.y = 0.0
	if d.length() < 0.3:
		_ziel = (_ziel + 1) % weg.size()
		if randf() < 0.2:
			_pause = randf_range(1.0, 3.5)
		return
	var richtung := d.normalized()
	# Spielfigur im Weg? Stehen bleiben, nach einer Weile umkehren
	if spieler:
		var zp := spieler.global_position - global_position
		zp.y = 0.0
		if zp.length() < 1.1 and richtung.dot(zp.normalized()) > 0.4:
			figur.bewegung = lerpf(figur.bewegung, 0.0, minf(1.0, delta * 10.0))
			_blockiert += delta
			if _blockiert > 2.0:
				_blockiert = 0.0
				weg.reverse()
				_ziel = weg.size() - 1 - _ziel
			return
	_blockiert = 0.0
	global_position += richtung * TEMPO * delta
	rotation.y = lerp_angle(rotation.y, atan2(-richtung.x, -richtung.z), minf(1.0, delta * 7.0))
	figur.bewegung = lerpf(figur.bewegung, 0.72, minf(1.0, delta * 6.0))
