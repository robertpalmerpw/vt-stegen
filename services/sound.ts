// Ljudhanterare med Web Audio API (inga filer behövs)
// Skapar rikare ljud med flera oscillatorer och envelopes

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

// Helper to play a sound with ADSR envelope and multiple oscillators
const playRichTone = (
    freqs: number[],
    type: OscillatorType,
    duration: number,
    startTime: number = 0,
    volume: number = 0.1,
    detune: number = 0
) => {
    const now = audioContext.currentTime + startTime;
    const gain = audioContext.createGain();
    gain.connect(audioContext.destination);

    // ADSR Envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.05); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Decay & Release

    freqs.forEach((f, i) => {
        const osc = audioContext.createOscillator();
        osc.type = type;
        osc.frequency.value = f;

        // Detune for thicker sound
        if (detune > 0 && i > 0) {
            osc.detune.value = (Math.random() - 0.5) * detune;
        }

        osc.connect(gain);
        osc.start(now);
        osc.stop(now + duration);
    });
};

export const playChallengeSound = () => {
    try {
        if (audioContext.state === 'suspended') audioContext.resume();

        // "Futuristic Confirm" - Rising intervals with Sine/Triangle mix
        const now = 0;
        // First chord
        playRichTone([440, 444], 'sine', 0.3, now, 0.1); // A4 slightly detuned
        playRichTone([880], 'triangle', 0.3, now, 0.05); // A5

        // Second chord (higher)
        setTimeout(() => {
            playRichTone([554.37, 560], 'sine', 0.4, 0, 0.1); // C#5
            playRichTone([1108.73], 'triangle', 0.4, 0, 0.05); // C#6
        }, 150);
    } catch (error) {
        console.error("Could not play challenge sound", error);
    }
};

export const playRegisterSound = () => {
    try {
        if (audioContext.state === 'suspended') audioContext.resume();

        // "Victory" - Rich Major Chord with Sawtooth (Brass-like)
        const vol = 0.08;
        const duration = 0.6;

        // C Major 7
        playRichTone([523.25], 'sawtooth', duration, 0, vol);    // C5
        playRichTone([659.25], 'sawtooth', duration, 0.05, vol); // E5
        playRichTone([783.99], 'sawtooth', duration, 0.10, vol); // G5
        playRichTone([987.77], 'sawtooth', duration, 0.15, vol); // B5

        // Bass note
        playRichTone([261.63], 'square', duration + 0.2, 0, 0.05); // C4
    } catch (error) {
        console.error("Could not play register sound", error);
    }
};

export const playClickSound = () => {
    try {
        if (audioContext.state === 'suspended') audioContext.resume();

        // "Woodblock" / "Tick" sound
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start();
        osc.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // Ignore errors
    }
};
