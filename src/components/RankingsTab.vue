<script setup>
import { computed } from 'vue';
import { tournament } from '../composables/useTournament.js';
import { participantsState } from '../composables/useParticipants.js';
import { getParticipantStatus, getTeamById, getTeamName } from '../lib/tournament.js';

const enriched = computed(() =>
  participantsState.participants.map(p => {
    const ps = getParticipantStatus(tournament.teamStatus, p);
    const team = getTeamById(tournament.teams, p.teamId);
    return { ...p, ...ps, flag: team?.flag, teamNameEs: getTeamName(p.teamName) };
  })
);

function bySort(a, b) {
  if (b.stageOrder !== a.stageOrder) return b.stageOrder - a.stageOrder;
  return b.points - a.points;
}

const active = computed(() => enriched.value.filter(p => p.active).sort(bySort));
const eliminated = computed(() => enriched.value.filter(p => !p.active).sort(bySort));
</script>

<template>
  <section class="section active">
    <div class="grid-2">
      <div class="card">
        <div class="card-title">🔥 En Concurso <span class="count">{{ active.length }}</span></div>
        <div class="rank-list">
          <template v-if="active.length">
            <div
              v-for="(p, i) in active"
              :key="p.id"
              class="rank-item"
              :class="i < 3 ? 'top' + (i + 1) : ''"
            >
              <div class="rank-pos">{{ i + 1 }}</div>
              <div class="rank-info">
                <div class="name">{{ p.name }}</div>
                <div class="team"><img v-if="p.flag" :src="p.flag" alt=""> {{ p.teamNameEs }}</div>
              </div>
              <span class="rank-stage">{{ p.stageLabel }}</span>
              <div class="rank-points">{{ p.points }}<small>pts</small></div>
            </div>
          </template>
          <div v-else class="empty-state">
            <div class="icon">🏟️</div>
            <p>Nadie en concurso aún.<br>El admin debe registrar participantes.</p>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">💀 Eliminados <span class="count">{{ eliminated.length }}</span></div>
        <div class="rank-list">
          <template v-if="eliminated.length">
            <div v-for="(p, i) in eliminated" :key="p.id" class="rank-item">
              <div class="rank-pos">{{ i + 1 }}</div>
              <div class="rank-info">
                <div class="name">{{ p.name }}</div>
                <div class="team"><img v-if="p.flag" :src="p.flag" alt=""> {{ p.teamNameEs }}</div>
              </div>
              <span class="rank-stage eliminated">{{ p.stageLabel }}</span>
              <div class="rank-points">{{ p.points }}<small>pts</small></div>
            </div>
          </template>
          <div v-else class="empty-state">
            <div class="icon">✨</div>
            <p>Nadie eliminado todavía.<br>¡Todos siguen en la pelea!</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
