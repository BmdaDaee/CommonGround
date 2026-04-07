import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import theme, { getThemeColors } from '../lib/theme';

export default function CalendarScreen() {
  const { mode } = useApp();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', description: '' });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const t = getThemeColors(mode);

  useEffect(() => {
    loadEvents();
  }, [currentMonth]);

  const loadEvents = async () => {
    try {
      const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const { data } = await api.getCalendarEvents(monthStr);
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    try {
      await api.createCalendarEvent(newEvent.title, newEvent.date, newEvent.time, newEvent.description, 'general');
      setNewEvent({ title: '', date: '', time: '', description: '' });
      setShowForm(false);
      loadEvents();
    } catch (err) {
      console.error('Failed to add event:', err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await api.deleteCalendarEvent(eventId);
      loadEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[5] }}>
          <h1 style={{ fontSize: theme.typography.size.xl, fontWeight: theme.typography.weight.bold, color: t.text.primary }}>Calendar</h1>
          <button
            data-testid="add-event-btn"
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
              borderRadius: theme.radius.round,
              border: 'none',
              background: t.accent.primary,
              color: '#FFFFFF',
              fontSize: theme.typography.size.sm,
              fontWeight: theme.typography.weight.semibold,
              cursor: 'pointer',
            }}
          >
            {showForm ? 'Cancel' : '+ Add Event'}
          </button>
        </div>

        {/* Add Event Form */}
        {showForm && (
          <div style={{
            background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
            borderRadius: theme.radius.lg,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[5],
          }}>
            <input
              type="text"
              placeholder="Event title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              style={{
                width: '100%',
                padding: theme.spacing[3],
                borderRadius: theme.radius.md,
                border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : '#1F1F1F'}`,
                background: 'transparent',
                color: t.text.primary,
                marginBottom: theme.spacing[3],
                fontSize: theme.typography.size.md,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: theme.spacing[3], marginBottom: theme.spacing[3] }}>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                style={{
                  flex: 1,
                  padding: theme.spacing[3],
                  borderRadius: theme.radius.md,
                  border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : '#1F1F1F'}`,
                  background: 'transparent',
                  color: t.text.primary,
                }}
              />
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                style={{
                  flex: 1,
                  padding: theme.spacing[3],
                  borderRadius: theme.radius.md,
                  border: `1px solid ${mode === 'deeplyus' ? 'rgba(255,255,255,0.2)' : '#1F1F1F'}`,
                  background: 'transparent',
                  color: t.text.primary,
                }}
              />
            </div>
            <button
              onClick={handleAddEvent}
              disabled={!newEvent.title.trim() || !newEvent.date}
              style={{
                width: '100%',
                padding: theme.spacing[3],
                borderRadius: theme.radius.md,
                border: 'none',
                background: t.accent.primary,
                color: '#FFFFFF',
                fontSize: theme.typography.size.sm,
                fontWeight: theme.typography.weight.semibold,
                cursor: 'pointer',
                opacity: !newEvent.title.trim() || !newEvent.date ? 0.5 : 1,
              }}
            >
              Save Event
            </button>
          </div>
        )}

        {/* Month Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[4] }}>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            style={{ background: 'transparent', border: 'none', color: t.text.primary, fontSize: '20px', cursor: 'pointer' }}
          >
            ←
          </button>
          <h2 style={{ fontSize: theme.typography.size.lg, fontWeight: theme.typography.weight.semibold, color: t.text.primary }}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            style={{ background: 'transparent', border: 'none', color: t.text.primary, fontSize: '20px', cursor: 'pointer' }}
          >
            →
          </button>
        </div>

        {/* Calendar Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing[2],
        }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} style={{ padding: theme.spacing[2], textAlign: 'center', fontSize: theme.typography.size.xs, color: t.text.muted, fontWeight: theme.typography.weight.semibold }}>
              {d}
            </div>
          ))}
          {getDaysInMonth().map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day && new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
            return (
              <div key={idx} style={{
                padding: theme.spacing[2],
                minHeight: '60px',
                background: isToday ? (mode === 'deeplyus' ? 'rgba(255,143,175,0.2)' : 'rgba(255,111,174,0.1)') : 'transparent',
                borderRadius: theme.radius.sm,
              }}>
                {day && (
                  <>
                    <div style={{ fontSize: theme.typography.size.sm, color: isToday ? t.accent.primary : t.text.primary, fontWeight: isToday ? theme.typography.weight.bold : 'normal' }}>
                      {day}
                    </div>
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} style={{
                        fontSize: '10px',
                        background: t.accent.primary,
                        color: '#FFFFFF',
                        borderRadius: '4px',
                        padding: '1px 4px',
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {e.title}
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Upcoming Events */}
        <div style={{ marginTop: theme.spacing[6] }}>
          <h3 style={{ fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold, color: t.text.primary, marginBottom: theme.spacing[3] }}>
            Upcoming Events
          </h3>
          {events.length === 0 ? (
            <p style={{ color: t.text.muted, fontSize: theme.typography.size.sm }}>No events this month</p>
          ) : (
            events.map(e => (
              <div key={e.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: theme.spacing[3],
                background: mode === 'deeplyus' ? 'rgba(255,255,255,0.05)' : theme.colors.bg.surface,
                borderRadius: theme.radius.md,
                marginBottom: theme.spacing[2],
              }}>
                <div>
                  <p style={{ fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.medium, color: t.text.primary }}>{e.title}</p>
                  <p style={{ fontSize: theme.typography.size.xs, color: t.text.muted }}>{e.date} {e.time && `at ${e.time}`}</p>
                </div>
                <button
                  onClick={() => handleDeleteEvent(e.id)}
                  style={{ background: 'transparent', border: 'none', color: t.text.muted, cursor: 'pointer', fontSize: '16px' }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
