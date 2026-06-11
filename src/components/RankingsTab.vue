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

// Agrupa participantes por selección elegida: cuántas personas escogieron cada
// país, cuántas siguen en concurso y quiénes son. Ordena por cantidad desc.
const byTeam = computed(() => {
  const map = new Map();
  for (const p of participantsState.participants) {
    const team = getTeamById(tournament.teams, p.teamId);
    const key = team ? team.id : p.teamId;
    const ps = getParticipantStatus(tournament.teamStatus, p);
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: team ? getTeamName(team.name_en) : getTeamName(p.teamName),
        flag: team?.flag || '',
        count: 0, active: 0, points: 0, names: []
      });
    }
    const e = map.get(key);
    e.count++;
    if (ps.active) e.active++;
    e.points += p.points;
    e.names.push(p.name);
  }
  return [...map.values()].sort((a, b) =>
    b.count - a.count || b.points - a.points || a.name.localeCompare(b.name)
  );
});
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

    <div class="card" style="margin-top:20px">
      <div class="card-title">📋 Personas por selección <span class="count">{{ byTeam.length }}</span></div>
      <div v-if="byTeam.length" class="tally-grid">
        <div v-for="t in byTeam" :key="t.key" class="tally-item">
          <img v-if="t.flag" :src="t.flag" class="tally-flag" alt="">
          <span v-else class="tally-flag placeholder">?</span>
          <div class="tally-info">
            <div class="tally-head">
              <span class="tally-name">{{ t.name }}</span>
              <span class="tally-badge">{{ t.count }} {{ t.count === 1 ? 'persona' : 'personas' }}</span>
            </div>
            <div class="tally-sub">
              <span class="tally-active">🔥 {{ t.active }} en concurso</span> ·
              <span>{{ t.points }} pts</span>
            </div>
            <div class="tally-names">{{ t.names.join(', ') }}</div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="icon">📋</div>
        <p>Aún no hay participantes registrados.</p>
      </div>
    </div>
  </section>
</template>
