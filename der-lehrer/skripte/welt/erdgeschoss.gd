class_name Erdgeschoss
extends Bereich
## Erdgeschoss der Lincoln High bei Nacht: langer Flur mit Spinden und Pokalvitrine,
## dahinter die Cafeteria mit Essensausgabe und dem Ende von Band 1.
## Anlagen für Akt 2: Unterverteilung UV-EG mit Snackautomat, Infoscreen mit Access Point,
## Bedienstelle an der Bandübergabe. Koordinaten sind lokal (der Bereich liegt weit vom Keller entfernt).

const FX0 := -18.0   # Westende des Flurs (Treppenhaus)
const FX1 := 14.0    # Ostende des Flurs = Westwand der Cafeteria
const FZ := 2.6      # halbe Flurbreite
const FH := 3.5      # Flurhöhe
const CX1 := 34.0    # Ostwand der Cafeteria (Küche)
const CZ := 9.0      # halbe Tiefe der Cafeteria
const CH := 4.6      # Höhe der Cafeteria
const DURCHGANG := 1.6

var spawn := Vector3(-15.6, 0, -1.3)
var spawn_blick := -PI / 2.0
var kowalski_pos := Vector3(-2.2, 0, 0.9)
var kowalski_blick := PI / 2.0
var rosalita_pos := Vector3(32.2, 0, 0.4)
var rosalita_blick := PI / 2.0

var leitung_ok := false
var funk_ok := false
var bedienstelle_ok := false

var _zeit := 0.0
var _takt := 0.0
var _automat_licht: StandardMaterial3D
var _automat_omni: OmniLight3D
var _automat_aus := 0.0
var _heisse_leitung: StandardMaterial3D
var _fernmeldeleitung: Node3D
var _nym_kanal: Node3D
var _uv_tuer: Node3D
var _lieferschein: Node3D
var _schirm_mat: StandardMaterial3D
var _schirm_text: Label3D
var _ap_led: StandardMaterial3D
var _router: Node3D
var _router_led: StandardMaterial3D
var _deckenplatte: Node3D
var _datenleitung: Node3D
var _band_mat: StandardMaterial3D
var _band2_mat: StandardMaterial3D
var _kisten: Array[Node3D] = []
var _rollen: Array[Node3D] = []
var _pf1: StandardMaterial3D
var _abdeckung: Node3D
var _foto: Node3D

var m_metall: StandardMaterial3D
var m_dunkel: StandardMaterial3D
var m_weiss: StandardMaterial3D
var m_spind: StandardMaterial3D
var m_gold: StandardMaterial3D
var m_holz: StandardMaterial3D
var m_stahl: StandardMaterial3D


func _ready() -> void:
	titel = "Erdgeschoss"
	_boden_form(FX0, -FZ, FX1, FZ, Color(0.5, 0.5, 0.46), "Flur")
	_boden_form(FX1, -CZ, CX1, CZ, Color(0.5, 0.42, 0.4), "Cafeteria")
	symbole.append({"p": Vector3(FX0 + 0.4, 0, -1.3), "t": "↓", "f": Color(0.3, 1.0, 0.5)})
	m_metall = Bau.mat(Color(0.75, 0.77, 0.8), "metall", 1.0, 0.01)
	m_dunkel = Bau.mat(Color(0.12, 0.12, 0.13), "", 1.0, 0.01)
	m_weiss = Bau.mat(Color(0.92, 0.92, 0.9), "", 1.0, 0.0)
	m_spind = Bau.mat(Color(0.52, 0.11, 0.13), "metall", 1.0, 0.01, false, 0.45)
	m_gold = Bau.mat(Color(0.85, 0.65, 0.2), "", 1.0, 0.008, true, 0.3)
	m_holz = Bau.mat(Color(1, 1, 1), "holz", 0.8, 0.012)
	m_stahl = Bau.mat(Color(0.82, 0.84, 0.86), "metall", 1.0, 0.01, false, 0.3)
	_umgebung()
	_flur_raum()
	_spinde()
	_flur_details()
	_unterverteilung()
	_infoscreen()
	_cafeteria_raum()
	_essensausgabe()
	_tische()
	_band()
	_bedienstelle()
	_automaten()
	_fenster_licht()
	_sammelobjekte()
	_schatten()
	_fertigstellen(12.0)


# ---------------------------------------------------------------- Umgebung & Licht

func _umgebung() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.015, 0.02, 0.05)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.45, 0.48, 0.6)
	env.ambient_light_energy = 0.42
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 1.1
	env.glow_enabled = true
	env.glow_intensity = 0.85
	env.glow_bloom = 0.1
	env.glow_hdr_threshold = 0.9
	env.fog_enabled = true
	env.fog_light_color = Color(0.07, 0.08, 0.12)
	env.fog_density = 0.014
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.08
	env.adjustment_contrast = 1.1
	umwelt = env

	# Mondlicht durch die Fenster (ohne Schatten, nur als kühle Grundstimmung)
	var mond := DirectionalLight3D.new()
	mond.rotation = Vector3(-0.75, 2.6, 0)
	mond.light_color = Color(0.55, 0.65, 1.0)
	mond.light_energy = 0.28
	mond.shadow_enabled = false
	add_child(mond)
	# Flur: Leuchtstoffröhren, nachts brennt nur jede zweite
	_roehre(Vector3(-14.0, FH, 0), true, Color(0.8, 0.95, 0.85))
	_roehre(Vector3(-8.0, FH, 0), false)
	_roehre(Vector3(-2.0, FH, 0), true, Color(0.85, 0.95, 0.88))
	_roehre(Vector3(4.0, FH, 0), false)
	_roehre(Vector3(9.5, FH, 0.6), true, Color(0.75, 0.9, 1.0))
	# Cafeteria: Hängelampen über den Tischen, eine über dem Band
	var l1 := _lampe(Vector3(24.0, CH, -7.0), Color(1.0, 0.85, 0.6), 1.6, 8.0, true, Color(0.55, 0.08, 0.1), 0.8)
	var l2 := _lampe(Vector3(20.0, CH, -3.6), Color(1.0, 0.8, 0.55), 1.5, 8.0, true, Color(0.55, 0.08, 0.1), 0.8)
	_lampe(Vector3(20.0, CH, 4.5), Color(1.0, 0.8, 0.55), 1.4, 8.0, false, Color(0.55, 0.08, 0.1), 0.8)
	_lampe(Vector3(25.6, CH, 1.4), Color(1.0, 0.82, 0.6), 1.4, 8.0, false, Color(0.55, 0.08, 0.1), 0.8)
	_schatten_lichter.append(l1)
	_schatten_lichter.append(l2)
	# Küche hinter der Theke
	var kueche := OmniLight3D.new()
	kueche.position = Vector3(32.6, CH - 1.0, 0)
	kueche.light_color = Color(1.0, 0.92, 0.75)
	kueche.light_energy = 1.3
	kueche.omni_range = 7.5
	add_child(kueche)
	for z in [-3.0, 3.0]:
		Bau.box(self, Vector3(0.5, 0.06, 2.2), Vector3(32.6, CH - 0.03, z), Bau.leucht(Color(1.0, 0.95, 0.85), 2.5))


# ---------------------------------------------------------------- Flur

func _flur_raum() -> void:
	var boden := Bau.mat(Color(1, 1, 1), "fliesen", 0.83, 0.0, false, 0.32)
	Bau.box(self, Vector3(FX1 - FX0 + 0.2, 0.2, FZ * 2 + 0.6), Vector3((FX0 - 0.2 + FX1) * 0.5, -0.1, 0), boden, true)
	var decke := Bau.mat(Color(1, 1, 1), "deckenplatten", 0.83, 0.0, false)
	Bau.box(self, Vector3(FX1 - FX0, 0.1, FZ * 2), Vector3((FX0 + FX1) * 0.5, FH + 0.05, 0), decke)
	var wand := Bau.mat(Color(1, 1, 1), "bloecke", 0.625, 0.0, false)
	var laenge := FX1 - FX0
	var mx := (FX0 + FX1) * 0.5
	# Südwand (geschlossen)
	Bau.box(self, Vector3(laenge, FH, 0.3), Vector3(mx, FH * 0.5, FZ + 0.15), wand, true)
	# Nordwand: unten geschlossen, oben ein Fensterband
	Bau.box(self, Vector3(laenge, 2.2, 0.3), Vector3(mx, 1.1, -FZ - 0.15), wand, true)
	Bau.box(self, Vector3(laenge, FH - 3.3, 0.3), Vector3(mx, (FH + 3.3) * 0.5, -FZ - 0.15), wand)
	var rahmen := Bau.mat(Color(0.2, 0.22, 0.25), "", 1.0, 0.01)
	var glas := Bau.glas(Color(0.55, 0.65, 0.85, 0.16))
	var x := FX0
	while x < FX1 - 0.1:
		var breite := minf(3.2, FX1 - x)
		Bau.box(self, Vector3(0.45, 1.1, 0.3), Vector3(x + 0.225, 2.75, -FZ - 0.15), wand)
		Bau.box(self, Vector3(breite - 0.45, 1.1, 0.02), Vector3(x + 0.45 + (breite - 0.45) * 0.5, 2.75, -FZ - 0.2), glas)
		Bau.box(self, Vector3(0.05, 1.1, 0.08), Vector3(x + 0.45 + (breite - 0.45) * 0.5, 2.75, -FZ - 0.2), rahmen)
		Bau.box(self, Vector3(breite - 0.45, 0.06, 0.34), Vector3(x + 0.45 + (breite - 0.45) * 0.5, 2.22, -FZ - 0.12), rahmen)
		x += breite
	_nachthimmel(Vector3(mx, 2.75, -FZ - 0.9), Vector2(laenge + 2.0, 1.6), 0.0)
	# Westwand mit zwei Türen (Kellertreppe, Treppenhaus nach oben)
	Bau.box(self, Vector3(0.3, FH, FZ * 2 + 0.6), Vector3(FX0 - 0.15, FH * 0.5, 0), wand, true)
	_tuer(Vector3(FX0 + 0.02, 0, -1.3), PI / 2, Color(0.35, 0.45, 0.5), "TREPPE  ↓  KELLER")
	_tuer(Vector3(FX0 + 0.02, 0, 1.3), PI / 2, Color(0.35, 0.45, 0.5), "TREPPENHAUS  ↑  1. STOCK")
	Bau.box(self, Vector3(0.06, 0.22, 0.6), Vector3(FX0 + 0.05, 2.55, -1.3), Bau.leucht(Color(0.1, 0.9, 0.35), 2.5))
	Bau.schild(self, "NOTAUSGANG", Vector3(FX0 + 0.09, 2.55, -1.3), 22, Color.WHITE, PI / 2, 4)
	var exit_licht := OmniLight3D.new()
	exit_licht.position = Vector3(FX0 + 0.6, 2.5, -1.3)
	exit_licht.light_color = Color(0.2, 1.0, 0.45)
	exit_licht.light_energy = 0.7
	exit_licht.omni_range = 3.0
	add_child(exit_licht)
	# Absperrband vor der Treppe nach oben
	var band_m := Bau.mat(Color(0.95, 0.75, 0.05), "", 1.0, 0.0)
	for i in 2:
		var absperr := Bau.box(self, Vector3(0.02, 0.08, 1.3), Vector3(FX0 + 0.35, 0.95 + i * 0.35, 1.3), band_m)
		absperr.rotation.x = 0.08 * (1 - i * 2)
	Bau.schild(self, "BAUSTELLE\nSTERLING BAU", Vector3(FX0 + 0.38, 1.3, 1.3), 22, Color(0.1, 0.1, 0.1), PI / 2)
	ausgang = Interaktiv.neu(self, "treppe", Vector3(FX0 + 0.7, 0, -1.3), "Treppe zum Keller", 1.5)
	stationen["treppe"] = ausgang
	stationen["verschlossen:oben"] = Interaktiv.neu(self, "verschlossen:oben", Vector3(FX0 + 0.8, 0, 1.4), "Treppe nach oben", 1.2)
	# Ostende: Durchgang in die Cafeteria
	var schild_bg := Bau.mat(Color(0.5, 0.08, 0.1), "", 1.0, 0.0)
	Bau.box(self, Vector3(0.06, 0.45, 2.6), Vector3(FX1 - 0.04, 3.1, 0), schild_bg)
	Bau.schild(self, "CAFETERIA", Vector3(FX1 - 0.08, 3.1, 0), 56, Color(0.98, 0.82, 0.3), -PI / 2, 6)
	# Sockelleiste
	var sockel := Bau.mat(Color(0.18, 0.16, 0.15), "", 1.0, 0.0, false)
	Bau.box(self, Vector3(laenge, 0.1, 0.02), Vector3(mx, 0.05, FZ - 0.01), sockel)
	Bau.box(self, Vector3(laenge, 0.1, 0.02), Vector3(mx, 0.05, -FZ + 0.01), sockel)
	# Zierstreifen in Schulfarben
	Bau.box(self, Vector3(laenge, 0.12, 0.02), Vector3(mx, 2.12, FZ - 0.01), Bau.mat(Color(0.5, 0.08, 0.1), "", 1.0, 0.0, false))
	Bau.box(self, Vector3(laenge, 0.04, 0.02), Vector3(mx, 2.21, FZ - 0.012), Bau.mat(Color(0.85, 0.65, 0.2), "", 1.0, 0.0, false))
	# Raumgrenze zur Cafeteria (Wandstücke neben dem Durchgang)
	_form(mx, -FZ - 0.15, laenge, 0.3, Color(0.85, 0.85, 0.8))
	_form(mx, FZ + 0.15, laenge, 0.3, Color(0.85, 0.85, 0.8))


