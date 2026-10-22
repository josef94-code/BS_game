extends Node
## Klänge und Musik werden beim Start per Synthese erzeugt (keine fremden Audiodateien).

const RATE := 22050

var _klaenge := {}
var _spieler: Array[AudioStreamPlayer] = []
var musik: AudioStreamPlayer
var musik_lautstaerke := -14.0
var stumm := false
var _musik_task := -1


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for i in 6:
		var p := AudioStreamPlayer.new()
		p.bus = "Master"
		add_child(p)
		_spieler.append(p)
	musik = AudioStreamPlayer.new()
	musik.volume_db = musik_lautstaerke
	add_child(musik)
	_klaenge["klick"] = _ton([[1300.0, 0.0, 0.035]], 0.25, "sinus")
	_klaenge["auswahl"] = _ton([[880.0, 0.0, 0.05]], 0.2, "sinus")
	_klaenge["richtig"] = _ton([[660.0, 0.0, 0.12], [990.0, 0.1, 0.25]], 0.3, "sinus")
	_klaenge["falsch"] = _ton([[140.0, 0.0, 0.18], [110.0, 0.16, 0.25]], 0.22, "rechteck")
	_klaenge["mission_start"] = _akkord([110.0, 130.81, 164.81, 220.0], 1.8, 0.28)
	_klaenge["mission_passed"] = _fanfare()
	_klaenge["befoerderung"] = _ton([[523.25, 0.0, 0.25], [659.25, 0.2, 0.25], [783.99, 0.4, 0.25], [1046.5, 0.6, 0.9]], 0.3, "saege")
	_klaenge["beweis"] = _ton([[293.66, 0.0, 0.5], [277.18, 0.3, 0.9]], 0.3, "saege")
	_klaenge["sammel"] = _ton([[1318.5, 0.0, 0.1], [1760.0, 0.08, 0.25]], 0.25, "sinus")
	_klaenge["glocke"] = _glocke()
	_klaenge["funken"] = _funken()
	_klaenge["radio"] = _ton([[1200.0, 0.0, 0.06], [900.0, 0.07, 0.08]], 0.15, "rechteck")
	_klaenge["tuer"] = _ton([[90.0, 0.0, 0.3]], 0.3, "rechteck")
	_klaenge["brummen"] = _brummen()
	_klaenge["band"] = _band()
	# Musik dauert länger zu berechnen -> im Hintergrund
	_musik_task = WorkerThreadPool.add_task(_musik_erzeugen)
	if Spielstand.autotest:
		AudioServer.set_bus_mute(0, true)


func spiele(name: String, lautstaerke_db: float = 0.0, tonhoehe: float = 1.0) -> void:
	if not _klaenge.has(name):
		return
	for p in _spieler:
		if not p.playing:
			p.stream = _klaenge[name]
			p.volume_db = lautstaerke_db
			p.pitch_scale = tonhoehe
			p.play()
			return


func strom(name: String) -> AudioStream:
	return _klaenge.get(name)


func _exit_tree() -> void:
	if _musik_task >= 0:
		WorkerThreadPool.wait_for_task_completion(_musik_task)
		_musik_task = -1


func _musik_erzeugen() -> void:
	var m := _musik()
	call_deferred("_musik_fertig", m)


func _musik_fertig(m: AudioStreamWAV) -> void:
	_klaenge["musik"] = m
	if _musik_gewuenscht:
		musik_an(true)


var _musik_gewuenscht := false


func musik_an(an: bool) -> void:
	_musik_gewuenscht = an
	if an and not musik.playing and _klaenge.has("musik"):
		musik.stream = _klaenge["musik"]
		musik.play()
	elif not an:
		musik.stop()


func musik_leiser(leiser: bool) -> void:
	var t := create_tween()
	t.tween_property(musik, "volume_db", musik_lautstaerke - (10.0 if leiser else 0.0), 0.6)


func umschalten_stumm() -> bool:
	stumm = not stumm
	AudioServer.set_bus_mute(0, stumm)
	return stumm


# ---------------------------------------------------------------- Synthese

func _welle(form: String, phase: float) -> float:
	match form:
		"rechteck":
			return 1.0 if fmod(phase, 1.0) < 0.5 else -1.0
		"saege":
			return 2.0 * fmod(phase, 1.0) - 1.0
		_:
			return sin(TAU * phase)


func _wav(daten: PackedFloat32Array, schleife: bool = false) -> AudioStreamWAV:
	var bytes := PackedByteArray()
	bytes.resize(daten.size() * 2)
	for i in daten.size():
		bytes.encode_s16(i * 2, int(clampf(daten[i], -1.0, 1.0) * 32000.0))
	var w := AudioStreamWAV.new()
	w.format = AudioStreamWAV.FORMAT_16_BITS
	w.mix_rate = RATE
	w.stereo = false
	w.data = bytes
	if schleife:
		w.loop_mode = AudioStreamWAV.LOOP_FORWARD
		w.loop_begin = 0
		w.loop_end = daten.size()
	return w


## Töne: Liste aus [frequenz, start, dauer]
func _ton(toene: Array, lautstaerke: float, form: String) -> AudioStreamWAV:
	var ende := 0.0
	for t in toene:
		ende = max(ende, t[1] + t[2])
	var n := int((ende + 0.05) * RATE)
	var d := PackedFloat32Array()
	d.resize(n)
	for t in toene:
		var f: float = t[0]
		var s := int(t[1] * RATE)
		var len := int(t[2] * RATE)
		for i in len:
			if s + i >= n:
				break
			var zeit := float(i) / RATE
			var huelle := minf(1.0, zeit * 200.0) * pow(1.0 - float(i) / len, 1.5)
			d[s + i] += _welle(form, f * zeit) * huelle * lautstaerke
	return _wav(d)


