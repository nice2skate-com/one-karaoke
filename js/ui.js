/* DJ KOLJA ONE · Karaoke — Oberflächen: DJ-Konsole, Bühnenbild, Kiosk, Gäste-Handy */
(() => {
'use strict';
const { P, MOCK, LS, lc, clean, slug, fmtDur, rndCode, cfg, saveCfg, cloud, eventCode, bookList, bookFind, bookSetVid, bookAddCustom,
  bookRemoveCustom, bookData, waitMin, parseVid, parseMedia, isFile, fileName, fileMeta, localVideos, thumb, cleanTitle, ytTitle, loadYT, LocalStore, RemoteStore, dj, cloudBook, playStats, canEditBook, keyOk, clampKey, quizFind, quizOf, quizFiles, quizOrder, gameView, listDir, parsePlaylistId, ytPlaylist, ytVideoInfo, matchPlaylist, quotaUsed, WHY, CID } = window.KK;
const VIEW = P.get('v') || 'home';
const BUS_TEST = P.get('bus') === 'bc';
const $ = (s, r) => (r || document).querySelector(s);

function h(tag, a, ...kids) {
  const e = document.createElement(tag);
  if (a) for (const k in a) {
    const v = a[k]; if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else if (k in e && k !== 'list') { try { e[k] = v; } catch (_) { e.setAttribute(k, v); } }
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(9)) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
function put(el, ...kids) { el.replaceChildren(...kids.flat(9).filter(k => k != null && k !== false)); }
const ICON = {
  play: 'M8 5v14l11-7z', pause: 'M6 5h4v14H6zM14 5h4v14h-4z', next: 'M6 5l9 7-9 7zM17 5h2v14h-2z', restart: 'M18 5l-9 7 9 7zM5 5h2v14H5z',
  stop: 'M6 6h12v12H6z', up: 'M12 7l7 9H5z', down: 'M12 17l7-9H5z', top: 'M5 4h14v2H5zM12 9l7 9H5z',
  edit: 'M4 17.5V20h2.5L17 9.5 14.5 7zM16 5.5L18.5 8l1.3-1.3a1 1 0 000-1.4l-1.1-1.1a1 1 0 00-1.4 0z',
  x: 'M6 7.4L7.4 6 12 10.6 16.6 6 18 7.4 13.4 12 18 16.6 16.6 18 12 13.4 7.4 18 6 16.6 10.6 12z',
  check: 'M9.5 16.2L5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z', star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  video: 'M4 6h11a1 1 0 011 1v3l4-3v10l-4-3v3a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z', again: 'M12 5V2L7 6l5 4V7a5 5 0 11-5 5H5a7 7 0 107-7z'
};
const ico = n => h('span', { class: 'ico', html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICON[n] + '"/></svg>' });
const tImg = vid => isFile(vid) ? h('div', { class: 'noimg file' }, 'Datei') : h('img', { src: thumb(vid), alt: '', loading: 'lazy' });
const mediaUrl = vid => isFile(vid) ? vid : 'https://www.youtube.com/watch?v=' + vid;
const LOBBY_MS = 60000;
// Bilder zu Quiz und Fragen: Ordner quiz/bilder/, Dateiname <Quiz-Kennung>.jpg oder <Quiz-Kennung>-<Fragenummer>.jpg
const QIMGS = {}; listDir('quiz/bilder/', /\.(jpe?g|png|webp)$/i).then(l => l.forEach(f => { QIMGS[slug(fileName(f).replace(/\.[a-z]+$/i, ''))] = f; }));
const qImg = (id, n) => (n != null && QIMGS[slug(id + '-' + n)]) || QIMGS[slug(id)] || '';
// Musik für die Anmeldezeit: ein Stück, dessen Dateiname zum Thema passt (Interpret aus den Antworten), sonst "lobby…", sonst irgendeines
function lobbyMusic(g) {
  const named = QFILES.find(f => /^lobby/i.test(fileName(f))); if (g.cq) return named || '';
  const qz = quizFind(g.id), keys = qz ? qz.q.map(q => slug(q[1])).concat(slug(qz.title)).filter(k => k.length > 2) : [];
  const fit = QFILES.filter(f => { const n = slug(fileName(f)); return keys.some(k => n.includes(k)); });
  return fit.length ? fit[Math.floor(Math.random() * fit.length)] : named || (QFILES.length ? QFILES[Math.floor(Math.random() * QFILES.length)] : '');
}
let QFILES = []; const qfilesReady = quizFiles().then(l => { QFILES = l; return l; });
// Runde "Song erkennen" aus den eigenen Dateien zusammenstellen
function musicRound(n) {
  const mix = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  const label = f => { const m = fileMeta(f); return m.t + (m.a ? ' – ' + m.a : ''); };
  const pool = [...new Set(QFILES.map(label).concat(bookList().map(b => b.t + ' – ' + b.a)))];
  return mix(QFILES).slice(0, n).map(f => { const c = label(f); return { f, c, w: mix(pool.filter(x => x !== c)).slice(0, 3) }; });
}
let FILES = []; const filesReady = localVideos().then(l => { FILES = l; return l; });
const keyLabel = k => (k > 0 ? '+' : k < 0 ? '−' : '±') + Math.abs(k || 0);
// Rechtliche Fußzeile: Impressum und Datenschutz (Adressen aus config.js) und ein kurzer, sachlicher Hinweis zur Datenverarbeitung
const LEGAL = (window.KK_CONFIG && window.KK_CONFIG.legal) || {};
const legalLink = u => /^https:\/\//.test(u || '') ? u : '';
function privacyNote() {
  const dp = legalLink(LEGAL.datenschutz);
  modal('Hinweis zur Datenverarbeitung', h('div', { class: 'stack legalnote' },
    h('p', null, 'Dieses Karaoke-System verarbeitet nur, was für den Abend nötig ist:'),
    h('ul', null,
      h('li', null, h('b', null, 'Eingaben: '), 'Der Name, den Sie eingeben, Ihre Songwünsche sowie Antworten und Stimmen bei Spielen werden über einen Nachrichtenkanal (Supabase, Rechenzentrum Frankfurt) an das System des DJs übertragen und auf dem Bildschirm vor Ort gezeigt. Dabei werden sie nicht in einer Datenbank gespeichert.'),
      h('li', null, h('b', null, 'Auf Ihrem Gerät: '), 'Ihr Name und eine zufällige Gerätekennung bleiben im Browser Ihres Handys gespeichert, damit Sie nicht alles erneut eingeben müssen und Ihre Wünsche Ihnen zugeordnet werden. Cookies, Werbung oder Tracking-Dienste setzt die App nicht ein.'),
      h('li', null, h('b', null, 'Beim DJ: '), 'Die Liste mit Namen bleibt im Browser des DJ-Rechners, bis der DJ sie am Ende des Abends löscht. In der Auswertung werden nur Titel und Interpret gezählt, keine Namen.'),
      h('li', null, h('b', null, 'YouTube: '), 'Nur wenn die freie Suche aktiviert ist, werden Vorschaubilder von YouTube geladen; dabei wird Ihre IP-Adresse an Google übermittelt.'),
      h('li', null, h('b', null, 'Auslieferung der Seite: '), 'Die Seite wird über Cloudflare ausgeliefert; dabei können technisch notwendige Zugriffsdaten (z. B. IP-Adresse) anfallen.')),
    h('p', null, 'Verantwortlich ist der Betreiber (siehe Impressum).' + (dp ? '' : ' Weitere Informationen stehen in der Datenschutzerklärung des Betreibers.')),
    dp ? h('a', { class: 'btn', href: dp, target: '_blank', rel: 'noopener' }, 'Zur Datenschutzerklärung ↗') : null));
}
function legalFoot(extra) {
  const im = legalLink(LEGAL.impressum), dp = legalLink(LEGAL.datenschutz);
  return h('footer', { class: 'foot' }, extra || null,
    h('div', { class: 'legal' }, im ? h('a', { href: im, target: '_blank', rel: 'noopener' }, 'Impressum') : null, dp ? h('a', { href: dp, target: '_blank', rel: 'noopener' }, 'Datenschutz') : null,
      h('button', { class: 'linkbtn', onclick: privacyNote }, 'Hinweis zur Datenverarbeitung')),
    h('div', null, 'ONE — aus einer Hand. Einmalig erlebt.'));
}
// Event-Branding: Kundenlogo (wahlweise auf hellem Grund) neben dem DJ-Logo
function custLogo(store, cls) {
  const src = store.brand && store.brand(); if (!src) return null;
  const plate = !store.state || store.state.settings.logoPlate !== false;
  return h('span', { class: 'cust' + (plate ? ' plate' : '') + (cls ? ' ' + cls : '') }, h('img', { src, alt: 'Logo des Gastgebers' }));
}
function brandLock(store, size) { const c = custLogo(store, size); return c ? h('div', { class: 'lockup ' + (size || '') }, logo(size), h('i', { class: 'lockdiv' }), c) : logo(size); }
// Zahlen und Top-Songs des Abends aus dem Verlauf dieses Raums
function evening(s) {
  const sung = (s.history || []).filter(x => x.sung), by = {};
  for (const x of sung) { const k = lc(x.t) + '|' + lc(x.a); const e = by[k] || (by[k] = { t: x.t, a: x.a, n: 0, ts: 0 }); e.n++; e.ts = Math.max(e.ts, x.ts || 0); }
  return { perf: sung.length, singers: new Set(sung.map(x => lc(x.name))).size, songs: Object.keys(by).length, top: Object.values(by).sort((a, b) => b.n - a.n || b.ts - a.ts).slice(0, 5) };
}
// CSV-Datei speichern (Semikolon für deutsches Excel, Formeln entschärft)
function csvDownload(name, rows) {
  const esc = v => { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[;"\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const a = h('a', { href: URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(esc).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' })), download: name });
  document.body.append(a); a.click(); a.remove();
}
const fileDay = () => new Date().toISOString().slice(0, 10);
const songLine = e => e.t + (e.a ? ' · ' + e.a : '');
const logo = cls => h('img', { class: 'logo ' + (cls || ''), src: 'assets/logo.svg', alt: 'DJ KOLJA ONE' });
function toast(msg, kind) {
  if (!msg) return;
  const box = $('#toasts') || document.body.appendChild(h('div', { id: 'toasts' }));
  const t = h('div', { class: 'toast ' + (kind || '') }, msg); box.append(t);
  setTimeout(() => t.classList.add('out'), 3400); setTimeout(() => t.remove(), 3900);
}
function modal(title, body, opt) {
  opt = opt || {};
  const ov = h('div', { class: 'ov' });
  const close = () => { ov.remove(); if (opt.onClose) opt.onClose(); };
  ov.append(h('div', { class: 'modal' + (opt.wide ? ' wide' : '') },
    h('div', { class: 'mhead' }, h('h3', null, title), opt.noClose ? null : h('button', { class: 'btn ghost icon', onclick: close, title: 'Schließen' }, ico('x'))),
    h('div', { class: 'mbody' }, body)));
  if (!opt.noClose) ov.addEventListener('pointerdown', e => { if (e.target === ov) close(); });
  document.body.append(ov);
  return { close };
}
function confirmDlg(text, yes, fn) {
  const m = modal('Bitte bestätigen', h('div', null, h('p', null, text), h('div', { class: 'row end' },
    h('button', { class: 'btn', onclick: () => m.close() }, 'Abbrechen'), h('button', { class: 'btn primary', onclick: () => { m.close(); fn(); } }, yes))));
}
function link(v, r, extra) {
  const q = new URLSearchParams(); if (v) q.set('v', v); if (r) q.set('r', r);
  if (MOCK) q.set('mock', '1'); if (BUS_TEST) q.set('bus', 'bc');
  for (const k in (extra || {})) q.set(k, extra[k]);
  return location.pathname + '?' + q;
}
const isLocalhost = /^(localhost|127\.|\[::1\])/.test(location.hostname) || location.protocol === 'file:';
function guestUrl(store) {
  if (!store.local || !cloud.on) return '';
  const pubUrl = ((window.KK_CONFIG || {}).publicUrl || '').trim();
  if (isLocalhost && !BUS_TEST) return pubUrl ? pubUrl.replace(/[?#].*$/, '') + '?v=g&r=' + store.room : '';
  return location.origin + link('g', store.room, BUS_TEST ? { remote: 1 } : null);
}
const qrCache = {};
function qrBox(text, cls) {
  if (!qrCache[text]) { const q = window.qrcode(0, 'M'); q.addData(text); q.make(); qrCache[text] = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); }
  return h('div', { class: 'qr ' + (cls || ''), html: qrCache[text] });
}
function field(label, input, help) { return h('label', { class: 'field' }, h('span', { class: 'lbl' }, label), input, help ? h('small', null, help) : null); }
function toggle(label, checked, onchange, help) {
  const inp = h('input', { type: 'checkbox', checked: !!checked, onchange: e => onchange(e.target.checked) });
  const el = h('label', { class: 'tog' }, inp, h('span', { class: 'sw' }), h('span', { class: 'tl' }, label, help ? h('small', null, help) : null));
  el.set = v => { inp.checked = !!v; }; return el;
}

// ============ Spiele: Battle und Quiz ============
const LETTERS = ['A', 'B', 'C', 'D'];
const pct = (a, b) => a + b ? Math.round(a / (a + b) * 100) : 50;
function topList(top, n) { return h('ol', { class: 'toplist' }, top.slice(0, n).map((x, i) => h('li', null, h('span', { class: 'num' }, i + 1), h('span', { class: 'grow' }, x.name), h('b', null, x.p)))); }
// Platzwechsel-Zeichen und Rangliste (wie bei Kahoot): Platz, Name, Punkte der Runde, Wechsel, Gesamtpunkte
const mvMark = mv => h('span', { class: 'mv ' + (mv > 0 ? 'up' : mv < 0 ? 'down' : '') }, mv > 0 ? '▲' : mv < 0 ? '▼' : '–');
function scoreboard(rank, n, me, big) {
  const rows = rank.slice(0, n), mine = me && rank.find(x => x.k === me), extra = mine && !rows.includes(mine);
  const li = x => h('li', { class: x.k === me ? 'me' : '' }, h('span', { class: 'num' }, x.r), h('span', { class: 'grow' }, x.name), x.d ? h('em', { class: 'dlt' }, '+' + x.d) : null, x.st >= 2 ? h('span', { class: 'streak', title: x.st + ' richtige in Folge' }, x.st + '×') : null, mvMark(x.mv), h('b', null, x.p));
  return h('ol', { class: 'toplist board' + (big ? ' big' : '') }, rows.map(li), extra ? [h('li', { class: 'gap' }, '…'), li(mine)] : null);
}
// Siegerpodest: Platz 1 in der Mitte, 2 links, 3 rechts; die Säulen wachsen nacheinander
function podium(rank, small) {
  // Nach Position, nicht nach Platznummer: Bei Punktgleichstand stehen beide auf dem Podest (mit gleicher Platznummer)
  return h('div', { class: 'podium' + (small ? ' small' : '') }, [[2, rank[1]], [1, rank[0]], [3, rank[2]]].map(([pos, x]) => h('div', { class: 'pcol p' + pos },
    x ? [h('div', { class: 'pname' }, x.name), h('div', { class: 'ppts' }, x.p + ' Punkte')] : null, h('div', { class: 'pbar' + (x ? '' : ' empty') }, h('b', null, x ? x.r : pos)))));
}
function quizGrid(g, reveal, onPick, picked) {
  const qz = quizOf(g), q = qz.q[g.qi], o = quizOrder(g.id + g.at, g.qi);
  return h('div', { class: 'qgrid' }, o.map((orig, pos) => h(onPick ? 'button' : 'div', { class: 'qa' + (reveal && orig === 0 ? ' ok' : '') + (picked === orig ? ' picked' : '') + (reveal && picked === orig && orig !== 0 ? ' wrong' : ''), disabled: onPick && (reveal || picked != null) ? true : null, onclick: onPick ? () => onPick(orig) : null },
    h('b', null, LETTERS[pos]), h('span', null, q[1 + orig]), reveal && g.dist ? h('i', { class: 'cnt' }, g.dist[orig]) : null)));
}
// Karte für Bühnenbild und Kiosk
function gameCard(g, gUrl, T, onPick, picked, o) {
  o = o || {};
  const endBtn = o.onEnd ? h('button', { class: 'btn ghost endq', onclick: o.onEnd }, 'Quiz beenden') : null;
  const qr = gUrl ? h('div', { class: 'gameqr' }, qrBox(gUrl, 'small'), h('span', null, T('Mit dem Handy mitmachen', 'Mit dem Handy mitmachen'))) : null;
  if (g.type === 'battle') {
    const pa = pct(g.ca, g.cb), res = g.phase === 'result', win = g.ca === g.cb ? '' : g.ca > g.cb ? g.a : g.b;
    return [h('div', { class: 'eyebrow' }, res ? 'Battle · Ergebnis' : 'Battle'),
      res ? h('h1', null, win || 'Unentschieden') : h('h1', { class: 'soft' }, g.a, h('em', { class: 'vs' }, ' gegen '), g.b),
      res ? h('div', { class: 'bars' }, [[g.a, pa, g.ca], [g.b, 100 - pa, g.cb]].map(([n, p, c]) => h('div', { class: 'bar' }, h('span', null, n), h('i', { style: 'width:' + p + '%' }), h('b', null, p + ' % · ' + c)))) : h('p', { class: 'sub' }, T('Wer hat euch mehr begeistert? Jetzt abstimmen.', 'Wer hat Sie mehr begeistert? Jetzt abstimmen.')),
      res ? null : h('p', { class: 'sub small' }, (g.ca + g.cb) + ' Stimmen'), res ? null : qr];
  }
  const qz = quizOf(g); if (!qz) return [h('p', { class: 'sub' }, 'Quiz wird geladen …')];
  if (g.phase === 'end') return [h('div', { class: 'eyebrow' }, 'Quiz · ' + qz.title + ' · Endstand'), h('h1', { class: 'soft' }, g.rank.length ? T('Das Siegerpodest', 'Das Siegerpodest') : 'Danke fürs Mitspielen'), g.rank.length ? podium(g.rank) : null, g.rank.length > 3 ? scoreboard(g.rank.slice(3), 4, null) : null, endBtn];
  if (g.phase === 'lobby') {
    const left = Math.max(0, Math.ceil((LOBBY_MS - (Date.now() - g.pAt)) / 1000)), img = qImg(g.id);
    return [h('div', { class: 'eyebrow' }, 'Quiz · ' + qz.title), img ? h('img', { class: 'qimg', src: img, alt: '' }) : null, h('h1', { class: 'soft' }, T('Gleich geht es los – meldet euch an', 'Gleich geht es los – melden Sie sich an')),
      h('div', { class: 'lobby' }, h('div', { class: 'count' }, left), qr || h('p', { class: 'sub small' }, T('Antworten könnt ihr direkt am Bildschirm.', 'Antworten können Sie direkt am Bildschirm.'))),
      h('p', { class: 'sub small' }, (g.names || []).length ? (g.names.length + ' dabei: ' + g.names.slice(0, 12).join(' · ')) : T('Noch niemand angemeldet.', 'Noch niemand angemeldet.')),
      o.onBegin ? h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: o.onBegin }, 'Sofort starten'), endBtn) : endBtn];
  }
  const reveal = g.phase === 'reveal', qpic = qz.music ? '' : qImg(g.id, g.qi + 1);
  const left = g.auto && !reveal && g.qAt ? Math.max(0, 20 - (Date.now() - g.qAt) / 1000) : 0;
  if (g.phase === 'board') return [h('div', { class: 'eyebrow' }, 'Quiz · ' + qz.title + ' · nach Frage ' + (g.qi + 1) + ' von ' + qz.q.length), h('h1', { class: 'soft' }, 'Zwischenstand'),
    g.rank.length ? scoreboard(g.rank, 5, null, true) : h('p', { class: 'sub' }, 'Noch keine Punkte.'), endBtn];
  if (reveal) return [h('div', { class: 'eyebrow' }, 'Quiz · ' + qz.title + ' · Auflösung Frage ' + (g.qi + 1) + ' von ' + qz.q.length), h('h1', { class: 'soft q' }, qz.q[g.qi][0]),
    quizGrid(g, true, onPick, picked), h('p', { class: 'sub small' }, g.right + ' von ' + g.count + ' richtig'), endBtn];
  return [h('div', { class: 'eyebrow' }, 'Quiz · ' + qz.title + ' · Frage ' + (g.qi + 1) + ' von ' + qz.q.length), qpic ? h('img', { class: 'qimg', src: qpic, alt: '' }) : null, h('h1', { class: 'soft q' }, (qz.music && !reveal ? '♪  ' : '') + qz.q[g.qi][0]), quizGrid(g, reveal, onPick, picked),
    left ? h('div', { class: 'qtime' }, h('i', { style: 'animation-duration:20s;animation-delay:-' + (20 - left).toFixed(1) + 's' })) : null,
    h('p', { class: 'sub small' }, g.count + ' Antworten'), qr, endBtn];
}

// ============ Player ============
// Eigene Videodatei – gleiche Schnittstelle wie der YouTube-Player
class FilePlayer {
  constructor(box, ev, controls) {
    this.st = -1; const v = this.v = h('video', { class: 'filevid', playsInline: true, preload: 'auto', controls: !!controls }); v.style.display = 'none'; box.append(v);
    const set = st => { this.st = st; ev.onStateChange({ data: st }); };
    v.addEventListener('loadedmetadata', () => { if (this.st === -1) set(5); });
    v.addEventListener('playing', () => set(1));
    v.addEventListener('pause', () => { if (this.st === 1 && !v.ended) set(2); });
    v.addEventListener('ended', () => set(0));
    v.addEventListener('error', () => { if (v.getAttribute('src')) ev.onError({ data: 'Datei' }); });
  }
  show(b) { this.v.style.display = b ? '' : 'none'; }
  cueVideoById(src) { this.st = -1; this.v.src = src; this.v.load(); if (this.node) this.node.port.postMessage({ reset: true }); }
  playVideo() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => { }); const p = this.v.play(); if (p) p.catch(() => { }); }
  // Tonart: Ton der Datei läuft durch ein Echtzeit-Modul; bei 0 Halbtönen direkt, ohne Verzögerung
  async setKey(k) {
    k = k || 0; if (k === this.key) return; this.key = k;
    if (!k && !this.ctx) return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC();
        await this.ctx.audioWorklet.addModule('js/pitch-worklet.js');
        this.srcNode = this.ctx.createMediaElementSource(this.v);
        this.node = new AudioWorkletNode(this.ctx, 'kk-pitch', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
        this.node.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });
      this.node.port.postMessage({ semitones: this.key, reset: true });
      this.srcNode.disconnect();
      this.srcNode.connect(this.key ? this.node : this.ctx.destination);
    } catch (e) { console.warn('Tonart:', e.message); }
  }
  pauseVideo() { this.v.pause(); }
  stopVideo() { this.st = -1; this.v.pause(); this.v.removeAttribute('src'); this.v.load(); }
  seekTo(t) { try { this.v.currentTime = t; } catch (e) { /* noch nicht geladen */ } }
  setVolume(x) { this.v.volume = Math.max(0, Math.min(1, x / 100)); }
  getCurrentTime() { return this.v.currentTime || 0; }
  getDuration() { return isFinite(this.v.duration) ? this.v.duration : 0; }
  getPlayerState() { return this.st; }
}
class Player {
  constructor(box, store, opt) {
    this.store = store; this.opt = opt || {}; this.key = null; this.p = null; this.yt = null; this.ytReady = false; this.waitingYT = false; this.seekN = null; this.wantSince = 0;
    this.blocked = false; this.live = false; this.onBlocked = () => { };
    const events = be => ({ onStateChange: e => { if (this.p === be()) this.onState(e.data); }, onError: e => { if (this.p === be()) this.report('error', e.data); } });
    this.ytWrap = h('div'); const slot = h('div'); this.ytWrap.append(slot); box.append(this.ytWrap);
    this.fp = new FilePlayer(box, events(() => this.fp), this.opt.controls);
    loadYT().then(YT => {
      const ev = events(() => this.yt); ev.onReady = () => { this.ytReady = true; this.sync(this.store.state); };
      this.yt = new YT.Player(slot, {
        width: '100%', height: '100%',
        playerVars: { autoplay: 0, controls: this.opt.controls ? 1 : 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, fs: 0, disablekb: 1, hl: 'de', origin: location.origin },
        events: ev
      });
    });
    store.on(s => this.sync(s));
    setInterval(() => this.tick(), 500);
  }
  get ready() { return !this.waitingYT; }
  report(st, err) { this.store.dispatch('status', { st, err, key: this.key }, { from: 'player' }); }
  setBlocked(b) { if (b !== this.blocked) { this.blocked = b; this.onBlocked(b); } }
  kick() { if (this.p && this.key) this.p.playVideo(); }
  sync(s) {
    if (!s) return;
    const c = s.current, key = c && c.vid ? c.id + ':' + c.vid : null, file = !!key && isFile(c.vid);
    this.waitingYT = !!key && !file && !this.ytReady;
    if (this.waitingYT) { if (this.p) { this.p.stopVideo(); this.p = null; this.key = null; this.fp.show(false); } return; }
    if (key !== this.key) {
      if (this.p) this.p.stopVideo();
      this.p = key ? (file ? this.fp : this.yt) : null; this.fp.show(file); this.ytWrap.style.display = file ? 'none' : '';
      this.key = key; this.live = false; this.seekN = s.play.seek ? s.play.seek.n : null; this.wantSince = 0; this.setBlocked(false);
      if (key) this.p.cueVideoById(c.vid);
    }
    if (!key) return;
    this.p.setVolume(s.play.vol);
    if (this.p === this.fp) this.fp.setKey(keyOk(c.vid) ? clampKey(c.key) : 0);
    if (s.play.seek && s.play.seek.n !== this.seekN) { this.seekN = s.play.seek.n; this.p.seekTo(s.play.seek.to, true); }
    const st = this.p.getPlayerState();
    if (s.play.want === 'play') { if (st !== 1 && st !== 3) { if (!this.wantSince) this.wantSince = Date.now(); this.p.playVideo(); } }
    else { this.wantSince = 0; this.setBlocked(false); if (st === 1 || st === 3) this.p.pauseVideo(); }
  }
  onState(d) {
    if (!this.key) return;
    if (d === 1) { this.live = true; this.wantSince = 0; this.setBlocked(false); this.report('playing'); }
    else if (d === 2) { if (this.live) this.report('paused'); }
    else if (d === 0) { if (this.live) { this.live = false; this.report('ended'); } }
    else if (d === 5) this.report('cued');
  }
  tick() {
    this.store.alive({ t: 'alive', blocked: this.blocked, ready: this.ready });
    if (!this.p || !this.key) return;
    const st = this.p.getPlayerState(), s = this.store.state;
    if (st === 1 || st === 2 || st === 3) this.store.tick({ t: 'tick', cur: this.p.getCurrentTime() || 0, dur: this.p.getDuration() || 0 });
    if (s.play.want === 'play' && st !== 1 && st !== 3 && this.wantSince && Date.now() - this.wantSince > 2500) this.setBlocked(true);
  }
}

