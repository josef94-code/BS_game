class_name AufgabeFehlersuche
extends AufgabeBasis
## Fehlersuche am Stromlaufplan: Betriebsmittel anklicken, Messwerte lesen, Fehler benennen

var _plan: Schaltplan
var _name: Label
var _messung: Label
var _gewaehlt := ""
var _angesehen := {}


func _bauen() -> void:
	_frage(a["frage"])
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 22)
	add_child(h)
	_plan = Schaltplan.new()
	_plan.setze_plan(a["schaltplan"])
	_plan.klickbar = a["bauteile"].keys()
	_plan.angeklickt.connect(_waehle)
	h.add_child(_plan)
	var rechts := PanelContainer.new()
	rechts.add_theme_stylebox_override("panel", Stil.box(Color(0.02, 0.06, 0.04, 0.95), Color(0.3, 0.8, 0.45), 2, 8))
	rechts.custom_minimum_size = Vector2(440, 300)
	rechts.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	h.add_child(rechts)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 10)
	rechts.add_child(v)
	v.add_child(Stil.label("MESSGERÄT", 20, Color(0.4, 1.0, 0.55), 0, Stil.fett()))
	_name = Stil.label("Klicke ein Betriebsmittel im Plan an.", 22, Color.WHITE, 0, Stil.fett())
	_name.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_name.custom_minimum_size.x = 400
	v.add_child(_name)
	_messung = Stil.label("", 20, Color(0.75, 1.0, 0.8))
	_messung.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_messung.custom_minimum_size.x = 400
	v.add_child(_messung)
	v.add_child(Stil.label("Fehler gefunden? Betriebsmittel auswählen\nund unten auf „Prüfen“ klicken.", 16, Color(0.7, 0.7, 0.7)))


func _waehle(bm: String) -> void:
	_gewaehlt = bm
	_angesehen[bm] = true
	_plan.auswahl = bm
	_plan.queue_redraw()
	var info: Dictionary = a["bauteile"][bm]
	_name.text = info["name"]
	_messung.text = info["messung"]
	bereit_geaendert.emit()


func bereit_zum_pruefen() -> bool:
	return _gewaehlt != ""


func pruefen() -> bool:
	return bool(a["bauteile"][_gewaehlt].get("fehler", false))


func _fehler_id() -> String:
	for k in a["bauteile"]:
		if a["bauteile"][k].get("fehler", false):
			return k
	return ""


func loesung_zeigen() -> void:
	var f := _fehler_id()
	_waehle(f)
	_plan.markiert = {f: Color(0.9, 0.1, 0.1)}
	_plan.klickbar = []
	_plan.queue_redraw()


func automatisch_loesen() -> void:
	_waehle(_fehler_id())


func loesung_text() -> String:
	return a["bauteile"][_fehler_id()]["name"]


func fehler_info() -> String:
	if _angesehen.size() < a["bauteile"].size():
		return "Du hast erst %d von %d Betriebsmitteln gemessen." % [_angesehen.size(), a["bauteile"].size()]
	return ""
