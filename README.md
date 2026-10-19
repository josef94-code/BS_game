# NACHTSCHICHT

Ein Rätselspiel im Stil der alten Survival-Horror-Klassiker (feste Kamera, düstere Räume, Taschenlampe, Inventar, Dokumente, Stempeluhr als Speicherpunkt) – aber ohne Monster. Stattdessen braucht man das Fachwissen aus dem **1. Ausbildungsjahr Mechatroniker/-in (Lernfelder 1–4)**.

> Samstag, 22:14 Uhr. Werk Kessler, Halle 3. Dein erster Tag als Azubi – und man schickt dich in die Nachtschicht.
> Licht weg, Band steht, Presse verliert Luft. Am Montag um 6 Uhr will der Kunde 2000 Gehäuse, sonst ist das Werk pleite.
> Und irgendjemand schleicht nachts durch die Halle …

Mit jeder Reparatur wird die Halle heller, sauberer und lauter: Lampen gehen an, Dreck und Rost verschwinden, die Maschinen laufen wieder an – bis die Produktion komplett hochfährt.

## Starten

Kein Build, keine Installation – reines HTML5/JavaScript:

- `index.html` direkt im Browser öffnen (Chrome, Edge, Firefox), **oder**
- über einen beliebigen Webserver ausliefern, z. B. `npx http-server .`, **oder**
- per GitHub Pages veröffentlichen (Settings → Pages → Branch wählen).

Ohne Internet wird nur die Schriftart durch eine Systemschrift ersetzt, das Spiel läuft trotzdem. Auf Tablets erscheint ein Touch-Steuerkreuz.

## Steuerung

| Taste | Funktion |
|---|---|
| Pfeiltasten / WASD | gehen (Shift = rennen) |
| E / Leertaste / Enter | untersuchen, reden, Dialog weiter |
| I / Tab | Inventar, Dokumente, Karte, Produktionsstatus |
| M | Ton an/aus |
| Esc | Fenster schließen |

Gespeichert wird an der **Stempeluhr** in der Umkleide (im Browser, `localStorage`).

## Spielelemente

- **Räume:** Umkleide, Halle 3, Lehrwerkstatt, Lager, Schaltraum, Meisterbüro
- **Figuren mit gestuften Tipps:** Schorsch (Schichtführer, Elektro/Pneumatik), Alois (alter Zerspaner, Mechanik), Irmgard (Lageristin, Sicherheit). Wer öfter fragt, bekommt konkretere Hinweise.
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

Ablauf grob: Spind → Halle (Schorsch) → Lager (Irmgard, Sicherheitsregeln; LS-Kasten, Gewindebohrer, Zahnräder, Schlauch) → Werkstatt (Alois, Werkzeugwand) → Schaltraum (Licht) → Bandantrieb (Platte ausbauen) → Werkstatt (bohren, Gewinde) → Bandantrieb (Platte, Zahnrad) → Presse → Steuerschrank ansehen → Alois (Widerstände) → Prüfstück/Code → Meisterbüro (Schaltplan) → Steuerschrank (Widerstand, Logik) → Hauptschalter ein → Bedienpult START.
</details>

## Technik

- `index.html`, `css/style.css`
- `js/gfx.js` – prozedurale Pixelgrafik (Räume, Figuren, Icons), keine Bilddateien
- `js/audio.js` – prozeduraler Sound über WebAudio (Brummen, Tropfen, Türen, Stromschlag …)
- `js/data.js` – Gegenstände und Dokumente
- `js/rooms.js` – Räume mit Licht, Hotspots und Interaktionen
- `js/npcs.js` – Figuren, Dialoge, Tipp-System, Finale
- `js/puzzles.js` – alle Fachrätsel
- `js/game.js` – Engine: Spielschleife, Steuerung, Dialoge, Inventar, Speichern

Neue Rätsel lassen sich in `js/puzzles.js` als Funktion ergänzen und über einen Hotspot in `js/rooms.js` aufrufen.

Alle Namen, Firmen und Ereignisse sind frei erfunden.
