import React from "react";

export default function TeacherSidebar({
  user,
  activeTab,
  setActiveTab,
  unreadNotificationsCount = 0,
  onLogout
}) {
  return (
    <div className="w-full md:w-64 flex-shrink-0 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl shadow-slate-100/30 flex flex-col gap-6 md:sticky md:top-4 select-none font-sans text-left">
      {/* Branding */}
      <div>
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5 select-none">
          Teacher Console
        </span>
        <h1 className="text-2xl font-bold text-slate-800 leading-none">Piano Academy</h1>
        <p className="font-semibold text-slate-400 mt-2 text-[10px] uppercase tracking-wider">
          Instructor: {user?.name}
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => setActiveTab("roster")}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${
            activeTab === "roster"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Student Roster
        </button>

        <button
          onClick={() => setActiveTab("homework")}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${
            activeTab === "homework"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Assign Homework
        </button>

        <button
          onClick={() => setActiveTab("videos")}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${
            activeTab === "videos"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Share Video Lessons
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${
            activeTab === "profile"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          Teacher Settings
        </button>
      </div>

      {/* Notifications / Actions */}
      <div className="mt-auto border-t border-slate-100 pt-4 flex flex-col gap-3">
        <button
          onClick={() => setActiveTab("inbox")}
          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex justify-between items-center ${
            activeTab === "inbox"
              ? "bg-indigo-50 text-indigo-700"
              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <span>Comments Inbox</span>
          {unreadNotificationsCount > 0 && (
            <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onLogout(false)}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition duration-200 active:scale-[0.98] cursor-pointer border border-slate-200/50 text-center"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
