"use client";

export function UserAccountTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-bold text-slate-800">User Account & Activity</h3>
        <p className="text-xs text-slate-500">
          Manage saved edits, view rendering credits, and adjust subscription details.
        </p>
      </div>
    </div>
  );
}