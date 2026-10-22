class_name AufgabeSchaltung
extends AufgabeBasis
## Schützschaltung vervollständigen: Betriebsmittel in Lücken setzen, im Probelauf testen

var _plan: Schaltplan
var _belegung := {}       # Lücke -> Options-ID
var _auswahl := ""
var _optionen_box: VBoxContainer
var _info: Label
var _band: Label
var _gedrueckt := {}
var _spulen := {}


func _bauen() -> void:
	_frage(a["frage"])
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 22)
	add_child(h)
	_plan = Schaltplan.new()
	_plan.setze_plan(a["schaltplan"])
	var luecken := []
	for el in a["schaltplan"]["elemente"]:
		if el["typ"] == "luecke":
			luecken.append(el["id"])
	_plan.klickbar = luecken
	_plan.angeklickt.connect(_luecke_gewaehlt)
	h.add_child(_plan)

	var rechts := VBoxContainer.new()
	rechts.add_theme_constant_override("separation", 8)
	rechts.custom_minimum_size.x = 470
	h.add_child(rechts)
	_info = Stil.label("1. Klicke eine Lücke (?) im Plan an.", 20, Stil.GOLD_HELL, 0, Stil.fett())
	_info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_info.custom_minimum_size.x = 460
	rechts.add_child(_info)
	_optionen_box = VBoxContainer.new()
	_optionen_box.add_theme_constant_override("separation", 5)
	rechts.add_child(_optionen_box)
	# viele Betriebsmittel: kompaktere Knöpfe, damit der Probelauf sichtbar bleibt
	var kompakt: bool = a["optionen"].size() > 5
	if kompakt:
		_optionen_box.add_theme_constant_override("separation", 3)
	for o in a["optionen"]:
		var b := Stil.knopf(o["text"], _option_gewaehlt.bind(o["id"]))
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.add_theme_font_size_override("font_size", 17 if kompakt else 19)
		b.add_theme_font_override("font", ThemeDB.fallback_font)
		b.custom_minimum_size.y = 32 if kompakt else 40
		b.set_meta("id", o["id"])
		_optionen_box.add_child(b)
	var leeren := Stil.knopf("Lücke leeren", _option_gewaehlt.bind(""))
	leeren.custom_minimum_size.y = 30 if kompakt else 36
	_optionen_box.add_child(leeren)

	# Probelauf
	var probe := PanelContainer.new()
	probe.add_theme_stylebox_override("panel", Stil.box(Color(0.12, 0.1, 0.02, 0.95), Color(0.95, 0.75, 0.1), 2, 8))
	rechts.add_child(probe)
	var pv := VBoxContainer.new()
	probe.add_child(pv)
	pv.add_child(Stil.label("PROBELAUF – Taster gedrückt halten", 17, Color(1.0, 0.85, 0.3), 0, Stil.fett()))
	var ph := GridContainer.new()
	ph.columns = 4 if kompakt else 2
	ph.add_theme_constant_override("h_separation", 10)
	ph.add_theme_constant_override("v_separation", 6)
	pv.add_child(ph)
	var taster: Dictionary = a["logik"].get("taster", {})
	# Reihenfolge wie in der Aufgabe (z. B. AUS links neben EIN)
	for t in taster.keys():
		_gedrueckt[t] = false
		var b := Button.new()
		b.text = taster.get(t, t)
		b.custom_minimum_size = Vector2(108, 44) if kompakt else Vector2(150, 48)
		var beschriftung := String(taster[t])
		var farbe := Color(0.1, 0.55, 0.2)
		if "AUS" in beschriftung:
			farbe = Color(0.7, 0.1, 0.1)
		elif "Test" in beschriftung:
			farbe = Color(0.75, 0.42, 0.05)
		b.add_theme_stylebox_override("normal", Stil.box(farbe, Color.BLACK, 2, 24))
		b.add_theme_stylebox_override("hover", Stil.box(farbe.lightened(0.15), Color.WHITE, 2, 24))
		b.add_theme_stylebox_override("pressed", Stil.box(farbe.darkened(0.3), Color.WHITE, 3, 24))
		b.button_down.connect(_taster.bind(t, true))
		b.button_up.connect(_taster.bind(t, false))
		ph.add_child(b)
	_band = Stil.label("", 20, Color.WHITE, 0, Stil.fett())
	pv.add_child(_band)
	_aktualisieren()


