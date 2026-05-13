import Phaser from 'phaser';
import { BG_COLOR, LOGICAL_WIDTH, LOGICAL_HEIGHT } from './config.js';

export class BattlefieldScene extends Phaser.Scene {
  constructor() { super('battlefield'); }
  create() {
    this.add.rectangle(LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2, LOGICAL_WIDTH, LOGICAL_HEIGHT, BG_COLOR);
    this.events.emit('ready');
  }
}
