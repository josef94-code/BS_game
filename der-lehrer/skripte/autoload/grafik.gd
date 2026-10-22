extends Node
## Grafikstufen (Niedrig / Mittel / Hoch) und Automatik: Läuft das Spiel dauerhaft unter
## ca. 35 Bildern pro Sekunde, wird eine Stufe heruntergeschaltet. Die Einstellung wird pro Rechner
## in user://einstellungen.cfg gespeichert (nicht im Spielstand).

signal geaendert

const STUFEN := ["niedrig", "mittel", "hoch"]
const NAMEN := {"auto": "Automatisch", "niedrig": "Niedrig", "mittel": "Mittel", "hoch": "Hoch"}
const DATEI := "user://einstellungen.cfg"

## gewählte Einstellung (auch "auto")
var wahl := "auto"
## tatsächlich verwendete Stufe
var stufe := "hoch"

var _messzeit := 0.0
var _bilder := 0
var _schlechte_messungen := 0
var aktiv_messen := false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	var cfg := ConfigFile.new()
	if cfg.load(DATEI) == OK:
		wahl = cfg.get_value("grafik", "wahl", "auto")
		stufe = cfg.get_value("grafik", "stufe", "hoch")
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--grafik="):
			wahl = a.substr(9)
			if wahl != "auto":
				stufe = wahl
	if wahl != "auto":
		stufe = wahl
	anwenden.call_deferred()


func setze(neue_wahl: String) -> void:
	wahl = neue_wahl
	if wahl != "auto":
		stufe = wahl
	else:
		stufe = "hoch"
		_schlechte_messungen = 0
	_speichern()
	anwenden()


func naechste_wahl() -> String:
	var reihe := ["auto", "niedrig", "mittel", "hoch"]
	return reihe[(reihe.find(wahl) + 1) % reihe.size()]


func text() -> String:
	if wahl == "auto":
		return "Grafik: Automatisch (%s)" % NAMEN[stufe]
	return "Grafik: " + NAMEN[wahl]


func ist(min_stufe: String) -> bool:
	return STUFEN.find(stufe) >= STUFEN.find(min_stufe)


func _speichern() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("grafik", "wahl", wahl)
	cfg.set_value("grafik", "stufe", stufe)
	cfg.save(DATEI)


## Fenster-Einstellungen; die Szene reagiert auf das Signal (Schatten, Partikel, Filter)
func anwenden() -> void:
	var vp := get_viewport()
	match stufe:
		"niedrig":
			vp.msaa_3d = Viewport.MSAA_DISABLED
			vp.scaling_3d_scale = 0.8
			vp.screen_space_aa = Viewport.SCREEN_SPACE_AA_FXAA
		"mittel":
			vp.msaa_3d = Viewport.MSAA_2X
			vp.scaling_3d_scale = 1.0
			vp.screen_space_aa = Viewport.SCREEN_SPACE_AA_DISABLED
		_:
			vp.msaa_3d = Viewport.MSAA_4X
			vp.scaling_3d_scale = 1.0
			vp.screen_space_aa = Viewport.SCREEN_SPACE_AA_DISABLED
	vp.positional_shadow_atlas_size = 4096 if stufe == "hoch" else 2048
	RenderingServer.directional_soft_shadow_filter_set_quality(RenderingServer.SHADOW_QUALITY_SOFT_LOW)
	RenderingServer.positional_soft_shadow_filter_set_quality(
		RenderingServer.SHADOW_QUALITY_SOFT_MEDIUM if stufe == "hoch" else RenderingServer.SHADOW_QUALITY_HARD)
	Bau.normalmaps_setzen(stufe != "niedrig")
	geaendert.emit()


## Automatik: im Spiel aufrufen (nur während freiem Erkunden messen)
func _process(delta: float) -> void:
	if wahl != "auto" or not aktiv_messen or get_tree().paused:
		_messzeit = 0.0
		_bilder = 0
		return
	_messzeit += delta
	_bilder += 1
	if _messzeit >= 4.0:
		var fps := _bilder / _messzeit
		_messzeit = 0.0
		_bilder = 0
		if fps < 33.0:
			_schlechte_messungen += 1
		else:
			_schlechte_messungen = 0
		if _schlechte_messungen >= 2 and stufe != "niedrig":
			stufe = STUFEN[STUFEN.find(stufe) - 1]
			_schlechte_messungen = 0
			print("Grafik-Automatik: zu langsam (%.0f FPS) – neue Stufe %s" % [fps, stufe])
			_speichern()
			anwenden()
