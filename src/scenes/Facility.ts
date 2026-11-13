import Phaser from 'phaser';
import { PANEL } from './MapScene';

// D57: the Map 3 facility around the Emergency Panels, placeholder art drawn in code (D28).
// It stays a dark, featureless silhouette while playing; reveal() lights it up in three steps.
// Positions are in Panel units from the map's top-left, read from the owner's sketch.
const DARK = 0x262626;
const WALL = 0x8a8a8a;
const MUD = 0x8d5a3b;
const BLOOD = 0xb71c1c;
const SIGN_BLUE = '#8fd3e8';

const BUILDING = { x0: 7.3, x1: 36, y0: 4.8, y1: 13.6 };
const SPLIT_Y = 10; // upper half: sign and logo; lower half: windows and door
const WALKWAY = { x0: 0, x1: 36.4, y0: 14.05, y1: 14.95 };
const LAMPS = [9.2, 14.2, 18.9, 22.4, 27.4, 30.9];
const WINDOWS = [9, 11.5, 14.9, 18.6, 21.6, 25.1, 29.1, 31.9, 34.5];
const WINDOW_Y = 10.9;
const DOOR = { x0: 18.8, x1: 25, y0: 12.2, y1: 13.6 };
const LOGO = { x0: 28.1, x1: 34.6, y0: 5.3, y1: 9.9 };

// A fixed pseudo-random sequence, so the mess looks the same every time.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

