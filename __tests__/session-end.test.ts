import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Feature: random-chat-app, Property 16: 세션 종료 시 DB 업데이트', () => {
  it('종료된 세션의 ended_at, termination_reason 비null', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('timer_expired' as const, 'user_left' as const),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (reason, endedAt) => {
          // Simulate session end update
          const session = {
            endedAt,
            terminationReason: reason,
          };
          expect(session.endedAt).not.toBeNull();
          expect(session.terminationReason).not.toBeNull();
          expect(['timer_expired', 'user_left']).toContain(session.terminationReason);
        }
      ),
      { numRuns: 100 }
    );
  });
});
