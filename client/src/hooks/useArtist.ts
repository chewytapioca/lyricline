import useSWR from 'swr';
import { swrFetcher } from '../lib/api';
import type { Artist } from '@shared/types';

export function useArtist(mbid: string | null) {
  const { data, error, isLoading } = useSWR<Artist>(
    mbid ? `/api/artist/${mbid}` : null,
    swrFetcher,
    {
      revalidateOnFocus: false,
      // Artist data rarely changes — cache for the session
      dedupingInterval: 60 * 60 * 1000,
    }
  );

  return {
    artist:   data ?? null,
    loading:  isLoading,
    error:    error as Error | null,
  };
}