## Tür mit Rahmen und Schild (geschlossen, nur Dekoration)
func _tuer(pos: Vector3, rot_y: float, farbe: Color, text: String) -> void:
	var t := Node3D.new()
	t.position = pos
	t.rotation.y = rot_y
	add_child(t)
	var blatt := Bau.mat(farbe, "metall", 1.0, 0.012)
	Bau.box(t, Vector3(1.1, 2.2, 0.06), Vector3(0, 1.1, 0), blatt)
	Bau.box(t, Vector3(0.08, 2.3, 0.1), Vector3(-0.59, 1.15, 0), m_dunkel)
	Bau.box(t, Vector3(0.08, 2.3, 0.1), Vector3(0.59, 1.15, 0), m_dunkel)
	Bau.box(t, Vector3(1.26, 0.08, 0.1), Vector3(0, 2.28, 0), m_dunkel)
	Bau.box(t, Vector3(0.3, 0.05, 0.08), Vector3(0.35, 1.0, 0.05), m_metall)
	Bau.box(t, Vector3(0.35, 0.5, 0.02), Vector3(0, 1.6, 0.035), Bau.glas(Color(0.6, 0.7, 0.85, 0.3)))
	if text != "":
		Bau.box(t, Vector3(0.9, 0.2, 0.02), Vector3(0, 2.0, 0.04), m_weiss)
		Bau.schild(t, text, Vector3(0, 2.0, 0.055), 18, Color(0.1, 0.1, 0.12))


func _spinde() -> void:
	# Nordseite (Spinde schauen nach Süden in den Flur)
	for r in [[-16.8, -11.2], [-9.2, -3.2], [-1.4, 7.0], [11.0, 13.6]]:
		_spindreihe(r[0], r[1], -FZ, 1.0)
	# Südseite
	for r in [[-13.2, -7.6], [-5.8, -1.6], [1.2, 9.2]]:
		_spindreihe(r[0], r[1], FZ, -1.0)
	# Türen zwischen den Spinden
	_tuer(Vector3(-10.2, 0, -FZ + 0.02), 0.0, Color(0.55, 0.38, 0.2), "R 104  ·  MT10")
	_tuer(Vector3(-2.4, 0, -FZ + 0.02), 0.0, Color(0.55, 0.38, 0.2), "R 106  ·  PHYSIK")
	_tuer(Vector3(-6.8, 0, FZ - 0.02), PI, Color(0.55, 0.38, 0.2), "SEKRETARIAT")
	stationen["verschlossen:mt10"] = Interaktiv.neu(self, "verschlossen:mt10", Vector3(-10.2, 0, -FZ + 0.8), "Klassenzimmer der MT10", 1.0)
	stationen["verschlossen:sekretariat"] = Interaktiv.neu(self, "verschlossen:sekretariat", Vector3(-6.8, 0, FZ - 0.8), "Sekretariat", 1.0)
	# Der Spind von Vince Moretti (mit Rosen-Aufkleber)
	var x := -4.2
	Bau.box(self, Vector3(0.36, 0.3, 0.01), Vector3(x, 1.45, -FZ + 0.456), Bau.mat(Color(0.08, 0.08, 0.08), "", 1.0, 0.0))
	Bau.schild(self, "V. MORETTI", Vector3(x, 1.56, -FZ + 0.465), 14, Color(0.9, 0.9, 0.9))
	for i in 5:
		var w := i * TAU / 5.0
		Bau.kugel(self, 0.022, Vector3(x + cos(w) * 0.022, 1.42 + sin(w) * 0.022, -FZ + 0.465), Bau.mat(Color(0.05, 0.02, 0.03)), Vector3(1, 1, 0.3))


## Reihe aus Stahlspinden; seite = +1 an der Nordwand, -1 an der Südwand
func _spindreihe(x0: float, x1: float, zwand: float, seite: float) -> void:
	var tiefe := 0.45
	var z := zwand + seite * tiefe * 0.5
	var vorne := zwand + seite * tiefe
	var anzahl := int(round((x1 - x0) / 0.4))
	var schlitz := Bau.mat(Color(0.12, 0.03, 0.04), "", 1.0, 0.0)
	var rng := RandomNumberGenerator.new()
	rng.seed = int(x0 * 10.0 + zwand * 100.0)
	Bau.box(self, Vector3(x1 - x0, 0.12, tiefe - 0.04), Vector3((x0 + x1) * 0.5, 0.06, z), m_dunkel)
	for i in anzahl:
		var x := x0 + 0.2 + i * 0.4
		Bau.box(self, Vector3(0.39, 1.82, tiefe), Vector3(x, 1.03, z), m_spind)
		Bau.box(self, Vector3(0.012, 1.8, 0.01), Vector3(x + 0.195, 1.03, vorne), schlitz)
		for v in 3:
			Bau.box(self, Vector3(0.22, 0.018, 0.01), Vector3(x, 1.72 + v * 0.05, vorne), schlitz)
			Bau.box(self, Vector3(0.22, 0.018, 0.01), Vector3(x, 0.3 + v * 0.05, vorne), schlitz)
		Bau.box(self, Vector3(0.04, 0.14, 0.03), Vector3(x + 0.13, 1.1, vorne + seite * 0.01), m_metall)
		Bau.box(self, Vector3(0.09, 0.04, 0.01), Vector3(x, 1.5, vorne), m_gold)
		# ab und zu ein Aufkleber oder ein Zettel
		if rng.randf() < 0.12:
			var farbe: Color = [Color(0.95, 0.9, 0.3), Color(0.3, 0.6, 0.95), Color(0.95, 0.95, 0.92)][rng.randi() % 3]
			var zettel := Bau.box(self, Vector3(0.14, 0.18, 0.005), Vector3(x - 0.05, 1.25, vorne + seite * 0.004), Bau.mat(farbe, "", 1.0, 0.0))
			zettel.rotation.z = rng.randf_range(-0.2, 0.2)
	Bau.box(self, Vector3(x1 - x0, 0.03, tiefe + 0.02), Vector3((x0 + x1) * 0.5, 1.955, z), Bau.mat(Color(0.4, 0.08, 0.1), "metall", 1.0, 0.01))
	Bau.kollisionsbox(self, Vector3(x1 - x0, 2.0, tiefe), Vector3((x0 + x1) * 0.5, 1.0, z))
	_form((x0 + x1) * 0.5, z, x1 - x0, tiefe, Color(0.6, 0.2, 0.22))


