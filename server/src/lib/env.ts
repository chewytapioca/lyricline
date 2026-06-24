import { z } from 'zod';

const schema = z.object({
  PORT:              z.coerce.number().default(3001),
  CLIENT_ORIGIN:     z.string().default('http://localhost:5173'),
  REDIS_URL:         z.string().default('redis://localhost:6379'),
  GENIUS_TOKEN:      z.string().min(1, 'GENIUS_TOKEN is required'),
  // How long to keep MusicBrainz responses cached (ms). Default: 24 h.
  MB_CACHE_TTL_MS:   z.coerce.number().default(86_400_000),
  // Sentiment results never expire by default (deterministic).
  SENT_CACHE_TTL_MS: z.coerce.number().default(-1),
  NODE_ENV:          z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
