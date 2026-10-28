import Phaser from 'phaser';
import { READY_COUNTDOWN } from '../rules/config';
import { DayState, Direction, createDay, tickDay, tryMove } from '../rules/dayPhase';
import { COLORS, FONT, HEIGHT, WIDTH } from '../ui';
import { MapScene } from './MapScene';

const KEYS: Record<string, Direction> = {
  KeyW: 'up',
  KeyA: 'left',
  KeyS: 'down',
  KeyD: 'right',
};

const COUNTDOWN_WORDS = ['SCRUB!', 'SET', 'READY'];

export class DayScene extends MapScene {
  private day!: DayState;
  private scrubby!: Phaser.GameObjects.Container;
  private hint?: Phaser.GameObjects.Text;
  private countdown = 0;
  private countdownText?: Phaser.GameObjects.Text;
  private deniedUntil = 0;

  constructor() {
    super('Day');
  }

  create() {
    const { run } = this;
    this.day = createDay(run.map, { startPx: run.px, startPy: run.py });
    this.deniedUntil = 0;

    this.setupMap(COLORS.grass);
    this.scrubby = this.makeScrubby();
    this.placeScrubby(false);
    this.createHud();

    if (run.day === 1) {
      // Day 1: the clock waits for the first valid move.
      this.hint = this.add
        .text(WIDTH / 2, HEIGHT - 4, 'Press W A S D to move and scrub. The day starts on your first move.', {
          fontFamily: FONT,
          fontSize: '18px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
        })
        .setOrigin(0.5, 1);
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
    const dir = KEYS[event.code];
    if (!dir || this.countdown > 0) return;

    const result = tryMove(this.day, dir);
    if (result === 'moved') {
      this.hint?.destroy();
      this.hint = undefined;
      this.drawTiles();
      this.placeScrubby(true);
    } else if (result === 'no-counter') {
      this.deniedUntil = this.time.now + 250;
    }
    this.refreshHud();
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
    });
  }

  // Daylight is over: Scrubby's panel is saved for tomorrow and the turret takes over.
  private endDay() {
    this.run.px = this.day.px;
    this.run.py = this.day.py;
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
