import React from "react";
import UploadVideoForm from "./UploadVideoForm";
import BrowseVideosLibrary from "./BrowseVideosLibrary";

export default function TeacherVideosTab({
  students = [],
  videos = [],
  archivedSongs = [],
  fetchData,
  user,
  initialBrowseStudent = "",
  initialSelectedSong = ""
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left font-sans select-none">
      {/* Upload Video Form Card (Col 1) */}
      <UploadVideoForm
        students={students}
        videos={videos}
        archivedSongs={archivedSongs}
        fetchData={fetchData}
      />

      {/* Videos Library Folders Selector & Grid Viewer (Col 2 & 3) */}
      <BrowseVideosLibrary
        students={students}
        videos={videos}
        archivedSongs={archivedSongs}
        fetchData={fetchData}
        user={user}
        initialBrowseStudent={initialBrowseStudent}
        initialSelectedSong={initialSelectedSong}
      />
    </div>
  );
}
