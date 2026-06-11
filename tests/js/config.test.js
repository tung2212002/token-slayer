import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOSS_TYPES, FIGHTER_TYPES } from '../../resources/js/battlefield/config.js';

const publicFile = (urlPath) => join(process.cwd(), 'public', urlPath);

// PNG dimensions live in the IHDR chunk: width at bytes 16-19, height at 20-23
function pngSize(path) {
  const buf = readFileSync(path);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('FIGHTER_TYPES', () => {
  test('matches the backend fighter keys exactly', () => {
    expect(FIGHTER_TYPES.map((f) => f.key)).toEqual([
      'knight', 'redhat', 'ninjagirl', 'adventurer', 'shinobi',
    ]);
  });

  test('every idle and run spritesheet exists on disk', () => {
    for (const f of FIGHTER_TYPES) {
      expect(existsSync(publicFile(f.idleFile)), `${f.key} idle: ${f.idleFile}`).toBe(true);
      expect(existsSync(publicFile(f.runFile)), `${f.key} run: ${f.runFile}`).toBe(true);
    }
  });

  test('frame configs are sane', () => {
    for (const f of FIGHTER_TYPES) {
      expect(f.frameWidth, f.key).toBeGreaterThan(0);
      expect(f.frameHeight, f.key).toBeGreaterThan(0);
      expect(f.idleFrames, f.key).toBeGreaterThan(0);
      expect(f.runFrames, f.key).toBeGreaterThan(0);
      expect(typeof f.attackType, f.key).toBe('string');
    }
  });
});

describe('BOSS_TYPES', () => {
  test('keys are unique', () => {
    const keys = BOSS_TYPES.map((b) => b.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('every boss spritesheet exists on disk', () => {
    for (const b of BOSS_TYPES) {
      expect(existsSync(publicFile(b.file)), `${b.key}: ${b.file}`).toBe(true);
    }
  });

  test('frame configs are sane', () => {
    for (const b of BOSS_TYPES) {
      expect(b.frameWidth, b.key).toBeGreaterThan(0);
      expect(b.frameHeight, b.key).toBeGreaterThan(0);
      expect(b.idleEnd, b.key).toBeGreaterThanOrEqual(b.idleStart);
      expect(b.scale, b.key).toBeGreaterThan(0);
    }
  });

  test('frame grid matches the actual spritesheet dimensions and idle frames exist', () => {
    for (const b of BOSS_TYPES) {
      const { width, height } = pngSize(publicFile(b.file));
      expect(width % b.frameWidth, `${b.key}: sheet width ${width} not divisible by frameWidth ${b.frameWidth}`).toBe(0);
      expect(height % b.frameHeight, `${b.key}: sheet height ${height} not divisible by frameHeight ${b.frameHeight}`).toBe(0);
      const totalFrames = (width / b.frameWidth) * (height / b.frameHeight);
      expect(b.idleEnd, `${b.key}: idleEnd ${b.idleEnd} outside sheet (${totalFrames} frames)`).toBeLessThan(totalFrames);
    }
  });
});
