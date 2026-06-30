import Phaser from 'phaser';
import { BG_COLOR, LAYOUTS, TIMINGS, BOSS_TYPES, FIGHTER_TYPES } from './config.js';
import { computeFighterPositions, damageScaleMultiplier, fighterDisplayConfig } from './layout.js';
import { bus } from './bus.js';
import { ATTACK_HANDLERS } from './attacks.js';
import { applyImpact } from './impact.js';
import { createLeaderboard, showMvpCard } from './leaderboard.js';
import { formatHp } from './format.js';

// Tiny RPG sprites — original 100×100 frames
// Visible character occupies rows 38-56 of the 100px frame
const SPRITE_CHAR_HEIGHT = 18;   // 56 - 38
const SPRITE_HALF_FRAME  = 50;   // 100 / 2
const SPRITE_CHAR_TOP    = 38;
const SPRITE_CHAR_BOT    = 56;

const ACTIVITY_MAX_CHARS = 18;
function truncateActivity(activity, maxChars = ACTIVITY_MAX_CHARS) {
  if (!activity || activity.length <= maxChars) {
    return activity ?? '';
  }
  return activity.slice(0, maxChars - 1) + '…';
}

const HANDLE_MAX_CHARS = 12;
function truncateHandle(handle, maxChars = HANDLE_MAX_CHARS) {
  if (!handle || handle.length <= maxChars) {
    return handle ?? '';
  }
  return handle.slice(0, maxChars - 1) + '…';
}

function handleFontPx(displaySize) {
  return Math.max(10, Math.round(displaySize * 0.25));
}

function chargeParticleColors(ftype) {
  switch (ftype) {
    case 'werewolf':
    case 'werebear':
      // purple/blue — wild feral energy
      return [0x4400aa, 0x6600cc, 0x8833dd, 0xaa55ee, 0xcc88ff];
    case 'orc':
    case 'armored-orc':
    case 'elite-orc':
    case 'orc-rider':
      // green — orcish power
      return [0x005500, 0x117700, 0x33aa00, 0x55cc11, 0x88ee44];
    case 'skeleton':
    case 'armored-skeleton':
    case 'greatsword-skeleton':
      // cold blue/white — undead
      return [0x003366, 0x0055aa, 0x1188cc, 0x44bbee, 0xaaddff];
    case 'slime':
      // acid green
      return [0x336600, 0x558800, 0x88bb00, 0xaadd00, 0xddff44];
    case 'archer':
      // golden/yellow — swift energy
      return [0x886600, 0xaa8800, 0xccaa00, 0xeecc00, 0xffee44];
    default:
      // fire orange/red — knight, axeman, soldier, swordsman, etc.
      return [0x991100, 0xcc3300, 0xdd6600, 0xee9900, 0xffbb00];
  }
}

function avatarPx(displaySize) {
  return Math.round(displaySize * 0.85);
}

export class BattlefieldScene extends Phaser.Scene {
  constructor() {
    super('battlefield');
  }

  preload() {
    // Single atlas covers all 138 fighter strips
    if (!this.textures.exists('fighters')) {
      this.load.atlas(
        'fighters',
        '/assets/battlefield/fighters/fighters-atlas.png',
        '/assets/battlefield/fighters/fighters-atlas.json',
      );
    }
    for (const boss of BOSS_TYPES) {
      if (boss.animFiles) {
        for (const [anim, info] of Object.entries(boss.animFiles)) {
          const texKey = `${boss.key}-${anim}`;
          if (!this.textures.exists(texKey))
            this.load.spritesheet(texKey, info.file, { frameWidth: info.frameWidth, frameHeight: info.frameHeight });
        }
      } else {
        if (!this.textures.exists(boss.key))
          this.load.spritesheet(boss.key, boss.file, { frameWidth: boss.frameWidth, frameHeight: boss.frameHeight });
      }
    }
    if (!this.textures.exists('fireball'))
      this.load.spritesheet('fireball', '/assets/battlefield/fx/fireball.png', { frameWidth: 16, frameHeight: 16 });
    if (!this.textures.exists('explosion'))
      this.load.spritesheet('explosion', '/assets/battlefield/fx/explosion.png', { frameWidth: 32, frameHeight: 32 });
    const loaderBar = document.getElementById('bf-loader-bar');
    const loader    = document.getElementById('bf-loader');
    this.load.on('progress', v => { if (loaderBar) loaderBar.style.width = Math.round(v * 100) + '%'; });
    this.load.on('complete', () => {
      if (loader) loader.style.display = 'none';
      const pixelArtKeys = [
        ...BOSS_TYPES.filter(b => b.pixelArt !== false).flatMap(b =>
          b.animFiles ? Object.keys(b.animFiles).map(anim => `${b.key}-${anim}`) : [b.key]
        ),
        'fireball', 'explosion',
      ];
      for (const key of pixelArtKeys) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      // Fighter atlas: NEAREST filter + register all animations from named frames
      this.textures.get('fighters')?.setFilter(Phaser.Textures.FilterMode.NEAREST);
      for (const ft of FIGHTER_TYPES) {
        for (const [state, anim] of Object.entries(ft.animations)) {
          const animKey = `${ft.key}-${state}`;
          if (!this.anims.exists(animKey)) {
            this.anims.create({
              key: animKey,
              frames: this.anims.generateFrameNames('fighters', {
                prefix: `${ft.key}-${state}-`,
                start: 0,
                end: anim.frames - 1,
              }),
              frameRate: anim.rate,
              repeat: (state === 'idle' || state === 'walk') ? -1 : 0,
            });
          }
        }
        for (let i = 0; i < (ft.attacks?.length ?? 0); i++) {
          const atk = ft.attacks[i];
          const atkKey = `${ft.key}-attack${i + 1}`;
          const effKey = `${ft.key}-effect${i + 1}`;
          if (!this.anims.exists(atkKey)) {
            this.anims.create({
              key: atkKey,
              frames: this.anims.generateFrameNames('fighters', {
                prefix: `${ft.key}-attack${i + 1}-`,
                start: 0,
                end: atk.frames - 1,
              }),
              frameRate: atk.rate,
              repeat: 0,
            });
          }
          if (atk.effectFrames && !this.anims.exists(effKey)) {
            this.anims.create({
              key: effKey,
              frames: this.anims.generateFrameNames('fighters', {
                prefix: `${ft.key}-effect${i + 1}-`,
                start: 0,
                end: atk.effectFrames - 1,
              }),
              frameRate: atk.rate,
              repeat: 0,
            });
          }
        }
      }
    });
  }

  bossTypeFor(number) {
    return BOSS_TYPES[number % BOSS_TYPES.length];
  }

  bossTextureFor(number) {
    return this.bossTypeFor(number).key;
  }

