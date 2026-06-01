import { NOTES } from "./notes";

// Helper to get notes index safely wrapping around
const getNoteAtOffset = (root, semitones) => {
    const rootIndex = NOTES.indexOf(root);
    if (rootIndex === -1) return root;
    return NOTES[(rootIndex + semitones) % NOTES.length];
};

export function generateFindNotePrompt(lastAnswer) {
    let note = NOTES[Math.floor(Math.random() * NOTES.length)];
    // Prevent duplicate consecutive notes
    while (note === lastAnswer) {
        note = NOTES[Math.floor(Math.random() * NOTES.length)];
    }
    return {
        type: "find_note",
        question: `Find the note ${note}`,
        answer: [note],
    };
}

const CHORD_INTERVALS = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
};

export function generateChordPrompt(lastRoot) {
    let rootIndex = Math.floor(Math.random() * NOTES.length);
    let root = NOTES[rootIndex];
    while (root === lastRoot) {
        rootIndex = Math.floor(Math.random() * NOTES.length);
        root = NOTES[rootIndex];
    }
    const chordType = Math.random() < 0.5 ? "major" : "minor";
    const intervals = CHORD_INTERVALS[chordType];
    const chord = intervals.map((interval) => NOTES[(rootIndex + interval) % NOTES.length]);
    return {
        type: "build_chord",
        chordType,
        root,
        question: `Build a ${root} ${chordType} chord`,
        answer: chord,
    };
}

<<<<<<< HEAD
export function isCorrectAnswer(userNotes, correctNotes) {
    const A = [...userNotes].sort();
    const B = [...correctNotes].sort();
    return A.length === B.length && A.every((v, i) => v === B[i]);
}
=======
const INTERVAL_SEMITONES = {
    "Minor 3rd": 3,
    "Major 3rd": 4,
    "Perfect 4th": 5,
    "Perfect 5th": 7,
    "Perfect Octave": 12,
};

export function generateIntervalPrompt(lastRoot) {
    let rootIndex = Math.floor(Math.random() * NOTES.length);
    let root = NOTES[rootIndex];
    while (root === lastRoot) {
        rootIndex = Math.floor(Math.random() * NOTES.length);
        root = NOTES[rootIndex];
    }
    const intervalNames = Object.keys(INTERVAL_SEMITONES);
    const intervalName = intervalNames[Math.floor(Math.random() * intervalNames.length)];
    const semitones = INTERVAL_SEMITONES[intervalName];
    const targetNote = getNoteAtOffset(root, semitones);

    return {
        type: "interval",
        root,
        intervalName,
        question: `Build a ${intervalName} starting on ${root}`,
        answer: targetNote,
    };
}

const SCALE_SEMITONES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10], // natural minor
};

export function generateScalePrompt(lastRoot) {
    let rootIndex = Math.floor(Math.random() * NOTES.length);
    let root = NOTES[rootIndex];
    while (root === lastRoot) {
        rootIndex = Math.floor(Math.random() * NOTES.length);
        root = NOTES[rootIndex];
    }
    const scaleType = Math.random() < 0.5 ? "major" : "minor";
    const semitonesList = SCALE_SEMITONES[scaleType];
    const scaleNotes = semitonesList.map((semitones) => getNoteAtOffset(root, semitones));

    return {
        type: "scale",
        root,
        scaleType,
        question: `Build a ${root} ${scaleType} scale`,
        answer: scaleNotes,
    };
}

export function isSameChord(userNotes, correctNotes) {
    if (!Array.isArray(userNotes) || !Array.isArray(correctNotes)) return false;
    const sortedUser = [...userNotes].sort();
    const sortedCorrect = [...correctNotes].sort();

    return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
}
>>>>>>> 075f878069ad0daf48d81d8f2d37ac126ea84497
