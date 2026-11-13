import Phaser from 'phaser';
import { PANEL } from './MapScene';

// D57/D59: the Map 3 facility around the Emergency Panels, placeholder art drawn in code (D28).
// The finished art is drawn from the start, hidden under dark shade, so while playing the
// building is one dark, featureless silhouette. reveal() lifts the shade in three steps; nothing
// grows, moves or changes colour. Positions are in Panel units from the map's top-left.
const SHADE = 0x262626;
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
// The shade over step 2: the logo and WHY? beside it.
const LOGO_SHADE = { x0: 23.2, x1: 34.9, y0: 5.05, y1: SPLIT_Y };

// Depths: art under the shade, the shade under the lit lamps and the sign wipe.
const ART = -3;
const SHADE_DEPTH = -2;
const ABOVE_SHADE = -1;

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
  private sign!: Phaser.GameObjects.Text;
  private shadeUpper!: Phaser.GameObjects.Graphics;
  private shadeLogo!: Phaser.GameObjects.Graphics;
  private shadeLower!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, mapX: number, mapY: number) {
    this.scene = scene;
    this.ox = mapX;
    this.oy = mapY;
    this.drawWalls();
    this.drawLogo();
    this.drawLower();
    this.drawLamps();
    this.drawSign();
    this.drawShade();
  }

  private x(u: number) {
    return this.ox + u * PANEL;
  }

  private y(v: number) {
    return this.oy + v * PANEL;
  }

  private rect(g: Phaser.GameObjects.Graphics, x0: number, y0: number, x1: number, y1: number) {
    g.fillRect(this.x(x0), this.y(y0), (x1 - x0) * PANEL, (y1 - y0) * PANEL);
  }

  private art() {
    return this.scene.add.graphics().setDepth(ART);
  }

  // The building, the grass ledge under it and the walkway.
  private drawWalls() {
    const g = this.art();
    g.fillStyle(WALL);
    this.rect(g, BUILDING.x0, BUILDING.y0, BUILDING.x1, BUILDING.y1);
    g.lineStyle(5, 0x000000);
    g.strokeRect(this.x(BUILDING.x0), this.y(BUILDING.y0), (BUILDING.x1 - BUILDING.x0) * PANEL, (BUILDING.y1 - BUILDING.y0) * PANEL);
    g.fillStyle(0x22b14c);
    this.rect(g, 11.5, BUILDING.y1, 33.5, BUILDING.y1 + 0.4);
    g.fillStyle(0xffc107);
    this.rect(g, WALKWAY.x0, WALKWAY.y0, WALKWAY.x1, WALKWAY.y1);
    g.lineStyle(3, 0x22b14c);
    g.strokeRect(this.x(WALKWAY.x0), this.y(WALKWAY.y0), (WALKWAY.x1 - WALKWAY.x0) * PANEL, (WALKWAY.y1 - WALKWAY.y0) * PANEL);
  }

  // The logo square under mud graffiti, and WHY?
  private drawLogo() {
    const w = (LOGO.x1 - LOGO.x0) * PANEL;
    const h = (LOGO.y1 - LOGO.y0) * PANEL;
    const box = this.scene.add.rectangle(0, 0, w, h, 0x9e9e9e).setOrigin(0).setStrokeStyle(5, 0x000000);
    const word = this.scene.add
      .text(w / 2, h / 2, 'LOGO', { fontFamily: '"Arial Black", Arial, sans-serif', fontSize: `${Math.round(PANEL * 1.2)}px`, color: '#000000' })
      .setOrigin(0.5);
    this.scene.add.container(this.x(LOGO.x0), this.y(LOGO.y0), [box, word]).setDepth(ART);

    const graffiti = this.art();
    graffiti.lineStyle(9, MUD, 0.9);
    const rand = seeded(7);
    for (let i = 0; i < 6; i++) {
      const sx = LOGO.x0 + 0.5 + i * 1.05;
      const path = new Phaser.Curves.Spline(
        Array.from({ length: 6 }, (_, k) => new Phaser.Math.Vector2(
          this.x(sx + (rand() - 0.5) * 0.8), this.y(LOGO.y0 + 0.2 + k * 0.85 + rand() * 0.3),
        )),
      );
      path.draw(graffiti, 24);
    }
    this.scene.add
      .text(this.x(26.2), this.y(8.6), 'WHY?', {
        fontFamily: '"Comic Sans MS", "Arial Black", sans-serif', fontSize: `${Math.round(PANEL * 1.4)}px`, color: '#9c6b4a',
      })
      .setOrigin(0.5)
      .setAngle(-14)
      .setDepth(ART);
  }

  // Dripping windows, the open door, and the mess spilling out of it down the walkway.
  private drawLower() {
    const g = this.art();
    for (const wx of WINDOWS) {
      g.fillStyle(0x9adcef);
      g.fillEllipse(this.x(wx), this.y(WINDOW_Y), 1.7 * PANEL, 0.95 * PANEL);
      g.lineStyle(4, 0x000000);
      g.strokeEllipse(this.x(wx), this.y(WINDOW_Y), 1.7 * PANEL, 0.95 * PANEL);
    }
    const rand = seeded(11);
    const top = WINDOW_Y + 0.35;
    for (const wx of WINDOWS) {
      for (let k = 0; k < 4; k++) {
        const sx = wx - 0.6 + k * 0.4 + (rand() - 0.5) * 0.15;
        const len = 0.6 + rand() * 1.6;
        g.lineStyle(4 + Math.round(rand() * 3), rand() < 0.5 ? BLOOD : MUD, 0.9);
        g.lineBetween(this.x(sx), this.y(top + rand() * 0.2), this.x(sx + (rand() - 0.5) * 0.3), this.y(top + len));
      }
    }

    g.fillStyle(0x000000);
    this.rect(g, DOOR.x0, DOOR.y0, DOOR.x1, DOOR.y1);
    g.fillStyle(0x7b1515);
    this.rect(g, DOOR.x0, DOOR.y0, DOOR.x0 + 2.6, DOOR.y1);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(this.x(DOOR.x1), this.y(DOOR.y0)),
        new Phaser.Math.Vector2(this.x(DOOR.x1 + 1.2), this.y(DOOR.y0 + 0.6)),
        new Phaser.Math.Vector2(this.x(DOOR.x1 + 1.2), this.y(DOOR.y1 + 0.4)),
        new Phaser.Math.Vector2(this.x(DOOR.x1), this.y(DOOR.y1)),
      ],
      true,
    );
    g.lineStyle(3, 0xffeb3b);
    g.lineBetween(this.x(DOOR.x0 + 3.4), this.y(DOOR.y0 + 0.1), this.x(DOOR.x0 + 3.4), this.y(DOOR.y1 - 0.6));

    const sillX = DOOR.x0 + 3;
    const sillY = DOOR.y1 - 0.3;
    const r2 = seeded(23);
    for (let i = 0; i < 70; i++) {
      const t = i / 70;
      const mx = sillX + t * (WALKWAY.x1 - sillX - 0.5) + (r2() - 0.5) * 1.2;
      const my = sillY + 0.2 + Math.min(1, t * 4) * (WALKWAY.y0 - sillY + 0.2) + (r2() - 0.5) * 0.5;
      g.fillStyle(r2() < 0.35 ? BLOOD : MUD, 0.85);
      g.fillCircle(this.x(mx), this.y(my), (0.12 + r2() * 0.22) * PANEL * (1 - t * 0.5));
    }
    // Smears along the rest of the walkway.
    for (let i = 0; i < 22; i++) {
      const mx = r2() * (WALKWAY.x1 - 1);
      const my = WALKWAY.y0 + 0.2 + r2() * 0.5;
      g.lineStyle(5, r2() < 0.4 ? BLOOD : MUD, 0.8);
      g.lineBetween(this.x(mx), this.y(my), this.x(mx + 0.6 + r2()), this.y(my + (r2() - 0.5) * 0.2));
    }
  }

  private lampShape(g: Phaser.GameObjects.Graphics, lx: number) {
    g.lineBetween(this.x(lx), this.y(BUILDING.y0), this.x(lx + 0.25), this.y(4.15));
    g.lineBetween(this.x(lx + 0.25), this.y(4.15), this.x(lx + 1.8), this.y(4.2));
  }

  // Unlit lamps in the dark, with their lit look on top, hidden until they switch on.
  private drawLamps() {
    const dark = this.art();
    dark.lineStyle(5, SHADE);
    for (const lx of LAMPS) this.lampShape(dark, lx);
    dark.fillStyle(0x3a3a3a);
    for (const lx of LAMPS) dark.fillCircle(this.x(lx + 1.9), this.y(4.3), 0.17 * PANEL);
    for (const lx of LAMPS) {
      const lamp = this.scene.add.graphics().setDepth(ABOVE_SHADE).setAlpha(0);
      lamp.lineStyle(5, 0x33402a);
      this.lampShape(lamp, lx);
      lamp.fillStyle(0xfff59d, 0.35);
      lamp.fillCircle(this.x(lx + 1.9), this.y(4.3), 0.45 * PANEL);
      lamp.fillStyle(0xffeb3b);
      lamp.fillCircle(this.x(lx + 1.9), this.y(4.3), 0.17 * PANEL);
      this.lampLights.push(lamp);
    }
  }

  // The sign sits over the shade and is wiped on left to right once its wall is lit.
  private drawSign() {
    this.sign = this.scene.add
      .text(this.x(8), this.y(5.6), 'CLEAN POWA CO.', {
        fontFamily: '"Arial Black", Arial, sans-serif', fontSize: `${Math.round(PANEL * 1.35)}px`, color: SIGN_BLUE,
      })
      .setDepth(ABOVE_SHADE);
    this.sign.setCrop(0, 0, 0, this.sign.height);
  }

  // Three dark shades in the same colour, so together they read as one silhouette.
  private drawShade() {
    const pad = 0.08; // covers the outline strokes
    const shade = () => this.scene.add.graphics().setDepth(SHADE_DEPTH).fillStyle(SHADE);
    this.shadeUpper = shade();
    this.rect(this.shadeUpper, BUILDING.x0 - pad, BUILDING.y0 - pad, BUILDING.x1 + pad, SPLIT_Y);
    this.shadeLogo = shade().setDepth(SHADE_DEPTH + 0.5);
    this.rect(this.shadeLogo, LOGO_SHADE.x0, LOGO_SHADE.y0, LOGO_SHADE.x1, LOGO_SHADE.y1);
    this.shadeLower = shade();
    this.rect(this.shadeLower, BUILDING.x0 - pad, SPLIT_Y, BUILDING.x1 + pad, WALKWAY.y0);
    // Wide enough for the last smears and blobs past the walkway's end.
    this.rect(this.shadeLower, WALKWAY.x0 - pad, WALKWAY.y0 - pad, WALKWAY.x1 + 0.8, WALKWAY.y1 + 0.3);
  }

  // D57/D59: the three-step reveal, about 7.5 s, then done(). Each step waits for the one before
  // it to finish, so a slow frame rate can never cut a step short.
  reveal(done: () => void) {
    const tw = this.scene.tweens;

    // 1: lamps on, left to right; the upper wall's shade lifts and the sign is wiped on.
    this.lampLights.forEach((lamp, i) => {
      // A quick flicker that ends fully lit.
      tw.add({ targets: lamp, alpha: { from: 0.2, to: 1 }, duration: 70, repeat: 2, delay: i * 180 });
    });
    tw.add({ targets: this.shadeUpper, alpha: 0, duration: 900, delay: 300 });
    const sign = this.sign;
    const crop = { w: 0 };
    tw.add({
      targets: crop, w: sign.width, duration: 1400, delay: 900,
      onUpdate: () => sign.setCrop(0, 0, crop.w, sign.height),
      onComplete: () => step2(),
    });

    // 2: the shade over the logo, its graffiti and WHY? lifts.
    const step2 = () => tw.add({ targets: this.shadeLogo, alpha: 0, duration: 900, delay: 400, onComplete: () => step3() });

    // 3: the shade over the lower wall, door, mess and walkway lifts; hold, then done.
    const step3 = () => tw.add({
      targets: this.shadeLower, alpha: 0, duration: 1200, delay: 600,
      onComplete: () => tw.add({ targets: crop, w: sign.width, duration: 2200, onComplete: done }),
    });
  }
}
