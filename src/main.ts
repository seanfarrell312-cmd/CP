import Phaser from 'phaser';
import { DayScene } from './scenes/DayScene';
import { TitleScene } from './scenes/TitleScene';
import { HEIGHT, WIDTH } from './ui';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#22140C',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TitleScene, DayScene],
  // ?timeout drives the loop with setTimeout, for test browsers that don't run animation frames.
  fps: { forceSetTimeOut: new URLSearchParams(location.search).has('timeout') },
});