  ensureBossIdleAnim(textureKey) {
    const bossType = BOSS_TYPES.find(b => b.key === textureKey);
    const idleKey = `${textureKey}-idle`;

    if (bossType?.animFiles) {
      for (const [anim, info] of Object.entries(bossType.animFiles)) {
        const animKey = `${textureKey}-${anim}`;
        const texKey  = `${textureKey}-${anim}`;
        if (!this.anims.exists(animKey)) {
          this.anims.create({
            key: animKey,
            frames: this.anims.generateFrameNumbers(texKey, { start: 0, end: info.count - 1 }),
            frameRate: info.rate ?? 8,
            repeat: (anim === 'idle' || anim === 'move') ? -1 : 0,
            yoyo: info.yoyo ?? false,
          });
        }
      }
      return idleKey;
    }

    if (!this.anims.exists(idleKey)) {
      this.anims.create({
        key: idleKey,
        frames: this.anims.generateFrameNumbers(textureKey, { start: bossType?.idleStart ?? 0, end: bossType?.idleEnd ?? 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (bossType?.spawnStart != null && !this.anims.exists(`${textureKey}-spawn`)) {
      this.anims.create({
        key: `${textureKey}-spawn`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: bossType.spawnStart, end: bossType.spawnEnd }),
        frameRate: bossType.spawnFrameRate ?? 8,
        repeat: 0,
      });
    }
    if (bossType?.attackStart != null && !this.anims.exists(`${textureKey}-attack`)) {
      this.anims.create({
        key: `${textureKey}-attack`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: bossType.attackStart, end: bossType.attackEnd }),
        frameRate: bossType.attackFrameRate ?? 8,
        repeat: 0,
      });
    }
    if (bossType?.moveStart != null && !this.anims.exists(`${textureKey}-move`)) {
      this.anims.create({
        key: `${textureKey}-move`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: bossType.moveStart, end: bossType.moveEnd }),
        frameRate: bossType.moveFrameRate ?? 8,
        yoyo: bossType.moveYoyo ?? false,
        repeat: -1,
      });
    }
    if (bossType?.deathStart != null && !this.anims.exists(`${textureKey}-death`)) {
      this.anims.create({
        key: `${textureKey}-death`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: bossType.deathStart, end: bossType.deathEnd }),
        frameRate: bossType.deathFrameRate ?? 8,
        repeat: 0,
      });
    }
    if (bossType?.hurtStart != null && !this.anims.exists(`${textureKey}-hurt`)) {
      this.anims.create({
        key: `${textureKey}-hurt`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: bossType.hurtStart, end: bossType.hurtEnd }),
        frameRate: bossType.hurtFrameRate ?? 10,
        repeat: 0,
      });
    }
    return idleKey;
  }

  playBossReact() {
    if (!this.bossSprite?.active) return;
    const key = this.bossSprite.getData('bossTypeKey') ?? this.bossSprite.texture?.key;
    const hurtKey  = `${key}-hurt`;
    const attackKey = `${key}-attack`;
    const hasHurt = this.anims.exists(hurtKey);
    const reactKey = hasHurt ? hurtKey : attackKey;
    if (!this.anims.exists(reactKey)) return;
    const now = this.time.now;
    const cooldown = hasHurt ? 2000 : 8000;
    if ((now - (this.bossLastAttackAt ?? 0)) < cooldown) return;
    if (this.bossSprite.anims.currentAnim?.key === reactKey) return;
    this.bossLastAttackAt = now;
    this.bossSprite.play(reactKey);
    this.bossSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!this.bossSprite?.active) return;
      const resumeKey = (this.bossPatrolPhase === 'move' && this.anims.exists(`${key}-move`))
        ? `${key}-move`
        : `${key}-idle`;
      this.bossSprite.play(resumeKey);
    });
  }

  startBossPatrol() {
    const range = 120;
    const sprite = this.bossSprite;
    const anchorX = this.layout.boss.anchor.x;
    const anchorY = this.layout.boss.anchor.y;
    const bossTypeKey = sprite.getData('bossTypeKey') ?? sprite.texture?.key;
    const bossType = BOSS_TYPES.find(b => b.key === bossTypeKey);
    const moveKey = `${bossTypeKey}-move`;
    const idleKey = `${bossTypeKey}-idle`;
    const attackKey = `${bossTypeKey}-attack`;
    let goingRight = true;

    const startIdleBreath = (breathCount, onDone) => {
      if (!sprite?.active) return;
      sprite.play(idleKey);
      let count = 0;
      const onRepeat = () => {
        if (sprite.anims.currentAnim?.key !== idleKey) return;
        count++;
        if (count >= breathCount) {
          sprite.off(Phaser.Animations.Events.ANIMATION_REPEAT, onRepeat);
          this.bossIdleRepeatListener = null;
          onDone();
        }
      };
      this.bossIdleRepeatListener = onRepeat;
      sprite.on(Phaser.Animations.Events.ANIMATION_REPEAT, onRepeat);
    };

    const idleAtEndpoint = (onDone) => {
      this.bossPatrolPhase = 'idle';
      const canAttack = this.anims.exists(attackKey)
        && !sprite.anims.currentAnim?.key.includes('-attack')
        && Math.random() < 0.25;
      if (canAttack) {
        startIdleBreath(2, () => {
          if (!sprite?.active || this.bossPatrolPhase !== 'idle') return;
          sprite.play(attackKey);
          sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            if (!sprite?.active || this.bossPatrolPhase !== 'idle') return;
            this._bossSwipeHit(sprite.x, bossType);
            onDone();
          });
        });
      } else {
        startIdleBreath(2, onDone);
      }
    };

    const doStep = () => {
      if (!sprite?.active) return;
      if (this.bossIdleRepeatListener) {
        sprite.off(Phaser.Animations.Events.ANIMATION_REPEAT, this.bossIdleRepeatListener);
        this.bossIdleRepeatListener = null;
      }
      const targetX = goingRight ? anchorX + range / 2 : anchorX - range / 2;
      sprite.setFlipX(goingRight);
      if (this.anims.exists(moveKey)) sprite.play(moveKey);
      this.bossPatrolPhase = 'move';
      this.tweens.add({
        targets: sprite,
        x: targetX,
        duration: 1800,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          if (!sprite?.active) return;
          goingRight = !goingRight;
          idleAtEndpoint(doStep);
        },
      });
    };

    sprite.x = anchorX - range / 2;
    sprite.setFlipX(true);
    doStep();

    if (bossType?.float) {
      const { amplitude, duration } = bossType.float;
      sprite.y = anchorY;
      this.tweens.add({
        targets: sprite,
        y: anchorY - amplitude,
        duration,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }
  }

  // Checks fighters near bossX and applies stun visual to those in melee range.
  _bossSwipeHit(bossX, bossType) {
    const bossHalfW = bossType
      ? ((bossType.animFiles ? bossType.animFiles.idle.frameWidth : (bossType.frameWidth ?? 32))
          * (bossType.scale ?? 1)) / 2
      : 64;
    const hitRange = bossHalfW + 20;

    for (const entry of this.fighters.values()) {
      if (!entry.sprite?.active) continue;
      if (Math.abs(entry.sprite.x - bossX) <= hitRange) {
        this._applyStunEffect(entry);
      }
    }
  }

  _applyStunEffect(entry) {
    if (!entry.sprite?.active) return;
    // Per-fighter cooldown — skip if stunned in the last 3 s
    const now = this.time.now;
    if (entry.lastStunAt && now - entry.lastStunAt < 3000) return;
    entry.lastStunAt = now;

    // Red tint flash on body sprite (Container doesn't support setTint)
    if (entry.body?.active) entry.body.setTint(0xff2222);
    this.time.delayedCall(500, () => {
      if (entry.body?.active) entry.body.clearTint();
    });

    // Brief camera shake on hit
    this.cameras.main.shake(180, 0.004);

    // Elliptical orbit stars around the character's actual head (not avatar bubble).
    // Flat ellipse (rx >> ry) looks like a parabolic halo from the side.
    // Depth-sorted each tick: arc over the top = in front, arc under = behind.
    const bScale  = (entry.displaySize ?? 45) / 18;
    const headOffY = -Math.round(12 * bScale);
    const rx      = Math.round(bScale * 10);
    const ry      = Math.round(bScale * 3.5);
    const N       = 6;
    const period  = 2800;
    const total   = 3000;

    const stunStars = [];
    for (let i = 0; i < N; i++) {
      const phase = (i / N) * Math.PI * 2;
      const s = this.add.text(0, 0, '★', {
        fontFamily: 'Arial, sans-serif', fontSize: '11px',
        color: '#fbbf24', stroke: '#78350f', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(112);
      stunStars.push({ text: s, phase });
    }

    const startAt = this.time.now;
    const ticker = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const elapsed = this.time.now - startAt;
        const baseAngle = (elapsed / period) * Math.PI * 2;
        const fadeStart = total * 0.75;
        const alpha     = elapsed > fadeStart ? 1 - (elapsed - fadeStart) / (total - fadeStart) : 1;

        // Follow fighter live position
        const cs  = entry.sprite?.scaleX ?? 1;
        const cx  = entry.sprite?.x ?? 0;
        const cy  = (entry.sprite?.y ?? 0) + headOffY * cs;

        for (const star of stunStars) {
          const a    = baseAngle + star.phase;
          const sinA = Math.sin(a);
          star.text.setPosition(cx + Math.cos(a) * rx, cy + sinA * ry);
          star.text.setDepth(sinA < 0 ? 112 : 1);
          star.text.setScale(sinA < 0 ? 1 : 0.65);
          star.text.setAlpha(alpha);
        }

        if (elapsed >= total) {
          ticker.remove();
          stunStars.forEach(s => s.text.destroy());
        }
      },
    });
  }

  create() {
    this.isShuttingDown = false;
    this.mode = this.game.registry.get('mode') ?? 'landscape';
    this.layout = LAYOUTS[this.mode];
    const L = this.layout;

    this.add.rectangle(L.logicalWidth / 2, L.logicalHeight / 2, L.logicalWidth, L.logicalHeight, BG_COLOR);

    this.makeSparkTexture();
    this.add.image(L.logicalWidth / 2, L.logicalHeight / 2, this.makeVignetteTexture());

    const state = this.game.registry.get('initialState');
    this.bossState = { ...state.boss };

    const initialType = this.bossTypeFor(state.boss.number);
    const initialKey = initialType.key;
    const initialTexKey = initialType.animFiles ? `${initialKey}-idle` : initialKey;
    const initialAnim = this.ensureBossIdleAnim(initialKey);
    this.bossSprite = this.add
      .sprite(L.boss.anchor.x, L.boss.anchor.y, initialTexKey)
      .setScale(initialType.scale)
      .setDepth(5)
      .setData('bossTypeKey', initialKey)
      .play(initialAnim);
    if (initialType.pixelate) {
      this.bossSprite.preFX?.addPixelate(initialType.pixelate);
    }
    this.startBossPatrol();

    this.bossNameText = this.addSharpText(L.boss.name.x, L.boss.name.y, this.bossLabel(state.boss), {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#0f172a',
      strokeThickness: 8,
    }).setDepth(5);

    this.hpBarBg = this.add
      .rectangle(L.hpBar.x, L.hpBar.y, L.hpBar.width, L.hpBar.height, 0x334155)
      .setOrigin(0.5);

    this.hpBarFill = this.add
      .rectangle(
        L.hpBar.x - L.hpBar.width / 2,
        L.hpBar.y,
        Math.round(L.hpBar.width * (state.boss.currentHp / state.boss.maxHp)),
        L.hpBar.height,
        this.hpBarColor(state.boss.currentHp, state.boss.maxHp)
      )
      .setOrigin(0, 0.5);

    this.hpBarBorder = this.add
      .rectangle(L.hpBar.x, L.hpBar.y, L.hpBar.width, L.hpBar.height)
      .setOrigin(0.5)
      .setFillStyle()
      .setStrokeStyle(1, 0x94a3b8, 1);

    this.hpText = this.addSharpText(L.hpBar.x, L.hpBar.y + 24, `${formatHp(state.boss.currentHp)} / ${formatHp(state.boss.maxHp)}`, {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#0f172a',
      strokeThickness: 6,
    }, 3);

    this.fighters = new Map();
    this.damageTotals = new Map();
    this.currentUserId = state.currentUserId ?? null;
    const config = fighterDisplayConfig(state.fighters.length, this.mode);
    const autoPositions = computeFighterPositions(
      state.fighters.length,
      L.fighters.rowXRange,
      config.topY,
      config.perRow,
      config.rowSpacing,
    );
    state.fighters.forEach((f, i) => {
      const pos = f.position
        ? { x: f.position.x * this.layout.logicalWidth, y: f.position.y * this.layout.logicalHeight }
        : autoPositions[i];
      this.addFighter(f, pos, config);
    });

    // Restore damage-based fighter sizes captured by snapshotState on reboot
    for (const [userId, damage] of state.damageTotals ?? []) {
      this.damageTotals.set(userId, damage);
      this.rescaleFighterByDamage(userId);
    }

    this.leaderboard = createLeaderboard(this);
    this.leaderboard.seed(state.leaderboard ?? []);

    this.charges = new Map();
    // Synthesizes the live `fighter-charging` payload shape — keep in sync with FighterCharging::broadcastWith().
    for (const f of state.fighters) {
      if (f.charging) {
        this.handleCharging({
          user_id: f.id,
          activity: f.charging.activity,
        });
      }
    }
    this._busHandlers = {
      'hit': payload => this.handleHit(payload),
      'boss-spawned': payload => this.handleBossSpawned(payload),
      'boss-killed': payload => this.handleBossKilled(payload),
      'fighter-charging': payload => this.handleCharging(payload),
      'fighter-idled': payload => this.handleIdled(payload),
      'fighter-joined': payload => this.handleFighterJoined(payload),
      'fighter-moved': payload => this.handleFighterMoved(payload),
    };

    this._setupMoveInput();
    for (const [evt, fn] of Object.entries(this._busHandlers)) {
      bus.on(evt, fn);
    }
    this.events.once('shutdown', () => {
      this.isShuttingDown = true;
      for (const [evt, fn] of Object.entries(this._busHandlers)) {
        bus.off(evt, fn);
      }
      this.leaderboard?.destroy?.();
    });

    this.events.emit('ready');
    this.game.events.emit('ready');
  }

  bossLabel(boss) {
    const name = boss?.name;
    if (typeof name === 'string' && name.length > 0) {
      return name.toUpperCase();
    }
    return `BOSS #${boss?.number ?? '?'}`;
  }

  addSharpText(x, y, content, style, resolution = 2) {
    const text = this.add.text(x, y, content, style).setOrigin(0.5).setResolution(resolution);
    text.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    const originalSetText = text.setText.bind(text);
    text.setText = (...args) => {
      const result = originalSetText(...args);
      text.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      return result;
    };
    return text;
  }

  hpBarColor(current, max) {
    const pct = current / max;
    if (pct > 0.5) return 0x22c55e;
    if (pct > 0.25) return 0xf59e0b;
    return 0xef4444;
  }

  makeVignetteTexture() {
    const { logicalWidth: W, logicalHeight: H } = this.layout;
    const key = `bf-vignette-${this.mode}`;
    if (!this.textures.exists(key)) {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.18, W / 2, H / 2, H * 0.88);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.62)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      this.textures.addCanvas(key, canvas);
    }
    return key;
  }

  makeSparkTexture() {
    if (this.textures.exists('spark')) {
      return;
    }
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1);
    // Thin triangle — tip at right (24,3), base at left
    g.fillTriangle(24, 3, 0, 0, 0, 6);
    g.generateTexture('spark', 24, 6);
    g.destroy();
  }

  handleHit(payload) {
    if (!payload || payload.user_id == null) {
      return;
    }
    this.clearCharge(payload.user_id);
    const fighter = this.fighters.get(payload.user_id);
    const key     = fighter?.ftype?.key ?? null;
    const attacks = fighter?.ftype?.attacks ?? null;
    const pickIdx = attacks?.length ? Phaser.Math.Between(0, attacks.length - 1) : -1;
    const flipTowardBoss = fighter ? fighter.pos.x > this.layout.boss.anchor.x : false;
    if (fighter?.body) {
      const atkAnimKey = pickIdx >= 0 ? `${key}-attack${pickIdx + 1}` : `${key}-attack`;
      fighter.animState = 'attack';
      fighter.body.off(Phaser.Animations.Events.ANIMATION_COMPLETE);
      fighter.body.setFlipX(flipTowardBoss);
      fighter.body.play(atkAnimKey);

      fighter.body.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (!fighter.body?.scene) return;
        const next = this.charges.has(fighter.id) ? 'walk' : 'idle';
        fighter.animState = next;
        fighter.body.setFlipX(next === 'walk' ? flipTowardBoss : false);
        fighter.body.play(`${key}-${next}`);
      });
    }
    const isKillShot = (payload.boss_hp_after ?? 1) <= 0;
    if (payload.damage > 0 && fighter) {
      const prev = this.damageTotals.get(payload.user_id) ?? 0;
      this.damageTotals.set(payload.user_id, prev + payload.damage);
      // Update the canonical rest scale now so the attack animation about to
      // run settles onto it; the visual grow tween itself stays delayed.
      fighter.damageScale = damageScaleMultiplier(prev + payload.damage, this.bossState?.maxHp);
      this.time.delayedCall(isKillShot ? 720 : 120, () => {
        this.rescaleFighterByDamage(payload.user_id);
      });
    }
    const onImpact = () => {
      this.leaderboard?.onHit(payload.user_id, payload.damage, payload.slack_handle);
      applyImpact(this, payload.boss_hp_after);
      if (this.hoveredUserId === payload.user_id) {
        this.showFighterTooltip(payload.user_id);
      }
      if (!isKillShot) this.time.delayedCall(90, () => this.playBossReact());
    };
    if (fighter) {
      const attackType = fighter.ftype?.attackType ?? 'blast';
      const handler = ATTACK_HANDLERS[attackType] ?? ATTACK_HANDLERS.blast;
      const effKey = (pickIdx >= 0 && attacks?.[pickIdx]?.effectFrames) ? `${key}-effect${pickIdx + 1}` : null;
      const onEffect = effKey ? (x, y) => {
        if (!fighter.body?.scene) return;
        const eff = this.add.sprite(x, y, 'fighters', `${effKey}-0`)
          .setScale(fighter.sprite.scaleX * fighter.body.scaleX)
          .setFlipX(flipTowardBoss)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDepth(3)
          .play(effKey);
        eff.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => eff.destroy());
      } : null;
      handler(this, fighter, {
        isKillShot,
        damage: payload.damage,
        maxHp: this.bossState?.maxHp ?? 1,
        onImpact,
        onEffect,
      });
    } else {
      this.time.delayedCall(TIMINGS.projectileArcMs, onImpact);
    }
  }

  rescaleFighterByDamage(userId) {
    const fighter = this.fighters.get(userId);
    if (!fighter) return;
    fighter.damageScale = damageScaleMultiplier(this.damageTotals.get(userId) ?? 0, this.bossState?.maxHp);
    this.tweenToRestScale(fighter);
  }

  fighterRestScale(fighter) {
    return (fighter.displaySize / fighter.baseSize) * (fighter.damageScale ?? 1);
  }

  /**
   * Tween the fighter toward its canonical rest scale without killing other
   * tweens. If an attack animation currently owns the sprite's scale, skip —
   * the attack's own return tween reads fighterRestScale() and settles there.
   */
  tweenToRestScale(fighter, { duration = 600, ease = 'Back.easeOut' } = {}) {
    fighter.rescaleTween?.remove();
    fighter.rescaleTween = null;
    const attackOwnsScale = this.tweens.getTweensOf(fighter.sprite)
      .some(tw => tw.data?.some(d => d.key === 'scaleX' || d.key === 'scaleY'));
    if (attackOwnsScale) {
      return;
    }
    const target = this.fighterRestScale(fighter);
    fighter.rescaleTween = this.tweens.add({
      targets: fighter.sprite,
      scaleX: target,
      scaleY: target,
      duration,
      ease,
      onComplete: () => { fighter.rescaleTween = null; },
    });
  }

  handleBossSpawned(payload) {
    if (!payload || payload.boss_number == null || payload.max_hp == null) {
      return;
    }
    this.bossLastAttackAt = 0;
    this.bossPatrolTween = null;
    this.bossPatrolPhase = 'move';
    this.bossIdleRepeatListener = null;
    this.clearAllCharges();
    const L = this.layout;
    const oldSprite = this.bossSprite;
    this.tweens.killTweensOf(oldSprite);
    this.tweens.add({
      targets: oldSprite,
      alpha: 0,
      duration: 200,
      onComplete: () => oldSprite.destroy(),
    });

    const bossType = this.bossTypeFor(payload.boss_number);
    const typeKey   = bossType.key;
    const texKey    = bossType.animFiles ? `${typeKey}-idle` : typeKey;
    const idleKey   = this.ensureBossIdleAnim(typeKey);
    const spawnKey  = `${typeKey}-spawn`;

    if (this.anims.exists(spawnKey)) {
      // Shadow: rise from ground in place — no drop tween
      this.bossSprite = this.add
        .sprite(L.boss.anchor.x, L.boss.anchor.y, texKey)
        .setScale(bossType.scale)
        .setDepth(5)
        .setData('bossTypeKey', typeKey)
        .play(spawnKey);
      if (bossType.pixelate) {
        this.bossSprite.preFX?.addPixelate(bossType.pixelate);
      }
      this.bossSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (this.bossSprite?.active) {
          this.bossSprite.play(idleKey);
          this.startBossPatrol();
        }
      });
    } else {
      // Other bosses: drop from above with bounce
      this.bossSprite = this.add
        .sprite(L.boss.anchor.x, -40, texKey)
        .setScale(bossType.scale)
        .setDepth(5)
        .setData('bossTypeKey', typeKey)
        .play(idleKey);
      if (bossType.pixelate) {
        this.bossSprite.preFX?.addPixelate(bossType.pixelate);
      }
      this.tweens.add({
        targets: this.bossSprite,
        y: L.boss.anchor.y,
        duration: TIMINGS.bossSpawnMs,
        ease: 'Bounce.easeOut',
        onComplete: () => this.startBossPatrol(),
      });
    }

    this.bossState = {
      currentHp: payload.max_hp,
      maxHp: payload.max_hp,
      number: payload.boss_number,
      name: payload.boss_name,
    };
    this.bossNameText.setText(this.bossLabel(this.bossState));
    this.hpBarFill.width = L.hpBar.width;
    this.hpBarFill.setFillStyle(0x22c55e);
    this.hpText.setText(`${formatHp(payload.max_hp)} / ${formatHp(payload.max_hp)}`);
    this.leaderboard?.reset();
    // Reset damage totals and fighter sizes for new boss
    this.damageTotals.clear();
    for (const [, f] of this.fighters.entries()) {
      f.damageScale = 1;
      this.tweenToRestScale(f, { duration: 400, ease: 'Quad.easeOut' });
    }
  }

  handleBossKilled(payload = {}) {
    this.clearAllCharges();
    if (this.bossSprite) {
      this.tweens.killTweensOf(this.bossSprite);
      const bossType = this.bossTypeFor(this.bossState?.number ?? 0);
      const deathKey = `${bossType.key}-death`;
      if (this.anims.exists(deathKey)) {
        const dyingSprite = this.bossSprite;
        dyingSprite.play(deathKey);
        dyingSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          if (!dyingSprite?.active) return;
          this.tweens.add({
            targets: dyingSprite,
            alpha: 0,
            duration: 300,
            ease: 'Quad.easeIn',
          });
        });
      } else {
        this.tweens.add({
          targets: this.bossSprite,
          scale: 0,
          alpha: 0,
          angle: 360,
          duration: TIMINGS.bossKilledMs,
          ease: 'Quad.easeIn',
        });
      }
      this.cameras.main.flash(400, 255, 255, 255);
    }
    if (this.leaderboard) {
      showMvpCard(this, {
        bossLabel: this.bossLabel({
          name: payload.boss_name ?? this.bossState.name,
          number: payload.boss_number ?? this.bossState.number,
        }),
        ranked: this.leaderboard.getRanked(),
        killerHandle: payload.killer_slack_handle ?? null,
      });
    }
  }

  handleCharging(payload) {
    if (!payload || payload.user_id == null) {
      return;
    }
    if (!this.fighters.has(payload.user_id)) {
      this.handleFighterJoined({
        user_id: payload.user_id,
        slack_handle: payload.slack_handle,
        avatar_url: payload.avatar_url,
        character: payload.character ?? null,
      });
    }
    const fighter = this.fighters.get(payload.user_id);
    if (!fighter) {
      return;
    }
    const existing = this.charges.get(payload.user_id);
    if (existing) {
      existing.activity = payload.activity ?? '';
      if (this.fightersAllowBubbles()) {
        this.updateActivityBubble(existing, fighter, payload.activity);
      }
      return;
    }
    if (fighter.body && fighter.animState !== 'attack') {
      fighter.animState = 'walk';
      fighter.body.setFlipX(fighter.pos.x > this.layout.boss.anchor.x);
      fighter.body.play(fighter.ftype.key + '-walk');
    }
    const localFootY = Math.round(fighter.displaySize / 3);
    const { fireEmitter, fireEmbers } = this.spawnChargeFireEmitters(fighter.ftype, 0, localFootY, fighter.displaySize);
    fighter.sprite.addAt(fireEmbers, 0);
    fighter.sprite.addAt(fireEmitter, 0);
    const ring  = this.createChargingRing(fighter);
    const trail = this.createChargingTrail(fighter);
    fighter.sprite.addAt(ring, 0);
    const avSize = fighter.avatarSize ?? avatarPx(fighter.displaySize);
    const breath = fighter.head ? this.tweens.add({
      targets: fighter.head,
      displayWidth: avSize * 1.06,
      displayHeight: avSize * 1.06,
      duration: TIMINGS.chargeRingPulseMs / 2,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    }) : null;
    const entry = { ring, trail, fireEmitter, fireEmbers, breath, bubble: null, activity: payload.activity ?? '' };
    if (this.fightersAllowBubbles()) {
      this.updateActivityBubble(entry, fighter, payload.activity);
    }
    this.charges.set(payload.user_id, entry);
  }

  createChargingRing(fighter) {
    const avatarRelY = fighter.head?.y ?? 0;
    const avR = (fighter.avatarSize ?? avatarPx(fighter.displaySize)) / 2;
    const r   = Math.round(avR + Math.max(4, fighter.displaySize * 0.08));
    const g = this.add.graphics();
    g.lineStyle(2, 0x22d3ee, 1);
    g.strokeCircle(0, 0, r);
    g.setPosition(0, avatarRelY);
    this.tweens.add({
      targets: g,
      alpha: { from: 0.9, to: 0.15 },
      scaleX: { from: 1.0, to: 1.18 },
      scaleY: { from: 1.0, to: 1.18 },
      duration: TIMINGS.chargeRingPulseMs,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    return g;
  }

  createChargingTrail(fighter) {
    // Particles drift opposite to boss direction — visual speed trail while walking in place
    const charBot    = Math.round(fighter.displaySize / 3);  // char bottom from container center
    const towardBoss = fighter.pos.x <= this.layout.boss.anchor.x ? 1 : -1;
    const emitX      = fighter.pos.x - towardBoss * Math.round(fighter.displaySize * 0.18);
    const emitY      = fighter.pos.y + charBot - Math.round(fighter.displaySize * 0.12);
    const emitter    = this.add.particles(emitX, emitY, 'spark', {
      tint:      { onEmit: () => Phaser.Math.RND.pick([0x4ade80, 0x86efac, 0xa3e635, 0xffffff]) },
      scale:     { start: 0.5, end: 0 },
      alpha:     { start: 0.65, end: 0 },
      speedX:    { min: -towardBoss * 80, max: -towardBoss * 20 },
      speedY:    { min: -10, max: 22 },
      lifespan:  { min: 130, max: 230 },
      frequency: 45,
      quantity:  2,
      blendMode: Phaser.BlendModes.ADD,
    });
    emitter.setDepth(1);
    return emitter;
  }

  spawnChargeFireEmitters(ftype, localX, localFootY, displaySize) {
    const fireColors = chargeParticleColors(ftype);
    const ps = displaySize * 0.018;
    const fireEmitter = this.add.particles(localX, localFootY, 'spark', {
      tint:      { onEmit: () => Phaser.Math.RND.pick(fireColors) },
      rotate:    { min: 0, max: 360 },
      scale:     { start: ps, end: 0 },
      alpha:     { start: 0.55, end: 0 },
      speedX:    { min: -180, max: 180 },
      speedY:    { min: -90, max: 20 },
      lifespan:  { min: 280, max: 480 },
      frequency: 22,
      quantity:  3,
      gravityY:  80,
      blendMode: Phaser.BlendModes.ADD,
    });
    const fireEmbers = this.add.particles(localX, localFootY, 'spark', {
      tint:      { onEmit: () => Phaser.Math.RND.pick(fireColors) },
      rotate:    { min: 0, max: 360 },
      scale:     { start: ps * 0.5, end: 0 },
      alpha:     { start: 0.4, end: 0 },
      speedX:    { min: -240, max: 240 },
      speedY:    { min: -60, max: 30 },
      lifespan:  { min: 200, max: 400 },
      frequency: 28,
      quantity:  2,
      gravityY:  60,
      blendMode: Phaser.BlendModes.ADD,
    });
    return { fireEmitter, fireEmbers };
  }

  fightersAllowBubbles() {
    return fighterDisplayConfig(this.fighters.size, this.mode).showHandle;
  }

  activityBubbleY(fighter) {
    const avatarRelY  = fighter.head?.y ?? 0;
    const avatarRadius = (fighter.head?.displayHeight ?? 28) / 2;
    return (fighter.sprite?.y ?? fighter.pos.y) + avatarRelY - avatarRadius - 28;
  }

  updateActivityBubble(entry, fighter, activity) {
    if (!activity) {
      if (entry.bubble) {
        entry.bubble.destroy();
        entry.bubble = null;
      }
      return;
    }
    if (entry.bubble) {
      entry.bubble.setActivity(activity);
    } else {
      const bubbleY  = this.activityBubbleY(fighter);
      const fontPx   = Math.max(9, Math.round(fighter.displaySize * 0.22));
      const maxChars = Math.max(12, Math.round(fighter.displaySize * 0.35));
      entry.bubble = this.createActivityBubble(fighter.sprite?.x ?? fighter.pos.x, bubbleY, activity, fontPx, maxChars);
    }
    // The hover tooltip takes priority over the activity bubble.
    if (this.hoveredUserId === fighter.id) {
      entry.bubble.setVisible(false);
    }
  }

  createActivityBubble(x, y, activity, fontPx = 14, maxChars = ACTIVITY_MAX_CHARS) {
    const text = this.addSharpText(x, y, truncateActivity(activity, maxChars), {
      fontFamily: 'monospace',
      fontSize: `${fontPx}px`,
      color: '#f1f5f9',
      padding: { left: 8, right: 8, top: 4, bottom: 4 },
    });
    const bg = this.add
      .rectangle(x, y, text.width + 8, text.height + 4, 0x1e293b, 0.92)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0x64748b, 0.9);
    bg.setDepth(100);
    text.setDepth(101);
    return {
      destroy: () => {
        text.destroy();
        bg.destroy();
      },
      setActivity: newActivity => {
        text.setText(truncateActivity(newActivity));
        bg.setSize(text.width + 8, text.height + 4);
      },
      moveTo: (newX, newY) => {
        text.x = newX;
        text.y = newY;
        bg.x = newX;
        bg.y = newY;
      },
      tweenTo: (scene, newX, newY, duration) => {
        scene.tweens.killTweensOf(text);
        scene.tweens.killTweensOf(bg);
        scene.tweens.add({ targets: [text, bg], x: newX, y: newY, duration, ease: 'Linear' });
      },
      setVisible: visible => {
        text.setVisible(visible);
        bg.setVisible(visible);
      },
    };
  }

  showFighterTooltip(userId) {
    const fighter = this.fighters.get(userId);
    if (!fighter) {
      return;
    }
    const tokens = this.leaderboard?.damageFor(userId) ?? 0;
    const rank = this.leaderboard?.rankOf(userId) ?? null;
    const handle = fighter.handleText || `#${userId}`;
    const rankPrefix = rank ? `#${rank} ` : '';
    const content = `${rankPrefix}${handle} · ${tokens.toLocaleString()} tokens`;
    const fontPx = Math.max(9, Math.round(fighter.displaySize * 0.22));

    if (!this.tooltip) {
      this.tooltip = this.createFighterTooltip(content, fontPx);
    } else {
      this.tooltip.setContent(content, fontPx);
    }

    const margin = 4;
    const halfW = this.tooltip.width() / 2;
    const halfH = this.tooltip.height() / 2;
    const x = Phaser.Math.Clamp(
      fighter.pos.x,
      halfW + margin,
      this.layout.logicalWidth - halfW - margin,
    );
    // Anchor to the same spot as the activity bubble so the tooltip lines up
    // with (and cleanly replaces) the bubble it covers.
    const aboveY = this.activityBubbleY(fighter);
    const avatarCenterY = fighter.pos.y + (fighter.head?.y ?? 0);
    const avatarRadius = (fighter.head?.displayHeight ?? fighter.avatarSize ?? fighter.displaySize) / 2;
    // Flip below the avatar when the tooltip would clip past the top edge.
    const y = aboveY - halfH < margin
      ? avatarCenterY + avatarRadius + halfH + 6
      : aboveY;

    this.tooltip.moveTo(x, y);
    this.tooltip.setVisible(true);
    this.hoveredUserId = userId;

    // Hide the "thinking" activity bubble so it doesn't collide with the tooltip.
    const charge = this.charges.get(userId);
    if (charge?.bubble) {
      charge.bubble.setVisible(false);
    }
  }

  hideFighterTooltip(userId) {
    if (userId != null && this.hoveredUserId !== userId) {
      return;
    }
    const previous = this.hoveredUserId;
    this.hoveredUserId = null;
    if (this.tooltip) {
      this.tooltip.setVisible(false);
    }
    // Restore the activity bubble the tooltip was covering, if still charging.
    if (previous != null) {
      const charge = this.charges.get(previous);
      if (charge?.bubble) {
        charge.bubble.setVisible(true);
      }
    }
  }

  createFighterTooltip(content, fontPx = 14) {
    // Mirror the activity bubble's geometry (font scale, padding, box sizing) so
    // the tooltip lines up exactly with the bubble it temporarily replaces.
    const text = this.addSharpText(0, 0, content, {
      fontFamily: 'monospace',
      fontSize: `${fontPx}px`,
      color: '#fde68a',
      padding: { left: 8, right: 8, top: 4, bottom: 4 },
    });
    const bg = this.add
      .rectangle(0, 0, text.width + 8, text.height + 4, 0x1e293b, 0.96)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0xfbbf24, 0.9);
    bg.setDepth(300);
    text.setDepth(301);
    const tooltip = {
      setContent: (newContent, newFontPx = fontPx) => {
        text.setFontSize(newFontPx);
        text.setText(newContent);
        bg.setSize(text.width + 8, text.height + 4);
      },
      moveTo: (x, y) => {
        text.x = x;
        text.y = y;
        bg.x = x;
        bg.y = y;
      },
      setVisible: visible => {
        text.setVisible(visible);
        bg.setVisible(visible);
      },
      width: () => bg.width,
      height: () => bg.height,
    };
    tooltip.setVisible(false);
    return tooltip;
  }

  handleIdled(payload) {
    if (!payload || payload.user_id == null) {
      return;
    }
    const userId = payload.user_id;
    this.clearCharge(userId);
    this.removeFighter(userId);
  }

  removeFighter(userId) {
    const entry = this.fighters.get(userId);
    if (!entry) {
      return;
    }
    this.fighters.delete(userId);
    this.tweens.add({
      targets: entry.sprite,
      alpha: 0,
      duration: 300,
      onComplete: () => { if (entry.sprite?.scene) entry.sprite.destroy(); },
    });
    if (entry.handle?.scene) {
      this.tweens.add({
        targets: entry.handle,
        alpha: 0,
        duration: 300,
        onComplete: () => { if (entry.handle?.scene) entry.handle.destroy(); },
      });
    }
    this.relayoutFighters();
  }

  clearCharge(userId) {
    const entry = this.charges.get(userId);
    if (!entry) {
      return;
    }
    if (entry.breath) {
      entry.breath.stop();
      const fighter = this.fighters.get(userId);
      if (fighter?.head?.scene) {
        const av = fighter.avatarSize ?? avatarPx(fighter.displaySize);
        fighter.head.setDisplaySize(av, av);
      }
    }
    if (entry.ring?.scene) {
      this.tweens.killTweensOf(entry.ring);
      const ring = entry.ring;
      this.tweens.add({
        targets: ring,
        alpha: 0,
        duration: 200,
        onComplete: () => { if (ring.scene) ring.destroy(); },
      });
    }
    if (entry.trail?.scene) {
      entry.trail.stop();
      this.time.delayedCall(250, () => { if (entry.trail?.scene) entry.trail.destroy(); });
    }
    if (entry.fireEmitter?.scene) {
      entry.fireEmitter.stop();
      this.time.delayedCall(500, () => { if (entry.fireEmitter?.scene) entry.fireEmitter.destroy(); });
    }
    if (entry.fireEmbers?.scene) {
      entry.fireEmbers.stop();
      this.time.delayedCall(500, () => { if (entry.fireEmbers?.scene) entry.fireEmbers.destroy(); });
    }
    if (entry.bubble) {
      entry.bubble.destroy();
      entry.bubble = null;
    }
    this.charges.delete(userId);
    const fighter = this.fighters.get(userId);
    if (fighter?.body && fighter.animState !== 'attack') {
      fighter.animState = 'idle';
      fighter.body.setFlipX(false);
      fighter.body.play(fighter.ftype.key + '-idle');
    }
  }

  clearAllCharges() {
    for (const userId of [...this.charges.keys()]) {
      this.clearCharge(userId);
    }
  }

  relayoutFighters() {
    const count = this.fighters.size;
    if (count === 0) {
      return;
    }
    const config = fighterDisplayConfig(count, this.mode);
    const positions = computeFighterPositions(
      count,
      this.layout.fighters.rowXRange,
      config.topY,
      config.perRow,
      config.rowSpacing,
    );

    let i = 0;
    for (const [userId, entry] of this.fighters.entries()) {
      const target = positions[i++];
      const newSize = config.displaySize;
      const sizeChanged = newSize !== entry.displaySize;

      this.tweens.add({
        targets: entry.sprite,
        x: target.x,
        y: target.y,
        duration: 200,
        ease: 'Quad.easeOut',
      });

      if (sizeChanged) {
        entry.displaySize = newSize;
        entry.sprite.setScale(this.fighterRestScale(entry));
      }

      const scale   = entry.sprite.scaleX;
      const fontPx  = handleFontPx(newSize);
      const maxChrs = Math.max(8, Math.round(newSize * 0.22));
      const handleY = target.y + entry.legH * scale + fontPx;
      if (config.showHandle && !entry.handle) {
        entry.handle = this.addSharpText(target.x, handleY, truncateHandle(entry.handleText, maxChrs), {
          fontFamily: 'monospace',
          fontSize: `${fontPx}px`,
          color: '#fbbf24',
        });
      } else if (!config.showHandle && entry.handle) {
        entry.handle.destroy();
        entry.handle = null;
      } else if (entry.handle) {
        this.tweens.add({
          targets: entry.handle,
          x: target.x,
          y: handleY,
          duration: 200,
          ease: 'Quad.easeOut',
        });
      }

      entry.pos = target;

      const charge = this.charges.get(userId);
      if (charge) {
        // Ring is inside the container at (0,0) — rebuild if size changed
        if (sizeChanged && charge.ring?.scene) {
          this.tweens.killTweensOf(charge.ring);
          charge.ring.destroy();
          charge.ring = this.createChargingRing(entry);
          entry.sprite.addAt(charge.ring, 0);
        }
        // Trail is world-space — rebuild on size change, reposition otherwise
        if (sizeChanged && charge.trail?.scene) {
          charge.trail.stop();
          charge.trail.destroy();
          charge.trail = this.createChargingTrail(entry);
        } else if (charge.trail?.scene) {
          const tb = entry.pos.x <= this.layout.boss.anchor.x ? 1 : -1;
          const cb = Math.round(entry.displaySize / 3);
          charge.trail.setPosition(
            target.x - tb * Math.round(entry.displaySize * 0.18),
            target.y + cb - Math.round(entry.displaySize * 0.12),
          );
        }
        if (charge.bubble) {
          const avatarRelY   = entry.head?.y ?? 0;
          const avatarRadius = (entry.head?.displayHeight ?? 28) / 2;
          charge.bubble.moveTo(target.x, target.y + avatarRelY - avatarRadius - 16);
        }
      }
    }

    if (this.hoveredUserId != null) {
      this.showFighterTooltip(this.hoveredUserId);
    }
  }

  loadAvatarTexture(fighterId, avatarUrl) {
    const key = `fighter-${fighterId}`;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (this.isShuttingDown) {
          reject(new Error('scene destroyed before avatar load'));
          return;
        }
        if (this.textures.exists(key)) {
          this.textures.remove(key);
        }
        // Use native image size — no intermediate downscale step
        const size = img.naturalWidth || 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 0, 0, size, size);
        this.textures.addCanvas(key, canvas);
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
        resolve(key);
      };
      img.onerror = () => reject(new Error(`avatar load failed: ${avatarUrl}`));
      img.src = avatarUrl;
    });
  }

  makeFallbackAvatarTexture(fighter) {
    const key = `fighter-${fighter.id}-fallback`;
    if (this.textures.exists(key)) {
      return key;
    }
    const size = 128;
    const radius = size / 2;
    const palette = [0x6366f1, 0x10b981, 0xf59e0b, 0xec4899, 0x14b8a6, 0xf97316, 0x8b5cf6, 0x0ea5e9];
    const color = palette[Math.abs(Number(fighter.id) || 0) % palette.length];
    const initial = (fighter.handle ?? '').trim().charAt(0).toUpperCase() || '?';

    const rt = this.add.renderTexture(0, 0, size, size).setVisible(false);
    const circle = this.add.graphics({ x: 0, y: 0 }).setVisible(false);
    circle.fillStyle(color, 1);
    circle.fillCircle(radius, radius, radius);
    rt.draw(circle, 0, 0);
    const label = this.add.text(0, 0, initial, {
      fontFamily: 'monospace',
      fontSize: '72px',
      color: '#ffffff',
    }).setOrigin(0.5).setVisible(false);
    rt.draw(label, radius, radius);
    rt.saveTexture(key);
    circle.destroy();
    label.destroy();
    rt.destroy();
    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    return key;
  }

  handleFighterJoined(payload) {
    if (!payload || payload.user_id == null) {
      return;
    }
    if (this.fighters.has(payload.user_id)) {
      return;
    }
    const fighter = {
      id: payload.user_id,
      handle: payload.slack_handle,
      display_name: payload.display_name ?? null,
      character: payload.character ?? null,
    };

    const count = this.fighters.size + 1;
    const config = fighterDisplayConfig(count, this.mode);
    const positions = computeFighterPositions(
      count,
      this.layout.fighters.rowXRange,
      config.topY,
      config.perRow,
      config.rowSpacing,
    );

    const newPos = positions[positions.length - 1];
    this.addFighter(fighter, newPos, config);
    this.relayoutFighters();

    const entry = this.fighters.get(fighter.id);
    if (!entry) {
      return;
    }
    const finalScale = entry.sprite.scaleX;
    entry.sprite.setScale(0);
    this.tweens.add({
      targets: entry.sprite,
      scale: finalScale,
      duration: TIMINGS.fighterJoinMs,
      ease: 'Back.easeOut',
    });
  }

  addFighter(fighter, pos, options = {}) {
    const size = options.displaySize ?? 48;

    // Pick character type by fighter.character key, fall back to id modulo
    const ftypeKey = fighter.character ?? null;
    const ftype = (ftypeKey && FIGHTER_TYPES.find(ft => ft.key === ftypeKey))
      ?? FIGHTER_TYPES[Math.abs(Number(fighter.id) || 0) % FIGHTER_TYPES.length];
    // Scale so the visible character (18px of the 100px frame) fills `size` logical px
    const scale     = size / SPRITE_CHAR_HEIGHT;
    const legH      = Math.round((SPRITE_CHAR_BOT - SPRITE_HALF_FRAME) * scale);
    const avatarY   = -Math.round((SPRITE_HALF_FRAME - SPRITE_CHAR_TOP) * scale) - 38;
    const avSize    = avatarPx(size);
    const fontPx    = handleFontPx(size);
    const maxChars  = Math.max(8, Math.round(size * 0.22));
    const displayName = fighter.handle || fighter.slack_handle || fighter.display_name || '';

    const container = this.add.container(pos.x, pos.y).setDepth(2);

    // Body sprite — starts in idle animation (waiting state)
    const body = this.add.sprite(0, 0, 'fighters', `${ftype.key}-idle-0`).setScale(scale);
    const idleAnim = this.anims.get(ftype.key + '-idle');
    if (idleAnim?.frames?.length) {
      body.play(ftype.key + '-idle');
    }
    container.add(body);
    const avatarUrl = fighter.id ? `/avatars/${fighter.id}?v=${Date.now()}` : null;
    const initialKey = this.textures.exists(`fighter-${fighter.id}`)
      ? `fighter-${fighter.id}`
      : this.makeFallbackAvatarTexture(fighter);
    const head = this.add.image(0, avatarY, initialKey).setDisplaySize(avSize, avSize);
    head.setInteractive({ useHandCursor: true });
    head.on('pointerover', () => this.showFighterTooltip(fighter.id));
    head.on('pointerout', () => this.hideFighterTooltip(fighter.id));
    container.add(head);

    // Handle label (world-space)
    const handle = options.showHandle === false
      ? null
      : this.addSharpText(pos.x, pos.y + legH + fontPx, truncateHandle(displayName, maxChars), {
          fontFamily: 'monospace',
          fontSize: `${fontPx}px`,
          color: '#fbbf24',
        });

    this.fighters.set(fighter.id, {
      id: fighter.id,
      sprite: container,
      body,
      head,
      handle,
      handleText: displayName,
      pos,
      baseSize: size,
      displaySize: size,
      avatarSize: avSize,
      avatarUrl,
      legH,
      ftype,
      damageScale: 1,
      animState: 'idle',
    });

    if (initialKey !== `fighter-${fighter.id}` && avatarUrl) {
      this.loadAvatarTexture(fighter.id, avatarUrl).then(realKey => {
        if (head.scene) head.setTexture(realKey).setDisplaySize(avSize, avSize);
      }).catch(e => console.warn('[battlefield]', e.message));
    }
  }

  handleFighterMoved(payload) {
    if (!payload || payload.user_id == null) {
      return;
    }
    const entry = this.fighters.get(payload.user_id);
    if (!entry) {
      return;
    }
    // Skip server echo while local waypoint animation is in progress for own fighter
    if (entry.waypointMoving && payload.user_id === this.currentUserId) {
      return;
    }

    const target = {
      x: payload.x * this.layout.logicalWidth,
      y: payload.y * this.layout.logicalHeight,
    };

    const dx = target.x - entry.sprite.x;
    const dy = target.y - entry.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const SPEED_PX_PER_SEC = 300;
    const duration = Math.max(200, Math.round((dist / SPEED_PX_PER_SEC) * 1000));

    // Flip toward movement direction; fall back to boss-facing when barely horizontal
    const flipX = dx < -5 ? true : (dx > 5 ? false : target.x > this.layout.boss.anchor.x);

    // Start walk animation (unless mid-attack)
    if (entry.body && entry.animState !== 'attack' && entry.ftype) {
      entry.animState = 'walk';
      entry.body.setFlipX(flipX);
      entry.body.play(entry.ftype.key + '-walk', true);
    }

    // Kill any in-progress move tweens before starting new ones
    this.tweens.killTweensOf(entry.sprite);
    if (entry.handle) {
      this.tweens.killTweensOf(entry.handle);
    }

    this.tweens.add({
      targets: entry.sprite,
      x: target.x,
      y: target.y,
      duration,
      ease: 'Linear',
      onComplete: () => {
        if (entry.body && entry.animState !== 'attack') {
          const isCharging = this.charges.has(payload.user_id);
          const next = isCharging ? 'walk' : 'idle';
          entry.animState = next;
          entry.body.setFlipX(next === 'walk' ? target.x > this.layout.boss.anchor.x : false);
          entry.body.play(entry.ftype.key + '-' + next, true);
        }
        entry.pos = target;
      },
    });

    if (entry.handle) {
      const scale  = entry.sprite.scaleX;
      const fontPx = handleFontPx(entry.displaySize);
      this.tweens.add({
        targets: entry.handle,
        x: target.x,
        y: target.y + entry.legH * scale + fontPx,
        duration,
        ease: 'Linear',
      });
    }

    const charge = this.charges.get(payload.user_id);
    if (charge) {
      if (charge.trail?.scene) {
        this.tweens.killTweensOf(charge.trail);
        const tb = target.x <= this.layout.boss.anchor.x ? 1 : -1;
        const cb = Math.round(entry.displaySize / 3);
        this.tweens.add({
          targets: charge.trail,
          x: target.x - tb * Math.round(entry.displaySize * 0.18),
          y: target.y + cb - Math.round(entry.displaySize * 0.12),
          duration,
          ease: 'Linear',
        });
      }
      if (charge.bubble) {
        const avatarRelY   = entry.head?.y ?? 0;
        const avatarRadius = (entry.head?.displayHeight ?? 28) / 2;
        charge.bubble.tweenTo(this, target.x, target.y + avatarRelY - avatarRadius - 16, duration);
      }
    }
  }

  _drawChevron(g, ax, ay, px, py, color, alpha, s = 1) {
    // Arrowhead with a notch cut into the back — looks like the LoL click indicator
    // ax/ay = unit vector toward tip, px/py = perpendicular
    const TIP   = 7  * s;
    const BODY  = 4.5 * s;
    const HALF  = 4  * s;
    const NOTCH = 1.8 * s;
    g.fillStyle(color, alpha);
    g.fillPoints([
      { x:  ax * TIP,               y:  ay * TIP },               // tip
      { x: -ax * BODY + px * HALF,  y: -ay * BODY + py * HALF },  // base-right
      { x: -ax * NOTCH,             y: -ay * NOTCH },              // back notch
      { x: -ax * BODY - px * HALF,  y: -ay * BODY - py * HALF },  // base-left
    ], true);
  }

  _spawnClickRipple(x, y) {
    const COLOR      = 0x44dd11;
    const COLOR_HI   = 0xaaffaa;
    const COLOR_GLOW = 0xccffaa;
    const R_START    = 16;
    const CONVERGE   = 270;

    const diagonals = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
    const arrows = [];

    for (const angle of diagonals) {
      const g = this.add.graphics();
      g.setAlpha(0);

      const inward = angle + Math.PI;
      const ax = Math.cos(inward);
      const ay = Math.sin(inward);
      const px = -ay;
      const py =  ax;

      // Outer glow — white, faint, slightly larger
      this._drawChevron(g, ax, ay, px, py, 0xffffff, 0.18, 1.5);
      // Mid glow — green, semi-transparent, slightly larger
      this._drawChevron(g, ax, ay, px, py, COLOR_HI, 0.25, 1.2);
      // Core — solid bright green
      this._drawChevron(g, ax, ay, px, py, COLOR, 1.0, 1.0);
      // Tip highlight — tiny bright dot at the point
      g.fillStyle(0xeeffcc, 0.9);
      g.fillCircle(ax * 7, ay * 7, 1.2);

      g.setPosition(x + Math.cos(angle) * R_START, y + Math.sin(angle) * R_START);
      arrows.push(g);

      this.tweens.add({ targets: g, alpha: 1, duration: 50, ease: 'Quad.easeOut' });
    }

    let completed = 0;
    for (const g of arrows) {
      this.tweens.add({
        targets: g,
        x,
        y,
        alpha: 0,
        duration: CONVERGE,
        ease: 'Quad.easeIn',
        delay: 35,
        onComplete: () => {
          g.destroy();
          if (++completed < arrows.length) {
            return;
          }

          // Phase 2 — burst
          const burst = this.add.graphics();
          burst.fillStyle(COLOR_GLOW, 1);
          burst.fillCircle(0, 0, 3);
          burst.setPosition(x, y);
          this.tweens.add({
            targets: burst,
            scaleX: 3.5,
            scaleY: 3.5,
            alpha: 0,
            duration: 150,
            ease: 'Quad.easeOut',
            onComplete: () => {
              burst.destroy();

              // Phase 3 — ring
              const ring = this.add.graphics();
              ring.lineStyle(1.2, COLOR, 0.9);
              ring.strokeCircle(0, 0, 5);
              ring.setPosition(x, y);
              this.tweens.add({
                targets: ring,
                scaleX: 3.5,
                scaleY: 3.5,
                alpha: 0,
                duration: 260,
                ease: 'Quad.easeOut',
                onComplete: () => ring.destroy(),
              });
            },
          });
        },
      });
    }
  }

  // Returns true if (px, py) is a valid move target (px,py = fighter feet in logical px).
  // Uses three independent checks so each zone is as tight as possible.
  _isValidMoveTarget(px, py) {
    const L = this.layout;

    // Compute this fighter's actual upward extent (feet → action bubble top).
    // Formula mirrors addFighter(): avatarY = -(round(12*scale) + 38), avRadius = size*0.85*1.06/2
    const entry = this.currentUserId ? this.fighters.get(this.currentUserId) : null;
    const fsize   = entry?.displaySize ?? 48;
    const scale   = fsize / 18; // SPRITE_CHAR_HEIGHT = 18
    const avatarUp = Math.round(12 * scale) + 38; // |avatarY|, px upward to avatar center
    const avRadius = Math.round(fsize * 0.85 * 1.06) / 2;
    const fighterH = avatarUp + avRadius + 30; // +30 for bubble height + margin

    // Edge padding
    if (px < L.logicalWidth  * 0.03 || px > L.logicalWidth  * 0.97) return false;
    if (py < L.logicalHeight * 0.03 || py > L.logicalHeight * 0.97) return false;

    // 1. Action bubble must stay on-screen — prevents going so high it disappears
    if (py < fighterH + L.logicalHeight * 0.02) return false;

    // 2+3. Merged boss+HP bar exclusion — one solid column from boss sprite top to HP bar bottom.
    //      Blocks the gap between them so fighters can't sneak through the seam.
    const bossType    = this.bossTypeFor(this.bossState?.number ?? 0);
    const bossScale   = bossType.scale ?? 1;
    const bossFrameW  = bossType.animFiles ? bossType.animFiles.idle.frameWidth  : (bossType.frameWidth  ?? 32);
    const bossFrameH  = bossType.animFiles ? bossType.animFiles.idle.frameHeight : (bossType.frameHeight ?? 32);
    const bossHalfW   = (bossFrameW * bossScale) / 2;
    const bossHalfH   = (bossFrameH * bossScale) / 2;
    const hpHalfW     = L.hpBar.width / 2 + 15;
    const zoneHalfW   = Math.max(bossHalfW + 12, hpHalfW);
    const zoneTop     = L.boss.anchor.y - bossHalfH - 12;
    // Include bubble half-height so the bubble top never clips the HP bar bottom.
    const fontPx      = Math.max(9, Math.round(fsize * 0.22));
    const bubbleHalfH = Math.ceil((fontPx + 8) / 2);
    const zoneBot     = L.hpBar.y + L.hpBar.height + 10 + bubbleHalfH;
    if (Math.abs(px - L.boss.anchor.x) < zoneHalfW &&
        py - fighterH < zoneBot &&
        py > zoneTop) {
      return false;
    }

    // 4. Leaderboard: neither avatar nor action bubble may overlap the panel.
    //    Pad the left edge by the estimated action bubble half-width so the widest
    //    text (18 chars at fighter font size) stays clear of the panel border.
    const bubbleHalfW = Math.ceil(ACTIVITY_MAX_CHARS * fontPx * 0.6 / 2) + 12;
    const LB_W = 240, LB_H = 160, LB_PAD = 4, LB_TOP = 5;
    const lbLeft = this.mode === 'portrait' ? LB_PAD : L.logicalWidth - LB_PAD - LB_W;
    if (px > lbLeft - bubbleHalfW && px < lbLeft + LB_W + bubbleHalfW &&
        py - fighterH < LB_TOP + LB_H && py > LB_TOP) {
      return false;
    }

    return true;
  }

  // Returns a Y position guaranteed to clear boss sprite, HP bar, and fighter height.
  _bypassY() {
    const L = this.layout;
    const entry = this.currentUserId ? this.fighters.get(this.currentUserId) : null;
    const fsize = entry?.displaySize ?? 48;
    const scale = fsize / 18;
    const avatarUp = Math.round(12 * scale) + 38;
    const avRadius = Math.round(fsize * 0.85 * 1.06) / 2;
    const fighterH = avatarUp + avRadius + 30;

    // Same zoneBot as _isValidMoveTarget: HP bar bottom + 10 + bubbleHalfH
    const fontPx      = Math.max(9, Math.round(fsize * 0.22));
    const bubbleHalfH = Math.ceil((fontPx + 8) / 2);
    const zoneBot     = L.hpBar.y + L.hpBar.height + 10 + bubbleHalfH;
    return Math.min(zoneBot + fighterH + 15, L.logicalHeight * 0.92);
  }

  // Returns waypoint list to reach (toX, toY) from (fromX, fromY).
  // If direct path is clear → single waypoint (direct).
  // If blocked but destination is valid → 3-segment detour via bypassY below boss.
  // Falls back to clamped boundary if detour not feasible.
  _planRoute(fromX, fromY, toX, toY) {
    const direct = this._clampMoveTarget(fromX, fromY, toX, toY);
    const directClear = direct
      && Math.abs(direct.x - toX) < 2
      && Math.abs(direct.y - toY) < 2;

    if (directClear) {
      return [{ x: toX, y: toY }];
    }

    // Destination must be reachable by itself for a detour to make sense
    if (!this._isValidMoveTarget(toX, toY)) {
      return direct ? [direct] : null;
    }

    const bypassY = this._bypassY();
    const wp1 = { x: fromX, y: bypassY };
    const wp2 = { x: toX,   y: bypassY };

    // Verify every segment of the detour is clear
    if (this._isValidMoveTarget(wp1.x, wp1.y) && this._isValidMoveTarget(wp2.x, wp2.y)) {
      const allClear = (from, to) => {
        const r = this._clampMoveTarget(from.x, from.y, to.x, to.y);
        return r && Math.abs(r.x - to.x) < 2 && Math.abs(r.y - to.y) < 2;
      };
      if (allClear({ x: fromX, y: fromY }, wp1)
          && allClear(wp1, wp2)
          && allClear(wp2, { x: toX, y: toY })) {
        const route = [];
        if (Math.abs(fromY - bypassY) > 5) route.push(wp1);
        if (Math.abs(fromX - toX)    > 5) route.push(wp2);
        route.push({ x: toX, y: toY });
        return route;
      }
    }

    return direct ? [direct] : null;
  }

  // Animate fighter sprite through a list of waypoints locally (no server dispatch per step).
  // Caller is responsible for dispatching the final position to Livewire once.
  _animateRoute(entry, route) {
    this.tweens.killTweensOf(entry.sprite);
    if (entry.handle) this.tweens.killTweensOf(entry.handle);
    entry.waypointMoving = true;

    const SPEED = 300; // px/s

    const step = (idx) => {
      if (!entry.sprite?.active || idx >= route.length) {
        entry.waypointMoving = false;
        return;
      }
      const target = route[idx];
      const dx = target.x - entry.sprite.x;
      const dy = target.y - entry.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const duration = Math.max(150, Math.round((dist / SPEED) * 1000));
      const flipX = dx < -5 ? true : (dx > 5 ? false : target.x > this.layout.boss.anchor.x);

      if (entry.body && entry.animState !== 'attack') {
        entry.animState = 'walk';
        entry.body.setFlipX(flipX);
        entry.body.play(entry.ftype.key + '-walk', true);
      }

      this.tweens.add({
        targets: entry.sprite,
        x: target.x, y: target.y,
        duration,
        ease: 'Linear',
        onComplete: () => {
          if (!entry.sprite?.active) {
            entry.waypointMoving = false;
            return;
          }
          if (idx === route.length - 1) {
            entry.pos = target;
            entry.waypointMoving = false;
            if (entry.body && entry.animState !== 'attack') {
              const isCharging = this.charges.has(entry.id);
              const next = isCharging ? 'walk' : 'idle';
              entry.animState = next;
              entry.body.setFlipX(next === 'walk' ? target.x > this.layout.boss.anchor.x : false);
              entry.body.play(entry.ftype.key + '-' + next, true);
            }
          }
          step(idx + 1);
        },
      });

      if (entry.handle) {
        this.tweens.killTweensOf(entry.handle);
        const spriteScale = entry.sprite.scaleX;
        const fontPx = handleFontPx(entry.displaySize);
        this.tweens.add({
          targets: entry.handle,
          x: target.x,
          y: target.y + entry.legH * spriteScale + fontPx,
          duration,
          ease: 'Linear',
        });
      }

      if (entry.bubble) {
        const avatarRelY   = entry.head?.y ?? 0;
        const avatarRadius = (entry.head?.displayHeight ?? 28) / 2;
        entry.bubble.tweenTo(this, target.x, target.y + avatarRelY - avatarRadius - 28, duration);
      }

      const charge = this.charges.get(entry.id);
      if (charge) {
        if (charge.trail?.scene) {
          this.tweens.killTweensOf(charge.trail);
          const tb = target.x <= this.layout.boss.anchor.x ? 1 : -1;
          const cb = Math.round(entry.displaySize / 3);
          this.tweens.add({
            targets: charge.trail,
            x: target.x - tb * Math.round(entry.displaySize * 0.18),
            y: target.y + cb - Math.round(entry.displaySize * 0.12),
            duration,
            ease: 'Linear',
          });
        }
        if (charge.bubble) {
          const avatarRelY   = entry.head?.y ?? 0;
          const avatarRadius = (entry.head?.displayHeight ?? 28) / 2;
          charge.bubble.tweenTo(this, target.x, target.y + avatarRelY - avatarRadius - 16, duration);
        }
      }
    };

    step(0);
  }

  // Find the furthest valid point from source along segment [from → to].
  // Always binary-searches the full path — never skips even if destination is valid,
  // because the path itself might cross a restricted zone (e.g. boss).
  _clampMoveTarget(fromX, fromY, toX, toY) {
    // Binary search: lo=source (t=0, always valid), hi=destination (t=1)
    let lo = 0, hi = 1;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      const mx  = fromX + (toX - fromX) * mid;
      const my  = fromY + (toY - fromY) * mid;
      if (this._isValidMoveTarget(mx, my)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    if (lo < 0.005) return null; // source itself is invalid, don't move
    if (lo > 0.999) return { x: toX, y: toY }; // destination reachable, path clear
    return {
      x: fromX + (toX - fromX) * lo,
      y: fromY + (toY - fromY) * lo,
    };
  }

  _setupMoveInput() {
    if (!this.currentUserId) {
      return;
    }

    let debounceTimer = null;

    this.input.on('pointerdown', pointer => {
      // Always show ripple at click point
      this._spawnClickRipple(pointer.x, pointer.y);

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const entry = this.fighters.get(this.currentUserId);
        const from  = entry?.pos ?? { x: pointer.x, y: pointer.y };
        const route = this._planRoute(from.x, from.y, pointer.x, pointer.y);
        if (!route || route.length === 0) return;

        const final = route[route.length - 1];
        const x = parseFloat((final.x / this.layout.logicalWidth).toFixed(4));
        const y = parseFloat((final.y / this.layout.logicalHeight).toFixed(4));

        // Always cancel any stale waypoint animation — kills tweens without onComplete,
        // so we must manually clear the flag to unblock handleFighterMoved.
        if (entry) {
          entry.waypointMoving = false;
          this.tweens.killTweensOf(entry.sprite);
          if (entry.handle) this.tweens.killTweensOf(entry.handle);
        }

        if (route.length > 1 && entry) {
          // Detour route: animate locally, dispatch only the final destination
          this._animateRoute(entry, route);
        }

        if (window.Livewire) {
          window.Livewire.dispatch('fighter-move', { x, y });
        }
      }, 100);
    });

    this.input.on('pointermove', () => {
      this.game.canvas.style.cursor = 'pointer';
    });
  }
}
