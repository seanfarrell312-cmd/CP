import Phaser from 'phaser';
import { MAPS, TILE_COLORS, TILES_PER_PANEL_SIDE } from '../rules/config';
import { rechargeProgress } from '../rules/counterBank';
import { DayState, Direction, createDay, tickDay, tryMove } from '../rules/dayPhase';
import { colorLevel, createMap, expectedPowain, getTile } from '../rules/grid';
import { COLORS, FONT, HEIGHT, WIDTH, addButton, hex } from '../ui';

const HUD_HEIGHT = 96;
const PANEL = 56; // px per panel, including the gutter
const GUTTER = 4;
const TILE = (PANEL - GUTTER) / TILES_PER_PANEL_SIDE;

const KEYS: Record<string, Direction> = {
  KeyW: 'up',
  KeyA: 'left',
  KeyS: 'down',
  KeyD: 'right',
};

const TILE_FILL: Record<number, number> = Object.fromEntries(
  Object.entries(TILE_COLORS).map(([level, color]) => [level, hex(color)]),
);

export class DayScene extends Phaser.Scene {
  private day!: DayState;
  private mapX = 0;
  private mapY = 0;
  private tiles!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Graphics;
  private scrubby!: Phaser.GameObjects.Container;
  private daylightText!: Phaser.GameObjects.Text;
  private powainText!: Phaser.GameObjects.Text;
  private hint?: Phaser.GameObjects.Text;
  private overlay?: Phaser.GameObjects.Container;
  private paused = false;
  private deniedUntil = 0;

  constructor() {
    super('Day');
  }

