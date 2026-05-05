<script setup>
import { computed } from 'vue'
import TransposeStepper from './TransposeStepper.vue'
import Tuner from './Tuner.vue'
import { tonicToMidi } from '../data/keys.js'

const props = defineProps({
  palette: { type: Object, required: true },
  song: { type: Object, required: true },
  section: { type: Object, required: true },
  playing: { type: Boolean, required: true },
  beat: { type: Number, required: true },
  tonic: { type: String, required: true },
  transpose: { type: Number, required: true },
})
const emit = defineEmits(['play', 'reset', 'update:tonic', 'update:transpose', 'back-to-library'])

const tonicMidi = computed(() => tonicToMidi(props.tonic))

const logoStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.palette.main}, ${props.palette.chrom})`,
  boxShadow: `0 4px 14px ${props.palette.glow}`,
}))

const tonicWrapStyle = computed(() => ({
  background: props.palette.panel,
  border: `1px solid ${props.palette.panelBorder}`,
}))

const tonicLabelStyle = computed(() => ({ color: props.palette.fgMute }))
const tonicSelectStyle = computed(() => ({ color: props.palette.fg }))

const beatStyle = computed(() => ({ color: props.palette.fg }))

const baseBtn = computed(() => ({
  background: props.palette.panel,
  border: `1px solid ${props.palette.panelBorder}`,
  color: props.palette.fg,
}))

const playBtnStyle = computed(() => ({
  background: props.playing ? props.palette.fg : `linear-gradient(180deg, ${props.palette.main}, ${props.palette.main}cc)`,
  color: props.playing ? props.palette.bg : '#0B1020',
  boxShadow: `0 4px 14px ${props.palette.glow}`,
  border: 'none',
}))

const tonics = ['G', 'A', 'B', 'C', 'D', 'E', 'F']
</script>

<template>
  <div class="top">
    <button class="top-back" :style="baseBtn" @click="emit('back-to-library')" title="Back to library">
      <span class="top-back-arrow">←</span>
      <span class="top-back-label">Library</span>
    </button>
    <div class="top-id">
      <div class="top-logo" :style="logoStyle">L</div>
      <div>
        <div class="top-eyebrow" :style="{ color: palette.fgMute }">LearnyGurdy</div>
        <div class="top-title">
          {{ song.title }}
          <span class="top-subtitle" :style="{ color: palette.fgMute }">{{ song.subtitle }}</span>
        </div>
      </div>
    </div>

    <div class="top-spacer" />

    <div class="top-tonic" :style="tonicWrapStyle">
      <span class="top-tonic-label" :style="tonicLabelStyle">Root note</span>
      <select
        :value="tonic"
        @change="emit('update:tonic', $event.target.value)"
        :style="tonicSelectStyle"
      >
        <option v-for="t in tonics" :key="t" :value="t" :style="{ background: palette.bg2, color: palette.fg }">{{ t }}</option>
      </select>
    </div>

    <TransposeStepper :palette="palette" :value="transpose" :base-midi="tonicMidi"
      @update:value="v => emit('update:transpose', v)" />

    <Tuner :palette="palette" />

    <button class="top-btn" :style="baseBtn" title="Restart" @click="emit('reset')">↺</button>
    <button class="top-btn top-btn-play" :style="playBtnStyle" @click="emit('play')">
      {{ playing ? '❚❚' : '▶' }}
    </button>
  </div>
</template>

<style scoped>
.top {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.top-id {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1 1 auto;
}
.top-id > div { min-width: 0; }
.top-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #0B1020;
  font-size: 15px;
  letter-spacing: -0.05em;
}
.top-eyebrow {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.top-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.top-subtitle {
  font-size: 12px;
  font-weight: 500;
  margin-left: 10px;
  letter-spacing: 0;
}
.top-spacer { flex: 1; }
.top-pill {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.top-tonic {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 4px 4px 12px;
  border-radius: 999px;
}
.top-tonic-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.top-tonic select {
  background: transparent;
  border: none;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 14px;
  font-weight: 700;
  padding: 4px 6px;
  cursor: pointer;
}
.top-tonic select:focus { outline: none; }
.top-beat {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  min-width: 64px;
  text-align: right;
}
.top-btn {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 120ms ease-out;
  font-family: inherit;
  padding: 0;
}
.top-btn-play {
  width: 34px;
  height: 34px;
  font-weight: 800;
  font-size: 14px;
}
.top-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px 0 12px;
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.top-back-arrow {
  font-size: 14px;
  line-height: 1;
}
.top-back-label {
  line-height: 1;
}

@media (max-width: 720px) {
  .top { gap: 8px; }
  .top-spacer { flex-basis: 100%; height: 0; }
  .top-eyebrow { display: none; }
  .top-subtitle { display: none; }
  .top-back-label { display: none; }
  .top-back { padding: 0 10px; }
  .top-logo { width: 30px; height: 30px; border-radius: 8px; font-size: 13px; }
  .top-title { font-size: 15px; }
  .top-tonic { padding: 4px 4px 4px 10px; }
  .top-tonic-label { display: none; }
}
</style>
