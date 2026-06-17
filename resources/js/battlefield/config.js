export const BG_COLOR = 0x020617;

export const BOSS_TYPES = [
  { key: 'boss-ghost',        file: '/assets/battlefield/bosses/ghost.png?v=100',        frameWidth: 32,  frameHeight: 32,  idleStart: 0, idleEnd: 3, scale: 4   },
  { key: 'boss-skeleton',     file: '/assets/battlefield/bosses/skeleton.png?v=100',     frameWidth: 32,  frameHeight: 32,  idleStart: 0, idleEnd: 3, scale: 4   },
  { key: 'boss-slime',        file: '/assets/battlefield/bosses/slime.png?v=100',        frameWidth: 32,  frameHeight: 32,  idleStart: 0, idleEnd: 4, scale: 4   },
];

export const FIGHTER_TYPES = [
  {
    key: 'soldier', attackType: 'slash', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/soldier-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/soldier-walk.png?v=100',   frames: 8, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/soldier-attack.png?v=100', frames: 6, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/soldier-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/soldier-attack1.png?v=100', frames: 6,  rate: 12, effect: '/assets/battlefield/fighters/soldier-effect1.png?v=100', effectFrames: 6  },
      { file: '/assets/battlefield/fighters/soldier-attack2.png?v=100', frames: 6,  rate: 12, effect: '/assets/battlefield/fighters/soldier-effect2.png?v=100', effectFrames: 6  },
      { file: '/assets/battlefield/fighters/soldier-attack3.png?v=100', frames: 9,  rate: 12, effect: '/assets/battlefield/fighters/soldier-effect3.png?v=100', effectFrames: 9  },
    ],
  },
  {
    key: 'knight', attackType: 'blade', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/knight-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/knight-walk.png?v=100',   frames: 8, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/knight-attack.png?v=100', frames: 7, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/knight-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/knight-attack1.png?v=100', frames: 7,  rate: 12, effect: '/assets/battlefield/fighters/knight-effect1.png?v=100', effectFrames: 7  },
      { file: '/assets/battlefield/fighters/knight-attack2.png?v=100', frames: 10, rate: 12, effect: '/assets/battlefield/fighters/knight-effect2.png?v=100', effectFrames: 10 },
      { file: '/assets/battlefield/fighters/knight-attack3.png?v=100', frames: 11, rate: 12, effect: '/assets/battlefield/fighters/knight-effect3.png?v=100', effectFrames: 11 },
    ],
  },
  {
    key: 'swordsman', attackType: 'slash', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/swordsman-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/swordsman-walk.png?v=100',   frames: 8, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/swordsman-attack.png?v=100', frames: 7, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/swordsman-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/swordsman-attack1.png?v=100', frames: 7,  rate: 12, effect: '/assets/battlefield/fighters/swordsman-effect1.png?v=100', effectFrames: 7  },
      { file: '/assets/battlefield/fighters/swordsman-attack2.png?v=100', frames: 15, rate: 12, effect: '/assets/battlefield/fighters/swordsman-effect2.png?v=100', effectFrames: 15 },
      { file: '/assets/battlefield/fighters/swordsman-attack3.png?v=100', frames: 12, rate: 12, effect: '/assets/battlefield/fighters/swordsman-effect3.png?v=100', effectFrames: 12 },
    ],
  },
  {
    key: 'axeman', attackType: 'slash', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/axeman-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/axeman-walk.png?v=100',   frames: 8, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/axeman-attack.png?v=100', frames: 9, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/axeman-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/axeman-attack1.png?v=100', frames: 9,  rate: 12, effect: '/assets/battlefield/fighters/axeman-effect1.png?v=100', effectFrames: 9  },
      { file: '/assets/battlefield/fighters/axeman-attack2.png?v=100', frames: 9,  rate: 12, effect: '/assets/battlefield/fighters/axeman-effect2.png?v=100', effectFrames: 9  },
      { file: '/assets/battlefield/fighters/axeman-attack3.png?v=100', frames: 12, rate: 12, effect: '/assets/battlefield/fighters/axeman-effect3.png?v=100', effectFrames: 12 },
    ],
  },
  {
    key: 'orc', attackType: 'slash', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/orc-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/orc-walk.png?v=100',   frames: 8, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/orc-attack.png?v=100', frames: 6, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/orc-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/orc-attack1.png?v=100', frames: 6, rate: 12, effect: '/assets/battlefield/fighters/orc-effect1.png?v=100', effectFrames: 6 },
      { file: '/assets/battlefield/fighters/orc-attack2.png?v=100', frames: 6, rate: 12, effect: '/assets/battlefield/fighters/orc-effect2.png?v=100', effectFrames: 6 },
    ],
  },
  {
    key: 'armored-orc', attackType: 'blade', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/armored-orc-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/armored-orc-walk.png?v=100',   frames: 8, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/armored-orc-attack.png?v=100', frames: 7, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/armored-orc-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/armored-orc-attack1.png?v=100', frames: 7, rate: 12, effect: '/assets/battlefield/fighters/armored-orc-effect1.png?v=100', effectFrames: 7 },
      { file: '/assets/battlefield/fighters/armored-orc-attack2.png?v=100', frames: 8, rate: 12, effect: '/assets/battlefield/fighters/armored-orc-effect2.png?v=100', effectFrames: 8 },
      { file: '/assets/battlefield/fighters/armored-orc-attack3.png?v=100', frames: 9, rate: 12, effect: '/assets/battlefield/fighters/armored-orc-effect3.png?v=100', effectFrames: 9 },
    ],
  },
  {
    key: 'elite-orc', attackType: 'blast', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/elite-orc-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/elite-orc-walk.png?v=100',   frames: 8, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/elite-orc-attack.png?v=100', frames: 7, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/elite-orc-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/elite-orc-attack1.png?v=100', frames: 7,  rate: 12, effect: '/assets/battlefield/fighters/elite-orc-effect1.png?v=100', effectFrames: 7  },
      { file: '/assets/battlefield/fighters/elite-orc-attack2.png?v=100', frames: 11, rate: 12, effect: '/assets/battlefield/fighters/elite-orc-effect2.png?v=100', effectFrames: 11 },
      { file: '/assets/battlefield/fighters/elite-orc-attack3.png?v=100', frames: 9,  rate: 12, effect: '/assets/battlefield/fighters/elite-orc-effect3.png?v=100', effectFrames: 9  },
    ],
  },
  {
    key: 'skeleton', attackType: 'shuriken', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/skeleton-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/skeleton-walk.png?v=100',   frames: 8, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/skeleton-attack.png?v=100', frames: 6, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/skeleton-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/skeleton-attack1.png?v=100', frames: 6, rate: 12, effect: '/assets/battlefield/fighters/skeleton-effect1.png?v=100', effectFrames: 6 },
      { file: '/assets/battlefield/fighters/skeleton-attack2.png?v=100', frames: 7, rate: 12, effect: '/assets/battlefield/fighters/skeleton-effect2.png?v=100', effectFrames: 7 },
    ],
  },
  {
    key: 'armored-skeleton', attackType: 'blade', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/armored-skeleton-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/armored-skeleton-walk.png?v=100',   frames: 8, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/armored-skeleton-attack.png?v=100', frames: 8, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/armored-skeleton-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/armored-skeleton-attack1.png?v=100', frames: 8, rate: 12, effect: '/assets/battlefield/fighters/armored-skeleton-effect1.png?v=100', effectFrames: 8 },
      { file: '/assets/battlefield/fighters/armored-skeleton-attack2.png?v=100', frames: 9, rate: 12, effect: '/assets/battlefield/fighters/armored-skeleton-effect2.png?v=100', effectFrames: 9 },
    ],
  },
  {
    key: 'slime', attackType: 'blast', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/slime-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/slime-walk.png?v=100',   frames: 6, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/slime-attack.png?v=100', frames: 6, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/slime-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/slime-attack1.png?v=100', frames: 6,  rate: 12, effect: '/assets/battlefield/fighters/slime-effect1.png?v=100', effectFrames: 6  },
      { file: '/assets/battlefield/fighters/slime-attack2.png?v=100', frames: 12, rate: 12, effect: '/assets/battlefield/fighters/slime-effect2.png?v=100', effectFrames: 12 },
    ],
  },
  {
    key: 'archer', attackType: 'arrow', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/archer-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/archer-walk.png?v=100',   frames: 8, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/archer-attack.png?v=100', frames: 9, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/archer-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/archer-attack1.png?v=100', frames: 9,  rate: 12, effect: '/assets/battlefield/fighters/archer-effect1.png?v=100', effectFrames: 9  },
      { file: '/assets/battlefield/fighters/archer-attack2.png?v=100', frames: 12, rate: 12, effect: '/assets/battlefield/fighters/archer-effect2.png?v=100', effectFrames: 12 },
    ],
  },
  {
    key: 'werewolf', attackType: 'slash', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/werewolf-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/werewolf-walk.png?v=100',   frames: 8, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/werewolf-attack.png?v=100', frames: 9, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/werewolf-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/werewolf-attack1.png?v=100', frames: 9,  rate: 12, effect: '/assets/battlefield/fighters/werewolf-effect1.png?v=100', effectFrames: 9  },
      { file: '/assets/battlefield/fighters/werewolf-attack2.png?v=100', frames: 13, rate: 12, effect: '/assets/battlefield/fighters/werewolf-effect2.png?v=100', effectFrames: 13 },
    ],
  },
  {
    key: 'werebear', attackType: 'blast', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/werebear-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/werebear-walk.png?v=100',   frames: 8, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/werebear-attack.png?v=100', frames: 9, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/werebear-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/werebear-attack1.png?v=100', frames: 9,  rate: 12, effect: '/assets/battlefield/fighters/werebear-effect1.png?v=100', effectFrames: 9  },
      { file: '/assets/battlefield/fighters/werebear-attack2.png?v=100', frames: 13, rate: 12, effect: '/assets/battlefield/fighters/werebear-effect2.png?v=100', effectFrames: 13 },
      { file: '/assets/battlefield/fighters/werebear-attack3.png?v=100', frames: 9,  rate: 12, effect: '/assets/battlefield/fighters/werebear-effect3.png?v=100', effectFrames: 9  },
    ],
  },
  {
    key: 'orc-rider', attackType: 'arrow', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/orc-rider-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/orc-rider-walk.png?v=100',   frames: 8, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/orc-rider-attack.png?v=100', frames: 8, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/orc-rider-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/orc-rider-attack1.png?v=100', frames: 8,  rate: 12, effect: '/assets/battlefield/fighters/orc-rider-effect1.png?v=100', effectFrames: 8  },
      { file: '/assets/battlefield/fighters/orc-rider-attack2.png?v=100', frames: 9,  rate: 12, effect: '/assets/battlefield/fighters/orc-rider-effect2.png?v=100', effectFrames: 9  },
      { file: '/assets/battlefield/fighters/orc-rider-attack3.png?v=100', frames: 11, rate: 12, effect: '/assets/battlefield/fighters/orc-rider-effect3.png?v=100', effectFrames: 11 },
    ],
  },
  {
    key: 'greatsword-skeleton', attackType: 'blade', frameWidth: 100, frameHeight: 100,
    animations: {
      idle:   { file: '/assets/battlefield/fighters/greatsword-skeleton-idle.png?v=100',   frames: 6, rate: 8  },
      walk:   { file: '/assets/battlefield/fighters/greatsword-skeleton-walk.png?v=100',   frames: 9, rate: 10 },
      attack: { file: '/assets/battlefield/fighters/greatsword-skeleton-attack.png?v=100', frames: 9, rate: 12 },
      death:  { file: '/assets/battlefield/fighters/greatsword-skeleton-death.png?v=100',  frames: 4, rate: 6  },
    },
    attacks: [
      { file: '/assets/battlefield/fighters/greatsword-skeleton-attack1.png?v=100', frames: 9,  rate: 12, effect: '/assets/battlefield/fighters/greatsword-skeleton-effect1.png?v=100', effectFrames: 9  },
      { file: '/assets/battlefield/fighters/greatsword-skeleton-attack2.png?v=100', frames: 12, rate: 12, effect: '/assets/battlefield/fighters/greatsword-skeleton-effect2.png?v=100', effectFrames: 12 },
      { file: '/assets/battlefield/fighters/greatsword-skeleton-attack3.png?v=100', frames: 8,  rate: 12, effect: '/assets/battlefield/fighters/greatsword-skeleton-effect3.png?v=100', effectFrames: 8  },
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
