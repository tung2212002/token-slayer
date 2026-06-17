export const BG_COLOR = 0x020617;

export const BOSS_TYPES = [
  { key: 'boss-ghost',        file: '/assets/battlefield/bosses/ghost.png?v=100',        frameWidth: 32,  frameHeight: 32,  idleStart: 0, idleEnd: 3, scale: 4   },
  { key: 'boss-skeleton',     file: '/assets/battlefield/bosses/skeleton.png?v=100',     frameWidth: 32,  frameHeight: 32,  idleStart: 0, idleEnd: 3, scale: 4   },
  { key: 'boss-slime',        file: '/assets/battlefield/bosses/slime.png?v=100',        frameWidth: 32,  frameHeight: 32,  idleStart: 0, idleEnd: 4, scale: 4   },
];

export const FIGHTER_TYPES = [
  {
    key: 'soldier', attackType: 'slash',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 8, rate: 10 },
      attack: { frames: 6, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 6,  rate: 12, effectFrames: 6  },
      { frames: 6,  rate: 12, effectFrames: 6  },
      { frames: 9,  rate: 12, effectFrames: 9  },
    ],
  },
  {
    key: 'knight', attackType: 'blade',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 8, rate: 10 },
      attack: { frames: 7, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 7,  rate: 12, effectFrames: 7  },
      { frames: 10, rate: 12, effectFrames: 10 },
      { frames: 11, rate: 12, effectFrames: 11 },
    ],
  },
  {
    key: 'swordsman', attackType: 'slash',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 8, rate: 10 },
      attack: { frames: 7, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 7,  rate: 12, effectFrames: 7  },
      { frames: 15, rate: 12, effectFrames: 15 },
      { frames: 12, rate: 12, effectFrames: 12 },
    ],
  },
  {
    key: 'axeman', attackType: 'slash',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 8, rate: 10 },
      attack: { frames: 9, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 9,  rate: 12, effectFrames: 9  },
      { frames: 9,  rate: 12, effectFrames: 9  },
      { frames: 12, rate: 12, effectFrames: 12 },
    ],
  },
  {
    key: 'orc', attackType: 'slash',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 8, rate: 10 },
      attack: { frames: 6, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 6, rate: 12, effectFrames: 6 },
      { frames: 6, rate: 12, effectFrames: 6 },
    ],
  },
  {
    key: 'armored-orc', attackType: 'blade',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 8, rate: 10 },
      attack: { frames: 7, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 7, rate: 12, effectFrames: 7 },
      { frames: 8, rate: 12, effectFrames: 8 },
      { frames: 9, rate: 12, effectFrames: 9 },
    ],
  },
  {
    key: 'elite-orc', attackType: 'blast',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 8, rate: 10 },
      attack: { frames: 7, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 7,  rate: 12, effectFrames: 7  },
      { frames: 11, rate: 12, effectFrames: 11 },
      { frames: 9,  rate: 12, effectFrames: 9  },
    ],
  },
  {
    key: 'skeleton', attackType: 'shuriken',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 8, rate: 10 },
      attack: { frames: 6, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 6, rate: 12, effectFrames: 6 },
      { frames: 7, rate: 12, effectFrames: 7 },
    ],
  },
  {
    key: 'armored-skeleton', attackType: 'blade',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 8, rate: 10 },
      attack: { frames: 8, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 8, rate: 12, effectFrames: 8 },
      { frames: 9, rate: 12, effectFrames: 9 },
    ],
  },
  {
    key: 'slime', attackType: 'blast',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 6, rate: 10 },
      attack: { frames: 6, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 6,  rate: 12, effectFrames: 6  },
      { frames: 12, rate: 12, effectFrames: 12 },
    ],
  },
  {
    key: 'archer', attackType: 'arrow',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 8, rate: 10 },
      attack: { frames: 9, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 9,  rate: 12, effectFrames: 9  },
      { frames: 12, rate: 12, effectFrames: 12 },
    ],
  },
  {
    key: 'werewolf', attackType: 'slash',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 8, rate: 10 },
      attack: { frames: 9, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 9,  rate: 12, effectFrames: 9  },
      { frames: 13, rate: 12, effectFrames: 13 },
    ],
  },
  {
    key: 'werebear', attackType: 'blast',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 8, rate: 10 },
      attack: { frames: 9, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 9,  rate: 12, effectFrames: 9  },
      { frames: 13, rate: 12, effectFrames: 13 },
      { frames: 9,  rate: 12, effectFrames: 9  },
    ],
  },
  {
    key: 'orc-rider', attackType: 'arrow',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 8, rate: 10 },
      attack: { frames: 8, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 8,  rate: 12, effectFrames: 8  },
      { frames: 9,  rate: 12, effectFrames: 9  },
      { frames: 11, rate: 12, effectFrames: 11 },
    ],
  },
  {
    key: 'greatsword-skeleton', attackType: 'blade',
    animations: {
      idle:   { frames: 6, rate: 8  },
      walk:   { frames: 9, rate: 10 },
      attack: { frames: 9, rate: 12 },
      death:  { frames: 4, rate: 6  },
    },
    attacks: [
      { frames: 9,  rate: 12, effectFrames: 9  },
      { frames: 12, rate: 12, effectFrames: 12 },
      { frames: 8,  rate: 12, effectFrames: 8  },
    ],
  },
];

export const LAYOUTS = {
  landscape: {
    logicalWidth: 960,
    logicalHeight: 540,
    boss: { anchor: { x: 480, y: 180 }, scale: 4, name: { x: 480, y: 100 } },
    hpBar: { x: 480, y: 300, width: 200, height: 12 },
    fighters: { rowXRange: [80, 880], rowY: 460, perRowMax: 14 },
  },
  portrait: {
    logicalWidth: 540,
    logicalHeight: 960,
    boss: { anchor: { x: 270, y: 310 }, scale: 5, name: { x: 270, y: 200 } },
    hpBar: { x: 270, y: 430, width: 280, height: 12 },
    fighters: { rowXRange: [50, 490], rowY: 820, perRowMax: 10 },
  },
};

export const TIMINGS = {
  projectileArcMs: 320,
  flinchMs: 120,
  hpBarMs: 250,
  cameraShake: { duration: 180, intensity: 0.003 },
  chargeRingPulseMs: 600,
  fighterJoinMs: 300,
  bossSpawnMs: 500,
  bossKilledMs: 400,
};