func _luecke_gewaehlt(l: String) -> void:
	_auswahl = l
	_plan.auswahl = l
	_info.text = "2. Wähle das Betriebsmittel für diese Lücke:"
	_aktualisieren()


func _option_gewaehlt(oid: String) -> void:
	if _auswahl == "":
		_info.text = "Zuerst eine Lücke (?) im Plan anklicken!"
		return
	if oid == "":
		_belegung.erase(_auswahl)
	else:
		# Jedes Betriebsmittel nur einmal (außer Drahtbrücke)
		if oid != "BRUECKE":
			for k in _belegung.keys():
				if _belegung[k] == oid:
					_belegung.erase(k)
		_belegung[_auswahl] = oid
	_auswahl = ""
	_plan.auswahl = ""
	_info.text = "1. Klicke eine Lücke (?) im Plan an."
	_aktualisieren()
	bereit_geaendert.emit()


func _taster(t: String, an: bool) -> void:
	_gedrueckt[t] = an
	_simulieren()


func _simulieren() -> void:
	var r := AufgabenLogik.simuliere(a, _belegung, _gedrueckt, _spulen)
	_spulen = r["spulen"]
	_plan.spulen_an = _spulen
	_plan.betaetigt = {}
	# Kontakte im Plan entsprechend darstellen (Lücken und fest eingezeichnete Kontakte)
	for el in a["schaltplan"]["elemente"]:
		var geraet: String = el["id"].get_slice("_", 0)
		if el["typ"] == "luecke":
			if not _belegung.has(el["id"]):
				continue
			geraet = String(_belegung[el["id"]]).get_slice("_", 0)
		elif el["typ"] == "spule":
			continue
		if _gedrueckt.has(geraet):
			_plan.betaetigt[el["id"]] = _gedrueckt[geraet]
		elif _spulen.has(geraet):
			_plan.betaetigt[el["id"]] = _spulen[geraet]
	var anzeige: Dictionary = a["logik"].get("anzeige", {})
	if not r["stabil"]:
		_band.text = "⚠ Ein Schütz flattert! (Kontakt prüfen)"
		_band.add_theme_color_override("font_color", Color(1.0, 0.4, 0.3))
		return
	var an := []
	var namen: Array = _spulen.keys()
	namen.sort()
	for sp in namen:
		if _spulen[sp]:
			an.append("-%s  →  %s" % [sp, anzeige.get(sp, "Band LÄUFT")])
	if an.is_empty():
		_band.text = "Alle Schütze abgefallen  →  %s" % anzeige.get("aus", "Band steht")
		_band.add_theme_color_override("font_color", Color(0.85, 0.85, 0.85))
	else:
		_band.text = "\n".join(an)
		_band.add_theme_color_override("font_color", Stil.GRUEN)
	_plan.queue_redraw()


func _aktualisieren() -> void:
	var opt := {}
	for o in a["optionen"]:
		opt[o["id"]] = o
	_plan.belegung = {}
	for l in _belegung:
		_plan.belegung[l] = opt[_belegung[l]]
	for b in _optionen_box.get_children():
		if b.has_meta("id"):
			(b as Button).disabled = _auswahl == ""
	_spulen = {}
	_simulieren()


func bereit_zum_pruefen() -> bool:
	return _belegung.size() == _plan.klickbar.size()


func pruefen() -> bool:
	return AufgabenLogik.schaltung_richtig(a, _belegung)


func fehler_info() -> String:
	var zeilen := ["Prüfprotokoll:"]
	for r in AufgabenLogik.pruefe_schaltung(a, _belegung):
		zeilen.append(("✔ " if r["ok"] else "✘ ") + r["text"])
	return "\n".join(zeilen)


func loesung_zeigen() -> void:
	_belegung = a.get("loesung_belegung", {}).duplicate()
	_plan.klickbar = []
	_aktualisieren()


func automatisch_loesen() -> void:
	_belegung = a.get("loesung_belegung", {}).duplicate()
	_aktualisieren()
	bereit_geaendert.emit()


func loesung_text() -> String:
	var t := []
	for k in a.get("loesung_belegung", {}):
		t.append("%s = %s" % [k, a["loesung_belegung"][k]])
	return ", ".join(t)
