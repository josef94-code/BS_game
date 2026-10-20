// Gegenstände, Fundorte, Dokumente und Texte
const ic = (body, bg = '#2b3a48') => `<svg viewBox="0 0 48 48"><rect x="2" y="2" width="44" height="44" rx="10" fill="${bg}"/>${body}</svg>`;

export const ITEMS = {
  wasser:     { name: 'Wasserflasche', desc: 'Trinkwasser, 1,5 Liter. Löscht den Durst.', use: 'trinken', thirst: 38, icon: ic('<rect x="19" y="12" width="10" height="26" rx="4" fill="#7fd0f0"/><rect x="21" y="8" width="6" height="5" fill="#2a7fc0"/>') },
  kokos:      { name: 'Kokosnuss', desc: 'Nahrhaft, mit etwas Kokoswasser.', use: 'essen', hunger: 22, thirst: 10, icon: ic('<circle cx="24" cy="25" r="12" fill="#6b4a2b"/><circle cx="20" cy="21" r="2" fill="#3a2715"/><circle cx="26" cy="20" r="2" fill="#3a2715"/>') },
  konserve:   { name: 'Konservendose', desc: 'Eintopf aus der Bordküche. Satt für Stunden.', use: 'essen', hunger: 45, icon: ic('<rect x="14" y="14" width="20" height="22" rx="3" fill="#c8ccd0"/><rect x="14" y="19" width="20" height="10" fill="#c0392b"/>') },
  rohr:       { name: 'Stahlrohr (1,2 m)', desc: 'Ein Stück Geländerrohr. Als Hebelverlängerung brauchbar.', icon: ic('<rect x="8" y="22" width="32" height="5" rx="2" fill="#a9b1b8" transform="rotate(-30 24 24)"/>') },
  holz:       { name: 'Treibholz', desc: 'Trockene Äste vom Strand. Für Lager und Feuer.', icon: ic('<rect x="10" y="20" width="28" height="6" rx="3" fill="#a07a52" transform="rotate(-15 24 24)"/><rect x="12" y="26" width="24" height="5" rx="2.5" fill="#8a6440" transform="rotate(12 24 24)"/>') },
  werkzeug:   { name: 'Werkzeugkoffer', desc: 'Schraubendreher, Zangen, Schlüsselsatz, Messer, Feuerzeug und eine Stirnlampe.', icon: ic('<rect x="9" y="17" width="30" height="20" rx="3" fill="#d35400"/><rect x="18" y="12" width="12" height="6" rx="2" fill="none" stroke="#d35400" stroke-width="3"/>') },
  plane:      { name: 'Abdeckplane', desc: 'Robuste LKW-Plane, 4 × 3 m.', icon: ic('<path d="M10 32 L24 14 L38 32 Z" fill="#2f7fb8"/>') },
  funk:       { name: 'Handfunkgerät', desc: 'UKW-Seefunkgerät. Betriebsspannung 12 V DC. Der Akku ist leer – aber es gibt ein Batteriefach.', icon: ic('<rect x="17" y="12" width="14" height="26" rx="3" fill="#333"/><rect x="25" y="5" width="3" height="9" fill="#333"/><rect x="19" y="16" width="10" height="6" fill="#6fcf97"/>') },
  batterien:  { name: '8 Mignonzellen (AA)', desc: 'Alkaline-Zellen, je 1,5 V, 2500 mAh.', icon: ic('<rect x="12" y="15" width="8" height="20" rx="2" fill="#f1c40f"/><rect x="22" y="15" width="8" height="20" rx="2" fill="#f1c40f"/><rect x="32" y="15" width="6" height="20" rx="2" fill="#f1c40f"/>') },
  kabel:      { name: 'Kabeltrommel', desc: 'Kupferleitungen in verschiedenen Querschnitten (4 / 6 / 10 / 16 mm²).', icon: ic('<circle cx="24" cy="24" r="13" fill="none" stroke="#e67e22" stroke-width="5"/><circle cx="24" cy="24" r="4" fill="#555"/>') },
  sicherungen:{ name: 'Sicherungssortiment', desc: 'KFZ-Hochstromsicherungen (MIDI): 32 A, 50 A, 80 A, 125 A.', icon: ic('<rect x="12" y="18" width="24" height="12" rx="2" fill="#e74c3c"/><rect x="20" y="20" width="8" height="8" fill="#fff" opacity=".6"/>') },
  multimeter: { name: 'Digitalmultimeter', desc: 'Kann Spannung, Strom, Widerstand und Durchgang messen.', icon: ic('<rect x="14" y="9" width="20" height="30" rx="3" fill="#f39c12"/><rect x="17" y="12" width="14" height="8" fill="#cfe8d0"/><circle cx="24" cy="29" r="5" fill="#333"/>') },
  akku:       { name: 'LiFePO4-Akku 24 V / 100 Ah', desc: 'Lithium-Eisenphosphat-Akku aus der Notstromversorgung. Schwer, aber voll.', icon: ic('<rect x="10" y="15" width="28" height="22" rx="2" fill="#2b5aa0"/><rect x="14" y="11" width="5" height="5" fill="#c0392b"/><rect x="29" y="11" width="5" height="5" fill="#222"/>') },
  regler:     { name: 'MPPT-Laderegler', desc: 'Solarladeregler mit Maximum Power Point Tracking. Datenblatt auf Englisch.', icon: ic('<rect x="12" y="10" width="24" height="28" rx="3" fill="#222"/><rect x="16" y="14" width="16" height="7" fill="#2ecc71"/>') },
  bauplan:    { name: 'Bauplan „Solarboot“', desc: 'Henriks Hobbyprojekt: Konstruktionszeichnung eines Solar-Katamarans.', icon: ic('<rect x="10" y="10" width="28" height="28" fill="#2a5fa8"/><path d="M14 30 L24 18 L34 30" stroke="#fff" fill="none" stroke-width="2"/>', '#1d3d6b') },
  solar:      { name: 'Solarmodul 100 W', desc: 'Monokristallines Modul. Typenschild auf Englisch.', icon: ic('<rect x="11" y="12" width="26" height="24" fill="#1a2a50" stroke="#aab" stroke-width="2"/><path d="M11 20h26M11 28h26M20 12v24M28 12v24" stroke="#5b6f9a"/>') },
  wind:       { name: 'Kleinwindanlage', desc: 'Permanentmagnet-Generator, liefert Wechselspannung.', icon: ic('<rect x="23" y="20" width="2" height="20" fill="#ddd"/><path d="M24 20 L24 7 M24 20 L13 27 M24 20 L35 27" stroke="#eee" stroke-width="3"/>') },
  dioden:     { name: '4 Leistungsdioden', desc: 'Gleichrichterdioden 1000 V / 25 A.', icon: ic('<path d="M14 24h6M28 24h6M20 17v14l8-7z" stroke="#fff" fill="#ddd" stroke-width="2"/><rect x="28" y="17" width="2" height="14" fill="#fff"/>') },
  motor:      { name: 'Gleichstrommotor 24 V / 1 kW', desc: 'Permanenterregter DC-Motor, 3000 1/min. War im Salzwasser.', icon: ic('<rect x="12" y="16" width="22" height="16" rx="4" fill="#2d5aa0"/><rect x="34" y="22" width="6" height="4" fill="#aaa"/>') },
  schwimmer:  { name: 'Schwimmkörper', desc: 'Leerer Kunststoff-Schwimmer einer Hafenboje. Trägt locker 300 kg.', icon: ic('<ellipse cx="24" cy="24" rx="15" ry="9" fill="#ecf0f1"/><rect x="21" y="15" width="6" height="18" fill="#e74c3c"/>') },
  alu:        { name: 'Aluminium-Profile', desc: 'Strangpressprofile 40 × 40 mm, 6 Stück à 3 m.', icon: ic('<rect x="10" y="14" width="28" height="5" fill="#cdd3d8"/><rect x="10" y="22" width="28" height="5" fill="#cdd3d8"/><rect x="10" y="30" width="28" height="5" fill="#cdd3d8"/>') },
  schrauben:  { name: 'Schraubensortiment', desc: 'Verschiedene Schrauben, Muttern und Scheiben. Werkstoffe gemischt.', icon: ic('<rect x="22" y="14" width="4" height="22" fill="#bbb"/><rect x="18" y="11" width="12" height="5" fill="#999"/>') },
  riemen:     { name: 'Zahnriemen-Satz', desc: 'Zahnriemen und Riemenscheiben mit z = 15, 20, 30, 45, 60, 72 Zähnen.', icon: ic('<circle cx="17" cy="24" r="6" fill="#777"/><circle cx="32" cy="24" r="9" fill="#777"/><path d="M17 18 L32 15 M17 30 L32 33" stroke="#222" stroke-width="2.5"/>') },
  propeller:  { name: 'Bootspropeller', desc: 'Dreiblatt-Propeller aus Bronze, Nabe mit Passfedernut.', icon: ic('<circle cx="24" cy="24" r="3" fill="#c99a3a"/><path d="M24 24 L24 9 M24 24 L11 31 M24 24 L37 31" stroke="#c99a3a" stroke-width="5" stroke-linecap="round"/>') },
  relais:     { name: 'Relais-Set + Reißleinenschalter', desc: 'Zwei Leistungsrelais (K1, K2), Fahrschalter S1/S2 und ein Not-Halt mit Reißleine (S0).', icon: ic('<rect x="11" y="14" width="12" height="20" fill="#2c3e50" stroke="#8aa" /><rect x="25" y="14" width="12" height="20" fill="#2c3e50" stroke="#8aa"/>') },
  bake:       { name: 'Notfunkbake (AIS-SART)', desc: 'Sendet die Position per UKW-Funk an Schiffe in der Nähe. Anleitung auf Englisch.', icon: ic('<rect x="18" y="12" width="12" height="26" rx="4" fill="#e67e22"/><rect x="22" y="6" width="4" height="8" fill="#e67e22"/><circle cx="24" cy="18" r="2.5" fill="#fff"/>') },
};