// ============ Bühnenbild (auch Teil des Kiosks) ============
function Stage(root, store, opt) {
  opt = opt || {};
  const vidBox = h('div', { class: 'vid' }), card = h('div', { class: 'card' }), hint = h('div', { class: 'hint' }), gov = h('div', { class: 'gameov' }), bar = h('div', { class: 'sbar' }), prog = h('i');
  root.append(h('div', { class: 'stage' + (opt.kiosk ? ' in-kiosk' : '') }, h('div', { class: 'screen' }, vidBox, card, gov, hint), h('div', { class: 'sprog' }, prog), bar));
  const api = { player: null }; window.KKStage = api; // für Diagnose in der Browser-Konsole
  const T = (du, sie) => store.state.settings.formal ? sie : du;
  let key = '', timer = null, hintT = null, lastSnip = '', snipT = null, autoT = null, lobbyT = null, lobbySrc = {}, lastOv = ''; const snip = new Audio(), screenPick = {};
  const showHint = (txt, ms) => { hint.textContent = txt; hint.classList.toggle('show', !!txt); clearTimeout(hintT); if (txt && ms) hintT = setTimeout(() => hint.classList.remove('show'), ms); };
  store.onTick(m => { prog.style.width = m.dur ? Math.min(100, m.cur / m.dur * 100) + '%' : '0'; });

  function start() {
    api.player = new Player(vidBox, store, { controls: !!opt.kiosk });
    api.player.onBlocked = () => render(store.state);
    setTimeout(() => { if (!api.player.ready) showHint('YouTube ist nicht erreichbar – bitte die Internetverbindung prüfen.', 12000); }, 9000);
    store.on(render);
  }
  if (navigator.locks) navigator.locks.request('kk-player-' + store.room, { ifAvailable: true }, lock => {
    if (!lock) { put(card, h('div', { class: 'c' }, logo(), h('p', { class: 'sub' }, 'Der Player für diesen Raum läuft bereits in einem anderen Fenster.'))); card.classList.add('show'); return; }
    start(); return new Promise(() => { });
  }); else start();

  function render(s) {
    const c = s.current, S = s.settings, now = Date.now(), gUrl = guestUrl(store);
    const blocked = api.player && api.player.blocked;
    let mode;
    if (s.last && now - s.last.at < 6500) mode = 'applause';
    else if (!c) mode = 'idle';
    else if (s.now.st === 'error') mode = 'error';
    else if (!c.vid) mode = 'extern';
    else if (c.phase === 'intro' && s.play.want !== 'play') mode = 'intro';
    else if (blocked) mode = 'blocked';
    else mode = 'video';
    // Läuft gerade ein Karaoke-Video, bleibt es sichtbar (der Text wird gebraucht): Das Battle erscheint dann nur als schmale Leiste oben
    const gv = gameView(s.game), over = !!gv && gv.type === 'battle' && mode === 'video';
    if (s.closing && !gv && mode !== 'video' && mode !== 'blocked') mode = 'closing';
    if (gv && !over) mode = 'game';
    const ovKey = over ? [gv.phase, gv.a, gv.b, gv.ca, gv.cb, !!gUrl].join('|') : '';
    if (ovKey !== lastOv) {
      lastOv = ovKey; gov.classList.toggle('show', over);
      if (over) { const res = gv.phase === 'result', pa = pct(gv.ca, gv.cb), win = gv.ca === gv.cb ? '' : gv.ca > gv.cb ? gv.a : gv.b;
        put(gov, h('div', { class: 'gtxt' }, h('b', null, 'Battle'), res ? (win ? win + ' gewinnt · ' + (win === gv.a ? pa : 100 - pa) + ' %' : 'Unentschieden') : gv.a + ' gegen ' + gv.b + ' · ' + (gv.ca + gv.cb) + ' Stimmen'), !res && gUrl ? qrBox(gUrl, 'mini') : null); }
      else put(gov);
    }
    // Musikeinspieler und selbstlaufendes Quiz – nur dieses Fenster spielt ab und zählt die Zeit
    const g0 = s.game, inLobby = g0 && g0.type === 'quiz' && g0.phase === 'lobby';
    if (inLobby && lobbySrc[g0.at] === undefined) lobbySrc[g0.at] = lobbyMusic(g0);
    const snipKey = inLobby ? (lobbySrc[g0.at] ? 'L' + g0.at : '') : g0 && g0.cq && g0.phase === 'q' ? g0.at + ':' + g0.qi + ':' + (g0.playN || 0) : '';
    if (api.player && snipKey !== lastSnip) {
      lastSnip = snipKey; snip.pause(); clearTimeout(snipT);
      if (snipKey) {
        snip.src = inLobby ? lobbySrc[g0.at] : g0.cq[g0.qi].f; snip.loop = !!inLobby;
        snip.onloadedmetadata = () => { const d = snip.duration; try { snip.currentTime = isFinite(d) && d > 70 ? d * 0.3 : 0; } catch (e) { /* Start bei 0 */ } snip.play().catch(() => showHint('Bitte einmal in dieses Fenster klicken, damit der Ton startet.', 7000)); };
        snip.onerror = () => showHint('Die Musikdatei lässt sich nicht abspielen.', 6000);
        if (!inLobby) snipT = setTimeout(() => snip.pause(), 20000);
      }
    }
    clearTimeout(autoT);
    if (api.player && g0 && g0.type === 'quiz' && (g0.auto || inLobby)) {
      const allIn = g0.phase === 'q' && Object.keys(g0.scores).length > 0 && Object.keys(g0.ans).length >= Object.keys(g0.scores).length;
      const wait = inLobby ? LOBBY_MS : g0.phase === 'q' ? (allIn ? Math.min(20000, Date.now() - g0.qAt + 1500) : 20000) : g0.phase === 'reveal' ? 6000 : g0.phase === 'board' ? 7000 : 30000;
      const op = inLobby ? 'begin' : g0.phase === 'q' ? 'reveal' : g0.phase === 'reveal' || g0.phase === 'board' ? 'next' : 'end';
      autoT = setTimeout(() => store.dispatch('game', { op }, { from: 'player' }), Math.max(400, wait - (Date.now() - (g0.pAt || g0.qAt))));
    }
    if (!c) prog.style.width = '0';
    if (s.note && now - s.note.at < 7000 && s.note.at !== render.noteAt) { render.noteAt = s.note.at; showHint(s.note.text, 7000); }

    const lobby = gv && gv.phase === 'lobby'; clearTimeout(lobbyT); if (lobby) lobbyT = setTimeout(() => render(store.state), 1000);
    const k = [mode, S.eventName, S.logoPlate, S.reviewUrl, (store.brand() || '').length, mode === 'closing' && (s.history || []).length, lobby && Math.ceil((LOBBY_MS - (Date.now() - gv.pAt)) / 1000), gv && JSON.stringify(gv), gv && JSON.stringify(screenPick), c && c.id, c && c.name, c && c.t, c && c.vid, c && c.key, s.last && s.last.at, S.autoStart, S.formal, S.signupOpen, gUrl].join('|');
    if (k !== key) {
      key = k; clearTimeout(timer); clearInterval(timer);
      const kids = [];
      if (mode === 'closing') {
        const ev = evening(s), rv = S.reviewUrl;
        kids.push(brandLock(store, 'big'), h('div', { class: 'eyebrow' }, S.eventName || 'Karaoke'), h('h1', null, 'Danke fürs Mitsingen!'),
          ev.perf ? h('p', { class: 'sub' }, ev.perf + (ev.perf === 1 ? ' Auftritt' : ' Auftritte') + ' · ' + ev.singers + (ev.singers === 1 ? ' Stimme' : ' Stimmen') + ' · ' + ev.songs + (ev.songs === 1 ? ' Song' : ' Songs')) : null,
          h('div', { class: 'closerow' }, ev.top.length ? h('div', { class: 'tops' }, h('div', { class: 'eyebrow' }, 'Top-Songs des Abends'), h('ol', { class: 'toplist songs' }, ev.top.map((x, i) => h('li', null, h('span', { class: 'num' }, i + 1), h('span', { class: 'grow' }, x.t, h('em', null, x.a ? ' · ' + x.a : '')), x.n > 1 ? h('b', null, x.n + '×') : null)))) : null,
            rv ? h('div', { class: 'review' }, qrBox(rv), h('span', null, T('Wie hat es euch gefallen? Hier bewerten.', 'Wie hat es Ihnen gefallen? Hier bewerten.'))) : null));
      } else if (mode === 'game') {
        const qk = gv.at + ':' + gv.qi, kq = opt.kiosk && gv.type === 'quiz';
        kids.push(...gameCard(gv, gUrl, T, kq ? i => { screenPick[qk] = i; store.dispatch('answer', { i, name: 'Am Bildschirm' }, { from: 'kiosk', cid: 'bildschirm' }); render(store.state); } : null, opt.kiosk ? screenPick[qk] : undefined,
          kq ? { onEnd: () => store.dispatch('game', { op: 'end' }, { from: 'kiosk' }), onBegin: () => store.dispatch('game', { op: 'begin' }, { from: 'kiosk' }) } : null).filter(Boolean));
      }
      else if (mode === 'applause') {
        kids.push(h('div', { class: 'eyebrow' }, 'Applaus für'), h('h1', null, s.last.name), h('p', { class: 'sub' }, songLine(s.last)));
        timer = setTimeout(() => render(store.state), s.last.at + 6600 - now);
      } else if (mode === 'idle') {
        kids.push(brandLock(store, 'big'), h('div', { class: 'eyebrow' }, S.eventName ? 'Karaoke · ' + S.eventName : 'Karaoke'),
          h('h1', { class: 'soft' }, opt.kiosk ? T('Such dir deinen Song aus.', 'Suchen Sie sich Ihren Song aus.') : T('Die Bühne gehört euch.', 'Die Bühne gehört Ihnen.')));
        if (!S.signupOpen) kids.push(h('p', { class: 'sub' }, 'Die Anmeldung ist gerade geschlossen.'));
        else if (gUrl) kids.push(h('div', { class: 'qrrow' }, qrBox(gUrl), h('ol', { class: 'steps' }, h('li', null, 'QR-Code scannen'), h('li', null, 'Namen eintragen, Song wählen'), h('li', null, T('Aufgerufen werden – und singen', 'Aufgerufen werden – und singen')))));
        else kids.push(h('p', { class: 'sub' }, opt.kiosk ? 'Namen eintragen, Titel wählen – schon geht es los.' : T('Euren Songwunsch nimmt der DJ gern entgegen.', 'Ihren Songwunsch nimmt der DJ gern entgegen.')));
      } else if (mode === 'intro' || mode === 'extern' || mode === 'error') {
        kids.push(h('div', { class: 'eyebrow' }, mode === 'extern' && c.phase === 'live' ? 'Jetzt singt' : mode === 'error' ? 'Einen Moment bitte' : opt.kiosk ? 'Jetzt an der Reihe' : 'Als Nächstes auf der Bühne'),
          h('h1', null, c.name), h('p', { class: 'sub' }, c.t + (c.a ? ' · ' + c.a : '')));
        if (c.key && (keyOk(c.vid) || !c.vid)) kids.push(h('p', { class: 'sub small' }, 'Tonart ' + keyLabel(c.key) + ' Halbtöne'));
        if (mode === 'error') kids.push(h('p', { class: 'sub small' }, 'Das Video wird gerade getauscht.'));
        if (mode === 'intro' && opt.kiosk) kids.push(h('button', { class: 'btn primary huge', onclick: () => { store.dispatch('play', {}, { from: 'kiosk' }); if (api.player) api.player.kick(); } }, ico('play'), 'Start'),
          h('p', { class: 'sub small' }, T('Mikrofon in die Hand – und los.', 'Mikrofon in die Hand – und los.')));
        if (mode === 'intro' && S.autoStart > 0 && api.player) {
          const cd = h('p', { class: 'sub small' }); kids.push(cd);
          const target = Math.max(c.at, s.last ? s.last.at + 6600 : 0) + S.autoStart * 1000;
          const step = () => { const left = Math.ceil((target - Date.now()) / 1000); if (left <= 0) { clearInterval(timer); store.dispatch('play', {}, { from: 'player' }); } else cd.textContent = 'Start in ' + left + ' Sekunden'; };
          step(); timer = setInterval(step, 500);
        }
      } else if (mode === 'blocked' && !opt.kiosk) {
        kids.push(h('button', { class: 'btn primary huge', onclick: () => api.player.kick() }, ico('play'), 'Wiedergabe starten'), h('p', { class: 'sub small' }, 'Der Browser verlangt einmalig einen Klick in diesem Fenster.'));
      }
      put(card, h('div', { class: 'c c-' + mode }, kids));
      card.classList.toggle('show', kids.length > 0);
      if (mode === 'blocked' && opt.kiosk) showHint(T('Zum Starten bitte direkt ins Video tippen.', 'Zum Starten bitte direkt ins Video tippen.'));
      else if (hint.textContent && /tippen/.test(hint.textContent)) showHint('');
    }
    // Info-Leiste
    const showBar = S.bar, applause = mode === 'applause';
    bar.classList.toggle('off', !showBar);
    if (showBar) {
      const upcoming = (applause && c ? [c] : []).concat(s.queue).slice(0, 3).map(q => q.name).join('  ·  ');
      put(bar, opt.kiosk ? null : h('div', { class: 'barlogos' }, logo('mini'), custLogo(store, 'mini')),
        h('div', { class: 'lines' },
          h('div', { class: 'ln' }, h('b', null, applause ? 'Applaus' : 'Jetzt'), applause ? h('span', null, s.last.name, h('em', null, '  ' + songLine(s.last))) : c ? h('span', null, c.name, h('em', null, '  ' + songLine(c))) : h('span', { class: 'mut' }, '–')),
          h('div', { class: 'ln' }, S.ticker ? [h('b', null, 'Info'), h('span', null, S.ticker)] : [h('b', null, 'Danach'), h('span', { class: upcoming ? '' : 'mut' }, upcoming || (S.signupOpen ? T('Noch frei – traut euch.', 'Noch frei – trauen Sie sich.') : '–'))])),
        !opt.kiosk && gUrl && S.signupOpen ? h('div', { class: 'join' }, h('span', null, 'Mitsingen'), qrBox(gUrl, 'mini')) : null);
    }
  }
  return api;
}

