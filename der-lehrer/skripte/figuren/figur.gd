class_name Figur
extends Node3D
## Figur im Stil früher 3D-Spiele (PS2-Ära, GTA III): Low-Poly, realistische Proportionen,
## Stofftexturen, Gelenke an Hüfte, Knie, Schulter und Ellbogen, gemaltes Gesicht auf einem
## verformten Kopf (Kiefer, Kinn, Brauenwulst). Blickrichtung ist -Z.
## Mit "comic": true gibt es kräftige Konturen und Toon-Licht (für Porträts im Menü).

var stil := {
	"haut": Color(0.92, 0.74, 0.6),
	"haare": Color(0.27, 0.16, 0.08),
	"frisur": "tolle",          # tolle, gegelt, kurz, dutt, lang, zopf, locken, buzz
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
	"ausdruck": "ernst",        # ernst, grimmig, skeptisch, arrogant, angespannt, warm, muede
	"haltung": "",              # verschraenkt, hueften, taschen
	"kiefer": 1.0,              # Breite des Unterkiefers
	"huefte": 1.0,              # Hüftbreite
	"einfach": false,           # Statisten: weniger Polygone, kleinere Gesichtstextur, kein Blinzeln
}

var _oberschenkel: Array[Node3D] = []
var _knie: Array[Node3D] = []
var _oberarm: Array[Node3D] = []
var _ellbogen: Array[Node3D] = []
var _rumpf: Node3D
var _kopf: Node3D
var _schatten: MeshInstance3D
var _gesicht_mat: StandardMaterial3D
var _gesicht_offen: Texture2D
var _gesicht_zu: Texture2D
var _gesicht_mund: Texture2D
var _phase := 0.0
var _zeit := 0.0
var _blinzeln := 2.0
var _mund := 0.0
var _mund_auf := false
var _kopf_drehung := Vector2.ZERO

## 0 = steht, 1 = läuft, 2 = rennt
var bewegung := 0.0
## 0..1: hebt beim Reden den rechten Arm
var gestik := 0.0
## Mund bewegt sich (Figur spricht gerade)
var spricht := false
## Sitzt (z. B. am Tisch in der Cafeteria)
var sitzt := false
## Weltpunkt, zu dem der Kopf schaut (null = geradeaus)
var blick_ziel: Variant = null


func _init(s: Dictionary = {}) -> void:
	for k in s:
		stil[k] = s[k]


func _ready() -> void:
	_zeit = randf() * 10.0
	_bauen()


var _mat_cache := {}


func _m(c: Color, textur: String = "", skala: float = 4.0, kontur: bool = true, rauheit: float = 0.85) -> StandardMaterial3D:
	var schluessel := str([c, textur, skala, kontur, rauheit])
	if _mat_cache.has(schluessel):
		return _mat_cache[schluessel]
	var m := StandardMaterial3D.new()
	_mat_cache[schluessel] = m
	m.albedo_color = c
	m.roughness = rauheit
	if textur != "":
		m.albedo_texture = Bau.tex(textur)
		m.uv1_triplanar = true
		m.uv1_scale = Vector3.ONE * skala
		m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	if stil["comic"]:
		m.diffuse_mode = BaseMaterial3D.DIFFUSE_TOON
		m.specular_mode = BaseMaterial3D.SPECULAR_TOON
		if kontur:
			m.next_pass = Bau.kontur_mat(0.008, true)
	return m


## Gleichfarbige Teile je Gelenk zu einem Mesh verbinden (weniger Zeichenaufrufe)
func _zusammenfassen() -> void:
	var gelenke: Array[Node3D] = [self, _rumpf, _kopf]
	gelenke.append_array(_oberschenkel)
	gelenke.append_array(_knie)
	gelenke.append_array(_oberarm)
	gelenke.append_array(_ellbogen)
	for g in gelenke:
		Bau.zusammenfassen_flach(g)


func _seg(n: int) -> int:
	return maxi(6, n - 4) if stil["einfach"] else n


func _zyl(eltern: Node3D, r_unten: float, r_oben: float, h: float, pos: Vector3, m: Material, segmente: int = 10) -> MeshInstance3D:
	return Bau.zylinder(eltern, r_unten, h, pos, m, Vector3.ZERO, false, r_oben, _seg(segmente))


