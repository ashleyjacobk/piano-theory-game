import { PIANO_KEYS } from "./data/pianoLayout";
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
      <div className="flex justify-center p-6 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl overflow-x-auto max-w-full select-none">
        <div className="flex relative">
          {PIANO_KEYS.map((key, index) => {
            if (key.type === "white") {
              const nextKey = PIANO_KEYS[index + 1];
              const hasBlackKey = nextKey && nextKey.type === "black";
              
              return (
                <div key={key.note} className="relative flex-shrink-0">
                  {/* White Key */}
                  <button
                    onClick={() => handleNoteClick(key.note)}
                    className="w-12 h-44 bg-white text-zinc-900 border border-zinc-200 font-bold flex items-end justify-center pb-4 rounded-b-lg hover:bg-zinc-50 active:translate-y-0.5 transition-all duration-150"
                  >
                    {key.note}
                  </button>

                  {/* Black Key Overlay */}
                  {hasBlackKey && (
                    <button
                      onClick={() => handleNoteClick(nextKey.note)}
                      className="absolute top-0 right-0 translate-x-1/2 w-8 h-28 bg-zinc-950 text-white border-l border-r border-b border-black font-bold flex items-end justify-center pb-3 rounded-b-md hover:bg-zinc-800 active:translate-y-0.5 z-10 shadow-md transition-all duration-150"
                    >
                      {nextKey.note}
                    </button>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
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