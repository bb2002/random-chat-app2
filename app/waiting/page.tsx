'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { X } from 'lucide-react';

export default function WaitingPage() {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const queueEntryId = sessionStorage.getItem('queueEntryId');
    if (!queueEntryId) {
      router.push('/');
      return;
    }

    // Elapsed time counter
    const timerInterval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    // Poll for match status
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/queue/status?queueEntryId=${queueEntryId}`);
        const data = await res.json();

        if (data.status === 'matched' && data.sessionId) {
          sessionStorage.setItem('sessionData', JSON.stringify(data));
          router.push(`/chat/${data.sessionId}`);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => {
      clearInterval(timerInterval);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router]);

  const handleCancel = async () => {
    const queueEntryId = sessionStorage.getItem('queueEntryId');
    if (queueEntryId) {
      await fetch(`/api/queue/leave?queueEntryId=${queueEntryId}`, { method: 'DELETE' });
      sessionStorage.removeItem('queueEntryId');
    }
    router.push('/');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Spinner className="size-10" />
          </div>
          <CardTitle className="text-2xl">매칭 대기 중</CardTitle>
          <CardDescription>
            같은 방식을 선택한 상대방을 찾고 있습니다
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="font-mono text-sm text-muted-foreground tabular-nums">
            대기 시간: {Math.floor(elapsed / 60)}분 {elapsed % 60}초
          </p>
        </CardContent>

        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCancel}
          >
            <X data-icon="inline-start" />
            취소
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
