import { NOTES } from "../data/notes";

export function generateFindNotePrompt(lastAnswer) {
    let note = NOTES[Math.floor(Math.random() * NOTES.length)];
    // Prevent duplicate consecutive notes
    while (note === lastAnswer) {
        note = NOTES[Math.floor(Math.random() * NOTES.length)];
    }
    return {
        type: "find_note",
        question: `Find the note ${note}`,
        answer: note,
    };
}

const CHORD_INTERVALS = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
}

export function generateChordPrompt(lastRoot) {
    let rootIndex = Math.floor(Math.random() * NOTES.length);
    let root = NOTES[rootIndex];
    while (root === lastRoot) {
        rootIndex = Math.floor(Math.random() * NOTES.length);
        root = NOTES[rootIndex];
    }
    const chordType = Math.random() < 0.5 ? "major" : "minor";
    const intervals = CHORD_INTERVALS[chordType];
    const chord = intervals.map((interval) => { return NOTES[(rootIndex + interval) % NOTES.length] });
    return {
        type: "build_chord",
        chordType,
        question: `Build a ${root} ${chordType} chord`,
        root,
        answer: chord,
    };
}

export function isSameChord(userNotes, correctNotes) {
    const sortedUser = [...userNotes].sort();
    const sortedCorrect = [...correctNotes].sort();

    return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
}