'use strict';
// ------------------------------------------------------------
//  Gegenstände und Dokumente
// ------------------------------------------------------------
const ITEMS = {
  taschenlampe: { name: 'Taschenlampe', desc: 'Eine alte LED-Stablampe aus deinem Spind. Der Schalter klemmt, aber sie leuchtet. Ohne sie siehst du in der Halle die Hand vor Augen nicht.' },
  schloss: { name: 'Vorhängeschloss', desc: 'Dein persönliches Sicherungsschloss – rot, mit Namensschild „AZUBI“. Hängt man es an einen ausgeschalteten Hauptschalter, kann niemand anders wieder einschalten. (Regel 2: Gegen Wiedereinschalten sichern!)' },
  verband: { name: 'Verbandpäckchen', desc: 'Steriles Verbandpäckchen aus dem Erste-Hilfe-Kasten. Stellt einen Teil deiner Gesundheit wieder her. (Im Inventar „Benutzen“.)', use: 'heal', stack: true },
  pruefer: { name: 'Zweipoliger Spannungsprüfer', desc: 'Ein zweipoliger Spannungsprüfer nach DIN EN 61243-3. Damit stellst du fest, ob ein Anlagenteil wirklich spannungsfrei ist (Regel 3). Ein einpoliger „Lügenstift“ wäre dafür nicht zulässig.' },
  windeisen: { name: 'Windeisen', desc: 'Verstellbares Windeisen zum Einspannen von Handgewindebohrern. Allein nutzt es dir nichts.' },
  gewindebohrer: { name: 'Handgewindebohrer-Satz M10', desc: 'Drei Handgewindebohrer M10 (Steigung P = 1,5 mm). Am Schaft sind Ringe eingeschliffen: einer hat 1 Ring, einer 2 Ringe, einer 3 Ringe. Braucht ein Windeisen.' },
  gewindeschneider: { name: 'Windeisen + Gewindebohrer M10', desc: 'Windeisen mit eingespanntem Gewindebohrer-Satz M10. Damit kannst du in ein passend vorgebohrtes Kernloch ein Innengewinde schneiden.' },
  schluessel: { name: 'Schlüssel „Schaltraum“', desc: 'Ein schwerer Bartschlüssel mit Plastikanhänger „SCHALTRAUM – NUR ELEKTROFACHKRAFT“. Irmgard hat ihn dir überlassen.' },
  ls: { name: 'Sortimentskasten LS-Schalter', desc: 'Ein verstaubter Kasten mit Leitungsschutzschaltern, 1-polig, Charakteristik B: B6, B10, B16 und B32.' },
  platte: { name: 'Motorhalteplatte (defekt)', desc: 'Stahlplatte aus S235, 12 mm dick. Das Befestigungsgewinde ist komplett ausgerissen. Man müsste das Loch aufbohren und ein neues Gewinde M10 schneiden.' },
  platte_gebohrt: { name: 'Motorhalteplatte (Kernloch)', desc: 'Die Halteplatte mit frisch gebohrtem Kernloch. Jetzt fehlt nur noch das Innengewinde M10.' },
  platte_fertig: { name: 'Motorhalteplatte (M10)', desc: 'Die Halteplatte mit sauber geschnittenem Innengewinde M10. Bereit zum Einbau am Bandantrieb.' },
  zahnraeder: { name: 'Kiste mit Zahnrädern', desc: 'Stirnräder, Modul 2, gleiche Bohrung. Auf den Rädern sind die Zähnezahlen eingeschlagen: z = 36, 54, 72 und 90.' },
  schlauch: { name: 'Pneumatikschlauch 6 mm', desc: 'Eine Rolle blauer PU-Schlauch, Außendurchmesser 6 mm, dazu Steckverschraubungen und zwei Schalldämpfer.' },
  widerstaende: { name: 'Widerstandssortiment', desc: 'Alois’ alte Blechschachtel voller Kohleschicht-Widerstände. Die Werte musst du schon selbst am Farbcode ablesen.' },
  schaltplan: { name: 'Schaltplan Förderband', desc: 'Ein laminierter Stromlaufplan „FB-01 Förderband – Steuerung“. Auf der Rückseite hat der Meister die Logik der Kleinsteuerung skizziert. (Unter Dokumente nachlesen.)' },
};

