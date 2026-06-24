/**
 * Genius lyric scraper
 *
 * Genius doesn't serve lyrics via their API — only page URLs.
 * Flow: search API → get song page URL → scrape lyrics with cheerio.
 *
 * Docs: https://docs.genius.com/
 */

import * as cheerio from 'cheerio';
import { env } from '../lib/env.js';
import { cacheGet, cacheSet, CacheKey } from '../cache/redis.js';

const GENIUS_API = 'https://api.genius.com';

// ── Search Genius for a song, return its page URL ─────────────────────────────

export async function getLyrics(
  songTitle: string,
  artistName: string,
): Promise<string | null> {
  const cacheKey = CacheKey.songLyrics(`${artistName}:${songTitle}`);
  const cached   = await cacheGet<string>(cacheKey);
  if (cached) return cached;

  const pageUrl = await findGeniusPageUrl(songTitle, artistName);
  if (!pageUrl) return null;

  const lyrics = await scrapeLyricsFromPage(pageUrl);
  if (!lyrics) return null;

  // Lyrics are deterministic — cache forever
  await cacheSet(cacheKey, lyrics, -1);
  return lyrics;
}

async function findGeniusPageUrl(
  songTitle: string,
  artistName: string,
): Promise<string | null> {
  const query = `${artistName} ${songTitle}`;
  const url   = `${GENIUS_API}/search?q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.GENIUS_TOKEN}` },
  });

  if (!res.ok) {
    console.warn(`[genius] search failed ${res.status} for: ${query}`);
    return null;
  }

  const data = await res.json() as GeniusSearchResponse;
  const hits  = data.response.hits;

  // Find the best match: prefer exact artist name match
  const best = hits.find(h =>
    h.type === 'song' &&
    h.result.primary_artist.name.toLowerCase().includes(artistName.toLowerCase())
  ) ?? hits[0];

  return best?.result.url ?? null;
}

async function scrapeLyricsFromPage(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; lyricline/0.1; +https://github.com/you/lyricline)',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const $    = cheerio.load(html);

    // Genius wraps lyrics in [data-lyrics-container="true"] divs
    const containers = $('[data-lyrics-container="true"]');
    if (!containers.length) return null;

    const lines: string[] = [];

    containers.each((_i, el) => {
      // Replace <br> with newlines before extracting text
      $(el).find('br').replaceWith('\n');

      // Skip annotation links but keep their text
      $(el).find('a').each((_j, a) => {
        $(a).replaceWith($(a).text());
      });

      const text = $(el).text();
      lines.push(text.trim());
    });

    const raw = lines
      .join('\n\n')
      .replace(/\[.*?\]/g, '')   // remove section headers like [Verse 1]
      .replace(/\n{3,}/g, '\n\n') // collapse excessive blank lines
      .trim();

    return raw.length > 20 ? raw : null;
  } catch (err) {
    console.warn('[genius] scrape error:', (err as Error).message);
    return null;
  }
}

// ── Genius API types (partial) ────────────────────────────────────────────────

interface GeniusSearchResponse {
  response: {
    hits: Array<{
      type: string;
      result: {
        url:             string;
        title:           string;
        primary_artist:  { name: string };
      };
    }>;
  };
}
