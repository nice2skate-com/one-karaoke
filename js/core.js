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
  const base = (window.KK_CATALOG || []).map(([t, a, g]) => ({ id: slug(a + '-' + t), t, a, g }));
  return base.concat(d.custom.map(c => Object.assign({ g: 'Eigene' }, c))).map(b => {
    const v = d.vids[b.id]; b.vid = v ? v.vid : ''; b.dur = v ? v.dur : 0; b.has = !!b.vid; return b;
  });
}
const bookFind = id => bookList().find(b => b.id === id);
function bookSetVid(id, vid, dur) { const d = bookData(); if (vid) d.vids[id] = { vid, dur: dur || 0 }; else delete d.vids[id]; LS.set('kk:book', d); }
function bookAddCustom(t, a, vid, dur) {
  const d = bookData(); const id = 'c-' + slug(a + '-' + t);
  if (!d.custom.some(c => c.id === id) && !(window.KK_CATALOG || []).some(([ct, ca]) => slug(ca + '-' + ct) === id.slice(2))) d.custom.push({ id, t, a });
  if (vid) d.vids[id] = { vid, dur: dur || 0 };
  LS.set('kk:book', d); return id;
}
function bookRemoveCustom(id) { const d = bookData(); d.custom = d.custom.filter(c => c.id !== id); delete d.vids[id]; LS.set('kk:book', d); }
// kompakte Fassung für Gäste-Handys: Katalog liegt dort schon vor, es fehlen nur Eigene + "hat Video"
function bookPub() { const d = bookData(); const l = bookList(); const n = (window.KK_CATALOG || []).length; return { m: l.slice(0, n).map(b => b.has ? 1 : 0).join(''), c: l.slice(n).map(b => ({ id: b.id, t: b.t, a: b.a, g: b.g, has: b.has })) }; }
function bookFromPub(p) {
  const base = (window.KK_CATALOG || []).map(([t, a, g], i) => ({ id: slug(a + '-' + t), t, a, g, vid: '', dur: 0, has: !!p && p.m[i] === '1' }));
  return base.concat(((p && p.c) || []).map(c => Object.assign({ vid: '', dur: 0 }, c)));
}

// ---------- Zustand ----------
function initState(room, mode) {
  return {
    v: 1, rev: 0, room, mode, name: mode === 'kiosk' ? 'Nebenraum' : 'Mainstage',
    settings: {
      signupOpen: true, approve: mode !== 'kiosk', maxPerGuest: 2, autoNext: true, autoStart: 0, fair: true,
      formal: false, guestSearch: mode === 'kiosk', bar: true, pin: String(Math.floor(1000 + Math.random() * 9000)), ticker: ''
    },
    queue: [], inbox: [], current: null, play: { want: 'pause', seek: null, vol: 100 }, now: { st: 'idle' },
    last: null, note: null, history: [], seen: []
  };
}
const ok = (msg, extra) => Object.assign({ ok: true, msg }, extra);
const fail = msg => ({ ok: false, msg });
const VID_RE = /^[\w-]{11}$/;
function mkEntry(x) {
  return { id: uid(), name: clean(x.name, 28), t: clean(x.t, 90), a: clean(x.a, 60), vid: VID_RE.test(x.vid || '') ? x.vid : '', dur: Math.max(0, Math.min(3600, +x.dur || 0)), sid: clean(x.sid, 90), by: 'dj', ts: Date.now() };
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
  s.last = sung ? { name: c.name, t: c.t, at: Date.now() } : null;
  s.current = null; s.play.want = 'pause'; s.play.seek = null; s.now = { st: 'idle' };
  if (auto !== false && s.settings.autoNext && s.queue.length) toStage(s);
}
const SETTABLE = ['signupOpen', 'approve', 'maxPerGuest', 'autoNext', 'autoStart', 'fair', 'formal', 'guestSearch', 'bar', 'pin', 'ticker'];

