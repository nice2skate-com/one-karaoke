/* DJ KOLJA ONE · Karaoke — Kern: Zustand, Synchronisation, YouTube */
(() => {
'use strict';
const P = new URLSearchParams(location.search);
const MOCK = P.has('mock');
const BUS_TEST = P.get('bus') === 'bc';

// ---------- kleine Helfer ----------
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* voll oder gesperrt */ } }
};
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const lc = s => String(s || '').toLowerCase().trim();
const clean = (x, n) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, n);
const slug = s => lc(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fmtDur = sec => { sec = Math.max(0, Math.round(sec || 0)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };
const rndCode = n => Array.from({ length: n }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

// ---------- Geräte-Konfiguration ----------
const cfg = Object.assign({ ytKey: '', sbUrl: '', sbKey: '', code: '' }, LS.get('kk:cfg', {}));
const saveCfg = () => LS.set('kk:cfg', cfg);
const KC = window.KK_CONFIG || {};
const cloud = {
  get url() { return (cfg.sbUrl || KC.supabaseUrl || '').trim(); },
  get key() { return (cfg.sbKey || KC.supabaseKey || '').trim(); },
  get on() { return BUS_TEST || !!(this.url && this.key); }
};
let CID = LS.get('kk:cid'); if (!CID) { CID = uid(); LS.set('kk:cid', CID); }
function eventCode() { if (!cfg.code) { cfg.code = rndCode(4); saveCfg(); } return cfg.code; }

// ---------- Songbuch ----------
const bookData = () => Object.assign({ vids: {}, custom: [] }, LS.get('kk:book', {}));
function bookList() {
  const d = bookData();
  const base = (window.KK_CATALOG || []).map(([t, a, g, top]) => ({ id: slug(a + '-' + t), t, a, g, top: !!top }));
  return base.concat(d.custom.map(c => Object.assign({ g: 'Eigene' }, c))).map(b => {
    const v = d.vids[b.id]; b.vid = v ? v.vid : ''; b.dur = v ? v.dur : 0; b.has = !!b.vid; return b;
  });
}
const bookFind = id => bookList().find(b => b.id === id);
function bookSetVid(id, vid, dur) { const d = bookData(); if (vid) d.vids[id] = { vid, dur: dur || 0 }; else delete d.vids[id]; LS.set('kk:book', d); cloudBook.save(id); }
function bookAddCustom(t, a, vid, dur) {
  const d = bookData(); const id = 'c-' + slug(a + '-' + t);
  if (!d.custom.some(c => c.id === id) && !(window.KK_CATALOG || []).some(([ct, ca]) => slug(ca + '-' + ct) === id.slice(2))) d.custom.push({ id, t, a });
  if (vid) d.vids[id] = { vid, dur: dur || 0 };
  LS.set('kk:book', d); cloudBook.save(id); return id;
}
function bookRemoveCustom(id) { const d = bookData(); d.custom = d.custom.filter(c => c.id !== id); delete d.vids[id]; LS.set('kk:book', d); cloudBook.save(id, true); }
// kompakte Fassung für Gäste-Handys: Katalog liegt dort schon vor, es fehlen nur Eigene + "hat Video"
function bookPub() { const d = bookData(); const l = bookList(); const n = (window.KK_CATALOG || []).length; return { m: l.slice(0, n).map(b => b.has ? 1 : 0).join(''), c: l.slice(n).map(b => ({ id: b.id, t: b.t, a: b.a, g: b.g, has: b.has })) }; }
function bookFromPub(p) {
  const base = (window.KK_CATALOG || []).map(([t, a, g, top], i) => ({ id: slug(a + '-' + t), t, a, g, top: !!top, vid: '', dur: 0, has: !!p && p.m[i] === '1' }));
  return base.concat(((p && p.c) || []).map(c => Object.assign({ vid: '', dur: 0 }, c)));
}

// ---------- Zustand ----------
function initState(room, mode) {
  return {
    v: 1, rev: 0, room, mode, name: mode === 'kiosk' ? 'Nebenraum' : 'Mainstage',
    settings: {
      signupOpen: true, approve: mode !== 'kiosk', maxPerGuest: 2, autoNext: true, autoStart: 0, fair: true,
      formal: false, filter: true, blockWords: '', guestSearch: mode === 'kiosk', bar: true, pin: String(Math.floor(1000 + Math.random() * 9000)), ticker: ''
    },
    queue: [], inbox: [], current: null, play: { want: 'pause', seek: null, vol: 100 }, now: { st: 'idle' },
    last: null, note: null, history: [], seen: []
  };
}
const ok = (msg, extra) => Object.assign({ ok: true, msg }, extra);
const fail = msg => ({ ok: false, msg });
const VID_RE = /^[\w-]{11}$/;
// Eigene Videodateien: Ordner "videos/" neben der App oder eine direkte https-Adresse
const FILE_RE = /^(https:\/\/[^\s"'<>]{4,400}|videos\/[^"'<>]{1,240})\.(mp4|webm|m4v|mov)(\?[^\s"'<>]*)?$/i;
const isFile = v => !!v && !VID_RE.test(v);
const mediaOk = v => VID_RE.test(v || '') || FILE_RE.test(v || '');
// Tonart-Verschiebung in Halbtönen; funktioniert nur bei eigenen Videodateien neben der App
const clampKey = k => Math.max(-6, Math.min(6, Math.round(+k || 0)));
const keyOk = v => isFile(v) && !/^https?:/i.test(v);
function mkEntry(x) {
  return { id: uid(), name: clean(x.name, 28), t: clean(x.t, 90), a: clean(x.a, 60), vid: mediaOk(x.vid) ? x.vid : '', dur: Math.max(0, Math.min(3600, +x.dur || 0)), sid: clean(x.sid, 90), key: clampKey(x.key), by: 'dj', ts: Date.now() };
}
function sungCount(s, name) { const n = lc(name); return s.history.filter(x => x.sung && lc(x.name) === n).length + (s.current && lc(s.current.name) === n ? 1 : 0); }
function insertFair(s, e) {
  if (!s.settings.fair) { s.queue.push(e); return; }
  const cnt = {};
  const round = q => { const n = lc(q.name); if (cnt[n] == null) cnt[n] = sungCount(s, q.name); return cnt[n]++; };
  const rs = s.queue.map(round), mine = round(e);
  let i = rs.findIndex(r => r > mine); if (i < 0) i = rs.length;
  s.queue.splice(i, 0, e);
}
function toStage(s, id) {
  const i = id ? s.queue.findIndex(q => q.id === id) : 0; if (i < 0 || !s.queue[i]) return false;
  const [e] = s.queue.splice(i, 1);
  s.current = Object.assign(e, { phase: 'intro', at: Date.now(), startedAt: 0 });
  s.play.want = 'pause'; s.play.seek = null; s.now = { st: 'idle' }; return true;
}
function finish(s, sung, auto) {
  const c = s.current; if (!c) return;
  s.history.unshift({ id: c.id, name: c.name, t: c.t, a: c.a, vid: c.vid, dur: c.dur, sid: c.sid, sung: !!sung, ts: Date.now() });
  if (s.history.length > 300) s.history.length = 300;
  s.last = sung ? { name: c.name, t: c.t, a: c.a, at: Date.now() } : null;
  s.current = null; s.play.want = 'pause'; s.play.seek = null; s.now = { st: 'idle' };
  if (auto !== false && s.settings.autoNext && s.queue.length) toStage(s);
}
const GUEST_ACTS = ['add', 'vote', 'answer', 'join'];
const NAME_NO = 'Dieser Name ist hier leider nicht möglich. Bitte einen anderen wählen.';
const badText = (t, S) => S.filter !== false && !!(window.KK_FILTER && window.KK_FILTER.bad(t, S.blockWords));
const SETTABLE = ['filter', 'blockWords', 'karafun', 'signupOpen', 'approve', 'maxPerGuest', 'autoNext', 'autoStart', 'fair', 'formal', 'guestSearch', 'bar', 'pin', 'ticker'];

function reduce(s, a, x, m) {
  x = x || {}; m = m || { from: 'dj' };
  const S = s.settings, dj = m.from === 'dj' || m.from === 'player';
  if (m.rid) { s.seen = s.seen || []; if (s.seen.includes(m.rid)) return { ok: false, dup: true }; s.seen.push(m.rid); if (s.seen.length > 80) s.seen.shift(); }
  if (!dj && !GUEST_ACTS.includes(a) && !(m.from === 'kiosk' && (a === 'play' || a === 'next' || (a === 'key' && s.current && x.id === s.current.id) || (a === 'game' && ['quiz', 'mquiz', 'end', 'begin'].includes(x.op))))) return fail('Nicht erlaubt.');
  const find = id => s.queue.find(q => q.id === id) || (s.current && s.current.id === id ? s.current : null);
  switch (a) {
    case 'add': {
      const e = mkEntry(x);
      if (!e.name) return fail('Bitte einen Namen eintragen.');
      if (!e.t) return fail('Bitte einen Titel wählen.');
      if (!dj && isFile(e.vid)) { e.vid = ''; e.dur = 0; } // Gäste dürfen keine fremden Dateien einschleusen
      if (e.sid && !e.vid) { const b = bookFind(e.sid); if (b && b.vid) { e.vid = b.vid; e.dur = b.dur; } }
      if (!dj) {
        if (!S.signupOpen) return fail('Die Anmeldung ist gerade geschlossen.');
        // Namen und freie Wünsche vor der Anzeige prüfen; Songbuch-Titel sind vom DJ kuratiert und werden aus dem Songbuch übernommen
        if (badText(e.name, S)) return fail(NAME_NO);
        const known = e.sid && bookFind(e.sid);
        if (known) { e.t = known.t; e.a = known.a; } else { e.sid = ''; if (badText(e.t + ' ' + e.a, S)) return fail('Dieser Titel ist hier leider nicht möglich.'); }
        const open = s.queue.concat(s.inbox);
        const mine = open.filter(q => (m.cid && q.cid === m.cid) || lc(q.name) === lc(e.name)).length;
        if (mine >= S.maxPerGuest) return fail('Maximal ' + S.maxPerGuest + ' offene Songs pro Person – danach gern wieder.');
        if (open.some(q => lc(q.t) === lc(e.t) && lc(q.a) === lc(e.a))) return fail('Dieser Song steht schon auf der Liste.');
        if (s.mode === 'kiosk' && !e.vid) return fail('Zu diesem Titel gibt es noch kein Video.');
        e.by = m.from; e.cid = m.cid || '';
        if (S.approve && s.mode !== 'kiosk') { s.inbox.push(e); return ok('Angekommen – der DJ nimmt den Wunsch gleich auf.', { id: e.id }); }
      }
      insertFair(s, e);
      if (s.mode === 'kiosk' && !s.current && S.autoNext) toStage(s);
      return ok('„' + e.t + '“ steht auf der Liste.', { id: e.id });
    }
    case 'approve': { const i = s.inbox.findIndex(q => q.id === x.id); if (i < 0) return fail(); insertFair(s, s.inbox.splice(i, 1)[0]); return ok(); }
    case 'reject': { s.inbox = s.inbox.filter(q => q.id !== x.id); return ok(); }
    case 'remove': { s.queue = s.queue.filter(q => q.id !== x.id); return ok(); }
    case 'move': { const i = s.queue.findIndex(q => q.id === x.id), j = i + (x.d || 0); if (i < 0 || j < 0 || j >= s.queue.length) return fail(); const [e] = s.queue.splice(i, 1); s.queue.splice(j, 0, e); return ok(); }
    case 'top': { const i = s.queue.findIndex(q => q.id === x.id); if (i < 0) return fail(); s.queue.unshift(s.queue.splice(i, 1)[0]); return ok(); }
    case 'edit': {
      const e = find(x.id) || s.inbox.find(q => q.id === x.id); if (!e) return fail();
      if (x.name != null) e.name = clean(x.name, 28) || e.name;
      if (x.t != null) e.t = clean(x.t, 90) || e.t;
      if (x.a != null) e.a = clean(x.a, 60);
      if (x.key != null) e.key = clampKey(x.key);
      if (x.vid != null && (x.vid === '' || mediaOk(x.vid))) { e.vid = x.vid; e.dur = +x.dur || 0; if (e === s.current) { s.now = { st: 'idle' }; s.play.want = 'pause'; e.phase = 'intro'; } }
      return ok();
    }
    case 'key': { const e = find(x.id); if (!e) return fail(); e.key = clampKey(x.k); return ok(); }
    case 'stage': { if (s.current) finish(s, !!s.current.startedAt, false); return toStage(s, x.id) ? ok() : fail('Die Warteschlange ist leer.'); }
    case 'play': {
      if (!s.current) return toStage(s) ? ok() : fail('Die Warteschlange ist leer.');
      if (!s.current.vid) { s.current.phase = 'live'; s.current.startedAt = s.current.startedAt || Date.now(); s.now = { st: 'extern' }; return ok(); }
      s.play.want = 'play'; return ok();
    }
    case 'pause': s.play.want = 'pause'; return ok();
    case 'restart': s.play.seek = { n: uid(), to: 0 }; s.play.want = 'play'; return ok();
    case 'seek': s.play.seek = { n: uid(), to: Math.max(0, +x.to || 0) }; return ok();
    case 'vol': s.play.vol = Math.max(0, Math.min(100, Math.round(+x.v))); return ok();
    case 'next': { if (!s.current) return toStage(s) ? ok() : fail('Die Warteschlange ist leer.'); finish(s, !!s.current.startedAt); return ok(); }
    case 'stop': {
      const c = s.current; if (!c) return fail();
      if (!c.startedAt) { delete c.phase; s.queue.unshift(c); s.current = null; s.play.want = 'pause'; s.now = { st: 'idle' }; }
      else finish(s, true, false);
      return ok();
    }
    case 'status': {
      const c = s.current; if (!c || (x.key && x.key !== c.id + ':' + c.vid)) return { ok: false };
      if (x.st === 'ended') { finish(s, true); return ok(); }
      if (x.st === 'error') {
        if (s.mode === 'kiosk') { s.note = { text: 'Dieses Video lässt sich leider nicht abspielen – bitte eine andere Version wählen.', at: Date.now() }; finish(s, false); }
        else { s.now = { st: 'error', err: x.err }; s.play.want = 'pause'; }
        return ok();
      }
      if (s.now.st === x.st) return { ok: false };
      s.now = { st: x.st };
      if (x.st === 'playing') { s.play.want = 'play'; c.phase = 'live'; c.startedAt = c.startedAt || Date.now(); }
      if (x.st === 'paused') s.play.want = 'pause';
      return ok();
    }
    case 'set': { for (const k of SETTABLE) if (k in x) S[k] = k === 'maxPerGuest' ? Math.max(1, Math.min(9, +x[k] || 1)) : k === 'autoStart' ? Math.max(0, Math.min(60, +x[k] || 0)) : k === 'ticker' ? clean(x[k], 140) : k === 'blockWords' ? clean(x[k], 300) : k === 'pin' ? (clean(x[k], 8) || S.pin) : x[k]; if ('name' in x) s.name = clean(x.name, 30) || s.name; return ok(); }
    // Spiele: Battle (Abstimmung zwischen zwei Auftritten) und Musik-Quiz
    case 'game': {
      const g = s.game, now = Date.now();
      if (x.op === 'battle') { if (!clean(x.a, 28) || !clean(x.b, 28)) return fail('Bitte beide Namen eintragen.'); s.game = { type: 'battle', a: clean(x.a, 28), b: clean(x.b, 28), phase: 'vote', votes: {}, at: now }; return ok(); }
      if (x.op === 'quiz') { if (!quizFind(x.id)) return fail('Quiz nicht gefunden.'); s.game = { type: 'quiz', id: x.id, qi: 0, phase: 'lobby', qAt: now, pAt: now, ans: {}, scores: {}, at: now, auto: !!x.auto }; return ok(); }
      if (x.op === 'mquiz') { // Song erkennen: Fragen entstehen aus den eigenen Musikdateien
        const cq = (Array.isArray(x.q) ? x.q : []).slice(0, 12).map(q => ({ f: String(q.f || ''), c: clean(q.c, 110), w: (q.w || []).slice(0, 3).map(v => clean(v, 110)) })).filter(q => QUIZ_RE.test(q.f) && q.c && q.w.length === 3);
        if (cq.length < 2) return fail('Für „Song erkennen“ werden mindestens vier Musikdateien im Ordner „quiz“ gebraucht.');
        s.game = { type: 'quiz', id: 'musik', cq, qi: 0, phase: 'lobby', qAt: now, pAt: now, ans: {}, scores: {}, at: now, auto: !!x.auto, playN: 0 }; return ok();
      }
      if (!g) return fail();
      if (x.op === 'end') { s.game = null; return ok(); }
      if (x.op === 'begin' && g.type === 'quiz') { if (g.phase !== 'lobby') return { ok: false }; g.phase = 'q'; g.qAt = g.pAt = now; g.ans = {}; return ok(); }
      if (x.op === 'replay' && g.cq) { g.playN = (g.playN || 0) + 1; return ok(); }
      if (x.op === 'reveal') {
        if (g.type === 'battle') { g.phase = 'result'; g.strict = !!x.strict; return ok(); }
        if (g.phase !== 'q') return fail();
        const before = rankMap(g.scores);
        // Wertung nach Kahoot-Prinzip: richtige Antwort 500–1000 Punkte je nach Tempo, ab der 2. richtigen Antwort in Folge Serienbonus (+100 je Antwort, höchstens +500)
        for (const cid in g.scores) { const sc = g.scores[cid]; sc.d = 0; sc.sb = 0; sc.ok = false; if (!g.ans[cid]) sc.st = 0; }
        for (const cid in g.ans) {
          const a = g.ans[cid], sc = g.scores[cid] || (g.scores[cid] = { name: a.name, p: 0 }); sc.name = a.name;
          if (a.i === 0) { sc.st = (sc.st || 0) + 1; sc.sb = Math.min(5, sc.st - 1) * 100; sc.d = quizPoints(a.t) + sc.sb; sc.p += sc.d; sc.ok = true; }
          else sc.st = 0;
        }
        const after = rankMap(g.scores);
        for (const cid in g.scores) g.scores[cid].mv = before[cid] ? before[cid] - after[cid] : 0; // positiv = nach oben gerückt
        g.phase = 'reveal'; g.pAt = now; return ok();
      }
      if (x.op === 'next' && g.type === 'quiz') {
        // Ablauf je Frage: Frage → Auflösung → Zwischenstand → nächste Frage; nach der letzten Auflösung direkt das Podest
        if (g.phase === 'q' || g.phase === 'lobby') return fail('Bitte zuerst auflösen.');
        if (g.phase === 'end') return { ok: false };
        const last = g.qi + 1 >= quizOf(g).q.length;
        if (g.phase === 'reveal' && !last) g.phase = 'board';
        else if (last) g.phase = 'end';
        else { g.qi++; g.phase = 'q'; g.qAt = now; g.ans = {}; }
        g.pAt = now;
        return ok();
      }
      return fail();
    }
    case 'vote': { const g = s.game; if (!g || g.type !== 'battle' || g.phase !== 'vote') return fail('Die Abstimmung ist beendet.'); if (x.side !== 'a' && x.side !== 'b') return fail(); g.votes[m.cid || 'x' + uid()] = { s: x.side, n: !(m.fs && m.fs < g.at) }; return ok('Stimme gezählt.'); }
    case 'join': { const g = s.game, name = clean(x.name, 28); if (!g || g.type !== 'quiz') return fail('Gerade läuft kein Quiz.'); if (!m.cid || !name) return fail('Bitte einen Namen eintragen.'); if (badText(name, S)) return fail(NAME_NO); const sc = g.scores[m.cid] || (g.scores[m.cid] = { name, p: 0, d: 0, ok: false }); sc.name = name; return ok('Du bist dabei.'); }
    case 'answer': {
      const g = s.game; if (!g || g.type !== 'quiz' || g.phase !== 'q') return fail('Diese Frage ist schon geschlossen.');
      const name = clean(x.name, 28), i = Math.round(+x.i); if (!m.cid || !name) return fail('Bitte zuerst einen Namen eintragen.'); if (badText(name, S)) return fail(NAME_NO); if (!(i >= 0 && i <= 3)) return fail();
      if (g.ans[m.cid]) return fail('Antwort ist schon abgegeben.');
      // Zeit genauer messen: Das Handy misst selbst vom Erscheinen der Frage bis zum Tippen (ohne Funk-Verzögerung).
      // Übernommen wird das nur, wenn es höchstens 2 Sekunden unter der hier gemessenen Zeit liegt – so lässt sich kaum mogeln.
      const host = Date.now() - g.qAt, ms = Number(x.ms);
      const t = isFinite(ms) && ms >= 0 ? Math.max(Math.max(0, host - 2000), Math.min(host, Math.round(ms))) : host;
      g.ans[m.cid] = { i, t, name }; return ok('Antwort gespeichert.');
    }
    case 'mode': { if (x.mode !== 'kiosk' && x.mode !== 'stage') return fail(); if (s.mode === x.mode) return { ok: false }; s.mode = x.mode; S.approve = x.mode !== 'kiosk'; S.guestSearch = x.mode === 'kiosk'; if (s.name === 'Mainstage' || s.name === 'Nebenraum') s.name = x.mode === 'kiosk' ? 'Nebenraum' : 'Mainstage'; return ok(); }
    case 'clear': {
      if (x.what === 'queue' || x.what === 'all') { s.queue = []; s.inbox = []; }
      if (x.what === 'history' || x.what === 'all') { s.history = []; s.last = null; }
      if (x.what === 'all') { s.current = null; s.play.want = 'pause'; s.now = { st: 'idle' }; }
      return ok();
    }
  }
  return fail('Unbekannte Aktion.');
}
// Quiz zu einem laufenden Spiel: fest hinterlegt oder aus eigenen Musikdateien erzeugt
// Platz je Teilnehmer (gleiche Punkte = gleicher Platz) und Rangliste für die Anzeige
const QTIME = 20000; // Antwortzeit je Frage
const quizPoints = t => Math.round(1000 - 500 * Math.min(1, Math.max(0, t / QTIME)));
function rankMap(scores) {
  const l = Object.entries(scores).sort((a, b) => b[1].p - a[1].p || a[1].name.localeCompare(b[1].name)), m = {};
  l.forEach(([cid, x], i) => { m[cid] = i && l[i - 1][1].p === x.p ? m[l[i - 1][0]] : i + 1; });
  return m;
}
function rankList(scores, ans) {
  const rm = rankMap(scores);
  return Object.entries(scores).map(([cid, x]) => ({ k: cid.slice(0, 6), name: x.name, p: x.p, d: x.d || 0, ok: !!x.ok, mv: x.mv || 0, a: !!(ans && ans[cid]), st: x.st || 0, sb: x.sb || 0, r: rm[cid] })).sort((a, b) => a.r - b.r || a.name.localeCompare(b.name)).slice(0, 60);
}
const quizOf = g => g && g.cq ? { id: 'musik', title: 'Song erkennen', music: true, q: g.cq.map(q => ['Welcher Song ist das?', q.c].concat(q.w)) } : quizFind(g && g.id);
const quizFind = id => (window.KK_QUIZ || []).find(q => q.id === id);
// Reihenfolge der vier Antworten: auf allen Geräten gleich gemischt; Wert 0 = richtige Antwort
function quizOrder(id, qi) {
  let h = 2166136261; for (const ch of id + ':' + qi) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const o = [0, 1, 2, 3]; for (let i = 3; i > 0; i--) { h = Math.imul(h ^ (h >>> 13), 1274126177); const j = (h >>> 0) % (i + 1); [o[i], o[j]] = [o[j], o[i]]; }
  return o;
}
// Öffentliche Sicht auf ein Spiel: nur Zählerstände, keine einzelnen Stimmen
function gameView(g) {
  if (!g || g.view) return g || null;
  if (g.type === 'battle') {
    // Stimmen getrennt nach Geräten, die schon vor dem Battle verbunden waren (bekannt), und solchen, die erst währenddessen auftauchten (neu)
    const v = Object.values(g.votes).map(x => typeof x === 'string' ? { s: x, n: false } : x), c = (side, n) => v.filter(x => x.s === side && (n == null || x.n === n)).length;
    const ka = c('a', false), kb = c('b', false), na = c('a', true), nb = c('b', true), nw = na + nb;
    // Auffällig: viele neue Geräte im Verhältnis zu den bekannten und fast alle für dieselbe Seite
    const sus = nw >= 5 && nw > (ka + kb) * .5 && Math.max(na, nb) >= nw * .8;
    const strict = g.phase === 'result' && !!g.strict;
    return { view: 1, type: 'battle', a: g.a, b: g.b, phase: g.phase, at: g.at, ca: strict ? ka : ka + na, cb: strict ? kb : kb + nb, ka, kb, na, nb, sus, strict };
  }
  const an = Object.values(g.ans), rank = rankList(g.scores, g.ans);
  return { view: 1, type: 'quiz', qt: QTIME, id: g.id, qi: g.qi, phase: g.phase, at: g.at, qAt: g.qAt, pAt: g.pAt, names: g.phase === 'lobby' ? Object.values(g.scores).map(x => x.name).slice(0, 40) : undefined, auto: !!g.auto, cq: g.cq ? g.cq.map(q => ({ c: q.c, w: q.w })) : undefined, count: an.length, right: an.filter(a => a.i === 0).length, players: Object.keys(g.scores).length, rank, top: rank.slice(0, 8), dist: g.phase === 'reveal' || g.phase === 'end' ? [0, 1, 2, 3].map(i => an.filter(a => a.i === i).length) : undefined };
}
function pub(s) { const c = JSON.parse(JSON.stringify(s)); delete c.settings.pin; delete c.settings.blockWords; delete c.seen; c.game = gameView(s.game); c.history = c.history.slice(0, 20); c.hasKey = !!cfg.ytKey || MOCK; return c; }
function waitMin(s, idx) { let sec = s.current ? 150 : 0; for (let i = 0; i < idx; i++) sec += (s.queue[i].dur || 230) + 50; return Math.max(1, Math.round(sec / 60)); }

// ---------- YouTube ----------
function parseVid(str) {
  str = String(str || '').trim(); if (VID_RE.test(str)) return str;
  const m = str.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/); return m ? m[1] : '';
}
const parseMedia = str => parseVid(str) || (/^https:/i.test(String(str || '').trim()) && FILE_RE.test(String(str).trim()) ? String(str).trim() : '');
const fileName = v => { try { return decodeURIComponent(String(v).split('?')[0].split('/').pop()); } catch (e) { return String(v); } };
const fileMeta = v => cleanTitle(fileName(v).replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' '));
const dirCache = {};
function listDir(dir, ext) {
  return dirCache[dir] || (dirCache[dir] = (async () => {
    try { const r = await fetch(dir + 'index.json', { cache: 'no-store' }); if (r.ok) { const j = await r.json(); if (Array.isArray(j)) return j.filter(n => ext.test(n)).map(n => dir + encodeURI(n)); } } catch (e) { /* kein Verzeichnis */ }
    try {
      const r = await fetch(dir, { cache: 'no-store' }); if (!r.ok) return [];
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      return [...doc.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(x => ext.test(x) && !/^(https?:|\/|\.\.)/.test(x)).map(x => dir + x);
    } catch (e) { return []; }
  })());
}
const localVideos = () => listDir('videos/', /\.(mp4|webm|m4v|mov)$/i).then(l => l.filter(x => FILE_RE.test(x)));
// Musik für das Quiz "Song erkennen": Ordner quiz/ (Audio oder Video), ersatzweise die Karaoke-Videos
const QUIZ_RE = /^(quiz|videos)\/[^"'<>]{1,240}\.(mp3|m4a|aac|wav|ogg|flac|mp4|webm|m4v|mov)$/i;
const quizFiles = () => listDir('quiz/', /\.(mp3|m4a|aac|wav|ogg|flac|mp4|webm|m4v|mov)$/i).then(async l => (l.length >= 4 ? l : l.concat(await localVideos())).filter(x => QUIZ_RE.test(x)));
const thumb = vid => 'https://i.ytimg.com/vi/' + vid + '/mqdefault.jpg';
function decodeEnt(s) { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; }
function cleanTitle(raw) {
  let s = String(raw || '').replace(/[([{][^)\]}]*(karaoke|lyrics|instrumental|version|backing|hd|4k|key)[^)\]}]*[)\]}]/ig, ' ')
    .replace(/\b(karaoke version|karaoke|with lyrics|lyrics|instrumental|sing king|karafun|stingray)\b/ig, ' ')
    .replace(/[|•·]+/g, ' ').replace(/\s{2,}/g, ' ').replace(/^[\s\-–:]+|[\s\-–:]+$/g, '');
  const p = s.split(/\s[-–]\s/);
  return p.length >= 2 ? { a: p[0].trim(), t: p.slice(1).join(' - ').trim() } : { a: '', t: s || String(raw || '') };
}
function isoDur(d) { const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(d || ''); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0; }
// ---------- YouTube-Zugang: ein Weg für alle Anfragen, mit Kontingent-Zähler (Schätzung für dieses Gerät) ----------
const pacificDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
function quotaUsed() { const q = LS.get('kk:quota', {}); return q.day === pacificDay() ? q.used || 0 : 0; }
function quotaAdd(n) { LS.set('kk:quota', { day: pacificDay(), used: quotaUsed() + n }); }
async function ytApi(path, params, cost) {
  if (!cfg.ytKey) throw new Error('Kein YouTube-API-Schlüssel hinterlegt.');
  let r;
  try { r = await fetch('https://www.googleapis.com/youtube/v3/' + path + '?' + new URLSearchParams(Object.assign({}, params, { key: cfg.ytKey.trim() }))); }
  catch (e) { throw new Error('Google ist von diesem Browser aus nicht erreichbar (' + e.message + '). Meist liegt das an der Internetverbindung oder an einem Werbeblocker bzw. einer Browser-Erweiterung.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const reason = j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason, msg = (j.error && j.error.message) || '';
    if (/quota|rateLimit|dailyLimit/i.test(reason || '') || /quota/i.test(msg)) throw new Error('Das YouTube-Tageskontingent ist aufgebraucht – ab etwa 9 Uhr morgens geht es wieder.');
    // "Permission denied on the service" ist Googles Sammelmeldung: Kontingent leer ODER Schlüssel für diese Adresse nicht freigegeben
    if (/permission denied on the service/i.test(msg)) throw new Error('Google lehnt die Anfrage ab (Status ' + r.status + '). Entweder ist das Tageskontingent aufgebraucht, oder der Schlüssel ist für die Adresse ' + location.origin + ' nicht freigegeben bzw. nicht richtig eingetragen.');
    if (r.status === 404 && /playlist/i.test(msg + reason)) throw new Error('Diese Playlist gibt es nicht oder sie ist privat.');
    throw new Error('YouTube-Anfrage fehlgeschlagen' + (msg ? ': ' + msg : '.') + ' (Status ' + r.status + (reason ? ', ' + reason : '') + ')');
  }
  quotaAdd(cost); return j;
}
async function ytSearch(q) {
  q = clean(q, 80); if (!q) return [];
  const k = lc(q), cache = LS.get('kk:sc', {});
  if (cache[k]) return cache[k].r;
  let items;
  if (MOCK && !cfg.ytKey) {
    items = [0, 1, 2, 3].map(i => ({ vid: ('mock' + slug(q).replace(/-/g, '') + '0000000').slice(0, 10) + i, title: q + ' (Karaoke Version) #' + (i + 1), ch: 'Demo Karaoke', dur: 180 + i * 17 }));
  } else {
    if (!cfg.ytKey) throw new Error('Kein YouTube-API-Schlüssel hinterlegt.');
    const term = /karaoke/i.test(q) ? q : q + ' karaoke';
    const j = await ytApi('search', { part: 'snippet', type: 'video', videoEmbeddable: 'true', safeSearch: 'none', maxResults: 10, q: term }, 100);
    items = (j.items || []).filter(i => i.id && i.id.videoId).map(i => ({ vid: i.id.videoId, title: decodeEnt(i.snippet.title), ch: decodeEnt(i.snippet.channelTitle), dur: 0 }));
    try {
      const d = await ytApi('videos', { part: 'contentDetails', id: items.map(i => i.vid).join(',') }, 1);
      const map = {}; (d.items || []).forEach(v => map[v.id] = isoDur(v.contentDetails.duration));
      items.forEach(i => i.dur = map[i.vid] || 0);
    } catch (e) { /* Dauer ist nur Komfort */ }
  }
  cache[k] = { r: items, at: Date.now() };
  const keys = Object.keys(cache); if (keys.length > 300) keys.sort((x, y) => cache[x].at - cache[y].at).slice(0, 60).forEach(x => delete cache[x]);
  LS.set('kk:sc', cache);
  return items;
}
// ---------- Playlist-Import und Sperr-Prüfung (kosten je Anfrage nur 1 Einheit statt 100 wie die Suche) ----------
function parsePlaylistId(str) {
  str = String(str || '').trim();
  const m = str.match(/[?&]list=([\w-]{10,})/); if (m) return m[1];
  if (/^UC[\w-]{22}$/.test(str)) return 'UU' + str.slice(2); // Kanal-ID -> Playlist aller Uploads
  const c = str.match(/youtube\.com\/channel\/(UC[\w-]{22})/); if (c) return 'UU' + c[1].slice(2);
  return /^(PL|UU|OL|FL|LL)[\w-]{10,}$/.test(str) ? str : '';
}
async function ytPlaylist(id, progress) {
  if (MOCK && !cfg.ytKey) {
    const miss = bookList().filter(b => !b.has).slice(0, 14);
    return miss.map((b, i) => ({ vid: ('mockpl' + String(i).padStart(5, '0')), title: b.a + ' - ' + b.t + ' (Karaoke Version)', ch: 'Demo Karaoke' })).concat([{ vid: 'mockplblock', title: 'Niemand - Unbekannt (Karaoke)', ch: 'Demo Karaoke' }]);
  }
  const out = []; let token = '';
  for (let page = 0; page < 40; page++) {
    const j = await ytApi('playlistItems', Object.assign({ part: 'snippet', playlistId: id, maxResults: 50 }, token ? { pageToken: token } : {}), 1);
    for (const it of j.items || []) { const sn = it.snippet || {}, v = sn.resourceId && sn.resourceId.videoId; if (v && !/^(private|deleted) video$/i.test(sn.title || '')) out.push({ vid: v, title: decodeEnt(sn.title || ''), ch: decodeEnt(sn.videoOwnerChannelTitle || '') }); }
    if (progress) progress(out.length);
    token = j.nextPageToken || ''; if (!token) break;
  }
  return out;
}
const WHY = { embed: 'Einbetten gesperrt', age: 'Altersbeschränkt', region: 'In Deutschland gesperrt', private: 'Privat', missing: 'Video gelöscht' };
// Eigenschaften zu Videos holen: Einbettbarkeit, Ländersperre, Altersbeschränkung, Länge (50 Videos je Anfrage)
async function ytVideoInfo(ids) {
  const res = {};
  if (MOCK && !cfg.ytKey) { ids.forEach((v, i) => res[v] = /00003$|block/.test(v) ? { why: 'embed', dur: 200 } : { why: '', dur: 180 + i }); return res; }
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50), j = await ytApi('videos', { part: 'status,contentDetails', id: batch.join(',') }, 1), seen = {};
    for (const v of j.items || []) {
      const st = v.status || {}, cd = v.contentDetails || {}, rr = cd.regionRestriction; let why = '';
      if (st.privacyStatus === 'private') why = 'private';
      else if (st.embeddable === false) why = 'embed';
      else if (cd.contentRating && cd.contentRating.ytRating === 'ytAgeRestricted') why = 'age';
      else if (rr && ((rr.blocked || []).includes('DE') || (rr.allowed && !rr.allowed.includes('DE')))) why = 'region';
      seen[v.id] = true; res[v.id] = { why, dur: isoDur(cd.duration) };
    }
    batch.forEach(v => { if (!seen[v]) res[v] = { why: 'missing', dur: 0 }; });
  }
  return res;
}
// Welches Video aus einer Playlist passt zu welchem Titel? Alle Wörter des Titels müssen vorkommen, vom Interpreten mindestens ein Wort.
const STOPW = new Set(['the', 'a', 'an', 'of', 'in', 'to', 'on', 'is', 'and', 'my', 'me', 'you', 'i', 'it', 'de', 'la', 'le', 'der', 'die', 'das', 'und', 'ein', 'eine']);
const NOISEW = new Set(['karaoke', 'karaokes', 'version', 'instrumental', 'instrumentals', 'lyrics', 'with', 'style', 'originally', 'performed', 'by', 'sing', 'king', 'karafun', 'hd', '4k', 'official', 'video', 'backing', 'track', 'tracks', 'cover', 'no', 'vocals', 'vocal', 'lead', 'stingray', 'zoom', 'vocalstar', 'sunfly', 'feat', 'ft', 'featuring', 'from', 'best', 'full', 'original', 'key', 'playback', 'mit', 'text', 'male', 'female', 'lower', 'higher', 'tonart']);
const ARTSTOP = new Set(['the', 'and', 'feat', 'ft', 'with', 'die', 'der', 'das', 'von']);
const toks = x => slug(x).split('-').filter(Boolean);
function matchPlaylist(videos, books) {
  const vs = videos.map(v => { const t = toks(v.title); return Object.assign({ toks: t, set: new Set(t) }, v); });
  const matches = [], none = [];
  for (const b of books) {
    let tt = toks(b.t).filter(t => !STOPW.has(t)); if (!tt.length) tt = toks(b.t);
    const at = toks(b.a).filter(t => t.length > 2 && !ARTSTOP.has(t)), need = tt.length > 5 ? .8 : 1;
    let best = null;
    for (const v of vs) {
      const cov = tt.filter(t => v.set.has(t)).length / tt.length; if (cov < need) continue;
      const artOk = at.length === 0 || at.some(t => v.set.has(t)); if (!artOk) continue;
      const extra = v.toks.filter(t => !NOISEW.has(t) && !STOPW.has(t) && !tt.includes(t) && !at.includes(t)).length;
      const score = cov * 10 + (at.length ? 3 : 0) - extra * .4;
      if (!best || score > best.score) best = { b, v, score };
    }
    if (best) matches.push(best); else none.push(b);
  }
  return { matches, none };
}
// Titel eines Videos nachschlagen; erkennt nebenbei, ob der Kanal das Einbetten verbietet
async function ytTitle(vid) {
  const u = encodeURIComponent('https://www.youtube.com/watch?v=' + vid); let blocked = false;
  for (const url of ['https://www.youtube.com/oembed?format=json&url=' + u, 'https://noembed.com/embed?url=' + u]) {
    try {
      const r = await fetch(url); if (r.status === 401 || r.status === 403) { blocked = true; continue; }
      if (r.ok) { const j = await r.json(); if (j.title) return { title: j.title, blocked: false }; if (/40[13]/.test(j.error || '')) blocked = true; }
    } catch (e) { /* nächster Versuch */ }
  }
  return { title: '', blocked };
}
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Laden fehlgeschlagen: ' + src)); document.head.append(s); }); }
let ytP;
function loadYT() {
  if (MOCK) return Promise.resolve(FakeYT);
  return ytP || (ytP = new Promise(res => {
    if (window.YT && window.YT.Player) return res(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); res(window.YT); };
    loadScript('https://www.youtube.com/iframe_api').catch(() => { });
  }));
}
// Demo-Player (?mock): verhält sich wie der YouTube-Player, braucht aber kein Internet
const FakeYT = {
  Player: class {
    constructor(el, o) {
      this.o = o; this.st = -1; this.t = 0; this.d = 14; this.vid = null;
      this.el = document.createElement('div'); this.el.className = 'fake'; el.replaceWith(this.el);
      this.el.onclick = () => { if (this.vid && this.st !== 1) this.set(1); else if (this.st === 1) this.set(2); };
      setInterval(() => {
        if (this.st === 1) { this.t += .25; if (this.t >= this.d) { this.t = this.d; this.set(0); } }
        this.el.textContent = this.vid ? '♪ Demo-Video ' + this.vid + ' · ' + fmtDur(this.t) + ' / ' + fmtDur(this.d) : '';
      }, 250);
      setTimeout(() => o.events.onReady({}), 30);
    }
    set(s) { this.st = s; this.o.events.onStateChange({ data: s }); }
    cueVideoById(v) { this.vid = v; this.t = 0; if (/err/i.test(v)) { this.st = -1; this.o.events.onError({ data: 150 }); } else this.set(5); }
    playVideo() { if (this.vid && !/err/i.test(this.vid) && !window.KK_BLOCK_AUTOPLAY) this.set(1); }
    pauseVideo() { if (this.st === 1) this.set(2); }
    stopVideo() { this.vid = null; this.st = -1; }
    seekTo(t) { this.t = Math.min(t, this.d); }
    setVolume() { } getCurrentTime() { return this.t; } getDuration() { return this.d; } getPlayerState() { return this.st; }
  }
};

