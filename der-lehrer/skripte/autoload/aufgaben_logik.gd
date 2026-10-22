class_name AufgabenLogik
## Reine Logik der Fachaufgaben (ohne Oberfläche) – wird vom Spiel und von den Tests benutzt.


## Zufallswerte einer Aufgabe. Gleicher Spielstand (saat) -> gleiche Werte.
static func werte(id: String, alle: Dictionary, saat: int) -> Dictionary:
	var a: Dictionary = alle.get(id, {})
	var quelle_id: String = a.get("variablen_von", id)
	var quelle: Dictionary = alle.get(quelle_id, a)
	var rng := RandomNumberGenerator.new()
	rng.seed = hash(quelle_id) ^ saat
	var w := {}
	if quelle.has("varianten"):
		var v: Array = quelle["varianten"]
		w = (v[rng.randi_range(0, v.size() - 1)] as Dictionary).duplicate()
	elif quelle.has("variablen"):
		var vars: Dictionary = quelle["variablen"]
		var namen := vars.keys()
		namen.sort()
		for n in namen:
			var liste: Array = vars[n]
			w[n] = liste[rng.randi_range(0, liste.size() - 1)]
	if a.has("loesung"):
		w["ERG"] = rechne(a["loesung"], w)
	return w


## Rechenausdruck mit Variablen auswerten (Godot-Expression)
static func rechne(ausdruck: String, w: Dictionary) -> float:
	var namen: PackedStringArray = []
	var eingaben := []
	for k in w.keys():
		if k == "ERG":
			continue
		namen.append(k)
		eingaben.append(float(w[k]))
	var e := Expression.new()
	if e.parse(ausdruck, namen) != OK:
		push_error("Ausdruck fehlerhaft: %s" % ausdruck)
		return NAN
	var r = e.execute(eingaben)
	if e.has_execute_failed():
		return NAN
	return float(r)


## Zahl im deutschen Format (Komma), ohne überflüssige Nullen
static func zahl_text(x: float, stellen: int = 3) -> String:
	if is_nan(x):
		return "?"
	var s := String.num(snappedf(x, pow(10.0, -stellen)), stellen)
	if s.contains("."):
		s = s.rstrip("0").rstrip(".")
	return s.replace(".", ",")


## Zahl mit drei gültigen Stellen (wie in den Lernunterlagen): 0,157 · 28,8 · 60,0 · 1 500
static func zahl_gueltig(x: float, gueltig: int = 3) -> String:
	if is_nan(x):
		return "?"
	if x == 0.0:
		return "0"
	var stellen := maxi(0, gueltig - 1 - int(floor(log(absf(x)) / log(10.0))))
	var s: String = ("%." + str(stellen) + "f") % x
	return s.replace(".", ",")


## Platzhalter {X} im Text ersetzen ({ERG} mit drei gültigen Stellen)
static func text(t: String, w: Dictionary, stellen: int = 3) -> String:
	for k in w.keys():
		var v = w[k]
		var s: String
		if k == "ERG":
			s = zahl_gueltig(float(v))
		elif v is float or v is int:
			s = zahl_text(float(v), stellen)
		else:
			s = str(v)
		t = t.replace("{%s}" % k, s)
	return t


## Eingabe des Schülers lesen: "0,25", "0.25 A", " 11,5Ω" ...
static func zahl_lesen(s: String) -> float:
	var t := s.strip_edges().replace(",", ".").replace(" ", "")
	var sauber := ""
	for c in t:
		if c in "0123456789.-+eE":
			sauber += c
		else:
			break
	if sauber == "" or not sauber.is_valid_float():
		return NAN
	return sauber.to_float()


static func zahl_richtig(eingabe: float, soll: float, toleranz: float) -> bool:
	if is_nan(eingabe) or is_nan(soll):
		return false
	return absf(eingabe - soll) <= absf(soll) * toleranz + 1e-9


static func mc_richtig(a: Dictionary, gewaehlt: Array) -> bool:
	var soll: Array = a.get("richtig", [])
	if gewaehlt.size() != soll.size():
		return false
	for i in soll:
		if not gewaehlt.has(int(i)):
			return false
	return true


