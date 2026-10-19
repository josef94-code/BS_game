'use strict';
// ------------------------------------------------------------
//  Rätsel (Lernfeldbezug Mechatroniker/-in, 1. Ausbildungsjahr)
// ------------------------------------------------------------
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function fb(p, msg, good) {
  const el = p.querySelector('.fb');
  el.innerHTML = msg; el.className = 'fb ' + (good ? 'good' : 'bad');
  Snd.play(good ? 'ok' : 'err');
}
const num = s => parseFloat(String(s).replace(',', '.').replace(/[^\d.\-]/g, ''));

const PUZZLES = {
  // ---------------------------------------------------------------
  // 1) Die 5 Sicherheitsregeln (Irmgard)
  // ---------------------------------------------------------------
  sicherheit() {
    const rules = ['Freischalten', 'Gegen Wiedereinschalten sichern', 'Spannungsfreiheit feststellen', 'Erden und kurzschließen', 'Benachbarte, unter Spannung stehende Teile abdecken oder abschranken'];
    const fake = ['Kurz mit dem Finger prüfen, ob’s kribbelt', 'Defekte Sicherung mit Draht überbrücken'];
    const cards = shuffle(rules.concat(fake));
    let seq = [], fails = 0;
    const p = Game.modal(`<h2>Die 5 Sicherheitsregeln</h2>
      <p class="who">Irmgard: „Na los. In der richtigen Reihenfolge. Und erzähl mir keinen Schmarrn.“</p>
      <p class="note">Klicke die Regeln in der richtigen Reihenfolge an.</p>
      <div class="cards">${cards.map((c, i) => `<button class="card" data-i="${i}">${c}</button>`).join('')}</div>
      <ol class="seq"></ol>
      <div class="fb"></div>
      <div class="row"><button class="btn reset">Zurücksetzen</button><button class="btn go">Fertig</button></div>`);
    const render = () => {
      p.querySelector('.seq').innerHTML = seq.map(i => `<li>${cards[i]}</li>`).join('');
      p.querySelectorAll('.card').forEach(b => b.disabled = seq.includes(+b.dataset.i));
    };
    p.querySelectorAll('.card').forEach(b => b.onclick = () => { Snd.play('select'); seq.push(+b.dataset.i); render(); });
    p.querySelector('.reset').onclick = () => { seq = []; render(); };
    p.querySelector('.go').onclick = () => {
      const chosen = seq.map(i => cards[i]);
      if (chosen.some(c => fake.includes(c))) { Game.mistake(); fails++; fb(p, 'Irmgard: „' + (chosen.find(c => fake.includes(c)).startsWith('Kurz') ? 'Mit dem FINGER?! Willst du mich veräppeln?' : 'Draht überbrücken?! So brennen Hallen ab!') + ' Nochmal von vorn.“'); seq = []; render(); return; }
      if (chosen.length < 5) { fb(p, 'Irmgard: „Fünf. Hab ich gesagt. Fünf.“'); return; }
      const ok = chosen.every((c, i) => c === rules[i]);
      if (!ok) {
        Game.mistake(); fails++;
        let firstWrong = chosen.findIndex((c, i) => c !== rules[i]);
        fb(p, 'Irmgard: „Falsche Reihenfolge.' + (fails >= 2 ? ` Bis Regel ${firstWrong} stimmt’s, ab Regel ${firstWrong + 1} nicht mehr.` : '') + ' Denk nach: Was muss passieren, BEVOR du prüfen kannst?“');
        seq = []; render(); return;
      }
      Game.closeModal(true);
      Game.set('gotKey'); Game.lernen('sicherheit');
      Game.say([['Irmgard', '…'], ['Irmgard', 'Fehlerfrei. Der Brandl hat recht gehabt mit dir.'], ['Irmgard', 'Da. Der Schaltraumschlüssel. Und wenn du LS-Schalter oder sonst was brauchst – nimm dir aus den Regeln. Ich schreib’s auf den Brandl.'], ['Irmgard', 'Und nimm den Bolzenschneider mit. Der Kowalski hat das Kellergitter mit seinem eigenen Schloss zugesperrt. Seit wann sperrt ein Hausmeister vor uns zu?']], () => { Game.give('schluessel'); Game.give('bolzenschneider', true); Game.toast('Erhalten: Bolzenschneider'); });
    };
  },

  // ---------------------------------------------------------------
  // 2) Leitungsschutzschalter auswählen (LF3)
  // ---------------------------------------------------------------
  sicherung() {
    const p = Game.modal(`<h2>Unterverteilung Halle 3 – Stromkreis F3</h2>
      <table class="tb"><tr><th>Stromkreis</th><th>Verbraucher</th><th>Leitung</th><th>LS</th></tr>
      <tr><td>F1</td><td>Steckdosen Werkstatt</td><td>NYM-J 3×2,5 mm²</td><td>B16</td></tr>
      <tr><td>F2</td><td>Kompressor</td><td>NYM-J 5×2,5 mm²</td><td>C16</td></tr>
      <tr class="hl"><td>F3</td><td>Hallenbeleuchtung: <b>12 Leuchten à 250 W</b>, parallel, 230 V</td><td>NYM-J 3×2,5 mm²<br><small>zulässig I<sub>z</sub> = 20 A</small></td><td><b>???</b></td></tr>
      <tr><td>F4</td><td>Umkleide</td><td>NYM-J 3×1,5 mm²</td><td>B10</td></tr></table>
      <div class="step"><label>1. Betriebsstrom von F3 berechnen: &nbsp; I = <input class="inp" id="iI" size="6"> A</label> <small>(auf eine Nachkommastelle)</small></div>
      <div class="step"><p>2. Passenden LS aus dem Sortiment einsetzen:</p>
        <div class="choices">${['B6', 'B10', 'B16', 'B32'].map(x => `<button class="btn ch" data-v="${x}">${x}</button>`).join('')}</div></div>
      <div class="fb"></div>`);
    p.querySelectorAll('.ch').forEach(b => b.onclick = () => {
      const I = num(p.querySelector('#iI').value);
      if (!(I >= 12.9 && I <= 13.1)) {
        Game.mistake();
        fb(p, isNaN(I) ? 'Erst rechnen, dann einbauen! Trag den Betriebsstrom ein.' : `I = ${I} A? Das stimmt nicht. Tipp: P<sub>ges</sub> = 12 · 250 W, dann I = P / U.`);
        return;
      }
      const v = b.dataset.v;
      if (v === 'B6' || v === 'B10') { Game.mistake(); Snd.play('breaker'); fb(p, `Du setzt den ${v} ein … KLACK – beim Einschalten der Lampen löst er sofort aus. ${v.slice(1)} A &lt; 13 A: zu klein!`); return; }
      if (v === 'B32') { Game.mistake(); fb(p, 'Halt! Ein B32 würde bei 32 A erst auslösen – die 2,5-mm²-Leitung verträgt aber nur 20 A. Bei Überlast würde die Leitung heiß werden: Brandgefahr. Der LS muss die <b>Leitung</b> schützen!'); return; }
      Game.closeModal(true);
      Game.take('ls'); Game.lernen('ls');
      Snd.play('clank');
      Game.say(['I = 3000 W / 230 V ≈ 13,0 A. Der B16 liegt darüber und schützt die 2,5-mm²-Leitung (I<sub>z</sub> = 20 A).', 'Du rastest den B16 auf die Hutschiene, klemmst die Leitung an und ziehst die Klemme nach. Abdeckung drauf.', 'Jetzt: Schloss ab, Hauptschalter ein.'], () => Game.fix('licht'));
    });
  },

  // ---------------------------------------------------------------
  // 3) Kernloch bohren (LF2)
  // ---------------------------------------------------------------
  bohren() {
    const p = Game.modal(`<h2>Säulenbohrmaschine – Kernloch für M10</h2>
      <div class="step s1"><p><b>1. Vorbereitung – was machst du?</b></p>
        <label class="cb"><input type="checkbox" id="brille"> Schutzbrille aufsetzen</label>
        <label class="cb"><input type="checkbox" id="hand"> Arbeitshandschuhe anziehen</label>
        <label class="cb"><input type="checkbox" id="spann"> Platte im Maschinenschraubstock spannen</label>
        <label class="cb"><input type="checkbox" id="halt"> Platte zur Sicherheit mit der Hand festhalten</label></div>
      <div class="step"><p><b>2. Bohrer wählen</b> (Platte bekommt ein Gewinde M10, Steigung P = 1,5 mm)</p>
        <select id="bohrer"><option value="">– Bohrer –</option>${['8,0', '8,5', '9,0', '10,0', '10,5'].map(x => `<option>${x} mm</option>`).join('')}</select></div>
      <div class="step"><p><b>3. Drehzahl einstellen</b> (Werkstoff S235, HSS-Bohrer)</p>
        <select id="n"><option value="">– Drehzahl –</option>${[280, 450, 710, 900, 1400, 2240].map(x => `<option value="${x}">${x} 1/min</option>`).join('')}</select></div>
      <div class="fb"></div>
      <div class="row"><button class="btn go">Bohren!</button></div>`);
    p.querySelector('.go').onclick = () => {
      const q = id => p.querySelector('#' + id);
      if (q('hand').checked) {
        Game.mistake(); Game.closeModal(true);
        if (!Game.hurt(30, 'Der Handschuh wurde von der rotierenden Spindel erfasst. An Bohrmaschinen niemals Handschuhe tragen!'))
          Game.say(['Der Bohrer erfasst den Handschuh – ein Ruck reißt deine Hand mit!', 'Du kannst gerade noch den Not-Aus schlagen. Deine Hand pocht.', 'An Bohrmaschinen: KEINE Handschuhe! Einzugsgefahr.']);
        return;
      }
      if (q('halt').checked) { Game.mistake(); fb(p, 'Mit der Hand festhalten?! Wenn der Bohrer hakt, reißt es dir die Platte aus der Hand und sie dreht sich mit – wie ein Messer. Werkstück immer spannen!'); return; }
      if (!q('spann').checked) { Game.mistake(); fb(p, 'Das Werkstück liegt lose auf dem Tisch. Werkstück immer im Maschinenschraubstock spannen!'); return; }
      if (!q('brille').checked) { Game.mistake(); fb(p, 'Ohne Schutzbrille? Heiße Späne fliegen dir ins Auge. Erst Schutzbrille auf!'); return; }
      const d = q('bohrer').value;
      if (!d) { fb(p, 'Welchen Bohrer nimmst du?'); return; }
      if (d !== '8,5 mm') {
        Game.mistake();
        const dv = num(d);
        fb(p, dv < 8.5 ? `Mit ${d} wird das Kernloch zu klein – der Gewindebohrer würde klemmen und abbrechen.` : `Mit ${d} wird das Loch zu groß – das Gewinde hätte kaum Flanken und würde wieder ausreißen.` + ' Tipp: Kernloch-Ø ≈ Nenndurchmesser − Steigung.');
        return;
      }
      const n = +q('n').value;
      if (!n) { fb(p, 'Welche Drehzahl stellst du ein?'); return; }
      if (n !== 900) {
        Game.mistake();
        fb(p, (n > 900 ? `Bei ${n} 1/min läuft der Bohrer blau an – viel zu schnell für Stahl.` : `Bei ${n} 1/min schabt der Bohrer mehr, als er schneidet. Zu langsam.`) + ' Tipp: n = v<sub>c</sub> · 1000 / (π · d), dann die nächstliegende Stufe.');
        return;
      }
      Game.closeModal(true);
      Game.take('platte'); Game.give('platte_gebohrt', true); Game.lernen('bohren');
      Snd.play('machine');
      Game.say(['n = 25 · 1000 / (π · 8,5) ≈ 936 1/min → Stufe 900.', 'Mit etwas Kühlschmierstoff frisst sich der 8,5er-Bohrer sauber durch den Stahl. Späne kringeln sich blau-silbern.', 'Kernloch fertig. Jetzt das Gewinde: Gewindebohrer ins Windeisen und am Schraubstock schneiden.'], () => { Snd.play('pickup'); Game.toast('Erhalten: ' + ITEMS.platte_gebohrt.name); });
    };
  },

  // ---------------------------------------------------------------
  // 4) Gewinde schneiden (LF2)
  // ---------------------------------------------------------------
  gewinde() {
    const taps = shuffle([{ id: 1, t: 'Gewindebohrer mit 1 Ring' }, { id: 2, t: 'Gewindebohrer mit 2 Ringen' }, { id: 3, t: 'Gewindebohrer mit 3 Ringen' }]);
    let seq = [];
    const p = Game.modal(`<h2>Innengewinde M10 schneiden</h2>
      <p>Die Platte ist im Schraubstock gespannt. Der Handgewindebohrer-Satz ist dreiteilig.</p>
      <div class="step"><p><b>1. In welcher Reihenfolge setzt du die Gewindebohrer ein?</b></p>
        <div class="cards">${taps.map(x => `<button class="card" data-i="${x.id}">${x.t}</button>`).join('')}</div><ol class="seq"></ol>
        <button class="btn small reset">Zurücksetzen</button></div>
      <div class="step"><p><b>2. Wie schneidest du?</b></p>
        <label class="cb"><input type="radio" name="tech" value="a"> Zügig in einem Rutsch durchdrehen, dann geht’s schneller</label>
        <label class="cb"><input type="radio" name="tech" value="b"> Gerade ansetzen, Schneidöl, nach ca. einer Umdrehung eine halbe zurück (Span brechen)</label>
        <label class="cb"><input type="radio" name="tech" value="c"> Wenn’s klemmt, mit dem Hammer auf das Windeisen klopfen</label></div>
      <div class="fb"></div><div class="row"><button class="btn go">Gewinde schneiden</button></div>`);
    const render = () => { p.querySelector('.seq').innerHTML = seq.map(i => `<li>${taps.find(x => x.id === i).t}</li>`).join(''); p.querySelectorAll('.card').forEach(b => b.disabled = seq.includes(+b.dataset.i)); };
    p.querySelectorAll('.card').forEach(b => b.onclick = () => { Snd.play('select'); seq.push(+b.dataset.i); render(); });
    p.querySelector('.reset').onclick = () => { seq = []; render(); };
    p.querySelector('.go').onclick = () => {
      if (seq.length < 3) { fb(p, 'Wähle die Reihenfolge aller drei Gewindebohrer.'); return; }
      if (seq.join('') !== '123') { Game.mistake(); fb(p, 'Der Gewindebohrer mit den meisten Ringen ist der Fertigschneider – mit dem fängt man nicht an, er würde überlastet und kann abbrechen. Erst Vorschneider (1 Ring), dann Mittelschneider (2), dann Fertigschneider (3).'); seq = []; render(); return; }
      const t = (p.querySelector('input[name=tech]:checked') || {}).value;
      if (!t) { fb(p, 'Wie gehst du beim Schneiden vor?'); return; }
      if (t === 'a') { Game.mistake(); fb(p, 'Knacks! Die Späne verstopfen die Nuten, der Gewindebohrer klemmt … zum Glück ist er nicht abgebrochen. Nochmal – diesmal mit Spanbrechen.'); return; }
      if (t === 'c') { Game.mistake(); fb(p, 'Hammer auf einen gehärteten Gewindebohrer? Der bricht wie Glas – und steckt dann für immer in der Platte. Lass das.'); return; }
      Game.closeModal(true);
      Game.take('platte_gebohrt'); Game.take('gewindeschneider'); Game.give('platte_fertig', true); Game.lernen('gewinde');
      Snd.play('ok');
      Game.say(['Vorschneider, Mittelschneider, Fertigschneider. Ein Tropfen Schneidöl, eine Umdrehung vor, eine halbe zurück.', 'Zum Schluss prüfst du mit einer M10-Schraube: Sie läuft satt und ohne Wackeln ins Gewinde.', 'Die Halteplatte ist fertig. Ab damit zum Bandantrieb in der Halle!'], () => { Snd.play('pickup'); Game.toast('Erhalten: ' + ITEMS.platte_fertig.name); });
    };
  },

  // ---------------------------------------------------------------
  // 5) Getriebeübersetzung (LF1)
  // ---------------------------------------------------------------
  getriebe() {
    const p = Game.modal(`<h2>Bandgetriebe – Ersatzrad auswählen</h2>
      <svg viewBox="0 0 300 120" class="fig">
        <circle cx="80" cy="60" r="22" class="gear"/><text x="80" y="64">z₁=18</text>
        <circle cx="170" cy="60" r="56" class="gear dash"/><text x="170" y="64">z₂ = ?</text>
        <text x="80" y="104" class="small">Motor: n₁ = 1400 1/min</text>
        <text x="230" y="16" class="small">Bandwelle: n₂ = 350 1/min</text>
      </svg>
      <div class="step"><label>Übersetzung i = <input class="inp" id="i" size="5"></label></div>
      <div class="step"><p>Welches Rad baust du ein?</p><div class="choices">${[36, 54, 72, 90].map(z => `<button class="btn ch" data-z="${z}">z = ${z}</button>`).join('')}</div></div>
      <div class="fb"></div>`);
    p.querySelectorAll('.ch').forEach(b => b.onclick = () => {
      const i = num(p.querySelector('#i').value);
      if (i !== 4) { Game.mistake(); fb(p, isNaN(i) ? 'Erst die Übersetzung ausrechnen: i = n₁ / n₂.' : `i = ${i}? Rechne nochmal: i = n₁ / n₂.`); return; }
      const z = +b.dataset.z;
      const n2 = Math.round(1400 * 18 / z);
      if (z !== 72) { Game.mistake(); fb(p, `Mit z₂ = ${z} wäre n₂ = 1400 · 18 / ${z} ≈ ${n2} 1/min. ${n2 > 350 ? 'Zu schnell – die Gehäuse fliegen vom Band!' : 'Zu langsam – so schaffst du die 2000 Stück nie bis Montag.'}`); return; }
      Game.closeModal(true);
      Game.take('zahnraeder'); Game.lernen('getriebe');
      Snd.play('clank');
      Game.say(['i = 1400 / 350 = 4  →  z₂ = i · z₁ = 4 · 18 = 72.', 'Du setzt das Rad mit 72 Zähnen auf die Welle, sicherst es mit der Passfeder und stellst das Flankenspiel ein. Ein Klecks Fett drauf.'], () => Game.fix('getriebe'));
    });
  },

  // ---------------------------------------------------------------
  // 6) Pneumatik-Presse (LF4)
  // ---------------------------------------------------------------
  pneumatik() {
    const ports = ['1', '2', '3', '4', '5'];
    const sel = (id, label) => `<label class="pl">${label}<select id="${id}"><option value="">–</option>${ports.map(x => `<option>${x}</option>`).join('')}</select></label>`;
    const p = Game.modal(`<h2>Pneumatik-Presse – Verschlauchung</h2>
      <div class="cols"><svg viewBox="0 0 260 220" class="fig pneu">
        <rect x="60" y="10" width="140" height="34" class="body"/><rect x="100" y="12" width="6" height="30" class="piston"/><rect x="106" y="24" width="94" height="6" class="piston"/>
        <text x="130" y="8" class="small">Zylinder (doppeltwirkend) · Stempel nach rechts = AB</text>
        <line x1="70" y1="44" x2="70" y2="70" class="pipe"/><text x="56" y="62" class="lbl">A</text>
        <line x1="190" y1="44" x2="190" y2="70" class="pipe"/><text x="200" y="62" class="lbl">B</text>
        <rect x="60" y="100" width="70" height="50" class="valve"/><rect x="130" y="100" width="70" height="50" class="valve"/>
        <path d="M200 112 l10 6 l-10 6 l10 6 l-10 6" class="spring"/>
        <text x="165" y="96" class="small">5/2-Wegeventil (Federrückstellung)</text>
        <text x="148" y="117" class="port">4</text><text x="182" y="117" class="port">2</text>
        <text x="142" y="146" class="port">5</text><text x="165" y="146" class="port">1</text><text x="188" y="146" class="port">3</text>
        <line x1="148" y1="106" x2="144" y2="138" class="flow"/><line x1="166" y1="138" x2="181" y2="106" class="flow"/><text x="95" y="130" class="small">betätigt</text>
        <text x="130" y="168" class="small">Grundstellung (rechtes Feld): 1→2 · 4→5</text>
        <rect x="20" y="182" width="60" height="26" class="body"/><text x="50" y="199" class="small">Wartungseinheit</text>
        <text x="50" y="216" class="small lbl">P</text>
        <text x="200" y="198" class="small">Schalldämpfer S1, S2</text>
      </svg>
      <div class="side">
        <p><b>1. Schläuche an welchen Ventil-Anschluss?</b></p>
        ${sel('pP', 'P – Druckluft von der Wartungseinheit')}
        ${sel('pA', 'A – Kolbenseite (Stempel fährt AB)')}
        ${sel('pB', 'B – Kolbenstangenseite (Stempel fährt AUF)')}
        ${sel('pS1', 'Schalldämpfer S1')}
        ${sel('pS2', 'Schalldämpfer S2')}
        <p class="note">Typenschild: „In Ruhestellung muss der Stempel OBEN (eingefahren) stehen.“</p>
      </div></div>
      <div class="step"><p><b>2. Zweihand-Sicherheitssteuerung:</b> Die zwei Taster links und rechts sollen das Ventil nur schalten, wenn <u>beide</u> gedrückt sind. Welches Ventil kommt dazwischen?</p>
        <label class="cb"><input type="radio" name="zh" value="w"> Wechselventil</label>
        <label class="cb"><input type="radio" name="zh" value="z"> Zweidruckventil</label>
        <label class="cb"><input type="radio" name="zh" value="d"> Drosselrückschlagventil</label></div>
      <div class="step"><p><b>3. Druckregler einstellen</b> (Typenschild Presse: Betriebsdruck p = 6 bar)</p>
        <input type="range" id="bar" min="0" max="10" step="0.5" value="2"> <b><span id="barv">2,0</span> bar</b></div>
      <div class="fb"></div><div class="row"><button class="btn go">Druckluft aufschalten</button></div>`, { cls: 'wide' });
    const bar = p.querySelector('#bar');
    bar.oninput = () => p.querySelector('#barv').textContent = (+bar.value).toFixed(1).replace('.', ',');
    p.querySelector('.go').onclick = () => {
      const v = id => p.querySelector('#' + id).value;
      const P = v('pP'), A = v('pA'), B = v('pB'), S1 = v('pS1'), S2 = v('pS2');
      if (!P || !A || !B || !S1 || !S2) { fb(p, 'Erst alle Schläuche anschließen.'); return; }
      if (new Set([P, A, B, S1, S2]).size < 5) { Game.mistake(); fb(p, 'An einem Anschluss stecken zwei Schläuche. Jeder Anschluss bekommt genau einen.'); return; }
      if (P === '3' || P === '5') {
        Game.mistake(); Snd.play('hiss'); Game.closeModal(true);
        if (!Game.hurt(15, 'Ein abgesprungener Druckluftschlauch hat dich getroffen.')) Game.say(['FFFSSSSST! Die Druckluft schießt aus dem Entlüftungsanschluss, der Schlauch springt ab und peitscht dir gegen den Unterarm.', '3 und 5 sind Entlüftungen – die Versorgung gehört an Anschluss 1.']);
        return;
      }
      if (P !== '1') { Game.mistake(); Snd.play('hiss'); fb(p, `Anschluss ${P} ist ein Arbeitsanschluss. Die Druckluftversorgung gehört an <b>1</b>.`); return; }
      if (A === '2' && B === '4') {
        Game.mistake(); Snd.play('whoosh'); Game.closeModal(true);
        if (!Game.hurt(15, 'Der Stempel ist in Ruhestellung heruntergefahren.')) Game.say(['Kaum ist Luft drauf, kracht der Stempel herunter – ohne dass jemand einen Taster gedrückt hat! Du ziehst die Hand gerade noch weg und schrammst dir den Arm auf.', 'In Grundstellung ist 1 mit 2 verbunden. Also muss an 2 die Seite, die den Stempel OBEN hält: die Kolbenstangenseite.']);
        return;
      }
      if (!((A === '4' && B === '2') && new Set([S1, S2]).has('3') && new Set([S1, S2]).has('5'))) { Game.mistake(); fb(p, 'So stimmt die Verschlauchung nicht. Arbeitsanschlüsse sind 2 und 4, Entlüftungen 3 und 5.'); return; }
      const zh = (p.querySelector('input[name=zh]:checked') || {}).value;
      if (!zh) { fb(p, 'Welches Ventil für die Zweihandsteuerung?'); return; }
      if (zh === 'w') { Game.mistake(); fb(p, 'Ein Wechselventil ist ein ODER: Dann reicht EIN Taster – und die andere Hand ist vielleicht gerade unter dem Stempel. Zweihand heißt UND!'); return; }
      if (zh === 'd') { Game.mistake(); fb(p, 'Ein Drosselrückschlagventil regelt die Geschwindigkeit, aber es verknüpft keine Signale.'); return; }
      const b = +bar.value;
      if (b < 5.5) { Game.mistake(); fb(p, `Mit ${b.toString().replace('.', ',')} bar drückt der Stempel zu schwach – die Gehäuse werden nicht sauber geprägt.`); return; }
      if (b > 6.5) { Game.mistake(); Snd.play('hiss'); fb(p, `Bei ${b.toString().replace('.', ',')} bar zischt das Sicherheitsventil. Über dem zulässigen Betriebsdruck!`); return; }
      Game.closeModal(true);
      Game.take('schlauch'); Game.lernen('pneumatik');
      Snd.play('hiss');
      Game.say(['Du schaltest die Druckluft auf. Kurzes Zischen – dann ist alles dicht.', 'Linker Taster: nichts. Rechter Taster: nichts. Beide zusammen: WUMMS. Der Stempel fährt herunter und federt sauber zurück.', 'Zweidruckventil = UND. So bleiben beide Hände außerhalb der Gefahrenzone.'], () => Game.fix('presse'));
    };
  },

  // ---------------------------------------------------------------
  // 7) LED-Vorwiderstand (LF3)
  // ---------------------------------------------------------------
  widerstand() {
    const C = { schwarz: '#000', braun: '#6b3b1a', rot: '#c22', orange: '#e67a00', gelb: '#e6d200', violett: '#839', gold: '#c9a227' };
    const opts = shuffle([
      { id: 'a', b: ['braun', 'braun', 'braun'], r: 110 },
      { id: 'b', b: ['braun', 'braun', 'rot'], r: 1100 },
      { id: 'c', b: ['braun', 'braun', 'orange'], r: 11000 },
      { id: 'd', b: ['braun', 'schwarz', 'rot'], r: 1000 },
      { id: 'e', b: ['gelb', 'violett', 'braun'], r: 470 },
    ]);
    const res = o => `<svg viewBox="0 0 120 30" class="res"><line x1="0" y1="15" x2="120" y2="15" stroke="#aaa" stroke-width="2"/><rect x="30" y="6" width="60" height="18" rx="7" fill="#d8c49a"/>
      ${o.b.map((c, i) => `<rect x="${38 + i * 9}" y="6" width="5" height="18" fill="${C[c]}"/>`).join('')}<rect x="78" y="6" width="5" height="18" fill="${C.gold}"/></svg>`;
    const p = Game.modal(`<h2>Meldeleuchte „BEREIT“ – Vorwiderstand</h2>
      <svg viewBox="0 0 300 90" class="fig">
        <text x="20" y="20" class="small">+24 V DC</text><line x1="20" y1="28" x2="80" y2="28" class="pipe"/>
        <rect x="80" y="20" width="50" height="16" class="body"/><text x="105" y="14" class="small">R<tspan font-size="6">V</tspan> = ?</text>
        <line x1="130" y1="28" x2="170" y2="28" class="pipe"/><polygon points="170,18 170,38 190,28" class="led"/><line x1="190" y1="18" x2="190" y2="38" class="pipe"/>
        <text x="180" y="54" class="small">LED: U<tspan font-size="6">F</tspan> = 2,0 V · I<tspan font-size="6">F</tspan> = 20 mA</text>
        <line x1="190" y1="28" x2="260" y2="28" class="pipe"/><text x="270" y="31" class="small">0 V</text>
      </svg>
      <div class="step"><label>1. Vorwiderstand berechnen: &nbsp; R<sub>V</sub> = <input class="inp" id="R" size="7"> Ω</label></div>
      <div class="step"><p>2. Welchen Widerstand aus der Schachtel lötest du ein? <small>(Farbcode-Aufkleber an der Schranktür!)</small></p>
        <div class="resgrid">${opts.map(o => `<button class="resbtn" data-id="${o.id}">${res(o)}</button>`).join('')}</div></div>
      <div class="fb"></div>`);
    p.querySelectorAll('.resbtn').forEach(btn => btn.onclick = () => {
      const R = num(p.querySelector('#R').value);
      if (!(R >= 1090 && R <= 1110)) { Game.mistake(); fb(p, isNaN(R) ? 'Erst rechnen: Welche Spannung bleibt für den Widerstand übrig?' : `R = ${R} Ω? Tipp: U<sub>R</sub> = U<sub>ges</sub> − U<sub>F</sub>, dann R = U<sub>R</sub> / I.`); return; }
      const o = opts.find(x => x.id === btn.dataset.id);
      if (o.r !== 1100) {
        Game.mistake();
        const I = Math.round(22 / o.r * 1000);
        fb(p, `Dieser Widerstand hat ${o.r >= 1000 ? (o.r / 1000).toString().replace('.', ',') + ' kΩ' : o.r + ' Ω'} (${o.b.join('-')}). Damit flössen ca. ${I} mA durch die LED – ` + (I > 20 ? 'viel zu viel, PLOPP, die LED wäre sofort durchgebrannt.' : 'zu wenig, sie würde kaum glimmen.'));
        return;
      }
      Game.closeModal(true);
      Snd.play('ok');
      Game.lernen('widerstand');
      Game.say(['U<sub>R</sub> = 24 V − 2 V = 22 V;  R = 22 V / 0,02 A = 1100 Ω = 1,1 kΩ  →  braun-braun-rot.', 'Du klemmst den 1,1-kΩ-Widerstand anstelle des verkohlten auf die Klemmleiste.', 'Wenn der Hauptschalter wieder an ist, sollte die Meldeleuchte grün leuchten.'], () => Game.fix('meldung'));
    });
  },

  // ---------------------------------------------------------------
  // 8) Messschieber ablesen (LF2) – Code fürs Büro
  // ---------------------------------------------------------------
  messschieber() {
    const px = 10, x0 = 20, val = 27.4;
    let main = '', vern = '';
    for (let mm = 0; mm <= 50; mm++) {
      const x = x0 + mm * px, h = mm % 10 === 0 ? 18 : mm % 5 === 0 ? 13 : 9;
      main += `<line x1="${x}" y1="40" x2="${x}" y2="${40 + h}" />`;
      if (mm % 10 === 0) main += `<text x="${x}" y="34">${mm}</text>`;
    }
    for (let k = 0; k <= 10; k++) {
      const x = x0 + (val + k * 0.9) * px, h = k % 5 === 0 ? 16 : 10;
      vern += `<line x1="${x}" y1="${78 - h}" x2="${x}" y2="78" />`;
      if (k % 5 === 0) vern += `<text x="${x}" y="90">${k}</text>`;
    }
    const jaw = x0 + val * px;
    const p = Game.modal(`<h2>Prüfstück mit Messschieber</h2>
      <p class="note">Am Messschieber klebt ein Zettel in Brandls Schrift: „Büro-Code = dieses Maß in Zehntelmillimetern, ohne Komma.“</p>
      <svg viewBox="0 0 540 130" class="fig caliper">
        <rect x="0" y="22" width="540" height="40" class="beam"/>
        <rect x="${jaw - 20}" y="58" width="${10 * px + 30}" height="38" class="slider"/>
        <rect x="0" y="62" width="14" height="60" class="jaw"/><rect x="${jaw - 4}" y="96" width="14" height="26" class="jaw2"/>
        <rect x="14" y="100" width="${jaw - 18}" height="16" class="work"/>
        <g class="mscale">${main}</g><g class="vscale">${vern}</g>
        <text x="500" y="16" class="small">Hauptskala in mm</text><text x="${jaw + 50}" y="126" class="small">Nonius (1/10 mm)</text>
      </svg>
      <div class="step"><label>Abgelesener Wert: <input class="inp" id="mv" size="6"> mm</label> <button class="btn small go">Prüfen</button></div>
      <div class="fb"></div>`, { cls: 'wide' });
    p.querySelector('.go').onclick = () => {
      const v = num(p.querySelector('#mv').value);
      if (Math.abs(v - 27.4) < 0.001) { Game.set('codeKnown'); Game.lernen('messschieber'); fb(p, 'Richtig: 27 mm + 4 × 0,1 mm = <b>27,4 mm</b>. Der Code fürs Meisterbüro lautet also <b>274</b>.', true); }
      else { Game.mistake(); fb(p, isNaN(v) ? 'Gib den Messwert in mm ein, z. B. 12,7.' : `${p.querySelector('#mv').value} mm stimmt nicht. Nullstrich des Nonius → ganze mm; fluchtender Noniusstrich → Zehntel.`); }
    };
  },

  // ---------------------------------------------------------------
  // 9) Zahlenschloss Meisterbüro
  // ---------------------------------------------------------------
  keypad() {
    let code = '';
    const p = Game.modal(`<h2>Meisterbüro – Zahlenschloss</h2>
      <p class="note">Auf einem Klebezettel: „Code = Ist-Maß des Prüfstücks (Werkstatt) in 1/10 mm. – B.“</p>
      <div class="keypad"><div class="disp">___</div>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(k => `<button class="key" data-k="${k}">${k}</button>`).join('')}</div>
      <div class="fb"></div>`, { cls: 'narrow' });
    const disp = p.querySelector('.disp');
    const show = () => disp.textContent = (code + '___').slice(0, 3);
    const press = k => {
      Snd.play('select');
      if (k === 'C') code = '';
      else if (k === 'OK') {
        if (code === '274') {
          Game.closeModal(true); Game.set('officeOpen'); Snd.play('ok');
          Game.say('Grünes Licht. Das Schloss schnappt auf.', () => Game.goto('buero', 0.06, 0.26, 'R'));
          return;
        }
        Game.mistake(); Snd.play('err'); fb(p, 'Rotes Licht. Falscher Code.'); code = '';
      } else if (code.length < 3) code += k;
      show();
    };
    p.querySelectorAll('.key').forEach(b => b.onclick = () => press(b.dataset.k));
    p.tabIndex = -1; p.focus();
    p.onkeydown = e => { if (/^\d$/.test(e.key)) press(e.key); if (e.key === 'Enter') press('OK'); if (e.key === 'Backspace') press('C'); };
  },

  // ---------------------------------------------------------------
  // 10) Steuerungslogik mit Selbsthaltung (LF4)
  // ---------------------------------------------------------------
  logik() {
    const opts = { g1: ['UND', 'ODER'], g2: ['DIREKT', 'NICHT'], g3: ['UND', 'ODER'] };
    const sym = { UND: '&', ODER: '≥1', NICHT: '1', DIREKT: '=' };
    const g = { g1: 'UND', g2: 'DIREKT', g3: 'ODER' };
    const inp = { S1: 0, B1: 1, S0: 0 };
    let Q = 0;
    const evalQ = (s1, k1, b1, s0) => {
      const a = g.g1 === 'UND' ? (s1 && k1) : (s1 || k1);
      const n = g.g2 === 'NICHT' ? !s0 : !!s0;
      return +(g.g3 === 'UND' ? (a && b1 && n) : (a || b1 || n));
    };
    const p = Game.modal(`<h2>Kleinsteuerung FB-01 – Freigabelogik</h2>
      <p class="note">Klicke auf die Bausteine, um ihre Funktion zu ändern. Rechts kannst du live testen. (Funktionsbeschreibung: Dokument „Rückseite Schaltplan“.)</p>
      <div class="cols"><svg viewBox="0 0 300 170" class="fig logic">
        <text x="10" y="34">S1 Start</text><line x1="55" y1="30" x2="100" y2="30"/>
        <text x="10" y="64">K1 (Q1)</text><line x1="55" y1="60" x2="100" y2="60"/>
        <path d="M278 85 L292 85 L292 160 L82 160 L82 60" class="fbk"/>
        <text x="10" y="104">B1 Tür zu</text><line x1="55" y1="100" x2="190" y2="100"/>
        <text x="10" y="134">S0 Not-Halt</text><line x1="55" y1="130" x2="100" y2="130"/>
        <g class="gate" data-g="g1"><rect x="100" y="18" width="50" height="54"/><text x="125" y="50" class="gt"></text></g>
        <g class="gate" data-g="g2"><rect x="100" y="115" width="50" height="30"/><text x="125" y="135" class="gt"></text><circle cx="153" cy="130" r="3" class="negc"/></g>
        <line x1="150" y1="45" x2="190" y2="45"/><line x1="156" y1="130" x2="170" y2="130"/><line x1="170" y1="130" x2="170" y2="118"/><line x1="170" y1="118" x2="190" y2="118"/>
        <g class="gate" data-g="g3"><rect x="190" y="35" width="50" height="95"/><text x="215" y="88" class="gt"></text></g>
        <line x1="240" y1="85" x2="262" y2="85"/><circle cx="270" cy="85" r="8" class="lamp"/><text x="270" y="70">Q1</text>
      </svg>
      <div class="side">
        <p><b>Live-Test</b></p>
        <button class="btn tgl" data-k="S1">S1 Start (Taster)</button>
        <button class="btn tgl" data-k="B1">B1 Tür</button>
        <button class="btn tgl" data-k="S0">S0 Not-Halt</button>
        <p>Band Q1: <b class="qv">AUS</b></p>
      </div></div>
      <div class="fb"></div>
      <div class="row"><button class="btn go">Programm übertragen &amp; prüfen</button></div>`, { cls: 'wide' });
    const render = () => {
      p.querySelectorAll('.gate').forEach(el => { el.querySelector('.gt').textContent = sym[g[el.dataset.g]]; const nc = el.querySelector('.negc'); if (nc) nc.style.display = g[el.dataset.g] === 'NICHT' ? '' : 'none'; });
      p.querySelector('[data-k=S1]').textContent = 'S1 Start: ' + (inp.S1 ? 'GEDRÜCKT' : 'los');
      p.querySelector('[data-k=B1]').textContent = 'B1 Tür: ' + (inp.B1 ? 'ZU' : 'OFFEN');
      p.querySelector('[data-k=S0]').textContent = 'S0 Not-Halt: ' + (inp.S0 ? 'BETÄTIGT' : 'frei');
      Q = evalQ(inp.S1, Q, inp.B1, inp.S0);
      Q = evalQ(inp.S1, Q, inp.B1, inp.S0);
      p.querySelector('.qv').textContent = Q ? 'LÄUFT' : 'AUS';
      p.querySelector('.lamp').classList.toggle('on', !!Q);
      p.querySelector('.fbk').classList.toggle('on', !!Q);
    };
    p.querySelectorAll('.gate').forEach(el => el.onclick = () => { const k = el.dataset.g, o = opts[k]; g[k] = o[(o.indexOf(g[k]) + 1) % o.length]; Q = 0; Snd.play('select'); render(); });
    p.querySelectorAll('.tgl').forEach(b => b.onclick = () => { const k = b.dataset.k; inp[k] = inp[k] ? 0 : 1; Snd.play('select'); render(); });
    render();
    p.querySelector('.go').onclick = () => {
      const tests = [
        { s1: 1, b1: 1, s0: 0, want: 1, t: 'START drücken (Tür zu)' },
        { s1: 0, b1: 1, s0: 0, want: 1, t: 'START loslassen → Band läuft weiter' },
        { s1: 0, b1: 1, s0: 1, want: 0, t: 'NOT-HALT drücken → Band steht' },
        { s1: 0, b1: 1, s0: 0, want: 0, t: 'NOT-HALT entriegeln → kein Selbstanlauf' },
        { s1: 1, b1: 0, s0: 0, want: 0, t: 'START bei offener Tür → kein Anlauf' },
        { s1: 1, b1: 1, s0: 0, want: 1, t: 'START (Tür zu)' },
        { s1: 0, b1: 0, s0: 0, want: 0, t: 'Tür im Betrieb öffnen → Band steht' },
      ];
      let q = 0, allOk = true;
      const rows = tests.map(tc => { q = evalQ(tc.s1, q, tc.b1, tc.s0); q = evalQ(tc.s1, q, tc.b1, tc.s0); const ok = q === tc.want; if (!ok) allOk = false; return `<tr class="${ok ? 'ok' : 'no'}"><td>${tc.t}</td><td>${q ? 'läuft' : 'steht'}</td><td>${ok ? '✔' : '✘'}</td></tr>`; });
      if (!allOk) { Game.mistake(); fb(p, `<table class="tb">${rows.join('')}</table>Das Programm erfüllt die Funktionsbeschreibung noch nicht.`); return; }
      Game.closeModal(true);
      Game.take('schaltplan'); Game.lernen('logik');
      Snd.play('ok');
      Game.say(['Q1 = (S1 ODER K1) UND B1 UND NICHT S0.', 'Das Display springt von „ERR“ auf „RUN“. Alle Testfälle bestanden: Selbsthaltung, Tür-Überwachung, Not-Halt ohne Wiederanlauf.'], () => Game.fix('steuerung'));
    };
  },
};

