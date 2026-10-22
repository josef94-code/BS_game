class_name Zielmarker
extends Node3D
## Gelber Leuchtzylinder über dem aktuellen Ziel (wie die Missionsmarker in GTA III).

var _ring: Node3D
var _zeit := 0.0


func _ready() -> void:
	visible = false
	var s := ShaderMaterial.new()
	s.shader = preload("res://shader/marker.gdshader")
	var cm := CylinderMesh.new()
	cm.top_radius = 0.6
	cm.bottom_radius = 0.6
	cm.height = 2.2
	cm.cap_top = false
	cm.cap_bottom = false
	cm.radial_segments = 32
	var mi := MeshInstance3D.new()
	mi.mesh = cm
	mi.material_override = s
	mi.position.y = 1.1
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)
	_ring = Bau.torus(self, 0.5, 0.62, Vector3(0, 0.03, 0), Bau.leucht(Color(1.0, 0.8, 0.1), 2.5))
	_ring.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


func setzen(pos: Variant) -> void:
	if pos == null:
		visible = false
	else:
		visible = true
		global_position = pos


func ziel() -> Variant:
	return global_position if visible else null


func _process(delta: float) -> void:
	_zeit += delta
	if visible:
		_ring.scale = Vector3.ONE * (1.0 + sin(_zeit * 3.0) * 0.08)
