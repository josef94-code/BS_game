class_name Werkstatt
extends Bereich
## Werkstatt der Lincoln High: Werkbänke mit Schraubstöcken, Werkzeugwand, Säulenbohrmaschine,
## Tischkreissäge mit Absauganlage, Laborarbeitsplätze mit Schützen und eine PC-Ecke.
## Anlagen für Akt 3: Folgeschaltung Absaugung/Säge (Schaltschrank +S3) und das Werkstattnetz.

const X := 12.0
const Z := 8.0
const H := 4.5

var sparky_pos := Vector3(2.5, 0, -4.6)
var sparky_blick := PI

var absaugung_ok := false
var netz_ok := false

var _zeit := 0.0
var _takt := 0.0
var _saegeblatt: Node3D
var _saegestaub: CPUParticles3D
var _schranktuer: Node3D
var _vertrag: Node3D
var _uhr_text: Label3D
var _hub_leds: Array[StandardMaterial3D] = []
var _lauscher: Node3D
var _lauscher_led: StandardMaterial3D
var _stuhl_alt: Node3D
var _stuhl_neu: Node3D
var _absaug_audio: AudioStreamPlayer3D

var m_metall: StandardMaterial3D
var m_dunkel: StandardMaterial3D
var m_holz: StandardMaterial3D
var m_gruen: StandardMaterial3D


func _ready() -> void:
	titel = "Werkstatt"
	_boden_form(-X, -Z, X, Z, Color(0.45, 0.47, 0.45), "Werkstatt")
	symbole.append({"p": Vector3(-9.0, 0, -Z + 0.4), "t": "↑", "f": Color(0.3, 1.0, 0.5)})
	m_metall = Bau.mat(Color(0.75, 0.77, 0.8), "metall", 1.0, 0.01)
	m_dunkel = Bau.mat(Color(0.12, 0.12, 0.13), "", 1.0, 0.01)
	m_holz = Bau.mat(Color(1, 1, 1), "holz", 0.8, 0.012)
	m_gruen = Bau.mat(Color(0.25, 0.42, 0.33), "metall", 1.0, 0.012)
	_umgebung()
	_raum()
	_werkbaenke()
	_maschinen()
	_schaltschrank()
	_laborplaetze()
	_pc_ecke()
	_sammel_neu("s_knopfzelle", Vector3(X - 0.6, 0.98, -3.0))
	_sammel_neu("s_bimetall", Vector3(-8.0, 0.06, 6.6))
	_schatten()
	tueren = {"werkstatt_raus": "Erdgeschoss"}
	ankunft = {"Erdgeschoss": [Vector3(-9.0, 0, -Z + 1.6), PI]}
	_fertigstellen(12.0)


func _umgebung() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.02, 0.025, 0.05)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.5, 0.52, 0.5)
	env.ambient_light_energy = 0.4
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 1.1
	env.glow_enabled = true
	env.glow_intensity = 0.8
	env.glow_bloom = 0.1
	env.glow_hdr_threshold = 0.9
	env.fog_enabled = true
	env.fog_light_color = Color(0.12, 0.11, 0.1)
	env.fog_density = 0.02
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.05
	env.adjustment_contrast = 1.1
	umwelt = env
	for p in [Vector3(-6.0, H, -3.0), Vector3(6.0, H, -3.0), Vector3(6.0, H, 3.5)]:
		_roehre(p, true, Color(0.82, 0.95, 0.88))
	_roehre(Vector3(-6.0, H, 3.5), false)
	var l := _lampe(Vector3(-2.0, H, 2.0), Color(1.0, 0.85, 0.6), 1.6, 7.0, true, Color(0.2, 0.22, 0.25), 0.6)
	_schatten_lichter.append(l)
	var l2 := _lampe(Vector3(8.5, H, 6.2), Color(1.0, 0.82, 0.55), 1.2, 5.0, true, Color(0.2, 0.22, 0.25), 0.8)
	_schatten_lichter.append(l2)


