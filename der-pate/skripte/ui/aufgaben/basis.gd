class_name AufgabeBasis
extends VBoxContainer
## Gemeinsame Grundlage aller Aufgabentypen.

signal bereit_geaendert
signal absenden

var id := ""
var a: Dictionary = {}
var w: Dictionary = {}


func einrichten(p_id: String, p_a: Dictionary, p_w: Dictionary) -> void:
	id = p_id
	a = p_a
	w = p_w
	add_theme_constant_override("separation", 14)
	size_flags_vertical = Control.SIZE_EXPAND_FILL
	_bauen()


func _bauen() -> void:
	pass


func _frage(text: String) -> RichTextLabel:
	var r := RichTextLabel.new()
	r.bbcode_enabled = true
	r.fit_content = true
	r.scroll_active = false
	r.add_theme_font_size_override("normal_font_size", 24)
	r.text = AufgabenLogik.text(text, w, int(a.get("stellen", 3)))
	r.custom_minimum_size.x = 1000
	add_child(r)
	return r


func bereit_zum_pruefen() -> bool:
	return true


func pruefen() -> bool:
	return false


func loesung_zeigen() -> void:
	pass


func automatisch_loesen() -> void:
	pass


## Kurzlösung für die Lehrkraft
func loesung_text() -> String:
	return ""


## Rückmeldung nach falscher Antwort (zusätzlich zum Tipp), z. B. Prüfprotokoll
func fehler_info() -> String:
	return ""
