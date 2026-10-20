class_name Keller
extends Node3D
## Hausmeisterkeller der Lincoln High mit Büro-Ecke des Paten.
## Wird komplett aus Grundkörpern gebaut. Enthält die drei Anlagen des Prototyps:
## flackernde Leuchte (Abzweigdose), Klingelanlage, Förderband mit Schaltschrank.

const B := 12.0   # halbe Breite (x)
const T := 9.0    # halbe Tiefe (z)
const H := 4.2    # Raumhöhe

## Für die Minimap: Liste aus {"r": Rect2(x, z, breite, tiefe), "f": Color}
var formen: Array = []
var stationen := {}
var spawn := Vector3(-10.0, 0.0, 6.8)
var spawn_blick := -PI / 2.0
var pate_pos := Vector3(9.0, 0.0, 7.25)

var licht_ok := false
var glocke_ok := false
var band_laeuft := false

var _flacker_licht: OmniLight3D
var _flacker_kegel: MeshInstance3D
var _flacker_birne: StandardMaterial3D
var _flacker_takt := 0.0
var _glocke: Node3D
var _kloeppel: Node3D
var _glocke_audio: AudioStreamPlayer3D
var _glocke_timer := 9.0
var _glocke_laeutet := 0.0
var _funken_audio: AudioStreamPlayer3D
var _band_audio: AudioStreamPlayer3D
var _band_mat: StandardMaterial3D
var _kisten: Array[Node3D] = []
var _rollen: Array[Node3D] = []
var _lampe_betrieb: StandardMaterial3D
var _lampe_stoerung: StandardMaterial3D
var _schranktuer: Node3D
var _rose: Node3D
var _schraubendreher: Node3D
var _marker: Node3D
var _sammel := {}
var _zeit := 0.0

# Häufig benutzte Materialien
var m_beton: StandardMaterial3D
var m_wand: StandardMaterial3D
var m_wandfarbe: StandardMaterial3D
var m_holz: StandardMaterial3D
var m_metall: StandardMaterial3D
var m_dunkel: StandardMaterial3D
var m_ral: StandardMaterial3D
var m_gelb: StandardMaterial3D
var m_karton: StandardMaterial3D


func _ready() -> void:
	m_beton = Bau.mat(Color(0.75, 0.75, 0.75), "beton", 0.3, 0.0, false)
	m_wand = Bau.mat(Color(1, 1, 1), "ziegel", 0.45, 0.0, false)
	m_wandfarbe = Bau.mat(Color(0.2, 0.42, 0.36), "beton", 0.5, 0.0, false)
	m_holz = Bau.mat(Color(1, 1, 1), "holz", 0.8, 0.012)
	m_metall = Bau.mat(Color(0.75, 0.77, 0.8), "metall", 1.0, 0.01)
	m_dunkel = Bau.mat(Color(0.12, 0.12, 0.13), "", 1.0, 0.01)
	m_ral = Bau.mat(Color(0.8, 0.81, 0.78), "metall", 1.0, 0.015)
	m_gelb = Bau.mat(Color(0.98, 0.78, 0.08), "", 1.0, 0.0)
	m_karton = Bau.mat(Color(1, 1, 1), "karton", 1.2, 0.01)
	_umgebung()
	_raum()
	_buero()
	_lichtstation()
	_klingelanlage()
	_foerderband()
	_schaltschrank()
	_deko()
	_sammelobjekte()
	_marker_bauen()


func _form(mitte_x: float, mitte_z: float, breite: float, tiefe: float, farbe: Color) -> void:
	formen.append({"r": Rect2(mitte_x - breite * 0.5, mitte_z - tiefe * 0.5, breite, tiefe), "f": farbe})


# ---------------------------------------------------------------- Umgebung & Licht

func _umgebung() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.02, 0.02, 0.04)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.32, 0.36, 0.55)
	env.ambient_light_energy = 0.55
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 1.1
	env.glow_enabled = true
	env.glow_intensity = 0.7
	env.glow_bloom = 0.05
	env.glow_hdr_threshold = 1.0
	env.fog_enabled = true
	env.fog_light_color = Color(0.08, 0.09, 0.15)
	env.fog_density = 0.018
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.2
	env.adjustment_contrast = 1.08
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)

	# Deckenlampen (warmes Licht, Lichtkegel)
	_lampe(Vector3(-6.0, H, 5.5), Color(1.0, 0.78, 0.5), 1.4, 7.5, false)
	_lampe(Vector3(5.0, H, -4.5), Color(0.85, 0.92, 1.0), 1.7, 9.0, true)
	_lampe(Vector3(-1.5, H, -6.0), Color(0.9, 0.85, 0.7), 0.9, 6.5, false)
	_lampe(Vector3(0.5, H, 3.5), Color(1.0, 0.8, 0.55), 1.1, 7.0, false)
	# Büro: warmes Spotlicht von oben
	var spot := SpotLight3D.new()
	spot.position = Vector3(8.8, H - 0.1, 5.4)
	spot.rotation.x = -PI / 2.0
	spot.light_color = Color(1.0, 0.8, 0.55)
	spot.light_energy = 3.2
	spot.spot_range = 7.0
	spot.spot_angle = 48.0
	spot.shadow_enabled = true
	add_child(spot)
	Bau.lichtkegel(self, Vector3(8.8, H - 0.1, 5.4), H - 0.1, 2.6, Color(1.0, 0.75, 0.45), 0.08)


func _lampe(pos: Vector3, farbe: Color, energie: float, reichweite: float, schatten: bool) -> OmniLight3D:
	var kabel_laenge := 0.55
	Bau.zylinder(self, 0.012, kabel_laenge, pos - Vector3(0, kabel_laenge * 0.5, 0), m_dunkel)
	var schirm_m := Bau.mat(Color(0.12, 0.3, 0.2), "", 1.0, 0.012)
	Bau.zylinder(self, 0.38, 0.28, pos - Vector3(0, kabel_laenge + 0.12, 0), schirm_m, Vector3.ZERO, false, 0.1)
	var birne := Bau.leucht(farbe, 4.0)
	Bau.kugel(self, 0.09, pos - Vector3(0, kabel_laenge + 0.27, 0), birne)
	var l := OmniLight3D.new()
	l.position = pos - Vector3(0, kabel_laenge + 0.4, 0)
	l.light_color = farbe
	l.light_energy = energie
	l.omni_range = reichweite
	l.omni_attenuation = 1.2
	l.shadow_enabled = schatten
	add_child(l)
	var kegel := Bau.lichtkegel(self, pos - Vector3(0, kabel_laenge + 0.26, 0), pos.y - kabel_laenge - 0.26, 1.9, farbe, 0.11)
	l.set_meta("kegel", kegel)
	l.set_meta("birne", birne)
	return l


# ---------------------------------------------------------------- Raum

