// D53: typewriter dialog logic shared by every story presentation (no Phaser, so it is unit-tested).
// One click while a line types finishes it; the next click advances; the last advance ends it, once.

export const TYPE_SPEED = 40; // characters per second

export type ClickResult = 'finished-line' | 'advanced' | 'done' | 'ignored';

export class DialogCursor {
  index = 0;
  done = false;
  private shown = 0;

  constructor(readonly lines: readonly string[], readonly speed = TYPE_SPEED) {
    if (lines.length === 0) throw new Error('A dialog needs at least one line');
  }

  get line(): string {
    return this.lines[this.index];
  }

  // The part of the current line typed so far.
  get text(): string {
    return this.line.slice(0, Math.floor(this.shown));
  }

  get typing(): boolean {
    return this.shown < this.line.length;
  }

  get isLast(): boolean {
    return this.index === this.lines.length - 1;
  }

  tick(dt: number): void {
    if (!this.done && this.typing) this.shown = Math.min(this.line.length, this.shown + dt * this.speed);
  }

  click(): ClickResult {
    if (this.done) return 'ignored';
    if (this.typing) {
      this.shown = this.line.length;
      return 'finished-line';
    }
    if (this.isLast) {
      this.done = true;
      return 'done';
    }
    this.index++;
    this.shown = 0;
    return 'advanced';
  }

  // SKIP (only offered for scenes already seen): end at once.
  skip(): ClickResult {
    if (this.done) return 'ignored';
    this.done = true;
    return 'done';
  }
}

// Story scenes watched this session. Memory only (D24): a refresh forgets them.
const seen = new Set<string>();

export function wasSeen(id: string): boolean {
  return seen.has(id);
}

export function markSeen(id: string): void {
  seen.add(id);
}
