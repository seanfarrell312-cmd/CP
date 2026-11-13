import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../ui';

// D57: a short screen glitch of jumping bars, for the yellow intrusion going in and out.
// `place` lets a map scene put the bars on its UI camera.
export function glitchBars(
  scene: Phaser.Scene,
  duration: number,
  onDone?: () => void,
  place: (go: Phaser.GameObjects.Graphics) => Phaser.GameObjects.Graphics = (go) => go,
) {
  const g = place(scene.add.graphics().setDepth(50));
  const colors = [0xffe14d, 0x000000, 0xffffff, 0x39ff6a, 0x5c391b];
  const draw = () => {
    g.clear();
    for (let i = 0; i < 9; i++) {
      g.fillStyle(colors[Math.floor(Math.random() * colors.length)], 0.5 + Math.random() * 0.5);
      const h = 6 + Math.random() * 60;
      g.fillRect(Math.random() * WIDTH * 0.3 - 100, Math.random() * HEIGHT, WIDTH * (0.5 + Math.random()), h);
    }
  };
  draw();
  const timer = scene.time.addEvent({ delay: 50, loop: true, callback: draw });
  scene.cameras.main.shake(duration, 0.008);
  scene.time.delayedCall(duration, () => {
    timer.remove();
    g.destroy();
    onDone?.();
  });
}