func _raum() -> void:
	# Boden, Decke
	Bau.box(self, Vector3(B * 2 + 0.8, 0.2, T * 2 + 0.8), Vector3(0, -0.1, 0), m_beton, true)
	Bau.box(self, Vector3(B * 2 + 0.8, 0.2, T * 2 + 0.8), Vector3(0, H + 0.1, 0), Bau.mat(Color(0.5, 0.5, 0.52), "beton_dunkel", 0.3, 0.0, false))
	# Wände: Ziegel oben, grüner Anstrich unten, dunkler Streifen
	var waende := [
		[Vector3(B * 2 + 0.8, H, 0.4), Vector3(0, H * 0.5, -T - 0.2), Vector3(0, 0, 1)],
		[Vector3(B * 2 + 0.8, H, 0.4), Vector3(0, H * 0.5, T + 0.2), Vector3(0, 0, -1)],
		[Vector3(0.4, H, T * 2), Vector3(-B - 0.2, H * 0.5, 0), Vector3(1, 0, 0)],
		[Vector3(0.4, H, T * 2), Vector3(B + 0.2, H * 0.5, 0), Vector3(-1, 0, 0)],
	]
	for w in waende:
		var groesse: Vector3 = w[0]
		var pos: Vector3 = w[1]
		var innen: Vector3 = w[2]
		Bau.box(self, groesse, pos, m_wand, true)
		var anstrich := groesse
		anstrich.y = 1.3
		var p2 := pos + innen * 0.22
		p2.y = 0.65
		if innen.x != 0.0:
			anstrich.x = 0.06
		else:
			anstrich.z = 0.06
		Bau.box(self, anstrich, p2, m_wandfarbe)
		var streifen := anstrich
		streifen.y = 0.06
		Bau.box(self, streifen + innen.abs() * 0.01, Vector3(p2.x, 1.32, p2.z) + innen * 0.01, Bau.mat(Color(0.08, 0.15, 0.12), "", 1.0, 0.0, false))
	# Deckenträger
	var m_traeger := Bau.mat(Color(0.42, 0.42, 0.45), "beton_dunkel", 0.5, 0.0, false)
	for x in [-8.0, -4.0, 0.0, 4.0, 8.0]:
		Bau.box(self, Vector3(0.35, 0.35, T * 2), Vector3(x, H - 0.17, 0), m_traeger)
	# Stütze
	Bau.box(self, Vector3(0.5, H, 0.5), Vector3(-1.5, H * 0.5, 1.0), Bau.mat(Color(0.65, 0.65, 0.64), "beton", 0.5, 0.0, false), true)
	Bau.box(self, Vector3(0.52, 1.2, 0.52), Vector3(-1.5, 0.6, 1.0), Bau.mat(Color(0.95, 0.75, 0.1), "", 1.0, 0.0, false))
	_form(-1.5, 1.0, 0.5, 0.5, Color(0.5, 0.5, 0.5))
	# Rohre an der Decke (Heizung rot, Wasser blau)
	for z in [-8.55, 8.55]:
		Bau.zylinder(self, 0.09, B * 2, Vector3(0, 3.75, z), Bau.mat(Color(0.7, 0.15, 0.1), "", 1.0, 0.01), Vector3(0, 0, PI / 2))
		Bau.zylinder(self, 0.07, B * 2, Vector3(0, 3.45, z), Bau.mat(Color(0.25, 0.4, 0.65), "", 1.0, 0.01), Vector3(0, 0, PI / 2))
	# Kabeltrasse an der Westwand
	Bau.box(self, Vector3(0.3, 0.06, T * 2), Vector3(-B + 0.2, 3.9, 0), m_metall)
	# Ausgangstür mit Notausgang-Schild
	var m_tuer := Bau.mat(Color(0.35, 0.45, 0.5), "metall", 1.0, 0.012)
	Bau.box(self, Vector3(0.12, 2.25, 1.3), Vector3(-B + 0.02, 1.12, 7.0), m_tuer)
	Bau.box(self, Vector3(0.16, 2.35, 0.08), Vector3(-B + 0.04, 1.17, 6.3), m_dunkel)
	Bau.box(self, Vector3(0.16, 2.35, 0.08), Vector3(-B + 0.04, 1.17, 7.7), m_dunkel)
	Bau.box(self, Vector3(0.16, 0.08, 1.48), Vector3(-B + 0.04, 2.3, 7.0), m_dunkel)
	Bau.box(self, Vector3(0.1, 0.05, 0.3), Vector3(-B + 0.12, 1.05, 6.6), m_metall)
	Bau.box(self, Vector3(0.06, 0.25, 0.7), Vector3(-B + 0.05, 2.65, 7.0), Bau.leucht(Color(0.1, 0.9, 0.35), 2.5))
	Bau.schild(self, "AUSGANG  ↑  TREPPE", Vector3(-B + 0.1, 2.65, 7.0), 30, Color.WHITE, PI / 2)
	var exit_licht := OmniLight3D.new()
	exit_licht.position = Vector3(-B + 0.6, 2.6, 7.0)
	exit_licht.light_color = Color(0.2, 1.0, 0.45)
	exit_licht.light_energy = 0.8
	exit_licht.omni_range = 3.0
	add_child(exit_licht)
	stationen["tuer"] = Interaktiv.neu(self, "tuer", Vector3(-B + 0.7, 0, 7.0), "Tür nach oben", 1.6)
	# Schilder an den Wänden
	Bau.schild(self, "LINCOLN HIGH  ·  KELLER / HAUSTECHNIK", Vector3(-3.0, 2.75, -T + 0.02), 56, Color(0.95, 0.85, 0.6), 0.0, 8)
	Bau.schild(self, "UNBEFUGTEN IST DER ZUTRITT VERBOTEN", Vector3(-B + 0.03, 2.2, 3.5), 34, Color(0.95, 0.2, 0.15), PI / 2, 6)


# ---------------------------------------------------------------- Büro des Paten

func _trennwand(von: Vector3, bis: Vector3) -> void:
	var mitte := (von + bis) * 0.5
	var laenge := von.distance_to(bis)
	var entlang_x := absf(bis.x - von.x) > absf(bis.z - von.z)
	var rot := 0.0 if entlang_x else PI / 2.0
	var holz := Bau.mat(Color(0.55, 0.32, 0.18), "holz", 1.0, 0.0)
	Bau.box(self, Vector3(laenge, 1.0, 0.12), mitte + Vector3(0, 0.5, 0), holz, false, rot)
	Bau.box(self, Vector3(laenge, 1.65, 0.03), mitte + Vector3(0, 1.83, 0), Bau.glas(Color(0.6, 0.75, 0.85, 0.18)), false, rot)
	Bau.box(self, Vector3(laenge, 0.08, 0.14), mitte + Vector3(0, 2.68, 0), holz, false, rot)
	Bau.box(self, Vector3(laenge, 0.06, 0.16), mitte + Vector3(0, 1.02, 0), holz, false, rot)
	var anzahl := int(laenge / 1.3) + 1
	for i in anzahl + 1:
		var t := float(i) / anzahl
		var p := von.lerp(bis, t)
		Bau.box(self, Vector3(0.08, 2.7, 0.14), p + Vector3(0, 1.35, 0), holz, false, rot)
	var kol := Bau.kollisionsbox(self, Vector3(laenge, 2.7, 0.2), mitte + Vector3(0, 1.35, 0))
	kol.rotation.y = rot
	if entlang_x:
		_form(mitte.x, mitte.z, laenge, 0.18, Color(0.75, 0.55, 0.3))
	else:
		_form(mitte.x, mitte.z, 0.18, laenge, Color(0.75, 0.55, 0.3))


