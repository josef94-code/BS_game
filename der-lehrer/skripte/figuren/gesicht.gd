class_name Gesicht
## Malt eine Gesichtstextur für den Kopf (wie bei PS2-Spielen: Gesicht als Bild auf Low-Poly-Kopf).
## UV der Kugel: u läuft um den Kopf (u = 0.5 ist vorne, also -Z), v von oben (0) nach unten (1).
## Stil wie in GTA III: ernste Gesichter, schwere Brauen, schmale Augen, Falten, Bartschatten.
## Varianten: "offen", "zu" (Blinzeln), "mund" (Sprechen). Haut und Haare werden nur einmal je Figur gemalt.

static var _cache := {}
static var _grund := {}


## stil: haut, haare, augenfarbe, lippen, bart (0..1), haaransatz (v vorne), wangen (0..2),
## schnurrbart (bool), wimpern (bool), augenringe (0..1), klein (bool: halbe Auflösung für Statisten),
## ausdruck: ernst, grimmig, skeptisch, arrogant, angespannt, warm, muede
static func textur(stil: Dictionary, variante: String = "offen") -> ImageTexture:
	var key := "%s_%s" % [str(stil), variante]
	if _cache.has(key):
		return _cache[key]
	var gs: float = 0.5 if stil.get("klein", false) else 1.0
	var img: Image = _grundbild(stil).duplicate()
	_zuege(img, stil, variante, gs)
	img.generate_mipmaps()
	var t := ImageTexture.create_from_image(img)
	_cache[key] = t
	return t


## Haut mit Schattierung, Haaransatz, Bartschatten (ohne Augen und Mund)
static func _grundbild(stil: Dictionary) -> Image:
	var schluessel := str([stil.get("haut"), stil.get("haare"), stil.get("bart", 0.0), stil.get("haaransatz", 0.3), stil.get("klein", false), stil.get("wangen", 1.0)])
	if _grund.has(schluessel):
		return _grund[schluessel]
	var b := 256 if stil.get("klein", false) else 512
	var h := b / 2
	var img := Image.create(b, h, false, Image.FORMAT_RGB8)
	var haut: Color = stil.get("haut", Color(0.92, 0.74, 0.6))
	var haare: Color = stil.get("haare", Color(0.27, 0.16, 0.08))
	var bart: float = stil.get("bart", 0.0)
	var ansatz: float = stil.get("haaransatz", 0.3)
	var rausch := Bau._rauschen(70.0, 13).get_seamless_image(b, h)
	var poren := Bau._rauschen(260.0, 29).get_seamless_image(b, h)
	for y in h:
		var v := float(y) / h
		for x in b:
			var u := float(x) / b
			var vorne := 1.0 - absf(u - 0.5) * 2.0          # 1 vorne, 0 hinten
			var c := haut
			# Schattierung: Seiten, Schläfen und Kinnunterseite dunkler, Stirn und Nasenrücken heller
			c = c.darkened((1.0 - vorne) * 0.2 + clampf(v - 0.66, 0.0, 1.0) * 0.55)
			c = c.lightened(clampf(0.4 - absf(v - 0.36), 0.0, 1.0) * vorne * 0.1)
			# Hautstruktur
			c = c.darkened((poren.get_pixel(x, y).r - 0.5) * 0.07)
			# leichte Röte auf den Wangen
			for seite: float in [-1.0, 1.0]:
				var d := Vector2((u - (0.5 + seite * 0.08)) * 2.0, v - 0.56).length()
				c = c.lerp(Color(0.8, 0.42, 0.38), clampf(0.08 - d, 0.0, 0.08) / 0.08 * 0.1 * float(stil.get("wangen", 1.0)))
			# Schatten unter den Wangenknochen
			if absf(absf(u - 0.5) - 0.1) < 0.04 and v > 0.56 and v < 0.66:
				c = c.darkened(0.06 * (1.0 - absf(absf(u - 0.5) - 0.1) / 0.04))
			# Bartschatten (Kinn, Oberlippe, Wangen)
			if bart > 0.0 and v > 0.55 and absf(u - 0.5) < 0.2:
				var staerke := clampf((v - 0.55) * 7.0, 0.0, 1.0) * bart * (0.55 + rausch.get_pixel(x, y).r * 0.45)
				staerke *= clampf((0.2 - absf(u - 0.5)) * 12.0, 0.0, 1.0)
				c = c.lerp(haare.darkened(0.35).lerp(haut.darkened(0.5), 0.3), staerke * 0.42)
			# Haare: Ansatz vorne an der Stirn, hinten bis in den Nacken, Koteletten
			var linie := ansatz + 0.38 * smoothstep(0.25, 0.75, 1.0 - vorne)
			linie += sin(u * 90.0) * 0.006
			if absf(absf(u - 0.5) - 0.2) < 0.025 and v < 0.53:
				linie = maxf(linie, 0.53)
			if v < linie:
				var hf := haare.lightened((rausch.get_pixel(x, y).r - 0.5) * 0.25)
				var kante := clampf((linie - v) * 40.0, 0.0, 1.0)
				c = c.lerp(hf, kante)
			img.set_pixel(x, y, c)
	_grund[schluessel] = img
	return img


