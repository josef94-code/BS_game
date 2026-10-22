class_name Turnhalle
extends Bereich
## Turnhalle der Lincoln High: Holzboden mit Basketballfeld, Körbe, Tribüne, Sprossenwand,
## Anzeigetafel und Trennvorhang. Anlagen für Akt 3: vernetzte Hallentechnik (Anzeigetafel am
## Kampfgericht) und die Wendeschützschaltung des Trennvorhangs.

const X := 15.0   # halbe Länge
const Z := 10.0   # halbe Breite
const H := 8.0

var bradley_pos := Vector3(-6.0, 0, 4.0)
var bradley_blick := 2.4

var anzeige_ok := false
var vorhang_ok := false

var _zeit := 0.0
var _takt := 0.0
var _tafel_text: Label3D
var _tafel_mat: StandardMaterial3D
var _usb: Node3D
var _vorhang: Node3D
var _schluessel: Node3D
var _hallen_lichter: Array[Light3D] = []

var m_metall: StandardMaterial3D
var m_dunkel: StandardMaterial3D
var m_holz_hell: StandardMaterial3D


func _ready() -> void:
	titel = "Turnhalle"
	_boden_form(-X, -Z, X, Z, Color(0.62, 0.48, 0.3), "Turnhalle")
	symbole.append({"p": Vector3(-11.0, 0, Z - 0.4), "t": "↓", "f": Color(0.3, 1.0, 0.5)})
	m_metall = Bau.mat(Color(0.75, 0.77, 0.8), "metall", 1.0, 0.01)
	m_dunkel = Bau.mat(Color(0.12, 0.12, 0.13), "", 1.0, 0.01)
	m_holz_hell = Bau.mat(Color(1, 1, 1), "parkett", 0.5, 0.0, false, 0.3)
	_umgebung()
	_raum()
	_spielfeld()
	_koerbe()
	_tribuene()
	_geraete()
	_anzeigetafel()
	_trennvorhang()
	_sammel_neu("s_asi", Vector3(8.0, 0.06, -Z + 3.7))
	_schatten()
	tueren = {"turnhalle_raus": "Erdgeschoss"}
	ankunft = {"Erdgeschoss": [Vector3(-11.0, 0, Z - 1.6), 0.0]}
	_fertigstellen(12.0)


func _umgebung() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.02, 0.025, 0.05)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.55, 0.52, 0.5)
	env.ambient_light_energy = 0.38
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 1.1
	env.glow_enabled = true
	env.glow_intensity = 0.8
	env.glow_bloom = 0.1
	env.glow_hdr_threshold = 0.9
	env.fog_enabled = true
	env.fog_light_color = Color(0.1, 0.1, 0.11)
	env.fog_density = 0.01
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.08
	env.adjustment_contrast = 1.1
	umwelt = env
	# Hallenstrahler unter der Decke (nachts brennt nur die Hälfte)
	var i := 0
	for x in [-9.0, 0.0, 9.0]:
		for z in [-4.5, 4.5]:
			var an: bool = (i % 2 == 0) or x == 0.0
			var gehaeuse := Bau.zylinder(self, 0.45, 0.35, Vector3(x, H - 0.55, z), Bau.mat(Color(0.3, 0.32, 0.35), "metall", 1.0, 0.0), Vector3.ZERO, false, 0.3)
			gehaeuse.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			Bau.zylinder(self, 0.42, 0.02, Vector3(x, H - 0.73, z), Bau.leucht(Color(1.0, 0.95, 0.85), 3.0) if an else Bau.mat(Color(0.6, 0.6, 0.6)))
			Bau.zylinder(self, 0.01, 0.4, Vector3(x, H - 0.2, z), m_dunkel)
			if an:
				var l := SpotLight3D.new()
				l.position = Vector3(x, H - 0.8, z)
				l.rotation.x = -PI / 2
				l.light_color = Color(1.0, 0.94, 0.82)
				l.light_energy = 3.2
				l.spot_range = 12.0
				l.spot_angle = 55.0
				l.spot_attenuation = 0.8
				l.shadow_bias = 0.05
				add_child(l)
				_hallen_lichter.append(l)
				Bau.lichtkegel(self, Vector3(x, H - 0.75, z), H - 0.75, 4.2, Color(1.0, 0.92, 0.8), 0.03)
			i += 1
	_schatten_lichter.append(_hallen_lichter[0])
	_schatten_lichter.append(_hallen_lichter[1])
	var mond := DirectionalLight3D.new()
	mond.rotation = Vector3(-0.8, 0.4, 0)
	mond.light_color = Color(0.55, 0.65, 1.0)
	mond.light_energy = 0.2
	add_child(mond)