func _flur_details() -> void:
	# Pokalvitrine an der Südwand
	var v := Node3D.new()
	v.position = Vector3(-15.1, 0, FZ - 0.3)
	add_child(v)
	var holz := Bau.mat(Color(0.7, 0.5, 0.4), "holz", 1.0, 0.012)
	Bau.box(v, Vector3(3.0, 0.9, 0.55), Vector3(0, 0.45, 0), holz, true)
	Bau.box(v, Vector3(3.0, 1.2, 0.02), Vector3(0, 1.5, -0.26), Bau.glas(Color(0.75, 0.85, 1.0, 0.12)))
	Bau.box(v, Vector3(3.0, 1.2, 0.02), Vector3(0, 1.5, 0.27), Bau.mat(Color(0.28, 0.05, 0.07), "", 1.0, 0.0))
	Bau.box(v, Vector3(3.04, 0.1, 0.58), Vector3(0, 2.15, 0), holz)
	Bau.box(v, Vector3(2.9, 0.04, 0.4), Vector3(0, 2.08, 0), Bau.leucht(Color(1.0, 0.92, 0.75), 2.2))
	for seite in [-1, 1]:
		Bau.box(v, Vector3(0.05, 1.3, 0.58), Vector3(1.5 * seite, 1.5, 0), holz)
	Bau.box(v, Vector3(2.9, 0.02, 0.45), Vector3(0, 1.45, 0), Bau.glas(Color(0.8, 0.9, 1.0, 0.25)))
	for i in 5:
		var px := -1.1 + i * 0.55
		var hoch := 0.32 + float(i % 3) * 0.08
		Bau.zylinder(v, 0.06, 0.05, Vector3(px, 0.93, 0.05), m_dunkel)
		Bau.zylinder(v, 0.025, hoch * 0.5, Vector3(px, 0.95 + hoch * 0.25, 0.05), m_gold)
		Bau.zylinder(v, 0.09, hoch * 0.45, Vector3(px, 0.95 + hoch * 0.72, 0.05), m_gold, Vector3.ZERO, false, 0.04, 12)
		for seite in [-1, 1]:
			Bau.torus(v, 0.03, 0.045, Vector3(px + 0.1 * seite, 0.95 + hoch * 0.75, 0.05), m_gold, Vector3(0, 0, PI / 2))
	Bau.kugel(v, 0.11, Vector3(-0.3, 1.58, 0.05), m_gold)
	Bau.box(v, Vector3(0.7, 0.45, 0.02), Vector3(0.7, 1.75, 0.24), Bau.mat(Color(0.75, 0.7, 0.6), "", 1.0, 0.0))
	Bau.schild(v, "LINCOLN LIONS\nSTATE CHAMPIONS 1987", Vector3(0, 2.32, -0.3), 20, Color(0.95, 0.8, 0.35), PI, 4)
	var licht := OmniLight3D.new()
	licht.position = Vector3(0, 1.9, -0.6)
	licht.light_color = Color(1.0, 0.85, 0.6)
	licht.light_energy = 0.9
	licht.omni_range = 3.0
	v.add_child(licht)
	_form(-15.1, FZ - 0.3, 3.0, 0.55, Color(0.55, 0.38, 0.25))
	# Spruchband quer über den Flur
	var banner := Bau.mat(Color(0.5, 0.08, 0.1), "", 1.0, 0.0)
	Bau.box(self, Vector3(4.0, 0.55, 0.02), Vector3(-6.0, 2.9, 0), banner)
	Bau.schild(self, "GO  LIONS!", Vector3(-6.0, 2.9, 0.015), 70, Color(0.98, 0.8, 0.25), 0.0, 6)
	Bau.schild(self, "GO  LIONS!", Vector3(-6.0, 2.9, -0.015), 70, Color(0.98, 0.8, 0.25), PI, 6)
	for seite in [-1, 1]:
		Bau.zylinder(self, 0.005, 0.45, Vector3(-6.0 + 1.95 * seite, 3.27, 0), m_dunkel)
	# Plakate über den Spinden (Südwand)
	_plakat(Vector3(-11.5, 2.65, FZ - 0.02), PI, "SPRING DANCE\n14. Mai · Turnhalle", Color(0.85, 0.3, 0.55))
	_plakat(Vector3(-4.0, 2.65, FZ - 0.02), PI, "WÄHLT EUREN\nSCHÜLERSPRECHER!", Color(0.2, 0.45, 0.8))
	_plakat(Vector3(3.5, 2.65, FZ - 0.02), PI, "5 SICHERHEITSREGELN\nFreischalten · Sichern\nPrüfen · Erden · Abdecken", Color(0.95, 0.75, 0.1))
	_plakat(Vector3(7.5, 2.65, FZ - 0.02), PI, "MATHE-AG\nMo 14 Uhr · R 108", Color(0.3, 0.65, 0.35))
	# Schwarzes Brett
	Bau.box(self, Vector3(1.6, 1.0, 0.04), Vector3(10.4, 1.5, FZ - 0.03), Bau.mat(Color(1, 1, 1), "kork", 1.5, 0.0))
	Bau.box(self, Vector3(1.7, 1.1, 0.03), Vector3(10.4, 1.5, FZ - 0.015), holz)
	var rng := RandomNumberGenerator.new()
	rng.seed = 77
	for i in 7:
		var z := Bau.box(self, Vector3(0.24, 0.3, 0.005), Vector3(9.8 + (i % 4) * 0.38, 1.25 + (i / 4) * 0.42 + rng.randf_range(-0.05, 0.05), FZ - 0.055),
			Bau.mat([Color(0.97, 0.96, 0.9), Color(0.95, 0.9, 0.35), Color(0.7, 0.85, 1.0)][i % 3], "", 1.0, 0.0))
		z.rotation.z = rng.randf_range(-0.12, 0.12)
	Bau.schild(self, "SCHWARZES BRETT", Vector3(10.4, 2.12, FZ - 0.05), 20, Color(0.95, 0.95, 0.9), PI, 4)
	# Trinkbrunnen
	Bau.box(self, Vector3(0.5, 0.35, 0.4), Vector3(12.6, 0.85, FZ - 0.2), m_stahl)
	Bau.box(self, Vector3(0.4, 0.05, 0.3), Vector3(12.6, 1.03, FZ - 0.22), Bau.mat(Color(0.6, 0.62, 0.65), "metall", 1.0, 0.0, false, 0.2))
	Bau.zylinder(self, 0.05, 0.68, Vector3(12.6, 0.34, FZ - 0.12), m_stahl)
	_form(12.6, FZ - 0.2, 0.5, 0.4, Color(0.7, 0.7, 0.72))
	# Wanduhr über dem Sekretariat
	Bau.zylinder(self, 0.2, 0.05, Vector3(-6.8, 2.85, FZ - 0.03), Bau.mat(Color(0.95, 0.95, 0.92)), Vector3(PI / 2, 0, 0))
	Bau.torus(self, 0.19, 0.22, Vector3(-6.8, 2.85, FZ - 0.04), m_dunkel, Vector3(PI / 2, 0, 0))
	var zeiger := Bau.box(self, Vector3(0.015, 0.14, 0.01), Vector3(-6.8, 2.9, FZ - 0.07), m_dunkel)
	zeiger.rotation.z = 0.6
	# Feuerlöscher und Mülleimer
	var rot := Bau.mat(Color(0.8, 0.08, 0.06), "", 1.0, 0.012, false, 0.35)
	Bau.zylinder(self, 0.1, 0.55, Vector3(FX0 + 0.25, 0.85, 2.3), rot)
	Bau.box(self, Vector3(0.05, 0.4, 0.3), Vector3(FX0 + 0.03, 1.45, 2.3), Bau.leucht(Color(0.9, 0.1, 0.08), 1.0))
	Bau.zylinder(self, 0.24, 0.7, Vector3(7.45, 0.35, -FZ + 0.75), Bau.mat(Color(0.25, 0.4, 0.3), "metall", 1.0, 0.01), Vector3.ZERO, true, 0.27)
	_form(7.45, -FZ + 0.75, 0.5, 0.5, Color(0.3, 0.45, 0.35))
	# Bank unter dem Infoscreen
	Bau.box(self, Vector3(2.0, 0.08, 0.45), Vector3(9.2, 0.45, -FZ + 0.35), m_holz)
	for dx in [-0.85, 0.85]:
		Bau.box(self, Vector3(0.06, 0.45, 0.4), Vector3(9.2 + dx, 0.22, -FZ + 0.35), m_dunkel)
	Bau.kollisionsbox(self, Vector3(2.0, 0.5, 0.45), Vector3(9.2, 0.25, -FZ + 0.35))
	_form(9.2, -FZ + 0.35, 2.0, 0.45, Color(0.55, 0.38, 0.25))
	# Putzwagen von Kowalski
	var wagen := Node3D.new()
	wagen.position = Vector3(-3.6, 0, 1.55)
	wagen.rotation.y = 0.3
	add_child(wagen)
	var gelb := Bau.mat(Color(0.95, 0.75, 0.1), "", 1.0, 0.01, false, 0.4)
	Bau.box(wagen, Vector3(0.9, 0.5, 0.5), Vector3(0, 0.35, 0), gelb)
	Bau.zylinder(wagen, 0.2, 0.35, Vector3(0.25, 0.75, 0), Bau.mat(Color(0.2, 0.35, 0.75), "", 1.0, 0.01))
	Bau.zylinder(wagen, 0.17, 0.02, Vector3(0.25, 0.92, 0), Bau.mat(Color(0.35, 0.45, 0.4), "", 1.0, 0.0, false, 0.1))
	Bau.zylinder(wagen, 0.015, 1.4, Vector3(-0.25, 0.95, 0.1), Bau.mat(Color(0.7, 0.7, 0.72)), Vector3(0.12, 0, -0.1))
	Bau.box(wagen, Vector3(0.3, 0.45, 0.35), Vector3(-0.25, 0.85, -0.05), Bau.mat(Color(0.1, 0.1, 0.1), "", 1.0, 0.0, false, 0.3))
	for dx in [-0.35, 0.35]:
		for dz in [-0.2, 0.2]:
			Bau.zylinder(wagen, 0.05, 0.04, Vector3(dx, 0.05, dz), m_dunkel, Vector3(0, 0, PI / 2))
	Bau.kollisionsbox(wagen, Vector3(0.95, 1.0, 0.55), Vector3(0, 0.5, 0))
	_form(-3.6, 1.55, 0.95, 0.55, Color(0.9, 0.75, 0.15))
	# Rutschgefahr-Schild
	_warnschild(Vector3(-4.6, 0, 0.6), 0.4)
	stationen["kowalski"] = Interaktiv.neu(self, "kowalski", kowalski_pos, "Mit Hausmeister Kowalski sprechen", 2.4)
	# Stromkreis-Kabelpritsche unter der Decke an der Nordwand (Motor- und Datenleitung)
	Bau.box(self, Vector3(FX1 - FX0, 0.05, 0.3), Vector3((FX0 + FX1) * 0.5, 3.32, -FZ + 0.18), m_metall)
	Bau.zylinder(self, 0.025, FX1 - FX0, Vector3((FX0 + FX1) * 0.5, 3.37, -FZ + 0.12), Bau.mat(Color(0.08, 0.08, 0.08)), Vector3(0, 0, PI / 2))
	_datenleitung = Node3D.new()
	_datenleitung.set_meta("dynamisch", true)
	_datenleitung.position = Vector3((FX0 + FX1) * 0.5, 3.36, -FZ + 0.2)
	add_child(_datenleitung)
	Bau.zylinder(_datenleitung, 0.012, FX1 - FX0, Vector3.ZERO, Bau.mat(Color(0.2, 0.45, 0.85)), Vector3(0, 0, PI / 2))


func _plakat(pos: Vector3, rot_y: float, text: String, farbe: Color) -> void:
	Bau.box(self, Vector3(1.2, 0.8, 0.01), pos, Bau.mat(farbe, "", 1.0, 0.0), false, rot_y)
	var richtung := Vector3(sin(rot_y), 0, cos(rot_y))
	Bau.schild(self, text, pos + richtung * 0.012, 20, Color(0.06, 0.05, 0.05) if farbe.v > 0.8 else Color(0.98, 0.97, 0.92), rot_y)


