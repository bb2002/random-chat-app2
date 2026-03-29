import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateUserName, validateMessageLength } from '@/lib/validation';

describe('Feature: random-chat-app, Property 1: 이름 유효성 검사', () => {
  it('길이 1-20자인 문자열은 유효한 이름으로 수락', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
        (name) => {
          const result = validateUserName(name);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('빈 문자열은 거부', () => {
    const result = validateUserName('');
    expect(result.valid).toBe(false);
  });

  it('공백만으로 구성된 문자열은 거부', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }).map((n) => ' '.repeat(n)),
        (name) => {
          const result = validateUserName(name);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('21자 이상의 문자열은 거부', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 21, maxLength: 100 }),
        (name) => {
          const result = validateUserName(name);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: random-chat-app, Property 11: 메시지 길이 유효성 검사', () => {
  it('1-1000자 메시지는 허용', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 1000 }),
        (msg) => {
          const result = validateMessageLength(msg);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('1001자 이상 메시지는 차단', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1001, maxLength: 2000 }),
        (msg) => {
          const result = validateMessageLength(msg);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('빈 메시지는 차단', () => {
    const result = validateMessageLength('');
    expect(result.valid).toBe(false);
  });
});