func _raum() -> void:
	Bau.box(self, Vector3(X * 2 + 0.6, 0.2, Z * 2 + 0.6), Vector3(0, -0.1, 0), m_holz_hell, true)
	var decke := Bau.mat(Color(0.32, 0.33, 0.36), "metall", 0.5, 0.0, false)
	Bau.box(self, Vector3(X * 2, 0.2, Z * 2), Vector3(0, H + 0.1, 0), decke)
	# Fachwerkträger unter der Decke
	var traeger := Bau.mat(Color(0.2, 0.22, 0.25), "metall", 1.0, 0.0)
	for x in [-12.0, -6.0, 0.0, 6.0, 12.0]:
		Bau.box(self, Vector3(0.18, 0.18, Z * 2), Vector3(x, H - 0.1, 0), traeger)
		Bau.box(self, Vector3(0.12, 0.12, Z * 2), Vector3(x, H - 1.0, 0), traeger)
		var z := -Z + 1.0
		while z < Z:
			var strebe := Bau.box(self, Vector3(0.06, 1.1, 0.06), Vector3(x, H - 0.55, z), traeger)
			strebe.rotation.x = 0.6
			z += 2.0
	var bloecke := Bau.mat(Color(0.95, 0.93, 0.88), "bloecke", 0.625, 0.0, false)
	var prall := Bau.mat(Color(0.18, 0.3, 0.6), "beton", 1.5, 0.0, false, 0.7)
	# Wände: unten blauer Prallschutz, oben Betonsteine; Nordwand mit hohem Fensterband
	Bau.box(self, Vector3(X * 2 + 0.6, H, 0.3), Vector3(0, H * 0.5, Z + 0.15), bloecke, true)
	Bau.box(self, Vector3(0.3, H, Z * 2), Vector3(-X - 0.15, H * 0.5, 0), bloecke, true)
	Bau.box(self, Vector3(0.3, H, Z * 2), Vector3(X + 0.15, H * 0.5, 0), bloecke, true)
	Bau.box(self, Vector3(X * 2 + 0.6, 5.2, 0.3), Vector3(0, 2.6, -Z - 0.15), bloecke, true)
	Bau.box(self, Vector3(X * 2 + 0.6, H - 7.4, 0.3), Vector3(0, (H + 7.4) * 0.5, -Z - 0.15), bloecke)
	var glas := Bau.glas(Color(0.55, 0.65, 0.85, 0.15))
	var rahmen := Bau.mat(Color(0.2, 0.22, 0.25), "", 1.0, 0.01)
	var x0 := -X
	while x0 < X - 0.1:
		Bau.box(self, Vector3(0.5, 2.2, 0.3), Vector3(x0 + 0.25, 6.3, -Z - 0.15), bloecke)
		Bau.box(self, Vector3(2.5, 2.2, 0.02), Vector3(x0 + 1.75, 6.3, -Z - 0.2), glas)
		Bau.box(self, Vector3(0.05, 2.2, 0.08), Vector3(x0 + 1.75, 6.3, -Z - 0.2), rahmen)
		x0 += 3.0
	_nachthimmel(Vector3(0, 6.3, -Z - 1.0), Vector2(X * 2 + 2.0, 3.0))
	for w in [[Vector3(0, 1.0, Z - 0.03), Vector3(X * 2, 2.0, 0.06)], [Vector3(-X + 0.03, 1.0, 0), Vector3(0.06, 2.0, Z * 2)],
			[Vector3(X - 0.03, 1.0, 0), Vector3(0.06, 2.0, Z * 2)]]:
		Bau.box(self, w[1], w[0], prall)
	Bau.box(self, Vector3(X * 2, 0.08, 0.08), Vector3(0, 2.02, Z - 0.05), Bau.mat(Color(0.95, 0.75, 0.2), "", 1.0, 0.0, false))
	# Eingang (Südwand) mit Notausgang-Schild
	var tuer := Bau.mat(Color(0.55, 0.08, 0.1), "metall", 1.0, 0.012)
	for seite in [-1, 1]:
		Bau.box(self, Vector3(0.95, 2.25, 0.06), Vector3(-11.0 + 0.48 * seite, 1.125, Z - 0.08), tuer)
		Bau.box(self, Vector3(0.6, 0.06, 0.06), Vector3(-11.0 + 0.35 * seite, 1.0, Z - 0.13), m_metall)
	Bau.box(self, Vector3(2.1, 0.1, 0.12), Vector3(-11.0, 2.3, Z - 0.08), m_dunkel)
	Bau.box(self, Vector3(0.7, 0.25, 0.06), Vector3(-11.0, 2.65, Z - 0.08), Bau.leucht(Color(0.1, 0.9, 0.35), 2.5))
	Bau.schild(self, "AUSGANG", Vector3(-11.0, 2.65, Z - 0.12), 24, Color.WHITE, PI, 4)
	stationen["turnhalle_raus"] = Interaktiv.neu(self, "turnhalle_raus", Vector3(-11.0, 0, Z - 0.7), "Zurück in den Flur", 1.3)
	# Geräteraum (abgeschlossen)
	Bau.box(self, Vector3(0.08, 2.4, 2.4), Vector3(-X + 0.06, 1.2, -6.5), Bau.mat(Color(0.45, 0.47, 0.5), "metall", 1.0, 0.012))
	Bau.schild(self, "GERÄTERAUM", Vector3(-X + 0.12, 2.6, -6.5), 30, Color(0.95, 0.9, 0.8), PI / 2, 4)
	stationen["verschlossen:geraeteraum"] = Interaktiv.neu(self, "verschlossen:geraeteraum", Vector3(-X + 0.9, 0, -6.5), "Geräteraum", 1.3)
	# Spruchbänder
	var rot := Bau.mat(Color(0.52, 0.08, 0.11), "", 1.0, 0.0)
	Bau.box(self, Vector3(9.0, 1.3, 0.04), Vector3(0, 4.3, Z - 0.05), rot)
	Bau.schild(self, "LINCOLN LIONS", Vector3(0, 4.3, Z - 0.08), 150, Color(0.98, 0.8, 0.25), PI, 10).visibility_range_end = 60.0
	for i in 4:
		var w := Bau.box(self, Vector3(1.2, 2.2, 0.03), Vector3(-X + 0.06, 4.6, -1.5 + i * 2.6), Bau.mat([Color(0.52, 0.08, 0.11), Color(0.95, 0.75, 0.2)][i % 2], "", 1.0, 0.0), false, PI / 2)
		w.position.x = -X + 0.06
		var t := Bau.schild(self, ["STATE\nCHAMPS\n1987", "CONF.\n1992", "STATE\nCHAMPS\n2004", "CONF.\n2011"][i], Vector3(-X + 0.1, 4.7, -1.5 + i * 2.6), 46, Color.WHITE if i % 2 == 0 else Color(0.3, 0.05, 0.06), PI / 2, 4)
		t.visibility_range_end = 30.0


