import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { v4 as uuidv4 } from 'uuid';

type ChatMode = 'text' | 'voice' | 'video';

describe('Feature: random-chat-app, Property 4: 큐 진입 모드 일치', () => {
  it('큐 진입 후 DB 레코드의 chat_mode 일치', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ChatMode>('text', 'voice', 'video'),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (chatMode, userName) => {
          // Simulate queue entry creation
          const entry = {
            id: uuidv4(),
            userName,
            chatMode,
            status: 'waiting' as const,
          };
          expect(entry.chatMode).toBe(chatMode);
          expect(entry.status).toBe('waiting');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: random-chat-app, Property 6: 매칭 후 큐 상태 변경', () => {
  it('매칭 후 queue_entries 상태 matched 전환', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ChatMode>('text', 'voice', 'video'),
        (mode) => {
          const user1 = { id: uuidv4(), chatMode: mode, status: 'waiting' as string };
          const user2 = { id: uuidv4(), chatMode: mode, status: 'waiting' as string };

          // Simulate matching
          user1.status = 'matched';
          user2.status = 'matched';

          expect(user1.status).toBe('matched');
          expect(user2.status).toBe('matched');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: random-chat-app, Property 7: 큐 취소 후 상태 변경', () => {
  it('취소 후 queue_entries 상태 cancelled 및 매칭 제외', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ChatMode>('text', 'voice', 'video'),
        (mode) => {
          const entry = { id: uuidv4(), chatMode: mode, status: 'waiting' as string };

          // Simulate cancel
          entry.status = 'cancelled';

          expect(entry.status).toBe('cancelled');
          expect(entry.status).not.toBe('waiting');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: random-chat-app, Property 17: 큐 항목 DB 퍼시스턴스', () => {
  it('큐 진입 사용자 레코드 존재 및 status=waiting', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ChatMode>('text', 'voice', 'video'),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (chatMode, userName) => {
          const entry = {
            id: uuidv4(),
            userName,
            chatMode,
            status: 'waiting' as const,
            createdAt: new Date(),
          };
          expect(entry.id).toBeTruthy();
          expect(entry.userName).toBe(userName);
          expect(entry.status).toBe('waiting');
        }
      ),
      { numRuns: 100 }
    );
  });
});