func _warnschild(pos: Vector3, rot_y: float) -> void:
	var s := Node3D.new()
	s.position = pos
	s.rotation.y = rot_y
	add_child(s)
	var gelb := Bau.mat(Color(0.98, 0.8, 0.05), "", 1.0, 0.01, false, 0.4)
	for seite in [-1, 1]:
		var platte := Bau.box(s, Vector3(0.32, 0.62, 0.015), Vector3(0, 0.3, 0.1 * seite), gelb)
		platte.rotation.x = 0.3 * seite
		Bau.schild(s, "⚠\nVORSICHT\nRUTSCHGEFAHR", Vector3(0, 0.32, 0.12 * seite), 14, Color(0.05, 0.05, 0.05), 0.0 if seite > 0 else PI)
	_form(pos.x, pos.z, 0.3, 0.3, Color(0.95, 0.8, 0.1))


## Nachthimmel hinter den Fenstern (Bild mit Sternen, Bäumen und Häusern)
func _nachthimmel(pos: Vector3, groesse: Vector2, rot_y: float) -> void:
	var mi := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = groesse
	mi.mesh = q
	var m := StandardMaterial3D.new()
	m.albedo_texture = _himmel_tex()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.uv1_scale = Vector3(maxf(1.0, groesse.x / 8.0), 1, 1)
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	mi.material_override = m
	mi.position = pos
	mi.rotation.y = rot_y
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)


static var _himmel: ImageTexture

static func _himmel_tex() -> ImageTexture:
	if _himmel:
		return _himmel
	var b := 512
	var h := 128
	var img := Image.create(b, h, false, Image.FORMAT_RGB8)
	var rng := RandomNumberGenerator.new()
	rng.seed = 88
	for y in h:
		var t := float(y) / h
		var c := Color(0.02, 0.03, 0.09).lerp(Color(0.1, 0.12, 0.24), t)
		for x in b:
			img.set_pixel(x, y, c)
	for i in 140:
		var x := rng.randi_range(0, b - 1)
		var y := rng.randi_range(0, int(h * 0.55))
		var hell := rng.randf_range(0.4, 1.0)
		img.set_pixel(x, y, Color(hell, hell, hell * 0.95))
	# Mond
	for y in range(8, 34):
		for x in range(400, 430):
			var d := Vector2(x - 415, y - 21).length()
			if d < 11.0:
				img.set_pixel(x, y, Color(0.95, 0.93, 0.82))
			elif d < 15.0:
				img.set_pixel(x, y, img.get_pixel(x, y).lerp(Color(0.5, 0.55, 0.7), (15.0 - d) / 8.0))
	# Häuser und Bäume als Schattenriss
	var x0 := 0
	while x0 < b:
		var breite := rng.randi_range(30, 70)
		var hoehe := rng.randi_range(18, 40)
		var baum := rng.randf() < 0.45
		for x in range(x0, mini(b, x0 + breite)):
			var hx := hoehe
			if baum:
				var u := float(x - x0) / breite
				hx = int(hoehe * (0.6 + 0.4 * sin(u * PI)) + rng.randi_range(-2, 2))
			for y in range(h - hx, h):
				img.set_pixel(x, y, Color(0.015, 0.02, 0.035))
		if not baum:
			for f in rng.randi_range(0, 3):
				var fx := x0 + rng.randi_range(4, maxi(5, breite - 8))
				var fy := h - hoehe + rng.randi_range(5, maxi(6, hoehe - 8))
				for yy in range(fy, mini(h, fy + 4)):
					for xx in range(fx, mini(b, fx + 5)):
						img.set_pixel(xx, yy, Color(0.95, 0.75, 0.35))
		x0 += breite
	# Straßenlaternen
	for lx in [90, 300, 470]:
		for y in range(h - 60, h):
			for x in range(lx - 20, lx + 20):
				var d := Vector2(x - lx, y - (h - 52)).length()
				if d < 20.0:
					img.set_pixel(x, y, img.get_pixel(x, y).lerp(Color(1.0, 0.7, 0.3), clampf(1.0 - d / 20.0, 0, 1) * 0.6))
	img.generate_mipmaps()
	_himmel = ImageTexture.create_from_image(img)
	return _himmel


# ---------------------------------------------------------------- Auftrag 5: Unterverteilung und Snackautomat

func _unterverteilung() -> void:
	var x := -1.0
	var z := FZ - 0.11
	var grau := Bau.mat(Color(0.82, 0.83, 0.8), "metall", 1.0, 0.012)
	Bau.box(self, Vector3(0.8, 1.1, 0.2), Vector3(x, 1.35, z), grau)
	var innen := Bau.mat(Color(0.9, 0.9, 0.88), "", 1.0, 0.0)
	Bau.box(self, Vector3(0.74, 1.04, 0.01), Vector3(x, 1.35, z - 0.08), innen)
	for reihe in 2:
		var y := 1.15 + reihe * 0.4
		Bau.box(self, Vector3(0.66, 0.03, 0.02), Vector3(x, y, z - 0.1), m_metall)
		for i in 6:
			Bau.box(self, Vector3(0.08, 0.16, 0.08), Vector3(x - 0.25 + i * 0.1, y, z - 0.13), Bau.mat(Color(0.95, 0.95, 0.93), "", 1.0, 0.006))
			Bau.box(self, Vector3(0.02, 0.05, 0.02), Vector3(x - 0.25 + i * 0.1, y + 0.02, z - 0.17), Bau.mat(Color(0.15, 0.15, 0.15)))
	# Tür (Scharnier rechts von vorne gesehen)
	_uv_tuer = Node3D.new()
	_uv_tuer.set_meta("dynamisch", true)
	_uv_tuer.position = Vector3(x - 0.4, 1.35, z - 0.105)
	add_child(_uv_tuer)
	Bau.box(_uv_tuer, Vector3(0.8, 1.1, 0.02), Vector3(0.4, 0, 0), grau)
	Bau.box(_uv_tuer, Vector3(0.22, 0.2, 0.01), Vector3(0.4, 0.3, -0.012), Bau.mat(Color(1.0, 0.82, 0.0)))
	Bau.schild(_uv_tuer, "⚡", Vector3(0.4, 0.3, -0.018), 46, Color.BLACK, PI)
	Bau.schild(_uv_tuer, "UV-EG", Vector3(0.4, 0.05, -0.012), 26, Color(0.1, 0.1, 0.1), PI)
	Bau.box(_uv_tuer, Vector3(0.03, 0.12, 0.03), Vector3(0.72, -0.1, -0.02), m_dunkel)
	# Lieferschein (nur nach dem Auftrag sichtbar)
	_lieferschein = Node3D.new()
	_lieferschein.set_meta("dynamisch", true)
	_lieferschein.position = Vector3(x + 0.12, 0.92, z - 0.16)
	_lieferschein.visible = false
	add_child(_lieferschein)
	var papier := Bau.box(_lieferschein, Vector3(0.21, 0.28, 0.004), Vector3.ZERO, Bau.mat(Color(0.97, 0.96, 0.9), "", 1.0, 0.0))
	papier.rotation.z = 0.15
	Bau.schild(_lieferschein, "STERLING BAU\nLieferschein\nJ-Y(ST)Y 2×2×0,8", Vector3(0, 0.03, -0.004), 9, Color(0.1, 0.1, 0.15), PI).rotation.z = -0.15
	Bau.kugel(_lieferschein, 0.02, Vector3(0.05, -0.09, -0.004), Bau.mat(Color(0.05, 0.02, 0.03)), Vector3(1, 1, 0.2))
	# Fernmeldeleitung (warm) von der Verteilung zum Automaten
	_fernmeldeleitung = Node3D.new()
	_fernmeldeleitung.set_meta("dynamisch", true)
	add_child(_fernmeldeleitung)
	_heisse_leitung = StandardMaterial3D.new()
	_heisse_leitung.albedo_color = Color(0.55, 0.55, 0.55)
	_heisse_leitung.emission_enabled = true
	_heisse_leitung.emission = Color(1.0, 0.35, 0.05)
	_heisse_leitung.emission_energy_multiplier = 0.4
	Bau.zylinder(_fernmeldeleitung, 0.007, 0.5, Vector3(x + 0.2, 0.55, FZ - 0.03), _heisse_leitung)
	Bau.zylinder(_fernmeldeleitung, 0.007, 0.65, Vector3(x + 0.52, 0.3, FZ - 0.03), _heisse_leitung, Vector3(0, 0, PI / 2))
	# Neue Leitung NYM im Kabelkanal (nach der Reparatur)
	_nym_kanal = Node3D.new()
	_nym_kanal.set_meta("dynamisch", true)
	_nym_kanal.visible = false
	add_child(_nym_kanal)
	Bau.box(_nym_kanal, Vector3(0.06, 0.55, 0.04), Vector3(x + 0.2, 0.55, FZ - 0.03), m_weiss)
	Bau.box(_nym_kanal, Vector3(0.65, 0.06, 0.04), Vector3(x + 0.52, 0.28, FZ - 0.03), m_weiss)
	Bau.schild(self, "UNTERVERTEILUNG EG", Vector3(x, 2.05, FZ - 0.02), 18, Color(0.95, 0.95, 0.9), PI, 4)
	_form(x, z, 0.8, 0.2, Color(0.8, 0.8, 0.78))
	stationen["unterverteilung"] = Interaktiv.neu(self, "unterverteilung", Vector3(x, 0, FZ - 1.0), "Unterverteilung UV-EG öffnen", 1.7)

	# Snackautomat
	var a := Node3D.new()
	a.position = Vector3(0.35, 0, FZ - 0.45)
	add_child(a)
	var gehaeuse := Bau.mat(Color(0.12, 0.25, 0.55), "metall", 1.0, 0.012, false, 0.4)
	Bau.box(a, Vector3(1.0, 1.9, 0.8), Vector3(0, 0.95, 0), gehaeuse, true)
	_automat_licht = Bau.leucht(Color(0.95, 0.95, 0.85), 1.6)
	Bau.box(a, Vector3(0.66, 1.3, 0.01), Vector3(-0.1, 1.1, -0.39), _automat_licht).set_meta("dynamisch", true)
	var farben := [Color(0.9, 0.2, 0.15), Color(0.95, 0.75, 0.1), Color(0.2, 0.6, 0.25), Color(0.6, 0.25, 0.7), Color(0.95, 0.5, 0.1)]
	for reihe in 5:
		Bau.box(a, Vector3(0.66, 0.015, 0.2), Vector3(-0.1, 0.55 + reihe * 0.24, -0.33), m_metall)
		for i in 5:
			Bau.box(a, Vector3(0.09, 0.14, 0.05), Vector3(-0.36 + i * 0.13, 0.63 + reihe * 0.24, -0.36), Bau.mat(farben[(i + reihe) % farben.size()], "", 1.0, 0.0))
	Bau.box(a, Vector3(0.72, 1.38, 0.01), Vector3(-0.1, 1.1, -0.405), Bau.glas(Color(0.7, 0.8, 0.95, 0.15)))
	Bau.box(a, Vector3(0.18, 0.5, 0.02), Vector3(0.36, 1.3, -0.4), Bau.mat(Color(0.15, 0.15, 0.17), "", 1.0, 0.0))
	Bau.box(a, Vector3(0.6, 0.18, 0.02), Vector3(-0.1, 0.25, -0.4), Bau.mat(Color(0.05, 0.05, 0.06), "", 1.0, 0.0))
	Bau.schild(a, "SNACKS", Vector3(-0.1, 1.82, -0.41), 34, Color(0.98, 0.85, 0.3), PI, 5)
	_automat_omni = OmniLight3D.new()
	_automat_omni.position = Vector3(0, 1.2, -0.9)
	_automat_omni.light_color = Color(0.85, 0.9, 1.0)
	_automat_omni.light_energy = 0.8
	_automat_omni.omni_range = 3.0
	a.add_child(_automat_omni)
	_form(0.35, FZ - 0.45, 1.0, 0.8, Color(0.2, 0.35, 0.65))


