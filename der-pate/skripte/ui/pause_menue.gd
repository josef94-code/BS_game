class_name PauseMenue
extends CanvasLayer
## Pausenmenü: Weiter, Speichern / Laden über Dateidialog, Steuerung, Ton, Hauptmenü, Beenden.

## Wird vor dem Speichern aufgerufen, damit die Welt Position usw. in den Spielstand schreibt.
var vor_dem_speichern: Callable
var offen := false
var _wurzel: Control
var _menue: VBoxContainer
var _meldung: Label
var _hilfe: PanelContainer
var _ton: Button


func _ready() -> void:
	layer = 10
	process_mode = Node.PROCESS_MODE_ALWAYS
	_wurzel = Stil.wurzel(self)
	var dunkel := ColorRect.new()
	dunkel.color = Color(0, 0, 0, 0.72)
	dunkel.set_anchors_preset(Control.PRESET_FULL_RECT)
	_wurzel.add_child(dunkel)
	var cc := Stil.mitte(_wurzel)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 12)
	cc.add_child(box)
	var titel := Stil.label("PAUSE", 72, Stil.GOLD_HELL, 14, Stil.fett())
	titel.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(titel)
	var zitat := Stil.label("„Die Familie wartet. Aber nicht ewig.“", 22, Color(0.85, 0.85, 0.85), 0, Stil.schreibmaschine())
	zitat.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(zitat)
	_menue = VBoxContainer.new()
	_menue.add_theme_constant_override("separation", 8)
	box.add_child(_menue)
	_menue.add_child(Stil.knopf("Weiter", schliessen, 380))
	_menue.add_child(Stil.knopf("Spiel speichern …", _speichern, 380))
	_menue.add_child(Stil.knopf("Spielstand laden …", _laden, 380))
	_menue.add_child(Stil.knopf("Steuerung", func(): _hilfe.visible = not _hilfe.visible, 380))
	_ton = Stil.knopf("Ton: an", _ton_umschalten, 380)
	_menue.add_child(_ton)
	_menue.add_child(Stil.knopf("Zum Hauptmenü", _hauptmenue, 380))
	_menue.add_child(Stil.knopf("Spiel beenden", func(): get_tree().quit(), 380))
	_meldung = Stil.label("", 20, Stil.GRUEN)
	_meldung.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_meldung.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_meldung.custom_minimum_size.x = 380
	box.add_child(_meldung)
	_hilfe = PanelContainer.new()
	_hilfe.visible = false
	box.add_child(_hilfe)
	_hilfe.add_child(Stil.label(steuerung_text(), 19))
	_wurzel.visible = false


static func steuerung_text() -> String:
	return "W A S D – laufen   ·   Shift – rennen   ·   Leertaste – springen\n" + \
		"Maus – umsehen   ·   Mausrad – Kamera-Abstand\n" + \
		"E – benutzen / sprechen   ·   B oder Tab – Beweisbrett\n" + \
		"Esc – Pause, Speichern und Laden"


func oeffnen() -> void:
	offen = true
	_meldung.text = ""
	_hilfe.visible = false
	_wurzel.visible = true
	get_tree().paused = true
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	Audio.musik_leiser(true)


func schliessen() -> void:
	offen = false
	_wurzel.visible = false
	get_tree().paused = false
	Audio.musik_leiser(false)


func _ton_umschalten() -> void:
	_ton.text = "Ton: aus" if Audio.umschalten_stumm() else "Ton: an"


func _dialog(speichern: bool) -> FileDialog:
	var fd := FileDialog.new()
	fd.file_mode = FileDialog.FILE_MODE_SAVE_FILE if speichern else FileDialog.FILE_MODE_OPEN_FILE
	fd.access = FileDialog.ACCESS_FILESYSTEM
	fd.use_native_dialog = true
	fd.filters = PackedStringArray(["*.pate ; Spielstand DER PATE"])
	fd.title = "Spielstand speichern – Ort selbst wählen (z. B. persönliches Laufwerk)" if speichern else "Spielstand laden"
	fd.process_mode = Node.PROCESS_MODE_ALWAYS
	if speichern:
		fd.current_file = Spielstand.vorschlag_dateiname()
	fd.current_dir = OS.get_system_dir(OS.SYSTEM_DIR_DOCUMENTS)
	fd.canceled.connect(fd.queue_free)
	add_child(fd)
	fd.popup_centered_ratio(0.75)
	return fd


func _speichern() -> void:
	var fd := _dialog(true)
	fd.file_selected.connect(func(pfad: String):
		if vor_dem_speichern.is_valid():
			vor_dem_speichern.call()
		var fehler := Spielstand.speichern(pfad)
		_meldung.add_theme_color_override("font_color", Stil.GRUEN if fehler == "" else Color(1, 0.4, 0.3))
		_meldung.text = ("Gespeichert: " + pfad.get_file()) if fehler == "" else fehler
		fd.queue_free())


func _laden() -> void:
	var fd := _dialog(false)
	fd.file_selected.connect(func(pfad: String):
		fd.queue_free()
		var fehler := Spielstand.laden(pfad)
		if fehler != "":
			_meldung.add_theme_color_override("font_color", Color(1, 0.4, 0.3))
			_meldung.text = fehler
			return
		schliessen()
		Spielstand.ui_zuruecksetzen()
		get_tree().change_scene_to_file("res://szenen/welt/spiel.tscn"))


func _hauptmenue() -> void:
	schliessen()
	Spielstand.ui_zuruecksetzen()
	Audio.musik_an(false)
	get_tree().change_scene_to_file("res://szenen/hauptmenue.tscn")


func _unhandled_input(e: InputEvent) -> void:
	if offen and e.is_action_pressed("pause"):
		schliessen()
		get_viewport().set_input_as_handled()
