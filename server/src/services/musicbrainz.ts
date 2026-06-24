/**
 * MusicBrainz API wrapper
 *
 * Docs: https://musicbrainz.org/doc/MusicBrainz_API
 * Rate limit: 1 request/second — we add a 1.1 s delay between calls.
 * No auth required for read-only access.
 */

import { env } from '../lib/env.js';
import { cacheGet, cacheSet, CacheKey } from '../cache/redis.js';
import type { Album, AlbumType, Song, SearchResult } from '../../../shared/types.js';

const MB_BASE    = 'https://musicbrainz.org/ws/2';
const MB_HEADERS = {
  'User-Agent': 'lyricline/0.1 (https://github.com/you/lyricline)',
  'Accept':     'application/json',
};

// MusicBrainz enforces 1 req/s. We stay just under.
let _lastCall = 0;
async function rateLimitedFetch(url: string): Promise<Response> {
  const now  = Date.now();
  const wait = Math.max(0, 1100 - (now - _lastCall));
  if (wait > 0) await delay(wait);
  _lastCall = Date.now();
  return fetch(url, { headers: MB_HEADERS });
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function mbFetch<T>(path: string): Promise<T> {
  const res = await rateLimitedFetch(`${MB_BASE}${path}`);
  if (!res.ok) throw new Error(`MusicBrainz error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ── Types mirroring MB JSON responses (partial) ───────────────────────────────

interface MBArtistSearchResult {
  artists: Array<{
    id:         string;
    name:       string;
    'sort-name': string;
    country?:   string;
    tags?:      Array<{ name: string; count: number }>;
  }>;
}

interface MBReleaseGroup {
  id:                   string;
  title:                string;
  'first-release-date': string;
  'primary-type':       string;
  'secondary-types'?:   string[];
}

interface MBReleaseGroupList {
  'release-groups': MBReleaseGroup[];
  'release-group-count': number;
}

interface MBRelease {
  id:     string;
  title:  string;
  media:  Array<{
    tracks: Array<{
      id:         string;
      number:     string;
      title:      string;
      recording:  { id: string };
      length:     number | null;
    }>;
  }>;
}

interface MBReleaseList {
  releases: MBRelease[];
}

interface MBCoverArt {
  images: Array<{ thumbnails: { '250': string; '500': string } }>;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Search for artists by name. Returns top 5 matches. */
export async function searchArtists(query: string): Promise<SearchResult[]> {
  const cacheKey = CacheKey.search(query);
  const cached   = await cacheGet<SearchResult[]>(cacheKey);
  if (cached) return cached;

  const data = await mbFetch<MBArtistSearchResult>(
    `/artist?query=${encodeURIComponent(query)}&limit=5&fmt=json`
  );

  const results: SearchResult[] = data.artists.map(a => ({
    id:         a.id,
    name:       a.name,
    country:    a.country ?? null,
    genres:     (a.tags ?? [])
                  .sort((x, y) => y.count - x.count)
                  .slice(0, 4)
                  .map(t => t.name),
    albumCount: 0, // filled in lazily
  }));

  await cacheSet(cacheKey, results, env.MB_CACHE_TTL_MS);
  return results;
}

/** Fetch all studio albums + EPs for an artist MBID. */
export async function getAlbums(artistMbid: string): Promise<Album[]> {
  const cacheKey = CacheKey.album(`list:${artistMbid}`);
  const cached   = await cacheGet<Album[]>(cacheKey);
  if (cached) return cached;

  // 1. Get release groups
  const data = await mbFetch<MBReleaseGroupList>(
    `/release-group?artist=${artistMbid}&type=album|ep&fmt=json&limit=100`
  );

  const groups = data['release-groups']
    .filter(rg => rg['first-release-date'])
    .sort((a, b) =>
      a['first-release-date'].localeCompare(b['first-release-date'])
    );

  // 2. For each group, get tracks from the canonical release
  const albums: Album[] = [];
  for (const rg of groups) {
    const album = await getReleaseGroupAlbum(rg);
    if (album) albums.push(album);
  }

  await cacheSet(cacheKey, albums, env.MB_CACHE_TTL_MS);
  return albums;
}

async function getReleaseGroupAlbum(rg: MBReleaseGroup): Promise<Album | null> {
  try {
    // Get the first official release for this release group
    const releaseList = await mbFetch<MBReleaseList>(
      `/release?release-group=${rg.id}&status=official&fmt=json&inc=recordings&limit=1`
    );

    const release = releaseList.releases[0];
    if (!release) return null;

    const songs: Song[] = release.media
      .flatMap(m => m.tracks)
      .map((t, i) => ({
        id:         t.recording.id,
        title:      t.title,
        position:   i + 1,
        durationMs: t.length ?? null,
        sentiment:  null,
        languages:  [],
      }));

    const coverUrl = await getCoverArt(rg.id);
    const year     = parseInt(rg['first-release-date'].slice(0, 4), 10);
    const type     = normaliseType(rg['primary-type'], rg['secondary-types']);

    const album: Album = {
      id:    rg.id,
      title: rg.title,
      year:  isNaN(year) ? 0 : year,
      type,
      coverUrl,
      songs,
      sentimentBreakdown: null,
      dominantMood: null,
    };

    return album;
  } catch (err) {
    console.warn(`[mb] skipping release group ${rg.id}:`, (err as Error).message);
    return null;
  }
}

async function getCoverArt(releaseGroupMbid: string): Promise<string | null> {
  try {
    const res = await rateLimitedFetch(
      `https://coverartarchive.org/release-group/${releaseGroupMbid}`
    );
    if (!res.ok) return null;
    const data = await res.json() as MBCoverArt;
    return data.images[0]?.thumbnails['500'] ?? null;
  } catch {
    return null;
  }
}

function normaliseType(primary: string, secondary?: string[]): AlbumType {
  if (secondary?.includes('Compilation')) return 'Compilation';
  switch (primary) {
    case 'Album':  return 'Album';
    case 'Single': return 'Single';
    case 'EP':     return 'EP';
    default:       return 'Other';
  }
}
