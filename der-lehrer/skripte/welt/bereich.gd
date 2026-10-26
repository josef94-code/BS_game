class_name Bereich
extends Node3D
## Gemeinsame Grundlage aller begehbaren Bereiche (Keller, Erdgeschoss mit Flur und Cafeteria):
## Formen für die Minimap, interaktive Stationen, Lampen, Grafikstufen und Sammelobjekte.
## Die Bereiche liegen weit auseinander in derselben Welt; Türen verbinden sie per Überblendung.

## Anzeigename (erscheint beim Betreten unten rechts)
var titel := ""
## Minimap: Einrichtung {"r": Rect2 (lokal x/z), "f": Color}
var formen: Array = []
## Minimap: begehbare Flächen {"r": Rect2 (lokal x/z), "f": Color, "name": String}
var boeden: Array = []
## Minimap: Symbole {"p": Vector3 (lokal), "t": String, "f": Color}
var symbole: Array = []
var stationen := {}
var umwelt: Environment
## Türen in andere Bereiche: Stations-ID -> Titel des Zielbereichs
var tueren := {}
## Ankunftsorte: Titel des Herkunftsbereichs -> [lokale Position, Blickrichtung]
var ankunft := {}

## Lichter, die je nach Grafikstufe Schatten werfen (wichtigste zuerst)
var _schatten_lichter: Array[Light3D] = []
var _staub: Array[CPUParticles3D] = []
var _sammel := {}
var _zeit_bereich := 0.0


func _form(mitte_x: float, mitte_z: float, breite: float, tiefe: float, farbe: Color) -> void:
	formen.append({"r": Rect2(mitte_x - breite * 0.5, mitte_z - tiefe * 0.5, breite, tiefe), "f": farbe})


func _boden_form(x0: float, z0: float, x1: float, z1: float, farbe: Color, name: String = "") -> void:
	boeden.append({"r": Rect2(x0, z0, x1 - x0, z1 - z0), "f": farbe, "name": name})


## Tür in Richtung eines anderen Bereichs (sonst die Tür ins Erdgeschoss, das alle Bereiche verbindet)
func ausgang_nach(ziel_titel: String) -> Interaktiv:
	for id in tueren:
		if tueren[id] == ziel_titel and stationen.has(id):
			return stationen[id]
	for id in tueren:
		if tueren[id] == "Erdgeschoss" and stationen.has(id):
			return stationen[id]
	return null


## Liegt ein Weltpunkt in diesem Bereich?
func enthaelt(p: Vector3) -> bool:
	return raum_an(p) != ""


## Name der Teilfläche (z. B. "Flur", "Cafeteria") an einem Weltpunkt, sonst ""
func raum_an(p: Vector3) -> String:
	var lokal := Vector2(p.x - position.x, p.z - position.z)
	for b in boeden:
		if (b["r"] as Rect2).grow(0.6).has_point(lokal):
			return b["name"] if b["name"] != "" else titel
	return ""


## Nach dem Aufbau: unbewegliche Teile zusammenfassen, Grafikstufe anwenden, Geräusche begrenzen
func _fertigstellen(zelle: float) -> void:
	var n := Bau.zusammenfassen(self, zelle)
	print("%s: %d Teile zusammengefasst" % [titel, n])
	for a in find_children("*", "AudioStreamPlayer3D", true, false):
		(a as AudioStreamPlayer3D).max_distance = 30.0
	Grafik.geaendert.connect(_grafik_anwenden)
	_grafik_anwenden()


## Grafikstufe: Schatten, Staub und Leuchten anpassen
func _grafik_anwenden() -> void:
	var schatten := 0
	match Grafik.stufe:
		"mittel": schatten = 2
		"hoch": schatten = _schatten_lichter.size()
	for i in _schatten_lichter.size():
		_schatten_lichter[i].shadow_enabled = i < schatten
	for p in _staub:
		p.visible = Grafik.ist("mittel")
		p.amount = 90 if Grafik.stufe == "hoch" else 45
	if umwelt:
		umwelt.glow_enabled = Grafik.ist("mittel")


# ---------------------------------------------------------------- Lampen