func uv_oeffnen(offen: bool) -> void:
	var t := create_tween()
	t.tween_property(_uv_tuer, "rotation:y", 1.9 if offen else 0.0, 0.9).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func lieferschein_zeigen(an: bool) -> void:
	_lieferschein.visible = an


func leitung_reparieren() -> void:
	leitung_ok = true
	_fernmeldeleitung.visible = false
	_nym_kanal.visible = true
	_automat_licht.emission_energy_multiplier = 1.6
	_automat_omni.visible = true


# ---------------------------------------------------------------- Auftrag 6: Infoscreen und Access Point

func _infoscreen() -> void:
	var x := 9.0
	var z := -FZ + 0.05
	Bau.box(self, Vector3(1.8, 1.08, 0.08), Vector3(x, 1.75, z), m_dunkel)
	_schirm_mat = StandardMaterial3D.new()
	_schirm_mat.albedo_texture = _bildsalat_tex()
	_schirm_mat.emission_enabled = true
	_schirm_mat.emission_texture = _schirm_mat.albedo_texture
	_schirm_mat.emission_energy_multiplier = 1.4
	_schirm_mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	_schirm_mat.uv1_scale = Vector3(0.5, 0.5, 1)
	var schirm := Bau.box(self, Vector3(1.66, 0.94, 0.01), Vector3(x, 1.75, z + 0.045), _schirm_mat)
	schirm.set_meta("dynamisch", true)
	_schirm_text = Bau.schild(self, "VERTRETUNGSPLAN\n\nMT10   1.–2. Std.  ET  →  R 104\nMT10   3.–4. Std.  LtK  →  R 106\nMT11   5. Std.  entfällt\n\nGO LIONS!", Vector3(x, 1.75, z + 0.055), 22, Color(0.9, 0.95, 1.0))
	_schirm_text.visible = false
	Bau.schild(self, "INFOSCREEN", Vector3(x, 2.4, z + 0.04), 18, Color(0.9, 0.9, 0.9), 0.0, 4)
	# Access Point an der Decke
	Bau.zylinder(self, 0.13, 0.04, Vector3(x + 0.6, FH - 0.02, -1.0), m_weiss)
	_ap_led = Bau.leucht(Color(1.0, 0.5, 0.05), 2.0)
	Bau.zylinder(self, 0.015, 0.01, Vector3(x + 0.6, FH - 0.045, -1.0), _ap_led).set_meta("dynamisch", true)
	# verschobene Deckenplatte – darüber der fremde Router
	_deckenplatte = Node3D.new()
	_deckenplatte.set_meta("dynamisch", true)
	_deckenplatte.position = Vector3(x + 1.2, FH - 0.02, 0.4)
	_deckenplatte.rotation = Vector3(0.08, 0.1, 0.0)
	add_child(_deckenplatte)
	Bau.box(_deckenplatte, Vector3(0.6, 0.03, 0.6), Vector3.ZERO, Bau.mat(Color(1, 1, 1), "deckenplatten", 0.83, 0.0, false))
	Bau.box(self, Vector3(0.62, 0.02, 0.62), Vector3(x + 1.2, FH + 0.12, 0.4), Bau.mat(Color(0.02, 0.02, 0.02), "", 1.0, 0.0, false))
	_router = Node3D.new()
	_router.set_meta("dynamisch", true)
	_router.position = Vector3(x + 1.2, FH + 0.05, 0.4)
	add_child(_router)
	Bau.box(_router, Vector3(0.22, 0.05, 0.15), Vector3.ZERO, Bau.mat(Color(0.06, 0.06, 0.07)))
	for seite in [-1, 1]:
		var antenne := Bau.zylinder(_router, 0.006, 0.18, Vector3(0.09 * seite, -0.09, 0.06), Bau.mat(Color(0.06, 0.06, 0.07)))
		antenne.rotation.z = 0.25 * seite
	_router_led = Bau.leucht(Color(1.0, 0.1, 0.1), 3.0)
	Bau.box(_router, Vector3(0.02, 0.01, 0.01), Vector3(0.05, -0.02, -0.077), _router_led)
	for i in 5:
		var w := i * TAU / 5.0
		Bau.kugel(_router, 0.012, Vector3(-0.05 + cos(w) * 0.012, 0.0 + sin(w) * 0.012, -0.077), Bau.mat(Color(0.05, 0.02, 0.03)), Vector3(1, 1, 0.3))
	stationen["infoscreen"] = Interaktiv.neu(self, "infoscreen", Vector3(x, 0, -FZ + 1.2), "Infoscreen untersuchen", 1.8)


static func _bildsalat_tex() -> ImageTexture:
	var img := Image.create(64, 36, false, Image.FORMAT_RGB8)
	var rng := RandomNumberGenerator.new()
	rng.seed = 3
	for y in 36:
		var zeile := Color(rng.randf(), rng.randf(), rng.randf()) * 0.6
		for x in 64:
			var c := zeile if rng.randf() < 0.6 else Color(rng.randf(), rng.randf(), rng.randf())
			if (y / 3) % 4 == 0:
				c = c.darkened(0.6)
			img.set_pixel(x, y, c)
	return ImageTexture.create_from_image(img)


## Router sichtbar unter die Decke holen (Fundszene) bzw. entfernen
func router_zeigen(an: bool) -> void:
	_router.visible = an
	var t := create_tween()
	if an:
		t.tween_property(_router, "position:y", FH - 0.16, 1.0).set_trans(Tween.TRANS_SINE)
	else:
		_router.position.y = FH + 0.05


func funk_reparieren() -> void:
	funk_ok = true
	_schirm_mat.albedo_texture = null
	_schirm_mat.emission_texture = null
	_schirm_mat.albedo_color = Color(0.06, 0.12, 0.35)
	_schirm_mat.emission = Color(0.06, 0.12, 0.35)
	_schirm_mat.emission_energy_multiplier = 1.0
	_schirm_mat.uv1_offset = Vector3.ZERO
	_schirm_text.visible = true
	_ap_led.albedo_color = Color(0.2, 0.55, 1.0)
	_ap_led.emission = Color(0.2, 0.55, 1.0)
	_ap_led.emission_energy_multiplier = 2.0
	# Datenleitung in eigene, geschirmte Trasse verlegt
	_datenleitung.position.y = 3.15


func funk_abschliessen() -> void:
	_router.visible = false
	_deckenplatte.rotation = Vector3.ZERO
	_deckenplatte.position.y = FH + 0.005


# ---------------------------------------------------------------- Cafeteria

