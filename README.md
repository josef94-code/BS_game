# NACHTSCHICHT

Ein Rätselspiel im Stil der alten Survival-Horror-Klassiker (feste Kamera, düstere Räume, Taschenlampe, Inventar, Dokumente, Stempeluhr als Speicherpunkt) – aber ohne Monster. Stattdessen braucht man das Fachwissen aus dem **1. Ausbildungsjahr Mechatroniker/-in (Lernfelder 1–4)**.

> Samstag, 22:14 Uhr. Werk Kessler, Halle 3. Dein erster Tag als Azubi – und man schickt dich in die Nachtschicht.
> Licht weg, Band steht, Presse verliert Luft. Am Montag um 6 Uhr will der Kunde 2000 Gehäuse, sonst ist das Werk pleite.
> Und irgendjemand schleicht nachts durch die Halle …

Mit jeder Reparatur wird die Halle heller, sauberer und lauter: Lampen gehen an, Dreck und Rost verschwinden, die Maschinen laufen wieder an – bis die Produktion komplett hochfährt.

Gedacht zum **Selbstlernen zu Hause**. Spieldauer etwa **1,5–2 Stunden**. Jede gelöste Aufgabe landet als Lerneintrag im **Berichtsheft** (Inventar), zum Nachlesen und Wiederholen.

## Starten

**Für Azubis:** Einfach die Datei **`nachtschicht.html`** herunterladen und im Browser öffnen (Chrome, Edge, Firefox). Das ist eine einzige Datei mit allem drin (Grafik, Sound, Schriften), läuft auch offline und lässt sich per E-Mail, USB-Stick oder Lernplattform (z. B. mebis) verteilen.

**Zum Weiterentwickeln:** `index.html` öffnen, die Quelltexte liegen in `css/`, `js/` und `fonts/`. Nach Änderungen die Einzeldatei neu bauen:

```
python3 tools/build.py
```

Spielstände werden im Browser gespeichert: Jedes **Profil (Klasse + Name)** hat **5 Speicherplätze** (Stempeluhren in Umkleide und Kellergang) plus einen **Autosave** nach jeder Reparatur. Über „Spielstand als Datei speichern“ / „Spielstand-Datei laden …“ im Titelmenü lassen sich Profile auf andere Rechner mitnehmen oder bei der Lehrkraft abgeben. Ein Spielstand der ersten Version wird beim ersten Start automatisch als Profil „Bisheriger Spielstand“ übernommen.

**Spielstände in der Cloud (Chrome/Edge am PC):** Unter *Spielen → Profil wechseln → Speicherort* lässt sich eine **Spielstand-Datei** verbinden („Spielstand-Datei öffnen …“ bzw. „Neue Spielstand-Datei anlegen …“). Liegt sie in einem synchronisierten Cloud-Ordner (OneDrive, Google Drive, Nextcloud …), schreibt das Spiel jeden Speichervorgang direkt hinein – auf jedem Rechner, auf dem dieselbe Datei verbunden wird, geht es mit demselben Stand weiter. Der Browser merkt sich die Verbindung; nach einem Neustart genügt ein Klick zur Freigabe. Solange eine Datei verbunden ist, werden nur die Profile aus dieser Datei angezeigt (wichtig an geteilten Schulrechnern). Hinweise: Firefox, Safari, iPad und Handy unterstützen das nicht (dort Export/Import nutzen); nicht gleichzeitig auf zwei Rechnern mit derselben Datei spielen.

## Steuerung

| Taste | Funktion |
|---|---|
| Pfeiltasten / WASD | gehen (Shift = rennen) |
| E / Leertaste / Enter | untersuchen, reden, Dialog weiter |
| I / Tab | Inventar, Dokumente, Karte, Produktionsstatus |
| M | Ton an/aus |
| Esc | Fenster schließen |

Gespeichert wird an den **Stempeluhren** (Umkleide, Kellergang; 5 Plätze pro Profil) und automatisch nach jeder Reparatur. Über die Stempeluhr kommt man auch zurück ins Titelmenü (Profil wechseln).

## Spielelemente

