# DER LEHRER – Plan (zur Freigabe)

3D-Lernspiel für Mechatroniker/-innen, 10. Jahrgangsstufe. Godot 4.x (GDScript), Export als
portable Windows-`.exe` (PCK eingebettet, keine Installation, keine Admin-Rechte).
Gesamtspielzeit ca. 3–4 h, 24 Hauptaufträge à ca. 6–10 min, dazu freies Erkunden und Sammelobjekte.

> **Unterlagen:** Lehrplanrichtlinien Mechatroniker/-in (Bayern 2018) und Didaktische Jahresplanung LtK 10
> (LtK = Logistik und technische Kommunikation, LF 5). Zuordnung siehe [`unterlagen/QUELLEN.md`](unterlagen/QUELLEN.md).
> Für Elektrotechnik und Automatisierungstechnik fehlen noch die eigenen Unterrichtsunterlagen.

---

## 1. Ordnerstruktur

```
der-lehrer/
├─ PLAN.md                 dieses Dokument
├─ README.md               Anleitung für Lehrkraft und Schüler, Lösungen
├─ project.godot
├─ export_presets.cfg      Preset "Windows portable" (embed_pck = true)
├─ daten/
│  ├─ aufgaben.json        ALLE Fachaufgaben (Fragen, Antworten, Werte, Toleranzen, Tipps, Quelle in /unterlagen)
│  ├─ quests.json          Missionen: Akt, Auftraggeber, Ort, Ziele, Aufgaben-IDs, Beweisstück, Ruf-Belohnung
│  ├─ dialoge.json         NPC-Dialoge (Baumstruktur, Bedingungen auf Quest-/Ruf-Status)
│  ├─ beweise.json         Beweisstücke, Hinweise, offene Fragen fürs Beweisbrett
│  └─ radio.json           Schulradio: Sprüche, Durchsagen je Akt
├─ szenen/
│  ├─ hauptmenue.tscn, ladebildschirm.tscn
│  ├─ welt/                schule.tscn, flur.tscn, buero_lehrer.tscn, cafeteria.tscn,
│  │                       turnhalle.tscn, werkstatt.tscn, keller.tscn
│  ├─ figuren/             spieler.tscn, npc.tscn, lehrer.tscn
│  ├─ anlagen/             schaltschrank.tscn, foerderband.tscn, beleuchtung.tscn,
│  │                       schulglocke.tscn, netzwerkschrank.tscn  (interaktive Fehlersuche)
│  ├─ ui/                  hud.tscn, minimap.tscn, dialog.tscn, aufgabe_*.tscn,
│  │                       beweisbrett.tscn, mission_titel.tscn, mission_passed.tscn
│  └─ sequenzen/           zwischensequenzen (AnimationPlayer + Kamerapfade)
├─ skripte/
│  ├─ autoload/            spielstand.gd (Ruf, Quests, Beweise, Sammelobjekte),
│  │                       quest_manager.gd, aufgaben_db.gd, audio.gd, radio.gd
│  ├─ spieler/             spieler.gd (Third-Person, WASD + Maus), kamera.gd
│  ├─ npc/                 npc.gd, dialog_system.gd
│  ├─ aufgaben/            multiple_choice.gd, berechnung.gd, logik_baukasten.gd,
│  │                       schuetz_baukasten.gd, fehlersuche.gd
│  └─ ui/                  hud.gd, minimap.gd, beweisbrett.gd, speichern_laden.gd
├─ assets/
│  ├─ modelle/             eigene Low-Poly-Modelle (Comic-Stil, Outline-Shader)
│  ├─ texturen/, shader/   toon.gdshader, outline.gdshader
│  ├─ audio/               Musik/Effekte (eigene oder CC0, Lizenzliste)
│  ├─ fonts/               freie Schriften (OFL)
│  └─ artwork/             Ladebildschirme, Porträts
└─ werkzeuge/              Skripte: JSON prüfen, Export bauen
```

## 2. Technik-Entscheidungen