func _raum() -> void:
	Bau.box(self, Vector3(X * 2 + 0.6, 0.2, Z * 2 + 0.6), Vector3(0, -0.1, 0), Bau.mat(Color(0.7, 0.72, 0.7), "beton", 0.3, 0.0, false), true)
	Bau.box(self, Vector3(X * 2, 0.2, Z * 2), Vector3(0, H + 0.1, 0), Bau.mat(Color(0.5, 0.5, 0.52), "beton_dunkel", 0.3, 0.0, false))
	var wand := Bau.mat(Color(0.85, 0.88, 0.85), "bloecke", 0.625, 0.0, false)
	var unten := Bau.mat(Color(0.3, 0.45, 0.4), "beton", 0.8, 0.0, false)
	Bau.box(self, Vector3(X * 2 + 0.6, H, 0.3), Vector3(0, H * 0.5, -Z - 0.15), wand, true)
	Bau.box(self, Vector3(0.3, H, Z * 2), Vector3(-X - 0.15, H * 0.5, 0), wand, true)
	Bau.box(self, Vector3(0.3, H, Z * 2), Vector3(X + 0.15, H * 0.5, 0), wand, true)
	# Südwand mit Fenstern
	Bau.box(self, Vector3(X * 2 + 0.6, 1.2, 0.3), Vector3(0, 0.6, Z + 0.15), wand, true)
	Bau.box(self, Vector3(X * 2 + 0.6, H - 3.2, 0.3), Vector3(0, (H + 3.2) * 0.5, Z + 0.15), wand)
	var glas := Bau.glas(Color(0.55, 0.65, 0.85, 0.15))
	var rahmen := Bau.mat(Color(0.2, 0.22, 0.25), "", 1.0, 0.01)
	var x := -X
	while x < X - 0.1:
		Bau.box(self, Vector3(0.6, 2.0, 0.3), Vector3(x + 0.3, 2.2, Z + 0.15), wand)
		Bau.box(self, Vector3(2.4, 2.0, 0.02), Vector3(x + 1.8, 2.2, Z + 0.1), glas)
		Bau.box(self, Vector3(0.05, 2.0, 0.08), Vector3(x + 1.8, 2.2, Z + 0.1), rahmen)
		Bau.box(self, Vector3(2.4, 0.05, 0.08), Vector3(x + 1.8, 2.2, Z + 0.1), rahmen)
		x += 3.0
	Bau.kollisionsbox(self, Vector3(X * 2, H, 0.3), Vector3(0, H * 0.5, Z + 0.15))
	var himmel := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(X * 2 + 2.0, 2.6)
	himmel.mesh = q
	var hm := StandardMaterial3D.new()
	hm.albedo_texture = Erdgeschoss._himmel_tex()
	hm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	hm.uv1_scale = Vector3(3, 1, 1)
	himmel.material_override = hm
	himmel.position = Vector3(0, 2.2, Z + 0.9)
	himmel.rotation.y = PI
	add_child(himmel)
	# grüner Anstrich unten an den Wänden
	for w in [[Vector3(0, 0.6, -Z + 0.02), Vector3(X * 2, 1.2, 0.04)], [Vector3(-X + 0.02, 0.6, 0), Vector3(0.04, 1.2, Z * 2)],
			[Vector3(X - 0.02, 0.6, 0), Vector3(0.04, 1.2, Z * 2)]]:
		Bau.box(self, w[1], w[0], unten)
	# gelbe Gehwegmarkierung
	var gelb := Bau.mat(Color(0.98, 0.8, 0.05), "", 1.0, 0.0, false)
	for z in [-1.2, 0.2]:
		Bau.box(self, Vector3(19.0, 0.012, 0.1), Vector3(-1.5, 0.006, z), gelb)
	# Eingangstür (Nordwand)
	var tuer := Bau.mat(Color(0.45, 0.47, 0.5), "metall", 1.0, 0.012)
	Bau.box(self, Vector3(1.1, 2.2, 0.06), Vector3(-9.0, 1.1, -Z + 0.05), tuer)
	Bau.box(self, Vector3(1.26, 0.08, 0.1), Vector3(-9.0, 2.28, -Z + 0.05), m_dunkel)
	Bau.box(self, Vector3(0.3, 0.05, 0.08), Vector3(-8.65, 1.0, -Z + 0.1), m_metall)
	Bau.box(self, Vector3(0.6, 0.22, 0.06), Vector3(-9.0, 2.6, -Z + 0.05), Bau.leucht(Color(0.1, 0.9, 0.35), 2.5))
	Bau.schild(self, "AUSGANG", Vector3(-9.0, 2.6, -Z + 0.09), 22, Color.WHITE, 0.0, 4)
	stationen["werkstatt_raus"] = Interaktiv.neu(self, "werkstatt_raus", Vector3(-9.0, 0, -Z + 0.7), "Zurück in den Flur", 1.3)
	# Schilder
	Bau.schild(self, "WERKSTATT  ·  MECHATRONIK", Vector3(0, 3.6, -Z + 0.03), 60, Color(0.95, 0.85, 0.6), 0.0, 8)
	_plakat(Vector3(-4.0, 2.4, -Z + 0.03), 0.0, "GEHÖRSCHUTZ\nTRAGEN!", Color(0.15, 0.4, 0.75))
	_plakat(Vector3(-X + 0.03, 2.4, -4.0), PI / 2, "SCHUTZBRILLE\nTRAGEN!", Color(0.15, 0.4, 0.75))
	_plakat(Vector3(X - 0.03, 2.6, 1.5), -PI / 2, "MESSEN,\nNICHT SCHÄTZEN.", Color(0.95, 0.75, 0.1))
	# Erste Hilfe und Feuerlöscher
	Bau.box(self, Vector3(0.45, 0.35, 0.15), Vector3(-6.5, 1.6, -Z + 0.1), Bau.mat(Color(0.1, 0.55, 0.25), "", 1.0, 0.01))
	Bau.schild(self, "+", Vector3(-6.5, 1.6, -Z + 0.18), 60, Color.WHITE)
	Bau.zylinder(self, 0.1, 0.55, Vector3(-7.4, 0.85, -Z + 0.2), Bau.mat(Color(0.8, 0.08, 0.06), "", 1.0, 0.012, false, 0.35))


