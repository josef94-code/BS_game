class_name AufgabenPanel
extends CanvasLayer
## Fenster für die Fachaufgaben einer Mission: eine Aufgabe nach der anderen,
## mit gestuften Tipps, Erklärung und Fortschritt (Abbrechen = später weitermachen).

signal _fertig(alles_geloest: bool)

var _wurzel: Control
var _kopf_titel: Label
var _kopf_info: Label
var _schritt: Label
var _inhalt: ScrollContainer
var _rueckmeldung: PanelContainer
var _rueck_text: RichTextLabel
var _pruefen: Button
var _weiter: Button
var _loesung: Button
var _abbrechen: Button
var _lehrer: Label

var _quest: Dictionary
var _index := 0
var _fehler := 0
var _widget: AufgabeBasis


func _ready() -> void:
	layer = 5
	_wurzel = Stil.wurzel(self)
	var dunkel := ColorRect.new()
	dunkel.color = Color(0, 0, 0, 0.6)
	dunkel.set_anchors_preset(Control.PRESET_FULL_RECT)
	_wurzel.add_child(dunkel)
	var fenster := PanelContainer.new()
	fenster.add_theme_stylebox_override("panel", Stil.box(Color(0.06, 0.05, 0.06, 0.97), Stil.GOLD, 3, 14))
	_wurzel.add_child(fenster)
	Stil.setze(fenster, Control.PRESET_FULL_RECT, 70, 40, -70, -40)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 10)
	fenster.add_child(v)
	# Kopf
	var kopf := HBoxContainer.new()
	v.add_child(kopf)
	var kv := VBoxContainer.new()
	kv.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	kopf.add_child(kv)
	_kopf_titel = Stil.label("", 34, Stil.GOLD_HELL, 6, Stil.fett())
	kv.add_child(_kopf_titel)
	_kopf_info = Stil.label("", 18, Color(0.75, 0.75, 0.75))
	kv.add_child(_kopf_info)
	_schritt = Stil.label("", 24, Color.WHITE, 0, Stil.fett())
	kopf.add_child(_schritt)
	var linie := ColorRect.new()
	linie.color = Stil.GOLD.darkened(0.3)
	linie.custom_minimum_size.y = 2
	v.add_child(linie)
	# Inhalt
	_inhalt = ScrollContainer.new()
	_inhalt.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_inhalt.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(_inhalt)
	# Rückmeldung
	_rueckmeldung = PanelContainer.new()
	_rueckmeldung.visible = false
	v.add_child(_rueckmeldung)
	_rueck_text = RichTextLabel.new()
	_rueck_text.bbcode_enabled = true
	_rueck_text.fit_content = true
	_rueck_text.scroll_active = false
	_rueck_text.add_theme_font_size_override("normal_font_size", 21)
	_rueckmeldung.add_child(_rueck_text)
	_lehrer = Stil.label("", 16, Color(0.6, 0.85, 1.0))
	_lehrer.visible = Spielstand.lehrer
	v.add_child(_lehrer)
	# Knöpfe
	var fuss := HBoxContainer.new()
	fuss.add_theme_constant_override("separation", 14)
	v.add_child(fuss)
	_abbrechen = Stil.knopf("Später weitermachen", _abbruch, 260)
	fuss.add_child(_abbrechen)
	var platz := Control.new()
	platz.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	fuss.add_child(platz)
	_loesung = Stil.knopf("Lösung zeigen", _loesung_zeigen, 220)
	_loesung.visible = false
	fuss.add_child(_loesung)
	_pruefen = Stil.knopf("Prüfen", _pruefen_gedrueckt, 220)
	fuss.add_child(_pruefen)
	_weiter = Stil.knopf("Weiter  ▶", _naechste, 220)
	_weiter.visible = false
	fuss.add_child(_weiter)
	_wurzel.visible = false


## Startet die Aufgaben einer Mission ab Aufgabe Nr. ab (0-basiert).
## Rückgabe: true, wenn alle Aufgaben gelöst sind; false bei Abbruch.
func starte(quest: Dictionary, ab: int) -> bool:
	_quest = quest
	_index = ab
	Spielstand.ui_sperren(true)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_wurzel.visible = true
	_zeige_aufgabe()
	var ok: bool = await _fertig
	_wurzel.visible = false
	Spielstand.ui_sperren(false)
	return ok


