import { env } from '../lib/env.js';
import { cacheGet, cacheSet, CacheKey } from '../cache/redis.js';
import type { Album, AlbumType, Song, SearchResult } from '../../../shared/types.js';

const MB_BASE    = 'https://musicbrainz.org/ws/2';
const MB_HEADERS = {
  'User-Agent': 'lyricline/0.1 (https://github.com/chewytapioca/lyricline)',
  'Accept':     'application/json',
};

// MB enforces 1 req/s — queue-based so parallel calls don't race
let _queue = Promise.resolve();
function mbRateLimited<T>(fn: () => Promise<T>): Promise<T> {
  const next = _queue.then(() => fn()).finally(() => {});
  _queue = next.then(() => delay(1100)).catch(() => delay(1100));
  return next;
}

function delay(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

async function mbFetch<T>(path: string): Promise<T> {
  return mbRateLimited(async () => {
    const res = await fetch(`${MB_BASE}${path}`, { headers: MB_HEADERS });
    if (!res.ok) throw new Error(`MusicBrainz ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface MBArtistSearch {
  artists: Array<{
    id: string; name: string; 'sort-name': string;
    country?: string; tags?: Array<{ name: string; count: number }>;
  }>;
}
interface MBReleaseGroup {
  id: string; title: string;
  'first-release-date': string;
  'primary-type': string; 'secondary-types'?: string[];
}
interface MBReleaseGroupList {
  'release-groups': MBReleaseGroup[];
  'release-group-count': number;
}
interface MBRelease {
  id: string; title: string;
  media: Array<{ tracks: Array<{
    id: string; number: string; title: string;
    recording: { id: string }; length: number | null;
  }>; }>;
}
interface MBReleaseList { releases: MBRelease[]; }
interface MBCoverArt { images: Array<{ thumbnails: { '250': string; '500': string } }>; }

// ── Public API ────────────────────────────────────────────────────────────────

export async function searchArtists(query: string): Promise<SearchResult[]> {
  const cached = await cacheGet<SearchResult[]>(CacheKey.search(query));
  if (cached) return cached;

  const data = await mbFetch<MBArtistSearch>(
    `/artist?query=${encodeURIComponent(query)}&limit=5&fmt=json`
  );

  const results: SearchResult[] = data.artists.map(a => ({
    id:         a.id,
    name:       a.name,
    country:    a.country ?? null,
    genres:     (a.tags ?? []).sort((x,y) => y.count - x.count).slice(0,4).map(t => t.name),
    albumCount: 0,
    imageUrl:   null,
  }));

  await cacheSet(CacheKey.search(query), results, env.MB_CACHE_TTL_MS);
  return results;
}

export async function getAlbums(artistMbid: string): Promise<Album[]> {
  const cacheKey = CacheKey.album(`list:${artistMbid}`);
  const cached   = await cacheGet<Album[]>(cacheKey);
  if (cached) return cached;

  const data = await mbFetch<MBReleaseGroupList>(
    `/release-group?artist=${artistMbid}&type=album|ep&fmt=json&limit=100`
  );

  const groups = data['release-groups']
    .filter(rg => rg['first-release-date'])
    .sort((a, b) => a['first-release-date'].localeCompare(b['first-release-date']));

  // Process in batches of 3 — respects MB rate limit via queue, but
  // 3 albums can be fetched "concurrently" through the queue instead of waiting serially
  const albums: Album[] = [];
  const BATCH = 3;
  for (let i = 0; i < groups.length; i += BATCH) {
    const batch = groups.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(rg => getReleaseGroupAlbum(rg)));
    albums.push(...results.filter((a): a is Album => a !== null));
  }

  await cacheSet(cacheKey, albums, env.MB_CACHE_TTL_MS);
  return albums;
}

async function getReleaseGroupAlbum(rg: MBReleaseGroup): Promise<Album | null> {
  try {
    const releaseList = await mbFetch<MBReleaseList>(
      `/release?release-group=${rg.id}&status=official&fmt=json&inc=recordings&limit=1`
    );
    const release = releaseList.releases[0];
    if (!release) return null;

    const songs: Song[] = release.media.flatMap(m => m.tracks).map((t, i) => ({
      id: t.recording.id, title: t.title, position: i + 1,
      durationMs: t.length ?? null, sentiment: null, languages: [],
    }));

    // Cover art archive has no rate limit — fetch in parallel, don't block
    const coverUrl = await fetch(
      `https://coverartarchive.org/release-group/${rg.id}`,
      { headers: { 'User-Agent': MB_HEADERS['User-Agent'] } }
    ).then(r => r.ok ? r.json() as Promise<MBCoverArt> : null)
     .then(d => d?.images[0]?.thumbnails['500'] ?? null)
     .catch(() => null);

    const year = parseInt(rg['first-release-date'].slice(0, 4), 10);
    return {
      id: rg.id, title: rg.title,
      year: isNaN(year) ? 0 : year,
      type: normaliseType(rg['primary-type'], rg['secondary-types']),
      coverUrl, songs, sentimentBreakdown: null, dominantMood: null,
    };
  } catch (err) {
    console.warn(`[mb] skip ${rg.id}:`, (err as Error).message);
    return null;
  }
}

function normaliseType(primary: string, secondary?: string[]): AlbumType {
  if (secondary?.includes('Compilation')) return 'Compilation';
  switch (primary) {
    case 'Album': return 'Album';
    case 'Single': return 'Single';
    case 'EP': return 'EP';
    default: return 'Other';
  }
}