// Einsammelbare Gegenstände in der Welt
export const PICKUPS = [
  { id: 'p_wasser1', item: 'wasser', n: 3, x: 21, z: 106, model: 'crate', label: 'Angeschwemmte Kiste' , doc: 'ladeliste' },
  { id: 'p_kokos1', item: 'kokos', n: 2, x: 8, z: 96, model: 'coco' },
  { id: 'p_rohr', item: 'rohr', n: 1, x: 31, z: 99, model: 'pipe', label: 'Stahlrohr' },
  { id: 'p_holz1', item: 'holz', n: 1, x: -2, z: 98, model: 'wood' },
  { id: 'p_holz2', item: 'holz', n: 1, x: -18, z: 96, model: 'wood' },
  { id: 'p_holz3', item: 'holz', n: 1, x: -28, z: 90, model: 'wood' },
  { id: 'p_holz4', item: 'holz', n: 1, x: 12, z: 88, model: 'wood' },
  { id: 'p_holz5', item: 'holz', n: 1, x: 26, z: 92, model: 'wood' },
  { id: 'p_kokos2', item: 'kokos', n: 2, x: -16, z: 78, model: 'coco' },
  { id: 'p_schwimmer1', item: 'schwimmer', n: 1, x: 96, z: -20, model: 'float', req: 'bauplan' },
  { id: 'p_schwimmer2', item: 'schwimmer', n: 1, x: -76, z: 34, model: 'float', req: 'bauplan' },
  { id: 'p_konserve', item: 'konserve', n: 1, x: 80, z: 30, model: 'crate', label: 'Kiste mit Konserven' },
  // Im Wrack (Zone „wrack“, lokale Koordinaten werden in interior.js umgerechnet)
  { id: 'w_kabel', item: 'kabel', n: 1, zone: 'wrack', lx: -4, lz: -4, model: 'crate', label: 'Kabeltrommel', doc: 'tabelle' },
  { id: 'w_sich', item: 'sicherungen', n: 1, zone: 'wrack', lx: 4.5, lz: -1, model: 'box', label: 'Ersatzteilkiste' },
  { id: 'w_multi', item: 'multimeter', n: 1, zone: 'wrack', lx: 4.5, lz: 4, model: 'box', label: 'Werkstattschrank' },
  { id: 'w_relais', item: 'relais', n: 1, zone: 'wrack', lx: -4.5, lz: 7.5, model: 'box', label: 'Schaltschrank-Ersatzteile', req: 'bauplan' },
  { id: 'w_akku', item: 'akku', n: 1, zone: 'wrack', lx: -3.5, lz: 16, model: 'battery', label: 'Notstrom-Akku' },
  { id: 'w_regler', item: 'regler', n: 1, zone: 'wrack', lx: 3.8, lz: 15.5, model: 'box', label: 'Laderegler', doc: 'datenblatt_regler' },
  { id: 'w_bauplan', item: 'bauplan', n: 1, zone: 'wrack', lx: 3.6, lz: 20.4, y: 0.82, model: 'paper', label: 'Henriks Schreibtisch', doc: 'bauplan' },
  { id: 'w_riemen', item: 'riemen', n: 1, zone: 'wrack', lx: -3.8, lz: 20, model: 'box', label: 'Ersatzteilregal', req: 'bauplan' },
  { id: 'w_schrauben', item: 'schrauben', n: 1, zone: 'wrack', lx: 1.8, lz: 22.8, model: 'box', label: 'Schraubenschrank', req: 'bauplan' },
];