// ---------- Cloud-Kanal (Supabase Realtime Broadcast) ----------
async function makeBus(room) {
  const fns = [], stat = [];
  const bus = { up: false, on: f => fns.push(f), onStatus: f => { stat.push(f); f(bus.up); }, send: () => { } };
  const setUp = v => { bus.up = v; stat.forEach(f => f(v)); };
  if (BUS_TEST) {
    const bc = new BroadcastChannel('kkcloud:' + room);
    bc.onmessage = e => fns.forEach(f => f(e.data)); bus.send = m => bc.postMessage(m); setUp(true); return bus;
  }
  if (!cloud.on) throw new Error('Cloud nicht eingerichtet');
  const client = await sb();
  const ch = client.channel('kk-' + room, { config: { broadcast: { self: false } } });
  ch.on('broadcast', { event: 'm' }, p => fns.forEach(f => f(p.payload)));
  bus.send = m => { ch.send({ type: 'broadcast', event: 'm', payload: m }); };
  await new Promise((res, rej) => {
    let done = false;
    ch.subscribe(st => { setUp(st === 'SUBSCRIBED'); if (st === 'SUBSCRIBED' && !done) { done = true; res(); } });
    setTimeout(() => { if (!done) rej(new Error('Zeitüberschreitung')); }, 12000);
  });
  return bus;
}

