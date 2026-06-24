import type { Artist, SearchResult, SongDetail } from '@shared/types';

const BASE = '/api';

async function apiFetch<T>(path: string): Promise<T> {
  const res  = await fetch(`${BASE}${path}`);
  const data = await res.json() as T | { error: string };
  if (!res.ok) {
    const err = data as { error: string };
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }
  return data as T;
}

export const api = {
  search: (q: string) =>
    apiFetch<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`),

  artist: (mbid: string) =>
    apiFetch<Artist>(`/artist/${mbid}`),

  song: (mbid: string, title: string, artist: string) =>
    apiFetch<SongDetail>(
      `/song/${mbid}?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
    ),
};

export const swrFetcher = (url: string) =>
  fetch(url).then(r => r.json());