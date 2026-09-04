/**
 * SOUNDFX - Feedback Háptico y Sonido Táctil Neumórfico (Web Audio API)
 * Cero latencia (0ms) - Cero descarga de archivos de audio
 */
(function() {
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playHapticPop() {
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      // Frecuencia sutil de click neumórfico
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.04);

      // Envolvente de volumen suave
      gain.gain.setValueAtTime(0.09, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) {
      // Navegador sin soporte o audio restringido
    }
  }

  function attachListeners() {
    const selector = 'button, a, [role="button"], .glass-card-faro, .glass-card-fundacion, .glass-card-ministerio, .chip-query';
    document.querySelectorAll(selector).forEach(el => {
      if (!el.dataset.soundAttached) {
        el.dataset.soundAttached = 'true';
        el.addEventListener('pointerdown', () => playHapticPop(), { passive: true });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      attachListeners();
      document.addEventListener('click', initAudio, { once: true });
    });
  } else {
    attachListeners();
    document.addEventListener('click', initAudio, { once: true });
  }

  // Observer para botones dinámicos (modal, chat, búnker)
  const observer = new MutationObserver(() => attachListeners());
  observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

  window.playHapticPop = playHapticPop;
})();
