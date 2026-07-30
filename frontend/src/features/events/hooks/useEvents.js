import { useState, useCallback } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useNotification } from '../../../shared/context/NotificationContext';
import { fetchMyEventsApi, fetchMyRoutinesApi, deleteEventApi } from '../api/eventsApi';

/**
 * useEvents — Birim başkanı etkinlik yönetimi hook'u.
 */
export function useEvents() {
  const { fetchWithAuth, setLoadingScreen } = useAuth();
  const { showNotification, showConfirm } = useNotification();

  const [events, setEvents] = useState([]);
  const [routines, setRoutines] = useState([]);

  const loadEvents = useCallback(async () => {
    const [eventsRes, routinesRes] = await Promise.all([
      fetchMyEventsApi(fetchWithAuth),
      fetchMyRoutinesApi(fetchWithAuth)
    ]);
    if (eventsRes.ok) setEvents(await eventsRes.json());
    if (routinesRes.ok) setRoutines(await routinesRes.json());
  }, [fetchWithAuth]);

  const deleteEvent = useCallback(async (id) => {
    const confirmed = await showConfirm('Bu etkinliği silmek istediğinize emin misiniz?');
    if (!confirmed) return;
    setLoadingScreen(true);
    const res = await deleteEventApi(fetchWithAuth, id);
    const data = await res.json();
    if (res.ok) {
      showNotification(data.message, 'success');
      setEvents(prev => prev.filter(e => e.id !== id));
    } else {
      showNotification(data.message, 'error');
    }
    setLoadingScreen(false);
  }, [fetchWithAuth, setLoadingScreen, showNotification, showConfirm]);

  return { events, routines, loadEvents, deleteEvent };
}