func _cafeteria_raum() -> void:
	var breite := CX1 - FX1
	var mx := (FX1 + CX1) * 0.5
	Bau.box(self, Vector3(breite, 0.2, CZ * 2 + 0.6), Vector3(mx, -0.1, 0), Bau.mat(Color(1, 1, 1), "fliesen_rot", 0.555, 0.0, false, 0.3), true)
	Bau.box(self, Vector3(breite, 0.12, CZ * 2), Vector3(mx, CH + 0.06, 0), Bau.mat(Color(1, 1, 1), "deckenplatten", 0.83, 0.0, false))
	var putz := Bau.mat(Color(1, 1, 1), "putz", 0.5, 0.0, false)
	var kacheln := Bau.mat(Color(1, 1, 1), "wandfliesen", 1.6, 0.0, false, 0.25)
	# Westwand mit Durchgang zum Flur
	for seite in [-1, 1]:
		var tiefe := CZ - DURCHGANG
		var z: float = seite * (DURCHGANG + tiefe * 0.5)
		Bau.box(self, Vector3(0.3, CH, tiefe), Vector3(FX1 + 0.15, CH * 0.5, z), putz, true)
		Bau.box(self, Vector3(0.04, 1.3, tiefe), Vector3(FX1 + 0.32, 0.65, z), kacheln)
	Bau.box(self, Vector3(0.3, CH - 2.7, DURCHGANG * 2), Vector3(FX1 + 0.15, (CH + 2.7) * 0.5, 0), putz)
	Bau.box(self, Vector3(0.34, 0.12, DURCHGANG * 2 + 0.2), Vector3(FX1 + 0.15, 2.66, 0), m_dunkel)
	# Nordwand (mit Durchbruch für Band 1)
	Bau.box(self, Vector3(breite, CH, 0.3), Vector3(mx, CH * 0.5, -CZ - 0.15), putz, true)
	Bau.box(self, Vector3(breite, 1.3, 0.04), Vector3(mx, 0.65, -CZ + 0.02), kacheln)
	# Ostwand (Küche)
	Bau.box(self, Vector3(0.3, CH, CZ * 2), Vector3(CX1 + 0.15, CH * 0.5, 0), putz, true)
	Bau.box(self, Vector3(0.04, 2.0, CZ * 2), Vector3(CX1 - 0.02, 1.0, 0), Bau.mat(Color(0.95, 0.95, 0.93), "wandfliesen", 2.5, 0.0, false, 0.2))
	# Südwand mit großen Fenstern
	var rahmen := Bau.mat(Color(0.2, 0.22, 0.25), "", 1.0, 0.01)
	var glas := Bau.glas(Color(0.55, 0.65, 0.85, 0.14))
	Bau.box(self, Vector3(breite, 1.1, 0.3), Vector3(mx, 0.55, CZ + 0.15), putz, true)
	Bau.box(self, Vector3(breite, 1.1, 0.04), Vector3(mx, 0.55, CZ - 0.02), kacheln)
	Bau.box(self, Vector3(breite, CH - 3.9, 0.3), Vector3(mx, (CH + 3.9) * 0.5, CZ + 0.15), putz)
	var fenster := [[FX1, 21.0, false], [21.0, 24.4, true], [24.4, 25.0, false], [25.0, 28.4, true], [28.4, 29.0, false], [29.0, 32.4, true], [32.4, CX1, false]]
	for f in fenster:
		var a: float = f[0]
		var b: float = f[1]
		var m := (a + b) * 0.5
		if f[2]:
			Bau.box(self, Vector3(b - a, 2.8, 0.02), Vector3(m, 2.5, CZ + 0.1), glas)
			Bau.box(self, Vector3(0.06, 2.8, 0.08), Vector3(m, 2.5, CZ + 0.1), rahmen)
			Bau.box(self, Vector3(b - a, 0.06, 0.08), Vector3(m, 2.6, CZ + 0.1), rahmen)
			Bau.box(self, Vector3(b - a, 0.06, 0.36), Vector3(m, 1.12, CZ + 0.05), rahmen)
		else:
			Bau.box(self, Vector3(b - a, 2.8, 0.3), Vector3(m, 2.5, CZ + 0.15), putz)
	Bau.kollisionsbox(self, Vector3(breite, CH, 0.3), Vector3(mx, CH * 0.5, CZ + 0.15))
	_nachthimmel(Vector3(26.7, 2.5, CZ + 0.8), Vector2(13.0, 3.2), PI)
	# Spruchband und Wimpelkette
	var rot := Bau.mat(Color(0.5, 0.08, 0.1), "", 1.0, 0.0)
	Bau.box(self, Vector3(0.04, 0.8, 6.0), Vector3(FX1 + 0.33, 3.5, -5.0), rot)
	Bau.schild(self, "LIONS\nCAFETERIA", Vector3(FX1 + 0.36, 3.5, -5.0), 56, Color(0.98, 0.82, 0.3), PI / 2, 6)
	var wimpel := [Bau.mat(Color(0.55, 0.08, 0.1), "", 1.0, 0.0), Bau.mat(Color(0.9, 0.7, 0.2), "", 1.0, 0.0)]
	for reihe in [-2.0, 4.5]:
		Bau.zylinder(self, 0.004, breite - 2.0, Vector3(mx - 1.0, CH - 0.5, reihe), m_dunkel, Vector3(0, 0, PI / 2))
		var x := FX1 + 0.6
		var i := 0
		while x < CX1 - 3.0:
			var w := Bau.box(self, Vector3(0.22, 0.3, 0.01), Vector3(x, CH - 0.68, reihe), wimpel[i % 2])
			w.rotation.z = PI / 4
			x += 0.5
			i += 1
	# Wanduhr
	Bau.zylinder(self, 0.3, 0.06, Vector3(FX1 + 0.32, 3.4, 4.0), Bau.mat(Color(0.95, 0.95, 0.92)), Vector3(0, 0, PI / 2))
	Bau.torus(self, 0.29, 0.33, Vector3(FX1 + 0.33, 3.4, 4.0), m_dunkel, Vector3(0, 0, PI / 2))
	# Wandstücke für die Minimap
	_form(FX1 + 0.15, -(DURCHGANG + CZ) * 0.5, 0.3, CZ - DURCHGANG, Color(0.85, 0.85, 0.8))
	_form(FX1 + 0.15, (DURCHGANG + CZ) * 0.5, 0.3, CZ - DURCHGANG, Color(0.85, 0.85, 0.8))


func _essensausgabe() -> void:
	var x := 30.6
	var z0 := -5.6
	var z1 := 5.4
	var laenge := z1 - z0
	var mz := (z0 + z1) * 0.5
	var front := Bau.mat(Color(0.55, 0.1, 0.12), "metall", 1.0, 0.012, false, 0.5)
	Bau.box(self, Vector3(0.8, 0.95, laenge), Vector3(x, 0.475, mz), front, true)
	Bau.box(self, Vector3(0.9, 0.05, laenge + 0.1), Vector3(x, 0.97, mz), m_stahl)
	# Tablettschiene vorne
	Bau.box(self, Vector3(0.35, 0.04, laenge), Vector3(x - 0.6, 0.85, mz), m_stahl)
	for z in [z0 + 0.3, mz, z1 - 0.3]:
		Bau.box(self, Vector3(0.04, 0.3, 0.04), Vector3(x - 0.7, 0.7, z), m_stahl)
	# Spuckschutz aus Glas und warme Wärmelampen
	Bau.box(self, Vector3(0.02, 0.45, laenge - 0.4), Vector3(x - 0.15, 1.45, mz), Bau.glas(Color(0.8, 0.9, 1.0, 0.18)))
	Bau.box(self, Vector3(0.4, 0.04, laenge - 0.4), Vector3(x, 1.7, mz), m_stahl)
	Bau.box(self, Vector3(0.3, 0.02, laenge - 0.6), Vector3(x, 1.67, mz), Bau.leucht(Color(1.0, 0.55, 0.25), 2.0))
	for z in [z0 + 0.3, z1 - 0.3]:
		Bau.zylinder(self, 0.02, 0.72, Vector3(x, 1.33, z), m_stahl)
	# Speisen in Wannen
	var essen := [Color(0.9, 0.7, 0.2), Color(0.75, 0.25, 0.1), Color(0.45, 0.6, 0.2), Color(0.4, 0.22, 0.1), Color(0.95, 0.9, 0.75)]
	for i in 8:
		var z := z0 + 0.8 + i * 1.25
		Bau.box(self, Vector3(0.5, 0.06, 0.55), Vector3(x + 0.05, 1.0, z), m_stahl)
		Bau.box(self, Vector3(0.44, 0.04, 0.49), Vector3(x + 0.05, 1.02, z), Bau.mat(essen[i % essen.size()], "", 1.0, 0.0, false, 0.4))
	# Tabletts und Puddingbecher
	for i in 4:
		Bau.box(self, Vector3(0.36, 0.02, 0.46), Vector3(x - 0.6, 0.88 + i * 0.022, z1 - 0.5), Bau.mat(Color(0.75, 0.55, 0.3), "", 1.0, 0.0))
	for i in 6:
		Bau.zylinder(self, 0.04, 0.07, Vector3(x - 0.62 + (i % 3) * 0.1, 1.0, z0 + 0.5 + (i / 3) * 0.1), Bau.mat(Color(0.35, 0.18, 0.08), "", 1.0, 0.0), Vector3.ZERO, false, 0.05, 10)
	Bau.schild(self, "ESSENSAUSGABE", Vector3(x - 0.42, 0.55, mz), 34, Color(0.98, 0.85, 0.35), -PI / 2, 5)
	_form(x, mz, 0.9, laenge, Color(0.6, 0.2, 0.2))
	# Küche: Herd, Töpfe, Regale, Menütafel
	var herd := Bau.mat(Color(0.7, 0.72, 0.75), "metall", 1.0, 0.01, false, 0.3)
	Bau.box(self, Vector3(0.8, 0.9, 3.0), Vector3(CX1 - 0.45, 0.45, -2.0), herd, true)
	Bau.box(self, Vector3(0.8, 0.9, 2.4), Vector3(CX1 - 0.45, 0.45, 3.4), herd, true)
	for z in [-3.0, -1.6]:
		Bau.zylinder(self, 0.24, 0.35, Vector3(CX1 - 0.45, 1.08, z), m_stahl, Vector3.ZERO, false, -1.0, 14)
	Bau.box(self, Vector3(0.4, 0.04, 4.0), Vector3(CX1 - 0.25, 2.1, 0.5), m_stahl)
	for i in 8:
		Bau.zylinder(self, 0.08, 0.16, Vector3(CX1 - 0.25, 2.2, -1.2 + i * 0.45), Bau.mat([Color(0.9, 0.3, 0.1), Color(0.95, 0.85, 0.3), Color(0.3, 0.55, 0.25)][i % 3], "", 1.0, 0.0), Vector3.ZERO, false, -1.0, 10)
	Bau.box(self, Vector3(0.05, 1.3, 2.6), Vector3(CX1 - 0.05, 3.2, 0.5), Bau.mat(Color(0.08, 0.1, 0.08), "beton", 2.0, 0.0))
	Bau.box(self, Vector3(0.04, 1.42, 2.72), Vector3(CX1 - 0.03, 3.2, 0.5), m_holz)
	Bau.schild(self, "HEUTE BEI ROSALITA\n\nPizza Margherita ....... 2,50\nTacos de la Casa ..... 3,00\nSchoko-Pudding* ...... 1,00\n\n* wenn das Band läuft", Vector3(CX1 - 0.09, 3.2, 0.5), 20, Color(0.95, 0.95, 0.9), -PI / 2)
	_form(CX1 - 0.45, -2.0, 0.8, 3.0, Color(0.7, 0.72, 0.75))
	_form(CX1 - 0.45, 3.4, 0.8, 2.4, Color(0.7, 0.72, 0.75))
	# Durchgang in die Küche absperren (die Küche gehört Rosalita)
	Bau.kollisionsbox(self, Vector3(0.3, 1.2, 3.6), Vector3(x, 0.6, 7.2))
	Bau.box(self, Vector3(0.06, 0.95, 3.4), Vector3(x, 0.48, 7.2), Bau.mat(Color(0.75, 0.75, 0.78), "metall", 1.0, 0.0))
	Bau.schild(self, "NUR PERSONAL", Vector3(x - 0.05, 0.75, 7.2), 22, Color(0.15, 0.15, 0.15), -PI / 2)
	_form(x, 7.2, 0.2, 3.4, Color(0.6, 0.6, 0.62))
	Bau.kollisionsbox(self, Vector3(0.3, 1.2, 1.7), Vector3(x, 0.6, -6.4))
	Bau.box(self, Vector3(0.06, 0.95, 1.5), Vector3(x, 0.48, -6.4), Bau.mat(Color(0.75, 0.75, 0.78), "metall", 1.0, 0.0))
	_form(x, -6.4, 0.2, 1.5, Color(0.6, 0.6, 0.62))
	stationen["rosalita"] = Interaktiv.neu(self, "rosalita", Vector3(x - 0.9, 0, rosalita_pos.z), "Mit Rosalita sprechen", 2.0)