// ---------- Cloud: gemeinsamer Zugang, DJ-Anmeldung, Songbuch, Statistik ----------
let sbP;
function sb() {
  return sbP || (sbP = (async () => {
    if (!cloud.url || !cloud.key) throw new Error('Cloud nicht eingerichtet');
    if (!window.supabase) await loadScript('vendor/supabase.js');
    return window.supabase.createClient(cloud.url, cloud.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'kk:auth' } });
  })());
}
const authMsg = e => { const m = (e && e.message) || 'Unbekannter Fehler'; return /invalid login/i.test(m) ? 'E-Mail oder Passwort stimmt nicht.' : /not confirmed/i.test(m) ? 'Bitte zuerst den Link in der Bestätigungs-E-Mail anklicken.' : /already registered/i.test(m) ? 'Für diese E-Mail gibt es schon ein Konto – bitte anmelden.' : /at least|weak|password/i.test(m) ? 'Das Passwort ist zu kurz oder zu einfach (mindestens 8 Zeichen).' : /rate limit|too many/i.test(m) ? 'Zu viele Versuche – bitte ein paar Minuten warten.' : m; };
const dj = {
  user: null, isDj: false, ready: false, fns: [],
  on(f) { this.fns.push(f); },
  async init() { if (!cloud.url || MOCK) { this.ready = true; return; } try { const c = await sb(); const { data } = await c.auth.getSession(); await this.apply(data.session);
      // An- und Abmelden in einem anderen Fenster (z. B. Konsole) gilt auch hier (z. B. Bühnenbild)
      c.auth.onAuthStateChange((ev, session) => { setTimeout(() => { if (((session && session.user && session.user.id) || null) !== ((this.user && this.user.id) || null)) this.apply(session); }, 0); }); } catch (e) { console.warn('Anmeldung:', e.message); } this.ready = true; this.fns.forEach(f => f()); },
  async apply(session) {
    this.user = session ? session.user : null; this.isDj = false;
    if (this.user) {
      // Ohne Netz gilt der zuletzt bestätigte Stand, damit die Konsole auch offline bedienbar bleibt
      try { const c = await sb(); const r = await c.rpc('claim_dj'); if (r.error) throw r.error; this.isDj = r.data === true; LS.set('kk:isdj', this.isDj ? this.user.id : ''); }
      catch (e) { this.isDj = LS.get('kk:isdj', '') === this.user.id; }
    }
    this.fns.forEach(f => f());
    if (this.isDj) cloudBook.pull().then(() => cloudBook.pushLocal()).catch(e => console.warn('Songbuch:', e.message));
  },
  async signIn(email, pw) { const c = await sb(); const { data, error } = await c.auth.signInWithPassword({ email, password: pw }); if (error) throw new Error(authMsg(error)); await this.apply(data.session); },
  async signUp(email, pw) { const c = await sb(); const { data, error } = await c.auth.signUp({ email, password: pw }); if (error) throw new Error(authMsg(error)); if (data.session) { await this.apply(data.session); return 'in'; } return 'confirm'; },
  async signOut() { const c = await sb(); await c.auth.signOut(); await this.apply(null); }
};
const bookFns = [];
const cloudBook = {
  err: '',
  row(id, removed) {
    const d = bookData(), c = d.custom.find(x => x.id === id), b = bookFind(id), v = d.vids[id];
    return { id, title: (c && c.t) || (b && b.t) || '', artist: (c && c.a) || (b && b.a) || '', genre: (c && c.g) || (b && b.g) || '', vid: v ? v.vid : '', dur: v ? Math.round(v.dur || 0) : 0, custom: !!c, deleted: !!removed, updated_at: new Date().toISOString() };
  },
  // Cloud-Stand holen; was dort steht, gilt
  async pull() {
    if (!cloud.url || MOCK) return false;
    const c = await sb(); const { data, error } = await c.from('songbook').select('id,title,artist,genre,vid,dur,custom,deleted').limit(5000);
    if (error) { this.err = error.message; throw new Error(error.message); }
    this.err = '';
    const d = bookData(), before = JSON.stringify(d);
    for (const r of data) {
      d.custom = d.custom.filter(x => x.id !== r.id);
      if (r.deleted) { delete d.vids[r.id]; continue; }
      if (r.custom) d.custom.push({ id: r.id, t: r.title, a: r.artist, g: r.genre || 'Eigene' });
      if (r.vid && mediaOk(r.vid)) d.vids[r.id] = { vid: r.vid, dur: r.dur || 0 }; else delete d.vids[r.id];
    }
    LS.set('kk:cloudids', data.map(r => r.id));
    const changed = JSON.stringify(d) !== before;
    if (changed) { LS.set('kk:book', d); bookFns.forEach(f => f()); }
    return changed;
  },
  // Was nur auf diesem Gerät liegt, in die Cloud übernehmen (nur als DJ)
  async pushLocal() {
    if (!dj.isDj) return 0;
    const known = new Set(LS.get('kk:cloudids', [])), d = bookData();
    const ids = [...new Set(Object.keys(d.vids).concat(d.custom.map(c => c.id)))].filter(id => !known.has(id));
    if (!ids.length) return 0;
    const c = await sb(); const { error } = await c.from('songbook').upsert(ids.map(id => this.row(id)));
    if (error) throw new Error(error.message);
    LS.set('kk:cloudids', [...known, ...ids]); return ids.length;
  },
  save(id, removed) {
    if (!dj.isDj) return;
    sb().then(c => c.from('songbook').upsert(this.row(id, removed))).then(r => { if (r.error) throw new Error(r.error.message); const k = LS.get('kk:cloudids', []); if (!k.includes(id)) { k.push(id); LS.set('kk:cloudids', k); } this.err = ''; })
      .catch(e => { this.err = e.message; console.warn('Songbuch speichern:', e.message); });
  }
};
function logPlay(e, room) {
  if (MOCK || !dj.isDj) return;
  sb().then(c => c.from('plays').insert({ song_id: clean(e.sid || slug(e.a + '-' + e.t), 200), title: clean(e.t, 120), artist: clean(e.a, 120), room: clean(room, 60), source: !e.vid ? 'extern' : isFile(e.vid) ? 'datei' : 'youtube' }))
    .then(r => { if (r.error) console.warn('Statistik:', r.error.message); }).catch(() => { });
}
async function playStats(days) {
  const c = await sb(); let q = c.from('plays').select('song_id,title,artist,sung_at').order('sung_at', { ascending: false }).limit(10000);
  if (days) q = q.gte('sung_at', new Date(Date.now() - days * 864e5).toISOString());
  const { data, error } = await q; if (error) throw new Error(error.message);
  const map = {};
  for (const r of data) { const m = map[r.song_id] || (map[r.song_id] = { title: r.title, artist: r.artist, n: 0, last: r.sung_at }); m.n++; }
  return { total: data.length, rows: Object.values(map).sort((a, b) => b.n - a.n || a.title.localeCompare(b.title)) };
}