func _roehre(pos: Vector3, an: bool = true, farbe: Color = Color(0.72, 0.95, 0.82)) -> OmniLight3D:
	var gehaeuse := Bau.mat(Color(0.75, 0.75, 0.72), "metall", 1.0, 0.0)
	Bau.box(self, Vector3(1.4, 0.07, 0.22), pos - Vector3(0, 0.05, 0), gehaeuse)
	var leucht := Bau.leucht(farbe.lightened(0.4), 3.0) if an else Bau.mat(Color(0.75, 0.78, 0.76), "", 1.0, 0.0)
	for dz in [-0.05, 0.05]:
		Bau.zylinder(self, 0.018, 1.3, pos - Vector3(0, 0.1, dz), leucht, Vector3(0, 0, PI / 2))
	if not an:
		return null
	var l := OmniLight3D.new()
	l.position = pos - Vector3(0, 0.35, 0)
	l.light_color = farbe
	l.light_energy = 1.1
	l.omni_range = 7.0
	l.omni_attenuation = 1.4
	add_child(l)
	Bau.lichtkegel(self, pos - Vector3(0, 0.12, 0), pos.y - 0.12, 2.3, farbe, 0.035)
	return l


## Hängelampe mit Schirm: Spotlicht nach unten (Schatten kosten nur einen Durchgang)
func _lampe(pos: Vector3, farbe: Color, energie: float, reichweite: float, schatten: bool,
		schirm_farbe: Color = Color(0.12, 0.3, 0.2), kabel_laenge: float = 0.55) -> SpotLight3D:
	Bau.zylinder(self, 0.012, kabel_laenge, pos - Vector3(0, kabel_laenge * 0.5, 0), Bau.mat(Color(0.12, 0.12, 0.13), "", 1.0, 0.01))
	var schirm_m := Bau.mat(schirm_farbe, "", 1.0, 0.012)
	Bau.zylinder(self, 0.38, 0.28, pos - Vector3(0, kabel_laenge + 0.12, 0), schirm_m, Vector3.ZERO, false, 0.1)
	var birne := Bau.leucht(farbe, 4.0)
	Bau.kugel(self, 0.09, pos - Vector3(0, kabel_laenge + 0.27, 0), birne)
	var l := SpotLight3D.new()
	l.position = pos - Vector3(0, kabel_laenge + 0.3, 0)
	l.rotation.x = -PI / 2
	l.light_color = farbe
	l.light_energy = energie * 1.8
	l.spot_range = reichweite
	l.spot_angle = 70.0
	l.spot_angle_attenuation = 0.6
	l.spot_attenuation = 0.9
	l.shadow_enabled = schatten
	l.shadow_bias = 0.04
	add_child(l)
	var kegel := Bau.lichtkegel(self, pos - Vector3(0, kabel_laenge + 0.26, 0), pos.y - kabel_laenge - 0.26, 1.9, farbe, 0.065)
	l.set_meta("kegel", kegel)
	l.set_meta("birne", birne)
	_staub_neu(pos - Vector3(0, kabel_laenge + 1.6, 0), farbe)
	return l


## Schwebender Staub im Lichtkegel (nur Mittel/Hoch)
func _staub_neu(pos: Vector3, farbe: Color) -> void:
	var p := CPUParticles3D.new()
	p.position = pos
	p.amount = 60
	p.lifetime = 9.0
	p.preprocess = 9.0
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	p.emission_box_extents = Vector3(1.0, 1.4, 1.0)
	p.gravity = Vector3(0, -0.006, 0)
	p.direction = Vector3(0, 1, 0)
	p.spread = 180.0
	p.initial_velocity_min = 0.01
	p.initial_velocity_max = 0.05
	p.scale_amount_min = 0.5
	p.scale_amount_max = 1.2
	var q := QuadMesh.new()
	q.size = Vector2(0.012, 0.012)
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.albedo_texture = Bau.fleck_rund_tex()
	m.albedo_color = Color(farbe.r, farbe.g, farbe.b, 0.55)
	q.material = m
	p.mesh = q
	p.set_meta("dynamisch", true)
	add_child(p)
	_staub.append(p)


# ---------------------------------------------------------------- Weiche Schatten

