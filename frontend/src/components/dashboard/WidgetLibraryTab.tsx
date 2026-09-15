"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getWidgetDefinition } from "../../core/widgetRegistry";
import PayButton from "../PayButton"; // Adjust path if PayButton is located elsewhere (e.g., "../components/PayButton")

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
  const [selectedFilterTab, setSelectedFilterTab] = useState<string>("all");

  const staticPreviewUrls: Record<string, string> = {
    PALLET: "/pallet/pallet.svg",
    OIL_DRUM: "/oil_drum/oil_drum.svg",
  };

  const widgetLabels: Record<string, string> = {
    COUNTRY_DROP_PIN: "Country Drop Pin",
    COUNTRY_FOCUS: "Country Focus",
    COUNTRY_ROUTE: "Country Route",
  };

  const placeholderWidgets = new Set([
    "Interactive Map", "Route Timeline", "Location Pin", "Stock Ticker", "Portfolio Breakdown", "Financial KPI",
    "Production Line", "Machine Gauge", "Process Flow", "Patient Journey", "Health Metric", "Anatomy Callout",
    "Lesson Timeline", "Knowledge Map", "Quiz Progress",
  ]);

  // const premiumByCategory: Record<string, Set<string>> = {
  //   Typography: new Set(["SVG_DRAW_IN_TEXT", "SEQUENTIAL_ELASTIC_TEXT"]),
  //   "Data Visualization": new Set(["LINE_CHART", "MULTI_LINE_CHART"]),
  //   Location: new Set(["Route Timeline"]),
  //   Finance: new Set(["Portfolio Breakdown"]),
  //   Industrial: new Set(["Machine Gauge"]),
  //   Medical: new Set(["Patient Journey"]),
  //   Education: new Set(["Knowledge Map"]),
  // };

  const premiumByCategory: Record<string, Set<string>> = {};

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

  // Tab filters mixing Core categories and Marketplace options
  const baseCategories = Object.keys(displayGroups);
  const filterTabs = ["all", "submissions", ...baseCategories];

  const filteredDisplayGroups = Object.entries(displayGroups).reduce<Record<string, string[]>>(
    (acc, [category, items]) => {
      if (selectedFilterTab === "all") {
        acc[category] = items;
      } else if (selectedFilterTab === "submissions") {
        const submissionItems = items.filter((w) => {
          const def = getWidgetDefinition(w);
          return def?.isSubmission || def?.author !== "Studio Core";
        });
        if (submissionItems.length > 0) acc[category] = submissionItems;
      } else if (selectedFilterTab.toLowerCase() === category.toLowerCase()) {
        acc[category] = items;
      }
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-30 -mx-6 px-6 pr-14 pt-6 pb-4 bg-[#fcfdfe]">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Widget & Component Library</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a widget card to add to your composition or preview marketplace specs.
            </p>
          </div>
          <input
            type="text"
            placeholder="Search library..."
            value={widgetSearch}
            onChange={(e) => setWidgetSearch(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-xs"
          />
        </div>

        {/* Mixed Marketplace & Category Tabs */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200/80 no-scrollbar">
          {filterTabs.map((tab) => {
            const label =
              tab === "all"
                ? "All Widgets"
                : tab === "submissions"
                ? "Community Submissions"
                : tab;

            return (
              <button
                key={tab}
                onClick={() => setSelectedFilterTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all capitalize ${
                  selectedFilterTab === tab
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Widget Cards Grid Grouped by Category */}
      <div className="space-y-6">
        {Object.entries(filteredDisplayGroups).map(([category, items]) => {
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
                  const capitalizedName = widgetLabels[w] ?? w
                    .toLowerCase()
                    .replaceAll("_", " ")
                    .split(" ")
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(" ");
                  const sampleUrl = sampleVideoUrls[w];
                  const staticPreviewUrl = staticPreviewUrls[w];
                  const isPlaceholder = placeholderWidgets.has(w);

                  // Widget metadata fallbacks
                  const isPremium = premiumByCategory[category]?.has(w) ?? false;
                  const price = isPremium ? "$4" : "";
                  const creator = isPlaceholder ? "Coming Soon" : isPremium ? "Pro Creator" : "Studio Core";
                  const description =
                    isPlaceholder
                      ? `${capitalizedName} widget placeholder. This category is being expanded with production-ready motion components.`
                      : `Customizable ${capitalizedName.toLowerCase()} component with dynamic parameters and motion presets.`;

                  return (
                    <div
                      key={w}
                      className="p-3 bg-white border border-slate-200/90 hover:border-emerald-500/60 rounded-2xl flex flex-col justify-between group transition-all shadow-xs hover:shadow-md relative overflow-hidden"
                    >
                      {/* Preview Box & Hover Overlay */}
                      <div className="w-full aspect-square bg-[#f4f7fa] border border-slate-100 rounded-xl p-2 flex items-center justify-center relative overflow-hidden group-hover:bg-slate-100/60 transition-colors">
                        
                        {/* Crown on Premium Widgets */}
                        {isPremium && (
                          <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
                            <span
                              className="w-6 h-6 rounded-lg bg-amber-500/90 border border-amber-400/40 text-amber-950 flex items-center justify-center shadow-xs backdrop-blur-xs"
                              title="Premium Widget"
                            >
                              <svg className="w-3.5 h-3.5 fill-amber-950" viewBox="0 0 24 24">
                                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                              </svg>
                            </span>
                          </div>
                        )}

                        {/* Video / SVG Graphic */}
                        {staticPreviewUrl ? (
                          <img
                            src={staticPreviewUrl}
                            alt={`${capitalizedName} preview`}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : sampleUrl ? (
                          <video
                            src={sampleUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <svg
                            className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}

                        {/* Overlaid Description on Hover */}
                        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xs p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between text-left z-10 rounded-xl pointer-events-none">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                              Overview
                            </p>
                            <p className="text-[11px] text-slate-200 leading-relaxed line-clamp-4">
                              {description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                            <span>Author: {creator}</span>
                            {isPremium && <span className="text-amber-400 font-bold">{price}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-3 px-1">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <h5 className="text-xs font-semibold text-slate-800 truncate">
                              {capitalizedName}
                            </h5>
                            <span className={`text-[13px] font-bold flex-shrink-0 ${isPremium ? "text-amber-500" : "text-slate-400"}`}>
                              {price}
                            </span>
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 truncate">
                            by {creator}
                          </p>
                        </div>

                        {/* Card Action Button */}
                        {isPlaceholder ? (
                          <button
                            disabled
                            className="w-7 h-7 flex-shrink-0 rounded-lg text-sm font-bold flex items-center justify-center transition-all bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed"
                            title="Coming soon"
                          >
                            …
                          </button>
                        ) : isPremium ? (
                          <PayButton />
                        ) : (
                          <button
                            onClick={() => handleAddWidget(w)}
                            className="w-7 h-7 flex-shrink-0 rounded-lg text-sm font-bold flex items-center justify-center transition-all bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600"
                            title="Add Widget"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {items.length > 4 && selectedFilterTab === "all" && (
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
