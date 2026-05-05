<script setup>
import { computed } from 'vue'

const props = defineProps({
  palette: { type: Object, required: true },
  value: { type: Number, required: true },
  baseMidi: { type: Number, default: 60 },
})
const emit = defineEmits(['update:value'])

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function midiToName(midi) {
  const pc = ((midi % 12) + 12) % 12
  const oct = Math.floor(midi / 12) - 1
  return `${NOTE_NAMES[pc]}${oct}`
}

const resultName = computed(() => midiToName(props.baseMidi + (props.value | 0)))
const sign = computed(() => props.value > 0 ? '+' : (props.value < 0 ? '' : '±'))

function dec() { emit('update:value', Math.max(-12, (props.value | 0) - 1)) }
function inc() { emit('update:value', Math.min(12, (props.value | 0) + 1)) }

const wrapStyle = computed(() => ({
  background: props.palette.panel,
  border: `1px solid ${props.palette.panelBorder}`,
}))
const labelStyle = computed(() => ({ color: props.palette.fgMute }))
const btnStyle = computed(() => ({
  background: props.palette.panel,
  border: `1px solid ${props.palette.panelBorder}`,
  color: props.palette.fg,
}))
const valueStyle = computed(() => ({ color: props.palette.fg }))
const subStyle = computed(() => ({ color: props.palette.fgMute }))
</script>

<template>
  <div class="trp" :style="wrapStyle">
    <span class="trp-label" :style="labelStyle">Transpose</span>
    <button class="trp-btn" :style="btnStyle" title="Semitone lower" @click="dec">−</button>
    <div class="trp-val" :style="valueStyle">
      <div>{{ sign }}{{ value }} ST</div>
      <div class="trp-sub" :style="subStyle">→ {{ resultName }}</div>
    </div>
    <button class="trp-btn" :style="btnStyle" title="Semitone higher" @click="inc">+</button>
  </div>
</template>

<style scoped>
.trp {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px 4px 12px;
  border-radius: 999px;
}
.trp-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.trp-btn {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.trp-val {
  min-width: 80px;
  text-align: center;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.1;
}
.trp-sub {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0;
}

@media (max-width: 720px) {
  .trp { padding: 4px 6px 4px 10px; gap: 2px; }
  .trp-label { display: none; }
  .trp-val { min-width: 56px; font-size: 12px; }
  .trp-sub { display: none; }
}
</style>
