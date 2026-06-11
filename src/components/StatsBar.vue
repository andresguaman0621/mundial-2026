<script setup>
import { computed } from 'vue';
import { tournament } from '../composables/useTournament.js';
import { participantsState } from '../composables/useParticipants.js';
import { getParticipantStatus, getMatchStatus } from '../lib/tournament.js';

const statuses = computed(() =>
  participantsState.participants.map(p => getParticipantStatus(tournament.teamStatus, p))
);
const active = computed(() => statuses.value.filter(s => s.active).length);
const eliminated = computed(() => statuses.value.filter(s => !s.active).length);
const points = computed(() =>
  participantsState.participants
    .filter((p, i) => statuses.value[i].active)
    .reduce((s, p) => s + p.points, 0)
);
const liveGames = computed(() =>
  tournament.games.filter(g => getMatchStatus(g).cls === 'live').length
);
</script>

<template>
  <div class="stats-bar">
    <div class="stat-box"><div class="val">{{ active }}</div><div class="lbl">En concurso</div></div>
    <div class="stat-box"><div class="val">{{ eliminated }}</div><div class="lbl">Eliminados</div></div>
    <div class="stat-box"><div class="val">{{ points }}</div><div class="lbl">Puntos en juego</div></div>
    <div class="stat-box"><div class="val">{{ liveGames }}</div><div class="lbl">Partidos en vivo</div></div>
  </div>
</template>
