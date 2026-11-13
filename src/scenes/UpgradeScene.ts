import Phaser from 'phaser';
import { MAPS, UPGRADES, UpgradeDef, UpgradeId, WAX_PACKS } from '../rules/config';
import {
  PurchaseResult,
  RunState,
  buyWax,
  canSpend,
  resetPurchases,
  firstDayIsFree,
  hasShopChanges,
  maxBuyableLevel,
  startNextDay,
  tryAgain,
  unlockNext,
} from '../rules/run';
import { COLORS, FONT, HEIGHT, WIDTH, addButton } from '../ui';

const ROW_TOP = 104;
const ROW_HEIGHT = 50; // D49: nine upgrades plus Wax
const BOX_LEFT = 330;
const BOX_W = 150;
const BOX_H = 44;
const BOX_GAP = 10;

const DESCRIPTIONS: Record<UpgradeId, string> = {
  combo: 'SCRUB! streaks speed up the Scrub timer',
  extraScrubbers: 'Scrub counters you can store',
  scrubSpeed: 'Seconds per Scrub counter',
  brushPowa: 'Cleanliness per scrub',
  brushSize: 'Supped UP cleans every tile evenly',
  bristles: 'Glide over +8 panels for free',
  timeManipulation: 'Length of the day',
  clipSize: 'Shots you can store',
  reloadSpeed: 'Seconds per shot',
};

function valueLabel(id: UpgradeId, value: number): string {
  switch (id) {
    case 'extraScrubbers':
    case 'clipSize':
      return `${value} max`;
    case 'scrubSpeed':
    case 'reloadSpeed':
    case 'timeManipulation':
      return `${value} s`;
    case 'brushPowa':
      return `POWA ${value}`;
    case 'brushSize':
      return value ? 'Supped UP' : 'Default';
    case 'bristles':
    case 'combo':
      return value ? 'ON' : 'OFF';
  }
}

// Green when the bank covers the price, red when it doesn't.
const priceColor = (ok: boolean) => (ok ? '#2e7d32' : '#c62828');

// D02/D22/D34/D37/D40: unlock and Wax purchases (undoable), then GET SCRUBBIN! (free) or TRY AGAIN.
export class UpgradeScene extends Phaser.Scene {
  private run!: RunState;
  private ui?: Phaser.GameObjects.Container;
  private message?: Phaser.GameObjects.Text;

  constructor() {
    super('Upgrade');
  }

  create(data: { run: RunState }) {
    this.run = data.run;
    this.ui = undefined;
    this.message = undefined;
    this.cameras.main.setBackgroundColor(0x1f6e35);
    this.render();
  }

