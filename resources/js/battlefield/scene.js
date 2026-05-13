import Phaser from 'phaser';
import {
  BG_COLOR,
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  BOSS_ANCHOR,
  HP_BAR,
  BOSS_NAME,
} from './config.js';

export class BattlefieldScene extends Phaser.Scene {
  constructor() {
    super('battlefield');
  }

  preload() {
    this.load.spritesheet('boss-ghost', '/assets/battlefield/bosses/ghost.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    this.add.rectangle(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, LOGICAL_WIDTH, LOGICAL_HEIGHT, BG_COLOR);

    const state = this.game.registry.get('initialState');
    this.bossState = { ...state.boss };

    this.anims.create({
      key: 'boss-idle',
      frames: this.anims.generateFrameNumbers('boss-ghost', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });

    this.bossSprite = this.add
      .sprite(BOSS_ANCHOR.x, BOSS_ANCHOR.y, 'boss-ghost')
      .setScale(3)
      .play('boss-idle');

    this.bossNameText = this.add
      .text(BOSS_NAME.x, BOSS_NAME.y, `BOSS #${state.boss.number}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setResolution(2);

    this.hpBarBg = this.add
      .rectangle(HP_BAR.x, HP_BAR.y, HP_BAR.width, HP_BAR.height, 0x334155)
      .setOrigin(0.5);

    this.hpBarFill = this.add
      .rectangle(
        HP_BAR.x - HP_BAR.width / 2,
        HP_BAR.y,
        HP_BAR.width * (state.boss.currentHp / state.boss.maxHp),
        HP_BAR.height,
        0xef4444
      )
      .setOrigin(0, 0.5);

    this.hpText = this.add
      .text(HP_BAR.x, HP_BAR.y + 10, `${state.boss.currentHp} / ${state.boss.maxHp}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#cbd5e1',
      })
      .setOrigin(0.5)
      .setResolution(2);

    this.events.emit('ready');
  }
}
