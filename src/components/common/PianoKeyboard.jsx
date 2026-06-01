import React from "react";
import { PIANO_KEYS } from "../../data/pianoLayout";
import { isEnharmonicallyEquivalent } from "../../game/notes";

export default function PianoKeyboard({
  selectedNotes = [],
  onNoteClick,
  isNoteMode = false,
  compact = false,
  theme = "blue" // "blue" or "emerald"
}) {
  const isSelected = (note) => selectedNotes.some((s) => isEnharmonicallyEquivalent(s, note));

  const frameClass = theme === "emerald"
    ? "bg-emerald-100 border-4 border-slate-800 shadow-[4px_4px_0px_#fef08a]"
    : "bg-[#EFF6FF] border-4 border-slate-800 shadow-[4px_4px_0px_#2D3748]";

  return (
    <div className={`flex justify-center p-6 ${frameClass} rounded-[2rem] overflow-x-auto max-w-full select-none`}>
      <div className="flex relative">
        {PIANO_KEYS.map((key, index) => {
          if (key.type === "white") {
            const nextKey = PIANO_KEYS[index + 1];
            const hasBlackKey = nextKey && nextKey.type === "black";

            return (
              <div key={key.note} className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onNoteClick(key.note)}
                  className={`${
                    compact ? "w-11 h-32 pb-3 text-xs border-3" : "w-14 h-48 pb-4 text-sm border-4"
                  } border-slate-800 font-black flex items-end justify-center rounded-b-lg transition-all active:translate-y-0.5 hover:scale-[1.01] cursor-pointer ${
                    isSelected(key.note) ? "bg-[#6EE7B7] text-[#065F46] shadow-inner" : "bg-white text-slate-800"
                  }`}
                >
                  {isNoteMode ? "" : key.note}
                </button>
                {hasBlackKey && (
                  <button
                    type="button"
                    onClick={() => onNoteClick(nextKey.note)}
                    className={`absolute top-0 right-0 translate-x-1/2 ${
                      compact ? "w-7 h-20 border-3 text-[10px] pb-2" : "w-10 h-32 border-4 text-xs pb-3"
                    } font-black flex items-end justify-center rounded-b-md z-10 transition-all active:translate-y-0.5 hover:scale-[1.01] border-slate-800 cursor-pointer ${
                      isSelected(nextKey.note) ? "bg-[#6EE7B7] text-[#065F46] shadow-inner" : "bg-slate-900 text-white"
                    }`}
                  >
                  </button>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