func _zeige_aufgabe() -> void:
	var ids: Array = _quest["aufgaben"]
	var id: String = ids[_index]
	var a := Daten.aufgabe(id)
	var w := AufgabenLogik.werte(id, Daten.aufgaben, int(Spielstand.d["saat"]))
	_fehler = 0
	_kopf_titel.text = a.get("titel", id)
	_kopf_info.text = "%s  ·  %s" % [a.get("thema", ""), a.get("lehrplan", "")]
	_schritt.text = "Aufgabe %d / %d" % [_index + 1, ids.size()]
	if _widget:
		_inhalt.remove_child(_widget)
		_widget.queue_free()
	match a.get("typ", "mc"):
		"berechnung": _widget = AufgabeBerechnung.new()
		"sortieren": _widget = AufgabeSortieren.new()
		"fehlersuche": _widget = AufgabeFehlersuche.new()
		"schaltung": _widget = AufgabeSchaltung.new()
		_: _widget = AufgabeMC.new()
	_widget.einrichten(id, a, w)
	_widget.bereit_geaendert.connect(_bereit_pruefen)
	_widget.absenden.connect(func(): if not _pruefen.disabled and _pruefen.visible: _pruefen_gedrueckt())
	_inhalt.add_child(_widget)
	_inhalt.scroll_vertical = 0
	_rueckmeldung.visible = false
	_pruefen.visible = true
	_weiter.visible = false
	_loesung.visible = false
	_abbrechen.disabled = false
	_lehrer.text = "Lehrkraft-Modus – Lösung: " + _widget.loesung_text()
	_bereit_pruefen()


func _bereit_pruefen() -> void:
	_pruefen.disabled = not _widget.bereit_zum_pruefen()


func _pruefen_gedrueckt() -> void:
	var id: String = _widget.id
	var richtig := _widget.pruefen()
	Spielstand.aufgabe_versuch(id, richtig)
	if richtig:
		Audio.spiele("richtig")
		var lob := "Richtig!" if _fehler == 0 else "Jetzt stimmt’s!"
		_melden(true, "[b]%s[/b]  %s" % [lob, _erklaerung()])
		_abschliessen()
	else:
		Audio.spiele("falsch", -4.0)
		_fehler += 1
		var tipps: Array = _widget.a.get("tipps", [])
		var tipp: String = tipps[min(_fehler - 1, tipps.size() - 1)] if tipps.size() > 0 else ""
		var zusatz := _widget.fehler_info()
		var t := "[b]Noch nicht richtig.[/b]  Der Lehrer sagt: „%s“" % tipp
		if zusatz != "":
			t += "\n" + zusatz
		_melden(false, t)
		if _fehler >= 3:
			_loesung.visible = true


func _erklaerung() -> String:
	return AufgabenLogik.text(_widget.a.get("erklaerung", ""), _widget.w, int(_widget.a.get("stellen", 3)))


func _loesung_zeigen() -> void:
	Spielstand.aufgabe_aufgeloest(_widget.id)
	_widget.loesung_zeigen()
	_melden(true, "[b]Lösung:[/b]  " + _erklaerung())
	_abschliessen()


func _abschliessen() -> void:
	_pruefen.visible = false
	_loesung.visible = false
	_weiter.visible = true
	_abbrechen.disabled = true
	_weiter.grab_focus.call_deferred()
	Spielstand.setze_fortschritt(_quest["id"], _index + 1)


func _melden(gut: bool, text: String) -> void:
	_rueckmeldung.visible = true
	var farbe := Stil.GRUEN if gut else Color(1.0, 0.45, 0.35)
	_rueckmeldung.add_theme_stylebox_override("panel", Stil.box(Color(farbe, 0.12), farbe, 2, 8))
	_rueck_text.text = text


func _naechste() -> void:
	_index += 1
	if _index >= _quest["aufgaben"].size():
		_fertig.emit(true)
	else:
		_zeige_aufgabe()


func _abbruch() -> void:
	_fertig.emit(false)


## Lehrkraft-Modus / Autotest: aktuelle Aufgabe richtig lösen und weiter
func automatisch() -> void:
	if not _wurzel.visible:
		return
	if _weiter.visible:
		_naechste()
		return
	_widget.automatisch_loesen()
	_pruefen_gedrueckt()


func ist_offen() -> bool:
	return _wurzel.visible


func _unhandled_input(e: InputEvent) -> void:
	if not _wurzel.visible:
		return
	if Spielstand.lehrer and e is InputEventKey and e.pressed and e.keycode == KEY_F9:
		automatisch()
		get_viewport().set_input_as_handled()
	elif e is InputEventKey and e.pressed and e.keycode == KEY_ENTER and _weiter.visible:
		_naechste()
		get_viewport().set_input_as_handled()
