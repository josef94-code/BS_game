class_name Schaltplan
extends Control
## Zeichnet einen Stromlaufplan in aufgelöster Darstellung (senkrechte Strompfade)
## aus den Daten in aufgaben.json. Betriebsmittel und Lücken sind anklickbar.

signal angeklickt(id: String)

const MAX_HOEHE := 370.0
const RAND := Vector2(90.0, 46.0)
const LINIE := Color(0.08, 0.08, 0.1)
const BREITE := 2.6

var plan: Dictionary = {}
## Lücken-ID -> Options-Dictionary (für Schaltungsaufgaben)
var belegung := {}
## Element-ID -> true, wenn der Kontakt betätigt ist (für den Probelauf)
var betaetigt := {}
## Spule (Element-ID) -> angezogen?
var spulen_an := {}
var auswahl := ""
## Welche Element-IDs anklickbar sind
var klickbar: Array = []
var markiert := {}   # id -> Color (z. B. grün/rot nach dem Prüfen)
var _hover := ""
var raster := 72.0


func setze_plan(p: Dictionary) -> void:
	plan = p
	raster = minf(72.0, MAX_HOEHE / float(p["hoehe"]))
	custom_minimum_size = Vector2(float(p["breite"]) * raster + RAND.x * 1.6, float(p["hoehe"]) * raster + RAND.y * 2.0)
	queue_redraw()


func _punkt(x: float, y: float) -> Vector2:
	return RAND + Vector2(x * raster, y * raster)


func _element_rect(el: Dictionary) -> Rect2:
	var p := _punkt(float(el["x"]), float(el["y"]))
	return Rect2(p.x - raster * 0.55, p.y + 4, raster * 1.1, raster - 8)


func _gui_input(e: InputEvent) -> void:
	if e is InputEventMouseMotion:
		var h := _treffer(e.position)
		if h != _hover:
			_hover = h
			mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if h != "" else Control.CURSOR_ARROW
			queue_redraw()
	elif e is InputEventMouseButton and e.pressed and e.button_index == MOUSE_BUTTON_LEFT:
		var id := _treffer(e.position)
		if id != "":
			Audio.spiele("auswahl", -8.0)
			angeklickt.emit(id)


func _treffer(pos: Vector2) -> String:
	for el in plan.get("elemente", []):
		if klickbar.has(el["id"]) and _element_rect(el).has_point(pos):
			return el["id"]
	return ""


func _draw() -> void:
	if plan.is_empty():
		return
	draw_rect(Rect2(Vector2.ZERO, size), Stil.PAPIER)
	# Rasterpunkte wie auf Karopapier
	var gx := 0.0
	while gx < size.x:
		var gy := 0.0
		while gy < size.y:
			draw_rect(Rect2(gx, gy, 1.5, 1.5), Color(0.75, 0.72, 0.65))
			gy += 18.0
		gx += 18.0
	draw_rect(Rect2(Vector2.ZERO, size), Color(0.3, 0.25, 0.2), false, 2.0)
	var f := Stil.fett()
	var breite := float(plan["breite"])
	# Schienen (L1 oben, N unten)
	for s in plan.get("schienen", []):
		var y := float(s["y"])
		var a := _punkt(0.4, y)
		var b := _punkt(breite - 0.4, y)
		draw_line(a, b, LINIE, BREITE + 1.0)
		draw_string(f, a + Vector2(-46, 8), s["text"], HORIZONTAL_ALIGNMENT_LEFT, -1, 22, LINIE)
	# Leitungen
	for l in plan.get("leitungen", []):
		for i in range(l.size() - 1):
			draw_line(_punkt(l[i][0], l[i][1]), _punkt(l[i + 1][0], l[i + 1][1]), LINIE, BREITE)
	# Verbindungspunkte an Abzweigen
	for l in plan.get("leitungen", []):
		for p in l:
			if _ist_abzweig(p):
				draw_circle(_punkt(p[0], p[1]), 4.5, LINIE)
	# Betriebsmittel
	for el in plan.get("elemente", []):
		var r := _element_rect(el)
		if markiert.has(el["id"]):
			draw_rect(r.grow(2), Color(markiert[el["id"]], 0.25))
		if el["id"] == auswahl:
			draw_rect(r.grow(3), Color(1.0, 0.75, 0.1, 0.35))
			draw_rect(r.grow(3), Color(0.85, 0.55, 0.0), false, 2.5)
		elif el["id"] == _hover:
			draw_rect(r.grow(2), Color(0.3, 0.55, 1.0, 0.15))
		var typ: String = el["typ"]
		var bez: String = el.get("bez", "")
		var kl: String = el.get("kl", "")
		if typ == "luecke":
			if belegung.has(el["id"]):
				var o: Dictionary = belegung[el["id"]]
				typ = o["symbol"]
				bez = o.get("bez", "")
				kl = o.get("kl", "")
			else:
				_luecke(el)
				continue
		var oben := _punkt(float(el["x"]), float(el["y"]))
		var unten := _punkt(float(el["x"]), float(el["y"]) + 1.0)
		var zu := _ist_geschlossen(el["id"], typ)
		_symbol(typ, oben, unten, zu, bool(spulen_an.get(el["id"], false)))
		if bez != "":
			var bs := f.get_string_size(bez, HORIZONTAL_ALIGNMENT_LEFT, -1, 19)
			var mit_antrieb := typ.begins_with("taster") or typ in ["zeit_no", "mschutz_nc", "nothalt_nc"]
			var links := 50.0 if mit_antrieb else 22.0
			var hoehe := 0.3 if mit_antrieb else 0.55
			draw_string(f, Vector2(oben.x - links - bs.x, oben.y + (unten.y - oben.y) * hoehe + 6), bez, HORIZONTAL_ALIGNMENT_LEFT, -1, 19, Color(0.1, 0.15, 0.45))
		if kl != "":
			draw_string(ThemeDB.fallback_font, Vector2(oben.x + 16, (oben.y + unten.y) * 0.5 + 24), kl, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(0.3, 0.3, 0.3))