// ---------- Geräte: wann sich ein Gast-Handy zum ersten Mal gemeldet hat (nur auf dem DJ-Rechner gespeichert) ----------
function devFirst(room, cid) { return cid ? (LS.get('kk:dev:' + room, {})[cid] || 0) : 0; }
function devMark(room, cid) {
  if (!cid) return; const k = 'kk:dev:' + room, d = LS.get(k, {}); if (d[cid]) return;
  d[cid] = Date.now(); const ids = Object.keys(d); if (ids.length > 3000) ids.sort((x, y) => d[x] - d[y]).slice(0, 500).forEach(x => delete d[x]);
  LS.set(k, d);
}

// ---------- Stores ----------
class LocalStore {
  constructor(room, mode, meta) {
    this.local = true; this.room = room; this.key = 'kk:room:' + room; this.meta = meta || { from: 'dj' };
    this.fns = []; this.tickFns = []; this.aliveFns = []; this.connFns = []; this.conn = 'off';
    this.state = LS.get(this.key); if (!this.state) { this.state = initState(room, mode); LS.set(this.key, this.state); }
    this.bc = new BroadcastChannel('kk:' + room);
    bookFns.push(() => this.bookChanged());
    this.bc.onmessage = e => {
      const m = e.data;
      if (m.t === 'state') { this.state = LS.get(this.key) || this.state; this.emit(); }
      else if (m.t === 'tick') this.tickFns.forEach(f => f(m));
      else if (m.t === 'alive') this.aliveFns.forEach(f => f(m));
      else if (m.t === 'book') this.emit();
    };
  }
  on(f) { this.fns.push(f); f(this.state); }
  onTick(f) { this.tickFns.push(f); }
  onConn(f) { this.connFns.push(f); f(this.conn); }
  setConn(c) { this.conn = c; this.connFns.forEach(f => f(c)); }
  emit() { this.fns.forEach(f => { try { f(this.state); } catch (e) { console.error(e); } }); }
  dispatch(a, x, meta) {
    const s = LS.get(this.key) || this.state, h0 = s.history[0] && s.history[0].id;
    const r = reduce(s, a, x, Object.assign({}, meta || this.meta)) || ok();
    if (r.ok && s.history[0] && s.history[0].id !== h0 && s.history[0].sung) logPlay(s.history[0], s.name);
    if (r.ok) { s.rev++; LS.set(this.key, s); this.state = s; this.bc.postMessage({ t: 'state' }); this.emit(); }
    return Promise.resolve(r);
  }
  tick(m) { this.bc.postMessage(m); this.tickFns.forEach(f => f(m)); }
  // Lebenszeichen des Player-Fensters, damit die Konsole weiß, ob das Bühnenbild offen ist
  onAlive(f) { this.aliveFns.push(f); }
  alive(m) { this.bc.postMessage(m); this.aliveFns.forEach(f => f(m)); }
  bookChanged() { this.bc.postMessage({ t: 'book' }); this.emit(); if (this.bus) this.bus.send({ t: 'book', b: bookPub() }); }
  search(q) { return ytSearch(q); }
  book() { return bookList(); }
  canSearch() { return !!cfg.ytKey || MOCK; }
  // Dieses Fenster vermittelt zwischen Raum und Cloud (immer nur eines pro Gerät)
  host() {
    if (!cloud.on) return;
    const run = () => this.bridge().catch(e => { console.warn('Cloud:', e.message); this.setConn('err'); setTimeout(run, 8000); });
    if (navigator.locks) navigator.locks.request('kk-host-' + this.room, () => new Promise(() => run()));
    else run();
  }
  async bridge() {
    this.setConn('wait');
    const bus = this.bus = await makeBus(this.room);
    bus.onStatus(up => this.setConn(up ? 'on' : 'wait'));
    let lastRev = -1, pend = null, helloT = null; const rate = {};
    const push = () => { lastRev = this.state.rev; bus.send({ t: 'state', s: pub(this.state) }); };
    this.on(s => { if (s.rev !== lastRev) { clearTimeout(pend); pend = setTimeout(push, 150); } });
    bus.on(async m => {
      if (!m || !m.t) return;
      if (m.t === 'hello') { devMark(this.room, clean(m.cid, 20)); if (!helloT) helloT = setTimeout(() => { helloT = null; push(); bus.send({ t: 'book', b: bookPub() }); }, 700); return; }
      if (m.t === 'act') {
        const isDj = m.pin && String(m.pin) === String(this.state.settings.pin);
        if (!isDj && !GUEST_ACTS.includes(m.a)) return bus.send({ t: 'ack', rid: m.rid, ok: false, pin: true, msg: 'PIN fehlt oder ist falsch.' });
        if (!isDj && m.a === 'add') { const t = Date.now(); if (t - (rate[m.cid] || 0) < 1200) return bus.send({ t: 'ack', rid: m.rid, ok: false, msg: 'Einen Moment bitte …' }); rate[m.cid] = t; }
        const dcid = clean(m.cid, 20), fs = devFirst(this.room, dcid); devMark(this.room, dcid);
        const r = await this.dispatch(m.a, m.x, { from: isDj ? 'dj' : 'guest', cid: dcid, rid: clean(m.rid, 20), fs });
        if (!r.dup) bus.send({ t: 'ack', rid: m.rid, ok: r.ok, msg: r.msg });
        return;
      }
      if (m.t === 'search') {
        const isDj = m.pin && String(m.pin) === String(this.state.settings.pin);
        if (!isDj && !this.state.settings.guestSearch) return bus.send({ t: 'results', rid: m.rid, ok: false, msg: 'Die freie Suche ist hier nicht freigeschaltet.' });
        const t = Date.now(); if (!isDj && t - (rate['s' + m.cid] || 0) < 3000) return bus.send({ t: 'results', rid: m.rid, ok: false, msg: 'Einen Moment bitte …' }); rate['s' + m.cid] = t;
        try { bus.send({ t: 'results', rid: m.rid, ok: true, items: await ytSearch(m.q) }); }
        catch (e) { bus.send({ t: 'results', rid: m.rid, ok: false, msg: e.message }); }
      }
    });
    push();
  }
}

