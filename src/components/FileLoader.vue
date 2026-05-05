<script setup>
import { computed, ref } from 'vue'
import { parseFile } from '../lib/parsers.js'

const props = defineProps({
  palette: { type: Object, required: true },
})
const emit = defineEmits(['parsed'])

const dragOver = ref(false)
const error = ref('')
const busy = ref(false)
const inputRef = ref(null)

async function handleFile(file) {
  if (!file) return
  error.value = ''
  busy.value = true
  try {
    const song = await parseFile(file)
    emit('parsed', song)
  } catch (e) {
    error.value = e && e.message ? e.message : 'File could not be read.'
  } finally {
    busy.value = false
  }
}

function onDrop(e) {
  e.preventDefault()
  dragOver.value = false
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
  if (file) handleFile(file)
}

function onDragOver(e) {
  e.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

function onPick() {
  inputRef.value && inputRef.value.click()
}

function onChange(e) {
  const file = e.target.files && e.target.files[0]
  if (file) handleFile(file)
  e.target.value = ''
}

const dropStyle = computed(() => ({
  background: props.palette.bg2,
  border: `2px dashed ${dragOver.value ? props.palette.main : props.palette.panelBorder}`,
  color: props.palette.fg,
  boxShadow: dragOver.value ? `0 0 24px ${props.palette.glow}` : 'none',
}))

const headlineStyle = computed(() => ({ color: props.palette.fg }))
const subStyle = computed(() => ({ color: props.palette.fgMute }))
const hintStyle = computed(() => ({ color: props.palette.fgDim }))
const errorStyle = computed(() => ({
  background: `${props.palette.coup}1f`,
  border: `1px solid ${props.palette.coup}`,
  color: props.palette.coup,
}))
const browseBtnStyle = computed(() => ({
  background: `linear-gradient(180deg, ${props.palette.main}, ${props.palette.main}cc)`,
  color: '#0B1020',
  boxShadow: `0 4px 14px ${props.palette.glow}`,
}))
</script>

<template>
  <div class="loader" :style="dropStyle"
    @drop="onDrop" @dragover="onDragOver" @dragleave="onDragLeave">
    <div class="loader-icon" :style="{ color: palette.main }">⬆</div>
    <div class="loader-headline" :style="headlineStyle">
      Drag file here
    </div>
    <div class="loader-sub" :style="subStyle">
      MIDI ( <code>.mid</code> · <code>.midi</code> )
    </div>

    <div class="loader-actions">
      <button class="loader-browse" :style="browseBtnStyle" :disabled="busy" @click="onPick">
        {{ busy ? 'Reading…' : 'Choose file' }}
      </button>
    </div>

    <input ref="inputRef" type="file"
      accept=".mid,.midi,audio/midi"
      class="loader-input" @change="onChange" />

    <div v-if="error" class="loader-error" :style="errorStyle">{{ error }}</div>

    <div class="loader-hint" :style="hintStyle">
      MIDI is fully parsed in the browser.
    </div>
  </div>
</template>

<style scoped>
.loader {
  border-radius: 18px;
  padding: 48px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
  transition: border-color 120ms ease-out, box-shadow 160ms ease-out;
}
.loader-icon {
  font-size: 38px;
  font-weight: 700;
  line-height: 1;
}
.loader-headline {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.loader-sub {
  font-size: 13px;
}
.loader-sub code {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.04);
}
.loader-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}
.loader-browse {
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  font: inherit;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: filter 120ms ease-out;
}
.loader-browse:disabled { opacity: 0.6; cursor: progress; }
.loader-input { display: none; }
.loader-error {
  margin-top: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
}
.loader-hint {
  margin-top: 8px;
  font-size: 11.5px;
  max-width: 520px;
  line-height: 1.5;
}
.loader-hint code {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
}
</style>
