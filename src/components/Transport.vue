<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  palette: { type: Object, required: true },
  song: { type: Object, required: true },
  beat: { type: Number, required: true },
  songLength: { type: Number, required: true },
  loopRange: { type: Array, required: true },
  loopEnabled: { type: Boolean, required: true },
  tempoPct: { type: Number, required: true },
  metronome: { type: Boolean, required: true },
})
const emit = defineEmits(['seek', 'update:loopEnabled', 'update:tempoPct', 'update:metronome', 'update:loopRange'])

const timelineRef = ref(null)

function onTimelineClick(e) {
  if (suppressClick) return
  const r = timelineRef.value.getBoundingClientRect()
  const t = ((e.clientX - r.left) / r.width) * props.songLength
  emit('seek', Math.max(0, Math.min(props.songLength - 0.1, t)))
}

const MIN_LOOP = 1
let dragMode = null
let dragStartX = 0
let dragStartRange = [0, 0]
let suppressClick = false

function pxToBeats(dx) {
  if (!timelineRef.value) return 0
  return (dx / timelineRef.value.getBoundingClientRect().width) * props.songLength
}

function startLoopDrag(mode, e) {
  dragMode = mode
  dragStartX = e.clientX
  dragStartRange = [...props.loopRange]
  window.addEventListener('pointermove', onLoopDragMove)
  window.addEventListener('pointerup', endLoopDrag)
  window.addEventListener('pointercancel', endLoopDrag)
}

function onLoopDragMove(e) {
  if (!dragMode) return
  const delta = pxToBeats(e.clientX - dragStartX)
  const [s0, e0] = dragStartRange
  let next
  if (dragMode === 'left') {
    const ns = Math.max(0, Math.min(e0 - MIN_LOOP, Math.round(s0 + delta)))
    next = [ns, e0]
  } else if (dragMode === 'right') {
    const ne = Math.max(s0 + MIN_LOOP, Math.min(props.songLength, Math.round(e0 + delta)))
    next = [s0, ne]
  } else {
    const len = e0 - s0
    const ns = Math.max(0, Math.min(props.songLength - len, Math.round(s0 + delta)))
    next = [ns, ns + len]
  }
  if (next[0] !== props.loopRange[0] || next[1] !== props.loopRange[1]) {
    emit('update:loopRange', next)
  }
}

function endLoopDrag() {
  dragMode = null
  suppressClick = true
  setTimeout(() => { suppressClick = false }, 0)
  window.removeEventListener('pointermove', onLoopDragMove)
  window.removeEventListener('pointerup', endLoopDrag)
  window.removeEventListener('pointercancel', endLoopDrag)
}

const sectionBands = computed(() => {
  const colors = [props.palette.main, props.palette.chrom, props.palette.drone, props.palette.coup]
  return props.song.sections.map((s, i) => {
    const next = props.song.sections[i + 1]
    const left = (s.startBeat / props.songLength) * 100
    const width = (((next ? next.startBeat : props.songLength) - s.startBeat) / props.songLength) * 100
    return {
      key: `s-${i}`,
      label: s.label,
      style: {
        left: `${left}%`,
        width: `${width}%`,
        background: `${colors[i % colors.length]}1c`,
        borderLeft: i > 0 ? `1px solid ${props.palette.panelBorder}` : 'none',
      },
    }
  })
})

const coupTicks = computed(() =>
  props.song.notes.filter(n => n.coup).map((n, i) => ({
    key: `ct-${i}`,
    style: {
      left: `${(n.t / props.songLength) * 100}%`,
      background: props.palette.coup,
    },
  }))
)

const loopBoxStyle = computed(() => ({
  left: `${(props.loopRange[0] / props.songLength) * 100}%`,
  width: `${((props.loopRange[1] - props.loopRange[0]) / props.songLength) * 100}%`,
  background: `${props.palette.drone}25`,
  border: `1px solid ${props.palette.drone}`,
}))

