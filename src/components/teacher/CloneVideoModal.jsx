import React from "react";

export default function CloneVideoModal({
  isOpen = false,
  onClose,
  videos = [],
  vidSongName = "",
  vidStudent = "",
  onSelectCloneUrl
}) {
  if (!isOpen) return null;

  const uniqueClonedVideos = videos
    .filter(
      (v) =>
        v.songName.toLowerCase() === vidSongName.toLowerCase() &&
        v.studentUsername.toLowerCase() !== vidStudent.toLowerCase()
    )
    .reduce((acc, current) => {
      const x = acc.find((item) => item.url === current.url);
      if (!x) acc.push(current);
      return acc;
    }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-slate-800 mb-2 select-none">Cloned Videos Repo</h3>
        <p className="text-xs font-semibold text-slate-400 mb-4 leading-relaxed select-none">
          Below are slow-mo demonstration videos shared with other students on the song <span className="font-bold text-indigo-600">"{vidSongName}"</span>. Choose one to clone all details instantly.
        </p>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {uniqueClonedVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => {
                if (onSelectCloneUrl) {
                  onSelectCloneUrl(video.url);
                }
              }}
              className="group bg-slate-50 hover:bg-indigo-50 border border-slate-200 p-4 rounded-xl transition cursor-pointer flex justify-between items-center text-left"
            >
              <div className="flex-1 mr-4">
                <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition mb-0.5 select-none">
                  {video.title}
                </div>
                <div className="text-[9px] font-semibold text-slate-400 truncate max-w-xs select-none">
                  {video.url}
                </div>
              </div>
              <span className="bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg select-none">
                Select
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 select-none">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 rounded-xl text-xs active:scale-[0.98] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