func _kug(eltern: Node3D, r: float, pos: Vector3, m: Material, skala: Vector3 = Vector3.ONE, halb: bool = false) -> MeshInstance3D:
	var mi := Bau.kugel(eltern, r, pos, m, skala, halb)
	var sm := mi.mesh as SphereMesh
	sm.radial_segments = _seg(12)
	sm.rings = 6 if halb else 8
	return mi


## Kapsel (abgerundeter Zylinder) entlang der Y-Achse
func _kap(eltern: Node3D, r: float, h: float, pos: Vector3, m: Material, skala: Vector3 = Vector3.ONE) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var cm := CapsuleMesh.new()
	cm.radius = r
	cm.height = maxf(h, r * 2.0)
	cm.radial_segments = _seg(10)
	cm.rings = 2
	mi.mesh = cm
	mi.material_override = m
	mi.position = pos
	mi.scale = skala
	eltern.add_child(mi)
	return mi


func _bauen() -> void:
	# Kontaktschatten unter den Füßen
	_schatten = MeshInstance3D.new()
	var qm := QuadMesh.new()
	qm.size = Vector2(0.8, 0.8)
	_schatten.mesh = qm
	_schatten.material_override = Bau.schatten_mat(Bau.fleck_rund_tex(), 0.6)
	_schatten.rotation.x = -PI / 2
	_schatten.position.y = 0.012
	_schatten.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(_schatten)
	var haut := _m(stil["haut"])
	var jacke := _m(stil["jacke"], stil["jacke_textur"])
	var hose := _m(stil["hose"], stil["hose_textur"])
	var schuh := _m(stil["schuhe"], "", 4.0, true, 0.45)
	var sohle := _m(stil["sohle"])
	var br: float = stil["breite"]
	var hf: float = stil["huefte"]

	# Beine: Oberschenkel, Knie, Schienbein, Schuh mit Kappe und Absatz
	for seite in [-1, 1]:
		var ober := Node3D.new()
		ober.position = Vector3(0.095 * seite * br * hf, 0.98, 0)
		add_child(ober)
		_kug(ober, 0.1 * hf, Vector3(0, -0.02, 0), hose, Vector3(1.0, 0.9, 0.95))
		_zyl(ober, 0.066, 0.1 * hf, 0.48, Vector3(0, -0.24, 0), hose)
		var knie := Node3D.new()
		knie.position = Vector3(0, -0.47, 0)
		ober.add_child(knie)
		_kug(knie, 0.066, Vector3(0, 0.0, -0.004), hose, Vector3(1.0, 0.8, 1.0))
		_zyl(knie, 0.056, 0.064, 0.42, Vector3(0, -0.21, 0), hose)
		_zyl(knie, 0.062, 0.058, 0.05, Vector3(0, -0.405, 0), hose)
		Bau.box(knie, Vector3(0.105, 0.075, 0.2), Vector3(0, -0.465, -0.02), schuh)
		_kug(knie, 0.053, Vector3(0, -0.478, -0.12), schuh, Vector3(1.0, 0.62, 1.15), true)
		Bau.box(knie, Vector3(0.112, 0.022, 0.29), Vector3(0, -0.505, -0.045), sohle)
		_oberschenkel.append(ober)
		_knie.append(knie)

	# Rumpf: Becken, Gürtel, Bauch, Brustkorb, Schultern, Nacken
	_rumpf = Node3D.new()
	_rumpf.position = Vector3(0, 0.98, 0)
	add_child(_rumpf)
	var becken := _zyl(_rumpf, 0.145 * br * hf, 0.15 * br, 0.18, Vector3(0, 0.04, 0), hose)
	becken.scale.z = 0.68
	if not stil["anzug"]:
		var guertel := _zyl(_rumpf, 0.153 * br, 0.153 * br, 0.04, Vector3(0, 0.12, 0), _m(Color(0.08, 0.06, 0.05), "", 4.0, true, 0.4))
		guertel.scale.z = 0.7
		Bau.box(_rumpf, Vector3(0.04, 0.03, 0.01), Vector3(0, 0.12, -0.108), _m(Color(0.75, 0.68, 0.45), "", 4.0, false, 0.3))
	var bauch := _zyl(_rumpf, 0.148 * br, 0.17 * br, 0.2, Vector3(0, 0.235, 0), jacke)
	bauch.scale.z = 0.64
	var brust := _zyl(_rumpf, 0.17 * br, 0.2 * br, 0.22, Vector3(0, 0.44, 0), jacke)
	brust.scale.z = 0.68
	var schulter := _kap(_rumpf, 0.068, 0.46 * br, Vector3(0, 0.53, 0.0), jacke, Vector3(1.0, 1.0, 0.9))
	schulter.rotation.z = PI / 2
	var nacken := _zyl(_rumpf, 0.12 * br, 0.06, 0.09, Vector3(0, 0.59, 0.01), jacke)
	nacken.scale.z = 0.72
	if stil["anzug"]:
		var weiss := _m(stil["hemd"])
		var dunkel := _m(Color(stil["jacke"]).darkened(0.3), stil["jacke_textur"])
		# Sakko-Schöße über der Hüfte
		var schoss := _zyl(_rumpf, 0.172 * br * hf, 0.152 * br, 0.17, Vector3(0, 0.06, 0), jacke)
		schoss.scale.z = 0.7
		# Hemd im V-Ausschnitt, Krawatte, Revers, Einstecktuch, Knöpfe
		var hemd := Bau.box(_rumpf, Vector3(0.1, 0.2, 0.01), Vector3(0, 0.48, -0.134), weiss)
		hemd.rotation.x = -0.18
		var kraw := _m(stil["krawatte"], "", 4.0, true, 0.5)
		var kr := Bau.box(_rumpf, Vector3(0.04, 0.27, 0.012), Vector3(0, 0.43, -0.139), kraw)
		kr.rotation.x = -0.12
		Bau.box(_rumpf, Vector3(0.048, 0.032, 0.02), Vector3(0, 0.565, -0.135), kraw)
		for seite in [-1, 1]:
			var revers := Bau.box(_rumpf, Vector3(0.055, 0.25, 0.014), Vector3(0.062 * seite, 0.46, -0.136), dunkel)
			revers.rotation = Vector3(-0.15, 0, 0.3 * seite)
		var tuch := _m(stil.get("einstecktuch", stil["hemd"]))
		Bau.box(_rumpf, Vector3(0.055, 0.025, 0.012), Vector3(-0.115 * br, 0.47, -0.128), tuch)
		for i in 2:
			Bau.kugel(_rumpf, 0.009, Vector3(0, 0.27 - i * 0.08, -0.115), _m(Color(0.05, 0.05, 0.05)))
		# Hemdkragen am Hals
		var kragen := _zyl(_rumpf, 0.058, 0.055, 0.045, Vector3(0, 0.625, 0.0), weiss)
		kragen.scale.z = 0.95
	elif not stil["kapuze"]:
		var kragen := _zyl(_rumpf, 0.064, 0.058, 0.05, Vector3(0, 0.62, 0.0), jacke)
		kragen.scale.z = 0.95
	if stil.has("schuerze"):
		var schuerze := _m(stil["schuerze"])
		var s1 := Bau.box(_rumpf, Vector3(0.3 * br, 0.62, 0.012), Vector3(0, -0.02, -0.122), schuerze)
		s1.rotation.x = 0.06
		Bau.box(_rumpf, Vector3(0.2 * br, 0.22, 0.012), Vector3(0, 0.42, -0.142), schuerze)
		var sb := _zyl(_rumpf, 0.153 * br, 0.153 * br, 0.035, Vector3(0, 0.12, 0), schuerze)
		sb.scale.z = 0.72
		for seite in [-1, 1]:
			var band := Bau.box(_rumpf, Vector3(0.015, 0.16, 0.012), Vector3(0.07 * seite, 0.58, -0.115), schuerze)
			band.rotation.z = -0.35 * seite
	if stil.get("pfeife", false):
		# Trillerpfeife am Band
		var band := _m(Color(0.95, 0.8, 0.15))
		for seite in [-1, 1]:
			var b := Bau.box(_rumpf, Vector3(0.012, 0.2, 0.01), Vector3(0.045 * seite, 0.5, -0.14), band)
			b.rotation.z = 0.25 * seite
		Bau.zylinder(_rumpf, 0.014, 0.05, Vector3(0.0, 0.4, -0.15), _m(Color(0.82, 0.82, 0.85), "", 4.0, true, 0.3), Vector3(0, 0, PI / 2))
	if stil["kapuze"]:
		_kug(_rumpf, 0.13, Vector3(0, 0.6, 0.085), jacke, Vector3(1.35, 0.6, 0.85))
		for seite in [-1, 1]:
			Bau.zylinder(_rumpf, 0.006, 0.14, Vector3(0.04 * seite, 0.5, -0.142), _m(Color(0.9, 0.9, 0.9)))
		# Bauchtasche
		var tasche := Bau.box(_rumpf, Vector3(0.2 * br, 0.09, 0.012), Vector3(0, 0.25, -0.112), _m(Color(stil["jacke"]).darkened(0.12), stil["jacke_textur"]))
		tasche.rotation.x = 0.05
	if stil.get("rucksack", null) != null:
		var rm := _m(stil["rucksack"])
		Bau.box(_rumpf, Vector3(0.26 * br, 0.34, 0.14), Vector3(0, 0.36, 0.185), rm)
		Bau.box(_rumpf, Vector3(0.2 * br, 0.12, 0.05), Vector3(0, 0.27, 0.27), rm)
		for seite in [-1, 1]:
			Bau.box(_rumpf, Vector3(0.035, 0.32, 0.012), Vector3(0.09 * seite, 0.4, -0.13), _m(Color(stil["rucksack"]).darkened(0.3)))
	if stil["aufdruck_vorne"] != "":
		var l := Bau.schild(_rumpf, stil["aufdruck_vorne"], Vector3(0, 0.4, -0.14), 18, Color(0.95, 0.78, 0.2), PI)
		l.shaded = true
	if stil["aufdruck_hinten"] != "" and stil.get("rucksack", null) == null:
		var l := Bau.schild(_rumpf, stil["aufdruck_hinten"], Vector3(0, 0.38, 0.142), 15, Color(0.95, 0.78, 0.2), 0.0)
		l.shaded = true
		l.modulate = stil.get("aufdruck_farbe", Color(0.95, 0.78, 0.2))

	# Arme: Schulter, Oberarm, Ellbogen, Unterarm, Hand mit Daumen
	for seite in [-1, 1]:
		var ober := Node3D.new()
		ober.position = Vector3(0.222 * seite * br, 0.52, 0)
		ober.rotation.z = 0.07 * seite
		_rumpf.add_child(ober)
		_kug(ober, 0.064, Vector3(0, 0.0, 0), jacke, Vector3(1.0, 0.95, 0.95))
		_kap(ober, 0.054, 0.32, Vector3(0, -0.15, 0), jacke)
		var ell := Node3D.new()
		ell.position = Vector3(0, -0.29, 0)
		ober.add_child(ell)
		_kap(ell, 0.046, 0.28, Vector3(0, -0.13, 0), jacke)
		if stil["anzug"]:
			_zyl(ell, 0.04, 0.04, 0.025, Vector3(0, -0.262, 0), _m(stil["hemd"]))
		else:
			_zyl(ell, 0.045, 0.042, 0.035, Vector3(0, -0.255, 0), _m(Color(stil["jacke"]).darkened(0.15), stil["jacke_textur"]))
		var hand := Node3D.new()
		hand.position = Vector3(0, -0.285, 0)
		ell.add_child(hand)
		Bau.box(hand, Vector3(0.032, 0.085, 0.078), Vector3(-0.004 * seite, -0.045, 0), haut)
		var finger := Bau.box(hand, Vector3(0.028, 0.07, 0.07), Vector3(-0.002 * seite, -0.105, 0.004), haut)
		finger.rotation.x = 0.25
		var daumen := Bau.box(hand, Vector3(0.024, 0.055, 0.024), Vector3(-0.02 * seite, -0.045, -0.045), haut)
		daumen.rotation = Vector3(0.5, 0, 0.35 * seite)
		if stil.get("ring", false) and seite == 1:
			Bau.box(hand, Vector3(0.034, 0.014, 0.022), Vector3(0, -0.092, -0.012), _m(Color(0.95, 0.75, 0.25), "", 4.0, false, 0.25))
		_oberarm.append(ober)
		_ellbogen.append(ell)

	# Hals und Kopf
	_zyl(_rumpf, 0.05, 0.056, 0.1, Vector3(0, 0.655, 0.008), _m(Color(stil["haut"]).darkened(0.12)))
	_kopf = Node3D.new()
	_kopf.position = Vector3(0, 0.765, 0)
	_rumpf.add_child(_kopf)
	if stil["comic"]:
		_kopf.scale = Vector3.ONE * 1.12
	_kopf_bauen(haut)
	_zusammenfassen()


