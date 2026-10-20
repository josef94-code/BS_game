class_name Figur
extends Node3D
## Stilisierte Comic-Figur aus Grundkörpern (großer Kopf, kräftige Konturen).
## Blickrichtung ist -Z. Aussehen über das Dictionary "stil".

var stil := {
	"haut": Color(0.96, 0.78, 0.64),
	"haare": Color(0.36, 0.22, 0.12),
	"frisur": "tolle",          # tolle, kurz, glatze
	"oberteil": Color(0.17, 0.18, 0.21),
	"hose": Color(0.15, 0.16, 0.19),
	"schuhe": Color(0.06, 0.05, 0.05),
	"hemd": Color(0.95, 0.95, 0.92),
	"krawatte": Color(0.5, 0.06, 0.1),
	"anzug": true,
	"aufdruck": "",
	"kopf_skala": 1.18,
	"breite": 1.0,
}

var _bein_l: Node3D
var _bein_r: Node3D
var _arm_l: Node3D
var _arm_r: Node3D
var _rumpf: Node3D
var _kopf: Node3D
var _phase := 0.0
var _zeit := 0.0
var _blinzeln := 2.0
var _augen: Array[Node3D] = []

## 0 = steht, 1 = läuft, 2 = rennt
var bewegung := 0.0
## 0..1: hebt beim Reden den rechten Arm
var gestik := 0.0


func _init(s: Dictionary = {}) -> void:
	for k in s:
		stil[k] = s[k]


func _ready() -> void:
	_bauen()


func _m(c: Color, kontur: bool = true) -> StandardMaterial3D:
	var m := Bau.mat(c, "", 1.0, 0.0, true, 0.75)
	return Bau.mit_kontur_rund(m, 0.014) if kontur else m


func _bauen() -> void:
	var haut := _m(stil["haut"])
	var oben := _m(stil["oberteil"])
	var hose := _m(stil["hose"])
	var schuh := _m(stil["schuhe"])
	var br: float = stil["breite"]

	# Beine
	for seite in [-1, 1]:
		var pivot := Node3D.new()
		pivot.position = Vector3(0.11 * seite * br, 0.92, 0)
		add_child(pivot)
		Bau.kapsel(pivot, 0.085, 0.86, Vector3(0, -0.42, 0), hose)
		Bau.box(pivot, Vector3(0.15, 0.1, 0.27), Vector3(0, -0.87, -0.04), schuh)
		if seite < 0:
			_bein_l = pivot
		else:
			_bein_r = pivot

	# Rumpf
	_rumpf = Node3D.new()
	_rumpf.position = Vector3(0, 0.92, 0)
	add_child(_rumpf)
	var torso := Bau.kapsel(_rumpf, 0.21, 0.7, Vector3(0, 0.3, 0), oben)
	torso.scale = Vector3(1.18 * br, 1.0, 0.72)
	if stil["anzug"]:
		# Hemd-Dreieck, Krawatte, Revers, Einstecktuch
		var hemd := Bau.box(_rumpf, Vector3(0.13, 0.22, 0.02), Vector3(0, 0.5, -0.145), _m(stil["hemd"], false))
		hemd.rotation.x = -0.18
		Bau.box(_rumpf, Vector3(0.045, 0.24, 0.02), Vector3(0, 0.45, -0.16), _m(stil["krawatte"], false))
		Bau.box(_rumpf, Vector3(0.06, 0.03, 0.02), Vector3(0, 0.57, -0.165), _m(stil["krawatte"], false))
		for seite in [-1, 1]:
			var revers := Bau.box(_rumpf, Vector3(0.05, 0.26, 0.02), Vector3(0.075 * seite, 0.46, -0.155),
				_m(Color(stil["oberteil"]).darkened(0.25), false))
			revers.rotation.z = 0.35 * seite
		Bau.box(_rumpf, Vector3(0.07, 0.025, 0.015), Vector3(-0.13, 0.43, -0.152), _m(Color.WHITE, false))
		# Knöpfe
		for i in 2:
			Bau.kugel(_rumpf, 0.014, Vector3(0, 0.27 - i * 0.09, -0.155), _m(Color(0.05, 0.05, 0.05), false))
	if stil["aufdruck"] != "":
		var l := Bau.schild(_rumpf, stil["aufdruck"], Vector3(0, 0.42, -0.158), 64, Color(0.95, 0.75, 0.15), PI)
		l.outline_size = 6
		# Kapuze
		var kap := Bau.kugel(_rumpf, 0.17, Vector3(0, 0.6, 0.11), oben)
		kap.scale = Vector3(1.3, 0.6, 0.9)

	# Arme
	for seite in [-1, 1]:
		var pivot := Node3D.new()
		pivot.position = Vector3(0.29 * seite * br, 0.55, 0)
		_rumpf.add_child(pivot)
		Bau.kapsel(pivot, 0.072, 0.6, Vector3(0, -0.27, 0), oben)
		Bau.kugel(pivot, 0.072, Vector3(0, -0.6, 0), haut)
		if stil["anzug"]:
			Bau.zylinder(pivot, 0.065, 0.04, Vector3(0, -0.53, 0), _m(stil["hemd"], false))
		pivot.rotation.z = 0.08 * seite
		if seite < 0:
			_arm_l = pivot
		else:
			_arm_r = pivot

	# Hals und Kopf
	Bau.zylinder(_rumpf, 0.065, 0.14, Vector3(0, 0.68, 0), haut)
	_kopf = Node3D.new()
	_kopf.position = Vector3(0, 0.84, 0)
	_kopf.scale = Vector3.ONE * float(stil["kopf_skala"])
	_rumpf.add_child(_kopf)
	_kopf_bauen(haut)


