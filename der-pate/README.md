# DER PATE – Lincoln High

3D-Lernspiel für **Mechatroniker/-innen, 10. Jahrgangsstufe** (Berufsschule Bayern).
Godot 4.5 (GDScript), Export als portable Windows-Anwendung (eine `.exe`, keine Installation, keine Admin-Rechte).

> Die Lincoln High wurde gerade frisch saniert. Trotzdem flackert das Licht, das Förderband zur Cafeteria steht
> und die Schulglocke läutet, wann sie will. Alle reden von Kinderkrankheiten. Nur einer glaubt nicht an Zufälle:
> **der Pate** – Elektrotechnik-Lehrer Mr. Josef. Er gibt dem Neuen erste Aufträge …

**Grafikstil:** an GTA III angelehnt – Low-Poly-Figuren mit realistischen Proportionen und gemalten Gesichtern
(Gesichtstextur mit Blinzeln, im Code erzeugt), schmuddelige Texturen, viel Kleinkram (Lüftungskanal, Kabeltrassen,
Ventile, Feuerlöscher, Maschendraht-Lager, Hausmeister-Ecke, Wanduhr mit Spielzeit),
Nebel, Lichtinseln aus Glühbirnen und Leuchtstoffröhren, weicher PS2-Filter mit Filmkorn, HUD mit Uhr und grünen
Ruf-Ziffern, Hilfe-Box oben links, Untertitel, Missionstitel unten rechts. Menü und Ladebildschirm zeigen den Paten
als Porträt mit kräftigen Konturen.

**Stand: Prototyp v0.4** – ein Raum (Hausmeisterkeller mit Büro des Paten) und vier Missionen aus Akt 1.
Seit v0.4 gibt es eine vierte Mission zu LtK (Lernfeld 5). Der Gesamtplan (drei Akte, 24 Missionen) steht in [`PLAN.md`](PLAN.md).

## Starten

**Für Schülerinnen und Schüler:** `DerPate.exe` herunterladen und doppelklicken. Fertig.

- Die `.exe` wird automatisch gebaut: GitHub → *Actions* → *DER PATE – Windows-Build* → neuester Lauf → Artefakt **DerPate-Windows**.
- Läuft auch vom USB-Stick oder Netzlaufwerk. Grafik: OpenGL 3.3 (Godot „Compatibility“), ohne passenden OpenGL-Treiber weicht Godot unter Windows auf Direct3D 11 (ANGLE) aus.
- Fenstergröße: beliebig, die Oberfläche skaliert mit (getestet mit 1280×720 und 1600×900).

## Steuerung

| Taste | Funktion |
|---|---|
| W A S D | laufen (Shift = rennen, Leertaste = springen) |
| Maus | umsehen, Mausrad = Kamera-Abstand |
| E | benutzen, mit dem Paten sprechen, Dialog weiter |
| B oder Tab | Beweisbrett (Hinweise, offene Fragen, Sammelobjekte) |
| Esc | Pause: Speichern, Laden, Steuerung, Ton, Hauptmenü |

## Spielablauf (GTA-Stil)

1. Der **Hut auf der Minimap** zeigt den Paten, der **gelbe Punkt** und der **gelbe Lichtkegel** am Boden zeigen das Ziel.
2. Beim Paten den Auftrag annehmen → **Missionstitel** wird groß eingeblendet.
3. Zur Anlage gehen, mit **E** untersuchen → Fachaufgaben lösen.
4. Die Anlage läuft wieder, ein **Beweisstück** taucht auf (Zwischensequenz mit Letterbox und Untertiteln).
5. Zurück zum Paten → **MISSION PASSED** mit Ruf-Belohnung.

**Ruf statt Geld:** Laufbursche (0) → Lehrling (100) → Capo (250) → Consigliere (450).
Jede gelöste Aufgabe beim ersten Versuch gibt +2 Bonus-Ruf. Nach drei Fehlversuchen kann man sich die Lösung zeigen lassen
(kein Bonus, wird in der Statistik vermerkt). Falsche Antworten kosten nichts – es gibt gestufte Tipps vom Paten.

Außerdem: **Schulradio WLHS 88.3** mit Sprüchen und Durchsagen, **drei versteckte Bauteile** im Keller,
am Ende eine **Bilanz** (gelöste Aufgaben, davon beim ersten Versuch, Spielzeit).

