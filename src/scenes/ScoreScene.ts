import Phaser from 'phaser';
import { RunState } from '../rules/run';
import { COLORS, FONT, WIDTH, addButton } from '../ui';

// D33: the night's POWAIN and the bank it leaves. No POWAOUT here; that lives on GET SCRUBBIN!
export class ScoreScene extends Phaser.Scene {
  constructor() {
    super('Score');
  }

  create(data: { run: RunState; powain: number }) {
    const { run, powain } = data;
    this.cameras.main.setBackgroundColor(COLORS.grass);
    const text = (y: number, s: string, size: number, color = '#ffffff') =>
      this.add
        .text(WIDTH / 2, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#22140C', strokeThickness: size / 6 })
        .setOrigin(0.5);

    text(150, 'GOOD JOB!', 84, '#5BC2E7');
    text(250, `Night ${run.day} is over`, 28);
    text(340, `POWAIN: +${powain}`, 44, '#fff59d');
    text(410, `BANKED POWA: ${run.bank}`, 44);
    addButton(this, WIDTH / 2, 530, 'CONTINUE', () => this.scene.start('Upgrade', { run }));
  }
}
