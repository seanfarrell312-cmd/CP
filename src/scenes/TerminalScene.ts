import Phaser from 'phaser';
import { DialogCursor, markSeen, wasSeen } from '../story/dialog';
import { SCRIPT, StoryId } from '../story/script';
import { HEIGHT, WIDTH } from '../ui';

export const TERMINAL_FONT = '"Courier New", Courier, monospace';
export const TERMINAL_GREEN = '#39ff6a';

export interface TerminalData {
  script: Exclude<StoryId, 'intro.emergencyComic'>;
  // 'yellow' is the anonymous intrusion style; no Phase 1 scene uses it yet.
  mode?: 'green' | 'yellow';
  // Where to go when the last line is dismissed, and what to hand it.
  next: string;
  nextData: object;
}

// D53: a full-screen supervisor terminal. Nothing else runs while it is up: it sits between scenes.
export class TerminalScene extends Phaser.Scene {
  private cursor!: DialogCursor;
  private body!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private story!: TerminalData;
  private yellow = false;
  private blink = 0;
  private finished = false;

  constructor() {
    super('Terminal');
  }

  create(data: TerminalData) {
    this.story = data;
    this.yellow = data.mode === 'yellow';
    this.cursor = new DialogCursor(SCRIPT[data.script]);
    this.blink = 0;
    this.finished = false;
    this.cameras.main.setBackgroundColor(0x000000);

    if (this.yellow) {
      this.body = this.add
        .text(WIDTH / 2, HEIGHT / 2, '', {
          fontFamily: TERMINAL_FONT, fontSize: '48px', color: '#ffe14d', align: 'center', wordWrap: { width: 1000 },
        })
        .setOrigin(0.5);
    } else {
      this.add.text(80, 60, 'CLEAN POWA CO.  //  SUPERVISOR LINK', {
        fontFamily: TERMINAL_FONT, fontSize: '22px', color: '#1f8a3c',
      });
      this.add.rectangle(80, 96, WIDTH - 160, 2, 0x1f8a3c).setOrigin(0);
      this.body = this.add.text(80, 150, '', {
        fontFamily: TERMINAL_FONT, fontSize: '34px', color: TERMINAL_GREEN, wordWrap: { width: WIDTH - 160 }, lineSpacing: 10,
      });
    }
    const dim = this.yellow ? '#8a7a2a' : '#1f8a3c';
    this.prompt = this.add
      .text(WIDTH - 80, HEIGHT - 50, '', { fontFamily: TERMINAL_FONT, fontSize: '20px', color: dim })
      .setOrigin(1, 0.5);

    if (wasSeen(data.script)) {
      const skip = this.add
        .text(80, HEIGHT - 50, '[ SKIP ]', { fontFamily: TERMINAL_FONT, fontSize: '22px', color: dim })
        .setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
      skip.on('pointerup', () => this.cursor.skip() === 'done' && this.finish());
    }

    // A click anywhere but SKIP is one step: finish the line, or go to the next one.
    this.input.on('pointerup', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0) return;
      if (this.cursor.click() === 'done') this.finish();
    });
    this.render();
  }

  update(_time: number, delta: number) {
    this.cursor.tick(delta / 1000);
    this.blink += delta;
    this.render();
  }

  private render() {
    const c = this.cursor;
    const caret = c.typing || Math.floor(this.blink / 500) % 2 === 0 ? '█' : ' ';
    this.body.setText(this.yellow ? c.text : `> ${c.text}${c.done ? '' : caret}`);
    const step = `${c.index + 1}/${c.lines.length}`;
    this.prompt.setText(c.typing ? step : `${step}   CLICK TO CONTINUE`);
  }

  private finish() {
    // Ends once, however fast the clicks come.
    if (this.finished) return;
    this.finished = true;
    markSeen(this.story.script);
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
      this.scene.start(this.story.next, this.story.nextData),
    );
  }
}