export class Facility {
  private readonly scene: Phaser.Scene;
  private readonly ox: number;
  private readonly oy: number;
  private lampLights: Phaser.GameObjects.Graphics[] = [];
  private upper!: Phaser.GameObjects.Graphics;
  private sign!: Phaser.GameObjects.Text;
  private logo!: Phaser.GameObjects.Container;
  private graffiti!: Phaser.GameObjects.Graphics;
  private why!: Phaser.GameObjects.Text;
  private lower!: Phaser.GameObjects.Graphics;
  private windows!: Phaser.GameObjects.Graphics;
  private streaks!: Phaser.GameObjects.Graphics;
  private door!: Phaser.GameObjects.Graphics;
  private mess!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, mapX: number, mapY: number) {
    this.scene = scene;
    this.ox = mapX;
    this.oy = mapY;
    this.drawDark();
    this.drawUpper();
    this.drawLogo();
    this.drawLower();
    this.hideAll();
  }

  private x(u: number) {
    return this.ox + u * PANEL;
  }

  private y(v: number) {
    return this.oy + v * PANEL;
  }

  private g(depth = -2) {
    return this.scene.add.graphics().setDepth(depth);
  }

  // The silhouette shown while playing: building, walkway and unlit lamps, all one dark grey.
  private drawDark() {
    const g = this.g(-3);
    g.fillStyle(DARK);
    g.fillRect(this.x(BUILDING.x0), this.y(BUILDING.y0), (BUILDING.x1 - BUILDING.x0) * PANEL, (BUILDING.y1 - BUILDING.y0) * PANEL);
    g.fillRect(this.x(WALKWAY.x0), this.y(WALKWAY.y0), (WALKWAY.x1 - WALKWAY.x0) * PANEL, (WALKWAY.y1 - WALKWAY.y0) * PANEL);
    g.lineStyle(5, DARK);
    for (const lx of LAMPS) this.lampShape(g, lx);
    g.fillStyle(0x3a3a3a);
    for (const lx of LAMPS) g.fillCircle(this.x(lx + 1.9), this.y(4.3), 0.17 * PANEL);
  }

  private lampShape(g: Phaser.GameObjects.Graphics, lx: number) {
    g.lineBetween(this.x(lx), this.y(BUILDING.y0), this.x(lx + 0.25), this.y(4.15));
    g.lineBetween(this.x(lx + 0.25), this.y(4.15), this.x(lx + 1.8), this.y(4.2));
  }

  // Step 1: lamps, the upper wall and the CLEAN POWA CO. sign.
  private drawUpper() {
    for (const lx of LAMPS) {
      const lamp = this.g(-1);
      lamp.lineStyle(5, 0x33402a);
      this.lampShape(lamp, lx);
      lamp.fillStyle(0xfff59d, 0.35);
      lamp.fillCircle(this.x(lx + 1.9), this.y(4.3), 0.45 * PANEL);
      lamp.fillStyle(0xffeb3b);
      lamp.fillCircle(this.x(lx + 1.9), this.y(4.3), 0.17 * PANEL);
      this.lampLights.push(lamp);
    }
    const w = (BUILDING.x1 - BUILDING.x0) * PANEL;
    this.upper = this.g(-2);
    this.upper.fillStyle(WALL);
    this.upper.fillRect(this.x(BUILDING.x0), this.y(BUILDING.y0), w, (SPLIT_Y - BUILDING.y0) * PANEL);
    this.upper.lineStyle(5, 0x000000);
    this.upper.strokeRect(this.x(BUILDING.x0), this.y(BUILDING.y0), w, (BUILDING.y1 - BUILDING.y0) * PANEL);
    this.sign = this.scene.add
      .text(this.x(8), this.y(5.6), 'CLEAN POWA CO.', {
        fontFamily: '"Arial Black", Arial, sans-serif', fontSize: `${Math.round(PANEL * 1.35)}px`, color: SIGN_BLUE,
      })
      .setDepth(-1);
  }

  // Step 2: the logo square under mud graffiti, and WHY?
  private drawLogo() {
    const w = (LOGO.x1 - LOGO.x0) * PANEL;
    const h = (LOGO.y1 - LOGO.y0) * PANEL;
    const box = this.scene.add.rectangle(0, 0, w, h, 0x9e9e9e).setOrigin(0).setStrokeStyle(5, 0x000000);
    const word = this.scene.add
      .text(w / 2, h / 2, 'LOGO', { fontFamily: '"Arial Black", Arial, sans-serif', fontSize: `${Math.round(PANEL * 1.2)}px`, color: '#000000' })
      .setOrigin(0.5);
    this.logo = this.scene.add.container(this.x(LOGO.x0), this.y(LOGO.y0), [box, word]).setDepth(-1);

    this.graffiti = this.g(-1);
    this.graffiti.lineStyle(9, MUD, 0.9);
    const rand = seeded(7);
    for (let i = 0; i < 6; i++) {
      const sx = LOGO.x0 + 0.5 + i * 1.05;
      const path = new Phaser.Curves.Spline(
        Array.from({ length: 6 }, (_, k) => new Phaser.Math.Vector2(
          this.x(sx + (rand() - 0.5) * 0.8), this.y(LOGO.y0 + 0.2 + k * 0.85 + rand() * 0.3),
        )),
      );
      path.draw(this.graffiti, 24);
    }
    this.why = this.scene.add
      .text(this.x(26.2), this.y(8.6), 'WHY?', {
        fontFamily: '"Comic Sans MS", "Arial Black", sans-serif', fontSize: `${Math.round(PANEL * 1.4)}px`, color: '#9c6b4a',
      })
      .setOrigin(0.5)
      .setAngle(-14)
      .setDepth(-1);
  }

  // Step 3: the lower wall with dripping windows, the open door and its mess, and the walkway.
  private drawLower() {
    const w = (BUILDING.x1 - BUILDING.x0) * PANEL;
    this.lower = this.g(-2);
    this.lower.fillStyle(WALL);
    this.lower.fillRect(this.x(BUILDING.x0), this.y(SPLIT_Y), w, (BUILDING.y1 - SPLIT_Y) * PANEL);
    this.lower.lineStyle(5, 0x000000);
    this.lower.strokeRect(this.x(BUILDING.x0), this.y(BUILDING.y0), w, (BUILDING.y1 - BUILDING.y0) * PANEL);
    this.lower.fillStyle(0x22b14c);
    this.lower.fillRect(this.x(11.5), this.y(BUILDING.y1), 22 * PANEL, 0.4 * PANEL);
    this.lower.fillStyle(0xffc107);
    this.lower.fillRect(this.x(WALKWAY.x0), this.y(WALKWAY.y0), (WALKWAY.x1 - WALKWAY.x0) * PANEL, (WALKWAY.y1 - WALKWAY.y0) * PANEL);
    this.lower.lineStyle(3, 0x22b14c);
    this.lower.strokeRect(this.x(WALKWAY.x0), this.y(WALKWAY.y0), (WALKWAY.x1 - WALKWAY.x0) * PANEL, (WALKWAY.y1 - WALKWAY.y0) * PANEL);

    this.windows = this.g(-1);
    for (const wx of WINDOWS) {
      this.windows.fillStyle(0x9adcef);
      this.windows.fillEllipse(this.x(wx), this.y(WINDOW_Y), 1.7 * PANEL, 0.95 * PANEL);
      this.windows.lineStyle(4, 0x000000);
      this.windows.strokeEllipse(this.x(wx), this.y(WINDOW_Y), 1.7 * PANEL, 0.95 * PANEL);
    }

    // Streaks hang from the window row; the graphic sits on that row so it can grow downward.
    const top = WINDOW_Y + 0.35;
    this.streaks = this.scene.add.graphics({ x: this.ox, y: this.y(top) }).setDepth(-1);
    const rand = seeded(11);
    for (const wx of WINDOWS) {
      for (let k = 0; k < 4; k++) {
        const sx = (wx - 0.6 + k * 0.4 + (rand() - 0.5) * 0.15) * PANEL;
        const len = (0.6 + rand() * 1.6) * PANEL;
        this.streaks.lineStyle(4 + Math.round(rand() * 3), rand() < 0.5 ? BLOOD : MUD, 0.9);
        this.streaks.lineBetween(sx, rand() * 0.2 * PANEL, sx + (rand() - 0.5) * 0.3 * PANEL, len);
      }
    }

    this.door = this.g(-1);
    this.door.fillStyle(0x000000);
    this.door.fillRect(this.x(DOOR.x0), this.y(DOOR.y0), (DOOR.x1 - DOOR.x0) * PANEL, (DOOR.y1 - DOOR.y0) * PANEL);
    this.door.fillStyle(0x7b1515);
    this.door.fillRect(this.x(DOOR.x0), this.y(DOOR.y0), 2.6 * PANEL, (DOOR.y1 - DOOR.y0) * PANEL);
    this.door.fillPoints(
      [
        new Phaser.Math.Vector2(this.x(DOOR.x1), this.y(DOOR.y0)),
        new Phaser.Math.Vector2(this.x(DOOR.x1 + 1.2), this.y(DOOR.y0 + 0.6)),
        new Phaser.Math.Vector2(this.x(DOOR.x1 + 1.2), this.y(DOOR.y1 + 0.4)),
        new Phaser.Math.Vector2(this.x(DOOR.x1), this.y(DOOR.y1)),
      ],
      true,
    );
    this.door.lineStyle(3, 0xffeb3b);
    this.door.lineBetween(this.x(DOOR.x0 + 3.4), this.y(DOOR.y0 + 0.1), this.x(DOOR.x0 + 3.4), this.y(DOOR.y1 - 0.6));

    // The mess spills out of the doorway and down the walkway to the right; it grows from the sill.
    const sillX = DOOR.x0 + 3;
    const sillY = DOOR.y1 - 0.3;
    this.mess = this.scene.add.graphics({ x: this.x(sillX), y: this.y(sillY) }).setDepth(-1);
    const r2 = seeded(23);
    for (let i = 0; i < 70; i++) {
      const t = i / 70;
      const mx = (t * (WALKWAY.x1 - sillX - 0.5) + (r2() - 0.5) * 1.2) * PANEL;
      const my = (0.2 + Math.min(1, t * 4) * (WALKWAY.y0 - sillY + 0.2) + (r2() - 0.5) * 0.5) * PANEL;
      this.mess.fillStyle(r2() < 0.35 ? BLOOD : MUD, 0.85);
      this.mess.fillCircle(mx, my, (0.12 + r2() * 0.22) * PANEL * (1 - t * 0.5));
    }
    // Smears along the rest of the walkway.
    for (let i = 0; i < 22; i++) {
      const mx = (r2() * (WALKWAY.x1 - 1) - sillX) * PANEL;
      const my = (WALKWAY.y0 - sillY + 0.2 + r2() * 0.5) * PANEL;
      this.mess.lineStyle(5, r2() < 0.4 ? BLOOD : MUD, 0.8);
      this.mess.lineBetween(mx, my, mx + (0.6 + r2()) * PANEL, my + (r2() - 0.5) * 0.2 * PANEL);
    }
  }

  private hideAll() {
    for (const o of this.revealed()) o.setAlpha(0);
  }

  private revealed() {
    return [
      ...this.lampLights, this.upper, this.sign, this.logo, this.graffiti, this.why,
      this.lower, this.windows, this.streaks, this.door, this.mess,
    ];
  }

  // D57: the three-step reveal, about 8 s, then done().
  reveal(done: () => void) {
    const tw = this.scene.tweens;
    const at = (ms: number, fn: () => void) => this.scene.time.delayedCall(ms, fn);

    // 1: lamps on, left to right, the upper wall lights up and the sign appears left to right.
    this.lampLights.forEach((lamp, i) => {
      at(i * 180, () => {
        // A quick flicker that ends fully lit.
        tw.add({ targets: lamp, alpha: { from: 0.2, to: 1 }, duration: 70, repeat: 2 });
      });
    });
    tw.add({ targets: this.upper, alpha: 1, duration: 500, delay: 300 });
    const sign = this.sign;
    sign.setAlpha(1).setCrop(0, 0, 0, sign.height);
    const crop = { w: 0 };
    tw.add({
      targets: crop, w: sign.width, duration: 1400, delay: 700,
      onUpdate: () => sign.setCrop(0, 0, crop.w, sign.height),
    });

    // 2: the logo, its graffiti, then WHY?
    tw.add({ targets: this.logo, alpha: 1, duration: 400, delay: 2500 });
    tw.add({ targets: this.graffiti, alpha: 1, duration: 600, delay: 2900 });
    this.why.setScale(0.3);
    tw.add({ targets: this.why, alpha: 1, scale: 1, duration: 300, delay: 3500, ease: 'Back.easeOut' });

    // 3: the lower half and walkway, then the streaks run and the mess pours out of the door.
    tw.add({ targets: [this.lower, this.windows, this.door], alpha: 1, duration: 500, delay: 4300 });
    this.streaks.setScale(1, 0);
    tw.add({ targets: this.streaks, alpha: 1, scaleY: 1, duration: 1000, delay: 4800, ease: 'Sine.easeIn' });
    this.mess.setScale(0);
    tw.add({ targets: this.mess, alpha: 1, scale: 1, duration: 1700, delay: 5100, ease: 'Sine.easeOut' });

    at(8300, done);
  }
}