func _spielfeld() -> void:
	var weiss := Bau.mat(Color(0.97, 0.97, 0.95), "", 1.0, 0.0, false, 0.3)
	var rot := Bau.mat(Color(0.5, 0.12, 0.13), "", 1.0, 0.0, false, 0.3)
	var b := 0.06
	var lx := 13.0
	var lz := 7.5
	# Begrenzung und Mittellinie
	Bau.box(self, Vector3(lx * 2, 0.01, b), Vector3(0, 0.005, -lz), weiss)
	Bau.box(self, Vector3(lx * 2, 0.01, b), Vector3(0, 0.005, lz), weiss)
	Bau.box(self, Vector3(b, 0.01, lz * 2), Vector3(-lx, 0.005, 0), weiss)
	Bau.box(self, Vector3(b, 0.01, lz * 2), Vector3(lx, 0.005, 0), weiss)
	Bau.box(self, Vector3(b, 0.01, lz * 2), Vector3(0, 0.005, 0), weiss)
	var kreis := Bau.torus(self, 1.77, 1.83, Vector3(0, 0.006, 0), weiss)
	kreis.scale.y = 0.05
	var mitte := Bau.zylinder(self, 0.9, 0.01, Vector3(0, 0.004, 0), rot, Vector3.ZERO, false, -1.0, 32)
	mitte.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	for seite in [-1.0, 1.0]:
		# Zone (rot gefüllt) und Freiwurfkreis
		var zx: float = seite * (lx - 2.9)
		Bau.box(self, Vector3(5.8, 0.008, 4.9), Vector3(zx, 0.004, 0), rot)
		var fk := Bau.torus(self, 1.77, 1.83, Vector3(seite * (lx - 5.8), 0.006, 0), weiss)
		fk.scale.y = 0.05
		# Dreipunktelinie als Bogen
		var korb := Vector3(seite * (lx - 1.6), 0, 0)
		for j in 40:
			var w := -PI * 0.42 + j * PI * 0.84 / 39.0
			var p := korb + Vector3(-seite * cos(w) * 6.75, 0.006, sin(w) * 6.75)
			var st := Bau.box(self, Vector3(0.5, 0.01, b), p, weiss)
			st.rotation.y = seite * w - PI / 2
		# gerade Stücke der Dreipunktelinie bis zur Grundlinie
		for zs in [-1.0, 1.0]:
			var ende: float = korb.x - seite * cos(PI * 0.42) * 6.75
			Bau.box(self, Vector3(absf(seite * lx - ende), 0.01, b), Vector3((seite * lx + ende) * 0.5, 0.006, zs * sin(PI * 0.42) * 6.75), weiss)
	_form(0, 0, lx * 2, lz * 2, Color(0.68, 0.52, 0.32))


