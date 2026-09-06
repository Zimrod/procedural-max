"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getWidgetDefinition } from "../../core/widgetRegistry";

interface WidgetLibraryTabProps {
  widgetSearch: string;
  setWidgetSearch: (v: string) => void;
  displayGroups: Record<string, string[]>;
  expandedCategories: Record<string, boolean>;
  toggleCategoryExpand: (category: string) => void;
  handleAddWidget: (widgetType: string) => void;
}

export function WidgetLibraryTab({
  widgetSearch,
  setWidgetSearch,
  displayGroups,
  expandedCategories,
  toggleCategoryExpand,
  handleAddWidget,
}: WidgetLibraryTabProps) {
  const [sampleVideoUrls, setSampleVideoUrls] = useState<Record<string, string>>({});

  // Fetch sample preview video URLs from Supabase Storage bucket
  useEffect(() => {
    const fetchSampleUrls = async () => {
      const allWidgets = Object.values(displayGroups).flat();
      const urlMap: Record<string, string> = {};

      for (const widgetKey of allWidgets) {
        const definition = getWidgetDefinition(widgetKey);
        const fileName = definition?.previewFileName || `${widgetKey.replaceAll(" ", "_")}.mp4`; 

        const { data } = supabase.storage
          .from("widget-samples")
          .getPublicUrl(fileName);

        if (data?.publicUrl) {
          urlMap[widgetKey] = data.publicUrl;
        }
      }

      setSampleVideoUrls(urlMap);
    };

    if (Object.keys(displayGroups).length > 0) {
      fetchSampleUrls();
    }
  }, [displayGroups]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Widget Library</h3>
          <p className="text-xs text-slate-500 mt-0.5">Select a component card to append to your active scene.</p>
        </div>
        <input
          type="text"
          placeholder="Search widgets..."
          value={widgetSearch}
          onChange={(e) => setWidgetSearch(e.target.value)}
          className="w-full sm:w-64 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-xs"
        />
      </div>

      <div className="space-y-6">
        {Object.entries(displayGroups).map(([category, items]) => {
          const isExpanded = !!expandedCategories[category];
          const visibleItems = isExpanded ? items : items.slice(0, 4);

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {category}
                </h4>
                <span className="text-[11px] text-slate-400">{items.length} available</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {visibleItems.map((w) => {
                  const capitalizedName = w.charAt(0).toUpperCase() + w.slice(1);
                  const sampleUrl = sampleVideoUrls[w];

                  return (
                    <div
                      key={w}
                      className="p-3 bg-white border border-slate-200/90 hover:border-emerald-500/60 rounded-2xl flex flex-col justify-between group transition-all shadow-xs hover:shadow-md"
                    >
                      <div className="w-full aspect-square bg-[#f4f7fa] border border-slate-100 rounded-xl p-2 flex items-center justify-center relative overflow-hidden group-hover:bg-slate-100/60 transition-colors">
                        {sampleUrl ? (
                          <video
                            src={sampleUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <svg className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 px-1">
                        <span className="text-xs font-semibold text-slate-800 truncate pr-2">
                          {capitalizedName}
                        </span>
                        <button
                          onClick={() => handleAddWidget(w)}
                          className="w-7 h-7 flex-shrink-0 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg text-sm font-bold flex items-center justify-center transition-all"
                          title="Add Widget"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {items.length > 4 && (
                <div className="flex justify-center pt-1">
                  <button
                    onClick={() => toggleCategoryExpand(category)}
                    className="text-[11px] font-semibold text-slate-600 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 bg-white hover:bg-emerald-50/50 px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
                  >
                    {isExpanded ? "Show Less" : "More Widgets"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}