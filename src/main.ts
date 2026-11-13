import Phaser from 'phaser';
import { DayScene } from './scenes/DayScene';
import { IntroScene } from './scenes/IntroScene';
import { NightScene } from './scenes/NightScene';
import { ScoreScene } from './scenes/ScoreScene';
import { TerminalScene } from './scenes/TerminalScene';
import { TitleScene } from './scenes/TitleScene';
import { UpgradeScene } from './scenes/UpgradeScene';
import { VictoryScene } from './scenes/VictoryScene';
import { HEIGHT, WIDTH } from './ui';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#22140C',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [TitleScene, IntroScene, TerminalScene, DayScene, NightScene, ScoreScene, UpgradeScene, VictoryScene],
  // ?timeout drives the loop with setTimeout, for test browsers that don't run animation frames.
  fps: { forceSetTimeOut: new URLSearchParams(location.search).has('timeout') },
});

// Dev builds expose the game for browser debugging.
if (import.meta.env.DEV) Object.assign(window, { game });