func _koerbe() -> void:
	var orange := Bau.mat(Color(0.95, 0.4, 0.05), "", 1.0, 0.0, false, 0.4)
	var netz := Bau.mat(Color(1, 1, 1), "maschendraht", 6.0, 0.0)
	netz.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
	netz.cull_mode = BaseMaterial3D.CULL_DISABLED
	for seite in [-1.0, 1.0]:
		var x: float = seite * (X - 0.3)
		Bau.box(self, Vector3(0.12, 0.12, 1.2), Vector3(x - seite * 0.6, 3.6, 0), m_dunkel)
		Bau.box(self, Vector3(0.12, 0.12, 1.2), Vector3(x - seite * 0.6, 3.2, 0), m_dunkel)
		Bau.box(self, Vector3(0.05, 1.05, 1.8), Vector3(x - seite * 1.2, 3.45, 0), Bau.glas(Color(0.9, 0.95, 1.0, 0.35)))
		Bau.box(self, Vector3(0.06, 0.45, 0.6), Vector3(x - seite * 1.18, 3.2, 0), Bau.mat(Color(0.95, 0.95, 0.95), "", 1.0, 0.0))
		var ring := Bau.torus(self, 0.22, 0.24, Vector3(x - seite * 1.45, 3.05, 0), orange)
		ring.scale.y = 0.4
		Bau.zylinder(self, 0.22, 0.4, Vector3(x - seite * 1.45, 2.83, 0), netz, Vector3.ZERO, false, 0.14, 12)


