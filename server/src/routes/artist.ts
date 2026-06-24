import { Router } from 'express';
import { z } from 'zod';
import { getAlbums } from '../services/musicbrainz.js';
import { cacheGet, cacheSet, CacheKey } from '../cache/redis.js';
import { env } from '../lib/env.js';
import type { Artist } from '../../../shared/types.js';

export const artistRouter = Router();

const paramsSchema = z.object({
  mbid: z.string().uuid(),
});

/**
 * GET /api/artist/:mbid
 * Returns artist metadata + full album/track list.
 * Sentiment scores are null at this stage — fetched lazily per-song.
 */
artistRouter.get('/:mbid', async (req, res, next) => {
  try {
    const { mbid } = paramsSchema.parse(req.params);

    const cacheKey = CacheKey.artist(mbid);
    const cached   = await cacheGet<Artist>(cacheKey);
    if (cached) return res.json(cached);

    const albums = await getAlbums(mbid);

    // Collect unique languages across all future sentiment results (empty for now)
    const artist: Artist = {
      id:        mbid,
      name:      '',        // caller should pass name via query param or we do a separate MB call
      sortName:  '',
      country:   null,
      genres:    [],
      albums,
      languages: [],
    };

    await cacheSet(cacheKey, artist, env.MB_CACHE_TTL_MS);
    return res.json(artist);
  } catch (err) {
    next(err);
  }
});