func _kopf_bauen(haut: StandardMaterial3D) -> void:
	var k := _kopf
	# Kopf mit gemaltem Gesicht: Grundbild und Varianten (Augen zu, Mund offen)
	var gesicht_stil := {
		"haut": stil["haut"], "haare": stil["haare"], "augenfarbe": stil.get("augenfarbe", Color(0.35, 0.25, 0.15)),
		"bart": stil.get("bart", 0.0), "haaransatz": stil.get("haaransatz", 0.3), "ausdruck": stil["ausdruck"],
		"klein": stil["einfach"],
	}
	for eigenschaft in ["lippen", "wangen", "schnurrbart", "wimpern", "augenringe"]:
		if stil.has(eigenschaft):
			gesicht_stil[eigenschaft] = stil[eigenschaft]
	_gesicht_offen = Gesicht.textur(gesicht_stil, "offen")
	if not stil["einfach"]:
		_gesicht_zu = Gesicht.textur(gesicht_stil, "zu")
		_gesicht_mund = Gesicht.textur(gesicht_stil, "mund")
	_gesicht_mat = _m(Color.WHITE).duplicate()
	_gesicht_mat.albedo_texture = _gesicht_offen
	_gesicht_mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	var kopf := MeshInstance3D.new()
	kopf.mesh = _kopf_mesh(0.108, stil["kiefer"], stil["einfach"])
	kopf.material_override = _gesicht_mat
	k.add_child(kopf)
	# Ohren
	for seite in [-1, 1]:
		var ohr := _kug(k, 0.026, Vector3(0.092 * seite, -0.008, 0.008), haut, Vector3(0.4, 1.05, 0.75))
		ohr.rotation.y = -0.3 * seite
	# Nase: Rücken und Spitze
	var nasenhaut := _m(Color(stil["haut"]).darkened(0.04), "", 4.0, false)
	var nase := Bau.box(k, Vector3(0.018, 0.052, 0.026), Vector3(0, -0.002, -0.097), nasenhaut)
	nase.rotation.x = 0.3
	_kug(k, 0.012, Vector3(0, -0.026, -0.106), nasenhaut, Vector3(1.25, 0.85, 1.0))
	var haar := _m(stil["haare"], "", 4.0, true, 0.35 if stil["frisur"] in ["gegelt", "tolle"] else 0.8)
	# Frisur
	match stil["frisur"]:
		"tolle", "gegelt":
			# nach hinten gekämmt und gegelt, vorne eine feste Tolle
			var kappe := _kug(k, 0.113, Vector3(0, 0.032, 0.01), haar, Vector3(0.92, 0.9, 1.04), true)
			kappe.rotation.x = 0.42
			var tolle := _kug(k, 0.062, Vector3(0, 0.095, -0.03), haar, Vector3(1.22, 0.42, 1.15))
			tolle.rotation.x = -0.18
			if stil["frisur"] == "tolle":
				var welle := _kug(k, 0.04, Vector3(0.015, 0.108, -0.06), haar, Vector3(1.3, 0.38, 0.9))
				welle.rotation.x = -0.3
		"dutt":
			var kappe := _kug(k, 0.112, Vector3(0, 0.03, 0.006), haar, Vector3(0.92, 0.92, 1.03), true)
			kappe.rotation.x = 0.45
			_kug(k, 0.058, Vector3(0, 0.07, 0.1), haar, Vector3(1.0, 0.95, 0.9))
			_kug(k, 0.03, Vector3(0, 0.09, 0.075), haar)
		"lang":
			var kappe := _kug(k, 0.115, Vector3(0, 0.03, 0.006), haar, Vector3(0.95, 0.92, 1.04), true)
			kappe.rotation.x = 0.35
			var hinten := Bau.box(k, Vector3(0.2, 0.24, 0.07), Vector3(0, -0.07, 0.07), haar)
			hinten.rotation.x = 0.12
			for seite in [-1, 1]:
				Bau.box(k, Vector3(0.03, 0.18, 0.08), Vector3(0.095 * seite, -0.05, 0.02), haar)
		"zopf":
			var kappe := _kug(k, 0.113, Vector3(0, 0.03, 0.006), haar, Vector3(0.93, 0.92, 1.03), true)
			kappe.rotation.x = 0.45
			var zopf := _kap(k, 0.025, 0.16, Vector3(0, -0.02, 0.13), haar)
			zopf.rotation.x = 0.3
		"locken":
			var kappe := _kug(k, 0.116, Vector3(0, 0.035, 0.006), haar, Vector3(0.96, 0.95, 1.04), true)
			kappe.rotation.x = 0.4
			for i in 7:
				var w := -1.2 + i * 0.4
				_kug(k, 0.04, Vector3(sin(w) * 0.085, 0.1 - absf(w) * 0.02, cos(w) * 0.05 - 0.01), haar)
		"buzz":
			pass
		_:
			var kappe := _kug(k, 0.112, Vector3(0, 0.03, 0.006), haar, Vector3(0.92, 0.92, 1.03), true)
			kappe.rotation.x = 0.45
			var pony := _kug(k, 0.068, Vector3(0, 0.085, -0.048), haar, Vector3(1.3, 0.45, 1.0))
			pony.rotation.x = -0.2
	if stil.has("brille"):
		# Schutzbrille auf die Stirn geschoben
		var glas := Bau.glas(stil["brille"])
		var b := Bau.box(k, Vector3(0.2, 0.055, 0.02), Vector3(0, 0.07, -0.098), glas)
		b.rotation.x = -0.35
		Bau.box(k, Vector3(0.21, 0.012, 0.18), Vector3(0, 0.085, -0.0), _m(Color(0.12, 0.12, 0.12)))
	if stil.has("sonnenbrille"):
		var sb := _m(Color(0.03, 0.03, 0.04), "", 4.0, false, 0.15)
		for seite in [-1, 1]:
			Bau.box(k, Vector3(0.05, 0.026, 0.008), Vector3(0.033 * seite, 0.012, -0.103), sb)
		Bau.box(k, Vector3(0.125, 0.007, 0.008), Vector3(0, 0.024, -0.104), sb)
	if stil.has("muetze"):
		# Schirmmütze: Kappe über den Haaren, Schirm nach vorne
		var muetze := _m(stil["muetze"])
		var kappe2 := _kug(k, 0.124, Vector3(0, 0.035, 0.006), muetze, Vector3(0.96, 0.92, 1.04), true)
		kappe2.rotation.x = 0.1
		var schirm := Bau.box(k, Vector3(0.16, 0.01, 0.075), Vector3(0, 0.045, -0.13), muetze)
		schirm.rotation.x = 0.22
		Bau.kugel(k, 0.008, Vector3(0, 0.15, 0.0), muetze)
	if stil.has("kopfhoerer"):
		var kh := _m(stil["kopfhoerer"], "", 4.0, true, 0.4)
		var buegel := Bau.torus(k, 0.112, 0.124, Vector3(0, 0.02, 0.0), kh, Vector3(0, 0, PI / 2))
		buegel.scale = Vector3(1.0, 1.0, 0.25)
		for seite in [-1, 1]:
			Bau.zylinder(k, 0.035, 0.03, Vector3(0.1 * seite, -0.01, 0.01), kh, Vector3(0, 0, PI / 2))


