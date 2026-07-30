import { useState, useCallback } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useNotification } from '../../../shared/context/NotificationContext';
import {
  fetchDashboardStats, fetchPendingUsers, fetchAllUsers, fetchLeaderboard,
  fetchPerformance, fetchRoutines, fetchAudits, fetchEventsGallery, fetchUnits
} from '../api/dashboardApi';

/**
 * useDashboard — Admin dashboard için tüm veri çekme ve durum yönetimi hook'u.
 * AdminDashboard.jsx bileşenini iş mantığından arındırır.
 */
export function useDashboard() {
  const { fetchWithAuth, setLoadingScreen } = useAuth();
  const { showNotification } = useNotification();

  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [stats, setStats] = useState({ totalPresidents: 0, pendingApprovals: 0, totalEvents: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ weekly: [], monthly: [], overall: [] });
  const [performance, setPerformance] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [audits, setAudits] = useState([]);
  const [chartWeeksData, setChartWeeksData] = useState([]);
  const [eventsGallery, setEventsGallery] = useState([]);
  const [validUnits, setValidUnits] = useState([]);

  const loadDashboardData = useCallback(async (showOverlay = true) => {
    if (showOverlay) setLoadingScreen(true);
    try {
      const [statsRes, pendingRes, usersRes, leaderboardRes, perfRes, routinesRes, auditsRes, galleryRes, unitsRes] = await Promise.all([
        fetchDashboardStats(fetchWithAuth),
        fetchPendingUsers(fetchWithAuth),
        fetchAllUsers(fetchWithAuth),
        fetchLeaderboard(fetchWithAuth),
        fetchPerformance(fetchWithAuth),
        fetchRoutines(fetchWithAuth),
        fetchAudits(fetchWithAuth),
        fetchEventsGallery(fetchWithAuth),
        fetchUnits(fetchWithAuth)
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.summary);
        setRecentEvents(d.recentEvents);
        setChartWeeksData(d.weeksData);
      }
      if (pendingRes.ok) setPendingUsers(await pendingRes.json());
      if (usersRes.ok) setAllUsers(await usersRes.json());
      if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
      if (perfRes.ok) setPerformance(await perfRes.json());
      if (routinesRes.ok) setRoutines(await routinesRes.json());
      if (auditsRes.ok) setAudits(await auditsRes.json());
      if (galleryRes.ok) setEventsGallery(await galleryRes.json());
      if (unitsRes.ok) {
        const unitsData = await unitsRes.json();
        setValidUnits(unitsData.map(u => u.name));
      }
    } catch (error) {
      showNotification('Veriler yüklenirken hata oluştu.', 'error');
    } finally {
      if (showOverlay) setLoadingScreen(false);
    }
  }, [fetchWithAuth, setLoadingScreen, showNotification]);

  return {
    pendingUsers, allUsers, stats, recentEvents, leaderboard,
    performance, routines, audits, chartWeeksData, eventsGallery, validUnits,
    loadDashboardData,
    setPendingUsers, setAllUsers
  };
}
