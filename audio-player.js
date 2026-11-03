'use strict';
// Two persistent decks keep rerenders from restarting or abruptly replacing music.
class SmoothBgm {
  constructor(decks, sources, clock = window) {
    this.decks = decks;
    this.sources = sources;
    this.clock = clock;
    this.active = -1;
    this.track = '';
    this.desired = '';
    this.volume = .4;
    this.muted = false;
    this.timer = null;
    this.frame = null;
    this.lastSwitch = -Infinity;
    this.holdMs = 0;
    this.fadeMs = 2400;
    decks.forEach(deck => { deck.loop = true; deck.volume = 0; });
  }
  now() { return this.clock.performance.now(); }
  cancelPending() {
    if (this.timer !== null) this.clock.clearTimeout(this.timer);
    this.timer = null;
  }
  fade(targets, duration, done) {
    if (this.frame !== null) this.clock.cancelAnimationFrame(this.frame);
    const initial = this.decks.map(deck => deck.volume);
    const started = this.now();
    const tick = () => {
      const t = Math.min(1, Math.max(0, (this.now() - started) / duration));
      const eased = t * t * (3 - 2 * t);
      this.decks.forEach((deck, i) => {
        deck.volume = Math.min(1, Math.max(0, initial[i] + (targets[i] - initial[i]) * eased));
      });
      if (t < 1) this.frame = this.clock.requestAnimationFrame(tick);
      else { this.frame = null; done?.(); }
    };
    this.frame = this.clock.requestAnimationFrame(tick);
  }
  request(track, volume, muted) {
    if (!this.sources[track]) return;
    const oldMuted = this.muted, oldVolume = this.volume;
    this.desired = track;
    this.volume = Math.max(0, Math.min(1, Number(volume) || 0));
    this.muted = Boolean(muted);
    if (this.muted) {
      this.cancelPending();
      if (!oldMuted) this.fade([0, 0], 450, () => this.decks.forEach(deck => deck.pause()));
      return;
    }
    if (track === this.track) {
      this.cancelPending();
      const deck = this.decks[this.active];
      if (deck?.paused) deck.play().catch(() => {});
      if (oldMuted || oldVolume !== this.volume) {
        this.fade(this.decks.map((_, i) => i === this.active ? this.volume : 0), 1000,
          () => this.decks.forEach((d, i) => { if (i !== this.active) d.pause(); }));
      }
      return;
    }
    if (this.active === -1 || oldMuted) {
      this.cancelPending();
      this.switchTo(track);
      return;
    }
    if (this.timer !== null) return; // The pending transition always reads the latest request.
    const delay = Math.max(600, this.holdMs - (this.now() - this.lastSwitch));
    this.timer = this.clock.setTimeout(() => {
      this.timer = null;
      if (!this.muted && this.desired !== this.track) this.switchTo(this.desired);
    }, delay);
  }
  switchTo(track) {
    const old = this.active;
    const next = old === 0 ? 1 : 0;
    const deck = this.decks[next];
    deck.pause();
    deck.volume = 0;
    deck.src = this.sources[track];
    this.active = next;
    this.track = track;
    this.lastSwitch = this.now();
    deck.play().catch(() => {});
    this.fade(this.decks.map((_, i) => i === next ? this.volume : 0), old < 0 ? 1400 : this.fadeMs,
      () => this.decks.forEach((d, i) => { if (i !== this.active) d.pause(); }));
  }
  stop() {
    this.cancelPending();
    this.desired = '';
    this.track = '';
    this.active = -1;
    this.fade([0, 0], 450, () => this.decks.forEach(deck => deck.pause()));
  }
}
window.SmoothBgm = SmoothBgm;
