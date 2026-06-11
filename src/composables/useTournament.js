import { reactive } from 'vue';
import {
  fetchWcup, buildTeamsFromData, convertMatch, buildGroupsFromStandings,
  computeTeamStatus, REFRESH_MS
} from '../lib/tournament.js';

const CACHE_KEY = 'polla_mundial_cache';

// Estado reactivo compartido del torneo (singleton a nivel de módulo).
export const tournament = reactive({
  teams: [],
  games: [],
  groups: [],
  teamStatus: {},      // teamId -> { stage, eliminated }
  activePhase: 'all',
  lastSync: null,
  syncMessage: '🔄 Conectando con API del Mundial...'
});

function saveCache() {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    teams: tournament.teams, games: tournament.games, groups: tournament.groups, ts: Date.now()
  }));
}

function loadCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (c?.teams?.length) {
      tournament.teams = c.teams;
      tournament.games = c.games || [];
      tournament.groups = c.groups || [];
      return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}

function recompute() {
  tournament.teamStatus = computeTeamStatus(tournament.teams, tournament.games, tournament.groups);
}

export async function syncTournament() {
  try {
    tournament.syncMessage = '<span class="spin">🔄</span> Actualizando datos...';
    const [allRes, standingsRes] = await Promise.all([
      fetchWcup('all'),
      fetchWcup('standings')
    ]);
    const matches = allRes.matches || [];
    const standings = standingsRes.standings || {};
    tournament.teams = buildTeamsFromData(matches, standings);
    tournament.games = matches.map(convertMatch).sort((a, b) => a._datetime - b._datetime);
    tournament.groups = buildGroupsFromStandings(standings);
    tournament.lastSync = new Date();
    saveCache();
    recompute();
    const time = tournament.lastSync.toLocaleTimeString('es');
    tournament.syncMessage = `✅ Actualizado a las ${time} · Próxima en 30s`;
  } catch (e) {
    console.error(e);
    if (loadCache()) {
      recompute();
      tournament.syncMessage = `⚠️ Sin conexión · Mostrando datos guardados (${tournament.games.length} partidos)`;
    } else {
      tournament.syncMessage = `⚠️ Error de conexión: ${e.message}. Reintentando...`;
    }
  }
}

export function setPhase(id) {
  tournament.activePhase = id;
}

let timer = null;
export function startTournamentPolling() {
  syncTournament();
  if (timer) clearInterval(timer);
  timer = setInterval(syncTournament, REFRESH_MS);
}
