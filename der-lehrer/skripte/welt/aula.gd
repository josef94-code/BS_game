class_name Aula
extends Bereich
## Aula im ersten Stock: Bühne mit Leinwand und Rednerpult, neun Prüfungsplätze mit PCs,
## Prüfungsserver an der Westwand, große Fenster nach Osten.
## Anlagen für das Finale: das Prüfungsnetz (Mission 15) und die Abschlussprüfung (Mission 16).
## Nach Mission 15 wird es Morgen: Tageslicht statt Nacht.

const X := 12.0
const Z := 10.0
const H := 6.0
const BUEHNE := -6.6   # Vorderkante der Bühne

var lehrer_pos := Vector3(2.6, 0, -5.4)
var lehrer_blick := PI

var server_ok := false
var morgen := false

var _zeit := 0.0
var _takt := 0.0
var _flackern := 0.0
var _env_nacht: Environment
var _env_tag: Environment
var _himmel_mat: StandardMaterial3D
var _lichter: Array[Light3D] = []
var _energie := {}
var _sonne: Array[Node3D] = []
var _server_leds: Array[StandardMaterial3D] = []
var _klon: Node3D
var _klon_led: StandardMaterial3D
var _bild_mats: Array[StandardMaterial3D] = []
var _bild_texte: Array[Label3D] = []
var _leinwand_text: Label3D
var _uhr_text: Label3D
var _vince: Person
var _tablet: Node3D

var m_metall: StandardMaterial3D
var m_dunkel: StandardMaterial3D
var m_holz: StandardMaterial3D


func _ready() -> void:
	titel = "Aula"
	_boden_form(-X, -Z, X, Z, Color(0.55, 0.4, 0.28), "Aula")
	symbole.append({"p": Vector3(-9.0, 0, Z + 0.4), "t": "↓", "f": Color(0.3, 1.0, 0.5)})
	m_metall = Bau.mat(Color(0.75, 0.77, 0.8), "metall", 1.0, 0.01)
	m_dunkel = Bau.mat(Color(0.12, 0.12, 0.13), "", 1.0, 0.01)
	m_holz = Bau.mat(Color(1, 1, 1), "holz", 0.8, 0.012)
	_umgebung()
	_raum()
	_buehne()
	_pruefungsplaetze()
	_server()
	_vince_bauen()
	_sammel_neu("s_zeitrelais", Vector3(X - 0.7, 0.06, 6.6))
	_schatten()
	tueren = {"aula_raus": "Erdgeschoss"}
	ankunft = {"Erdgeschoss": [Vector3(-9.0, 0, Z - 1.6), 0.0]}
	stationen["lehrer"] = Interaktiv.neu(self, "lehrer", lehrer_pos, "Mit dem Lehrer sprechen", 2.4)
	stationen["lehrer"].aktiv = false
	_fertigstellen(10.0)