func _buero() -> void:
	# Teppich mit Goldrand
	Bau.box(self, Vector3(6.9, 0.02, 6.4), Vector3(8.55, 0.01, 5.75), Bau.mat(Color(1, 1, 1), "teppich", 0.6, 0.0, false))
	var gold := Bau.mat(Color(0.8, 0.6, 0.15), "", 1.0, 0.0, false)
	Bau.box(self, Vector3(5.6, 0.025, 0.08), Vector3(8.6, 0.012, 3.3), gold)
	Bau.box(self, Vector3(5.6, 0.025, 0.08), Vector3(8.6, 0.012, 8.3), gold)
	Bau.box(self, Vector3(0.08, 0.025, 5.0), Vector3(5.8, 0.012, 5.8), gold)
	Bau.box(self, Vector3(0.08, 0.025, 5.0), Vector3(11.4, 0.012, 5.8), gold)
	# Glas-Trennwände (Eingang zwischen x = 5 und 6.8 an der Nordseite)
	_trennwand(Vector3(6.8, 0, 2.5), Vector3(B, 0, 2.5))
	_trennwand(Vector3(5.0, 0, 2.5), Vector3(5.0, 0, T))
	Bau.schild(self, "MR. JOSEF\nElektrotechnik", Vector3(9.4, 1.9, 2.47), 44, Color(0.9, 0.75, 0.3), PI, 4)
	Bau.schild(self, "Bitte nicht klopfen.\nDie Familie weiß, dass du da bist.", Vector3(9.4, 1.35, 2.47), 22, Color(0.95, 0.95, 0.9), PI, 3)

	# Schreibtisch
	var tisch := Node3D.new()
	tisch.position = Vector3(9.0, 0, 6.3)
	add_child(tisch)
	var dunkles_holz := Bau.mat(Color(0.75, 0.6, 0.55), "holz", 1.0, 0.012)
	Bau.box(tisch, Vector3(2.5, 0.08, 1.05), Vector3(0, 0.79, 0), dunkles_holz)
	Bau.box(tisch, Vector3(2.4, 0.72, 0.06), Vector3(0, 0.38, -0.46), dunkles_holz)
	Bau.box(tisch, Vector3(0.6, 0.72, 0.95), Vector3(-0.9, 0.38, 0), dunkles_holz)
	Bau.box(tisch, Vector3(0.6, 0.72, 0.95), Vector3(0.9, 0.38, 0), dunkles_holz)
	Bau.box(tisch, Vector3(1.6, 0.012, 0.6), Vector3(0, 0.836, 0.05), Bau.mat(Color(0.15, 0.35, 0.22), "", 1.0, 0.0))
	Bau.kollisionsbox(tisch, Vector3(2.5, 0.85, 1.05), Vector3(0, 0.42, 0))
	_form(9.0, 6.3, 2.5, 1.05, Color(0.55, 0.35, 0.2))
	# Bankerlampe
	var messing := Bau.mat(Color(0.85, 0.65, 0.25), "", 1.0, 0.008, true, 0.3)
	Bau.zylinder(tisch, 0.1, 0.03, Vector3(-0.85, 0.85, 0.15), messing)
	Bau.zylinder(tisch, 0.015, 0.35, Vector3(-0.85, 1.02, 0.15), messing)
	var schirm := Bau.box(tisch, Vector3(0.38, 0.1, 0.16), Vector3(-0.85, 1.2, 0.08), Bau.mat(Color(0.05, 0.45, 0.2), "", 1.0, 0.01))
	schirm.rotation.x = 0.25
	Bau.box(tisch, Vector3(0.32, 0.02, 0.1), Vector3(-0.85, 1.14, 0.06), Bau.leucht(Color(1.0, 0.85, 0.5), 3.0))
	var tl := OmniLight3D.new()
	tl.position = Vector3(-0.85, 1.05, -0.1)
	tl.light_color = Color(1.0, 0.75, 0.4)
	tl.light_energy = 1.6
	tl.omni_range = 3.5
	tisch.add_child(tl)
	# Telefon, Papiere, Tasse, Namensschild
	Bau.box(tisch, Vector3(0.22, 0.08, 0.18), Vector3(0.75, 0.87, 0.1), m_dunkel)
	Bau.kapsel(tisch, 0.03, 0.22, Vector3(0.75, 0.94, 0.1), m_dunkel, Vector3(0, 0, PI / 2))
	var papier := Bau.mat(Color(0.97, 0.96, 0.9), "", 1.0, 0.0)
	for i in 3:
		var p := Bau.box(tisch, Vector3(0.3, 0.004, 0.42), Vector3(0.1 + i * 0.05, 0.845 + i * 0.004, 0.05), papier)
		p.rotation.y = 0.15 * i - 0.1
	Bau.zylinder(tisch, 0.045, 0.1, Vector3(0.45, 0.88, -0.25), Bau.mat(Color(0.7, 0.08, 0.1), "", 1.0, 0.006))
	var schild := Bau.box(tisch, Vector3(0.5, 0.1, 0.06), Vector3(0, 0.88, -0.38), Bau.mat(Color(0.2, 0.12, 0.06)))
	schild.rotation.x = -0.4
	Bau.schild(tisch, "DER PATE", Vector3(0, 0.89, -0.42), 26, Color(0.95, 0.78, 0.3), PI).rotation.x = 0.4
	# Chefsessel
	var leder := Bau.mat(Color(0.45, 0.08, 0.08), "", 1.0, 0.012)
	Bau.box(self, Vector3(0.7, 0.15, 0.65), Vector3(9.0, 0.5, 8.0), leder)
	Bau.box(self, Vector3(0.7, 1.0, 0.15), Vector3(9.0, 1.05, 8.3), leder)
	Bau.zylinder(self, 0.05, 0.4, Vector3(9.0, 0.22, 8.0), m_dunkel)
	Bau.kollisionsbox(self, Vector3(0.8, 1.5, 0.8), Vector3(9.0, 0.75, 8.1))
	# Besucherstühle
	for x in [7.5, 10.5]:
		Bau.box(self, Vector3(0.5, 0.08, 0.5), Vector3(x, 0.46, 4.6), leder)
		Bau.box(self, Vector3(0.5, 0.6, 0.08), Vector3(x, 0.8, 4.35), leder)
		for dx in [-0.2, 0.2]:
			for dz in [-0.2, 0.2]:
				Bau.zylinder(self, 0.02, 0.46, Vector3(x + dx, 0.23, 4.6 + dz), m_dunkel)
		Bau.kollisionsbox(self, Vector3(0.55, 1.0, 0.55), Vector3(x, 0.5, 4.55))
	# Bücherregal an der Ostwand
	var regal := Node3D.new()
	regal.position = Vector3(B - 0.25, 0, 6.0)
	add_child(regal)
	Bau.box(regal, Vector3(0.4, 2.3, 2.6), Vector3(0, 1.15, 0), dunkles_holz, true)
	var rng := RandomNumberGenerator.new()
	rng.seed = 42
	var buchfarben := [Color(0.6, 0.1, 0.1), Color(0.1, 0.25, 0.5), Color(0.15, 0.4, 0.2), Color(0.8, 0.6, 0.15), Color(0.2, 0.2, 0.2)]
	for brett in 4:
		var y := 0.25 + brett * 0.55
		var z := -1.15
		while z < 1.1:
			var dicke := rng.randf_range(0.05, 0.11)
			var hoehe := rng.randf_range(0.3, 0.42)
			Bau.box(regal, Vector3(0.28, hoehe, dicke), Vector3(-0.25, y + hoehe * 0.5, z + dicke * 0.5),
				Bau.mat(buchfarben[rng.randi() % buchfarben.size()], "", 1.0, 0.0))
			z += dicke + 0.01
	_form(B - 0.25, 6.0, 0.4, 2.6, Color(0.55, 0.35, 0.2))
	# Hutständer mit Fedora
	Bau.zylinder(self, 0.025, 1.8, Vector3(6.0, 0.9, 8.4), dunkles_holz)
	Bau.zylinder(self, 0.25, 0.03, Vector3(6.0, 0.02, 8.4), dunkles_holz)
	var hut := Bau.mat(Color(0.12, 0.11, 0.12), "", 1.0, 0.012)
	Bau.zylinder(self, 0.26, 0.02, Vector3(6.0, 1.83, 8.4), hut)
	Bau.zylinder(self, 0.14, 0.16, Vector3(6.0, 1.92, 8.4), hut, Vector3.ZERO, false, 0.12)
	Bau.zylinder(self, 0.142, 0.04, Vector3(6.0, 1.87, 8.4), Bau.mat(Color(0.5, 0.06, 0.08)))
	# Bilder an der Südwand
	_bild(Vector3(9.0, 2.35, T - 0.04), Vector2(1.6, 1.0), "LA FAMIGLIA\nKlasse 10M", Color(0.25, 0.18, 0.12))
	_bild(Vector3(11.0, 2.2, T - 0.04), Vector2(0.8, 1.0), "U = R · I\n\nRespektiere\ndas Gesetz.", Color(0.1, 0.2, 0.35))
	_bild(Vector3(6.9, 2.5, T - 0.04), Vector2(1.0, 0.6), "LINCOLN\nLIONS", Color(0.5, 0.06, 0.1))
	# Pflanze
	Bau.zylinder(self, 0.22, 0.4, Vector3(11.4, 0.2, 8.4), Bau.mat(Color(0.65, 0.3, 0.15)), Vector3.ZERO, true, 0.26)
	var gruen := Bau.mat(Color(0.15, 0.5, 0.2))
	for i in 5:
		var w := i * TAU / 5.0
		Bau.kugel(self, 0.22, Vector3(11.4 + cos(w) * 0.15, 0.7 + i * 0.08, 8.4 + sin(w) * 0.15), gruen)
	# Pate (Interaktion)
	stationen["pate"] = Interaktiv.neu(self, "pate", pate_pos, "Mit dem Paten sprechen", 2.7)


