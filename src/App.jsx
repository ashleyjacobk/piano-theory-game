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

  const isSelected = (note) => selectedNotes.includes(note);
  return (
    <div className="min-h-screen bg-yellow-200 text-black flex flex-col items-center p-6 font-mono">

      {/* Title */}
      <h1 className="text-5xl font-black mb-4 text-pink-600 tracking-wide drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        Piano Theory for Beginners
      </h1>

      {/* Score */}
      <div className="bg-white border-4 border-black px-6 py-3 rounded-xl text-2xl font-bold shadow-[6px_6px_0px_rgba(0,0,0,1)] mb-4">
        ⭐ Score: {score}
      </div>

      {/* Prompt */}
      <div className="bg-cyan-300 border-4 border-black rounded-2xl px-8 py-4 text-3xl font-black shadow-[8px_8px_0px_rgba(0,0,0,1)] mb-4 text-center max-w-2xl">
        {prompt.question}
      </div>

      {/* Feedback */}
      <div className="h-10 text-2xl font-black mb-4 text-purple-700 animate-pulse">
        {feedback}
      </div>

      {/* Piano */}
      <div className="flex justify-center p-8 bg-pink-300 rounded-3xl border-4 border-black shadow-[10px_10px_0px_rgba(0,0,0,1)] overflow-x-auto max-w-full select-none">
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
                    className={`w-14 h-48 border-4 border-black font-black flex items-end justify-center pb-4 rounded-b-2xl transition-all duration-100 active:translate-y-1
                    ${isSelected(key.note)
                        ? "bg-green-300 text-black"
                        : "bg-white text-black"
                      }`}
                  >
                    {key.note}
                  </button>

                  {/* Black Key Overlay */}
                  {
                    hasBlackKey && (
                      <button
                        onClick={() => handleNoteClick(nextKey.note)}
                        className={`absolute top-0 right-0 translate-x-1/2 w-10 h-32 font-black flex items-end justify-center pb-3 rounded-b-xl z-10 shadow-md transition-all duration-100 active:translate-y-1 border-4 border-black
                        ${isSelected(nextKey.note)
                            ? "bg-green-300 text-black"
                            : "bg-black text-white"
                          }`}
                      >
                        {nextKey.note}
                      </button>
                    )
                  }
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
        className="mt-8 px-10 py-4 bg-lime-400 border-4 border-black rounded-2xl text-2xl font-black shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:bg-lime-300 active:translate-y-1 transition"
      >
        Submit
      </button>

      {/* Selected notes */}
      <div className="mt-6 bg-white border-4 border-black px-6 py-3 rounded-xl text-xl font-bold shadow-[6px_6px_0px_rgba(0,0,0,1)]">
        Selected: {selectedNotes.join(" ")}
      </div>

    </div >
  );
}

export default App;