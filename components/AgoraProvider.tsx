'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import AgoraRTM from 'agora-rtm';

type RTMClientInstance = InstanceType<typeof AgoraRTM.RTM>;

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

interface AgoraContextType {
  rtcClient: IAgoraRTCClient | null;
  rtmClient: RTMClientInstance | null;
  channelName: string;
}

const AgoraContext = createContext<AgoraContextType>({
  rtcClient: null,
  rtmClient: null,
  channelName: '',
});

export function useAgora() {
  return useContext(AgoraContext);
}

interface AgoraProviderProps {
  children: ReactNode;
  channelName: string;
  rtcToken: string;
  rtmToken: string;
  rtcUid: number;
  chatMode: 'text' | 'voice' | 'video';
  onPeerLeave?: () => void;
  onConnectionStateChange?: (state: string) => void;
}

export default function AgoraProvider({
  children,
  channelName,
  rtcToken,
  rtmToken,
  rtcUid,
  chatMode,
  onPeerLeave,
  onConnectionStateChange,
}: AgoraProviderProps) {
  const [rtcClient, setRtcClient] = useState<IAgoraRTCClient | null>(null);
  const [rtmClient, setRtmClient] = useState<RTMClientInstance | null>(null);

  useEffect(() => {
    let rtc: IAgoraRTCClient | null = null;
    let rtm: RTMClientInstance | null = null;
    let mounted = true;

    async function init() {
      // RTM v2 setup
      rtm = new AgoraRTM.RTM(APP_ID, String(rtcUid));

      rtm.addEventListener('status', (event: any) => {
        if (mounted && onConnectionStateChange) {
          onConnectionStateChange(event.state);
        }
      });

      rtm.addEventListener('presence', (event: any) => {
        if (event.eventType === 'REMOTE_LEAVE' || event.eventType === 'REMOTE_TIMEOUT') {
          if (mounted && onPeerLeave) onPeerLeave();
        }
      });

      await rtm.login({ token: rtmToken });
      await rtm.subscribe(channelName, {
        withMessage: true,
        withPresence: true,
      });

      if (mounted) setRtmClient(rtm);

      // RTC setup (for voice/video mode)
      if (chatMode !== 'text') {
        rtc = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

        rtc.on('connection-state-change', (curState) => {
          if (mounted && onConnectionStateChange) onConnectionStateChange(curState);
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
    }

    init().catch(console.error);

    return () => {
      mounted = false;
      rtm?.unsubscribe(channelName);
      rtm?.logout();
      rtc?.leave();
    };
  }, [channelName, rtcToken, rtmToken, rtcUid, chatMode, onPeerLeave, onConnectionStateChange]);

  return (
    <AgoraContext.Provider value={{ rtcClient, rtmClient, channelName }}>
      {children}
    </AgoraContext.Provider>
  );
}
