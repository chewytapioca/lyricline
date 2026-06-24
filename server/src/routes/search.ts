import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { searchArtists } from '../services/musicbrainz.js';

export const searchRouter = Router();

const limiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true });

const querySchema = z.object({
  q: z.string().min(1).max(100).trim(),
});

searchRouter.get('/', limiter, async (req, res, next) => {
  try {
    const { q } = querySchema.parse(req.query);
    const results = await searchArtists(q);
    res.json(results);
  } catch (err) {
    next(err);
  }
});