func _umgebung() -> void:
	_env_nacht = Environment.new()
	_env_nacht.background_mode = Environment.BG_COLOR
	_env_nacht.background_color = Color(0.02, 0.025, 0.06)
	_env_nacht.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	_env_nacht.ambient_light_color = Color(0.45, 0.42, 0.5)
	_env_nacht.ambient_light_energy = 0.5
	_env_nacht.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	_env_nacht.tonemap_exposure = 1.1
	_env_nacht.glow_enabled = true
	_env_nacht.glow_intensity = 0.8
	_env_nacht.glow_bloom = 0.1
	_env_nacht.glow_hdr_threshold = 0.9
	_env_nacht.fog_enabled = true
	_env_nacht.fog_light_color = Color(0.1, 0.1, 0.14)
	_env_nacht.fog_density = 0.018
	_env_nacht.adjustment_enabled = true
	_env_nacht.adjustment_saturation = 1.05
	_env_nacht.adjustment_contrast = 1.1
	_env_tag = _env_nacht.duplicate()
	_env_tag.background_color = Color(0.55, 0.7, 0.9)
	_env_tag.ambient_light_color = Color(0.95, 0.9, 0.8)
	_env_tag.ambient_light_energy = 0.95
	_env_tag.fog_light_color = Color(0.75, 0.72, 0.65)
	_env_tag.fog_density = 0.012
	_env_tag.adjustment_saturation = 1.12
	umwelt = _env_nacht
	for x in [-6.0, 0.0, 6.0]:
		for z in [-3.0, 3.5]:
			var l := _lampe(Vector3(x, H, z), Color(1.0, 0.86, 0.62), 1.5, 8.0, x == 0.0, Color(0.55, 0.08, 0.1), 0.9)
			_lichter.append(l)
			if x == 0.0:
				_schatten_lichter.append(l)
	# Bühnenlicht
	for x in [-3.5, 3.5]:
		var s := SpotLight3D.new()
		s.position = Vector3(x, H - 0.3, -3.0)
		s.rotation = Vector3(-0.75, 0, 0)
		s.light_color = Color(1.0, 0.92, 0.75)
		s.light_energy = 2.2
		s.spot_range = 10.0
		s.spot_angle = 30.0
		add_child(s)
		_lichter.append(s)
		Bau.zylinder(self, 0.14, 0.32, Vector3(x, H - 0.25, -3.0), m_dunkel, Vector3(-0.75, 0, 0))
	for l in _lichter:
		_energie[l] = l.light_energy


