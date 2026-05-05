<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { generateKeys, buildTabMap, buildTabNumberMap, findKeyIndex } from '../data/keys.js'
import { PALETTES } from '../data/palettes.js'

import TopBar from './TopBar.vue'
import Staff from './Staff.vue'
import TabLane from './TabLane.vue'
import Keybox from './Keybox.vue'
import Crank from './Crank.vue'
import Transport from './Transport.vue'
import TweaksPanel from './TweaksPanel.vue'
import ScoreViewer from './ScoreViewer.vue'
import { TweakSection, TweakSlider, TweakToggle, TweakSelect } from './tweakControls.js'
import './tweakControls.css'
import { Synth } from '../lib/synth.js'

const props = defineProps({
  song: { type: Object, required: true },
  tweaks: { type: Object, required: true },
})
const emit = defineEmits(['set-tweak', 'back-to-library'])

function setTweak(key, value) {
  emit('set-tweak', key, value)
}

const palette = computed(() => PALETTES[props.tweaks.palette] || PALETTES.paper)
const keys = computed(() => generateKeys(props.tweaks.tonic, props.tweaks.keyCount || 23))
const tabMap = computed(() => buildTabMap(keys.value))
const tabNumberMap = computed(() => buildTabNumberMap(keys.value, props.tweaks.tonic))

function midiToKeyIndex(midi) {
  return findKeyIndex(keys.value, midi)
}

const SONG = computed(() => {
  const semis = props.tweaks.transpose | 0
  const notes = props.song.notes || []
  if (semis === 0) return props.song
  return {
    ...props.song,
    notes: notes.map(n => ({ ...n, n: n.n + semis })),
  }
})

const scoreOnly = computed(() => !SONG.value.notes || SONG.value.notes.length === 0)

const playing = ref(false)
const beat = ref(0)
const loopRange = ref([4, 16])

const songLength = computed(() =>
  SONG.value.notes.reduce((m, n) => Math.max(m, n.t + n.d), 0) + 4
)

let raf = null
let lastNow = null

// Audio scheduler — lookahead window approach. Each frame we schedule any
// notes whose start time falls inside the next AUDIO_LOOKAHEAD seconds, anchored
// to the AudioContext clock at scheduleAnchor. We only re-anchor on
// play/seek/tempo/transpose/song changes.
let synth = null
const scheduledNotes = new Set()
const scheduledClicks = new Set()
let scheduleAnchor = { audioTime: 0, beat: 0 }
const AUDIO_LOOKAHEAD = 0.25

function ensureSynth() {
  if (!synth) synth = new Synth()
  synth.resume()
  return synth
}

function reanchor() {
  if (!synth) return
  synth.panic()
  scheduledNotes.clear()
  scheduledClicks.clear()
  scheduleAnchor = { audioTime: synth.ctx.currentTime, beat: beat.value }
}

function audioFrame() {
  if (!playing.value) return
  if (!props.tweaks.audio && !props.tweaks.metronome) return
  const s = ensureSynth()
  if (scheduleAnchor.audioTime === 0) {
    scheduleAnchor = { audioTime: s.ctx.currentTime, beat: beat.value }
  }
  const bpm = SONG.value.bpm || 100
  const bps = (bpm * (props.tweaks.tempoPct / 100)) / 60
  if (bps <= 0) return
  const horizon = s.ctx.currentTime + AUDIO_LOOKAHEAD

  if (props.tweaks.audio) {
    for (let i = 0; i < SONG.value.notes.length; i++) {
      const n = SONG.value.notes[i]
      if (n.t < scheduleAnchor.beat) continue
      if (scheduledNotes.has(i)) continue
      const startTime = scheduleAnchor.audioTime + (n.t - scheduleAnchor.beat) / bps
      if (startTime > horizon) continue
      if (startTime < s.ctx.currentTime - 0.05) {
        scheduledNotes.add(i)
        continue
      }
      s.scheduleNote(n.n, startTime, n.d / bps, !!n.coup)
      scheduledNotes.add(i)
    }
  }

  if (props.tweaks.metronome) {
    const beatsPerBar = (SONG.value.timeSig && SONG.value.timeSig[0]) || 4
    const firstBeat = Math.max(0, Math.ceil(scheduleAnchor.beat - 0.001))
    for (let b = firstBeat; ; b++) {
      if (scheduledClicks.has(b)) continue
      const startTime = scheduleAnchor.audioTime + (b - scheduleAnchor.beat) / bps
      if (startTime > horizon) break
      if (startTime < s.ctx.currentTime - 0.05) {
        scheduledClicks.add(b)
        continue
      }
      s.scheduleClick(startTime, b % beatsPerBar === 0)
      scheduledClicks.add(b)
    }
  }
}

