import { defineConfig } from 'drizzle-kit';
import * as fs from 'fs';
import * as path from 'path';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'random_chat',
    ssl: {
      ca: fs.readFileSync(path.resolve(process.cwd(), 'server-ca.pem')).toString(),
    },
  },
});
