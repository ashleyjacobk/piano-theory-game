import React, { useState } from "react";

export default function SearchableStudentSelect({ value, onChange, students, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase())
  );

  const selectedStudent = students.find((s) => s.username === value);

  return (
    <div className="relative font-sans">
      <div
        className="flex bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 items-center justify-between cursor-pointer focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all text-sm"
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          placeholder={
            selectedStudent ? `${selectedStudent.name} (@${selectedStudent.username})` : placeholder
          }
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="bg-transparent w-full text-slate-800 outline-none placeholder:text-slate-800 focus:placeholder:text-slate-400 font-semibold"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="text-slate-400 hover:text-slate-600 outline-none ml-2 text-xs"
        >
          {isOpen ? "▲" : "▼"}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 shadow-xl rounded-xl max-h-48 overflow-y-auto py-1 text-sm font-semibold">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-slate-400 italic">No matching students found</div>
            ) : (
              filtered.map((student) => (
                <div
                  key={student.username}
                  onClick={() => {
                    onChange(student.username);
                    setSearch("");
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition ${
                    value === student.username ? "bg-indigo-50 text-indigo-600 font-bold" : "text-slate-700"
                  }`}
                >
                  {student.name} <span className="text-slate-400 text-xs font-normal">(@{student.username})</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
