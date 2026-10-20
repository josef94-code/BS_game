class_name Figur
extends Node3D
## Figur im Stil früher 3D-Spiele (PS2-Ära): Low-Poly, realistische Proportionen,
## Stofftexturen, Gelenke an Knien und Ellbogen. Blickrichtung ist -Z.
## Mit "comic": true gibt es kräftige Konturen und Toon-Licht (für Porträts im Menü).

var stil := {
	"haut": Color(0.92, 0.74, 0.6),
	"haare": Color(0.27, 0.16, 0.08),
	"frisur": "tolle",          # tolle, kurz
	"jacke": Color(0.17, 0.18, 0.21),
	"jacke_textur": "",
	"hose": Color(0.15, 0.16, 0.19),
	"hose_textur": "",
	"schuhe": Color(0.06, 0.05, 0.05),
	"sohle": Color(0.06, 0.05, 0.05),
	"hemd": Color(0.95, 0.95, 0.92),
	"krawatte": Color(0.5, 0.06, 0.1),
	"anzug": true,
	"kapuze": false,
	"aufdruck_vorne": "",
	"aufdruck_hinten": "",
	"breite": 1.0,
	"comic": false,
}

var _oberschenkel: Array[Node3D] = []
var _knie: Array[Node3D] = []
var _oberarm: Array[Node3D] = []
var _ellbogen: Array[Node3D] = []
var _rumpf: Node3D
var _kopf: Node3D
var _augen: Array[Node3D] = []
var _phase := 0.0
var _zeit := 0.0
var _blinzeln := 2.0

## 0 = steht, 1 = läuft, 2 = rennt
var bewegung := 0.0
## 0..1: hebt beim Reden den rechten Arm
var gestik := 0.0


func _init(s: Dictionary = {}) -> void:
	for k in s:
		stil[k] = s[k]


func _ready() -> void:
	_bauen()