static func sortieren_richtig(a: Dictionary, reihenfolge: Array) -> bool:
	return reihenfolge == a.get("elemente", [])


# ---------------------------------------------------------------- Schützschaltung

static func _option(a: Dictionary, id: String) -> Dictionary:
	for o in a.get("optionen", []):
		if o["id"] == id:
			return o
	return {}


## Spulen der Schaltung: Name -> Logikausdruck. Ältere Aufgaben haben genau eine "spule" mit "ausdruck",
## neuere (Folge- und Wendeschützschaltung) mehrere unter "spulen".
static func spulen(a: Dictionary) -> Dictionary:
	var logik: Dictionary = a["logik"]
	if logik.has("spulen"):
		return logik["spulen"]
	return {logik["spule"]: logik["ausdruck"]}


## Simuliert den Steuerstromkreis.
## belegung: Lücken-ID -> Options-ID, eingaenge: Taster -> bool (z. B. {"SJ1": false, "SJ2": true}),
## vorher: Spule -> bool (Zustand vor dem Schritt; Selbsthaltung und Verriegelung hängen davon ab).
## Alle Spulen werden gleichzeitig neu berechnet, bis sich nichts mehr ändert.
## Rückgabe: {"spulen": {Spule: bool}, "stabil": bool}
static func simuliere(a: Dictionary, belegung: Dictionary, eingaenge: Dictionary, vorher: Dictionary) -> Dictionary:
	var namen_spulen: Array = spulen(a).keys()
	namen_spulen.sort()
	var taster: Array = a["logik"].get("taster", {}).keys()
	taster.sort()
	var namen := PackedStringArray(taster)
	namen.append_array(PackedStringArray(namen_spulen))
	var ausdruecke := {}
	for sp in namen_spulen:
		var ausdruck: String = spulen(a)[sp]
		for el in a["schaltplan"]["elemente"]:
			if el["typ"] != "luecke":
				continue
			var opt := _option(a, belegung.get(el["id"], ""))
			ausdruck = ausdruck.replace("{%s}" % el["id"], opt.get("logik", "false"))
		var e := Expression.new()
		if e.parse(ausdruck, namen) != OK:
			push_error("Schaltungslogik fehlerhaft: %s" % ausdruck)
			return {"spulen": {}, "stabil": true}
		ausdruecke[sp] = e
	var zustand := {}
	for sp in namen_spulen:
		zustand[sp] = bool(vorher.get(sp, false))
	for i in 12:
		var werte := []
		for t in taster:
			werte.append(bool(eingaenge.get(t, false)))
		for sp in namen_spulen:
			werte.append(zustand[sp])
		var neu := {}
		for sp in namen_spulen:
			neu[sp] = bool((ausdruecke[sp] as Expression).execute(werte))
		if neu == zustand:
			return {"spulen": zustand, "stabil": true}
		zustand = neu
	# Kein stabiler Zustand: Schütz "flattert" (z. B. eigener Öffner in Reihe zur Spule)
	var aus := {}
	for sp in namen_spulen:
		aus[sp] = false
	return {"spulen": aus, "stabil": false}


## Prüfablauf aus der Aufgabe durchspielen. Rückgabe: Liste {text, ok, stabil}
static func pruefe_schaltung(a: Dictionary, belegung: Dictionary) -> Array:
	var erg := []
	var zustand := {}
	for schritt in a["pruefung"]:
		var r := simuliere(a, belegung, schritt, zustand)
		zustand = r["spulen"]
		var ok: bool = r["stabil"]
		for sp in zustand:
			if schritt.has(sp) and bool(schritt[sp]) != bool(zustand[sp]):
				ok = false
		erg.append({"text": schritt["text"], "ok": ok, "stabil": r["stabil"]})
	return erg


static func schaltung_richtig(a: Dictionary, belegung: Dictionary) -> bool:
	for r in pruefe_schaltung(a, belegung):
		if not r["ok"]:
			return false
	return true