func _tische() -> void:
	var platte := Bau.mat(Color(0.9, 0.88, 0.82), "", 1.0, 0.01, false, 0.35)
	var bank := Bau.mat(Color(0.55, 0.1, 0.12), "", 1.0, 0.01, false, 0.4)
	var rng := RandomNumberGenerator.new()
	rng.seed = 21
	for tx in [17.8, 22.0, 26.2]:
		for tz in [-3.8, 3.0, 6.2]:
			var t := Node3D.new()
			t.position = Vector3(tx, 0, tz)
			add_child(t)
			Bau.box(t, Vector3(2.6, 0.05, 0.9), Vector3(0, 0.76, 0), platte)
			for dx in [-1.0, 1.0]:
				Bau.box(t, Vector3(0.06, 0.74, 0.7), Vector3(dx, 0.37, 0), m_dunkel)
			for dz in [-0.72, 0.72]:
				Bau.box(t, Vector3(2.5, 0.05, 0.32), Vector3(0, 0.45, dz), bank)
				for dx in [-1.0, 1.0]:
					Bau.box(t, Vector3(0.05, 0.43, 0.05), Vector3(dx, 0.22, dz), m_dunkel)
			# Tabletts, Becher, Puddingreste
			for i in rng.randi_range(0, 3):
				var p := Vector3(rng.randf_range(-1.0, 1.0), 0.79, rng.randf_range(-0.2, 0.2))
				var tablett := Bau.box(t, Vector3(0.36, 0.02, 0.46), p, Bau.mat(Color(0.75, 0.55, 0.3), "", 1.0, 0.0))
				tablett.rotation.y = rng.randf_range(-0.4, 0.4)
				Bau.zylinder(t, 0.04, 0.1, p + Vector3(0.08, 0.06, 0.1), Bau.mat(Color(0.95, 0.95, 0.95), "", 1.0, 0.0), Vector3.ZERO, false, 0.05, 10)
			Bau.kollisionsbox(t, Vector3(2.6, 0.8, 1.9), Vector3(0, 0.4, 0))
			_form(tx, tz, 2.6, 1.8, Color(0.75, 0.7, 0.62))
	# Mülleimer am Eingang
	for i in 3:
		var farbe: Color = [Color(0.25, 0.4, 0.3), Color(0.2, 0.35, 0.7), Color(0.85, 0.7, 0.1)][i]
		Bau.zylinder(self, 0.24, 0.85, Vector3(15.0, 0.425, -3.4 - i * 0.6), Bau.mat(farbe, "metall", 1.0, 0.01), Vector3.ZERO, true, 0.27)
	_form(15.0, -4.0, 0.5, 1.8, Color(0.4, 0.45, 0.4))


# ---------------------------------------------------------------- Band 1 (Ende) und Übergabe

func _band() -> void:
	var z := -7.6
	var x0 := 18.6
	var x1 := 29.8
	var laenge := x1 - x0
	var mx := (x0 + x1) * 0.5
	var stahl := Bau.mat(Color(0.3, 0.45, 0.65), "metall", 1.0, 0.01)
	for seite in [-1, 1]:
		Bau.box(self, Vector3(laenge, 0.16, 0.06), Vector3(mx, 0.8, z + 0.44 * seite), stahl)
	var bx := x0 + 0.4
	while bx < x1:
		for seite in [-1, 1]:
			Bau.box(self, Vector3(0.07, 0.8, 0.07), Vector3(bx, 0.4, z + 0.42 * seite), stahl)
		bx += 2.2
	_band_mat = StandardMaterial3D.new()
	_band_mat.albedo_texture = _gurt_textur()
	_band_mat.uv1_scale = Vector3(laenge * 1.5, 1, 1)
	_band_mat.roughness = 0.9
	Bau.box(self, Vector3(laenge, 0.04, 0.8), Vector3(mx, 0.87, z), _band_mat).set_meta("dynamisch", true)
	for x in [x0 + 0.1, x1 - 0.2]:
		var rolle := Bau.zylinder(self, 0.07, 0.82, Vector3(x, 0.84, z), m_metall, Vector3(PI / 2, 0, 0))
		rolle.set_meta("dynamisch", true)
		_rollen.append(rolle)
	Bau.kollisionsbox(self, Vector3(laenge, 1.0, 0.95), Vector3(mx, 0.5, z))
	_form(mx, z, laenge, 0.9, Color(0.35, 0.5, 0.7))
	# Schacht aus dem Keller
	var schacht := Bau.mat(Color(0.95, 0.55, 0.1), "metall", 1.0, 0.015)
	Bau.box(self, Vector3(1.2, 2.4, 1.3), Vector3(x0 - 0.5, 1.2, z), schacht, true)
	Bau.box(self, Vector3(0.02, 0.7, 0.9), Vector3(x0 + 0.11, 1.15, z), Bau.mat(Color(0.02, 0.02, 0.02), "", 1.0, 0.0, false))
	for i in 5:
		Bau.box(self, Vector3(0.02, 0.6, 0.16), Vector3(x0 + 0.13, 1.15, z - 0.36 + i * 0.18), Bau.mat(Color(0.1, 0.1, 0.1), "", 1.0, 0.0))
	Bau.schild(self, "BAND 1  ·  AUS DEM KELLER", Vector3(x0 + 0.12, 2.0, z), 24, Color(0.1, 0.1, 0.1), PI / 2)
	_form(x0 - 0.5, z, 1.2, 1.3, Color(0.9, 0.55, 0.15))
	# Übergabe zu Band 2 (kurzes Band in die Küche)
	_band2_mat = _band_mat.duplicate()
	_band2_mat.uv1_scale = Vector3(4.0 * 1.5, 1, 1)
	Bau.box(self, Vector3(3.6, 0.04, 0.8), Vector3(x1 + 1.8, 0.87, z), _band2_mat).set_meta("dynamisch", true)
	for seite in [-1, 1]:
		Bau.box(self, Vector3(3.6, 0.16, 0.06), Vector3(x1 + 1.8, 0.8, z + 0.44 * seite), stahl)
	Bau.box(self, Vector3(3.6, 0.8, 0.8), Vector3(x1 + 1.8, 0.4, z), m_dunkel, true)
	Bau.schild(self, "ÜBERGABE  →  BAND 2", Vector3(x1 + 0.6, 1.05, z + 0.45), 20, Color(0.95, 0.9, 0.6), 0.0, 4)
	_form(x1 + 1.8, z, 3.6, 0.9, Color(0.3, 0.42, 0.6))
	# gelb-schwarze Bodenmarkierung
	var mark := Bau.mat(Color(0.98, 0.8, 0.05), "", 1.0, 0.0, false)
	Bau.box(self, Vector3(laenge + 3.6, 0.012, 0.1), Vector3(mx + 1.8, 0.006, z + 0.85), mark)
	# Kisten mit Pudding und Mittagessen
	for i in 5:
		var kiste := Node3D.new()
		kiste.position = Vector3(x0 + 0.8 + i * 2.2, 1.08, z)
		add_child(kiste)
		Bau.box(kiste, Vector3(0.5, 0.38, 0.5), Vector3.ZERO, Bau.mat(Color(1, 1, 1), "karton", 1.2, 0.01))
		Bau.box(kiste, Vector3(0.51, 0.06, 0.12), Vector3(0, 0.17, 0), Bau.mat(Color(0.85, 0.75, 0.55), "", 1.0, 0.0))
		Bau.schild(kiste, "PUDDING" if i % 2 == 0 else "LUNCH", Vector3(0, 0, 0.255), 22, Color(0.4, 0.1, 0.05))
		kiste.set_meta("dynamisch", true)
		_kisten.append(kiste)
	# Puddingpfütze mit Warnschild
	var pfuetze := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(1.3, 0.9)
	pfuetze.mesh = q
	var pm := StandardMaterial3D.new()
	pm.albedo_texture = Bau.tex("fleck")
	pm.albedo_color = Color(0.45, 0.22, 0.08, 1.0)
	pm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	pm.roughness = 0.15
	pfuetze.material_override = pm
	pfuetze.rotation.x = -PI / 2
	pfuetze.position = Vector3(27.6, 0.01, -6.4)
	pfuetze.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(pfuetze)
	_warnschild(Vector3(26.8, 0, -5.9), 0.7)
	# Becher, die aus der Kiste gefallen sind
	for i in 3:
		var b := Bau.zylinder(self, 0.045, 0.08, Vector3(27.3 + i * 0.3, 0.04, -6.6 + i * 0.12), Bau.mat(Color(0.95, 0.95, 0.93), "", 1.0, 0.0), Vector3(PI / 2, 0, i * 0.8), false, 0.055, 10)
		b.position.y = 0.045


func _gurt_textur() -> ImageTexture:
	var img := Image.create(32, 32, false, Image.FORMAT_RGB8)
	for y in 32:
		for x in 32:
			img.set_pixel(x, y, Color(0.3, 0.3, 0.32) if x < 3 else Color(0.12, 0.12, 0.13))
	img.generate_mipmaps()
	return ImageTexture.create_from_image(img)


# ---------------------------------------------------------------- Auftrag 7: Bedienstelle

