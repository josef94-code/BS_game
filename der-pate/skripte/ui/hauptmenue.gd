extends Control
## Hauptmenü mit Porträt des Paten, Namenseingabe, Laden über Dateidialog und Ladebildschirm.

var _knoepfe: VBoxContainer
var _name_box: VBoxContainer
var _name: LineEdit
var _meldung: Label
var _hilfe: Label

const TIPPS := [
	"Tipp: Mit B öffnest du das Beweisbrett. Dort stehen alle Hinweise und offenen Fragen.",
	"Tipp: Wer beim ersten Versuch richtig liegt, bekommt Bonus-Ruf.",
	"Tipp: Irgendwo im Keller liegen verlorene Bauteile. Halte die Augen offen.",
	"Tipp: Speichere über Esc → „Spiel speichern …“ auf deinem persönlichen Laufwerk.",
	"Tipp: Der gelbe Punkt auf der Minimap zeigt dein Ziel. Der Hut zeigt den Paten.",
]


func _ready() -> void:
	theme = Stil.theme()
	get_tree().paused = false
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	# Hintergrund: Verlauf von Dunkelrot nach Schwarz
	var bg := TextureRect.new()
	var gt := GradientTexture2D.new()
	var g := Gradient.new()
	g.set_color(0, Color(0.32, 0.04, 0.06))
	g.set_color(1, Color(0.02, 0.01, 0.02))
	gt.gradient = g
	gt.fill = GradientTexture2D.FILL_RADIAL
	gt.fill_from = Vector2(0.75, 0.45)
	gt.fill_to = Vector2(0.15, 1.1)
	bg.texture = gt
	bg.stretch_mode = TextureRect.STRETCH_SCALE
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	# Streifen (Stil: Comic-Raster)
	var streifen := Control.new()
	streifen.set_anchors_preset(Control.PRESET_FULL_RECT)
	streifen.draw.connect(func():
		for i in 60:
			var x := i * 48.0 - 400.0
			streifen.draw_line(Vector2(x, 0), Vector2(x + 500, 1200), Color(1, 1, 1, 0.025), 14.0))
	add_child(streifen)
	# Porträt rechts
	var portraet := Portraet.new(Vector2i(640, 820))
	add_child(portraet)
	Stil.setze(portraet, Control.PRESET_RIGHT_WIDE, -720, 40, -60, -40)
	# Titel links
	var links := VBoxContainer.new()
	links.add_theme_constant_override("separation", 10)
	add_child(links)
	Stil.setze(links, Control.PRESET_LEFT_WIDE, 110, 90, 820, -60)
	var ueber := Stil.label("LINCOLN HIGH PRÄSENTIERT", 24, Color(0.9, 0.85, 0.75), 0, Stil.schreibmaschine())
	links.add_child(ueber)
	var titel := Stil.label("DER PATE", 170, Color(0.96, 0.8, 0.45), 24, Stil.titel_schrift())
	links.add_child(titel)
	links.add_child(Stil.label("„Die Familie vergisst nicht.“", 30, Color(0.95, 0.9, 0.85), 6, Stil.schreibmaschine()))
	var abstand := Control.new()
	abstand.custom_minimum_size.y = 40
	links.add_child(abstand)
	_knoepfe = VBoxContainer.new()
	_knoepfe.add_theme_constant_override("separation", 10)
	links.add_child(_knoepfe)
	_knoepfe.add_child(Stil.knopf("Neues Spiel", _neues_spiel, 420))
	_knoepfe.add_child(Stil.knopf("Spielstand laden …", _laden, 420))
	_knoepfe.add_child(Stil.knopf("Steuerung", func(): _hilfe.visible = not _hilfe.visible, 420))
	_knoepfe.add_child(Stil.knopf("Beenden", func(): get_tree().quit(), 420))
	_name_box = VBoxContainer.new()
	_name_box.visible = false
	_name_box.add_theme_constant_override("separation", 10)
	links.add_child(_name_box)
	_name_box.add_child(Stil.label("Wie heißt du, Neuer?", 28, Color.WHITE, 0, Stil.fett()))
	_name = LineEdit.new()
	_name.custom_minimum_size = Vector2(420, 56)
	_name.max_length = 20
	_name.placeholder_text = "Vorname"
	_name.text_submitted.connect(func(_t): _starten())
	_name_box.add_child(_name)
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 10)
	_name_box.add_child(h)
	h.add_child(Stil.knopf("Zurück", func(): _name_box.visible = false; _knoepfe.visible = true, 200))
	h.add_child(Stil.knopf("Los geht’s  ▶", _starten, 210))
	_hilfe = Stil.label(PauseMenue.steuerung_text(), 19, Color(0.9, 0.9, 0.9))
	_hilfe.visible = false
	links.add_child(_hilfe)
	_meldung = Stil.label("", 20, Color(1, 0.45, 0.35))
	links.add_child(_meldung)
	var fuss := Stil.label("Lernspiel für Mechatroniker/-innen · 10. Jahrgangsstufe · Prototyp v0.3  ·  Alle Figuren und Ereignisse sind frei erfunden.", 16, Color(1, 1, 1, 0.45))
	add_child(fuss)
	Stil.setze(fuss, Control.PRESET_BOTTOM_WIDE, 110, -40, -40, -12)
	if Spielstand.lehrer:
		var l := Stil.label("LEHRKRAFT-MODUS: Lösungen werden angezeigt, F9 löst die aktuelle Aufgabe.", 18, Stil.BLAU)
		add_child(l)
		Stil.setze(l, Control.PRESET_TOP_WIDE, 110, 30, 0, 60)
	Audio.musik_an(true)
	if Spielstand.autotest:
		_autotest.call_deferred()


