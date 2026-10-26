import Phaser from 'phaser';

export const WIDTH = 1280;
export const HEIGHT = 720;
export const FONT = 'Arial Black, Arial, sans-serif';

export const COLORS = {
  hudBg: 0xf2e6b0,
  hudEdge: 0xb87a3d,
  grass: 0x2fa84f,
  mapEdge: 0xf5d533,
  gutter: 0x111111,
  scrub: 0x6ec6ff,
  reload: 0xe53935,
  daylight: 0xffa726,
  night: 0x7e57c2,
  dim: 0x000000,
};

export function hex(color: string): number {
  return parseInt(color.replace('#', ''), 16);
}

export function addButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  enabled = true,
): Phaser.GameObjects.Text {
  const button = scene.add
    .text(x, y, label, {
      fontFamily: FONT,
      fontSize: '28px',
      color: enabled ? '#ffffff' : '#8a8a8a',
      backgroundColor: enabled ? '#2e7d32' : '#4a4a4a',
      padding: { x: 24, y: 10 },
    })
    .setOrigin(0.5);
  if (enabled) {
    button.setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setBackgroundColor('#43a047'));
    button.on('pointerout', () => button.setBackgroundColor('#2e7d32'));
    button.on('pointerup', onClick);
  }
  return button;
}
