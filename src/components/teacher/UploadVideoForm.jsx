import React, { useState, useEffect } from "react";
import SearchableStudentSelect from "../common/SearchableStudentSelect";
import CloneVideoModal from "./CloneVideoModal";
import NewSongModal from "./NewSongModal";
import { uploadVideo } from "../../api/videosApi";

export default function UploadVideoForm({
  students = [],
  videos = [],
  archivedSongs = [],
  fetchData
}) {
  const [vidStudent, setVidStudent] = useState("");
  const [vidSongName, setVidSongName] = useState("");
  const [vidTitle, setVidTitle] = useState("");
  const [vidUrl, setVidUrl] = useState("");
  const [vidComposer, setVidComposer] = useState("");
  const [vidLoading, setVidLoading] = useState(false);
  const [vidMessage, setVidMessage] = useState(null);

  // Local File Upload States
  const [uploadType, setUploadType] = useState("link"); // "link" | "file"
  const [videoFile, setVideoFile] = useState(null);
  const [fileBase64, setFileBase64] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Success Popup Modal State
  const [uploadSuccessDetails, setUploadSuccessDetails] = useState(null);

  // Dialog Modals State
  const [isClonedVideoModalOpen, setIsClonedVideoModalOpen] = useState(false);
  const [isNewSongModalOpen, setIsNewSongModalOpen] = useState(false);

  // Reset inputs when target student changes
  useEffect(() => {
    setVidSongName("");
    setVidTitle("");
    setVidUrl("");
    setVidComposer("");
    setVidMessage(null);
    setVideoFile(null);
    setFileBase64("");
  }, [vidStudent]);

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setVidMessage({ type: "error", text: "Please select a valid video file (mp4, mov, etc.)." });
      return;
    }
    setVideoFile(file);
    setVidMessage(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(",")[1];
      setFileBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    setVidLoading(true);
    setVidMessage(null);

    if (!vidStudent) {
      setVidMessage({ type: "error", text: "Please select a student from the dropdown." });
      setVidLoading(false);
      return;
    }

    if (!vidSongName || vidSongName === "ADD_NEW_SONG") {
      setVidMessage({ type: "error", text: "Please select or create a valid song name." });
      setVidLoading(false);
      return;
    }

    if (uploadType === "link" && !vidUrl.trim()) {
      setVidMessage({ type: "error", text: "Please enter a valid YouTube URL." });
      setVidLoading(false);
      return;
    }

    if (uploadType === "file" && (!videoFile || !fileBase64)) {
      setVidMessage({ type: "error", text: "Please select or drop a valid video file." });
      setVidLoading(false);
      return;
    }

    try {
      const payload = {
        studentUsername: vidStudent,
        songName: vidSongName,
        title: vidTitle.trim(),
        composer: vidComposer.trim() || ""
      };

      if (uploadType === "file") {
        payload.fileData = {
          name: videoFile.name,
          base64: fileBase64
        };
      } else {
        payload.url = vidUrl.trim();
      }

      const targetStudentName = students.find((s) => s.username === vidStudent)?.name || vidStudent;
      const targetSongName = vidSongName;

      await uploadVideo(payload);

      setUploadSuccessDetails({
        studentName: targetStudentName,
        songName: targetSongName
      });

      // Reset form fields
      setVidTitle("");
      setVidUrl("");
      setVidComposer("");
      setVidSongName("");
      setVideoFile(null);
      setFileBase64("");

      // Refresh teacher data
      await fetchData();
    } catch (err) {
      console.error(err);
      setVidMessage({ type: "error", text: err.message || "Failed to upload video." });
    } finally {
      setVidLoading(false);
    }
  };

  const handleSongSelectChange = (val) => {
    if (val === "ADD_NEW_SONG") {
      setIsNewSongModalOpen(true);
      setVidSongName("");
    } else {
      setVidSongName(val);
      // Auto-fill composer metadata if exists in videos library
      const matched = videos.find((v) => v.songName.toLowerCase() === val.toLowerCase() && v.composer);
      if (matched) {
        setVidComposer(matched.composer);
      } else {
        setVidComposer("");
      }
    }
  };

  const handleCreateNewSong = (name, composer) => {
    setVidSongName(name);
    setVidComposer(composer);
    setIsNewSongModalOpen(false);
  };

  const handleSelectCloneUrl = (url) => {
    const matched = videos.find((v) => v.url === url);
    if (matched) {
      setVidTitle(matched.title);
      setVidUrl(matched.url);
      setVidComposer(matched.composer || "");
      setUploadType("link");
    }
    setIsClonedVideoModalOpen(false);
  };

  const otherStudentsVideosForSong = vidSongName
    ? videos.filter(
      (v) =>
        v.songName.toLowerCase() === vidSongName.toLowerCase() &&
        v.studentUsername.toLowerCase() !== vidStudent.toLowerCase()
    )
    : [];
  const hasCommonVideos = otherStudentsVideosForSong.length > 0;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl shadow-slate-100/40 lg:col-span-1 h-fit font-sans">
      <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 select-none">
        Share Video
      </h2>

      {vidMessage && (
        <div
          className={`border p-2.5 rounded-xl font-semibold text-center text-xs mb-4 ${vidMessage.type === "success"
            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
            : "bg-red-50 border-red-100 text-red-800"
            }`}
        >
          {vidMessage.text}
        </div>
      )}

      <form onSubmit={handleAddVideo} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">Target Student</label>
          <SearchableStudentSelect
            value={vidStudent}
            onChange={(val) => setVidStudent(val)}
            students={students}
            placeholder="Search student..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">Song Name</label>
          <select
            value={vidSongName}
            onChange={(e) => handleSongSelectChange(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none cursor-pointer font-semibold"
            required
            disabled={!vidStudent}
          >
            <option value="" disabled>-- Select a Song --</option>
            <option value="ADD_NEW_SONG" className="font-bold text-indigo-600 bg-indigo-50">
              -- Add New Song... --
            </option>
            {(() => {
              const currentStudentActiveVideos = vidStudent
                ? videos.filter(
                  (v) =>
                    v.studentUsername.toLowerCase() === vidStudent.toLowerCase() &&
                    !archivedSongs.includes(v.songName)
                )
                : [];
              const currentStudentActiveSongs = Array.from(
                new Set(currentStudentActiveVideos.map((v) => v.songName))
              ).filter(Boolean);

              if (vidSongName && vidSongName !== "ADD_NEW_SONG" && !currentStudentActiveSongs.includes(vidSongName)) {
                currentStudentActiveSongs.push(vidSongName);
              }

              return currentStudentActiveSongs.map((songName) => (
                <option key={songName} value={songName}>
                  {songName}
                </option>
              ));
            })()}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">Lesson Part/Description</label>
          <input
            type="text"
            required
            value={vidTitle}
            onChange={(e) => setVidTitle(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">Video Source</label>
          <select
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none cursor-pointer font-semibold"
          >
            <option value="link">YouTube Link</option>
            <option value="file">Local Video File (Drag/Upload)</option>
          </select>
        </div>

        {uploadType === "link" ? (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">YouTube URL</label>
            <input
              type="url"
              required
              value={vidUrl}
              onChange={(e) => setVidUrl(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none font-semibold"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">Upload Video File</label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 select-none ${dragOver
                ? "border-indigo-500 bg-indigo-50/40"
                : videoFile
                  ? "border-emerald-500 bg-emerald-50/10"
                  : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
                }`}
              onClick={() => document.getElementById("file-input").click()}
            >
              <input
                id="file-input"
                type="file"
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              {videoFile ? (
                <div className="space-y-1">
                  <span className="text-2xl">🎬</span>
                  <p className="text-xs font-bold text-slate-700 break-all">{videoFile.name}</p>
                  <p className="text-[10px] font-semibold text-slate-400">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {fileBase64 ? (
                    <p className="text-[10px] text-emerald-600 font-bold">Successfully loaded!</p>
                  ) : (
                    <p className="text-[10px] text-indigo-500 font-bold animate-pulse">Reading video data...</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-2xl text-slate-400">📤</span>
                  <p className="text-xs font-bold text-slate-600">
                    Drag & drop a video file here
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    or click to browse library / photos
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsClonedVideoModalOpen(true)}
          disabled={!hasCommonVideos}
          className={`w-full py-2.5 rounded-xl text-xs font-bold transition duration-200 active:scale-[0.98] cursor-pointer border select-none ${hasCommonVideos
            ? "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 shadow-sm"
            : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
            }`}
        >
          Choose Existing Video for this Song
        </button>

        <button
          type="submit"
          disabled={vidLoading || students.length === 0}
          className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition duration-200 active:scale-[0.98] shadow-md shadow-indigo-100 cursor-pointer select-none"
        >
          {vidLoading ? "Uploading..." : "Save and Send Video"}
        </button>
      </form>

      {/* CLONE VIDEO MODAL POPUP */}
      <CloneVideoModal
        isOpen={isClonedVideoModalOpen}
        onClose={() => setIsClonedVideoModalOpen(false)}
        videos={videos}
        vidSongName={vidSongName}
        vidStudent={vidStudent}
        onSelectCloneUrl={handleSelectCloneUrl}
      />

      {/* CREATE NEW SONG DIALOG POPUP */}
      <NewSongModal
        isOpen={isNewSongModalOpen}
        onClose={() => setIsNewSongModalOpen(false)}
        onCreateSong={handleCreateNewSong}
      />

      {/* SUCCESS CONFIRMATION MODAL POPUP */}
      {uploadSuccessDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 text-center max-w-sm w-full font-sans select-none space-y-4">
            <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wide">Video Shared</h3>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              Video successfully uploaded to <strong className="text-indigo-600 font-extrabold">{uploadSuccessDetails.studentName}</strong>'s <strong className="text-indigo-600 font-extrabold">"{uploadSuccessDetails.songName}"</strong> folder
            </p>
            <button
              onClick={() => setUploadSuccessDetails(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition duration-200 active:scale-[0.98] shadow-md shadow-indigo-100 cursor-pointer"
            >
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
