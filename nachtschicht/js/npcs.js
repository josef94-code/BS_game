'use strict';
// ------------------------------------------------------------
//  Figuren, Gespräche und gestufte Tipps
// ------------------------------------------------------------

// Tipp-Themen: open() = Aufgabe noch offen, hints = drei Stufen (vage → konkret)
const TOPICS = {
  schluessel: {
    title: 'Wie komme ich in den Schaltraum?',
    open: () => !Game.has('schluessel') && !Game.flag('gotKey'),
    hints: {
      Schorsch: ['Den Schlüssel hat die Irmgard im Lager. Die rückt ihn aber ned jedem raus.', 'Die Irmgard will hören, dass du die fünf Sicherheitsregeln kannst. In der richtigen Reihenfolge. Am Aushang in der Umkleide steht die Hälfte.', 'Freischalten. Gegen Wiedereinschalten sichern. Spannungsfreiheit feststellen. Erden und kurzschließen. Benachbarte, unter Spannung stehende Teile abdecken oder abschranken. So. Und jetzt merk’s dir.'],
      Alois: ['Schaltraum? Da geh ich ned rein. Frag die Irmgard, die hat die Schlüssel.', 'Die Irmgard fragt immer nach den fünf Regeln. Bei mir war das noch vor der Mondlandung.', 'Erst freischalten, dann sichern, dann prüfen … dann erden, dann abdecken. So hat’s der Brandl immer runtergebetet.'],
    },
  },
  licht: {
    title: 'Wie kriege ich das Licht wieder an?',
    open: () => !Game.fixed('licht'),
    hints: {
      Dragan: ['Licht? Unterverteilung im Schaltraum, F3. Freischalten, sichern, prüfen – und dann rechnen, welcher LS passt.', 'Leistung zusammenzählen, I gleich P durch U. Der LS muss drüber liegen, aber unter dem, was die Leitung verträgt.', 'Rund 13 Ampere. B16. Nicht B32, sonst brennt dir die 2,5er-Leitung ab.'],
      Schorsch: ['Die Hallenbeleuchtung hängt im Schaltraum an der Unterverteilung, Stromkreis F3. Ersatz-LS gibt’s im Lager, linkes Regal. Und bevor du in den Schrank langst: Hauptschalter aus, Schloss dran, prüfen!', 'Zwölf Lampen à 250 Watt, alle parallel an 230 Volt. Leistungen zusammenzählen, dann I = P durch U. Den LS nimmst du so, dass er über dem Betriebsstrom liegt – aber die Leitung noch schützt.', '3000 Watt durch 230 Volt, das sind gut 13 Ampere. B10 fliegt dir sofort raus, B32 schützt die 2,5er-Leitung nimmer. Bleibt der B16. Und danach Schloss ab und wieder einschalten, sonst bleibt’s dunkel.'],
    },
  },
  halterung: {
    title: 'Was ist mit dem Bandmotor?',
    open: () => !Game.fixed('halterung'),
    hints: {
      Alois: ['Die Halteplatte vom Bandmotor? Gewinde ausgerissen. Platte abbauen, das Loch aufbohren und ein neues M10 schneiden. Die Bohrmaschine steht hier, das Windeisen hängt an meiner Wand, Gewindebohrer hat die Irmgard.', 'Kernloch ist Nenndurchmesser minus Steigung – schau ins Tabellenbuch, auch wenn einer seinen Kaffee drübergeschüttet hat. Drehzahl: n gleich v-c mal tausend durch Pi mal d. Und beim Gewindeschneiden: Vorschneider, Mittelschneider, Fertigschneider. Ein Ring, zwei Ringe, drei Ringe.', 'M10 minus 1,5 macht einen 8,5er-Bohrer. Bei Baustahl mit 25 Metern pro Minute kommst auf rund 940 Umdrehungen, also Stufe 900. Und KEINE Handschuhe an der Bohrmaschine, sonst bist an Finger los!'],
      Schorsch: ['Mechanik? Frag den Alois in der Werkstatt. Der bohrt dir a Loch in a Haar.', 'Der Alois weiß das. Ich weiß nur, dass die Platte abgeschraubt werden muss.', 'Platte abbauen, in die Werkstatt, neues Gewinde. Mehr weiß ich ned.'],
    },
  },
  getriebe: {
    title: 'Was fehlt am Bandgetriebe?',
    open: () => !Game.fixed('getriebe'),
    hints: {
      Alois: ['Das große Zahnrad am Bandgetriebe ist weg. Ersatz müsst in der Kiste hinten im Lager sein.', 'Motor macht 1400, die Bandwelle braucht 350. Übersetzung i gleich n1 durch n2. Und i ist auch z2 durch z1. Lies meinen Spickzettel.', '1400 durch 350 ist 4. Das Motorritzel hat 18 Zähne – also brauchst ein Rad mit 4 mal 18 gleich 72 Zähnen.'],
      Irmgard: ['Zahnräder? Hinten rechts bei den Kisten. Steht „Ersatzräder“ drauf.', 'Welches du brauchst, sagt dir der Alois. Ich zähl keine Zähne.', 'Der Alois murmelt immer was von „vier zu eins“.'],
    },
  },
  presse: {
    title: 'Wie bringe ich die Presse zum Laufen?',
    open: () => !Game.fixed('presse'),
    hints: {
      Schorsch: ['Die Presse? Schläuche zerschnitten, Ventil falsch verschlaucht. Neuer Schlauch liegt im Lager auf der Palette. Und ohne Druckluft vom Hauptkompressor im Keller geht eh nix – der braucht Strom, Hauptschalter muss an sein.', 'Am 5/2-Ventil: 1 ist die Luft rein, 2 und 4 gehen zum Zylinder, 3 und 5 sind Abluft. In Grundstellung ist 1 mit 2 verbunden – überleg dir, wo der Stempel in Ruhe stehen muss. Und Zweihandbedienung heißt: nur wenn BEIDE Hände drücken.', 'Kolbenstangenseite an 2, damit der Stempel in Ruhe oben bleibt. Kolbenseite an 4. Schalldämpfer auf 3 und 5. Zweihand ist UND – also Zweidruckventil. Und 6 bar, steht auf dem Typenschild.'],
      Irmgard: ['Pneumatikschlauch? Liegt auf der Palette, vorne links. Und im Katalog auf der Theke steht, wie die Ventile funktionieren.', 'Lies den Katalog. Steht alles drin. Ich sag’s nicht zweimal.', 'Eins rein, zwei und vier raus zum Zylinder, drei und fünf Abluft. So. Jetzt hab ich’s doch zweimal gesagt.'],
    },
  },
  meldung: {
    title: 'Was ist mit der Meldeleuchte?',
    open: () => Game.flag('ledSeen') && !Game.fixed('meldung'),
    hints: {
      Schorsch: ['Die Meldeleuchte im Steuerschrank? Vorwiderstand verkohlt. Widerstände hat der Alois in seiner Wunderkiste in der Werkstatt.', '24 Volt Steuerspannung, die LED will 2 Volt und 20 Milliampere. Was übrig bleibt, muss der Widerstand aufnehmen. R gleich U durch I. Und dann den Farbcode lesen – Aufkleber an der Schranktür.', '22 Volt durch 0,02 Ampere – 1100 Ohm. Braun, braun, rot. Und vorher freischalten, Schlauberger.'],
      Alois: ['Widerstände? Hab ich, in meiner Blechschachtel. Rechnen musst aber selber.', 'Ohmsches Gesetz, Bub. Spannung am Widerstand durch Strom. Die LED nimmt sich ihre zwei Volt, der Rest bleibt für den Widerstand.', 'Elfhundert Ohm, glaub ich. Braun-braun-rot. Meine Augen sind nimmer so gut.'],
    },
  },
  buero: {
    title: 'Wie komme ich ins Meisterbüro?',
    open: () => !Game.flag('officeOpen'),
    hints: {
      Alois: ['Das Büro vom Brandl hat ein Zahlenschloss. Und der Brandl nimmt immer Codes, die man messen muss. Typisch Meister.', 'Auf meinem Tisch liegt ein Prüfstück, der Messschieber ist noch dran. Den hat der Brandl so hingelegt. Ablesen kannst es ja hoffentlich – im Regal liegt ein Hefteintrag dazu.', 'Nullstrich vom Nonius steht zwischen 27 und 28. Und dann schau, welcher Noniusstrich genau mit der Hauptskala fluchtet. Den Wert ohne Komma eintippen.'],
      Schorsch: ['Ins Brandl-Büro? Zahlenschloss. Ich kenn den Code ned. Der Alois vielleicht.', 'Frag den Alois. Der Brandl und der Alois, die stecken immer zusammen.', 'Irgendwas mit seinem Messschieber. Frag den Alois.'],
    },
  },
  steuerung: {
    title: 'Wie programmiere ich die Bandsteuerung?',
    open: () => Game.flag('ledSeen') && !Game.fixed('steuerung'),
    hints: {
      Schorsch: ['Die Kleinsteuerung im Steuerschrank ist leer. Den Schaltplan mit der Logik hat der Brandl im Büro im Aktenschrank.', 'Start ODER Selbsthaltung – das hält das Band am Laufen, wenn du den Taster loslässt. Und das Ganze nur, wenn Tür zu UND NICHT Not-Halt.', 'Erster Baustein ODER, der Not-Halt kommt durch ein NICHT, und am Schluss alles mit UND zusammen.'],
    },
  },
  keller: {
    title: 'Wie komme ich in den Keller?',
    open: () => !Game.flag('kellerOffen'),
    hints: {
      Schorsch: ['Der Keller? Die Treppe ist hinten rechts in der Halle, vorne beim Kompressorkessel. Der Kowalski hat das Gitter mit seinem eigenen Schloss zugesperrt.', 'Die Irmgard hat einen Bolzenschneider. Die gibt ihn dir, wenn sie dir traut.', 'Bolzenschneider von der Irmgard, Schloss knacken, runter. Und nimm die Lampe mit, da unten ist’s finster.'],
      Irmgard: ['Unten im Keller? Da hat seit Wochen nur noch der Kowalski was verloren. Und der Dragan.', 'Mein Bolzenschneider kriegt jedes Schloss auf.', 'Treppe vorne rechts in der Halle. Schloss ab. Fertig.'],
    },
  },
  schutz: {
    title: 'Was ist mit der Bohrmaschine?',
    open: () => Game.flag('sawDrill') && !Game.flag('schutzOk'),
    hints: {
      Alois: ['Die Säulenbohrmaschine hat mich gezwickt, wie ich sie angefasst hab. Gehäuse unter Spannung, wett ich. Und der FI hat nicht ausgelöst! Ohne Prüfung rühr ich die nimmer an.', 'Der Dragan unten in der E-Werkstatt hat einen Gerätetester. Schutzleiter messen, FI prüfen – das ist sein Revier.', 'Schutzleiter ist der grün-gelbe. Und ein FI für Personenschutz hat 30 Milliampere, das weiß sogar ich.'],
      Dragan: ['Bohrmaschine kribbelt? Schutzleiter. Immer der Schutzleiter. Miss mit dem Gerätetester zwischen Gehäuse und Schutzkontakt am Stecker.', 'Mehr als 0,3 Ohm heißt durchgefallen. Dann Stecker aufmachen. Und wenn der FI bei der Prüftaste nicht auslöst, ist er Schrott – neue liegen hier im Regal.', 'Grün-gelb an den Schutzkontakt-Bügel, nie an einen Stift! Neuer FI: 30 Milliampere, nicht 300. 300 ist Brandschutz, kein Personenschutz.'],
    },
  },
  kompressor: {
    title: 'Was ist mit dem Kompressor?',
    open: () => !Game.fixed('kompressor'),
    hints: {
      Schorsch: ['Die Druckluft kommt vom Hauptkompressor im Keller. Wenn der steht, kannst die Presse vergessen. Frag den Dragan, der ist da unten.', 'Ich bin kein Elektriker. Irgendwas mit Schütz und Selbsthaltung, hat der Dragan gemurmelt.', 'Frag den Dragan. Wirklich.'],
      Dragan: ['Im Schaltkasten vom Kompressor fehlt der Hilfsschalterblock, und ein paar Adern sind raus. Den Block hat wohl einer mitgehen lassen – schau mal beim Kowalski hinten im Gang. Aderleitung liegt bei mir zwischen den Kabeltrommeln.', 'AUS-Befehle sind Öffner und kommen in Reihe: Motorschutz F2, dann S0. Dann der EIN-Taster S1 als Schließer, dann die Spule. Der Hilfskontakt K1 13-14 parallel zum EIN-Taster. Und vorher freischalten!', 'F2 96 auf S0 11, S0 12 auf S1 13, S1 14 auf A1. Dann K1 13 an S1 13 und K1 14 an S1 14. Fertig ist die Selbsthaltung.'],
    },
  },
  leitung: {
    title: 'Was ist mit der Steuerleitung?',
    open: () => Game.flag('sawLeitung') && !Game.fixed('leitung'),
    hints: {
      Dragan: ['Die Steuerleitung vom Band läuft durch den Abzweigkasten im Kellergang. Wenn da eine Ader durch ist, läuft oben gar nix. Miss nach – mein Multimeter hast du ja. Verbindungsklemmen hat die Irmgard.', 'Erst Spannung messen: V Gleichspannung, rote Leitung in VΩ, parallel. Dann Steuersicherung raus und jede Ader auf Durchgang – Widerstand misst man nie unter Spannung!', 'Die Ader mit „OL“ ist hin. Leg das Signal auf die Reserveader 7. Und Strom misst du in Reihe, mit der roten Leitung in der A-Buchse – parallel knallt’s. P gleich U mal I.'],
      Schorsch: ['Die Steuerleitung? Da musst mit dem Messgerät ran. Der Dragan weiß, wie.', 'Frag den Dragan.', 'Der Dragan. Keller. E-Werkstatt.'],
    },
  },
  ofen: {
    title: 'Was ist mit dem Trockenofen?',
    open: () => !Game.fixed('ofen'),
    hints: {
      Schorsch: ['Der Trockenofen vorne links trocknet den Lack auf den Gehäusen. Irgendwer hat da drin rumgepfuscht. Lies das Typenschild.', 'Drei Heizstäbe, und der Ofen soll 2 Kilowatt bringen. Mehr weiß ich ned. Frag den Dragan.', 'Der Dragan hat gesagt: zwei parallel, einer bleibt weg. Ich hab keine Ahnung, was das heißt.'],
      Dragan: ['Der Trockenofen? Lies das Typenschild. Drei Heizstäbe, jeder 1000 Watt bei 230 Volt. Der Lack will 2 Kilowatt. Brücken machst du mit Aderleitung. Und freischalten!', 'Rechne erst aus, welchen Widerstand ein Heizstab hat: R gleich U² durch P. Dann überleg: Reihe macht den Widerstand größer, parallel kleiner. P gleich U² durch R.', 'Zwei Stäbe parallel, der dritte bleibt abgeklemmt. 52,9 Ohm durch zwei gleich gut 26,5 Ohm. Macht 2000 Watt.'],
    },
  },
  start: {
    title: 'Was jetzt?',
    open: () => FIXES.every(f => Game.fixed(f.id)) && !Game.flag('ending'),
    hints: {
      Schorsch: ['Was fragst mich? Hauptschalter an, und dann am Bedienpult START drücken!', 'Hauptschalter an, Bedienpult, START.', 'START. Jetzt.'],
      Alois: ['Jetzt fehlt nur noch, dass einer am Bedienpult auf START drückt. Und das bist du.', 'Bedienpult. Grüner Knopf.', 'Na geh scho!'],
      Irmgard: ['Worauf wartest du? Draußen wird’s hell.', 'Bedienpult in der Halle. START.', 'Los jetzt.'],
      Dragan: ['Hauptschalter rein und START drücken. Worauf wartest du, auf mich?', 'START.', 'Na los.'],
    },
  },
};

