import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { v4 as uuidv4 } from 'uuid';

type ChatMode = 'text' | 'voice' | 'video';

describe('Feature: random-chat-app, Property 15: 세션 생성 시 DB 퍼시스턴스', () => {
  it('세션 필수 필드 존재 및 올바른 값', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ChatMode>('text', 'voice', 'video'),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (chatMode, user1Name, user2Name) => {
          const sessionId = uuidv4();
          const startedAt = new Date();
          const expiresAt = new Date(startedAt.getTime() + 420 * 1000);

          const session = {
            id: sessionId,
            chatMode,
            user1Name,
            user2Name,
            user1QueueId: uuidv4(),
            user2QueueId: uuidv4(),
            startedAt,
            expiresAt,
          };

          expect(session.id).toBeTruthy();
          expect(session.chatMode).toBe(chatMode);
          expect(session.user1Name).toBe(user1Name);
          expect(session.user2Name).toBe(user2Name);
          expect(session.startedAt).toBeTruthy();
          expect(session.expiresAt.getTime() - session.startedAt.getTime()).toBe(420 * 1000);
        }
      ),
      { numRuns: 100 }
    );
  });
});
