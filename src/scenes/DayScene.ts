import Phaser from 'phaser';
import { COMBO, READY_COUNTDOWN, WAX_COLOR } from '../rules/config';
import { DayState, Direction, MoveFeedback, createDay, tickDay, tryMove, tryWax } from '../rules/dayPhase';
import { claimVictory, dayOptions, firstDayIsFree } from '../rules/run';
import { COLORS, FONT, HEIGHT, WIDTH } from '../ui';
import { MapScene } from './MapScene';

const KEYS: Record<string, Direction> = {
  KeyW: 'up',
  KeyA: 'left',
  KeyS: 'down',
  KeyD: 'right',
};

const COUNTDOWN_WORDS = ['SCRUB!', 'SET', 'READY'];

// D47: the word for each kind of move, and its colour.
const FEEDBACK: Record<Exclude<MoveFeedback, 'none'>, [string, string]> = {
  scrub: ['SCRUB!', '#5BC2E7'],
  ick: ['ICK!', '#a1887f'],
  slip: ['SLIP!', '#fff176'],
};

const COMBO_X = 32;
const COMBO_Y = 250;

export class DayScene extends MapScene {
  private day!: DayState;
  private scrubby!: Phaser.GameObjects.Container;
  private hint?: Phaser.GameObjects.Text;
  private countdown = 0;
  private countdownText?: Phaser.GameObjects.Text;
  private deniedUntil = 0;
  private comboValue?: Phaser.GameObjects.Text;
  private comboCut?: Phaser.GameObjects.Text;

  constructor() {
    super('Day');
  }

  create() {
    const { run } = this;
    this.day = createDay(run.map, dayOptions(run));
    this.deniedUntil = 0;

    this.setupMap(COLORS.grass);
    this.scrubby = this.makeScrubby();
    this.placeScrubby(false);
    this.followOnBigMap(this.scrubby);
    this.createHud();
    this.createCombo();

    if (firstDayIsFree(run)) {
      // Day 1: the clock waits for the first valid move.
      this.hint = this.uiText(WIDTH / 2, HEIGHT - 4, 'Press W A S D to move and scrub. The day starts on your first move.', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5, 1);
    } else {
      // Later days open with READY / SET / SCRUB!; the clock and input start together.
      this.countdown = READY_COUNTDOWN;
      this.countdownText = this.banner('READY');
    }
    this.refreshHud();
  }

  update(_time: number, delta: number) {
    if (this.paused || this.day.ended) return;
    const dt = delta / 1000;
    if (this.countdown > 0) {
      this.countdown -= dt;
      if (this.countdown > 0) {
        this.countdownText!.setText(COUNTDOWN_WORDS[Math.ceil(this.countdown) - 1]);
        return;
      }
      this.countdownText!.destroy();
      this.countdownText = undefined;
      this.day.started = true;
    }
    tickDay(this.day, dt);
    if (this.day.ended) this.endDay();
    else this.refreshHud();
  }

  protected canPause() {
    return !this.day.ended;
  }

  protected onKey(event: KeyboardEvent) {
    if (this.countdown > 0) return;
    if (event.code === 'Space') {
      if (tryWax(this.day) === 'waxed') {
        this.drawTiles();
        this.popWord('BEAUTIFUL!', WAX_COLOR);
      }
      this.refreshHud();
      return;
    }
    const dir = KEYS[event.code];
    if (!dir) return;

    const result = tryMove(this.day, dir);
    if (result === 'moved' || result === 'glided') {
      this.hint?.destroy();
      this.hint = undefined;
      this.drawTiles();
      this.placeScrubby(true);
      const fb = this.day.feedback;
      if (fb !== 'none') this.popWord(...FEEDBACK[fb]);
      this.updateCombo();
    } else if (result === 'no-counter') {
      this.deniedUntil = this.time.now + 250;
    }
    this.refreshHud();
    if (this.day.victory) this.win();
  }

  // D15/D23: the map is spotless. Clocks are already stopped; skip the night and pay the clean map once.
  private win() {
    this.run.px = this.day.px;
    this.run.py = this.day.py;
    this.run.wax = this.day.wax;
    const powain = claimVictory(this.run);
    const spotless = this.banner('SPOTLESS!');
    this.tweens.add({ targets: spotless, alpha: 0, delay: 1000, duration: 300 });
    // D48: show the whole map and fence it in, then the Score screen.
    this.time.delayedCall(800, () => this.fitBigMap(700));
    this.time.delayedCall(1300, () => this.buildFence(() => {
      const caption = this.banner('FENCED IN!');
      caption.setFontSize(56);
      this.uiText(WIDTH / 2, caption.y + 60, "The Mud Boys can't get in any more.", {
        fontFamily: FONT, fontSize: '26px', color: '#ffffff', stroke: '#000000', strokeThickness: 6,
      }).setOrigin(0.5).setDepth(5);
      this.time.delayedCall(1500, () => this.scene.start('Score', { run: this.run, powain, victory: true }));
    }));
  }

