import Phaser from 'phaser';
import { waveForDay } from '../rules/config';
import { MudBoy, NightState, createNight, shootAt, tickNight } from '../rules/nightPhase';
import { nightOptions, scoreNight } from '../rules/run';
import { COLORS, FONT } from '../ui';
import { MapScene, PANEL } from './MapScene';

const NIGHT_BACKGROUND = 0x14281c;

interface MudBoySprite {
  root: Phaser.GameObjects.Container;
  hp: Phaser.GameObjects.Graphics;
  px: number;
  py: number;
  shownHp: number;
}

export class NightScene extends MapScene {
  private night!: NightState;
  private turret!: Phaser.GameObjects.Container;
  private facing: 1 | -1 = 1;
  private sprites = new Map<number, MudBoySprite>();
  private warning?: Phaser.GameObjects.Text;
  private deniedUntil = 0;

  constructor() {
    super('Night');
  }

  create() {
    this.night = createNight(this.run.map, waveForDay(this.run.day), nightOptions(this.run));
    this.sprites = new Map();
    this.deniedUntil = 0;
    this.facing = 1;

    this.setupMap(NIGHT_BACKGROUND);
    this.turret = this.makeTurret();
    this.createHud();
    this.warning = this.banner('HERE THEY COME!');

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onClick(p));
    this.refresh();
  }

  update(_time: number, delta: number) {
    if (this.paused || this.night.ended) return;
    tickNight(this.night, delta / 1000);
    if (this.night.warningLeft <= 0 && this.warning) {
      this.warning.destroy();
      this.warning = undefined;
    }
    this.refresh();
    if (this.night.ended) this.endNight();
  }

  protected canPause() {
    return !this.night.ended;
  }

  private onClick(p: Phaser.Input.Pointer) {
    if (this.paused || this.night.ended) return;
    const [px, py] = this.panelAt(p.x, p.y);
    const result = shootAt(this.night, px, py);
    if (result === 'hit') this.fire(px);
    else if (result === 'no-counter') this.deniedUntil = this.time.now + 250;
    this.refresh();
    if (this.night.ended) this.endNight();
  }

  // Apply this frame's events, then bring every sprite in line with the rules state.
  private refresh() {
    const { night } = this;
    let dirty = false;
    for (const e of night.events) {
      if (e.type === 'spawn') dirty = true;
      else if (e.type === 'pop') {
        dirty = true;
        this.removeSprite(e.id);
        this.popEffect(e.px, e.py);
      } else if (e.type === 'splat') {
        this.removeSprite(e.id, e.px, e.py);
        this.splatEffect(e.px, e.py);
      }
    }
    night.events.length = 0;

    for (const mb of night.mudBoys) {
      let s = this.sprites.get(mb.id);
      if (!s) {
        s = this.makeMudBoy(mb);
        this.sprites.set(mb.id, s);
      } else if (s.px !== mb.px || s.py !== mb.py) {
        // Forward moves dirty the panel they enter; knockbacks don't, but redrawing is harmless.
        dirty = true;
        s.px = mb.px;
        s.py = mb.py;
        const [x, y] = this.panelCenter(mb.px, mb.py);
        this.tweens.killTweensOf(s.root);
        this.tweens.add({ targets: s.root, x, y, duration: 150, ease: 'Quad.easeOut' });
      }
      if (s.shownHp !== mb.hp) this.drawHp(s, mb.hp);
    }
    // Leftover Mud Boys vanish when the clock runs out.
    if (night.ended) for (const id of [...this.sprites.keys()]) this.removeSprite(id);
    if (dirty) this.drawTiles();

    const { shoot, timeLeft, nightLength } = night;
    this.drawHud({
      shoot,
      label: 'Night',
      color: COLORS.night,
      fraction: timeLeft / nightLength,
      seconds: timeLeft,
      denied: this.time.now < this.deniedUntil,
      wax: this.run.wax,
    });
  }

  // Placeholder Mud Boy (D28): a bouncing mud ball with glowing yellow eyes and HP pips.
  private makeMudBoy(mb: MudBoy): MudBoySprite {
    const body = this.add.graphics();
    body.fillStyle(0x4e2f14);
    body.fillCircle(0, 0, 19);
    body.lineStyle(3, 0x2a1708);
    body.strokeCircle(0, 0, 19);
    body.fillStyle(0xffeb3b);
    body.fillCircle(-7, -5, 5);
    body.fillCircle(7, -5, 5);
    body.fillStyle(0x000000);
    body.fillEllipse(0, 8, 14, 8);
    const bob = this.add.container(0, 0, [body]);
    this.tweens.add({ targets: bob, y: -4, duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const hp = this.add.graphics();
    const [x, y] = this.panelCenter(mb.px, mb.py);
    const root = this.add.container(x, y, [bob, hp]).setDepth(2);
    root.setScale(0);
    this.tweens.add({ targets: root, scale: 1, duration: 200, ease: 'Back.easeOut' });
    const sprite = { root, hp, px: mb.px, py: mb.py, shownHp: -1 };
    this.drawHp(sprite, mb.hp);
    return sprite;
  }

  private drawHp(s: MudBoySprite, hp: number) {
    s.shownHp = hp;
    const g = s.hp;
    g.clear();
    const w = 5;
    const left = -((hp * w) - 1) / 2;
    g.fillStyle(0xff5252);
    for (let i = 0; i < hp; i++) g.fillRect(left + i * w, 20, w - 1, 4);
  }

  // A knocked-off Mud Boy slides out to its off-map spot before disappearing.
  private removeSprite(id: number, toPx?: number, toPy?: number) {
    const s = this.sprites.get(id);
    if (!s) return;
    this.sprites.delete(id);
    this.tweens.killTweensOf(s.root);
    if (toPx === undefined || toPy === undefined) {
      s.root.destroy();
      return;
    }
    const [x, y] = this.panelCenter(toPx, toPy);
    this.tweens.add({ targets: s.root, x, y, alpha: 0, duration: 200, onComplete: () => s.root.destroy() });
  }

  private popEffect(px: number, py: number) {
    const [x, y] = this.panelCenter(px, py);
    const blob = this.add.circle(x, y, PANEL * 0.4, 0x4e2f14).setDepth(3);
    this.tweens.add({ targets: blob, scale: 2.6, alpha: 0, duration: 350, onComplete: () => blob.destroy() });
    this.floatText(x, y, 'POP!', '#ffcc80');
  }

  private splatEffect(px: number, py: number) {
    const [x, y] = this.panelCenter(px, py);
    this.floatText(x, y, 'SPLAT!', '#ffeb3b');
  }

  private floatText(x: number, y: number, text: string, color: string) {
    const t = this.add
      .text(x, y, text, { fontFamily: FONT, fontSize: '22px', color, stroke: '#000000', strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(4);
    this.tweens.add({ targets: t, y: y - 24, alpha: 0, delay: 400, duration: 500, onComplete: () => t.destroy() });
  }

  // Placeholder turret (D28) in the margin above the map; it starts each night facing right.
  private makeTurret(): Phaser.GameObjects.Container {
    const g = this.add.graphics();
    g.fillStyle(0x546e7a);
    g.fillRect(0, -6, 30, 12); // barrel, pointing right
    g.fillStyle(0x78909c);
    g.fillCircle(0, 0, 16);
    g.fillStyle(0x37474f);
    g.fillRect(-20, 10, 40, 10);
    const barrel = this.add.container(0, 0, [g]);
    return this.add.container(this.mapX + (this.run.map.panelsX * PANEL) / 2, this.mapY - 32, [barrel]).setDepth(2);
  }

  // Turn toward the target's half of the map (the centre column keeps the old facing), recoil, and flash.
  private fire(px: number) {
    const { panelsX } = this.run.map;
    if (2 * px + 1 < panelsX) this.facing = -1;
    else if (2 * px + 1 > panelsX) this.facing = 1;
    const barrel = this.turret.list[0] as Phaser.GameObjects.Container;
    barrel.setScale(this.facing, 1);
    this.tweens.add({ targets: barrel, x: -6 * this.facing, duration: 60, yoyo: true });
    const flash = this.add.circle(this.turret.x + 34 * this.facing, this.turret.y, 8, 0xfff59d).setDepth(3);
    this.tweens.add({ targets: flash, scale: 2, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
  }

  // D02/D03: score the whole map into the bank, then the Score screen. A short beat lets the last pop land.
  private endNight() {
    this.warning?.destroy();
    const powain = scoreNight(this.run);
    this.time.delayedCall(600, () => this.scene.start('Score', { run: this.run, powain }));
  }
}