function tickLoop(now) {
  if (lastNow == null) lastNow = now
  const dt = (now - lastNow) / 1000
  lastNow = now
  const bps = (SONG.value.bpm * (props.tweaks.tempoPct / 100)) / 60
  let nb = beat.value + dt * bps
  let looped = false
  if (props.tweaks.loopEnabled) {
    if (nb >= loopRange.value[1]) {
      nb = loopRange.value[0]
      looped = true
    }
  } else if (nb >= songLength.value) {
    nb = 0
    playing.value = false
  }
  beat.value = nb
  if (looped) reanchor()
  audioFrame()
  if (playing.value) raf = requestAnimationFrame(tickLoop)
}

watch(playing, (p) => {
  if (p) {
    lastNow = null
    if (synth) synth.resume()
    reanchor()
    raf = requestAnimationFrame(tickLoop)
  } else {
    if (raf) {
      cancelAnimationFrame(raf)
      raf = null
    }
    if (synth) synth.panic()
    scheduledNotes.clear()
    scheduledClicks.clear()
    scheduleAnchor = { audioTime: 0, beat: 0 }
  }
})

// Re-schedule when anything that changes the audio mapping changes.
watch(() => props.tweaks.tempoPct, () => { if (playing.value) reanchor() })
watch(() => props.tweaks.audio, (on) => {
  if (!on && synth) { synth.panic(); scheduledNotes.clear(); scheduledClicks.clear() }
  else if (playing.value) reanchor()
})
watch(() => props.tweaks.metronome, (on) => {
  if (!on && synth) { synth.panic(); scheduledNotes.clear(); scheduledClicks.clear() }
  else if (playing.value) reanchor()
})
watch(() => SONG.value, () => { if (playing.value) reanchor() })

watch(() => props.song, () => {
  playing.value = false
  beat.value = 0
  if (synth) { synth.panic(); scheduledNotes.clear(); scheduledClicks.clear() }
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  if (synth) synth.close()
})

const activeKeyIdx = computed(() => {
  const out = []
  for (const n of SONG.value.notes) {
    if (beat.value >= n.t && beat.value < n.t + n.d) {
      const k = midiToKeyIndex(n.n)
      if (k != null) out.push(k)
    }
  }
  return out
})

const coupActive = computed(() =>
  SONG.value.notes.some(n => n.coup && beat.value >= n.t && beat.value < n.t + 0.18)
)

const targetRpm = computed(() => (SONG.value.bpm * (props.tweaks.tempoPct / 100)) / 2)
const crankRpm = ref(0)
let crankRaf = null

function crankTick() {
  if (!playing.value) {
    crankRpm.value = 0
    crankRaf = null
    return
  }
  const drift = (Math.random() - 0.5) * 4
  crankRpm.value = crankRpm.value + (targetRpm.value + drift - crankRpm.value) * 0.08
  crankRaf = requestAnimationFrame(crankTick)
}

watch(playing, (p) => {
  if (p && !crankRaf) crankRaf = requestAnimationFrame(crankTick)
  else if (!p) crankRpm.value = 0
})
onBeforeUnmount(() => { if (crankRaf) cancelAnimationFrame(crankRaf) })

const currentSection = computed(() => {
  let cur = SONG.value.sections[0] || { startBeat: 0, label: '' }
  for (const s of SONG.value.sections) {
    if (beat.value >= s.startBeat) cur = s
  }
  return cur
})

function togglePlay() { playing.value = !playing.value }

function onKeyDown(e) {
  if (e.code !== 'Space' || e.repeat) return
  const t = e.target
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
  e.preventDefault()
  togglePlay()
}

onMounted(() => { window.addEventListener('keydown', onKeyDown) })
onBeforeUnmount(() => { window.removeEventListener('keydown', onKeyDown) })
function reset() {
  beat.value = 0
  if (playing.value) reanchor()
}
function seek(t) {
  beat.value = t
  if (playing.value) reanchor()
}

