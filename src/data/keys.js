// Chromatic hurdy-gurdy keyboard generator.
// Naturals (A B C D E F G) live on the main row; sharps live on the chromatic row.
// The lowest note is the root in octave 3 (C3 = 48 … B3 = 59).

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const C3_MIDI = 48

function noteSemitone(label) {
  const idx = NOTE_NAMES.indexOf(label)
  return idx >= 0 ? idx : NOTE_NAMES.indexOf('G')
}

export function generateKeys(rootLabel = 'G', count = 23) {
  const rootSemitone = noteSemitone(rootLabel)
  const baseMidi = C3_MIDI + rootSemitone
  const out = []
  for (let i = 0; i < count; i++) {
    const semitone = (rootSemitone + i) % 12
    const label = NOTE_NAMES[semitone]
    const isSharp = label.includes('#')
    out.push({
      i,
      row: isSharp ? 'chrom' : 'main',
      midi: baseMidi + i,
      label,
    })
  }
  return out
}

// Default 23-key layout in G — used as a fallback for callers that don't
// have access to the live root/count tweak.
export const KEYS = generateKeys('G', 23)

// Tab labels: show the note name of each key.
export function buildTabMap(keys) {
  const tab = {}
  for (const k of keys) {
    tab[k.i] = k.label
  }
  return tab
}

// Relative tab numbers: 0 = tonic, positive above, negative below.
// Chromatic keys are labelled as "n#" where n is the previous white key's number.
export function buildTabNumberMap(keys, tonicLabel) {
  const mainKeys = keys.filter(k => k.row === 'main')
  let startMain = mainKeys.findIndex(k => k.label === tonicLabel)
  if (startMain < 0) startMain = 0
  const tab = {}
  let lastWhiteNum = 0
  for (const k of keys) {
    if (k.row === 'main') {
      const idx = mainKeys.findIndex(m => m.i === k.i)
      const num = idx - startMain
      tab[k.i] = String(num)
      lastWhiteNum = num
    } else {
      tab[k.i] = lastWhiteNum + '#'
    }
  }
  return tab
}

export function findKeyIndex(keys, midi) {
  const exact = keys.filter(k => k.midi === midi)
  if (exact.length === 0) return null
  const main = exact.find(k => k.row === 'main')
  return (main || exact[0]).i
}

// Resolve a root note label to the MIDI number of its lowest occurrence on
// the generated keyboard — used as the base for the transpose stepper.
export function tonicToMidi(tonicLabel) {
  return C3_MIDI + noteSemitone(tonicLabel)
}
