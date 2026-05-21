import { describe, it, expect } from 'vitest';
import { parseBridgeMessage } from '../bridge/schema';

describe('parseBridgeMessage', () => {
  it('accepts a well-formed hit-landed', () => {
    const result = parseBridgeMessage({
      type: 'hit-landed',
      userId: 1, damage: 5, bossId: 7, bossHpAfter: 10, bossMaxHp: 100,
    });
    expect(result?.type).toBe('hit-landed');
  });

  it('rejects unknown types', () => {
    expect(parseBridgeMessage({ type: 'something-else' })).toBeNull();
  });

  it('rejects non-objects', () => {
    expect(parseBridgeMessage('hi')).toBeNull();
    expect(parseBridgeMessage(null)).toBeNull();
  });

  it('rejects type-correct shape with missing required fields', () => {
    expect(parseBridgeMessage({ type: 'hit-landed' })).toBeNull();
  });
});
