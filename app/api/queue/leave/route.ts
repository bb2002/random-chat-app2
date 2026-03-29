import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queueEntries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queueEntryId = searchParams.get('queueEntryId');

  if (!queueEntryId) {
    return NextResponse.json({ error: 'queueEntryId가 필요합니다.' }, { status: 400 });
  }

  await db
    .update(queueEntries)
    .set({ status: 'cancelled' })
    .where(eq(queueEntries.id, queueEntryId));

  return NextResponse.json({ success: true });
}
