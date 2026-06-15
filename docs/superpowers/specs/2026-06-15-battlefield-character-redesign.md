# Battlefield Character Redesign — Tiny RPG Asset Pack

**Date:** 2026-06-15  
**Status:** Approved  
**Scope:** Replace all fighter character sprites with Tiny RPG Character Asset Pack (zerie), unify animation system, add avatar bubble with charging ring.

---

## Problem

Current fighter sprites (Game Art 2D) have inconsistent frame sizes (135–302 × 256px), each needing per-character `headX/Y/Size` tuning to position the avatar overlay. Animation is limited to `idle` and `run` (charged state). The system is hard to extend and visually inconsistent.

---

## Goal

- All fighters use the same spritesheet shape (row-based, uniform frame size ~48×48px)
- 4 animation states: `idle`, `walk`, `attack`, `death`
- Avatar renders as a floating bubble above the character (no per-character head tuning)
- Charging state shows a green pulsing ring around the avatar bubble instead of fire particles

---

## Section 1: Asset Pipeline

**Source:** [Tiny RPG Character Asset Pack by zerie](https://zerie.itch.io/tiny-rpg-character-asset-pack) — CC0 license.

**Steps:**
1. Download `.zip` from itch.io (requires manual login)
2. Select **6 characters** from the pack — diverse classes: warrior, mage, archer, rogue, priest, knight
3. Verify each character spritesheet is row-based:
   - Row 0: idle
   - Row 1: walk
   - Row 2: attack
   - Row 3: death
4. If pack uses separate files per animation, merge rows into a single spritesheet using a canvas/ImageMagick pipeline
5. Place final sheets at `public/assets/battlefield/fighters/<name>.png`
6. Remove old fighter PNGs (knight, redhat, ninjagirl, adventurer, ninja)
7. Update `public/assets/battlefield/CREDITS.md` with zerie CC0 attribution

**Expected frame size:** 48×48px or 64×64px — must be uniform across all 6 characters.

---

## Section 2: Config Schema (`config.js`)

Replace per-character `idleFile`/`runFile`/`headX`/`headY`/`headSize`/`baseFlipX`/`runFrameWidth` with a unified shape:

```js
{
  key: 'warrior',
  attackType: 'slash',           // keeps existing projectile attack system
  file: '/assets/battlefield/fighters/warrior.png',
  frameWidth: 48,
  frameHeight: 48,
  animations: {
    idle:   { row: 0, frames: 4, rate: 8  },
    walk:   { row: 1, frames: 4, rate: 10 },
    attack: { row: 2, frames: 4, rate: 12 },
    death:  { row: 3, frames: 4, rate: 8  },
  },
}
```

- `file`: single spritesheet texture key
- `animations.<state>.row`: which row in the sheet
- `animations.<state>.frames`: frame count
- `animations.<state>.rate`: frames per second
- `attackType`: unchanged — maps to existing `ATTACK_HANDLERS` in `attacks.js`

Frame start index for a given state: `row * frames`, end: `(row + 1) * frames - 1`.

Character assignment: unchanged — `FIGHTER_TYPES[Math.abs(Number(fighter.id) || 0) % FIGHTER_TYPES.length]`.

---

## Section 3: Avatar Bubble System

**Layout (local container coordinates):**
```
[avatar circle 28px]     y = -(frameHeight/2 * scale) - 20
     [sprite body]
   [handle text]          world-space, below container
```

**Avatar bubble:**
- 28px circular image, pre-baked crop (reuses existing `loadAvatarTexture` / `makeFallbackAvatarTexture`)
- Position: `x = 0`, `y = -(frameHeight / 2 * scale) - 20` in local container space
- Added to container alongside body sprite — no per-character `headX/Y` needed

**Charging ring:**
- `Phaser.GameObjects.Graphics` circle, stroke color `0x22c55e`, line width 2px, radius 18px
- Position: same as avatar bubble (centered on it)
- Added to container when charging starts, destroyed on `clearCharge`
- Tween 1 (alpha): `0.3 → 1.0`, yoyo, repeat -1, duration 600ms
- Tween 2 (scale): `0.9 → 1.1`, yoyo, repeat -1, duration 600ms
- Both tweens killed and ring destroyed on `clearCharge`

**Removed:** `spawnChargeEmitters` method and all fire particle logic.

**Activity bubble:** unchanged — text bubble above avatar, shown when `showHandle` config allows it.

---

## Section 4: Animation State Machine

Each fighter entry gains `animState: 'idle' | 'walk' | 'attack'` field.

**Transitions:**

```
idle ──[handleCharging]──► walk
walk ──[clearCharge]──────► idle
idle/walk ──[handleHit]──► attack ──[anim complete]──► idle or walk (check charges.has)
```

**Implementation details:**

- `handleCharging`: set `animState = 'walk'`, play `walk` anim, flip sprite toward boss
- `clearCharge`: set `animState = 'idle'`, play `idle` anim, reset flipX
- `handleHit` (fighter present): play `attack` anim (`repeat: 0`); on `ANIMATION_COMPLETE`, resume `walk` if `charges.has(userId)`, else `idle`
- `death` animation: registered in `preload`/`create`, not triggered yet — reserved for future boss-round-end mechanic

**Coexistence with projectile system:** `attacks.js` projectile/effect handlers fire unchanged. Character body `attack` animation plays in parallel with the projectile effect.

---

## Section 5: Tests

**Update existing vitest tests:**
- Replace `FIGHTER_TYPES` fixtures using old schema (`idleFile`, `runFile`, `headX/Y/Size`) with new schema
- Remove assertions on fire particle emitters

**New tests:**

| Area | Test |
|---|---|
| Config | Each fighter type has `file`, `frameWidth`, `frameHeight`, `animations.{idle,walk,attack,death}` with required fields |
| Avatar bubble | Avatar Y position = `-(frameHeight/2 * scale) - 20`, independent of character type |
| Charging ring | `handleCharging` creates ring on fighter; `clearCharge` destroys ring |
| State: idle→walk | `handleCharging` switches animState to `walk` and plays walk anim |
| State: walk→idle | `clearCharge` switches animState to `idle` and plays idle anim |
| State: attack→resume idle | After attack anim completes, resumes `idle` when not charging |
| State: attack→resume walk | After attack anim completes, resumes `walk` when still charging |

**Pest (PHP) tests:** no changes — character assignment logic is backend-only and unchanged.

---

## Files Changed

| File | Change |
|---|---|
| `public/assets/battlefield/fighters/*` | Replace 10 old PNGs with 6 new row-based sheets |
| `public/assets/battlefield/CREDITS.md` | Add zerie CC0 attribution, remove Game Art 2D entries |
| `resources/js/battlefield/config.js` | New `FIGHTER_TYPES` schema |
| `resources/js/battlefield/scene.js` | Avatar bubble, charging ring, animation state machine, remove fire particles |
| `resources/js/battlefield/layout.js` | Update `fighterDisplayConfig` if `headSize` referenced |
| `tests/js/battlefield/*.test.js` | Update fixtures and add new tests |

---

## Out of Scope

- Fighter `death` trigger (boss round end) — design reserved, not implemented
- User-selectable characters — stays random assignment
- Boss sprite changes — unchanged
- FX sprites (fireball, explosion) — unchanged
