class_name Gesicht
## Malt eine Gesichtstextur für einen Kugelkopf (wie bei PS2-Spielen: Gesicht als Bild auf Low-Poly-Kopf).
## UV der SphereMesh: u läuft um den Kopf (u = 0.5 ist vorne, also -Z), v von oben (0) nach unten (1).

const B := 512
const H := 256

static var _cache := {}


## stil: haut, haare, augenfarbe, lippen, bart (0..1), haaransatz (v vorne), wangen (0..1)
static func textur(stil: Dictionary, augen_zu: bool = false) -> ImageTexture:
	var key := "%s_%s" % [str(stil), augen_zu]
	if _cache.has(key):
		return _cache[key]
	var img := Image.create(B, H, false, Image.FORMAT_RGB8)
	var haut: Color = stil.get("haut", Color(0.92, 0.74, 0.6))
	var haare: Color = stil.get("haare", Color(0.27, 0.16, 0.08))
	var bart: float = stil.get("bart", 0.0)
	var ansatz: float = stil.get("haaransatz", 0.3)
	var rausch := Bau._rauschen(70.0, 13).get_seamless_image(B, H)

	for y in H:
		var v := float(y) / H
		for x in B:
			var u := float(x) / B
			var vorne := 1.0 - absf(u - 0.5) * 2.0          # 1 vorne, 0 hinten
			var c := haut
			# Schattierung: Seiten und Kinn etwas dunkler, Stirn heller
			c = c.darkened((1.0 - vorne) * 0.18 + clampf(v - 0.62, 0.0, 1.0) * 0.4)
			c = c.lightened(clampf(0.45 - absf(v - 0.4), 0.0, 1.0) * vorne * 0.08)
			# Wangenrötung
			for seite: float in [-1.0, 1.0]:
				var d := Vector2((u - (0.5 + seite * 0.075)) * 2.0, v - 0.55).length()
				c = c.lerp(Color(0.9, 0.45, 0.4), clampf(0.07 - d, 0.0, 0.07) / 0.07 * 0.18 * stil.get("wangen", 1.0))
			# Bartschatten
			if bart > 0.0 and v > 0.58 and absf(u - 0.5) < 0.17:
				var staerke := clampf((v - 0.58) * 6.0, 0.0, 1.0) * bart * (0.6 + rausch.get_pixel(x, y).r * 0.4)
				c = c.lerp(haare.darkened(0.2), staerke * 0.35)
			# Haare: Ansatz vorne tief an der Stirn, hinten bis in den Nacken
			var linie := ansatz + 0.38 * smoothstep(0.25, 0.75, 1.0 - vorne)
			linie += sin(u * 90.0) * 0.008
			# Koteletten
			if absf(absf(u - 0.5) - 0.2) < 0.025 and v < 0.52:
				linie = maxf(linie, 0.52)
			if v < linie:
				var h := haare.lightened((rausch.get_pixel(x, y).r - 0.5) * 0.25)
				var kante := clampf((linie - v) * 40.0, 0.0, 1.0)
				c = c.lerp(h, kante)
			img.set_pixel(x, y, c)

	var mx := 0.5 * B
	var ex := 0.062 * B
	var ey := 0.445 * H
	var haarfarbe := haare.darkened(0.15)
	# Augenbrauen
	for seite: float in [-1.0, 1.0]:
		for i in 26:
			var t := float(i) / 25.0
			var px := mx + seite * (ex - 13.0 + t * 26.0)
			var py := ey - 15.0 - sin(t * PI) * 3.0 + (t - 0.5) * seite * 0.0
			_punkt(img, Vector2(px, py), 2.6, haarfarbe)
	# Augen
	for seite: float in [-1.0, 1.0]:
		var m := Vector2(mx + seite * ex, ey)
		if augen_zu:
			for i in 24:
				var t := float(i) / 23.0
				_punkt(img, m + Vector2(-12.0 + t * 24.0, sin(t * PI) * 2.0), 1.4, haut.darkened(0.5))
			continue
		_ellipse(img, m, Vector2(13.0, 5.5), Color(0.96, 0.95, 0.92))
		var iris: Color = stil.get("augenfarbe", Color(0.35, 0.25, 0.15))
		_ellipse(img, m, Vector2(5.0, 5.0), iris, Vector2(13.0, 5.5), m)
		_ellipse(img, m, Vector2(2.4, 2.4), Color(0.04, 0.03, 0.03))
		_punkt(img, m + Vector2(1.5, -1.8), 1.1, Color(1, 1, 1))
		# Oberlid (Wimpernlinie) und Unterlid
		for i in 28:
			var t := float(i) / 27.0
			var px := -13.0 + t * 26.0
			var py := -sqrt(maxf(0.0, 1.0 - pow(px / 13.0, 2.0))) * 5.5
			_punkt(img, m + Vector2(px, py - 0.5), 1.5, Color(0.12, 0.08, 0.06))
			_punkt(img, m + Vector2(px * 0.9, -py + 1.5), 0.8, haut.darkened(0.25))
	# Nase: Schattenlinie und Nasenlöcher
	for i in 22:
		_punkt(img, Vector2(mx + 4.0, ey + 6.0 + i), 1.3, haut.darkened(0.12))
	for seite: float in [-1.0, 1.0]:
		_ellipse(img, Vector2(mx + seite * 4.5, 0.565 * H), Vector2(2.6, 1.6), haut.darkened(0.45))
	# Mund: freundliches Lächeln
	var lippen: Color = stil.get("lippen", Color(0.7, 0.36, 0.33))
	var my := 0.655 * H
	for i in 40:
		var t := float(i) / 39.0
		var px := -19.0 + t * 38.0
		var kurve := -pow(px / 19.0, 2.0) * 3.5
		_punkt(img, Vector2(mx + px, my + kurve + 2.0), 2.0, lippen)
		_punkt(img, Vector2(mx + px, my + kurve), 1.0, lippen.darkened(0.55))
	for i in 10:
		_punkt(img, Vector2(mx - 2.0 + i * 0.4, my + 7.5 + i * 0.05), 1.0, haut.darkened(0.15))
	# Lachfalten
	for seite: float in [-1.0, 1.0]:
		for i in 10:
			_punkt(img, Vector2(mx + seite * (22.0 + i * 0.3), my - 8.0 + i * 1.2), 0.9, haut.darkened(0.12))

	img.generate_mipmaps()
	var t := ImageTexture.create_from_image(img)
	_cache[key] = t
	return t


