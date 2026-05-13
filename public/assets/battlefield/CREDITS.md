# Battlefield Assets

Pixel art from **Warped: Super Grotto Escape Collection** by **Ansimuz**.

- Original page: https://ansimuz.itch.io/super-grotto-escape-pack
- License: **CC0 1.0 Universal** (public domain)
- Mirror used for download: https://github.com/thanhnld0912/Super-Grotto-Escape

## Files

### Boss spritesheets (`bosses/`)

| File | Dimensions | Frames | Frame size |
|---|---|---|---|
| `ghost.png` | 128×32 | 4 | 32×32 |
| `ghost-fury.png` | 64×32 | 2 | 32×32 |
| `skeleton.png` | 128×32 | 4 | 32×32 |
| `slime.png` | 160×32 | 5 | 32×32 |
| `mini-demon.png` | 192×48 | 4 | 48×48 |

### FX (`fx/`)

| File | Dimensions | Frames | Frame size | Purpose |
|---|---|---|---|---|
| `fireball.png` | 64×16 | 4 | 16×16 | projectile |
| `explosion.png` | 128×32 | 4 | 32×32 | impact burst |
| `big-explosion.png` | 576×64 | 9 | 64×64 | boss-killed flash |
| `player-shoot-hit.png` | 64×16 | 4 | 16×16 | charge ring (additive blend) |

The charge ring may also be rendered procedurally via Phaser's `Graphics`
at runtime; the `player-shoot-hit` sheet is included as a fallback.

Text in the scene (boss name, HP, fighter handles) uses Phaser's
`add.text` with a monospace fallback rather than a bitmap font — keeps
the asset footprint smaller and is sharp enough at 480×270.
