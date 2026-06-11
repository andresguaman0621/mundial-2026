<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { tournament } from '../composables/useTournament.js';
import {
  participantsState, login, logout, addParticipant, removeParticipant
} from '../composables/useParticipants.js';
import { getParticipantStatus, getTeamName } from '../lib/tournament.js';

const props = defineProps({ open: Boolean });
const emit = defineEmits(['close']);

const loginUser = ref('');
const loginPass = ref('');
const loginError = ref('');

const pName = ref('');
const pTeam = ref('');
const pPoints = ref(5);
const addMsg = ref('');
const addMsgClass = ref('success-msg');

const teamOptions = computed(() =>
  [...tournament.teams]
    .sort((a, b) => getTeamName(a.name_en).localeCompare(getTeamName(b.name_en)))
    .map(t => ({ id: t.id, name: getTeamName(t.name_en), name_en: t.name_en, group: t.groups, flag: t.flag }))
);

// Selector de selección por bandera (dropdown personalizado con buscador).
const teamOpen = ref(false);
const teamSearch = ref('');
const fsRef = ref(null);

const selectedTeam = computed(() => teamOptions.value.find(t => t.id === pTeam.value) || null);
const filteredTeams = computed(() => {
  const q = teamSearch.value.trim().toLowerCase();
  if (!q) return teamOptions.value;
  return teamOptions.value.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.name_en.toLowerCase().includes(q) ||
    `grupo ${t.group}`.toLowerCase().includes(q)
  );
});

function toggleTeam() { teamOpen.value = !teamOpen.value; teamSearch.value = ''; }
function selectTeam(id) { pTeam.value = id; teamOpen.value = false; }
function onDocClick(e) {
  if (fsRef.value && !fsRef.value.contains(e.target)) teamOpen.value = false;
}
onMounted(() => document.addEventListener('mousedown', onDocClick));
onUnmounted(() => document.removeEventListener('mousedown', onDocClick));

// Puntos: solo enteros >= 1 (validación de frontend).
function blockNeg(e) { if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault(); }
function clampPoints() {
  let n = Math.floor(Number(pPoints.value));
  if (!Number.isFinite(n) || n < 1) n = 1;
  pPoints.value = n;
}

const adminList = computed(() =>
  participantsState.participants.map(p => ({
    ...p,
    stageLabel: getParticipantStatus(tournament.teamStatus, p).stageLabel,
    teamNameEs: getTeamName(p.teamName)
  }))
);

async function doLogin() {
  // El usuario es decorativo (como en el original); valida solo la password en el server.
  const ok = await login(loginPass.value);
  if (ok) {
    loginError.value = '';
    loginPass.value = '';
  } else {
    loginError.value = 'Usuario o contraseña incorrectos';
  }
}

function doLogout() {
  logout();
}

async function onAdd() {
  const name = pName.value.trim();
  const points = parseInt(pPoints.value) || 0;
  if (!name) { addMsg.value = 'Ingresa un nombre'; addMsgClass.value = 'error-msg'; return; }
  if (points < 1) { addMsg.value = 'Los puntos deben ser al menos 1'; addMsgClass.value = 'error-msg'; return; }

  const teamId = pTeam.value || (teamOptions.value[0] && teamOptions.value[0].id);
  const opt = teamOptions.value.find(t => t.id === teamId);
  if (!opt) { addMsg.value = 'Selecciona una selección'; addMsgClass.value = 'error-msg'; return; }

  try {
    await addParticipant({ name, teamId, teamName: opt.name_en, points });
    pName.value = '';
    pPoints.value = 5;
    addMsg.value = `✅ ${name} agregado con ${points} pts a ${getTeamName(opt.name_en)}`;
    addMsgClass.value = 'success-msg';
  } catch (e) {
    addMsg.value = e.message;
    addMsgClass.value = 'error-msg';
  }
}

async function onRemove(id) {
  if (!confirm('¿Eliminar este participante?')) return;
  try {
    await removeParticipant(id);
  } catch (e) {
    alert(e.message);
  }
}

function onOverlayClick(e) {
  if (e.target === e.currentTarget) emit('close');
}
</script>

<template>
  <div class="modal-overlay" :class="{ open }" @click="onOverlayClick">
    <div class="modal">
      <button class="close-modal" @click="emit('close')">×</button>

      <div v-if="!participantsState.isAdmin">
        <h2>🔐 Acceso Admin</h2>
        <div class="form-group">
          <label>Usuario</label>
          <input type="text" v-model="loginUser" placeholder="admin" autocomplete="username">
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" v-model="loginPass" placeholder="••••••••"
                 autocomplete="current-password" @keydown.enter="doLogin">
        </div>
        <button class="btn btn-primary" @click="doLogin">Ingresar</button>
        <p v-if="loginError" class="error-msg">{{ loginError }}</p>
        <p style="font-size:0.75rem;color:var(--muted);margin-top:12px">Default: admin / mundial2026</p>
      </div>

      <div v-else>
        <h2>⚙️ Panel Admin</h2>
        <div class="form-group">
          <label>Nombre del participante</label>
          <input type="text" v-model="pName" placeholder="Ej: Paul Arreaga">
        </div>
        <div class="form-group">
          <label>País / Selección</label>
          <div class="flag-select" ref="fsRef">
            <button type="button" class="flag-select-btn" :class="{ open: teamOpen }" @click="toggleTeam">
              <img v-if="selectedTeam?.flag" :src="selectedTeam.flag" class="fs-flag" alt="">
              <span v-if="selectedTeam">{{ selectedTeam.name }}</span>
              <span v-else class="fs-placeholder">Selecciona una selección</span>
              <span class="fs-caret">▾</span>
            </button>
            <div v-if="teamOpen" class="flag-select-panel">
              <input class="fs-search" v-model="teamSearch" placeholder="Buscar país..." />
              <div class="fs-list">
                <button
                  v-for="t in filteredTeams"
                  :key="t.id"
                  type="button"
                  class="fs-option"
                  :class="{ active: t.id === pTeam }"
                  @click="selectTeam(t.id)"
                >
                  <img v-if="t.flag" :src="t.flag" class="fs-flag" alt="">
                  <span>{{ t.name }}</span>
                  <span class="fs-group">Grupo {{ t.group }}</span>
                </button>
                <div v-if="!filteredTeams.length" class="fs-empty">Sin resultados</div>
              </div>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>Puntos apostados</label>
          <input type="number" v-model.number="pPoints" min="1" step="1" placeholder="5"
                 @keydown="blockNeg" @blur="clampPoints">
        </div>
        <button class="btn btn-primary" @click="onAdd">➕ Agregar Participante</button>
        <p v-if="addMsg" :class="addMsgClass">{{ addMsg }}</p>

        <hr style="border:none;border-top:1px solid var(--card-border);margin:20px 0">
        <div class="card-title" style="font-size:1.2rem">Participantes registrados</div>
        <div>
          <p v-if="!adminList.length" style="color:var(--muted);font-size:0.85rem">Sin participantes aún</p>
          <div v-for="p in adminList" :key="p.id" class="admin-participant">
            <div class="info">
              <div class="pname">{{ p.name }}</div>
              <div class="pteam">{{ p.teamNameEs }} · {{ p.points }} pts · {{ p.stageLabel }}</div>
            </div>
            <button class="btn btn-danger" @click="onRemove(p.id)">✕</button>
          </div>
        </div>

        <hr style="border:none;border-top:1px solid var(--card-border);margin:20px 0">
        <button class="btn btn-ghost" style="width:100%" @click="doLogout">Cerrar sesión</button>
      </div>
    </div>
  </div>
</template>
