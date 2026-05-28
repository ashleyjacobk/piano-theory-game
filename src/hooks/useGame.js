import { useState } from "react";
import { generateChordPrompt, isSameChord } from "../game/prompts";

export function useGame() {
    const [prompt, setPrompt] = useState(generateChordPrompt());
    const [selectedNotes, setSelectedNotes] = useState([]);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState(null);

    const handleNoteClick = (note) => {
        if (selectedNotes.indexOf(note) === -1) {
            setSelectedNotes((prev) => [...prev, note]);
        } else {
            setSelectedNotes((prev) => prev.filter((n) => n !== note));
        }
    };

    const handleSubmit = () => {
        const correct = isSameChord(selectedNotes, prompt.answer);

        if (correct) {
            setScore((s) => s + 1);
            setFeedback("Correct!");
        } else {
            setFeedback("Try again");
        }

        setPrompt(generateChordPrompt());
        setSelectedNotes([]);
    };

    return {
        prompt,
        selectedNotes,
        score,
        feedback,
        handleNoteClick,
        handleSubmit,
    };
}