## Augen, Brauen, Nase, Falten und Mund je nach Ausdruck und Variante
static func _zuege(img: Image, stil: Dictionary, variante: String, gs: float) -> void:
	var b := float(img.get_width())
	var h := float(img.get_height())
	var haut: Color = stil.get("haut", Color(0.92, 0.74, 0.6))
	var haare: Color = stil.get("haare", Color(0.27, 0.16, 0.08))
	var ausdruck: String = stil.get("ausdruck", "ernst")
	var mx := 0.5 * b
	var ex := 0.062 * b
	var ey := 0.445 * h
	var falte := haut.darkened(0.22)
	# Ausdruck: Neigung der Brauen innen (+ = innen tiefer, grimmig), Höhe, Lidschluss, Mundwinkel
	var neigung := 4.0
	var brauenhoehe := 0.0
	var lid := 0.28
	var winkel := 1.5            # + = Mundwinkel nach unten
	var schief := 0.0            # einseitiges Grinsen / skeptische Braue
	match ausdruck:
		"grimmig":
			neigung = 7.5; brauenhoehe = 2.0; lid = 0.35; winkel = 3.0
		"skeptisch":
			neigung = 3.0; lid = 0.3; winkel = 1.0; schief = 1.0
		"arrogant":
			neigung = 1.0; brauenhoehe = -1.5; lid = 0.5; winkel = 0.0; schief = -1.0
		"angespannt":
			neigung = 5.5; brauenhoehe = 0.5; lid = 0.15; winkel = 2.0
		"warm":
			neigung = 0.5; brauenhoehe = -1.0; lid = 0.25; winkel = -1.5
		"muede":
			neigung = 1.5; brauenhoehe = 1.0; lid = 0.55; winkel = 1.5
	var haarfarbe := haare.darkened(0.25)
	# Frauen (mit Wimpern): schmalere, geschwungene Brauen, weniger Falten, vollere Lippen
	var weiblich: bool = stil.get("wimpern", false)
	if weiblich:
		neigung *= 0.4
		falte = haut.darkened(0.12)
	# Augenhöhlen- und Lidschatten
	for seite: float in [-1.0, 1.0]:
		_ellipse(img, Vector2(mx + seite * ex, ey - 2.0 * gs), Vector2(17.0, 9.0) * gs, haut.darkened(0.13))
		# Tränensäcke / Augenringe
		var ringe: float = stil.get("augenringe", 0.5)
		for i in 20:
			var t := float(i) / 19.0
			var px := (-11.0 + t * 22.0) * gs
			_punkt(img, Vector2(mx + seite * ex + px, ey + (8.5 + sin(t * PI) * 2.0) * gs), 1.2 * gs, haut.darkened(0.12 + ringe * 0.12))
	# Augenbrauen: dick, nach Ausdruck geneigt
	for seite: float in [-1.0, 1.0]:
		var extra := brauenhoehe + (schief * 3.0 if seite > 0.0 else 0.0)
		for i in 30:
			var t := float(i) / 29.0          # 0 = innen, 1 = außen
			var px := mx + seite * (ex - 14.0 * gs + t * 29.0 * gs)
			var py := ey - (14.5 + extra) * gs + neigung * (1.0 - t) * gs * 0.75 - sin(t * PI) * 2.0 * gs
			_punkt(img, Vector2(px, py - (sin(t * PI) * 2.0 * gs if weiblich else 0.0)), ((2.2 - t * 1.0) if weiblich else (3.4 - t * 1.4)) * gs, haarfarbe)
		# Zornesfalte zwischen den Brauen
		if neigung > 4.0:
			for i in 6:
				_punkt(img, Vector2(mx + seite * 2.5 * gs, ey - (12.0 - i * 1.2) * gs), 0.8 * gs, falte)
	# Augen
	for seite: float in [-1.0, 1.0]:
		var m := Vector2(mx + seite * ex, ey)
		if variante == "zu":
			for i in 26:
				var t := float(i) / 25.0
				_punkt(img, m + Vector2((-12.0 + t * 24.0) * gs, sin(t * PI) * 1.5 * gs), 1.5 * gs, haut.darkened(0.5))
			continue
		var r := Vector2(12.5, 5.0) * gs
		_ellipse(img, m, r, Color(0.9, 0.88, 0.84))
		var iris: Color = stil.get("augenfarbe", Color(0.35, 0.25, 0.15))
		_ellipse(img, m + Vector2(0, 0.5 * gs), Vector2(4.6, 4.6) * gs, iris, r, m)
		_ellipse(img, m + Vector2(0, 0.5 * gs), Vector2(2.2, 2.2) * gs, Color(0.03, 0.02, 0.02), r, m)
		_punkt(img, m + Vector2(1.4, -1.6) * gs, 0.9 * gs, Color(1, 1, 1))
		# Oberlid: deckt je nach Ausdruck einen Teil des Auges ab (schmaler, prüfender Blick)
		var lidfarbe := haut.darkened(0.2)
		var oben := -r.y + lid * r.y * 2.0
		for yy in range(int(m.y - r.y - 1.0), int(m.y + oben) + 1):
			for xx in range(int(m.x - r.x - 1.0), int(m.x + r.x + 2.0)):
				var q := Vector2((xx + 0.5 - m.x) / r.x, (yy + 0.5 - m.y) / r.y)
				if q.length() < 1.05 and yy >= 0 and xx >= 0 and xx < img.get_width():
					img.set_pixel(xx, yy, img.get_pixel(xx, yy).lerp(lidfarbe, 0.92))
		# Lidkante (Wimpernlinie) und Lidfalte darüber
		var wimpern: bool = stil.get("wimpern", false)
		for i in 30:
			var t := float(i) / 29.0
			var px := (-13.0 + t * 26.0) * gs
			var py := m.y + oben - sin(t * PI) * 0.6 * gs
			_punkt(img, Vector2(m.x + px, py), (2.0 if wimpern else 1.4) * gs, Color(0.1, 0.07, 0.06))
			_punkt(img, Vector2(m.x + px * 1.05, m.y - r.y - (2.5 + sin(t * PI) * 1.0) * gs), 0.9 * gs, falte)
			_punkt(img, Vector2(m.x + px * 0.9, m.y + r.y + 0.8 * gs), 0.7 * gs, haut.darkened(0.3))
		if wimpern:
			for i in 3:
				var start := m + Vector2(seite * (9.0 + i * 2.0), oben / gs - 0.5 + i * 0.6) * gs
				for j in 4:
					_punkt(img, start + Vector2(seite * j * 0.9, -j * 0.9) * gs, 0.8 * gs, Color(0.08, 0.05, 0.04))
	# Nase: Nasenrücken-Schatten, Nasenflügel, Nasenlöcher
	for i in 24:
		_punkt(img, Vector2(mx + 5.0 * gs, ey + (4.0 + i) * gs), 1.4 * gs, haut.darkened(0.14))
	for seite: float in [-1.0, 1.0]:
		_ellipse(img, Vector2(mx + seite * 5.0 * gs, 0.567 * h), Vector2(2.6, 1.5) * gs, haut.darkened(0.5))
		# Nasolabialfalte
		for i in 16:
			var t := float(i) / 15.0
			_punkt(img, Vector2(mx + seite * (11.0 + t * 9.0) * gs, 0.575 * h + t * 18.0 * gs), 1.0 * gs, falte)
	# Mund: schmal und gerade bzw. nach Ausdruck; beim Sprechen geöffnet
	var lippen: Color = stil.get("lippen", haut.darkened(0.25).lerp(Color(0.6, 0.3, 0.28), 0.35))
	var my := 0.655 * h
	var breite := 17.0 * gs
	if variante == "mund":
		_ellipse(img, Vector2(mx, my + 2.5 * gs), Vector2(11.0, 4.5) * gs, Color(0.18, 0.06, 0.06))
		_ellipse(img, Vector2(mx, my - 0.5 * gs), Vector2(9.0, 1.4) * gs, Color(0.88, 0.86, 0.8))
		for i in 36:
			var t := float(i) / 35.0
			var px := -breite + t * breite * 2.0
			_punkt(img, Vector2(mx + px, my - 2.5 * gs - sin(t * PI) * 1.0 * gs), 1.3 * gs, lippen)
			_punkt(img, Vector2(mx + px * 0.9, my + 7.5 * gs + sin(t * PI) * 1.0 * gs), 1.8 * gs, lippen.lightened(0.08))
	else:
		for i in 40:
			var t := float(i) / 39.0
			var px := -breite + t * breite * 2.0
			var rand := absf(px) / breite
			var kurve := winkel * rand * rand * gs + schief * px / breite * 1.5 * gs
			# Oberlippe (schmal), Mundspalte (dunkel), Unterlippe (heller)
			var voll := 1.5 if weiblich else 1.0
			_punkt(img, Vector2(mx + px, my + kurve - 1.6 * gs * voll), 1.2 * gs * voll, lippen)
			_punkt(img, Vector2(mx + px, my + kurve), 0.95 * gs, lippen.darkened(0.6))
			_punkt(img, Vector2(mx + px * 0.85, my + kurve + 2.4 * gs * voll), 1.5 * gs * voll, lippen.lightened(0.06))
		# Mundwinkel-Falten nach unten
		for seite: float in [-1.0, 1.0]:
			for i in 6:
				_punkt(img, Vector2(mx + seite * (breite + 1.5 * gs), my + (winkel + 1.0 + i * 1.1) * gs), 0.8 * gs, falte)
	# Kinngrübchen-Schatten unter der Unterlippe
	for i in 12:
		_punkt(img, Vector2(mx - 5.0 * gs + i * 0.9 * gs, my + 7.0 * gs), 1.0 * gs, haut.darkened(0.1))
	# Schnurrbart
	if stil.get("schnurrbart", false):
		var bartfarbe := haare.darkened(0.1)
		for i in 44:
			var t := float(i) / 43.0
			var px := (-22.0 + t * 44.0) * gs
			var dicke := (4.5 - absf(px / gs) / 22.0 * 2.5) * gs
			_punkt(img, Vector2(mx + px, my - 7.0 * gs + absf(px) * 0.14), dicke, bartfarbe)