func _plakat(pos: Vector3, rot_y: float, text: String, farbe: Color) -> void:
	Bau.box(self, Vector3(1.2, 0.8, 0.01), pos, Bau.mat(farbe, "", 1.0, 0.0), false, rot_y)
	var richtung := Vector3(sin(rot_y), 0, cos(rot_y))
	Bau.schild(self, text, pos + richtung * 0.012, 24, Color(0.06, 0.05, 0.05) if farbe.v > 0.8 else Color(0.98, 0.97, 0.92), rot_y)


func _werkbaenke() -> void:
	# Werkbänke an der Ostwand mit Schraubstöcken, darüber die Werkzeugwand
	for i in 3:
		var z := -6.0 + i * 2.6
		var b := Node3D.new()
		b.position = Vector3(X - 0.55, 0, z)
		add_child(b)
		Bau.box(b, Vector3(0.9, 0.08, 2.2), Vector3(0, 0.9, 0), m_holz)
		Bau.box(b, Vector3(0.85, 0.85, 0.06), Vector3(0, 0.45, -1.05), m_gruen)
		Bau.box(b, Vector3(0.85, 0.85, 0.06), Vector3(0, 0.45, 1.05), m_gruen)
		Bau.box(b, Vector3(0.8, 0.5, 0.9), Vector3(0, 0.55, 0.5), m_gruen)
		for s in 3:
			Bau.box(b, Vector3(0.02, 0.14, 0.8), Vector3(-0.41, 0.4 + s * 0.16, 0.5), m_dunkel)
		# Schraubstock
		var blau := Bau.mat(Color(0.2, 0.3, 0.55), "", 1.0, 0.01, false, 0.4)
		Bau.box(b, Vector3(0.22, 0.12, 0.3), Vector3(-0.3, 1.0, -0.5), blau)
		Bau.box(b, Vector3(0.22, 0.14, 0.05), Vector3(-0.45, 1.07, -0.5), blau)
		Bau.zylinder(b, 0.012, 0.3, Vector3(-0.6, 1.0, -0.5), m_metall, Vector3(0, 0, PI / 2))
		Bau.kollisionsbox(b, Vector3(0.9, 1.0, 2.2), Vector3(0, 0.5, 0))
		_form(X - 0.55, z, 0.9, 2.2, Color(0.55, 0.4, 0.25))
	# Werkzeugwand mit Umrissen
	var lochwand := Bau.mat(Color(0.75, 0.7, 0.55), "karton", 2.0, 0.0)
	Bau.box(self, Vector3(0.04, 1.4, 7.2), Vector3(X - 0.03, 1.9, -3.4), lochwand)
	var rng := RandomNumberGenerator.new()
	rng.seed = 9
	for i in 18:
		var z := -6.6 + (i % 9) * 0.8
		var y := 1.45 + (i / 9) * 0.7
		var lang := rng.randf_range(0.2, 0.45)
		var umriss := Bau.box(self, Vector3(0.01, lang + 0.04, 0.09), Vector3(X - 0.055, y, z), m_dunkel)
		umriss.rotation.x = rng.randf_range(-0.3, 0.3)
		var griff := Bau.box(self, Vector3(0.03, lang * 0.45, 0.05), Vector3(X - 0.08, y - lang * 0.2, z), Bau.mat([Color(0.85, 0.1, 0.1), Color(0.95, 0.75, 0.1), Color(0.2, 0.35, 0.75)][i % 3], "", 1.0, 0.0))
		griff.rotation.x = umriss.rotation.x
		Bau.box(self, Vector3(0.02, lang * 0.55, 0.015), Vector3(X - 0.08, y + lang * 0.25, z), m_metall).rotation.x = umriss.rotation.x


