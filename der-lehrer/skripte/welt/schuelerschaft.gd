class_name Schuelerschaft
extends Node3D
## Verwaltet die Statisten: Nur im aktuellen Bereich gibt es Schülerinnen und Schüler.
## Wer wo ist, legt jeder Bereich in statisten_plan(phase) fest; die Anzahl richtet sich nach der Grafikstufe.
## Phasen: "" (niemand), "abend" (Heimspielabend, Akt 2–3), "nacht" (Akt 4, nur Black Roses),
## "morgen" (Prüfungsmorgen), "danach" (nach der Prüfung).

const HOECHSTENS := {"niedrig": 4, "mittel": 8, "hoch": 12}
const NAMEN := ["Kevin", "Jacqueline", "Dennis", "Mehmet", "Lena", "Tyler", "Chantal", "Lukas", "Ayşe", "Jonas",
	"Svetlana", "Marco", "Brittany", "Leon", "Emma", "Dustin", "Jessica", "Nico", "Fatma", "Brandon"]
const NAMEN_ROSES := ["Rico", "Dante", "Luca", "Enzo"]

var spieler: Node3D
var liste: Array[Schueler] = []
var _bereich: Bereich
var _phase := ""
var _stufe := ""


func aktualisieren(bereich: Bereich, phase: String) -> void:
	if bereich == _bereich and phase == _phase and Grafik.stufe == _stufe:
		return
	_bereich = bereich
	_phase = phase
	_stufe = Grafik.stufe
	for s in liste:
		s.queue_free()
	liste.clear()
	if bereich == null or phase == "":
		return
	var plan: Array = bereich.statisten_plan(phase)
	var anzahl := mini(plan.size(), int(HOECHSTENS.get(Grafik.stufe, 8)))
	for i in anzahl:
		var e: Dictionary = plan[i]
		var saat := hash(bereich.titel + phase) % 10000 + i * 31
		var rose: bool = e.get("rose", false)
		var stil := Statisten.black_rose(saat) if rose else Statisten.stil(saat)
		var s := Schueler.new(stil, e.get("art", "stehen"))
		s.spieler = spieler
		s.anzeigename = NAMEN_ROSES[i % NAMEN_ROSES.size()] if rose else NAMEN[saat % NAMEN.size()]
		s.sprueche = e.get("sprueche", "statisten_black_roses" if rose else "statisten_" + phase)
		if e.has("weg"):
			for p in e["weg"]:
				s.weg.append(bereich.to_global(p))
		var pos: Vector3 = e.get("pos", e["weg"][0] if e.has("weg") else Vector3.ZERO)
		s.position = bereich.to_global(pos)
		s.rotation.y = float(e.get("blick", 0.0))
		add_child(s)
		s.interaktiv = Interaktiv.neu(s, "schueler:%d" % i, Vector3.ZERO, "Ansprechen", 1.3)
		s.interaktiv.nachrang = 0.7
		liste.append(s)


func finden(id: String) -> Schueler:
	var i := int(id.get_slice(":", 1))
	return liste[i] if i >= 0 and i < liste.size() else null
