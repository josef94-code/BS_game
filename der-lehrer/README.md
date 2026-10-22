# DER LEHRER – Lincoln High

3D-Lernspiel für **Mechatroniker/-innen, Klasse MT10 (10. Jahrgangsstufe)**, Berufsschule Bayern.
Godot 4.5 (GDScript), Export als portable Windows-Anwendung (eine `.exe`, keine Installation, keine Admin-Rechte).

> Die Lincoln High wurde gerade frisch saniert. Trotzdem flackert das Licht, das Förderband zur Cafeteria steht
> und die Schulglocke läutet, wann sie will. Alle reden von Kinderkrankheiten. Nur einer glaubt nicht an Zufälle:
> **der Lehrer** – Mr. Josef, Klassenleiter der MT10. Er gibt dem Neuen erste Aufträge …

**Grafikstil:** an GTA III angelehnt – Low-Poly-Figuren mit realistischen Proportionen und gemalten Gesichtern
(Gesichtstextur mit Blinzeln, im Code erzeugt), schmuddelige Texturen, viel Kleinkram (Lüftungskanal, Kabeltrassen,
Ventile, Feuerlöscher, Maschendraht-Lager, Hausmeister-Ecke, Wanduhr mit Spielzeit),
Nebel, Lichtinseln aus Glühbirnen und Leuchtstoffröhren, weicher PS2-Filter mit Filmkorn, HUD mit Uhr und grünen
Ruf-Ziffern, Hilfe-Box oben links, Untertitel, Missionstitel unten rechts. Menü und Ladebildschirm zeigen den Lehrer
als Porträt mit kräftigen Konturen.

**Stand: Prototyp v0.5** – ein Raum (Hausmeisterkeller mit Büro des Lehrers) und vier Missionen aus Akt 1.
Seit v0.5 sind die Aufgaben mit den Lernunterlagen (ET, Schütztechnik, LtK) abgeglichen. Der Gesamtplan (drei Akte, 24 Missionen) steht in [`PLAN.md`](PLAN.md).

## Starten

**Für Schülerinnen und Schüler:** `DerLehrer.exe` herunterladen und doppelklicken. Fertig.

- Die `.exe` wird automatisch gebaut: GitHub → *Actions* → *DER LEHRER – Windows-Build* → neuester Lauf → Artefakt **DerLehrer-Windows**.
- Läuft auch vom USB-Stick oder Netzlaufwerk. Grafik: OpenGL 3.3 (Godot „Compatibility“), ohne passenden OpenGL-Treiber weicht Godot unter Windows auf Direct3D 11 (ANGLE) aus.
- Fenstergröße: beliebig, die Oberfläche skaliert mit (getestet mit 1280×720 und 1600×900).

## Steuerung

| Taste | Funktion |
|---|---|
| W A S D | laufen (Shift = rennen, Leertaste = springen) |
| Maus | umsehen, Mausrad = Kamera-Abstand |
| E | benutzen, mit dem Lehrer sprechen, Dialog weiter |
| B oder Tab | Beweisbrett (Hinweise, offene Fragen, Sammelobjekte) |
| Esc | Pause: Speichern, Laden, Steuerung, Ton, Hauptmenü |

## Spielablauf (GTA-Stil)

1. Der **Hut auf der Minimap** zeigt den Lehrer, der **gelbe Punkt** und der **gelbe Lichtkegel** am Boden zeigen das Ziel.
2. Beim Lehrer den Auftrag annehmen → **Missionstitel** wird groß eingeblendet.
3. Zur Anlage gehen, mit **E** untersuchen → Fachaufgaben lösen.
4. Die Anlage läuft wieder, ein **Beweisstück** taucht auf (Zwischensequenz mit Letterbox und Untertiteln).
5. Zurück zum Lehrer → **MISSION PASSED** mit Ruf-Belohnung.

**Ruf statt Geld:** Laufbursche (0) → Klassensprecher (100) → Schülersprecher (160) → Capo (250) → Consigliere (450).
Jede gelöste Aufgabe beim ersten Versuch gibt +2 Bonus-Ruf. Nach drei Fehlversuchen kann man sich die Lösung zeigen lassen
(kein Bonus, wird in der Statistik vermerkt). Falsche Antworten kosten nichts – es gibt gestufte Tipps vom Lehrer.

Außerdem: **Schulradio WLHS 88.3** mit Sprüchen und Durchsagen, **drei versteckte Bauteile** im Keller,
am Ende eine **Bilanz** (gelöste Aufgaben, davon beim ersten Versuch, Spielzeit).

## Speichern und Laden

