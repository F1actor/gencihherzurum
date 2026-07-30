/**
 * Events API — Etkinlik işlemleri fetch katmanı.
 */

export const fetchMyEventsApi = async (fetchWithAuth) => {
  return fetchWithAuth('/events/my-events');
};

export const fetchMyRoutinesApi = async (fetchWithAuth) => {
  return fetchWithAuth('/events/my-routines');
};

export const createEventApi = async (fetchWithAuth, formData) => {
  return fetchWithAuth('/events', {
    method: 'POST',
    body: formData // FormData (multipart)
  }, true /* skipContentType */);
};

export const updateEventApi = async (fetchWithAuth, id, formData) => {
  return fetchWithAuth(`/events/${id}`, {
    method: 'PUT',
    body: formData
  }, true);
};

export const deleteEventApi = async (fetchWithAuth, id) => {
  return fetchWithAuth(`/events/${id}`, { method: 'DELETE' });
};
