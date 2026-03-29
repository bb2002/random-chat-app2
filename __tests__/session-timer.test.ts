import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Feature: random-chat-app, Property 14: 세션 타이머 초기값', () => {
  it('expiresAt 기준 카운트다운 초기값 검증', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 420 }),
        (remainingSeconds) => {
          const now = Date.now();
          const expiresAt = new Date(now + remainingSeconds * 1000);
          const diff = Math.floor((expiresAt.getTime() - now) / 1000);
          expect(diff).toBeGreaterThanOrEqual(0);
          expect(diff).toBeLessThanOrEqual(420);
        }
      ),
      { numRuns: 100 }
    );
  });
});
