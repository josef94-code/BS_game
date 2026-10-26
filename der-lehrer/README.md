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

**Stand: v1.0** – sechs Räume, sechzehn Missionen, das ganze Spiel vom Intro bis zur Abschlussprüfung (ca. 3–4 Stunden):
- **Akt 1 – Seltsame Vorfälle** im Hausmeisterkeller (Büro des Lehrers), vier Missionen beim Lehrer.
- **Akt 2 – Die schwarzen Rosen** im Erdgeschoss: **Flur** mit Spinden, Pokalvitrine, Fensterband im Mondlicht,
  Unterverteilung und Infoscreen; **Cafeteria** mit Essensausgabe, Tischreihen, Getränkeautomaten und dem Ende
  von Band 1. Neue Auftraggeber: **Hausmeister Kowalski** (Flur) und **Rosalita** (Cafeteria). Die Kellertür
  öffnet sich nach Mission 4.
- **Akt 3 – Licht ins Dunkel:** **Turnhalle** (Parkett mit Basketballfeld, Körbe, Tribüne, Anzeigetafel,
  Trennvorhang, Sprossenwand) mit **Coach Bradley** und **Werkstatt** (Werkbänke, Werkzeugwand, Kreissäge mit
  Absauganlage, Säulenbohrmaschine, Laborplätze mit Schützen, PC-Ecke) mit **Sparky Russo**. Die Turnhalle öffnet
  sich nach Mission 7 (Doppeltür am Ostende des Flurs), die Werkstatt nach Mission 9 (Tür gegenüber).
- **Akt 4 – Die Nacht vor der Prüfung:** Die Black Roses wollen am Prüfungstag um 9 Uhr alles abschalten. Rosalitas
  **Kochstation** (Cafeteria), Bradleys **Solarlüfter** (Turnhalle), die **Laborbänder** mit Zeitrelais (Werkstatt) und
  das **Prüfungsnetz** in der **Aula** im ersten Stock (Bühne mit Leinwand, neun Prüfungs-PCs, Prüfungsserver). Das
  Treppenhaus nach oben öffnet sich nach Mission 14.
- **Finale – Die Prüfung:** Am nächsten Morgen (Tageslicht in der Aula) schreibt der Spieler die **Abschlussprüfung**
  beim Lehrer: acht gemischte Aufgaben aus Elektrotechnik, Steuerungstechnik und Netzwerken. Danach wird
  **Vince Moretti** überführt, Sterling Bau bekommt keinen Vertrag – und der Spieler wird **Consigliere**.

Die Aufgaben sind mit den Lernunterlagen (ET Kap. 1–6, Schütztechnik Kap. 0–6, LtK 01–06) abgeglichen. Planung und Stand stehen in [`PLAN.md`](PLAN.md).

## Starten

**Für Schülerinnen und Schüler:** `DerLehrer.exe` herunterladen und doppelklicken. Fertig.

- Die `.exe` wird automatisch gebaut: GitHub → *Actions* → *DER LEHRER – Windows-Build* → neuester Lauf → Artefakt **DerLehrer-Windows**.
- Läuft auch vom USB-Stick oder Netzlaufwerk. Grafik: OpenGL 3.3 (Godot „Compatibility“), ohne passenden OpenGL-Treiber weicht Godot unter Windows auf Direct3D 11 (ANGLE) aus.
- Fenstergröße: beliebig, die Oberfläche skaliert mit (getestet mit 1280×720 und 1600×900).

## Grafikstufen

Im Hauptmenü und im Pausenmenü (Esc) lässt sich die Grafik umschalten: **Automatisch**, **Niedrig**, **Mittel**, **Hoch**.

| Stufe | Inhalt |
|---|---|
| Niedrig | ohne Schatten, ohne Filter und Staub, ohne Relief, ohne Kantenglättung, 80 % Auflösung – für sehr schwache Rechner |
| Mittel | 2 Lampen mit Schatten, PS2-Filter, Leuchten (Glow), Staub im Licht, Relief auf Ziegeln/Beton/Metall, 2× MSAA |
| Hoch | 4 Lampen mit weichen Schatten, mehr Staub, 4× MSAA |

