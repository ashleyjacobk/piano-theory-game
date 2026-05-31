import { NOTES } from "../data/notes";

export function generateFindNotePrompt() {
    const note = NOTES[Math.floor(Math.random() * NOTES.length)];
    return {
        type: "find_note",
        question: `Find the note ${note}`,
        answer: [note],
    };
}

const CHORD_INTERVALS = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
}

export function generateChordPrompt() {
    const rootIndex = Math.floor(Math.random() * NOTES.length);
    const root = NOTES[rootIndex];
    const intervals = CHORD_INTERVALS.major;
    const chord = intervals.map((interval) => { return NOTES[(rootIndex + interval) % NOTES.length] });
    return {
        type: "build_chord",
        chordType: "major",
        question: `Build a ${root} major chord`,
        root,
        answer: chord,
    };
}

export function isCorrectAnswer(userNotes, correctNotes) {
    const A = [...userNotes].sort();
    const B = [...correctNotes].sort();
    return A.length === B.length && A.every((v, i) => v === B[i]);
}