func _raum() -> void:
	var boden := Bau.mat(Color(0.78, 0.6, 0.45), "parkett", 0.5, 0.0, false, 0.35)
	Bau.box(self, Vector3(X * 2 + 0.6, 0.2, Z * 2 + 0.6), Vector3(0, -0.1, 0), boden, true)
	Bau.box(self, Vector3(X * 2, 0.2, Z * 2), Vector3(0, H + 0.1, 0), Bau.mat(Color(1, 1, 1), "deckenplatten", 0.83, 0.0, false))
	var wand := Bau.mat(Color(0.93, 0.89, 0.8), "putz", 0.5, 0.0, false)
	var paneel := Bau.mat(Color(0.75, 0.55, 0.38), "holz", 0.6, 0.0, false)
	Bau.box(self, Vector3(X * 2 + 0.6, H, 0.3), Vector3(0, H * 0.5, -Z - 0.15), wand, true)
	Bau.box(self, Vector3(X * 2 + 0.6, H, 0.3), Vector3(0, H * 0.5, Z + 0.15), wand, true)
	Bau.box(self, Vector3(0.3, H, Z * 2), Vector3(-X - 0.15, H * 0.5, 0), wand, true)
	# Holzverkleidung unten
	for w in [[Vector3(0, 0.6, Z - 0.02), Vector3(X * 2, 1.2, 0.04)], [Vector3(-X + 0.02, 0.6, 0), Vector3(0.04, 1.2, Z * 2)]]:
		Bau.box(self, w[1], w[0], paneel)
	# Ostwand mit hohen Fenstern
	Bau.box(self, Vector3(0.3, 1.0, Z * 2), Vector3(X + 0.15, 0.5, 0), wand, true)
	Bau.box(self, Vector3(0.3, H - 4.8, Z * 2), Vector3(X + 0.15, (H + 4.8) * 0.5, 0), wand)
	var glas := Bau.glas(Color(0.6, 0.7, 0.9, 0.12))
	var rahmen := Bau.mat(Color(0.95, 0.95, 0.92), "", 1.0, 0.01)
	var z := -Z
	while z < Z - 0.1:
		Bau.box(self, Vector3(0.3, 3.8, 0.7), Vector3(X + 0.15, 2.9, z + 0.35), wand)
		Bau.box(self, Vector3(0.02, 3.8, 2.3), Vector3(X + 0.1, 2.9, z + 1.85), glas)
		Bau.box(self, Vector3(0.08, 3.8, 0.06), Vector3(X + 0.08, 2.9, z + 1.85), rahmen)
		Bau.box(self, Vector3(0.08, 0.06, 2.3), Vector3(X + 0.08, 3.6, z + 1.85), rahmen)
		Bau.box(self, Vector3(0.25, 0.05, 2.3), Vector3(X - 0.05, 1.02, z + 1.85), rahmen)
		z += 3.0
	Bau.kollisionsbox(self, Vector3(0.3, H, Z * 2), Vector3(X + 0.15, H * 0.5, 0))
	var himmel := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(Z * 2 + 2.0, 4.4)
	himmel.mesh = q
	_himmel_mat = StandardMaterial3D.new()
	_himmel_mat.albedo_texture = Erdgeschoss._himmel_tex()
	_himmel_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_himmel_mat.uv1_scale = Vector3(3, 1, 1)
	himmel.material_override = _himmel_mat
	himmel.set_meta("dynamisch", true)
	himmel.position = Vector3(X + 1.0, 2.9, 0)
	himmel.rotation.y = -PI / 2
	add_child(himmel)
	# Sonnenstrahlen durch die Fenster (nur morgens)
	for i in 6:
		var strahl := Bau.lichtkegel(self, Vector3(X - 0.4, 4.2, -Z + 1.85 + i * 3.0), 3.6, 1.5, Color(1.0, 0.9, 0.65), 0.05)
		strahl.rotation.z = -0.55
		strahl.set_meta("dynamisch", true)
		strahl.visible = false
		_sonne.append(strahl)
	var sonne := OmniLight3D.new()
	sonne.position = Vector3(X - 2.0, 3.5, 0)
	sonne.light_color = Color(1.0, 0.9, 0.7)
	sonne.light_energy = 1.4
	sonne.omni_range = 16.0
	sonne.visible = false
	add_child(sonne)
	_sonne.append(sonne)
	# Eingang vom Treppenhaus (Südwand)
	var tuer := Bau.mat(Color(0.5, 0.33, 0.2), "holz", 0.8, 0.012)
	for seite in [-1, 1]:
		Bau.box(self, Vector3(0.95, 2.3, 0.06), Vector3(-9.0 + 0.48 * seite, 1.15, Z - 0.08), tuer)
		Bau.box(self, Vector3(0.05, 0.4, 0.05), Vector3(-9.0 + 0.12 * seite, 1.1, Z - 0.13), m_metall)
	Bau.box(self, Vector3(2.1, 0.1, 0.12), Vector3(-9.0, 2.35, Z - 0.08), m_dunkel)
	Bau.box(self, Vector3(0.7, 0.25, 0.06), Vector3(-9.0, 2.7, Z - 0.08), Bau.leucht(Color(0.1, 0.9, 0.35), 2.5))
	Bau.schild(self, "AUSGANG", Vector3(-9.0, 2.7, Z - 0.12), 24, Color.WHITE, PI, 4)
	stationen["aula_raus"] = Interaktiv.neu(self, "aula_raus", Vector3(-9.0, 0, Z - 0.7), "Treppe hinunter in den Flur", 1.3)
	# Schriftzug und Uhr an der Südwand
	var rot := Bau.mat(Color(0.52, 0.08, 0.11), "", 1.0, 0.0)
	Bau.box(self, Vector3(8.0, 1.0, 0.04), Vector3(2.0, 4.2, Z - 0.05), rot)
	Bau.schild(self, "LINCOLN HIGH  ·  AULA", Vector3(2.0, 4.2, Z - 0.08), 110, Color(0.98, 0.8, 0.25), PI, 8).visibility_range_end = 40.0
	Bau.zylinder(self, 0.32, 0.05, Vector3(-4.5, 3.5, Z - 0.05), Bau.mat(Color(0.95, 0.95, 0.92)), Vector3(PI / 2, 0, 0))
	_uhr_text = Bau.schild(self, "21:45", Vector3(-4.5, 3.5, Z - 0.09), 40, Color(0.1, 0.1, 0.1), PI)
	_uhr_text.visibility_range_end = 25.0
	# Garderobe und Stühle an der Westwand
	for i in 6:
		Bau.box(self, Vector3(0.05, 0.05, 0.05), Vector3(-X + 0.06, 1.75, 4.0 + i * 0.6), m_metall)
	Bau.box(self, Vector3(0.06, 0.05, 3.4), Vector3(-X + 0.05, 1.78, 5.5), m_holz)


