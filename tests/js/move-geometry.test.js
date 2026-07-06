import { expect, test } from 'vitest';
import { LAYOUTS } from '@battlefield/config.js';
import { isValidMoveTarget, bypassY, clampMoveTarget } from '@battlefield/move-geometry.js';

const BOSS_TYPE = { frameWidth: 32, frameHeight: 32, scale: 4 };
const landscapeCtx = { layout: LAYOUTS.landscape, bossType: BOSS_TYPE, fsize: 48, isPortrait: false };
const portraitCtx  = { layout: LAYOUTS.portrait,  bossType: BOSS_TYPE, fsize: 48, isPortrait: true };

test('rejects points near the outer edge', () => {
  expect(isValidMoveTarget(5, 300, landscapeCtx)).toBe(false);   // px < 3% of 960
  expect(isValidMoveTarget(955, 300, landscapeCtx)).toBe(false); // px > 97% of 960
  expect(isValidMoveTarget(480, 5, landscapeCtx)).toBe(false);   // py < 3% of 540
});

test('accepts an open point clear of the boss column and leaderboard', () => {
  expect(isValidMoveTarget(480, 470, landscapeCtx)).toBe(true);
});

test('rejects a point inside the boss/HP-bar exclusion column', () => {
  expect(isValidMoveTarget(480, 200, landscapeCtx)).toBe(false);
});

test('rejects a point inside the landscape leaderboard panel (right side)', () => {
  expect(isValidMoveTarget(750, 250, landscapeCtx)).toBe(false);
});

test('leaderboard exclusion moves to the left side under isPortrait', () => {
  // Same point: excluded in portrait (panel on the left), clear in landscape (panel on the right)
  expect(isValidMoveTarget(100, 200, portraitCtx)).toBe(false);
  expect(isValidMoveTarget(100, 200, landscapeCtx)).toBe(true);
});

test('bypassY clears the boss/HP-bar column with margin', () => {
  expect(bypassY(landscapeCtx)).toBeCloseTo(468.5, 1);
});

test('clampMoveTarget returns the destination unchanged when the path is clear', () => {
  const result = clampMoveTarget(200, 470, 700, 470, landscapeCtx);
  expect(result.x).toBeCloseTo(700, 1);
  expect(result.y).toBeCloseTo(470, 1);
});

test('clampMoveTarget stops at the boss zone boundary when the path crosses it', () => {
  const result = clampMoveTarget(300, 200, 480, 200, landscapeCtx);
  expect(result.x).toBeCloseTo(365, 0);
  expect(result.y).toBeCloseTo(200, 1);
});

test('clampMoveTarget returns null when the source itself is invalid', () => {
  const result = clampMoveTarget(480, 200, 480, 250, landscapeCtx);
  expect(result).toBeNull();
});
