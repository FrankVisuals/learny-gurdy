const STORAGE_KEY = 'lg.library.v1'
const MIGRATION_KEY = 'lg.library.migration.v2'

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(songs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs))
}

function migrate(songs) {
  if (localStorage.getItem(MIGRATION_KEY) === '1') return songs
  let changed = false
  for (const s of songs) {
    const wasFallback = s.source && (s.source.fallback === 'demo' || s.source.fallback === true)
    if (wasFallback && Array.isArray(s.notes) && s.notes.length > 0) {
      s.notes = []
      s.sections = []
      s.bpm = 0
      s.subtitle = (s.source.format || 'datei').toUpperCase() + ' · keine automatische Transkription'
      s.source.fallback = true
      changed = true
    }
  }
  if (changed) write(songs)
  localStorage.setItem(MIGRATION_KEY, '1')
  return songs
}

function uid() {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function listSongs() {
  return migrate(read()).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
}

export function getSong(id) {
  return migrate(read()).find(s => s.id === id) || null
}

export function saveSong(song) {
  const songs = read()
  const entry = {
    ...song,
    id: song.id || uid(),
    addedAt: song.addedAt || Date.now(),
  }
  const idx = songs.findIndex(s => s.id === entry.id)
  if (idx >= 0) songs[idx] = entry
  else songs.push(entry)
  write(songs)
  return entry
}

export function deleteSong(id) {
  write(read().filter(s => s.id !== id))
}
