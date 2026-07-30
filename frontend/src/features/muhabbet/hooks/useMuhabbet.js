import { useState, useCallback } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { useNotification } from '../../../shared/context/NotificationContext';
import { fetchApplicationsApi, fetchClassesApi } from '../api/muhabbetApi';

/**
 * useMuhabbet — Muhabbet Okulu yönetimi için custom hook.
 */
export function useMuhabbet() {
  const { fetchWithAuth, setLoadingScreen } = useAuth();
  const { showNotification } = useNotification();

  const [applications, setApplications] = useState([]);
  const [classes, setClasses] = useState([]);

  const loadMuhabbetData = useCallback(async () => {
    const [appsRes, classesRes] = await Promise.all([
      fetchApplicationsApi(fetchWithAuth),
      fetchClassesApi(fetchWithAuth)
    ]);
    if (appsRes.ok) setApplications(await appsRes.json());
    if (classesRes.ok) setClasses(await classesRes.json());
  }, [fetchWithAuth]);

  return { applications, classes, loadMuhabbetData, setApplications };
}
