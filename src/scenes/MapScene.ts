import Phaser from 'phaser';
import { TILE_COLORS, TILES_PER_PANEL_SIDE, WAX_COLOR } from '../rules/config';
import { CounterBank, rechargeProgress } from '../rules/counterBank';
import { colorLevel, expectedPowain, getTile, isWaxed } from '../rules/grid';
import { RunState, upgradeValue, newRun } from '../rules/run';
import { COLORS, FONT, HEIGHT, WIDTH, addButton, hex } from '../ui';

export const HUD_HEIGHT = 96;
export const PANEL = 52; // px per panel, including the gutter
const GUTTER = 4;
const TILE = (PANEL - GUTTER) / TILES_PER_PANEL_SIDE;
// Room between the HUD and the map for the night turret.
const TURRET_MARGIN = 60;
// World space kept around the map for the turret, SPLAT! text and camera edges.
const WORLD_PAD = 40;

const TILE_FILL: Record<number, number> = Object.fromEntries(
  Object.entries(TILE_COLORS).map(([level, color]) => [level, hex(color)]),
);

export interface PhaseHud {
  scrub?: CounterBank;
  shoot?: CounterBank;
  label: string;
  color: number;
  fraction: number;
  seconds: number;
  // Flash the active bank red after a move or shot with no counter.
  denied: boolean;
  wax: number;
}

const WAX_FILL = hex(WAX_COLOR);

// Shared by the Day and Night scenes: map drawing, the HUD, pause and overlays.
// Two cameras: the main one shows the map below the HUD and can follow or zoom (D27);
// a fixed UI camera on top draws the HUD, banners and overlays.
export abstract class MapScene extends Phaser.Scene {
  protected run!: RunState;
  protected mapX = 0;
  protected mapY = 0;
  protected overlay?: Phaser.GameObjects.Container;
  protected paused = false;
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;
  private tiles!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Graphics;
  private hudLabels: Phaser.GameObjects.Text[] = [];
  private secondsText!: Phaser.GameObjects.Text;
  private powainText!: Phaser.GameObjects.Text;
  private waxText!: Phaser.GameObjects.Text;

  init(data: { run?: RunState }) {
    this.run = data.run ?? newRun();
    this.paused = false;
    this.overlay = undefined;
  }

  protected abstract canPause(): boolean;