**Automatisch** startet mit „Hoch“ und schaltet eine Stufe herunter, wenn das Spiel beim Herumlaufen mehrere Sekunden
lang unter ca. 33 Bilder pro Sekunde fällt. Die Wahl wird pro Rechner gespeichert (Benutzerordner, nicht im Spielstand).
Alle unbeweglichen Teile des Raums werden beim Laden zusammengefasst; dadurch braucht der Keller auf „Niedrig“ nur
etwa ein Fünftel der früheren Zeichenaufrufe.

## Steuerung

| Taste | Funktion |
|---|---|
| W A S D | laufen (Shift = rennen, Leertaste = springen) |
| Maus | umsehen, Mausrad = Kamera-Abstand |
| E | benutzen, mit Personen sprechen, Türen öffnen, Dialog weiter |
| B oder Tab | Beweisbrett (Hinweise, offene Fragen, Sammelobjekte) |
| Esc | Pause: Speichern, Laden, Steuerung, Ton, Hauptmenü |

## Spielablauf (GTA-Stil)

1. Auf der Minimap zeigt der **Hut** den Lehrer, **K**, **R**, **B** und **S** zeigen Kowalski, Rosalita, Bradley und Sparky (groß und farbig,
   wenn sie einen Auftrag haben). Der **gelbe Punkt** und der **gelbe Lichtkegel** am Boden zeigen das Ziel –
   liegt es in einem anderen Stockwerk, stehen sie an der Treppe.
2. Beim Auftraggeber den Auftrag annehmen → **Missionstitel** wird groß eingeblendet.
3. Zur Anlage gehen, mit **E** untersuchen → Fachaufgaben lösen.
4. Die Anlage läuft wieder, ein **Beweisstück** taucht auf (Zwischensequenz mit Letterbox und Untertiteln).
5. Zurück zum Auftraggeber → **MISSION PASSED** mit Ruf-Belohnung.

Beim Betreten eines Raums erscheint unten rechts sein Name (KELLER, FLUR, CAFETERIA, TURNHALLE, WERKSTATT, AULA).

**Ruf statt Geld:** Laufbursche (0) → Klassensprecher (100) → Schülersprecher (160) → Capo (300) → Consigliere (900).
Die Schwellen sind so gewählt, dass die Beförderungen genau nach Mission 3, 4, 7 und 16 kommen – egal wie viel Bonus jemand sammelt
(der Datentest prüft das). Consigliere wird man also erst mit der bestandenen Abschlussprüfung.
Jede gelöste Aufgabe beim ersten Versuch gibt +2 Bonus-Ruf. Nach drei Fehlversuchen kann man sich die Lösung zeigen lassen
(kein Bonus, wird in der Statistik vermerkt). Falsche Antworten kosten nichts – es gibt gestufte Tipps vom Lehrer.

Außerdem: **Schulradio WLHS 88.3** mit Sprüchen und Durchsagen (je Akt eigene), **zehn versteckte Bauteile**
(je drei im Keller, im Erdgeschoss und in Turnhalle/Werkstatt, eins in der Aula), verschlossene Türen mit kleinen Hinweisen
und nach dem Finale eine **Bilanz** (gelöste Aufgaben, davon beim ersten Versuch, Ergebnis der Abschlussprüfung, Spielzeit).

## Speichern und Laden

Esc → **Spiel speichern …** öffnet den Windows-Dateidialog. Der Schüler wählt den Ort selbst, z. B. das persönliche
Netzlaufwerk. Der Spielstand ist eine kleine Textdatei (`lehrer_<name>.lehrer`, ca. 2 KB) mit Ruf, Missionsstand,
Beweisen, Position und der Statistik je Aufgabe. Laden über das Hauptmenü oder das Pausenmenü.

## Missionen und Lehrplanbezug

