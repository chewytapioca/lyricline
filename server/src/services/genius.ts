import * as cheerio from 'cheerio';
import { env } from '../lib/env.js';
import { cacheGet, cacheSet, CacheKey } from '../cache/redis.js';

const GENIUS_API = 'https://api.genius.com';
const GENIUS_HEADERS = {
  Authorization: `Bearer ${env.GENIUS_TOKEN}`,
};

// ── Artist image (for search results) ────────────────────────────────────────

export async function getArtistImageFromGenius(artistName: string): Promise<string | null> {
  const cacheKey = `genius:artist-img:${artistName.toLowerCase().trim()}`;
  const cached = await cacheGet<string>(cacheKey);
  if (cached !== null) return cached;

  try {
    const url = `${GENIUS_API}/search?q=${encodeURIComponent(artistName)}`;
    const res = await fetch(url, { headers: GENIUS_HEADERS });
    if (!res.ok) return null;

    const data = await res.json() as {
      response: {
        hits: Array<{
          result: {
            primary_artist: { name: string; image_url: string };
          };
        }>;
      };
    };

    const hits = data.response.hits;
    if (!hits.length) return null;

    const nameLower = artistName.toLowerCase();
    const best = hits.find(h =>
      h.result.primary_artist.name.toLowerCase().includes(nameLower) ||
      nameLower.includes(h.result.primary_artist.name.toLowerCase())
    ) ?? hits[0];

    const imageUrl = best?.result.primary_artist.image_url ?? null;
    if (imageUrl) await cacheSet(cacheKey, imageUrl, -1);
    return imageUrl;
  } catch {
    return null;
  }
}

// ── Lyric URL ─────────────────────────────────────────────────────────────────

export async function getLyricUrl(title: string, artist: string): Promise<string | null> {
  const cacheKey = CacheKey.songLyrics(`url:${title}:${artist}`);
  const cached   = await cacheGet<string>(cacheKey);
  if (cached !== null) return cached;

  const q   = `${title} ${artist}`;
  const url = `${GENIUS_API}/search?q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: GENIUS_HEADERS });
  if (!res.ok) return null;

  const data = await res.json() as {
    response: { hits: Array<{ result: { url: string; primary_artist: { name: string } } }> };
  };

  const hits = data.response.hits;
  if (!hits.length) return null;

  const artistLower = artist.toLowerCase();
  const match = hits.find(h =>
    h.result.primary_artist.name.toLowerCase().includes(artistLower) ||
    artistLower.includes(h.result.primary_artist.name.toLowerCase())
  ) ?? hits[0];

  const lyricUrl = match?.result.url ?? null;
  if (lyricUrl) await cacheSet(cacheKey, lyricUrl, -1);
  return lyricUrl;
}

// ── Lyric scrape ──────────────────────────────────────────────────────────────

export async function scrapeLyrics(lyricUrl: string): Promise<string | null> {
  const cacheKey = CacheKey.songLyrics(`scraped:${lyricUrl}`);
  const cached   = await cacheGet<string>(cacheKey);
  if (cached !== null) return cached;

  const res = await fetch(lyricUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; lyricline/0.1)' },
  });
  if (!res.ok) return null;

  const html = await res.text();
  const $    = cheerio.load(html);

  const parts: string[] = [];
  $('[data-lyrics-container="true"]').each((_, el) => {
    const container = $(el);
    container.find('br').replaceWith('\n');
    container.find('[class^="LyricsEditInfo"]').remove();
    container.find('[class^="InlineAnnotationContent"]').remove();
    const text = container.text().trim();
    if (text) parts.push(text);
  });

  const lyrics = parts.join('\n\n').trim() || null;
  if (lyrics) await cacheSet(cacheKey, lyrics, -1);
  return lyrics;
}