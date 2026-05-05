import { Midi } from '@tonejs/midi'

// Normalised song shape used throughout the app:
//   { title, subtitle, key, tonic, timeSig: [n, d], bpm,
//     sections: [{ startBeat, label }],
//     notes: [{ t, d, n, coup? }],
//     source: { format, filename, fallback?: 'demo' } }

function detectFormat(file) {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.mid') || name.endsWith('.midi')) return 'midi'
  return null
}

function stripExtension(name) {
  return name.replace(/\.[^.]+$/, '')
}

async function parseMidi(file) {
  const buf = await file.arrayBuffer()
  const midi = new Midi(buf)
  const bpm = (midi.header.tempos[0] && midi.header.tempos[0].bpm) || 120
  const ts = (midi.header.timeSignatures[0] && midi.header.timeSignatures[0].timeSignature) || [4, 4]
  const secondsPerBeat = 60 / bpm

  // Pick the track with the most notes — typically the melody.
  const track = midi.tracks.reduce(
    (best, t) => (t.notes.length > (best ? best.notes.length : 0) ? t : best),
    null,
  )
  const rawNotes = track ? track.notes : []

  const notes = rawNotes.map(n => ({
    t: n.time / secondsPerBeat,
    d: Math.max(0.1, n.duration / secondsPerBeat),
    n: n.midi,
  }))
  notes.sort((a, b) => a.t - b.t)

  // Mark coup on the downbeat of each bar (beat % beatsPerBar == 0).
  const beatsPerBar = ts[0]
  for (const note of notes) {
    if (Math.abs((note.t % beatsPerBar) - 0) < 0.05) note.coup = true
  }

  const totalBeats = notes.reduce((m, n) => Math.max(m, n.t + n.d), 0)
  const sections = buildSections(totalBeats, beatsPerBar)

  return {
    title: (track && track.name) || stripExtension(file.name),
    subtitle: 'MIDI',
    key: 'C major',
    tonic: 'C',
    timeSig: ts,
    bpm: Math.round(bpm),
    sections,
    notes,
    source: { format: 'midi', filename: file.name },
  }
}

// Build evenly spaced section markers so the timeline & top-bar pill have content
// for any imported song.
function buildSections(totalBeats, beatsPerBar) {
  const labels = ['Intro', 'A', "A'", 'B', 'C', 'Outro']
  if (totalBeats <= 0) return [{ startBeat: 0, label: 'Song' }]
  const sectionLen = Math.max(beatsPerBar * 4, Math.ceil(totalBeats / labels.length / beatsPerBar) * beatsPerBar)
  const sections = []
  for (let i = 0, b = 0; b < totalBeats && i < labels.length; i++, b += sectionLen) {
    sections.push({ startBeat: b, label: labels[i] })
  }
  return sections
}

export async function parseFile(file) {
  const format = detectFormat(file)
  if (!format) {
    throw new Error('Unknown file format. Allowed: .mid, .midi')
  }
  return parseMidi(file)
}
