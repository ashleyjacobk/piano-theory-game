import { useState, useEffect } from "react";
import { generateChordPrompt, generateFindNotePrompt, isCorrectAnswer } from "../game/prompts";
import { playPianoNote } from "../utils/audio";


export function useGame() {



    const [gameMode, setGameMode] = useState("chord");
    const [prompt, setPrompt] = useState(generateChordPrompt());
    const [selectedNotes, setSelectedNotes] = useState([]);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState(null);

    const handleNoteClick = (note) => {
        playPianoNote(note);
        if (selectedNotes.indexOf(note) === -1) {
            setSelectedNotes((prev) => [...prev, note]);
        } else {
            setSelectedNotes((prev) => prev.filter((n) => n !== note));
        }
    };


    const generatePrompt = (mode) => {
        if (mode === "chord") return generateChordPrompt();
        if (mode === "note") return generateFindNotePrompt();
    };

    const handleSubmit = () => {
        const correct = isCorrectAnswer(selectedNotes, prompt.answer);

        if (correct) {
            setScore((s) => s + 1);
            setFeedback("Correct!");
        } else {
            setFeedback("Try again");
        }

        setPrompt(generatePrompt(gameMode));
        setSelectedNotes([]);
    };

    useEffect(() => {
        setPrompt(generatePrompt(gameMode));
        setSelectedNotes([]);
    }, [gameMode]);

    return {
        prompt,
        selectedNotes,
        score,
        feedback,
        handleNoteClick,
        handleSubmit,
        gameMode,
        setGameMode
    };
}