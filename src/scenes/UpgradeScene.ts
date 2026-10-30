import Phaser from 'phaser';
import { UPGRADES, UpgradeDef, UpgradeId, WAX_PACKS } from '../rules/config';
import {
  PurchaseResult,
  RunState,
  buyWax,
  canSpend,
  canStartDay,
  dayCost,
  equip,
  resetPurchases,
  firstDayIsFree,
  hasShopChanges,
  startNextDay,
  tryAgain,
  unlockNext,
} from '../rules/run';
import { COLORS, FONT, HEIGHT, WIDTH, addButton } from '../ui';

const ROW_TOP = 104;
const ROW_HEIGHT = 54;
const BOX_LEFT = 330;
const BOX_W = 150;
const BOX_H = 46;
const BOX_GAP = 10;

const DESCRIPTIONS: Record<UpgradeId, string> = {
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
      return value ? 'ON' : 'OFF';
  }
}

// Green when buying keeps enough for the next day (D02 item 6), red when it would be refused.
const priceColor = (ok: boolean) => (ok ? '#2e7d32' : '#c62828');

// D02/D22/D33/D34: unlock, equip and Wax purchases (undoable), then GET SCRUBBIN! (cost shown, red when short) or TRY AGAIN.
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

    const cost = dayCost(run);
    const affordable = canStartDay(run);
    const go = this.add
      .text(WIDTH / 2 + 170, HEIGHT - 50, `GET SCRUBBIN!  ${cost}`, {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#ffffff',
        backgroundColor: affordable ? '#2e7d32' : '#c62828',
        padding: { x: 24, y: 10 },
      })
      .setOrigin(0.5);
    if (affordable) {
      go.setInteractive({ useHandCursor: true });
      go.on('pointerover', () => go.setBackgroundColor('#43a047'));
      go.on('pointerout', () => go.setBackgroundColor('#2e7d32'));
      go.on('pointerup', () => {
        if (startNextDay(run)) this.scene.start('Day', { run });
      });
    }
    items.push(go);
    items.push(addButton(this, WIDTH / 2 - 230, HEIGHT - 50, 'TRY AGAIN', () => this.confirmTryAgain()));

    this.ui = this.add.container(0, 0, items);
  }

  private upgradeRow(u: UpgradeDef, y: number): Phaser.GameObjects.GameObject[] {
    const { run } = this;
    const items: Phaser.GameObjects.GameObject[] = [
      this.add.text(40, y + 2, u.name, { fontFamily: FONT, fontSize: '20px', color: '#ffffff' }),
      this.add.text(40, y + 28, DESCRIPTIONS[u.id], { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#c8e6c9' }),
    ];
    u.levels.forEach((level, n) => {
      const x = BOX_LEFT + n * (BOX_W + BOX_GAP);
      const unlocked = n <= run.unlocked[u.id];
      const equipped = n === run.equipped[u.id];
      const next = n === run.unlocked[u.id] + 1;
      const sub = unlocked ? (level.maintenance ? `${level.maintenance} / day` : 'free') : `BUY ${level.cost}`;
      let fill = 0x3a3a3a;
      let color = '#777777';
      if (equipped) [fill, color] = [0x2e7d32, '#ffffff'];
      else if (unlocked) [fill, color] = [0x5d6d5e, '#ffffff'];
      else if (next) [fill, color] = [COLORS.hudBg, '#3e2723'];
      const subColor = next ? priceColor(canSpend(run, level.cost)) : color;
      items.push(...this.box(x, y, valueLabel(u.id, level.value), sub, fill, color, subColor, equipped, () => {
        if (unlocked) equip(run, u.id, n);
        else if (next) this.report(unlockNext(run, u.id));
        else return;
        this.render();
      }, unlocked || next));
    });
    return items;
  }

  private waxRow(y: number): Phaser.GameObjects.GameObject[] {
    const { run } = this;
    const items: Phaser.GameObjects.GameObject[] = [
      this.add.text(40, y + 2, `WAX  (you have ${run.wax})`, { fontFamily: FONT, fontSize: '20px', color: '#F48FB1' }),
      this.add.text(40, y + 28, 'Space on a +8 panel locks it clean', {
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
      this.add.text(x + BOX_W / 2, y + 13, label, { fontFamily: FONT, fontSize: '16px', color }).setOrigin(0.5),
      this.add.text(x + BOX_W / 2, y + 33, sub, { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '14px', color: subColor }).setOrigin(0.5),
    ];
  }

  // D02 item 6: a refused purchase explains the floor.
  private report(result: PurchaseResult) {
    if (result !== 'must-retain') return;
    this.message?.destroy();
    this.message = this.add
      .text(WIDTH / 2, HEIGHT - 104, `MUST RETAIN ${dayCost(this.run)} POWA to start the next day`, {
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
    const where = run.mapIndex === 0 ? 'Start Map 1 again from Day 1?' : `Go back to Day ${run.checkpoint.day}?`;
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
