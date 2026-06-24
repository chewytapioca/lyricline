import { useState } from 'react';
import { SENTIMENT_COLOR, SENTIMENT_BG, SENTIMENT_TEXT, SENTIMENT_DOT, albumMoodSummary, sentimentBarWidth } from '../lib/sentiment';
import type { Artist, Album, Song } from '@shared/types';

interface Props {
  artist:         Artist;
  selectedSongId: string | null;
  onSongClick:    (songMbid: string, title: string) => void;
}

export function Timeline({ artist, selectedSongId, onSongClick }: Props) {
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(
    artist.albums[0]?.id ?? null
  );

  return (
    <div>
      {/* Artist header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: '#F4C0D1', border: '2px solid #ED93B1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>
          ✿
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--ink)' }}>
            {artist.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 3 }}>
            {artist.albums.length} releases
            {artist.languages.length > 0 && (
              <span style={{
                marginLeft: 8, background: '#EEEDFE', color: '#534AB7',
                borderRadius: 999, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 500,
              }}>
                {artist.languages.map(l => l.toUpperCase()).join(' / ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: 20 }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 7, top: 0, bottom: 0,
          width: 1, background: 'var(--border)',
        }} />

        {artist.albums.map(album => (
          <AlbumRow
            key={album.id}
            album={album}
            expanded={expandedAlbum === album.id}
            selectedSongId={selectedSongId}
            onToggle={() => setExpandedAlbum(
              expandedAlbum === album.id ? null : album.id
            )}
            onSongClick={onSongClick}
          />
        ))}
      </div>
    </div>
  );
}

function AlbumRow({
  album, expanded, selectedSongId, onToggle, onSongClick,
}: {
  album:          Album;
  expanded:       boolean;
  selectedSongId: string | null;
  onToggle:       () => void;
  onSongClick:    (mbid: string, title: string) => void;
}) {
  const mood     = album.dominantMood;
  const dotColor = mood ? SENTIMENT_DOT[mood] : '#F4C0D1';

  return (
    <div style={{ marginBottom: 12 }}>
      {/* Dot on the timeline */}
      <div style={{
        position: 'absolute', left: 1,
        width: 13, height: 13, borderRadius: '50%',
        background: dotColor, border: '2px solid var(--bg)',
        marginTop: 14,
      }} />

      {/* Album card */}
      <div
        onClick={onToggle}
        style={{
          background: expanded ? 'white' : 'var(--card)',
          border: `${expanded ? '1.5px solid #ED93B1' : '0.5px solid var(--border)'}`,
          borderRadius: 14, padding: '12px 14px',
          cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => !expanded && (e.currentTarget.style.borderColor = '#ED93B1')}
        onMouseLeave={e => !expanded && (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>
            {album.title}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
            {album.year} · {album.type}
          </span>
        </div>

        {mood && album.sentimentBreakdown && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  width: `${sentimentBarWidth(album.sentimentBreakdown.positive)}%`,
                  background: SENTIMENT_COLOR[mood],
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{ fontSize: '0.72rem', color: SENTIMENT_TEXT[mood], minWidth: 60 }}>
                {albumMoodSummary(album)}
              </span>
            </div>
          </>
        )}

        {!mood && (
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
            click a song to analyse →
          </div>
        )}

        {/* Tags */}
        {album.songs.some(s => s.languages.length > 0) && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
            {[...new Set(album.songs.flatMap(s => s.languages))].map(lang => (
              <span key={lang} style={{
                fontSize: '0.65rem', padding: '2px 7px',
                borderRadius: 999, border: '0.5px solid var(--border)',
                color: 'var(--ink-muted)',
              }}>
                {lang.toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Song list — expanded */}
      {expanded && (
        <div style={{ marginTop: 6, paddingLeft: 4 }}>
          {album.songs.map(song => (
            <SongRow
              key={song.id}
              song={song}
              isSelected={song.id === selectedSongId}
              onClick={() => onSongClick(song.id, song.title)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SongRow({ song, isSelected, onClick }: {
  song:       Song;
  isSelected: boolean;
  onClick:    () => void;
}) {
  const mood = song.sentiment?.label ?? null;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px', borderRadius: 8, marginBottom: 4,
        cursor: 'pointer',
        background: isSelected ? '#FFF0F6' : 'var(--card)',
        border: `0.5px solid ${isSelected ? '#ED93B1' : 'transparent'}`,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'var(--bg)')}
      onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'var(--card)')}
    >
      <span style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', minWidth: 18 }}>
        {song.position}
      </span>
      <span style={{ fontSize: '0.8rem', color: 'var(--ink)', flex: 1 }}>
        {song.title}
      </span>
      {mood && (
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: SENTIMENT_COLOR[mood], flexShrink: 0,
        }} />
      )}
      {song.languages.length > 0 && (
        <span style={{
          fontSize: '0.6rem', background: '#EEEDFE', color: '#534AB7',
          borderRadius: 999, padding: '1px 5px',
        }}>
          {song.languages[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );
}
