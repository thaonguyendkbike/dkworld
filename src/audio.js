// ============================================================================
// DK BIKE WORLD - AMBIENCE & SFX AUDIO SYSTEM (Web Audio API)
// Tinh gọn chỉ giữ âm thanh môi trường thư giãn: Chim hót, Tàu điện, Mưa rơi nhẹ rả rích
// ============================================================================

class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.sfxVolume = 0.65;

    // SFX States
    this.sfxStates = {
      birds: false,
      train: false,
      rain: false,
    };

    // Internal Audio Nodes
    this.masterGain = null;
    this.sfxGain = null;

    // SFX Loops/Generators
    this.birdsTimer = null;
    this.trainNodes = null;
    this.rainNodes = null;
    this.rainAudio = null;

    // Callbacks for UI sync
    this.onStateChange = null;
  }

  // Khởi tạo AudioContext khi người dùng tương tác lần đầu (Click/Touch)
  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
    if (this.rainAudio) {
      this.rainAudio.volume = this.sfxVolume;
    }
  }

  // Dừng toàn bộ âm thanh môi trường
  stopAll() {
    if (this.sfxStates.birds) this.toggleBirds(false);
    if (this.sfxStates.train) this.toggleTrain(false);
    if (this.sfxStates.rain) this.toggleRain(false);
  }

  // ==========================================================================
  // SFX 1: TIẾNG CHIM HÓT (Songbirds Singing)
  // ==========================================================================
  toggleBirds(forceState = null) {
    this.ensureContext();
    this.sfxStates.birds = forceState !== null ? forceState : !this.sfxStates.birds;

    if (this.sfxStates.birds) {
      this.startBirdsLoop();
    } else {
      this.stopBirdsLoop();
    }
    if (this.onStateChange) this.onStateChange();
    return this.sfxStates.birds;
  }

  startBirdsLoop() {
    this.stopBirdsLoop();
    const scheduleNextBird = () => {
      if (!this.sfxStates.birds) return;
      this.playBirdChirp();
      const delay = 1400 + Math.random() * 2800;
      this.birdsTimer = setTimeout(scheduleNextBird, delay);
    };
    scheduleNextBird();
  }

  stopBirdsLoop() {
    if (this.birdsTimer) {
      clearTimeout(this.birdsTimer);
      this.birdsTimer = null;
    }
  }

  playBirdChirp() {
    if (!this.ctx || !this.sfxStates.birds) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const birdTypes = ['single', 'double', 'trill'];
    const type = birdTypes[Math.floor(Math.random() * birdTypes.length)];
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime((Math.random() * 2 - 1) * 0.75, now);
      panner.connect(this.sfxGain);
    }

    const outputNode = panner || this.sfxGain;
    const baseFreq = 2600 + Math.random() * 1200;

    if (type === 'single') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(outputNode);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'double') {
      [0, 0.11].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const f = baseFreq * (delay === 0 ? 1 : 1.15);
        osc.frequency.setValueAtTime(f, now + delay);
        osc.frequency.exponentialRampToValueAtTime(f * 1.3, now + delay + 0.04);
        osc.frequency.exponentialRampToValueAtTime(f * 0.95, now + delay + 0.09);

        gain.gain.setValueAtTime(0.001, now + delay);
        gain.gain.linearRampToValueAtTime(0.16, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);

        osc.connect(gain);
        gain.connect(outputNode);
        osc.start(now + delay);
        osc.stop(now + delay + 0.1);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      lfo.frequency.setValueAtTime(26, now);
      lfoGain.gain.setValueAtTime(baseFreq * 0.18, now);

      lfo.connect(osc.frequency);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(outputNode);

      lfo.start(now);
      osc.start(now);
      lfo.stop(now + 0.36);
      osc.stop(now + 0.36);
    }
  }

  // ==========================================================================
  // SFX 2: TIẾNG TÀU ĐIỆN (Train Rumble, Rail Rhythms, Whistle)
  // ==========================================================================
  toggleTrain(forceState = null) {
    this.ensureContext();
    this.sfxStates.train = forceState !== null ? forceState : !this.sfxStates.train;

    if (this.sfxStates.train) {
      this.startTrainSound();
    } else {
      this.stopTrainSound();
    }
    if (this.onStateChange) this.onStateChange();
    return this.sfxStates.train;
  }

  startTrainSound() {
    this.stopTrainSound();
    const ctx = this.ctx;
    if (!ctx) return;

    const rumbleOsc = ctx.createOscillator();
    const rumbleFilter = ctx.createBiquadFilter();
    const rumbleGain = ctx.createGain();

    rumbleOsc.type = 'triangle';
    rumbleOsc.frequency.setValueAtTime(58, ctx.currentTime);

    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(140, ctx.currentTime);

    rumbleGain.gain.setValueAtTime(0.001, ctx.currentTime);
    rumbleGain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.8);

    rumbleOsc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.sfxGain);
    rumbleOsc.start();

    let step = 0;
    const playRailClack = () => {
      if (!this.sfxStates.train) return;
      const t = ctx.currentTime;
      step++;

      const dur = 0.06;
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(step % 2 === 0 ? 800 : 1200, t);
      filter.Q.value = 2.0;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(t);
      noise.stop(t + dur);

      if (step % 48 === 0) {
        this.playTrainWhistle(t + 0.2);
      }
    };

    const railInterval = setInterval(playRailClack, 320);

    this.trainNodes = {
      rumbleOsc,
      rumbleGain,
      railInterval,
    };
  }

  stopTrainSound() {
    if (this.trainNodes) {
      const { rumbleOsc, rumbleGain, railInterval } = this.trainNodes;
      this.trainNodes = null;

      if (railInterval) clearInterval(railInterval);
      if (rumbleGain && this.ctx) {
        try {
          rumbleGain.gain.cancelScheduledValues(this.ctx.currentTime);
          rumbleGain.gain.setValueAtTime(rumbleGain.gain.value, this.ctx.currentTime);
          rumbleGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);
        } catch (e) {}
      }
      setTimeout(() => {
        try {
          if (rumbleOsc) {
            rumbleOsc.stop();
            rumbleOsc.disconnect();
          }
          if (rumbleGain) rumbleGain.disconnect();
        } catch (e) {}
      }, 300);
    }
  }

  playTrainWhistle(time) {
    if (!this.ctx || !this.sfxStates.train) return;
    const freqs = [440.0, 554.37];
    freqs.forEach((f) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.1, time + 0.2);
      gain.gain.linearRampToValueAtTime(0.07, time + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(time);
      osc.stop(time + 1.4);
    });
  }

  // ==========================================================================
  // ==========================================================================
  // SFX 3: TIẾNG MƯA RƠI (tieng_troi_mua_lon-www_tiengdong_com.mp3)
  // ==========================================================================
  toggleRain(forceState = null) {
    this.ensureContext();
    this.sfxStates.rain = forceState !== null ? forceState : !this.sfxStates.rain;

    if (this.sfxStates.rain) {
      this.startRainSound();
    } else {
      this.stopRainSound();
    }
    if (this.onStateChange) this.onStateChange();
    return this.sfxStates.rain;
  }

  startRainSound() {
    this.stopRainSound();
    try {
      if (!this.rainAudio) {
        const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
          ? (import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/')
          : './';
        this.rainAudio = new Audio(baseUrl + 'tieng_troi_mua_lon-www_tiengdong_com.mp3');
        this.rainAudio.loop = true;
      }
      this.rainAudio.volume = this.sfxVolume;
      this.rainAudio.currentTime = 0;
      const playPromise = this.rainAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Rain audio play failed or auto-play blocked:', err);
        });
      }
    } catch (e) {
      console.warn('Failed to start rain audio:', e);
    }
  }

  stopRainSound() {
    if (this.rainAudio) {
      try {
        this.rainAudio.pause();
        this.rainAudio.currentTime = 0;
      } catch (e) {}
    }
    if (this.rainNodes) {
      const { noise, gain, lfo, lfoGain, dropTimeout } = this.rainNodes;
      this.rainNodes = null;
      if (dropTimeout) clearTimeout(dropTimeout);
      if (gain && this.ctx) {
        try {
          gain.gain.cancelScheduledValues(this.ctx.currentTime);
          gain.gain.setValueAtTime(0, this.ctx.currentTime);
        } catch (e) {}
      }
      setTimeout(() => {
        try {
          if (noise) { noise.stop(); noise.disconnect(); }
          if (lfo) { lfo.stop(); lfo.disconnect(); }
          if (lfoGain) lfoGain.disconnect();
          if (gain) gain.disconnect();
        } catch (e) {}
      }, 100);
    }
  }

  // Tiếng sấm sét vang vọng chân thực khi mưa (Synthesized Thunder Clap & Deep Rumble)
  playThunder() {
    this.ensureContext();
    if (!this.initialized || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 2.6);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.05 * white)) / 1.05; // Brown noise
        lastOut = data[i];
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, t);
      filter.frequency.exponentialRampToValueAtTime(38, t + 2.3);

      const gain = this.ctx.createGain();
      const vol = 0.55 * this.sfxVolume;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + 2.6);
    } catch (e) {}
  }
}

export const audioManager = new AudioManager();