function reduce(s, a, x, m) {
  x = x || {}; m = m || { from: 'dj' };
  const S = s.settings, dj = m.from === 'dj' || m.from === 'player';
  if (m.rid) { s.seen = s.seen || []; if (s.seen.includes(m.rid)) return { ok: false, dup: true }; s.seen.push(m.rid); if (s.seen.length > 80) s.seen.shift(); }
  if (!dj && a !== 'add' && !(m.from === 'kiosk' && (a === 'play' || a === 'next'))) return fail('Nicht erlaubt.');
  const find = id => s.queue.find(q => q.id === id) || (s.current && s.current.id === id ? s.current : null);
  switch (a) {
    case 'add': {
      const e = mkEntry(x);
      if (!e.name) return fail('Bitte einen Namen eintragen.');
      if (!e.t) return fail('Bitte einen Titel wählen.');
      if (e.sid && !e.vid) { const b = bookFind(e.sid); if (b && b.vid) { e.vid = b.vid; e.dur = b.dur; } }
      if (!dj) {
        if (!S.signupOpen) return fail('Die Anmeldung ist gerade geschlossen.');
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
      if (x.vid != null && (x.vid === '' || VID_RE.test(x.vid))) { e.vid = x.vid; e.dur = +x.dur || 0; if (e === s.current) { s.now = { st: 'idle' }; s.play.want = 'pause'; e.phase = 'intro'; } }
      return ok();
    }
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
    case 'set': { for (const k of SETTABLE) if (k in x) S[k] = k === 'maxPerGuest' ? Math.max(1, Math.min(9, +x[k] || 1)) : k === 'autoStart' ? Math.max(0, Math.min(60, +x[k] || 0)) : k === 'ticker' ? clean(x[k], 140) : k === 'pin' ? (clean(x[k], 8) || S.pin) : x[k]; if ('name' in x) s.name = clean(x.name, 30) || s.name; return ok(); }
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
function pub(s) { const c = JSON.parse(JSON.stringify(s)); delete c.settings.pin; delete c.seen; c.history = c.history.slice(0, 20); c.hasKey = !!cfg.ytKey || MOCK; return c; }
function waitMin(s, idx) { let sec = s.current ? 150 : 0; for (let i = 0; i < idx; i++) sec += (s.queue[i].dur || 230) + 50; return Math.max(1, Math.round(sec / 60)); }

// ---------- YouTube ----------
function parseVid(str) {
  str = String(str || '').trim(); if (VID_RE.test(str)) return str;
  const m = str.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/); return m ? m[1] : '';
}
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
    const base = 'https://www.googleapis.com/youtube/v3/';
    const r = await fetch(base + 'search?part=snippet&type=video&videoEmbeddable=true&safeSearch=none&maxResults=10&q=' + encodeURIComponent(term) + '&key=' + encodeURIComponent(cfg.ytKey));
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const reason = j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason;
      throw new Error(reason === 'quotaExceeded' ? 'Das YouTube-Tageskontingent ist aufgebraucht. Bitte Songbuch oder Link nutzen.' : 'YouTube-Suche fehlgeschlagen' + (j.error ? ': ' + j.error.message : '.'));
    }
    items = (j.items || []).filter(i => i.id && i.id.videoId).map(i => ({ vid: i.id.videoId, title: decodeEnt(i.snippet.title), ch: decodeEnt(i.snippet.channelTitle), dur: 0 }));
    try {
      const d = await (await fetch(base + 'videos?part=contentDetails&id=' + items.map(i => i.vid).join(',') + '&key=' + encodeURIComponent(cfg.ytKey))).json();
      const map = {}; (d.items || []).forEach(v => map[v.id] = isoDur(v.contentDetails.duration));
      items.forEach(i => i.dur = map[i.vid] || 0);
    } catch (e) { /* Dauer ist nur Komfort */ }
  }
  cache[k] = { r: items, at: Date.now() };
  const keys = Object.keys(cache); if (keys.length > 300) keys.sort((x, y) => cache[x].at - cache[y].at).slice(0, 60).forEach(x => delete cache[x]);
  LS.set('kk:sc', cache);
  return items;
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
  if (!window.supabase) await loadScript('vendor/supabase.js');
  const client = window.supabase.createClient(cloud.url, cloud.key, { auth: { persistSession: false, autoRefreshToken: false } });
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

// ---------- Stores ----------
class LocalStore {
  constructor(room, mode, meta) {
    this.local = true; this.room = room; this.key = 'kk:room:' + room; this.meta = meta || { from: 'dj' };
    this.fns = []; this.tickFns = []; this.connFns = []; this.conn = 'off';
    this.state = LS.get(this.key); if (!this.state) { this.state = initState(room, mode); LS.set(this.key, this.state); }
    this.bc = new BroadcastChannel('kk:' + room);
    this.bc.onmessage = e => {
      const m = e.data;
      if (m.t === 'state') { this.state = LS.get(this.key) || this.state; this.emit(); }
      else if (m.t === 'tick') this.tickFns.forEach(f => f(m));
      else if (m.t === 'book') this.emit();
    };
  }
  on(f) { this.fns.push(f); f(this.state); }
  onTick(f) { this.tickFns.push(f); }
  onConn(f) { this.connFns.push(f); f(this.conn); }
  setConn(c) { this.conn = c; this.connFns.forEach(f => f(c)); }
  emit() { this.fns.forEach(f => { try { f(this.state); } catch (e) { console.error(e); } }); }
  dispatch(a, x, meta) {
    const s = LS.get(this.key) || this.state;
    const r = reduce(s, a, x, Object.assign({}, meta || this.meta)) || ok();
    if (r.ok) { s.rev++; LS.set(this.key, s); this.state = s; this.bc.postMessage({ t: 'state' }); this.emit(); }
    return Promise.resolve(r);
  }
  tick(m) { this.bc.postMessage(m); this.tickFns.forEach(f => f(m)); }
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
      if (m.t === 'hello') { if (!helloT) helloT = setTimeout(() => { helloT = null; push(); bus.send({ t: 'book', b: bookPub() }); }, 700); return; }
      if (m.t === 'act') {
        const isDj = m.pin && String(m.pin) === String(this.state.settings.pin);
        if (!isDj && m.a !== 'add') return bus.send({ t: 'ack', rid: m.rid, ok: false, pin: true, msg: 'PIN fehlt oder ist falsch.' });
        if (!isDj) { const t = Date.now(); if (t - (rate[m.cid] || 0) < 1200) return bus.send({ t: 'ack', rid: m.rid, ok: false, msg: 'Einen Moment bitte …' }); rate[m.cid] = t; }
        const r = await this.dispatch(m.a, m.x, { from: isDj ? 'dj' : 'guest', cid: clean(m.cid, 20), rid: clean(m.rid, 20) });
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
    const hello = () => this.bus.send({ t: 'hello' });
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
  initState, reduce, pub, waitMin, parseVid, thumb, cleanTitle, ytSearch, ytTitle, loadYT, loadScript,
  LocalStore, RemoteStore
};
})();