func _maschinen() -> void:
	# Tischkreissäge -MA1
	var s := Node3D.new()
	s.position = Vector3(-2.0, 0, 2.6)
	add_child(s)
	var gelb := Bau.mat(Color(0.95, 0.75, 0.1), "metall", 1.0, 0.012, false, 0.4)
	Bau.box(s, Vector3(1.4, 0.8, 1.0), Vector3(0, 0.4, 0), gelb)
	Bau.box(s, Vector3(1.8, 0.05, 1.2), Vector3(0, 0.83, 0), Bau.mat(Color(0.6, 0.62, 0.65), "metall", 1.0, 0.0, false, 0.25))
	_saegeblatt = Node3D.new()
	_saegeblatt.set_meta("dynamisch", true)
	_saegeblatt.position = Vector3(0, 0.86, 0)
	s.add_child(_saegeblatt)
	Bau.zylinder(_saegeblatt, 0.18, 0.006, Vector3.ZERO, Bau.mat(Color(0.8, 0.82, 0.85), "", 1.0, 0.0, false, 0.15), Vector3(PI / 2, 0, 0), false, -1.0, 24)
	Bau.box(s, Vector3(0.3, 0.2, 0.08), Vector3(0, 1.1, 0), Bau.glas(Color(0.8, 0.85, 1.0, 0.4)))
	Bau.zylinder(s, 0.08, 0.6, Vector3(0, 1.45, 0), Bau.mat(Color(0.4, 0.42, 0.45), "", 1.0, 0.01))
	Bau.box(s, Vector3(0.2, 0.15, 0.06), Vector3(0.6, 0.6, -0.53), Bau.mat(Color(0.1, 0.55, 0.2)))
	Bau.box(s, Vector3(0.2, 0.15, 0.06), Vector3(0.6, 0.4, -0.53), Bau.mat(Color(0.8, 0.1, 0.1)))
	Bau.schild(s, "-MA1  KREISSÄGE", Vector3(-0.2, 0.55, -0.51), 20, Color(0.1, 0.1, 0.1), PI)
	Bau.kollisionsbox(s, Vector3(1.8, 0.9, 1.2), Vector3(0, 0.45, 0))
	_form(-2.0, 2.6, 1.8, 1.2, Color(0.9, 0.75, 0.15))
	# Absauganlage -MA2 an der Südwand, Rohre zur Säge
	var a := Node3D.new()
	a.position = Vector3(-6.5, 0, Z - 0.9)
	add_child(a)
	var gruen := Bau.mat(Color(0.2, 0.45, 0.3), "metall", 1.0, 0.012, false, 0.5)
	Bau.box(a, Vector3(1.6, 1.4, 1.0), Vector3(0, 0.7, 0), gruen)
	Bau.zylinder(a, 0.5, 1.2, Vector3(0, 2.0, 0), gruen)
	Bau.zylinder(a, 0.45, 0.6, Vector3(0, 0.9, -0.8), Bau.mat(Color(0.85, 0.85, 0.8), "", 1.0, 0.0, false, 0.6))
	Bau.schild(a, "-MA2  ABSAUGUNG", Vector3(0, 1.2, -0.51), 22, Color.WHITE, PI, 4)
	var rohr := Bau.mat(Color(0.7, 0.72, 0.75), "metall", 1.0, 0.0, false, 0.3)
	Bau.zylinder(a, 0.12, 1.6, Vector3(0, 2.75, 0), rohr)
	Bau.zylinder(self, 0.12, 4.6, Vector3(-4.2, 3.55, Z - 0.9), rohr, Vector3(0, 0, PI / 2))
	Bau.zylinder(self, 0.1, 3.6, Vector3(-1.9, 3.55, (Z - 0.9 + 2.6) * 0.5), rohr, Vector3(PI / 2, 0, 0))
	Bau.zylinder(self, 0.1, 1.9, Vector3(-1.9, 2.6, 2.6), rohr)
	Bau.kollisionsbox(a, Vector3(1.6, 2.6, 1.0), Vector3(0, 1.3, 0))
	_form(-6.5, Z - 0.9, 1.6, 1.0, Color(0.25, 0.5, 0.35))
	_absaug_audio = AudioStreamPlayer3D.new()
	_absaug_audio.stream = Audio.strom("band")
	_absaug_audio.position = Vector3(-6.5, 1.2, Z - 0.9)
	_absaug_audio.unit_size = 4.0
	_absaug_audio.volume_db = -8.0
	add_child(_absaug_audio)
	# Staub über der Säge (solange die Absaugung nicht mitläuft)
	_saegestaub = CPUParticles3D.new()
	_saegestaub.position = Vector3(-2.0, 1.4, 2.6)
	_saegestaub.amount = 80
	_saegestaub.lifetime = 6.0
	_saegestaub.preprocess = 6.0
	_saegestaub.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	_saegestaub.emission_box_extents = Vector3(2.5, 1.2, 2.0)
	_saegestaub.gravity = Vector3(0, -0.02, 0)
	_saegestaub.spread = 180.0
	_saegestaub.initial_velocity_min = 0.02
	_saegestaub.initial_velocity_max = 0.1
	var qm := QuadMesh.new()
	qm.size = Vector2(0.18, 0.18)
	var sm := StandardMaterial3D.new()
	sm.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	sm.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	sm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	sm.albedo_texture = Bau.fleck_rund_tex()
	sm.albedo_color = Color(0.85, 0.78, 0.65, 0.18)
	qm.material = sm
	_saegestaub.mesh = qm
	_saegestaub.set_meta("dynamisch", true)
	add_child(_saegestaub)
	# Säulenbohrmaschine
	var bohr := Node3D.new()
	bohr.position = Vector3(4.5, 0, 5.8)
	add_child(bohr)
	var grau := Bau.mat(Color(0.35, 0.45, 0.55), "metall", 1.0, 0.012, false, 0.45)
	Bau.box(bohr, Vector3(0.6, 0.08, 0.5), Vector3(0, 0.04, 0), grau)
	Bau.zylinder(bohr, 0.05, 1.7, Vector3(0, 0.9, 0.15), m_metall)
	Bau.box(bohr, Vector3(0.4, 0.04, 0.35), Vector3(0, 0.95, -0.05), grau)
	Bau.box(bohr, Vector3(0.3, 0.3, 0.55), Vector3(0, 1.65, -0.05), grau)
	Bau.zylinder(bohr, 0.12, 0.3, Vector3(0, 1.95, 0.15), grau, Vector3(PI / 2, 0, 0))
	Bau.zylinder(bohr, 0.012, 0.2, Vector3(0, 1.4, -0.2), m_metall)
	for i in 3:
		var hebel := Bau.zylinder(bohr, 0.01, 0.3, Vector3(0.22, 1.6, -0.05), m_metall, Vector3(0, i * TAU / 3.0, PI / 2))
		hebel.position.x = 0.2
	Bau.kollisionsbox(bohr, Vector3(0.6, 2.0, 0.6), Vector3(0, 1.0, 0))
	_form(4.5, 5.8, 0.6, 0.6, Color(0.4, 0.5, 0.6))
	# Materialregal
	for i in 4:
		Bau.box(self, Vector3(2.4, 0.05, 0.6), Vector3(1.5, 0.3 + i * 0.6, Z - 0.4), m_metall)
		for j in 3:
			Bau.box(self, Vector3(0.4 + j * 0.1, 0.12, 0.4), Vector3(0.7 + j * 0.8, 0.39 + i * 0.6, Z - 0.4), Bau.mat([Color(0.6, 0.62, 0.65), Color(0.75, 0.55, 0.3), Color(0.3, 0.5, 0.75)][(i + j) % 3], "metall", 1.0, 0.0))
	for dx in [0.3, 2.7]:
		Bau.box(self, Vector3(0.05, 2.2, 0.6), Vector3(dx, 1.1, Z - 0.4), m_metall)
	Bau.kollisionsbox(self, Vector3(2.4, 2.2, 0.6), Vector3(1.5, 1.1, Z - 0.4))
	_form(1.5, Z - 0.4, 2.4, 0.6, Color(0.6, 0.62, 0.65))


