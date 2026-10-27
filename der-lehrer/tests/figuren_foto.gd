extends SceneTree
## Fotos aller Figuren (Ganzkörper und Köpfe) zur Kontrolle des Aussehens.
## Aufruf (mit Grafik): godot --path . -s tests/figuren_foto.gd -- --ordner=<pfad>

var _ordner := "user://figuren"


func _initialize() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--ordner="):
			_ordner = a.substr(9)
	DirAccess.make_dir_recursive_absolute(_ordner)
	_ablauf.call_deferred()


func _ablauf() -> void:
	root.size = Vector2i(1600, 900)
	var welt := Node3D.new()
	root.add_child(welt)
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.18, 0.17, 0.2)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.55, 0.52, 0.5)
	env.ambient_light_energy = 0.55
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	var we := WorldEnvironment.new()
	we.environment = env
	welt.add_child(we)
	var boden := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(20, 20)
	boden.mesh = pm
	var bm := StandardMaterial3D.new()
	bm.albedo_color = Color(0.4, 0.38, 0.35)
	boden.material_override = bm
	welt.add_child(boden)
	var sonne := DirectionalLight3D.new()
	sonne.rotation = Vector3(-0.7, 0.5, 0)
	sonne.light_energy = 1.1
	sonne.shadow_enabled = true
	welt.add_child(sonne)
	var lampe := OmniLight3D.new()
	lampe.position = Vector3(0, 2.6, 2.5)
	lampe.light_color = Color(1.0, 0.85, 0.65)
	lampe.light_energy = 1.4
	lampe.omni_range = 9.0
	welt.add_child(lampe)
	var leute: Array[Person] = [Lehrer.new(), Nebenfiguren.kowalski(), Nebenfiguren.rosalita(), Nebenfiguren.bradley(),
		Nebenfiguren.sparky(), Nebenfiguren.vince()]
	for s in Statisten.stile(6, 7):
		leute.append(Person.new(s))
	var x := -float(leute.size() - 1) * 0.45
	for p in leute:
		p.position = Vector3(x, 0, 0)
		p.rotation.y = PI
		welt.add_child(p)
		x += 0.9
	var kam := Camera3D.new()
	kam.fov = 52
	welt.add_child(kam)
	kam.look_at_from_position(Vector3(0, 1.4, 7.5), Vector3(0, 0.95, 0))
	for i in 20:
		await process_frame
	await _foto("alle")
	# Köpfe einzeln, leicht von der Seite
	for i in 6:
		var p := leute[i]
		var kopf := p.figur.kopf_position()
		kam.fov = 30
		kam.look_at_from_position(kopf + Vector3(0.25, 0.05, 0.75), kopf)
		if i == 0:
			p.figur.spricht = true
		for j in 6:
			await process_frame
		await _foto("kopf_%d" % i)
	# Haltungen von vorn, halbnah
	kam.fov = 34
	kam.look_at_from_position(Vector3(-1.8, 1.3, 3.2), Vector3(-1.8, 1.05, 0))
	for j in 6:
		await process_frame
	await _foto("halbnah")
	# Sitzen und Gehen
	leute[7].figur.sitzt = true
	leute[8].figur.bewegung = 1.0
	kam.look_at_from_position(Vector3(1.8, 1.2, 3.0), Vector3(1.8, 0.8, 0))
	for j in 10:
		await process_frame
	await _foto("statisten")
	# Porträt wie im Hauptmenü (Comic-Konturen)
	welt.queue_free()
	var portraet := Portraet.new(Vector2i(640, 800))
	root.add_child(portraet)
	for j in 12:
		await process_frame
	await _foto("portraet")
	quit()


func _foto(name: String) -> void:
	await RenderingServer.frame_post_draw
	var img := root.get_texture().get_image()
	img.save_png("%s/%s.png" % [_ordner, name])
	print("Foto: ", name)
