import Phaser from 'phaser';
import { BattlefieldScene } from './scene.js';
import { LAYOUTS, BG_COLOR } from './config.js';
import { bus } from './bus.js';

const ECHO_EVENT_MAP = {
  HitDealt: 'hit',
  BossSpawned: 'boss-spawned',
  BossKilled: 'boss-killed',
  FighterJoined: 'fighter-joined',
  FighterCharging: 'fighter-charging',
  FighterIdled: 'fighter-idled',
};

let echoChannel = null;

function subscribeEcho() {
  if (!window.Echo) {
    console.warn('[battlefield] window.Echo not available; events will not be received');
    return;
  }
  if (echoChannel) {
    for (const evt of Object.keys(ECHO_EVENT_MAP)) {
      echoChannel.stopListening('.' + evt);
    }
  }
  echoChannel = window.Echo.channel('battlefield');
  for (const [evt, key] of Object.entries(ECHO_EVENT_MAP)) {
    echoChannel.listen('.' + evt, payload => bus.emit(key, payload));
  }
}

export function detectMode() {
  return window.innerWidth < window.innerHeight ? 'portrait' : 'landscape';
}

function bootGame(mount, state, mode) {
  const layout = LAYOUTS[mode];
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: mount,
    width: layout.logicalWidth,
    height: layout.logicalHeight,
    backgroundColor: BG_COLOR,
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BattlefieldScene],
  });
  game.registry.set('initialState', state);
  game.registry.set('mode', mode);

  game.events.once('ready', () => {
    subscribeEcho();
    const scene = game.scene.getScene('battlefield');
    window.__battlefield = {
      bus,
      game,
      scene,
      mode,
      bossHp: () => scene.bossState?.currentHp,
      bossMaxHp: () => scene.bossState?.maxHp,
    };
  });

  return game;
}

export function bootBattlefield(mount, state) {
  let currentMode = detectMode();
  let currentGame = bootGame(mount, state, currentMode);
  let pending = null;

  const onResize = () => {
    clearTimeout(pending);
    pending = setTimeout(() => {
      const next = detectMode();
      if (next === currentMode) {
        return;
      }
      currentMode = next;
      currentGame.destroy(true);
      currentGame = bootGame(mount, state, currentMode);
    }, 200);
  };

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  return currentGame;
}

window.bootBattlefield = bootBattlefield;
