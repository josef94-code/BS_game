# STRANDGUT

Ein 3D-Survival-Lernspiel für **Mechatroniker/-innen, 10. Jahrgangsstufe (Lernfelder 1–5)**.

> März, Indischer Ozean. Der Frachter MV LINDAU läuft im Zyklon auf ein Riff. Jana Brandl, Mechatronikerin im ersten Ausbildungsjahr, wird über Bord gespült und wacht an einem einsamen Strand auf.
> Die Crew treibt in einer Rettungsinsel davon. Am Strand liegt Strandgut aus den Containern: Solartechnik, Motoren, Werkzeug.
> Über Funk hilft Chief Engineer Henrik: In seiner Kabine im Wrack liegt sein Bauplan für ein Solarboot …

Man überlebt drei Tage auf der Insel (Durst, Hunger, Energie, Tag und Nacht, Sturm), sammelt Fracht ein, baut eine Energiestation und schließlich einen **Solar-Katamaran**, um die Schifffahrtsroute zu erreichen. Jeder Bauschritt ist eine Fachaufgabe aus dem Lehrplan.

Spieldauer: etwa **90 Minuten** (eine Doppelstunde). Gespeichert wird automatisch im Browser.

## Starten

**Für Schülerinnen und Schüler:** Die Datei **`strandgut.html`** herunterladen und im Browser öffnen (Chrome, Edge oder Firefox). Es ist eine einzige Datei mit allem drin, ohne Installation und ohne Internet.

- Benötigt WebGL (3D-Grafik). Das können praktisch alle Schulrechner der letzten zehn Jahre.
- Bei ruckeliger Darstellung im Menü **Grafik: Niedrig** wählen. Das Spiel schaltet Schatten auch selbst ab, wenn es zu langsam läuft.
- Der Spielstand liegt im Browser des jeweiligen Rechners (localStorage). In einem privaten Fenster wird nicht gespeichert.

## Steuerung

| Taste | Funktion |
|---|---|
| W A S D | laufen (Shift = rennen, Leertaste = springen) |
| Maus | umsehen (ins Bild klicken), Mausrad = Zoom |
| E | benutzen, aufheben, Dialog weiter |
| Tab / I | Rucksack: Inventar, Bauplan, Logbuch, Dokumente, Karte |
| F | Henrik anfunken (Tipp zum nächsten Ziel) |
| M | Ton an/aus |
| Esc | Pause, Fenster schließen |

## Ablauf

| Tag | Ziel | Fachaufgaben |
|---|---|---|
| 1 | Wasser finden, roten Container öffnen, Lager bauen, Funkgerät reparieren | 1, 2 |
| 2 | Ins Wrack, Schott öffnen, Bauplan holen, Energiestation bauen, im Sturm das Windrad anschließen | 3, 4, 5, 6 |
| 3 | Boot bauen (Rumpf, Motor, Antrieb, Steuerung), Notfunkbake, Systemcheck, Ablegen und zum Rettungsschiff fahren | 7–12 |

Zu jeder gelösten Aufgabe gibt es einen Eintrag im **Logbuch** mit Formeln und Merksätzen. Die **Dokumente** (Ladeliste, Datenblätter auf Englisch, Tabellenbuch-Auszug, Typenschild, Bakenhandbuch) braucht man zum Lösen. Über den Funk gibt Henrik gestufte Tipps.

## Fachaufgaben und Lehrplanbezug

Grundlage sind die Lehrplanrichtlinien Mechatroniker/-in, Bayern 2018, Jahrgangsstufe 10.

| # | Ort | Aufgabe | Lernfeld |
|---|---|---|---|
| 1 | Container LND 4711 | Hebelgesetz M = F · l, Hebelarm berechnen, sicher arbeiten | LF 2 |
| 2 | Lager | Reihenschaltung von Zellen (12 V aus 8 × 1,5 V), Polung, Kapazität | LF 3 |
| 3 | Wrack, Schott | Hydraulik: A = π·d²/4, p = F/A, bar-Umrechnung, Druckbegrenzungsventil, drucklos machen | LF 4 |
| 4 | Energiestation | PV-Module verschalten (2S2P) nach englischem Datenblatt, Grenzwerte des MPPT-Reglers, Leistung | LF 3, LF 1 |
| 5 | Energiestation | I = P/U, Sicherung und Leitungsquerschnitt (I<sub>B</sub> ≤ I<sub>n</sub> ≤ I<sub>z</sub>), Einbauort der Sicherung | LF 3 |
| 6 | Energiestation | Brückengleichrichter aus vier Dioden (interaktiv mit Oszilloskop), Glättung | LF 3 |
| 7 | Bootsbau | Multimeter: Messbereich, Wicklungs- und Isolationsfehler erkennen | LF 3 |
| 8 | Bootsbau | Werkstoff A4-70, Kontaktkorrosion, Kraft-/Form-/Stoffschluss, Schraubensicherung | LF 2 |
| 9 | Bootsbau | Übersetzung i = n₁/n₂ = z₂/z₁, Drehmoment, Passungsangabe H7 | LF 2 |
| 10 | Bootsbau | Wendeschaltung mit gegenseitiger Verriegelung und Not-Halt (Reißleine), Schutzart IP67 | LF 4 |
| 11 | Bootsbau | Blockschaltbild/Energiefluss, W = U·Q, Fahrzeit, Reichweite | LF 1 |
| 12 | Lagune | DIP-Schalter: dezimal → dual → hexadezimal, UKW-Reichweite (englisches Handbuch) | LF 5 |

