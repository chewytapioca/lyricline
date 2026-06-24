// ─── Sentiment ────────────────────────────────────────────────────────────────

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface SentimentScore {
  label: SentimentLabel;
  score: number; // 0–1 confidence
}

export interface LyricChunk {
  text: string;
  language: string;      // ISO 639-1 e.g. "ko", "en", "ja"
  sentiment: SentimentScore;
  startLine: number;
  endLine: number;
}

// ─── Songs ────────────────────────────────────────────────────────────────────

export interface Song {
  id: string;            // MusicBrainz recording ID
  title: string;
  position: number;      // track number on album
  durationMs: number | null;
  sentiment: SentimentScore | null;   // null = not yet analysed
  languages: string[];               // detected languages in lyrics
}

export interface SongDetail extends Song {
  chunks: LyricChunk[];
  rawLyrics: string;
}

// ─── Albums ───────────────────────────────────────────────────────────────────

export type AlbumType = 'Album' | 'Single' | 'EP' | 'Compilation' | 'Other';

export interface Album {
  id: string;            // MusicBrainz release-group ID
  title: string;
  year: number;
  type: AlbumType;
  coverUrl: string | null;
  songs: Song[];
  // Aggregated from songs — null if no songs analysed yet
  sentimentBreakdown: {
    positive: number;  // 0–1 fraction
    neutral: number;
    negative: number;
  } | null;
  dominantMood: SentimentLabel | null;
}

// ─── Artists ──────────────────────────────────────────────────────────────────

export interface Artist {
  id: string;            // MusicBrainz artist ID
  name: string;
  sortName: string;
  country: string | null;
  genres: string[];
  albums: Album[];
  languages: string[];   // union of all detected lyric languages
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
}

export interface SearchResult {
  id: string;
  name: string;
  country: string | null;
  genres: string[];
  albumCount: number;
}

export type ArtistResponse = Artist | ApiError;
export type AlbumResponse  = Album  | ApiError;
export type SongResponse   = SongDetail | ApiError;
export type SearchResponse = SearchResult[] | ApiError;

// ─── Cache ────────────────────────────────────────────────────────────────────

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;  // unix ms
}