| # | Mission | Anlage | Fachaufgaben | Lernfeld |
|---|---|---|---|---|
| 1 | Flackerndes Licht | Leuchte, Abzweigdose -XD3, Notleuchte | Kennbuchstaben, Vorwiderstand berechnen (Ohm’sches Gesetz), Übergangswiderstand R = U/I, fünf Sicherheitsregeln (Reihenfolge), zweipoliger Spannungsprüfer | LF 3 (ET) |
| 2 | Die Glocke lügt | Klingelanlage: -FC1, -SJ3, -KF1, -PB1 (24 V) | Schließer/Öffner, Anschlussbezeichnungen (13–14, 21–22), Fehlersuche am Stromlaufplan mit Messwerten, fachgerechtes Vorgehen | LF 4 (Att) |
| 3 | Stillstand | Förderband, Schaltschrank +S1 | Selbsthaltung mit Vorrang AUS (-SJ1, -SJ2, -QA1), im Probelauf testen, Selbsthaltung statt Rastung, Motorschutzrelais -BC1 nach Typenschild, Hilfskontakte 95–96 / 97–98 | LF 4 (Att) |
| 4 | Gelöschte Spuren | Netzwerkschrank +N1 (Switch, Router, Firewall, NAS) | Datenschutz vs. Datensicherheit, 3-2-1-1-0-Regel, RAID ist kein Backup, Schutzziele, Prinzip der geringsten Rechte, TOM (Eingabekontrolle) | LF 5 (LtK) |
| 5 | Leitungssalat (Kowalski, Flur) | Unterverteilung UV-EG, Snackautomat mit Fernmeldeleitung J-Y(ST)Y | Stromdichte J = I/A, Strombelastbarkeit nach Tabelle, NYM 3 × 2,5 mm² entschlüsseln, Aderfarben PE/N/L, Spannungsfall in % | LF 3 (ET) |
| 6 | Funkstille (Kowalski, Flur) | Infoscreen, Access Point, Kabelpritsche neben Motorleitung, versteckter Router | Sender-Empfänger-Modell/Störquelle, U/UTP vs. S/FTP, Segmentlänge 100 m, PoE, WLAN-Generationen (Sortieren), Funknetz absichern (WPA3) | LF 5 (LtK) |
| 8 | Halbzeit (Bradley, Turnhalle) | Hallentechnik in Linie: Anzeigetafel, Licht, Lüftung, Infoscreen | Netzwerkarten PAN bis GAN (Sortieren), Linie vs. Stern, Ebenenmodell (Sortieren), Bussysteme (AS-i, IO-Link, PROFINET) | LF 5 (LtK) |
| 9 | Der Vorhang fällt (Bradley, Turnhalle) | Trennvorhang mit 24-V-Gleichstrommotor -MA2, -QA2/-QA3 | Drehrichtungsumkehr, Kurzschluss bei gleichzeitigem Anziehen, Schütz- und Tasterverriegelung, Wendeschützschaltung (zwei Schütze, Probelauf), Fehlersuche „Schütz flattert“ | LF 4 (Att) |
| 10 | Dicke Luft (Sparky, Werkstatt) | Absauganlage -MA2 und Kreissäge -MA1, Schaltschrank +S3 | Folgekontakt -QA2 43–44, Lage von -BC1/-BC2, Sammelstörmeldung -PF2, Folgeschaltung mit Überlast-Test, Fehlerbilder | LF 4 (Att) |
| 11 | Der Lauscher (Sparky, Werkstatt) | Werkstatt-PC, Hub, Mitschnitt-Gerät | Hub vs. Switch (MAC-Adresse), Router/Firewall/Medienkonverter, Knopfzelle, flüchtige Speicher, Bildschirmarbeitsplatz | LF 5 (LtK) |
| 7 | Zwei Bedienstellen (Rosalita, Cafeteria) | Bedienstelle an der Bandübergabe: -SG0, -SJ3, -SJ4, -PF1 | Drahtbruchsicherheit, Not-Halt mit Zwangsöffnung, Steuerstromkreis mit zwei Bedienstellen (5 Lücken, Probelauf), -PF1 über 43–44, Fehlersuche „-PF1 leuchtet, obwohl das Band steht“ | LF 4 (Att) |
| 12 | Heiße Platten (Rosalita, Cafeteria) | Kochstation mit drei Kochplatten (Siebentaktschalter), Wärmeplatte | Elektrische Arbeit in Wh, Gesamtwirkungsgrad η₁ · η₂, Schaltstufen nach Leistung sortieren, Heizwiderstand R = U²/P, defekter Heizwiderstand R1, Energiekosten pro Jahr | LF 3 (ET) |
| 13 | Frische Luft (Bradley, Turnhalle) | Solarlüfter für die Aula: Mini-Solarmodule, Lüfter, Akku, Baustrahler | Module parallel oder in Reihe, Merksätze Reihe/Parallel, Knotenregel, Innenwiderstand, Spannungsteiler, gemischte Schaltung | LF 3 (ET) |
| 14 | Der Nachlauf (Sparky, Werkstatt) | Laborbänder für die praktische Prüfung, Zeitrelais -KF1 | ansprech- oder rückfallverzögert, Ablauf sortieren, zeitgesteuerte Folgeschaltung mit Abschaltung von -KF1 (4 Lücken, Probelauf mit echter Verzögerung), Folgekontakte als ODER, digitaler Zwilling, Grenzen der VPS | LF 4 (Att) |
| 15 | Die falsche Adresse (Kowalski, Aula) | Prüfungsserver, neun Prüfungs-PCs, fremdes Gerät mit doppelter IP | DHCP und andere Protokolle, OSI-Schichten (Sortieren), Dual → Dezimal, Hex → Dezimal, Broadcast-Adresse, Adresskonflikt | LF 5 (LtK) |
| 16 | Die Abschlussprüfung (Lehrer, Aula) | Prüfungsplatz vorne links | gemischt: P = U²/R, fehlender Parallelwiderstand, gemischte Schaltung, Schützverriegelung in der Simulation, Grenzen der Simulation, statische/dynamische Adressen, MAC und IP, IPv4-Block bis 255 | LF 3, 4, 5 |

