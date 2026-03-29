'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import SessionTimer from '@/components/SessionTimer';

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
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">세션 정보를 불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${
            connectionState === 'CONNECTED' ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
          <span className="text-sm text-gray-600">
            {sessionData.chatMode === 'text' ? '텍스트' : sessionData.chatMode === 'voice' ? '음성' : '영상'} 채팅
          </span>
        </div>
        <SessionTimer expiresAt={sessionData.expiresAt} onExpire={handleExpire} />
        <button
          onClick={handleLeave}
          className="text-red-500 text-sm font-semibold hover:text-red-600 transition"
        >
          나가기
        </button>
      </header>

      {/* Peer left notification */}
      {peerLeft && (
        <div className="bg-yellow-100 text-yellow-800 text-center py-2 text-sm">
          상대방이 나갔습니다. 잠시 후 종료됩니다...
        </div>
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
