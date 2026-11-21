// Namens- und Wunschfilter: weist Beleidigungen, Obszönes und rechtsextreme Begriffe ab,
// bevor sie auf dem Bildschirm erscheinen. Bewusst vorsichtig gehalten, damit normale Namen
// (Klaus, Scunthorpe, Passau …) nicht hängen bleiben.
//
// Eigene Wörter fügt der DJ in den Einstellungen hinzu ("Eigene gesperrte Wörter").
// Diese Liste lässt sich hier erweitern. Alles klein, ohne Umlaute (ä→a, ß→ss).
(() => {
  // SUB: wird auch mitten in einem Wort erkannt (nur lange, eindeutige Begriffe)
  const SUB = ['arschloch', 'arschgeige', 'wichser', 'hurensohn', 'hurenkind', 'fotze', 'schwuchtel', 'missgeburt', 'scheisse', 'fuck', 'bitch',
    'nigger', 'nigga', 'faggot', 'siegheil', 'heilhitler', 'hitler', 'hakenkreuz', 'kanake', 'schlampe', 'judensau', 'untermensch'];
  // WORD: nur als ganzes Wort
  const WORD = new Set(['arsch', 'kacke', 'kack', 'scheiss', 'shit', 'cunt', 'pussy', 'cock', 'porn', 'porno', 'nazi', 'nazis', 'neonazi', 'nsdap', 'hure', 'nutte',
    'spast', 'spasti', 'mongo', 'behindert', 'penis', 'vagina', 'titten', 'schwanz', 'muschi', 'fick', 'ficken', 'ficker', 'fickt', 'fck', 'fuk', 'fuq', 'wichs',
    'bastard', 'neger', 'zigeuner', 'dildo']);
  const LEET = { 0: 'o', 1: 'i', '!': 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '€': 'e', '+': 't' };

  // Text vereinheitlichen: klein, ohne Umlaute, Zahlen-/Sonderzeichen-Tricks zurückübersetzen (f4ck → fack),
  // lange Wiederholungen kürzen (fuuuck → fuck), einzeln getippte Buchstaben zusammenziehen (f u c k → fuck)
  function parts(text) {
    let s = String(text || '').toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
    s = s.replace(/[0-9!@$€+]/g, ch => LEET[ch] || ch);
    const raw = s.split(/[^a-z]+/).filter(Boolean).map(t => t.replace(/(.)\1{2,}/g, '$1'));
    const toks = []; let run = '';
    for (const t of raw) { if (t.length === 1) run += t; else { if (run) { toks.push(run); run = ''; } toks.push(t); } }
    if (run) toks.push(run);
    return { toks, compact: toks.join('') };
  }
  const custom = list => String(list || '').split(/[,;\n]+/).map(w => parts(w).compact).filter(w => w.length >= 2);

  // Wahr, wenn der Text nicht auf den Bildschirm soll
  function bad(text, extra) {
    const { toks, compact } = parts(text);
    if (!compact) return false;
    if (SUB.some(w => compact.includes(w))) return true;
    if (toks.some(t => WORD.has(t))) return true;
    return custom(extra).some(w => w.length >= 4 ? compact.includes(w) : toks.includes(w));
  }
  window.KK_FILTER = { bad };
})();
