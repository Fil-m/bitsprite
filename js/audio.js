// BitSprite Procedural Web Audio API Synthesizer (Zero External Assets Required)
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.ambientOsc = null;
    this.ambientGain = null;
    this.ambientInterval = null;
    this.currentPhase = -1;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    } catch (e) {
      console.warn("Web Audio API not supported on this browser:", e);
    }
  }

  isSoundEnabled() {
    return window.gameSettings && window.gameSettings.sound !== false;
  }

  play(event) {
    this.init();
    if (!this.ctx || !this.isSoundEnabled()) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    
    switch (event) {
      case 'jump':
        this.playJump(t);
        break;
      case 'collect':
        this.playCollect(t);
        break;
      case 'hammer':
        this.playHammer(t);
        break;
      case 'block_start':
        this.playBlockStart(t);
        break;
      case 'bus_wait':
        this.playBusWait(t);
        break;
      case 'hurt':
        this.playHurt(t);
        break;
      case 'death':
        this.playDeath(t);
        break;
      case 'phase_shift':
        this.playPhaseShift(t);
        break;
      case 'achievement':
        this.playAchievement(t);
        break;
      case 'exploit_activate':
        this.playExploitActivate(t);
        break;
      case 'gate_open':
        this.playGateOpen(t);
        break;
      case 'error':
        this.playError(t);
        break;
    }
  }

  playJump(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  playCollect(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.setValueAtTime(880, t + 0.05);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  playHammer(t) {
    // low physical slam + noise puff
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(40, t + 0.15);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.start(t);
    osc.stop(t + 0.16);

    // noise burst
    try {
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(t);
    } catch (e) {}
  }

  playBlockStart(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.25);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  playBusWait(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(130, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  playHurt(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(60, t + 0.2);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  playDeath(t) {
    const duration = 0.5;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + duration);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  playPhaseShift(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.8);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.start(t);
    osc.stop(t + 0.82);
  }

  playAchievement(t) {
    // 4 ascending C-major notes quickly
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);

      gain.gain.setValueAtTime(0.15, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.15);

      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.16);
    });
  }

  playExploitActivate(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.3);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.start(t);
    osc.stop(t + 0.31);
  }

  playGateOpen(t) {
    // creak clicking sounds
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150 - i * 20, t + i * 0.1);

      gain.gain.setValueAtTime(0.1, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.05);

      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.06);
    }
  }

  playError(t) {
    // low harsh double-beep error sound
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(85, t + i * 0.15);

      gain.gain.setValueAtTime(0.25, t + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.12);

      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.13);
    }
  }

  startAmbient(phase) {
    this.init();
    if (!this.ctx || !this.isSoundEnabled()) return;
    if (this.currentPhase === phase) return;
    this.stopAmbient();

    this.currentPhase = phase;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    this.ambientGain.connect(this.ctx.destination);

    // Procedural Ambient loop generator
    const playTick = () => {
      if (!this.ambientGain || this.currentPhase !== phase) return;
      const t = this.ctx.currentTime;
      
      if (phase === 0) {
        // Safe cozy melody notes
        const melody = [261.63, 293.66, 329.63, 392.00]; // C4, D4, E4, G4
        const freq = melody[Math.floor(Math.random() * melody.length)];
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        
        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0.12, t);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        
        osc.connect(noteGain);
        noteGain.connect(this.ambientGain);
        osc.start(t);
        osc.stop(t + 1.25);
      } else if (phase === 1) {
        // Sad degraded glitch pitch
        const freq = 120 + Math.random() * 80;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        
        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0.06, t);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        
        osc.connect(noteGain);
        noteGain.connect(this.ambientGain);
        osc.start(t);
        osc.stop(t + 0.85);
      } else if (phase === 2) {
        // Glowing cyan vector deep space synth pads
        const padFreqs = [110, 165, 220]; // A2, E3, A3
        padFreqs.forEach(freq => {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          
          const noteGain = this.ctx.createGain();
          noteGain.gain.setValueAtTime(0.08, t);
          noteGain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
          
          osc.connect(noteGain);
          noteGain.connect(this.ambientGain);
          osc.start(t);
          osc.stop(t + 2.05);
        });
      } else if (phase === 3) {
        // Fast technical binary bits clicks
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1000 + Math.random() * 500, t);
        
        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0.04, t);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        
        osc.connect(noteGain);
        noteGain.connect(this.ambientGain);
        osc.start(t);
        osc.stop(t + 0.09);
      } else if (phase === 4) {
        // TTY glitches, noise swept sweeps
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50 + Math.random() * 20, t);
        osc.frequency.linearRampToValueAtTime(150 + Math.random() * 50, t + 0.5);
        
        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0.05, t);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        
        osc.connect(noteGain);
        noteGain.connect(this.ambientGain);
        osc.start(t);
        osc.stop(t + 0.52);
      }
    };

    const intervalMs = phase === 3 ? 150 : (phase === 0 ? 1200 : (phase === 1 ? 900 : 2000));
    this.ambientInterval = setInterval(playTick, intervalMs);
    playTick();
  }

  stopAmbient() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch (e) {}
      this.ambientGain = null;
    }
    this.currentPhase = -1;
  }
}

// Global ambient and SFX controller instance
const Audio = new SoundSynth();
window.AudioEngine = Audio;
