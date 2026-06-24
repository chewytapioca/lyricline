import useSWR from 'swr';
import { swrFetcher } from '../lib/api';
import type { Artist } from '@shared/types';

export function useArtist(mbid: string | null, name: string | null) {
  const url = mbid
    ? `/api/artist/${mbid}?name=${encodeURIComponent(name ?? '')}`
    : null;

  const { data, error, isLoading } = useSWR<Artist>(url, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60 * 60 * 1000,
  });

  return {
    artist:  data ?? null,
    loading: isLoading,
    error:   error as Error | null,
  };
}