const playheadStyle = computed(() => ({
  left: `${(props.beat / props.songLength) * 100}%`,
  background: props.palette.nowline,
  boxShadow: `0 0 8px ${props.palette.nowline}`,
}))

function chipStyle(active) {
  return {
    background: active ? props.palette.fg : props.palette.panel,
    color: active ? props.palette.bg : props.palette.fg,
    border: `1px solid ${active ? props.palette.fg : props.palette.panelBorder}`,
  }
}
</script>

<template>
  <div class="tr" :style="{
    background: palette.bg2,
    border: `1px solid ${palette.panelBorder}`,
  }">
    <div ref="timelineRef" class="tr-tl" @click="onTimelineClick" :style="{
      background: palette.panel,
      border: `1px solid ${palette.panelBorder}`,
    }">
      <div v-for="b in sectionBands" :key="b.key" class="tr-band" :style="b.style">
        <div class="tr-band-label" :style="{ color: palette.fgMute }">{{ b.label }}</div>
      </div>
      <div v-for="t in coupTicks" :key="t.key" class="tr-coup" :style="t.style" />
      <div
        v-if="loopEnabled"
        class="tr-loop"
        :style="loopBoxStyle"
        @click.stop
        @pointerdown.stop="startLoopDrag('body', $event)"
      >
        <div
          class="tr-loop-handle tr-loop-handle-l"
          :style="{ background: palette.drone }"
          @click.stop
          @pointerdown.stop="startLoopDrag('left', $event)"
        />
        <div
          class="tr-loop-handle tr-loop-handle-r"
          :style="{ background: palette.drone }"
          @click.stop
          @pointerdown.stop="startLoopDrag('right', $event)"
        />
      </div>
      <div class="tr-playhead" :style="playheadStyle" />
    </div>

    <div class="tr-controls">
      <div class="tr-tempo">
        <div class="tr-tempo-row" :style="{ color: palette.fgMute }">
          <span>Tempo</span>
          <span class="tr-tempo-val" :style="{ color: palette.fg }">{{ tempoPct }}%</span>
        </div>
        <input
          type="range"
          min="50" max="150" step="5"
          :value="tempoPct"
          :style="{ accentColor: palette.main }"
          @input="emit('update:tempoPct', parseInt($event.target.value))"
        />
      </div>

      <button class="tr-chip" :style="chipStyle(loopEnabled)" @click="emit('update:loopEnabled', !loopEnabled)">⇆ Loop</button>
      <button class="tr-chip" :style="chipStyle(metronome)" @click="emit('update:metronome', !metronome)">◇ Metronome</button>
    </div>
  </div>
</template>

<style scoped>
.tr {
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  gap: 18px;
  align-items: center;
  overflow: visible;
}
.tr-tl {
  flex: 1;
  position: relative;
  height: 44px;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
}
.tr-band {
  position: absolute;
  top: 0;
  bottom: 0;
}
.tr-band-label {
  position: absolute;
  left: 6px;
  top: 4px;
  font-size: 9px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}
.tr-coup {
  position: absolute;
  bottom: 4px;
  width: 2px;
  height: 10px;
  border-radius: 1px;
  opacity: 0.8;
}
.tr-loop {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 6px;
  cursor: grab;
  touch-action: none;
}
.tr-loop:active { cursor: grabbing; }
.tr-loop-handle {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 8px;
  border-radius: 3px;
  cursor: ew-resize;
  touch-action: none;
  opacity: 0.85;
}
.tr-loop-handle-l { left: -4px; }
.tr-loop-handle-r { right: -4px; }
.tr-playhead {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 2px;
}
.tr-controls {
  display: flex;
  gap: 14px;
  align-items: center;
}
.tr-tempo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 130px;
}
.tr-tempo-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.tr-tempo-val {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  letter-spacing: 0;
}
.tr-tempo input[type='range'] {
  width: 100%;
}
.tr-chip {
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.04em;
  font-family: inherit;
  transition: all 120ms ease-out;
}
</style>
