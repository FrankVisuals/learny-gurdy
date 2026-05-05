<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  palette: { type: Object, required: true },
})

const active = ref(false)
const noteName = ref(null)
const freq = ref(null)
const cents = ref(0)

let audioCtx = null
let analyser = null
let stream = null
let rafId = null
let buf = null
let frameCount = 0

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function freqToNote(f) {
  const midi = 12 * Math.log2(f / 440) + 69
  const rounded = Math.round(midi)
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12]
  const octave = Math.floor(rounded / 12) - 1
  return { name: `${name}${octave}`, cents: Math.round((midi - rounded) * 100) }
}

function autoCorrelate(data, sampleRate) {
  let rms = 0
  for (let i = 0; i < data.length; i++) rms += data[i] * data[i]
  if (Math.sqrt(rms / data.length) < 0.015) return -1

  // Find zero-crossing trim points
  let r1 = 0, r2 = data.length - 1
  for (let i = 0; i < data.length / 2; i++) {
    if (Math.abs(data[i]) < 0.2) { r1 = i; break }
  }
  for (let i = 1; i < data.length / 2; i++) {
    if (Math.abs(data[data.length - i]) < 0.2) { r2 = data.length - i; break }
  }
  const trimmed = data.slice(r1, r2)
  const SIZE = trimmed.length

  // Autocorrelation
  const c = new Float32Array(SIZE)
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) c[i] += trimmed[j] * trimmed[j + i]
  }

  // Find first dip then peak
  let d = 0
  while (c[d] > c[d + 1]) d++
  let maxVal = -1, maxPos = -1
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxVal) { maxVal = c[i]; maxPos = i }
  }
  if (maxPos < 1 || maxPos >= SIZE - 1) return -1

  // Parabolic interpolation for sub-sample accuracy
  const [x1, x2, x3] = [c[maxPos - 1], c[maxPos], c[maxPos + 1]]
  const a = (x1 + x3 - 2 * x2) / 2
  const T0 = a ? maxPos - (x3 - x1) / (4 * a) : maxPos
  return sampleRate / T0
}

function tick() {
  if (!active.value) return
  // Run detection at ~20fps to keep CPU load low
  if (++frameCount % 3 === 0) {
    analyser.getFloatTimeDomainData(buf)
    const f = autoCorrelate(buf, audioCtx.sampleRate)
    if (f > 50 && f < 1500) {
      freq.value = Math.round(f * 10) / 10
      const result = freqToNote(f)
      noteName.value = result.name
      cents.value = result.cents
    }
  }
  rafId = requestAnimationFrame(tick)
}

async function toggle() {
  active.value ? stop() : await start()
}

async function start() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    audioCtx = new AudioContext()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    buf = new Float32Array(analyser.fftSize)
    audioCtx.createMediaStreamSource(stream).connect(analyser)
    active.value = true
    noteName.value = null
    freq.value = null
    frameCount = 0
    rafId = requestAnimationFrame(tick)
  } catch {
    // mic denied — silently ignore
  }
}

function stop() {
  active.value = false
  if (rafId) { cancelAnimationFrame(rafId); rafId = null }
  stream?.getTracks().forEach(t => t.stop())
  audioCtx?.close()
  stream = null; audioCtx = null; analyser = null; buf = null
}

onBeforeUnmount(stop)

const inTune = computed(() => Math.abs(cents.value) < 8)

const btnStyle = computed(() => ({
  background: active.value ? props.palette.main : props.palette.panel,
  color: active.value ? props.palette.bg : props.palette.fg,
  border: `1px solid ${active.value ? props.palette.main : props.palette.panelBorder}`,
}))

const displayStyle = computed(() => ({
  background: props.palette.bg2,
  border: `1px solid ${props.palette.panelBorder}`,
}))

const noteStyle = computed(() => ({ color: props.palette.main }))
const freqStyle = computed(() => ({ color: props.palette.fgMute }))
const centsColor = computed(() => inTune.value ? props.palette.drone : props.palette.coup)

// Cents bar: fill extends left (flat) or right (sharp) from center
const centsFillStyle = computed(() => {
  const c = Math.max(-50, Math.min(50, cents.value))
  const pct = Math.abs(c) / 50 * 50  // % of bar half
  return {
    position: 'absolute',
    top: 0, bottom: 0,
    width: `${pct}%`,
    ...(c >= 0 ? { left: '50%' } : { right: '50%' }),
    background: centsColor.value,
    borderRadius: '2px',
    transition: 'width 60ms, background 120ms',
  }
})
</script>

<template>
  <div class="tuner">
    <button class="tuner-btn" :style="btnStyle" @click="toggle">
      ♩ Tuner
    </button>

    <Transition name="tuner-fade">
      <div v-if="active" class="tuner-display" :style="displayStyle">
        <template v-if="noteName">
          <div class="tuner-note" :style="noteStyle">{{ noteName }}</div>
          <div class="tuner-freq" :style="freqStyle">{{ freq }} Hz</div>
          <div class="tuner-bar" :style="{ background: `${palette.panelBorder}` }">
            <div :style="centsFillStyle" />
            <div class="tuner-center" :style="{ background: palette.fgDim }" />
          </div>
          <div class="tuner-cents" :style="{ color: centsColor }">
            {{ cents >= 0 ? '+' : '' }}{{ cents }}¢
          </div>
        </template>
        <div v-else class="tuner-listening" :style="{ color: palette.fgMute }">Listening…</div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tuner {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.tuner-btn {
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.04em;
  font-family: inherit;
  transition: all 120ms ease-out;
  white-space: nowrap;
}
.tuner-display {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 110px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.18);
}
.tuner-note {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.tuner-freq {
  font-size: 11px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.tuner-bar {
  position: relative;
  width: 84px;
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 2px;
}
.tuner-center {
  position: absolute;
  top: 0; bottom: 0;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
}
.tuner-cents {
  font-size: 10px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  transition: color 120ms;
}
.tuner-listening {
  font-size: 11px;
  letter-spacing: 0.08em;
  padding: 2px 0;
}

.tuner-fade-enter-active,
.tuner-fade-leave-active {
  transition: opacity 150ms, transform 150ms;
}
.tuner-fade-enter-from,
.tuner-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}
</style>
