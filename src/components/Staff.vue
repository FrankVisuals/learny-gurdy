<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  song: { type: Object, required: true },
  beat: { type: Number, required: true },
  palette: { type: Object, required: true },
  windowBeats: { type: Number, default: 8 },
  height: { type: Number, default: 140 },
  lookback: { type: Number, default: 0.25 },
})

const ORDER = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]
const ACCIDENTALS = new Set([1, 3, 6, 8, 10])

function midiToStaffStep(midi) {
  const pc = ((midi % 12) + 12) % 12
  const oct = Math.floor(midi / 12) - 1
  const letterIdx = ORDER[pc]
  const diatonicAbsolute = (oct - 4) * 7 + letterIdx
  return {
    step: diatonicAbsolute - 6,
    accidental: ACCIDENTALS.has(pc),
  }
}

// Map a beat-duration to a notated rhythm. Snaps to the nearest base value
// (whole/half/quarter/eighth/sixteenth) and flags 1.5x as dotted (punktiert).
function durationInfo(d) {
  const eps = 0.05
  if (d >= 6 - eps) return { kind: 'whole', dotted: true }
  if (d >= 4 - eps) return { kind: 'whole', dotted: false }
  if (d >= 3 - eps) return { kind: 'half', dotted: true }
  if (d >= 2 - eps) return { kind: 'half', dotted: false }
  if (d >= 1.5 - eps) return { kind: 'quarter', dotted: true }
  if (d >= 1 - eps) return { kind: 'quarter', dotted: false }
  if (d >= 0.75 - eps) return { kind: 'eighth', dotted: true }
  if (d >= 0.5 - eps) return { kind: 'eighth', dotted: false }
  if (d >= 0.375 - eps) return { kind: 'sixteenth', dotted: true }
  return { kind: 'sixteenth', dotted: false }
}

const FLAG_COUNT = { whole: 0, half: 0, quarter: 0, eighth: 1, sixteenth: 2 }

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

const lineSpacing = 9
const staffTop = computed(() => (props.height - lineSpacing * 4) / 2)
const middleY = computed(() => staffTop.value + lineSpacing * 2)
const stepToY = (step) => middleY.value - (step * lineSpacing / 2)

const nowX = computed(() => w.value * props.lookback)
const pxPerBeat = computed(() => (w.value - nowX.value) / (props.windowBeats * (1 - props.lookback)))
const startBeat = computed(() => props.beat - props.lookback * props.windowBeats)
const endBeat = computed(() => props.beat + (1 - props.lookback) * props.windowBeats)

const staffLines = [0, 1, 2, 3, 4]

const beatsPerBar = computed(() => {
  const n = props.song.timeSig && props.song.timeSig[0]
  return n > 0 ? n : 4
})

// Pull the bar line a few pixels left of the downbeat so it visually
// separates from the first notehead of the bar instead of overlapping it.
const BAR_LINE_OFFSET = 9

const barLines = computed(() => {
  const out = []
  const bpb = beatsPerBar.value
  const firstBar = Math.floor(startBeat.value / bpb)
  const count = Math.ceil(props.windowBeats / bpb) + 2
  for (let i = 0; i < count; i++) {
    const barBeat = (firstBar + i) * bpb
    const x = nowX.value + (barBeat - props.beat) * pxPerBeat.value - BAR_LINE_OFFSET
    if (x < 60 || x > w.value + 4) continue
    out.push({ key: `bar-${barBeat}`, x })
  }
  return out
})

const visibleNotes = computed(() => {
  return props.song.notes
    .filter(n => n.t + n.d >= startBeat.value && n.t <= endBeat.value)
    .map((n, idx) => {
      const x = nowX.value + (n.t - props.beat) * pxPerBeat.value
      const { step, accidental } = midiToStaffStep(n.n)
      const y = stepToY(step)
      const isCurrent = props.beat >= n.t && props.beat < n.t + n.d
      const noteColor = isCurrent ? props.palette.nowline : props.palette.fg
      const opacity = x < nowX.value ? 0.32 : 1
      const stemUp = step < 0
      const stemX = stemUp ? x + 5 : x - 5
      const stemY1 = y
      const stemY2 = stemUp ? y - 24 : y + 24
      const ledgers = []
      if (step <= -6) {
        for (let s = -6; s >= step; s -= 2) ledgers.push(stepToY(s))
      } else if (step >= 6) {
        for (let s = 6; s <= step; s += 2) ledgers.push(stepToY(s))
      }
      const dur = durationInfo(n.d)
      const hollow = dur.kind === 'whole' || dur.kind === 'half'
      const hasStem = dur.kind !== 'whole'
      const flagCount = FLAG_COUNT[dur.kind]
      const flags = []
      // Flags always sit to the right of the stem; they curve away from the
      // stem tip back toward the notehead. For multiple flags (16th notes),
      // each successive flag shifts back along the stem.
      for (let i = 0; i < flagCount; i++) {
        const sy = stemUp ? stemY2 + i * 5 : stemY2 - i * 5
        const ey = stemUp ? sy + 12 : sy - 12
        flags.push({
          d: stemUp
            ? `M ${stemX} ${sy} Q ${stemX + 9} ${sy + 4}, ${stemX + 7} ${ey}`
            : `M ${stemX} ${sy} Q ${stemX + 9} ${sy - 4}, ${stemX + 7} ${ey}`,
        })
      }
      // Augmentation dot: even step = on a line → place dot in the space
      // above; odd step = already in a space → keep it on the same y.
      const dotX = x + 9
      const dotY = step % 2 === 0 ? y - lineSpacing / 2 : y
      return {
        key: `note-${idx}-${n.t}`,
        x, y, opacity, accidental, noteColor, stemX, stemY1, stemY2, stemUp,
        ledgers,
        coup: !!n.coup,
        hollow,
        hasStem,
        flags,
        dotted: dur.dotted,
        dotX, dotY,
      }
    })
})

