import { setAccessToken } from './parakh-api.js';

// Minimal client-side session helper.
const SESSION_KEY = 'parakh_session';
const PENDING_KEY = 'parakh_pending_report';

export function getSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getSession();
}

export function setSession(user) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ...user, at: Date.now() }));
    if (user?.token) setAccessToken(user.token);
    window.dispatchEvent(new Event('parakh-auth-change'));
  } catch {}
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
    setAccessToken(null);
    window.dispatchEvent(new Event('parakh-auth-change'));
  } catch {}
}

// Keeps the finished report while the user goes to /login and comes back.
export function savePendingReport(payload) {
  try {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload));
  } catch {}
}

export function takePendingReport() {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    window.sessionStorage.removeItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}