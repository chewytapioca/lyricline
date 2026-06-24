import { Router } from 'express';
import { z } from 'zod';
import { getLyrics } from '../services/genius.js';
import { analyseLyrics, aggregateSentiment } from '../services/sentiment.js';
import type { SongDetail } from '../../../shared/types.js';

export const songRouter = Router();

const paramsSchema = z.object({
  mbid: z.string().uuid(),
});

const querySchema = z.object({
  title:  z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
});

/**
 * GET /api/song/:mbid?title=...&artist=...
 *
 * Returns full song detail including lyric chunks with per-chunk sentiment.
 * This is the expensive endpoint — results are cached permanently.
 */
songRouter.get('/:mbid', async (req, res, next) => {
  try {
    const { mbid }          = paramsSchema.parse(req.params);
    const { title, artist } = querySchema.parse(req.query);

    // 1. Fetch lyrics from Genius
    const rawLyrics = await getLyrics(title, artist);
    if (!rawLyrics) {
      return res.status(404).json({ error: 'Lyrics not found', code: 'LYRICS_NOT_FOUND' });
    }

    // 2. Run sentiment analysis (chunked, multilingual)
    const chunks = await analyseLyrics(mbid, rawLyrics);

    // 3. Detect languages present
    const languages = [...new Set(chunks.map(c => c.language))].filter(l => l !== 'und');

    const detail: SongDetail = {
      id:         mbid,
      title,
      position:   0,   // populated by the caller from album data
      durationMs: null,
      sentiment:  aggregateSentiment(chunks),
      languages,
      chunks,
      rawLyrics,
    };

    return res.json(detail);
  } catch (err) {
    next(err);
  }
});
