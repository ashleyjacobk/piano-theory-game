import React, { useState } from "react";
import useComments from "../../hooks/useComments";

export default function VideoCommentsSection({ video, user, onCommentCountChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const { comments, loading, fetchComments, postComment, markRead } = useComments();

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchComments(video.id);
      markRead(video.id, "teacher");
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    try {
      await postComment(video.id, {
        username: user.username,
        name: user.name,
        text: inputText.trim()
      });
      setInputText("");
      if (onCommentCountChange) {
        onCommentCountChange(video.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatCommentDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-3 text-left">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 transition cursor-pointer select-none"
      >
        Comments ({comments.length > 0 ? comments.length : video.commentsCount || 0})
      </button>

      {isOpen && (
        <div className="mt-3 bg-slate-50 border border-slate-200 p-3 rounded-xl shadow-inner">
          <div className="max-h-36 overflow-y-auto space-y-2.5 pr-1 font-sans">
            {loading ? (
              <p className="text-[10px] font-bold text-indigo-600 animate-pulse text-center">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-[10px] font-bold text-slate-400 italic text-center py-1">No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="text-[11px] bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                  <div className="flex justify-between font-black text-[9px] text-indigo-600 mb-1">
                    <span>{comment.name} (@{comment.username})</span>
                    <span className="text-[8px] font-semibold text-slate-400">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-semibold">{comment.text}</p>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-1.5 mt-2 font-sans">
            <input
              type="text"
              placeholder="Post a comment..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition active:scale-[0.95] cursor-pointer shadow-sm"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
