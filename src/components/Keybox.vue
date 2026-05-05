<script setup>
import { computed } from 'vue'

const props = defineProps({
  keys: { type: Array, required: true },
  activeIdx: { type: Array, required: true },
  palette: { type: Object, required: true },
  tabMap: { type: Object, required: true },
  tabNumberMap: { type: Object, default: () => ({}) },
  showTabNumbers: { type: Boolean, default: true },
})

const KEY_W = 34
const GAP = 4
const MAIN_H = 64
const CHROM_H = 86
const BASEBOARD = 28

const totalW = computed(() => props.keys.length * (KEY_W + GAP) - GAP)
const totalH = CHROM_H + 6 + MAIN_H + BASEBOARD

const headerStyle = computed(() => ({
  color: props.palette.fgMute,
}))

const containerStyle = computed(() => ({
  background: props.palette.bg2,
  border: `1px solid ${props.palette.panelBorder}`,
}))

const baseboardStyle = computed(() => ({
  height: `${BASEBOARD}px`,
  background: `linear-gradient(180deg, ${props.palette.panel}, transparent)`,
  borderTop: `1px solid ${props.palette.panelBorder}`,
}))

function keyWrapStyle(k, idx) {
  const x = idx * (KEY_W + GAP)
  const isMain = k.row === 'main'
  const top = isMain ? CHROM_H + 6 : 0
  const h = isMain ? MAIN_H : CHROM_H
  const isActive = props.activeIdx.includes(k.i)
  return {
    left: `${x}px`,
    top: `${top}px`,
    width: `${KEY_W}px`,
    height: `${h}px`,
    transform: isActive ? `translateY(${isMain ? 8 : 6}px)` : 'translateY(0)',
  }
}

function keyTrackStyle() {
  return { background: props.palette.panel }
}

function keyPegStyle(k) {
  const isMain = k.row === 'main'
  const isActive = props.activeIdx.includes(k.i)
  const color = isMain ? props.palette.main : props.palette.chrom
  return {
    bottom: isMain ? '2px' : '6px',
    background: isActive
      ? `linear-gradient(180deg, ${color}, ${color}cc)`
      : `linear-gradient(180deg, ${props.palette.panel}, ${props.palette.bg2})`,
    border: `1px solid ${isActive ? color : props.palette.panelBorder}`,
    boxShadow: isActive
      ? `0 0 16px ${color}88, inset 0 -2px 0 rgba(0,0,0,0.25)`
      : 'inset 0 -2px 0 rgba(0,0,0,0.20)',
  }
}

function tabNumberStyle(k) {
  const isActive = props.activeIdx.includes(k.i)
  return { color: isActive ? '#0B1020' : props.palette.fgMute }
}

function labelStyle(k) {
  const isActive = props.activeIdx.includes(k.i)
  return { color: isActive ? 'rgba(0,0,0,0.55)' : props.palette.fgDim }
}
</script>

<template>
  <div class="kb" :style="containerStyle">
    <div class="kb-head" :style="headerStyle">
      <span>Hurdy-gurdy · 23 Keys</span>
      <span class="kb-legend">
        <span class="kb-legend-item">
          <span class="kb-swatch" :style="{ background: palette.main }" /> Main row
        </span>
        <span class="kb-legend-item">
          <span class="kb-swatch" :style="{ background: palette.chrom }" /> Chromatic
        </span>
        <span class="kb-legend-item">
          <span class="kb-swatch" :style="{ background: palette.coup }" /> Coup
        </span>
      </span>
    </div>

    <div class="kb-scroll">
      <div class="kb-stage" :style="{ width: totalW + 'px', height: totalH + 'px' }">
        <div class="kb-base" :style="baseboardStyle" />
        <div
          v-for="(k, idx) in keys"
          :key="k.i"
          class="kb-key"
          :style="keyWrapStyle(k, idx)"
        >
          <div class="kb-key-track" :style="keyTrackStyle()" />
          <div class="kb-key-peg" :style="keyPegStyle(k)">
            <div class="kb-key-tab" :style="tabNumberStyle(k)">{{ tabMap[k.i] }}</div>
            <div v-if="showTabNumbers" class="kb-key-label" :style="labelStyle(k)">{{ tabNumberMap[k.i] }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kb {
  border-radius: 14px;
  padding: 14px 18px 10px;
  position: relative;
}
.kb-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.kb-legend {
  display: flex;
  gap: 14px;
  align-items: center;
}
.kb-legend-item {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}
.kb-swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.kb-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}
.kb-stage {
  position: relative;
  margin: 0 auto;
}
.kb-base {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 6px;
}
.kb-key {
  position: absolute;
  transition: transform 80ms ease-out, box-shadow 120ms ease-out;
}
.kb-key-track {
  position: absolute;
  inset: 0;
  border-radius: 4px;
}
.kb-key-peg {
  position: absolute;
  left: 2px;
  right: 2px;
  top: 2px;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 4px 0 6px;
}
.kb-key-tab {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}
.kb-key-label {
  font-size: 9px;
  letter-spacing: 0.04em;
  margin-top: 2px;
}

@media (max-width: 720px) {
  .kb { padding: 12px 12px 8px; }
  .kb-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .kb-legend { flex-wrap: wrap; gap: 10px; }
  .kb-stage { margin: 0; }
}
</style>
