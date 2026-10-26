class_name Person
extends Node3D
## Ansprechbare Figur (Lehrer, Hausmeister, Cafeteria-Chefin): steht an ihrem Platz,
## dreht sich beim Reden zur Spielfigur und gestikuliert.

var figur: Figur
var stil := {}
## true: Comic-Porträt mit Konturen (Menü, Ladebildschirm)
var comic := false
## kleine Arbeitsbewegung im Leerlauf (z. B. Theke wischen)
var arbeitet := false
var _ruhe_blick := 0.0
var _ziel: Node3D = null
var _zeit := 0.0


func _init(p_stil: Dictionary = {}) -> void:
	stil = p_stil


func _ready() -> void:
	stil["comic"] = comic
	figur = Figur.new(stil)
	add_child(figur)
	_ruhe_blick = rotation.y
	var sb := StaticBody3D.new()
	var cs := CollisionShape3D.new()
	var k := CapsuleShape3D.new()
	k.radius = 0.35
	k.height = 1.8
	cs.shape = k
	cs.position.y = 0.9
	sb.add_child(cs)
	add_child(sb)


## Beim Reden zur Spielfigur drehen und gestikulieren
func sprich_mit(ziel: Node3D) -> void:
	_ziel = ziel
	figur.gestik = 0.6


## An einen neuen Platz stellen (z. B. der Lehrer zieht fürs Finale in die Aula)
func platzieren(pos: Vector3, blick: float) -> void:
	global_position = pos
	rotation.y = blick
	_ruhe_blick = blick


func fertig() -> void:
	_ziel = null
	figur.gestik = 0.0


func _process(delta: float) -> void:
	_zeit += delta
	var soll := _ruhe_blick
	if _ziel:
		var d := _ziel.global_position - global_position
		soll = atan2(-d.x, -d.z)
	elif arbeitet:
		figur.gestik = 0.35 + sin(_zeit * 1.7) * 0.25
	rotation.y = lerp_angle(rotation.y, soll, minf(1.0, delta * 4.0))
