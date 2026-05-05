<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  song: { type: Object, required: true },
  beat: { type: Number, required: true },
  palette: { type: Object, required: true },
  keys: { type: Array, required: true },
  tabMap: { type: Object, required: true },
  tabNumberMap: { type: Object, default: () => ({}) },
  tabsAsNumbers: { type: Boolean, default: false },
  midiToKeyIndex: { type: Function, required: true },
  windowBeats: { type: Number, default: 8 },
  lookback: { type: Number, default: 0.18 },
  height: { type: Number, default: 210 },
})

const PAD_X = 18
const TIME_H = 22
const HEAD_H = 30

const wrapRef = ref(null)
const w = ref(900)
let ro = null

onMounted(() => {
  if (!wrapRef.value) return
  ro = new ResizeObserver(() => {
    if (wrapRef.value) w.value = wrapRef.value.clientWidth
  })
  ro.observe(wrapRef.value)
  w.value = wrapRef.value.clientWidth
})
onBeforeUnmount(() => { if (ro) ro.disconnect() })

const ROW_H = computed(() => (props.height - TIME_H - HEAD_H) / 2)
const nowX = computed(() => PAD_X + (w.value - PAD_X * 2) * props.lookback)
const pxPerBeat = computed(() => (w.value - PAD_X - nowX.value) / ((1 - props.lookback) * props.windowBeats))
const startBeat = computed(() => props.beat - props.lookback * props.windowBeats)
const endBeat = computed(() => props.beat + (1 - props.lookback) * props.windowBeats)

function trackTop(row) {
  return HEAD_H + (row === 'chrom' ? 0 : ROW_H.value)
}

const visible = computed(() =>
  props.song.notes.filter(n => n.t + n.d >= startBeat.value && n.t <= endBeat.value)
)

const beatsPerBar = computed(() => {
  const n = props.song.timeSig && props.song.timeSig[0]
  return n > 0 ? n : 4
})

// Pull the bar line a few pixels left of the downbeat so it visually
// separates from the first note capsule of the bar instead of cutting through it.
const BAR_LINE_OFFSET = 6

const barLines = computed(() => {
  const out = []
  const bpb = beatsPerBar.value
  const firstBar = Math.floor(startBeat.value / bpb)
  const count = Math.ceil(props.windowBeats / bpb) + 2
  for (let i = 0; i < count; i++) {
    const barBeat = (firstBar + i) * bpb
    const x = nowX.value + (barBeat - props.beat) * pxPerBeat.value - BAR_LINE_OFFSET
    if (x < PAD_X || x > w.value - PAD_X) continue
    out.push({ key: `bar-${barBeat}`, x })
  }
  return out
})

const beatTicks = computed(() => {
  const out = []
  const bpb = beatsPerBar.value
  const count = Math.ceil(props.windowBeats) + 4
  for (let i = 0; i < count; i++) {
    const tickBeat = Math.floor(startBeat.value) + i
    if (tickBeat % bpb === 0) continue
    const x = nowX.value + (tickBeat - props.beat) * pxPerBeat.value
    if (x < PAD_X || x > w.value - PAD_X) continue
    out.push({ key: `t-${tickBeat}`, x })
  }
  return out
})

const noteCapsules = computed(() => {
  const out = []
  visible.value.forEach((n, idx) => {
    const keyIdx = props.midiToKeyIndex(n.n)
    if (keyIdx == null) return
    const key = props.keys[keyIdx]
    const isMain = key.row === 'main'
    const x = nowX.value + (n.t - props.beat) * pxPerBeat.value
    const wPx = Math.max(28, n.d * pxPerBeat.value - 6)
    const top = trackTop(key.row) + (ROW_H.value - 38) / 2
    const isCurrent = props.beat >= n.t && props.beat < n.t + n.d
    const isPast = props.beat >= n.t + n.d
    const color = isMain ? props.palette.main : props.palette.chrom
    out.push({
      key: `cap-${idx}-${n.t}`,
      x, top, wPx,
      isCurrent, isPast,
      color,
      tab: props.tabsAsNumbers ? (props.tabNumberMap[keyIdx] ?? '') : props.tabMap[keyIdx],
      coup: !!n.coup,
    })
  })
  return out
})

const coupTicks = computed(() => {
  return visible.value.filter(n => n.coup).map((n, idx) => {
    const x = nowX.value + (n.t - props.beat) * pxPerBeat.value
    const isCurrent = props.beat >= n.t && props.beat < n.t + 0.4
    return {
      key: `coup-${idx}-${n.t}`,
      x,
      visible: x >= PAD_X && x <= w.value - PAD_X,
      isCurrent,
      isPast: x < nowX.value - 4,
    }
  }).filter(t => t.visible)
})

