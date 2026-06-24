import { useState } from 'react';
import type { Artist, Album, Song } from '@shared/types';

const C = {
  card:   '#faf8f3',
  bg2:    '#ede6d8',
  border: '#d8cfc0',
  brownl: '#c4a882',
  brownd: '#5c3d28',
  brown:  '#8b6a50',
  ink2:   '#7a6a58',
  ink3:   '#b0a090',
  cream:  '#fdf9f2',
};

const MOOD_COLOR: Record<string, string> = {
  positive: '#a8c8a0',
  neutral:  '#c8b890',
  negative: '#b0a0c8',
};
const MOOD_WORD: Record<string, string> = {
  positive: 'joyful',
  neutral:  'mellow',
  negative: 'dark',
};

interface Props {
  artist: Artist;
  selectedSongId: string | null;
  onSongClick: (mbid: string, title: string) => void;
}

export function Timeline({ artist, selectedSongId, onSongClick }: Props) {
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(
    artist.albums[0]?.id ?? null
  );

  return (
    <div style={{ fontFamily: "'Happy Monkey', cursive" }}>

      {/* artist header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 20, padding: '12px 14px',
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 12,
      }}>
        {/* ♪ note instead of pink flower */}
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: C.bg2, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: C.brownl, flexShrink: 0,
        }}>
          ♪
        </div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: C.brownd }}>
            {artist.name}
          </div>
          <div style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>
            {artist.albums.length} releases
          </div>
        </div>
      </div>

      {/* album list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {artist.albums.map((album) => (
          <AlbumRow
            key={album.id}
            album={album}
            isExpanded={expandedAlbum === album.id}
            selectedSongId={selectedSongId}
            onToggle={() => setExpandedAlbum(prev => prev === album.id ? null : album.id)}
            onSongClick={onSongClick}
          />
        ))}
      </div>
    </div>
  );
}

function AlbumRow({ album, isExpanded, selectedSongId, onToggle, onSongClick }: {
  album: Album;
  isExpanded: boolean;
  selectedSongId: string | null;
  onToggle: () => void;
  onSongClick: (mbid: string, title: string) => void;
}) {
  const mood = album.dominantMood;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 10, overflow: 'hidden',
    }}>
      {/* album header row */}
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', border: 'none', background: 'transparent',
        cursor: 'pointer', textAlign: 'left',
      }}>
        {/* album art or placeholder */}
        {album.coverUrl ? (
          <img src={album.coverUrl} alt={album.title}
            style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: 6, flexShrink: 0,
            background: C.bg2, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: C.brownl,
          }}>♩</div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 12.5, fontWeight: 600, color: C.brownd,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {album.title}
          </div>
          <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 1 }}>
            {album.year} · {album.type}
          </div>
        </div>

        {mood && (
          <span style={{
            fontSize: 9.5, padding: '2px 8px', borderRadius: 99,
            background: `${MOOD_COLOR[mood]}33`,
            color: MOOD_COLOR[mood], border: `1px solid ${MOOD_COLOR[mood]}66`,
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
            flexShrink: 0,
          }}>
            {MOOD_WORD[mood]}
          </span>
        )}

        <span style={{ color: C.ink3, fontSize: 10, flexShrink: 0 }}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {/* song list */}
      {isExpanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '6px 0' }}>
          {album.songs.length === 0 ? (
            <div style={{ padding: '8px 14px', fontSize: 11, color: C.ink3 }}>no tracks found</div>
          ) : album.songs.map(song => (
            <SongRow key={song.id} song={song} isSelected={selectedSongId === song.id} onClick={() => onSongClick(song.id, song.title)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SongRow({ song, isSelected, onClick }: { song: Song; isSelected: boolean; onClick: () => void }) {
  const mood = song.sentiment?.label ?? null;

  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 14px', border: 'none', textAlign: 'left',
      background: isSelected ? C.bg2 : 'transparent',
      borderLeft: isSelected ? `3px solid ${C.brownl}` : '3px solid transparent',
      cursor: 'pointer', transition: 'background 0.1s',
    }}
    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = `${C.bg2}88`; }}
    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: 10, color: C.ink3, minWidth: 18, textAlign: 'right', flexShrink: 0 }}>
        {song.position}
      </span>
      <span style={{ fontSize: 12, color: C.brownd, flex: 1, fontFamily: "'Happy Monkey', cursive" }}>
        {song.title}
      </span>
      {mood && (
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: MOOD_COLOR[mood], flexShrink: 0 }} />
      )}
      {!mood && (
        <span style={{ fontSize: 10, color: C.ink3, flexShrink: 0 }}>analyse →</span>
      )}
    </button>
  );
}