import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

const CATEGORIES = [
  { key: 'music', label: 'Music', icon: '🎵', placeholder: 'Add an artist or song...' },
  { key: 'games', label: 'Games', icon: '🎮', placeholder: 'Add a game...' },
  { key: 'movies', label: 'Movies', icon: '🎬', placeholder: 'Add a movie or show...' },
];

export default function FavoritesScreen() {
  const { refreshProfile } = useAuth();
  const { mode } = useApp();
  const [favorites, setFavorites] = useState({ music: [], games: [], movies: [] });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('music');
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);
  const t = getThemeColors(mode);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data } = await api.getFavorites();
      setFavorites(data.favorites || { music: [], games: [], movies: [] });
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.trim()) return;
    
    const updatedItems = [...(favorites[activeCategory] || []), newItem.trim()];
    
    setSaving(true);
    try {
      await api.updateFavorites(activeCategory, updatedItems);
      setFavorites(prev => ({ ...prev, [activeCategory]: updatedItems }));
      setNewItem('');
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveItem = async (item) => {
    const updatedItems = favorites[activeCategory].filter(i => i !== item);
    
    setSaving(true);
    try {
      await api.updateFavorites(activeCategory, updatedItems);
      setFavorites(prev => ({ ...prev, [activeCategory]: updatedItems }));
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setSaving(false);
    }
  };

  const activeCategoryData = CATEGORIES.find(c => c.key === activeCategory);

  return (
    <div style={{
      minHeight: '100vh',
      background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
      padding: theme.spacing[4],
      paddingBottom: '100px',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: theme.spacing[6] }}>
          <h1 style={{
            fontSize: theme.typography.size.display,
            fontWeight: theme.typography.weight.bold,
            color: t.text.primary,
            marginBottom: theme.spacing[2],
          }}>
            Favorites
          </h1>
          <p style={{
            fontSize: theme.typography.size.md,
            color: t.text.secondary,
          }}>
            Share what you love with your partner
          </p>
        </div>

        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          gap: theme.spacing[2],
          marginBottom: theme.spacing[5],
          overflowX: 'auto',
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              data-testid={`category-${cat.key}`}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[2],
                padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
                borderRadius: theme.radius.round,
                border: activeCategory === cat.key 
                  ? `2px solid ${t.accent.primary}`
                  : `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : '#1F1F1F'}`,
                background: activeCategory === cat.key
                  ? (mode === 'deeplyus' ? 'rgba(255,143,175,0.2)' : 'rgba(255,111,174,0.1)')
                  : 'transparent',
                color: activeCategory === cat.key ? t.accent.primary : t.text.secondary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.semibold,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span style={{
                padding: `2px ${theme.spacing[2]}`,
                borderRadius: theme.radius.round,
                background: mode === 'deeplyus' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                fontSize: theme.typography.size.xs,
              }}>
                {favorites[cat.key]?.length || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Add Item */}
        <div style={{
          display: 'flex',
          gap: theme.spacing[3],
          marginBottom: theme.spacing[5],
        }}>
          <input
            data-testid="add-favorite-input"
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            placeholder={activeCategoryData?.placeholder}
            style={{
              flex: 1,
              padding: theme.spacing[4],
              borderRadius: theme.radius.lg,
              border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : '#1F1F1F'}`,
              background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
              color: t.text.primary,
              fontSize: theme.typography.size.md,
              outline: 'none',
            }}
          />
          <button
            data-testid="add-favorite-btn"
            onClick={handleAddItem}
            disabled={!newItem.trim() || saving}
            style={{
              padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
              borderRadius: theme.radius.lg,
              border: 'none',
              background: !newItem.trim() ? '#1F1F1F' : t.accent.primary,
              color: !newItem.trim() ? t.text.muted : '#FFFFFF',
              fontSize: theme.typography.size.md,
              fontWeight: theme.typography.weight.semibold,
              cursor: !newItem.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            Add
          </button>
        </div>

        {/* Items List */}
        {loading ? (
          <p style={{ color: t.text.muted }}>Loading...</p>
        ) : favorites[activeCategory]?.length === 0 ? (
          <div style={{
            padding: theme.spacing[8],
            textAlign: 'center',
            background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
            borderRadius: theme.radius.xl,
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: theme.spacing[3] }}>
              {activeCategoryData?.icon}
            </span>
            <p style={{
              fontSize: theme.typography.size.md,
              color: t.text.secondary,
              marginBottom: theme.spacing[2],
            }}>
              No {activeCategoryData?.label.toLowerCase()} added yet
            </p>
            <p style={{
              fontSize: theme.typography.size.sm,
              color: t.text.muted,
            }}>
              Add your favorites to share with your partner
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing[2] }}>
            {favorites[activeCategory].map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                data-testid={`favorite-item-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                  padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
                  borderRadius: theme.radius.round,
                  background: mode === 'deeplyus' 
                    ? `linear-gradient(135deg, ${theme.colors.deep.gradient.start}, ${theme.colors.deep.gradient.end})`
                    : `linear-gradient(135deg, ${theme.colors.gradient.emotional.start}, ${theme.colors.gradient.emotional.end})`,
                  boxShadow: theme.shadow.soft,
                }}
              >
                <span style={{
                  fontSize: theme.typography.size.sm,
                  fontWeight: theme.typography.weight.medium,
                  color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
                }}>
                  {item}
                </span>
                <button
                  onClick={() => handleRemoveItem(item)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.3)',
                    color: mode === 'deeplyus' ? '#FFFFFF' : theme.colors.text.primary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
