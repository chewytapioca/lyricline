import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import type { SongDetail } from '@shared/types';

interface UseSongResult {
  song:    SongDetail | null;
  loading: boolean;
  error:   string | null;
  fetch:   (mbid: string, title: string, artist: string) => Promise<void>;
  clear:   () => void;
}

/**
 * Lazy song loader — only fires when the user clicks a track.
 * This is intentional: sentiment analysis is expensive and we don't
 * want to run it for every song on page load.
 */
export function useSong(): UseSongResult {
  const [song,    setSong]    = useState<SongDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchSong = useCallback(async (
    mbid:   string,
    title:  string,
    artist: string,
  ) => {
    setLoading(true);
    setError(null);
    setSong(null);

    try {
      const detail = await api.song(mbid, title, artist);
      setSong(detail);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setSong(null);
    setError(null);
  }, []);

  return { song, loading, error, fetch: fetchSong, clear };
}
