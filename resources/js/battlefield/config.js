export const BG_COLOR = 0x0f172a;

export const LAYOUTS = {
  landscape: {
    logicalWidth: 480,
    logicalHeight: 270,
    boss: { anchor: { x: 240, y: 90 }, scale: 2, name: { x: 240, y: 50 } },
    hpBar: { x: 240, y: 150, width: 100, height: 6 },
    fighters: { rowXRange: [40, 440], rowY: 230, perRowMax: 14 },
  },
  portrait: {
    logicalWidth: 270,
    logicalHeight: 480,
    boss: { anchor: { x: 135, y: 110 }, scale: 2.5, name: { x: 135, y: 50 } },
    hpBar: { x: 135, y: 175, width: 140, height: 6 },
    fighters: { rowXRange: [25, 245], rowY: 410, perRowMax: 10 },
  },
};

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