Esc → **Spiel speichern …** öffnet den Windows-Dateidialog. Der Schüler wählt den Ort selbst, z. B. das persönliche
Netzlaufwerk. Der Spielstand ist eine kleine Textdatei (`lehrer_<name>.lehrer`, ca. 2 KB) mit Ruf, Missionsstand,
Beweisen, Position und der Statistik je Aufgabe. Laden über das Hauptmenü oder das Pausenmenü.

## Missionen und Lehrplanbezug (Prototyp)

| # | Mission | Anlage | Fachaufgaben | Lernfeld |
|---|---|---|---|---|
| 1 | Flackerndes Licht | Leuchte, Abzweigdose -XD3, Notleuchte | Kennbuchstaben, Vorwiderstand berechnen (Ohm’sches Gesetz), Übergangswiderstand R = U/I, fünf Sicherheitsregeln (Reihenfolge), zweipoliger Spannungsprüfer | LF 3 (ET) |
| 2 | Die Glocke lügt | Klingelanlage: -FC1, -SJ3, -KF1, -PB1 (24 V) | Schließer/Öffner, Anschlussbezeichnungen (13–14, 21–22), Fehlersuche am Stromlaufplan mit Messwerten, fachgerechtes Vorgehen | LF 4 (Att) |
| 3 | Stillstand | Förderband, Schaltschrank +S1 | Selbsthaltung mit Vorrang AUS (-SJ1, -SJ2, -QA1), im Probelauf testen, Selbsthaltung statt Rastung, Motorschutzrelais -BC1 nach Typenschild, Hilfskontakte 95–96 / 97–98 | LF 4 (Att) |
| 4 | Gelöschte Spuren | Netzwerkschrank +N1 (Switch, Router, Firewall, NAS) | Datenschutz vs. Datensicherheit, 3-2-1-1-0-Regel, RAID ist kein Backup, Schutzziele, Prinzip der geringsten Rechte, TOM (Eingabekontrolle) | LF 5 (LtK) |

Betriebsmittelkennzeichnung wie in den Lernunterlagen nach DIN EN 81346-2: -FC Leitungsschutzschalter, -SJ Drucktaster,
-SG0 Not-Halt, -QA Schütz, -BC Motorschutzrelais, -KF Hilfsschütz/Relais/Zeitrelais, -PF Meldeleuchte, -MA Motor;
Steuerstromkreis von 24 V nach 0 V. Die Kennzeichnung der Glocke (-PB1) steht nicht in den Unterlagen und ist noch zu prüfen.

Grundlage sind die Lehrplanrichtlinien Mechatroniker/-in (Bayern, 2018), die Didaktische Jahresplanung LtK 10 und die
Lernunterlagen der Staatlichen Berufsschule I Kempten: Elektrotechnik (LF 3, Kap. 1–4), Automatisierungstechnik Teil A –
Schütztechnik (LF 1/4) und LtK (LF 5). Die Zuordnung jeder Aufgabe zu Fach und Lehrplaninhalt steht in
[`unterlagen/QUELLEN.md`](unterlagen/QUELLEN.md).

### Lösungen (für die Lehrkraft)

Rechenaufgaben haben Zufallswerte (je Spielstand andere Zahlen). Ergebnisse wie in den Lernunterlagen mit drei gültigen Stellen, Toleranz 2 %:

| Aufgabe | Lösung |
|---|---|
| Kennbuchstaben | F (Sicherung) |
| Vorwiderstand | R = (U – U_L) / I (z. B. (12 V – 6 V) / 0,1 A = 60,0 Ω) |
| Messprotokoll | R = U / I (z. B. 4,6 V / 0,16 A ≈ 28,8 Ω) |
| Sicherheitsregeln | Freischalten – gegen Wiedereinschalten sichern – Spannungsfreiheit feststellen – erden und kurzschließen – benachbarte Teile abdecken |
| Werkzeug | zweipoliger Spannungsprüfer |
| Schließer | unbetätigt offen, betätigt geschlossen |
| Anschlussbezeichnung Öffner | 21–22 |
| Die Glocke lügt | Fehler bei -KF1: am Öffnerkontakt statt am Schließer angeschlossen |
| Fachgerecht beheben | Sicherheitsregeln, dann auf Schließer umklemmen, Funktion prüfen |
| Was fehlt? | Selbsthaltung: Schließer (13–14) von -QA1 parallel zu -SJ2 |
| Steuerstromkreis | Lücke 1: -SJ1 Öffner (21–22), Lücken 2/3: -SJ2 Schließer und -QA1 Schließer (13–14), Reihenfolge der Parallelzweige egal |
| Warum keine Rastung? | nach Stromausfall bleibt das Band aus, bis jemand bewusst EIN drückt |
| Motorschutz | Bemessungsstrom vom Typenschild (7,5 A / 8,2 A / 9,5 A) |
| 95–96 | Öffner, öffnet bei Überlast → -QA1 fällt ab |
| Datenschutz oder Datensicherheit? | Schutz der personenbezogenen Daten (Namen der Schüler) |
| 3-2-1-1-0-Regel | 3 Kopien, 2 Medien, 1 außer Haus, 1 offline/unveränderbar, 0 Fehler bei der Wiederherstellungsprüfung |
| RAID ist kein Backup | RAID 1 spiegelt auch das Löschen sofort mit |
| Schutzziele | Integrität |
| Wer darf was? | Prinzip der geringsten Rechte, Fernwartung nur befristet |
| Wer hat was wann geändert? | Eingabekontrolle |