static func _punkt(img: Image, p: Vector2, r: float, c: Color) -> void:
	for y in range(int(p.y - r - 1), int(p.y + r + 2)):
		for x in range(int(p.x - r - 1), int(p.x + r + 2)):
			if x < 0 or y < 0 or x >= B or y >= H:
				continue
			var d := Vector2(x + 0.5, y + 0.5).distance_to(p)
			var a := clampf(r + 0.5 - d, 0.0, 1.0)
			if a > 0.0:
				img.set_pixel(x, y, img.get_pixel(x, y).lerp(c, a))


## Gefüllte Ellipse; optional nur innerhalb einer zweiten Ellipse (für die Iris im Auge)
static func _ellipse(img: Image, m: Vector2, r: Vector2, c: Color, grenze: Vector2 = Vector2.ZERO, gm: Vector2 = Vector2.ZERO) -> void:
	for y in range(int(m.y - r.y - 1), int(m.y + r.y + 2)):
		for x in range(int(m.x - r.x - 1), int(m.x + r.x + 2)):
			if x < 0 or y < 0 or x >= B or y >= H:
				continue
			var q := Vector2((x + 0.5 - m.x) / r.x, (y + 0.5 - m.y) / r.y)
			var d := q.length()
			var a := clampf((1.0 - d) * minf(r.x, r.y), 0.0, 1.0)
			if grenze != Vector2.ZERO:
				var g := Vector2((x + 0.5 - gm.x) / grenze.x, (y + 0.5 - gm.y) / grenze.y).length()
				a *= clampf((1.0 - g) * grenze.y, 0.0, 1.0)
			if a > 0.0:
				img.set_pixel(x, y, img.get_pixel(x, y).lerp(c, a))
