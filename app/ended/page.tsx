'use client';

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
import { RotateCcw } from 'lucide-react';

export default function EndedPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-muted text-3xl">
            👋
          </div>
          <CardTitle className="text-2xl">채팅이 종료되었습니다</CardTitle>
          <CardDescription>
            대화를 즐기셨나요? 새로운 사람과 다시 대화해보세요!
          </CardDescription>
        </CardHeader>

        <CardFooter>
          <Button className="w-full" size="lg" onClick={() => router.push('/')}>
            <RotateCcw data-icon="inline-start" />
            새 채팅 시작하기
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