// Container-Inhalte
export const CONTAINERS = {
  contA: { name: 'Container LND 4711', items: { werkzeug: 1, plane: 1, konserve: 2, funk: 1, batterien: 1 }, needs: 'p1' },
  contB: { name: 'Container LND 2207', items: { solar: 4, propeller: 1, wasser: 2 }, doc: 'datenblatt_pv', needs: 'rohr', req: 'bauplan' },
  contC: { name: 'Container LND 5530', items: { wind: 1, dioden: 1, motor: 1, alu: 1, konserve: 1 }, needs: 'rohr', req: 'bauplan' },
};

export const DOCS = {
  ladeliste: { title: 'Ladeliste MV LINDAU (Auszug)', html: `
    <p class="mono">MV LINDAU · Bremerhaven → Port Louis · Reise 0817</p>
    <table><tr><th>Container</th><th>Inhalt</th></tr>
    <tr><td>LND 4711 <span class="dot" style="background:#b5452c"></span></td><td>Bordausrüstung: Werkzeug, Notverpflegung, Funkersatz</td></tr>
    <tr><td>LND 2207 <span class="dot" style="background:#2f6aa3"></span></td><td>Photovoltaik: 4 Module à 100 W, Bootszubehör</td></tr>
    <tr><td>LND 5530 <span class="dot" style="background:#3d8a4f"></span></td><td>Antriebstechnik: Kleinwindanlage, DC-Motoren, Aluprofile, Halbleiter</td></tr>
    <tr><td>LND 41xx</td><td>Maschinenbauteile (an Deck)</td></tr></table>
    <p class="note">Handschriftlich: „Ersatzteile Maschinenraum → Henrik fragen!“</p>` },
  tabelle: { title: 'Tabellenbuch – Strombelastbarkeit (Auszug)', html: `
    <p>Kupferleitungen, PVC-Isolierung, Verlegeart frei in Luft, Umgebung 30 °C</p>
    <table><tr><th>Querschnitt A</th><th>Belastbarkeit I<sub>z</sub></th></tr>
    <tr><td>2,5 mm²</td><td>24 A</td></tr><tr><td>4 mm²</td><td>32 A</td></tr><tr><td>6 mm²</td><td>41 A</td></tr>
    <tr><td>10 mm²</td><td>57 A</td></tr><tr><td>16 mm²</td><td>76 A</td></tr><tr><td>25 mm²</td><td>101 A</td></tr></table>
    <p class="rule">Regel: I<sub>B</sub> ≤ I<sub>n</sub> ≤ I<sub>z</sub><br><small>Betriebsstrom ≤ Nennstrom der Sicherung ≤ Belastbarkeit der Leitung</small></p>` },
  datenblatt_pv: { title: 'Datasheet – PV Module SOLARIS 100M', html: `
    <p class="mono">Electrical data at STC (1000 W/m², 25 °C, AM 1.5)</p>
    <table><tr><td>Maximum power P<sub>max</sub></td><td>100 W</td></tr>
    <tr><td>Voltage at max. power V<sub>mp</sub></td><td>18.0 V</td></tr>
    <tr><td>Current at max. power I<sub>mp</sub></td><td>5.56 A</td></tr>
    <tr><td>Open circuit voltage V<sub>oc</sub></td><td>22.0 V</td></tr>
    <tr><td>Short circuit current I<sub>sc</sub></td><td>5.90 A</td></tr>
    <tr><td>Max. system voltage</td><td>1000 V DC</td></tr></table>
    <p class="note">Note: Modules connected in <b>series</b> add their voltages, modules connected in <b>parallel</b> add their currents.</p>` },
  datenblatt_regler: { title: 'Datasheet – MPPT Charge Controller 75/15', html: `
    <table><tr><td>Battery voltage</td><td>12 / 24 V (auto select)</td></tr>
    <tr><td>Max. PV open circuit voltage</td><td><b>75 V</b></td></tr>
    <tr><td>Max. PV input current</td><td><b>15 A</b></td></tr>
    <tr><td>Start charging</td><td>PV voltage must exceed battery voltage + 5 V</td></tr>
    <tr><td>Max. charge current</td><td>15 A</td></tr>
    <tr><td>Protection</td><td>IP43</td></tr></table>
    <p class="note">Warning: PV voltage above 75 V will damage the controller!</p>` },
  bauplan: { title: 'Bauplan „Solarboot“ – H. Olsen', html: '__BAUPLAN__' },
  logbuch: { title: 'Logbuch MV LINDAU (letzte Einträge)', html: `
    <p class="mono">14.03. 06:00 – Zyklon „Imani“ dreht nach Süden. Kurs 210°, Wind 9 Bft.</p>
    <p class="mono">14.03. 21:40 – Ruderanlage gestört. Maschine läuft mit halber Kraft.</p>
    <p class="mono">15.03. 02:15 – Grundberührung! Riff vor unbekannter Insel. Wassereinbruch Laderaum 2.</p>
    <p class="mono">15.03. 02:40 – Schiff aufgeben. Rettungsinseln 1 und 2 zu Wasser. Mechatronikerin Brandl über Bord gegangen, Suche wegen Seegang abgebrochen …</p>` },
  handbuch_bake: { title: 'AIS-SART – Quick Start Guide', html: `
    <ol><li>Set the 8-bit <b>group ID</b> with DIP switches 1–8. Switch 1 is the <b>most significant bit (MSB, value 128)</b>, switch 8 is the least significant bit (LSB, value 1).</li>
    <li>The display shows the ID in <b>hexadecimal</b>.</li>
    <li>Pull the safety pin and switch to ON. The SART transmits on <b>VHF</b> (161.975 / 162.025 MHz).</li>
    <li>Range depends on antenna height: approx. 5 nautical miles (≈ 9 km) to ships.</li></ol>` },
  schild_hydraulik: { title: 'Typenschild Hydraulikzylinder – Schott 2', html: `
    <table><tr><td>Kolbendurchmesser d</td><td>50 mm</td></tr><tr><td>Stangendurchmesser</td><td>28 mm</td></tr>
    <tr><td>max. Betriebsdruck</td><td>160 bar</td></tr><tr><td>Druckbegrenzungsventil</td><td>eingestellt auf 63 bar</td></tr></table>
    <p class="note">Aufkleber: „Losbrechkraft Schott bei Verformung bis 9,8 kN“</p>` },
};