## Kopf aus einer Kugel, deren Punkte verschoben werden: flaches Gesicht, Brauenwulst,
## Wangenknochen, kantiger Unterkiefer, vorstehendes Kinn. Die UVs der Kugel bleiben gleich,
## daher passt die gemalte Gesichtstextur weiterhin.
static var _kopf_cache := {}
static func _kopf_mesh(r: float, kiefer: float, einfach: bool) -> ArrayMesh:
	var schluessel := "%s_%s_%s" % [r, kiefer, einfach]
	if _kopf_cache.has(schluessel):
		return _kopf_cache[schluessel]
	var sm := SphereMesh.new()
	sm.radius = r
	sm.height = r * 2.0
	sm.radial_segments = 16 if einfach else 26
	sm.rings = 10 if einfach else 18
	var a := sm.get_mesh_arrays()
	var punkte: PackedVector3Array = a[Mesh.ARRAY_VERTEX]
	for i in punkte.size():
		var p := punkte[i] / r
		var vorne := clampf(-p.z, 0.0, 1.0)
		var y := p.y
		# Grundform: etwas schmaler, höher, Hinterkopf länger
		p.x *= 0.82
		p.y *= 1.13
		if p.z > 0.0:
			p.z *= 1.06
		else:
			p.z *= 0.9
		# Brauenwulst
		var braue := exp(-pow((y - 0.3) / 0.11, 2.0)) * smoothstep(0.55, 0.9, vorne) * smoothstep(0.75, 0.3, absf(p.x))
		p.z -= braue * 0.05
		# Wangenknochen
		var wange := exp(-pow((y + 0.02) / 0.16, 2.0)) * smoothstep(0.2, 0.6, vorne) * smoothstep(0.35, 0.7, absf(p.x))
		p.x += signf(p.x) * wange * 0.035
		# Unterkiefer: unten nicht so spitz zulaufen lassen, Kieferwinkel betonen
		var unten := smoothstep(-0.15, -0.75, y)
		p.x *= 1.0 + unten * 0.13 * kiefer * (1.0 - smoothstep(-0.8, -1.0, y))
		# Kinn nach vorn, Unterseite flacher
		var kinn := smoothstep(-0.55, -0.85, y) * smoothstep(0.5, 0.9, vorne)
		p.z -= kinn * 0.09
		if y < -0.78:
			p.y = lerpf(p.y, -0.88 * 1.13, 0.55)
		# Augenhöhlen leicht vertieft
		var auge := exp(-pow((y - 0.17) / 0.08, 2.0)) * exp(-pow((absf(p.x) - 0.24) / 0.12, 2.0)) * smoothstep(0.7, 0.95, vorne)
		p.z += auge * 0.025
		punkte[i] = p * r
	a[Mesh.ARRAY_VERTEX] = punkte
	var roh := ArrayMesh.new()
	roh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, a)
	var st := SurfaceTool.new()
	st.create_from(roh, 0)
	st.generate_normals()
	var m := st.commit()
	_kopf_cache[schluessel] = m
	return m


