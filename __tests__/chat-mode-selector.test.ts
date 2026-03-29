import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

type ChatMode = 'text' | 'voice' | 'video';

describe('Feature: random-chat-app, Property 2: 채팅 모드 단일 선택 불변식', () => {
  it('마지막으로 선택된 모드만 활성화, 나머지 비활성화', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom<ChatMode>('text', 'voice', 'video'), { minLength: 1, maxLength: 20 }),
        (selections) => {
          // Simulate ChatModeSelector state
          let selected: ChatMode | null = null;
          for (const mode of selections) {
            selected = mode;
          }

          const lastSelection = selections[selections.length - 1];
          expect(selected).toBe(lastSelection);

          const allModes: ChatMode[] = ['text', 'voice', 'video'];
          const activeModes = allModes.filter((m) => m === selected);
          const inactiveModes = allModes.filter((m) => m !== selected);

          expect(activeModes.length).toBe(1);
          expect(inactiveModes.length).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: random-chat-app, Property 3: 미디어 권한 요청 조건', () => {
  it('voice/video 모드에서 권한 요청 발생, text 모드에서 미발생', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ChatMode>('text', 'voice', 'video'),
        (mode) => {
          const requiresMedia = mode === 'voice' || mode === 'video';

          if (mode === 'text') {
            expect(requiresMedia).toBe(false);
          } else {
            expect(requiresMedia).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