  protected setupMap(background: number) {
    const { map } = this.run;
    const main = this.cameras.main;
    main.setBackgroundColor(background);
    main.setViewport(0, HUD_HEIGHT, WIDTH, HEIGHT - HUD_HEIGHT);
    main.setScroll(0, HUD_HEIGHT);
    // Everything added from here on is map world unless handed to toUi().
    this.uiCamera = this.cameras.add(0, 0, WIDTH, HEIGHT);
    const toWorld = (go: Phaser.GameObjects.GameObject) => this.uiCamera.ignore(go);
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, toWorld);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, toWorld));

    this.mapX = Math.round((WIDTH - map.panelsX * PANEL) / 2);
    this.mapY = HUD_HEIGHT + TURRET_MARGIN;
    this.add
      .rectangle(this.mapX - 6, this.mapY - 6, map.panelsX * PANEL + 8, map.panelsY * PANEL + 8, COLORS.gutter)
      .setOrigin(0)
      .setStrokeStyle(6, COLORS.mapEdge);
    this.tiles = this.add.graphics();
    this.drawTiles();

    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.repeat) return; // press-once inputs
      if (event.code === 'KeyP' || event.code === 'Escape') {
        if (this.canPause()) this.togglePause();
      } else if (!this.paused) {
        this.onKey(event);
      }
    });
  }

  protected onKey(_event: KeyboardEvent) {}

  // Draw with the fixed UI camera only (containers include their children).
  protected toUi<T extends Phaser.GameObjects.GameObject>(go: T): T {
    go.cameraFilter = this.cameras.main.id;
    if (go instanceof Phaser.GameObjects.Container) go.list.forEach((child) => this.toUi(child));
    return go;
  }

  // Map 1 fits on screen; Map 2 needs the D27 camera.
  protected mapFits(): boolean {
    const { map } = this.run;
    return map.panelsX * PANEL + 2 * WORLD_PAD <= WIDTH && TURRET_MARGIN + map.panelsY * PANEL + WORLD_PAD <= HEIGHT - HUD_HEIGHT;
  }

  private worldBounds(): Phaser.Geom.Rectangle {
    const { map } = this.run;
    return new Phaser.Geom.Rectangle(
      this.mapX - WORLD_PAD, HUD_HEIGHT, map.panelsX * PANEL + 2 * WORLD_PAD, TURRET_MARGIN + map.panelsY * PANEL + WORLD_PAD,
    );
  }

  // D27 day view: follow Scrubby, clamped to the map.
  protected followOnBigMap(target: Phaser.GameObjects.Container) {
    if (this.mapFits()) return;
    const b = this.worldBounds();
    const main = this.cameras.main;
    main.setBounds(b.x, b.y, b.width, b.height);
    main.startFollow(target, true, 0.2, 0.2);
  }

  // D27 night view: zoom out until the whole map and its margins fit (D48: eased in after a victory).
  protected fitBigMap(duration = 0) {
    if (this.mapFits()) return;
    const b = this.worldBounds();
    const main = this.cameras.main;
    const zoom = Math.min(main.width / b.width, main.height / b.height);
    main.stopFollow();
    main.removeBounds();
    if (duration > 0) {
      main.zoomTo(zoom, duration, 'Sine.easeInOut');
      main.pan(b.centerX, b.centerY, duration, 'Sine.easeInOut');
      return;
    }
    main.setZoom(zoom);
    main.centerOn(b.centerX, b.centerY);
  }

  // The map's outer edge in world pixels (inside the yellow border).
  protected mapRect(): Phaser.Geom.Rectangle {
    const { map } = this.run;
    return new Phaser.Geom.Rectangle(this.mapX - 6, this.mapY - 6, map.panelsX * PANEL + 8, map.panelsY * PANEL + 8);
  }

  // Pointer position in map-world coordinates.
  protected worldPoint(p: Phaser.Input.Pointer): [number, number] {
    const w = this.cameras.main.getWorldPoint(p.x, p.y);
    return [w.x, w.y];
  }

  protected drawTiles() {
    const { map } = this.run;
    const g = this.tiles;
    g.clear();
    for (let ty = 0; ty < map.tilesY; ty++) {
      for (let tx = 0; tx < map.tilesX; tx++) {
        const px = Math.floor(tx / TILES_PER_PANEL_SIDE);
        const py = Math.floor(ty / TILES_PER_PANEL_SIDE);
        const x = this.mapX + px * PANEL + GUTTER / 2 + (tx % TILES_PER_PANEL_SIDE) * TILE;
        const y = this.mapY + py * PANEL + GUTTER / 2 + (ty % TILES_PER_PANEL_SIDE) * TILE;
        g.fillStyle(isWaxed(map, px, py) ? WAX_FILL : TILE_FILL[colorLevel(getTile(map, tx, ty))]);
        g.fillRect(x, y, TILE, TILE);
      }
    }
  }

  // Centre of a panel in screen pixels; works for off-map coordinates too.
  protected panelCenter(px: number, py: number): [number, number] {
    return [this.mapX + px * PANEL + PANEL / 2, this.mapY + py * PANEL + PANEL / 2];
  }

  protected panelAt(x: number, y: number): [number, number] {
    return [Math.floor((x - this.mapX) / PANEL), Math.floor((y - this.mapY) / PANEL)];
  }

  protected createHud() {
    const label = (x: number, y: number, text: string) =>
      this.uiText(x, y, text, { fontFamily: FONT, fontSize: '20px', color: '#3e2723' });

    this.toUi(this.add.rectangle(0, 0, WIDTH, HUD_HEIGHT, COLORS.hudBg).setOrigin(0).setStrokeStyle(6, COLORS.hudEdge));
    this.hud = this.toUi(this.add.graphics());
    this.hudLabels = [label(40, 12, 'Scrubber'), label(240, 12, 'Reload'), label(480, 12, '')];
    this.secondsText = label(760, 40, '');
    this.powainText = label(940, 14, '');
    label(940, 52, `DAY: ${this.run.day}`);
    this.waxText = label(1080, 52, '');

    const pause = this.uiText(WIDTH - 40, HUD_HEIGHT / 2, 'II', { fontFamily: FONT, fontSize: '28px', color: '#3e2723' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    pause.on('pointerup', () => this.canPause() && this.togglePause());
  }

  protected drawHud(p: PhaseHud) {
    const g = this.hud;
    g.clear();
    this.hudLabels[0].setColor(p.scrub ? '#3e2723' : '#a1887f');
    this.hudLabels[1].setColor(p.shoot ? '#3e2723' : '#a1887f');
    this.hudLabels[2].setText(p.label);

    // The inactive bank shows faded at its upgraded size.
    const scrubMax = upgradeValue(this.run, 'extraScrubbers');
    const shootMax = upgradeValue(this.run, 'clipSize');
    this.counters(g, 52, p.scrub, scrubMax, COLORS.scrub, 0x1565c0, p.denied);
    this.counters(g, 252, p.shoot, shootMax, COLORS.reload, 0x8e0000, p.denied);

    this.bar(g, 480, 44, 260, p.fraction, p.color);
    this.secondsText.setText(`${Math.ceil(p.seconds)}s`);
    this.powainText.setText(`POWA-IN: ${expectedPowain(this.run.map)}`);
    this.waxText.setText(p.wax > 0 ? `WAX: ${p.wax}` : '');
  }

  // Counter pips and recharge bar; a bank not used this phase shows faded.
  private counters(
    g: Phaser.GameObjects.Graphics,
    x: number,
    bank: CounterBank | undefined,
    inactiveMax: number,
    fill: number,
    edge: number,
    denied: boolean,
  ) {
    if (!bank) {
      g.fillStyle(fill, 0.35);
      for (let i = 0; i < inactiveMax; i++) g.fillCircle(x + i * 30, 54, 11);
      return;
    }
    for (let i = 0; i < bank.max; i++) {
      g.lineStyle(3, denied ? COLORS.reload : edge);
      if (i < bank.count) {
        g.fillStyle(fill);
        g.fillCircle(x + i * 30, 54, 11);
      }
      g.strokeCircle(x + i * 30, 54, 11);
    }
    this.bar(g, x - 12, 74, 150, rechargeProgress(bank), fill);
  }

  private bar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, fraction: number, color: number) {
    g.fillStyle(0x5d4037, 0.35);
    g.fillRoundedRect(x, y, w, 14, 7);
    if (fraction > 0) {
      g.fillStyle(color);
      g.fillRoundedRect(x, y, Math.max(14, w * fraction), 14, 7);
    }
  }

  protected togglePause() {
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

  protected makeOverlay(
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
    return this.toUi(this.add.container(0, 0, items).setDepth(10));
  }

  // Big message centred in the map view (HERE THEY COME!, READY / SET / SCRUB!).
  protected banner(text: string): Phaser.GameObjects.Text {
    return this.uiText(WIDTH / 2, HUD_HEIGHT + (HEIGHT - HUD_HEIGHT) / 2, text, {
      fontFamily: FONT,
      fontSize: '72px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 10,
    })
      .setOrigin(0.5)
      .setDepth(5);
  }

  protected uiText(x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle) {
    return this.toUi(this.add.text(x, y, text, style));
  }
}