func _bild(pos: Vector3, groesse: Vector2, text: String, farbe: Color) -> void:
	Bau.box(self, Vector3(groesse.x + 0.12, groesse.y + 0.12, 0.05), pos, Bau.mat(Color(0.7, 0.55, 0.2), "", 1.0, 0.0))
	Bau.box(self, Vector3(groesse.x, groesse.y, 0.06), pos - Vector3(0, 0, 0.005), Bau.mat(farbe, "", 1.0, 0.0, false))
	Bau.schild(self, text, pos - Vector3(0, 0, 0.04), 30, Color(0.95, 0.88, 0.7), PI, 3)


# ---------------------------------------------------------------- Auftrag 1: flackernde Leuchte

func _lichtstation() -> void:
	_flacker_licht = _lampe(Vector3(-5.5, H, -1.0), Color(1.0, 0.82, 0.55), 1.6, 8.0, true)
	_flacker_kegel = _flacker_licht.get_meta("kegel")
	_flacker_birne = _flacker_licht.get_meta("birne")
	# Abzweigdose an der Westwand, Installationsrohr zur Decke und zur Leuchte
	var dose := Bau.mat(Color(0.62, 0.64, 0.62), "", 1.0, 0.012)
	Bau.box(self, Vector3(0.12, 0.3, 0.3), Vector3(-B + 0.06, 2.1, -1.0), dose)
	Bau.box(self, Vector3(0.02, 0.22, 0.22), Vector3(-B + 0.13, 2.1, -1.0), Bau.mat(Color(0.5, 0.52, 0.5)))
	var rohr := Bau.mat(Color(0.55, 0.57, 0.6), "", 1.0, 0.0)
	Bau.zylinder(self, 0.025, H - 2.25, Vector3(-B + 0.06, 2.25 + (H - 2.25) * 0.5, -1.0), rohr)
	Bau.zylinder(self, 0.025, B - 5.5, Vector3(-B + (B - 5.5) * 0.5, H - 0.05, -1.0), rohr, Vector3(0, 0, PI / 2))
	Bau.schild(self, "-XD3", Vector3(-B + 0.14, 2.32, -1.0), 22, Color(0.1, 0.1, 0.1), PI / 2)
	# Kabelkanal mit fremdem Schraubendreher
	Bau.box(self, Vector3(0.1, 0.08, 4.0), Vector3(-B + 0.05, 2.7, -1.0), Bau.mat(Color(0.92, 0.92, 0.9), "", 1.0, 0.0))
	_schraubendreher = Node3D.new()
	_schraubendreher.position = Vector3(-B + 0.08, 2.76, -0.3)
	_schraubendreher.rotation.y = 0.3
	add_child(_schraubendreher)
	Bau.kapsel(_schraubendreher, 0.02, 0.11, Vector3(0, 0, 0), Bau.mat(Color(0.05, 0.05, 0.05)), Vector3(PI / 2, 0, 0))
	Bau.zylinder(_schraubendreher, 0.005, 0.14, Vector3(0, 0, -0.12), m_metall, Vector3(PI / 2, 0, 0))
	# Stehleiter
	var leiter := Node3D.new()
	leiter.position = Vector3(-B + 1.3, 0, 0.5)
	add_child(leiter)
	var m_leiter := Bau.mat(Color(0.95, 0.75, 0.1), "", 1.0, 0.01)
	for seite in [-1, 1]:
		var holm := Bau.box(leiter, Vector3(0.05, 1.9, 0.05), Vector3(0.25 * seite, 0.93, -0.15), m_leiter)
		holm.rotation.x = 0.17
		var holm2 := Bau.box(leiter, Vector3(0.05, 1.9, 0.05), Vector3(0.25 * seite, 0.93, 0.15), m_leiter)
		holm2.rotation.x = -0.17
	for i in 5:
		Bau.box(leiter, Vector3(0.5, 0.03, 0.12), Vector3(0, 0.3 + i * 0.35, -0.29 + i * 0.06), m_leiter)
	Bau.kollisionsbox(leiter, Vector3(0.6, 1.9, 0.7), Vector3(0, 0.95, 0))
	stationen["verteiler_licht"] = Interaktiv.neu(self, "verteiler_licht", Vector3(-B + 0.9, 0, -1.0), "Abzweigdose untersuchen", 2.0)
	_funken_audio = AudioStreamPlayer3D.new()
	_funken_audio.position = Vector3(-5.5, H - 0.8, -1.0)
	_funken_audio.stream = Audio.strom("funken")
	_funken_audio.unit_size = 4.0
	add_child(_funken_audio)


func licht_reparieren() -> void:
	licht_ok = true
	_flacker_licht.light_energy = 2.0
	_flacker_birne.emission_energy_multiplier = 4.0
	(_flacker_kegel.material_override as ShaderMaterial).set_shader_parameter("flackern", 1.2)


func schraubendreher_entfernen() -> void:
	if _schraubendreher:
		_schraubendreher.visible = false


# ---------------------------------------------------------------- Auftrag 2: Klingelanlage