func _autotest() -> void:
	await get_tree().create_timer(1.5).timeout
	await RenderingServer.frame_post_draw
	var ordner := "user://autotest"
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--shots="):
			ordner = a.substr(8)
	DirAccess.make_dir_recursive_absolute(ordner)
	get_viewport().get_texture().get_image().save_png(ordner + "/00_menue.png")
	_name.text = "Testspieler"
	_starten()


func _neues_spiel() -> void:
	_knoepfe.visible = false
	_name_box.visible = true
	_name.grab_focus()


func _starten() -> void:
	var n := _name.text.strip_edges()
	if n == "":
		n = "Neuer"
	Spielstand.neu(n)
	_ladebildschirm()


func _laden() -> void:
	var fd := FileDialog.new()
	fd.file_mode = FileDialog.FILE_MODE_OPEN_FILE
	fd.access = FileDialog.ACCESS_FILESYSTEM
	fd.use_native_dialog = true
	fd.filters = PackedStringArray(["*.pate ; Spielstand DER PATE"])
	fd.title = "Spielstand laden"
	fd.current_dir = OS.get_system_dir(OS.SYSTEM_DIR_DOCUMENTS)
	fd.canceled.connect(fd.queue_free)
	fd.file_selected.connect(func(pfad: String):
		fd.queue_free()
		var fehler := Spielstand.laden(pfad)
		if fehler != "":
			_meldung.text = fehler
		else:
			_ladebildschirm())
	add_child(fd)
	fd.popup_centered_ratio(0.75)


func _ladebildschirm() -> void:
	var ebene := ColorRect.new()
	ebene.color = Color(0.03, 0.02, 0.03)
	ebene.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(ebene)
	var p := Portraet.new(Vector2i(560, 720))
	ebene.add_child(p)
	Stil.setze(p, Control.PRESET_CENTER_LEFT, 140, -380, 700, 380)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 18)
	ebene.add_child(v)
	Stil.setze(v, Control.PRESET_CENTER_RIGHT, -820, -200, -120, 220)
	v.add_child(Stil.label("AKT 1", 30, Color(0.9, 0.85, 0.75), 0, Stil.schreibmaschine()))
	v.add_child(Stil.label("SELTSAME\nVORFÄLLE", 110, Color(0.96, 0.8, 0.45), 18, Stil.titel_schrift()))
	var tipp := Stil.label(TIPPS[randi() % TIPPS.size()], 22, Color(0.9, 0.9, 0.9))
	tipp.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	tipp.custom_minimum_size.x = 660
	v.add_child(tipp)
	var laedt := Stil.label("LÄDT", 26, Color(1, 1, 1, 0.7), 0, Stil.hud_schrift())
	ebene.add_child(laedt)
	Stil.setze(laedt, Control.PRESET_BOTTOM_RIGHT, -480, -96, -40, -64)
	# Ladebalken wie bei GTA III
	var rahmen := ColorRect.new()
	rahmen.color = Color(0.25, 0.25, 0.27)
	ebene.add_child(rahmen)
	Stil.setze(rahmen, Control.PRESET_BOTTOM_RIGHT, -480, -56, -40, -40)
	var balken := ColorRect.new()
	balken.color = Color(0.85, 0.65, 0.25)
	rahmen.add_child(balken)
	balken.position = Vector2(2, 2)
	balken.size = Vector2(0, 12)
	create_tween().tween_property(balken, "size:x", 436.0, 2.0)
	await get_tree().create_timer(2.2 if not Spielstand.autotest else 1.0).timeout
	if Spielstand.autotest:
		await RenderingServer.frame_post_draw
		var ordner := "user://autotest"
		for a in OS.get_cmdline_user_args():
			if a.begins_with("--shots="):
				ordner = a.substr(8)
		get_viewport().get_texture().get_image().save_png(ordner + "/00_laden.png")
	get_tree().change_scene_to_file("res://szenen/welt/spiel.tscn")
