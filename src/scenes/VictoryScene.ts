import Phaser from 'phaser';
import { MAPS } from '../rules/config';
import { RunState, isLastMap, newRun, nextMap } from '../rules/run';
import { COLORS, FONT, WIDTH, addButton } from '../ui';
import { TerminalData } from './TerminalScene';

// D23: after the clean-map Score screen. NEXT MAP, or the end of the demo after Map 2.
export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  create(data: { run: RunState }) {
    const { run } = data;
    this.cameras.main.setBackgroundColor(COLORS.grass);
    const text = (y: number, s: string, size: number, color = '#ffffff') =>
      this.add
        .text(WIDTH / 2, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#22140C', strokeThickness: size / 6 })
        .setOrigin(0.5);

    if (isLastMap(run)) {
      text(170, 'THANK YOU FOR PLAYING!', 72, '#5BC2E7');
      text(270, 'You have completed the game!', 36, '#fff59d');
      text(340, `Both Power Panels spotless by Day ${run.day} with ${run.bank} POWA banked.`, 26);
      // D53: a new game, so the comic and tutorials play again (SKIP is offered for seen scenes).
      addButton(this, WIDTH / 2 - 150, 480, 'PLAY AGAIN', () => this.scene.start('Intro', { run: newRun() }));
      addButton(this, WIDTH / 2 + 150, 480, 'TITLE', () => this.scene.start('Title'));
      return;
    }

    const next = MAPS[run.mapIndex + 1];
    text(170, `${MAPS[run.mapIndex].label.toUpperCase()} COMPLETE!`, 72, '#5BC2E7');
    text(270, `Next up: ${next.label}, ${next.panelsX} x ${next.panelsY} panels to scrub.`, 30, '#fff59d');
    text(330, 'Your POWA, upgrades and Wax come with you.', 26);
    // D53: the supervisor checks in, then the next map's upgrade screen. nextMap runs once.
    let left = false;
    addButton(this, WIDTH / 2, 470, 'NEXT MAP', () => {
      if (left) return;
      left = true;
      nextMap(run);
      const outro: TerminalData = { script: 'S01.supervisorOutro', next: 'Upgrade', nextData: { run } };
      this.scene.start('Terminal', outro);
    });
  }
}
