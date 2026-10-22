# Unterlagen und Zuordnung der Aufgaben

Grundlage der Fachaufgaben sind die Unterlagen der Lehrkraft (Klasse MT10, Staatliche Berufsschule I Kempten):

| Unterlage | Verwendung im Spiel |
|---|---|
| **Lehrplanrichtlinien Mechatroniker/-in, Bayern (Oktober 2018)** | Fächer und Lernfelder der Jahrgangsstufe 10; jede Aufgabe nennt Fach (`thema`) und Lehrplaninhalt (`lehrplan`) |
| **Didaktische Jahresplanung LtK 10** | Reihenfolge der LtK-Inhalte (keine Vorgriffe) |
| **Elektrotechnik – Lernunterlagen Jgst. 10, LF 3, Kap. 1–4** (Grundbegriffe, Kennbuchstaben und Einheiten, Ohm’sches Gesetz, Leitungsdimensionierung) | Mission 1: Sicherheitsregeln im Wortlaut, zweipoliger Spannungsprüfer, Kennbuchstaben, Vorwiderstand (vgl. A22), Übergangswiderstand (vgl. A17), Ergebnisse mit drei gültigen Stellen. Leistung (Kap. 6) folgt erst – deshalb keine Leistungsaufgaben |
| **Automatisierungstechnik Teil A – Schütztechnik, Kap. 0–6** | Missionen 2 und 3: Kennzeichen -SJ1/-SJ2/-SG0/-QA1/-BC1/-KF1/-PF, Anschlussbezeichnungen 13–14 / 21–22, Steuerstromkreis 24 V → 0 V, Selbsthaltung mit Vorrang AUS (A19–A24), Selbsthaltung statt Rastung (A21), Motorschutzrelais (A39, A42) |
| **LtK – Lernunterlagen Kap. 01–06** | Mission 4: Datensicherheit/Datenschutz (Kap. 3), 3-2-1-1-0-Regel (A7), RAID ist kein Backup (Merke Kap. 2.3), TOM/Eingabekontrolle (A11), Prinzip der geringsten Rechte (A12, A13), vier Schutzziele (A14). Mission 6: 02 Datenübertragung – Sender-Empfänger-Modell (A1), Twisted Pair (A4: 100 m, U/F/S), Störfelder des Frequenzumrichters (A5), PoE/SPE (A6), WLAN-Generationen (A9), Sicherheitshinweis WPA3 |

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
| 5 Leitungssalat | et_stromdichte, et_belastbarkeit, et_nym, et_aderfarben, et_spannungsfall | Elektrotechnik | ET Kap. 4.1–4.3 (A27e, Tabelle Strombelastbarkeit, A30, A32, A36) |
| 6 Funkstille | lt_stoerquelle, lt_schirm, lt_segment, lt_poe, lt_wlan, lt_funknetz | LtK | LtK 02 Datenübertragung Kap. 1–3.1 (A1, A4, A5, A6, A9, Sicherheitshinweis) |
| 7 Zwei Bedienstellen | st_drahtbruch, st_nothalt, st_zwei_stellen, st_pf1, st_pf1_fehler | Automatisierungstechnik | Schütztechnik Kap. 2.3–2.5 (A25, A26, A27–A29, A32) |
| 8 Halbzeit | lt_netzarten, lt_linie, lt_stern, lt_ebenen, lt_bussysteme | LtK | LtK 03 Industrielle Netzwerke Kap. 1–4 (A2, A4, A5, A7, A12, A15) |
| 9 Der Vorhang fällt | st_gleichstrom, st_kurzschluss, st_verriegelung, st_wende, st_wende_fehler | Automatisierungstechnik | Schütztechnik Kap. 5 (A60, A62–A65, A67, A72) |
| 10 Dicke Luft | st_folge_forderung, st_folge_bc, st_folge_pf2, st_folge, st_folge_fehler | Automatisierungstechnik | Schütztechnik Kap. 4 (A51, A52, A54, A56, A59) – Band 2/Band 1 übertragen auf Absaugung/Säge |
| 11 Der Lauscher | lt_hub, lt_komponenten, lt_knopfzelle, lt_speicher, lt_ergonomie | LtK | LtK 04 Netzwerkkomponenten und Rechnersysteme Kap. 1–4 (A1, A2, A7, A8, A13–A15) |

## Keine Vorgriffe – Reihenfolge für die weiteren Akte

- **Elektrotechnik:** Kap. 4 Leitungsdimensionierung ist mit Mission 5 abgedeckt; Widerstandsschaltungen (Kap. 5),
  Arbeit/Leistung/Wirkungsgrad (Kap. 6) und Schutzmaßnahmen/Messen (Kap. 7) erst, wenn die Kapitel vorliegen.
- **Schütztechnik:** Folgeschaltung (Kap. 4) und Wendeschützschaltung (Kap. 5) sind mit Mission 9 und 10 abgedeckt;
  die zeitgesteuerte Folgeschaltung (Kap. 6) bleibt für das Finale.
- **LtK:** Übertragungsmedien und Funk (Mission 6), Industrielle Netzwerke (Mission 8) und Netzwerkkomponenten (Mission 11) sind abgedeckt; als Nächstes Adressierung (LtK 05) und das Praxisprojekt (LtK 06) im Finale → Ebenenmodell, Bussysteme,
  Schichtenmodell, Zahlensysteme, IP-Adressierung (Akt 2/3) → Inbetriebnahme des vernetzten Systems (Finale).
