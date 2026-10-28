import Phaser from 'phaser';
import { newRun } from '../rules/run';
import { COLORS, FONT, HEIGHT, WIDTH, addButton } from '../ui';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.grass);

    this.add
      .text(WIDTH / 2, HEIGHT / 2 - 140, 'Clean POWA!', {
        fontFamily: FONT,
        fontSize: '96px',
        color: '#5BC2E7',
        stroke: '#22140C',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(WIDTH / 2, HEIGHT / 2 - 50, 'a game by seanologues', {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    addButton(this, WIDTH / 2, HEIGHT / 2 + 60, 'START', () => this.scene.start('Day', { run: newRun() }));
    // Options are disabled in the demo.
    addButton(this, WIDTH / 2, HEIGHT / 2 + 140, 'OPTIONS', () => {}, false);
  }
}
