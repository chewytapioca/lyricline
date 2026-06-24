import { Router } from 'express';
import { searchArtists } from '../services/musicbrainz.js';
import { getArtistImageFromGenius } from '../services/genius.js';

export const searchRouter = Router();

searchRouter.get('/', async (req, res, next) => {
  try {
    const q = String(req.query['q'] ?? '').trim();
    if (!q) { res.json([]); return; }

    // MusicBrainz results — this is the core, must succeed
    const results = await searchArtists(q);

    // Enrich with Genius images — parallel, 2s timeout per artist, never throws
    const withImages = await Promise.all(
      results.map(async (r) => {
        try {
          const imageUrl = await Promise.race([
            getArtistImageFromGenius(r.name),
            new Promise<null>(resolve => setTimeout(() => resolve(null), 2000)),
          ]);
          return { ...r, imageUrl };
        } catch {
          return { ...r, imageUrl: null };
        }
      })
    );

    res.json(withImages);
  } catch (err) {
    next(err);
  }
});