func _schaltschrank() -> void:
	var s := Node3D.new()
	s.position = Vector3(-X + 0.3, 0, 1.8)
	s.rotation.y = PI / 2
	add_child(s)
	var ral := Bau.mat(Color(0.8, 0.81, 0.78), "metall", 1.0, 0.015)
	Bau.box(s, Vector3(1.0, 1.8, 0.45), Vector3(0, 1.1, 0), ral, true)
	var innen := Bau.mat(Color(0.9, 0.9, 0.88), "", 1.0, 0.0)
	Bau.box(s, Vector3(0.92, 1.7, 0.02), Vector3(0, 1.1, 0.18), innen)
	for reihe in 3:
		var y := 0.6 + reihe * 0.45
		Bau.box(s, Vector3(0.85, 0.035, 0.02), Vector3(0, y, 0.2), m_metall)
		for i in 5:
			Bau.box(s, Vector3(0.1, 0.2, 0.12), Vector3(-0.33 + i * 0.16, y, 0.25), Bau.mat(Color(0.25, 0.3, 0.38) if (i + reihe) % 2 else Color(0.85, 0.85, 0.82), "", 1.0, 0.006))
	_vertrag = Node3D.new()
	_vertrag.set_meta("dynamisch", true)
	_vertrag.position = Vector3(0.0, 1.55, 0.26)
	_vertrag.visible = false
	s.add_child(_vertrag)
	Bau.box(_vertrag, Vector3(0.21, 0.29, 0.004), Vector3.ZERO, Bau.mat(Color(0.97, 0.96, 0.9), "", 1.0, 0.0))
	Bau.schild(_vertrag, "STERLING BAU\nWartungsvertrag\n480 000 $", Vector3(0, 0.04, 0.004), 9, Color(0.1, 0.1, 0.15))
	_schranktuer = Node3D.new()
	_schranktuer.set_meta("dynamisch", true)
	_schranktuer.position = Vector3(-0.5, 1.1, 0.235)
	s.add_child(_schranktuer)
	Bau.box(_schranktuer, Vector3(1.0, 1.8, 0.03), Vector3(0.5, 0, 0), ral)
	Bau.box(_schranktuer, Vector3(0.04, 0.2, 0.04), Vector3(0.92, 0, 0.03), m_dunkel)
	Bau.box(_schranktuer, Vector3(0.22, 0.2, 0.01), Vector3(0.5, 0.5, 0.02), Bau.mat(Color(1.0, 0.82, 0.0)))
	Bau.schild(_schranktuer, "⚡", Vector3(0.5, 0.5, 0.03), 54, Color.BLACK)
	Bau.schild(_schranktuer, "+S3  ABSAUGUNG / SÄGE", Vector3(0.5, 0.75, 0.02), 22, Color(0.1, 0.1, 0.1))
	Bau.zylinder(_schranktuer, 0.035, 0.03, Vector3(0.5, 0.2, 0.02), Bau.leucht(Color(1.0, 0.15, 0.1), 0.3), Vector3(PI / 2, 0, 0))
	Bau.schild(_schranktuer, "-PF2", Vector3(0.5, 0.12, 0.02), 14, Color(0.1, 0.1, 0.1))
	_form(-X + 0.3, 1.8, 0.45, 1.0, Color(0.8, 0.8, 0.78))
	stationen["absaugung"] = Interaktiv.neu(self, "absaugung", Vector3(-X + 1.2, 0, 1.8), "Schaltschrank +S3 öffnen", 1.7)