// ============ Video-Auswahl (Suche / Link) ============
function pickVideo(store, o) {
  const qIn = h('input', { class: 'in', value: o.q || '', placeholder: 'Titel und Interpret' });
  const list = h('div', { class: 'list' });
  const linkIn = h('input', { class: 'in', placeholder: 'YouTube-Link oder Adresse einer Videodatei' });
  const ytA = h('a', { class: 'btn', target: '_blank', rel: 'noopener' }, 'Auf YouTube suchen ↗');
  const setA = () => { ytA.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(qIn.value + ' karaoke'); }; setA(); qIn.addEventListener('input', setA);
  const pick = (vid, dur, title) => { m.close(); o.onPick(vid, dur || 0, title || ''); };
  const localRows = () => {
    const words = slug(qIn.value).split('-').filter(w => w.length > 2);
    const hit = FILES.filter(f => { const n = slug(fileName(f)); return words.length && words.every(w => n.includes(w)); }).slice(0, 6);
    return hit.map(f => h('div', { class: 'vrow' }, tImg(f), h('div', { class: 'grow' }, h('div', { class: 'st' }, fileName(f)), h('div', { class: 'sa' }, 'Eigene Datei')), h('button', { class: 'btn primary', onclick: () => pick(f, 0, '') }, 'Wählen')));
  };
  async function run() {
    await filesReady; const own = store.local ? localRows() : [];
    if (!store.canSearch()) { put(list, own, h('p', { class: 'mut' }, 'Ohne YouTube-API-Schlüssel: auf YouTube suchen, Link kopieren und unten einfügen.')); return; }
    put(list, own, h('p', { class: 'mut' }, 'Suche …'));
    try {
      const items = await store.search(qIn.value);
      put(list, own, ...(items.length ? items.map(i => h('div', { class: 'vrow' },
        tImg(i.vid),
        h('div', { class: 'grow' }, h('div', { class: 'st' }, i.title), h('div', { class: 'sa' }, i.ch + (i.dur ? ' · ' + fmtDur(i.dur) : ''))),
        h('a', { class: 'btn ghost', href: mediaUrl(i.vid), target: '_blank', rel: 'noopener', title: 'Vorab ansehen' }, '↗'),
        h('button', { class: 'btn primary', onclick: () => pick(i.vid, i.dur, i.title) }, 'Wählen'))) : [h('p', { class: 'mut' }, 'Nichts gefunden.')]));
    } catch (e) { put(list, own, h('p', { class: 'warn' }, e.message)); }
  }
  qIn.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  const useLink = () => { const v = parseMedia(linkIn.value); if (!v) return toast('Das ist weder ein YouTube-Link noch eine Videodatei (https://….mp4).', 'warn'); pick(v, 0, ''); };
  linkIn.addEventListener('keydown', e => { if (e.key === 'Enter') useLink(); });
  const m = modal(o.title || 'Karaoke-Video wählen', h('div', { class: 'stack' },
    h('div', { class: 'row' }, qIn, h('button', { class: 'btn primary', onclick: run }, 'Suchen'), ytA),
    list, h('div', { class: 'row' }, linkIn, h('button', { class: 'btn', onclick: useLink }, 'Link übernehmen'))), { wide: true });
  run();
}

// ============ Song-Auswahl (DJ, Gast, Kiosk) ============
function Picker(store, role) {
  const meta = role === 'kiosk' ? { from: 'kiosk' } : undefined;
  const ui = { tab: 'book', g: '', sel: null, res: null, rsel: null, msg: '' };
  const T = (du, sie) => store.state && store.state.settings.formal ? sie : du;
  const nameIn = h('input', { class: 'in big', placeholder: role === 'dj' ? 'Wer singt?' : 'Name', maxLength: 28, autocomplete: 'off', value: role === 'guest' ? LS.get('kk:name', '') : '' });
  nameIn.addEventListener('input', () => { nameIn.classList.remove('bad'); if (role === 'guest') LS.set('kk:name', nameIn.value); });
  const tabs = h('div', { class: 'tabs' });
  // Songbuch
  const bq = h('input', { class: 'in', placeholder: 'Songbuch durchsuchen …', type: 'search' }), chips = h('div', { class: 'chips' }), blist = h('div', { class: 'list scroll' });
  bq.addEventListener('input', renderBook);
  // Suche
  const sq = h('input', { class: 'in', placeholder: 'Titel oder Interpret', type: 'search' }), slist = h('div', { class: 'list scroll' });
  sq.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });
  // Link
  const lk = h('input', { class: 'in', placeholder: 'YouTube-Link oder https://….mp4' }), lt = h('input', { class: 'in', placeholder: 'Titel' }), la = h('input', { class: 'in', placeholder: 'Interpret (optional)' });
  lk.addEventListener('input', async () => { const v = parseMedia(lk.value); if (!v) return; if (isFile(v)) { if (!lt.value) { const c = fileMeta(v); lt.value = c.t; la.value = c.a; } return; } const info = await ytTitle(v); if (info.blocked) toast('Dieses Video erlaubt vermutlich kein Einbetten – bitte eine andere Karaoke-Version wählen.', 'warn'); if (info.title && !lt.value) { const c = cleanTitle(info.title); lt.value = c.t; la.value = c.a; } });
  // Eigene Dateien (Ordner "videos")
  const fq = h('input', { class: 'in', placeholder: 'Dateien durchsuchen …', type: 'search' }), flist = h('div', { class: 'list scroll' });
  let fsel = null;
  function renderFiles() {
    const q = slug(fq.value), rows = FILES.filter(f => !q || slug(fileName(f)).includes(q));
    put(flist, rows.length ? rows.map(f => { const m = fileMeta(f), sel = fsel === f;
      return h('div', { class: 'srow' + (sel ? ' sel' : ''), onclick: () => { fsel = sel ? null : f; renderFiles(); } }, h('div', { class: 'grow' }, h('div', { class: 'st' }, m.t), h('div', { class: 'sa' }, m.a || fileName(f))),
        sel ? h('button', { class: 'btn primary', onclick: e => { e.stopPropagation(); add({ t: m.t, a: m.a, vid: f }, () => { fsel = null; renderFiles(); }); } }, 'Auf die Liste') : null); }) : h('p', { class: 'mut pad' }, 'Keine passende Datei.'));
  }
  fq.addEventListener('input', renderFiles);
  filesReady.then(() => { renderFiles(); refresh(); });
  // Freier Wunsch
  const wt = h('input', { class: 'in', placeholder: 'Titel' }), wa = h('input', { class: 'in', placeholder: 'Interpret' });
  const panes = {
    book: h('div', { class: 'pane' }, bq, chips, blist),
    files: h('div', { class: 'pane' }, fq, flist),
    search: h('div', { class: 'pane' }, h('div', { class: 'row' }, sq, h('button', { class: 'btn primary', onclick: runSearch }, 'Suchen')), slist),
    link: h('div', { class: 'pane stack' }, h('p', { class: 'mut' }, 'Karaoke-Version auf YouTube öffnen, Link kopieren, hier einfügen.'), lk, lt, la,
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => { const v = parseMedia(lk.value); if (!v) return toast('Das ist weder ein YouTube-Link noch eine Videodatei (https://….mp4).', 'warn'); if (!lt.value.trim()) return toast('Bitte einen Titel eintragen.', 'warn'); add({ t: lt.value, a: la.value, vid: v }, () => { lk.value = lt.value = la.value = ''; }); } }, 'Auf die Liste'),
        h('a', { class: 'btn', href: 'https://www.youtube.com/results?search_query=karaoke', target: '_blank', rel: 'noopener' }, 'YouTube öffnen ↗'))),
    wish: h('div', { class: 'pane stack' }, h('p', { class: 'mut' }, role === 'dj' ? 'Titel ohne Video vormerken – das Video lässt sich später zuordnen.' : T('Nicht im Songbuch? Schreib uns deinen Wunsch – der DJ sucht die passende Version.', 'Nicht im Songbuch? Nennen Sie uns Ihren Wunsch – der DJ sucht die passende Version.')),
      wt, wa, h('button', { class: 'btn primary', onclick: () => { if (!wt.value.trim()) return toast('Bitte einen Titel eintragen.', 'warn'); add({ t: wt.value, a: wa.value }, () => { wt.value = wa.value = ''; }); } }, role === 'dj' ? 'Vormerken' : 'Wunsch senden'))
  };
  const body = h('div', { class: 'pbody' });
  const root = h('div', { class: 'picker' }, h('span', { class: 'lbl' }, role === 'dj' ? 'Sängerin / Sänger' : T('Dein Name', 'Ihr Name')), nameIn, role === 'dj' ? null : h('small', null, T('Dein Name erscheint auf dem Bildschirm.', 'Ihr Name erscheint auf dem Bildschirm.')), tabs, body);

  function add(song, done) {
    const name = nameIn.value.trim();
    if (!name) { nameIn.classList.add('bad'); nameIn.focus(); toast(role === 'dj' ? 'Bitte zuerst den Namen eintragen.' : T('Bitte zuerst deinen Namen eintragen.', 'Bitte zuerst Ihren Namen eintragen.'), 'warn'); return; }
    store.dispatch('add', Object.assign({ name }, song), meta).then(r => {
      toast(r.msg || (r.ok ? 'Aufgenommen.' : 'Das hat leider nicht geklappt.'), r.ok ? 'good' : 'warn');
      if (r.ok) { ui.sel = ui.rsel = null; if (role !== 'guest') nameIn.value = ''; if (done) done(); renderBook(); renderSearch(); }
    });
  }
  const searchOk = () => store.canSearch() && (role === 'dj' || (store.state && store.state.settings.guestSearch));
  function renderTabs() {
    const s = store.state, stageMode = !s || s.mode !== 'kiosk';
    const av = [['book', 'Songbuch']];
    if (role === 'dj' || searchOk()) av.push(['search', 'Suche']);
    if (role === 'dj' && store.local && FILES.length) av.push(['files', 'Dateien']);
    if (role === 'dj') av.push(['link', 'Link']);
    if (stageMode && role !== 'kiosk') av.push(['wish', role === 'dj' ? 'Ohne Video' : 'Wunsch']);
    if (!av.some(a => a[0] === ui.tab)) ui.tab = 'book';
    put(tabs, ...av.map(([id, label]) => h('button', { class: 'tab' + (ui.tab === id ? ' on' : ''), onclick: () => { ui.tab = id; refresh(); } }, label)));
    if (body.firstChild !== panes[ui.tab]) put(body, panes[ui.tab]);
  }
  function renderBook() {
    const s = store.state, kiosk = s && s.mode === 'kiosk';
    let list = store.book(); if (kiosk && !searchOk()) list = list.filter(b => b.has);
    const TOP = 'Top 100', genres = (list.some(b => b.top) ? [TOP] : []).concat([...new Set(list.map(b => b.g))]);
    if (ui.g && !genres.includes(ui.g)) ui.g = '';
    put(chips, ...[''].concat(genres).map(g => h('button', { class: 'chip' + (ui.g === g ? ' on' : ''), onclick: () => { ui.g = g; renderBook(); } }, g || 'Alle')));
    const q = slug(bq.value);
    const rows = list.filter(b => (!ui.g || (ui.g === TOP ? b.top : b.g === ui.g)) && (!q || slug(b.t + ' ' + b.a).includes(q)));
    const more = rows.length - 150; // bei 1000 Titeln nicht alles auf einmal zeichnen
    put(blist, ...(rows.length ? rows.slice(0, 150).map(b => {
      const sel = ui.sel === b.id;
      return h('div', { class: 'srow' + (sel ? ' sel' : ''), onclick: () => { ui.sel = sel ? null : b.id; renderBook(); } },
        h('div', { class: 'grow' }, h('div', { class: 'st' }, b.t), h('div', { class: 'sa' }, b.a)),
        role === 'dj' && !b.has ? h('span', { class: 'tag' }, s && s.settings.karafun ? 'KaraFun' : 'ohne Video') : null,
        sel ? h('button', { class: 'btn primary', onclick: e => { e.stopPropagation(); choose(b); } }, 'Auf die Liste') : null);
    }).concat(more > 0 ? [h('p', { class: 'mut pad' }, 'Noch ' + more + ' weitere Titel – bitte suchen oder eine Rubrik wählen.')] : []) : [h('p', { class: 'mut pad' }, kiosk && !list.length ? 'Das Songbuch wird gerade vorbereitet.' : 'Kein Treffer im Songbuch' + (role === 'guest' && !kiosk ? ' – unter „Wunsch“ nehmen wir den Titel gern auf.' : '.'))]));
  }
  function choose(b) {
    const kiosk = store.state && store.state.mode === 'kiosk';
    if (b.has || !kiosk) return add({ t: b.t, a: b.a, sid: b.id, vid: b.vid, dur: b.dur });
    ui.tab = 'search'; sq.value = b.a + ' ' + b.t; refresh(); runSearch();
  }
  async function runSearch() {
    if (!sq.value.trim()) return;
    if (!store.canSearch()) { ui.res = null; ui.msg = ''; return renderSearch(); }
    ui.res = null; ui.msg = 'Suche …'; renderSearch();
    try { ui.res = await store.search(sq.value); ui.msg = ui.res.length ? '' : 'Nichts gefunden.'; } catch (e) { ui.msg = e.message; }
    renderSearch();
  }
  function renderSearch() {
    if (!store.canSearch()) {
      put(slist, h('div', { class: 'stack pad' }, h('p', { class: 'mut' }, 'Für die Suche direkt in der App fehlt noch der YouTube-API-Schlüssel (Einstellungen). Bis dahin: auf YouTube suchen und den Link im Reiter „Link“ einfügen.'),
        h('a', { class: 'btn', target: '_blank', rel: 'noopener', href: 'https://www.youtube.com/results?search_query=' + encodeURIComponent((sq.value || '') + ' karaoke') }, 'Auf YouTube suchen ↗')));
      return;
    }
    if (ui.msg) return put(slist, h('p', { class: 'mut pad' }, ui.msg));
    put(slist, ...(ui.res || []).map(i => {
      const sel = ui.rsel === i.vid;
      return h('div', { class: 'vrow' + (sel ? ' sel' : ''), onclick: () => { ui.rsel = sel ? null : i.vid; renderSearch(); } },
        tImg(i.vid),
        h('div', { class: 'grow' }, h('div', { class: 'st' }, i.title), h('div', { class: 'sa' }, i.ch + (i.dur ? ' · ' + fmtDur(i.dur) : ''))),
        sel ? h('button', { class: 'btn primary', onclick: e => { e.stopPropagation(); const c = cleanTitle(i.title); add({ t: c.t, a: c.a, vid: i.vid, dur: i.dur }); } }, 'Auf die Liste') : null);
    }));
  }
  let sig = '';
  function refresh() {
    renderTabs();
    const s = store.state, k = [ui.tab, FILES.length, s && s.mode, s && s.settings.guestSearch, store.canSearch(), store.book().filter(b => b.has).length, store.book().length].join('|');
    if (k !== sig) { sig = k; renderBook(); renderSearch(); }
  }
  store.on(refresh);
  return root;
}

