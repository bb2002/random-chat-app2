import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';

// Mock agora-token library
vi.mock('agora-token', () => ({
  RtcTokenBuilder: {
    buildTokenWithUid: vi.fn().mockReturnValue('mock-rtc-token'),
  },
  RtcRole: { PUBLISHER: 1 },
}));

import { generateAgoraTokens, TOKEN_EXPIRY_SECONDS } from '@/lib/agora-token';

describe('Feature: random-chat-app, Property 9: 토큰 만료 시각', () => {
  it('토큰 만료 시각은 발급 시각 + 600초', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.integer({ min: 1, max: 10000 }),
        (channelName, uid) => {
          const tokens = generateAgoraTokens(channelName, uid);
          expect(tokens.expiresAt - tokens.issuedAt).toBe(TOKEN_EXPIRY_SECONDS);
          expect(TOKEN_EXPIRY_SECONDS).toBe(600);
        }
      ),
      { numRuns: 100 }
    );
  });
});