function hintMenu(who, storyFn) {
  const opts = [];
  for (const id in TOPICS) {
    const T = TOPICS[id];
    if (T.hints[who] && T.open()) opts.push({ t: T.title, f: () => giveHint(who, id) });
  }
  opts.push({ t: 'Erzähl mal …', f: storyFn });
  opts.push({ t: 'Nichts weiter', f: () => {} });
  Game.ask('Was gibt’s?', opts, who);
}
function giveHint(who, id) {
  const lvl = G.hints[id] || 0;
  const h = TOPICS[id].hints[who];
  G.hints[id] = Math.min(lvl + 1, h.length - 1);
  Game.say([[who, h[Math.min(lvl, h.length - 1)]]], () => {
    if (lvl + 1 < h.length) Game.toast('Frag nochmal, wenn du mehr Hilfe brauchst.');
  });
}
function storyLine(who, lines) {
  const k = 'story_' + who;
  const i = G.talk[k] || 0;
  G.talk[k] = (i + 1) % lines.length;
  Game.say(lines[i].map(l => [who, l]));
}

const NPC = {
  schorsch: {
    name: 'Schorsch', look: LOOKS.schorsch,
    fx(ctx, q, t) { // Zigarette
      if (Game.flag('ending')) return;
      const x = q.x - 4 * q.s, y = q.y - 47 * q.s;
      rect(ctx, x - 1, y, 2, 1, '#f84');
      for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; ctx.fillStyle = `rgba(180,180,180,${0.3 * (1 - k)})`; ctx.fillRect(x + Math.sin(k * 6 + i) * 2, y - k * 18, 2, 2); }
    },
    talk() {
      if (Game.flag('ending')) { Game.say([['Schorsch', 'Ich hab’s dir ja immer zugetraut.'], ['Schorsch', '… Gut, nicht immer. Aber jetzt.']]); return; }
      if (!Game.flag('met_schorsch')) {
        Game.set('met_schorsch');
        Game.say([
          ['Schorsch', 'Schau an. Der Neue. Ausgerechnet heut’ Nacht.'],
          ['Schorsch', 'Ich bin der Schorsch, Schichtführer. Von meiner Schicht ist keiner gekommen. Wer will schon in so einer Bruchbude Überstunden schieben.'],
          ['Schorsch', 'Licht weg, Band steht, Presse spinnt. Der Brandl ist seit Stunden verschwunden. Und Montag früh um sechs will der Kunde zweitausend Gehäuse.'],
          ['Schorsch', 'Wennst was reißen willst: Ohne Licht siehst nix. Die Hallenbeleuchtung hängt im Schaltraum. Den Schlüssel hat die Irmgard im Lager.'],
        ]);
        return;
      }
      if (Game.flag('read_kowalski') && !Game.flag('told_kow')) {
        Game.set('told_kow');
        Game.say([['Schorsch', '„F.“? Falk. Der Immobilienhai aus der Zeitung.'], ['Schorsch', 'Und „K.“ … Kowalski. Der Hausmeister. Ich hab’s gewusst. Der schleicht hier seit Wochen nachts rum.'], ['Schorsch', 'Pass bloß auf dich auf, Azubi. Und mach weiter – das Beste, was wir dem antun können, ist, dass die Halle Montag läuft.']]);
        return;
      }
      if (Game.hallLight() && !Game.flag('schorschLight')) {
        Game.set('schorschLight');
        Game.say([['Schorsch', 'Licht! Respekt. Hätt ich dir ned zugetraut.'], ['Schorsch', 'Jetzt schau dir das Band an. Motorhalterung ausgerissen, Getriebe kaputt. Und meine Presse verliert Luft.']]);
        return;
      }
      hintMenu('Schorsch', () => storyLine('Schorsch', [
        ['Seit zwanzig Jahren steh ich an der Presse. Und jetzt soll hier ein Wohnquartier hin? Mit Bio-Bäcker? Pah.'],
        ['Wennst den Kowalski siehst, den Hausmeister – geh ihm aus’m Weg. Der schleicht hier nachts rum wie ein Geist.', 'Neulich hab ich ihn am Rolltor gesehen. Zehn Sekunden später war er weg. Einfach weg.'],
        ['Der Brandl ist ein harter Hund. Aber gerecht. Wenn der dich in die Nachtschicht schickt, hat er sich was dabei gedacht.'],
        ['Früher waren wir hier achtzig Leute. Jetzt sind’s noch zweiundzwanzig. Und heut Nacht: zwei. Du und ich.'],
      ]));
    },
  },
  alois: {
    name: 'Alois', look: LOOKS.alois,
    talk() {
      if (Game.flag('ending')) { Game.say([['Alois', 'Das Band läuft wieder wie 1987. Da war ich so alt wie du.'], ['Alois', 'Und den Spickzettel kannst behalten.']]); return; }
      if (!Game.flag('met_alois')) {
        Game.set('met_alois');
        Game.say([
          ['Alois', 'Hm? Ah, a Azubi. Ich bin der Alois. Eigentlich in Rente, aber die Werkstatt kann ich ned allein lassen. Nicht bei dem, was hier grad los ist.'],
          ['Alois', 'Vierzig Jahr hab ich hier gedreht und gefräst. Früher war alles sauber. Da hast vom Boden essen können.'],
          ['Alois', 'Da, nimm. Mein Spickzettel für Übersetzungen. Den brauchen die Jungen immer.'],
        ], () => Game.addFile('getriebe'));
        return;
      }
      if (Game.flag('ledSeen') && !Game.has('widerstaende') && !Game.fixed('meldung')) {
        Game.say([['Alois', 'Die Meldeleuchte im Steuerschrank ist hin? Vorwiderstand verbrannt, wett ich.'], ['Alois', 'Da, meine Blechschachtel. Widerstände für alle Lebenslagen. Den richtigen musst aber selber finden.']], () => Game.give('widerstaende'));
        return;
      }
      hintMenu('Alois', () => storyLine('Alois', [
        ['Der Kowalski war gestern in meiner Werkstatt. Hat nach meinem 8,5er-Bohrer gefragt. Wozu braucht ein Hausmeister einen 8,5er?'],
        ['Weißt, was das Wichtigste in dem Beruf ist? Nicht die Kraft. Die Sorgfalt. Erst messen, dann denken, dann bohren.'],
        ['Mein erster Meister hat mir eine geschmiert, weil ich mit Handschuhen an der Bohrmaschine stand. Hat mir vermutlich die Hand gerettet.'],
        ['Die Halle hat schon drei Pleiten überlebt. Die vierte überlebt sie auch. Wenn wir’s richtig machen.'],
      ]));
    },
  },
  irmgard: {
    name: 'Irmgard', look: LOOKS.irmgard,
    talk() {
      if (Game.flag('ending')) { Game.say([['Irmgard', 'Fünf Regeln, Azubi. Vergiss sie nie.'], ['Irmgard', '… Und bring mir den Schlüssel zurück, wenn du fertig bist.']]); return; }
      if (!Game.flag('gotKey')) {
        if (!Game.flag('met_irmgard')) {
          Game.set('met_irmgard');
          Game.say([['Irmgard', 'Lager. Ausgabe nur gegen Materialschein.'], ['Irmgard', '… Ach. Du bist der Azubi vom Brandl. Er hat gesagt, dass du kommst.']], () => NPC.irmgard.keyAsk());
          return;
        }
        NPC.irmgard.keyAsk();
        return;
      }
      hintMenu('Irmgard', () => storyLine('Irmgard', [
        ['Ich hör nachts Schritte zwischen den Regalen. Ratten haben keine Arbeitsschuhe.'],
        ['Ich bin seit 1987 hier. Ich hab drei Geschäftsführer überlebt. Den Falk überleb ich auch.'],
        ['Der LS-Schalter, der in der Halle fehlt? Den hab ich nicht rausgegeben. Der war einfach weg. Wie so vieles in letzter Zeit.'],
      ]));
    },
    keyAsk() {
      Game.ask('Den Schaltraumschlüssel? Den kriegt nur, wer die fünf Sicherheitsregeln kann. In der richtigen Reihenfolge.', [
        { t: 'Ich sag sie dir auf.', f: () => Game.puzzle('sicherheit') },
        { t: 'Später.', f: () => Game.say([['Irmgard', 'Dann lern. Der Aushang in der Umkleide hilft dir – ein bisschen.']]) },
      ], 'Irmgard');
    },
  },
  dragan: {
    name: 'Dragan', look: LOOKS.dragan,
    talk() {
      if (Game.flag('ending')) { Game.say([['Dragan', 'Na? Hast du’s doch geschafft. Ohne dass ich dir die Hand halten musste.'], ['Dragan', 'Und ja – das Multimeter kannst behalten. Für die Berufsschule.']]); return; }
      if (!Game.flag('met_dragan')) {
        Game.set('met_dragan');
        Game.say([
          ['Dragan', 'Wer … ? Ah. Brandls Azubi. Hat er dich geschickt, um mich zu kontrollieren?'],
          ['Dragan', 'Dragan. Betriebselektriker. Nachtbereitschaft, falls es dich interessiert.'],
          ['Dragan', 'Und ja, ich riech nach Schnaps. Das ist Kräutertee. Mit Schuss. Geht dich nix an.'],
          ['Dragan', '… Du willst die Halle wieder zum Laufen bringen? Allein? Hm.'],
          ['Dragan', 'Da. Mein Multimeter und der Gerätetester. Wennst was kaputt machst, zahlst du. Und wennst nicht weiterweißt, komm runter.'],
        ], () => { Game.give('multimeter'); Game.give('geraetetester', true); Game.toast('Erhalten: Gerätetester'); });
        return;
      }
      if (G.files.includes('sabotage') && !Game.flag('dragan_kow')) {
        Game.set('dragan_kow');
        Game.say([['Dragan', 'Kowalskis Liste? Zeig her.'], ['Dragan', '… Dieser Hund. Den FI in der Werkstatt hat er auch manipuliert. Der Alois hätte tot sein können.'], ['Dragan', 'Du denkst, ich steck mit drin, oder? Der Falk war bei mir, ja. Hat mir einen Umschlag hingelegt. Ich hab ihn rausgeworfen. Glaub’s oder lass es.']]);
        return;
      }
      hintMenu('Dragan', () => storyLine('Dragan', [
        ['Der Falk war vor zwei Wochen hier unten. Feiner Anzug, teure Schuhe. Hat mir einen Umschlag auf den Tisch gelegt.', 'Was drin war? Geht dich nix an. Ich hab ihn jedenfalls nicht behalten.'],
        ['Kowalski hat sich einen Schlüssel fürs Kellergitter nachmachen lassen. Hab ich dem Brandl gesagt. Der hat nur genickt.'],
        ['Ich hab hier 1999 angefangen. Damals waren im Keller sechs Elektriker. Jetzt bin nur noch ich da. Und die Ratten.'],
        ['Weißt, was der häufigste Fehler von Azubis ist? Messen, ohne nachzudenken. Erst überlegen: Was will ich messen, wie muss das Gerät dran?'],
      ]));
    },
  },
  brandl: {
    name: 'Meister Brandl', look: LOOKS.brandl,
    talk() { Game.say([['Brandl', 'Geh heim und schlaf dich aus, Azubi. Am Montag fängst du richtig an.'], ['Brandl', 'Tagschicht. Versprochen.']]); },
  },
};

