import type { CacheEntry } from '../../../shared/types.js';

const store = new Map<string, string>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = store.get(key);
  if (!raw) return null;
  const entry = JSON.parse(raw) as CacheEntry<T>;
  return entry.data;
}

export async function cacheSet<T>(key: string, data: T, _ttlMs: number): Promise<void> {
  const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
  store.set(key, JSON.stringify(entry));
}

export async function cacheDel(key: string): Promise<void> {
  store.delete(key);
}

export const CacheKey = {
  search:        (query: string)  => `search:${query.toLowerCase().trim()}`,
  artist:        (mbid: string)   => `artist:${mbid}`,
  artistByName:  (name: string)   => `artist-name:${name.toLowerCase().trim()}`,
  album:         (mbid: string)   => `album:${mbid}`,
  songLyrics:    (mbid: string)   => `lyrics:${mbid}`,
  songSentiment: (mbid: string)   => `sentiment:${mbid}`,
} as const;