func _ist_abzweig(p: Array) -> bool:
	# Punkt, an dem mindestens drei Leitungsenden oder ein Ende auf einer Linie zusammentreffen
	var enden := []
	for l in plan.get("leitungen", []):
		enden.append(l[0])
		enden.append(l[l.size() - 1])
	for el in plan.get("elemente", []):
		enden.append([el["x"], el["y"]])
		enden.append([el["x"], float(el["y"]) + 1.0])
	var n := 0
	for q in enden:
		if is_equal_approx(float(q[0]), float(p[0])) and is_equal_approx(float(q[1]), float(p[1])):
			n += 1
	return n >= 3


func _ist_geschlossen(id: String, typ: String) -> bool:
	var b: bool = betaetigt.get(id, false)
	if typ == "luecke":
		return false
	match typ:
		"schliesser", "taster_no", "zeit_no":
			return b
		"oeffner", "taster_nc", "mschutz_nc", "nothalt_nc":
			return not b
	return true


func _luecke(el: Dictionary) -> void:
	var r := _element_rect(el)
	var farbe := Color(0.15, 0.35, 0.85)
	var p := r.position
	var s := r.size
	# gestrichelter Rahmen
	var stuecke := [[p, p + Vector2(s.x, 0)], [p + Vector2(s.x, 0), p + s], [p + s, p + Vector2(0, s.y)], [p + Vector2(0, s.y), p]]
	for st in stuecke:
		draw_dashed_line(st[0], st[1], farbe, 2.0, 7.0)
	var f := Stil.fett()
	var t := "?"
	var ts := f.get_string_size(t, HORIZONTAL_ALIGNMENT_LEFT, -1, 30)
	draw_string(f, r.get_center() + Vector2(-ts.x * 0.5, 10), t, HORIZONTAL_ALIGNMENT_LEFT, -1, 30, farbe)
	# Anschlussleitungen bis an die Lücke
	var oben := _punkt(float(el["x"]), float(el["y"]))
	draw_line(oben, oben + Vector2(0, 4), LINIE, BREITE)


# ---------------------------------------------------------------- Symbole (DIN EN 60617)