  // D48: wooden posts pop up one by one around the map, then the rails join them.
  private buildFence(done: () => void) {
    const r = this.mapRect();
    const OUT = 16;
    const left = r.x - OUT;
    const top = r.y - OUT;
    const right = r.right + OUT;
    const bottom = r.bottom + OUT;
    const spacing = 26;
    // Perimeter points clockwise from the top-left corner.
    const points: [number, number][] = [];
    const side = (x0: number, y0: number, x1: number, y1: number) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / spacing));
      for (let i = 0; i < n; i++) points.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
    };
    side(left, top, right, top);
    side(right, top, right, bottom);
    side(right, bottom, left, bottom);
    side(left, bottom, left, top);

    const rails = this.add.graphics().setDepth(3).setAlpha(0);
    rails.lineStyle(5, 0x8d6e63);
    rails.strokeRect(left, top - 14, right - left, bottom - top);
    rails.strokeRect(left, top - 4, right - left, bottom - top);
    const total = 1600;
    points.forEach(([x, y], i) => {
      const post = this.add.rectangle(x, y + 6, 9, 28, 0x6d4c41).setOrigin(0.5, 1).setStrokeStyle(2, 0x3e2723).setDepth(4);
      post.setScale(1, 0);
      this.tweens.add({ targets: post, scaleY: 1, duration: 180, delay: (i / points.length) * total, ease: 'Back.easeOut' });
    });
    this.tweens.add({ targets: rails, alpha: 1, delay: total, duration: 250, onComplete: done });
  }

  // D47: a word that rises from Scrubby's panel and fades.
  private popWord(word: string, color: string) {
    const [x, y] = this.panelCenter(this.day.px, this.day.py);
    const t = this.add
      .text(x, y - 24, word, { fontFamily: FONT, fontSize: '22px', color, stroke: '#000000', strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(6)
      .setScale(0.6);
    this.tweens.add({ targets: t, scale: 1, duration: 120, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, y: y - 60, alpha: 0, delay: 250, duration: 550, onComplete: () => t.destroy() });
  }

  // D49: the combo counter on the left edge, only with COMBO owned.
  private createCombo() {
    this.comboValue = this.comboCut = undefined;
    if (!this.day.comboEnabled) return;
    this.toUi(this.add.rectangle(COMBO_X - 12, COMBO_Y - 8, 172, 150, 0x000000, 0.45).setOrigin(0).setDepth(4));
    const style = { fontFamily: FONT, color: '#ffffff', stroke: '#000000', strokeThickness: 5 };
    this.uiText(COMBO_X + 74, COMBO_Y, 'COMBO', { ...style, fontSize: '22px' }).setOrigin(0.5, 0).setDepth(5);
    this.comboValue = this.uiText(COMBO_X + 74, COMBO_Y + 62, 'x0', { ...style, fontSize: '52px' }).setOrigin(0.5).setDepth(5);
    this.comboCut = this.uiText(COMBO_X + 74, COMBO_Y + 106, '', { ...style, fontSize: '15px', color: '#5BC2E7', strokeThickness: 4 })
      .setOrigin(0.5, 0).setDepth(5);
    this.updateCombo();
  }

  private updateCombo() {
    const value = this.comboValue;
    if (!value || !this.comboCut) return;
    const { combo } = this.day;
    const before = value.text;
    value.setText(`x${combo}`);
    const cut = Math.round(COMBO.step * Math.min(combo, COMBO.maxSteps) * 100);
    this.comboCut.setText(cut > 0 ? `SCRUB TIME -${cut}%` : '');
    if (before === value.text) return;
    this.tweens.killTweensOf(value);
    value.setScale(1).setX(COMBO_X + 74);
    if (combo > 0) {
      value.setColor(combo >= COMBO.maxSteps ? '#fff176' : '#ffffff');
      this.tweens.add({ targets: value, scale: 1.3, duration: 90, yoyo: true });
    } else {
      // Broken: flash red and shake, then back to white.
      value.setColor('#ff5252');
      this.time.delayedCall(400, () => {
        if (value.active && this.day.combo === 0) value.setColor('#ffffff');
      });
      this.tweens.add({ targets: value, x: value.x + 6, duration: 50, yoyo: true, repeat: 2 });
    }
  }

  private refreshHud() {
    const { scrub, timeLeft, dayLength } = this.day;
    this.drawHud({
      scrub,
      label: 'Daylight',
      color: COLORS.daylight,
      fraction: timeLeft / dayLength,
      seconds: timeLeft,
      denied: this.time.now < this.deniedUntil,
      wax: this.day.wax,
    });
  }

  // Daylight is over: Scrubby's panel is saved for tomorrow and the turret takes over.
  private endDay() {
    this.run.px = this.day.px;
    this.run.py = this.day.py;
    this.run.wax = this.day.wax;
    this.scene.start('Night', { run: this.run });
  }

  // Placeholder robot (D28): a stubby blue body with two eyes.
  private makeScrubby(): Phaser.GameObjects.Container {
    const g = this.add.graphics();
    g.fillStyle(0x1e88e5);
    g.fillRoundedRect(-18, -16, 36, 32, 8);
    g.fillStyle(0x0d47a1);
    g.fillRect(-20, 12, 40, 6);
    g.fillStyle(0xffffff);
    g.fillCircle(-7, -4, 5);
    g.fillCircle(7, -4, 5);
    g.fillStyle(0x000000);
    g.fillCircle(-7, -4, 2);
    g.fillCircle(7, -4, 2);
    g.lineStyle(3, 0x7e57c2);
    g.strokeRoundedRect(-18, -16, 36, 32, 8);
    return this.add.container(0, 0, [g]);
  }

  private placeScrubby(animate: boolean) {
    const [x, y] = this.panelCenter(this.day.px, this.day.py);
    if (!animate) {
      this.scrubby.setPosition(x, y);
      return;
    }
    this.tweens.killTweensOf(this.scrubby);
    this.scrubby.setAngle(0);
    this.tweens.add({ targets: this.scrubby, x, y, duration: 120, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: this.scrubby, angle: { from: -10, to: 10 }, duration: 60, yoyo: true, repeat: 2, delay: 120,
      onComplete: () => this.scrubby.setAngle(0) });
  }
}