const FILES = {
  brief: {
    title: 'Zettel im Spind',
    html: `<p>Servus,</p>
<p>willkommen im Werk. Ich weiß, normal fängt keiner seine Ausbildung mit einer Nachtschicht an. Aber es ist keine normale Woche.</p>
<p>Seit ein paar Tagen geht in der Halle alles kaputt. Licht weg, Band steht, Presse verliert Luft. Am Montag um 6 Uhr will der Kunde 2000 Gehäuse – wenn wir die nicht liefern, dreht uns die Bank den Hahn zu. Dann war’s das mit Kessler.</p>
<p>Du hast im ersten Lehrjahr mehr gelernt, als du denkst. Ohmsches Gesetz, Bohren, Gewinde, Pneumatik, Sicherheitsregeln. <b>Benutz deinen Kopf.</b> Frag die Leute – aber trau nicht jedem.</p>
<p>Ich muss noch was erledigen. Lampe und Schloss liegen in deinem Spind.</p>
<p style="text-align:right">– Brandl, Meister</p>`
  },
  aushang: {
    title: 'Aushang: 5 Sicherheitsregeln (vergilbt)',
    html: `<p><b>DIE 5 SICHERHEITSREGELN</b> (DIN VDE 0105-100)<br><i>Vor Arbeiten an elektrischen Anlagen – in dieser Reihenfolge!</i></p>
<p>1. Freischalten</p>
<p>2. <span class="smudge">█████ ███████████████ ███████</span></p>
<p>3. Spannungsfreiheit <span class="smudge">█████████</span></p>
<p>4. <span class="smudge">██████ ███ ███████████████</span></p>
<p>5. <span class="smudge">███████████</span>, unter Spannung stehende Teile <span class="smudge">████████</span> oder abschranken</p>
<p class="note">Der Rest ist durch einen Wasserfleck unleserlich. Jemand hat mit Kuli daneben gekritzelt: „Wer’s nicht im Kopf hat, hat im Schaltraum nix verloren. – I.“</p>`
  },
  zeitung: {
    title: 'Zeitungsausschnitt',
    html: `<p><b>WERK KESSLER: LETZTE SCHONFRIST BIS MONTAG</b></p>
<p>Der traditionsreiche Antriebstechnik-Hersteller Kessler steht offenbar vor dem Aus. Nach Informationen unserer Zeitung hängt die weitere Finanzierung an einem Großauftrag, der bis Montag ausgeliefert werden muss.</p>
<p>Brisant: Ein Immobilienentwickler, die <b>Falk Grundbesitz GmbH</b>, hat bereits Interesse an dem Werksgelände signalisiert. „Ein Wohnquartier an dieser Stelle wäre ein Gewinn für die Stadt“, so Geschäftsführer Dr. Falk.</p>
<p>Belegschaft und Meister wollen davon nichts wissen. „Solange die Maschinen laufen, wird hier produziert“, sagt Werkmeister Brandl.</p>`
  },
  schichtbuch: {
    title: 'Schichtbuch Halle 3',
    html: `<p><b>Mo, Spätschicht:</b> Hallenbeleuchtung F3 ausgelöst. LS-Schalter fehlt?! Wer baut einen LS aus und nimmt ihn mit? – Schorsch</p>
<p><b>Di, Nacht:</b> Motorhalterung Förderband ausgerissen. Schrauben lagen daneben, sauber aufgereiht. Komisch. – Alois</p>
<p><b>Mi, Früh:</b> Zahnrad am Bandgetriebe fehlt. Nicht gebrochen – <u>fehlt</u>. – Brandl</p>
<p><b>Mi, Nacht:</b> Presse: Schläuche abgezogen, Ventil falsch verschlaucht. Hab’s gelassen, bin kein Pneumatiker. – Schorsch</p>
<p><b>Do, Nacht:</b> Wieder Schritte im Lager. Hab gerufen. Keiner da. Kowalski sagt, er war’s nicht. – Irmgard</p>
<p><b>Fr:</b> <i>(Die Seite ist herausgerissen.)</i></p>`
  },
  leistung: {
    title: 'Hefteintrag LF3: Leistung & Leitungsschutz',
    html: `<p><b>Elektrische Leistung</b>: P = U · I &nbsp;→&nbsp; I = P / U</p>
<p><b>Ohmsches Gesetz</b>: U = R · I &nbsp;→&nbsp; R = U / I</p>
<p><b>Parallelschaltung</b> (Lampen in der Halle!): Die Einzelleistungen addieren sich: P<sub>ges</sub> = P<sub>1</sub> + P<sub>2</sub> + …</p>
<p><b>Leitungsschutzschalter (LS)</b> schützen die <u>Leitung</u> vor Überlast und Kurzschluss.</p>
<p>Auswahlregel: &nbsp; I<sub>Betrieb</sub> ≤ I<sub>Nenn,LS</sub> ≤ I<sub>zulässig,Leitung</sub></p>
<p>Charakteristik B: löst magnetisch beim 3- bis 5-fachen Nennstrom aus (für ohmsche Lasten, Beleuchtung).</p>
<p class="note">Am Rand mit Bleistift: „Immer den nächstgrößeren Normwert nehmen – aber nie größer, als die Leitung verträgt!“</p>`
  },
  gewinde: {
    title: 'Tabellenbuch: Metrisches ISO-Gewinde',
    html: `<table class="tb"><tr><th>Gewinde</th><th>Steigung P</th><th>Kernloch-Ø Bohrer</th></tr>
<tr><td>M5</td><td>0,8 mm</td><td>4,2 mm</td></tr>
<tr><td>M6</td><td>1,0 mm</td><td>5,0 mm</td></tr>
<tr><td>M8</td><td>1,25 mm</td><td>6,8 mm</td></tr>
<tr><td>M10</td><td>1,5 mm</td><td><span class="smudge">█████</span></td></tr>
<tr><td>M12</td><td>1,75 mm</td><td>10,2 mm</td></tr></table>
<p class="note">Ausgerechnet bei M10 klebt ein Kaffeefleck. Vielleicht erkennt man ja eine Regel in den anderen Zeilen?</p>`
  },
  bohren: {
    title: 'Aushang an der Säulenbohrmaschine',
    html: `<p><b>BETRIEBSANWEISUNG SÄULENBOHRMASCHINE</b></p>
<p>⚠ Schutzbrille tragen! &nbsp; ⚠ <b>Keine Handschuhe!</b> (Einzugsgefahr) &nbsp; ⚠ Lange Haare zusammenbinden.<br>⚠ Werkstück immer im Maschinenschraubstock spannen – nie mit der Hand halten.</p>
<p><b>Drehzahl:</b> &nbsp; n = (v<sub>c</sub> · 1000) / (π · d) &nbsp; [n in 1/min, v<sub>c</sub> in m/min, d in mm]</p>
<table class="tb"><tr><th>Werkstoff</th><th>v<sub>c</sub> (HSS-Bohrer)</th></tr>
<tr><td>Baustahl S235</td><td>25 m/min</td></tr><tr><td>Edelstahl</td><td>10 m/min</td></tr><tr><td>Aluminium</td><td>60 m/min</td></tr></table>
<p>Drehzahlstufen der Maschine: 280 – 450 – 710 – 900 – 1400 – 2240 1/min.<br>Die nächstliegende Stufe wählen.</p>`
  },
  getriebe: {
    title: 'Alois’ Spickzettel: Übersetzungen',
    html: `<p>Für die Jungen, die’s nie im Kopf haben:</p>
<p><b>Übersetzung</b> i = n<sub>1</sub> / n<sub>2</sub> = z<sub>2</sub> / z<sub>1</sub></p>
<p>Index 1 = treibendes Rad (am Motor), Index 2 = getriebenes Rad.</p>
<p>i &gt; 1 → <b>ins Langsame</b> (Drehzahl runter, Drehmoment rauf).<br>Großes Rad getrieben = langsamer.</p>
<p class="note">Darunter, krakelig: „Band-Antriebswelle braucht 350/min, sonst fliegen die Gehäuse vom Band. Hab’s dem Brandl hundert Mal gesagt.“</p>`
  },
  pneumatik: {
    title: 'Hefteintrag LF4: Wegeventile',
    html: `<p><b>Anschlussbezeichnung nach ISO 5599</b></p>
<table class="tb"><tr><th>Nr.</th><th>Bedeutung</th></tr>
<tr><td>1</td><td>Druckluftanschluss (Versorgung)</td></tr>
<tr><td>2, 4</td><td>Arbeitsanschlüsse (zum Zylinder)</td></tr>
<tr><td>3, 5</td><td>Entlüftung (Schalldämpfer)</td></tr>
<tr><td>12, 14</td><td>Steueranschlüsse</td></tr></table>
<p><b>5/2-Wegeventil</b>: 5 Anschlüsse, 2 Schaltstellungen. Mit Federrückstellung: In der Grundstellung ist 1 → 2 und 4 → 5 verbunden.</p>
<p><b>Logik in der Pneumatik:</b><br>Zweidruckventil = UND (Ausgang nur, wenn beide Eingänge Druck haben)<br>Wechselventil = ODER (Ausgang, wenn mind. ein Eingang Druck hat)</p>`
  },
  farbcode: {
    title: 'Farbcode-Aufkleber (Steuerschranktür)',
    html: `<table class="tb"><tr><th>Farbe</th><th>Ziffer</th><th>Multiplikator</th></tr>
<tr><td><span class="sw" style="background:#000"></span> schwarz</td><td>0</td><td>×1</td></tr>
<tr><td><span class="sw" style="background:#6b3b1a"></span> braun</td><td>1</td><td>×10</td></tr>
<tr><td><span class="sw" style="background:#c22"></span> rot</td><td>2</td><td>×100</td></tr>
<tr><td><span class="sw" style="background:#e67a00"></span> orange</td><td>3</td><td>×1 k</td></tr>
<tr><td><span class="sw" style="background:#e6d200"></span> gelb</td><td>4</td><td>×10 k</td></tr>
<tr><td><span class="sw" style="background:#2a2"></span> grün</td><td>5</td><td>×100 k</td></tr>
<tr><td><span class="sw" style="background:#24c"></span> blau</td><td>6</td><td>×1 M</td></tr>
<tr><td><span class="sw" style="background:#839"></span> violett</td><td>7</td><td></td></tr>
<tr><td><span class="sw" style="background:#888"></span> grau</td><td>8</td><td></td></tr>
<tr><td><span class="sw" style="background:#eee"></span> weiß</td><td>9</td><td></td></tr></table>
<p>4-Ring-Code: 1. Ring = 1. Ziffer, 2. Ring = 2. Ziffer, 3. Ring = Multiplikator, 4. Ring = Toleranz (gold ±5 %).</p>`
  },
  messschieber: {
    title: 'Hefteintrag LF2: Messschieber ablesen',
    html: `<p><b>Messschieber mit 1/10-Nonius</b></p>
<p>1. Ganze Millimeter: Wo steht der <b>Nullstrich des Nonius</b> auf der Hauptskala? Den Strich <u>links</u> davon ablesen.</p>
<p>2. Zehntel: Welcher <b>Noniusstrich</b> fluchtet <u>genau</u> mit einem Strich der Hauptskala? Seine Nummer = Zehntelmillimeter.</p>
<p>Beispiel: Nullstrich zwischen 12 und 13, Noniusstrich 7 fluchtet → 12,7 mm.</p>`
  },
  kowalski: {
    title: 'Zerknüllter Zettel',
    html: `<p><i>Hinter den Zahnradkisten, zwischen Spinnweben:</i></p>
<p>K.,</p>
<p>gute Arbeit bisher. Noch ein paar Tage, dann ist Montag und die Sache erledigt. Lass dich nicht vom Alten erwischen. Der Rest vom Geld wie besprochen nach Abschluss.</p>
<p>Und: <b>keine Spuren</b>. Die ausgebauten Teile verschwinden lassen.</p>
<p style="text-align:right">– F.</p>`
  },
  tagebuch: {
    title: 'Notizbuch des Meisters',
    html: `<p><b>Dienstag.</b> Halterung ausgerissen. Das war kein Verschleiß – das Gewinde war <i>ausgebohrt</i>. Jemand will, dass wir den Termin reißen.</p>
<p><b>Mittwoch.</b> Zahnrad weg. Ich hab Kowalski gefragt, wo er Montagnacht war. Er hat gelacht. Seit wann hat ein Hausmeister einen neuen Audi?</p>
<p><b>Donnerstag.</b> Ich kann ihn nicht einfach beschuldigen. Ich brauch Beweise – und ich brauch jemanden, der die Halle wieder zum Laufen bringt, während ich ihm auf die Finger schau.</p>
<p><b>Freitag.</b> Der neue Azubi. Gute Noten in der Berufsschule, ruhiger Typ. Ich lass ihn die Nachtschicht machen. Wenn einer das schafft, dann einer, der noch weiß, was im Tabellenbuch steht.</p>
<p><b>Samstag, 21:40.</b> Ich leg mich hinterm Rolltor auf die Lauer. Der Code fürs Büro ist das Prüfstück – der Junge wird’s finden.</p>`
  },
  logik: {
    title: 'Rückseite Schaltplan: Logik Förderband',
    html: `<p><b>Kleinsteuerung FB-01 – Funktionsbeschreibung</b></p>
<p>Signale: S1 = Taster START (Schließer) · K1 = Rückmeldung „Motor läuft“ · B1 = Schutztür geschlossen (1 = zu) · S0 = NOT-HALT betätigt (1 = gedrückt)</p>
<p>• Das Band (Q1) startet, wenn START gedrückt wird.<br>
• Es soll <b>weiterlaufen</b>, wenn START losgelassen wird (Selbsthaltung über K1).<br>
• Es darf nur laufen, wenn die Schutztür <b>zu</b> ist.<br>
• Bei NOT-HALT muss es <b>sofort</b> stehen.</p>
<p class="note">Hinweis Brandl: In echt ist NOT-HALT ein Öffner und fest verdrahtet, nicht nur Software! Das hier ist nur die Freigabelogik der Kleinsteuerung.</p>`
  },
};
