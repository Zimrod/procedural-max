"use client";

import { useState } from "react";

export function SuggestionsTab() {
  const [requestType, setRequestType] = useState<"behaviour" | "new_widget">("behaviour");
  const [targetWidget, setTargetWidget] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTitle("");
      setTargetWidget("");
      setDescription("");
      setUseCase("");
    }, 3500);
  };

  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 max-w-3xl">
      <div>
        <h3 className="text-base font-bold text-slate-900">Feature & Widget Suggestions</h3>
        <p className="text-sm text-slate-500 mt-1">
          Request custom behaviours for existing widgets or propose new widget concepts for production.
        </p>
      </div>

      {submitted ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          Thank you! Your suggestion has been queued for review by our engineering team.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Suggestion Category Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              Suggestion Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRequestType("behaviour")}
                className={`p-3.5 border rounded-xl text-left transition-all ${
                  requestType === "behaviour"
                    ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="text-xs font-bold text-slate-800">Widget behaviour / Enhancement</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Modify existing widget animation speed, custom props, or rendering controls.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRequestType("new_widget")}
                className={`p-3.5 border rounded-xl text-left transition-all ${
                  requestType === "new_widget"
                    ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="text-xs font-bold text-slate-800">New Widget Concept</div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Request a brand-new parametric chart, graphic asset, or map boundary.
                </div>
              </button>
            </div>
          </div>

          {/* Target Widget (If behaviour modification) */}
          {requestType === "behaviour" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Widget Name / Category
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 3D Candlestick Engine, Zimbabwe Districts Map, Line Graph"
                value={targetWidget}
                onChange={(e) => setTargetWidget(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {requestType === "behaviour" ? "Feature Request Title" : "Proposed Widget Name"}
            </label>
            <input
              type="text"
              required
              placeholder={
                requestType === "behaviour"
                  ? "e.g. Add custom easing options to candlestick entrance"
                  : "e.g. Animated Regional Population Heatmap"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description & Desired behaviour
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe how the widget should function, animate, or look during video composition..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Video / Editorial Context */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Editorial / Video Use Case <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="What type of videos or content breakdowns will benefit from this?"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-yellow-300 hover:bg-emerald-500 text-black-500 text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
            >
              Submit Suggestion
            </button>
          </div>
        </form>
      )}
    </div>
  );
}