func schrank_oeffnen(offen: bool, mit_vertrag: bool = false) -> void:
	_vertrag.visible = mit_vertrag
	var t := create_tween()
	t.tween_property(_schranktuer, "rotation:y", -1.9 if offen else 0.0, 1.0).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


## Laborarbeitsplätze an der Nordwand: Montageplatten mit Schützen, Tastern und Leuchten
func _laborplaetze() -> void:
	var platte := Bau.mat(Color(0.82, 0.83, 0.8), "", 1.0, 0.0)
	for i in 3:
		var x := -2.5 + i * 2.6
		var p := Node3D.new()
		p.position = Vector3(x, 0, -Z + 0.45)
		add_child(p)
		Bau.box(p, Vector3(2.2, 0.08, 0.8), Vector3(0, 0.9, 0.0), m_holz)
		Bau.box(p, Vector3(2.1, 0.86, 0.7), Vector3(0, 0.43, 0.0), m_gruen)
		Bau.box(p, Vector3(2.0, 1.2, 0.04), Vector3(0, 1.65, -0.3), platte)
		for r in 2:
			var y := 1.35 + r * 0.55
			Bau.box(p, Vector3(1.8, 0.03, 0.03), Vector3(0, y, -0.27), m_metall)
			for k in 5:
				var farbe := Color(0.25, 0.3, 0.38) if k % 2 == 0 else Color(0.85, 0.85, 0.82)
				Bau.box(p, Vector3(0.14, 0.22, 0.12), Vector3(-0.7 + k * 0.35, y, -0.2), Bau.mat(farbe, "", 1.0, 0.006))
		for k in 3:
			Bau.zylinder(p, 0.035, 0.04, Vector3(-0.3 + k * 0.3, 1.0, 0.1), Bau.mat([Color(0.85, 0.1, 0.1), Color(0.1, 0.6, 0.2), Color(0.1, 0.6, 0.2)][k], "", 1.0, 0.0), Vector3(0, 0, 0))
		Bau.schild(p, "LABORPLATZ %d" % (i + 1), Vector3(0, 2.35, -0.27), 22, Color(0.1, 0.1, 0.1))
		# Prüfleitungen
		var rot := Bau.mat(Color(0.8, 0.1, 0.1), "", 1.0, 0.0)
		var blau := Bau.mat(Color(0.15, 0.3, 0.8), "", 1.0, 0.0)
		for k in 3:
			var l := Bau.zylinder(p, 0.008, 0.6, Vector3(-0.5 + k * 0.4, 1.15, -0.24), rot if k % 2 == 0 else blau)
			l.rotation.z = 0.5 - k * 0.4
		Bau.kollisionsbox(p, Vector3(2.2, 1.0, 0.8), Vector3(0, 0.5, 0))
		_form(x, -Z + 0.45, 2.2, 0.8, Color(0.35, 0.5, 0.42))


