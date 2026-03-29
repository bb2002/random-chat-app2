'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TurnstileWidget from '@/components/TurnstileWidget';
import ChatModeSelector from '@/components/ChatModeSelector';
import { validateUserName } from '@/lib/validation';

type ChatMode = 'text' | 'voice' | 'video';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export default function LandingPage() {
  const router = useRouter();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);
  const [userName, setUserName] = useState('');
  const [chatMode, setChatMode] = useState<ChatMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setError(null);

    const nameValidation = validateUserName(userName);
    if (!nameValidation.valid) {
      setError(nameValidation.error || null);
      return;
    }

    if (!chatMode) {
      setError('채팅 방식을 선택해주세요.');
      return;
    }

    if (chatMode === 'voice' || chatMode === 'video') {
      try {
        const constraints: MediaStreamConstraints = {
          audio: true,
          video: chatMode === 'video',
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        setError('미디어 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnstileToken: turnstileToken || 'bypass',
          userName,
          chatMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '큐 진입에 실패했습니다.');
        return;
      }

      sessionStorage.setItem('queueEntryId', data.queueEntryId);
      sessionStorage.setItem('userName', userName);
      sessionStorage.setItem('chatMode', chatMode);
      router.push('/waiting');
    } catch {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">랜덤 채팅</h1>
          <p className="text-gray-500 mt-2">낯선 사람과 7분간 익명으로 대화하세요</p>
        </div>

        {!turnstileToken && !turnstileError && (
          <div className="flex justify-center">
            <TurnstileWidget
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileError(true)}
            />
          </div>
        )}

        {turnstileError && (
          <p className="text-red-500 text-center text-sm">
            봇 검증에 실패했습니다. 페이지를 새로고침해주세요.
          </p>
        )}

        {turnstileToken && (
          <>
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                maxLength={20}
                placeholder="이름을 입력하세요 (1-20자)"
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                채팅 방식
              </label>
              <ChatModeSelector selected={chatMode} onSelect={setChatMode} />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full bg-blue-500 text-white rounded-lg py-3 font-semibold hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? '연결 중...' : '시작하기'}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
