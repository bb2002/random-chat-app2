import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queueEntries } from '@/lib/db/schema';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { validateUserName } from '@/lib/validation';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { turnstileToken, userName, chatMode } = body;

  // Turnstile verification
  if (!turnstileToken) {
    return NextResponse.json({ error: 'Turnstile 토큰이 필요합니다.' }, { status: 400 });
  }
  const isHuman = await verifyTurnstileToken(turnstileToken);
  if (!isHuman) {
    return NextResponse.json({ error: 'Turnstile 검증에 실패했습니다.' }, { status: 400 });
  }

  // Name validation
  const nameValidation = validateUserName(userName);
  if (!nameValidation.valid) {
    return NextResponse.json({ error: nameValidation.error }, { status: 400 });
  }

  // Chat mode validation
  if (!['text', 'voice', 'video'].includes(chatMode)) {
    return NextResponse.json({ error: '유효하지 않은 채팅 모드입니다.' }, { status: 400 });
  }

  const queueEntryId = uuidv4();
  await db.insert(queueEntries).values({
    id: queueEntryId,
    userName,
    chatMode,
    status: 'waiting',
  });

  return NextResponse.json({ queueEntryId });
}
