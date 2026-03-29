'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import SessionTimer from '@/components/SessionTimer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { LogOut, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const AgoraProvider = dynamic(() => import('@/components/AgoraProvider'), { ssr: false });
const TextChat = dynamic(() => import('@/components/TextChat'), { ssr: false });
const VoiceChat = dynamic(() => import('@/components/VoiceChat'), { ssr: false });
const VideoChat = dynamic(() => import('@/components/VideoChat'), { ssr: false });

interface SessionData {
  sessionId: string;
  channelName: string;
  rtcToken: string;
  rtmToken: string;
  rtcUid: number;
  expiresAt: string;
  chatMode: 'text' | 'voice' | 'video';
  userName: string;
}

const modeLabels = { text: '텍스트', voice: '음성', video: '영상' } as const;

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [connectionState, setConnectionState] = useState<string>('CONNECTING');
  const [peerLeft, setPeerLeft] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('sessionData');
    if (stored) {
      const data = JSON.parse(stored);
      if (data.sessionId === sessionId) {
        setSessionData(data);
        return;
      }
    }
    router.push('/');
  }, [sessionId, router]);

  const endSession = useCallback(async (reason: 'timer_expired' | 'user_left') => {
    try {
      await fetch('/api/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, reason }),
      });
    } catch (err) {
      console.error('Failed to end session:', err);
    }
    sessionStorage.removeItem('sessionData');
    sessionStorage.removeItem('queueEntryId');
    router.push('/ended');
  }, [sessionId, router]);

  const handleExpire = useCallback(() => {
    endSession('timer_expired');
  }, [endSession]);

  const handlePeerLeave = useCallback(() => {
    setPeerLeft(true);
    setTimeout(() => endSession('user_left'), 3000);
  }, [endSession]);

  const handleLeave = () => {
    endSession('user_left');
  };

  if (!sessionData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">세션 정보를 불러오는 중...</p>
      </main>
    );
  }

  const isConnected = connectionState === 'CONNECTED';

  return (
    <main className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            {isConnected ? (
              <Wifi data-icon="inline-start" className="text-emerald-500" />
            ) : (
              <WifiOff data-icon="inline-start" className="text-muted-foreground" />
            )}
            {modeLabels[sessionData.chatMode]} 채팅
          </Badge>
        </div>

        <SessionTimer expiresAt={sessionData.expiresAt} onExpire={handleExpire} />

        <Button variant="destructive" size="sm" onClick={handleLeave}>
          <LogOut data-icon="inline-start" />
          나가기
        </Button>
      </header>

      {/* Peer left notification */}
      {peerLeft && (
        <Alert variant="destructive" className="mx-4 mt-2">
          <AlertTriangle data-icon="inline-start" />
          상대방이 나갔습니다. 잠시 후 종료됩니다...
        </Alert>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <AgoraProvider
          channelName={sessionData.channelName}
          rtcToken={sessionData.rtcToken}
          rtmToken={sessionData.rtmToken}
          rtcUid={sessionData.rtcUid}
          chatMode={sessionData.chatMode}
          onPeerLeave={handlePeerLeave}
          onConnectionStateChange={setConnectionState}
        >
          {sessionData.chatMode === 'text' && <TextChat userName={sessionData.userName} />}
          {sessionData.chatMode === 'voice' && <VoiceChat />}
          {sessionData.chatMode === 'video' && <VideoChat />}
        </AgoraProvider>
      </div>
    </main>
  );
}
