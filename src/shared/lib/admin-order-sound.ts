export interface AdminOrderSoundSettings {
  enabled: boolean;
  volume: number;
}

export const ADMIN_ORDER_SOUND_SETTINGS_CHANGED_EVENT = "admin-order-sound-settings-changed";

let audioContext: AudioContext | null = null;

export const playAdminOrderSound = (volume: number): void => {
  if (typeof window === "undefined" || volume <= 0) return;

  try {
    audioContext ??= new AudioContext();
    const context = audioContext;
    const play = () => {
      const normalizedVolume = Math.min(1, Math.max(0, volume));
      [880, 1175].forEach((frequency, index) => {
        const startAt = context.currentTime + index * 0.2;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startAt);
        gain.gain.setValueAtTime(0.001, startAt);
        gain.gain.exponentialRampToValueAtTime(normalizedVolume * 0.24, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.16);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.17);
      });
    };

    if (context.state === "suspended") {
      void context.resume().then(play).catch(() => undefined);
    } else {
      play();
    }
  } catch {
    // Audio is optional and may be unavailable or blocked by browser policy.
  }
};
