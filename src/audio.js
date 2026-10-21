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
  // SFX 3: TIẾNG MƯA RƠI (Mưa rơi êm đềm, rả rích, tắt là hết dứt điểm)
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
    const ctx = this.ctx;
    if (!ctx) return;

    // Pink Noise êm dịu
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Lọc Lowpass dịu nhẹ ở 720Hz (loại bỏ tiếng xè xè gắt tai)
    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(720, ctx.currentTime);

    // Lọc Highpass ở 180Hz (loại bỏ tiếng ầm ù)
    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'highpass';
    filter2.frequency.setValueAtTime(180, ctx.currentTime);

    // LFO gió thoảng nhẹ nhàng (chu kỳ 8 giây)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
    lfoGain.gain.setValueAtTime(80, ctx.currentTime);
    lfo.connect(filter1.frequency);
    lfo.start();

    // Âm lượng nền mưa êm dịu: 0.045
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 1.0);

    noise.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(gain);
    gain.connect(this.sfxGain);
    noise.start();

    // Từng giọt mưa rơi tí tách rả rích ngẫu nhiên 350ms - 900ms
    let dropTimeout = null;
    const scheduleNextDrop = () => {
      if (!this.sfxStates.rain) return;
      const t = ctx.currentTime;
      const dropOsc = ctx.createOscillator();
      const dropFilter = ctx.createBiquadFilter();
      const dropGain = ctx.createGain();
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      const dropFreq = 700 + Math.random() * 550;
      dropOsc.type = 'sine';
      dropOsc.frequency.setValueAtTime(dropFreq, t);
      dropOsc.frequency.exponentialRampToValueAtTime(dropFreq * 0.45, t + 0.035);

      dropFilter.type = 'lowpass';
      dropFilter.frequency.setValueAtTime(1200, t);

      const dropVol = 0.015 + Math.random() * 0.009;
      dropGain.gain.setValueAtTime(dropVol, t);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

      dropOsc.connect(dropFilter);
      dropFilter.connect(dropGain);

      if (panner) {
        panner.pan.setValueAtTime((Math.random() * 2 - 1) * 0.65, t);
        dropGain.connect(panner);
        panner.connect(this.sfxGain);
      } else {
        dropGain.connect(this.sfxGain);
      }

      dropOsc.start(t);
      dropOsc.stop(t + 0.045);

      const nextDelay = 350 + Math.random() * 650;
      dropTimeout = setTimeout(scheduleNextDrop, nextDelay);
    };

    dropTimeout = setTimeout(scheduleNextDrop, 400);

    this.rainNodes = {
      noise,
      gain,
      lfo,
      lfoGain,
      dropTimeout,
    };
  }

  stopRainSound() {
    if (this.rainNodes) {
      const { noise, gain, lfo, lfoGain, dropTimeout } = this.rainNodes;
      this.rainNodes = null;

      if (dropTimeout) clearTimeout(dropTimeout);

      if (gain && this.ctx) {
        try {
          gain.gain.cancelScheduledValues(this.ctx.currentTime);
          gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.00001, this.ctx.currentTime + 0.2);
        } catch (e) {}
      }

      setTimeout(() => {
        try {
          if (noise) {
            noise.stop();
            noise.disconnect();
          }
          if (lfo) {
            lfo.stop();
            lfo.disconnect();
          }
          if (lfoGain) lfoGain.disconnect();
          if (gain) gain.disconnect();
        } catch (e) {}
      }, 250);
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