// Lerneinträge (Logbuch) – erscheinen nach jedem gelösten Rätsel
export const LOG = {
  p1: { lf: 'LF 2', title: 'Hebelgesetz und Drehmoment', html: `<p>Drehmoment = Kraft × Hebelarm: <b>M = F · l</b></p><p>Benötigter Hebelarm: l = M / F = 180 N·m / 300 N = <b>0,6 m</b></p><p class="rule">Je länger der Hebelarm, desto kleiner die nötige Kraft. Sicher arbeiten: fester Stand, Handschuhe, nicht in Zugrichtung stehen – das Rohr kann abrutschen.</p>` },
  p2: { lf: 'LF 3', title: 'Reihenschaltung von Spannungsquellen', html: `<p>In Reihe addieren sich die Spannungen: U<sub>ges</sub> = U<sub>1</sub> + U<sub>2</sub> + … → 8 · 1,5 V = <b>12 V</b></p><p>Eine verpolte Zelle zieht 2 · 1,5 V ab (+1,5 V fehlen, −1,5 V kommen dazu).</p><p class="rule">Die Kapazität (mAh) bleibt bei Reihenschaltung gleich wie die einer Zelle. Bei Parallelschaltung addieren sich die Kapazitäten.</p>` },
  p3: { lf: 'LF 4', title: 'Hydraulik: Druck, Kraft, Fläche', html: `<p>Kolbenfläche: A = π · d² / 4 = π · (5 cm)² / 4 = <b>19,6 cm²</b></p><p>Druck: p = F / A = 9800 N / 19,6 cm² = 500 N/cm² = <b>50 bar</b> (1 bar = 10 N/cm²)</p><p class="rule">Das Druckbegrenzungsventil schützt die Anlage vor zu hohem Druck. Vor Arbeiten an Hydraulikleitungen: Anlage drucklos machen!</p>` },
  p4: { lf: 'LF 3 · LF 1', title: 'Photovoltaik verschalten', html: `<p>Reihe: Spannungen addieren sich. Parallel: Ströme addieren sich.</p><p><b>2S2P</b>: V<sub>oc</sub> = 2 · 22 V = 44 V (< 75 V ✓), V<sub>mp</sub> = 36 V (> 24 V + 5 V ✓), I = 2 · 5,56 A = 11,1 A (< 15 A ✓)</p><p>Leistung: P = 36 V · 11,1 A ≈ <b>400 W</b> (= 4 · 100 W)</p><p class="rule">Open circuit voltage = Leerlaufspannung (ohne Last, größte Spannung des Moduls).</p>` },
  p5: { lf: 'LF 3', title: 'Leitungsschutz dimensionieren', html: `<p>Betriebsstrom: I<sub>B</sub> = P / U = 1000 W / 24 V = <b>41,7 A</b></p><p>Sicherung: nächstgrößerer Nennstrom → <b>50 A</b>. Leitung: I<sub>z</sub> ≥ I<sub>n</sub> → <b>10 mm²</b> (57 A)</p><p class="rule">I<sub>B</sub> ≤ I<sub>n</sub> ≤ I<sub>z</sub>. Die Sicherung sitzt so nah wie möglich am Pluspol – sonst ist die Leitung bei Kurzschluss ungeschützt. Akkus können enorme Kurzschlussströme liefern!</p>` },
  p6: { lf: 'LF 3', title: 'Brückengleichrichter (B2)', html: `<p>Vier Dioden machen aus Wechselspannung eine pulsierende Gleichspannung. In jeder Halbwelle leiten zwei Dioden „über Kreuz“.</p><p>Diodensymbol: Strom fließt in Pfeilrichtung (Anode → Kathode).</p><p class="rule">Ein Ladekondensator parallel zum Ausgang glättet die Spannung. Falsch eingesetzte Dioden erzeugen einen Kurzschluss oder nur eine Einweggleichrichtung.</p>` },
  p7: { lf: 'LF 3', title: 'Messen mit dem Multimeter', html: `<p>Widerstand nur an <b>spannungsfreien</b> Bauteilen messen (Messbereich Ω).</p><p>Wicklung A1–A2: 0,18 Ω → in Ordnung (Kupferwicklung, sehr niederohmig).</p><p>A1–Gehäuse: muss „OL“ (sehr hochohmig) zeigen. 2,1 kΩ bedeutet Isolationsfehler durch Salzwasser.</p><p class="rule">Im Betrieb prüft man den Isolationswiderstand mit einem Isolationsmessgerät (z. B. 500 V DC). Das Multimeter gibt nur einen ersten Hinweis.</p>` },
  p8: { lf: 'LF 2', title: 'Werkstoffe und Verbindungen', html: `<p><b>A4-70</b>: nichtrostender Stahl, säure- und seewasserbeständig (A4 mit Molybdän), Zugfestigkeit 700 N/mm².</p><p>Alu + Edelstahl + Salzwasser → <b>Kontaktkorrosion</b>: das unedlere Aluminium löst sich auf. Abhilfe: Kunststoffscheiben/-hülsen zur Trennung.</p><p>Kraftschluss (Reibung: Schraube, Klemme) · Formschluss (Form: Passfeder, Splint) · Stoffschluss (Material: Kleben, Schweißen)</p><p class="rule">Gegen Losdrehen durch Vibration: selbstsichernde Mutter (z. B. mit Polyamidring) oder Schraubensicherungskleber.</p>` },
  p9: { lf: 'LF 2', title: 'Übersetzung und Drehmoment', html: `<p>Übersetzung: i = n<sub>1</sub> / n<sub>2</sub> = 3000 / 1000 = <b>3</b> = z<sub>2</sub> / z<sub>1</sub> → z<sub>2</sub> = 3 · 20 = <b>60</b></p><p>Drehmoment (verlustfrei): M<sub>2</sub> = M<sub>1</sub> · i = 3,2 N·m · 3 = <b>9,6 N·m</b></p><p class="rule">Übersetzung ins Langsame: Drehzahl sinkt, Drehmoment steigt. Die Leistung bleibt (ohne Verluste) gleich.</p><p>Ø25 <b>H7</b>: Großbuchstabe = Bohrung, H = unteres Abmaß 0 (Einheitsbohrung), 7 = Toleranzgrad IT7.</p>` },
  p10: { lf: 'LF 4', title: 'Wendeschaltung mit Verriegelung', html: `<p>Strompfad K1 (vorwärts): S0 (Öffner) – S1 (Schließer) – K2 (Öffner)<br>Strompfad K2 (rückwärts): S0 (Öffner) – S2 (Schließer) – K1 (Öffner)</p><p class="rule">Die gegenseitige Verriegelung über Öffner verhindert, dass beide Relais gleichzeitig anziehen – sonst Kurzschluss im Polwender. Der Not-Halt (Reißleine) ist ein Öffner: Drahtbruch = Stillstand.</p><p>Schutzart <b>IP67</b>: 6 = staubdicht, 7 = Schutz bei zeitweiligem Untertauchen.</p>` },
  p11: { lf: 'LF 1', title: 'Energiefluss und Energiebilanz', html: `<p>Energiefluss: Solarmodule → Laderegler → Akku → Sicherung → Steuerung → Motor → Getriebe → Propeller</p><p>Energie im Akku: W = U · Q = 24 V · 100 Ah = <b>2400 Wh</b></p><p>Fahrzeit bei 300 W Netto-Entnahme: t = 2400 Wh / 300 W = <b>8 h</b> → Reichweite s = v · t = 7 km/h · 8 h = <b>56 km</b></p><p class="rule">Blockschaltbilder zeigen Energie-, Stoff- und Signalfluss eines Systems.</p>` },
  p12: { lf: 'LF 5', title: 'Zahlensysteme und Funkübertragung', html: `<p>178 = 128 + 32 + 16 + 2 → dual <b>1011 0010</b> → hexadezimal <b>B2</b> (1011 = B, 0010 = 2)</p><p class="rule">UKW-Funk breitet sich quasi-optisch aus (Sichtverbindung). Reichweite nur einige Kilometer – deshalb muss das Boot nahe an die Schifffahrtsroute.</p>` },
};

