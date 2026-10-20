class_name Spieler
extends CharacterBody3D
## Spielfigur mit Verfolgerkamera hinter der Figur (WASD + Maus, Shift = rennen, Mausrad = Zoom)

const TEMPO := 3.3
const RENNTEMPO := 6.2
const SPRUNG := 4.2
const MAUS := 0.0024

var figur: Figur
var kamera: Camera3D
var arm: SpringArm3D
var _gieren: Node3D
var _nicken: Node3D
var _schwerkraft: float = ProjectSettings.get_setting("physics/3d/default_gravity", 9.8)
var gesperrt := false


func _ready() -> void:
	var form := CollisionShape3D.new()
	var kapsel := CapsuleShape3D.new()
	kapsel.radius = 0.32
	kapsel.height = 1.8
	form.shape = kapsel
	form.position.y = 0.9
	add_child(form)
	figur = Figur.new({
		"haut": Color(0.86, 0.66, 0.5),
		"haare": Color(0.08, 0.06, 0.05),
		"frisur": "kurz",
		"augenfarbe": Color(0.22, 0.15, 0.1),
		"haaransatz": 0.33,
		"jacke": Color(0.5, 0.1, 0.14),
		"jacke_textur": "strick",
		"hose": Color(0.32, 0.42, 0.62),
		"hose_textur": "jeans",
		"schuhe": Color(0.92, 0.92, 0.9),
		"sohle": Color(0.75, 0.2, 0.15),
		"anzug": false,
		"kapuze": true,
		"aufdruck_vorne": "LH",
		"aufdruck_hinten": "LINCOLN\nLIONS",
		"breite": 0.94,
	})
	add_child(figur)
	# Kamera-Aufhängung
	_gieren = Node3D.new()
	_gieren.position.y = 1.6
	add_child(_gieren)
	_nicken = Node3D.new()
	_nicken.rotation.x = -0.2
	_gieren.add_child(_nicken)
	arm = SpringArm3D.new()
	arm.spring_length = 4.0
	var kugel := SphereShape3D.new()
	kugel.radius = 0.25
	arm.shape = kugel
	arm.position.x = 0.0
	arm.add_excluded_object(get_rid())
	_nicken.add_child(arm)
	kamera = Camera3D.new()
	kamera.fov = 70
	kamera.near = 0.05
	arm.add_child(kamera)
	kamera.current = true


func blick() -> float:
	return _gieren.rotation.y


func setze_blick(y: float) -> void:
	_gieren.rotation.y = y
	figur.rotation.y = y


func _unhandled_input(e: InputEvent) -> void:
	if gesperrt or Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
		return
	if e is InputEventMouseMotion:
		_gieren.rotation.y -= e.relative.x * MAUS
		_nicken.rotation.x = clampf(_nicken.rotation.x - e.relative.y * MAUS, -1.1, 0.45)
	elif e is InputEventMouseButton and e.pressed:
		if e.button_index == MOUSE_BUTTON_WHEEL_UP:
			arm.spring_length = maxf(1.6, arm.spring_length - 0.3)
		elif e.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			arm.spring_length = minf(5.5, arm.spring_length + 0.3)


func _physics_process(delta: float) -> void:
	var eingabe := Vector2.ZERO
	var rennen := false
	if not gesperrt:
		eingabe = Input.get_vector("links", "rechts", "vor", "zurueck")
		rennen = Input.is_action_pressed("rennen")
	var richtung := (_gieren.global_transform.basis * Vector3(eingabe.x, 0, eingabe.y))
	richtung.y = 0
	richtung = richtung.normalized() * eingabe.length()
	var tempo := RENNTEMPO if rennen else TEMPO
	velocity.x = move_toward(velocity.x, richtung.x * tempo, delta * 30.0)
	velocity.z = move_toward(velocity.z, richtung.z * tempo, delta * 30.0)
	if is_on_floor():
		if not gesperrt and Input.is_action_just_pressed("springen"):
			velocity.y = SPRUNG
	else:
		velocity.y -= _schwerkraft * delta
	move_and_slide()
	var flach := Vector2(velocity.x, velocity.z)
	if flach.length() > 0.2:
		var ziel := atan2(-velocity.x, -velocity.z)
		figur.rotation.y = lerp_angle(figur.rotation.y, ziel, minf(1.0, delta * 12.0))
	figur.bewegung = flach.length() / TEMPO
