class_name Interaktiv
extends Node3D
## Etwas, mit dem die Spielfigur per [E] interagieren kann.

var id := ""
var hinweis := ""
var radius := 1.9
var aktiv := true
## wird beim Suchen zum Abstand addiert (Statisten treten hinter Anlagen und Türen zurück)
var nachrang := 0.0


static func neu(eltern: Node3D, p_id: String, pos: Vector3, p_hinweis: String, p_radius: float = 1.9) -> Interaktiv:
	var i := Interaktiv.new()
	i.id = p_id
	i.hinweis = p_hinweis
	i.radius = p_radius
	i.position = pos
	i.add_to_group("interaktiv")
	eltern.add_child(i)
	return i
