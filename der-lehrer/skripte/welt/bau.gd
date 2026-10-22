class_name Bau
## Baukasten: erzeugt Materialien, prozedurale Texturen und einfache Körper.
## Alle Modelle im Spiel entstehen aus Grundkörpern (keine fremden Assets).

const KONTUR_SHADER := preload("res://shader/kontur.gdshader")
const KEGEL_SHADER := preload("res://shader/lichtkegel.gdshader")

## Konturen an Gegenständen im Raum (Comic-Look). Im GTA-3-Look aus.
static var konturen := false
static var _texturen := {}
static var _konturen := {}


# ---------------------------------------------------------------- Materialien

## Comic-Material: Toon-Licht, satte Farbe, optional Textur (triplanar) und Kontur.
static func mat(farbe: Color, textur: String = "", skala: float = 1.0, kontur: float = 0.0,
		toon: bool = false, rauheit: float = 0.8) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = farbe
	m.roughness = rauheit
	if toon:
		m.diffuse_mode = BaseMaterial3D.DIFFUSE_TOON
		m.specular_mode = BaseMaterial3D.SPECULAR_TOON
		m.rim_enabled = true
		m.rim = 0.25
		m.rim_tint = 0.6
	if textur != "":
		m.albedo_texture = tex(textur)
		m.uv1_triplanar = true
		m.uv1_world_triplanar = true
		m.uv1_scale = Vector3.ONE * skala
		m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	if kontur > 0.0 and konturen:
		m.next_pass = kontur_mat(kontur, false)
	return m


