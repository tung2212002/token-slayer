import { describe, it, expect } from 'vitest';
// @ts-ignore — JS module from the Laravel resources tree
import { shouldForwardToHost, packHit } from '../../../../resources/js/ide-bridge-internal.js';

describe('ide-bridge-internal', () => {
  it('shouldForwardToHost requires both a valid message and a host', () => {
    expect(shouldForwardToHost(null, true, true)).toBe(false);
    expect(shouldForwardToHost({ type: 'x' }, false, false)).toBe(false);
    expect(shouldForwardToHost({ type: 'x' }, true, false)).toBe(true);
    expect(shouldForwardToHost({ type: 'x' }, false, true)).toBe(true);
  });

  it('packHit filters by current user', () => {
    const payload = { user_id: 5, damage: 100, boss_id: 1, boss_hp_after: 900, boss_max_hp: 1000 };
    expect(packHit(payload, 5)?.damage).toBe(100);
    expect(packHit(payload, 9)).toBeNull();
    expect(packHit(payload, null)).toBeNull();
  });
});