func _klingelanlage() -> void:
	var x := -4.0
	var wand := -T
	# Glocke
	_glocke = Node3D.new()
	_glocke.position = Vector3(x, 3.1, wand + 0.12)
	add_child(_glocke)
	var rot := Bau.mat(Color(0.85, 0.1, 0.08), "", 1.0, 0.012, true, 0.3)
	Bau.box(_glocke, Vector3(0.2, 0.2, 0.1), Vector3(0, 0, -0.04), m_dunkel)
	var schale := Bau.kugel(_glocke, 0.24, Vector3(0, 0, 0.02), rot, Vector3.ONE, true)
	schale.rotation.x = PI / 2
	_kloeppel = Node3D.new()
	_kloeppel.position = Vector3(0, -0.28, 0.14)
	_glocke.add_child(_kloeppel)
	Bau.zylinder(_kloeppel, 0.012, 0.12, Vector3(0, 0.06, 0), m_metall)
	Bau.kugel(_kloeppel, 0.035, Vector3.ZERO, m_metall)
	_glocke_audio = AudioStreamPlayer3D.new()
	_glocke_audio.stream = Audio.strom("glocke")
	_glocke_audio.unit_size = 9.0
	_glocke_audio.max_db = 4.0
	_glocke.add_child(_glocke_audio)
	# Steuerkasten mit Zeitschaltuhr -KF1
	var kasten := Node3D.new()
	kasten.position = Vector3(x, 1.5, wand + 0.11)
	add_child(kasten)
	Bau.box(kasten, Vector3(0.75, 0.95, 0.2), Vector3.ZERO, m_ral)
	Bau.box(kasten, Vector3(0.7, 0.012, 0.01), Vector3(0, 0.3, 0.105), m_dunkel)
	var uhr := Bau.zylinder(kasten, 0.14, 0.04, Vector3(-0.12, 0.02, 0.11), Bau.mat(Color(0.95, 0.95, 0.92)), Vector3(PI / 2, 0, 0))
	uhr.name = "Uhr"
	for i in 12:
		var w := i * TAU / 12.0
		var segment := Bau.box(kasten, Vector3(0.018, 0.04, 0.01), Vector3(-0.12 + cos(w) * 0.11, 0.02 + sin(w) * 0.11, 0.135),
			Bau.mat(Color(0.85, 0.1, 0.1) if i % 3 == 0 else Color(0.2, 0.2, 0.2)))
		segment.rotation.z = w + PI / 2
	Bau.box(kasten, Vector3(0.012, 0.09, 0.01), Vector3(-0.12, 0.06, 0.14), m_dunkel)
	Bau.zylinder(kasten, 0.035, 0.04, Vector3(0.2, 0.02, 0.11), Bau.mat(Color(0.1, 0.6, 0.2)), Vector3(PI / 2, 0, 0))
	Bau.schild(kasten, "KLINGELANLAGE", Vector3(0, 0.4, 0.115), 24, Color(0.1, 0.1, 0.1))
	Bau.schild(kasten, "-KF1", Vector3(-0.12, -0.17, 0.115), 20, Color(0.1, 0.1, 0.1))
	Bau.schild(kasten, "-SF3", Vector3(0.2, -0.08, 0.115), 20, Color(0.1, 0.1, 0.1))
	Bau.schild(self, "-PB1", Vector3(x + 0.38, 3.1, wand + 0.05), 22, Color(0.95, 0.95, 0.9))
	var rohr := Bau.mat(Color(0.55, 0.57, 0.6), "", 1.0, 0.0)
	Bau.zylinder(self, 0.02, 1.1, Vector3(x + 0.25, 2.5, wand + 0.06), rohr)
	_form(x, wand + 0.15, 0.8, 0.3, Color(0.75, 0.75, 0.72))
	stationen["klingel"] = Interaktiv.neu(self, "klingel", Vector3(x, 0, wand + 0.9), "Klingelsteuerung untersuchen", 1.9)


func glocke_laeuten() -> void:
	if _glocke_laeutet > 0.0:
		return
	_glocke_laeutet = 2.4
	_glocke_audio.play()


func glocke_reparieren() -> void:
	glocke_ok = true
	_glocke_laeutet = 0.0
	_glocke_audio.stop()


# ---------------------------------------------------------------- Auftrag 3: Förderband

func _foerderband() -> void:
	var z := -4.5
	var x0 := 0.0
	var x1 := B
	var laenge := x1 - x0
	var mx := (x0 + x1) * 0.5
	var stahl := Bau.mat(Color(0.3, 0.45, 0.65), "metall", 1.0, 0.01)
	for seite in [-1, 1]:
		Bau.box(self, Vector3(laenge, 0.16, 0.06), Vector3(mx, 0.8, z + 0.44 * seite), stahl)
	var bein_x := x0 + 0.4
	while bein_x < x1:
		for seite in [-1, 1]:
			Bau.box(self, Vector3(0.07, 0.8, 0.07), Vector3(bein_x, 0.4, z + 0.42 * seite), stahl)
		Bau.box(self, Vector3(0.06, 0.06, 0.84), Vector3(bein_x, 0.25, z), stahl)
		bein_x += 2.2
	# Gurt mit beweglicher Textur
	_band_mat = StandardMaterial3D.new()
	_band_mat.albedo_texture = _gurt_textur()
	_band_mat.uv1_scale = Vector3(laenge * 1.5, 1, 1)
	_band_mat.roughness = 0.9
	_band_mat.diffuse_mode = BaseMaterial3D.DIFFUSE_TOON
	Bau.box(self, Vector3(laenge, 0.04, 0.8), Vector3(mx, 0.87, z), _band_mat)
	for x in [x0 + 0.1, x1 - 0.2]:
		var rolle := Bau.zylinder(self, 0.07, 0.82, Vector3(x, 0.84, z), m_metall, Vector3(PI / 2, 0, 0))
		_rollen.append(rolle)
	Bau.kollisionsbox(self, Vector3(laenge, 1.0, 0.95), Vector3(mx, 0.5, z))
	_form(mx, z, laenge, 0.9, Color(0.35, 0.5, 0.7))
	# Einlauf-Haube am Anfang, Durchbruch zur Cafeteria am Ende
	var haube := Bau.mat(Color(0.95, 0.55, 0.1), "metall", 1.0, 0.015)
	Bau.box(self, Vector3(1.4, 0.06, 1.0), Vector3(x0 + 0.7, 1.55, z), haube)
	for seite in [-1, 1]:
		Bau.box(self, Vector3(1.4, 0.7, 0.04), Vector3(x0 + 0.7, 1.2, z + 0.48 * seite), haube)
	Bau.box(self, Vector3(0.04, 0.7, 1.0), Vector3(x0 + 0.02, 1.2, z), haube)
	Bau.box(self, Vector3(0.06, 1.4, 1.0), Vector3(x0 + 0.7, 2.3, z), haube)
	Bau.box(self, Vector3(0.05, 0.9, 1.1), Vector3(B - 0.01, 1.3, z), Bau.mat(Color(0.02, 0.02, 0.02), "", 1.0, 0.0, false))
	for i in 5:
		Bau.box(self, Vector3(0.02, 0.6, 0.18), Vector3(B - 0.35, 1.3, z - 0.4 + i * 0.2), Bau.mat(Color(0.1, 0.1, 0.1), "", 1.0, 0.0))
	Bau.schild(self, "ZUR CAFETERIA  →", Vector3(B - 0.03, 2.05, z), 30, Color(0.95, 0.9, 0.6), -PI / 2, 5)
	# Motor -MA1
	var motor := Bau.mat(Color(0.15, 0.5, 0.3), "", 1.0, 0.015)
	Bau.zylinder(self, 0.17, 0.42, Vector3(x0 - 0.15, 0.72, z - 0.25), motor, Vector3(PI / 2, 0, 0))
	for i in 5:
		Bau.box(self, Vector3(0.36, 0.015, 0.4), Vector3(x0 - 0.15, 0.6 + i * 0.05, z - 0.25), motor)
	Bau.box(self, Vector3(0.14, 0.1, 0.14), Vector3(x0 - 0.15, 0.93, z - 0.3), motor)
	Bau.schild(self, "-MA1", Vector3(x0 - 0.15, 1.05, z - 0.3), 22, Color.WHITE, -PI / 2, 4)
	# Kisten
	for i in 6:
		var kiste := Node3D.new()
		kiste.position = Vector3(1.8 + i * 1.6, 1.08, z)
		add_child(kiste)
		Bau.box(kiste, Vector3(0.5, 0.38, 0.5), Vector3.ZERO, m_karton)
		Bau.box(kiste, Vector3(0.51, 0.06, 0.12), Vector3(0, 0.17, 0), Bau.mat(Color(0.85, 0.75, 0.55), "", 1.0, 0.0))
		Bau.schild(kiste, "PUDDING" if i % 2 == 0 else "LUNCH", Vector3(0, 0, 0.255), 22, Color(0.4, 0.1, 0.05))
		_kisten.append(kiste)
	# Bedienpult
	Bau.zylinder(self, 0.035, 1.1, Vector3(1.6, 0.55, -3.6), m_dunkel)
	var pult := Node3D.new()
	pult.position = Vector3(1.6, 1.2, -3.6)
	add_child(pult)
	Bau.box(pult, Vector3(0.3, 0.38, 0.16), Vector3.ZERO, Bau.mat(Color(0.95, 0.8, 0.1), "", 1.0, 0.01))
	Bau.zylinder(pult, 0.04, 0.04, Vector3(0, 0.08, 0.09), Bau.mat(Color(0.1, 0.65, 0.2)), Vector3(PI / 2, 0, 0))
	Bau.zylinder(pult, 0.04, 0.04, Vector3(0, -0.08, 0.09), Bau.mat(Color(0.85, 0.1, 0.1)), Vector3(PI / 2, 0, 0))
	Bau.schild(pult, "-SF2  I", Vector3(0, 0.15, 0.085), 18, Color.BLACK)
	Bau.schild(pult, "-SF1  O", Vector3(0, -0.15, 0.085), 18, Color.BLACK)
	# gelb-schwarze Bodenmarkierung
	var mark := Bau.mat(Color(0.98, 0.8, 0.05), "", 1.0, 0.0, false)
	Bau.box(self, Vector3(laenge + 1.2, 0.012, 0.1), Vector3(mx - 0.6, 0.006, z - 0.85), mark)
	Bau.box(self, Vector3(laenge + 1.2, 0.012, 0.1), Vector3(mx - 0.6, 0.006, z + 0.85), mark)
	Bau.box(self, Vector3(0.1, 0.012, 1.8), Vector3(x0 - 1.2, 0.006, z), mark)
	_band_audio = AudioStreamPlayer3D.new()
	_band_audio.stream = Audio.strom("band")
	_band_audio.position = Vector3(4, 1, z)
	_band_audio.unit_size = 5.0
	_band_audio.volume_db = -6.0
	add_child(_band_audio)