func _tribuene() -> void:
	var sitz := Bau.mat(Color(1.0, 0.9, 0.7), "holz", 0.6, 0.012, false, 0.5)
	for stufe in 4:
		var z := -Z + 0.5 + (3 - stufe) * 0.75
		var y := 0.45 * (stufe + 1)
		Bau.box(self, Vector3(20.0, y, 0.75), Vector3(0, y * 0.5, z), m_dunkel, true)
		Bau.box(self, Vector3(20.0, 0.08, 0.75), Vector3(0, y + 0.04, z), sitz)
	for x in [-10.0, 10.0]:
		Bau.box(self, Vector3(0.06, 1.0, 3.0), Vector3(x, 2.3, -Z + 1.6), m_metall)
	_form(0, -Z + 1.6, 20.0, 3.0, Color(0.45, 0.35, 0.25))
	# Kampfgericht: Tisch mit Steuerrechner der Anzeigetafel
	var t := Node3D.new()
	t.position = Vector3(-3.0, 0, Z - 2.2)
	add_child(t)
	Bau.box(t, Vector3(2.4, 0.08, 0.8), Vector3(0, 0.76, 0), Bau.mat(Color(0.3, 0.32, 0.35), "metall", 1.0, 0.0))
	Bau.box(t, Vector3(2.3, 0.7, 0.04), Vector3(0, 0.38, -0.38), Bau.mat(Color(0.52, 0.08, 0.11), "", 1.0, 0.0))
	Bau.schild(t, "KAMPFGERICHT", Vector3(0, 0.45, -0.41), 30, Color(0.98, 0.8, 0.25), PI, 4)
	Bau.box(t, Vector3(0.45, 0.02, 0.32), Vector3(0.3, 0.81, 0.05), m_dunkel)
	var schirm := Bau.box(t, Vector3(0.45, 0.3, 0.02), Vector3(0.3, 0.97, 0.2), Bau.leucht(Color(0.3, 0.5, 0.9), 1.0))
	schirm.rotation.x = -0.2
	Bau.box(t, Vector3(0.35, 0.12, 0.25), Vector3(-0.6, 0.86, 0.0), Bau.mat(Color(0.15, 0.15, 0.17)))
	for i in 4:
		Bau.box(t, Vector3(0.03, 0.02, 0.01), Vector3(-0.72 + i * 0.08, 0.88, -0.13), Bau.leucht(Color(0.1, 0.9, 0.3), 2.0))
	_usb = Node3D.new()
	_usb.set_meta("dynamisch", true)
	_usb.position = Vector3(-0.45, 0.87, -0.1)
	t.add_child(_usb)
	Bau.box(_usb, Vector3(0.06, 0.015, 0.025), Vector3.ZERO, Bau.mat(Color(0.05, 0.05, 0.06)))
	Bau.kugel(_usb, 0.008, Vector3(0.0, 0.009, 0.0), Bau.mat(Color(0.25, 0.02, 0.05)), Vector3(1, 0.4, 1))
	for dx in [-1.1, 1.1]:
		Bau.box(t, Vector3(0.05, 0.76, 0.7), Vector3(dx, 0.38, 0), m_dunkel)
	Bau.kollisionsbox(t, Vector3(2.4, 0.9, 0.8), Vector3(0, 0.45, 0))
	_form(-3.0, Z - 2.2, 2.4, 0.8, Color(0.5, 0.15, 0.15))
	stationen["anzeigetafel"] = Interaktiv.neu(self, "anzeigetafel", Vector3(-3.0, 0, Z - 3.2), "Steuerrechner der Anzeigetafel", 1.8)


