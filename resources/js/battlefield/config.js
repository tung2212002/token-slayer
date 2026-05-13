export const BG_COLOR = 0x0f172a;

export const LAYOUTS = {
  landscape: {
    logicalWidth: 480,
    logicalHeight: 270,
    boss: { anchor: { x: 240, y: 110 }, scale: 2, name: { x: 240, y: 70 } },
    hpBar: { x: 240, y: 170, width: 100, height: 6 },
    fighters: { rowXRange: [40, 440], rowY: 230, perRowMax: 14 },
  },
  portrait: {
    logicalWidth: 270,
    logicalHeight: 480,
    boss: { anchor: { x: 135, y: 140 }, scale: 2.5, name: { x: 135, y: 50 } },
    hpBar: { x: 135, y: 230, width: 200, height: 6 },
    fighters: { rowXRange: [25, 245], rowY: 460, perRowMax: 10 },
  },
};

// Back-compat aliases kept until scene.js and helpers migrate to LAYOUTS[mode].
// Removed in Task 5.
export const LOGICAL_WIDTH = LAYOUTS.landscape.logicalWidth;
export const LOGICAL_HEIGHT = LAYOUTS.landscape.logicalHeight;
export const BOSS_ANCHOR = LAYOUTS.landscape.boss.anchor;
export const BOSS_SCALE = LAYOUTS.landscape.boss.scale;
export const HP_BAR = LAYOUTS.landscape.hpBar;
export const BOSS_NAME = LAYOUTS.landscape.boss.name;
export const FIGHTER_ROW_Y = LAYOUTS.landscape.fighters.rowY;
export const FIGHTER_ROW_X_RANGE = LAYOUTS.landscape.fighters.rowXRange;

export const TIMINGS = {
  projectileArcMs: 320,
  flinchMs: 120,
  hpBarMs: 250,
  cameraShake: { duration: 180, intensity: 0.006 },
  chargeRingPulseMs: 600,
  fighterJoinMs: 300,
  bossSpawnMs: 500,
  bossKilledMs: 400,
};
