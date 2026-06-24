import { Router } from 'express';
import { z } from 'zod';
import { cacheGet } from '../cache/redis.js';
import { CacheKey } from '../cache/redis.js';
import type { Album } from '../../../shared/types.js';

export const albumRouter = Router();

const paramsSchema = z.object({
  mbid: z.string().uuid(),
});

/**
 * GET /api/album/:mbid
 * Returns a single album (from cache). Albums are populated by /api/artist first.
 */
albumRouter.get('/:mbid', async (req, res, next) => {
  try {
    const { mbid } = paramsSchema.parse(req.params);
    const cached   = await cacheGet<Album>(CacheKey.album(mbid));

    if (!cached) {
      return res.status(404).json({ error: 'Album not found', code: 'ALBUM_NOT_FOUND' });
    }

    return res.json(cached);
  } catch (err) {
    next(err);
  }
});