static func _punkt(img: Image, p: Vector2, r: float, c: Color) -> void:
	var w := img.get_width()
	var hh := img.get_height()
	for y in range(int(p.y - r - 1), int(p.y + r + 2)):
		for x in range(int(p.x - r - 1), int(p.x + r + 2)):
			if x < 0 or y < 0 or x >= w or y >= hh:
				continue
			var d := Vector2(x + 0.5, y + 0.5).distance_to(p)
			var a := clampf(r + 0.5 - d, 0.0, 1.0)
			if a > 0.0:
				img.set_pixel(x, y, img.get_pixel(x, y).lerp(c, a))


## Gefüllte Ellipse; optional nur innerhalb einer zweiten Ellipse (für die Iris im Auge)
static func _ellipse(img: Image, m: Vector2, r: Vector2, c: Color, grenze: Vector2 = Vector2.ZERO, gm: Vector2 = Vector2.ZERO) -> void:
	var w := img.get_width()
	var hh := img.get_height()
	for y in range(int(m.y - r.y - 1), int(m.y + r.y + 2)):
		for x in range(int(m.x - r.x - 1), int(m.x + r.x + 2)):
			if x < 0 or y < 0 or x >= w or y >= hh:
				continue
			var q := Vector2((x + 0.5 - m.x) / r.x, (y + 0.5 - m.y) / r.y)
			var d := q.length()
			var a := clampf((1.0 - d) * minf(r.x, r.y), 0.0, 1.0)
			if grenze != Vector2.ZERO:
				var g := Vector2((x + 0.5 - gm.x) / grenze.x, (y + 0.5 - gm.y) / grenze.y).length()
				a *= clampf((1.0 - g) * grenze.y, 0.0, 1.0)
			if a > 0.0:
				img.set_pixel(x, y, img.get_pixel(x, y).lerp(c, a))