## Speichern und Laden

Esc → **Spiel speichern …** öffnet den Windows-Dateidialog. Der Schüler wählt den Ort selbst, z. B. das persönliche
Netzlaufwerk. Der Spielstand ist eine kleine Textdatei (`pate_<name>.pate`, ca. 2 KB) mit Ruf, Missionsstand,
Beweisen, Position und der Statistik je Aufgabe. Laden über das Hauptmenü oder das Pausenmenü.

## Missionen und Lehrplanbezug (Prototyp)

| # | Mission | Anlage | Fachaufgaben | Lernfeld |
|---|---|---|---|---|
| 1 | Flackerndes Licht | Leuchte, Abzweigdose -XD3 | I = P/U (Typenschild), Übergangswiderstand R = U/I, Verlustleistung P = U·I an der Klemme, fünf Sicherheitsregeln (Reihenfolge), zweipoliger Spannungsprüfer | LF 3 |
| 2 | Die Glocke lügt | Klingelanlage: -FC2, -SF3, -KF1, -PB1 | Schließer/Öffner, Funktionsziffern (13–14, 11–12, 95–96, A1–A2), Fehlersuche am Stromlaufplan mit Messwerten, fachgerechtes Vorgehen | LF 3/4 |
| 3 | Stillstand | Förderband, Schaltschrank +S1 | Selbsthaltung, Steuerstromkreis vervollständigen und im Probelauf testen, Motorschutzrelais -BC1 nach Typenschild einstellen, Hilfskontakt 95–96 | LF 4 |
| 4 | Gelöschte Spuren | Netzwerkschrank +N1 (Switch, Router, Firewall, NAS) | Datenschutz vs. Datensicherheit, 3-2-1-1-0-Regel, RAID ist kein Backup, Schutzziele, Rechtekonzept für die Fernwartung | LF 5 (LtK) |

Betriebsmittelkennzeichnung nach DIN EN 81346-2 (z. B. -FC Leitungsschutzschalter, -BC Motorschutzrelais, -QA Schütz,
-SF Taster, -KF Zeitschaltuhr, -MA Motor), Schaltzeichen nach DIN EN 60617. Die Kennzeichnung der Glocke (-PB1) ist noch
mit den Unterlagen abzugleichen.
Grundlage sind die Lehrplanrichtlinien Mechatroniker/-in (Bayern, 2018) und die Didaktische Jahresplanung LtK 10
(Lernfeld 5, Logistik und technische Kommunikation). Die Zuordnung jeder Aufgabe zu Fach und Lehrplaninhalt steht in
[`unterlagen/QUELLEN.md`](unterlagen/QUELLEN.md).

### Lösungen (für die Lehrkraft)

Rechenaufgaben haben Zufallswerte (je Spielstand andere Zahlen, Toleranz 2 %):

| Aufgabe | Lösung |
|---|---|
| Typenschild der Leuchte | I = P / U (z. B. 36 W / 230 V ≈ 0,157 A) |
| Messprotokoll | R = U / I (z. B. 4,6 V / 0,16 A = 28,75 Ω) |
| Heiße Klemme | P = U · I (z. B. 4,6 V · 0,16 A ≈ 0,74 W) |
| Sicherheitsregeln | Freischalten – gegen Wiedereinschalten sichern – Spannungsfreiheit feststellen – erden und kurzschließen – benachbarte Teile abdecken |
| Werkzeug | zweipoliger Spannungsprüfer |
| Schließer | unbetätigt offen, betätigt geschlossen |
| Klemmen Schließer | 13–14 |
| Die Glocke lügt | Fehler bei -KF1: am Öffnerkontakt statt am Schließer angeschlossen |
| Fachgerecht beheben | Sicherheitsregeln, dann auf Schließer umklemmen, Funktion prüfen |
| Was fehlt? | Selbsthaltung: Schließer von -QA1 parallel zu -SF2 |
| Steuerstromkreis | Lücke 1: -SF1 Öffner, Lücken 2/3: -SF2 Schließer und -QA1 Schließer (13–14), Reihenfolge der Parallelzweige egal |
| Motorschutz | Bemessungsstrom vom Typenschild (1,5 A / 1,9 A / 2,6 A) |
| 95–96 | Öffner, öffnet bei Überlast → -QA1 fällt ab |
| Datenschutz oder Datensicherheit? | Schutz der personenbezogenen Daten (Namen der Schüler) |
| 3-2-1-1-0-Regel | 3 Kopien, 2 Medien, 1 außer Haus, 1 offline/unveränderbar, 0 Fehler bei der Wiederherstellungsprüfung |
| RAID ist kein Backup | RAID 1 spiegelt auch das Löschen sofort mit |
| Schutzziele | Integrität |
| Wer darf was? | Fernwartung nur bei Bedarf, minimale Rechte, sicheres Passwort |