  private render() {
    this.ui?.destroy();
    const items: Phaser.GameObjects.GameObject[] = [];
    const { run } = this;
    const text = (x: number, y: number, s: string, size: number, color = '#ffffff') =>
      this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color });

    items.push(text(40, 24, 'UPGRADES', 40, '#fff59d'));
    items.push(text(330, 38, `DAY ${run.day}`, 24));
    items.push(text(WIDTH - 40, 30, `BANKED POWA: ${run.bank}`, 32, '#5BC2E7').setOrigin(1, 0));
    // D34: undo this screen's purchases, so a misclick never forces TRY AGAIN.
    const reset = addButton(this, 610, 52, 'RESET PURCHASES', () => {
      resetPurchases(run);
      this.render();
    }, hasShopChanges(run));
    items.push(reset.setFontSize(20));

    UPGRADES.forEach((u, i) => items.push(...this.upgradeRow(u, ROW_TOP + i * ROW_HEIGHT)));
    items.push(...this.waxRow(ROW_TOP + UPGRADES.length * ROW_HEIGHT));

    // D40: starting the next day is free.
    const go = addButton(this, WIDTH / 2 + 170, HEIGHT - 50, 'GET SCRUBBIN!', () => {
      startNextDay(run);
      this.scene.start('Day', { run });
    });
    items.push(go);
    items.push(addButton(this, WIDTH / 2 - 230, HEIGHT - 50, 'TRY AGAIN', () => this.confirmTryAgain()));

    this.ui = this.add.container(0, 0, items);
  }

  private upgradeRow(u: UpgradeDef, y: number): Phaser.GameObjects.GameObject[] {
    const { run } = this;
    const items: Phaser.GameObjects.GameObject[] = [
      this.add.text(40, y + 2, u.name, { fontFamily: FONT, fontSize: '20px', color: '#ffffff' }),
      this.add.text(40, y + 26, DESCRIPTIONS[u.id], { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#c8e6c9' }),
    ];
    u.levels.forEach((level, n) => {
      const x = BOX_LEFT + n * (BOX_W + BOX_GAP);
      // D37: the highest owned level is the active one; there is nothing to equip.
      const active = n === run.unlocked[u.id];
      const owned = n < run.unlocked[u.id];
      // D42: levels held back for Map 2 show as locked.
      const locked = n > maxBuyableLevel(run, u.id);
      const next = n === run.unlocked[u.id] + 1 && !locked;
      const sub = active ? 'ACTIVE' : owned ? 'owned' : locked ? 'LOCKED: MAP 2' : `BUY ${level.cost}`;
      let fill = 0x3a3a3a;
      let color = '#777777';
      if (active) [fill, color] = [0x2e7d32, '#ffffff'];
      else if (owned) [fill, color] = [0x5d6d5e, '#c8e6c9'];
      else if (next) [fill, color] = [COLORS.hudBg, '#3e2723'];
      const subColor = next ? priceColor(canSpend(run, level.cost)) : color;
      items.push(...this.box(x, y, valueLabel(u.id, level.value), sub, fill, color, subColor, active, () => {
        this.report(unlockNext(run, u.id));
        this.render();
      }, next));
    });
    return items;
  }

  private waxRow(y: number): Phaser.GameObjects.GameObject[] {
    const { run } = this;
    const items: Phaser.GameObjects.GameObject[] = [
      this.add.text(40, y + 2, `WAX  (you have ${run.wax})`, { fontFamily: FONT, fontSize: '20px', color: '#F48FB1' }),
      this.add.text(40, y + 26, 'Space on a +8 panel locks it clean', {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#c8e6c9',
      }),
    ];
    WAX_PACKS.forEach((pack, i) => {
      const x = BOX_LEFT + (i + 1) * (BOX_W + BOX_GAP);
      const subColor = priceColor(canSpend(run, pack.cost));
      items.push(...this.box(x, y, `+${pack.charges} WAX`, `BUY ${pack.cost}`, COLORS.hudBg, '#3e2723', subColor, false, () => {
        this.report(buyWax(run, i));
        this.render();
      }, true));
    });
    return items;
  }

  private box(
    x: number, y: number, label: string, sub: string, fill: number, color: string, subColor: string,
    highlight: boolean, onClick: () => void, clickable: boolean,
  ): Phaser.GameObjects.GameObject[] {
    const rect = this.add.rectangle(x, y, BOX_W, BOX_H, fill).setOrigin(0);
    if (highlight) rect.setStrokeStyle(3, 0xfff59d);
    if (clickable) {
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerup', onClick);
      rect.on('pointerover', () => rect.setAlpha(0.85));
      rect.on('pointerout', () => rect.setAlpha(1));
    }
    return [
      rect,
      this.add.text(x + BOX_W / 2, y + 12, label, { fontFamily: FONT, fontSize: '16px', color }).setOrigin(0.5),
      this.add.text(x + BOX_W / 2, y + 32, sub, { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '14px', color: subColor }).setOrigin(0.5),
    ];
  }

  // A refused purchase says why.
  private report(result: PurchaseResult) {
    if (result !== 'too-expensive') return;
    this.message?.destroy();
    this.message = this.add
      .text(WIDTH / 2, HEIGHT - 104, 'NOT ENOUGH BANKED POWA', {
        fontFamily: FONT, fontSize: '22px', color: '#ff8a80', stroke: '#000000', strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(5);
    const m = this.message;
    this.tweens.add({ targets: m, alpha: 0, delay: 1800, duration: 400, onComplete: () => m.destroy() });
  }

  // D13: TRY AGAIN loses everything since arriving at this map, so ask first.
  private confirmTryAgain() {
    const { run } = this;
    const where = run.mapIndex === 0 ? `Start ${MAPS[0].label} again from Day 1?` : `Go back to Day ${run.checkpoint.day}?`;
    const items: Phaser.GameObjects.GameObject[] = [
      this.add.rectangle(0, 0, WIDTH, HEIGHT, COLORS.dim, 0.7).setOrigin(0).setInteractive(),
      this.add.text(WIDTH / 2, 250, where, { fontFamily: FONT, fontSize: '40px', color: '#ffffff' }).setOrigin(0.5),
      this.add
        .text(WIDTH / 2, 310, 'The map, POWA and upgrades go back to how they were when you arrived.', {
          fontFamily: 'Arial, sans-serif', fontSize: '20px', color: '#ffffff',
        })
        .setOrigin(0.5),
    ];
    const dialog = this.add.container(0, 0, items).setDepth(10);
    dialog.add(addButton(this, WIDTH / 2 - 120, 420, 'TRY AGAIN', () => {
      tryAgain(run);
      this.scene.start(firstDayIsFree(run) ? 'Day' : 'Upgrade', { run });
    }));
    dialog.add(addButton(this, WIDTH / 2 + 120, 420, 'CANCEL', () => dialog.destroy()));
  }
}
