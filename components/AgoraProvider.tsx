'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng';

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

interface AgoraContextType {
  rtcClient: IAgoraRTCClient | null;
  channelName: string;
}

const AgoraContext = createContext<AgoraContextType>({
  rtcClient: null,
  channelName: '',
});

export function useAgora() {
  return useContext(AgoraContext);
}

interface AgoraProviderProps {
  children: ReactNode;
  channelName: string;
  rtcToken: string;
  rtcUid: number;
  chatMode: 'voice' | 'video';
  onPeerLeave?: () => void;
  onConnectionStateChange?: (state: string) => void;
}

export default function AgoraProvider({
  children,
  channelName,
  rtcToken,
  rtcUid,
  chatMode,
  onPeerLeave,
  onConnectionStateChange,
}: AgoraProviderProps) {
  const [rtcClient, setRtcClient] = useState<IAgoraRTCClient | null>(null);

  useEffect(() => {
    let rtc: IAgoraRTCClient | null = null;
    let mounted = true;

    async function init() {
      rtc = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      rtc.on('connection-state-change', (curState) => {
        if (mounted && onConnectionStateChange) onConnectionStateChange(curState);
      });

      rtc.on('user-left', () => {
        if (mounted && onPeerLeave) onPeerLeave();
      });

      rtc.on('token-privilege-will-expire', async () => {
        try {
          const resp = await fetch('/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelName, uid: rtcUid }),
          });
          const data = await resp.json();
          await rtc?.renewToken(data.rtcToken);
        } catch (err) {
          console.error('Token renewal failed:', err);
        }
      });

      await rtc.join(APP_ID, channelName, rtcToken, rtcUid);
      if (mounted) setRtcClient(rtc);
    }

    init().catch(console.error);

    return () => {
      mounted = false;
      rtc?.leave();
    };
  }, [channelName, rtcToken, rtcUid, chatMode, onPeerLeave, onConnectionStateChange]);

  return (
    <AgoraContext.Provider value={{ rtcClient, channelName }}>
      {children}
    </AgoraContext.Provider>
  );
}
