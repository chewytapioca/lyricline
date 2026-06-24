import { Router } from 'express';
import { z } from 'zod';
import { getLyricUrl, scrapeLyrics } from '../services/genius.js';
import { analyseLyrics, aggregateSentiment } from '../services/sentiment.js';
import type { SongDetail } from '../../../shared/types.js';

export const songRouter = Router();

const paramsSchema = z.object({
  mbid: z.string().min(1),          // removed .uuid() — accepts any non-empty string
});

const querySchema = z.object({
  title:  z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
});

songRouter.get('/:mbid', async (req, res, next) => {
  try {
    const { mbid }          = paramsSchema.parse(req.params);
    const { title, artist } = querySchema.parse(req.query);

    console.log(`[song] fetching lyrics for "${title}" by "${artist}" (${mbid})`);

    // 1. Get lyric page URL from Genius
    const lyricUrl = await getLyricUrl(title, artist);
    if (!lyricUrl) {
      console.log(`[song] no lyric URL found for "${title}" by "${artist}"`);
      return res.status(404).json({ error: 'Lyrics not found', code: 'LYRICS_NOT_FOUND' });
    }

    console.log(`[song] lyric URL: ${lyricUrl}`);

    // 2. Scrape the actual lyrics
    const rawLyrics = await scrapeLyrics(lyricUrl);
    if (!rawLyrics) {
      console.log(`[song] scrape failed for ${lyricUrl}`);
      return res.status(404).json({ error: 'Could not scrape lyrics', code: 'SCRAPE_FAILED' });
    }

    console.log(`[song] got ${rawLyrics.length} chars of lyrics`);

    // 3. Run sentiment analysis
    const chunks = await analyseLyrics(mbid, rawLyrics);
    console.log(`[song] got ${chunks.length} chunks`);

    // 4. Collect unique languages
    const languages = [...new Set(chunks.map(c => c.language))].filter(l => l !== 'und');

    const detail: SongDetail = {
      id:         mbid,
      title,
      position:   0,
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