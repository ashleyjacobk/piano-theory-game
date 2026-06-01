import React, { useState } from "react";

export default function NewSongModal({ isOpen = false, onClose, onCreateSong }) {
  const [newSongNameInput, setNewSongNameInput] = useState("");
  const [newSongComposerInput, setNewSongComposerInput] = useState("");

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!newSongNameInput.trim()) return;
    if (onCreateSong) {
      onCreateSong(newSongNameInput.trim(), newSongComposerInput.trim());
    }
    setNewSongNameInput("");
    setNewSongComposerInput("");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-sm w-full">
        <h3 className="text-xl font-bold text-slate-800 mb-2 select-none">Add New Song Folder</h3>
        <p className="text-xs font-semibold text-slate-400 mb-4 select-none">
          Create a shared catalog entry. It will instantly show inside student homework and practice logs choices.
        </p>

        <div className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 select-none">Song Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Für Elise"
              value={newSongNameInput}
              onChange={(e) => setNewSongNameInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 select-none">Composer Name</label>
            <input
              type="text"
              placeholder="e.g. Ludwig van Beethoven"
              value={newSongComposerInput}
              onChange={(e) => setNewSongComposerInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 select-none">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 rounded-xl text-xs active:scale-[0.98] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
          >
            Create Folder
          </button>
        </div>
      </div>
    </div>
  );
}