func _m(c: Color, textur: String = "", skala: float = 4.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = 0.85
	if textur != "":
		m.albedo_texture = Bau.tex(textur)
		m.uv1_triplanar = true
		m.uv1_scale = Vector3.ONE * skala
		m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	if stil["comic"]:
		m.diffuse_mode = BaseMaterial3D.DIFFUSE_TOON
		m.specular_mode = BaseMaterial3D.SPECULAR_TOON
		m.next_pass = Bau.kontur_mat(0.008, true)
	return m


func _zyl(eltern: Node3D, r_unten: float, r_oben: float, h: float, pos: Vector3, m: Material, segmente: int = 8) -> MeshInstance3D:
	return Bau.zylinder(eltern, r_unten, h, pos, m, Vector3.ZERO, false, r_oben, segmente)


func _kug(eltern: Node3D, r: float, pos: Vector3, m: Material, skala: Vector3 = Vector3.ONE, halb: bool = false) -> MeshInstance3D:
	var mi := Bau.kugel(eltern, r, pos, m, skala, halb)
	var sm := mi.mesh as SphereMesh
	sm.radial_segments = 12
	sm.rings = 6 if halb else 8
	return mi


func _bauen() -> void:
	var haut := _m(stil["haut"])
	var jacke := _m(stil["jacke"], stil["jacke_textur"])
	var hose := _m(stil["hose"], stil["hose_textur"])
	var schuh := _m(stil["schuhe"])
	var sohle := _m(stil["sohle"])
	var br: float = stil["breite"]

	# Beine mit Kniegelenk
	for seite in [-1, 1]:
		var ober := Node3D.new()
		ober.position = Vector3(0.1 * seite * br, 0.98, 0)
		add_child(ober)
		_zyl(ober, 0.066, 0.085, 0.48, Vector3(0, -0.24, 0), hose)
		var knie := Node3D.new()
		knie.position = Vector3(0, -0.48, 0)
		ober.add_child(knie)
		_zyl(knie, 0.05, 0.064, 0.44, Vector3(0, -0.22, 0), hose)
		Bau.box(knie, Vector3(0.11, 0.075, 0.27), Vector3(0, -0.455, -0.05), schuh)
		Bau.box(knie, Vector3(0.115, 0.022, 0.275), Vector3(0, -0.49, -0.05), sohle)
		_oberschenkel.append(ober)
		_knie.append(knie)

	# Rumpf
	_rumpf = Node3D.new()
	_rumpf.position = Vector3(0, 0.98, 0)
	add_child(_rumpf)
	Bau.box(_rumpf, Vector3(0.3 * br, 0.16, 0.19), Vector3(0, 0.03, 0), hose)
	var brust := _zyl(_rumpf, 0.165 * br, 0.205 * br, 0.6, Vector3(0, 0.28, 0), jacke)
	brust.scale.z = 0.62
	_kug(_rumpf, 0.205 * br, Vector3(0, 0.575, 0), jacke, Vector3(1.0, 0.3, 0.62))
	if stil["anzug"]:
		var weiss := _m(stil["hemd"])
		var hemd := Bau.box(_rumpf, Vector3(0.09, 0.2, 0.01), Vector3(0, 0.49, -0.122), weiss)
		hemd.rotation.x = -0.12
		var kraw := _m(stil["krawatte"])
		Bau.box(_rumpf, Vector3(0.036, 0.25, 0.01), Vector3(0, 0.45, -0.128), kraw)
		Bau.box(_rumpf, Vector3(0.045, 0.03, 0.016), Vector3(0, 0.575, -0.126), kraw)
		var dunkel := _m(Color(stil["jacke"]).darkened(0.35), stil["jacke_textur"])
		for seite in [-1, 1]:
			var revers := Bau.box(_rumpf, Vector3(0.045, 0.26, 0.012), Vector3(0.06 * seite, 0.46, -0.126), dunkel)
			revers.rotation.z = 0.33 * seite
		Bau.box(_rumpf, Vector3(0.05, 0.02, 0.01), Vector3(-0.11, 0.45, -0.122), weiss)
		for i in 2:
			Bau.kugel(_rumpf, 0.009, Vector3(0, 0.27 - i * 0.08, -0.124), _m(Color(0.05, 0.05, 0.05)))
	if stil["kapuze"]:
		_kug(_rumpf, 0.13, Vector3(0, 0.6, 0.085), jacke, Vector3(1.35, 0.55, 0.85))
		for seite in [-1, 1]:
			Bau.zylinder(_rumpf, 0.006, 0.14, Vector3(0.04 * seite, 0.5, -0.128), _m(Color(0.9, 0.9, 0.9)))
	if stil["aufdruck_vorne"] != "":
		var l := Bau.schild(_rumpf, stil["aufdruck_vorne"], Vector3(0, 0.4, -0.127), 18, Color(0.95, 0.78, 0.2), PI)
		l.shaded = true
	if stil["aufdruck_hinten"] != "":
		var l := Bau.schild(_rumpf, stil["aufdruck_hinten"], Vector3(0, 0.38, 0.13), 15, Color(0.95, 0.78, 0.2), 0.0)
		l.shaded = true

	# Arme mit Ellbogengelenk
	for seite in [-1, 1]:
		var ober := Node3D.new()
		ober.position = Vector3(0.215 * seite * br, 0.54, 0)
		ober.rotation.z = 0.1 * seite
		_rumpf.add_child(ober)
		_zyl(ober, 0.044, 0.058, 0.3, Vector3(0, -0.15, 0), jacke)
		var ell := Node3D.new()
		ell.position = Vector3(0, -0.3, 0)
		ober.add_child(ell)
		_zyl(ell, 0.036, 0.045, 0.27, Vector3(0, -0.135, 0), jacke)
		if stil["anzug"]:
			_zyl(ell, 0.037, 0.037, 0.025, Vector3(0, -0.265, 0), _m(stil["hemd"]))
		_kug(ell, 0.042, Vector3(0, -0.31, 0), haut, Vector3(0.75, 1.2, 0.55))
		_oberarm.append(ober)
		_ellbogen.append(ell)

	# Hals und Kopf
	_zyl(_rumpf, 0.045, 0.05, 0.1, Vector3(0, 0.64, 0), haut)
	_kopf = Node3D.new()
	_kopf.position = Vector3(0, 0.77, 0)
	_rumpf.add_child(_kopf)
	if stil["comic"]:
		_kopf.scale = Vector3.ONE * 1.18
	_kopf_bauen(haut)


func _kopf_bauen(haut: StandardMaterial3D) -> void:
	var k := _kopf
	_kug(k, 0.105, Vector3.ZERO, haut, Vector3(0.88, 1.1, 1.0))
	_kug(k, 0.075, Vector3(0, -0.058, -0.025), haut, Vector3(1.0, 0.75, 1.0))
	for seite in [-1, 1]:
		_kug(k, 0.024, Vector3(0.091 * seite, -0.005, 0.006), haut, Vector3(0.45, 1.0, 0.8))
	var nase := Bau.box(k, Vector3(0.022, 0.042, 0.028), Vector3(0, -0.012, -0.103), _m(Color(stil["haut"]).darkened(0.05)))
	nase.rotation.x = 0.25
	# Augen (mit Blinzeln), Brauen
	var weiss := _m(Color(0.96, 0.95, 0.92))
	var pupille := _m(Color(0.16, 0.12, 0.08))
	var haar := _m(stil["haare"])
	for seite in [-1, 1]:
		var auge := Node3D.new()
		auge.position = Vector3(0.034 * seite, 0.02, -0.096)
		k.add_child(auge)
		Bau.box(auge, Vector3(0.026, 0.013, 0.006), Vector3.ZERO, weiss)
		Bau.box(auge, Vector3(0.011, 0.013, 0.004), Vector3(0, 0, -0.004), pupille)
		_augen.append(auge)
		var braue := Bau.box(k, Vector3(0.032, 0.008, 0.01), Vector3(0.035 * seite, 0.041, -0.097), haar)
		braue.rotation.z = -0.1 * seite
	# Mund: leichtes Lächeln
	var lippe := _m(Color(0.62, 0.3, 0.27))
	Bau.box(k, Vector3(0.036, 0.007, 0.006), Vector3(0, -0.053, -0.097), lippe)
	for seite in [-1, 1]:
		var ecke := Bau.box(k, Vector3(0.012, 0.006, 0.006), Vector3(0.021 * seite, -0.049, -0.094), lippe)
		ecke.rotation.z = 0.5 * seite
	# Frisur: nach hinten gekippte Haarkappe, vorne eine Tolle
	var kappe := _kug(k, 0.112, Vector3(0, 0.012, 0.004), haar, Vector3(0.92, 1.0, 1.02), true)
	kappe.rotation.x = 0.42
	match stil["frisur"]:
		"tolle":
			var tolle := Bau.box(k, Vector3(0.13, 0.04, 0.07), Vector3(0, 0.1, -0.06), haar)
			tolle.rotation.x = -0.4
			for seite in [-1, 1]:
				Bau.box(k, Vector3(0.012, 0.05, 0.04), Vector3(0.088 * seite, 0.0, -0.02), haar)
		_:
			var pony := Bau.box(k, Vector3(0.14, 0.03, 0.05), Vector3(0, 0.085, -0.075), haar)
			pony.rotation.x = -0.25


func _process(delta: float) -> void:
	_zeit += delta
	if bewegung > 0.05:
		_phase += delta * (7.5 + bewegung * 2.0)
	else:
		_phase = lerpf(_phase, roundf(_phase / PI) * PI, minf(1.0, delta * 6.0))
	var amp := clampf(bewegung, 0.0, 1.8) * 0.5
	var s := sin(_phase)
	for i in 2:
		var richtung := 1.0 if i == 0 else -1.0
		var sw := s * richtung
		_oberschenkel[i].rotation.x = sw * amp
		_knie[i].rotation.x = -(0.05 + maxf(0.0, -sw) * 1.3) * minf(1.0, amp * 2.0 + 0.05)
		_oberarm[i].rotation.x = -sw * amp * 0.9
		_ellbogen[i].rotation.x = 0.2 + amp * 0.5
	# Gestik beim Reden (rechter Arm)
	var g := gestik * (1.0 + sin(_zeit * 2.3) * 0.12)
	_oberarm[1].rotation.x = lerpf(_oberarm[1].rotation.x, 0.45, gestik) + sin(_zeit * 2.3) * 0.08 * gestik
	_ellbogen[1].rotation.x = lerpf(_ellbogen[1].rotation.x, 1.2, g * 0.9)
	_rumpf.position.y = 0.98 + absf(cos(_phase)) * 0.025 * minf(bewegung, 1.0) + sin(_zeit * 1.8) * 0.004
	_rumpf.rotation.x = -0.05 * minf(bewegung, 2.0)
	_kopf.rotation.y = sin(_zeit * 0.5) * 0.06 * (1.0 - minf(bewegung, 1.0))
	# Blinzeln
	_blinzeln -= delta
	var zu := _blinzeln < 0.0
	for a in _augen:
		a.scale.y = 0.15 if zu else 1.0
	if _blinzeln < -0.12:
		_blinzeln = randf_range(2.0, 5.0)


## Kopf (Weltposition) – für die Kamera bei Dialogen
func kopf_position() -> Vector3:
	return _kopf.global_position if _kopf else global_position + Vector3(0, 1.72, 0)