## Leuchtendes Material (Lampen, Anzeigen, Notausgang-Schild)
static func leucht(farbe: Color, energie: float = 2.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = farbe
	m.emission_enabled = true
	m.emission = farbe
	m.emission_energy_multiplier = energie
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	return m


## Durchsichtiges Material (Glas)
static func glas(farbe: Color) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = farbe
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.roughness = 0.1
	m.metallic_specular = 0.9
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	return m


static func kontur_mat(dicke: float, normale: bool) -> ShaderMaterial:
	var key := "%s_%s" % [dicke, normale]
	if _konturen.has(key):
		return _konturen[key]
	var s := ShaderMaterial.new()
	s.shader = KONTUR_SHADER
	s.set_shader_parameter("dicke", dicke)
	s.set_shader_parameter("entlang_normale", normale)
	_konturen[key] = s
	return s


## Kopie eines Materials mit runder (normalenbasierter) Kontur – für Figuren
static func mit_kontur_rund(m: StandardMaterial3D, dicke: float = 0.018) -> StandardMaterial3D:
	var k := m.duplicate() as StandardMaterial3D
	k.next_pass = kontur_mat(dicke, true)
	return k


# ---------------------------------------------------------------- Körper

static func box(eltern: Node3D, groesse: Vector3, pos: Vector3, m: Material,
		kollision: bool = false, rot_y: float = 0.0) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = groesse
	mi.mesh = bm
	mi.material_override = m
	mi.position = pos
	mi.rotation.y = rot_y
	eltern.add_child(mi)
	if kollision:
		_kollision(mi, groesse)
	return mi


static func zylinder(eltern: Node3D, radius: float, hoehe: float, pos: Vector3, m: Material,
		rot: Vector3 = Vector3.ZERO, kollision: bool = false, radius_oben: float = -1.0,
		segmente: int = 20) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.bottom_radius = radius
	cm.top_radius = radius if radius_oben < 0.0 else radius_oben
	cm.height = hoehe
	cm.radial_segments = segmente
	cm.rings = 1
	mi.mesh = cm
	mi.material_override = m
	mi.position = pos
	mi.rotation = rot
	eltern.add_child(mi)
	if kollision:
		var sb := StaticBody3D.new()
		var cs := CollisionShape3D.new()
		var sh := CylinderShape3D.new()
		sh.radius = max(radius, cm.top_radius)
		sh.height = hoehe
		cs.shape = sh
		sb.add_child(cs)
		mi.add_child(sb)
	return mi


static func kugel(eltern: Node3D, radius: float, pos: Vector3, m: Material,
		skala: Vector3 = Vector3.ONE, halb: bool = false) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = radius
	sm.height = radius if halb else radius * 2.0
	sm.radial_segments = 24
	sm.rings = 12
	sm.is_hemisphere = halb
	mi.mesh = sm
	mi.material_override = m
	mi.position = pos
	mi.scale = skala
	eltern.add_child(mi)
	return mi


static func kapsel(eltern: Node3D, radius: float, hoehe: float, pos: Vector3, m: Material,
		rot: Vector3 = Vector3.ZERO) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var cm := CapsuleMesh.new()
	cm.radius = radius
	cm.height = max(hoehe, radius * 2.0)
	cm.radial_segments = 16
	cm.rings = 6
	mi.mesh = cm
	mi.material_override = m
	mi.position = pos
	mi.rotation = rot
	eltern.add_child(mi)
	return mi


static func torus(eltern: Node3D, innen: float, aussen: float, pos: Vector3, m: Material,
		rot: Vector3 = Vector3.ZERO) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var tm := TorusMesh.new()
	tm.inner_radius = innen
	tm.outer_radius = aussen
	tm.rings = 24
	tm.ring_segments = 10
	mi.mesh = tm
	mi.material_override = m
	mi.position = pos
	mi.rotation = rot
	eltern.add_child(mi)
	return mi


## Beschriftung im Raum (Schilder, Betriebsmittelkennzeichen)
static func schild(eltern: Node3D, text: String, pos: Vector3, groesse: int = 48,
		farbe: Color = Color.BLACK, rot_y: float = 0.0, rand: int = 0) -> Label3D:
	var l := Label3D.new()
	l.text = text
	l.font_size = groesse
	l.pixel_size = 0.004
	l.modulate = farbe
	l.outline_size = rand
	l.outline_modulate = Color(0, 0, 0, 0.8)
	l.position = pos
	l.rotation.y = rot_y
	l.double_sided = false
	l.shaded = false
	l.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	eltern.add_child(l)
	return l


## Sichtbarer Lichtkegel unter einer Lampe
static func lichtkegel(eltern: Node3D, pos: Vector3, hoehe: float, radius_unten: float,
		farbe: Color, staerke: float = 0.16) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = 0.18
	cm.bottom_radius = radius_unten
	cm.height = hoehe
	cm.radial_segments = 28
	cm.cap_top = false
	cm.cap_bottom = false
	mi.mesh = cm
	var s := ShaderMaterial.new()
	s.shader = KEGEL_SHADER
	s.set_shader_parameter("farbe", farbe)
	s.set_shader_parameter("staerke", staerke)
	mi.material_override = s
	mi.position = pos - Vector3(0, hoehe * 0.5, 0)
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	eltern.add_child(mi)
	return mi


static func _kollision(mi: MeshInstance3D, groesse: Vector3) -> void:
	var sb := StaticBody3D.new()
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = groesse
	cs.shape = sh
	sb.add_child(cs)
	mi.add_child(sb)


## Unsichtbare Kollisionsbox (z. B. für Figuren oder Raumgrenzen)
static func kollisionsbox(eltern: Node3D, groesse: Vector3, pos: Vector3) -> StaticBody3D:
	var sb := StaticBody3D.new()
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = groesse
	cs.shape = sh
	sb.add_child(cs)
	sb.position = pos
	eltern.add_child(sb)
	return sb


# ---------------------------------------------------------------- Texturen

static func tex(name: String) -> Texture2D:
	if _texturen.has(name):
		return _texturen[name]
	var img: Image
	match name:
		"beton": img = _schmutz(_beton(Color(0.55, 0.54, 0.5), 0.2, 3.0), 0.35, 4, true)
		"beton_dunkel": img = _schmutz(_beton(Color(0.36, 0.36, 0.37), 0.14, 5.0), 0.25, 5, false)
		"ziegel": img = _schmutz(_ziegel(), 0.3, 6, false)
		"nadelstreifen": img = _streifen()
		"jeans": img = _jeans()
		"strick": img = _beton(Color(0.85, 0.85, 0.85), 0.25, 60.0)
		"fleck": img = _fleck()
		"maschendraht": img = _maschendraht()
		"holz": img = _holz()
		"teppich": img = _beton(Color(0.42, 0.08, 0.09), 0.1, 18.0)
		"metall": img = _schmutz(_metall(), 0.2, 8, false)
		"karton": img = _beton(Color(0.66, 0.5, 0.32), 0.12, 9.0)
		"kork": img = _beton(Color(0.62, 0.45, 0.27), 0.3, 22.0)
		_: img = _beton(Color(0.6, 0.6, 0.6), 0.1, 3.0)
	img.generate_mipmaps()
	var t := ImageTexture.create_from_image(img)
	_texturen[name] = t
	return t


static func _rauschen(frequenz: float, saat: int) -> FastNoiseLite:
	var n := FastNoiseLite.new()
	n.seed = saat
	n.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	n.frequency = frequenz / 256.0
	n.fractal_octaves = 4
	return n


static func _beton(grund: Color, staerke: float, frequenz: float) -> Image:
	var n := _rauschen(frequenz, 7)
	var img := n.get_seamless_image(256, 256)
	img.convert(Image.FORMAT_RGB8)
	for y in 256:
		for x in 256:
			var v := img.get_pixel(x, y).r - 0.5
			img.set_pixel(x, y, Color(grund.r + v * staerke, grund.g + v * staerke, grund.b + v * staerke))
	return img


static func _ziegel() -> Image:
	var n := _rauschen(30.0, 3)
	var rausch := n.get_seamless_image(256, 256)
	var img := Image.create(256, 256, false, Image.FORMAT_RGB8)
	var fuge := Color(0.72, 0.7, 0.66)
	for y in 256:
		var reihe := y / 32
		var versatz := 32 if reihe % 2 == 1 else 0
		for x in 256:
			var v := rausch.get_pixel(x, y).r - 0.5
			var xx := (x + versatz) % 64
			var yy := y % 32
			if xx < 3 or yy < 3:
				img.set_pixel(x, y, fuge.darkened(0.1 + v * 0.2))
			else:
				var stein := ((x + versatz) / 64 * 7 + reihe * 13) % 5
				var c := Color(0.62, 0.27, 0.18).lightened(stein * 0.035).darkened(v * 0.35)
				img.set_pixel(x, y, c)
	return img


static func _holz() -> Image:
	var n := _rauschen(12.0, 11)
	var rausch := n.get_seamless_image(256, 256)
	var img := Image.create(256, 256, false, Image.FORMAT_RGB8)
	for y in 256:
		for x in 256:
			var v := rausch.get_pixel(x, y).r
			var maser := 0.5 + 0.5 * sin((y + v * 60.0) * 0.35)
			var c := Color(0.42, 0.23, 0.12).lerp(Color(0.3, 0.15, 0.08), maser * 0.7)
			img.set_pixel(x, y, c)
	return img


static func _metall() -> Image:
	var n := _rauschen(4.0, 21)
	var rausch := n.get_seamless_image(256, 256)
	var img := Image.create(256, 256, false, Image.FORMAT_RGB8)
	for y in 256:
		for x in 256:
			var v := rausch.get_pixel(x, y).r
			var streifen := sin(y * 2.7 + v * 4.0) * 0.02
			var g := 0.62 + (v - 0.5) * 0.12 + streifen
			img.set_pixel(x, y, Color(g, g, g * 1.02))
	return img


## Schmutz, Flecken und (optional) Risse über eine Textur legen – für den abgenutzten Look
static func _schmutz(img: Image, staerke: float, saat: int, risse: bool) -> Image:
	var flecken := _rauschen(5.0, saat).get_seamless_image(256, 256)
	var fein := _rauschen(40.0, saat + 1).get_seamless_image(256, 256)
	for y in 256:
		for x in 256:
			var f := flecken.get_pixel(x, y).r
			var dunkel := clampf((f - 0.55) * 3.0, 0.0, 1.0) * staerke
			dunkel += (fein.get_pixel(x, y).r - 0.5) * staerke * 0.3
			var c := img.get_pixel(x, y)
			img.set_pixel(x, y, Color(c.r * (1.0 - dunkel), c.g * (1.0 - dunkel * 0.95), c.b * (1.0 - dunkel * 0.85)))
	if risse:
		var rng := RandomNumberGenerator.new()
		rng.seed = saat
		for r in 6:
			var p := Vector2(rng.randf_range(0, 256), rng.randf_range(0, 256))
			var w := rng.randf_range(0, TAU)
			for i in 90:
				w += rng.randf_range(-0.5, 0.5)
				p += Vector2(cos(w), sin(w))
				var px := int(posmod(int(p.x), 256))
				var py := int(posmod(int(p.y), 256))
				img.set_pixel(px, py, img.get_pixel(px, py).darkened(0.45))
	return img


static func _streifen() -> Image:
	var rausch := _rauschen(60.0, 31).get_seamless_image(128, 128)
	var img := Image.create(128, 128, false, Image.FORMAT_RGB8)
	for y in 128:
		for x in 128:
			var v := 0.45 + (rausch.get_pixel(x, y).r - 0.5) * 0.08
			if x % 16 == 0:
				v = 0.95
			img.set_pixel(x, y, Color(v, v, v))
	return img


static func _jeans() -> Image:
	var rausch := _rauschen(30.0, 41).get_seamless_image(128, 128)
	var img := Image.create(128, 128, false, Image.FORMAT_RGB8)
	for y in 128:
		for x in 128:
			var koeper := 0.08 if (x + y) % 4 < 2 else 0.0
			var v := 0.8 + (rausch.get_pixel(x, y).r - 0.5) * 0.3 + koeper
			img.set_pixel(x, y, Color(v * 0.95, v * 0.97, v))
	return img


## Ölfleck / Schmutzfleck mit Transparenz (für Bodendekore)
static func _fleck() -> Image:
	var rausch := _rauschen(14.0, 51).get_seamless_image(128, 128)
	var img := Image.create(128, 128, false, Image.FORMAT_RGBA8)
	for y in 128:
		for x in 128:
			var d := Vector2(x - 64, y - 64).length() / 64.0
			var a := clampf((1.0 - d) * 1.6 + (rausch.get_pixel(x, y).r - 0.5) * 1.2, 0.0, 1.0)
			img.set_pixel(x, y, Color(0.05, 0.04, 0.03, a * 0.75))
	return img


## Maschendraht (Rauten aus Draht, dazwischen durchsichtig)
static func _maschendraht() -> Image:
	var img := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	for y in 64:
		for x in 64:
			var a := absf(fmod(x + y, 32.0) - 16.0)
			var b := absf(fmod(x - y + 64.0, 32.0) - 16.0)
			var draht := minf(absf(a - 16.0), absf(b - 16.0))
			var alpha := clampf(2.2 - draht, 0.0, 1.0)
			img.set_pixel(x, y, Color(0.7, 0.72, 0.7, alpha))
	return img
