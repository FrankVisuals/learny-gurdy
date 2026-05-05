<script setup>
import { ref } from 'vue'

defineProps({
  title: { type: String, default: 'Settings' },
})

const open = ref(false)
</script>

<template>
  <button v-if="!open" class="twk-fab" aria-label="Open settings" @click="open = true">⚙</button>
  <div v-else class="twk-panel">
    <div class="twk-hd">
      <b>{{ title }}</b>
      <button class="twk-x" aria-label="Close" @click="open = false">✕</button>
    </div>
    <div class="twk-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.twk-fab {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483646;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: rgba(250,249,247,0.78);
  color: #29261b;
  border: 0.5px solid rgba(255,255,255,0.6);
  box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset, 0 12px 40px rgba(0,0,0,0.18);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  backdrop-filter: blur(24px) saturate(160%);
  cursor: pointer;
  font-size: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.twk-fab:hover { filter: brightness(1.05); }

.twk-panel {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483646;
  width: 280px;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  background: rgba(250,249,247,0.78);
  color: #29261b;
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  backdrop-filter: blur(24px) saturate(160%);
  border: 0.5px solid rgba(255,255,255,0.6);
  border-radius: 14px;
  box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset, 0 12px 40px rgba(0,0,0,0.18);
  font: 11.5px/1.4 ui-sans-serif, system-ui, -apple-system, sans-serif;
  overflow: hidden;
}
.twk-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px 10px 14px;
  user-select: none;
}
.twk-hd b {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.twk-x {
  appearance: none;
  border: 0;
  background: transparent;
  color: rgba(41,38,27,0.55);
  width: 22px;
  height: 22px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}
.twk-x:hover {
  background: rgba(0,0,0,0.06);
  color: #29261b;
}
.twk-body {
  padding: 2px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.15) transparent;
}
.twk-body::-webkit-scrollbar { width: 8px; }
.twk-body::-webkit-scrollbar-track { background: transparent; margin: 2px; }
.twk-body::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.15);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}
</style>
