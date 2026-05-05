<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  rpm: { type: Number, required: true },
  targetRpm: { type: Number, required: true },
  palette: { type: Object, required: true },
})

const SIZE = 110

const armRef = ref(null)
const angle = ref(0)
let raf = null
let last = 0

function tick(now) {
  const dt = (now - last) / 1000
  last = now
  angle.value = (angle.value + props.rpm * 360 / 60 * dt) % 360
  if (armRef.value) armRef.value.style.transform = `rotate(${angle.value}deg)`
  raf = requestAnimationFrame(tick)
}

function start() {
  if (raf != null) return
  last = performance.now()
  raf = requestAnimationFrame(tick)
}

start()
watch(() => props.rpm, () => { /* loop continues */ })
onBeforeUnmount(() => { if (raf) cancelAnimationFrame(raf) })

const statusColor = computed(() => {
  const ratio = props.rpm / Math.max(props.targetRpm, 0.001)
  if (ratio < 0.6 || ratio > 1.4) return props.palette.coup
  if (ratio < 0.85 || ratio > 1.15) return '#E8A85A'
  return props.palette.drone
})

const tickMarks = Array.from({ length: 12 }).map((_, i) => {
  const a = (i / 12) * Math.PI * 2 - Math.PI / 2
  const r1 = SIZE / 2 - 6
  const r2 = SIZE / 2 - (i % 3 === 0 ? 12 : 9)
  const cx = SIZE / 2
  const cy = SIZE / 2
  return {
    x1: cx + Math.cos(a) * r1,
    y1: cy + Math.sin(a) * r1,
    x2: cx + Math.cos(a) * r2,
    y2: cy + Math.sin(a) * r2,
  }
})

const targetArc = computed(() => ({
  dasharray: `${0.18 * (SIZE - 8) * Math.PI} 999`,
  dashoffset: -(0.41 * (SIZE - 8) * Math.PI),
}))

const wrapStyle = { width: `${SIZE + 20}px` }
const dialStyle = computed(() => ({
  width: `${SIZE}px`,
  height: `${SIZE}px`,
}))
const rimStyle = computed(() => ({
  border: `2px solid ${props.palette.panelBorder}`,
  background: `radial-gradient(circle at 50% 40%, ${props.palette.panel}, ${props.palette.bg2})`,
}))
const armStyle = computed(() => ({
  background: statusColor.value,
  height: `${SIZE / 2 - 14}px`,
  boxShadow: `0 0 10px ${statusColor.value}aa`,
}))
const armCapStyle = computed(() => ({
  background: statusColor.value,
  boxShadow: `0 0 12px ${statusColor.value}cc`,
}))
const hubStyle = computed(() => ({
  background: props.palette.fg,
}))
</script>

<template>
  <div class="crank-wrap" :style="wrapStyle">
    <div class="crank-dial" :style="dialStyle">
      <div class="crank-rim" :style="rimStyle" />
      <svg :width="SIZE" :height="SIZE" class="crank-svg">
        <line
          v-for="(m, i) in tickMarks" :key="i"
          :x1="m.x1" :y1="m.y1" :x2="m.x2" :y2="m.y2"
          :stroke="palette.fgDim" stroke-width="1.5" stroke-linecap="round"
        />
      </svg>
      <div ref="armRef" class="crank-arm-rotor">
        <div class="crank-arm" :style="armStyle" />
        <div class="crank-arm-cap" :style="armCapStyle" />
      </div>
      <div class="crank-hub" :style="hubStyle" />
      <svg :width="SIZE" :height="SIZE" class="crank-svg">
        <circle
          :cx="SIZE/2" :cy="SIZE/2" :r="SIZE/2 - 4"
          fill="none"
          :stroke="palette.drone"
          stroke-width="3"
          :stroke-dasharray="targetArc.dasharray"
          :stroke-dashoffset="targetArc.dashoffset"
          :transform="`rotate(-90 ${SIZE/2} ${SIZE/2})`"
          opacity="0.6"
        />
      </svg>
    </div>
    <div class="crank-rpm" :style="{ color: statusColor }">
      {{ rpm.toFixed(0) }}<span class="crank-rpm-unit" :style="{ color: palette.fgMute }">rpm</span>
    </div>
    <div class="crank-target" :style="{ color: palette.fgMute }">
      Ziel · {{ targetRpm.toFixed(0) }}
    </div>
  </div>
</template>

<style scoped>
.crank-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.crank-dial {
  position: relative;
}
.crank-rim,
.crank-svg {
  position: absolute;
  inset: 0;
}
.crank-rim {
  border-radius: 50%;
}
.crank-arm-rotor {
  position: absolute;
  inset: 0;
  will-change: transform;
}
.crank-arm {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 4px;
  border-radius: 2px;
  transform: translate(-50%, -100%);
}
.crank-arm-cap {
  position: absolute;
  left: 50%;
  top: 14px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
.crank-hub {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 6px rgba(0,0,0,0.45);
}
.crank-rpm {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}
.crank-rpm-unit {
  font-size: 11px;
  margin-left: 4px;
  letter-spacing: 0;
}
.crank-target {
  font-size: 10px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}
</style>
