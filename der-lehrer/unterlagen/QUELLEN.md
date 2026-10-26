# Unterlagen und Zuordnung der Aufgaben

Grundlage der Fachaufgaben sind die Unterlagen der Lehrkraft (Klasse MT10, Staatliche Berufsschule I Kempten):

| Unterlage | Verwendung im Spiel |
|---|---|
| **Lehrplanrichtlinien Mechatroniker/-in, Bayern (Oktober 2018)** | Fächer und Lernfelder der Jahrgangsstufe 10; jede Aufgabe nennt Fach (`thema`) und Lehrplaninhalt (`lehrplan`) |
| **Didaktische Jahresplanung LtK 10** | Reihenfolge der LtK-Inhalte (keine Vorgriffe) |
| **Elektrotechnik – Lernunterlagen Jgst. 10, LF 3, Kap. 1–6** (Fassung „00-06 komplett“: Grundbegriffe, Kennbuchstaben und Einheiten, Ohm’sches Gesetz, Leitungsdimensionierung, Arbeit und Leistung, Grundschaltungen) | Mission 1: Sicherheitsregeln im Wortlaut, zweipoliger Spannungsprüfer, Kennbuchstaben, Vorwiderstand (vgl. A27), Übergangswiderstand (vgl. A20), Ergebnisse mit drei gültigen Stellen. Mission 5: Kap. 4 (Stromdichte A35 mit 0,8 mm Aderdurchmesser, NYM A38, J-Y(ST)Y A40, Leiterfarben und PEN A41, Spannungsfall A45). Mission 12: Kap. 5 (W = P · t A48, P = U · I A50, P = U²/R A51/A52, Wirkungsgrad A53, Kosten A55) und 6.9 (Siebentaktschalter A85–A89). Mission 13: Kap. 6.1–6.8 (Regeln A60/A61, Knotenregel A62, Solarmodule A63/A64, Reihenschaltung A69, Innenwiderstand A70, gemischte Schaltung P09). Finale: A52, A71b, P10 |
| **Automatisierungstechnik Teil A – Schütztechnik, Kap. 0–6** | Missionen 2 und 3: Kennzeichen -SJ1/-SJ2/-SG0/-QA1/-BC1/-KF1/-PF, Anschlussbezeichnungen 13–14 / 21–22, Steuerstromkreis 24 V → 0 V, Selbsthaltung mit Vorrang AUS (A19–A24), Selbsthaltung statt Rastung (A21), Motorschutzrelais (A39, A42). Mission 14: Kap. 6 zeitgesteuerte Folgeschaltung (Zeitrelais A73–A75, Ablauf A76, -KF1 hinter den Folgekontakten A79, Abschaltung von -KF1 A80, Testprotokoll A82, digitaler Zwilling A84, Grenzen der VPS A88). Finale: A83, A86 |
| **LtK – Lernunterlagen Kap. 01–06** | Mission 15: 05 Adressierung im Netzwerk – Protokolle (A3), OSI-Schichten (A4), Dual → Dezimal (A7), Hex → Dezimal (A13), Broadcast-Adresse (A21), Adresskonflikt und Adresskonzept (A22, A23). Finale: statisch/dynamisch (A17), MAC und IP (A19), IPv4-Block bis 255 (A15). Mission 4: Datensicherheit/Datenschutz (Kap. 3), 3-2-1-1-0-Regel (A7), RAID ist kein Backup (Merke Kap. 2.3), TOM/Eingabekontrolle (A11), Prinzip der geringsten Rechte (A12, A13), vier Schutzziele (A14). Mission 6: 02 Datenübertragung – Sender-Empfänger-Modell (A1), Twisted Pair (A4: 100 m, U/F/S), Störfelder des Frequenzumrichters (A5), PoE/SPE (A6), WLAN-Generationen (A9), Sicherheitshinweis WPA3 |

Die Dateien selbst liegen nicht im Repository.

## Jahrgangsstufe 10 laut Lehrplan

| Fach | Lernfeld | Zeitrichtwert |
|---|---|---|
| Automatisierungstechnik | LF 1 Analysieren von Funktionszusammenhängen in mechatronischen Systemen | 36 Std. |
| Automatisierungstechnik | LF 4 Untersuchen der Energie- und Informationsflüsse in elektrischen und hydraulischen Baugruppen | 48 Std. |
| Mechanische Teilsysteme | LF 2 Herstellen mechanischer Teilsysteme | 84 Std. |
| Elektrotechnik | LF 3 Installieren elektrischer Betriebsmittel unter Beachtung sicherheitstechnischer Aspekte | 96 Std. |
| Logistik und technische Kommunikation (LtK) | LF 5 Kommunizieren mit Hilfe von Datenverarbeitungssystemen | 48 Std. |

## Aufgaben je Mission

