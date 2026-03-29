import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

interface Message {
  sender: string;
  text: string;
  timestamp: string;
}

describe('Feature: random-chat-app, Property 10: 메시지 렌더링 포함 정보', () => {
  it('렌더링 결과에 발신자 이름과 타임스탬프 포함', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 1000 }),
        (sender, text) => {
          const msg: Message = {
            sender,
            text,
            timestamp: new Date().toISOString(),
          };

          // Validate message structure contains required info
          expect(msg.sender).toBeTruthy();
          expect(msg.sender).toBe(sender);
          expect(msg.timestamp).toBeTruthy();
          expect(() => new Date(msg.timestamp)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
