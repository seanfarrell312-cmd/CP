import Phaser from 'phaser';

// Placeholder title screen until the demo is built (see DECISIONS.md D28).
class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 80, 'Clean POWA!', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '64px',
        color: '#5BC2E7',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 20, 'a game by seanologues', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 60, 'Coming soon', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        color: '#529182',
      })
      .setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#22140C',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TitleScene],
});
