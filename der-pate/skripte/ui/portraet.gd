class_name Portraet
extends SubViewportContainer
## Charakterporträt für Menü und Ladebildschirm: die 3D-Figur des Paten im Spotlicht,
## mit kräftigen Konturen (eigene kleine 3D-Welt).

var _figur: Figur
var _drehen := 0.0


func _init(groesse: Vector2i = Vector2i(640, 800)) -> void:
	stretch = true
	custom_minimum_size = Vector2(groesse)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	var vp := SubViewport.new()
	vp.size = groesse
	vp.own_world_3d = true
	vp.transparent_bg = true
	vp.msaa_3d = Viewport.MSAA_4X
	add_child(vp)
	var welt := Node3D.new()
	vp.add_child(welt)
	var env := Environment.new()
	env.background_mode = Environment.BG_CLEAR_COLOR
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.45, 0.35, 0.4)
	env.ambient_light_energy = 0.6
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	var we := WorldEnvironment.new()
	we.environment = env
	welt.add_child(we)
	var p := Pate.new()
	p.comic = true
	welt.add_child(p)
	_figur = p.figur
	p.rotation.y = PI + 0.35
	var spot := SpotLight3D.new()
	spot.position = Vector3(-1.2, 3.2, 1.6)
	spot.light_color = Color(1.0, 0.85, 0.6)
	spot.light_energy = 6.0
	spot.spot_range = 8.0
	spot.spot_angle = 30.0
	welt.add_child(spot)
	spot.look_at_from_position(spot.position, Vector3(0, 1.5, 0))
	var kante := OmniLight3D.new()
	kante.position = Vector3(1.6, 2.2, -1.2)
	kante.light_color = Color(0.9, 0.2, 0.2)
	kante.light_energy = 3.0
	kante.omni_range = 5.0
	welt.add_child(kante)
	var kam := Camera3D.new()
	kam.fov = 28
	welt.add_child(kam)
	kam.look_at_from_position(Vector3(0.0, 1.62, 3.4), Vector3(0, 1.42, 0))


func _process(_delta: float) -> void:
	if _figur:
		_figur.gestik = 0.45
