import { RtcTokenBuilder, RtcRole } from 'agora-token';

const APP_ID = process.env.AGORA_APP_ID || '';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';
const TOKEN_EXPIRY_SECONDS = 600;

export interface AgoraTokens {
  rtcToken: string;
  rtcUid: number;
  issuedAt: number;
  expiresAt: number;
}

export function generateAgoraTokens(channelName: string, uid: number): AgoraTokens {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + TOKEN_EXPIRY_SECONDS;

  const rtcToken = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    TOKEN_EXPIRY_SECONDS,
    TOKEN_EXPIRY_SECONDS
  );

  return {
    rtcToken,
    rtcUid: uid,
    issuedAt: currentTimestamp,
    expiresAt: privilegeExpiredTs,
  };
}

export { TOKEN_EXPIRY_SECONDS };
