import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessionId, reason } = body;

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId가 필요합니다.' }, { status: 400 });
  }

  const validReasons = ['timer_expired', 'user_left'] as const;
  const terminationReason = validReasons.includes(reason) ? reason : 'user_left';

  await db
    .update(sessions)
    .set({
      endedAt: new Date(),
      terminationReason,
    })
    .where(eq(sessions.id, sessionId));

  return NextResponse.json({ success: true });
}
