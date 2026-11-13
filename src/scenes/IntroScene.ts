import Phaser from 'phaser';
import { RunState } from '../rules/run';
import { markSeen, wasSeen } from '../story/dialog';
import { FONT, HEIGHT, WIDTH } from '../ui';
import { TERMINAL_FONT, TerminalData } from './TerminalScene';

const PANEL_W = 360;
const PANEL_H = 420;
const PANEL_Y = 120;
const GAP = 40;
const STEP_HOLD = 1600; // ms each comic beat holds before moving on by itself

// D53: the emergency-power opening comic (placeholder art drawn in code, D28; sounds are captions).
// Three panels appear one by one, then "Emergency POWA Active" flashes, then the supervisor boots up.
// A click moves on one beat at a time.
export class IntroScene extends Phaser.Scene {
  private run!: RunState;
  private step = 0;
  private timer?: Phaser.Time.TimerEvent;
  private ended = false;
  private panels: Phaser.GameObjects.Container[] = [];

  constructor() {
    super('Intro');
  }

  create(data: { run: RunState }) {
    this.run = data.run;
    this.step = 0;
    this.ended = false;
    this.timer = undefined;
    this.panels = [];
    this.cameras.main.setBackgroundColor(0x000000);

    if (wasSeen('intro.emergencyComic')) {
      this.add
        .text(80, HEIGHT - 40, '[ SKIP ]', { fontFamily: TERMINAL_FONT, fontSize: '22px', color: '#777777' })
        .setOrigin(0, 0.5)
        .setDepth(10)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => this.end());
    }
    this.input.on('pointerup', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length === 0) this.next();
    });
    this.next();
  }

  // Run the next beat; each beat schedules the one after it.
  private next() {
    if (this.ended) return;
    this.timer?.remove();
    const beats = [
      () => this.panelMudBall(),
      () => this.panelDrop(),
      () => this.panelLever(),
      () => this.flashEmergency(),
      () => this.end(),
    ];
    const beat = beats[this.step++];
    beat?.();
    if (this.step < beats.length && !this.ended) {
      const hold = this.step === 4 ? 2200 : STEP_HOLD;
      this.timer = this.time.delayedCall(hold, () => this.next());
    }
  }

  private frame(i: number): Phaser.GameObjects.Container {
    const x = (WIDTH - 3 * PANEL_W - 2 * GAP) / 2 + i * (PANEL_W + GAP);
    const bg = this.add.rectangle(0, 0, PANEL_W, PANEL_H, 0x1b1b22).setOrigin(0).setStrokeStyle(6, 0xf2e6b0);
    const c = this.add.container(x, PANEL_Y, [bg]).setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 250 });
    this.panels.push(c);
    return c;
  }

  private caption(c: Phaser.GameObjects.Container, text: string, y: number, color: string) {
    const t = this.add
      .text(PANEL_W / 2, y, text, { fontFamily: FONT, fontSize: '44px', color, stroke: '#000000', strokeThickness: 8 })
      .setOrigin(0.5)
      .setScale(0.4);
    c.add(t);
    this.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.easeOut' });
  }

  // 1: a mud ball stuck to a broken, dark monitor on the wall.
  private panelMudBall() {
    const c = this.frame(0);
    const g = this.add.graphics();
    g.fillStyle(0x2a2a33);
    g.fillRect(60, 70, 240, 170);
    g.lineStyle(6, 0x50505c);
    g.strokeRect(60, 70, 240, 170);
    g.lineStyle(3, 0x6d6d7a);
    g.lineBetween(120, 90, 170, 160);
    g.lineBetween(170, 160, 150, 220);
    g.lineBetween(170, 160, 240, 140);
    g.fillStyle(0x4e2f14);
    g.fillCircle(230, 110, 34);
    g.fillCircle(212, 136, 16);
    g.fillStyle(0x6b4320);
    g.fillCircle(222, 100, 10);
    c.add(g);
  }

  // 2: a slime drop pulls away and falls. SHLOOP.
  private panelDrop() {
    const c = this.frame(1);
    const g = this.add.graphics();
    g.fillStyle(0x4e2f14);
    g.fillCircle(180, 60, 40);
    c.add(g);
    const drop = this.add.graphics();
    drop.fillStyle(0x6b4320);
    drop.fillCircle(0, 0, 14);
    drop.fillTriangle(-12, -6, 12, -6, 0, -30);
    drop.setPosition(180, 110);
    c.add(drop);
    this.tweens.add({ targets: drop, y: 330, duration: 900, ease: 'Quad.easeIn' });
    this.caption(c, 'SHLOOP', 210, '#a1887f');
  }

  // 3: the drop hits a lever. CLUNK.
  private panelLever() {
    const c = this.frame(2);
    const g = this.add.graphics();
    g.fillStyle(0x50505c);
    g.fillRect(110, 300, 140, 40);
    c.add(g);
    const handle = this.add.graphics();
    handle.fillStyle(0xb0b0bc);
    handle.fillRect(-6, -110, 12, 110);
    handle.fillStyle(0xe53935);
    handle.fillCircle(0, -110, 16);
    handle.setPosition(180, 305).setAngle(-35);
    c.add(handle);
    const drop = this.add.graphics();
    drop.fillStyle(0x6b4320);
    drop.fillCircle(0, 0, 14);
    drop.setPosition(110, 20);
    c.add(drop);
    this.tweens.add({ targets: drop, x: 117, y: 210, duration: 400, ease: 'Quad.easeIn', onComplete: () => {
      drop.setScale(1.6, 0.6);
      this.tweens.add({ targets: handle, angle: 35, duration: 160, ease: 'Back.easeOut' });
      this.cameras.main.shake(150, 0.006);
      this.caption(c, 'CLUNK', 90, '#fff59d');
    } });
  }

  // The panels go, and "Emergency POWA Active" flashes a few times.
  private flashEmergency() {
    this.tweens.add({ targets: this.panels, alpha: 0, duration: 300 });
    const t = this.add
      .text(WIDTH / 2, HEIGHT / 2, 'Emergency POWA Active', {
        fontFamily: TERMINAL_FONT, fontSize: '56px', color: '#ff5252', fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 150, yoyo: true, hold: 200, repeat: 3, delay: 300 });
  }

  // Story only: the bank stays at 0 (D18). On to the supervisor, then Day 1.
  private end() {
    if (this.ended) return;
    this.ended = true;
    this.timer?.remove();
    markSeen('intro.emergencyComic');
    const next: TerminalData = { script: 'intro.supervisorBoot', next: 'Day', nextData: { run: this.run } };
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Terminal', next));
  }
}