// ============ Listenbausteine ============
function entryLine(e) { return h('div', { class: 'grow' }, h('div', { class: 'st' }, e.name), h('div', { class: 'sa' }, e.t + (e.a ? ' · ' + e.a : ''))); }
function publicQueue(s, mineFn) {
  if (!s.queue.length) return h('p', { class: 'mut pad' }, 'Die Liste ist noch frei.');
  return h('div', { class: 'list' }, s.queue.map((e, i) => h('div', { class: 'qrow' + (mineFn && mineFn(e) ? ' mine' : '') }, h('span', { class: 'num' }, i + 1), entryLine(e), h('span', { class: 'mut' }, '~' + waitMin(s, i) + ' Min.'))));
}

// ============ DJ-Konsole ============
function viewDJ(app, room) {
  const remote = P.has('remote');
  const store = remote ? new RemoteStore(room) : new LocalStore(room, P.get('m') === 'kiosk' ? 'kiosk' : 'stage', { from: 'dj' });
  store.host();
  document.title = 'DJ-Konsole · DJ KOLJA ONE Karaoke';
  const badge = h('span', { class: 'badge' }), roomName = h('span', { class: 'room' });
  const inboxBox = h('div'), queueBox = h('div'), nowBox = h('div', { class: 'now' }), histBox = h('div'), qCount = h('span', { class: 'count' });
  const pBar = h('i'), pTime = h('span', { class: 'mut' }, '');
  const mainBtn = h('button', { class: 'btn primary xl', onclick: mainAction });
  const vol = h('input', { type: 'range', min: 0, max: 100, step: 1, oninput: e => store.dispatch('vol', { v: e.target.value }) });
  const tSignup = toggle('Anmeldung offen', true, v => store.dispatch('set', { signupOpen: v }));
  const tApprove = toggle('Wünsche erst freigeben', true, v => store.dispatch('set', { approve: v }));
  const ticker = h('input', { class: 'in', placeholder: 'Hinweis für das Bühnenbild (z. B. „Buffet ist eröffnet“)', maxLength: 140, onchange: e => store.dispatch('set', { ticker: e.target.value }) });
  const qrArea = h('div');
  const gameBox = h('div');
  const game = (op, x) => act('game', Object.assign({ op }, x || {}));
  function gamesDlg() {
    const s = store.state, hn = [...new Set(s.history.filter(x => x.sung).map(x => x.name))];
    const a = h('input', { class: 'in', placeholder: 'Erste Person / erstes Team', value: hn[1] || '' }), b = h('input', { class: 'in', placeholder: 'Zweite Person / zweites Team', value: hn[0] || '' });
    const sel = h('select', { class: 'in' }, (window.KK_QUIZ || []).map(q => h('option', { value: q.id }, q.title + ' (' + q.q.length + ' Fragen)')));
    const tAuto = toggle('Automatisch weiter', false, () => { }, '20 Sekunden pro Frage, dann Auflösung und nächste Frage – ohne Knopfdruck.');
    const m = modal('Spiele', h('div', { class: 'stack settings' },
      guestUrl(store) ? null : h('div', { class: 'alert' }, 'Mitmachen können Gäste nur über die Handy-Anmeldung (QR-Code). Sie ist hier gerade nicht aktiv.'),
      h('h4', null, 'Battle'), h('p', { class: 'mut' }, 'Zwei Auftritte treten gegeneinander an, das Publikum stimmt per Handy ab. Vorgeschlagen sind die beiden letzten Sängerinnen und Sänger.'),
      a, b, h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => game('battle', { a: a.value, b: b.value }).then(r => { if (r.ok) m.close(); }) }, 'Abstimmung starten')),
      h('h4', null, 'Musik-Quiz'), h('p', { class: 'mut' }, 'Die Frage erscheint auf dem Bühnenbild, geantwortet wird am Handy. Richtige und schnelle Antworten bringen Punkte.'),
      sel, tAuto, h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => game('quiz', { id: sel.value, auto: tAuto.querySelector('input').checked }).then(r => { if (r.ok) m.close(); }) }, 'Quiz starten')),
      h('h4', null, 'Song erkennen'), h('p', { class: 'mut' }, store.local ? (QFILES.length >= 4 ? QFILES.length + ' Musikdateien gefunden. Das Bühnenbild spielt je Frage 20 Sekunden an, die Gäste wählen am Handy den richtigen Titel.' : 'Dafür brauchst du eigene Musikdateien: mindestens vier Stücke in den Ordner „quiz“ neben der App legen (Dateiname „Interpret - Titel.mp3“) und die App über start-mac.command starten.') : 'Wird am Hauptgerät gestartet.'),
      store.local && QFILES.length >= 4 ? h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => game('mquiz', { q: musicRound(8), auto: tAuto.querySelector('input').checked }).then(r => { if (r.ok) m.close(); }) }, 'Song erkennen starten')) : null), { wide: true });
  }
  function drawGame(s) {
    const g = gameView(s.game); if (!g) return put(gameBox);
    const end = h('button', { class: 'btn', onclick: () => confirmDlg('Das Spiel beenden?', 'Beenden', () => game('end')) }, 'Beenden');
    if (g.type === 'battle') return put(gameBox, h('div', { class: 'gamepanel' }, h('span', { class: 'eyebrow' }, 'Battle läuft'), h('div', { class: 'nm' }, g.a + ' gegen ' + g.b),
      h('p', null, g.a + ': ' + g.ca + ' · ' + g.b + ': ' + g.cb + (g.phase === 'result' ? (g.strict ? ' – gewertet nur bekannte Geräte' : ' – Ergebnis wird gezeigt') : ' Stimmen')),
      g.na + g.nb ? h('p', { class: 'mut small' }, 'Davon von Geräten, die erst während der Abstimmung dazukamen: ' + g.a + ' ' + g.na + ' · ' + g.b + ' ' + g.nb + '. Bekannte Geräte: ' + g.a + ' ' + g.ka + ' · ' + g.b + ' ' + g.kb + '.') : null,
      g.sus && g.phase === 'vote' ? h('div', { class: 'alert' }, 'Auffällig: Viele neue Geräte stimmen fast alle für dieselbe Seite. Das kann auf Mehrfachstimmen hindeuten (privates Fenster oder gelöschter Browser-Speicher).') : null,
      h('div', { class: 'row wrap' }, g.phase === 'vote' ? [
        h('button', { class: 'btn' + (g.sus ? '' : ' primary'), onclick: () => game('reveal', { strict: false }) }, g.na + g.nb ? 'Auflösen mit allen Stimmen' : 'Auflösen'),
        g.na + g.nb ? h('button', { class: 'btn' + (g.sus ? ' primary' : ''), onclick: () => game('reveal', { strict: true }) }, 'Nur bekannte Geräte werten') : null] : null, end)));
    const qz = quizOf(g), q = qz && qz.q[g.qi], last = qz && g.qi + 1 >= qz.q.length;
    put(gameBox, h('div', { class: 'gamepanel' }, h('span', { class: 'eyebrow' }, 'Quiz · ' + (qz ? qz.title : g.id) + (g.phase === 'end' ? ' · Endstand' : g.phase === 'lobby' ? ' · Anmeldung' : g.phase === 'board' ? ' · Zwischenstand nach Frage ' : ' · Frage ' + (g.qi + 1) + ' von ' + (qz ? qz.q.length : '?'))),
      g.phase === 'lobby' ? h('p', null, 'Anmeldung läuft (eine Minute) · ' + (g.names || []).length + ' dabei') : g.phase !== 'end' && q ? [h('div', { class: 'st wrap' }, q[0]), h('p', { class: 'mut' }, 'Richtig: ' + q[1] + ' · ' + g.count + ' Antworten' + (g.phase === 'reveal' || g.phase === 'board' ? ', davon ' + g.right + ' richtig' : g.players && g.count >= g.players ? ' – alle haben geantwortet' : ''))] : null,
      g.top.length ? topList(g.top, 5) : null,
      h('div', { class: 'row wrap' }, g.phase === 'lobby' ? h('button', { class: 'btn primary', onclick: () => game('begin') }, 'Jetzt starten') : null, g.cq && g.phase === 'q' ? h('button', { class: 'btn', onclick: () => game('replay') }, 'Nochmal anspielen') : null, g.phase === 'q' ? h('button', { class: 'btn primary', onclick: () => game('reveal') }, 'Auflösen') : g.phase === 'reveal' ? h('button', { class: 'btn primary', onclick: () => game('next') }, last ? 'Siegerpodest zeigen' : 'Zwischenstand zeigen') : g.phase === 'board' ? h('button', { class: 'btn primary', onclick: () => game('next') }, 'Nächste Frage') : null, end)));
  }
  const playerHint = h('div');
  let lastAlive = 0, aliveInfo = {}, hintKey = '';
  store.onAlive(m => { lastAlive = Date.now(); aliveInfo = m; drawHint(); });
  const openStage = () => window.open(link('stage', room), 'kk-stage-' + room);
  function drawHint() {
    if (!store.local || !store.state) return;
    const c = store.state.current, open = Date.now() - lastAlive < 2600;
    const k = !c || !c.vid ? '' : !open ? 'closed' : aliveInfo.blocked ? 'blocked' : !aliveInfo.ready ? 'loading' : '';
    if (k === hintKey) return; hintKey = k;
    put(playerHint, k === 'closed' ? h('div', { class: 'alert' }, 'Das Bühnenbild ist nicht geöffnet. Das Video läuft dort – nicht in der Konsole.', h('button', { class: 'btn primary', onclick: openStage }, 'Bühnenbild öffnen'))
      : k === 'blocked' ? h('div', { class: 'alert' }, 'Der Browser wartet auf einen Klick: im Bühnenbild-Fenster einmal auf „Wiedergabe starten“ klicken.')
      : k === 'loading' ? h('div', { class: 'alert' }, 'Das Bühnenbild lädt den YouTube-Player noch. Dauert es länger, bitte die Internetverbindung prüfen.') : null);
  }
  setInterval(drawHint, 1000);
  let cur = 0, dur = 0;
  store.onTick(m => { cur = m.cur; dur = m.dur; pBar.style.width = dur ? (cur / dur * 100) + '%' : '0'; pTime.textContent = fmtDur(cur) + ' / ' + fmtDur(dur); });

  function mainAction() {
    const s = store.state; if (!s) return; const c = s.current;
    if (!c) return act('play');
    if (!c.vid && s.now.st === 'extern') return act('next');
    if (c.vid && (s.now.st === 'playing' || s.play.want === 'play')) return act('pause');
    act('play');
  }
  function act(a, x) { return store.dispatch(a, x).then(r => { if (!r.ok && r.msg) toast(r.msg, 'warn'); if (r.pin) askPin(); return r; }); }
  function askPin() {
    if ($('.ov')) return;
    const inp = h('input', { class: 'in big', inputMode: 'numeric', placeholder: 'PIN', maxLength: 8 });
    const m = modal('Fernsteuerung · PIN', h('div', { class: 'stack' }, h('p', { class: 'mut' }, 'Die PIN steht in der DJ-Konsole des Hauptgeräts unter „Einstellungen“.'), inp,
      h('button', { class: 'btn primary', onclick: () => { store.setPin(inp.value.trim()); m.close(); toast('PIN gespeichert.'); } }, 'Übernehmen')));
    inp.focus();
  }
  function resolve(e) {
    pickVideo(store, { q: (e.a ? e.a + ' ' : '') + e.t, onPick: (vid, d) => { act('edit', { id: e.id, vid, dur: d }); if (e.sid && store.local && canEditBook()) { bookSetVid(e.sid, vid, d); store.bookChanged(); } } });
  }
  function editEntry(e) {
    const n = h('input', { class: 'in', value: e.name }), t = h('input', { class: 'in', value: e.t }), a = h('input', { class: 'in', value: e.a });
    const ks = h('select', { class: 'in' }, [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(k => h('option', { value: k, selected: (e.key || 0) === k }, k === 0 ? 'Original' : keyLabel(k) + ' Halbtöne ' + (k > 0 ? 'höher' : 'tiefer'))));
    const m = modal('Eintrag bearbeiten', h('div', { class: 'stack' }, field('Name', n), field('Titel', t), field('Interpret', a),
      keyOk(e.vid) || (!e.vid && kf()) || (tap.on && isYT(e)) ? field('Tonart', ks, e.vid ? 'Das Tempo bleibt gleich.' : 'Als Merkhilfe – eingestellt wird in KaraFun.') : null,
      h('div', { class: 'row end' }, h('button', { class: 'btn', onclick: () => { m.close(); resolve(e); } }, ico('video'), e.vid ? 'Video tauschen' : 'Video wählen'),
        h('button', { class: 'btn primary', onclick: () => { act('edit', { id: e.id, name: n.value, t: t.value, a: a.value, key: +ks.value }); m.close(); } }, 'Speichern'))));
  }
  function saveToBook(e) {
    if (!store.local) return toast('Das Songbuch wird am Hauptgerät gepflegt.');
    if (!canEditBook()) return toast('Das Songbuch lässt sich nur als angemeldeter DJ ändern (Einstellungen → DJ-Anmeldung).', 'warn');
    const id = slug(e.a + '-' + e.t); if (bookFind(id)) bookSetVid(id, e.vid, e.dur); else bookAddCustom(e.t, e.a, e.vid, e.dur);
    store.bookChanged(); toast('Im Songbuch gespeichert.', 'good');
  }
  const kf = () => !!(store.state && store.state.settings.karafun);
  // ---- Versuch: Tonart für YouTube. Die Konsole greift den Ton des Bühnenbild-Tabs ab, verschiebt ihn und gibt ihn selbst aus.
  const tap = { on: false, ctx: null, node: null, src: null, stream: null, key: null, muted: true }; window.KKTap = tap;
  const tapBox = h('div');
  const isYT = e => !!(e && e.vid && !isFile(e.vid));
  function tapApply() {
    if (!tap.on) return;
    const c = store.state && store.state.current, k = isYT(c) ? clampKey(c.key) : 0;
    if (k === tap.key) return; tap.key = k;
    tap.node.port.postMessage({ semitones: k, reset: true });
    try { tap.src.disconnect(); } catch (e) { /* war nicht verbunden */ }
    tap.src.connect(k ? tap.node : tap.ctx.destination);
  }
  function tapStop() {
    if (tap.stream) tap.stream.getTracks().forEach(t => t.stop());
    try { if (tap.src) tap.src.disconnect(); } catch (e) { /* schon getrennt */ }
    tap.on = false; tap.stream = tap.src = null; tap.key = null; if (store.state) render(store.state);
  }
  async function tapStart() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia || !window.AudioWorkletNode) return toast('Dieser Browser kann den Tab-Ton nicht abgreifen. Bitte Chrome auf dem Mac verwenden.', 'warn');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser', frameRate: 1 }, audio: { suppressLocalAudioPlayback: true, echoCancellation: false, noiseSuppression: false, autoGainControl: false }, selfBrowserSurface: 'exclude', systemAudio: 'exclude', surfaceSwitching: 'exclude' });
      const at = stream.getAudioTracks()[0];
      if (!at) { stream.getTracks().forEach(t => t.stop()); return toast('Es wurde kein Ton freigegeben. Bitte den Tab „Bühnenbild“ wählen und „Tab-Audio freigeben“ angehakt lassen.', 'warn'); }
      if (!tap.ctx) { const AC = window.AudioContext || window.webkitAudioContext; tap.ctx = new AC(); await tap.ctx.audioWorklet.addModule('js/pitch-worklet.js'); tap.node = new AudioWorkletNode(tap.ctx, 'kk-pitch', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); tap.node.connect(tap.ctx.destination); }
      await tap.ctx.resume();
      tap.stream = stream; tap.src = tap.ctx.createMediaStreamSource(stream); tap.on = true; tap.key = null;
      const set = at.getSettings ? at.getSettings() : {}; tap.muted = set.suppressLocalAudioPlayback === true;
      at.addEventListener('ended', tapStop);
      tapApply(); render(store.state);
    } catch (e) { if (e.name !== 'NotAllowedError') toast('Der Abgriff ist nicht möglich: ' + e.message, 'warn'); }
  }
  function drawTap(s) {
    if (!store.local) return;
    put(tapBox, h('h2', null, 'Tonart für YouTube (Versuch)'), tap.on
      ? [h('p', null, 'Abgriff aktiv – der Ton des Bühnenbilds läuft über die Konsole.' + (isYT(s.current) && s.current.key ? ' Tonart ' + keyLabel(s.current.key) + '.' : '')),
        tap.muted ? null : h('div', { class: 'alert' }, 'Chrome spielt den Originalton zusätzlich weiter. Dann ist der Abgriff auf diesem Rechner nicht brauchbar – bitte beenden.'),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: tapStop }, 'Abgriff beenden'))]
      : [h('p', { class: 'mut small' }, 'Chrome fragt nach einer Freigabe: dort den Tab „Bühnenbild“ wählen und „Tab-Audio freigeben“ angehakt lassen. Danach lässt sich die Tonart auch bei YouTube-Titeln ändern. Der Ton kommt dann aus diesem Fenster, leicht verzögert.'),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: tapStart }, 'Ton des Bühnenbilds abgreifen'))]);
  }
  const keyCtl = e => keyOk(e.vid) || (!e.vid && kf()) || (tap.on && isYT(e))
    ? h('div', { class: 'keyctl' }, h('span', { class: 'lbl' }, 'Tonart'), h('button', { class: 'btn icon', title: 'Halbton tiefer', onclick: () => act('key', { id: e.id, k: (e.key || 0) - 1 }) }, '−'),
      h('b', null, keyLabel(e.key)), h('button', { class: 'btn icon', title: 'Halbton höher', onclick: () => act('key', { id: e.id, k: (e.key || 0) + 1 }) }, '+'),
      e.key ? h('button', { class: 'btn ghost', onclick: () => act('key', { id: e.id, k: 0 }) }, 'Original') : null, h('span', { class: 'mut' }, e.vid ? 'Halbtöne, Tempo bleibt gleich' : 'Halbtöne – bitte in KaraFun einstellen'))
    : e.vid ? h('p', { class: 'mut small' }, 'Tonart bei YouTube: nur mit dem Abgriff weiter unten (Versuch). Sonst geht es bei eigenen Videodateien.') : null;
  const ib = (icon, title, fn, cls) => h('button', { class: 'btn ghost icon ' + (cls || ''), title, onclick: fn }, ico(icon));

  function render(s) {
    if (!s) { put(nowBox, h('p', { class: 'mut pad' }, store.conn === 'none' ? 'Für die Fernsteuerung muss die Cloud-Verbindung eingerichtet sein (config.js).' : 'Verbinde mit dem Raum …')); return; }
    roomName.textContent = s.name + ' · ' + s.room;
    const c = s.current, S = s.settings;
    drawGame(s); tapApply(); drawTap(s);
    // Jetzt
    const kids = [];
    if (c) {
      kids.push(h('div', { class: 'nowhead' }, c.vid ? tImg(c.vid) : h('div', { class: 'noimg' }, 'ohne Video'),
        h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, s.now.st === 'playing' ? 'Läuft' : c.phase === 'intro' ? 'Angekündigt' : s.now.st === 'extern' ? 'Extern' : 'Pausiert'),
          h('div', { class: 'nm' }, c.name), h('div', { class: 'sa' }, c.t + (c.a ? ' · ' + c.a : ''))),
        ib('edit', 'Bearbeiten', () => editEntry(c))));
      if (s.now.st === 'error') kids.push(h('div', { class: 'alert' }, isFile(c.vid) ? 'Die Videodatei lässt sich nicht abspielen (fehlt sie im Ordner „videos“, oder ist das Format unbekannt?).' : 'Dieses Video lässt sich nicht einbetten (YouTube-Fehler ' + (s.now.err || '?') + ').', h('button', { class: 'btn primary', onclick: () => resolve(c) }, 'Anderes Video wählen')));
      kids.push(keyCtl(c));
      if (!c.vid) kids.push(S.karafun
        ? h('div', { class: 'alert' }, 'KaraFun-Titel: in KaraFun suchen und starten' + (c.key ? ', Tonart ' + keyLabel(c.key) + ' einstellen' : '') + '. Nach dem Song hier „Fertig“ drücken.',
          h('div', { class: 'row wrap' }, h('button', { class: 'btn primary', onclick: () => navigator.clipboard.writeText((c.a ? c.a + ' ' : '') + c.t).then(() => toast('Titel kopiert – in KaraFun einfügen.', 'good')).catch(() => toast('Kopieren nicht möglich.', 'warn')) }, 'Titel kopieren'), h('button', { class: 'btn', onclick: () => resolve(c) }, 'Stattdessen Video wählen')))
        : h('div', { class: 'alert' }, 'Kein Video zugeordnet – entweder jetzt wählen oder extern abspielen (z. B. KaraFun).', h('button', { class: 'btn', onclick: () => resolve(c) }, 'Video wählen')));
    } else kids.push(h('div', { class: 'nowhead' }, h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'Bühne frei'), h('div', { class: 'sa' }, s.queue.length ? 'Als Nächstes: ' + s.queue[0].name + ' – ' + s.queue[0].t : 'Noch niemand auf der Liste.'))));
    put(nowBox, ...kids);
    if (!c) { pBar.style.width = '0'; pTime.textContent = ''; }
    put(mainBtn, ...(!c ? [ico('next'), 'Nächsten ankündigen'] : !c.vid && s.now.st === 'extern' ? [ico('check'), 'Fertig'] : c.vid && (s.now.st === 'playing' || s.play.want === 'play') ? [ico('pause'), 'Pause'] : [ico('play'), c.phase === 'intro' ? 'Start' : 'Weiter']));
    mainBtn.disabled = !c && !s.queue.length;
    if (document.activeElement !== vol) vol.value = s.play.vol;
    tSignup.set(S.signupOpen); tApprove.set(S.approve);
    if (document.activeElement !== ticker) ticker.value = S.ticker || '';
    // Wünsche
    put(inboxBox, ...(s.inbox.length ? [h('h2', null, 'Neue Wünsche ', h('span', { class: 'count hot' }, s.inbox.length)),
      h('div', { class: 'list' }, s.inbox.map(e => h('div', { class: 'qrow inbox' }, entryLine(e), !e.vid ? h('span', { class: 'tag' }, S.karafun ? 'KaraFun' : 'ohne Video') : null,
        ib('x', 'Ablehnen', () => act('reject', { id: e.id })), h('button', { class: 'btn primary', onclick: () => act('approve', { id: e.id }) }, ico('check'), 'Aufnehmen'))))] : []));
    // Warteschlange
    qCount.textContent = s.queue.length || '';
    put(queueBox, s.queue.length ? h('div', { class: 'list' }, s.queue.map((e, i) => h('div', { class: 'qitem' },
      h('div', { class: 'qmain' }, h('span', { class: 'num' }, i + 1), e.vid ? tImg(e.vid) : h('button', { class: 'noimg btnlike', onclick: () => resolve(e), title: 'Video wählen' }, S.karafun ? 'KaraFun' : 'Video wählen'),
        entryLine(e), e.key && (keyOk(e.vid) || !e.vid || tap.on) ? h('span', { class: 'tag' }, 'Tonart ' + keyLabel(e.key)) : null, h('span', { class: 'mut' }, e.dur ? fmtDur(e.dur) : ''), e.by !== 'dj' ? h('span', { class: 'tag' }, e.by === 'kiosk' ? 'Kiosk' : 'Gast') : null),
      h('div', { class: 'qact' }, ib('top', 'Ganz nach vorn', () => act('top', { id: e.id })), ib('up', 'Nach oben', () => act('move', { id: e.id, d: -1 })), ib('down', 'Nach unten', () => act('move', { id: e.id, d: 1 })),
        ib('edit', 'Bearbeiten', () => editEntry(e)), ib('x', 'Entfernen', () => act('remove', { id: e.id })),
        h('button', { class: 'btn', onclick: () => act('stage', { id: e.id }) }, 'Auf die Bühne'))))) : h('p', { class: 'mut pad' }, 'Die Warteschlange ist leer.'));
    // Verlauf
    put(histBox, ...(s.history.length ? [h('h2', null, 'Verlauf'), h('div', { class: 'list' }, s.history.slice(0, 12).map(e => h('div', { class: 'qrow' }, entryLine(e),
      e.vid && store.local ? ib('star', 'Ins Songbuch übernehmen', () => saveToBook(e)) : null, ib('again', 'Noch einmal auf die Liste', () => act('add', { name: e.name, t: e.t, a: e.a, vid: e.vid, dur: e.dur, sid: e.sid })))))] : []));
    // QR
    const g = guestUrl(store);
    put(qrArea, ...(g ? [h('h2', null, 'Anmeldung per Handy'), h('div', { class: 'row' }, qrBox(g, 'small'), h('div', { class: 'stack grow' }, h('code', { class: 'url' }, g),
      h('button', { class: 'btn', onclick: () => navigator.clipboard.writeText(g).then(() => toast('Link kopiert.')).catch(() => { }) }, 'Link kopieren')))] :
      store.local ? [h('h2', null, 'Anmeldung per Handy'), h('p', { class: 'mut' }, !cloud.on ? 'Noch nicht eingerichtet – siehe Einstellungen → Cloud.' : 'Funktioniert, sobald die App im Internet liegt (nicht über localhost).')] : []));
  }
  store.onConn(c => { badge.textContent = store.local ? ({ on: 'Cloud verbunden', wait: 'Cloud verbindet …', err: 'Cloud nicht erreichbar', off: cloud.on ? 'Cloud im Hintergrund' : 'Nur dieses Gerät' })[c] : ({ on: 'Fernsteuerung aktiv', wait: 'Verbinde …', err: 'Keine Verbindung', none: 'Cloud fehlt' })[c]; badge.className = 'badge ' + c; if (!store.state) render(null); });

  app.append(h('div', { class: 'page dj' },
    h('header', { class: 'top' }, h('a', { href: link('') }, logo()), h('div', { class: 'grow' }, roomName, badge),
      store.local ? h('button', { class: 'btn', onclick: openStage }, 'Bühnenbild öffnen') : null,
      store.local ? h('button', { class: 'btn', onclick: () => songbookDlg(store) }, 'Songbuch') : null,
      h('button', { class: 'btn', onclick: gamesDlg }, 'Spiele'),
      store.local && cloud.url ? h('button', { class: 'btn', onclick: statsDlg }, 'Statistik') : null,
      h('button', { class: 'btn', onclick: () => closingDlg(store) }, 'Abschluss'),
      h('button', { class: 'btn', onclick: () => settingsDlg(store) }, 'Einstellungen')),
    h('main', { class: 'cols' },
      h('section', { class: 'panel' }, h('h2', null, 'Song aufnehmen'), Picker(store, 'dj')),
      h('section', { class: 'panel' }, inboxBox, h('h2', null, 'Warteschlange ', qCount), queueBox),
      h('section', { class: 'panel' }, h('h2', null, 'Bühne'), gameBox, nowBox, playerHint, h('div', { class: 'prog' }, pBar), h('div', { class: 'row between' }, pTime, h('span', { class: 'mut' }, 'Leertaste = Start/Pause')),
        h('div', { class: 'transport' }, h('button', { class: 'btn icon', title: 'Von vorn', onclick: () => act('restart') }, ico('restart')),
          h('button', { class: 'btn', title: '10 Sekunden zurück', onclick: () => act('seek', { to: Math.max(0, cur - 10) }) }, '−10'), mainBtn,
          h('button', { class: 'btn', title: '10 Sekunden vor', onclick: () => act('seek', { to: cur + 10 }) }, '+10'),
          h('button', { class: 'btn icon', title: 'Song beenden, weiter zum nächsten', onclick: () => { const s = store.state; if (s.current && s.now.st === 'playing') confirmDlg('Den laufenden Song beenden?', 'Beenden', () => act('next')); else act('next'); } }, ico('next')),
          h('button', { class: 'btn icon', title: 'Bühne freimachen', onclick: () => act('stop') }, ico('stop'))),
        field('Video-Lautstärke', vol), tapBox, h('div', { class: 'togs' }, tSignup, tApprove), field('Hinweiszeile', ticker), qrArea, histBox))));
  store.on(render);
  document.addEventListener('keydown', e => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || $('.ov')) return; if (e.code === 'Space') { e.preventDefault(); mainAction(); } });
  if (!store.local && !store.pin) askPin();
}

