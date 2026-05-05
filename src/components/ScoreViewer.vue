<script setup>
import { computed } from 'vue'

const props = defineProps({
  pages: { type: Array, required: true },
  palette: { type: Object, required: true },
})

const wrapStyle = computed(() => ({
  background: props.palette.bg2,
  border: `1px solid ${props.palette.panelBorder}`,
}))

const headStyle = computed(() => ({ color: props.palette.fgMute }))
</script>

<template>
  <div class="sv" :style="wrapStyle">
    <div class="sv-head" :style="headStyle">Score scan</div>
    <div class="sv-pages">
      <img v-for="(p, i) in pages" :key="i"
        class="sv-page" :src="p.dataUrl" :alt="`Page ${i + 1}`" />
    </div>
  </div>
</template>

<style scoped>
.sv {
  border-radius: 14px;
  padding: 14px 18px 18px;
}
.sv-head {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.sv-pages {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.sv-page {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  background: #fff;
}
</style>