class RemoteStore {
  constructor(room) {
    this.local = false; this.room = room; this.state = null; this.fns = []; this.tickFns = []; this.connFns = []; this.conn = 'wait';
    this.pending = {}; this._book = bookFromPub(null); this.pin = sessionStorage.getItem('kk:pin:' + room) || '';
    this.connect();
  }
  on(f) { this.fns.push(f); f(this.state); }
  onTick() { }
  onAlive() { }
  alive() { }
  onConn(f) { this.connFns.push(f); f(this.conn); }
  setConn(c) { this.conn = c; this.connFns.forEach(f => f(c)); }
  emit() { this.fns.forEach(f => { try { f(this.state); } catch (e) { console.error(e); } }); }
  setPin(p) { this.pin = p; sessionStorage.setItem('kk:pin:' + this.room, p); }
  async connect() {
    if (!cloud.on) { this.setConn('none'); return; }
    try { this.bus = await makeBus(this.room); } catch (e) { this.setConn('err'); setTimeout(() => this.connect(), 6000); return; }
    this.bus.onStatus(up => this.setConn(up ? (this.state ? 'on' : 'wait') : 'wait'));
    this.bus.on(m => {
      if (!m) return;
      if (m.t === 'state') { this.state = m.s; this.setConn('on'); this.emit(); }
      else if (m.t === 'book') { this._book = bookFromPub(m.b); this.emit(); }
      else if (m.t === 'ack' || m.t === 'results') { const p = this.pending[m.rid]; if (p) { delete this.pending[m.rid]; p(m); } }
    });
    const hello = () => this.bus.send({ t: 'hello', cid: CID });
    setTimeout(hello, 300);
    setInterval(() => { if (!this.state) hello(); }, 3500);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) hello(); });
  }
  req(m, ms) {
    return new Promise(res => {
      if (!this.bus) return res({ ok: false, msg: 'Noch nicht verbunden.' });
      const rid = uid(); this.pending[rid] = res;
      this.bus.send(Object.assign(m, { rid, cid: CID, pin: this.pin || undefined }));
      setTimeout(() => { if (this.pending[rid]) { delete this.pending[rid]; res({ ok: false, msg: 'Das Karaoke-System antwortet gerade nicht.' }); } }, ms || 7000);
    });
  }
  dispatch(a, x) { return this.req({ t: 'act', a, x }); }
  search(q) { return this.req({ t: 'search', q }, 14000).then(r => { if (!r.ok) throw new Error(r.msg); return r.items; }); }
  book() { return this._book; }
  bookChanged() { }
  canSearch() { return !!(this.state && this.state.hasKey && (this.pin || this.state.settings.guestSearch)); }
  host() { }
}

window.KK = {
  P, MOCK, LS, uid, lc, clean, slug, fmtDur, rndCode, cfg, saveCfg, cloud, CID, eventCode,
  bookList, bookFind, bookSetVid, bookAddCustom, bookRemoveCustom, bookData,
  initState, reduce, pub, waitMin, parseVid, parseMedia, isFile, fileName, fileMeta, localVideos, thumb, cleanTitle, ytSearch, ytTitle, loadYT, loadScript,
  LocalStore, RemoteStore, dj, cloudBook, playStats,
  // Mit Cloud-Songbuch darf nur der angemeldete DJ das Songbuch ändern
  parsePlaylistId, ytPlaylist, ytVideoInfo, matchPlaylist, quotaUsed, WHY, listDir, keyOk, clampKey, quizFind, quizOf, quizFiles, quizOrder, gameView,
  canEditBook: () => !cloud.url || MOCK || dj.isDj
};
})();