## Dunkler Verlauf am Wandfuß (Boden und Wand); richtung zeigt von der Raummitte zur Wand
func _wandkante(pos: Vector3, richtung: Vector3, laenge: float) -> void:
	var kante := Bau.schatten_mat(Bau.verlauf_tex(), 0.55)
	var drehung := atan2(richtung.x, richtung.z)
	var boden := Node3D.new()
	boden.position = pos - richtung * 0.45 + Vector3(0, 0.006, 0)
	boden.rotation.y = drehung
	add_child(boden)
	var q := MeshInstance3D.new()
	var qm := QuadMesh.new()
	qm.size = Vector2(laenge, 0.9)
	q.mesh = qm
	q.rotation.x = -PI / 2
	q.material_override = kante
	q.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	boden.add_child(q)
	var wand := MeshInstance3D.new()
	var wm := QuadMesh.new()
	wm.size = Vector2(laenge, 0.8)
	wand.mesh = wm
	wand.material_override = kante
	wand.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	wand.position = pos - richtung * 0.06 + Vector3(0, 0.4, 0)
	wand.rotation.y = drehung + PI
	add_child(wand)


## Runder Schattenfleck unter Möbeln und Anlagen
func _schattenfleck(pos: Vector3, groesse: Vector2, staerke: float = 0.6) -> void:
	var mi := MeshInstance3D.new()
	var pm := QuadMesh.new()
	pm.size = groesse
	mi.mesh = pm
	mi.material_override = Bau.schatten_mat(Bau.fleck_rund_tex(), staerke)
	mi.rotation.x = -PI / 2
	mi.position = pos + Vector3(0, 0.008, 0)
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)


# ---------------------------------------------------------------- Sammelobjekte