func _gurt_textur() -> ImageTexture:
	var img := Image.create(32, 32, false, Image.FORMAT_RGB8)
	for y in 32:
		for x in 32:
			var c := Color(0.12, 0.12, 0.13)
			if x < 3:
				c = Color(0.3, 0.3, 0.32)
			img.set_pixel(x, y, c)
	img.generate_mipmaps()
	return ImageTexture.create_from_image(img)


func band_starten() -> void:
	band_laeuft = true
	_band_audio.play()
	_lampe_betrieb.emission_energy_multiplier = 3.0
	_lampe_stoerung.emission_energy_multiplier = 0.05


# ---------------------------------------------------------------- Schaltschrank +S1

func _schaltschrank() -> void:
	var s := Node3D.new()
	s.position = Vector3(8.0, 0, -T + 0.25)
	add_child(s)
	Bau.box(s, Vector3(1.2, 0.2, 0.45), Vector3(0, 0.1, 0), m_dunkel)
	Bau.box(s, Vector3(1.2, 2.0, 0.45), Vector3(0, 1.2, 0), m_ral, true)
	# Innenleben (sichtbar, wenn die Tür offen ist)
	var innen := Bau.mat(Color(0.9, 0.9, 0.88), "", 1.0, 0.0)
	Bau.box(s, Vector3(1.1, 1.9, 0.02), Vector3(0, 1.2, 0.18), innen)
	for reihe in 3:
		var y := 0.7 + reihe * 0.5
		Bau.box(s, Vector3(1.0, 0.035, 0.02), Vector3(0, y, 0.2), m_metall)
		for i in 6:
			var farbe := Color(0.25, 0.3, 0.38) if (i + reihe) % 3 else Color(0.85, 0.85, 0.82)
			Bau.box(s, Vector3(0.1, 0.22, 0.12), Vector3(-0.4 + i * 0.16, y, 0.25), Bau.mat(farbe, "", 1.0, 0.006))
	# schwarze Rose (zunächst unsichtbar)
	_rose = Node3D.new()
	_rose.position = Vector3(0.05, 1.22, 0.3)
	_rose.visible = false
	s.add_child(_rose)
	Bau.zylinder(_rose, 0.008, 0.4, Vector3(-0.1, 0, 0), Bau.mat(Color(0.1, 0.35, 0.12)), Vector3(0, 0, 1.2))
	var schwarz := Bau.mat(Color(0.06, 0.02, 0.04), "", 1.0, 0.008, true, 0.3)
	for i in 6:
		var w := i * TAU / 6.0
		var blatt := Bau.kugel(_rose, 0.035, Vector3(0.09 + cos(w) * 0.025, 0.08 + sin(w) * 0.025, 0.0), schwarz)
		blatt.scale = Vector3(1.0, 1.0, 0.6)
	Bau.kugel(_rose, 0.03, Vector3(0.09, 0.08, 0.02), Bau.mat(Color(0.15, 0.02, 0.05)))
	Bau.box(_rose, Vector3(0.05, 0.012, 0.03), Vector3(-0.05, -0.03, 0), Bau.mat(Color(0.1, 0.35, 0.12)))
	# Tür (Scharnier links)
	_schranktuer = Node3D.new()
	_schranktuer.position = Vector3(-0.6, 1.2, 0.235)
	s.add_child(_schranktuer)
	Bau.box(_schranktuer, Vector3(1.2, 2.0, 0.03), Vector3(0.6, 0, 0), m_ral)
	Bau.box(_schranktuer, Vector3(0.04, 0.2, 0.04), Vector3(1.08, 0, 0.03), m_dunkel)
	Bau.box(_schranktuer, Vector3(0.24, 0.21, 0.01), Vector3(0.6, 0.55, 0.02), Bau.mat(Color(1.0, 0.82, 0.0)))
	Bau.schild(_schranktuer, "⚡", Vector3(0.6, 0.55, 0.03), 60, Color.BLACK)
	Bau.schild(_schranktuer, "+S1  FÖRDERBAND", Vector3(0.6, 0.85, 0.02), 26, Color(0.1, 0.1, 0.1))
	_lampe_betrieb = Bau.leucht(Color(0.1, 0.9, 0.25), 0.05)
	_lampe_stoerung = Bau.leucht(Color(1.0, 0.15, 0.1), 3.0)
	Bau.zylinder(_schranktuer, 0.035, 0.03, Vector3(0.45, 0.25, 0.02), _lampe_betrieb, Vector3(PI / 2, 0, 0))
	Bau.zylinder(_schranktuer, 0.035, 0.03, Vector3(0.75, 0.25, 0.02), _lampe_stoerung, Vector3(PI / 2, 0, 0))
	Bau.schild(_schranktuer, "Betrieb      Störung", Vector3(0.6, 0.15, 0.02), 16, Color(0.1, 0.1, 0.1))
	var brumm := AudioStreamPlayer3D.new()
	brumm.stream = Audio.strom("brummen")
	brumm.position = Vector3(0, 1.2, 0.3)
	brumm.unit_size = 1.5
	brumm.volume_db = -10.0
	brumm.autoplay = true
	s.add_child(brumm)
	_form(8.0, -T + 0.25, 1.2, 0.45, Color(0.8, 0.8, 0.78))
	stationen["schaltschrank_band"] = Interaktiv.neu(self, "schaltschrank_band", Vector3(8.0, 0, -T + 1.15), "Schaltschrank +S1 öffnen", 1.9)


