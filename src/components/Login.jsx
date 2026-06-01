import React, { useState } from "react";

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student"); // "student" | "teacher"
  const [teacherCode, setTeacherCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isRegister
      ? "http://localhost:4000/api/register"
      : "http://localhost:4000/api/login";

    const body = isRegister
      ? {
          email: email.trim(),
          password,
          name: name.trim(),
          role,
          ...(role === "student" ? { teacherCode: teacherCode.trim() } : {})
        }
      : { username: username.trim(), password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      onLoginSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 w-full transition-all duration-300 ${isRegister ? "max-w-2xl" : "max-w-md"
      }`}>
      {/* Title */}
      <h1 className="text-4xl font-extrabold mb-6 text-slate-800 tracking-tight text-center">
        Piano Academy
      </h1>

      {/* Main Card */}
      <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-100/50">

        {/* Sign In / Register Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition duration-200 cursor-pointer ${!isRegister
              ? "bg-white text-slate-800 shadow-sm"
              : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition duration-200 cursor-pointer ${isRegister
              ? "bg-white text-slate-800 shadow-sm"
              : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            Register
          </button>
        </div>

        {/* Floating Error Alert */}
        {error && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-rose-50 border border-rose-100 p-4 rounded-xl shadow-xl shadow-rose-100/40 flex justify-between items-center">
            <div className="font-semibold flex items-center gap-2 text-rose-800 text-sm">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-3 p-1.5 hover:bg-rose-100 rounded-lg text-rose-800 text-xs font-bold transition duration-200 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {isRegister ? (
            /* Registration Layout - Responsive Two Columns on Desktop */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">

              {/* Column 1 */}
              <div className="space-y-4">
                {/* Role Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">I am a...</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => { setRole("student"); setTeacherCode(""); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition duration-200 active:scale-[0.98] border cursor-pointer ${role === "student"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRole("teacher"); setTeacherCode(""); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition duration-200 active:scale-[0.98] border cursor-pointer ${role === "teacher"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      Teacher
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none"
                  />
                </div>

                {role === "student" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Teacher's connection code
                    </label>
                    <input
                      type="text"
                      required
                      value={teacherCode}
                      onChange={(e) => setTeacherCode(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none uppercase"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Sign In Layout - Single Column */
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-md font-bold transition duration-200 active:scale-[0.98] shadow-md shadow-indigo-100 cursor-pointer"
          >
            {loading ? "Loading..." : isRegister ? "Create Account" : "Let's Play! 🎹"}
          </button>
        </form>

        {/* Demo Helper */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Quick Test Credentials</p>
          <div className="text-[11px] mt-2 text-slate-500 flex flex-wrap justify-center gap-x-6 gap-y-1">
            <div>Student: <span className="font-semibold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">ashley@piano.com</span> / <span className="font-semibold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">password</span></div>
            <div>Teacher: <span className="font-semibold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">teacher@piano.com</span> / <span className="font-semibold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">password</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