func _sammel_neu(id: String, pos: Vector3) -> void:
	var k := Node3D.new()
	k.position = pos
	add_child(k)
	var metall := Bau.mat(Color(0.75, 0.77, 0.8), "metall", 1.0, 0.01)
	var dunkel := Bau.mat(Color(0.12, 0.12, 0.13), "", 1.0, 0.01)
	match id:
		"s_widerstand":
			Bau.kapsel(k, 0.03, 0.14, Vector3.ZERO, Bau.mat(Color(0.85, 0.75, 0.55)), Vector3(0, 0, PI / 2))
			var ringe := [Color(0.95, 0.8, 0.1), Color(0.5, 0.15, 0.6), Color(0.45, 0.25, 0.1), Color(0.85, 0.7, 0.2)]
			for i in 4:
				Bau.zylinder(k, 0.032, 0.012, Vector3(-0.04 + i * 0.025, 0, 0), Bau.mat(ringe[i]), Vector3(0, 0, PI / 2))
			Bau.zylinder(k, 0.004, 0.32, Vector3.ZERO, metall, Vector3(0, 0, PI / 2))
		"s_diode":
			Bau.zylinder(k, 0.025, 0.1, Vector3.ZERO, dunkel, Vector3(0, 0, PI / 2))
			Bau.zylinder(k, 0.026, 0.015, Vector3(0.035, 0, 0), metall, Vector3(0, 0, PI / 2))
			Bau.zylinder(k, 0.004, 0.28, Vector3.ZERO, metall, Vector3(0, 0, PI / 2))
		"s_nym":
			var mantel := Bau.mat(Color(0.92, 0.92, 0.9))
			Bau.torus(k, 0.07, 0.11, Vector3.ZERO, mantel, Vector3(PI / 2, 0, 0))
			Bau.torus(k, 0.075, 0.115, Vector3(0, 0, 0.025), mantel, Vector3(PI / 2, 0, 0))
			for i in 3:
				Bau.zylinder(k, 0.008, 0.08, Vector3(0.1 + i * 0.012, 0.04, 0.02),
					Bau.mat([Color(0.45, 0.25, 0.1), Color(0.15, 0.3, 0.75), Color(0.5, 0.75, 0.1)][i]))
		"s_rj45":
			Bau.box(k, Vector3(0.05, 0.035, 0.08), Vector3.ZERO, Bau.glas(Color(0.85, 0.9, 0.95, 0.6)))
			Bau.box(k, Vector3(0.04, 0.012, 0.06), Vector3(0, 0.022, 0.0), Bau.mat(Color(0.9, 0.75, 0.2)))
			Bau.zylinder(k, 0.02, 0.2, Vector3(0, 0, 0.14), Bau.mat(Color(0.2, 0.45, 0.85)), Vector3(PI / 2, 0, 0))
		"s_lwl":
			var orange := Bau.mat(Color(0.95, 0.55, 0.1))
			Bau.torus(k, 0.06, 0.08, Vector3.ZERO, orange, Vector3(PI / 2, 0, 0))
			for seite in [-1, 1]:
				Bau.box(k, Vector3(0.02, 0.02, 0.06), Vector3(0.09 * seite, 0, 0.06), Bau.mat(Color(0.9, 0.9, 0.88)))
		"s_asi":
			var gelb := Bau.mat(Color(0.98, 0.82, 0.1))
			for i in 3:
				var stueck := Bau.box(k, Vector3(0.12, 0.012, 0.035), Vector3(-0.1 + i * 0.1, 0, 0.02 * (i % 2)), gelb)
				stueck.rotation.y = 0.4 * (i - 1)
		"s_knopfzelle":
			Bau.zylinder(k, 0.035, 0.01, Vector3.ZERO, metall, Vector3(PI / 2, 0, 0))
			Bau.zylinder(k, 0.03, 0.002, Vector3(0, 0, 0.006), Bau.mat(Color(0.85, 0.85, 0.8)), Vector3(PI / 2, 0, 0))
		"s_bimetall":
			var a := Bau.box(k, Vector3(0.16, 0.008, 0.03), Vector3(0, 0.004, 0), Bau.mat(Color(0.8, 0.45, 0.25)))
			var b := Bau.box(k, Vector3(0.16, 0.008, 0.03), Vector3(0, -0.004, 0), metall)
			a.rotation.z = 0.15
			b.rotation.z = 0.15
		"s_zeitrelais":
			Bau.box(k, Vector3(0.09, 0.12, 0.07), Vector3.ZERO, Bau.mat(Color(0.85, 0.85, 0.82)))
			Bau.box(k, Vector3(0.07, 0.03, 0.005), Vector3(0, 0.03, 0.036), Bau.mat(Color(0.2, 0.3, 0.55)))
			Bau.zylinder(k, 0.012, 0.01, Vector3(0, -0.02, 0.038), Bau.mat(Color(0.95, 0.75, 0.1)), Vector3(PI / 2, 0, 0))
		_:
			Bau.box(k, Vector3(0.1, 0.12, 0.08), Vector3.ZERO, Bau.mat(Color(0.35, 0.37, 0.4)))
			Bau.box(k, Vector3(0.06, 0.02, 0.085), Vector3(0, 0.03, 0), Bau.mat(Color(0.9, 0.9, 0.9)))
	var funkeln := Bau.kugel(k, 0.06, Vector3.ZERO, Bau.leucht(Color(1.0, 0.85, 0.3), 1.2))
	funkeln.name = "Funkeln"
	(funkeln.material_override as StandardMaterial3D).transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	(funkeln.material_override as StandardMaterial3D).albedo_color.a = 0.35
	k.set_meta("dynamisch", true)
	_sammel[id] = k
	stationen["sammel:" + id] = Interaktiv.neu(self, "sammel:" + id, Vector3(pos.x, 0, pos.z), "Etwas glitzert hier …", 1.4)


func sammel_entfernen(id: String) -> void:
	if _sammel.has(id):
		_sammel[id].queue_free()
		_sammel.erase(id)
	if stationen.has("sammel:" + id):
		stationen["sammel:" + id].queue_free()
		stationen.erase("sammel:" + id)


## Sammelobjekte drehen sich und funkeln (aus _process der Bereiche aufrufen)
func _sammel_animieren(delta: float) -> void:
	_zeit_bereich += delta
	for id in _sammel:
		var k: Node3D = _sammel[id]
		k.rotation.y += delta * 1.5
		var f := k.get_node("Funkeln") as Node3D
		f.scale = Vector3.ONE * (0.8 + 0.4 * absf(sin(_zeit_bereich * 2.0 + k.position.x)))