// ------------------------------------------------------------
//  Erweiterung: Elektro vertieft
// ------------------------------------------------------------
Object.assign(PUZZLES, {
  // ---------------------------------------------------------------
  // 11) Multimeter: Spannung, Durchgang, Strom (LF3) – Steuerleitung FB-01
  // ---------------------------------------------------------------
  multimeter() {
    const st = { step: 1, f7: true, measured: {} };
    const READ = { 1: '0,4 Ω', 2: '0,4 Ω', 3: 'OL', 4: '0,4 Ω', 5: '0,5 Ω', 6: '0,4 Ω', 7: '0,4 Ω' };
    const p = Game.modal(`<h2>Abzweigkasten FB-01 – Steuerleitung 24 V DC</h2>
      <div class="cols">
        <div class="mm">
          <div class="lcd">- - - -</div>
          <label class="pl">Drehschalter <select id="dial"><option value="">–</option><option value="VDC">V ⎓ (Gleichspannung)</option><option value="VAC">V ~ (Wechselspannung)</option><option value="OHM">Ω / Durchgang</option><option value="ADC">A ⎓ (Gleichstrom)</option></select></label>
          <label class="pl">Rote Messleitung in <select id="jack"><option value="">–</option><option value="VO">Buchse VΩ</option><option value="A">Buchse 10 A</option></select></label>
          <p class="note">Schwarze Messleitung steckt in COM.</p>
          <p>Steuersicherung F7 (24 V): <button class="btn small f7"></button></p>
        </div>
        <div class="side task"></div>
      </div>
      <div class="fb"></div>`, { cls: 'wide' });
    const lcd = p.querySelector('.lcd');
    const val = id => p.querySelector('#' + id).value;
    const live = () => G.mainSwitch === 'on' && st.f7;
    const f7btn = p.querySelector('.f7');
    const renderF7 = () => { f7btn.textContent = st.f7 ? 'EIN – zum Ausschalten klicken' : 'AUS – zum Einschalten klicken'; f7btn.classList.toggle('off', !st.f7); };
    f7btn.onclick = () => { st.f7 = !st.f7; Snd.play('breaker'); renderF7(); };
    renderF7();
    const setupOk = () => {
      const d = val('dial'), j = val('jack');
      if (!d || !j) { fb(p, 'Stell erst den Drehschalter ein und steck die rote Messleitung in eine Buchse.'); return false; }
      if (j === 'A' && d !== 'ADC') { Game.mistake(); fb(p, 'Die rote Messleitung steckt in der A-Buchse, der Drehschalter steht aber nicht auf A. Gefährlich falsch – in der A-Buchse hat das Messgerät fast keinen Innenwiderstand!'); return false; }
      if (d === 'ADC' && j !== 'A') { Game.mistake(); fb(p, 'Für eine Strommessung gehört die rote Messleitung in die A-Buchse.'); return false; }
      return true;
    };
    const shortCircuit = () => {
      Game.mistake(); Snd.play('zap'); lcd.textContent = 'FUSE';
      if (!Game.hurt(10, 'Kurzschluss über das Messgerät.')) fb(p, 'PENG! Auf A und <b>parallel</b> angeschlossen ist das Messgerät praktisch ein Draht – Kurzschluss! Ein Lichtbogen, die Feinsicherung im Multimeter ist durch. (Zum Glück hat Dragan Ersatz im Koffer.) Strom misst man <b>in Reihe</b>.');
    };
    const tasks = {
      1: `<p><b>Aufgabe 1:</b> Prüfe, ob an Klemme 1 (+) und Klemme 2 (−) die Steuerspannung anliegt.</p>
          <label class="cb"><input type="radio" name="conn" value="par"> Messspitzen an Klemme 1 und 2 (parallel)</label>
          <label class="cb"><input type="radio" name="conn" value="ser"> Ader an Klemme 1 lösen, Messgerät dazwischen (in Reihe)</label>
          <div class="row"><button class="btn go1">Messen</button></div>`,
      2: `<p><b>Aufgabe 2:</b> Miss die Adern 1–7 auf Durchgang. Dragan hat am Band alle Adernenden gebrückt.</p>
          <div class="choices">${[1, 2, 3, 4, 5, 6, 7].map(n => `<button class="btn small ad" data-n="${n}">Ader ${n}${n === 7 ? ' (Reserve)' : ''}</button>`).join('')}</div>
          <div class="ml"></div>
          <p>Unterbrochene Ader: <select id="brk"><option value="">–</option>${[1, 2, 3, 4, 5, 6].map(n => `<option>${n}</option>`).join('')}</select> <button class="btn small go2">Umklemmen</button></p>`,
      3: `<p><b>Aufgabe 3:</b> Für das Prüfprotokoll: Miss die Stromaufnahme der Schützspule K2 (Bandmotor) – und berechne ihre Leistung.</p>
          <label class="cb"><input type="radio" name="conn" value="par"> Messspitzen an A1 und A2 der Spule (parallel)</label>
          <label class="cb"><input type="radio" name="conn" value="ser"> Zuleitung an A1 lösen, Messgerät dazwischen (in Reihe)</label>
          <div class="row"><button class="btn go3">Messen</button></div>
          <p class="pw hidden">Leistung der Spule: P = <input class="inp" id="pw" size="5"> W <button class="btn small go4">Eintragen</button></p>`,
    };
    const renderTask = () => {
      p.querySelector('.task').innerHTML = tasks[st.step];
      const q = s => p.querySelector(s);
      const conn = () => (p.querySelector('input[name=conn]:checked') || {}).value;
      if (st.step === 1) q('.go1').onclick = () => {
        if (!setupOk()) return;
        const d = val('dial'), c = conn();
        if (!c) { fb(p, 'Wie schließt du das Messgerät an?'); return; }
        if (d === 'ADC' && c === 'par' && live()) { shortCircuit(); return; }
        if (d === 'OHM' && live()) { Game.mistake(); lcd.textContent = 'Err'; Snd.play('err'); fb(p, 'Das Gerät piept und zeigt Unsinn. Widerstand nie unter Spannung messen!'); return; }
        if (d === 'ADC') { Game.mistake(); fb(p, 'Gefragt ist die Spannung, nicht der Strom.'); return; }
        if (d === 'OHM') { fb(p, 'Gefragt ist die Spannung.'); return; }
        if (c === 'ser') { Game.mistake(); lcd.textContent = '23.9'; fb(p, 'In Reihe geschaltet unterbricht das Voltmeter mit seinem riesigen Innenwiderstand den Stromkreis – das Ergebnis taugt nichts. Spannung misst man <b>parallel</b>.'); return; }
        if (d === 'VAC') { Game.mistake(); lcd.textContent = '0.3 ~'; fb(p, '0,3 V~? Die Steuerspannung ist <b>Gleichspannung</b> (DC). Falscher Messbereich.'); return; }
        if (!live()) { lcd.textContent = '0.00 V'; fb(p, G.mainSwitch !== 'on' ? '0,00 V. Kein Wunder: Der Hauptschalter oben im Schaltraum ist aus.' : '0,00 V – die Steuersicherung F7 ist ausgeschaltet.'); return; }
        lcd.textContent = '24.1 V'; Snd.play('ok');
        fb(p, '24,1 V ⎓ – die Steuerspannung liegt an. Das Netzteil ist in Ordnung, der Fehler muss in der Leitung liegen.', true);
        st.step = 2; renderTask();
      };
      if (st.step === 2) {
        p.querySelectorAll('.ad').forEach(b => b.onclick = () => {
          const d = val('dial');
          if (!setupOk()) return;
          if (d !== 'OHM') { fb(p, 'Für eine Durchgangsprüfung muss der Drehschalter auf Ω / Durchgang.'); return; }
          if (live()) { Game.mistake(); lcd.textContent = 'Err'; Snd.play('err'); fb(p, 'Halt! Die Leitung steht noch unter Spannung. Widerstand und Durchgang misst man nur <b>spannungsfrei</b> – erst F7 ausschalten.'); return; }
          const n = +b.dataset.n;
          st.measured[n] = READ[n]; lcd.textContent = READ[n]; Snd.play(READ[n] === 'OL' ? 'select' : 'ok');
          p.querySelector('.ml').innerHTML = Object.keys(st.measured).map(k => `Ader ${k}: <b>${st.measured[k]}</b>`).join(' · ');
          p.querySelector('.fb').innerHTML = ''; p.querySelector('.fb').className = 'fb';
        });
        q('.go2').onclick = () => {
          const b = +val('brk');
          if (!b) { fb(p, 'Welche Ader ist unterbrochen?'); return; }
          if (!st.measured[b]) { fb(p, `Ader ${b} hast du noch gar nicht gemessen. Erst messen, dann reparieren!`); return; }
          if (b !== 3) { Game.mistake(); fb(p, `Ader ${b} hat ${st.measured[b]} – also Durchgang. „OL“ (overload) bedeutet: Widerstand unendlich groß → Unterbrechung.`); return; }
          Snd.play('ok');
          fb(p, 'Du klemmst Ader 3 auf beiden Seiten ab und legst das Signal mit den Verbindungsklemmen auf die Reserveader 7. Nachgemessen: 0,4 Ω. Beschriftung angepasst.', true);
          st.step = 3; renderTask();
        };
      }
      if (st.step === 3) {
        q('.go3').onclick = () => {
          if (!setupOk()) return;
          const d = val('dial'), c = conn();
          if (!c) { fb(p, 'Wie schließt du das Messgerät an?'); return; }
          if (d === 'ADC' && c === 'par') { if (live()) shortCircuit(); else fb(p, 'Zum Glück ist gerade keine Spannung drauf – denn auf A und parallel wäre das ein Kurzschluss! Strom misst man in Reihe.'); return; }
          if (d !== 'ADC') { fb(p, 'Gefragt ist der Strom: Drehschalter auf A ⎓.'); return; }
          if (!live()) { lcd.textContent = '0.00 A'; fb(p, 'Es fließt kein Strom – der Stromkreis ist ausgeschaltet. Für die Strommessung müssen F7 ' + (G.mainSwitch !== 'on' ? 'und der Hauptschalter ' : '') + 'eingeschaltet sein.'); return; }
          lcd.textContent = '0.21 A'; Snd.play('ok');
          fb(p, 'Das Schütz zieht an: 0,21 A. Jetzt noch die Leistung berechnen.', true);
          q('.pw').classList.remove('hidden');
        };
        q('.go4').onclick = () => {
          const w = num(val('pw'));
          if (!(w >= 4.9 && w <= 5.2)) { Game.mistake(); fb(p, isNaN(w) ? 'Trag die Leistung in Watt ein.' : `${val('pw')} W stimmt nicht. P = U · I.`); return; }
          Game.closeModal(true);
          Game.take('klemmen'); Game.lernen('multimeter');
          Game.say(['P = U · I = 24 V · 0,21 A ≈ 5,0 W. Ins Prüfprotokoll eingetragen.', 'Spannung parallel, Strom in Reihe, Widerstand nur spannungsfrei. Die Steuerleitung zum Band ist wieder heil.'], () => Game.fix('leitung'));
        };
      }
    };
    renderTask();
  },

  // ---------------------------------------------------------------
  // 12) Schutzmaßnahmen: Schutzklasse, Schutzleiter, RCD (LF3)
  // ---------------------------------------------------------------
  schutz() {
    let step = 1;
    const p = Game.modal(`<h2>Säulenbohrmaschine – elektrische Prüfung</h2><div class="sbody"></div><div class="fb"></div>`, { cls: 'wide' });
    const body = p.querySelector('.sbody');
    const radio = n => (p.querySelector(`input[name=${n}]:checked`) || {}).value;
    const steps = {
      1: () => `<p><b>1. Sichtprüfung:</b> Typenschild der Maschine.</p>
        <div class="tschild"><b>SB 25</b> · 400 V 3~ · 0,75 kW · IP 54 · <svg viewBox="0 0 30 30" class="sym"><circle cx="15" cy="15" r="13"/><line x1="15" y1="5" x2="15" y2="15"/><line x1="7" y1="15" x2="23" y2="15"/><line x1="9.5" y1="19" x2="20.5" y2="19"/><line x1="12" y1="23" x2="18" y2="23"/></svg></div>
        <p>Welche Schutzklasse hat die Maschine – und wie ist sie geschützt?</p>
        <label class="cb"><input type="radio" name="sk" value="1"> Schutzklasse I – Schutzleiter am Gehäuse</label>
        <label class="cb"><input type="radio" name="sk" value="2"> Schutzklasse II – Schutzisolierung</label>
        <label class="cb"><input type="radio" name="sk" value="3"> Schutzklasse III – Schutzkleinspannung</label>
        <div class="row"><button class="btn nx">Weiter</button></div>`,
      2: () => `<p><b>2. Schutzleiterwiderstand messen</b> mit dem Gerätetester: Prüfspitze an blankes Metall des Gehäuses, Stecker der Maschine im Prüfgerät.</p>
        <div class="row"><button class="btn ms">Messen</button></div><div class="lcd big">- - -</div>
        <p>Ergebnis:</p>
        <label class="cb"><input type="radio" name="r1" value="ok"> Bestanden</label>
        <label class="cb"><input type="radio" name="r1" value="no"> Nicht bestanden – Schutzleiter unterbrochen</label>
        <div class="row"><button class="btn nx">Weiter</button></div>`,
      3: () => `<p><b>3. Stecker öffnen.</b> Braun und Blau sitzen an den Kontaktstiften, die grün-gelbe Ader hängt lose herum – die Klemmschraube wurde gelöst.</p>
        <svg viewBox="0 0 220 150" class="fig plug"><circle cx="100" cy="55" r="48" class="pbody"/><circle cx="68" cy="55" r="7" class="pin"/><circle cx="132" cy="55" r="7" class="pin"/>
        <rect x="92" y="6" width="16" height="10" class="pe"/><rect x="92" y="94" width="16" height="10" class="pe"/>
        <path d="M98 146 L68 62" class="w br"/><path d="M104 146 L132 62" class="w bl"/><path d="M94 146 Q50 135 30 112" class="w gy"/><text x="40" y="140" class="small">grün-gelb (lose)</text>
        <text x="68" y="40" class="small">Stift A</text><text x="132" y="40" class="small">Stift B</text><text x="170" y="10" class="small">Schutzkontakt-Bügel</text></svg>
        <p>Grün-gelbe Ader anklemmen an:</p>
        <label class="cb"><input type="radio" name="pe" value="a"> Kontaktstift A (zu Braun)</label>
        <label class="cb"><input type="radio" name="pe" value="b"> Kontaktstift B (zu Blau)</label>
        <label class="cb"><input type="radio" name="pe" value="pe"> Schutzkontakt-Bügel</label>
        <div class="row"><button class="btn nx">Anklemmen</button></div>`,
      4: () => `<p><b>4. Wiederholungsmessung</b> Schutzleiterwiderstand.</p>
        <div class="row"><button class="btn ms">Messen</button></div><div class="lcd big">- - -</div>
        <label class="cb"><input type="radio" name="r2" value="ok"> Bestanden (Grenzwert eingehalten)</label>
        <label class="cb"><input type="radio" name="r2" value="no"> Nicht bestanden</label>
        <div class="row"><button class="btn nx">Weiter</button></div>`,
      5: () => `<p><b>5. Fehlerstrom-Schutzschalter.</b> Warum hat der FI nicht ausgelöst, als Alois das Gehäuse angefasst hat? An der Werkstatt-Unterverteilung: FI-Schutzschalter 40 A / 30 mA.</p>
        <div class="row"><button class="btn tt">Prüftaste „T“ drücken</button></div>
        <div class="fires hidden"><p>Was tust du?</p>
        <label class="cb"><input type="radio" name="fi" value="weiter"> Weiterarbeiten – der LS-Schalter schützt ja auch</label>
        <label class="cb"><input type="radio" name="fi" value="tausch"> FI austauschen (vorher Werkstatt-UV freischalten, sichern, prüfen)</label>
        <p>Neuer FI aus dem Karton: <select id="idn"><option value="">–</option><option value="30">I<sub>ΔN</sub> = 30 mA</option><option value="300">I<sub>ΔN</sub> = 300 mA</option><option value="500">I<sub>ΔN</sub> = 500 mA</option></select></p>
        <div class="row"><button class="btn nx">Einbauen und Prüftaste drücken</button></div></div>`,
    };
    const render = () => {
      body.innerHTML = steps[step]();
      const nx = body.querySelector('.nx'), ms = body.querySelector('.ms'), tt = body.querySelector('.tt');
      let measured = false;
      if (ms) ms.onclick = () => { measured = true; Snd.play('select'); body.querySelector('.lcd').textContent = step === 2 ? 'R(PE) > 19,99 Ω' : 'R(PE) = 0,12 Ω'; };
      if (tt) tt.onclick = () => { Snd.play('clank'); fb(p, 'Nichts passiert. Die Taste lässt sich kaum bewegen – unter der Abdeckung klebt Sekundenkleber. Der FI ist <b>funktionsunfähig</b>!'); body.querySelector('.fires').classList.remove('hidden'); };
      if (nx) nx.onclick = () => {
        if (step === 1) {
          const v = radio('sk'); if (!v) { fb(p, 'Wähle eine Antwort.'); return; }
          if (v !== '1') { Game.mistake(); fb(p, 'Schau dir das Symbol genau an: Das ist das Erdungszeichen ⏚ – Schutzleiteranschluss.'); return; }
          fb(p, 'Richtig: Schutzklasse I. Das Metallgehäuse ist über den Schutzleiter (PE) geerdet.', true); step = 2; render(); return;
        }
        if (step === 2 || step === 4) {
          if (!measured) { fb(p, 'Erst messen!'); return; }
          const v = radio(step === 2 ? 'r1' : 'r2'); if (!v) { fb(p, 'Bestanden oder nicht?'); return; }
          if (step === 2 && v === 'ok') { Game.mistake(); fb(p, 'Über 19,99 Ω? Der Grenzwert liegt bei <b>0,3 Ω</b>. Der Schutzleiter ist praktisch nicht vorhanden – bei einem Fehler läge das Gehäuse unter Spannung!'); return; }
          if (step === 4 && v === 'no') { Game.mistake(); fb(p, '0,12 Ω ist kleiner als der Grenzwert 0,3 Ω – also bestanden.'); return; }
          fb(p, step === 2 ? 'Nicht bestanden. Grenzwert 0,3 Ω deutlich überschritten.' : '0,12 Ω ≤ 0,3 Ω – bestanden. (Isolationswiderstand: 250 MΩ, auch in Ordnung.)', true);
          step++; render(); return;
        }
        if (step === 3) {
          const v = radio('pe'); if (!v) { fb(p, 'Wohin mit der grün-gelben Ader?'); return; }
          if (v !== 'pe') {
            Game.mistake(); Game.closeModal(true); Snd.play('zap');
            if (!Game.hurt(30, v === 'a' ? 'Der Schutzleiter lag an Außenleiter-Potenzial – das ganze Gehäuse stand unter Spannung.' : 'Der Schutzleiter war an einen stromführenden Kontakt geklemmt.'))
              Game.say(['Du steckst den Stecker ein und berührst das Gehäuse – ZACK!', v === 'a' ? 'Jetzt liegt der Außenleiter direkt am Gehäuse! Und der defekte FI löst auch nicht aus.' : 'Auch der Neutralleiter kann Spannung gegen Erde führen. Und PE gehört nie an einen Stift!', 'Grün-gelb ist IMMER der Schutzleiter und gehört an den Schutzkontakt.']);
            return;
          }
          Snd.play('ok'); fb(p, 'Grün-gelb an den Schutzkontakt-Bügel, Schraube fest, Zugentlastung drauf.', true); step = 4; render(); return;
        }
        if (step === 5) {
          const v = radio('fi'); if (!v) { fb(p, 'Was tust du?'); return; }
          if (v === 'weiter') { Game.mistake(); fb(p, 'Der LS schützt die <b>Leitung</b>, nicht den Menschen! Er löst erst bei vielen Ampere aus – für einen Menschen sind schon 50 mA lebensgefährlich. Ohne funktionierenden FI kein Personenschutz.'); return; }
          const i = val => p.querySelector('#idn').value;
          if (!i()) { fb(p, 'Welchen FI baust du ein?'); return; }
          if (i() !== '30') { Game.mistake(); fb(p, `Ein FI mit ${i()} mA dient dem Brandschutz. Für den <b>Personenschutz</b> brauchst du I<sub>ΔN</sub> ≤ 30 mA.`); return; }
          Game.closeModal(true);
          Game.take('fi_kasten'); Game.set('schutzOk'); Game.lernen('schutz'); Snd.play('breaker');
          Game.say(['Neuer FI 30 mA eingebaut. Prüftaste „T“ – KLACK! Er löst sauber aus. Wieder eingeschaltet.', 'Du reißt das Flatterband von der Bohrmaschine und klebst eine neue Prüfplakette drauf.', 'Schutzklasse I, Schutzleiter ≤ 0,3 Ω, FI 30 mA mit Prüftaste getestet. Jetzt darf hier wieder gebohrt werden.']);
        }
      };
    };
    render();
  },

  // ---------------------------------------------------------------
  // 13) Schützschaltung mit Selbsthaltung (LF3/LF4)
  // ---------------------------------------------------------------
  schuetz() {
    const T = {
      L: [300, 20, 'L'], F2_95: [90, 45, '95'], F2_96: [90, 80, '96'], S0_11: [90, 105, '11'], S0_12: [90, 140, '12'],
      S1_13: [90, 170, '13'], S1_14: [90, 205, '14'], K1_13: [210, 170, '13'], K1_14: [210, 205, '14'], A1: [90, 235, 'A1'], A2: [90, 285, 'A2'], N: [300, 310, 'N'],
    };
    const fixed = [['L', 'F2_95'], ['A2', 'N']];
    let wires = [], sel = null;
    const p = Game.modal(`<h2>Kompressor K-01 – Steuerstromkreis verdrahten</h2>
      <p class="note">Klicke zwei Klemmen nacheinander an, um sie mit einer Ader zu verbinden. Klick auf eine Ader entfernt sie. (Stromlaufplan: siehe Dokumente.)</p>
      <div class="cols"><svg viewBox="0 0 360 330" class="fig schuetz">
        <line x1="20" y1="20" x2="340" y2="20" class="rail"/><text x="14" y="24" class="rl">L</text>
        <line x1="20" y1="310" x2="340" y2="310" class="rail"/><text x="14" y="314" class="rl">N</text>
        <line x1="90" y1="20" x2="90" y2="45" class="fixw"/><line x1="90" y1="285" x2="90" y2="310" class="fixw"/>
        <g class="comp"><line x1="90" y1="45" x2="90" y2="54"/><line x1="90" y1="71" x2="90" y2="80"/><line x1="90" y1="54" x2="80" y2="71"/><line x1="90" y1="56" x2="96" y2="56"/><text x="40" y="66">F2</text></g>
        <g class="comp"><line x1="90" y1="105" x2="90" y2="114"/><line x1="90" y1="131" x2="90" y2="140"/><line x1="90" y1="114" x2="80" y2="131"/><line x1="90" y1="116" x2="96" y2="116"/><text x="40" y="126">S0</text></g>
        <g class="comp"><line x1="90" y1="170" x2="90" y2="179"/><line x1="90" y1="196" x2="90" y2="205"/><line x1="80" y1="179" x2="90" y2="196"/><text x="40" y="191">S1</text></g>
        <g class="comp"><line x1="210" y1="170" x2="210" y2="179"/><line x1="210" y1="196" x2="210" y2="205"/><line x1="200" y1="179" x2="210" y2="196"/><text x="236" y="191">K1</text></g>
        <g class="comp"><rect x="78" y="248" width="24" height="24" class="coil"/><line x1="90" y1="235" x2="90" y2="248"/><line x1="90" y1="272" x2="90" y2="285"/><text x="40" y="264">K1</text></g>
        <g class="wires"></g><g class="terms"></g>
      </svg>
      <div class="side"><p><b>Bauteile</b></p><p class="note">F2 – Motorschutzrelais (Öffner 95-96)<br>S0 – AUS-Taster (Öffner 11-12)<br>S1 – EIN-Taster (Schließer 13-14)<br>K1 – Schützspule (A1-A2)<br>K1 – Hilfskontakt (Schließer 13-14, neu aufgesteckt)</p>
        <div class="row"><button class="btn rs">Alle Adern entfernen</button><button class="btn go">Probelauf</button></div></div></div>
      <div class="fb"></div>`, { cls: 'wide' });
    const svgW = p.querySelector('.wires'), svgT = p.querySelector('.terms');
    const render = () => {
      svgW.innerHTML = wires.map((w, i) => `<line x1="${T[w[0]][0]}" y1="${T[w[0]][1]}" x2="${T[w[1]][0]}" y2="${T[w[1]][1]}" class="wire" data-i="${i}"/>`).join('');
      svgT.innerHTML = Object.keys(T).map(k => `<g class="term ${sel === k ? 'sel' : ''}" data-k="${k}"><circle cx="${T[k][0]}" cy="${T[k][1]}" r="6"/><text x="${T[k][0] + 11}" y="${T[k][1] + 4}">${T[k][2]}</text></g>`).join('');
      svgW.querySelectorAll('.wire').forEach(l => l.onclick = () => { wires.splice(+l.dataset.i, 1); Snd.play('select'); render(); });
      svgT.querySelectorAll('.term').forEach(g => g.onclick = () => {
        const k = g.dataset.k;
        if (!sel) sel = k;
        else if (sel === k) sel = null;
        else {
          const w = [sel, k].sort();
          if (!wires.some(x => x[0] === w[0] && x[1] === w[1])) wires.push(w);
          sel = null; Snd.play('clank');
        }
        render();
      });
    };
    p.querySelector('.rs').onclick = () => { wires = []; sel = null; render(); };
    // Simulation über Knotenverbindungen (Union-Find)
    const sim = (s) => {
      const par = {}; Object.keys(T).forEach(k => par[k] = k);
      const f = k => par[k] === k ? k : (par[k] = f(par[k]));
      const u = (a, b) => { par[f(a)] = f(b); };
      fixed.concat(wires).forEach(w => u(w[0], w[1]));
      if (!s.trip) u('F2_95', 'F2_96');
      if (!s.s0) u('S0_11', 'S0_12');
      if (s.s1) u('S1_13', 'S1_14');
      if (s.k) u('K1_13', 'K1_14');
      return { short: f('L') === f('N'), on: f('A1') === f('L') && f('A2') === f('N') };
    };
    const run = (s, kPrev) => { let k = kPrev; for (let i = 0; i < 4; i++) { const r = sim({ ...s, k }); if (r.short) return 'short'; k = r.on; } return k; };
    p.querySelector('.go').onclick = () => {
      if (!wires.length) { fb(p, 'Noch keine Adern verlegt.'); return; }
      const tests = [
        [{ s1: 0, s0: 0, trip: 0 }, false, 'Ruhezustand'],
        [{ s1: 1, s0: 0, trip: 0 }, true, 'EIN-Taster S1 drücken'],
        [{ s1: 0, s0: 0, trip: 0 }, true, 'S1 loslassen → Selbsthaltung'],
        [{ s1: 0, s0: 1, trip: 0 }, false, 'AUS-Taster S0 drücken'],
        [{ s1: 0, s0: 0, trip: 0 }, false, 'S0 loslassen → bleibt aus'],
        [{ s1: 1, s0: 0, trip: 0 }, true, 'S1 drücken'],
        [{ s1: 0, s0: 0, trip: 1 }, false, 'Motorschutz F2 löst aus'],
      ];
      let k = false, ok = true, rows = [];
      for (const [s, want, t] of tests) {
        const r = run(s, k);
        if (r === 'short') { Game.mistake(); Snd.play('zap'); fb(p, `Beim Schritt „${t}“: <b>Kurzschluss</b> zwischen L und N! Die Steuersicherung fliegt raus. Irgendwo führt eine Ader an der Spule vorbei direkt von L nach N.`); return; }
        k = r; const good = k === want; if (!good) ok = false;
        rows.push(`<tr class="${good ? 'ok' : 'no'}"><td>${t}</td><td>K1 ${k ? 'zieht an' : 'abgefallen'}</td><td>${good ? '✔' : '✘'}</td></tr>`);
      }
      if (!ok) { Game.mistake(); fb(p, `<table class="tb">${rows.join('')}</table>Die Schaltung verhält sich noch nicht wie im Stromlaufplan.`); return; }
      Game.closeModal(true);
      Game.take('hilfskontakt'); Game.lernen('schuetz'); Snd.play('clank');
      Game.say(['Probelauf mit Prüfstecker: EIN – K1 zieht an und hält sich selbst. AUS – fällt ab. Motorschutz – fällt ab. Perfekt.', 'Öffner in Reihe für AUS, Schließer parallel für EIN. Abdeckung drauf.', 'Sobald der Hauptschalter oben wieder an ist, läuft der Kompressor.'], () => Game.fix('kompressor'));
    };
    render();
  },

  // ---------------------------------------------------------------
  // 14) Trockenofen: Reihen-/Parallelschaltung (LF3)
  // ---------------------------------------------------------------
  ofen() {
    const R1 = 230 * 230 / 1000;
    const V = [
      { id: 'a', t: '1 Stab', r: R1 },
      { id: 'b', t: '2 Stäbe in Reihe', r: 2 * R1 },
      { id: 'c', t: '2 Stäbe parallel', r: R1 / 2 },
      { id: 'e', t: '3 Stäbe parallel', r: R1 / 3 },
      { id: 'f', t: '2 parallel, 1 in Reihe dazu', r: R1 / 2 + R1 },
      { id: 'g', t: '2 in Reihe, parallel zu 1', r: (2 * R1 * R1) / (3 * R1) },
    ];
    const hz = (x, y) => `<rect x="${x}" y="${y - 6}" width="22" height="12" class="hz"/>`;
    const L = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    const draw = {
      a: L(5, 30, 49, 30) + hz(49, 30) + L(71, 30, 155, 30),
      b: L(5, 30, 30, 30) + hz(30, 30) + L(52, 30, 90, 30) + hz(90, 30) + L(112, 30, 155, 30),
      c: L(5, 30, 50, 30) + L(50, 15, 50, 45) + L(50, 15, 69, 15) + hz(69, 15) + L(91, 15, 110, 15) + L(50, 45, 69, 45) + hz(69, 45) + L(91, 45, 110, 45) + L(110, 15, 110, 45) + L(110, 30, 155, 30),
      e: L(5, 30, 50, 30) + L(50, 8, 50, 52) + [8, 30, 52].map(y => L(50, y, 69, y) + hz(69, y) + L(91, y, 110, y)).join('') + L(110, 8, 110, 52) + L(110, 30, 155, 30),
      f: L(5, 30, 25, 30) + L(25, 15, 25, 45) + L(25, 15, 35, 15) + hz(35, 15) + L(57, 15, 67, 15) + L(25, 45, 35, 45) + hz(35, 45) + L(57, 45, 67, 45) + L(67, 15, 67, 45) + L(67, 30, 95, 30) + hz(95, 30) + L(117, 30, 155, 30),
      g: L(5, 30, 25, 30) + L(25, 15, 25, 45) + L(25, 15, 35, 15) + hz(35, 15) + L(57, 15, 80, 15) + hz(80, 15) + L(102, 15, 125, 15) + L(25, 45, 57, 45) + hz(57, 45) + L(79, 45, 125, 45) + L(125, 15, 125, 45) + L(125, 30, 155, 30),
    };
    let pick = null;
    const p = Game.modal(`<h2>Trockenofen TO-3 – Heizstäbe klemmen</h2>
      <p class="note">Typenschild: 3 Heizstäbe je 230 V / 1000 W · Betriebsart „Lack trocknen“: 2,0 kW (± 5 %) · Anschluss 230 V</p>
      <div class="step"><label>1. Widerstand eines Heizstabs: R = <input class="inp" id="r1" size="6"> Ω</label></div>
      <div class="step"><p>2. Wie klemmst du die Heizstäbe?</p>
        <div class="vgrid">${V.map(v => `<button class="vbtn" data-id="${v.id}"><svg viewBox="0 0 160 60" class="fig vs">${draw[v.id]}</svg><span>${v.t}</span></button>`).join('')}</div></div>
      <div class="step"><label>3. Ersatzwiderstand deiner Schaltung: R<sub>ges</sub> = <input class="inp" id="rg" size="6"> Ω</label></div>
      <div class="fb"></div><div class="row"><button class="btn go">Klemmen &amp; Probeheizen</button></div>`, { cls: 'wide' });
    p.querySelectorAll('.vbtn').forEach(b => b.onclick = () => { pick = b.dataset.id; Snd.play('select'); p.querySelectorAll('.vbtn').forEach(x => x.classList.toggle('sel', x === b)); });
    p.querySelector('.go').onclick = () => {
      const r1 = num(p.querySelector('#r1').value);
      if (!(r1 >= 52.4 && r1 <= 53.4)) { Game.mistake(); fb(p, isNaN(r1) ? 'Berechne zuerst den Widerstand eines Heizstabs.' : `${p.querySelector('#r1').value} Ω stimmt nicht. Aus P = U² / R folgt R = U² / P.`); return; }
      if (!pick) { fb(p, 'Wähle eine Schaltung.'); return; }
      const v = V.find(x => x.id === pick);
      const rg = num(p.querySelector('#rg').value);
      if (!(Math.abs(rg - v.r) / v.r < 0.03)) { Game.mistake(); fb(p, isNaN(rg) ? 'Wie groß ist der Ersatzwiderstand deiner Schaltung?' : `R<sub>ges</sub> = ${p.querySelector('#rg').value} Ω passt nicht zu „${v.t}“. Reihe: R addieren. Parallel: 1/R<sub>ges</sub> = 1/R<sub>1</sub> + 1/R<sub>2</sub>.`); return; }
      const P = Math.round(230 * 230 / v.r);
      if (pick !== 'c') { Game.mistake(); fb(p, `R<sub>ges</sub> ≈ ${v.r.toFixed(1).replace('.', ',')} Ω → P = U² / R ≈ <b>${P} W</b>. ${P > 2100 ? 'Zu heiß – der Lack wirft Blasen!' : 'Zu kalt – der Lack bleibt klebrig.'} Gefordert sind 2000 W.`); return; }
      Game.closeModal(true);
      Game.lernen('ofen'); Snd.play('ok');
      Game.say(['R = (230 V)² / 1000 W = 52,9 Ω. Zwei Stäbe parallel: 26,45 Ω → P = (230 V)² / 26,45 Ω = 2000 W.', 'Du klemmst zwei Heizstäbe parallel, der dritte bleibt abgeklemmt und isoliert. Brücken aus Aderleitung, sauber mit Aderendhülsen.', 'Abdeckung zu. Sobald der Strom wieder da ist, heizt der Ofen mit genau 2 kW.'], () => Game.fix('ofen'));
    };
  },
});