func _buehne() -> void:
	var tiefe := BUEHNE + Z
	var boden := Bau.mat(Color(0.35, 0.22, 0.14), "holz", 0.7, 0.0, false)
	Bau.box(self, Vector3(16.0, 0.6, tiefe), Vector3(0, 0.3, -Z + tiefe * 0.5), boden, true)
	Bau.box(self, Vector3(16.04, 0.56, 0.04), Vector3(0, 0.28, BUEHNE + 0.01), Bau.mat(Color(0.12, 0.08, 0.06), "", 1.0, 0.0))
	_form(0, -Z + tiefe * 0.5, 16.0, tiefe, Color(0.4, 0.26, 0.18))
	# Treppe an der Seite
	for i in 2:
		Bau.box(self, Vector3(1.2, 0.2 * (i + 1), 0.35), Vector3(8.7, 0.1 * (i + 1), BUEHNE + 0.6 - i * 0.35), boden, true)
	# Vorhang
	var samt := Bau.mat(Color(0.5, 0.05, 0.08), "strick", 2.0, 0.0, false, 0.9)
	for seite in [-1.0, 1.0]:
		for k in 5:
			var falte := Bau.box(self, Vector3(0.36, H - 0.6, 0.18), Vector3(seite * (7.0 + k * 0.32), 0.6 + (H - 0.6) * 0.5, BUEHNE - 0.4 - (k % 2) * 0.08), samt)
			falte.rotation.y = 0.3 * (1 - (k % 2) * 2)
	Bau.box(self, Vector3(16.0, 0.9, 0.2), Vector3(0, H - 0.45, BUEHNE - 0.3), samt)
	# Leinwand mit Beamerbild
	var leinwand := Bau.leucht(Color(0.92, 0.94, 0.98), 0.6)
	Bau.box(self, Vector3(7.4, 3.4, 0.04), Vector3(0, 3.4, -Z + 0.06), leinwand)
	Bau.box(self, Vector3(7.6, 0.12, 0.12), Vector3(0, 5.15, -Z + 0.08), m_dunkel)
	_leinwand_text = Bau.schild(self, "ABSCHLUSSPRÜFUNG MT10\n\nElektrotechnik · Steuerungstechnik · Netzwerke\n\nBeginn: 8:00 Uhr", Vector3(0, 3.4, -Z + 0.1), 64, Color(0.1, 0.12, 0.3))
	_leinwand_text.visibility_range_end = 40.0
	_leinwand_text.set_meta("dynamisch", true)
	Bau.box(self, Vector3(0.5, 0.2, 0.4), Vector3(0, H - 0.5, -1.0), m_dunkel)
	Bau.zylinder(self, 0.02, 0.4, Vector3(0, H - 0.2, -1.0), m_dunkel)
	Bau.zylinder(self, 0.06, 0.04, Vector3(0, H - 0.5, -1.22), Bau.leucht(Color(0.85, 0.9, 1.0), 2.0), Vector3(PI / 2, 0, 0))
	# Rednerpult und Tisch der Prüfungsaufsicht
	var pult := Node3D.new()
	pult.position = Vector3(-3.5, 0.6, -8.4)
	add_child(pult)
	Bau.box(pult, Vector3(0.8, 1.1, 0.6), Vector3(0, 0.55, 0), m_holz)
	Bau.box(pult, Vector3(0.9, 0.05, 0.7), Vector3(0, 1.12, 0), m_holz).rotation.x = -0.2
	Bau.schild(pult, "LH", Vector3(0, 0.6, 0.31), 60, Color(0.95, 0.78, 0.25), 0.0, 4)
	Bau.zylinder(pult, 0.008, 0.4, Vector3(0.2, 1.3, -0.1), m_dunkel).rotation.x = 0.4
	var tisch := Node3D.new()
	tisch.position = Vector3(3.0, 0.6, -8.4)
	add_child(tisch)
	Bau.box(tisch, Vector3(3.0, 0.06, 0.9), Vector3(0, 0.75, 0), Bau.mat(Color(0.95, 0.95, 0.93), "", 1.0, 0.0))
	Bau.box(tisch, Vector3(3.0, 0.6, 0.04), Vector3(0, 0.45, 0.43), Bau.mat(Color(0.18, 0.25, 0.45), "", 1.0, 0.0))
	Bau.schild(tisch, "PRÜFUNGSAUFSICHT", Vector3(0, 0.45, 0.46), 30, Color.WHITE, 0.0, 3)
	for i in 3:
		Bau.box(tisch, Vector3(0.22, 0.04, 0.3), Vector3(-1.0 + i * 0.25, 0.8 + i * 0.01, 0.1), Bau.mat(Color(0.97, 0.97, 0.95)))
	Bau.box(tisch, Vector3(0.4, 0.3, 0.3), Vector3(1.0, 0.93, 0), Bau.mat(Color(0.75, 0.55, 0.3), "karton", 1.0, 0.0))


