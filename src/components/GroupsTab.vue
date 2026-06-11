<script setup>
import { computed } from 'vue';
import { tournament } from '../composables/useTournament.js';
import {
  isGroupStageComplete, getQualifiedTeams, getTeamById, getTeamName
} from '../lib/tournament.js';

const groups = computed(() => {
  const qualified = isGroupStageComplete(tournament.games)
    ? getQualifiedTeams(tournament.groups)
    : null;

  return [...tournament.groups]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(group => {
      const teams = [...group.teams]
        .sort((a, b) => parseInt(b.pts) - parseInt(a.pts))
        .map(t => {
          const team = getTeamById(tournament.teams, t.team_id);
          return {
            team_id: t.team_id,
            isQual: Boolean(qualified && qualified.has(t.team_id)),
            flag: team ? team.flag : '',
            name: team ? getTeamName(team.name_en) : '?',
            mp: t.mp, w: t.w, d: t.d, pts: t.pts
          };
        });
      return { name: group.name, teams };
    });
});
</script>

<template>
  <section class="section active">
    <div class="card">
      <div class="card-title">Tabla de Grupos</div>
      <div class="groups-grid">
        <div v-for="group in groups" :key="group.name" class="group-card">
          <div class="group-header">Grupo {{ group.name }}</div>
          <div class="group-row header">
            <span></span><span>Equipo</span><span>PJ</span><span>G</span><span>E</span><span>Pts</span>
          </div>
          <div
            v-for="t in group.teams"
            :key="t.team_id"
            class="group-row"
            :class="{ qualified: t.isQual }"
          >
            <span><img v-if="t.flag" :src="t.flag" style="width:18px;height:12px;border-radius:2px"></span>
            <span style="font-weight:500">{{ t.name }}</span>
            <span>{{ t.mp }}</span><span>{{ t.w }}</span><span>{{ t.d }}</span>
            <span style="font-weight:700;color:var(--gold)">{{ t.pts }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