const pageStyle = computed(() => ({
  background: `radial-gradient(circle at 20% 0%, ${palette.value.bg2}, ${palette.value.bg} 60%)`,
  color: palette.value.fg,
}))

const crankPanelStyle = computed(() => ({
  background: palette.value.bg2,
  border: `1px solid ${palette.value.panelBorder}`,
}))

const crankBadgeStyle = computed(() => ({
  background: coupActive.value ? palette.value.coup : palette.value.panel,
  border: `1px solid ${coupActive.value ? palette.value.coup : palette.value.panelBorder}`,
  color: coupActive.value ? '#0B1020' : palette.value.fgMute,
  boxShadow: coupActive.value ? `0 0 16px ${palette.value.coup}aa` : 'none',
}))

const noteBannerStyle = computed(() => ({
  background: `${palette.value.fgMute}14`,
  border: `1px solid ${palette.value.panelBorder}`,
  color: palette.value.fgMute,
}))

const backBtnStyle = computed(() => ({
  background: palette.value.panel,
  border: `1px solid ${palette.value.panelBorder}`,
  color: palette.value.fg,
}))

const soHeadStyle = computed(() => ({ color: palette.value.fg }))
const soEyebrowStyle = computed(() => ({ color: palette.value.fgMute }))

const paletteOptions = Object.keys(PALETTES).map(k => ({ value: k, label: PALETTES[k].name }))

const formatLabel = computed(() => {
  const fmt = (SONG.value.source && SONG.value.source.format) || ''
  return fmt.toUpperCase() || 'File'
})
</script>

