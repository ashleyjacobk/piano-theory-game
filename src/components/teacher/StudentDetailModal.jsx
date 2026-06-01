import React, { useState } from "react";

// Helper function to calculate the date of the next lesson day
const getWeekRangeForDate = (dateStr, lessonDayName) => {
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIndex = DAYS.indexOf(lessonDayName || 'Wednesday');
  const validDayIndex = targetDayIndex === -1 ? 3 : targetDayIndex;

  const [yearVal, monthVal, dayVal] = dateStr.split('-').map(Number);
  const logDate = new Date(yearVal, monthVal - 1, dayVal);
  logDate.setHours(0, 0, 0, 0);

  const currentDayIndex = logDate.getDay();

  // Calculate start date (most recent lessonDay <= logDate)
  let daysToSubtract = currentDayIndex - validDayIndex;
  if (daysToSubtract < 0) {
    daysToSubtract += 7;
  }

  const startDate = new Date(logDate);
  startDate.setDate(logDate.getDate() - daysToSubtract);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const formatMD = (dt) => `${dt.getMonth() + 1}/${dt.getDate()}`;
  return {
    label: `${formatMD(startDate)} - ${formatMD(endDate)}`,
    startDate,
    endDate
  };
};

const groupLogsByLessonWeeks = (logs, lessonDayName) => {
  const groups = {}; // { [weekLabel]: Array of logs }
  const weekStartDates = {}; // { [weekLabel]: Date }

  logs.forEach(log => {
    const { label, startDate } = getWeekRangeForDate(log.date, lessonDayName);
    if (!groups[label]) {
      groups[label] = [];
      weekStartDates[label] = startDate;
    }
    groups[label].push(log);
  });

  const sortedLabels = Object.keys(groups).sort((a, b) => weekStartDates[b] - weekStartDates[a]);
  return sortedLabels.map(label => ({
    label,
    logs: groups[label]
  }));
};

export default function StudentDetailModal({
  selectedStudent,
  onClose,
  onUpdateLessonDay,
  teacherProfile
}) {
  const [expandedWeeks, setExpandedWeeks] = useState({});

  if (!selectedStudent) return null;

  const lessonDay = selectedStudent.lessonDay || "Wednesday";

  const handleDayChange = (e) => {
    if (onUpdateLessonDay) {
      onUpdateLessonDay(selectedStudent.username, e.target.value);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 w-full max-w-3xl rounded-2xl p-6 md:p-8 shadow-2xl max-h-[85vh] overflow-y-auto font-sans">
        
        {/* Modal Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div className="text-left">
            <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.name}</h2>
            <p className="font-semibold text-slate-400 mt-1 text-sm">Detailed Progress & Practice Journal</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-sm">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Lesson Day:</label>
              <select
                value={lessonDay}
                onChange={handleDayChange}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-indigo-500 transition-all"
              >
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition duration-200 cursor-pointer active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* COLUMN 1: MANUAL PRACTICE JOURNAL GROUPED BY WEEKS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Practice Journal Logs</h3>
            {(!selectedStudent.practiceLogs || selectedStudent.practiceLogs.length === 0) ? (
              <p className="text-slate-400 text-xs italic font-semibold">No entries logged yet.</p>
            ) : (() => {
              const groupedWeeks = groupLogsByLessonWeeks(selectedStudent.practiceLogs, lessonDay || teacherProfile?.lessonDay);
              return (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  {groupedWeeks.map((group) => {
                    const isCurrent = group.label === selectedStudent.weekLabel;
                    const isExpanded = expandedWeeks[group.label] !== undefined ? expandedWeeks[group.label] : isCurrent;
                    
                    return (
                      <div key={group.label} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white text-xs">
                        {/* Week Header Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedWeeks(prev => ({
                              ...prev,
                              [group.label]: !isExpanded
                            }));
                          }}
                          className={`w-full text-left px-3.5 py-2.5 flex justify-between items-center font-bold text-[11px] cursor-pointer select-none transition ${
                            isCurrent 
                              ? 'bg-indigo-50 border-b border-indigo-100 text-indigo-700' 
                              : 'bg-slate-50 border-b border-slate-100 hover:bg-slate-100/60 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{isCurrent ? "Current Week" : "Past Lesson Week"} ({group.label})</span>
                            <span className="bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                              {group.logs.length} {group.logs.length === 1 ? 'log' : 'logs'}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            {isExpanded ? "Collapse" : "Expand"}
                          </span>
                        </button>
                        
                        {/* Week Logs List */}
                        {isExpanded && (
                          <div className="divide-y divide-slate-100 p-3 space-y-3 max-h-[28vh] overflow-y-auto bg-slate-50/20">
                            {group.logs.map((log) => (
                              <div key={log.id} className="first:pt-0 pt-3">
                                <div className="flex justify-between font-semibold text-[11px] text-indigo-600 mb-1">
                                  <span>{log.date}</span>
                                  <span className="bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded text-[9px]">{log.minutes} mins</span>
                                </div>
                                {log.songName && (
                                  <div className="mb-1.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[9px] font-bold text-amber-700 w-fit">
                                    Song: {log.songName}
                                  </div>
                                )}
                                <p className="text-[11px] font-medium text-slate-600 leading-relaxed">"{log.notes}"</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* COLUMN 2: FREE PRACTICE STATS & HOMEWORK HISTORY */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Free Practice History</h3>
              {(!selectedStudent.freePractice || selectedStudent.freePractice.filter(s => s.type === "note").length === 0) ? (
                <p className="text-slate-400 text-xs italic font-semibold mt-3">No sessions completed yet.</p>
              ) : (
                <div className="space-y-2 max-h-[22vh] overflow-y-auto mt-3 pr-2">
                  {selectedStudent.freePractice.filter(s => s.type === "note").map((session) => (
                    <div key={session.id} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex justify-between items-center text-xs font-semibold">
                      <div>
                        <span className="text-slate-700 font-bold">{session.type === "note" ? "Note Identification" : "Chord Building"}</span>
                        <div className="text-[10px] text-slate-400">{session.date}</div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100/50 text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                        Score: {session.score}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Assignment Log</h3>
              {(!selectedStudent.homework || selectedStudent.homework.length === 0) ? (
                <p className="text-slate-400 text-xs italic font-semibold mt-3">No homework assigned yet.</p>
              ) : (
                <div className="space-y-2 max-h-[22vh] overflow-y-auto mt-3 pr-2">
                  {selectedStudent.homework.map((hw) => (
                    <div
                      key={hw.id}
                      className={`border p-2.5 rounded-xl flex justify-between items-center text-xs font-semibold ${
                        hw.completed 
                          ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" 
                          : "bg-amber-50/50 border-amber-100 text-amber-800"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-700">
                          {hw.type === "note" 
                            ? "Identify Notes" 
                            : hw.type === "chord" 
                            ? "Build Chords" 
                            : hw.type === "staff"
                            ? "Staff Reader"
                            : `Practice: "${hw.songName || "Assigned Song"}"`}
                        </div>
                        <div className="text-[9px] text-slate-400">Assigned: {hw.assignedAt}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{hw.completed ? "Completed" : "In Progress"}</div>
                        <div className="text-[10px] text-slate-400">({hw.progress} / {hw.target} {hw.type === "practice" ? "mins" : ""})</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