function capsuleStyle(c) {
  return {
    left: `${c.x}px`,
    top: `${c.top}px`,
    width: `${c.wPx}px`,
    background: c.isPast
      ? `linear-gradient(180deg, ${c.color}33, ${c.color}22)`
      : `linear-gradient(180deg, ${c.color}, ${c.color}cc)`,
    border: `1.5px solid ${c.isCurrent ? props.palette.nowline : c.color}`,
    boxShadow: c.isCurrent
      ? `0 0 22px ${c.color}cc, 0 0 0 2px ${props.palette.nowline}`
      : c.isPast ? 'none' : `0 4px 16px ${c.color}55`,
    color: c.isPast ? c.color : '#0B1020',
    opacity: c.isPast ? 0.45 : 1,
    zIndex: c.isCurrent ? 4 : 1,
  }
}
</script>

<template>
  <div ref="wrapRef" class="lane" :style="{
    height: height + 'px',
    background: palette.bg2,
    border: `1px solid ${palette.panelBorder}`,
  }">
    <div class="lane-head" :style="{
      height: HEAD_H + 'px',
      color: palette.fgMute,
      borderBottom: `1px solid ${palette.panelBorder}`,
    }">
      <span>Tabs · Hurdy-gurdy</span>
      <span class="lane-head-legend">
        <span class="lane-head-tag" :style="{ color: palette.fgDim }">Chromatic</span>
        <span class="lane-head-bar" :style="{ background: palette.fgDim }" />
        <span class="lane-head-tag" :style="{ color: palette.fgDim }">Main row</span>
      </span>
    </div>

    <div class="lane-divider" :style="{
      left: PAD_X + 'px',
      right: PAD_X + 'px',
      top: (HEAD_H + ROW_H) + 'px',
      background: palette.grid,
    }" />

    <div class="lane-now" :style="{
      left: nowX + 'px',
      top: HEAD_H + 'px',
      bottom: TIME_H + 'px',
      background: palette.nowline,
      boxShadow: `0 0 12px ${palette.nowline}66`,
    }" />

    <svg :width="w" :height="height" class="lane-svg">
      <line v-for="b in barLines" :key="b.key"
        :x1="b.x" :x2="b.x"
        :y1="HEAD_H" :y2="height - TIME_H"
        :stroke="palette.grid" stroke-width="1"
      />
      <line v-for="t in beatTicks" :key="t.key"
        :x1="t.x" :x2="t.x"
        :y1="height - TIME_H" :y2="height - TIME_H + 5"
        :stroke="palette.fgDim" stroke-width="1"
      />
    </svg>

    <div v-for="c in noteCapsules" :key="c.key" class="lane-cap" :style="capsuleStyle(c)">
      {{ c.tab }}
      <span v-if="c.coup" class="lane-cap-coup" :style="{ color: palette.coup }">COUP</span>
    </div>

    <div class="lane-time" :style="{
      height: TIME_H + 'px',
      background: palette.bg,
      borderTop: `1px solid ${palette.panelBorder}`,
    }">
      <div v-for="t in coupTicks" :key="t.key" class="lane-time-tick"
        :style="{
          left: (t.x - 2) + 'px',
          height: (TIME_H - 6) + 'px',
          background: palette.coup,
          boxShadow: t.isCurrent ? `0 0 10px ${palette.coup}` : 'none',
          opacity: t.isPast ? 0.35 : 1,
        }" />
    </div>
  </div>
</template>

<style scoped>
.lane {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
}
.lane-head {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 18px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  z-index: 3;
}
.lane-head-legend {
  display: flex;
  gap: 12px;
  align-items: center;
  letter-spacing: 0;
  text-transform: none;
}
.lane-head-tag {
  font-size: 10px;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}
.lane-head-bar {
  width: 22px;
  height: 2px;
}
.lane-divider {
  position: absolute;
  height: 1px;
}
.lane-now {
  position: absolute;
  width: 2px;
  z-index: 2;
}
.lane-svg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.lane-cap {
  position: absolute;
  height: 38px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 14px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 700;
  font-size: 16px;
  transition: opacity 120ms linear;
  overflow: hidden;
  white-space: nowrap;
}
.lane-cap-coup {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  background: rgba(0,0,0,0.55);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.06em;
}
.lane-time {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}
.lane-time-tick {
  position: absolute;
  top: 3px;
  width: 4px;
  border-radius: 2px;
}
</style>
