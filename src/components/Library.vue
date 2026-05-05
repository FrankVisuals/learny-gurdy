<script setup>
import { computed, ref } from 'vue'
import FileLoader from './FileLoader.vue'

const props = defineProps({
  songs: { type: Array, required: true },
  builtinSongs: { type: Array, default: () => [] },
  palette: { type: Object, required: true },
})
const emit = defineEmits(['open', 'parsed', 'delete'])

const adding = ref(false)

const showLoader = computed(() => adding.value || props.songs.length === 0)

function onParsed(song) {
  adding.value = false
  emit('parsed', song)
}

function fmtDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString()
}

function fmtFormat(s) {
  const fmt = (s.source && s.source.format) || 'demo'
  const map = { midi: 'MIDI', demo: 'Demo' }
  return map[fmt] || fmt.toUpperCase()
}

function isFallback(s) {
  return !!(s.source && s.source.fallback)
}

const sectionHeadStyle = computed(() => ({
  color: props.palette.fgMute,
  borderBottom: `1px solid ${props.palette.panelBorder}`,
}))
const headerTitle = computed(() => ({ color: props.palette.fg }))
const headerSub = computed(() => ({ color: props.palette.fgMute }))
const cardStyle = computed(() => ({
  background: props.palette.bg2,
  border: `1px solid ${props.palette.panelBorder}`,
  color: props.palette.fg,
}))
const cardSubStyle = computed(() => ({ color: props.palette.fgMute }))
const cardChip = (s) => ({
  background: isFallback(s) ? props.palette.panel : `${props.palette.main}1f`,
  color: isFallback(s) ? props.palette.fgMute : props.palette.main,
  border: isFallback(s) ? `1px solid ${props.palette.panelBorder}` : 'none',
})
const addBtnStyle = computed(() => ({
  background: `linear-gradient(180deg, ${props.palette.main}, ${props.palette.main}cc)`,
  color: '#0B1020',
  boxShadow: `0 4px 14px ${props.palette.glow}`,
}))
const deleteBtnStyle = computed(() => ({
  background: 'transparent',
  border: `1px solid ${props.palette.panelBorder}`,
  color: props.palette.fgMute,
}))
const logoStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.palette.main}, ${props.palette.chrom})`,
  boxShadow: `0 4px 14px ${props.palette.glow}`,
}))
</script>

<template>
  <div class="lib">
    <div class="lib-head">
      <div class="lib-id">
        <div class="lib-logo" :style="logoStyle">L</div>
        <div>
          <div class="lib-eyebrow" :style="headerSub">LearnyGurdy</div>
          <div class="lib-title" :style="headerTitle">Library</div>
        </div>
      </div>
      <button v-if="songs.length > 0 && !adding" class="lib-add" :style="addBtnStyle"
        @click="adding = true">＋ Add file</button>
      <button v-else-if="adding && songs.length > 0" class="lib-add lib-add-cancel"
        :style="deleteBtnStyle" @click="adding = false">Cancel</button>
    </div>

    <FileLoader v-if="showLoader" :palette="palette" @parsed="onParsed" />

    <template v-if="!adding">
      <div v-if="songs.length > 0">
        <div class="lib-section-head" :style="sectionHeadStyle">My Library</div>
        <div class="lib-grid">
          <div v-for="s in songs" :key="s.id" class="lib-card" :style="cardStyle"
            @click="emit('open', s.id)">
            <div class="lib-card-head">
              <div class="lib-card-title">{{ s.title }}</div>
              <span class="lib-card-chip" :style="cardChip(s)">{{ fmtFormat(s) }}</span>
            </div>
            <div class="lib-card-sub" :style="cardSubStyle">{{ s.subtitle }}</div>
            <div class="lib-card-meta" :style="cardSubStyle">
              <template v-if="(s.notes || []).length > 0">
                <span>{{ s.notes.length }} note{{ s.notes.length === 1 ? '' : 's' }}</span>
                <span>·</span>
                <span>{{ s.bpm }} BPM</span>
                <span>·</span>
                <span>{{ s.timeSig[0] }}/{{ s.timeSig[1] }}</span>
              </template>
              <template v-else-if="(s.pages || []).length > 0">
                <span>{{ s.pages.length }} page{{ s.pages.length === 1 ? '' : 's' }}</span>
                <span>·</span>
                <span>score scan only</span>
              </template>
              <template v-else>
                <span>no content</span>
              </template>
            </div>
            <div class="lib-card-foot" :style="cardSubStyle">
              <span>{{ fmtDate(s.addedAt) }}</span>
              <button class="lib-card-del" :style="deleteBtnStyle"
                @click.stop="emit('delete', s.id)">Remove</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="builtinSongs.length > 0">
        <div class="lib-section-head" :style="sectionHeadStyle">Built-in</div>
        <div class="lib-grid">
          <div v-for="s in builtinSongs" :key="s.id" class="lib-card" :style="cardStyle"
            @click="emit('open', s.id)">
            <div class="lib-card-head">
              <div class="lib-card-title">{{ s.title }}</div>
              <span class="lib-card-chip" :style="cardChip(s)">{{ fmtFormat(s) }}</span>
            </div>
            <div class="lib-card-sub" :style="cardSubStyle">{{ s.subtitle }}</div>
            <div class="lib-card-meta" :style="cardSubStyle">
              <template v-if="(s.notes || []).length > 0">
                <span>{{ s.notes.length }} note{{ s.notes.length === 1 ? '' : 's' }}</span>
                <span>·</span>
                <span>{{ s.bpm }} BPM</span>
                <span>·</span>
                <span>{{ s.timeSig[0] }}/{{ s.timeSig[1] }}</span>
              </template>
              <template v-else>
                <span>no content</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lib {
  max-width: 980px;
  margin: 0 auto;
  padding: 40px 24px 60px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.lib-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.lib-id {
  display: flex;
  align-items: center;
  gap: 12px;
}
.lib-logo {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #0B1020;
  font-size: 17px;
  letter-spacing: -0.05em;
}
.lib-eyebrow {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.lib-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.1;
}
.lib-add {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  font: inherit;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: filter 120ms ease-out;
}
.lib-add-cancel {
  font-weight: 600;
}
.lib-section-head {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding-bottom: 10px;
  margin-bottom: 14px;
}
.lib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
  margin-bottom: 28px;
}
.lib-card {
  border-radius: 14px;
  padding: 14px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
}
.lib-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}
.lib-card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}
.lib-card-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
}
.lib-card-chip {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
}
.lib-card-sub {
  font-size: 12px;
}
.lib-card-meta {
  display: flex;
  gap: 6px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
}
.lib-card-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 11px;
}
.lib-card-del {
  padding: 4px 10px;
  border-radius: 999px;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.lib-card-del:hover { color: inherit; }
</style>
