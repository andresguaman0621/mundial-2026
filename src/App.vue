<script setup>
import { ref, computed, onMounted } from 'vue';
import { tournament, startTournamentPolling } from './composables/useTournament.js';
import { startParticipantsPolling } from './composables/useParticipants.js';
import { getMatchStatus } from './lib/tournament.js';
import StatsBar from './components/StatsBar.vue';
import NavTabs from './components/NavTabs.vue';
import MatchesTab from './components/MatchesTab.vue';
import RankingsTab from './components/RankingsTab.vue';
import GroupsTab from './components/GroupsTab.vue';
import AdminModal from './components/AdminModal.vue';

const activeTab = ref('matches');
const adminOpen = ref(false);

const liveGames = computed(() =>
  tournament.games.filter(g => getMatchStatus(g).cls === 'live').length
);

onMounted(() => {
  startTournamentPolling();
  startParticipantsPolling();
});
</script>

<template>
  <div class="pitch-pattern"></div>
  <button class="admin-btn" @click="adminOpen = true">⚙️ Admin</button>

  <div class="container">
    <header>
      <div class="logo">POLLA MUNDIAL 2026</div>
      <p class="subtitle">Apuesta por tu selección · El que más lejos llegue gana los puntos</p>
      <div v-if="liveGames > 0" class="live-badge">
        <span class="live-dot"></span>
        <span>{{ liveGames }} partido{{ liveGames > 1 ? 's' : '' }} en vivo</span>
      </div>
    </header>

    <StatsBar />

    <NavTabs v-model="activeTab" />

    <div class="sync-info" v-html="tournament.syncMessage"></div>

    <MatchesTab v-if="activeTab === 'matches'" />
    <RankingsTab v-if="activeTab === 'rankings'" />
    <GroupsTab v-if="activeTab === 'groups'" />

    <footer>Datos en tiempo real vía <a href="https://wcup2026.org" target="_blank" style="color:var(--gold)">wcup2026.org API</a> · Actualización automática cada 30s</footer>
  </div>

  <AdminModal :open="adminOpen" @close="adminOpen = false" />
</template>
