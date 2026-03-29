import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queueEntries, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateAgoraTokens } from '@/lib/agora-token';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queueEntryId = searchParams.get('queueEntryId');

  if (!queueEntryId) {
    return NextResponse.json({ error: 'queueEntryId가 필요합니다.' }, { status: 400 });
  }

  const entries = await db
    .select()
    .from(queueEntries)
    .where(eq(queueEntries.id, queueEntryId))
    .limit(1);

  if (entries.length === 0) {
    return NextResponse.json({ error: '큐 항목을 찾을 수 없습니다.' }, { status: 404 });
  }

  const entry = entries[0];

  if (entry.status !== 'matched' || !entry.sessionId) {
    return NextResponse.json({ status: entry.status });
  }

  const sessionRows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, entry.sessionId))
    .limit(1);

  if (sessionRows.length === 0) {
    return NextResponse.json({ status: 'waiting' });
  }

  const session = sessionRows[0];

  // Determine UID based on user position in session
  const uid = entry.id === session.user1QueueId ? 1 : 2;

  try {
    const tokens = generateAgoraTokens(session.id, uid);
    return NextResponse.json({
      status: 'matched',
      sessionId: session.id,
      channelName: session.id,
      rtcToken: tokens.rtcToken,
      rtmToken: tokens.rtmToken,
      rtcUid: tokens.rtcUid,
      expiresAt: session.expiresAt.toISOString(),
      chatMode: session.chatMode,
      userName: entry.userName,
    });
  } catch (error) {
    // Token generation failed: rollback session and queue entries
    await db.delete(sessions).where(eq(sessions.id, session.id));
    await db
      .update(queueEntries)
      .set({ status: 'waiting', sessionId: null })
      .where(eq(queueEntries.id, session.user1QueueId));
    await db
      .update(queueEntries)
      .set({ status: 'waiting', sessionId: null })
      .where(eq(queueEntries.id, session.user2QueueId));

    return NextResponse.json({ status: 'waiting' });
  }
}
