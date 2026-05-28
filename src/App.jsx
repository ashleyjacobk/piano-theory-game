import { NOTES } from "./data/notes";
import { useGame } from "./hooks/useGame";

function App() {
  const {
    prompt,
    selectedNotes,
    score,
    feedback,
    handleNoteClick,
    handleSubmit,
  } = useGame();

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-6">

      {/* Title */}
      <h1 className="text-4xl font-bold mb-2">
        Piano Game 🎹
      </h1>

      {/* Score */}
      <div className="text-lg mb-4">
        Score: {score}
      </div>

      {/* Prompt */}
      <div className="text-2xl font-semibold mb-2">
        {prompt.question}
      </div>

      {/* Feedback */}
      <div className="h-6 text-green-400 mb-4">
        {feedback}
      </div>

      {/* Piano */}
      <div className="flex flex-wrap justify-center gap-2 max-w-xl">
        {NOTES.map((note) => (
          <button
            key={note}
            onClick={() => handleNoteClick(note)}
            className="w-14 h-14 rounded-lg bg-white text-black font-bold shadow-md active:scale-95 transition"
          >
            {note}
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="mt-6 px-6 py-3 bg-blue-500 rounded-lg font-semibold shadow-lg active:scale-95 transition"
      >
        Submit
      </button>

      {/* Selected notes */}
      <div className="mt-4 text-sm text-gray-300">
        Selected: {selectedNotes.join(" ")}
      </div>

    </div>
  );
}

export default App;