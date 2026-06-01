import React, { useState, useEffect } from "react";
import ConfirmModal from "../common/ConfirmModal";
import { updateTeacherProfile, deleteUserAccount } from "../../api/profileApi";

export default function TeacherProfileTab({
  user,
  teacherProfile = null,
  onLogout,
  fetchData
}) {
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileLessonDay, setProfileLessonDay] = useState("Wednesday");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sync profile details on load
  useEffect(() => {
    if (teacherProfile) {
      setProfileName(teacherProfile.name || "");
      setProfileEmail(teacherProfile.email || "");
      setProfileLessonDay(teacherProfile.lessonDay || "Wednesday");
    }
  }, [teacherProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);

    try {
      await updateTeacherProfile({
        username: user.username,
        name: profileName.trim(),
        email: profileEmail.trim(),
        lessonDay: profileLessonDay
      });

      setProfileMessage({ type: "success", text: "Settings saved successfully! 🎉" });
      await fetchData();
    } catch (err) {
      console.error(err);
      setProfileMessage({ type: "error", text: err.message || "Failed to update profile settings." });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteUserAccount(user.username);
      setIsConfirmOpen(false);
      onLogout(true); // Bypass confirmation to log out instantly
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred while attempting to delete your account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!teacherProfile) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-lg font-sans">
        Loading teacher profile...
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-2xl space-y-8 font-sans text-left">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-100/50">
          <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3 select-none">
            Teacher Profile & Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-bold text-slate-700 select-none">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Display Name</span>
                <span className="text-lg font-black text-indigo-600">{teacherProfile.name}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Username</span>
                <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-xs font-bold text-indigo-600 block w-fit shadow-sm">
                  @{teacherProfile.username}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Teacher Connection Code</span>
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-sm font-bold text-slate-700 block w-fit mb-4">
                  {teacherProfile.teacherCode}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Weekly Lesson Day</span>
                <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-sm font-bold text-slate-700 block w-fit">
                  {teacherProfile.lessonDay || "Wednesday"}
                </span>
              </div>
            </div>
          </div>

          {/* EDIT PROFILE & LESSON SETTINGS FORM */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide select-none">
              Edit Profile & Lesson Settings
            </h3>
            {profileMessage && (
              <div
                className={`border p-2.5 rounded-xl text-xs font-semibold mb-4 text-center ${
                  profileMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : "bg-red-50 border-red-100 text-red-800"
                }`}
              >
                {profileMessage.text}
              </div>
            )}
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-xs outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-xs outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">
                  Weekly Lesson Day
                </label>
                <select
                  value={profileLessonDay}
                  onChange={(e) => setProfileLessonDay(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-xs outline-none cursor-pointer font-semibold"
                >
                  <option value="Sunday">Sunday</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
                <p className="text-[10px] text-slate-400 font-semibold mt-1 select-none">
                  Practice minutes calculations and student rosters reset automatically on this day every week.
                </p>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition duration-200 active:scale-[0.98] shadow-md shadow-indigo-100 cursor-pointer"
              >
                {profileSaving ? "Saving Settings..." : "Save Profile Settings"}
              </button>
            </form>
          </div>

          {/* DANGER ZONE FOR TEACHER ACCOUNT DELETION */}
          <div className="mt-8 border-t border-slate-100 pt-6 select-none">
            <h4 className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wide">Danger Zone</h4>
            <p className="text-slate-500 text-xs mb-4 leading-relaxed font-semibold">
              Deleting your teacher account is permanent and irreversible. <strong>ALL STUDENTS linked to your connection code</strong> will be permanently deleted along with all their homework, logs, scores, and video records!
            </p>
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition duration-200 active:scale-[0.98] shadow-md shadow-red-100 cursor-pointer"
            >
              Permanently Delete My Account
            </button>
          </div>
        </div>

        <ConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Teacher Account?"
          message={
            deleteLoading
              ? "Wiping classroom registry..."
              : "WARNING: Are you absolutely sure you want to permanently delete your teacher account? Doing so will instantly delete ALL students connected to your classroom code, including all of their logs, homework, and shared slow-mo lessons forever!"
          }
          confirmText={deleteLoading ? "Deleting..." : "Permanently Delete Class"}
          cancelText="Keep My Account"
          isTeacherTheme={true}
        />
      </div>
    </div>
  );
}