func schrank_oeffnen(mit_rose: bool) -> void:
	_rose.visible = mit_rose
	var t := create_tween()
	t.tween_property(_schranktuer, "rotation:y", -1.9, 1.2).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func rose_entfernen() -> void:
	_rose.visible = false
	var t := create_tween()
	t.tween_property(_schranktuer, "rotation:y", 0.0, 0.8)


func schrank_pos() -> Vector3:
	return Vector3(8.0, 1.3, -T + 0.5)


# ---------------------------------------------------------------- Deko

func _deko() -> void:
	# Heizkessel
	var kessel := Bau.mat(Color(0.55, 0.16, 0.1), "metall", 1.0, 0.015)
	Bau.zylinder(self, 1.05, 2.5, Vector3(-9.6, 1.35, -6.6), kessel, Vector3.ZERO, true)
	Bau.zylinder(self, 1.15, 0.2, Vector3(-9.6, 0.1, -6.6), m_dunkel)
	Bau.kugel(self, 1.05, Vector3(-9.6, 2.6, -6.6), kessel, Vector3(1, 0.35, 1))
	Bau.zylinder(self, 0.14, 1.4, Vector3(-9.6, 3.4, -6.6), kessel)
	Bau.zylinder(self, 0.16, 0.05, Vector3(-8.75, 1.7, -6.0), m_metall, Vector3(PI / 2, -0.6, 0))
	Bau.zylinder(self, 0.13, 0.06, Vector3(-8.73, 1.7, -5.97), Bau.leucht(Color(0.95, 0.95, 0.85), 0.6), Vector3(PI / 2, -0.6, 0))
	Bau.schild(self, "HEIZUNG", Vector3(-8.85, 1.2, -5.85), 34, Color(0.95, 0.9, 0.8), -0.6, 5)
	_form(-9.6, -6.6, 2.1, 2.1, Color(0.6, 0.25, 0.2))
	# Regal an der Ostwand
	var regal := Node3D.new()
	regal.position = Vector3(B - 0.35, 0, -1.0)
	add_child(regal)
	for dz in [-1.2, 1.2]:
		for dx in [-0.25, 0.25]:
			Bau.box(regal, Vector3(0.05, 2.2, 0.05), Vector3(dx, 1.1, dz), m_metall)
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	for i in 4:
		var y := 0.2 + i * 0.6
		Bau.box(regal, Vector3(0.6, 0.03, 2.5), Vector3(0, y, 0), m_metall)
		var z := -1.05
		while z < 0.9:
			var gross := rng.randf_range(0.25, 0.45)
			if rng.randf() < 0.75:
				if rng.randf() < 0.3:
					Bau.zylinder(regal, gross * 0.4, gross * 0.8, Vector3(0, y + gross * 0.4 + 0.015, z + gross * 0.5),
						Bau.mat([Color(0.85, 0.2, 0.15), Color(0.2, 0.45, 0.8), Color(0.95, 0.85, 0.2)][rng.randi() % 3]))
				else:
					Bau.box(regal, Vector3(0.45, gross * 0.8, gross), Vector3(0, y + gross * 0.4 + 0.015, z + gross * 0.5), m_karton)
			z += gross + 0.05
	Bau.kollisionsbox(regal, Vector3(0.65, 2.2, 2.5), Vector3(0, 1.1, 0))
	_form(B - 0.35, -1.0, 0.65, 2.5, Color(0.6, 0.6, 0.62))
	# Werkbank mit Schulradio
	var bank := Node3D.new()
	bank.position = Vector3(0.5, 0, T - 0.45)
	add_child(bank)
	Bau.box(bank, Vector3(2.6, 0.08, 0.8), Vector3(0, 0.9, 0), m_holz)
	for dx in [-1.2, 1.2]:
		Bau.box(bank, Vector3(0.08, 0.9, 0.7), Vector3(dx, 0.45, 0), m_metall)
	Bau.box(bank, Vector3(2.4, 0.04, 0.6), Vector3(0, 0.3, 0), m_metall)
	Bau.box(bank, Vector3(2.6, 1.0, 0.04), Vector3(0, 1.45, 0.36), Bau.mat(Color(0.75, 0.6, 0.4), "kork", 1.0, 0.0))
	for i in 5:
		Bau.box(bank, Vector3(0.03, 0.25, 0.03), Vector3(-1.0 + i * 0.22, 1.5, 0.3), m_dunkel)
	Bau.box(bank, Vector3(0.25, 0.18, 0.15), Vector3(-0.9, 1.03, 0), m_dunkel)
	Bau.kollisionsbox(bank, Vector3(2.6, 1.0, 0.8), Vector3(0, 0.5, 0))
	_form(0.5, T - 0.45, 2.6, 0.8, Color(0.55, 0.4, 0.25))
	var radio := Node3D.new()
	radio.position = Vector3(1.4, 0.94, T - 0.5)
	radio.rotation.y = PI + 0.2
	add_child(radio)
	Bau.box(radio, Vector3(0.45, 0.28, 0.18), Vector3(0, 0.14, 0), Bau.mat(Color(0.7, 0.35, 0.15), "holz", 2.0, 0.01))
	Bau.box(radio, Vector3(0.22, 0.18, 0.01), Vector3(-0.08, 0.15, -0.095), Bau.mat(Color(0.85, 0.8, 0.65)))
	Bau.box(radio, Vector3(0.1, 0.05, 0.01), Vector3(0.13, 0.2, -0.095), Bau.leucht(Color(1.0, 0.6, 0.2), 1.5))
	Bau.zylinder(radio, 0.025, 0.02, Vector3(0.13, 0.09, -0.095), m_dunkel, Vector3(PI / 2, 0, 0))
	var antenne := Bau.zylinder(radio, 0.004, 0.5, Vector3(0.15, 0.5, 0.05), m_metall)
	antenne.rotation.z = -0.4
	Bau.schild(radio, "WLHS", Vector3(-0.08, 0.15, -0.1), 20, Color(0.3, 0.15, 0.05), PI)
	stationen["radio"] = Interaktiv.neu(self, "radio", Vector3(1.4, 0, T - 1.3), "Schulradio WLHS", 1.6)
	# Alte Spinde an der Südwand (Spind 313 steht offen)
	var spind_m := Bau.mat(Color(0.12, 0.45, 0.5), "metall", 1.0, 0.012)
	for i in 6:
		var x := -9.0 + i * 0.75
		var nummer := 308 + i
		Bau.box(self, Vector3(0.72, 1.9, 0.5), Vector3(x, 0.95, T - 0.27), spind_m)
		for s in 3:
			Bau.box(self, Vector3(0.3, 0.02, 0.01), Vector3(x, 1.6 + s * 0.06, T - 0.53), m_dunkel)
		Bau.schild(self, str(nummer), Vector3(x, 1.4, T - 0.53), 26, Color.WHITE, PI, 4)
		if nummer == 313:
			var tuer := Node3D.new()
			tuer.position = Vector3(x - 0.36, 0.95, T - 0.53)
			tuer.rotation.y = 1.7
			add_child(tuer)
			Bau.box(tuer, Vector3(0.7, 1.85, 0.03), Vector3(0.35, 0, 0), spind_m)
			Bau.box(self, Vector3(0.66, 1.84, 0.02), Vector3(x, 0.95, T - 0.51), Bau.mat(Color(0.05, 0.08, 0.09), "", 1.0, 0.0))
	Bau.kollisionsbox(self, Vector3(4.5, 1.9, 0.5), Vector3(-7.125, 0.95, T - 0.27))
	_form(-7.125, T - 0.27, 4.5, 0.5, Color(0.2, 0.55, 0.6))
	# Kartons der Sanierungsfirma
	var stapel := Node3D.new()
	stapel.position = Vector3(-7.0, 0, 2.4)
	stapel.rotation.y = 0.3
	add_child(stapel)
	Bau.box(stapel, Vector3(1.2, 0.12, 1.0), Vector3(0, 0.06, 0), m_holz)
	for i in 4:
		var p := Vector3((i % 2) * 0.55 - 0.27, 0.37 + (i / 2) * 0.5, 0)
		Bau.box(stapel, Vector3(0.52, 0.5, 0.8), p, m_karton)
	Bau.schild(stapel, "STERLING BAU\nSanierung Lincoln High", Vector3(0, 0.6, 0.41), 22, Color(0.15, 0.1, 0.4))
	Bau.kollisionsbox(stapel, Vector3(1.2, 1.2, 1.0), Vector3(0, 0.6, 0))
	_form(-7.0, 2.4, 1.2, 1.0, Color(0.65, 0.5, 0.3))
	# Putzeimer
	Bau.zylinder(self, 0.2, 0.35, Vector3(-3.0, 0.18, T - 1.0), Bau.mat(Color(0.95, 0.8, 0.1)), Vector3.ZERO, false, 0.23)
	var stiel := Bau.zylinder(self, 0.02, 1.4, Vector3(-2.85, 0.75, T - 1.0), m_holz)
	stiel.rotation.z = -0.25