func _symbol(typ: String, oben: Vector2, unten: Vector2, zu: bool, spule_an: bool = false) -> void:
	var l := unten.y - oben.y
	var cx := oben.x
	var a := Vector2(cx, oben.y + l * 0.3)   # oberer Festkontakt
	var b := Vector2(cx, oben.y + l * 0.72)  # unterer Anschluss des beweglichen Kontakts
	match typ:
		"leitung":
			draw_line(oben, unten, LINIE, BREITE)
		"sicherung":
			draw_line(oben, Vector2(cx, oben.y + l * 0.25), LINIE, BREITE)
			draw_line(Vector2(cx, oben.y + l * 0.75), unten, LINIE, BREITE)
			draw_rect(Rect2(cx - 8, oben.y + l * 0.25, 16, l * 0.5), LINIE, false, BREITE)
			draw_line(Vector2(cx, oben.y + l * 0.25), Vector2(cx, oben.y + l * 0.75), LINIE, 1.5)
		"spule":
			draw_line(oben, Vector2(cx, oben.y + l * 0.3), LINIE, BREITE)
			draw_line(Vector2(cx, oben.y + l * 0.7), unten, LINIE, BREITE)
			var r := Rect2(cx - 24, oben.y + l * 0.3, 48, l * 0.4)
			if spule_an:
				draw_rect(r, Color(1.0, 0.7, 0.1))
			draw_rect(r, LINIE, false, BREITE)
		"glocke":
			draw_line(oben, Vector2(cx, oben.y + l * 0.35), LINIE, BREITE)
			var m := Vector2(cx, oben.y + l * 0.62)
			draw_arc(m, 17.0, PI, TAU, 20, LINIE, BREITE)
			draw_line(m + Vector2(-19, 0), m + Vector2(19, 0), LINIE, BREITE)
			draw_line(Vector2(cx, m.y), unten, LINIE, BREITE)
		"leuchte":
			var m := (oben + unten) * 0.5
			draw_line(oben, m - Vector2(0, 14), LINIE, BREITE)
			draw_line(m + Vector2(0, 14), unten, LINIE, BREITE)
			draw_arc(m, 14.0, 0, TAU, 24, LINIE, BREITE)
			draw_line(m + Vector2(-10, -10), m + Vector2(10, 10), LINIE, BREITE)
			draw_line(m + Vector2(-10, 10), m + Vector2(10, -10), LINIE, BREITE)
		"schliesser", "taster_no", "zeit_no":
			draw_line(oben, a, LINIE, BREITE)
			draw_line(b, unten, LINIE, BREITE)
			var spitze := a if zu else Vector2(cx - 15, a.y + 2)
			draw_line(b, spitze, LINIE, BREITE)
			_betaetiger(typ, (b + spitze) * 0.5)
		"oeffner", "taster_nc", "mschutz_nc", "nothalt_nc":
			draw_line(oben, a, LINIE, BREITE)
			draw_line(a, a + Vector2(13, 0), LINIE, BREITE)
			draw_line(b, unten, LINIE, BREITE)
			var spitze := Vector2(cx + 16, a.y - 3) if zu else Vector2(cx - 14, a.y + 4)
			draw_line(b, spitze, LINIE, BREITE)
			_betaetiger(typ, (b + spitze) * 0.5)
		_:
			draw_line(oben, unten, LINIE, BREITE)


func _betaetiger(typ: String, mitte: Vector2) -> void:
	if typ in ["schliesser", "oeffner"]:
		return
	var links := Vector2(mitte.x - 30, mitte.y)
	draw_dashed_line(mitte, links, LINIE, 1.6, 4.0)
	match typ:
		"taster_no", "taster_nc":
			# Drucktaster: "Pilzkopf"
			draw_line(links + Vector2(0, -9), links + Vector2(0, 9), LINIE, 2.0)
			draw_line(links + Vector2(0, -9), links + Vector2(5, -9), LINIE, 2.0)
			draw_line(links + Vector2(0, 9), links + Vector2(5, 9), LINIE, 2.0)
		"zeit_no":
			var m := links + Vector2(-9, 0)
			draw_arc(m, 9.0, 0, TAU, 20, LINIE, 1.8)
			draw_line(m, m + Vector2(0, -6), LINIE, 1.6)
			draw_line(m, m + Vector2(5, 0), LINIE, 1.6)
		"nothalt_nc":
			# Not-Halt: Pilztaster
			draw_arc(links + Vector2(-1, 0), 9.0, PI * 0.5, PI * 1.5, 14, LINIE, 2.2)
			draw_line(links + Vector2(-1, -9), links + Vector2(-1, 9), LINIE, 2.2)
		"mschutz_nc":
			# thermischer Auslöser
			var p := links + Vector2(-14, -7)
			draw_rect(Rect2(p, Vector2(14, 14)), LINIE, false, 1.8)
			draw_polyline(PackedVector2Array([p + Vector2(2, 10), p + Vector2(6, 10), p + Vector2(6, 4), p + Vector2(12, 4)]), LINIE, 1.6)