- **Räume:** Umkleide, Halle 3, Lehrwerkstatt, Lager, Schaltraum, Meisterbüro – und im Keller: Kellergang, E-Werkstatt, Kompressorraum, Hausmeisterraum
- **Figuren mit gestuften Tipps:** Schorsch (Schichtführer), Alois (alter Zerspaner, Mechanik), Irmgard (Lageristin, Sicherheit), Dragan (Betriebselektriker, zwielichtig). Wer öfter fragt, bekommt konkretere Hinweise.
- **9 Anlagen** müssen laufen: Hallenbeleuchtung, Motorhalterung, Bandgetriebe, Hauptkompressor, Pneumatik-Presse, Steuerleitung, Meldeleuchte, Bandsteuerung, Trockenofen.
- **Berichtsheft:** Nach jedem gelösten Rätsel ein Lerneintrag mit Formeln und Merksätzen.
- **Dokumente:** Hefteinträge, Tabellenbuch-Seiten, Aushänge – teilweise unleserlich, damit man selbst denken muss – sowie Story-Dokumente.
- **Gesundheit:** Gefährliche Fehler (unter Spannung arbeiten, Handschuhe an der Bohrmaschine, falsch verschlauchte Pneumatik) kosten Gesundheit. Verbandpäckchen in den Erste-Hilfe-Kästen.
- **Bewertung:** Am Ende gibt es eine „Beurteilung“ mit Note, abhängig von den Fehlern.

## Rätsel und Lernfeldbezug

| # | Ort | Aufgabe | Lernfeld |
|---|---|---|---|
| 1 | Lager (Irmgard) | 5 Sicherheitsregeln nach DIN VDE 0105-100 in Reihenfolge | LF 3 |
| 2 | Schaltraum | Freischalten, mit Vorhängeschloss sichern, zweipolig prüfen – im Spiel praktisch umgesetzt | LF 3 |
| 3 | Schaltraum, Unterverteilung | I = P/U bei 12 × 250 W parallel, LS-Schalter passend zu Last und Leitung wählen | LF 3 |
| 4 | Werkstatt, Bohrmaschine | Persönliche Schutzausrüstung/Unfallverhütung, Kernloch-Ø, Drehzahl n = v<sub>c</sub>·1000/(π·d) | LF 2 |
| 5 | Werkstatt, Schraubstock | Handgewindebohrer-Reihenfolge, Spanbrechen, Schneidöl | LF 2 |
| 6 | Halle, Bandantrieb | Übersetzung i = n₁/n₂ = z₂/z₁ | LF 1 |
| 7 | Halle, Presse | 5/2-Wegeventil (ISO 5599), Grundstellung, Zweidruckventil (UND), Betriebsdruck | LF 4 |
| 8 | Werkstatt, Prüfstück | Messschieber mit 1/10-Nonius ablesen (= Code fürs Meisterbüro) | LF 2 |
| 9 | Schaltraum, Steuerschrank | LED-Vorwiderstand R = (U − U<sub>F</sub>)/I, Farbcode lesen | LF 3 |
| 10 | Schaltraum, Steuerschrank | Verknüpfungssteuerung mit Selbsthaltung, Tür-Überwachung, Not-Halt ohne Wiederanlauf | LF 4 |
| 11 | Kellergang, Abzweigkasten | Multimeter: Spannung parallel, Durchgang nur spannungsfrei, Strom in Reihe, P = U · I | LF 3 |
| 12 | Werkstatt, Säulenbohrmaschine | Schutzklasse I, Schutzleiterwiderstand ≤ 0,3 Ω, Schuko-Stecker, RCD 30 mA mit Prüftaste | LF 3 |
| 13 | Kompressorraum | Schützschaltung mit Selbsthaltung verdrahten (Öffner in Reihe, Schließer parallel) | LF 3/4 |
| 14 | Halle, Trockenofen | R = U²/P, Reihen- und Parallelschaltung von Heizstäben | LF 3 |

<details>
<summary><b>Lösungen für Lehrkräfte (Spoiler!)</b></summary>

