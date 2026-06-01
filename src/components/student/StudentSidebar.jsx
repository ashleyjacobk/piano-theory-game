import React from "react";

export default function StudentSidebar({
  user,
  activeTab,
  setActiveTab,
  uncompletedHWCount = 0,
  unreadNotificationsCount = 0,
  onLogout
}) {
  return (
    <div className="w-full md:w-64 flex-shrink-0 bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 shadow-[6px_6px_0px_#a7f3d0] flex flex-col gap-6 md:sticky md:top-4 select-none">
      {/* Branding */}
      <div>
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 leading-none">
          Student
        </h1>
        <h1 className="text-2xl font-black text-slate-800 leading-none mt-1">
          Academy
        </h1>
        <p className="font-bold text-slate-400 mt-2 text-[10px] uppercase tracking-wider">
          Superstar: {user?.name}
        </p>
      </div>

      {/* Navigation Tabs (Vertical Stack!) */}
      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => setActiveTab("homework")}
          className={`w-full text-left px-4 py-3 border-3 border-slate-800 rounded-2xl text-sm font-black shadow-[3px_3px_0px_#a7f3d0] transition active:translate-y-0.5 hover:scale-[1.02] cursor-pointer flex justify-between items-center ${activeTab === "homework"
              ? "bg-emerald-300 text-slate-800 shadow-[1px_1px_0px_#1e293b] translate-y-0.5"
              : "bg-white text-slate-500 hover:bg-emerald-50"
            }`}
        >
          <span>Homework</span>
          {uncompletedHWCount > 0 && (
            <span className="bg-red-500 border-2 border-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
              {uncompletedHWCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("free")}
          className={`w-full text-left px-4 py-3 border-3 border-slate-800 rounded-2xl text-sm font-black shadow-[3px_3px_0px_#a7f3d0] transition active:translate-y-0.5 hover:scale-[1.02] cursor-pointer ${activeTab === "free"
              ? "bg-emerald-300 text-slate-800 shadow-[1px_1px_0px_#1e293b] translate-y-0.5"
              : "bg-white text-slate-500 hover:bg-emerald-50"
            }`}
        >
          Arcade Mode
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`w-full text-left px-4 py-3 border-3 border-slate-800 rounded-2xl text-sm font-black shadow-[3px_3px_0px_#a7f3d0] transition active:translate-y-0.5 hover:scale-[1.02] cursor-pointer ${activeTab === "logs"
              ? "bg-emerald-300 text-slate-800 shadow-[1px_1px_0px_#1e293b] translate-y-0.5"
              : "bg-white text-slate-500 hover:bg-emerald-50"
            }`}
        >
          Log Practice
        </button>

        <button
          onClick={() => setActiveTab("videos")}
          className={`w-full text-left px-4 py-3 border-3 border-slate-800 rounded-2xl text-sm font-black shadow-[3px_3px_0px_#a7f3d0] transition active:translate-y-0.5 hover:scale-[1.02] cursor-pointer flex justify-between items-center ${activeTab === "videos"
              ? "bg-emerald-300 text-slate-800 shadow-[1px_1px_0px_#1e293b] translate-y-0.5"
              : "bg-white text-slate-500 hover:bg-emerald-50"
            }`}
        >
          <span>Video Lessons</span>
          {unreadNotificationsCount > 0 && (
            <span className="bg-red-500 border-2 border-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`w-full text-left px-4 py-3 border-3 border-slate-800 rounded-2xl text-sm font-black shadow-[3px_3px_0px_#a7f3d0] transition active:translate-y-0.5 hover:scale-[1.02] cursor-pointer ${activeTab === "profile"
              ? "bg-emerald-300 text-slate-800 shadow-[1px_1px_0px_#1e293b] translate-y-0.5"
              : "bg-white text-slate-500 hover:bg-emerald-50"
            }`}
        >
          My Profile
        </button>
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto border-t-3 border-slate-100 pt-4">
        <button
          onClick={() => onLogout(false)}
          className="w-full py-2.5 bg-amber-300 hover:bg-amber-200 text-slate-800 border-3 border-slate-800 rounded-2xl text-xs font-black shadow-[2px_2px_0px_#a7f3d0] active:translate-y-0.5 hover:scale-[1.02] transition-all cursor-pointer text-center"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
