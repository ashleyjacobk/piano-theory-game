import React from "react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Yes, Confirm",
  cancelText = "Cancel",
  isTeacherTheme = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`${
          isTeacherTheme
            ? "bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6 text-center max-w-sm w-full"
            : "bg-white border-4 border-slate-800 shadow-[6px_6px_0px_#a7f3d0] rounded-[2rem] p-6 text-center max-w-sm w-full"
        }`}
      >
        <h3
          className={`text-2xl font-black mb-4 uppercase tracking-wide ${
            isTeacherTheme ? "text-slate-800" : "text-emerald-600"
          }`}
        >
          {title}
        </h3>
        <p
          className={`font-bold mb-6 text-sm ${
            isTeacherTheme ? "text-slate-500" : "text-slate-600"
          }`}
        >
          {message}
        </p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 font-black text-sm rounded-xl transition duration-200 active:scale-[0.98] cursor-pointer ${
              isTeacherTheme
                ? "bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-100"
                : "bg-amber-300 hover:bg-amber-200 text-slate-800 border-2 border-slate-800 shadow-[2px_2px_0px_#a7f3d0]"
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className={`flex-1 py-3 font-black text-sm rounded-xl transition duration-200 active:scale-[0.98] cursor-pointer ${
              isTeacherTheme
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                : "bg-emerald-200 hover:bg-emerald-100 text-slate-800 border-2 border-slate-800 shadow-[2px_2px_0px_#fef08a]"
            }`}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
