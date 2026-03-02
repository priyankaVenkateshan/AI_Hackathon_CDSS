/**
 * CDSS REST API client.
 * Sends Authorization: Bearer <token> when getToken is provided.
 * Use with VITE_USE_MOCK=true for mock data in components; when false, these calls hit the backend.
 */

import { config } from './config.js';

let getToken = () => null;

export function setAuthTokenGetter(fn) {
  getToken = fn;
}

async function request(method, path, body = null) {
  const url = `${config.apiUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const options = { method, headers };
  if (body != null && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    let errBody;
    try {
      errBody = JSON.parse(text);
    } catch {
      errBody = { message: text || res.statusText };
    }
    throw new Error(errBody.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get(path) {
    return request('GET', path);
  },
  post(path, body) {
    return request('POST', path, body);
  },
  put(path, body) {
    return request('PUT', path, body);
  },
  delete(path) {
    return request('DELETE', path);
  },
};

// Convenience methods aligned with backend routes

export function getDashboard(doctorId = '') {
  const qs = doctorId ? `?doctor_id=${encodeURIComponent(doctorId)}` : '';
  return api.get(`/dashboard${qs}`);
}

export function getPatients() {
  return api.get('/api/v1/patients').catch(() => api.get('/patients'));
}

export function getPatient(patientId) {
  return api.get(`/api/v1/patients/${patientId}`).catch(() => api.get(`/patients/${patientId}`));
}

export function startConsultation(patientId, doctorId) {
  return api.post('/api/v1/consultations/start', { patient_id: patientId, doctor_id: doctorId });
}

export function saveConsultation(patientId, body) {
  return api.post('/api/v1/consultations', { patient_id: patientId, ...body });
}

export function postAgent(body) {
  return api.post('/agent', body);
}

export function getMedications() {
  return api.get('/api/v1/medications').catch(() => api.get('/medications'));
}

export function getSurgeries() {
  return api.get('/api/v1/surgeries').catch(() => api.get('/surgeries'));
}

export function getSurgery(surgeryId) {
  return api.get(`/api/v1/surgeries/${surgeryId}`).catch(() => api.get(`/surgeries/${surgeryId}`));
}

export function getResources() {
  return api.get('/api/v1/resources').catch(() => api.get('/resources'));
}

export function getSchedule() {
  return api.get('/api/v1/schedule').catch(() => api.get('/schedule'));
}

export function sendNudge(patientId, medicationId) {
  return api.post('/api/v1/reminders/nudge', { patient_id: patientId, medication_id: medicationId });
}

export function scheduleReminder(patientId, medicationId, scheduledAt) {
  return api.post('/api/v1/reminders', { patient_id: patientId, medication_id: medicationId, scheduled_at: scheduledAt });
}

// Admin APIs (Phase 10)
export function getUsers() {
  return api.get('/api/v1/admin/users');
}

export function getAuditLog(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/api/v1/admin/audit${qs ? `?${qs}` : ''}`);
}

export function getSystemConfig() {
  return api.get('/api/v1/admin/config');
}

export function updateSystemConfig(body) {
  return api.put('/api/v1/admin/config', body);
}

export function getAnalytics() {
  return api.get('/api/v1/admin/analytics');
}
