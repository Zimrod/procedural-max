"use client";

import { useState } from "react";
import { WidgetLibraryTab } from "./WidgetLibraryTab";
import { WidgetSpecsTab } from "./WidgetSpecsTab";
import { UserAccountTab } from "./UserAccountTab";
import { applyThemeToWidgetProps } from "../../types/theme";
import { getWidgetDefinition } from "../../core/widgetRegistry";

interface DashboardProps {
  dashboardOpen: boolean;
  setDashboardOpen: (open: boolean) => void;
  widgetSearch: string;
  setWidgetSearch: (v: string) => void;
  groupedWidgets: Record<string, string[]>;
  filteredWidgets: string[];
  themeConfig: any;
  setLocalConfig: React.Dispatch<React.SetStateAction<any[]>>;
}

export function Dashboard({
  dashboardOpen,
  setDashboardOpen,
  widgetSearch,
  setWidgetSearch,
  groupedWidgets,
  filteredWidgets,
  themeConfig,
  setLocalConfig,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"widgets" | "specs" | "account">("widgets");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const handleAddWidget = (widgetType: string) => {
    const definition = getWidgetDefinition(widgetType);
    const props = structuredClone(definition?.defaultProps ?? {});

    setLocalConfig((prev) => [
      ...prev,
      {
        widget: widgetType,
        startFrame: 0,
        durationFrames: 90,
        props: applyThemeToWidgetProps(widgetType, props, themeConfig),
      },
    ]);
  };

  const toggleCategoryExpand = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const displayGroups: Record<string, string[]> = {};
  const hasMultipleGroups = Object.keys(groupedWidgets || {}).length > 1;

  if (hasMultipleGroups) {
    Object.assign(displayGroups, groupedWidgets);
  } else {
    const allWidgets = Array.from(
      new Set([
        ...Object.values(groupedWidgets || {}).flat(),
        ...(filteredWidgets || []),
      ])
    );

    const isChart = (name: string) => /chart|graph|bar|pie|line|area|donut|metric/i.test(name);
    const charts = allWidgets.filter(isChart);
    const texts = allWidgets.filter((w) => !isChart(w));

    displayGroups["Text"] = texts.length > 0 ? texts : ["title", "heading", "paragraph", "bullet list", "caption"];
    displayGroups["Chart"] = charts.length > 0 ? charts : ["bar chart", "line graph", "pie chart", "area chart", "donut chart"];
  }

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ease-in-out ${
        dashboardOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setDashboardOpen(false)}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="fixed inset-y-0 left-0 flex max-w-full">
          <div
            className={`pointer-events-auto w-[80vw] bg-[#fcfdfe] border-r border-slate-200/80 shadow-2xl flex flex-col text-slate-800 transform transition-transform duration-300 ease-in-out ${
              dashboardOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-[#f4f7fa]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Dashboard</h2>
              </div>
              <button
                onClick={() => setDashboardOpen(false)}
                className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Main Navigation & Body */}
            <div className="flex-1 flex overflow-hidden">
              <div className="w-56 bg-[#f4f7fa]/70 border-r border-slate-200/80 p-4 space-y-2 flex-shrink-0 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-3">
                    Navigation
                  </div>
                  <button
                    onClick={() => setActiveTab("widgets")}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === "widgets"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Widgets</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("specs")}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === "specs"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Specifications</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("account")}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === "account"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>User Account</span>
                  </button>
                </div>

                <div className="p-3 bg-white border border-slate-200/80 rounded-xl text-[11px] text-slate-600 space-y-0.5 shadow-xs">
                  <p className="font-semibold text-slate-800">Plan: Developer</p>
                  <p className="text-[10px] text-slate-500">Unlimited Exports</p>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto bg-[#fcfdfe]">
                {activeTab === "widgets" && (
                  <WidgetLibraryTab
                    widgetSearch={widgetSearch}
                    setWidgetSearch={setWidgetSearch}
                    displayGroups={displayGroups}
                    expandedCategories={expandedCategories}
                    toggleCategoryExpand={toggleCategoryExpand}
                    handleAddWidget={handleAddWidget}
                  />
                )}
                {activeTab === "specs" && (
                  <WidgetSpecsTab filteredWidgets={filteredWidgets} />
                )}
                {activeTab === "account" && <UserAccountTab />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
