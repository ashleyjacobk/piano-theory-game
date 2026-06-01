import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import TeacherDashboard from "./components/teacher/TeacherDashboard";
import StudentDashboard from "./components/student/StudentDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Restore session from localStorage on load
  useEffect(() => {
    const savedUser = localStorage.getItem("piano_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("Failed to parse saved user:", err);
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("piano_user", JSON.stringify(userData));
  };

  const executeLogout = () => {
    setUser(null);
    localStorage.removeItem("piano_user");
    setShowLogoutConfirm(false);
  };

  const handleLogout = (bypassConfirm = false) => {
    if (bypassConfirm) {
      executeLogout();
    } else {
      setShowLogoutConfirm(true);
    }
  };

  const bgClass = !user
    ? "bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/40 text-slate-800"
    : user.role === "teacher"
    ? "bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/20 text-slate-800"
    : "bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 text-slate-800";

  return (
    <div className={`min-h-screen ${bgClass} w-full flex flex-col items-center justify-center p-4 transition-colors duration-500`}>
      {!user ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : user.role === "teacher" ? (
        <TeacherDashboard user={user} onLogout={(bypass) => handleLogout(bypass)} />
      ) : (
        <StudentDashboard user={user} onLogout={(bypass) => handleLogout(bypass)} />
      )}

      {/* CONFIRM LOGOUT MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${
            user.role === "teacher"
              ? "bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6 text-center max-w-sm w-full"
              : "bg-white border-4 border-slate-800 shadow-[6px_6px_0px_#a7f3d0] rounded-[2rem] p-6 text-center max-w-sm w-full"
          }`}>
            <h3 className={`text-2xl font-black mb-4 uppercase tracking-wide ${
              user.role === "teacher" ? "text-slate-800" : "text-emerald-600"
            }`}>
              Confirm Logout
            </h3>
            <p className={`font-bold mb-6 text-sm ${
              user.role === "teacher" ? "text-slate-500" : "text-slate-600"
            }`}>
              Are you sure you want to log out of Piano Academy?
            </p>
            <div className="flex gap-4">
              <button
                onClick={executeLogout}
                className={`flex-1 py-3 font-black text-sm rounded-xl transition duration-200 active:scale-[0.98] cursor-pointer ${
                  user.role === "teacher"
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-100"
                    : "bg-amber-300 hover:bg-amber-200 text-slate-800 border-2 border-slate-800 shadow-[2px_2px_0px_#a7f3d0]"
                }`}
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`flex-1 py-3 font-black text-sm rounded-xl transition duration-200 active:scale-[0.98] cursor-pointer ${
                  user.role === "teacher"
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    : "bg-emerald-200 hover:bg-emerald-100 text-slate-800 border-2 border-slate-800 shadow-[2px_2px_0px_#fef08a]"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;