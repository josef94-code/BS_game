class_name AufgabeBerechnung
extends AufgabeBasis
## Werte berechnen: Zahl eingeben (Komma oder Punkt), Einheit ist vorgegeben

var _eingabe: LineEdit


func _bauen() -> void:
	_frage(a["frage"])
	var zeile := HBoxContainer.new()
	zeile.add_theme_constant_override("separation", 12)
	add_child(zeile)
	var gesucht := Stil.label("Ergebnis:", 26, Stil.GOLD_HELL, 0, Stil.fett())
	zeile.add_child(gesucht)
	_eingabe = LineEdit.new()
	_eingabe.custom_minimum_size = Vector2(240, 54)
	_eingabe.placeholder_text = "z. B. 0,25"
	_eingabe.alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_eingabe.text_changed.connect(func(_t): bereit_geaendert.emit())
	_eingabe.text_submitted.connect(func(_t): absenden.emit())
	zeile.add_child(_eingabe)
	zeile.add_child(Stil.label(a.get("einheit", ""), 30, Color.WHITE, 0, Stil.fett()))
	add_child(Stil.label("Dezimalzahl mit Komma oder Punkt. Rechne möglichst genau (Toleranz %s %%)." %
		AufgabenLogik.zahl_text(float(a.get("toleranz", 0.02)) * 100.0, 1), 17, Color(0.75, 0.75, 0.75)))
	_eingabe.grab_focus.call_deferred()


func bereit_zum_pruefen() -> bool:
	return not is_nan(AufgabenLogik.zahl_lesen(_eingabe.text))


func pruefen() -> bool:
	return AufgabenLogik.zahl_richtig(AufgabenLogik.zahl_lesen(_eingabe.text), float(w["ERG"]), float(a.get("toleranz", 0.02)))


func loesung_zeigen() -> void:
	_eingabe.text = AufgabenLogik.zahl_text(float(w["ERG"]), int(a.get("stellen", 3)))
	_eingabe.editable = false


func automatisch_loesen() -> void:
	_eingabe.text = AufgabenLogik.zahl_text(float(w["ERG"]), int(a.get("stellen", 3)))
	bereit_geaendert.emit()


func loesung_text() -> String:
	return "%s %s" % [AufgabenLogik.zahl_text(float(w["ERG"]), int(a.get("stellen", 3))), a.get("einheit", "")]


func fehler_info() -> String:
	var x := AufgabenLogik.zahl_lesen(_eingabe.text)
	var soll := float(w["ERG"])
	if is_nan(x) or soll == 0.0:
		return ""
	var q := x / soll
	for f in [1000.0, 0.001]:
		if absf(q / f - 1.0) < 0.03:
			return "Deine Zahl ist um den Faktor %s daneben – prüfe die Einheit (z. B. mA ↔ A)." % AufgabenLogik.zahl_text(f, 3)
	return ""