// ============ Einstellungen ============
// Kundenlogo hochladen: wird auf höchstens 640 × 240 Pixel verkleinert und auf diesem Rechner gespeichert
function logoField(store, S, set) {
  const prev = h('div', { class: 'logoprev' }), msg = h('small');
  const draw = () => put(prev, store.brand() ? custLogo(store, 'small') : h('span', { class: 'mut' }, 'Kein Logo hinterlegt.'));
  const file = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/svg+xml', style: 'display:none', onchange: async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const url = URL.createObjectURL(f), img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Bild lässt sich nicht lesen')); i.src = url; });
      const w0 = img.naturalWidth || 640, h0 = img.naturalHeight || 240, sc = Math.min(1, 640 / w0, 240 / h0), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w0 * sc)); c.height = Math.max(1, Math.round(h0 * sc)); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      let data = c.toDataURL('image/webp', .9); if (!/^data:image\/webp/.test(data)) data = c.toDataURL('image/png');
      if (data.length > 380000) return (msg.textContent = 'Das Logo ist auch verkleinert noch zu groß. Bitte eine einfachere Datei wählen.');
      store.setBrand(data); msg.textContent = 'Logo gespeichert.'; draw();
    } catch (err) { msg.textContent = err.message; }
    e.target.value = '';
  } });
  draw();
  return h('div', { class: 'stack' }, h('span', { class: 'lbl' }, 'Logo des Gastgebers'), prev,
    h('div', { class: 'row wrap' }, h('button', { class: 'btn', onclick: () => file.click() }, 'Logo wählen'), h('button', { class: 'btn ghost', onclick: () => { store.setBrand(''); draw(); } }, 'Entfernen'), file), msg,
    toggle('Logo auf hellem Grund zeigen', S.logoPlate !== false, v => { set({ logoPlate: v }).then(draw); }, 'Für dunkle Logos. Ausschalten bei hellen Logos mit transparentem Hintergrund.'));
}
function settingsDlg(store) {
  const s = store.state; if (!s) return; const S = s.settings;
  const set = x => store.dispatch('set', x).then(r => { if (!r.ok && r.msg) toast(r.msg, 'warn'); });
  const inp = (val, onchange, attrs) => h('input', Object.assign({ class: 'in', value: val == null ? '' : val, onchange: e => onchange(e.target.value.trim()) }, attrs || {}));
  const kids = [
    h('h4', null, 'Veranstaltung'),
    field('Name der Veranstaltung', inp(S.eventName, v => set({ eventName: v }), { placeholder: 'z. B. Sommerfest Musterfirma', maxLength: 60 }), 'Erscheint auf dem Bühnenbild, im Kiosk und auf den Handys.'),
    store.setBrand && store.local ? logoField(store, S, set) : null,
    h('h4', null, 'Ablauf'),
    field('Name des Raums', inp(s.name, v => set({ name: v }))),
    toggle('Namen und Wünsche filtern', S.filter !== false, v => set({ filter: v }), 'Weist Beleidigungen und Obszönes bei Gästen ab, bevor es auf dem Bildschirm erscheint.'),
    field('Eigene gesperrte Wörter', inp(S.blockWords, v => set({ blockWords: v }), { placeholder: 'Wörter durch Komma trennen' }), 'Zusätzlich zur eingebauten Liste, z. B. Namen von Vorgesetzten. Der Filter schützt nur die Anzeige für Gäste.'),
    !legalLink(LEGAL.impressum) || !legalLink(LEGAL.datenschutz) ? h('div', { class: 'alert' }, 'Die Adressen von Impressum und Datenschutzerklärung fehlen in der Datei config.js. Sie erscheinen sonst nicht auf der Gäste-Seite.') : null,
    toggle('Faire Reihenfolge', S.fair, v => set({ fair: v }), 'Wer noch nicht gesungen hat, rückt vor Vielsänger.'),
    toggle('Nächsten automatisch ankündigen', S.autoNext, v => set({ autoNext: v }), 'Nach jedem Song erscheint direkt die nächste Person auf dem Bühnenbild.'),
    field('Automatischer Start nach Ankündigung', h('select', { class: 'in', onchange: e => set({ autoStart: +e.target.value }) }, [[0, 'Aus – Start per Knopfdruck'], [8, 'nach 8 Sekunden'], [15, 'nach 15 Sekunden'], [25, 'nach 25 Sekunden']].map(([v, l]) => h('option', { value: v, selected: S.autoStart === v }, l)))),
    field('Offene Songs pro Gast', inp(S.maxPerGuest, v => set({ maxPerGuest: v }), { type: 'number', min: 1, max: 9 })),
    toggle('Gäste dürfen YouTube frei durchsuchen', S.guestSearch, v => set({ guestSearch: v }), 'Aus = Gäste wählen aus dem Songbuch' + (s.mode === 'kiosk' ? '.' : ' oder schicken einen Wunsch.')),
    toggle('KaraFun-Modus', S.karafun, v => set({ karafun: v }), 'Titel ohne Video gelten als KaraFun-Titel: Die App kündigt an und führt die Liste, abgespielt wird in KaraFun.'),
    toggle('Förmliche Ansprache (Sie)', S.formal, v => set({ formal: v }), 'Für Firmenveranstaltungen.'),
    toggle('Info-Leiste im Bühnenbild', S.bar, v => set({ bar: v })),
    h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => confirmDlg('Warteschlange und offene Wünsche leeren?', 'Leeren', () => store.dispatch('clear', { what: 'queue' })) }, 'Warteschlange leeren'),
      h('button', { class: 'btn', onclick: () => confirmDlg('Alles zurücksetzen – Warteschlange, Verlauf und laufenden Song?', 'Zurücksetzen', () => store.dispatch('clear', { what: 'all' })) }, 'Neuer Abend'))
  ];
  if (store.local && cloud.url) {
    const box = h('div', { class: 'stack' });
    const email = h('input', { class: 'in', type: 'email', placeholder: 'E-Mail', autocomplete: 'username' }), pw = h('input', { class: 'in', type: 'password', placeholder: 'Passwort (mindestens 8 Zeichen)', autocomplete: 'current-password' });
    const run = (fn, okMsg) => async () => { if (!email.value.trim() || !pw.value) return toast('Bitte E-Mail und Passwort eintragen.', 'warn'); try { const r = await fn(email.value.trim(), pw.value); toast(r === 'confirm' ? 'Fast geschafft: Bitte den Link in der Bestätigungs-E-Mail anklicken und danach hier anmelden.' : okMsg, 'good'); } catch (e) { toast(e.message, 'warn'); } };
    const draw = () => { if (!box.isConnected && box.dataset.drawn) return; box.dataset.drawn = '1';
      put(box, dj.user ? [h('p', null, 'Angemeldet als ', h('b', null, dj.user.email), dj.isDj ? ' · DJ-Rechte aktiv' : ' · ohne DJ-Rechte'),
        h('p', { class: 'mut' }, dj.isDj ? 'Änderungen am Songbuch gelten für alle Geräte, und gesungene Titel fließen in die Statistik ein.' : 'Dieses Konto ist nicht als DJ freigeschaltet. Das Songbuch lässt sich damit nicht ändern.'),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => dj.signOut() }, 'Abmelden'))]
        : [h('p', { class: 'mut' }, 'Mit Anmeldung wird das Songbuch in der Cloud gepflegt und gilt auf allen Geräten; gesungene Titel werden für die Statistik gezählt. Ohne Anmeldung bleibt alles wie bisher auf diesem Gerät.'),
          email, pw, h('div', { class: 'row wrap' }, h('button', { class: 'btn primary', onclick: run((e, p) => dj.signIn(e, p), 'Angemeldet.') }, 'Anmelden'), h('button', { class: 'btn', onclick: run((e, p) => dj.signUp(e, p), 'Konto angelegt und angemeldet.') }, 'Konto anlegen'))]);
    };
    dj.on(draw); draw();
    kids.push(h('h4', null, 'DJ-Anmeldung'), box);
  }
  if (store.local) {
    kids.push(h('h4', null, 'YouTube'),
      field('YouTube-API-Schlüssel (nur auf diesem Gerät gespeichert)', inp(cfg.ytKey, v => { cfg.ytKey = v; saveCfg(); store.dispatch('set', {}); toast(v ? 'Schlüssel gespeichert.' : 'Schlüssel entfernt.'); }, { type: 'password', autocomplete: 'off' }),
        'Ermöglicht die Suche direkt in der App. Kostenlos, rund 100 Suchen pro Tag. Ohne Schlüssel funktionieren Songbuch und Link-Einfügen trotzdem.'),
      h('h4', null, 'Cloud – Handy-Anmeldung & Fernsteuerung'),
      h('p', { class: 'mut' }, cloud.on ? 'Eingerichtet. Gäste melden sich über den QR-Code an, sobald die App im Internet liegt.' : 'Noch nicht eingerichtet. Am einfachsten in der Datei config.js eintragen – dann gilt es für alle Geräte.'),
      field('Supabase-URL (überschreibt config.js auf diesem Gerät)', inp(cfg.sbUrl, v => { cfg.sbUrl = v; saveCfg(); }, { placeholder: 'https://….supabase.co' })),
      field('Supabase-Key (anon / publishable)', inp(cfg.sbKey, v => { cfg.sbKey = v; saveCfg(); }, null), 'Nach einer Änderung die Seite neu laden.'),
      field('PIN für die Fernsteuerung', inp(S.pin, v => set({ pin: v }), { inputMode: 'numeric' }), 'Zweites Gerät: Startseite → „Raum fernsteuern“ → Code ' + s.room + ' und diese PIN.'),
      field('Event-Code', h('div', { class: 'row' }, h('code', { class: 'url' }, cfg.code || '–'), h('button', { class: 'btn', onclick: () => confirmDlg('Neuen Event-Code erzeugen? Es entstehen neue, leere Räume; alte QR-Codes gelten dann nicht mehr.', 'Neu erzeugen', () => { cfg.code = rndCode(4); saveCfg(); location.href = link(''); }) }, 'Neu erzeugen')), 'Pro Veranstaltung ein neuer Code hält alte QR-Codes draußen.'));
  }
  modal('Einstellungen', h('div', { class: 'stack settings' }, kids), { wide: true });
}

