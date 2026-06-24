// ─── Sentiment ────────────────────────────────────────────────────────────────

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface SentimentScore {
  label:      SentimentLabel;
  confidence: number;   // 0–1
}

// ─── Lyric chunks ─────────────────────────────────────────────────────────────

export interface LyricChunk {
  lines:     string[];
  language:  string;   // ISO 639-1: "ko", "en", "ja"
  sentiment: SentimentScore;
  startLine: number;
  endLine:   number;
}

// ─── Songs ────────────────────────────────────────────────────────────────────

export interface Song {
  id:         string;           // MusicBrainz recording ID
  title:      string;
  position:   number;           // track number on album
  durationMs: number | null;
  sentiment:  SentimentScore | null;
  languages:  string[];
}

export interface SongDetail extends Song {
  chunks:     LyricChunk[];
  rawLyrics:  string;
}

// ─── Albums ───────────────────────────────────────────────────────────────────

export type AlbumType = 'Album' | 'Single' | 'EP' | 'Compilation' | 'Other';

export interface Album {
  id:       string;
  title:    string;
  year:     number;
  type:     AlbumType;
  coverUrl: string | null;
  songs:    Song[];
  sentimentBreakdown: {
    positive: number;
    neutral:  number;
    negative: number;
  } | null;
  dominantMood: SentimentLabel | null;
}

// ─── Artists ──────────────────────────────────────────────────────────────────

export interface Artist {
  id:        string;
  name:      string;
  sortName:  string;
  country:   string | null;
  genres:    string[];
  albums:    Album[];
  languages: string[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code:  string;
}

export interface SearchResult {
  id:         string;
  name:       string;
  country:    string | null;
  genres:     string[];
  albumCount: number;
  imageUrl:   string | null;   // ← NEW: Genius artist thumbnail
}

export type ArtistResponse = Artist  | ApiError;
export type AlbumResponse  = Album   | ApiError;
export type SongResponse   = SongDetail | ApiError;
export type SearchResponse = SearchResult[] | ApiError;

export interface CacheEntry<T> {
  data:     T;
  cachedAt: number;
}