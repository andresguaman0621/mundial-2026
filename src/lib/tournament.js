// ═══════════════════════════════════════════
// LÓGICA DE DOMINIO — portada verbatim desde polla-mundial.html
// Las funciones que antes leían el global `state` ahora reciben los
// arrays/objeto relevantes como parámetros (sin cambiar el comportamiento).
// ═══════════════════════════════════════════

export const API_BASE = 'https://wcup2026.org/api/data.php';
export const REFRESH_MS = 30000;

export const TEAM_ALIASES = {
  'USA': 'United States',
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
  'DR Congo': 'Democratic Republic of the Congo'
};

export const TEAM_ES = {
  'Mexico':'México','United States':'Estados Unidos','South Korea':'Corea del Sur',
  'South Africa':'Sudáfrica','Czech Republic':'Rep. Checa','Canada':'Canadá',
  'Bosnia and Herzegovina':'Bosnia','Qatar':'Catar','Switzerland':'Suiza',
  'Brazil':'Brasil','Morocco':'Marruecos','Haiti':'Haití','Scotland':'Escocia',
  'Paraguay':'Paraguay','Australia':'Australia','Turkey':'Turquía',
  'Germany':'Alemania','Curaçao':'Curazao','Ivory Coast':'Costa de Marfil',
  'Ecuador':'Ecuador','Netherlands':'Países Bajos','Japan':'Japón',
  'Sweden':'Suecia','Tunisia':'Túnez','Belgium':'Bélgica','Egypt':'Egipto',
  'Iran':'Irán','New Zealand':'Nueva Zelanda','Spain':'España',
  'Cape Verde':'Cabo Verde','Saudi Arabia':'Arabia Saudita','Uruguay':'Uruguay',
  'France':'Francia','Senegal':'Senegal','Iraq':'Irak','Norway':'Noruega',
  'Argentina':'Argentina','Algeria':'Argelia','Austria':'Austria','Jordan':'Jordania',
  'Portugal':'Portugal','Democratic Republic of the Congo':'RD Congo',
  'Uzbekistan':'Uzbekistán','Colombia':'Colombia','England':'Inglaterra',
  'Croatia':'Croacia','Ghana':'Ghana','Panama':'Panamá'
};

export const STAGE_ORDER = { group:0, r32:1, r16:2, qf:3, sf:4, third:5, final:6 };
export const STAGE_LABELS = {
  group:'Fase de Grupos', r32:'Dieciseisavos', r16:'Octavos de Final',
  qf:'Cuartos de Final', sf:'Semifinal', third:'Tercer Puesto',
  final:'Final', champion:'🏆 Campeón', eliminated:'Eliminado'
};

export const PHASES = [
  { id:'all', label:'Todos' },
  { id:'group', label:'Grupos' },
  { id:'r32', label:'Dieciseisavos' },
  { id:'r16', label:'Octavos' },
  { id:'qf', label:'Cuartos' },
  { id:'sf', label:'Semifinal' },
  { id:'final', label:'Final' }
];

// ───────────────────────────────────────────
// API helpers
// ───────────────────────────────────────────
export function canonicalTeam(name) {
  if (!name || /^[WL]\d+/.test(name)) return name;
  return TEAM_ALIASES[name] || name;
}