## Für die Lehrkraft

- **Lehrkraft-Modus:** Verknüpfung auf `DerLehrer.exe` anlegen und als Ziel `DerLehrer.exe -- --lehrer` eintragen.
  In den Aufgaben wird dann die Lösung angezeigt, **F9** löst die aktuelle Aufgabe.
- **Aufgaben ändern ohne Programmieren:** Alle Aufgaben stehen in [`daten/aufgaben.json`](daten/aufgaben.json),
  Missionen in `quests.json`, Dialoge in `dialoge.json`, Beweise/Sammelobjekte in `beweise.json`, Radiosprüche in `radio.json`.
  Wer eine geänderte Datei in einen Ordner `daten` **neben die DerLehrer.exe** legt, überschreibt damit die eingebaute Version
  (fehlerhafte Dateien werden ignoriert). Nach Änderungen am Projekt `godot --headless -s tests/test_daten.gd` laufen lassen:
  Das prüft Verweise, Rechenausdrücke (60 Zufallsvarianten je Aufgabe) und die Musterlösungen.
- **Statistik:** Die Spielstand-Datei enthält unter `statistik` je Aufgabe die Zahl der Versuche und ob sie beim ersten Versuch gelöst wurde.

## Technik

```
der-lehrer/
├─ project.godot, export_presets.cfg   Godot-Projekt, Export „Windows portable“ (PCK eingebettet)
├─ daten/            Aufgaben, Quests, Dialoge, Beweise, Radio (JSON)
├─ szenen/           hauptmenue.tscn, welt/spiel.tscn
├─ skripte/
│  ├─ autoload/      Daten, Spielstand (Speichern/Laden), Audio (Klangsynthese), AufgabenLogik
│  ├─ welt/          Bau (Grundkörper, Materialien, prozedurale Texturen), Keller (Raum + Anlagen)
│  ├─ figuren/       Figur (Comic-Figur aus Grundkörpern), Spieler (Third-Person), Lehrer
│  ├─ ui/            HUD, Minimap, Dialoge, Aufgabenfenster, Beweisbrett, Pausenmenü, Zwischensequenzen
│  │  └─ aufgaben/   Multiple Choice, Berechnung, Sortieren, Fehlersuche, Schützschaltung, Stromlaufplan-Zeichner
│  ├─ spiel.gd       Spielablauf (Missionen)
│  └─ autotest.gd    automatischer Durchlauf mit Bildschirmfotos (--autotest)
├─ shader/           PS2-Filter, Kontur, Lichtkegel, Missionsmarker, Minimap-Maske
├─ fonts/            Special Elite, Anton, Oswald (SIL OFL)
└─ tests/            Datenprüfung
```

- Alle 3D-Modelle, Texturen, Klänge und die Musik werden im Code erzeugt – keine fremden Assets, Logos oder Namen aus GTA.
- **Selbst bauen:** Godot 4.5.1 mit Windows-Exportvorlagen, dann `godot --headless --export-release "Windows portable" ../build/DerLehrer.exe`.
- **Komplett-Test:** `godot -- --autotest --shots=<ordner>` spielt alle Missionen automatisch durch, speichert/lädt und legt Bildschirmfotos ab.

## Nächste Schritte

1. Unterlagen in `/unterlagen` einarbeiten (Aufgaben ohne Vorgriffe)
2. Weitere Räume (Flur mit Spinden, Cafeteria, Turnhalle, Werkstatt) und der Rest von Akt 1
3. Akt 2 mit Verdächtigen, falschen Fährten und Überläuferin; Akt 3 mit Finale
4. Weitere Figuren (Hausmeister Kowalski, Sekretärin, Rivalen), Ladebildschirme je Akt