func _akkord(freqs: Array, dauer: float, lautstaerke: float) -> AudioStreamWAV:
	var n := int(dauer * RATE)
	var d := PackedFloat32Array()
	d.resize(n)
	for i in n:
		var zeit := float(i) / RATE
		var huelle := minf(1.0, zeit * 30.0) * pow(1.0 - float(i) / n, 2.0)
		var v := 0.0
		for f in freqs:
			v += _welle("saege", f * zeit) * 0.5 + sin(TAU * f * 0.5 * zeit) * 0.5
		d[i] = v / freqs.size() * huelle * lautstaerke * 2.0
	return _wav(d)


func _fanfare() -> AudioStreamWAV:
	# kurzer, triumphaler Jingle: Dur-Arpeggio + Schlussakkord
	var noten := [[392.0, 0.0, 0.18], [523.25, 0.16, 0.18], [659.25, 0.32, 0.18], [783.99, 0.48, 0.5],
		[659.25, 0.9, 0.16], [783.99, 1.05, 1.2], [523.25, 1.05, 1.2], [392.0, 1.05, 1.2], [130.81, 1.05, 1.3]]
	return _ton(noten, 0.22, "saege")


func _glocke() -> AudioStreamWAV:
	# elektrische Schulglocke: schnell geschlagener Metallton
	var dauer := 2.4
	var n := int(dauer * RATE)
	var d := PackedFloat32Array()
	d.resize(n)
	for i in n:
		var zeit := float(i) / RATE
		var schlag := pow(1.0 - fmod(zeit * 22.0, 1.0), 3.0)
		var ton := sin(TAU * 2100.0 * zeit) * 0.5 + sin(TAU * 3170.0 * zeit) * 0.3 + sin(TAU * 1050.0 * zeit) * 0.2
		var huelle := minf(1.0, zeit * 20.0) * minf(1.0, (dauer - zeit) * 6.0)
		d[i] = ton * schlag * huelle * 0.35
	return _wav(d)


func _funken() -> AudioStreamWAV:
	var n := int(0.35 * RATE)
	var d := PackedFloat32Array()
	d.resize(n)
	var rng := RandomNumberGenerator.new()
	rng.seed = 5
	for i in n:
		var knack := 1.0 if rng.randf() < 0.04 else 0.15
		d[i] = rng.randf_range(-1.0, 1.0) * knack * 0.4 * (1.0 - float(i) / n)
	return _wav(d)


func _brummen() -> AudioStreamWAV:
	# Netzbrummen 100 Hz (Schaltschrank) – Schleife über ganze Perioden
	var n := RATE
	var d := PackedFloat32Array()
	d.resize(n)
	for i in n:
		var zeit := float(i) / RATE
		d[i] = (sin(TAU * 100.0 * zeit) * 0.6 + sin(TAU * 200.0 * zeit) * 0.25 + sin(TAU * 300.0 * zeit) * 0.1) * 0.35
	return _wav(d, true)


func _band() -> AudioStreamWAV:
	# Förderband: Rattern + tiefes Motorsummen
	var n := RATE
	var d := PackedFloat32Array()
	d.resize(n)
	var rng := RandomNumberGenerator.new()
	rng.seed = 9
	for i in n:
		var zeit := float(i) / RATE
		var rattern := pow(1.0 - fmod(zeit * 8.0, 1.0), 8.0) * rng.randf_range(-1.0, 1.0)
		d[i] = (sin(TAU * 50.0 * zeit) * 0.4 + rattern * 0.5) * 0.4
	return _wav(d, true)


func _musik() -> AudioStreamWAV:
	# Geheimnisvolle Schleife in a-Moll, 16 Takte à 1 s: Bass, Flächen und leise Glöckchen
	var bass := [110.0, 110.0, 87.31, 87.31, 73.42, 73.42, 82.41, 82.41,
		110.0, 110.0, 87.31, 87.31, 73.42, 98.0, 82.41, 82.41]
	var flaeche := [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [146.83, 174.61, 220.0], [164.81, 207.65, 246.94]]
	var glocken := [659.25, 0.0, 523.25, 0.0, 587.33, 0.0, 493.88, 0.0, 659.25, 0.0, 698.46, 0.0, 587.33, 0.0, 830.61, 0.0]
	var takt := 1.0
	var n := int(16 * takt * RATE)
	var d := PackedFloat32Array()
	d.resize(n)
	for i in n:
		var zeit := float(i) / RATE
		var t := int(zeit / takt)
		var im_takt := fmod(zeit, takt)
		var b: float = bass[t]
		var v := sin(TAU * b * zeit) * 0.32 * exp(-im_takt * 1.6) + sin(TAU * b * 0.5 * zeit) * 0.12
		var akk: Array = flaeche[(t / 4) % 4]
		var schwell := 0.5 + 0.5 * sin(TAU * zeit / 8.0)
		for f in akk:
			v += sin(TAU * f * zeit + sin(TAU * 0.3 * zeit)) * 0.035 * (0.6 + 0.4 * schwell)
		var g: float = glocken[t]
		if g > 0.0 and im_takt > 0.5:
			var gz := im_takt - 0.5
			v += sin(TAU * g * zeit) * 0.09 * exp(-gz * 5.0)
		d[i] = v * 0.8
	return _wav(d, true)
