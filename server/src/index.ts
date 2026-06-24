import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { artistRouter } from './routes/artist.js';
import { albumRouter } from './routes/album.js';
import { songRouter } from './routes/song.js';
import { searchRouter } from './routes/search.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { env } from './lib/env.js';


const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json());
app.use(requestLogger);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/search',      searchRouter);
app.use('/api/artist',      artistRouter);
app.use('/api/album',       albumRouter);
app.use('/api/song',        songRouter);

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// ── Error handler (must be last) ───────────────────────────────────────────────
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`✦ lyricline server running on http://localhost:${env.PORT}`);
});