func _pruefungsplaetze() -> void:
	var platte := Bau.mat(Color(0.88, 0.84, 0.76), "holz", 1.2, 0.0)
	var gestell := Bau.mat(Color(0.25, 0.27, 0.3), "metall", 1.0, 0.01)
	var stuhl := Bau.mat(Color(0.15, 0.3, 0.6), "", 1.0, 0.01, false, 0.5)
	var nr := 0
	for z in [-2.8, 0.4, 3.6]:
		for x in [-6.0, -1.0, 4.0]:
			nr += 1
			var t := Node3D.new()
			t.position = Vector3(x, 0, z)
			add_child(t)
			Bau.box(t, Vector3(1.4, 0.05, 0.7), Vector3(0, 0.74, 0), platte)
			for dx in [-0.65, 0.65]:
				for dz in [-0.3, 0.3]:
					Bau.zylinder(t, 0.02, 0.72, Vector3(dx, 0.36, dz), gestell)
			# Bildschirm, Tastatur, Rechner
			Bau.box(t, Vector3(0.56, 0.36, 0.03), Vector3(0, 1.05, -0.22), m_dunkel)
			Bau.box(t, Vector3(0.05, 0.2, 0.05), Vector3(0, 0.85, -0.24), m_dunkel)
			var bild := StandardMaterial3D.new()
			bild.albedo_color = Color(0.1, 0.12, 0.2)
			bild.emission_enabled = true
			bild.emission = Color(0.55, 0.12, 0.1)
			bild.emission_energy_multiplier = 1.3
			Bau.box(t, Vector3(0.52, 0.32, 0.005), Vector3(0, 1.05, -0.204), bild)
			_bild_mats.append(bild)
			var txt := Bau.schild(t, "PC %02d\nServer nicht\ngefunden" % nr, Vector3(0, 1.05, -0.2), 16, Color(1.0, 0.85, 0.8))
			txt.set_meta("dynamisch", true)
			_bild_texte.append(txt)
			Bau.box(t, Vector3(0.45, 0.02, 0.15), Vector3(0, 0.775, 0.05), Bau.mat(Color(0.2, 0.2, 0.22)))
			Bau.box(t, Vector3(0.2, 0.42, 0.45), Vector3(0.5, 0.21, -0.05), m_dunkel)
			Bau.box(t, Vector3(0.22, 0.003, 0.3), Vector3(-0.42, 0.77, 0.1), Bau.mat(Color(0.97, 0.97, 0.95)))
			# Stuhl
			var s := Node3D.new()
			s.position = Vector3(0, 0, 0.75)
			t.add_child(s)
			Bau.box(s, Vector3(0.45, 0.05, 0.42), Vector3(0, 0.46, 0), stuhl)
			Bau.box(s, Vector3(0.45, 0.4, 0.04), Vector3(0, 0.7, 0.2), stuhl)
			for dx in [-0.2, 0.2]:
				for dz in [-0.18, 0.18]:
					Bau.zylinder(s, 0.015, 0.46, Vector3(dx, 0.23, dz), gestell)
			Bau.kollisionsbox(t, Vector3(1.4, 0.9, 0.7), Vector3(0, 0.45, 0))
			_form(x, z, 1.4, 0.7, Color(0.85, 0.8, 0.7))
			if nr == 1:
				# Platz des Prüflings: Namensschild
				var name_t := Bau.schild(t, String(Spielstand.d.get("name", "MT10")), Vector3(0.25, 0.83, 0.33), 22, Color(0.1, 0.1, 0.1), 0.0)
				Bau.box(t, Vector3(0.36, 0.1, 0.01), Vector3(0.25, 0.83, 0.325), Bau.mat(Color(0.97, 0.97, 0.95))).rotation.x = -0.3
				name_t.rotation.x = -0.3
	# Netzwerkleitungen im Kabelkanal am Boden
	Bau.box(self, Vector3(12.0, 0.05, 0.12), Vector3(-1.0, 0.025, -1.2), Bau.mat(Color(0.85, 0.85, 0.82), "", 1.0, 0.0))
	Bau.box(self, Vector3(0.12, 0.05, 6.4), Vector3(-X + 1.0, 0.025, 0.4), Bau.mat(Color(0.85, 0.85, 0.82), "", 1.0, 0.0))
	stationen["pruefungsplatz"] = Interaktiv.neu(self, "pruefungsplatz", Vector3(-6.0, 0, -2.0), "An deinen Prüfungsplatz setzen", 1.2)


