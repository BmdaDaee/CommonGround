import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

export default function SharedPlaylistScreen() {
  const { mode } = useApp();
  const [songs, setSongs] = useState([]);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const t = getThemeColors(mode);

  useEffect(() => { loadPlaylist(); }, []);

  const loadPlaylist = async () => {
    try {
      const { data } = await api.getSharedPlaylist();
      setSongs(data.songs || []);
    } catch (err) {
      console.error('Failed to load playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!title.trim()) return;
    try {
      const { data } = await api.addToSharedPlaylist(title.trim(), artist.trim() || null, url.trim() || null, notes.trim() || null);
      setSongs(prev => [data.song, ...prev]);
      setTitle(''); setArtist(''); setUrl(''); setNotes(''); setShowForm(false);
    } catch (err) {
      console.error('Failed to add song:', err);
    }
  };

  const handleRemove = async (songId) => {
    try {
      await api.removeFromSharedPlaylist(songId);
      setSongs(prev => prev.filter(s => s.id !== songId));
    } catch (err) {
      console.error('Failed to remove song:', err);
    }
  };

  const inputStyle = {
    width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.md,
    border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.15)' : '#1F1F1F'}`,
    background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    color: t.text.primary, fontSize: theme.typography.size.sm, outline: 'none', boxSizing: 'border-box',
    fontFamily: theme.typography.fontFamily.primary,
  };

  return (
    <div data-testid="shared-playlist-screen" style={{
      padding: theme.spacing[4], paddingBottom: '100px', maxWidth: '600px', margin: '0 auto',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[4] }}>
        <div>
          <h2 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, margin: 0 }}>Our Playlist</h2>
          <p style={{ fontSize: theme.typography.size.xs, color: t.text.muted, margin: 0 }}>{songs.length} songs shared</p>
        </div>
        <button
          data-testid="add-song-toggle-btn"
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: `${theme.spacing[2]} ${theme.spacing[4]}`, borderRadius: theme.radius.round, border: 'none',
            background: t.accent.primary, color: '#FFFFFF', fontSize: theme.typography.size.sm,
            fontWeight: theme.typography.weight.semibold, cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancel' : '+ Add Song'}
        </button>
      </div>

      {showForm && (
        <div data-testid="add-song-form" style={{
          padding: theme.spacing[4], borderRadius: theme.radius.lg, marginBottom: theme.spacing[4],
          background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
          boxShadow: mode === 'deeplyus' ? theme.shadow.deep.soft : theme.shadow.card,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <input data-testid="song-title-input" type="text" placeholder="Song title *" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
            <input data-testid="song-artist-input" type="text" placeholder="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Link (Spotify, YouTube, etc.)" value={url} onChange={(e) => setUrl(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Why this song? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} />
            <button data-testid="add-song-submit-btn" onClick={handleAdd} disabled={!title.trim()} style={{
              padding: theme.spacing[3], borderRadius: theme.radius.md, border: 'none',
              background: title.trim() ? t.accent.primary : (mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : '#1F1F1F'),
              color: title.trim() ? '#FFFFFF' : t.text.muted, fontSize: theme.typography.size.md,
              fontWeight: theme.typography.weight.semibold, cursor: title.trim() ? 'pointer' : 'not-allowed',
            }}>
              Add to Playlist
            </button>
          </div>
        </div>
      )}

      {loading && <p style={{ color: t.text.muted, textAlign: 'center' }}>Loading...</p>}

      {songs.map((song) => (
        <div key={song.id} data-testid={`song-item-${song.id}`} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: theme.spacing[3], borderRadius: theme.radius.md, marginBottom: theme.spacing[2],
          background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
          border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}`,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
              <span style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold, color: t.text.primary }}>
                {song.title}
              </span>
              {song.url && (
                <a href={song.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: theme.typography.size.xs, color: t.accent.primary, textDecoration: 'none' }}>
                  Link
                </a>
              )}
            </div>
            {song.artist && <p style={{ fontSize: theme.typography.size.xs, color: t.text.muted, margin: 0 }}>{song.artist}</p>}
            {song.notes && <p style={{ fontSize: theme.typography.size.xs, color: t.text.secondary, margin: `${theme.spacing[1]} 0 0`, fontStyle: 'italic' }}>"{song.notes}"</p>}
            <span style={{ fontSize: '10px', color: t.text.muted }}>Added by {song.added_by_name}</span>
          </div>
          <button onClick={() => handleRemove(song.id)} style={{
            padding: theme.spacing[2], background: 'transparent', border: 'none',
            color: t.text.muted, cursor: 'pointer', fontSize: theme.typography.size.sm,
          }}>
            x
          </button>
        </div>
      ))}

      {!loading && songs.length === 0 && (
        <p style={{ color: t.text.muted, textAlign: 'center', marginTop: theme.spacing[8] }}>
          No songs yet. Add your first shared song!
        </p>
      )}
    </div>
  );
}
