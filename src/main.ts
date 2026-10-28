import Phaser from 'phaser';
import { DayScene } from './scenes/DayScene';
import { NightScene } from './scenes/NightScene';
import { TitleScene } from './scenes/TitleScene';
import { HEIGHT, WIDTH } from './ui';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#22140C',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TitleScene, DayScene, NightScene],
  // ?timeout drives the loop with setTimeout, for test browsers that don't run animation frames.
  fps: { forceSetTimeOut: new URLSearchParams(location.search).has('timeout') },
});

// Dev builds expose the game for browser debugging.
if (import.meta.env.DEV) Object.assign(window, { game });
