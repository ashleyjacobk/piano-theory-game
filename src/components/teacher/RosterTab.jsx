import React, { useState } from "react";

export default function RosterTab({ students = [], setSelectedStudent }) {
  const [isCondensed, setIsCondensed] = useState(false);

  return (
    <div className="flex flex-col gap-6 text-left font-sans">
      {students.length > 0 && (
        <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl p-4 shadow-md shadow-slate-100/30 select-none">
          <span className="text-sm font-semibold text-slate-500">
            Classroom Size: <span className="font-extrabold text-slate-800">{students.length} students</span>
          </span>
          <button
            type="button"
            onClick={() => setIsCondensed(!isCondensed)}
            className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition duration-200 active:scale-[0.95] flex items-center gap-1 cursor-pointer"
          >
            {isCondensed ? "Expand Student Cards" : "Condensed List View"}
          </button>
        </div>
      )}

      {students.length === 0 ? (
        <div className="text-center p-8 bg-white border border-slate-200/80 rounded-2xl shadow-lg shadow-slate-100/30">
          <p className="text-lg font-bold text-slate-500">No students registered yet!</p>
        </div>
      ) : isCondensed ? (
        /* CONDENSED CLASSROOM LIST VIEW */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-100/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Practice ({students.length > 0 ? students[0].weekLabel : "This Week"})</th>
                  <th className="px-6 py-3.5">Active Homework</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {students.map((student) => {
                  const activeHW = student.homework.find((h) => !h.completed);
                  return (
                    <tr key={student.username} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                      <td className="px-6 py-4 font-bold text-indigo-600">{student.totalMinutes} mins</td>
                      <td className="px-6 py-4">
                        {activeHW ? (
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-600 select-none">
                              {activeHW.type === "note"
                                ? "Note Match"
                                : activeHW.type === "chord"
                                  ? "Chord Build"
                                  : activeHW.type === "staff"
                                    ? "Staff Reader"
                                    : `Practice: ${activeHW.songName || "Song"}`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold select-none">
                              ({activeHW.progress}/{activeHW.target}{activeHW.type === "practice" ? "m" : ""})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic select-none">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(student)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition active:scale-[0.96] cursor-pointer"
                        >
                          Progress
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* EXPANDED GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {students.map((student) => {
            const activeHW = student.homework.find((h) => !h.completed);
            return (
              <div
                key={student.username}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl shadow-slate-100/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-800">{student.name}</h3>
                    <span className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg text-xs font-semibold text-slate-600 select-none">
                      @{student.username}
                    </span>
                  </div>

                  {/* Practice Time */}
                  <div className="mb-4 bg-indigo-50/50 border border-indigo-100/50 p-3 rounded-xl select-none">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Weekly Practice Time ({student.weekLabel})
                    </span>
                    <span className="text-2xl font-extrabold text-indigo-600">
                      {student.totalMinutes} <span className="text-sm font-medium text-slate-500 font-sans">minutes</span>
                    </span>
                  </div>

                  {/* Homework status */}
                  <div className="mb-4 bg-slate-50 border border-slate-100 p-3 rounded-xl text-left">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 select-none">Homework:</h4>
                    {activeHW ? (
                      <div>
                        <p className="font-semibold text-sm text-slate-700">
                          {activeHW.type === "note"
                            ? "Identify Notes"
                            : activeHW.type === "chord"
                              ? "Build Chords"
                              : activeHW.type === "staff"
                                ? "Staff Reader"
                                : `Practice: "${activeHW.songName || "Assigned Song"}"`}{" "}
                          (Goal: {activeHW.target} {activeHW.type === "practice" ? "mins" : "q's"})
                        </p>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-200/60 border border-slate-300/30 h-3 rounded-full overflow-hidden mt-2 relative select-none">
                          <div
                            className="bg-indigo-500 h-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (activeHW.progress / activeHW.target) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 block select-none">
                          {activeHW.progress} / {activeHW.target}{" "}
                          {activeHW.type === "practice" ? "minutes" : "questions"} completed
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400 italic select-none">
                        No active homework assignments.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStudent(student)}
                  className="w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition duration-200 active:scale-[0.98] cursor-pointer"
                >
                  View Detailed Progress
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
