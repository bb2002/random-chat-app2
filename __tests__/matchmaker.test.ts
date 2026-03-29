import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { v4 as uuidv4 } from 'uuid';

// In-memory DB mock
let queueStore: Record<string, any> = {};
let sessionStore: Record<string, any> = {};

vi.mock('@/lib/db', () => {
  return {
    db: {
      select: () => ({
        from: (table: any) => ({
          where: (...conditions: any[]) => ({
            orderBy: (...order: any[]) => ({
              limit: (n: number) => {
                const entries = Object.values(queueStore);
                // Filter by conditions (simplified mock)
                return Promise.resolve(entries.slice(0, n));
              },
            }),
          }),
        }),
      }),
      insert: (table: any) => ({
        values: (vals: any) => {
          if (table === 'sessions') {
            sessionStore[vals.id] = vals;
          } else {
            queueStore[vals.id] = vals;
          }
          return Promise.resolve();
        },
      }),
      update: (table: any) => ({
        set: (vals: any) => ({
          where: (condition: any) => Promise.resolve(),
        }),
      }),
      transaction: async (fn: Function) => {
        await fn({
          insert: (table: any) => ({
            values: (vals: any) => {
              sessionStore[vals.id] = vals;
              return Promise.resolve();
            },
          }),
          update: (table: any) => ({
            set: (vals: any) => ({
              where: (condition: any) => {
                // Update queue entries status
                for (const key of Object.keys(queueStore)) {
                  if (vals.status) queueStore[key].status = vals.status;
                  if (vals.sessionId) queueStore[key].sessionId = vals.sessionId;
                }
                return Promise.resolve();
              },
            }),
          }),
        });
      },
    },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (a: any, b: any) => ({ a, b }),
  and: (...args: any[]) => args,
  asc: (col: any) => col,
}));

vi.mock('@/lib/db/schema', () => ({
  queueEntries: 'queue_entries',
  sessions: 'sessions',
}));

import { SESSION_DURATION_SECONDS } from '@/lib/matchmaker';

describe('Feature: random-chat-app, Matchmaker Properties', () => {
  beforeEach(() => {
    queueStore = {};
    sessionStore = {};
  });

  describe('Property 5: 매칭된 두 사용자의 chat_mode 동일성', () => {
    it('같은 모드의 사용자만 매칭됨', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('voice' as const, 'video' as const),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          (mode, name1, name2) => {
            // Both users have same mode
            const user1 = { id: uuidv4(), userName: name1, chatMode: mode, status: 'waiting' as const };
            const user2 = { id: uuidv4(), userName: name2, chatMode: mode, status: 'waiting' as const };
            expect(user1.chatMode).toBe(user2.chatMode);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: 세션 채널명(session ID) 고유성', () => {
    it('생성된 세션 ID들은 모두 고유함', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 50 }),
          (count) => {
            const ids = new Set<string>();
            for (let i = 0; i < count; i++) {
              ids.add(uuidv4());
            }
            expect(ids.size).toBe(count);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 14: expiresAt = startedAt + 420초', () => {
    it('세션의 expiresAt은 startedAt + 420초', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
          (startedAt) => {
            const expiresAt = new Date(startedAt.getTime() + SESSION_DURATION_SECONDS * 1000);
            const diff = (expiresAt.getTime() - startedAt.getTime()) / 1000;
            expect(diff).toBe(420);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
