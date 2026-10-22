class_name AufgabeMC
extends AufgabeBasis
## Multiple Choice: eine oder mehrere richtige Antworten

var _knoepfe: Array[BaseButton] = []
var _reihenfolge: Array = []
var _richtig: Array[int] = []


func _bauen() -> void:
	_frage(a["frage"])
	for r in a.get("richtig", []):
		_richtig.append(int(r))
	var mehrfach: bool = a.get("richtig", []).size() > 1
	if mehrfach:
		add_child(Stil.label("Mehrere Antworten können richtig sein.", 18, Color(0.8, 0.8, 0.8)))
	var gruppe := ButtonGroup.new()
	gruppe.allow_unpress = false
	var n: int = a["optionen"].size()
	_reihenfolge = range(n)
	if a.get("mischen", true):
		var rng := RandomNumberGenerator.new()
		rng.seed = hash(id) ^ int(Spielstand.d["saat"])
		for i in range(n - 1, 0, -1):
			var j := rng.randi_range(0, i)
			var t = _reihenfolge[i]
			_reihenfolge[i] = _reihenfolge[j]
			_reihenfolge[j] = t
	var buchstaben := "ABCDEFGH"
	for k in n:
		var idx: int = _reihenfolge[k]
		var b := Button.new()
		b.toggle_mode = true
		if not mehrfach:
			b.button_group = gruppe
		b.text = "%s)  %s" % [buchstaben[k], a["optionen"][idx]]
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		b.custom_minimum_size = Vector2(1000, 54)
		b.add_theme_font_size_override("font_size", 21)
		b.add_theme_font_override("font", ThemeDB.fallback_font)
		b.toggled.connect(func(_an): Audio.spiele("auswahl", -10.0); bereit_geaendert.emit())
		b.set_meta("index", idx)
		add_child(b)
		_knoepfe.append(b)


func _gewaehlt() -> Array:
	var g := []
	for b in _knoepfe:
		if b.button_pressed:
			g.append(int(b.get_meta("index")))
	return g


func bereit_zum_pruefen() -> bool:
	return not _gewaehlt().is_empty()


func pruefen() -> bool:
	return AufgabenLogik.mc_richtig(a, _gewaehlt())


func loesung_zeigen() -> void:
	for b in _knoepfe:
		var richtig := _richtig.has(int(b.get_meta("index")))
		b.button_pressed = richtig
		if richtig:
			b.add_theme_stylebox_override("normal", Stil.box(Color(0.1, 0.35, 0.12), Stil.GRUEN, 2, 6))
			b.add_theme_stylebox_override("pressed", Stil.box(Color(0.1, 0.4, 0.12), Stil.GRUEN, 3, 6))
		b.disabled = true


func automatisch_loesen() -> void:
	for b in _knoepfe:
		b.button_pressed = _richtig.has(int(b.get_meta("index")))


func loesung_text() -> String:
	var t := []
	for k in _knoepfe.size():
		if _richtig.has(int(_knoepfe[k].get_meta("index"))):
			t.append("ABCDEFGH"[k])
	return ", ".join(t)
