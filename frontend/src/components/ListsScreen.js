import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

export default function ListsScreen() {
  const { mode, vibe } = useApp();
  const [activeTab, setActiveTab] = useState('shopping');
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [suggestionContext, setSuggestionContext] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const t = getThemeColors(mode);

  useEffect(() => {
    loadItems();
  }, [activeTab]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.getListItems(activeTab);
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.trim()) return;
    try {
      await api.addListItem(activeTab, newItem.trim());
      setNewItem('');
      loadItems();
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const handleToggleItem = async (itemId) => {
    try {
      await api.toggleListItem(itemId);
      loadItems();
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await api.deleteListItem(itemId);
      loadItems();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleAiSuggest = async () => {
    if (!suggestionContext.trim()) return;
    setLoadingSuggestion(true);
    try {
      const { data } = await api.aiSuggestList(activeTab, suggestionContext);
      setAiSuggestion(data.suggestions);
    } catch (err) {
      console.error('Failed to get suggestions:', err);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: mode === 'deeplyus' ? theme.colors.deep.bg.primary : theme.colors.bg.primary,
      padding: theme.spacing[4],
      paddingBottom: '100px',
      fontFamily: theme.typography.fontFamily.primary,
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary, marginBottom: theme.spacing[5] }}>
          Lists
        </h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: theme.spacing[2], marginBottom: theme.spacing[5] }}>
          {['shopping', 'wishlist'].map(tab => (
            <button
              key={tab}
              data-testid={`list-tab-${tab}`}
              onClick={() => { setActiveTab(tab); setAiSuggestion(null); }}
              style={{
                flex: 1,
                padding: theme.spacing[3],
                borderRadius: theme.radius.lg,
                border: activeTab === tab ? `2px solid ${t.accent.primary}` : `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                background: activeTab === tab ? (mode === 'deeplyus' ? 'rgba(255,143,175,0.2)' : 'rgba(255,111,174,0.1)') : 'transparent',
                color: activeTab === tab ? t.accent.primary : t.text.secondary,
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.semibold,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'shopping' ? '🛒 Shopping' : '🎁 Wishlist'}
            </button>
          ))}
        </div>

        {/* Add Item */}
        <div style={{ display: 'flex', gap: theme.spacing[3], marginBottom: theme.spacing[4] }}>
          <input
            data-testid="add-list-item-input"
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            placeholder={activeTab === 'shopping' ? 'Add item to shopping list...' : 'Add to wishlist...'}
            style={{
              flex: 1,
              padding: theme.spacing[3],
              borderRadius: theme.radius.lg,
              border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
              color: t.text.primary,
              fontSize: theme.typography.size.md,
              outline: 'none',
            }}
          />
          <button
            data-testid="add-list-item-btn"
            onClick={handleAddItem}
            disabled={!newItem.trim()}
            style={{
              padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
              borderRadius: theme.radius.lg,
              border: 'none',
              background: !newItem.trim() ? 'rgba(0,0,0,0.1)' : t.accent.primary,
              color: !newItem.trim() ? t.text.muted : '#FFFFFF',
              fontSize: theme.typography.size.md,
              fontWeight: theme.typography.weight.semibold,
              cursor: !newItem.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            Add
          </button>
        </div>

        {/* AI Suggestions */}
        <div style={{
          background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing[4],
          marginBottom: theme.spacing[5],
        }}>
          <p style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.semibold, color: t.text.primary, marginBottom: theme.spacing[2] }}>
            ✨ BentlyAI Suggestions
          </p>
          <input
            type="text"
            value={suggestionContext}
            onChange={(e) => setSuggestionContext(e.target.value)}
            placeholder={activeTab === 'shopping' ? "What are you cooking? (e.g., pasta carbonara)" : "Who's it for? What do they like?"}
            style={{
              width: '100%',
              padding: theme.spacing[3],
              borderRadius: theme.radius.md,
              border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              background: 'transparent',
              color: t.text.primary,
              marginBottom: theme.spacing[3],
              fontSize: theme.typography.size.sm,
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleAiSuggest}
            disabled={!suggestionContext.trim() || loadingSuggestion}
            style={{
              width: '100%',
              padding: theme.spacing[3],
              borderRadius: theme.radius.md,
              border: 'none',
              background: t.accent.secondary,
              color: '#FFFFFF',
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
              cursor: 'pointer',
              opacity: !suggestionContext.trim() || loadingSuggestion ? 0.5 : 1,
            }}
          >
            {loadingSuggestion ? 'Thinking...' : `Get ${activeTab === 'shopping' ? 'Ingredients' : 'Gift Ideas'}`}
          </button>
          
          {aiSuggestion && (
            <div style={{
              marginTop: theme.spacing[3],
              padding: theme.spacing[3],
              borderRadius: theme.radius.md,
              background: mode === 'deeplyus' ? 'rgba(255,143,175,0.1)' : 'rgba(255,111,174,0.1)',
            }}>
              <p style={{ fontSize: theme.typography.size.sm, color: t.text.primary, whiteSpace: 'pre-wrap', lineHeight: theme.typography.lineHeight.relaxed }}>
                {aiSuggestion}
              </p>
            </div>
          )}
        </div>

        {/* Items List */}
        {loading ? (
          <p style={{ color: t.text.muted }}>Loading...</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: theme.spacing[8], color: t.text.muted }}>
            <p style={{ fontSize: '32px', marginBottom: theme.spacing[2] }}>{activeTab === 'shopping' ? '🛒' : '🎁'}</p>
            <p>Your {activeTab} list is empty</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[3],
                  padding: theme.spacing[3],
                  background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
                  borderRadius: theme.radius.md,
                }}
              >
                <button
                  onClick={() => handleToggleItem(item.id)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `2px solid ${item.checked ? t.accent.highlight : t.text.muted}`,
                    background: item.checked ? t.accent.highlight : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '14px',
                  }}
                >
                  {item.checked && '✓'}
                </button>
                <span style={{
                  flex: 1,
                  fontSize: theme.typography.size.sm,
                  color: item.checked ? t.text.muted : t.text.primary,
                  textDecoration: item.checked ? 'line-through' : 'none',
                }}>
                  {item.text}
                </span>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  style={{ background: 'transparent', border: 'none', color: t.text.muted, cursor: 'pointer', fontSize: '16px' }}
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
