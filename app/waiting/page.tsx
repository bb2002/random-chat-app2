'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function WaitingPage() {
  const router = useRouter();
  const [dots, setDots] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const queueEntryId = sessionStorage.getItem('queueEntryId');
    if (!queueEntryId) {
      router.push('/');
      return;
    }

    // Animate dots
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

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
      clearInterval(dotInterval);
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800">매칭 대기 중{dots}</h2>
          <p className="text-gray-500 mt-2">같은 방식을 선택한 상대방을 찾고 있습니다</p>
        </div>

        <button
          onClick={handleCancel}
          className="w-full border-2 border-gray-300 text-gray-600 rounded-lg py-3 font-semibold hover:bg-gray-50 transition"
        >
          취소
        </button>
      </div>
    </main>
  );
}
