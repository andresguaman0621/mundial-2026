<script setup>
const props = defineProps({ modelValue: String });
const emit = defineEmits(['update:modelValue']);

const tabs = [
  { id: 'matches', icon: '⚽', label: 'Partidos' },
  { id: 'rankings', icon: '🏆', label: 'Rankings' },
  { id: 'groups', icon: '📊', label: 'Grupos' }
];
</script>

<template>
  <nav class="nav-tabs">
    <button
      v-for="t in tabs"
      :key="t.id"
      class="tab-btn"
      :class="{ active: modelValue === t.id }"
      @click="emit('update:modelValue', t.id)"
    ><span class="tab-icon">{{ t.icon }}</span> {{ t.label }}</button>
  </nav>
</template>
