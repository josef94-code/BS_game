extends Node
## Lädt alle Spieldaten aus daten/*.json (Aufgaben, Quests, Dialoge, Beweise, Radio).
## Die JSON-Dateien können ohne Programmierkenntnisse geändert werden: Liegt neben der
## DerPate.exe ein Ordner "daten" mit einer dieser Dateien, wird diese statt der eingebauten benutzt.

var aufgaben := {}
var quests := []
var quest_info := {}
var dialoge := {}
var beweise := {}
var radio := {}


func _ready() -> void:
	aufgaben = _lade_daten("aufgaben.json")
	aufgaben.erase("_info")
	quest_info = _lade_daten("quests.json")
	quests = quest_info.get("quests", [])
	dialoge = _lade_daten("dialoge.json")
	beweise = _lade_daten("beweise.json")
	radio = _lade_daten("radio.json")


## Externe Datei neben der .exe hat Vorrang; ist sie fehlerhaft, gilt die eingebaute.
func _lade_daten(name: String) -> Dictionary:
	if OS.has_feature("template"):
		var extern := OS.get_executable_path().get_base_dir().path_join("daten").path_join(name)
		if FileAccess.file_exists(extern):
			var d := lade(extern)
			if not d.is_empty():
				print("Externe Daten benutzt: ", extern)
				return d
			push_warning("Externe Datei fehlerhaft, benutze eingebaute: " + extern)
	return lade("res://daten/" + name)


static func lade(pfad: String) -> Dictionary:
	var f := FileAccess.open(pfad, FileAccess.READ)
	if f == null:
		push_error("Datei fehlt: " + pfad)
		return {}
	var j := JSON.new()
	if j.parse(f.get_as_text()) != OK:
		push_error("JSON-Fehler in %s, Zeile %d: %s" % [pfad, j.get_error_line(), j.get_error_message()])
		return {}
	return j.data


func aufgabe(id: String) -> Dictionary:
	return aufgaben.get(id, {})


func quest(id: String) -> Dictionary:
	for q in quests:
		if q["id"] == id:
			return q
	return {}


func dialog(id: String) -> Array:
	return dialoge.get(id, [])


func sprecher(id: String) -> Dictionary:
	return dialoge.get("sprecher", {}).get(id, {"name": id, "farbe": "#ffffff"})


func beweis(id: String) -> Dictionary:
	return beweise.get("beweise", {}).get(id, {})


func sammelobjekt(id: String) -> Dictionary:
	return beweise.get("sammel", {}).get(id, {})


func raenge() -> Array:
	return quest_info.get("raenge", [])


func rang_fuer(ruf: int) -> Dictionary:
	var r: Dictionary = raenge()[0]
	for x in raenge():
		if ruf >= int(x["ab"]):
			r = x
	return r


func naechster_rang(ruf: int) -> Dictionary:
	for x in raenge():
		if ruf < int(x["ab"]):
			return x
	return {}