| Thema | Umsetzung |
|---|---|
| Engine | Godot 4.x stabil, Renderer *Compatibility* (OpenGL 3.3) → läuft auch auf älteren Schulrechnern |
| Export | Windows Desktop, `embed_pck`, eine `.exe` (~80–120 MB), läuft vom USB-Stick/Netzlaufwerk |
| Optik | Toon-Shading + schwarze Konturen, satte Farben, überzeichnete Figuren aus eigenen Low-Poly-Modellen (in Godot aus Grundkörpern bzw. selbst modelliert, keine Fremd-Assets) |
| Speichern | `FileDialog` (native Dialog), Schüler wählt Ort; Spielstand als eine kleine `.lehrer`-Datei (JSON, ~2 KB). Zusätzlich optional Schnellspeicher im Benutzerordner (`user://`) |
| Aufgaben | nur in `daten/aufgaben.json`; jede Aufgabe hat ID, Typ, Schwierigkeit (1–4 = Ruf-Stufe), Quelle (Datei/Seite in `/unterlagen`) |
| Zufall | Berechnungsaufgaben mit Wertebereichen → jeder Schüler bekommt andere Zahlen (gegen Abschreiben) |
| Fehlversuche | kein Game Over; nach Fehler gestufte Tipps vom Lehrer ("Ein kluger Mann fragt zweimal"), Ruf-Bonus sinkt leicht |
| Lehrkraft | Testmodus per Startparameter `--lehrer` (alle Quests freischalten, Lösungen anzeigen) |

## 3. Spielablauf

**Grundschleife:** Schule erkunden → Marker/Auftraggeber-Icon auf der Minimap → Dialog, Auftrag annehmen
→ Missionstitel groß eingeblendet → Ort aufsuchen, Anlage untersuchen → Fachaufgabe(n) lösen
→ Anlage läuft wieder → Beweisstück gefunden → **MISSION PASSED** + Ruf → Beweisbrett aktualisiert.

**Ruf-System (Stufen):**

| Stufe | Ruf | Schwierigkeit | freigeschaltete Bereiche |
|---|---|---|---|
| Laufbursche | 0–99 | Grundbegriffe, einfache Rechnungen | Flur, Büro des Lehrers, Cafeteria |
| Klassensprecher | 100–159 | mehrstufige Rechnungen, einfache Schützschaltungen | Werkstatt |
| Schülersprecher | 160–299 | Netzwerk, Datensicherheit, Schützschaltungen mit Motorschutz | Turnhalle |
| Capo | 300–699 | Verriegelungen, Logik, Fehlersuche mit Messgerät | Hausmeisterkeller |
| Consigliere | 700+ | Abschlussprüfung, kombinierte Aufgaben | Ende |

**HUD:** Minimap unten links (Auftraggeber-Icons, Marker, Ziel), Ruf-Anzeige mit Stufe, aktuelles Ziel oben,
Interaktionshinweis "[E]". Taste `B` = Beweisbrett/Notizbuch, `Esc` = Pause/Speichern/Laden.

**Zwischensequenzen:** Letterbox-Balken, Kamerafahrten, Untertitel (überspringbar).
**Schulradio:** in Fluren/Cafeteria, Durchsagen von "DJ Hall Monitor", wechselt je Akt.
**Sammelobjekte:** 20 "verlorene Bauteile" (Widerstand, Diode, Schütz-Hilfskontakt …) mit Kurzinfo-Karte.

## 4. Figuren

| Figur | Rolle |
|---|---|
| **Der Lehrer (Mr. Hö)** | Lehrer, Auftraggeber. Stilisierte Figur nach Foto (bitte liefern, sobald der Prototyp steht) |
| Spielfigur ("der Neue") | Mechatroniker-Schüler, Name wählbar |
| Mr. Kowalski | Hausmeister, mürrisch, kennt jede Leitung; falsche Fährte |
| Ms. Delgado | Sekretärin, weiß alles, Klatsch-Quelle |
| Tony "Sparky" Russo | Mitschüler, Capo der Familie, Mentor |
| Vince Moretti | Anführer der Rivalen-Familie (Schülerclique "Black Rose") |
| Coach Bradley | Turnhallen-Chef, verdächtig (Schlüssel zum Keller) |
| Lucy Chen | Überläuferin aus der Rivalenfamilie (Akt 2) |
| **Drahtzieher (Überraschung)** | Mr. Sterling, Projektleiter der Sanierungsfirma – will den Wartungsvertrag und lässt die Rivalen sabotieren |

## 5. Quest-Liste (vorläufig, wird an `/unterlagen` angepasst)

