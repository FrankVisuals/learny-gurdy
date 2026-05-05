import { parseFile } from './parsers.js'

// Vite resolves all files in the library folder to URLs at build time.
// New files dropped into src/assets/library/ appear automatically on next build/reload.
const LIBRARY_URLS = import.meta.glob('../assets/library/*', {
  query: '?url',
  import: 'default',
  eager: true,
})

function filenameFromPath(path) {
  return decodeURIComponent(path.split('/').pop().split('?')[0])
}

let cache = null

export async function loadBuiltinSongs() {
  if (cache) return cache

  const results = await Promise.all(
    Object.entries(LIBRARY_URLS).map(async ([path, url]) => {
      const filename = filenameFromPath(path)
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        const file = new File([blob], filename)
        const song = await parseFile(file)
        return {
          ...song,
          id: `builtin:${filename}`,
          source: { ...song.source, builtin: true },
        }
      } catch (e) {
        console.warn(`[builtinLibrary] could not load ${filename}:`, e)
        return null
      }
    }),
  )

  cache = results.filter(Boolean)
  return cache
}
