class_name AufgabeSortieren
extends AufgabeBasis
## Reihenfolge herstellen (mit Pfeil-Knöpfen)

var _liste: VBoxContainer
var _reihe: Array = []


func _bauen() -> void:
	_frage(a["frage"])
	_liste = VBoxContainer.new()
	_liste.add_theme_constant_override("separation", 6)
	add_child(_liste)
	_reihe = a["elemente"].duplicate()
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(id) ^ int(Spielstand.d["saat"])
	while _reihe == a["elemente"]:
		for i in range(_reihe.size() - 1, 0, -1):
			var j := rng.randi_range(0, i)
			var t = _reihe[i]
			_reihe[i] = _reihe[j]
			_reihe[j] = t
	_zeichnen()


func _zeichnen(farbe: Color = Color(0, 0, 0, 0)) -> void:
	for c in _liste.get_children():
		_liste.remove_child(c)
		c.queue_free()
	for i in _reihe.size():
		var zeile := PanelContainer.new()
		var rand := farbe if farbe.a > 0 else Stil.GOLD.darkened(0.4)
		zeile.add_theme_stylebox_override("panel", Stil.box(Color(0.12, 0.1, 0.1), rand, 2, 6))
		var h := HBoxContainer.new()
		h.add_theme_constant_override("separation", 10)
		zeile.add_child(h)
		h.add_child(Stil.label("%d." % (i + 1), 24, Stil.GOLD_HELL, 0, Stil.fett()))
		var l := Stil.label(_reihe[i], 22)
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		h.add_child(l)
		var hoch := Stil.knopf("▲", _schiebe.bind(i, -1), 54)
		hoch.disabled = i == 0 or farbe.a > 0
		h.add_child(hoch)
		var runter := Stil.knopf("▼", _schiebe.bind(i, 1), 54)
		runter.disabled = i == _reihe.size() - 1 or farbe.a > 0
		h.add_child(runter)
		_liste.add_child(zeile)


func _schiebe(i: int, d: int) -> void:
	var j := i + d
	if j < 0 or j >= _reihe.size():
		return
	var t = _reihe[i]
	_reihe[i] = _reihe[j]
	_reihe[j] = t
	_zeichnen()
	bereit_geaendert.emit()


func pruefen() -> bool:
	return AufgabenLogik.sortieren_richtig(a, _reihe)


func loesung_zeigen() -> void:
	_reihe = a["elemente"].duplicate()
	_zeichnen(Stil.GRUEN)


func automatisch_loesen() -> void:
	_reihe = a["elemente"].duplicate()
	_zeichnen()


func loesung_text() -> String:
	return "siehe Erklärung"


func fehler_info() -> String:
	var n := 0
	for i in _reihe.size():
		if _reihe[i] == a["elemente"][i]:
			n += 1
	return "%d von %d Schritten stehen schon an der richtigen Stelle." % [n, _reihe.size()]