> **Umgesetzt (v0.7):** Akt 1 im Keller (Missionen 1–4 beim Lehrer) und der Anfang von Akt 2 im Erdgeschoss:
> 5 *Leitungssalat* (Kowalski, Flur, ET Kap. 4), 6 *Funkstille* (Kowalski, Flur, LtK 02),
> 7 *Zwei Bedienstellen* (Rosalita, Cafeteria, Schütztechnik Kap. 2.3–2.5). Neue Figuren: Hausmeister Kowalski,
> Cafeteria-Chefin Rosalita; Vince Moretti taucht als Spur auf (Spind, Polaroid). Die Liste unten ist der
> ursprüngliche Gesamtplan und wird beim weiteren Ausbau an die Unterlagen angepasst.
>
> **v0.8:** Akt 3 – Licht ins Dunkel, Teil 1: 8 *Halbzeit* und 9 *Der Vorhang fällt* (Coach Bradley, Turnhalle,
> LtK 03 und Schütztechnik Kap. 5), 10 *Dicke Luft* und 11 *Der Lauscher* (Sparky Russo, Werkstatt,
> Schütztechnik Kap. 4 und LtK 04). Coach Bradley ist entlastet, das Motiv (Wartungsvertrag von Sterling Bau)
> liegt offen.
>
> **v1.0 – das Spiel ist vollständig (16 Missionen):** Akt 4 – *Die Nacht vor der Prüfung*: 12 *Heiße Platten*
> (Rosalita, Kochstation, ET Kap. 5 und 6.9), 13 *Frische Luft* (Bradley, Solarlüfter, ET Kap. 6.1–6.8),
> 14 *Der Nachlauf* (Sparky, Laborbänder, Schütztechnik Kap. 6 mit echtem Zeitrelais im Probelauf),
> 15 *Die falsche Adresse* (Kowalski, Prüfungsnetz in der neuen **Aula**, LtK 05). Finale: 16 *Die Abschlussprüfung*
> beim Lehrer in der Aula (acht gemischte Aufgaben), Vince Moretti wird überführt, Beförderung zum Consigliere.
> Gegenüber dem ursprünglichen Plan sind es 16 statt 24 Missionen, weil sich die Aufträge eng an den vorliegenden
> Lernunterlagen orientieren (keine Vorgriffe); Digitaltechnik (Logik, SPS) ist noch nicht dran.
>
> **v1.1:** Türschild „Mr. Hö“, Figuren im GTA-III-Stil (ernste Gesichter, Kiefer, Haltungen, Mundbewegung),
> der Lehrer als Pate, Statisten (Heimspielabend in Akt 2–3, Black Roses in Akt 4, voller Prüfungsmorgen),
> Satire (Radiowerbung, Plakate) und trockenere Sprüche.

Fächer gemischt: **ET** Elektrotechnik, **AT-S** Automatisierung/Schütztechnik, **AT-D** Digitaltechnik, **LtK**.

### Akt 1 – Seltsame Vorfälle (Laufbursche → Klassensprecher → Schülersprecher)

| # | Mission | Ort | Fachaufgabe | Typ | Beweis/Spur |
|---|---|---|---|---|---|
| 1 | *Willkommen in der Familie* | Büro | Sicherheitsregeln, 5 Sicherheitsregeln in richtige Reihenfolge | MC/Sortieren | – (Tutorial) |
| 2 | *Flackerndes Licht* | Flur | Ohmsches Gesetz, Spannung/Strom an Leuchte | Berechnung | fremder Schraubendreher |
| 3 | *Die Glocke lügt* | Sekretariat | Taster/Schalter, Schließer/Öffner, Stromlaufplan lesen | MC + Fehlersuche | durchgestrichener Schaltplan |
| 4 | *Kalter Kaffee* | Cafeteria | Leistung P = U·I, Sicherung -FC auslegen | Berechnung | Kassenbon "B.R. Supply" |
| 5 | *Stillstand* | Werkstatt | Förderband: Selbsthaltung mit Schütz -QA | Schaltung vervollständigen | **schwarze Rose im Schaltschrank** |
| 6 | *Kurzschluss im Spind* | Flur | Reihen-/Parallelschaltung von Widerständen | Berechnung | Spindnummer 313 |
| 7 | *Der Lehrer ahnt etwas* | Büro | Zwischensequenz + Wiederholung Akt 1 | Mix | Beweisbrett öffnet sich |