// ============ Abschluss des Abends ============
function closingDlg(store) {
  const s = store.state; if (!s) return; const S = s.settings;
  const set = x => store.dispatch('set', x).then(r => { if (!r.ok && r.msg) toast(r.msg, 'warn'); return r; });
  const ev = evening(s), names = toggle('Mit Namen der Gäste', false, () => { });
  const rv = h('input', { class: 'in', value: S.reviewUrl || '', placeholder: 'https://…', onchange: e => set({ reviewUrl: e.target.value.trim() }).then(() => { if (e.target.value.trim() && !store.state.settings.reviewUrl) toast('Bitte eine vollständige Adresse mit https:// eintragen.', 'warn'); }) });
  const exp = () => {
    const withN = names.querySelector('input').checked, rows = [['Uhrzeit', 'Titel', 'Interpret'].concat(withN ? ['Name'] : [], ['Gesungen'])];
    for (const x of (store.state.history || []).slice().reverse()) rows.push([new Date(x.ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }), x.t, x.a].concat(withN ? [x.name] : [], [x.sung ? 'ja' : 'nein']));
    if (rows.length < 2) return toast('Der Verlauf ist noch leer.', 'warn');
    csvDownload('karaoke-' + slug(store.state.name) + '-' + fileDay() + '.csv', rows);
  };
  modal('Abschluss des Abends', h('div', { class: 'stack settings' },
    h('p', { class: 'mut' }, ev.perf ? 'Bisher ' + ev.perf + ' Auftritte, ' + ev.singers + ' verschiedene Stimmen, ' + ev.songs + ' verschiedene Songs.' : 'Noch keine Auftritte in diesem Raum.'),
    toggle('Abschlussfolie zeigen', !!s.closing, v => store.dispatch('closing', { on: v }), 'Bühnenbild: Dank, Zahlen und Top-Songs des Abends, dazu der QR-Code zur Bewertung. Auf den Handys erscheint ein Dank mit Bewertungs-Knopf. Ein laufender Song wird nicht verdeckt.'),
    field('Link zur Bewertung', rv, 'Zum Beispiel dein Google-Bewertungslink. Ohne Link erscheint kein QR-Code.'),
    h('h4', null, 'Als Datei'),
    h('p', { class: 'mut' }, 'Alle Songs dieses Raums in der Reihenfolge des Abends, als Tabelle für Excel oder Numbers.'),
    names, h('small', null, 'Namen nur exportieren, wenn du sie wirklich brauchst – sie sind personenbezogene Daten der Gäste.'),
    h('div', { class: 'row' }, h('button', { class: 'btn', onclick: exp }, 'Abend als Datei speichern'))), { wide: true });
}

// ============ Statistik ============
function statsDlg() {
  const body = h('div', { class: 'stack' }), list = h('div', { class: 'list scroll tall' }), info = h('p', { class: 'mut' });
  let days = 0, last = null;
  const tabs = h('div', { class: 'chips' });
  const save = h('button', { class: 'btn', onclick: () => { if (!last || !last.rows.length) return toast('Keine Einträge zum Speichern.', 'warn'); csvDownload('karaoke-statistik-' + (days ? days + '-tage-' : 'gesamt-') + fileDay() + '.csv', [['Platz', 'Titel', 'Interpret', 'Anzahl']].concat(last.rows.map((x, i) => [i + 1, x.title, x.artist, x.n]))); } }, 'Als CSV speichern');
  async function load() {
    put(tabs, [[0, 'Gesamt'], [365, '12 Monate'], [30, '30 Tage'], [1, 'Heute']].map(([d, l]) => h('button', { class: 'chip' + (days === d ? ' on' : ''), onclick: () => { days = d; load(); } }, l)));
    if (!dj.isDj) { info.textContent = 'Die Statistik ist nur mit DJ-Anmeldung sichtbar (Einstellungen → DJ-Anmeldung).'; put(list); return; }
    info.textContent = 'Lade …';
    try {
      const r = last = await playStats(days);
      info.textContent = r.total ? r.total + ' gesungene Titel, ' + r.rows.length + ' verschiedene. Gezählt wird auf Geräten, an denen ein DJ angemeldet ist – ohne Namen der Gäste.' : 'Noch keine Einträge in diesem Zeitraum.';
      put(list, r.rows.map((x, i) => h('div', { class: 'qrow' }, h('span', { class: 'num' }, i + 1), h('div', { class: 'grow' }, h('div', { class: 'st' }, x.title), h('div', { class: 'sa' }, x.artist)), h('b', null, x.n + '×'))));
    } catch (e) { info.textContent = 'Die Statistik konnte nicht geladen werden: ' + e.message; }
  }
  body.append(tabs, info, list, h('div', { class: 'row' }, save)); modal('Statistik', body, { wide: true }); load();
}

