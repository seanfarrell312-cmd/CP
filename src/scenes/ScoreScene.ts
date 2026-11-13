import Phaser from 'phaser';
import { MAPS } from '../rules/config';
import { RunState, isLastMap } from '../rules/run';
import { TerminalData } from './TerminalScene';
import { COLORS, FONT, WIDTH, addButton } from '../ui';

// D33: the night's POWA-IN and the bank it leaves. No POWAOUT (D40: days are free).
export class ScoreScene extends Phaser.Scene {
  constructor() {
    super('Score');
  }

  // victory (D23): the clean-map payout instead of a night's.
  create(data: { run: RunState; powain: number; victory?: boolean }) {
    const { run, powain, victory } = data;
    this.cameras.main.setBackgroundColor(COLORS.grass);
    const text = (y: number, s: string, size: number, color = '#ffffff') =>
      this.add
        .text(WIDTH / 2, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#22140C', strokeThickness: size / 6 })
        .setOrigin(0.5);

    text(150, 'GOOD JOB!', 84, '#5BC2E7');
    text(250, victory ? `${MAPS[run.mapIndex].label} is SPOTLESS! No night tonight.` : `Night ${run.day} is over`, 28);
    text(340, `POWA-IN: +${powain}`, 44, '#fff59d');
    text(410, `BANKED POWA: ${run.bank}`, 44);
    // D53: after the last map's payout the supervisor checks in before the end screen.
    let left = false;
    addButton(this, WIDTH / 2, 530, 'CONTINUE', () => {
      if (left) return;
      left = true;
      if (victory && isLastMap(run)) {
        const outro: TerminalData = { script: 'S02.supervisorOutro', next: 'Victory', nextData: { run } };
        this.scene.start('Terminal', outro);
      } else this.scene.start(victory ? 'Victory' : 'Upgrade', { run });
    });
  }
}
