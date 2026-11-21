// CD+G-Grafik (Karaoke-Format MP3+G): Eine .cdg-Datei enthält 300 Pakete zu je 24 Bytes pro Sekunde.
// Sie wird hier im Takt der Musik auf eine Zeichenfläche (300 × 216 Bildpunkte, 16 Farben) gezeichnet.
(() => {
  const W = 300, H = 216, PPS = 300, PKT = 24;
  class CDG {
    constructor(canvas) {
      this.cv = canvas; canvas.width = W; canvas.height = H;
      this.ctx = canvas.getContext('2d'); this.img = this.ctx.createImageData(W, H);
      this.data = new Uint8Array(0); this.reset();
    }
    load(buf) { this.data = new Uint8Array(buf); this.reset(); }
    reset() {
      this.px = new Uint8Array(W * H); this.pal = new Array(16).fill(0).map(() => [0, 0, 0]);
      this.pos = 0; this.hOff = 0; this.vOff = 0; this.dirty = true;
    }
    get packets() { return Math.floor(this.data.length / PKT); }
    // Bis zur Zeit t (Sekunden) vorspulen; rückwärts heißt: von vorn neu aufbauen
    seek(t) {
      const want = Math.min(this.packets, Math.max(0, Math.floor(t * PPS)));
      if (want < this.pos) this.reset();
      const d = this.data;
      for (; this.pos < want; this.pos++) {
        const o = this.pos * PKT;
        if ((d[o] & 0x3F) !== 9) continue;
        this.exec(d[o + 1] & 0x3F, d.subarray(o + 4, o + 20));
      }
      if (this.dirty) this.draw();
    }
    exec(ins, b) {
      switch (ins) {
        case 1: this.px.fill(b[0] & 15); this.dirty = true; break; // Bild löschen
        case 2: { const c = b[0] & 15; // Rand färben
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < 6 || x >= 294 || y < 12 || y >= 204) this.px[y * W + x] = c;
          this.dirty = true; break; }
        case 6: case 38: this.tile(b, ins === 38); break; // Kachel setzen / per XOR einfärben
        case 20: case 24: this.scroll(b, ins === 24); break; // verschieben (füllen / umlaufend)
        case 30: case 31: { const base = ins === 30 ? 0 : 8; // Farbtabelle
          for (let i = 0; i < 8; i++) {
            const hi = b[2 * i] & 0x3F, lo = b[2 * i + 1] & 0x3F;
            this.pal[base + i] = [((hi >> 2) & 15) * 17, (((hi & 3) << 2) | ((lo >> 4) & 3)) * 17, (lo & 15) * 17];
          }
          this.dirty = true; break; }
        default: break; // 28 (Transparenz) und Unbekanntes: ohne Wirkung
      }
    }
    tile(b, xor) {
      const c0 = b[0] & 15, c1 = b[1] & 15, row = b[2] & 0x1F, col = b[3] & 0x3F;
      const x0 = col * 6, y0 = row * 12; if (x0 + 6 > W || y0 + 12 > H) return;
      for (let i = 0; i < 12; i++) {
        const bits = b[4 + i] & 0x3F, line = (y0 + i) * W + x0;
        for (let j = 0; j < 6; j++) {
          const c = (bits >> (5 - j)) & 1 ? c1 : c0;
          this.px[line + j] = xor ? (this.px[line + j] ^ c) & 15 : c;
        }
      }
      this.dirty = true;
    }
    scroll(b, copy) {
      const fill = b[0] & 15, hs = b[1] & 0x3F, vs = b[2] & 0x3F;
      const hCmd = (hs >> 4) & 3, vCmd = (vs >> 4) & 3;
      this.hOff = Math.min(5, hs & 7); this.vOff = Math.min(11, vs & 15);
      const dx = hCmd === 1 ? 6 : hCmd === 2 ? -6 : 0, dy = vCmd === 1 ? 12 : vCmd === 2 ? -12 : 0;
      if (dx || dy) {
        const src = this.px, out = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          let sx = x - dx, sy = y - dy;
          if (copy) { sx = (sx + W) % W; sy = (sy + H) % H; }
          out[y * W + x] = sx < 0 || sx >= W || sy < 0 || sy >= H ? fill : src[sy * W + sx];
        }
        this.px = out;
      }
      this.dirty = true;
    }
    draw() {
      const d = this.img.data, px = this.px, pal = this.pal;
      for (let i = 0, n = W * H; i < n; i++) { const c = pal[px[i]], o = i * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; }
      this.ctx.putImageData(this.img, -this.hOff, -this.vOff);
      this.dirty = false;
    }
  }
  window.KK_CDG = CDG;
})();
