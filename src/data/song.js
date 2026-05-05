// "Becalmed" — Sea of Thieves arrangement excerpt, in C major.
// Reconstructed melodic line for tutorial purposes.
//   t   = beat position (1 beat = quarter note)
//   d   = duration in beats
//   n   = MIDI note number (C4 = 60)
//   coup = coup-de-poignet (Schnarre buzzing accent)
export const SONG = {
  title: 'Becalmed',
  subtitle: 'Sea of Thieves — arr. NKB',
  key: 'C major',
  tonic: 'C',
  timeSig: [4, 4],
  bpm: 76,
  sections: [
    { startBeat: 0,  label: 'Intro' },
    { startBeat: 16, label: 'A — Theme' },
    { startBeat: 48, label: "A' — Variation" },
    { startBeat: 80, label: 'B — Bridge' },
  ],
  notes: [
    { t: 0,    d: 2,   n: 67, coup: true },
    { t: 2,    d: 2,   n: 72 },

    { t: 4,    d: 1,   n: 72, coup: true },
    { t: 5,    d: 1,   n: 74 },
    { t: 6,    d: 1,   n: 76 },
    { t: 7,    d: 1,   n: 77 },
    { t: 8,    d: 2,   n: 79, coup: true },
    { t: 10,   d: 2,   n: 76 },
    { t: 12,   d: 1,   n: 74, coup: true },
    { t: 13,   d: 1,   n: 76 },
    { t: 14,   d: 2,   n: 72 },

    { t: 16,   d: 1,   n: 72, coup: true },
    { t: 17,   d: 1,   n: 74 },
    { t: 18,   d: 1,   n: 76 },
    { t: 19,   d: 1,   n: 79 },
    { t: 20,   d: 2,   n: 81, coup: true },
    { t: 22,   d: 2,   n: 79 },
    { t: 24,   d: 1.5, n: 77, coup: true },
    { t: 25.5, d: 0.5, n: 76 },
    { t: 26,   d: 2,   n: 74 },
    { t: 28,   d: 4,   n: 72, coup: true },

    { t: 32,   d: 1,   n: 76, coup: true },
    { t: 33,   d: 1,   n: 78 },
    { t: 34,   d: 1,   n: 79 },
    { t: 35,   d: 1,   n: 81 },
    { t: 36,   d: 2,   n: 83, coup: true },
    { t: 38,   d: 2,   n: 79 },
    { t: 40,   d: 1,   n: 77, coup: true },
    { t: 41,   d: 1,   n: 76 },
    { t: 42,   d: 1,   n: 74 },
    { t: 43,   d: 1,   n: 72 },
    { t: 44,   d: 4,   n: 67, coup: true },

    { t: 48,   d: 2,   n: 65, coup: true },
    { t: 50,   d: 2,   n: 67 },
    { t: 52,   d: 2,   n: 69, coup: true },
    { t: 54,   d: 2,   n: 72 },
    { t: 56,   d: 1,   n: 71, coup: true },
    { t: 57,   d: 1,   n: 72 },
    { t: 58,   d: 2,   n: 74 },
    { t: 60,   d: 4,   n: 72, coup: true },

    { t: 64,   d: 2,   n: 76, coup: true },
    { t: 66,   d: 2,   n: 72 },
    { t: 68,   d: 2,   n: 74 },
    { t: 70,   d: 2,   n: 67, coup: true },
    { t: 72,   d: 4,   n: 60, coup: true },
  ],
}
