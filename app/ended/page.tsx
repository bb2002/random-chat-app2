'use client';

import { useRouter } from 'next/navigation';

export default function EndedPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="text-5xl">👋</div>
        <h2 className="text-2xl font-bold text-gray-800">채팅이 종료되었습니다</h2>
        <p className="text-gray-500">대화를 즐기셨나요? 새로운 사람과 다시 대화해보세요!</p>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-blue-500 text-white rounded-lg py-3 font-semibold hover:bg-blue-600 transition"
        >
          새 채팅 시작하기
        </button>
      </div>
    </main>
  );
}
