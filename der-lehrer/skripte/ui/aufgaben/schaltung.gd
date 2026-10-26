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
var _zeit_laeuft := {}    # Zeitrelais, deren Verzögerungszeit gerade läuft
var _zeit_nr := {}        # Zeitrelais -> Zähler, damit abgebrochene Verzögerungen nichts mehr auslösen


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
	var eng: bool = a["optionen"].size() > 6 or a["logik"].get("taster", {}).size() > 4
	if kompakt:
		_optionen_box.add_theme_constant_override("separation", 3)
	for o in a["optionen"]:
		var b := Stil.knopf(o["text"], _option_gewaehlt.bind(o["id"]))
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.add_theme_font_size_override("font_size", 15 if eng else (17 if kompakt else 19))
		b.add_theme_font_override("font", ThemeDB.fallback_font)
		b.custom_minimum_size.y = 27 if eng else (32 if kompakt else 40)
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
		b.custom_minimum_size = Vector2(108, 38 if eng else 44) if kompakt else Vector2(150, 48)
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
	_zeit_pruefen()
	var zeiten := AufgabenLogik.zeitrelais(a)
	_plan.spulen_an = _spulen
	_plan.betaetigt = {}
	# Kontakte im Plan entsprechend darstellen (Lücken und fest eingezeichnete Kontakte)
	for el in a["schaltplan"]["elemente"]:
		var geraet: String = el["id"].get_slice("_", 0)
		if el["typ"] == "luecke":
			if not _belegung.has(el["id"]):
				continue
			geraet = String(_belegung[el["id"]]).get_slice("_", 0)
		elif el["typ"] in ["spule", "spule_verz"]:
			continue
		if zeiten.has(geraet):
			# verzögerter Kontakt: schaltet erst nach Ablauf der Zeit
			_plan.betaetigt[el["id"]] = _spulen.get(geraet, false) and _gedrueckt.get(geraet + "_T", false)
		elif _gedrueckt.has(geraet):
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
		if _spulen[sp] and _zeit_laeuft.has(sp):
			an.append("-%s  →  Zeit läuft (%s s) …" % [sp, AufgabenLogik.zahl_text(float(zeiten[sp]))])
		elif _spulen[sp]:
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
	for z in AufgabenLogik.zeitrelais(a):
		_gedrueckt[z + "_T"] = false
		_zeit_nr[z] = int(_zeit_nr.get(z, 0)) + 1
	_zeit_laeuft.clear()
	_simulieren()


## Zeitrelais: Zieht die Spule an, läuft die Verzögerungszeit; fällt sie ab, öffnen die verzögerten Kontakte sofort.
func _zeit_pruefen() -> void:
	var zeiten := AufgabenLogik.zeitrelais(a)
	for z in zeiten:
		if _spulen.get(z, false):
			if not _gedrueckt.get(z + "_T", false) and not _zeit_laeuft.has(z):
				_zeit_laeuft[z] = true
				get_tree().create_timer(float(zeiten[z])).timeout.connect(_zeit_um.bind(z, int(_zeit_nr.get(z, 0))))
		else:
			_gedrueckt[z + "_T"] = false
			if _zeit_laeuft.has(z):
				_zeit_laeuft.erase(z)
				_zeit_nr[z] = int(_zeit_nr.get(z, 0)) + 1


func _zeit_um(z: String, nr: int) -> void:
	if not is_inside_tree() or nr != int(_zeit_nr.get(z, 0)):
		return
	_zeit_laeuft.erase(z)
	if _spulen.get(z, false):
		_gedrueckt[z + "_T"] = true
		Audio.spiele("klick", -8.0)
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
