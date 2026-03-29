'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TurnstileWidget from '@/components/TurnstileWidget';
import ChatModeSelector from '@/components/ChatModeSelector';
import { validateUserName } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from '@/components/ui/field';
import { MessageCircle, AlertCircle } from 'lucide-react';

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
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <MessageCircle className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">랜덤 채팅</CardTitle>
          <CardDescription>낯선 사람과 7분간 익명으로 대화하세요</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Turnstile */}
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
            <Alert variant="destructive">
              <AlertCircle data-icon="inline-start" />
              봇 검증에 실패했습니다. 페이지를 새로고침해주세요.
            </Alert>
          )}

          {/* Form */}
          {turnstileToken && (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="userName">이름</FieldLabel>
                <Input
                  id="userName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  maxLength={20}
                  placeholder="이름을 입력하세요 (1-20자)"
                />
              </Field>

              <Field>
                <FieldLabel>채팅 방식</FieldLabel>
                <ChatModeSelector selected={chatMode} onSelect={setChatMode} />
              </Field>

              {error && (
                <FieldError>{error}</FieldError>
              )}
            </FieldGroup>
          )}
        </CardContent>

        {turnstileToken && (
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handleStart}
              disabled={loading}
            >
              {loading && <Spinner data-icon="inline-start" />}
              {loading ? '연결 중...' : '시작하기'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