func _process(delta: float) -> void:
	_zeit += delta
	if bewegung > 0.05:
		_phase += delta * (7.5 + bewegung * 2.0)
	else:
		_phase = lerpf(_phase, roundf(_phase / PI) * PI, minf(1.0, delta * 6.0))
	var amp := clampf(bewegung, 0.0, 1.8) * 0.5
	var s := sin(_phase)
	var ruhe := 1.0 - minf(1.0, bewegung * 2.0)
	var atmen := sin(_zeit * 1.7)
	for i in 2:
		var richtung := 1.0 if i == 0 else -1.0
		var sw := s * richtung
		if sitzt:
			_oberschenkel[i].rotation = Vector3(1.5, 0, 0.06 * richtung)
			_knie[i].rotation.x = -1.45
		else:
			_oberschenkel[i].rotation = Vector3(sw * amp, 0, 0)
			_knie[i].rotation.x = -(0.05 + maxf(0.0, -sw) * 1.3) * minf(1.0, amp * 2.0 + 0.05)
		# Arme: Laufbewegung oder Haltung im Stand
		var schwung := Vector3(-sw * amp * 0.9, 0, 0.07 * (-richtung))
		var ell := Vector3(0.2 + amp * 0.5, 0, 0)
		var halt := _haltung(i, richtung)
		_oberarm[i].rotation = schwung.lerp(halt[0], ruhe)
		_ellbogen[i].rotation = ell.lerp(halt[1], ruhe)
	# Gestik beim Reden (rechter Arm)
	if gestik > 0.0:
		var g := gestik * (1.0 + sin(_zeit * 2.3) * 0.12)
		_oberarm[1].rotation = _oberarm[1].rotation.lerp(Vector3(0.45 + sin(_zeit * 2.3) * 0.08, 0, -0.1), minf(1.0, gestik * 1.4))
		_ellbogen[1].rotation = _ellbogen[1].rotation.lerp(Vector3(1.2, 0.3, 0), minf(1.0, g * 1.2))
	var hoehe := 0.98
	if sitzt:
		hoehe = 0.5
	_rumpf.position.y = hoehe + absf(cos(_phase)) * 0.025 * minf(bewegung, 1.0) + atmen * 0.003
	_rumpf.scale = Vector3(1.0 + atmen * 0.008 * ruhe, 1.0, 1.0 + atmen * 0.012 * ruhe)
	for o in _oberschenkel:
		o.position.y = hoehe
	_rumpf.rotation.x = -0.05 * minf(bewegung, 2.0) + (0.05 if sitzt else 0.0)
	# Gewicht verlagern im Stand
	_rumpf.rotation.z = sin(_zeit * 0.35) * 0.018 * ruhe * (0.0 if sitzt else 1.0)
	_rumpf.rotation.y = sin(_phase) * 0.06 * minf(bewegung, 1.0)
	_schatten.visible = not sitzt
	# Kopf: zum Blickziel drehen, sonst leicht umherschauen
	var soll := Vector2(sin(_zeit * 0.5) * 0.08 * ruhe, 0.0)
	if blick_ziel != null and _kopf.is_inside_tree():
		var lokal := _rumpf.global_transform.affine_inverse() * (blick_ziel as Vector3)
		var d := lokal - _kopf.position
		var gier := atan2(-d.x, -d.z)
		if absf(gier) < 1.6:
			soll = Vector2(clampf(gier, -0.85, 0.85), clampf(atan2(d.y, Vector2(d.x, d.z).length()), -0.35, 0.3))
	_kopf_drehung = _kopf_drehung.lerp(soll, minf(1.0, delta * 4.0))
	_kopf.rotation = Vector3(_kopf_drehung.y, _kopf_drehung.x, 0)
	# Mund beim Sprechen, Blinzeln
	if _gesicht_mat == null or _gesicht_zu == null:
		return
	if spricht:
		_mund -= delta
		if _mund <= 0.0:
			_mund = randf_range(0.07, 0.16)
			_mund_auf = not _mund_auf if randf() > 0.15 else _mund_auf
	else:
		_mund_auf = false
	_blinzeln -= delta
	if _blinzeln < 0.0:
		_gesicht_mat.albedo_texture = _gesicht_zu
	elif _mund_auf:
		_gesicht_mat.albedo_texture = _gesicht_mund
	else:
		_gesicht_mat.albedo_texture = _gesicht_offen
	if _blinzeln < -0.12:
		_blinzeln = randf_range(2.0, 5.0)


## Zielrotationen [Oberarm, Unterarm] für die Haltung im Stand
func _haltung(i: int, richtung: float) -> Array:
	var seite := -richtung   # i = 0: linker Arm (seite -1), i = 1: rechter Arm (seite +1)
	match stil["haltung"]:
		"verschraenkt":
			return [Vector3(0.32 + 0.06 * i, 0, 0.12 * seite), Vector3(1.75, 1.25 * seite, 0.0)]
		"hueften":
			return [Vector3(-0.12, 0, 0.5 * seite), Vector3(0.15, 0, -1.35 * seite)]
		"taschen":
			return [Vector3(-0.22, 0, 0.1 * seite), Vector3(0.55, 0, 0.0)]
	return [Vector3(0.0, 0, 0.07 * seite), Vector3(0.18, 0, 0)]


## Kopf (Weltposition) – für die Kamera bei Dialogen
func kopf_position() -> Vector3:
	return _kopf.global_position if _kopf else global_position + Vector3(0, 1.72, 0)
