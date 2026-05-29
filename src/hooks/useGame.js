import { useState, useEffect } from "react";
import { generateChordPrompt, generateFindNotePrompt, isSameChord } from "../game/prompts";
import { playPianoNote } from "../utils/audio";

export function useGame() {
    const [gameMode, setGameMode] = useState("chord");
    const [prompt, setPrompt] = useState(generateChordPrompt());
    const [selectedNotes, setSelectedNotes] = useState([]);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState(null);

    // Automatically switch prompt and reset selections when gameMode changes
    useEffect(() => {
        setPrompt(gameMode === "chord" ? generateChordPrompt() : generateFindNotePrompt());
        setSelectedNotes([]);
        setFeedback(null);
    }, [gameMode]);

    const switchMode = (mode) => {
        setGameMode(mode);
    };

    const handleNoteClick = (note) => {
        playPianoNote(note);
        if (selectedNotes.indexOf(note) === -1) {
            setSelectedNotes((prev) => [...prev, note]);
        } else {
            setSelectedNotes((prev) => prev.filter((n) => n !== note));
        }
    };

    const handleSubmit = () => {
        let correct = false;

        if (gameMode === "chord") {
            correct = isSameChord(selectedNotes, prompt.answer);
        } else {
            // In note identification mode, check if the single selected note matches the answer
            correct = selectedNotes.length === 1 && selectedNotes[0] === prompt.answer;
        }

        if (correct) {
            setScore((s) => s + 1);
            setFeedback("Correct!");
        } else {
            setFeedback("Try again");
        }

        // Generate next prompt for the current mode and reset selection
        setPrompt(gameMode === "chord" ? generateChordPrompt() : generateFindNotePrompt());
        setSelectedNotes([]);
    };

    return {
        prompt,
        selectedNotes,
        score,
        feedback,
        handleNoteClick,
        handleSubmit,
        gameMode,
        switchMode,
    };
}