## Für die Lehrkraft

- **Lehrkraft-Modus:** Verknüpfung auf `DerPate.exe` anlegen und als Ziel `DerPate.exe -- --lehrer` eintragen.
  In den Aufgaben wird dann die Lösung angezeigt, **F9** löst die aktuelle Aufgabe.
- **Aufgaben ändern ohne Programmieren:** Alle Aufgaben stehen in [`daten/aufgaben.json`](daten/aufgaben.json),
  Missionen in `quests.json`, Dialoge in `dialoge.json`, Beweise/Sammelobjekte in `beweise.json`, Radiosprüche in `radio.json`.
  Wer eine geänderte Datei in einen Ordner `daten` **neben die DerPate.exe** legt, überschreibt damit die eingebaute Version
  (fehlerhafte Dateien werden ignoriert). Nach Änderungen am Projekt `godot --headless -s tests/test_daten.gd` laufen lassen:
  Das prüft Verweise, Rechenausdrücke (60 Zufallsvarianten je Aufgabe) und die Musterlösungen.
- **Statistik:** Die Spielstand-Datei enthält unter `statistik` je Aufgabe die Zahl der Versuche und ob sie beim ersten Versuch gelöst wurde.

## Technik

```
der-pate/
├─ project.godot, export_presets.cfg   Godot-Projekt, Export „Windows portable“ (PCK eingebettet)
├─ daten/            Aufgaben, Quests, Dialoge, Beweise, Radio (JSON)
├─ szenen/           hauptmenue.tscn, welt/spiel.tscn
├─ skripte/
│  ├─ autoload/      Daten, Spielstand (Speichern/Laden), Audio (Klangsynthese), AufgabenLogik
│  ├─ welt/          Bau (Grundkörper, Materialien, prozedurale Texturen), Keller (Raum + Anlagen)
│  ├─ figuren/       Figur (Comic-Figur aus Grundkörpern), Spieler (Third-Person), Pate
│  ├─ ui/            HUD, Minimap, Dialoge, Aufgabenfenster, Beweisbrett, Pausenmenü, Zwischensequenzen
│  │  └─ aufgaben/   Multiple Choice, Berechnung, Sortieren, Fehlersuche, Schützschaltung, Stromlaufplan-Zeichner
│  ├─ spiel.gd       Spielablauf (Missionen)
│  └─ autotest.gd    automatischer Durchlauf mit Bildschirmfotos (--autotest)
├─ shader/           PS2-Filter, Kontur, Lichtkegel, Missionsmarker, Minimap-Maske
├─ fonts/            Special Elite, Anton, Oswald (SIL OFL)
└─ tests/            Datenprüfung
```

- Alle 3D-Modelle, Texturen, Klänge und die Musik werden im Code erzeugt – keine fremden Assets, Logos oder Namen aus GTA.
- **Selbst bauen:** Godot 4.5.1 mit Windows-Exportvorlagen, dann `godot --headless --export-release "Windows portable" ../build/DerPate.exe`.
- **Komplett-Test:** `godot -- --autotest --shots=<ordner>` spielt alle Missionen automatisch durch, speichert/lädt und legt Bildschirmfotos ab.

## Nächste Schritte

1. Unterlagen in `/unterlagen` einarbeiten (Aufgaben ohne Vorgriffe)
2. Weitere Räume (Flur mit Spinden, Cafeteria, Turnhalle, Werkstatt) und der Rest von Akt 1
3. Akt 2 mit Verdächtigen, falschen Fährten und Überläuferin; Akt 3 mit Finale
4. Weitere Figuren (Hausmeister Kowalski, Sekretärin, Rivalen), Ladebildschirme je Akt