func _bedienstelle() -> void:
	var p := Node3D.new()
	p.position = Vector3(29.2, 0, -6.35)
	add_child(p)
	var gelb := Bau.mat(Color(0.95, 0.78, 0.1), "", 1.0, 0.01, false, 0.4)
	Bau.zylinder(p, 0.05, 1.1, Vector3(0, 0.55, 0), m_dunkel)
	Bau.box(p, Vector3(0.4, 0.03, 0.3), Vector3(0, 0.015, 0), m_dunkel)
	Bau.box(p, Vector3(0.34, 0.5, 0.18), Vector3(0, 1.32, 0), gelb)
	# Rückwand innen (sichtbar bei offener Abdeckung)
	Bau.box(p, Vector3(0.3, 0.46, 0.01), Vector3(0, 1.32, 0.085), Bau.mat(Color(0.85, 0.85, 0.82), "", 1.0, 0.0))
	for i in 3:
		Bau.box(p, Vector3(0.05, 0.08, 0.04), Vector3(-0.08 + i * 0.08, 1.25, 0.1), Bau.mat(Color(0.3, 0.32, 0.36), "", 1.0, 0.0))
	# Abdeckung mit Tastern (Scharnier unten)
	_abdeckung = Node3D.new()
	_abdeckung.set_meta("dynamisch", true)
	_abdeckung.position = Vector3(0, 1.07, 0.1)
	p.add_child(_abdeckung)
	Bau.box(_abdeckung, Vector3(0.34, 0.5, 0.02), Vector3(0, 0.25, 0), gelb)
	var gruen := Bau.mat(Color(0.1, 0.65, 0.2), "", 1.0, 0.0, false, 0.3)
	var rot := Bau.mat(Color(0.85, 0.08, 0.06), "", 1.0, 0.0, false, 0.3)
	Bau.zylinder(_abdeckung, 0.032, 0.03, Vector3(-0.08, 0.3, 0.02), gruen, Vector3(PI / 2, 0, 0))
	Bau.zylinder(_abdeckung, 0.032, 0.03, Vector3(0.08, 0.3, 0.02), Bau.mat(Color(0.1, 0.1, 0.1), "", 1.0, 0.0), Vector3(PI / 2, 0, 0))
	_pf1 = Bau.leucht(Color(0.1, 0.95, 0.3), 0.05)
	Bau.zylinder(_abdeckung, 0.025, 0.03, Vector3(0, 0.42, 0.02), _pf1, Vector3(PI / 2, 0, 0))
	var pilz := Bau.kugel(_abdeckung, 0.06, Vector3(0, 0.12, 0.04), rot, Vector3(1, 1, 0.7), true)
	pilz.rotation.x = PI / 2
	Bau.zylinder(_abdeckung, 0.08, 0.01, Vector3(0, 0.12, 0.015), Bau.mat(Color(0.98, 0.85, 0.1), "", 1.0, 0.0), Vector3(PI / 2, 0, 0))
	Bau.schild(_abdeckung, "-SJ4 I      -SJ3 O", Vector3(0, 0.37, 0.012), 11, Color.BLACK)
	Bau.schild(_abdeckung, "-PF1", Vector3(0.07, 0.45, 0.012), 10, Color.BLACK)
	Bau.schild(_abdeckung, "-SG0", Vector3(0.1, 0.05, 0.012), 10, Color.BLACK)
	Bau.schild(p, "BEDIENSTELLE BAND 1", Vector3(0, 1.66, 0.09), 14, Color(0.95, 0.95, 0.9), 0.0, 4)
	# Foto (Fundstück)
	_foto = Node3D.new()
	_foto.set_meta("dynamisch", true)
	_foto.position = Vector3(0.0, 1.38, 0.095)
	_foto.visible = false
	p.add_child(_foto)
	Bau.box(_foto, Vector3(0.12, 0.14, 0.004), Vector3.ZERO, Bau.mat(Color(0.96, 0.96, 0.94), "", 1.0, 0.0))
	Bau.box(_foto, Vector3(0.1, 0.1, 0.002), Vector3(0, 0.012, 0.003), Bau.mat(Color(0.25, 0.22, 0.3), "", 1.0, 0.0))
	Bau.kugel(_foto, 0.012, Vector3(0.04, -0.05, 0.004), Bau.mat(Color(0.05, 0.02, 0.03)), Vector3(1, 1, 0.3))
	Bau.kollisionsbox(p, Vector3(0.4, 1.6, 0.3), Vector3(0, 0.8, 0))
	_form(29.2, -6.35, 0.4, 0.3, Color(0.95, 0.78, 0.1))
	stationen["bedienstelle"] = Interaktiv.neu(self, "bedienstelle", Vector3(29.2, 0, -5.3), "Bedienstelle prüfen", 1.6)


func bedienstelle_oeffnen(offen: bool, mit_foto: bool = false) -> void:
	_foto.visible = mit_foto
	var t := create_tween()
	t.tween_property(_abdeckung, "rotation:x", 1.35 if offen else 0.0, 0.9).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func bedienstelle_reparieren() -> void:
	bedienstelle_ok = true
	_pf1.emission_energy_multiplier = 3.5


# ---------------------------------------------------------------- Getränkeautomaten

func _automaten() -> void:
	var farben := [[Color(0.75, 0.08, 0.08), "SODA"], [Color(0.1, 0.3, 0.7), "SNACKS"], [Color(0.3, 0.18, 0.1), "KAFFEE"]]
	for i in 3:
		var a := Node3D.new()
		a.position = Vector3(15.6 + i * 1.25, 0, CZ - 0.45)
		add_child(a)
		var f: Array = farben[i]
		Bau.box(a, Vector3(1.05, 1.95, 0.8), Vector3(0, 0.975, 0), Bau.mat(f[0], "metall", 1.0, 0.012, false, 0.4))
		Bau.box(a, Vector3(0.7, 1.35, 0.01), Vector3(-0.1, 1.15, -0.405), Bau.leucht(Color(f[0]).lightened(0.55), 1.5))
		Bau.box(a, Vector3(0.18, 0.4, 0.02), Vector3(0.38, 1.3, -0.405), Bau.mat(Color(0.15, 0.15, 0.17), "", 1.0, 0.0))
		Bau.schild(a, f[1], Vector3(-0.1, 1.15, -0.42), 40, Color(1, 1, 1), PI, 6)
	Bau.kollisionsbox(self, Vector3(3.8, 2.0, 0.8), Vector3(16.85, 1.0, CZ - 0.45))
	_form(16.85, CZ - 0.45, 3.8, 0.8, Color(0.6, 0.25, 0.25))
	var glanz := OmniLight3D.new()
	glanz.position = Vector3(16.9, 1.3, CZ - 1.5)
	glanz.light_color = Color(1.0, 0.6, 0.6)
	glanz.light_energy = 0.9
	glanz.omni_range = 4.0
	add_child(glanz)


# ---------------------------------------------------------------- Mondlicht auf dem Boden

func _fenster_licht() -> void:
	var m := StandardMaterial3D.new()
	m.albedo_texture = _lichtfleck_tex()
	m.albedo_color = Color(0.45, 0.55, 0.95, 0.22)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.depth_draw_mode = BaseMaterial3D.DEPTH_DRAW_DISABLED
	# Flur: Fensterband oben an der Nordwand
	var x := FX0 + 0.45
	while x < FX1 - 1.0:
		_fleck_quad(Vector3(x + 1.4, 0.012, 1.0), Vector2(2.4, 1.2), m, 0.25)
		x += 3.2
	# Cafeteria: große Fenster im Süden
	for mx in [22.7, 26.7, 30.7]:
		_fleck_quad(Vector3(mx - 0.8, 0.012, 6.4), Vector2(3.2, 3.6), m, -0.2)


func _fleck_quad(pos: Vector3, groesse: Vector2, m: Material, schraeg: float) -> void:
	var mi := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = groesse
	mi.mesh = q
	mi.material_override = m
	mi.rotation = Vector3(-PI / 2, 0, schraeg)
	mi.position = pos
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)


static func _lichtfleck_tex() -> ImageTexture:
	var img := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	for y in 64:
		for x in 64:
			var rx := minf(x, 63 - x) / 10.0
			var ry := minf(y, 63 - y) / 10.0
			var a := clampf(minf(rx, ry), 0.0, 1.0)
			# Fensterkreuz
			if absi(x - 32) < 2 or absi(y - 30) < 2:
				a *= 0.25
			img.set_pixel(x, y, Color(1, 1, 1, a))
	img.generate_mipmaps()
	return ImageTexture.create_from_image(img)


# ---------------------------------------------------------------- Sammelobjekte und Schatten

func _sammelobjekte() -> void:
	_sammel_neu("s_nym", Vector3(FX0 + 0.7, 0.1, 2.1))
	_sammel_neu("s_rj45", Vector3(12.2, 2.05, -FZ + 0.25))
	_sammel_neu("s_lwl", Vector3(22.6, 0.08, 4.1))


func _schatten() -> void:
	_wandkante(Vector3((FX0 + FX1) * 0.5, 0, -FZ + 0.45), Vector3(0, 0, -1), FX1 - FX0)
	_wandkante(Vector3((FX0 + FX1) * 0.5, 0, FZ - 0.45), Vector3(0, 0, 1), FX1 - FX0)
	_wandkante(Vector3((FX1 + CX1) * 0.5, 0, -CZ), Vector3(0, 0, -1), CX1 - FX1)
	_wandkante(Vector3((FX1 + CX1) * 0.5, 0, CZ), Vector3(0, 0, 1), CX1 - FX1)
	_wandkante(Vector3(FX1, 0, -5.3), Vector3(-1, 0, 0), CZ - DURCHGANG)
	_wandkante(Vector3(FX1, 0, 5.3), Vector3(-1, 0, 0), CZ - DURCHGANG)
	for tx in [17.8, 22.0, 26.2]:
		for tz in [-3.8, 3.0, 6.2]:
			_schattenfleck(Vector3(tx, 0, tz), Vector2(3.2, 2.2), 0.5)
	_schattenfleck(Vector3(30.6, 0, -0.1), Vector2(1.6, 11.8), 0.55)
	_schattenfleck(Vector3(24.2, 0, -7.6), Vector2(12.5, 1.8), 0.55)
	_schattenfleck(Vector3(-15.1, 0, FZ - 0.4), Vector2(3.4, 1.2), 0.55)
	_schattenfleck(Vector3(0.35, 0, FZ - 0.5), Vector2(1.4, 1.2), 0.55)
	_schattenfleck(Vector3(16.85, 0, CZ - 0.5), Vector2(4.2, 1.4), 0.55)


# ---------------------------------------------------------------- Animation

func _process(delta: float) -> void:
	_zeit += delta
	_sammel_animieren(delta)
	if not is_visible_in_tree():
		return
	# Band 1 und Band 2 laufen
	_band_mat.uv1_offset.x -= delta * 0.9 * 1.5
	_band2_mat.uv1_offset.x -= delta * 0.9 * 1.5
	for r in _rollen:
		r.rotate_object_local(Vector3.UP, -delta * 12.0)
	for k in _kisten:
		k.position.x += delta * 0.9
		if k.position.x > 29.5:
			k.position.x = 18.8
	_takt -= delta
	if _takt <= 0.0:
		_takt = 0.06
		# Snackautomat fällt immer wieder aus, solange die Fernmeldeleitung drin ist
		if not leitung_ok:
			_automat_aus -= 0.06
			if _automat_aus < -6.0:
				_automat_aus = randf_range(1.0, 2.5)
			var aus := _automat_aus > 0.0
			_automat_licht.emission_energy_multiplier = 0.05 if aus else 1.6
			_automat_omni.visible = not aus
			_heisse_leitung.emission_energy_multiplier = 0.3 + absf(sin(_zeit * 2.0)) * 0.9
		# Bildsalat auf dem Infoscreen, Access Point blinkt orange
		if not funk_ok:
			_schirm_mat.uv1_offset = Vector3(randf(), randf(), 0)
			_schirm_mat.emission_energy_multiplier = randf_range(0.6, 1.8)
			_ap_led.emission_energy_multiplier = 3.0 if fmod(_zeit, 0.8) < 0.4 else 0.1
		_router_led.emission_energy_multiplier = 3.0 if fmod(_zeit, 0.5) < 0.25 else 0.2
		# -PF1 ist falsch angeschlossen: aus, obwohl das Band läuft
		if not bedienstelle_ok:
			_pf1.emission_energy_multiplier = 0.05