// Henrik über Funk: gestufte Tipps
export const HINTS = {
  p1: ['Ein langer Hebel spart Kraft. Wie hängen Kraft, Hebelarm und Drehmoment zusammen?', 'M = F · l. Stell die Formel nach l um.', 'l = M / F = 180 N·m / 300 N = 0,6 m. Greif das Rohr mindestens 0,6 m vom Drehpunkt entfernt.'],
  p2: ['Das Funkgerät braucht 12 Volt. Jede Zelle hat 1,5 Volt.', 'Alle Zellen müssen gleich herum liegen: Plus an Minus. Eine verkehrte Zelle zieht Spannung ab.', '8 Zellen in Reihe, alle mit Plus in dieselbe Richtung. Kapazität bleibt bei Reihe gleich.'],
  p3: ['Schau aufs Typenschild am Zylinder: Kolbendurchmesser und Losbrechkraft.', 'Fläche A = π · d² / 4 in cm². Druck p = F / A. 10 N/cm² sind 1 bar.', 'A ≈ 19,6 cm², p = 9800 N / 19,6 cm² = 500 N/cm² = 50 bar. Pumpe bis mindestens 50 bar.'],
  p4: ['Lies das Datenblatt des Reglers: maximale Leerlaufspannung und maximaler Strom.', 'In Reihe steigt die Spannung, parallel der Strom. 4 Module in Reihe sind zu viel Spannung, 4 parallel zu viel Strom.', 'Je zwei Module in Reihe, die beiden Stränge parallel: 2S2P. Das gibt 44 V Leerlauf und 11,1 A.'],
  p5: ['Erst den Strom ausrechnen: Leistung durch Spannung.', 'Sicherung: nächster Wert über dem Betriebsstrom. Leitung: muss mehr aushalten als die Sicherung.', '41,7 A → Sicherung 50 A → Leitung 10 mm² (57 A). Sicherung direkt an den Pluspol.'],
  p6: ['Strom fließt durch eine Diode nur in Pfeilrichtung. Oben soll Plus herauskommen.', 'Die beiden oberen Dioden zeigen nach oben zum Pluspol, die beiden unteren kommen vom Minuspol.', 'Links oben und rechts oben: Pfeil nach oben. Links unten und rechts unten: Pfeil ebenfalls nach oben (vom Minus weg zu den Wechselstrom-Anschlüssen).'],
  p7: ['Widerstand misst man nur ohne Spannung. Welcher Messbereich passt?', 'Zwischen Wicklung und Gehäuse darf eigentlich kein Strom fließen können – der Widerstand muss riesig sein.', 'A1–Gehäuse 2,1 kΩ ist ein Isolationsfehler. Spülen, trocknen, nochmal messen.'],
  p8: ['Salzwasser frisst normalen Stahl. Welche Schraube rostet nicht?', 'A4 ist der seewasserfeste Edelstahl. Alu und Edelstahl direkt verbunden – Stichwort Kontaktkorrosion.', 'Kraftschluss = Reibung, Formschluss = Form greift ineinander, Stoffschluss = Material verbunden.'],
  p9: ['i = n1 / n2. Der Motor dreht schneller als der Propeller drehen soll.', 'Bei Riemen gilt auch i = z2 / z1. Das große Rad sitzt am Propeller.', 'i = 3, z2 = 60, Drehmoment mal 3 = 9,6 N·m. H7: H ist die Bohrung mit unterem Abmaß null.'],
  p10: ['Vorwärts: Reißleine gesteckt UND Vorwärtsschalter UND Rückwärts nicht aktiv.', 'Die Reißleine ist ein Öffner. Für die Verriegelung brauchst du jeweils den Öffner des anderen Relais.', 'K1: S0 – S1 – K2-Öffner. K2: S0 – S2 – K1-Öffner. Schutzart für den Kasten: IP67.'],
  p11: ['Folge der Energie: Woher kommt sie, wo wird sie gespeichert, wo wird sie zu Bewegung?', 'Energie im Akku: Spannung mal Kapazität in Wh. Zeit = Energie / Leistung.', '2400 Wh / 300 W = 8 h. 7 km/h · 8 h = 56 km. Ablegen am Morgen.'],
  p12: ['Schalter 1 ist das höchste Bit mit dem Wert 128.', 'Zerlege 178 in Zweierpotenzen: 128 + 32 + 16 + 2.', 'Dual 1011 0010 – vier Bits ergeben eine Hex-Ziffer: 1011 = B, 0010 = 2 → B2.'],
};