const cleffY = computed(() => staffTop.value + lineSpacing * 4 + 6)
const cleffSize = lineSpacing * 5.4
</script>

<template>
  <div ref="wrapRef" class="staff" :style="{
    height: height + 'px',
    background: palette.bg2,
    border: `1px solid ${palette.panelBorder}`,
  }">
    <div class="staff-head" :style="{ color: palette.fgMute }">
      <span>Notation</span>
      <span class="staff-meta">
        {{ song.timeSig[0] }}/{{ song.timeSig[1] }} · {{ song.key }}
      </span>
    </div>

    <svg :width="w" :height="height" class="staff-svg">
      <defs>
        <clipPath id="staff-clip">
          <rect x="0" y="0" :width="w" :height="height" />
        </clipPath>
      </defs>

      <line
        v-for="i in staffLines"
        :key="`l-${i}`"
        x1="60"
        :x2="w"
        :y1="staffTop + i * lineSpacing"
        :y2="staffTop + i * lineSpacing"
        :stroke="palette.grid"
        stroke-width="1"
      />

      <text x="14" :y="cleffY" :font-size="cleffSize" font-family="serif" :fill="palette.fg">𝄞</text>

      <line
        v-for="b in barLines" :key="b.key"
        :x1="b.x" :x2="b.x"
        :y1="staffTop" :y2="staffTop + lineSpacing * 4"
        :stroke="palette.fgDim" stroke-width="1"
      />

      <line :x1="nowX" :x2="nowX" :y1="staffTop - 16" :y2="staffTop + lineSpacing * 4 + 16"
        :stroke="palette.nowline" stroke-width="1.5" opacity="0.85" />
      <circle :cx="nowX" :cy="staffTop - 16" r="3" :fill="palette.nowline" />

      <g clip-path="url(#staff-clip)">
        <g v-for="n in visibleNotes" :key="n.key" :opacity="n.opacity">
          <line v-for="(ly, li) in n.ledgers" :key="`led-${li}`"
            :x1="n.x - 7" :x2="n.x + 7" :y1="ly" :y2="ly"
            :stroke="n.noteColor" stroke-width="1" />
          <text v-if="n.accidental" :x="n.x - 12" :y="n.y + 4" font-size="13"
            :fill="n.noteColor" font-family="serif" text-anchor="middle">♯</text>
          <ellipse :cx="n.x" :cy="n.y" :rx="5.5" :ry="4.2"
            :fill="n.hollow ? 'none' : n.noteColor"
            :stroke="n.noteColor" stroke-width="1.5"
            :transform="`rotate(-20 ${n.x} ${n.y})`"
          />
          <circle v-if="n.dotted" :cx="n.dotX" :cy="n.dotY" r="1.6"
            :fill="n.noteColor" />
          <line v-if="n.hasStem" :x1="n.stemX" :x2="n.stemX" :y1="n.stemY1" :y2="n.stemY2"
            :stroke="n.noteColor" stroke-width="1.4" />
          <path v-for="(f, fi) in n.flags" :key="`${n.key}-flag-${fi}`"
            :d="f.d" :stroke="n.noteColor" stroke-width="1.4" fill="none"
            stroke-linecap="round" />
          <path v-if="n.coup"
            :d="`M ${n.x-4} ${n.stemUp ? n.stemY2 - 6 : n.stemY2 + 6} L ${n.x+4} ${n.stemUp ? n.stemY2 - 6 : n.stemY2 + 6}`"
            :stroke="palette.coup" stroke-width="2.2" stroke-linecap="round" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.staff {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
}
.staff-head {
  position: absolute;
  top: 8px;
  left: 14px;
  right: 14px;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  z-index: 2;
  pointer-events: none;
}
.staff-meta {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  letter-spacing: 0;
}
.staff-svg {
  display: block;
}
</style>