func _pc_ecke() -> void:
	var t := Node3D.new()
	t.position = Vector3(8.6, 0, Z - 1.3)
	add_child(t)
	var platte := Bau.mat(Color(0.75, 0.72, 0.65), "", 1.0, 0.01)
	Bau.box(t, Vector3(1.8, 0.05, 0.8), Vector3(0, 0.74, 0), platte)
	for dx in [-0.85, 0.85]:
		Bau.box(t, Vector3(0.05, 0.72, 0.7), Vector3(dx, 0.36, 0), m_dunkel)
	# Monitor, PC, Tastatur
	Bau.box(t, Vector3(0.62, 0.38, 0.04), Vector3(-0.2, 1.08, 0.2), m_dunkel)
	var bild := Bau.leucht(Color(0.25, 0.45, 0.85), 1.0)
	Bau.box(t, Vector3(0.58, 0.34, 0.01), Vector3(-0.2, 1.08, 0.177), bild)
	Bau.box(t, Vector3(0.08, 0.15, 0.05), Vector3(-0.2, 0.84, 0.22), m_dunkel)
	Bau.box(t, Vector3(0.45, 0.02, 0.15), Vector3(-0.2, 0.775, -0.1), m_dunkel)
	Bau.box(t, Vector3(0.2, 0.42, 0.42), Vector3(0.6, 0.97, 0.1), Bau.mat(Color(0.2, 0.2, 0.22), "", 1.0, 0.01))
	_uhr_text = Bau.schild(t, "01.01.2000  00:03", Vector3(-0.2, 0.96, 0.17), 12, Color(1.0, 0.95, 0.9), PI)
	_uhr_text.set_meta("dynamisch", true)
	# Hub mit blinkenden LEDs und dem fremden Mitschnitt-Gerät
	Bau.box(t, Vector3(0.32, 0.05, 0.16), Vector3(0.3, 0.79, -0.22), Bau.mat(Color(0.75, 0.75, 0.72), "", 1.0, 0.0))
	for i in 6:
		var led := Bau.leucht(Color(0.95, 0.65, 0.1), 2.0)
		_hub_leds.append(led)
		Bau.box(t, Vector3(0.02, 0.01, 0.005), Vector3(0.18 + i * 0.05, 0.8, -0.302), led).set_meta("dynamisch", true)
	Bau.schild(t, "HUB", Vector3(0.38, 0.82, -0.303), 10, Color(0.2, 0.2, 0.2), PI)
	_lauscher = Node3D.new()
	_lauscher.set_meta("dynamisch", true)
	_lauscher.position = Vector3(0.62, 0.78, -0.25)
	t.add_child(_lauscher)
	Bau.box(_lauscher, Vector3(0.09, 0.02, 0.06), Vector3.ZERO, Bau.mat(Color(0.1, 0.45, 0.2)))
	Bau.box(_lauscher, Vector3(0.03, 0.012, 0.03), Vector3(0.0, 0.014, 0.0), Bau.mat(Color(0.7, 0.7, 0.72)))
	_lauscher_led = Bau.leucht(Color(1.0, 0.1, 0.1), 3.0)
	Bau.box(_lauscher, Vector3(0.01, 0.01, 0.01), Vector3(0.035, 0.014, -0.02), _lauscher_led)
	Bau.kugel(_lauscher, 0.008, Vector3(-0.03, 0.012, 0.0), Bau.mat(Color(0.25, 0.02, 0.05)), Vector3(1, 0.4, 1))
	Bau.zylinder(t, 0.004, 0.3, Vector3(0.48, 0.79, -0.25), Bau.mat(Color(0.2, 0.45, 0.85)), Vector3(0, 0, PI / 2))
	# alter Hocker, nach der Reparatur ein richtiger Bürostuhl
	_stuhl_alt = Node3D.new()
	_stuhl_alt.set_meta("dynamisch", true)
	_stuhl_alt.position = Vector3(-0.2, 0, -0.7)
	t.add_child(_stuhl_alt)
	Bau.zylinder(_stuhl_alt, 0.17, 0.05, Vector3(0, 0.62, 0), m_holz)
	for i in 3:
		var bein := Bau.zylinder(_stuhl_alt, 0.015, 0.62, Vector3(cos(i * TAU / 3) * 0.12, 0.3, sin(i * TAU / 3) * 0.12), m_metall)
		bein.rotation = Vector3(sin(i * TAU / 3) * 0.15, 0, -cos(i * TAU / 3) * 0.15)
	_stuhl_neu = Node3D.new()
	_stuhl_neu.set_meta("dynamisch", true)
	_stuhl_neu.position = Vector3(-0.2, 0, -0.7)
	_stuhl_neu.visible = false
	t.add_child(_stuhl_neu)
	var polster := Bau.mat(Color(0.15, 0.2, 0.35), "", 1.0, 0.01, false, 0.8)
	Bau.box(_stuhl_neu, Vector3(0.48, 0.08, 0.46), Vector3(0, 0.48, 0), polster)
	Bau.box(_stuhl_neu, Vector3(0.46, 0.55, 0.07), Vector3(0, 0.82, -0.24), polster)
	Bau.zylinder(_stuhl_neu, 0.03, 0.4, Vector3(0, 0.25, 0), m_dunkel)
	for i in 5:
		var fuss := Bau.box(_stuhl_neu, Vector3(0.3, 0.03, 0.04), Vector3(cos(i * TAU / 5) * 0.15, 0.04, sin(i * TAU / 5) * 0.15), m_dunkel)
		fuss.rotation.y = -i * TAU / 5
	# Notebook auf dem Rollwagen
	var r := Node3D.new()
	r.position = Vector3(6.4, 0, Z - 1.6)
	add_child(r)
	Bau.box(r, Vector3(0.6, 0.04, 0.45), Vector3(0, 0.6, 0), m_metall)
	Bau.box(r, Vector3(0.6, 0.04, 0.45), Vector3(0, 0.2, 0), m_metall)
	for dx in [-0.28, 0.28]:
		for dz in [-0.2, 0.2]:
			Bau.zylinder(r, 0.012, 0.6, Vector3(dx, 0.32, dz), m_metall)
	Bau.box(r, Vector3(0.34, 0.02, 0.24), Vector3(0, 0.63, 0.03), m_dunkel)
	var deckel := Bau.box(r, Vector3(0.34, 0.22, 0.015), Vector3(0, 0.74, -0.09), m_dunkel)
	deckel.rotation.x = -0.25
	Bau.kollisionsbox(t, Vector3(1.8, 0.8, 0.8), Vector3(0, 0.4, 0))
	_form(8.6, Z - 1.3, 1.8, 0.8, Color(0.6, 0.55, 0.45))
	stationen["werkstatt_pc"] = Interaktiv.neu(self, "werkstatt_pc", Vector3(8.6, 0, Z - 2.5), "Werkstatt-PC untersuchen", 1.7)


