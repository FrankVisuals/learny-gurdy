import { ref, watch } from 'vue'

export function usePersistentState(key, initial) {
  const stored = localStorage.getItem(key)
  const state = ref(stored !== null ? JSON.parse(stored) : initial)

  watch(state, (value) => {
    localStorage.setItem(key, JSON.stringify(value))
  }, { deep: true })

  return state
}