func _server() -> void:
	var r := Node3D.new()
	r.position = Vector3(-X + 0.45, 0, -4.2)
	add_child(r)
	var schrank := Bau.mat(Color(0.16, 0.17, 0.19), "metall", 1.0, 0.012)
	Bau.box(r, Vector3(0.6, 2.0, 0.8), Vector3(0, 1.0, 0), schrank)
	Bau.box(r, Vector3(0.02, 1.9, 0.74), Vector3(0.31, 1.0, 0), Bau.glas(Color(0.3, 0.35, 0.45, 0.25)))
	for i in 6:
		var y := 0.4 + i * 0.26
		Bau.box(r, Vector3(0.5, 0.16, 0.7), Vector3(0.02, y, 0), Bau.mat(Color(0.28, 0.3, 0.33), "metall", 1.0, 0.0))
		for k in 4:
			var led := StandardMaterial3D.new()
			led.albedo_color = Color(0.9, 0.5, 0.1)
			led.emission_enabled = true
			led.emission = Color(0.9, 0.5, 0.1)
			led.emission_energy_multiplier = 2.0
			Bau.box(r, Vector3(0.01, 0.02, 0.02), Vector3(0.28, y + 0.04, -0.25 + k * 0.12), led)
			_server_leds.append(led)
	Bau.schild(r, "PRÜFUNGSSERVER\n192.168.10.10", Vector3(0.32, 1.85, 0), 22, Color(0.95, 0.95, 0.9), PI / 2, 3)
	Bau.kollisionsbox(r, Vector3(0.6, 2.0, 0.8), Vector3(0, 1.0, 0))
	_form(-X + 0.45, -4.2, 0.6, 0.8, Color(0.25, 0.27, 0.3))
	# Patchkabel zum Bodenkanal
	for k in 4:
		Bau.zylinder(self, 0.01, 0.9, Vector3(-X + 0.78, 0.45, -3.95 + k * 0.05), Bau.mat([Color(0.2, 0.4, 0.85), Color(0.95, 0.75, 0.1)][k % 2]), Vector3(0, 0, 0.15))
	# Das fremde Kästchen
	_klon = Node3D.new()
	_klon.position = Vector3(-X + 0.42, 1.1, -3.7)
	_klon.set_meta("dynamisch", true)
	add_child(_klon)
	Bau.box(_klon, Vector3(0.16, 0.05, 0.12), Vector3.ZERO, Bau.mat(Color(0.05, 0.05, 0.05), "", 1.0, 0.0))
	_klon_led = StandardMaterial3D.new()
	_klon_led.albedo_color = Color(1.0, 0.1, 0.1)
	_klon_led.emission_enabled = true
	_klon_led.emission = Color(1.0, 0.1, 0.1)
	_klon_led.emission_energy_multiplier = 3.0
	Bau.box(_klon, Vector3(0.012, 0.012, 0.012), Vector3(0.081, 0.0, 0.03), _klon_led)
	for i in 5:
		var w := i * TAU / 5.0
		Bau.kugel(_klon, 0.007, Vector3(0.081, 0.012 + sin(w) * 0.008, -0.03 + cos(w) * 0.008), Bau.mat(Color(0.05, 0.02, 0.03)), Vector3(0.3, 1, 1))
	Bau.zylinder(_klon, 0.004, 0.25, Vector3(0.05, -0.12, 0.0), Bau.mat(Color(0.2, 0.4, 0.85)), Vector3(0, 0, 0.2))
	stationen["pruefungsserver"] = Interaktiv.neu(self, "pruefungsserver", Vector3(-X + 1.5, 0, -4.2), "Prüfungsserver prüfen", 1.7)


