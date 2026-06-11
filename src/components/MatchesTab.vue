<script setup>
import { computed } from 'vue';
import { tournament, setPhase } from '../composables/useTournament.js';
import { PHASES, getMatchStatus, getMatchTeams, getPhaseLabel } from '../lib/tournament.js';

const phases = PHASES;

const games = computed(() => {
  let list = [...tournament.games];
  if (tournament.activePhase !== 'all') {
    list = list.filter(g => g.type === tournament.activePhase ||
      (tournament.activePhase === 'final' && g.type === 'final'));
  }
  list.sort((a, b) => {
    const aLive = getMatchStatus(a).cls === 'live' ? 0 : 1;
    const bLive = getMatchStatus(b).cls === 'live' ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return (a._datetime || 0) - (b._datetime || 0);
  });
  return list.map(g => {
    const teams = getMatchTeams(tournament.teams, g);
    const status = getMatchStatus(g);
    const isLive = status.cls === 'live';
    const isFinished = status.cls === 'finished';
    const score = isFinished || isLive ? `${g.home_score} - ${g.away_score}` : 'vs';
    const date = g.local_date ? g.local_date.split(' ')[0] : '';
    const time = g.local_date ? g.local_date.split(' ')[1] : '';
    const meta = `${getPhaseLabel(g.type)}${g.group && g.type === 'group' ? ' · Grupo ' + g.group : ''} · ${date} ${time}`;
    const tbd = teams.home.placeholder || teams.away.placeholder;
    return { id: g.id, teams, status, score, meta, tbd };
  });
});
</script>

<template>
  <section class="section active">
    <div class="card">
      <div class="card-title">Partidos del Mundial</div>
      <div class="phase-filter">
        <button
          v-for="p in phases"
          :key="p.id"
          class="phase-chip"
          :class="{ active: tournament.activePhase === p.id }"
          @click="setPhase(p.id)"
        >{{ p.label }}</button>
      </div>
      <div class="matches-grid">
        <template v-if="games.length">
          <div v-for="g in games" :key="g.id" class="match-card" :class="[g.status.cls, { tbd: g.tbd }]">
            <div class="team-side home">
              <img v-if="g.teams.home.flag" class="team-flag" :src="g.teams.home.flag" alt="">
              <span v-else class="team-flag placeholder">?</span>
              <span class="team-name" :class="{ tbd: g.teams.home.placeholder }">{{ g.teams.home.name }}</span>
            </div>
            <div class="match-center">
              <div class="match-score">{{ g.score }}</div>
              <div class="match-status" :class="g.status.cls">{{ g.status.label }}</div>
              <div class="match-meta">{{ g.meta }}</div>
            </div>
            <div class="team-side away">
              <img v-if="g.teams.away.flag" class="team-flag" :src="g.teams.away.flag" alt="">
              <span v-else class="team-flag placeholder">?</span>
              <span class="team-name" :class="{ tbd: g.teams.away.placeholder }">{{ g.teams.away.name }}</span>
            </div>
          </div>
        </template>
        <div v-else class="empty-state">
          <div class="icon">⚽</div>
          <p>No hay partidos en esta fase</p>
        </div>
      </div>
    </div>
  </section>
</template>