// ============ Songbuch pflegen ============
// ---- Prüfstand: gespeicherte Ergebnisse der Sperr-Prüfung (pro Titel, gilt nur für das geprüfte Video)
const chkAll = () => LS.get('kk:check', {});
const chkOf = b => { const c = chkAll()[b.id]; return c && c.v === b.vid ? c.s : ''; };
function chkSave(map) { const c = chkAll(); for (const id in map) c[id] = map[id]; LS.set('kk:check', c); }
// Playlist importieren: Treffer vorschlagen, gesperrte aussortieren, Auswahl übernehmen
function playlistDlg(store, done) {
  const inp = h('input', { class: 'in', placeholder: 'Link zur Playlist (youtube.com/playlist?list=…) oder Kanal-ID (UC…)' });
  const msg = h('p', { class: 'mut' }), out = h('div', { class: 'stack' });
  let busy = false;
  const say = t => { msg.textContent = t; };
  async function go() {
    if (busy) return; const id = parsePlaylistId(inp.value);
    if (!id) return say('Das ist kein Playlist-Link. Gebraucht wird ein Link mit „list=…“ oder eine Kanal-ID, die mit UC beginnt.');
    if (!store.canSearch()) return say('Es ist kein YouTube-API-Schlüssel hinterlegt (Einstellungen → YouTube).');
    busy = true; put(out);
    try {
      const vids = await ytPlaylist(id, n => say('Lade Playlist … ' + n + ' Videos'));
      const missing = bookList().filter(b => !b.has), { matches, none } = matchPlaylist(vids, missing);
      say('Prüfe ' + matches.length + ' Treffer auf Sperren …');
      const info = await ytVideoInfo([...new Set(matches.map(m => m.v.vid))]);
      const good = matches.filter(m => !info[m.v.vid].why), bad = matches.length - good.length;
      say(vids.length + ' Videos gelesen · ' + matches.length + ' passen zu offenen Titeln · ' + bad + ' wegen Sperre aussortiert · ' + none.length + ' Titel ohne Treffer. Bitte die Vorschläge prüfen – Haken entfernen, was nicht passt.');
      const rows = good.map(m => { const cb = h('input', { type: 'checkbox', checked: true, class: 'cbx' }); return { m, cb, el: h('label', { class: 'qrow chk' }, cb, h('div', { class: 'grow' }, h('div', { class: 'st' }, m.b.t + ' · ' + m.b.a), h('div', { class: 'sa' }, '← ' + m.v.title + (m.v.ch ? ' · ' + m.v.ch : ''))), h('a', { class: 'btn ghost', href: mediaUrl(m.v.vid), target: '_blank', rel: 'noopener', title: 'Vorab ansehen', onclick: e => e.stopPropagation() }, '↗')) }; });
      put(out, h('div', { class: 'list scroll tall' }, rows.map(r => r.el)), rows.length ? h('div', { class: 'row end' }, h('button', { class: 'btn primary', onclick: () => {
        const sel = rows.filter(r => r.cb.checked), ck = {};
        for (const r of sel) { bookSetVid(r.m.b.id, r.m.v.vid, info[r.m.v.vid].dur); ck[r.m.b.id] = { v: r.m.v.vid, s: 'ok', at: Date.now() }; }
        chkSave(ck); store.bookChanged(); toast(sel.length + ' Titel zugeordnet.', 'good'); done(); m.close();
      } }, 'Ausgewählte übernehmen')) : null);
    } catch (e) { say(e.message); }
    busy = false;
  }
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  const m = modal('Playlist importieren', h('div', { class: 'stack' },
    h('p', { class: 'mut' }, 'Liest eine ganze Karaoke-Playlist und ordnet passende Videos den offenen Titeln zu. Das kostet nur etwa eine Kontingent-Einheit je 50 Videos statt 100 je Suche. Gesperrte oder nicht einbettbare Videos werden vorher aussortiert. Bei einem Kanal die Kanal-ID (UC…) eintragen: Dann werden alle seine Videos gelesen.'),
    h('div', { class: 'row' }, inp, h('button', { class: 'btn primary', onclick: go }, 'Laden')), msg, out), { wide: true });
}
function songbookDlg(store) {
  const tools = h('div', { class: 'stack' });
  const info = h('p', { class: 'mut' }), list = h('div', { class: 'list scroll tall' }), q = h('input', { class: 'in', type: 'search', placeholder: 'Filtern …' });
  // "ohne Video" und "mit Video" schließen sich aus: Wer das eine einschaltet, schaltet das andere aus
  const only = toggle('Nur Titel ohne Video', false, v => { if (v) onlyHas.set(false); draw(); }), onlyHas = toggle('Nur Titel mit Video', false, v => { if (v) only.set(false); draw(); }), onlyBad = toggle('Nur Probleme', false, () => draw());
  const nIn = h('input', { class: 'in', type: 'number', value: 15, min: 1, max: 90, style: 'width:5.5em' });
  let busy = false;
  function draw() {
    const ed = canEditBook(); tools.style.display = ed ? '' : 'none';
    const all = bookList(), okN = all.filter(b => b.has).length, f = slug(q.value), onlyMissing = only.querySelector('input').checked, onlyWith = onlyHas.querySelector('input').checked, onlyProb = onlyBad.querySelector('input').checked;
    const probs = all.filter(b => b.has && chkOf(b) && chkOf(b) !== 'ok'); probBtn.style.display = ed && probs.length ? '' : 'none'; probBtn.textContent = probs.length + ' Problem-Zuordnungen lösen';
    info.textContent = okN + ' von ' + all.length + ' Titeln haben ein geprüftes Video. Gäste im Kiosk sehen ohne freie Suche nur diese.' + (!cloud.url ? '' : dj.isDj ? ' Cloud-Songbuch aktiv: Änderungen gelten für alle Geräte.' + (cfg.ytKey ? ' Kontingent heute (nur dieses Gerät gezählt): etwa ' + quotaUsed() + ' von 10.000 Einheiten.' : '') + (cloudBook.err ? ' Letztes Speichern fehlgeschlagen: ' + cloudBook.err : '') : ' Zum Ändern bitte als DJ anmelden (Einstellungen → DJ-Anmeldung).');
    put(list, ...all.filter(b => (!f || slug(b.t + ' ' + b.a).includes(f)) && (!onlyMissing || !b.has) && (!onlyWith || b.has) && (!onlyProb || (b.has && chkOf(b) && chkOf(b) !== 'ok'))).slice(0, 300).map(b => h('div', { class: 'qrow' },
      b.has ? tImg(b.vid) : h('div', { class: 'noimg' }, '–'),
      h('div', { class: 'grow' }, h('div', { class: 'st' }, b.t), h('div', { class: 'sa' }, b.a + ' · ' + b.g)),
      b.has && chkOf(b) && chkOf(b) !== 'ok' ? h('span', { class: 'tag bad' }, WHY[chkOf(b)] || 'Problem') : null,
      b.has ? h('a', { class: 'btn ghost', href: mediaUrl(b.vid), target: '_blank', rel: 'noopener', title: 'Video prüfen' }, '↗') : null,
      ed && b.has ? h('button', { class: 'btn ghost icon', title: 'Zuordnung lösen', onclick: () => { bookSetVid(b.id, ''); store.bookChanged(); draw(); } }, ico('x')) : null,
      ed && b.id.slice(0, 2) === 'c-' ? h('button', { class: 'btn ghost', title: 'Eigenen Titel löschen', onclick: () => { bookRemoveCustom(b.id); store.bookChanged(); draw(); } }, 'Löschen') : null,
      !ed ? null : h('button', { class: 'btn' + (b.has ? '' : ' primary'), onclick: () => pickVideo(store, { q: b.a + ' ' + b.t, onPick: (vid, d) => { bookSetVid(b.id, vid, d); store.bookChanged(); draw(); } }) }, b.has ? 'Ändern' : 'Video wählen'))));
  }
  // Ergebnis bleibt im Dialog stehen (nicht nur als kurze Einblendung)
  const autoMsg = h('p', { class: 'warn' }); autoMsg.style.display = 'none';
  const say = t => { autoMsg.textContent = t; autoMsg.style.display = t ? '' : 'none'; };
  async function auto() {
    if (busy) return;
    if (!store.canSearch()) return say('Auf diesem Gerät und unter dieser Adresse ist noch kein YouTube-API-Schlüssel hinterlegt. Bitte unter Einstellungen → YouTube eintragen.');
    busy = true; let n = 0, miss = 0, err = ''; const max = Math.max(1, +nIn.value || 1);
    for (const b of bookList().filter(x => !x.has)) {
      if (n >= max) break;
      say('Ordne zu: ' + b.t + ' …');
      try { const r = await store.search(b.a + ' ' + b.t); if (r[0]) { bookSetVid(b.id, r[0].vid, r[0].dur); n++; } else miss++; } catch (e) { err = e.message; break; }
    }
    busy = false; store.bookChanged(); draw();
    say((n ? n + ' Titel zugeordnet – bitte stichprobenartig prüfen. ' : err ? 'Kein Titel zugeordnet. ' : 'Nichts zuzuordnen. ') + (miss ? miss + ' Titel ohne Treffer. ' : '') + err);
  }
  const probBtn = h('button', { class: 'btn', onclick: () => confirmDlg('Die Zuordnung bei allen Titeln mit Problem lösen? Danach sind sie wieder offen und lassen sich neu zuordnen.', 'Lösen', () => { for (const b of bookList().filter(x => x.has && chkOf(x) && chkOf(x) !== 'ok')) bookSetVid(b.id, ''); store.bookChanged(); draw(); say('Zuordnungen gelöst.'); }) }, '');
  async function check() {
    if (busy) return; if (!store.canSearch()) return say('Es ist kein YouTube-API-Schlüssel hinterlegt (Einstellungen → YouTube).');
    const yt = bookList().filter(b => b.has && !isFile(b.vid)); if (!yt.length) return say('Es gibt noch keine zugeordneten YouTube-Videos.');
    busy = true; say('Prüfe ' + yt.length + ' Videos …');
    try {
      const info = await ytVideoInfo([...new Set(yt.map(b => b.vid))]), ck = {}; let bad = 0;
      for (const b of yt) { const w = (info[b.vid] || {}).why || ''; if (w) bad++; ck[b.id] = { v: b.vid, s: w || 'ok', at: Date.now() }; }
      chkSave(ck); draw(); say(bad ? bad + ' von ' + yt.length + ' Videos haben ein Problem – im Filter „Nur Probleme“ ansehen und ersetzen. Prüfung abgeschlossen.' : 'Alle ' + yt.length + ' Videos sind in Ordnung (einbettbar, nicht gesperrt). Länderbeschränkungen gelten für Deutschland.');
    } catch (e) { say(e.message); }
    busy = false;
  }
  function matchFiles() {
    let n = 0;
    for (const b of bookList().filter(x => !x.has)) {
      const t = slug(b.t), a = slug(b.a).split('-')[0];
      const f = FILES.find(x => { const m = slug(fileName(x)); return m.includes(t) && (!a || m.includes(a)); }) || FILES.find(x => slug(fileName(x)).includes(t));
      if (f) { bookSetVid(b.id, f, 0); n++; }
    }
    store.bookChanged(); draw(); toast(n ? n + ' Titel mit eigenen Dateien verknüpft.' : 'Keine passenden Dateinamen gefunden.', n ? 'good' : 'warn');
  }
  const exp = () => { const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(bookData(), null, 1)], { type: 'application/json' })), download: 'dj-kolja-one-songbuch.json' }); document.body.append(a); a.click(); a.remove(); };
  const file = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none', onchange: async e => {
    try { const d = JSON.parse(await e.target.files[0].text()); const cur = bookData(); Object.assign(cur.vids, d.vids || {}); (d.custom || []).forEach(c => { if (!cur.custom.some(x => x.id === c.id)) cur.custom.push(c); }); LS.set('kk:book', cur); store.bookChanged(); draw(); toast('Songbuch importiert.', 'good'); }
    catch (err) { toast('Die Datei konnte nicht gelesen werden.', 'warn'); }
  } });
  const ct = h('input', { class: 'in', placeholder: 'Eigener Titel' }), ca = h('input', { class: 'in', placeholder: 'Interpret' });
  q.addEventListener('input', draw);
  cloudBook.pull().then(ch => { if (ch) draw(); }).catch(() => { });
  put(tools,
    h('div', { class: 'row wrap' }, FILES.length ? h('button', { class: 'btn', onclick: matchFiles }, 'Eigene Dateien zuordnen (' + FILES.length + ')') : null, h('button', { class: 'btn', onclick: () => playlistDlg(store, draw) }, 'Playlist importieren'), h('button', { class: 'btn', onclick: check }, 'Videos prüfen'), probBtn, h('button', { class: 'btn', onclick: auto }, 'Automatisch zuordnen'), nIn, h('span', { class: 'mut' }, 'Titel pro Durchlauf (je Titel 1 Suche aus dem Tageskontingent)')),
    autoMsg,
    h('div', { class: 'row wrap' }, ct, ca, h('button', { class: 'btn', onclick: () => { if (!ct.value.trim()) return; bookAddCustom(clean(ct.value, 90), clean(ca.value, 60)); ct.value = ca.value = ''; store.bookChanged(); draw(); } }, 'Titel anlegen')),
    h('div', { class: 'row' }, h('button', { class: 'btn', onclick: exp }, 'Exportieren'), h('button', { class: 'btn', onclick: () => file.click() }, 'Importieren'), file, h('span', { class: 'mut' }, cloud.url ? 'Als Sicherung – der Abgleich zwischen den Geräten läuft über die Cloud.' : 'So wandert das Songbuch vom Mac aufs iPad.')));
  const off = () => { if (tools.isConnected) draw(); }; dj.on(off);
  modal('Songbuch', h('div', { class: 'stack' }, info, h('div', { class: 'row wrap' }, q, only, onlyHas, onlyBad), list, tools), { wide: true });
  draw();
}

// ============ Bühnenbild (eigenes Fenster) ============
function viewStage(app, room) {
  const store = new LocalStore(room, 'stage', { from: 'player' });
  store.host(); document.title = 'Bühnenbild · DJ KOLJA ONE Karaoke';
  document.body.classList.add('dark-full');
  Stage(app, store, {});
  const gate = h('button', { class: 'gate', onclick: () => { gate.remove(); const el = document.documentElement; if (el.requestFullscreen) el.requestFullscreen().catch(() => { }); keepAwake(); } },
    logo('big'), h('span', { class: 'eyebrow' }, 'Bühnenbild bereit'), h('span', null, 'Dieses Fenster auf den Beamer ziehen und einmal klicken – für Ton und Vollbild.'));
  app.append(gate);
}
function keepAwake() { const req = () => { if (navigator.wakeLock && !document.hidden) navigator.wakeLock.request('screen').catch(() => { }); }; req(); document.addEventListener('visibilitychange', req); }

