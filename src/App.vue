<script setup>
import { computed, onMounted, ref } from 'vue'
import { usePersistentState } from './composables/usePersistentState.js'
import { PALETTES } from './data/palettes.js'
import { listSongs, getSong, saveSong, deleteSong } from './lib/library.js'
import { loadBuiltinSongs } from './lib/builtinLibrary.js'

import Library from './components/Library.vue'
import Player from './components/Player.vue'

const tweaks = usePersistentState('lg.tweaks.v3', {
  palette: 'paper',
  showStaff: true,
  showTabLane: true,
  showKeybox: true,
  showCrank: true,
  showTabNumbers: true,
  audio: true,
  tonic: 'G',
  transpose: 0,
  tempoPct: 100,
  metronome: false,
  loopEnabled: false,
  windowBeats: 8,
  keyCount: 23,
  tabsAsNumbers: true,
})

function setTweak(key, value) {
  tweaks.value = { ...tweaks.value, [key]: value }
}

const songs = ref(listSongs())
const builtinSongs = ref([])
const currentSongId = ref(null)
const currentSong = computed(() => {
  if (!currentSongId.value) return null
  return getSong(currentSongId.value)
    || builtinSongs.value.find(s => s.id === currentSongId.value)
    || null
})

onMounted(() => {
  loadBuiltinSongs().then(s => { builtinSongs.value = s })
})

const palette = computed(() => PALETTES[tweaks.value.palette] || PALETTES.paper)

const pageStyle = computed(() => ({
  background: `radial-gradient(circle at 20% 0%, ${palette.value.bg2}, ${palette.value.bg} 60%)`,
  color: palette.value.fg,
  minHeight: '100vh',
}))

function openSong(id) {
  currentSongId.value = id
}

function backToLibrary() {
  currentSongId.value = null
  songs.value = listSongs()
}

function onParsed(song) {
  const saved = saveSong(song)
  songs.value = listSongs()
  currentSongId.value = saved.id
}

function onDelete(id) {
  deleteSong(id)
  songs.value = listSongs()
}
</script>

<template>
  <div :style="pageStyle">
    <Player
      v-if="currentSong"
      :song="currentSong"
      :tweaks="tweaks"
      @set-tweak="setTweak"
      @back-to-library="backToLibrary"
    />
    <Library
      v-else
      :songs="songs"
      :builtin-songs="builtinSongs"
      :palette="palette"
      @open="openSong"
      @parsed="onParsed"
      @delete="onDelete"
    />
  </div>
</template>
