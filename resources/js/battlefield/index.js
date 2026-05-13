import Phaser from 'phaser';
import { BattlefieldScene } from './scene.js';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, BG_COLOR } from './config.js';

export function bootBattlefield(mount, state) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    width: LOGICAL_WIDTH,
    height: LOGICAL_HEIGHT,
    backgroundColor: BG_COLOR,
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BattlefieldScene],
  });
  game.registry.set('initialState', state);
  return game;
}

window.bootBattlefield = bootBattlefield;