  create() {
    const map = createMap(MAPS[0]);
    this.day = createDay(map);
    this.paused = false;
    this.overlay = undefined;
    this.deniedUntil = 0;

    this.cameras.main.setBackgroundColor(COLORS.grass);
    this.mapX = Math.round((WIDTH - map.panelsX * PANEL) / 2);
    this.mapY = HUD_HEIGHT + Math.round((HEIGHT - HUD_HEIGHT - map.panelsY * PANEL) / 2);

    this.add
      .rectangle(this.mapX - 6, this.mapY - 6, map.panelsX * PANEL + 8, map.panelsY * PANEL + 8, COLORS.gutter)
      .setOrigin(0)
      .setStrokeStyle(6, COLORS.mapEdge);
    this.tiles = this.add.graphics();
    this.drawTiles();

    this.scrubby = this.makeScrubby();
    this.placeScrubby(false);

    this.createHud();

    this.hint = this.add
      .text(WIDTH / 2, HEIGHT - 4, 'Press W A S D to move and scrub. The day starts on your first move.', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 1);

    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => this.onKey(event));
  }

  update(_time: number, delta: number) {
    if (this.paused || this.day.ended) return;
    tickDay(this.day, delta / 1000);
    if (this.day.ended) this.showDayOver();
    this.drawHud();
  }

  private onKey(event: KeyboardEvent) {
    if (event.repeat) return; // press-once inputs
    if (event.code === 'KeyP' || event.code === 'Escape') {
      if (!this.day.ended) this.togglePause();
      return;
    }
    const dir = KEYS[event.code];
    if (!dir || this.paused) return;

    const result = tryMove(this.day, dir);
    if (result === 'moved') {
      this.hint?.destroy();
      this.hint = undefined;
      this.drawTiles();
      this.placeScrubby(true);
    } else if (result === 'no-counter') {
      this.deniedUntil = this.time.now + 250;
    }
    this.drawHud();
  }

  private drawTiles() {
    const { map } = this.day;
    const g = this.tiles;
    g.clear();
    for (let ty = 0; ty < map.tilesY; ty++) {
      for (let tx = 0; tx < map.tilesX; tx++) {
        const px = Math.floor(tx / TILES_PER_PANEL_SIDE);
        const py = Math.floor(ty / TILES_PER_PANEL_SIDE);
        const x = this.mapX + px * PANEL + GUTTER / 2 + (tx % TILES_PER_PANEL_SIDE) * TILE;
        const y = this.mapY + py * PANEL + GUTTER / 2 + (ty % TILES_PER_PANEL_SIDE) * TILE;
        g.fillStyle(TILE_FILL[colorLevel(getTile(map, tx, ty))]);
        g.fillRect(x, y, TILE, TILE);
      }
    }
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
    const x = this.mapX + this.day.px * PANEL + PANEL / 2;
    const y = this.mapY + this.day.py * PANEL + PANEL / 2;
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

  private createHud() {
    const label = (x: number, y: number, text: string, color = '#3e2723') =>
      this.add.text(x, y, text, { fontFamily: FONT, fontSize: '20px', color });

    this.add.rectangle(0, 0, WIDTH, HUD_HEIGHT, COLORS.hudBg).setOrigin(0).setStrokeStyle(6, COLORS.hudEdge);
    this.hud = this.add.graphics();
    label(40, 12, 'Scrubber');
    label(240, 12, 'Reload', '#a1887f');
    label(480, 12, 'Daylight');
    this.daylightText = label(760, 40, '');
    this.powainText = label(940, 14, '');
    label(940, 52, 'DAY: 1');

    const pause = this.add
      .text(WIDTH - 40, HUD_HEIGHT / 2, 'II', { fontFamily: FONT, fontSize: '28px', color: '#3e2723' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    pause.on('pointerup', () => !this.day.ended && this.togglePause());

    this.drawHud();
  }

  private drawHud() {
    const g = this.hud;
    const { scrub } = this.day;
    g.clear();

    // Scrub counters and recharge bar.
    const denied = this.time.now < this.deniedUntil;
    for (let i = 0; i < scrub.max; i++) {
      const x = 52 + i * 30;
      g.lineStyle(3, denied ? COLORS.reload : 0x1565c0);
      if (i < scrub.count) {
        g.fillStyle(COLORS.scrub);
        g.fillCircle(x, 54, 11);
      }
      g.strokeCircle(x, 54, 11);
    }
    this.bar(g, 40, 74, 150, rechargeProgress(scrub), COLORS.scrub);

    // Reload is a night-time counter; shown inactive during the day.
    g.fillStyle(COLORS.reload, 0.35);
    g.fillCircle(252, 54, 11);

    // Daylight bar.
    const { timeLeft, dayLength } = this.day;
    this.bar(g, 480, 44, 260, timeLeft / dayLength, COLORS.daylight);
    this.daylightText.setText(`${Math.ceil(timeLeft)}s`);

    this.powainText.setText(`POWAIN: ${expectedPowain(this.day.map)}`);
  }

  private bar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, fraction: number, color: number) {
    g.fillStyle(0x5d4037, 0.35);
    g.fillRoundedRect(x, y, w, 14, 7);
    if (fraction > 0) {
      g.fillStyle(color);
      g.fillRoundedRect(x, y, Math.max(14, w * fraction), 14, 7);
    }
  }

  private togglePause() {
    if (this.paused) {
      this.paused = false;
      this.tweens.resumeAll();
      this.overlay?.destroy();
      this.overlay = undefined;
      return;
    }
    this.paused = true;
    this.tweens.pauseAll();
    this.overlay = this.makeOverlay('PAUSED', [], [
      ['RESUME', () => this.togglePause(), true],
      ['OPTIONS', () => {}, false],
      ['EXIT', () => this.scene.start('Title'), true],
    ]);
  }

  private showDayOver() {
    this.drawHud();
    this.overlay = this.makeOverlay(
      'Night falls...',
      [
        `Expected POWAIN: ${expectedPowain(this.day.map)}`,
        'The night phase arrives in the next build.',
      ],
      [
        ['PLAY AGAIN', () => this.scene.restart(), true],
        ['TITLE', () => this.scene.start('Title'), true],
      ],
    );
  }

  private makeOverlay(
    title: string,
    lines: string[],
    buttons: [string, () => void, boolean][],
  ): Phaser.GameObjects.Container {
    const items: Phaser.GameObjects.GameObject[] = [
      this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.dim, 0.6).setOrigin(0).setInteractive(),
      this.add
        .text(WIDTH / 2, 200, title, { fontFamily: FONT, fontSize: '64px', color: '#ffffff' })
        .setOrigin(0.5),
    ];
    lines.forEach((line, i) =>
      items.push(
        this.add
          .text(WIDTH / 2, 280 + i * 36, line, { fontFamily: FONT, fontSize: '24px', color: '#ffffff' })
          .setOrigin(0.5),
      ),
    );
    const top = 300 + lines.length * 36 + 40;
    buttons.forEach(([label, onClick, enabled], i) =>
      items.push(addButton(this, WIDTH / 2, top + i * 76, label, onClick, enabled)),
    );
    return this.add.container(0, 0, items).setDepth(10);
  }
}