export function teamSlug(name) {
  return canonicalTeam(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function isPlaceholderTeam(name) {
  return !name || /^[WL]\d+/.test(name);
}

export function parseScore(score) {
  if (!score) return ['0', '0'];
  const parts = String(score).split(/[-:–]/).map(s => s.trim());
  return [parts[0] || '0', parts[1] || '0'];
}

export function mapRound(round) {
  if (!round || round.startsWith('Matchday')) return 'group';
  const map = {
    'Round of 32': 'r32', 'Round of 16': 'r16', 'Quarter-final': 'qf',
    'Semi-final': 'sf', 'Match for third place': 'third', 'Final': 'final'
  };
  return map[round] || 'group';
}

export function mapWcupStatus(status, liveMinute) {
  if (status === 'finished') return { finished: 'TRUE', time_elapsed: 'finished' };
  if (status === 'halftime') return { finished: 'FALSE', time_elapsed: 'ht' };
  if (status === 'live') return { finished: 'FALSE', time_elapsed: liveMinute ? `live ${liveMinute}` : 'live' };
  return { finished: 'FALSE', time_elapsed: 'notstarted' };
}

export function convertMatch(m) {
  const homeCanon = canonicalTeam(m.team1);
  const awayCanon = canonicalTeam(m.team2);
  const scores = parseScore(m.score);
  const st = mapWcupStatus(m.status, m.live_minute);
  const type = mapRound(m.round);
  return {
    id: String(m.id),
    home_team_id: isPlaceholderTeam(m.team1) ? '0' : teamSlug(homeCanon),
    away_team_id: isPlaceholderTeam(m.team2) ? '0' : teamSlug(awayCanon),
    home_score: scores[0],
    away_score: scores[1],
    group: (m.group || '').replace('Group ', '') || (type !== 'group' ? type.toUpperCase() : ''),
    type,
    finished: st.finished,
    time_elapsed: st.time_elapsed,
    local_date: `${m.date || ''} ${m.time || ''}`.trim(),
    home_team_name_en: isPlaceholderTeam(m.team1) ? null : homeCanon,
    away_team_name_en: isPlaceholderTeam(m.team2) ? null : awayCanon,
    home_team_label: isPlaceholderTeam(m.team1) ? m.team1 : null,
    away_team_label: isPlaceholderTeam(m.team2) ? m.team2 : null,
    _datetime: m.datetime || 0
  };
}

export function buildTeamsFromData(matches, standings) {
  const flagMap = {};
  matches.forEach(m => {
    if (m.flag1 && !isPlaceholderTeam(m.team1)) flagMap[canonicalTeam(m.team1)] = m.flag1;
    if (m.flag2 && !isPlaceholderTeam(m.team2)) flagMap[canonicalTeam(m.team2)] = m.flag2;
  });
  const teams = [];
  Object.entries(standings || {}).forEach(([groupName, groupTeams]) => {
    const groupLetter = groupName.replace('Group ', '');
    groupTeams.forEach(t => {
      const name = canonicalTeam(t.team);
      const id = teamSlug(name);
      if (!teams.find(x => x.id === id)) {
        teams.push({ id, name_en: name, flag: flagMap[name] || '', groups: groupLetter });
      }
    });
  });
  return teams.sort((a, b) => getTeamName(a.name_en).localeCompare(getTeamName(b.name_en)));
}

export function buildGroupsFromStandings(standings) {
  return Object.entries(standings || {}).map(([groupName, groupTeams]) => ({
    name: groupName.replace('Group ', ''),
    teams: groupTeams.map(t => ({
      team_id: teamSlug(canonicalTeam(t.team)),
      mp: String(t.p ?? 0), w: String(t.w ?? 0), l: String(t.l ?? 0),
      d: String(t.d ?? 0), pts: String(t.pts ?? 0),
      gf: String(t.gf ?? 0), ga: String(t.ga ?? 0), gd: String(t.gd ?? 0)
    }))
  }));
}

export async function fetchWcup(action) {
  const res = await fetch(`${API_BASE}?action=${action}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || `Acción ${action} falló`);
  return data;
}

// ───────────────────────────────────────────
// LÓGICA DE ELIMINACIÓN
// ───────────────────────────────────────────
export function getTeamName(en) { return TEAM_ES[en] || en; }

export function getTeamById(teams, id) {
  const found = teams.find(t => t.id === String(id));
  if (found) return found;
  return teams.find(t => teamSlug(t.name_en) === teamSlug(String(id)));
}

export function isGroupStageComplete(games) {
  const groupGames = games.filter(g => g.type === 'group');
  return groupGames.length > 0 && groupGames.every(g => g.finished === 'TRUE');
}

export function getQualifiedTeams(groups) {
  const qualified = new Set();
  const thirdPlaces = [];

  groups.forEach(group => {
    const sorted = [...group.teams].sort((a, b) => {
      const pts = parseInt(b.pts) - parseInt(a.pts);
      if (pts !== 0) return pts;
      const gd = parseInt(b.gd) - parseInt(a.gd);
      if (gd !== 0) return gd;
      return parseInt(b.gf) - parseInt(a.gf);
    });
    if (sorted[0]) qualified.add(sorted[0].team_id);
    if (sorted[1]) qualified.add(sorted[1].team_id);
    if (sorted[2]) thirdPlaces.push({ ...sorted[2], group: group.name });
  });

  thirdPlaces.sort((a, b) => {
    const pts = parseInt(b.pts) - parseInt(a.pts);
    if (pts !== 0) return pts;
    const gd = parseInt(b.gd) - parseInt(a.gd);
    if (gd !== 0) return gd;
    return parseInt(b.gf) - parseInt(a.gf);
  });
  thirdPlaces.slice(0, 8).forEach(t => qualified.add(t.team_id));
  return qualified;
}

export function getKnockoutLosers(games) {
  const losers = new Set();
  const knockoutTypes = ['r32','r16','qf','sf','third','final'];
  games.filter(g => knockoutTypes.includes(g.type) && g.finished === 'TRUE').forEach(g => {
    const hs = parseInt(g.home_score), as = parseInt(g.away_score);
    if (hs > as && g.home_team_id !== '0') losers.add(g.away_team_id);
    else if (as > hs && g.away_team_id !== '0') losers.add(g.home_team_id);
    else if (hs === as) {
      // Penales no en API, asumimos ganador por score
    }
  });
  return losers;
}

export function getTeamCurrentStage(games, groups, teamId) {
  const tid = String(teamId);
  const knockoutTypes = ['final','sf','qf','r16','r32'];
  for (const type of knockoutTypes) {
    const match = games.find(g =>
      g.type === type && g.finished === 'TRUE' &&
      (g.home_team_id === tid || g.away_team_id === tid)
    );
    if (match) {
      const hs = parseInt(match.home_score), as = parseInt(match.away_score);
      const won = (match.home_team_id === tid && hs > as) || (match.away_team_id === tid && as > hs);
      if (!won) return { stage: type, eliminated: true };
      if (type === 'final') return { stage: 'champion', eliminated: false };
      return { stage: type, eliminated: false };
    }
  }
  if (isGroupStageComplete(games)) {
    const qualified = getQualifiedTeams(groups);
    if (qualified.has(tid)) return { stage: 'r32', eliminated: false };
    return { stage: 'group', eliminated: true };
  }
  return { stage: 'group', eliminated: false };
}

export function computeTeamStatus(teams, games, groups) {
  const teamStatus = {};
  teams.forEach(t => {
    teamStatus[t.id] = getTeamCurrentStage(games, groups, t.id);
  });
  return teamStatus;
}

export function resolveTeamId(teamStatus, p) {
  if (teamStatus[p.teamId]) return p.teamId;
  if (p.teamName) return teamSlug(canonicalTeam(p.teamName));
  return p.teamId;
}

export function getParticipantStatus(teamStatus, p) {
  const tid = resolveTeamId(teamStatus, p);
  const ts = teamStatus[tid] || { stage: 'group', eliminated: false };
  return {
    active: !ts.eliminated,
    stage: ts.eliminated ? 'eliminated' : ts.stage,
    stageLabel: ts.eliminated ? STAGE_LABELS.eliminated : (STAGE_LABELS[ts.stage] || ts.stage),
    stageOrder: ts.eliminated ? -1 : (STAGE_ORDER[ts.stage] ?? 0)
  };
}

// ───────────────────────────────────────────
// MATCH STATUS
// ───────────────────────────────────────────
export function getMatchStatus(game) {
  if (game.finished === 'TRUE') return { cls: 'finished', label: 'Finalizado' };
  const te = (game.time_elapsed || '').toLowerCase();
  if (['live','1h','2h','ht','et','p','firsthalf','secondhalf','halftime'].some(s => te.includes(s)) && te !== 'notstarted') {
    const min = te.match(/\d+/) ? te : '';
    return { cls: 'live', label: min ? `En vivo ${min}'` : '🔴 EN VIVO' };
  }
  return { cls: 'scheduled', label: 'Por jugar' };
}

export function getFlag(teams, teamId) {
  const team = getTeamById(teams, teamId);
  return team ? team.flag : null;
}

// Convierte una etiqueta cruda de equipo aún no definido (p. ej. "W49", "L50",
// "1A") en algo legible en español para los partidos de eliminatorias que
// dependen de resultados previos.
export function humanizePlaceholder(label) {
  if (!label) return 'Por definir';
  const w = label.match(/^W\s*(\d+)$/i);
  if (w) return `Ganador llave ${w[1]}`;
  const l = label.match(/^L\s*(\d+)$/i);
  if (l) return `Perdedor llave ${l[1]}`;
  const g = label.match(/^([123])\s*([A-L])$/i);
  if (g) {
    const pos = { '1': '1º', '2': '2º', '3': '3º' }[g[1]];
    return `${pos} Grupo ${g[2].toUpperCase()}`;
  }
  return label;
}

function matchSide(teams, nameEn, teamId, label) {
  if (nameEn) {
    return { name: getTeamName(nameEn), flag: getFlag(teams, teamId), placeholder: false };
  }
  return { name: humanizePlaceholder(label), flag: null, placeholder: true };
}

export function getMatchTeams(teams, game) {
  return {
    home: matchSide(teams, game.home_team_name_en, game.home_team_id, game.home_team_label),
    away: matchSide(teams, game.away_team_name_en, game.away_team_id, game.away_team_label)
  };
}

export function getPhaseLabel(type) {
  const map = { group:'Grupo', r32:'Dieciseisavos', r16:'Octavos', qf:'Cuartos', sf:'Semifinal', third:'3er Puesto', final:'Final' };
  return map[type] || type;
}
