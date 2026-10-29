// Web Audio API Spy Sound Effects Engine - Zero external dependencies

class SoundEngine {
  constructor() {
    this.ctx = null
    this.muted = typeof localStorage !== 'undefined' ? localStorage.getItem('da_muted') === 'true' : false
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  isMuted() {
    return this.muted
  }

  toggleMute() {
    this.muted = !this.muted
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('da_muted', String(this.muted))
    }
    return this.muted
  }

  // Typewriter / Teletype mechanical click
  playClick() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.045)
  }

  // Incoming intelligence teletype burst
  playDossier() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const freqs = [880, 1100, 1320, 1760]

    freqs.forEach((f, i) => {
      const t = now + i * 0.06
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(f, t)
      osc.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.05)

      gain.gain.setValueAtTime(0.08, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(t)
      osc.stop(t + 0.06)
    })
  }

  // Heavy Bureau Stamp impact
  playStamp() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime

    // Low punch
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(160, now)
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.28)

    gain.gain.setValueAtTime(0.45, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.29)

    // Noise snap
    const bufferSize = this.ctx.sampleRate * 0.06
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3))
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer
    const nGain = this.ctx.createGain()
    nGain.gain.setValueAtTime(0.2, now)
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    noise.connect(nGain)
    nGain.connect(this.ctx.destination)

    noise.start(now)
  }

  // Wiretap surveillance frequency chirp
  playWiretap() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(2400, now)
    osc.frequency.linearRampToValueAtTime(3200, now + 0.12)
    osc.frequency.linearRampToValueAtTime(1800, now + 0.25)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.31)
  }

  // Disinformation bait pulse
  playDisinfo() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(380, now)
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.22)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.23)
  }

  // Signal Decryptor mainframe cascade
  playDecrypt() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.045
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, t)

      gain.gain.setValueAtTime(0.08, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(t)
      osc.stop(t + 0.09)
    })
  }

  // Safehouse radar sonar ping
  playRadar() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1480, now)
    osc.frequency.exponentialRampToValueAtTime(1470, now + 0.8)

    gain.gain.setValueAtTime(0.14, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.95)
  }

  // Traitor exposed victory fanfare
  playWin() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const chord = [330, 440, 554.37, 659.25] // A major
    chord.forEach((freq, i) => {
      const t = now + i * 0.08
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, t)

      gain.gain.setValueAtTime(0.18, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(t)
      osc.stop(t + 1.25)
    })
  }

  // Cover blown defeat drone
  playLose() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const notes = [164.81, 155.56, 146.83] // E down to D
    notes.forEach((freq, i) => {
      const t = now + i * 0.22
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, t)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + 0.4)

      gain.gain.setValueAtTime(0.15, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(t)
      osc.stop(t + 0.55)
    })
  }

  // Tense Heartbeat (lub-dub)
  playHeartbeat() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime

    // First beat (lub)
    const osc1 = this.ctx.createOscillator()
    const gain1 = this.ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(85, now)
    osc1.frequency.exponentialRampToValueAtTime(35, now + 0.12)
    gain1.gain.setValueAtTime(0.4, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    osc1.connect(gain1)
    gain1.connect(this.ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.13)

    // Second beat (dub)
    const t2 = now + 0.14
    const osc2 = this.ctx.createOscillator()
    const gain2 = this.ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(75, t2)
    osc2.frequency.exponentialRampToValueAtTime(30, t2 + 0.15)
    gain2.gain.setValueAtTime(0.35, t2)
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.15)
    osc2.connect(gain2)
    gain2.connect(this.ctx.destination)
    osc2.start(t2)
    osc2.stop(t2 + 0.16)
  }

  // Lie detector buzz / Suspicion alert
  playBuzzer() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.linearRampToValueAtTime(120, now + 0.3)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.36)
  }

  // Camera shutter / evidence snapshot
  playShutter() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(2200, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.07)
  }
}

export const sound = new SoundEngine()