<template>
  <div class="page" :style="pageStyle">
    <template v-if="scoreOnly">
      <div class="back-row">
        <button class="back-btn" :style="backBtnStyle" @click="emit('back-to-library')">
          ← Library
        </button>
      </div>
      <div class="so-head">
        <div class="so-eyebrow" :style="soEyebrowStyle">{{ formatLabel }}</div>
        <div class="so-title" :style="soHeadStyle">{{ SONG.title }}</div>
      </div>

      <div class="gap-16" />

      <div class="so-banner" :style="noteBannerStyle">
        Score scan mode — this file contains no automatically transcribed notes.
        Use the scan below as a reference. For tabs, key highlights, crank display
        and synth playback, load a <code>.mid</code> file.
      </div>

      <div class="gap-16" />

      <ScoreViewer v-if="SONG.pages && SONG.pages.length"
        :pages="SONG.pages" :palette="palette" />
      <div v-else class="so-empty" :style="noteBannerStyle">
        This file cannot be visualized.
      </div>
    </template>

    <!-- Full player mode: songs with parsed notes (MIDI). -->
    <template v-else>
      <TopBar
        :palette="palette"
        :song="SONG"
        :section="currentSection"
        :playing="playing"
        :beat="beat"
        :tonic="tweaks.tonic"
        :transpose="tweaks.transpose"
        @play="togglePlay"
        @reset="reset"
        @update:tonic="v => setTweak('tonic', v)"
        @update:transpose="v => setTweak('transpose', v)"
        @back-to-library="emit('back-to-library')"
      />

      <div class="gap-16" />

      <ScoreViewer v-if="SONG.pages && SONG.pages.length"
        :pages="SONG.pages" :palette="palette" />

      <div v-if="SONG.pages && SONG.pages.length" class="gap-16" />

      <div class="main-grid" :class="{ 'with-crank': tweaks.showCrank }">
        <div class="main-col">
          <Staff v-if="tweaks.showStaff"
            :song="SONG" :beat="beat" :palette="palette"
            :window-beats="tweaks.windowBeats" :height="140"
          />
          <TabLane v-if="tweaks.showTabLane"
            :song="SONG" :beat="beat" :palette="palette"
            :keys="keys" :tab-map="tabMap" :tab-number-map="tabNumberMap"
            :tabs-as-numbers="tweaks.tabsAsNumbers"
            :midi-to-key-index="midiToKeyIndex"
            :window-beats="tweaks.windowBeats" :height="210"
          />
        </div>

        <div v-if="tweaks.showCrank" class="crank-panel" :style="crankPanelStyle">
          <div class="crank-eyebrow" :style="{ color: palette.fgMute }">Crank</div>
          <Crank :rpm="crankRpm" :target-rpm="targetRpm" :palette="palette" />
          <div class="crank-badge" :style="crankBadgeStyle">Drone · COUP</div>
        </div>
      </div>

      <div class="gap-16" />

      <Keybox v-if="tweaks.showKeybox"
        :keys="keys" :active-idx="activeKeyIdx" :palette="palette"
        :tab-map="tabMap" :tab-number-map="tabNumberMap" :show-tab-numbers="tweaks.showTabNumbers"
      />

      <div class="gap-16" />

      <Transport
        :palette="palette"
        :song="SONG"
        :beat="beat"
        :song-length="songLength"
        :loop-range="loopRange"
        :loop-enabled="tweaks.loopEnabled"
        :tempo-pct="tweaks.tempoPct"
        :metronome="tweaks.metronome"
        @seek="seek"
        @update:loopEnabled="v => setTweak('loopEnabled', v)"
        @update:loopRange="v => loopRange = v"
        @update:tempoPct="v => setTweak('tempoPct', v)"
        @update:metronome="v => setTweak('metronome', v)"
      />
    </template>

    <TweaksPanel title="Settings">
      <TweakSection title="Color scheme">
        <TweakSelect :value="tweaks.palette" :options="paletteOptions"
          @update:value="v => setTweak('palette', v)" />
      </TweakSection>
      <template v-if="!scoreOnly">
        <TweakSection title="Display">
          <TweakToggle label="Staff" :value="tweaks.showStaff"
            @update:value="v => setTweak('showStaff', v)" />
          <TweakToggle label="Tab lane" :value="tweaks.showTabLane"
            @update:value="v => setTweak('showTabLane', v)" />
          <TweakToggle label="Hurdy-gurdy keys" :value="tweaks.showKeybox"
            @update:value="v => setTweak('showKeybox', v)" />
          <TweakToggle label="Crank display" :value="tweaks.showCrank"
            @update:value="v => setTweak('showCrank', v)" />
          <TweakToggle label="Tab numbers on keys" :value="tweaks.showTabNumbers"
            @update:value="v => setTweak('showTabNumbers', v)" />
          <TweakToggle label="Numbers instead of notes on tabs" :value="tweaks.tabsAsNumbers"
            @update:value="v => setTweak('tabsAsNumbers', v)" />
        </TweakSection>
        <TweakSection title="Audio">
          <TweakToggle label="Synth playback" :value="tweaks.audio"
            @update:value="v => setTweak('audio', v)" />
        </TweakSection>
        <TweakSection title="Pitch">
          <TweakSlider label="Transpose (semitones)" :min="-12" :max="12" :step="1"
            :value="tweaks.transpose" @update:value="v => setTweak('transpose', v)" />
        </TweakSection>
        <TweakSection title="View window">
          <TweakSlider label="Visible beats" :min="4" :max="16" :step="1"
            :value="tweaks.windowBeats" @update:value="v => setTweak('windowBeats', v)" />
        </TweakSection>
        <TweakSection title="Keyboard">
          <TweakSlider label="Number of keys" :min="7" :max="36" :step="1"
            :value="tweaks.keyCount || 23" @update:value="v => setTweak('keyCount', v)" />
        </TweakSection>
      </template>
    </TweaksPanel>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  padding: 12px 28px 32px;
  box-sizing: border-box;
}
@media (max-width: 720px) {
  .page { padding: 10px 12px 80px; }
}
.back-row {
  margin-bottom: 8px;
}
.back-btn {
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}
.so-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.so-eyebrow {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.so-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.1;
}
.so-banner,
.so-empty {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 12.5px;
  line-height: 1.5;
}
.so-banner code {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
}
.gap-16 { height: 16px; }
.main-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  align-items: stretch;
}
.main-grid.with-crank {
  grid-template-columns: 1fr 160px;
}
@media (max-width: 720px) {
  .main-grid.with-crank { grid-template-columns: 1fr; }
  .crank-panel { padding: 12px 8px; }
  .gap-16 { height: 12px; }
  .so-title { font-size: 18px; }
  .so-banner, .so-empty { font-size: 12px; padding: 10px 12px; }
}
.main-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.crank-panel {
  border-radius: 14px;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.crank-eyebrow {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.crank-badge {
  margin-top: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  transition: all 80ms ease-out;
}
</style>
