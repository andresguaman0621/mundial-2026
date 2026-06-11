import { reactive } from 'vue';
import { REFRESH_MS } from '../lib/tournament.js';

const ADMIN_KEY_STORAGE = 'polla_admin_key';

// Estado reactivo compartido de participantes + sesión admin (singleton).
export const participantsState = reactive({
  participants: [],
  isAdmin: Boolean(sessionStorage.getItem(ADMIN_KEY_STORAGE)),
  loadError: null
});

function adminKey() {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE) || '';
}

export async function loadParticipants() {
  try {
    const res = await fetch('/api/participants');
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Error al cargar participantes');
    participantsState.participants = data.participants || [];
    participantsState.loadError = null;
  } catch (e) {
    console.error('loadParticipants', e);
    participantsState.loadError = e.message;
  }
}

export async function login(password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json().catch(() => ({ ok: false }));
  if (res.ok && data.ok) {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, password);
    participantsState.isAdmin = true;
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  participantsState.isAdmin = false;
}

export async function addParticipant({ name, teamId, teamName, points }) {
  const res = await fetch('/api/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey() },
    body: JSON.stringify({ name, teamId, teamName, points })
  });
  const data = await res.json().catch(() => ({ ok: false }));
  if (!res.ok || !data.ok) {
    if (res.status === 401) { logout(); }
    throw new Error(data.error || 'Error al agregar participante');
  }
  participantsState.participants.push(data.participant);
  return data.participant;
}

export async function removeParticipant(id) {
  const res = await fetch(`/api/participants?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'x-admin-key': adminKey() }
  });
  const data = await res.json().catch(() => ({ ok: false }));
  if (!res.ok || !data.ok) {
    if (res.status === 401) { logout(); }
    throw new Error(data.error || 'Error al eliminar participante');
  }
  participantsState.participants = participantsState.participants.filter(p => p.id !== id);
}

let timer = null;
export function startParticipantsPolling() {
  loadParticipants();
  if (timer) clearInterval(timer);
  timer = setInterval(loadParticipants, REFRESH_MS);
}