func _schatten() -> void:
	_wandkante(Vector3(0, 0, -Z), Vector3(0, 0, -1), X * 2)
	_wandkante(Vector3(0, 0, Z), Vector3(0, 0, 1), X * 2)
	_wandkante(Vector3(-X, 0, 0), Vector3(-1, 0, 0), Z * 2)
	_wandkante(Vector3(X, 0, 0), Vector3(1, 0, 0), Z * 2)
	_schattenfleck(Vector3(-2.0, 0, 2.6), Vector2(2.4, 1.8))
	_schattenfleck(Vector3(-6.5, 0, Z - 0.9), Vector2(2.2, 1.6))
	_schattenfleck(Vector3(8.6, 0, Z - 1.3), Vector2(2.2, 1.2))
	for i in 3:
		_schattenfleck(Vector3(-2.5 + i * 2.6, 0, -Z + 0.45), Vector2(2.6, 1.2))


# ---------------------------------------------------------------- Anlagen

func absaugung_reparieren() -> void:
	absaugung_ok = true
	_saegestaub.emitting = false
	_absaug_audio.play()


func vertrag_entfernen() -> void:
	_vertrag.visible = false
	schrank_oeffnen(false)


func netz_reparieren() -> void:
	netz_ok = true
	var minuten := int(Spielstand.d.get("uhrzeit", 1290))
	_uhr_text.text = "14.05.2026  %02d:%02d" % [(minuten / 60) % 24, minuten % 60]
	_stuhl_alt.visible = false
	_stuhl_neu.visible = true
	for led in _hub_leds:
		led.albedo_color = Color(0.1, 0.9, 0.3)
		led.emission = Color(0.1, 0.9, 0.3)


func lauscher_zeigen(an: bool) -> void:
	_lauscher.visible = an
	_lauscher.scale = Vector3.ONE * (2.0 if an else 1.0)


func _process(delta: float) -> void:
	_zeit += delta
	_sammel_animieren(delta)
	if not is_visible_in_tree():
		return
	# Säge läuft (Leerlauf), Absaugung erst nach der Reparatur
	_saegeblatt.rotate_y(delta * 30.0)
	_takt -= delta
	if _takt > 0.0:
		return
	_takt = 0.07
	for led in _hub_leds:
		led.emission_energy_multiplier = 2.5 if randf() > 0.4 else 0.2
	if _lauscher.visible:
		_lauscher_led.emission_energy_multiplier = 3.0 if fmod(_zeit, 0.6) < 0.3 else 0.2
