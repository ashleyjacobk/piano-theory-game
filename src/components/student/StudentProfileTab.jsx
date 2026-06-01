import React, { useState } from "react";
import ConfirmModal from "../common/ConfirmModal";
import { deleteUserAccount } from "../../api/profileApi";

export default function StudentProfileTab({ profileData, user, onLogout }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  if (!profileData) {
    return (
      <div className="bg-white border-4 border-slate-800 rounded-[2rem] p-8 text-center shadow-lg font-mono">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 font-mono">
      <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-[6px_6px_0px_#a7f3d0]">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 border-b-3 border-slate-100 pb-2 mb-6 select-none text-left">
          My Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-bold text-slate-700 text-left">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wide">Name</span>
              <span className="text-2xl font-black text-emerald-600">{profileData.name}</span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wide">Email</span>
              <span className="bg-emerald-100 border-2 border-slate-800 px-2 py-0.5 rounded text-xs font-black block w-fit mb-1 shadow-[1px_1px_0px_#fef08a]">
                {profileData.username}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wide">Teacher</span>
              <span className="text-lg font-black text-emerald-600">Teacher: {profileData.teacherName}</span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wide">Teacher Connection Code</span>
              <span className="bg-amber-100 border-2 border-slate-800 px-2.5 py-0.5 rounded text-xs font-black block w-fit shadow-[1px_1px_0px_#a7f3d0]">
                {profileData.teacherCode}
              </span>
            </div>
          </div>
        </div>

        {/* DANGER ZONE FOR ACCOUNT DELETION */}
        <div className="mt-8 border-t-3 border-dashed border-slate-200 pt-6 text-left select-none">
          <h4 className="text-sm font-bold text-red-500 mb-2 uppercase tracking-wide">Danger Zone</h4>
          <p className="text-slate-500 text-xs mb-4 leading-relaxed font-bold">
            Deleting your student account is permanent and irreversible. All homework assignments, scores, logs, and video history will be permanently wiped.
          </p>
          <button
            onClick={() => setIsConfirmOpen(true)}
            className="px-4 py-2 bg-red-300 hover:bg-red-200 text-slate-800 border-3 border-slate-800 rounded-xl text-xs font-black shadow-[2px_2px_0px_#a7f3d0] active:translate-y-0.5 hover:scale-[1.03] transition-all cursor-pointer"
          >
            Permanently Delete My Account
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Account?"
        message={deleteLoading ? "Wiping all account data..." : "WARNING: Are you absolutely sure you want to permanently delete your account? This will erase all of your homework, practice logs, high-scores, and video links forever. This action is irreversible!"}
        confirmText={deleteLoading ? "Deleting..." : "Permanently Delete"}
        cancelText="Keep My Account"
        isTeacherTheme={false}
      />
    </div>
  );
}