// ============ Kiosk (Nebenraum, autark) ============
function viewKiosk(app, room) {
  const store = new LocalStore(room, 'kiosk', { from: 'kiosk' });
  store.host(); document.title = 'Karaoke · DJ KOLJA ONE';
  if (store.state.mode !== 'kiosk') store.dispatch('mode', { mode: 'kiosk' }, { from: 'dj' });
  const djStore = Object.create(store); djStore.dispatch = (a, x) => store.dispatch(a, x, { from: 'dj' });
  document.body.classList.add('dark-full');
  const left = h('div', { class: 'kleft' }), qBox = h('div'), nowLine = h('div', { class: 'know' }), adminBox = h('div');
  let admin = false, taps = 0, tapT = null;
  const dj = (a, x) => store.dispatch(a, x, { from: 'dj' });
  const kcust = h('span'), keb = h('span', { class: 'eyebrow' }, 'Karaoke');
  const brand = h('div', { class: 'kbrand', onclick: () => { taps++; clearTimeout(tapT); tapT = setTimeout(() => taps = 0, 1500); if (taps >= 5) { taps = 0; unlock(); } } }, h('div', { class: 'kbrandl' }, logo(), kcust), keb);
  function unlock() {
    if (admin) { admin = false; return render(store.state); }
    const inp = h('input', { class: 'in big', inputMode: 'numeric', placeholder: 'PIN', type: 'password' });
    const go = () => { if (inp.value.trim() === String(store.state.settings.pin)) { admin = true; m.close(); render(store.state); } else toast('PIN stimmt nicht.', 'warn'); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    const m = modal('Bedienung für den DJ', h('div', { class: 'stack' }, inp, h('button', { class: 'btn primary', onclick: go }, 'Öffnen'))); inp.focus();
  }
  function quizDlg() {
    const sel = h('select', { class: 'in' }, (QFILES.length >= 4 ? [h('option', { value: '#musik' }, 'Song erkennen (mit Musik)')] : []).concat((window.KK_QUIZ || []).map(q => h('option', { value: q.id }, q.title))));
    const go = () => { const v = sel.value; store.dispatch('game', v === '#musik' ? { op: 'mquiz', q: musicRound(8), auto: true } : { op: 'quiz', id: v, auto: true }, { from: 'kiosk' }).then(r => { if (r.ok) m.close(); else toast(r.msg, 'warn'); }); };
    const m = modal('Quiz spielen', h('div', { class: 'stack' }, h('p', { class: 'mut' }, 'Acht Fragen, 20 Sekunden pro Frage. Antworten direkt am Bildschirm oder mit dem Handy über den QR-Code.'), sel, h('button', { class: 'btn primary', onclick: go }, 'Los geht\'s')));
  }
  const quizBtn = h('button', { class: 'btn', onclick: () => { if (store.state.game) store.dispatch('game', { op: 'end' }, { from: 'kiosk' }); else quizDlg(); } });
  // Song beenden: bewusst nur mit langem Druck
  const skip = h('button', { class: 'btn hold' }, h('i'), h('span', null, 'Song beenden (gedrückt halten)'));
  let holdT = null;
  const up = () => { clearTimeout(holdT); skip.classList.remove('holding'); };
  skip.addEventListener('pointerdown', () => { skip.classList.add('holding'); holdT = setTimeout(() => { up(); store.dispatch('next', {}, { from: 'kiosk' }); }, 1600); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => skip.addEventListener(ev, up));

  function render(s) {
    const c = s.current, T = (du, sie) => s.settings.formal ? sie : du;
    const kc = custLogo(store, 'small'); put(kcust, kc); keb.textContent = s.settings.eventName || 'Karaoke'; keb.style.display = kc ? 'none' : '';
    put(nowLine, ...(c ? [h('span', { class: 'eyebrow' }, c.phase === 'intro' ? 'An der Reihe' : 'Jetzt singt'), h('b', null, c.name), h('span', { class: 'sa' }, songLine(c))] : [h('span', { class: 'eyebrow' }, 'Bühne frei'), h('span', { class: 'sa' }, T('Trag dich ein – du bist sofort dran.', 'Tragen Sie sich ein – Sie sind sofort an der Reihe.'))]));
    skip.style.display = c && c.phase === 'live' ? '' : 'none';
    quizBtn.textContent = s.game ? 'Quiz beenden' : 'Quiz spielen'; quizBtn.style.display = s.game || !c || c.phase !== 'live' ? '' : 'none';
    if (c && keyOk(c.vid)) nowLine.append(h('div', { class: 'keyctl' }, h('span', { class: 'lbl' }, 'Tonart'),
      h('button', { class: 'btn icon', onclick: () => store.dispatch('key', { id: c.id, k: (c.key || 0) - 1 }, { from: 'kiosk' }) }, '−'), h('b', null, keyLabel(c.key)),
      h('button', { class: 'btn icon', onclick: () => store.dispatch('key', { id: c.id, k: (c.key || 0) + 1 }, { from: 'kiosk' }) }, '+'), h('span', { class: 'mut' }, T('tiefer oder höher singen', 'tiefer oder höher singen'))));
    put(qBox, h('h2', null, 'Danach ', h('span', { class: 'count' }, s.queue.length || '')),
      !s.queue.length ? h('p', { class: 'mut' }, 'Noch niemand – die Liste ist frei.') : h('div', { class: 'list' }, s.queue.map((e, i) => h('div', { class: 'qrow' }, h('span', { class: 'num' }, i + 1), entryLine(e),
        admin ? h('button', { class: 'btn ghost icon', onclick: () => dj('remove', { id: e.id }) }, ico('x')) : h('span', { class: 'mut' }, '~' + waitMin(s, i) + ' Min.')))));
    const g = guestUrl(store);
    put(adminBox, ...(admin ? [h('div', { class: 'adminbar' }, h('span', { class: 'eyebrow' }, 'DJ-Bedienung'),
      h('div', { class: 'row wrap' }, h('button', { class: 'btn', onclick: () => dj('next') }, 'Weiter'), h('button', { class: 'btn', onclick: () => dj('stop') }, 'Stopp'),
        h('button', { class: 'btn', onclick: () => settingsDlg(djStore) }, 'Einstellungen'), h('button', { class: 'btn', onclick: () => songbookDlg(djStore) }, 'Songbuch'),
        h('button', { class: 'btn', onclick: () => { admin = false; render(store.state); } }, 'Sperren')),
      field('Video-Lautstärke', h('input', { type: 'range', min: 0, max: 100, value: s.play.vol, onchange: e => dj('vol', { v: e.target.value }) })))] :
      g && s.settings.signupOpen ? [h('div', { class: 'kqr' }, qrBox(g, 'small'), h('span', { class: 'mut' }, T('Oder bequem vom Handy aus eintragen.', 'Oder bequem vom Handy aus eintragen.')))] : []));
  }
  app.append(h('div', { class: 'kiosk' }, left, h('aside', { class: 'kright' }, brand, nowLine, skip, quizBtn, h('section', { class: 'panel flat' }, h('h2', null, 'Song aussuchen'), Picker(store, 'kiosk')), qBox, adminBox)));
  Stage(left, store, { kiosk: true });
  store.on(render);
  document.addEventListener('pointerdown', keepAwake, { once: true });
}

// ============ Gäste-Handy ============
function viewGuest(app, room) {
  const hasLocal = !P.has('remote') && !!LS.get('kk:room:' + room);
  const store = hasLocal ? new LocalStore(room, 'stage', { from: 'guest', cid: window.KK.CID }) : new RemoteStore(room);
  document.title = 'Karaoke · DJ KOLJA ONE';
  const nowBox = h('div', { class: 'gnow' }), mineBox = h('div'), listBox = h('div'), main = h('div', { class: 'stack' }), waitBox = h('div', { class: 'gwait' });
  const gameBox = h('div'), mine = {}, shown = {}; let showAll = false, tickT = null;
  function drawGame(s) {
    const g = gameView(s.game); if (!g) return put(gameBox);
    const T = (du, sie) => s.settings.formal ? sie : du, k = g.type + ':' + g.at + ':' + (g.qi || 0);
    const send = (a, x, val) => { mine[k] = val; drawGame(store.state); store.dispatch(a, x).then(r => { if (!r.ok) { if (!/schon/.test(r.msg || '')) delete mine[k]; toast(r.msg || 'Das hat nicht geklappt.', 'warn'); drawGame(store.state); } }); };
    if (g.type === 'battle') {
      if (g.phase === 'result') { const pa = pct(g.ca, g.cb); return put(gameBox, h('section', { class: 'panel accent' }, h('h2', null, 'Battle · Ergebnis'), h('div', { class: 'nm' }, g.ca === g.cb ? 'Unentschieden' : (g.ca > g.cb ? g.a : g.b) + ' gewinnt'), h('p', { class: 'mut' }, g.a + ' ' + pa + ' % · ' + g.b + ' ' + (100 - pa) + ' %'))); }
      return put(gameBox, h('section', { class: 'panel accent' }, h('h2', null, 'Battle'), h('p', null, T('Wer hat dich mehr begeistert?', 'Wer hat Sie mehr begeistert?')),
        h('div', { class: 'qgrid two' }, [['a', g.a], ['b', g.b]].map(([side, n]) => h('button', { class: 'qa' + (mine[k] === side ? ' picked' : ''), onclick: () => send('vote', { side }, side) }, h('span', null, n)))),
        mine[k] ? h('p', { class: 'mut' }, T('Deine Stimme zählt. Du kannst sie noch ändern.', 'Ihre Stimme zählt. Sie können sie noch ändern.')) : null));
    }
    const qz = quizOf(g); if (!qz) return put(gameBox);
    const myK = CID.slice(0, 6), me = g.rank && g.rank.find(x => x.k === myK);
    if (g.phase === 'end') return put(gameBox, h('section', { class: 'panel accent' }, h('h2', null, 'Quiz · Endstand'), g.rank.length ? podium(g.rank, true) : h('p', { class: 'mut' }, 'Danke fürs Mitspielen.'),
      me ? h('div', { class: 'res ' + (me.r <= 3 ? 'good' : 'none') }, h('b', null, T('Du bist Platz ', 'Sie sind Platz ') + me.r), h('span', null, me.p + ' Punkte')) : null, g.rank.length > 3 ? scoreboard(g.rank, 8, myK) : null));
    const name = LS.get('kk:name', '').trim(), reveal = g.phase === 'reveal', my = mine[k];
    if (g.phase === 'lobby') {
      const jk = 'join:' + g.at, ni = h('input', { class: 'in big', placeholder: T('Dein Name', 'Ihr Name'), maxLength: 28, value: name });
      const join = () => { const n = ni.value.trim(); if (!n) return toast('Bitte einen Namen eintragen.', 'warn'); LS.set('kk:name', n); mine[jk] = n; store.dispatch('join', { name: n }).then(r => { if (!r.ok) { delete mine[jk]; toast(r.msg, 'warn'); } drawGame(store.state); }); drawGame(store.state); };
      return put(gameBox, h('section', { class: 'panel accent' }, h('h2', null, 'Quiz · ' + qz.title), mine[jk] ? [h('div', { class: 'nm' }, mine[jk]), h('p', { class: 'mut' }, T('Du bist dabei. Gleich kommt die erste Frage.', 'Sie sind dabei. Gleich kommt die erste Frage.'))] : [h('p', null, T('Gleich geht es los. Melde dich mit deinem Namen an.', 'Gleich geht es los. Bitte mit Namen anmelden.')), ni, h('button', { class: 'btn primary', onclick: join }, 'Mitspielen')]));
    }
    // Abstand zum nächsten Platz (oder Vorsprung vor Platz 2)
    const gapLine = () => { if (!me) return null; const i = g.rank.indexOf(me), ahead = g.rank.slice(0, i).reverse().find(x => x.p > me.p), next = g.rank.find(x => x.p < me.p);
      return h('p', { class: 'mut gap' }, ahead ? (ahead.p - me.p) + ' Punkte hinter ' + ahead.name : next ? T('Du führst mit ', 'Sie führen mit ') + (me.p - next.p) + ' Punkten Vorsprung' : T('Du führst', 'Sie führen')); };
    if (g.phase === 'board') return put(gameBox, h('section', { class: 'panel accent' }, h('h2', null, 'Zwischenstand nach Frage ' + (g.qi + 1) + ' von ' + qz.q.length),
      me ? [h('div', { class: 'res ' + (me.r <= 3 ? 'good' : 'none') }, h('b', null, 'Platz ' + me.r + ' von ' + g.rank.length), h('span', null, me.p + ' Punkte')), gapLine()] : null,
      g.rank.length ? scoreboard(g.rank, showAll ? 60 : 5, myK) : null,
      g.rank.length > 5 ? h('button', { class: 'btn ghost', onclick: () => { showAll = !showAll; drawGame(store.state); } }, showAll ? 'Nur die ersten fünf' : 'Alle Plätze anzeigen') : null));
    // Zeitmessung am Handy: ab dem Moment, in dem die Frage hier erscheint
    if (g.phase === 'q' && !shown[k]) shown[k] = performance.now();
    clearTimeout(tickT);
    const left = g.phase === 'q' && g.auto ? Math.max(0, (g.qt || 20000) - (performance.now() - shown[k])) : 0;
    if (left > 0 && my == null) tickT = setTimeout(() => drawGame(store.state), 1000);
    const nameIn = h('input', { class: 'in', placeholder: T('Dein Name fürs Quiz', 'Ihr Name fürs Quiz'), maxLength: 28, value: name, onchange: e => { LS.set('kk:name', e.target.value); drawGame(store.state); } });
    put(gameBox, h('section', { class: 'panel accent' }, h('h2', null, 'Quiz · Frage ' + (g.qi + 1) + ' von ' + qz.q.length), h('div', { class: 'st wrap' }, qz.q[g.qi][0]),
      !name ? [h('p', { class: 'mut' }, T('Trag zuerst deinen Namen ein, dann kannst du antworten.', 'Bitte zuerst den Namen eintragen.')), nameIn] : quizGrid(g, reveal, i => send('answer', { i, name, ms: Math.round(performance.now() - (shown[k] || performance.now())) }, i), my),
      left > 0 && my == null ? h('div', { class: 'qtime phone' }, h('i', { style: 'width:' + (left / (g.qt || 20000) * 100) + '%' }), h('span', null, Math.ceil(left / 1000) + ' s')) : null,
      reveal ? (my === 0 || (me && me.ok) ? h('div', { class: 'res good' }, h('b', null, 'Richtig!'), me && me.d ? h('span', null, '+' + me.d + ' Punkte') : null, me && me.sb ? h('span', { class: 'small' }, 'inkl. +' + me.sb + ' Serienbonus · ' + me.st + ' richtige in Folge') : null)
        : my != null || (me && me.a) ? h('div', { class: 'res wrong' }, h('b', null, 'Leider falsch'), h('span', null, 'Richtig: ' + qz.q[g.qi][1]))
        : h('div', { class: 'res none' }, h('b', null, 'Keine Antwort'), h('span', null, 'Richtig: ' + qz.q[g.qi][1]))) : my != null ? h('p', { class: 'mut' }, 'Antwort gespeichert.') : null,
      reveal && me ? h('p', { class: 'stand' }, 'Platz ' + me.r + ' von ' + g.rank.length + ' · ' + me.p + ' Punkte ', mvMark(me.mv)) : null,
      reveal ? gapLine() : null));
  }
  const gCust = h('span'), gEvent = h('div', { class: 'eyebrow evname' }), closeBox = h('div');
  let built = false;
  function render(s) {
    if (s) { put(gCust, custLogo(store, 'small')); gEvent.textContent = s.settings.eventName || ''; }
    if (!s) {
      put(waitBox, h('p', { class: 'mut' }, store.conn === 'none' ? 'Die Anmeldung per Handy ist für diese Veranstaltung nicht eingerichtet. Bitte direkt beim DJ melden.' : store.conn === 'err' ? 'Keine Verbindung – bitte Empfang prüfen.' : 'Verbinde mit der Bühne …'));
      return;
    }
    if (!built) { built = true; waitBox.remove(); main.append(closeBox, nowBox, gameBox, mineBox, h('section', { class: 'panel' }, h('h2', null, 'Song aussuchen'), Picker(store, 'guest')), listBox); }
    drawGame(s);
    const T = (du, sie) => s.settings.formal ? sie : du, c = s.current, name = lc(LS.get('kk:name', ''));
    put(closeBox, s.closing ? h('section', { class: 'panel accent' }, h('h2', null, s.settings.eventName || 'Karaoke'), h('div', { class: 'nm' }, 'Danke fürs Mitsingen!'),
      s.settings.reviewUrl ? [h('p', { class: 'mut' }, T('Wie hat es dir gefallen? Über eine kurze Bewertung freuen wir uns sehr.', 'Wie hat es Ihnen gefallen? Über eine kurze Bewertung freuen wir uns sehr.')), h('a', { class: 'btn primary', href: s.settings.reviewUrl, target: '_blank', rel: 'noopener' }, 'Jetzt bewerten')] : null) : null);
    const mine = e => (e.cid && e.cid === window.KK.CID) || (name && lc(e.name) === name);
    put(nowBox, h('span', { class: 'eyebrow' }, s.name), c ? h('div', null, h('b', null, c.name), ' ', c.phase === 'intro' ? 'ist als Nächstes dran' : 'singt gerade', h('div', { class: 'sa' }, c.t + (c.a ? ' · ' + c.a : ''))) : h('div', { class: 'sa' }, 'Die Bühne ist frei.'),
      !s.settings.signupOpen ? h('div', { class: 'alert' }, 'Die Anmeldung ist gerade geschlossen.') : null);
    const my = s.queue.map((e, i) => ({ e, i })).filter(x => mine(x.e)), myIn = s.inbox.filter(mine), iAmUp = c && mine(c);
    put(mineBox, ...(my.length || myIn.length || iAmUp ? [h('section', { class: 'panel accent' }, h('h2', null, T('Deine Songs', 'Ihre Songs')),
      iAmUp ? h('div', { class: 'qrow mine' }, h('div', { class: 'grow' }, h('div', { class: 'st' }, c.t), h('div', { class: 'sa' }, T('Du bist dran – ab auf die Bühne.', 'Sie sind an der Reihe.')))) : null,
      my.map(x => h('div', { class: 'qrow' }, h('div', { class: 'grow' }, h('div', { class: 'st' }, x.e.t), h('div', { class: 'sa' }, 'Platz ' + (x.i + 1) + ' · in etwa ' + waitMin(s, x.i) + ' Min.')))),
      myIn.map(e => h('div', { class: 'qrow' }, h('div', { class: 'grow' }, h('div', { class: 'st' }, e.t), h('div', { class: 'sa' }, 'Wunsch liegt beim DJ')))))] : []));
    put(listBox, h('section', { class: 'panel' }, h('h2', null, 'Reihenfolge'), publicQueue(s, mine)));
  }
  app.append(h('div', { class: 'page guest' }, h('header', { class: 'top center' }, logo(), gCust), gEvent, waitBox, main, legalFoot()));
  store.on(render); store.onConn(() => { if (!store.state) render(null); });
}

// ============ Startseite ============
function viewHome(app) {
  const code = eventCode(), main = code + 'M', side = code + 'N';
  const rc = h('input', { class: 'in', placeholder: 'Raum-Code, z. B. ' + main, maxLength: 12, style: 'text-transform:uppercase' });
  const cardEl = (eyebrow, title, text, ...btns) => h('section', { class: 'panel hcard' }, h('span', { class: 'eyebrow' }, eyebrow), h('h2', { class: 'h' }, title), h('p', { class: 'mut' }, text), h('div', { class: 'row wrap' }, btns));
  app.append(h('div', { class: 'page home' }, h('header', { class: 'hero' }, logo('big'), h('span', { class: 'eyebrow' }, 'Karaoke'), h('p', { class: 'sub' }, 'Ein Abend. Eine Bühne. Jede Stimme zählt.')),
    h('main', { class: 'hgrid' },
      cardEl('Mainstage', 'Vom DJ-Pult gesteuert', 'Konsole auf dem Laptop, Bühnenbild auf dem Beamer. Du entscheidest, wer wann singt.',
        h('a', { class: 'btn primary', href: link('dj', main) }, 'DJ-Konsole öffnen'), h('a', { class: 'btn', href: link('stage', main), target: 'kk-stage-' + main }, 'Bühnenbild')),
      cardEl('Nebenraum', 'Autark für die Gäste', 'Ein Bildschirm für alles: Song aussuchen, Namen eintragen, singen. Läuft ohne DJ.',
        h('a', { class: 'btn primary', href: link('kiosk', side) }, 'Kiosk starten'), h('a', { class: 'btn', href: link('dj', side, { m: 'kiosk' }) }, 'Konsole dazu')),
      cardEl('Zweites Gerät', 'Raum fernsteuern', 'Den Nebenraum vom DJ-Pult im Blick behalten – oder die Mainstage vom iPad aus bedienen. Benötigt die Cloud-Verbindung.',
        rc, h('button', { class: 'btn', onclick: () => { const r = rc.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); if (r) location.href = link('dj', r, { remote: 1 }); } }, 'Verbinden'))),
    h('footer', { class: 'foot' }, 'Event-Code ' + code + ' · Mainstage ' + main + ' · Nebenraum ' + side + (MOCK ? ' · Demo-Modus' : ''), h('br'), h('a', { href: location.pathname + '?mock=1' }, 'Demo-Modus ohne Internet'), ' · ONE — aus einer Hand. Einmalig erlebt.', legalFoot().querySelector('.legal'))));
}

// ============ Start ============
window.addEventListener('DOMContentLoaded', () => {
  const app = $('#app');
  const room = (P.get('r') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  document.body.classList.add('v-' + VIEW);
  if (VIEW === 'dj' || VIEW === 'stage' || VIEW === 'kiosk') { dj.init(); cloudBook.pull().catch(() => { }); }
  if (VIEW === 'dj') viewDJ(app, room || eventCode() + 'M');
  else if (VIEW === 'stage') viewStage(app, room || eventCode() + 'M');
  else if (VIEW === 'kiosk') viewKiosk(app, room || eventCode() + 'N');
  else if (VIEW === 'g') { if (room) viewGuest(app, room); else app.append(h('div', { class: 'page guest' }, logo(), h('p', { class: 'mut' }, 'Bitte den QR-Code am Bühnenbild scannen.'))); }
  else viewHome(app);
});
})();
