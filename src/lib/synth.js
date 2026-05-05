// Lightweight WebAudio synth tuned for a hurdy-gurdy-ish vibe:
// sawtooth + lowpass for the melody, brief square-wave click on coup beats
// (the "schnarre" buzz). Uses lookahead scheduling so tempo / seek / transpose
// changes can re-anchor by panic + clear without leaving stale audio events.

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export class Synth {
  constructor() {
    const Ctx = window.AudioContext || window.webkitAudioContext
    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.22
    this.master.connect(this.ctx.destination)
    this.live = new Set()
  }

  resume() {
    if (this.ctx.state === 'suspended') this.ctx.resume()
  }

  scheduleNote(midi, when, duration, isCoup) {
    const ctx = this.ctx
    const freq = midiToFreq(midi)
    const stopAt = when + Math.max(duration, 0.05) + 0.1

    // Body: detuned saw pair through a lowpass — buzzy but not harsh.
    const oscA = ctx.createOscillator()
    const oscB = ctx.createOscillator()
    oscA.type = 'sawtooth'
    oscB.type = 'sawtooth'
    oscA.frequency.value = freq
    oscB.frequency.value = freq * 1.005

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = Math.min(6000, freq * 6)
    filter.Q.value = 0.7

    const gain = ctx.createGain()
    const peak = isCoup ? 0.45 : 0.30
    const sustain = isCoup ? 0.32 : 0.22
    gain.gain.setValueAtTime(0, when)
    gain.gain.linearRampToValueAtTime(peak, when + 0.012)
    gain.gain.linearRampToValueAtTime(sustain, when + 0.06)
    const releaseStart = when + Math.max(duration - 0.04, 0.04)
    gain.gain.setTargetAtTime(0, releaseStart, 0.05)

    oscA.connect(filter)
    oscB.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)

    oscA.start(when)
    oscB.start(when)
    oscA.stop(stopAt)
    oscB.stop(stopAt)

    this.track(oscA, stopAt)
    this.track(oscB, stopAt)

    if (isCoup) this.scheduleCoup(freq, when)
  }

  scheduleClick(when, accented) {
    // Short percussive click — square wave with sharp envelope.
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = accented ? 1800 : 1200

    const gain = ctx.createGain()
    const peak = accented ? 0.32 : 0.18
    gain.gain.setValueAtTime(0, when)
    gain.gain.linearRampToValueAtTime(peak, when + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.045)

    osc.connect(gain)
    gain.connect(this.master)
    osc.start(when)
    osc.stop(when + 0.06)
    this.track(osc, when + 0.06)
  }

  scheduleCoup(freq, when) {
    // Schnarre accent: brief square-wave click an octave above + noise puff.
    const ctx = this.ctx
    const buzz = ctx.createOscillator()
    buzz.type = 'square'
    buzz.frequency.value = freq * 2

    const buzzGain = ctx.createGain()
    buzzGain.gain.setValueAtTime(0, when)
    buzzGain.gain.linearRampToValueAtTime(0.18, when + 0.004)
    buzzGain.gain.exponentialRampToValueAtTime(0.0005, when + 0.10)

    buzz.connect(buzzGain)
    buzzGain.connect(this.master)
    buzz.start(when)
    buzz.stop(when + 0.12)
    this.track(buzz, when + 0.12)
  }

  track(node, stopAt) {
    this.live.add(node)
    const cleanup = () => this.live.delete(node)
    node.onended = cleanup
    // Safety: in case onended is missed, prune later.
    setTimeout(cleanup, Math.max(0, (stopAt - this.ctx.currentTime) * 1000) + 500)
  }

  panic() {
    for (const node of this.live) {
      try { node.stop() } catch {}
    }
    this.live.clear()
  }

  close() {
    this.panic()
    this.ctx.close()
  }
}
