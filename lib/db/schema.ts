import { mysqlTable, varchar, int, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';

export const queueEntries = mysqlTable('queue_entries', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userName: varchar('user_name', { length: 20 }).notNull(),
  chatMode: mysqlEnum('chat_mode', ['text', 'voice', 'video']).notNull(),
  status: mysqlEnum('status', ['waiting', 'matched', 'cancelled']).notNull().default('waiting'),
  sessionId: varchar('session_id', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  chatMode: mysqlEnum('chat_mode', ['text', 'voice', 'video']).notNull(),
  user1Name: varchar('user1_name', { length: 20 }).notNull(),
  user2Name: varchar('user2_name', { length: 20 }).notNull(),
  user1QueueId: varchar('user1_queue_id', { length: 36 }).notNull(),
  user2QueueId: varchar('user2_queue_id', { length: 36 }).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  endedAt: timestamp('ended_at'),
  terminationReason: mysqlEnum('termination_reason', ['timer_expired', 'user_left']),
});