func _kopf_bauen(haut: StandardMaterial3D) -> void:
	var k := _kopf
	var schaedel := Bau.kugel(k, 0.17, Vector3.ZERO, haut)
	schaedel.scale = Vector3(0.92, 1.08, 0.98)
	# Kinn / Kiefer
	var kinn := Bau.kugel(k, 0.12, Vector3(0, -0.08, -0.04), haut)
	kinn.scale = Vector3(1.05, 0.8, 1.0)
	# Ohren
	for seite in [-1, 1]:
		var ohr := Bau.kugel(k, 0.04, Vector3(0.155 * seite, 0.0, 0.01), haut)
		ohr.scale = Vector3(0.5, 1.0, 0.8)
	# Augen (mit Blinzeln)
	var weiss := _m(Color.WHITE, false)
	var pupille := _m(Color(0.1, 0.12, 0.16), false)
	for seite in [-1, 1]:
		var auge := Node3D.new()
		auge.position = Vector3(0.058 * seite, 0.03, -0.142)
		k.add_child(auge)
		var a := Bau.kugel(auge, 0.034, Vector3.ZERO, weiss)
		a.scale = Vector3(1.0, 1.15, 0.6)
		Bau.kugel(auge, 0.018, Vector3(0, -0.002, -0.017), pupille)
		Bau.kugel(auge, 0.006, Vector3(0.006, 0.008, -0.028), weiss)
		_augen.append(auge)
		# Augenbraue
		var braue := Bau.box(k, Vector3(0.065, 0.014, 0.02), Vector3(0.06 * seite, 0.085, -0.15), _m(stil["haare"], false))
		braue.rotation.z = -0.12 * seite
	# Nase
	var nase := Bau.kugel(k, 0.027, Vector3(0, -0.015, -0.168), _m(Color(stil["haut"]).darkened(0.06), false))
	nase.scale = Vector3(0.9, 1.2, 1.0)
	# Lächeln: nach unten gewölbte Halbkugel mit Zahnreihe
	var mund := Bau.kugel(k, 0.042, Vector3(0, -0.068, -0.148), _m(Color(0.45, 0.1, 0.1), false), Vector3.ONE, true)
	mund.rotation.x = PI
	mund.scale = Vector3(1.25, 0.55, 0.45)
	Bau.box(k, Vector3(0.075, 0.012, 0.012), Vector3(0, -0.072, -0.163), _m(Color.WHITE, false))
	# Frisur
	var haar := _m(stil["haare"])
	match stil["frisur"]:
		"tolle":
			Bau.kugel(k, 0.178, Vector3(0, 0.045, 0.012), haar, Vector3(0.96, 0.85, 1.02), true)
			var tolle := Bau.kugel(k, 0.08, Vector3(0.01, 0.15, -0.09), haar)
			tolle.scale = Vector3(1.55, 0.6, 1.0)
			tolle.rotation.x = -0.35
			for seite in [-1, 1]:
				var seite_haar := Bau.box(k, Vector3(0.03, 0.1, 0.16), Vector3(0.152 * seite, 0.05, 0.03), haar)
				seite_haar.rotation.z = 0.08 * seite
		"kurz":
			Bau.kugel(k, 0.178, Vector3(0, 0.04, 0.01), haar, Vector3(0.96, 0.92, 1.02), true)
			Bau.box(k, Vector3(0.24, 0.05, 0.08), Vector3(0, 0.135, -0.11), haar).rotation.x = -0.3
		_:
			pass


func _process(delta: float) -> void:
	_zeit += delta
	var tempo := 7.0 + bewegung * 2.5
	if bewegung > 0.05:
		_phase += delta * tempo
	else:
		_phase = lerpf(_phase, roundf(_phase / PI) * PI, delta * 6.0)
	var amp := clampf(bewegung, 0.0, 1.6) * 0.55
	var s := sin(_phase)
	_bein_l.rotation.x = s * amp
	_bein_r.rotation.x = -s * amp
	_arm_l.rotation.x = -s * amp * 0.8
	var arm_r_ziel := s * amp * 0.8 - gestik * (1.1 + sin(_zeit * 2.3) * 0.15)
	_arm_r.rotation.x = lerpf(_arm_r.rotation.x, arm_r_ziel, minf(1.0, delta * 10.0))
	_rumpf.position.y = 0.92 + absf(cos(_phase)) * 0.035 * minf(bewegung, 1.0) + sin(_zeit * 1.8) * 0.006
	_rumpf.rotation.x = -0.06 * minf(bewegung, 2.0)
	_kopf.rotation.z = sin(_zeit * 0.7) * 0.03
	# Blinzeln
	_blinzeln -= delta
	var zu := _blinzeln < 0.0
	for a in _augen:
		a.scale.y = 0.1 if zu else 1.0
	if _blinzeln < -0.12:
		_blinzeln = randf_range(2.0, 5.0)


## Kopf (Weltposition) – für Kamera bei Dialogen
func kopf_position() -> Vector3:
	return _kopf.global_position if _kopf else global_position + Vector3(0, 1.75, 0)