1. Freischalten → gegen Wiedereinschalten sichern → Spannungsfreiheit feststellen → erden und kurzschließen → benachbarte, unter Spannung stehende Teile abdecken oder abschranken.
2. Hauptschalter im Schaltraum ausschalten **und** Vorhängeschloss (aus dem eigenen Spind) anbringen; Spannungsprüfer hängt an der Werkzeugwand in der Werkstatt.
3. P = 12 · 250 W = 3000 W; I = 3000 W / 230 V ≈ 13,0 A → **B16** (B10 zu klein, B32 schützt die 2,5-mm²-Leitung mit I<sub>z</sub> = 20 A nicht).
4. Schutzbrille ja, Werkstück spannen ja, **keine Handschuhe**, nicht mit der Hand halten. Bohrer **8,5 mm** (10 − 1,5). n = 25 · 1000 / (π · 8,5) ≈ 936 → Stufe **900 1/min**.
5. Reihenfolge 1 Ring → 2 Ringe → 3 Ringe; gerade ansetzen, Schneidöl, nach etwa einer Umdrehung eine halbe zurück.
6. i = 1400 / 350 = **4**; z₂ = 4 · 18 = **72**.
7. P → **1**, Kolbenseite A → **4**, Kolbenstangenseite B → **2**, Schalldämpfer → **3** und **5**; **Zweidruckventil**; **6 bar**.
8. 27 mm + 4 · 0,1 mm = **27,4 mm** → Code **274**.
9. R = (24 V − 2 V) / 0,02 A = **1100 Ω** → **braun-braun-rot** (gold).
10. Baustein 1 **ODER** (S1, K1), Baustein 2 **NICHT** (S0), Baustein 3 **UND**: Q1 = (S1 ∨ K1) ∧ B1 ∧ ¬S0.
11. V⎓, Buchse VΩ, parallel → 24,1 V. F7 aus, Ω: Ader 3 = OL → auf Reserveader 7 umklemmen. Strom: A⎓, Buchse A, in Reihe (F7 ein) → 0,21 A; P = 24 V · 0,21 A ≈ **5 W**.
12. Schutzklasse **I**; 19,99 Ω → **nicht bestanden**; grün-gelb an den **Schutzkontakt-Bügel**; 0,12 Ω → bestanden; Prüftaste ohne Funktion → FI tauschen, **30 mA**.
13. F2-96 → S0-11, S0-12 → S1-13, S1-14 → A1, K1-13 → S1-13, K1-14 → S1-14 (bzw. A1).
14. R = 230² / 1000 = **52,9 Ω**; **2 Stäbe parallel**, R<sub>ges</sub> ≈ **26,45 Ω** → 2000 W.

Ablauf grob: Spind → Halle (Schorsch) → Lager (Irmgard: Sicherheitsregeln → Schlüssel + Bolzenschneider; LS-Kasten, Verbindungsklemmen, Gewindebohrer, Zahnräder, Schlauch) → Werkstatt (Alois, Werkzeugwand, gesperrte Bohrmaschine) → Schaltraum (Licht) → Kellertreppe (Gitter aufknacken) → E-Werkstatt (Dragan: Multimeter, Gerätetester; FI-Karton, Aderleitung) → Hausmeisterraum (Hilfsschalterblock, Beweise) → Kompressorraum (Schützschaltung) → Abzweigkasten (Multimeter) → Werkstatt (Schutzmaßnahmen, bohren, Gewinde) → Bandantrieb (Platte, Zahnrad) → Presse → Trockenofen → Steuerschrank ansehen → Alois (Widerstände) → Prüfstück/Code → Meisterbüro (Schaltplan) → Steuerschrank (Widerstand, Logik) → Hauptschalter ein → Bedienpult START. Elektrische Arbeiten immer mit Hauptschalter AUS + Schloss; Prüfen und Programmieren mit Hauptschalter EIN.
</details>

## Technik

- `nachtschicht.html` – fertige Einzeldatei zum Verteilen (wird mit `tools/build.py` erzeugt)
- `index.html`, `css/style.css`, `fonts/` (VT323 und Special Elite, SIL Open Font License)
- `js/gfx.js` – prozedurale Pixelgrafik (Räume, Figuren, Icons), keine Bilddateien
- `js/audio.js` – prozeduraler Sound über WebAudio (Brummen, Tropfen, Türen, Stromschlag …)
- `js/data.js` – Gegenstände und Dokumente
- `js/rooms.js` – Räume mit Licht, Hotspots und Interaktionen
- `js/npcs.js` – Figuren, Dialoge, Tipp-System, Finale
- `js/puzzles.js` – alle Fachrätsel
- `js/saves.js` – Profile, Speicherplätze, Export/Import
- `js/game.js` – Engine: Spielschleife, Steuerung, Dialoge, Inventar, Speichern

Neue Rätsel lassen sich in `js/puzzles.js` als Funktion ergänzen und über einen Hotspot in `js/rooms.js` aufrufen.

Alle Namen, Firmen und Ereignisse sind frei erfunden.