| Mission | Aufgaben | Fach | Quelle |
|---|---|---|---|
| 1 Flackerndes Licht | et_kennbuchstabe, et_vorwiderstand, et_uebergang_r, sr_5regeln, sr_pruefer | Elektrotechnik | ET Kap. 1.5, 2.1, 3.2–3.5 |
| 2 Die Glocke lügt | st_schliesser, st_ziffern, st_glocke_fehler, st_glocke_fix | Automatisierungstechnik | Schütztechnik Kap. 1.3–1.5 |
| 3 Stillstand | st_selbsthaltung_mc, st_selbsthaltung, st_rastend, st_bc_einstellen, st_95_96 | Automatisierungstechnik | Schütztechnik Kap. 2.1–2.2, 3.2–3.4 |
| 4 Gelöschte Spuren | dv_datenschutz, dv_32110, dv_raid, dv_schutzziel, dv_rechte, dv_tom | LtK | LtK Kap. 2–4 (Jahresplanung BW 2–3) |
| 5 Leitungssalat | et_stromdichte, et_belastbarkeit, et_nym, et_aderfarben, et_spannungsfall | Elektrotechnik | ET Kap. 4 (A35, Tabellenbuch Strombelastbarkeit, A38, A40, A41, A45) |
| 6 Funkstille | lt_stoerquelle, lt_schirm, lt_segment, lt_poe, lt_wlan, lt_funknetz | LtK | LtK 02 Datenübertragung Kap. 1–3.1 (A1, A4, A5, A6, A9, Sicherheitshinweis) |
| 7 Zwei Bedienstellen | st_drahtbruch, st_nothalt, st_zwei_stellen, st_pf1, st_pf1_fehler | Automatisierungstechnik | Schütztechnik Kap. 2.3–2.5 (A25, A26, A27–A29, A32) |
| 8 Halbzeit | lt_netzarten, lt_linie, lt_stern, lt_ebenen, lt_bussysteme | LtK | LtK 03 Industrielle Netzwerke Kap. 1–4 (A2, A4, A5, A7, A12, A15) |
| 9 Der Vorhang fällt | st_gleichstrom, st_kurzschluss, st_verriegelung, st_wende, st_wende_fehler | Automatisierungstechnik | Schütztechnik Kap. 5 (A60, A62–A65, A67, A72) |
| 10 Dicke Luft | st_folge_forderung, st_folge_bc, st_folge_pf2, st_folge, st_folge_fehler | Automatisierungstechnik | Schütztechnik Kap. 4 (A51, A52, A54, A56, A59) – Band 2/Band 1 übertragen auf Absaugung/Säge |
| 11 Der Lauscher | lt_hub, lt_komponenten, lt_knopfzelle, lt_speicher, lt_ergonomie | LtK | LtK 04 Netzwerkkomponenten und Rechnersysteme Kap. 1–4 (A1, A2, A7, A8, A13–A15) |
| 12 Heiße Platten | et_toaster, et_wirkungsgrad, et_kochstufen, et_heizwiderstand, et_kochplatte_fehler, et_kosten | Elektrotechnik | ET Kap. 5 (A48, A53, A55) und 6.9 (A86–A89) |
| 13 Frische Luft | et_solar, et_regeln, et_knoten, et_innenwiderstand, et_reihe, et_gemischt | Elektrotechnik | ET Kap. 6.1–6.8 (A60–A64, A69, A70, P09) |
| 14 Der Nachlauf | st_zeitrelais_art, st_zeitablauf, st_zeitfolge, st_kf1_folge, st_zwilling, st_vps | Automatisierungstechnik | Schütztechnik Kap. 6 (A73–A80, A84, A88) – Sortierstation übertragen auf die Laborbänder |
| 15 Die falsche Adresse | lt_protokoll, lt_osi, lt_dual, lt_hex, lt_broadcast, lt_adresskonflikt | LtK | LtK 05 Adressierung im Netzwerk (A3, A4, A7, A13, A21–A23) |
| 16 Die Abschlussprüfung | ex_leistung, ex_parallel, ex_gemischt, ex_verriegelung, ex_simulation, ex_statisch, ex_mac, ex_ipv4 | gemischt | ET A52, A71b, P10; Schütztechnik A83, A86; LtK 05 A15, A17, A19 |

## Keine Vorgriffe

- **Elektrotechnik:** Kap. 1–6 sind abgedeckt. Schutzmaßnahmen und Messen (Kap. 7 ff.) kommen erst dran, wenn die Kapitel vorliegen.
- **Schütztechnik:** Kap. 0–6 sind abgedeckt; die zeitgesteuerte Folgeschaltung (Kap. 6) ist Mission 14. Der Ausblick auf die
  SPS kommt nur als Grenze der VPS vor – Digitaltechnik selbst ist noch nicht dran.
- **LtK:** 01–05 sind abgedeckt. Aus 06 (Praxisprojekt) stammt nur die Idee fester Adressen für Steuerungen; die Inbetriebnahme
  der LOGO! bleibt dem Unterricht vorbehalten. Subnetze werden nur mit der Maske 255.255.255.0 behandelt – wie in den Unterlagen.
