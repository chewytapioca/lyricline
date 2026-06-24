import { Router } from 'express';
import { z } from 'zod';
import { getAlbums } from '../services/musicbrainz.js';
import { cacheGet, cacheSet, CacheKey } from '../cache/redis.js';
import { env } from '../lib/env.js';
import type { Artist } from '../../../shared/types.js';

export const artistRouter = Router();

const paramsSchema = z.object({ mbid: z.string().min(1) });
const querySchema  = z.object({ name: z.string().optional() });

artistRouter.get('/:mbid', async (req, res, next) => {
  try {
    const { mbid } = paramsSchema.parse(req.params);
    const { name } = querySchema.parse(req.query);

    const cacheKey = CacheKey.artist(mbid);
    const cached   = await cacheGet<Artist>(cacheKey);
    if (cached) {
      // patch name if it was empty when originally cached
      if (name && !cached.name) cached.name = name;
      return res.json(cached);
    }

    const albums = await getAlbums(mbid);

    const artist: Artist = {
      id:        mbid,
      name:      name ?? '',
      sortName:  name ?? '',
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