Am Ende gibt es eine **Beurteilung** (Note 1–6) nach Anzahl der Fehlversuche und Ohnmachten, dazu eine Übersicht, welche Themen fehlerfrei gelöst wurden.

<details>
<summary><b>Lösungen für Lehrkräfte (Spoiler!)</b></summary>

1. l = M / F = 180 N·m / 300 N = **0,6 m**. Sicherheit: fester Stand, Handschuhe, nicht in Zugrichtung stehen.
2. 12 V / 1,5 V = **8 Zellen** in Reihe, alle gleich gepolt. Kapazität bleibt wie bei einer Zelle.
3. A = π · (5 cm)² / 4 = **19,63 cm²**; p = 9800 N / 19,63 cm² ≈ 499 N/cm² ≈ **50 bar**; bis ≥ 50 bar pumpen (DBV öffnet bei 63 bar); vorher **drucklos machen**.
4. V<sub>oc</sub> = Leerlaufspannung; **2S2P** (44 V Leerlauf, 36 V MPP, 11,1 A); P = **400 W**.
5. I = 1000 W / 24 V = **41,7 A**; Sicherung **50 A**; Leitung **10 mm²** (57 A); Sicherung **nah am Pluspol**.
6. Alle vier Dioden „nach oben“: D1 und D2 mit Kathode zum Pluspol, D3 und D4 mit Anode am Minuspol. Glättung: **Ladekondensator** parallel.
7. Messbereich **Ω**; Fehler: **A1–Gehäuse 2,1 kΩ** (Isolationsfehler); spülen, trocknen, neu messen → OL.
8. **A4-70**; **Kontaktkorrosion**; Kunststoffscheiben/-hülsen; Kraftschluss: Schraube, Rohrschelle · Formschluss: Passfeder, Splint · Stoffschluss: Kleben, Schweißen; **selbstsichernde Muttern**.
9. i = **3**; z₂ = **60**; M₂ = 3,2 N·m · 3 = **9,6 N·m**; H7 = Bohrung, unteres Abmaß 0, IT7.
10. K1: **S0 (Öffner) – S1 – K2-Öffner**; K2: **S0 – S2 – K1-Öffner**; Verriegelung gegen Kurzschluss; **IP67**.
11. Solarmodule → Laderegler → Akku → Sicherung → Relais-Steuerung → Motor → Zahnriemen → Propeller; **2400 Wh**; t = 2400 Wh / (600 W − 300 W) = **8 h**; s = **56 km**; **morgens** ablegen.
12. 178 = 128 + 32 + 16 + 2 → **1011 0010** → **B2**; UKW breitet sich quasi-optisch aus (Sichtlinie, Erdkrümmung).
</details>

## Technik

- `strandgut.html`: fertige Einzeldatei zum Verteilen (ca. 600 KB, wird gebaut)
- `src/`: Quelltext (JavaScript-Module, [three.js](https://threejs.org) für die 3D-Grafik)
  - `terrain.js`, `water.js`, `sky.js`, `vegetation.js`: Insel, Wasser-Shader, Tageszeit, Wolken, Regen, Pflanzen (alles prozedural, keine Bilddateien)
  - `props.js`, `world.js`, `interior.js`: Container, Wrack, Lager, Energiestation, Boot, Innenraum des Wracks
  - `player.js`: Spielfigur mit Animation und Third-Person-Kamera
  - `game.js`: Spiellogik (Überleben, Aufgabenkette, Bauen, Speichern, Bootsfahrt)
  - `puzzles.js`, `data.js`: Fachaufgaben, Gegenstände, Dokumente, Logbuch, Tipps
  - `ui.js`, `style.css`, `audio.js`: Oberfläche und prozeduraler Sound (WebAudio)

Nach Änderungen neu bauen (Node.js nötig):

```
cd strandgut
npm install
npm run build
```

Mit `strandgut.html?test=1` startet das Spiel ohne Titelbild und Intro, mit `?q=low|medium|high` lässt sich die Grafikstufe erzwingen.

Alle Namen, Schiffe und Ereignisse sind frei erfunden.