Betriebsmittelkennzeichnung wie in den Lernunterlagen nach DIN EN 81346-2: -FC Leitungsschutzschalter, -SJ Drucktaster,
-SG0 Not-Halt, -QA Schütz, -BC Motorschutzrelais, -KF Hilfsschütz/Relais/Zeitrelais, -PF Meldeleuchte, -MA Motor;
Steuerstromkreis von 24 V nach 0 V. Die Kennzeichnung der Glocke (-PB1) steht nicht in den Unterlagen und ist noch zu prüfen.

Grundlage sind die Lehrplanrichtlinien Mechatroniker/-in (Bayern, 2018), die Didaktische Jahresplanung LtK 10 und die
Lernunterlagen der Staatlichen Berufsschule I Kempten: Elektrotechnik (LF 3, Kap. 1–6), Automatisierungstechnik Teil A –
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
| Die heiße Leitung | A = π · d² / 4 = π · (0,8 mm)² / 4 = 0,503 mm²; J = I / A (z. B. 6 A / 0,503 mm² = 11,9 A/mm²) – unzulässig |
| Der richtige Querschnitt | 2,5 mm² (27 A ≥ 22 A; 1,5 mm² nur 19,5 A; 0,5 mm² nur für Steuer- und Signalstromkreise) |
| Was steht auf der Rolle? | N Normleitung, Y PVC-Isolierung, M Mantelleitung, 3 Adern je 2,5 mm² |
| Grün-gelb ist heilig | PE grün-gelb, N blau |
| Spannungsfall im Flur | ΔU% = ρ · 2 · l · I / A / U · 100 % (z. B. 25 m, 16 A: 2,48 %) |
| Wer stört? | Frequenzumrichter des Bandmotors (Motorleitung in derselben Trasse) |
| S/FTP statt U/UTP | U ungeschirmt, F Folie, S Geflecht; geschirmt und getrennt von der Motorleitung verlegen |
| 120 Meter | höchstens 100 m je Segment (90 m + 2 × 5 m) |
| Strom über das Netzwerkkabel | Power over Ethernet (bis 90 W, 48 V) |
| WLAN-Generationen | Wi-Fi 4 (802.11n) – Wi-Fi 5 (802.11ac) – Wi-Fi 6 (802.11ax) – Wi-Fi 7 (802.11be) |
| Das fremde Funknetz | Funk ist abhörbar; Anlagennetz nie ungeschützt über WLAN, mindestens WPA3, eigenes Netz |
| Der gebrochene Draht | AUS als Schließer: Band läuft weiter, AUS wirkungslos; als Öffner (Ruhestromprinzip) sicherer Zustand |
| Der rote Pilz | Zwangsöffnung reißt den Kontakt auch verschweißt oder bei Federbruch auf |
| Zwei Bedienstellen | -SJ1 und -SJ3 (Öffner) in Reihe, -SJ2, -SJ4 und -QA1 13–14 (Schließer) parallel; Reihenfolge egal |
| Die grüne Lampe | -PF1 nicht parallel zur Spule, sondern über Hilfskontakt 43–44 |
| Die Leuchte lügt | Hilfskontakt für -PF1 an 21–22 (Öffner) statt 43–44 angeschlossen |
| Vom Headset bis zum Satelliten | PAN – LAN – MAN – WAN – GAN |
| Alles dunkel ab der Anzeigetafel | Linien-Topologie: Ausfall trennt den restlichen Strang ab |
| Neu verkabeln | Stern: Fehler stört andere nicht, einfache Fehlersuche, Switch-Ausfall legt alles lahm |
| Die Pyramide | Unternehmens-, Betriebsleit-, Prozessleit-, Steuerungs-, Feldebene |
| Bus oder nicht Bus | AS-i: Daten und Strom; IO-Link: Punkt zu Punkt |
| Hoch oder runter? | Ankerspannung umpolen (A1/A2 tauschen) |
| Beide gleichzeitig | Kurzschluss, -FC2.1/-FC2.2 lösen aus, Kontakte können verschweißen |
| Doppelt verriegelt | Schützverriegelung (Öffner des anderen Schützes), Tasterverriegelung für direktes Umschalten, beide nötig |
| Wendeschützschaltung | Pfad -QA2: -SJ3 21–22 und -QA3 21–22; Pfad -QA3: -SJ2 21–22 und -QA2 21–22 (Reihenfolge egal) |
| Das Schütz flattert | eigener Öffner von -QA2 statt Öffner von -QA3 im Strompfad von -QA2 |
| Erst saugen, dann sägen | Folgekontakt -QA2 43–44 in Reihe im Strompfad von -QA1 |
| Wer schützt wen? | -BC2 95–96 im gemeinsamen Strompfad, -BC1 95–96 nur im Pfad von -QA1 |
| Eine Lampe für zwei | ODER: -BC1 97–98 und -BC2 97–98 parallel (Sammelstörmeldung) |
| Folgeschaltung | -QA2 43–44, -SJ3 Öffner, -SJ4 Schließer ∥ -QA1 Schließer |
| Fehlerbilder | Folgekontakt fehlt/überbrückt oder Öffner von -QA2 verwendet |
| Hub statt Switch | Hub schickt an alle (Mitlesen, Kollisionen); Switch nutzt MAC-Adresse |
| Wer macht was? | Router (IP), Firewall (Regeln), Medienkonverter (Kupfer ↔ LWL) |
| 1. Januar 2000 | Knopfzelle leer (CR2032 tauschen) |
| Stecker gezogen | flüchtig: DRAM, SRAM |
| Rücken gerade! | 50–80 cm, oberste Zeile auf/unter Augenhöhe, Tisch 68–76 cm, 500 lx |
| Toast für die Prüflinge | W = P · t / 3600 (z. B. 700 W · 90 s = 63 000 Ws = 17,5 Wh) |
| Zwei Wirkungsgrade | η = 0,85 · 0,90 = 0,765; P_zu = P_ab / 0,765 (z. B. 700 W → 915 W) |
| Der Siebentaktschalter | R1+R2+R3 – R2+R3 – R2 – R3 – R2 ∥ R3 – alle parallel |
| Ein Widerstand allein | R = U² / P (z. B. (230 V)² / 800 W = 66,1 Ω) |
| Kalt auf Stufe 1 | R1 (wirkt nur auf Stufe 1 und 6) |
| Dauerbetrieb | K = P · t · 365 · 0,40 €/kWh (z. B. 1,01 kW · 2 h → 295 €) |
| Zwei Module, ein Lüfter | parallel: 5 V, 0,2 A |
| Merksätze | richtig: R parallel < kleinster Einzelwiderstand; größter R in Reihe → größte Teilspannung; Reihe: überall gleicher Strom |
| Der Knoten | I5 = I1 + I2 − I3 − I4 (z. B. 200 + 200 − 120 − 150 = 130 mA) |
| Der müde Akku | Ri = (U0 − U) / I (z. B. (24 V − 21 V) / 2 A = 1,50 Ω) |
| Der Lüfterregler | U2 = U · R2 / (R1 + R2) (z. B. 24 V · 82 / 129 = 15,3 V) |
| Die Prüflast | R = R1 · R2 / (R1 + R2) + R3 (z. B. 30 Ω + 18 Ω = 48,0 Ω) |
| Welches Zeitrelais? | ansprechverzögert |
| Der Ablauf | -SJ2 – -QA2 zieht an – -KF1 bekommt Spannung – nach 4 s schließt 17–18 – -QA1 zieht an – -SJ1 |
| Zeitgesteuerte Folgeschaltung | -QA2 43–44 vor beiden Zweigen; -QA1 21–22 vor -KF1; -KF1 17–18 ∥ -QA1 13–14 vor -QA1 |
| Warum hinter -QA2? | -KF1 startet nur bei laufendem Band 2 (ODER); fällt Band 2 ab, bleibt Band 1 stehen |
| Der digitale Zwilling | Modell verringert automatisch die Fördermenge der realen Anlage |
| Grenzen der Schützsteuerung | Umverdrahten, Platz/Kosten, Verschleiß/Fehlersuche, keine Texte/Vernetzung |
| Wer vergibt die Adresse? | DHCP |
| Die Schichten | 7 Anwendung – 4 Transport – 3 Vermittlung – 2 Sicherung – 1 Bitübertragung |
| Binär | z. B. 1001010₂ = 64 + 8 + 2 = 74 |
| Hexadezimal | z. B. 1A3₁₆ = 256 + 160 + 3 = 419 |
| An alle | 192.168.10.255 |
| Doppelt vergeben | Adresskonflikt, Verbindungen brechen ab |
| Prüfung 1–8 | vervierfacht · R2 = R · R1 / (R1 − R) (z. B. 275 Ω) · I = U / (R1 + (R2 + R3) ∥ R4) (z. B. 6,05 A) · Kurzschluss im Hauptstromkreis · Leitungen, Kontakte, Erwärmung · Server und Anzeige statisch · MAC 48 Bit vom Hersteller, IPv4 32 Bit · 8 Bit → 255 |

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
│  ├─ welt/          Bau (Grundkörper, Materialien, prozedurale Texturen), Bereich (gemeinsame Grundlage),
│  │                 Keller, Erdgeschoss (Flur + Cafeteria), Turnhalle, Werkstatt, Aula, Zielmarker
│  ├─ figuren/       Figur (Figur aus Grundkörpern), Person (ansprechbar), Lehrer, Nebenfiguren, Spieler
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
- **Komplett-Test:** `godot -- --autotest --shots=<ordner>` spielt alle Missionen automatisch durch (auch die Türen
  zwischen Keller und Erdgeschoss), speichert/lädt und legt Bildschirmfotos ab.
- **Bereiche:** Keller und Erdgeschoss liegen in derselben Welt weit auseinander. Eine Tür blendet schwarz über und
  versetzt die Spielfigur; der nicht besuchte Bereich wird ausgeblendet (keine Zeichenkosten).

## Mögliche Erweiterungen

1. Weitere Kapitel, sobald die Unterlagen vorliegen (ET Kap. 7 ff., Digitaltechnik/SPS) – als Zusatzaufträge nach dem Finale
2. Eigene Ladebildschirme je Akt, weitere Sammelobjekte
