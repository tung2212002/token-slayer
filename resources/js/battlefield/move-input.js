import { ACTIVITY_MAX_CHARS } from '@battlefield/bubble.js';
import { Boss } from '@battlefield/boss.js';
import { AnimState } from '@battlefield/constants.js';

/**
 * Returns the font size in pixels for a fighter handle label.
 *
 * @param {number} displaySize
 * @return {number}
 */
function handleFontPx(displaySize) {
  return Math.max(10, Math.round(displaySize * 0.25));
}

/** Handles click-to-move input: route planning, chevron animation, ripple effect. */
export class MoveInput {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Registers pointer input handlers on the scene. Call once from scene.create().
   *
   * @return {void}
   */
  setup() {
    if (!this.scene.currentUserId) {
      return;
    }

    let debounceTimer = null;

    this.scene.input.on('pointerdown', pointer => {
      // Always show ripple at click point
      this._spawnClickRipple(pointer.x, pointer.y);

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const entry = this.scene.fighters.get(this.scene.currentUserId);
        if (entry?.isStunned) return;
        const from  = entry?.pos ?? { x: pointer.x, y: pointer.y };
        const route = this._planRoute(from.x, from.y, pointer.x, pointer.y);
        if (!route || route.length === 0) return;

        const final = route[route.length - 1];
        const x = parseFloat((final.x / this.scene.layout.logicalWidth).toFixed(4));
        const y = parseFloat((final.y / this.scene.layout.logicalHeight).toFixed(4));

        // Always cancel any stale waypoint animation — kills tweens without onComplete,
        // so we must manually clear the flag to unblock handleFighterMoved.
        if (entry) {
          entry.waypointMoving = false;
          this.scene.tweens.killTweensOf(entry.sprite);
          if (entry.handle) this.scene.tweens.killTweensOf(entry.handle);
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

    this.scene.input.on('pointermove', () => {
      this.scene.game.canvas.style.cursor = 'pointer';
    });
  }

  /**
   * Draws a filled arrowhead chevron shape into a graphics object.
   *
   * @param {Phaser.GameObjects.Graphics} g
   * @param {number} ax
   * @param {number} ay
   * @param {number} px
   * @param {number} py
   * @param {number} color
   * @param {number} alpha
   * @param {number} [s=1]
   * @return {void}
   */
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

  /**
   * Spawns the converging-arrow ripple effect at (x, y).
   *
   * @param {number} x
   * @param {number} y
   * @return {void}
   */
  _spawnClickRipple(x, y) {
    const COLOR      = 0x44dd11;
    const COLOR_HI   = 0xaaffaa;
    const COLOR_GLOW = 0xccffaa;
    const R_START    = 16;
    const CONVERGE   = 270;

    const diagonals = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
    const arrows = [];

    for (const angle of diagonals) {
      const g = this.scene.add.graphics();
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

      this.scene.tweens.add({ targets: g, alpha: 1, duration: 50, ease: 'Quad.easeOut' });
    }

    let completed = 0;
    for (const g of arrows) {
      this.scene.tweens.add({
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
          const burst = this.scene.add.graphics();
          burst.fillStyle(COLOR_GLOW, 1);
          burst.fillCircle(0, 0, 3);
          burst.setPosition(x, y);
          this.scene.tweens.add({
            targets: burst,
            scaleX: 3.5,
            scaleY: 3.5,
            alpha: 0,
            duration: 150,
            ease: 'Quad.easeOut',
            onComplete: () => {
              burst.destroy();

              // Phase 3 — ring
              const ring = this.scene.add.graphics();
              ring.lineStyle(1.2, COLOR, 0.9);
              ring.strokeCircle(0, 0, 5);
              ring.setPosition(x, y);
              this.scene.tweens.add({
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

  /**
   * Returns true if (px, py) is a valid move target in logical pixels.
   *
   * @param {number} px
   * @param {number} py
   * @return {boolean}
   */
  _isValidMoveTarget(px, py) {
    const L = this.scene.layout;

    // Compute this fighter's actual upward extent (feet → action bubble top).
    // Formula mirrors addFighter(): avatarY = -(round(12*scale) + 38), avRadius = size*0.85*1.06/2
    const entry = this.scene.currentUserId ? this.scene.fighters.get(this.scene.currentUserId) : null;
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
    const bossType    = Boss.bossTypeFor(this.scene.bossState?.number ?? 0);
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
    const lbLeft = this.scene.mode === 'portrait' ? LB_PAD : L.logicalWidth - LB_PAD - LB_W;
    if (px > lbLeft - bubbleHalfW && px < lbLeft + LB_W + bubbleHalfW &&
        py - fighterH < LB_TOP + LB_H && py > LB_TOP) {
      return false;
    }

    return true;
  }

  /**
   * Returns a Y position guaranteed to clear boss sprite, HP bar, and fighter height.
   *
   * @return {number}
   */
  _bypassY() {
    const L = this.scene.layout;
    const entry = this.scene.currentUserId ? this.scene.fighters.get(this.scene.currentUserId) : null;
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

  /**
   * Returns a waypoint list from (fromX, fromY) to (toX, toY), routing around blocked zones.
   *
   * @param {number} fromX
   * @param {number} fromY
   * @param {number} toX
   * @param {number} toY
   * @return {Array<{x: number, y: number}>|null}
   */
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

  /**
   * Animates the fighter sprite through the given waypoint list locally.
   *
   * @param {object} entry
   * @param {Array<{x: number, y: number}>} route
   * @return {void}
   */
  _animateRoute(entry, route) {
    this.scene.tweens.killTweensOf(entry.sprite);
    if (entry.handle) this.scene.tweens.killTweensOf(entry.handle);
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
      const flipX = dx < -5 ? true : (dx > 5 ? false : target.x > this.scene.layout.boss.anchor.x);

      if (entry.body && entry.animState !== AnimState.ATTACK) {
        entry.animState = AnimState.WALK;
        entry.body.setFlipX(flipX);
        entry.body.play(entry.ftype.key + '-walk', true);
      }

      this.scene.tweens.add({
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
            if (entry.body && entry.animState !== AnimState.ATTACK) {
              const isCharging = this.scene.charges.has(entry.id);
              const next = isCharging ? AnimState.WALK : AnimState.IDLE;
              entry.animState = next;
              entry.body.setFlipX(next === AnimState.WALK ? target.x > this.scene.layout.boss.anchor.x : false);
              entry.body.play(entry.ftype.key + '-' + next, true);
            }
          }
          step(idx + 1);
        },
      });

      if (entry.handle) {
        this.scene.tweens.killTweensOf(entry.handle);
        const spriteScale = entry.sprite.scaleX;
        const fontPx = handleFontPx(entry.displaySize);
        this.scene.tweens.add({
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
        entry.bubble.tweenTo(this.scene, target.x, target.y + avatarRelY - avatarRadius - 28, duration);
      }

      const charge = this.scene.charges.get(entry.id);
      if (charge) {
        if (charge.trail?.scene) {
          this.scene.tweens.killTweensOf(charge.trail);
          const tb = target.x <= this.scene.layout.boss.anchor.x ? 1 : -1;
          const cb = Math.round(entry.displaySize / 3);
          this.scene.tweens.add({
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
          charge.bubble.tweenTo(this.scene, target.x, target.y + avatarRelY - avatarRadius - 16, duration);
        }
      }
    };

    step(0);
  }

  /**
   * Returns the furthest valid point along the segment from (fromX, fromY) to (toX, toY).
   *
   * @param {number} fromX
   * @param {number} fromY
   * @param {number} toX
   * @param {number} toY
   * @return {{x: number, y: number}|null}
   */
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
}
