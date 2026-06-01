import React from "react";

export default function CommentInboxModal({
  isOpen,
  onClose,
  unreadNotifications = [],
  onMarkRead,
  onMarkAllRead,
  onGoToVideo
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6 max-w-lg w-full font-sans">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 text-left">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            Comment Inbox
          </h3>
          {unreadNotifications.length > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>

        {unreadNotifications.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm font-bold text-slate-400 italic">No unread comments in your inbox.</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-slate-700 font-bold rounded-xl text-xs transition duration-200 active:scale-[0.98] cursor-pointer"
            >
              Close Inbox
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {unreadNotifications.map((notif) => (
                <div key={notif.id} className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl shadow-sm text-left flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                      <span>Student: {notif.studentName} (@{notif.studentUsername})</span>
                      <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs font-black text-slate-700 mb-2">
                      On Video: "{notif.videoTitle}" ({notif.songName})
                    </div>
                    <p className="text-xs text-slate-600 italic bg-white border border-slate-100 p-2.5 rounded-lg font-medium leading-relaxed">
                      "{notif.text}"
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onMarkRead(notif.videoId)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-slate-600 font-bold rounded-lg text-[10px] transition duration-200 cursor-pointer"
                    >
                      Mark Read
                    </button>
                    <button
                      onClick={() => onGoToVideo(notif)}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] transition duration-200 cursor-pointer shadow-sm shadow-indigo-100"
                    >
                      Go to Video
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition duration-200 active:scale-[0.98] cursor-pointer shadow-md shadow-slate-100"
              >
                Close Inbox
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
