// Mapping piano notes to 4th-octave frequencies (in Hertz)
const NOTE_FREQS = {
  "C": 261.63,
  "C#": 277.18,
  "Db": 277.18,
  "D": 293.66,
  "D#": 311.13,
  "Eb": 311.13,
  "E": 329.63,
  "F": 349.23,
  "F#": 369.99,
  "Gb": 369.99,
  "G": 392.00,
  "G#": 415.30,
  "Ab": 415.30,
  "A": 440.00,
  "A#": 466.16,
  "Bb": 466.16,
  "B": 493.88
};

let audioCtx = null;

export function playPianoNote(noteName) {
  const frequency = NOTE_FREQS[noteName];
  if (!frequency) return;

  // Initialize AudioContext on first user interaction
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Resume context if suspended (browser security autoplay policies)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  // 1. Create Main Tone (Triangle wave for warmth)
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency, now);

  // 2. Create Hammer Strike / Tine (High frequency sine wave for key impact)
  const strikeOsc = audioCtx.createOscillator();
  const strikeGain = audioCtx.createGain();

  strikeOsc.type = "sine";
  strikeOsc.frequency.setValueAtTime(frequency * 2, now); // One octave up for bright sheen

  // Configure Envelopes
  // Main Tone Envelope: Instant attack, long exponential decay
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  // Hammer Strike Envelope: Instant attack, extremely rapid decay (0.08s)
  strikeGain.gain.setValueAtTime(0, now);
  strikeGain.gain.linearRampToValueAtTime(0.15, now + 0.005);
  strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  // Connect Nodes
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  strikeOsc.connect(strikeGain);
  strikeGain.connect(audioCtx.destination);

  // Start & Stop Oscillators
  osc.start(now);
  osc.stop(now + 1.3);

  strikeOsc.start(now);
  strikeOsc.stop(now + 0.1);
}