// ------------------------------------------------------------
//  Finale
// ------------------------------------------------------------
const ENDING = {
  run() {
    Game.set('ending');
    G.ver++;
    Snd.play('machine'); Snd.setMood(1, true);
    Game.flash = 1;
    Game.say([
      'Du drückst den grünen Taster. Ein Ruck geht durch die Halle.',
      'Der Bandmotor brummt an. Die Presse stampft im Takt. Das Band setzt sich in Bewegung – genau 350 Umdrehungen an der Welle.',
      'Über dir springen die letzten Hallenlampen an. Die Halle sieht plötzlich … aus wie eine Fabrik.',
      ['Schorsch', 'Ja leck mich doch … ES LÄUFT!'],
      'Das Rolltor rattert nach oben. Draußen dämmert es. Im Gegenlicht steht eine Gestalt im weißen Kittel.',
      ['Brandl', 'Gut gemacht, Azubi.'],
      ['Brandl', 'Ich lag die halbe Nacht hinterm Rolltor auf der Lauer. Vor einer Stunde kam Kowalski mit einem Seitenschneider – wollte dir die Steuerleitung kappen.'],
      ['Brandl', 'Die Polizei hat ihn draußen am Tor erwischt. In der Tasche: unser LS-Schalter, ein Zahnrad mit 72 Zähnen – und ein Umschlag von der Falk Grundbesitz.'],
      ['Dragan', 'Und seine Liste aus dem Keller liegt schon bei der Polizei. Die hat der Azubi gefunden.'],
      ['Brandl', 'Die Frühschicht kommt gleich. Bis Montag schaffen wir die zweitausend Gehäuse locker.'],
      ['Brandl', 'Weißt du, warum ich dich geschickt hab? Weil du noch weißt, was im Tabellenbuch steht. Und weil du nicht in einen Schrank langst, bevor du freigeschaltet hast.'],
      ['Brandl', 'Probezeit bestanden, würd ich sagen.'],
    ], () => ENDING.zeugnis());
  },
  zeugnis() {
    const m = G.mistakes;
    const note = m <= 2 ? 1 : m <= 5 ? 2 : m <= 9 ? 3 : m <= 14 ? 4 : m <= 20 ? 5 : 6;
    const txt = ['', 'sehr gut', 'gut', 'befriedigend', 'ausreichend', 'mangelhaft', 'ungenügend'][note];
    const mins = Math.floor(G.time / 60);
    const p = Game.modal(`<div class="doc zeugnis"><h2>Beurteilung Nachtschicht</h2>
      <p class="center"><b>Werk Kessler Antriebstechnik</b> · Ausbildungsberuf Mechatroniker/-in · 1. Ausbildungsjahr</p>
      <table class="tb">
        <tr><td>Spielzeit</td><td>${mins} min</td></tr>
        <tr><td>Fehler bei Aufgaben</td><td>${m}</td></tr>
        <tr><td>Stromschläge</td><td>${G.zaps}</td></tr>
        <tr><td>Verbandpäckchen benutzt</td><td>${G.heals}</td></tr>
        <tr><td><b>Gesamtnote</b></td><td><b>${note} (${txt})</b></td></tr>
      </table>
      <p><b>Nachgewiesene Kompetenzen:</b></p>
      <ul>
        <li>5 Sicherheitsregeln (DIN VDE 0105-100) angewendet</li>
        <li>Leistung und Strom berechnet, Leitungsschutzschalter ausgewählt (LF 3)</li>
        <li>Kernlochdurchmesser und Drehzahl bestimmt, Unfallverhütung an der Bohrmaschine (LF 2)</li>
        <li>Innengewinde mit Handgewindebohrern gefertigt (LF 2)</li>
        <li>Übersetzung eines Zahnradgetriebes berechnet (LF 1)</li>
        <li>Pneumatischen Steuerkreis mit 5/2-Wegeventil und Zweidruckventil aufgebaut (LF 4)</li>
        <li>LED-Vorwiderstand berechnet und Farbcode gelesen (LF 3)</li>
        <li>Messschieber mit Nonius abgelesen (LF 2)</li>
        <li>Verknüpfungssteuerung mit Selbsthaltung entworfen (LF 4)</li>
        <li>Spannung, Strom und Durchgang mit dem Multimeter gemessen, Leitungsfehler gefunden (LF 3)</li>
        <li>Schutzklasse, Schutzleiter und Fehlerstrom-Schutzschalter geprüft (LF 3)</li>
        <li>Schützschaltung mit Selbsthaltung verdrahtet (LF 3/4)</li>
        <li>Reihen- und Parallelschaltung von Heizwiderständen berechnet (LF 3)</li>
      </ul>
      <p class="note center">ENDE – Danke fürs Spielen!</p>
      <div class="row"><button class="btn stay">Durch die Halle laufen</button><button class="btn nw">Neues Spiel</button></div></div>`, { cls: 'paper', noClose: true });
    p.querySelector('.stay').onclick = () => Game.closeModal();
    p.querySelector('.nw').onclick = () => { Game.closeModal(true); Game.start(false); };
  },
};