func _vince_bauen() -> void:
	_vince = Nebenfiguren.vince()
	_vince.visible = false
	_vince.set_meta("dynamisch", true)
	add_child(_vince)
	_tablet = Node3D.new()
	_vince.add_child(_tablet)
	_tablet.position = Vector3(0.12, 1.08, -0.32)
	_tablet.rotation.x = 0.9
	Bau.box(_tablet, Vector3(0.26, 0.18, 0.012), Vector3.ZERO, m_dunkel)
	Bau.box(_tablet, Vector3(0.23, 0.15, 0.002), Vector3(0, 0, -0.007), Bau.leucht(Color(0.85, 0.2, 0.25), 1.6))


func _schatten() -> void:
	_wandkante(Vector3(0, 0, Z), Vector3(0, 0, 1), X * 2)
	_wandkante(Vector3(-X, 0, 0), Vector3(-1, 0, 0), Z * 2)
	_wandkante(Vector3(X, 0, 0), Vector3(1, 0, 0), Z * 2)
	for z in [-2.8, 0.4, 3.6]:
		for x in [-6.0, -1.0, 4.0]:
			_schattenfleck(Vector3(x, 0, z + 0.2), Vector2(1.8, 1.6), 0.5)
	_schattenfleck(Vector3(-X + 0.45, 0, -4.2), Vector2(1.0, 1.2))


# ---------------------------------------------------------------- Anlagen

func server_reparieren() -> void:
	server_ok = true
	for led in _server_leds:
		led.albedo_color = Color(0.1, 0.9, 0.3)
		led.emission = Color(0.1, 0.9, 0.3)
	for i in _bild_mats.size():
		_bild_mats[i].emission = Color(0.15, 0.4, 0.75)
		_bild_texte[i].text = "PC %02d\nPrüfungsserver\nbereit" % (i + 1)
		_bild_texte[i].modulate = Color(0.85, 1.0, 0.9)


func klon_zeigen(an: bool) -> void:
	_klon.visible = an
	_klon.scale = Vector3.ONE * (2.0 if an else 1.0)