# ---------------------------------------------------------------- Sammelobjekte

func _sammelobjekte() -> void:
	_sammel_neu("s_widerstand", Vector3(B - 0.4, 2.07, -1.95))
	_sammel_neu("s_diode", Vector3(-B + 0.6, 0.12, -T + 0.6))
	_sammel_neu("s_hilfsschalter", Vector3(-5.25, 0.25, T - 0.3))


func _sammel_neu(id: String, pos: Vector3) -> void:
	var k := Node3D.new()
	k.position = pos
	add_child(k)
	match id:
		"s_widerstand":
			Bau.kapsel(k, 0.03, 0.14, Vector3.ZERO, Bau.mat(Color(0.85, 0.75, 0.55)), Vector3(0, 0, PI / 2))
			var ringe := [Color(0.95, 0.8, 0.1), Color(0.5, 0.15, 0.6), Color(0.45, 0.25, 0.1), Color(0.85, 0.7, 0.2)]
			for i in 4:
				Bau.zylinder(k, 0.032, 0.012, Vector3(-0.04 + i * 0.025, 0, 0), Bau.mat(ringe[i]), Vector3(0, 0, PI / 2))
			Bau.zylinder(k, 0.004, 0.32, Vector3.ZERO, m_metall, Vector3(0, 0, PI / 2))
		"s_diode":
			Bau.zylinder(k, 0.025, 0.1, Vector3.ZERO, m_dunkel, Vector3(0, 0, PI / 2))
			Bau.zylinder(k, 0.026, 0.015, Vector3(0.035, 0, 0), m_metall, Vector3(0, 0, PI / 2))
			Bau.zylinder(k, 0.004, 0.28, Vector3.ZERO, m_metall, Vector3(0, 0, PI / 2))
		_:
			Bau.box(k, Vector3(0.1, 0.12, 0.08), Vector3.ZERO, Bau.mat(Color(0.35, 0.37, 0.4)))
			Bau.box(k, Vector3(0.06, 0.02, 0.085), Vector3(0, 0.03, 0), Bau.mat(Color(0.9, 0.9, 0.9)))
	var funkeln := Bau.kugel(k, 0.06, Vector3.ZERO, Bau.leucht(Color(1.0, 0.85, 0.3), 1.2))
	funkeln.name = "Funkeln"
	(funkeln.material_override as StandardMaterial3D).transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	(funkeln.material_override as StandardMaterial3D).albedo_color.a = 0.35
	_sammel[id] = k
	stationen["sammel:" + id] = Interaktiv.neu(self, "sammel:" + id, Vector3(pos.x, 0, pos.z), "Etwas glitzert hier …", 1.4)


func sammel_entfernen(id: String) -> void:
	if _sammel.has(id):
		_sammel[id].queue_free()
		_sammel.erase(id)
	if stationen.has("sammel:" + id):
		stationen["sammel:" + id].queue_free()
		stationen.erase("sammel:" + id)


# ---------------------------------------------------------------- Missionsmarker

func _marker_bauen() -> void:
	_marker = Node3D.new()
	_marker.visible = false
	add_child(_marker)
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
	_marker.add_child(mi)
	var ring := Bau.torus(_marker, 0.5, 0.62, Vector3(0, 0.03, 0), Bau.leucht(Color(1.0, 0.8, 0.1), 2.5))
	ring.name = "Ring"
	ring.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


func marker_setzen(pos: Variant) -> void:
	if pos == null:
		_marker.visible = false
	else:
		_marker.visible = true
		_marker.position = pos


func marker_pos() -> Variant:
	return _marker.position if _marker.visible else null


# ---------------------------------------------------------------- Animation

func _process(delta: float) -> void:
	_zeit += delta
	# Flackernde Leuchte
	if not licht_ok:
		_flacker_takt -= delta
		if _flacker_takt <= 0.0:
			var an := randf() > 0.3
			_flacker_takt = randf_range(0.04, 0.12) if randf() < 0.6 else randf_range(0.3, 1.4)
			_flacker_licht.light_energy = (1.6 if an else 0.08) * randf_range(0.8, 1.1)
			_flacker_birne.emission_energy_multiplier = 4.0 if an else 0.2
			(_flacker_kegel.material_override as ShaderMaterial).set_shader_parameter("flackern", 1.0 if an else 0.05)
			if not an and randf() < 0.25 and is_inside_tree():
				_funken_audio.play()
	# Glocke läutet zur falschen Zeit
	if not glocke_ok:
		_glocke_timer -= delta
		if _glocke_timer <= 0.0:
			_glocke_timer = randf_range(35.0, 60.0)
			glocke_laeuten()
	if _glocke_laeutet > 0.0:
		_glocke_laeutet -= delta
		_kloeppel.rotation.z = sin(_zeit * 140.0) * 0.5
		_glocke.position.x = -4.0 + sin(_zeit * 90.0) * 0.006
	# Förderband
	if band_laeuft:
		_band_mat.uv1_offset.x -= delta * 0.9 * 1.5
		for r in _rollen:
			r.rotate_object_local(Vector3.UP, -delta * 12.0)
		for k in _kisten:
			k.position.x += delta * 0.9
			if k.position.x > B + 0.2:
				k.position.x = 0.4
	# Marker & Sammelobjekte
	if _marker.visible:
		_marker.get_node("Ring").scale = Vector3.ONE * (1.0 + sin(_zeit * 3.0) * 0.08)
	for id in _sammel:
		var k: Node3D = _sammel[id]
		k.rotation.y += delta * 1.5
		var f := k.get_node("Funkeln") as Node3D
		f.scale = Vector3.ONE * (0.8 + 0.4 * absf(sin(_zeit * 2.0 + k.position.x)))
