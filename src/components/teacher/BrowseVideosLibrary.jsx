import React, { useState, useEffect } from "react";
import SearchableStudentSelect from "../common/SearchableStudentSelect";
import VideoCommentsSection from "./VideoCommentsSection";
import { setSongArchiveState } from "../../api/profileApi";

export default function BrowseVideosLibrary({
  students = [],
  videos = [],
  archivedSongs = [],
  fetchData,
  user,
  initialBrowseStudent = "",
  initialSelectedSong = ""
}) {
  const [browseStudent, setBrowseStudent] = useState(initialBrowseStudent || "");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedSong, setSelectedSong] = useState(initialSelectedSong || "");

  useEffect(() => {
    if (initialBrowseStudent) {
      setBrowseStudent(initialBrowseStudent);
    }
  }, [initialBrowseStudent]);

  useEffect(() => {
    if (initialSelectedSong) {
      setSelectedSong(initialSelectedSong);
    }
  }, [initialSelectedSong]);

  const handleArchiveToggle = async (song, archivedState) => {
    try {
      await setSongArchiveState(song, archivedState);
      await fetchData();
      setSelectedSong("");
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVideos = browseStudent
    ? videos.filter(
        (v) =>
          v.studentUsername.toLowerCase() === browseStudent.toLowerCase() &&
          (showArchived ? archivedSongs.includes(v.songName) : !archivedSongs.includes(v.songName))
      )
    : [];

  const studentSongFolders = Array.from(new Set(filteredVideos.map((v) => v.songName))).filter(Boolean);

  const displayedVideos = selectedSong ? filteredVideos.filter((v) => v.songName === selectedSong) : [];

  return (
    <div className="lg:col-span-2 space-y-6 font-sans">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl shadow-slate-100/40">
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select Student to Browse Library</label>
          <SearchableStudentSelect
            value={browseStudent}
            onChange={(val) => {
              setBrowseStudent(val);
              setSelectedSong("");
            }}
            students={students}
            placeholder="Search student..."
          />
        </div>

        {browseStudent ? (
          <>
            <div className="flex justify-between items-center border-t border-slate-100 pt-4 pb-3 mb-4 select-none">
              <h3 className="text-sm font-bold text-slate-700">
                {showArchived ? "Archived Songs Folder" : "Active Lessons Library"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowArchived(!showArchived);
                  setSelectedSong("");
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition duration-200 cursor-pointer active:scale-[0.98]"
              >
                {showArchived ? "View Active Songs" : "View Archived Songs"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 select-none">
              {studentSongFolders.length === 0 ? (
                <span className="text-xs font-semibold text-slate-400 italic">No shared folders.</span>
              ) : (
                studentSongFolders.map((song) => (
                  <button
                    key={song}
                    onClick={() => setSelectedSong(song)}
                    className={`px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer active:scale-[0.98] transition ${
                      selectedSong === song ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {song}
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-4 border-t border-slate-100 select-none">
            <p className="text-xs font-semibold text-slate-400 italic">Please select a student from the dropdown above to view their folder library.</p>
          </div>
        )}
      </div>

      {selectedSong && displayedVideos.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl shadow-slate-100/40 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-800 select-none">
              {selectedSong}{" "}
              {showArchived && (
                <span className="text-[9px] bg-red-500 text-white font-extrabold px-1.5 py-0.5 rounded-full ml-1.5 select-none border border-red-600">
                  Archived
                </span>
              )}
            </h3>
            <button
              type="button"
              onClick={() => handleArchiveToggle(selectedSong, !showArchived)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-[0.98] border cursor-pointer select-none ${
                showArchived
                  ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                  : "bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
              }`}
            >
              {showArchived ? "Restore Song to Active Folder" : "Archive Song Folder"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayedVideos.map((video) => (
              <div key={video.id} id={`video-card-${video.id}`} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/30 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 mb-1 select-none">{video.title}</h4>
                  {video.composer && (
                    <div className="mb-2 text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded w-fit select-none">
                      Composer: {video.composer}
                    </div>
                  )}
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-black">
                    {video.url.includes("youtube.com/embed/") ? (
                      <iframe
                        src={video.url}
                        title={video.title}
                        className="absolute top-0 left-0 w-full h-full"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <video
                        src={video.url}
                        controls
                        className="absolute top-0 left-0 w-full h-full object-contain"
                      ></video>
                    )}
                  </div>
                </div>

                <VideoCommentsSection
                  video={video}
                  user={user}
                  onCommentCountChange={fetchData}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