func _anzeigetafel() -> void:
	var tafel := Node3D.new()
	tafel.position = Vector3(X - 0.15, 5.2, 0)
	tafel.rotation.y = -PI / 2
	add_child(tafel)
	Bau.box(tafel, Vector3(5.0, 2.4, 0.25), Vector3.ZERO, Bau.mat(Color(0.08, 0.08, 0.09), "", 1.0, 0.0))
	Bau.box(tafel, Vector3(5.2, 0.35, 0.3), Vector3(0, 1.35, 0), Bau.mat(Color(0.52, 0.08, 0.11), "", 1.0, 0.0))
	Bau.schild(tafel, "LINCOLN LIONS", Vector3(0, 1.35, 0.16), 60, Color(0.98, 0.8, 0.25), 0.0, 5).visibility_range_end = 50.0
	_tafel_mat = Bau.leucht(Color(1.0, 0.3, 0.1), 1.0)
	var feld := Bau.box(tafel, Vector3(4.6, 1.9, 0.02), Vector3(0, -0.1, 0.13), _tafel_mat)
	feld.set_meta("dynamisch", true)
	_tafel_mat.albedo_color = Color(0.05, 0.02, 0.01)
	_tafel_mat.emission = Color(0.3, 0.05, 0.02)
	_tafel_text = Bau.schild(tafel, "88:88\n\nHOME  88     88  GUEST", Vector3(0, -0.1, 0.15), 110, Color(1.0, 0.45, 0.1), 0.0, 0)
	_tafel_text.visibility_range_end = 60.0
	_tafel_text.set_meta("dynamisch", true)


func _trennvorhang() -> void:
	# Schiene unter der Decke, Vorhang hängt schief herunter
	Bau.box(self, Vector3(0.3, 0.25, Z * 2), Vector3(0, H - 0.4, 0), Bau.mat(Color(0.25, 0.27, 0.3), "metall", 1.0, 0.0))
	_vorhang = Node3D.new()
	_vorhang.set_meta("dynamisch", true)
	_vorhang.position = Vector3(0, H - 0.5, 0)
	_vorhang.rotation.x = 0.06
	add_child(_vorhang)
	var stoff := Bau.mat(Color(0.2, 0.32, 0.25), "strick", 0.6, 0.0, false, 0.9)
	stoff = stoff.duplicate()
	stoff.cull_mode = BaseMaterial3D.CULL_DISABLED
	var bahn := Bau.box(_vorhang, Vector3(0.04, 4.3, Z * 2 - 0.4), Vector3(0, -2.15, 0), stoff)
	bahn.name = "Bahn"
	Bau.box(_vorhang, Vector3(0.08, 0.08, Z * 2 - 0.4), Vector3(0, -4.3, 0), m_dunkel)
	# Motor und Bedienstelle an der Südwand
	var motor := Bau.mat(Color(0.25, 0.45, 0.3), "", 1.0, 0.012)
	Bau.box(self, Vector3(0.6, 0.45, 0.4), Vector3(0.5, H - 0.6, Z - 0.3), motor)
	Bau.zylinder(self, 0.16, 0.5, Vector3(0.5, H - 0.6, Z - 0.65), motor, Vector3(PI / 2, 0, 0))
	Bau.schild(self, "-MA2", Vector3(0.5, H - 0.25, Z - 0.52), 30, Color.WHITE, PI, 4).visibility_range_end = 20.0
	_schluessel = Node3D.new()
	_schluessel.set_meta("dynamisch", true)
	_schluessel.position = Vector3(1.3, 1.62, Z - 0.22)
	_schluessel.visible = false
	add_child(_schluessel)
	Bau.box(_schluessel, Vector3(0.025, 0.06, 0.004), Vector3.ZERO, Bau.mat(Color(0.85, 0.7, 0.3), "", 1.0, 0.0, false, 0.3))
	Bau.box(_schluessel, Vector3(0.012, 0.04, 0.004), Vector3(0, -0.05, 0), Bau.mat(Color(0.85, 0.7, 0.3), "", 1.0, 0.0, false, 0.3))
	Bau.box(_schluessel, Vector3(0.05, 0.03, 0.003), Vector3(0.04, 0.03, 0), Bau.mat(Color(0.95, 0.95, 0.9)))
	var kasten := Node3D.new()
	kasten.position = Vector3(1.3, 1.4, Z - 0.1)
	add_child(kasten)
	Bau.box(kasten, Vector3(0.5, 0.7, 0.2), Vector3.ZERO, Bau.mat(Color(0.8, 0.81, 0.78), "metall", 1.0, 0.015))
	Bau.zylinder(kasten, 0.04, 0.04, Vector3(-0.12, 0.15, -0.11), Bau.mat(Color(0.1, 0.65, 0.2)), Vector3(PI / 2, 0, 0))
	Bau.zylinder(kasten, 0.04, 0.04, Vector3(0.12, 0.15, -0.11), Bau.mat(Color(0.1, 0.65, 0.2)), Vector3(PI / 2, 0, 0))
	Bau.zylinder(kasten, 0.04, 0.04, Vector3(0.0, -0.05, -0.11), Bau.mat(Color(0.85, 0.1, 0.1)), Vector3(PI / 2, 0, 0))
	var pilz := Bau.kugel(kasten, 0.06, Vector3(0, -0.22, -0.11), Bau.mat(Color(0.85, 0.08, 0.06)), Vector3(1, 1, 0.7), true)
	pilz.rotation.x = -PI / 2
	Bau.schild(kasten, "VORHANG\n-SJ2 ▲   -SJ3 ▼\n\n-SJ1 AUS", Vector3(0, 0.12, -0.105), 14, Color.BLACK, PI)
	_form(1.3, Z - 0.1, 0.5, 0.2, Color(0.8, 0.8, 0.78))
	stationen["vorhang"] = Interaktiv.neu(self, "vorhang", Vector3(1.3, 0, Z - 1.0), "Steuerung Trennvorhang", 1.6)


