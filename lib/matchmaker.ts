import { db } from './db';
import { queueEntries, sessions } from './db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const SESSION_DURATION_SECONDS = 420;
const POLL_INTERVAL_MS = 2000;

type ChatMode = 'text' | 'voice' | 'video';

export async function scanAndMatch(): Promise<void> {
  const modes: ChatMode[] = ['text', 'voice', 'video'];

  for (const mode of modes) {
    const waitingEntries = await db
      .select()
      .from(queueEntries)
      .where(
        and(
          eq(queueEntries.chatMode, mode),
          eq(queueEntries.status, 'waiting')
        )
      )
      .orderBy(asc(queueEntries.createdAt))
      .limit(2);

    if (waitingEntries.length < 2) continue;

    const [user1, user2] = waitingEntries;
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_SECONDS * 1000);

    await db.transaction(async (tx) => {
      await tx.insert(sessions).values({
        id: sessionId,
        chatMode: mode,
        user1Name: user1.userName,
        user2Name: user2.userName,
        user1QueueId: user1.id,
        user2QueueId: user2.id,
        startedAt: now,
        expiresAt,
      });

      await tx
        .update(queueEntries)
        .set({ status: 'matched', sessionId })
        .where(eq(queueEntries.id, user1.id));

      await tx
        .update(queueEntries)
        .set({ status: 'matched', sessionId })
        .where(eq(queueEntries.id, user2.id));
    });
  }
}

let workerInterval: ReturnType<typeof setInterval> | null = null;

export function startMatchmakerWorker(): void {
  if (workerInterval) return;
  workerInterval = setInterval(async () => {
    try {
      await scanAndMatch();
    } catch (error) {
      console.error('Matchmaker error:', error);
    }
  }, POLL_INTERVAL_MS);
}

export function stopMatchmakerWorker(): void {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
}

export { SESSION_DURATION_SECONDS };
