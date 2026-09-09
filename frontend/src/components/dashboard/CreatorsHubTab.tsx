"use client";

import { useState } from "react";

export type CreatorsHubSubTab = "submissions" | "terms";

const TERMS_AND_CONDITIONS = [
  {
    id: "royalty",
    title: "1. Creator Royalty Split",
    content:
      "Developers and motion graphics creators receive a 70% net royalty payout on all premium video exports that include their paid widget or vector asset.",
  },
  {
    id: "ratio",
    title: "2. Free-to-Premium Ratio (1 for 5)",
    content:
      "To maintain ecosystem liquidity, creators must provide at least 1 free community widget for every 5 premium assets listed on the platform.",
  },
  {
    id: "trademarks",
    title: "3. Brand Assets & Trademark Guidelines",
    content:
      "Assets displaying corporate logos (e.g., McDonald's, Apple) are strictly designated for editorial commentary, educational news, and fair-use reporting.",
  },
  {
    id: "security",
    title: "4. Code Quality & Security Standards",
    content:
      "All uploaded Remotion component rigs undergo automated static analysis to ensure standard prop typings and performance efficiency.",
  },
];

interface CreatorsHubTabProps {
  activeSubTab: CreatorsHubSubTab;
  setActiveSubTab: (tab: CreatorsHubSubTab) => void;
  handleAddWidget: (widgetType: string) => void;
}

export function CreatorsHubTab({ activeSubTab }: CreatorsHubTabProps) {
  const [openAccordion, setOpenAccordion] = useState<string | null>("royalty");

  // Form State
  const [submissionType, setSubmissionType] = useState<"rig" | "svg">("rig");
  const [assetTitle, setAssetTitle] = useState("");
  const [assetCategory, setAssetCategory] = useState("Maps & Geography");
  const [assetPrice, setAssetPrice] = useState("0");
  const [assetDescription, setAssetDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitAsset = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setAssetTitle("");
      setAssetDescription("");
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* The dropdown controls the active sub-tab; this header is contextual only. */}
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-sm font-bold text-slate-800">
          {activeSubTab === "submissions" ? "Submit Asset" : "Terms & Guidelines"}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {activeSubTab === "submissions"
            ? "Publish a widget rig or vector asset to the creator marketplace."
            : "Review the rules for royalties, validation, and marketplace publishing."}
        </p>
      </div>

      {/* SUB-TAB 1: SUBMISSIONS */}
      {activeSubTab === "submissions" && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-900">Publish Creator Asset</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a Remotion component rig or vector asset. Free assets support your 1-for-5 publishing requirement.
            </p>
          </div>

          {submitted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
              ✓ Submission received! Our team will review your asset code and sample previews.
            </div>
          ) : (
            <form onSubmit={handleSubmitAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Asset Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSubmissionType("rig")}
                    className={`p-3 border rounded-xl text-left transition-all ${
                      submissionType === "rig"
                        ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800">Widget Rig (Code)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Parametric Remotion component with editable props.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubmissionType("svg")}
                    className={`p-3 border rounded-xl text-left transition-all ${
                      submissionType === "svg"
                        ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800">SVG Asset / Vector</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Static or animated map boundary/graphic asset.
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zimbabwe Districts Map"
                    value={assetTitle}
                    onChange={(e) => setAssetTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Maps & Geography">Maps & Geography</option>
                    <option value="Brand Motion">Brand Motion</option>
                    <option value="Data Viz">Data Viz</option>
                    <option value="Typography">Typography</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price ($) <span className="text-slate-400 font-normal">(Set 0 for Free)</span>
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={assetPrice}
                  onChange={(e) => setAssetPrice(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Short summary of what this component renders..."
                  value={assetDescription}
                  onChange={(e) => setAssetDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {submissionType === "rig" ? "Component Source (.zip)" : "Vector File (.svg)"}
                </label>
                <input
                  type="file"
                  required
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
                >
                  Submit for Review
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SUB-TAB 2: TERMS */}
      {activeSubTab === "terms" && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 max-w-3xl">
          <div>
            <h3 className="text-base font-bold text-slate-900">Creator Terms & Guidelines</h3>
            <p className="text-sm text-slate-500 mt-1">
              Rules governing royalties, asset validation, and the 1-for-5 free-to-paid asset ratio.
            </p>
          </div>

          <div className="space-y-3">
            {TERMS_AND_CONDITIONS.map((term) => {
              const isOpen = openAccordion === term.id;
              return (
                <div
                  key={term.id}
                  className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 transition-all"
                >
                  <button
                    onClick={() => setOpenAccordion(isOpen ? null : term.id)}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs sm:text-sm text-slate-800 hover:bg-slate-100/80 transition-colors"
                  >
                    <span>{term.title}</span>
                    <svg
                      className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                      {term.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
