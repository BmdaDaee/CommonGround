import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import theme from '../lib/theme';
import { motion } from 'framer-motion';
import { MusicNote, Plus, Trash, SpotifyLogo, YoutubeLogo, AppleLogo, Link } from '@phosphor-icons/react';

function detectPlatform(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('spotify.com') || u.includes('open.spotify')) return 'spotify';
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('music.youtube')) return 'youtube';
  if (u.includes('music.apple.com')) return 'apple';
  return 'other';
}

function getSpotifyEmbedUrl(url) {
  // Extract Spotify track/album/playlist ID
  const match = url.match(/(?:spotify\.com\/)(?:intl-\w+\/)?(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
  return null;
}

function getYouTubeEmbedUrl(url) {
  let videoId = null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /(?:music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) { videoId = m[1]; break; }
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

function getAppleMusicEmbedUrl(url) {
  // Apple Music embed: replace music.apple.com with embed.music.apple.com
  if (url.includes('music.apple.com')) {
    return url.replace('music.apple.com', 'embed.music.apple.com');
  }
  return null;
}

function SongEmbed({ url, platform }) {
  if (!url) return null;
  const p = platform || detectPlatform(url);

  if (p === 'spotify') {
    const embedUrl = getSpotifyEmbedUrl(url);
    if (embedUrl) return (
      <iframe src={embedUrl} width="100%" height="80" frameBorder="0" allow="encrypted-media" loading="lazy"
        style={{ borderRadius: '8px', marginTop: '8px' }} title="Spotify" />
    );
  }

  if (p === 'youtube') {
    const embedUrl = getYouTubeEmbedUrl(url);
    if (embedUrl) return (
      <iframe src={embedUrl} width="100%" height="80" frameBorder="0" allow="encrypted-media" loading="lazy"
        style={{ borderRadius: '8px', marginTop: '8px' }} title="YouTube" />
    );
  }

  if (p === 'apple') {
    const embedUrl = getAppleMusicEmbedUrl(url);
    if (embedUrl) return (
      <iframe src={embedUrl} width="100%" height="175" frameBorder="0" allow="encrypted-media" loading="lazy"
        style={{ borderRadius: '8px', marginTop: '8px', overflow: 'hidden', background: 'transparent' }}
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        title="Apple Music" />
    );
  }

  return null;
}

function PlatformIcon({ platform }) {
  const size = 16;
  const style = { verticalAlign: 'middle' };
  if (platform === 'spotify') return <SpotifyLogo size={size} weight="fill" color="#1DB954" style={style} />;
  if (platform === 'youtube') return <YoutubeLogo size={size} weight="fill" color="#FF0000" style={style} />;
  if (platform === 'apple') return <AppleLogo size={size} weight="fill" color="#FC3C44" style={style} />;
  return <Link size={size} color="#9CA3AF" style={style} />;
}

export default function SharedPlaylistScreen() {
  const [songs, setSongs] = useState([]);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPlaylist(); }, []);

  const loadPlaylist = async () => {
    try { const { data } = await api.getSharedPlaylist(); setSongs(data.songs || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!title.trim()) return;
    const platform = detectPlatform(url);
    try {
      const { data } = await api.addToSharedPlaylist(title.trim(), artist.trim() || null, url.trim() || null, notes.trim() || null, platform);
      setSongs(prev => [data.song, ...prev]);
      setTitle(''); setArtist(''); setUrl(''); setNotes(''); setShowForm(false);
    } catch (err) { console.error(err); }
  };

  const handleRemove = async (songId) => {
    try { await api.removeFromSharedPlaylist(songId); setSongs(prev => prev.filter(s => s.id !== songId)); }
    catch (err) { console.error(err); }
  };

  const inputStyle = {
    width: '100%', padding: theme.spacing[3], borderRadius: theme.radius.none,
    border: '1px solid #1F1F1F', background: 'rgba(255,255,255,0.03)',
    color: '#FFF', fontSize: theme.typography.size.sm, outline: 'none', boxSizing: 'border-box',
    fontFamily: theme.typography.fontFamily.primary,
  };

  return (
    <div data-testid="shared-playlist-screen" style={{
      padding: theme.spacing[4], paddingBottom: '100px', maxWidth: '600px', margin: '0 auto',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[5] }}>
        <div>
          <h2 style={{ fontSize: theme.typography.size.xl, fontWeight: 900, color: '#FFF', margin: 0, fontFamily: theme.typography.fontFamily.heading }}>
            Our Playlist
          </h2>
          <p style={{ fontSize: theme.typography.size.xs, color: '#9CA3AF', margin: 0 }}>{songs.length} songs shared</p>
        </div>
        <button data-testid="add-song-toggle-btn" onClick={() => setShowForm(!showForm)} style={{
          padding: `${theme.spacing[2]} ${theme.spacing[4]}`, borderRadius: theme.radius.none,
          border: 'none', background: '#D4AF37', color: '#000',
          fontSize: theme.typography.size.sm, fontWeight: 700, cursor: 'pointer',
          fontFamily: theme.typography.fontFamily.heading,
        }}>
          <Plus size={14} weight="bold" style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {showForm ? 'Cancel' : 'Add Song'}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          data-testid="add-song-form"
          style={{
            padding: theme.spacing[5], marginBottom: theme.spacing[5],
            background: 'rgba(255,255,255,0.02)', border: '1px solid #1F1F1F',
            borderRadius: theme.radius.none,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <input data-testid="song-title-input" type="text" placeholder="Song title *" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
            <input data-testid="song-artist-input" type="text" placeholder="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} style={inputStyle} />
            <div>
              <input data-testid="song-url-input" type="text" placeholder="Paste Spotify, YouTube, or Apple Music link"
                value={url} onChange={(e) => setUrl(e.target.value)} style={inputStyle} />
              {url && detectPlatform(url) && detectPlatform(url) !== 'other' && (
                <div style={{ marginTop: theme.spacing[1], display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PlatformIcon platform={detectPlatform(url)} />
                  <span style={{ fontSize: theme.typography.size.xs, color: '#9CA3AF', textTransform: 'capitalize' }}>{detectPlatform(url)} detected</span>
                </div>
              )}
            </div>
            <input type="text" placeholder="Why this song? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} />
            <button data-testid="add-song-submit-btn" onClick={handleAdd} disabled={!title.trim()} style={{
              padding: theme.spacing[3], borderRadius: theme.radius.none, border: 'none',
              background: title.trim() ? '#D4AF37' : '#1F1F1F',
              color: title.trim() ? '#000' : '#555',
              fontSize: theme.typography.size.md, fontWeight: 700,
              fontFamily: theme.typography.fontFamily.heading,
              cursor: title.trim() ? 'pointer' : 'not-allowed',
            }}>
              Add to Playlist
            </button>
          </div>
        </motion.div>
      )}

      {loading && <p style={{ color: '#555', textAlign: 'center' }}>Loading...</p>}

      {songs.map((song, i) => (
        <motion.div key={song.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
          data-testid={`song-item-${song.id}`}
          style={{
            padding: theme.spacing[4], marginBottom: theme.spacing[2],
            background: 'rgba(255,255,255,0.02)', border: '1px solid #1F1F1F',
            borderRadius: theme.radius.none,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                {song.platform && <PlatformIcon platform={song.platform} />}
                <span style={{ fontSize: theme.typography.size.md, fontWeight: 700, color: '#FFF' }}>{song.title}</span>
              </div>
              {song.artist && <p style={{ fontSize: theme.typography.size.sm, color: '#9CA3AF', margin: `${theme.spacing[1]} 0 0` }}>{song.artist}</p>}
              {song.notes && <p style={{ fontSize: theme.typography.size.xs, color: '#555', margin: `${theme.spacing[1]} 0 0`, fontStyle: 'italic' }}>"{song.notes}"</p>}
              <span style={{ fontSize: '10px', color: '#555' }}>Added by {song.added_by_name}</span>
              {song.url && <SongEmbed url={song.url} platform={song.platform} />}
            </div>
            <button data-testid={`remove-song-${song.id}`} onClick={() => handleRemove(song.id)} style={{
              padding: theme.spacing[2], background: 'transparent', border: 'none',
              color: '#555', cursor: 'pointer',
            }}>
              <Trash size={16} />
            </button>
          </div>
        </motion.div>
      ))}

      {!loading && songs.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: theme.spacing[10] }}>
          <MusicNote size={48} color="#1F1F1F" style={{ marginBottom: theme.spacing[3] }} />
          <p style={{ color: '#555', fontSize: theme.typography.size.md }}>No songs yet</p>
          <p style={{ color: '#555', fontSize: theme.typography.size.sm }}>Add songs from Spotify, YouTube, or Apple Music</p>
        </div>
      )}
    </div>
  );
}