func _geraete() -> void:
	# Sprossenwand an der Westwand
	var holz := Bau.mat(Color(1.0, 0.85, 0.6), "holz", 0.8, 0.0)
	for i in 4:
		var z := 1.5 + i * 1.0
		for seite in [-1, 1]:
			Bau.box(self, Vector3(0.08, 2.9, 0.08), Vector3(-X + 0.2, 1.45, z + seite * 0.45), holz)
		for r in 14:
			Bau.zylinder(self, 0.018, 0.9, Vector3(-X + 0.2, 0.2 + r * 0.2, z), holz, Vector3(PI / 2, 0, 0))
	Bau.kollisionsbox(self, Vector3(0.3, 2.9, 4.0), Vector3(-X + 0.2, 1.45, 3.0))
	_form(-X + 0.2, 3.0, 0.3, 4.0, Color(0.7, 0.55, 0.35))
	# Ballwagen
	var wagen := Node3D.new()
	wagen.position = Vector3(-8.5, 0, -2.0)
	wagen.rotation.y = 0.4
	add_child(wagen)
	Bau.box(wagen, Vector3(1.0, 0.04, 0.6), Vector3(0, 0.2, 0), m_metall)
	for dx in [-0.48, 0.48]:
		for dz in [-0.28, 0.28]:
			Bau.zylinder(wagen, 0.015, 0.75, Vector3(dx, 0.55, dz), m_metall)
	Bau.box(wagen, Vector3(1.0, 0.03, 0.03), Vector3(0, 0.92, -0.28), m_metall)
	Bau.box(wagen, Vector3(1.0, 0.03, 0.03), Vector3(0, 0.92, 0.28), m_metall)
	var ball := Bau.mat(Color(0.9, 0.42, 0.12), "", 1.0, 0.0, false, 0.6)
	for i in 8:
		Bau.kugel(wagen, 0.12, Vector3(-0.33 + (i % 4) * 0.22, 0.34 + (i / 4) * 0.22, -0.11 + (i % 2) * 0.22), ball)
	Bau.kollisionsbox(wagen, Vector3(1.0, 0.9, 0.6), Vector3(0, 0.45, 0))
	_form(-8.5, -2.0, 1.0, 0.6, Color(0.8, 0.45, 0.15))
	Bau.kugel(self, 0.12, Vector3(4.5, 0.12, 2.3), ball)
	Bau.kugel(self, 0.12, Vector3(-2.0, 0.12, -5.2), ball)
	# Mattenstapel und Kasten
	var matte := Bau.mat(Color(0.2, 0.35, 0.7), "beton", 1.2, 0.0, false, 0.8)
	for i in 4:
		var m := Bau.box(self, Vector3(2.0, 0.08, 1.0), Vector3(12.0, 0.04 + i * 0.08, 7.8), matte)
		m.rotation.y = i * 0.03
	Bau.kollisionsbox(self, Vector3(2.0, 0.35, 1.0), Vector3(12.0, 0.17, 7.8))
	var leder := Bau.mat(Color(0.55, 0.32, 0.15), "", 1.0, 0.0, false, 0.6)
	for i in 4:
		Bau.box(self, Vector3(1.4 - i * 0.06, 0.25, 0.6 - i * 0.02), Vector3(10.6, 0.13 + i * 0.26, 8.3), holz)
	Bau.box(self, Vector3(1.2, 0.1, 0.5), Vector3(10.6, 1.1, 8.3), leder)
	Bau.kollisionsbox(self, Vector3(1.4, 1.15, 0.6), Vector3(10.6, 0.58, 8.3))
	_form(11.3, 8.0, 3.2, 1.2, Color(0.3, 0.4, 0.65))
	# Hütchen
	var huetchen := Bau.mat(Color(0.98, 0.5, 0.05), "", 1.0, 0.0, false, 0.5)
	for i in 5:
		Bau.zylinder(self, 0.12, 0.3, Vector3(-6.0 + i * 1.2, 0.15, -6.0), huetchen, Vector3.ZERO, false, 0.02, 10)


