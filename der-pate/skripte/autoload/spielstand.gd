extends Node
## Spielstand: Ruf, Quests, Beweise, Sammelobjekte, Position.
## Gespeichert wird als kleine JSON-Datei (*.pate) an einem Ort, den der Schüler selbst wählt.

signal ruf_geaendert(alt: int, neu: int)
signal beweis_gefunden(id: String)
signal sammel_gefunden(id: String)
signal geaendert

const VERSION := 1
const ENDUNG := "pate"

var d := {}
## Wird beim Laden aus dem Hauptmenü gesetzt; die Welt übernimmt dann Position usw.
var geladen := false
var lehrer := false
var autotest := false
var _ui_sperren := 0


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	var args := OS.get_cmdline_args() + OS.get_cmdline_user_args()
	lehrer = args.has("--lehrer")
	autotest = args.has("--autotest")
	_tasten_einrichten()
	neu("Neuer")


func neu(name: String) -> void:
	d = {
		"spiel": "der-pate",
		"version": VERSION,
		"name": name,
		"ruf": 0,
		"saat": randi() % 1000000,
		"quests": {},
		"fortschritt": {},
		"statistik": {},
		"beweise": [],
		"sammel": [],
		"intro_gesehen": false,
		"pos": [],
		"blick": 0.0,
		"spielzeit": 0.0,
		"uhrzeit": 21.0 * 60.0 + 30.0,
	}
	geladen = false


func _process(delta: float) -> void:
	if not get_tree().paused:
		d["spielzeit"] = float(d.get("spielzeit", 0.0)) + delta
		# Spieluhr: eine Spielminute pro Sekunde (wie bei GTA)
		d["uhrzeit"] = fmod(float(d.get("uhrzeit", 1290.0)) + delta, 1440.0)


# ---------------------------------------------------------------- Quests

func quest_status(id: String) -> String:
	return d["quests"].get(id, "offen")


func setze_quest_status(id: String, status: String) -> void:
	d["quests"][id] = status
	geaendert.emit()


## Erste Quest, die noch nicht erledigt ist (oder {} wenn alle fertig)
func aktuelle_quest() -> Dictionary:
	for q in Daten.quests:
		if quest_status(q["id"]) != "erledigt":
			return q
	return {}


func alle_quests_erledigt() -> bool:
	return aktuelle_quest().is_empty()


func fortschritt(quest_id: String) -> int:
	return int(d["fortschritt"].get(quest_id, 0))


func setze_fortschritt(quest_id: String, n: int) -> void:
	d["fortschritt"][quest_id] = n


## Statistik je Aufgabe (für die Lehrkraft: Versuche, gelöst)
func aufgabe_versuch(id: String, richtig: bool) -> void:
	var s: Dictionary = d["statistik"].get(id, {"versuche": 0, "geloest": false, "erster_versuch": false})
	s["versuche"] = int(s["versuche"]) + 1
	if richtig and not s["geloest"]:
		s["geloest"] = true
		s["erster_versuch"] = int(s["versuche"]) == 1
	d["statistik"][id] = s


func aufgabe_aufgeloest(id: String) -> void:
	var s: Dictionary = d["statistik"].get(id, {"versuche": 0, "geloest": false, "erster_versuch": false})
	s["geloest"] = true
	s["aufgeloest"] = true
	d["statistik"][id] = s


func erster_versuch(id: String) -> bool:
	return bool(d["statistik"].get(id, {}).get("erster_versuch", false))


# ---------------------------------------------------------------- Ruf

func ruf() -> int:
	return int(d["ruf"])


func ruf_dazu(n: int) -> void:
	var alt := ruf()
	d["ruf"] = alt + n
	ruf_geaendert.emit(alt, ruf())
	geaendert.emit()


func rang() -> String:
	return Daten.rang_fuer(ruf())["name"]


# ---------------------------------------------------------------- Beweise & Sammelobjekte

func hat_beweis(id: String) -> bool:
	return d["beweise"].has(id)


func beweis_dazu(id: String) -> void:
	if not hat_beweis(id):
		d["beweise"].append(id)
		beweis_gefunden.emit(id)
		geaendert.emit()


func hat_sammel(id: String) -> bool:
	return d["sammel"].has(id)


func sammel_dazu(id: String) -> void:
	if not hat_sammel(id):
		d["sammel"].append(id)
		sammel_gefunden.emit(id)
		geaendert.emit()


# ---------------------------------------------------------------- Speichern / Laden

func speichern(pfad: String) -> String:
	if not pfad.get_extension().to_lower() == ENDUNG:
		pfad += "." + ENDUNG
	d["gespeichert"] = Time.get_datetime_string_from_system(false, true)
	var f := FileAccess.open(pfad, FileAccess.WRITE)
	if f == null:
		return "Speichern fehlgeschlagen (%s). Hast du an diesem Ort Schreibrechte?" % error_string(FileAccess.get_open_error())
	f.store_string(JSON.stringify(d, "  "))
	f.close()
	return ""


## Gibt "" zurück, wenn alles geklappt hat, sonst eine Fehlermeldung.
func laden(pfad: String) -> String:
	var f := FileAccess.open(pfad, FileAccess.READ)
	if f == null:
		return "Datei konnte nicht geöffnet werden."
	var j := JSON.new()
	if j.parse(f.get_as_text()) != OK or not (j.data is Dictionary):
		return "Das ist keine gültige Spielstand-Datei."
	var neu_d: Dictionary = j.data
	if neu_d.get("spiel", "") != "der-pate":
		return "Diese Datei gehört nicht zu DER PATE."
	# fehlende Felder (ältere Versionen) mit Standardwerten auffüllen
	neu("x")
	for k in d.keys():
		if neu_d.has(k):
			d[k] = neu_d[k]
	d["ruf"] = int(d["ruf"])
	d["saat"] = int(d["saat"])
	geladen = true
	geaendert.emit()
	return ""


func vorschlag_dateiname() -> String:
	var n: String = String(d.get("name", "spieler")).to_lower().validate_filename().replace(" ", "_")
	return "pate_%s.%s" % [n, ENDUNG]


# ---------------------------------------------------------------- Oberfläche / Eingabe

func ui_sperren(an: bool) -> void:
	_ui_sperren = max(0, _ui_sperren + (1 if an else -1))


func ui_offen() -> bool:
	return _ui_sperren > 0


func ui_zuruecksetzen() -> void:
	_ui_sperren = 0


func _tasten_einrichten() -> void:
	var belegung := {
		"vor": [KEY_W, KEY_UP],
		"zurueck": [KEY_S, KEY_DOWN],
		"links": [KEY_A, KEY_LEFT],
		"rechts": [KEY_D, KEY_RIGHT],
		"rennen": [KEY_SHIFT],
		"springen": [KEY_SPACE],
		"interagieren": [KEY_E],
		"beweisbrett": [KEY_B, KEY_TAB],
		"pause": [KEY_ESCAPE, KEY_P],
		"weiter": [KEY_E, KEY_SPACE, KEY_ENTER],
	}
	for aktion in belegung:
		if not InputMap.has_action(aktion):
			InputMap.add_action(aktion)
		for taste in belegung[aktion]:
			var ev := InputEventKey.new()
			ev.physical_keycode = taste
			InputMap.action_add_event(aktion, ev)
