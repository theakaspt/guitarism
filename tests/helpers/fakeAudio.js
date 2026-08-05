// 브라우저가 아닌 곳(테스트)에서 Web Audio를 흉내 내는 가짜 오디오 장치.
// 진짜 소리는 나지 않고, "몇 번 예약됐는지"만 센다. 잼이 끊기지 않는지 확인하는 데 쓴다.
export function makeFakeAudio() {
  const counter = { starts: 0, nodes: 0 };
  const param = (v = 0) => ({
    value: v,
    setValueAtTime() { return this; },
    linearRampToValueAtTime() { return this; },
    exponentialRampToValueAtTime() { return this; },
    setTargetAtTime() { return this; },
    cancelScheduledValues() { return this; },
  });
  const node = (extra = {}) => {
    counter.nodes++;
    return {
      connect() { return this; },
      disconnect() { return this; },
      ...extra,
    };
  };
  const source = (extra = {}) =>
    node({
      start() { counter.starts++; },
      stop() {},
      ...extra,
    });

  class FakeAudioContext {
    constructor() {
      this.sampleRate = 44100;
      this._t = 0;
      this.state = "running";
      this.destination = node();
    }
    get currentTime() { return this._t; }
    advance(sec) { this._t += sec; }
    resume() { this.state = "running"; return Promise.resolve(); }
    createGain() { return node({ gain: param(1) }); }
    createOscillator() { return source({ type: "sine", frequency: param(440), detune: param(0) }); }
    createBufferSource() { return source({ buffer: null, loop: false, detune: param(0), playbackRate: param(1) }); }
    createBiquadFilter() { return node({ type: "lowpass", frequency: param(350), Q: param(1), gain: param(0) }); }
    createDelay() { return node({ delayTime: param(0) }); }
    createWaveShaper() { return node({ curve: null, oversample: "none" }); }
    createConvolver() { return node({ buffer: null, normalize: true }); }
    createDynamicsCompressor() {
      const n = node({
        threshold: param(-24), knee: param(30), ratio: param(12),
        attack: param(0.003), release: param(0.25),
      });
      FakeAudioContext.lastCompressor = n;
      return n;
    }
    createBuffer(ch, len, sr) {
      const data = Array.from({ length: ch }, () => new Float32Array(len));
      return { numberOfChannels: ch, length: len, sampleRate: sr, getChannelData: (i) => data[i] };
    }
  }
  return { FakeAudioContext, counter };
}

// 오디오 모듈이 첫 호출 때 컨텍스트를 기억하므로, import 전에 window에 심어야 한다.
export function installFakeAudio() {
  const { FakeAudioContext, counter } = makeFakeAudio();
  const instances = [];
  class Tracked extends FakeAudioContext {
    constructor() { super(); instances.push(this); }
  }
  globalThis.window = globalThis.window || globalThis;
  window.AudioContext = Tracked;
  return { counter, instances, FakeAudioContext: Tracked };
}