func _nachthimmel(pos: Vector3, groesse: Vector2) -> void:
	var mi := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = groesse
	mi.mesh = q
	var m := StandardMaterial3D.new()
	m.albedo_texture = Erdgeschoss._himmel_tex()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.uv1_scale = Vector3(maxf(1.0, groesse.x / 8.0), 1, 1)
	mi.material_override = m
	mi.position = pos
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)


func _schatten() -> void:
	_wandkante(Vector3(0, 0, Z), Vector3(0, 0, 1), X * 2)
	_wandkante(Vector3(-X, 0, 0), Vector3(-1, 0, 0), Z * 2)
	_wandkante(Vector3(X, 0, 0), Vector3(1, 0, 0), Z * 2)
	_schattenfleck(Vector3(0, 0, -Z + 3.4), Vector2(21.0, 1.4), 0.5)
	_schattenfleck(Vector3(-3.0, 0, Z - 2.2), Vector2(3.0, 1.4), 0.5)
	_schattenfleck(Vector3(11.3, 0, 8.0), Vector2(3.6, 1.8), 0.5)


# ---------------------------------------------------------------- Anlagen

func usb_zeigen(an: bool) -> void:
	_usb.visible = an
	_usb.scale = Vector3.ONE * (2.5 if an else 1.0)


func anzeige_reparieren() -> void:
	anzeige_ok = true
	_tafel_text.text = "3. VIERTEL   04:12\n\nHOME  52     48  GUEST"
	_tafel_text.modulate = Color(1.0, 0.55, 0.15)
	_tafel_mat.emission_energy_multiplier = 1.0
	for l in _hallen_lichter:
		l.light_energy = 3.2


func usb_entfernen() -> void:
	_usb.visible = false


func schluessel_zeigen(an: bool) -> void:
	_schluessel.visible = an


func vorhang_reparieren() -> void:
	vorhang_ok = true
	var t := create_tween()
	t.tween_property(_vorhang, "rotation:x", 0.0, 1.0)
	t.parallel().tween_property(_vorhang, "scale:y", 0.25, 3.0).set_trans(Tween.TRANS_SINE)


func _process(delta: float) -> void:
	_zeit += delta
	_sammel_animieren(delta)
	if not is_visible_in_tree():
		return
	_takt -= delta
	if _takt > 0.0:
		return
	_takt = 0.09
	# Anzeigetafel flackert, solange die Linie unterbrochen ist; das Licht flackert mit
	if not anzeige_ok:
		var an := randf() > 0.35
		_tafel_text.modulate.a = 1.0 if an else 0.15
		for i in _hallen_lichter.size():
			if i % 2 == 1:
				_hallen_lichter[i].light_energy = 3.2 if randf() > 0.2 else 0.6
	# Vorhang hängt schief und zittert
	if not vorhang_ok:
		_vorhang.rotation.x = 0.06 + sin(_zeit * 1.3) * 0.01