### Akt 2 – Die Spur verdichtet sich (Schülersprecher → Capo)

| # | Mission | Ort | Fachaufgabe | Typ | Beweis/Spur |
|---|---|---|---|---|---|
| 8 | *Vertauschte Leitungen* | Turnhalle | Aderfarben, Schutzleiter, Drehfeld | MC + Fehlersuche | Kabelbinder der Rivalen |
| 9 | *Motorschutz ausgelöst* | Keller | Motorschutzrelais -BC einstellen (Typenschild lesen) | Berechnung | Einstellprotokoll gefälscht |
| 10 | *Rückwärtsgang* | Keller | Wendeschützschaltung, gegenseitige Verriegelung | Schaltung vervollständigen | Fingerabdruck auf Schütz |
| 11 | *Zahlen lügen nicht* | Sekretariat | Dual/Dezimal/Hex | Berechnung | Codezettel |
| 12 | *Das Tor zur Turnhalle* | Turnhalle | Logikgatter UND/ODER/NICHT, Wahrheitstabelle | Logik vervollständigen | Coach' Schlüssel (falsche Fährte) |
| 13 | *Die Überläuferin* | Cafeteria | Dialogquest: Lucy überzeugen (Fachwissen als Argument) | MC | Lucys Aussage |
| 14 | *Funkstille* | Bibliothek/Netzwerkschrank | Netzwerk-Grundlagen laut Unterlagen | MC + Fehlersuche | Logdatei mit Uhrzeit |
| 15 | *Alarmanlage* | Flur | Logikschaltung aus Text aufstellen (Funktionsgleichung) | Logik | Video-Standbild |
| 16 | *Kondensator-Komplott* | Werkstatt | Kondensator/Diode laut Unterlagen | MC/Berechnung | Bestellschein Sanierungsfirma |
| 17 | *Familientreffen* | Büro | Mix Akt 2, Beweisbrett: Verdächtige ausschließen | Mix/Kombination | Ernennung zum Capo |

### Akt 3 – Licht ins Dunkel (Capo → Consigliere)

| # | Mission | Ort | Fachaufgabe | Typ | Beweis/Spur |
|---|---|---|---|---|---|
| 18 | *Die Beweiskette* | Büro | Beweise richtig kombinieren (Deduktion) | Beweisbrett | Drahtzieher entlarvt (Sequenz) |
| 19–23 | *Die lange Nacht* (5 Etappen) | gesamte Schule, nachts | Beleuchtung, Glocke, Förderband, Netzwerk, Hauptverteilung nacheinander wieder in Betrieb nehmen – je eine kombinierte Aufgabe aus allen Themen | Fehlersuche + Mix | Systeme laufen |
| 24 | *Consigliere* | Aula | Abschluss-Sequenz, Auswertung, Urkunde | – | Ende |

## 6. Prototyp (Schritt 2)

- **Ein Raum:** Hausmeisterkeller-Ausschnitt mit Büro-Ecke des Lehrers (abends, Lichtkegel).
- **Drei Quests:** Nr. 2 (Berechnung), Nr. 3 (Multiple Choice + Fehlersuche), Nr. 5 (Schützschaltung vervollständigen).
- Enthalten: Third-Person-Steuerung, Lehrer als Platzhalterfigur, Dialoge, Marker, Missionstitel,
  MISSION PASSED, Ruf-Anzeige, Minimap, Beweisbrett (einfach), Speichern/Laden per Dateidialog,
  Aufgaben aus `aufgaben.json`, Windows-Export.

## 7. Danach (Schritt 3, schrittweise)

1. Restliche Räume + Akt 1 komplett → 2. Akt 2 mit Beweis-Puzzle → 3. Akt 3 Finale
→ 4. Zwischensequenzen, Radio, Sammelobjekte, Ladebildschirme → 5. Lehrer-Figur nach Foto → 6. Feinschliff, Testlauf mit Klasse.

## 8. Was ich von dir brauche

1. **Freigabe** dieses Plans (oder Änderungswünsche an Story/Figuren/Quests).
2. **Die Unterlagen** für `/unterlagen` (PDF/Word) – ohne sie kann ich die Aufgaben nicht "ohne Vorgriffe" bauen.
3. Was genau umfasst **LtK** bei euch? (Ich richte mich dann nach den Unterlagen.)
4. Später: **Foto** für die Figur des Lehrers.
