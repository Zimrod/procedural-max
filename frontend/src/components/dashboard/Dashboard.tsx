"use client";

import { useState } from "react";
import { WidgetLibraryTab } from "./WidgetLibraryTab";
import { WidgetSpecsTab } from "./WidgetSpecsTab";
import { UserAccountTab } from "./UserAccountTab";
import { CreatorsHubTab, CreatorsHubSubTab } from "./CreatorsHubTab";
import { applyThemeToWidgetProps } from "../../types/theme";
import { getWidgetDefinition } from "../../core/widgetRegistry";
import { SuggestionsTab } from "./SuggestionsTab";

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
  const [activeTab, setActiveTab] = useState<"widgets" | "creators_hub" | "specs" | "account" | "suggestions">("widgets");
  const [creatorsHubSubTab, setCreatorsHubSubTab] = useState<CreatorsHubSubTab>("submissions");
  const [creatorsHubDropdownOpen, setCreatorsHubDropdownOpen] = useState(true);

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
  const hasGroups = Object.keys(groupedWidgets || {}).length > 0;

  if (hasGroups) {
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

    displayGroups["Typography"] = texts.length > 0 ? texts : ["TITLE_CARD", "TYPEWRITER", "TEXT", "BULLET_POINTS"];
    displayGroups["Data Visualization"] = charts.length > 0 ? charts : ["BAR_CHART", "LINE_CHART", "PIE_CHART", "DONUT_CHART"];
    displayGroups["Location"] = ["Interactive Map", "Route Timeline", "Location Pin"];
    displayGroups["Finance"] = ["Stock Ticker", "Portfolio Breakdown", "Financial KPI"];
    displayGroups["Industrial"] = ["Production Line", "Machine Gauge", "Process Flow"];
    displayGroups["Medical"] = ["Patient Journey", "Health Metric", "Anatomy Callout"];
    displayGroups["Education"] = ["Lesson Timeline", "Knowledge Map", "Quiz Progress"];
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
            className={`pointer-events-auto relative w-[80vw] bg-[#fcfdfe] border-r border-slate-200/80 shadow-2xl flex flex-col text-slate-800 transform transition-transform duration-300 ease-in-out ${
              dashboardOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <button
              onClick={() => setDashboardOpen(false)}
              className="absolute top-4 right-4 z-50 text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
              aria-label="Close dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation & Body */}
            <div className="flex-1 flex overflow-hidden">
              <div className="w-56 bg-[#f4f7fa]/70 border-r border-slate-200/80 p-4 space-y-2 flex-shrink-0 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-3">
                    Navigation
                  </div>
                  
                  {/* Widget Library Tab */}
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
                    <span>Widget Library</span>
                  </button>

                  {/* Creator's Hub Dropdown Parent */}
                  <div>
                    <button
                      onClick={() => {
                        setActiveTab("creators_hub");
                        setCreatorsHubDropdownOpen((prev) => !prev);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === "creators_hub"
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Creator's Hub</span>
                      </div>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${creatorsHubDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Creator's Hub Sub-Menu Dropdown Items */}
                    {creatorsHubDropdownOpen && (
                      <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-1">
                        <button
                          onClick={() => {
                            setActiveTab("creators_hub");
                            setCreatorsHubSubTab("submissions");
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            activeTab === "creators_hub" && creatorsHubSubTab === "submissions"
                              ? "font-bold text-emerald-600 bg-emerald-50"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Submissions
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab("creators_hub");
                            setCreatorsHubSubTab("terms");
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                            activeTab === "creators_hub" && creatorsHubSubTab === "terms"
                              ? "font-bold text-emerald-600 bg-emerald-50"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Terms & Conditions
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Specifications Tab */}
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

                  {/* User Account Tab */}
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

                  {/* Suggestions Tab */}
                  <button
                    onClick={() => setActiveTab("suggestions")}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === "suggestions"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Suggestions</span>
                  </button>
                </div>

                <div className="p-3 bg-white border border-slate-200/80 rounded-xl text-[11px] text-slate-600 space-y-0.5 shadow-xs">
                  <p className="font-semibold text-slate-800">Plan: Developer</p>
                  <p className="text-[10px] text-slate-500">Unlimited Exports</p>
                </div>
              </div>

              {/* Main Content Area */}
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
                {activeTab === "creators_hub" && (
                  <CreatorsHubTab
                    activeSubTab={creatorsHubSubTab}
                    setActiveSubTab={setCreatorsHubSubTab}
                    handleAddWidget={handleAddWidget}
                  />
                )}
                {activeTab === "specs" && (
                  <WidgetSpecsTab filteredWidgets={filteredWidgets} />
                )}
                {activeTab === "account" && <UserAccountTab />}
                {activeTab === "suggestions" && <SuggestionsTab />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
