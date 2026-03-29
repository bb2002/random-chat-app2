import { NextRequest, NextResponse } from 'next/server';
import { generateAgoraTokens } from '@/lib/agora-token';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { channelName, uid } = body;

  if (!channelName || uid === undefined) {
    return NextResponse.json({ error: 'channelName과 uid가 필요합니다.' }, { status: 400 });
  }

  try {
    const tokens = generateAgoraTokens(channelName, uid);
    return NextResponse.json(tokens);
  } catch (error) {
    return NextResponse.json({ error: '토큰 생성에 실패했습니다.' }, { status: 500 });
  }
}