## Nach Mission 15 ist Prüfungsmorgen: Tageslicht, Sonne durch die Fenster
func tageszeit(p_morgen: bool) -> void:
	morgen = p_morgen
	umwelt = _env_tag if morgen else _env_nacht
	_himmel_mat.albedo_texture = _tag_himmel_tex() if morgen else Erdgeschoss._himmel_tex()
	for s in _sonne:
		s.visible = morgen
	_uhr_text.text = "7:55" if morgen else "21:45"
	_grafik_anwenden()


func lehrer_platz() -> Vector3:
	return to_global(lehrer_pos)


## Vince Moretti: "" = nicht da, "tuer" = an der Hintertür, "lehrer" = neben dem Lehrer
func vince_zeigen(ort: String) -> void:
	_vince.visible = ort != ""
	match ort:
		"tuer":
			_vince.platzieren(to_global(Vector3(-9.0, 0, Z - 1.3)), 0.0)
		"lehrer":
			_vince.platzieren(to_global(Vector3(4.4, 0, -4.7)), PI * 0.8)
			_tablet.visible = false


func vince_position() -> Vector3:
	return _vince.global_position


func pruefung_beendet() -> void:
	_leinwand_text.text = "ABSCHLUSSPRÜFUNG MT10\n\nBEENDET\n\nDanke – und viel Glück!"


## Kurzes Flackern des Lichts (letzter Versuch der Black Roses)
func licht_flackern() -> void:
	_flackern = 1.6


static var _tag: ImageTexture
static func _tag_himmel_tex() -> ImageTexture:
	if _tag:
		return _tag
	var b := 512
	var h := 128
	var img := Image.create(b, h, false, Image.FORMAT_RGB8)
	var rng := RandomNumberGenerator.new()
	rng.seed = 41
	for y in h:
		var t := float(y) / h
		var c := Color(0.38, 0.6, 0.9).lerp(Color(0.95, 0.85, 0.7), t * t)
		for x in b:
			img.set_pixel(x, y, c)
	# Wolken
	for i in 14:
		var cx := rng.randi_range(0, b - 1)
		var cy := rng.randi_range(10, 50)
		for k in 6:
			var r := rng.randf_range(5.0, 11.0)
			var ox := cx + k * 7
			for y in range(maxi(0, cy - 12), mini(h, cy + 12)):
				for x in range(ox - 12, ox + 12):
					if Vector2(x - ox, (y - cy) * 1.8).length() < r:
						img.set_pixel(posmod(x, b), y, img.get_pixel(posmod(x, b), y).lerp(Color(1, 1, 1), 0.7))
	# Häuser und Bäume im Morgenlicht
	var x0 := 0
	while x0 < b:
		var breite := rng.randi_range(30, 70)
		var hoehe := rng.randi_range(18, 40)
		var farbe := Color(0.45, 0.5, 0.48) if rng.randf() < 0.5 else Color(0.62, 0.55, 0.5)
		for x in range(x0, mini(b, x0 + breite)):
			for y in range(h - hoehe, h):
				img.set_pixel(x, y, farbe)
		x0 += breite + rng.randi_range(0, 12)
	_tag = ImageTexture.create_from_image(img)
	return _tag


func _process(delta: float) -> void:
	_zeit += delta
	_sammel_animieren(delta)
	if not is_visible_in_tree():
		return
	if _flackern > 0.0:
		_flackern -= delta
		var an := _flackern <= 0.0 or fmod(_flackern, 0.5) > 0.2
		for l in _lichter:
			l.light_energy = _energie[l] * (1.0 if an else 0.1)
	_takt -= delta
	if _takt > 0.0:
		return
	_takt = 0.1
	if not server_ok:
		for led in _server_leds:
			led.emission_energy_multiplier = 2.5 if randf() > 0.5 else 0.3
	if _klon.visible:
		_klon_led.emission_energy_multiplier = 3.0 if fmod(_zeit, 0.5) < 0.25 else 0.2
