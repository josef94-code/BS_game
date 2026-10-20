class_name Pate
extends Node3D
## Der Pate (Lehrer Josef): stilisierte Figur nach Foto – kurze braune Haare mit Tolle,
## freundliches Lächeln, dunkler Anzug, weinrote Krawatte.

var figur: Figur
var _ruhe_blick := 0.0
var _ziel: Node3D = null


func _ready() -> void:
	figur = Figur.new({
		"haut": Color(0.95, 0.77, 0.64),
		"haare": Color(0.27, 0.16, 0.08),
		"frisur": "tolle",
		"oberteil": Color(0.16, 0.17, 0.2),
		"hose": Color(0.14, 0.15, 0.18),
		"anzug": true,
		"kopf_skala": 1.2,
		"breite": 0.98,
	})
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


func fertig() -> void:
	_ziel = null
	figur.gestik = 0.0


func _process(delta: float) -> void:
	var soll := _ruhe_blick
	if _ziel:
		var d := _ziel.global_position - global_position
		soll = atan2(-d.x, -d.z)
	rotation.y = lerp_angle(rotation.y, soll, minf(1.0, delta * 4.0))
