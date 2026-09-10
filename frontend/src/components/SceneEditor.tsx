"use client";

import { useState } from "react";
import { getWidgetDefinition } from "../core/widgetRegistry";
import { RenderAndSaveButtons } from "./RenderAndSaveButtons";

const isChartWidget = (widget = "") => widget.toUpperCase().includes("CHART");

function ChartDataEditor({
  widget,
  data,
  palette,
  onPaletteChange,
  onChange,
}: {
  widget: string;
  data: any;
  palette?: string[];
  onPaletteChange?: (palette: string[]) => void;
  onChange: (data: any) => void;
}) {
  const DEFAULT_PALETTE = ["#22c55e", "#06b6d4", "#f59e0b", "#f43f5e", "#8b5cf6", "#ec4899"];
  const multiSeries = widget.toUpperCase() === "MULTI_LINE_CHART";
  const labels: string[] = Array.isArray(data?.labels) ? data.labels : [];
  const series = Array.isArray(data?.series) ? data.series : [];
  const seriesRowCount = series.reduce((max: number, item: any) => Math.max(max, Array.isArray(item.values) ? item.values.length : 0), 0);
  const rowCount = Math.max(labels.length, multiSeries ? seriesRowCount : Array.isArray(data?.values) ? data.values.length : 0);
  const chartPalette = Array.from({ length: rowCount }, (_, index) => palette?.[index] ?? DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]);

  const updateRow = (rowIndex: number, label: string, values: number[]) => {
    if (multiSeries) {
      onChange({
        ...data,
        labels: labels.map((item, index) => index === rowIndex ? label : item),
        series: series.map((item: any, index: number) => ({
          ...item,
          values: item.values.map((value: number, valueIndex: number) => valueIndex === rowIndex ? values[index] : value),
        })),
      });
      return;
    }
    onChange({
      ...data,
      labels: labels.map((item, index) => index === rowIndex ? label : item),
      values: (data?.values || []).map((value: number, index: number) => index === rowIndex ? values[0] : value),
    });
  };

  const addRow = () => {
    const nextLabel = `Item ${rowCount + 1}`;
    const nextPalette = [...chartPalette, DEFAULT_PALETTE[chartPalette.length % DEFAULT_PALETTE.length]];
    if (multiSeries) {
      onChange({
        ...data,
        labels: [...labels, nextLabel],
        series: series.map((item: any) => ({ ...item, values: [...(item.values || []), 0] })),
      });
    } else {
      onChange({ ...data, labels: [...labels, nextLabel], values: [...(data?.values || []), 0] });
    }
    onPaletteChange?.(nextPalette);
  };

  const removeRow = (rowIndex: number) => {
    const nextPalette = chartPalette.filter((_, index) => index !== rowIndex);
    if (multiSeries) {
      onChange({
        ...data,
        labels: labels.filter((_, index) => index !== rowIndex),
        series: series.map((item: any) => ({ ...item, values: (item.values || []).filter((_: number, index: number) => index !== rowIndex) })),
      });
    } else {
      onChange({
        ...data,
        labels: labels.filter((_, index) => index !== rowIndex),
        values: (data?.values || []).filter((_: number, index: number) => index !== rowIndex),
      });
    }
    onPaletteChange?.(nextPalette);
  };

  return (
    <div className="rounded-lg border border-neutral-800 bg-[#111111] p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Chart Data</span>
          <p className="text-[9px] text-neutral-500">Edit chart values without entering an object.</p>
        </div>
        <button type="button" onClick={addRow} className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-500">+ Add Data Row</button>
      </div>
      {multiSeries && series.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-[9px] font-bold uppercase text-neutral-500">
          <span>Label</span>{series.map((item: any, index: number) => <span key={index}>{item.name || `Series ${index + 1}`}</span>)}
        </div>
      )}
      {Array.from({ length: rowCount }).map((_, rowIndex) => {
        const rowValues: number[] = multiSeries
          ? series.map((item: any) => Number(item.values?.[rowIndex] ?? 0))
          : [Number(data?.values?.[rowIndex] ?? 0)];
        return (
          <div key={rowIndex} className="space-y-1.5">
            <div className="grid grid-cols-2 items-center gap-2">
              <input type="text" value={labels[rowIndex] ?? ""} onChange={(e) => updateRow(rowIndex, e.target.value, rowValues)} placeholder="Label" className="w-full rounded border border-neutral-800 bg-[#1e1e1e] p-1.5 text-xs text-neutral-200" />
              {rowValues.map((value: number, valueIndex: number) => (
                <input key={valueIndex} type="number" value={value} onChange={(e) => updateRow(rowIndex, labels[rowIndex] ?? `Item ${rowIndex + 1}`, rowValues.map((item: number, index: number) => index === valueIndex ? Number(e.target.value) : item))} className="w-full rounded border border-neutral-800 bg-[#1e1e1e] p-1.5 text-xs text-neutral-200" />
              ))}
            </div>
            <button type="button" onClick={() => removeRow(rowIndex)} className="rounded border border-rose-500/40 px-2 py-1 text-[10px] font-bold text-rose-300 hover:bg-rose-500/10">Remove</button>
          </div>
        );
      })}
      {rowCount === 0 && <p className="py-2 text-center text-[10px] text-neutral-500">No data rows yet. Add one to begin.</p>}
    </div>
  );
}

function PropInput({ field, value, onChange }: { field: any; value: any; onChange: (value: any) => void }) {
  if (field?.kind === "boolean") return <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="rounded bg-black border-neutral-700 text-emerald-500" />;
  if (field?.kind === "select") return <select value={value ?? field.options?.[0] ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full p-1.5 bg-[#1e1e1e] border border-neutral-800 rounded text-xs text-neutral-200">{field.options?.map((option: string) => <option key={option} value={option}>{option}</option>)}</select>;
  return <input type={field?.kind === "number" ? "number" : field?.kind === "color" ? "color" : "text"} value={value ?? ""} onChange={(e) => onChange(field?.kind === "number" ? Number(e.target.value) : e.target.value)} className="w-full p-1.5 bg-[#1e1e1e] border border-neutral-800 rounded text-xs text-neutral-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />;
}

function ColorInput({ value, onChange }: { value: any; onChange: (value: string) => void }) {
  const isPalette = Array.isArray(value);
  const colors = isPalette ? value : [value ?? ""];
  const colorValue = (color: any) => typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color) ? color : "#000000";
  const updateColor = (index: number, nextColor: string) => {
    if (isPalette) {
      onChange(colors.map((color: string, colorIndex: number) => colorIndex === index ? nextColor : color) as any);
    } else {
      onChange(nextColor);
    }
  };

  return (
    <div className={`min-w-0 gap-1.5 ${isPalette ? "flex flex-wrap items-center" : "flex items-center"}`}>
      <div className={`flex min-w-0 flex-wrap gap-0.5 ${isPalette ? "" : "shrink-0"}`}>
        {colors.map((color: string, index: number) => (
          <input
            key={index}
            type="color"
            value={colorValue(color)}
            onChange={(e) => updateColor(index, e.target.value)}
            aria-label={`Open colour palette ${index + 1}`}
            className="h-7 w-6 cursor-pointer rounded border border-neutral-700 bg-[#1e1e1e] p-0.5"
          />
        ))}
      </div>
      <input
        type="text"
        value={isPalette ? colors.join(", ") : value ?? ""}
        onChange={(e) => onChange(isPalette ? e.target.value.split(",").map((color) => color.trim()).filter(Boolean) as any : e.target.value)}
        aria-label="Colour value"
        className={`${isPalette ? "basis-full" : "min-w-0 w-full"} rounded border border-neutral-800 bg-[#1e1e1e] px-2 py-1.5 text-[11px] font-mono text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500`}
      />
    </div>
  );
}

interface SceneEditorProps {
  localConfig: any[];
  sceneConfig: any[];
  collapsedScenes: Record<number, boolean>;
  isDirty: boolean;
  rawText: string;
  currentJobId: string | null;
  aspectRatio?: number;
  toggleSceneCollapse: (index: number) => void;
  moveSceneUp: (index: number) => void;
  moveSceneDown: (index: number) => void;
  addSceneAfter: (index: number) => void;
  deleteScene: (index: number) => void;
  updateSceneMeta: (index: number, key: string, value: any) => void;
  updateWidgetType: (index: number, newType: string) => void;
  updateWidgetProp: (index: number, propKey: string, value: any) => void;
  handleApplyConfigRefresh: () => void;
  widgetOptions: string[];
  defaultWidgetType: string;
  setDashboardOpen: (open: boolean) => void;
}

export function SceneEditor({
  localConfig, sceneConfig, collapsedScenes, isDirty, rawText, currentJobId,
  aspectRatio,
  toggleSceneCollapse, moveSceneUp, moveSceneDown, addSceneAfter, deleteScene,
  updateSceneMeta, updateWidgetType, updateWidgetProp, handleApplyConfigRefresh,
  widgetOptions, defaultWidgetType, setDashboardOpen,
}: SceneEditorProps) {
  const [activePropTab, setActivePropTab] = useState<Record<number, "properties" | "colors">>({});

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
        {localConfig.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-neutral-500 border border-dashed border-neutral-800 rounded-xl bg-[#141414]/50">
            <span className="text-xs">No scenes yet. Trigger animation or add scenes to populate.</span>
            <button onClick={() => setDashboardOpen(true)} className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition">
              + Open Dashboard
            </button>
          </div>
        ) : (
          localConfig.map((scene, sceneIdx) => (
            <div key={sceneIdx} className="p-3.5 bg-[#141414] border border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleSceneCollapse(sceneIdx)} className="w-5 h-5 text-neutral-400 hover:text-white">
                    <span className={`inline-block transition-transform ${collapsedScenes[sceneIdx] ? "-rotate-90" : "rotate-0"}`}>⌄</span>
                  </button>
                  <span className="text-xs font-bold text-neutral-200">
                    Scene #{sceneIdx + 1}
                    {collapsedScenes[sceneIdx] && <span className="ml-2 text-neutral-400 font-normal">· {scene.widget}</span>}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => moveSceneUp(sceneIdx)} disabled={sceneIdx === 0} className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs disabled:opacity-30">↑</button>
                  <button onClick={() => moveSceneDown(sceneIdx)} disabled={sceneIdx === localConfig.length - 1} className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs disabled:opacity-30">↓</button>
                  <button onClick={() => addSceneAfter(sceneIdx)} className="px-2 py-1 rounded bg-emerald-600 text-white text-xs">+</button>
                  <button onClick={() => deleteScene(sceneIdx)} className="px-2 py-1 rounded bg-rose-600 text-white text-xs">×</button>
                </div>
              </div>

              <div className={`overflow-hidden transition-all duration-300 ${collapsedScenes[sceneIdx] ? "max-h-0 opacity-0" : "max-h-[1500px] opacity-100"}`}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Duration (Frames)</label>
                    <input
                      type="number"
                      value={scene.durationFrames || ""}
                      onChange={(e) => updateSceneMeta(sceneIdx, "durationFrames", Number(e.target.value))}
                      className="w-full p-2 bg-black border border-neutral-800 rounded-lg text-xs font-medium text-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Widget Class</label>
                    <select
                      value={scene.widget || defaultWidgetType}
                      onChange={(e) => updateWidgetType(sceneIdx, e.target.value)}
                      className="w-full p-2 bg-black border border-neutral-800 rounded-lg text-xs font-medium text-neutral-200"
                    >
                      {widgetOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                {scene.props && (
                  <div className="pt-2 border-t border-neutral-800 space-y-3 bg-black/50 p-2.5 rounded-lg mt-3 border">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-emerald-400">Widget Props</span>
                    {(() => {
                      const registryEntry = getWidgetDefinition(scene.widget);
                      const schemaFields = registryEntry?.editorFields ?? [];
                      const schemaFieldMap = new Map(schemaFields.map((item) => [item.key, item]));
                      const orderedKeys = [...schemaFields.map((item) => item.key), ...Object.keys(scene.props).filter((key) => !schemaFieldMap.has(key))];

                      const isContentProp = (key: string, field?: any) => {
                        if (field?.type === "textarea") return true;
                        const contentRegex = /^(text|label|title|subtitle|description|caption|content|heading|message|body|prompt)$/i;
                        return contentRegex.test(key) || contentRegex.test(field?.label || "");
                      };

                      const contentKeys = orderedKeys.filter((key) => isContentProp(key, schemaFieldMap.get(key)));
                      const isColorProp = (key: string, field?: any) => field?.kind === "color" || (field?.kind === "array" && /colors?$/i.test(key));
                      const colorKeys = orderedKeys.filter((key) => isColorProp(key, schemaFieldMap.get(key)));
                      const compactKeys = orderedKeys.filter((key) => key !== "data" && !isContentProp(key, schemaFieldMap.get(key)) && !colorKeys.includes(key));
                      const activeTab = activePropTab[sceneIdx] ?? "properties";
                      const chartPaletteKey = scene.widget === "BAR_CHART"
                        ? "barColors"
                        : scene.widget === "LINE_CHART"
                          ? "pointColors"
                          : scene.widget === "PIE_CHART" || scene.widget === "DONUT_CHART"
                            ? "pieColors"
                            : undefined;

                      return (
                        <div className="space-y-3">
                          {/* Rendered Text Content - Full Width Inputs */}
                          {contentKeys.length > 0 && (
                            <div className="space-y-2">
                              {contentKeys.map((propKey) => {
                                const schemaField = schemaFieldMap.get(propKey);
                                const rawValue = scene.props[propKey];
                                return (
                                  <div key={propKey}>
                                    <label className="block text-[10px] font-medium text-neutral-400 mb-0.5">
                                      {schemaField?.label ?? propKey}
                                    </label>
                                    <input
                                      type="text"
                                      value={rawValue ?? ""}
                                      onChange={(e) => updateWidgetProp(sceneIdx, propKey, e.target.value)}
                                      className="w-full p-1.5 bg-[#1e1e1e] border border-neutral-800 rounded text-xs text-neutral-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {isChartWidget(scene.widget) && schemaFieldMap.has("data") && (
                            <ChartDataEditor
                              widget={scene.widget}
                              data={scene.props.data ?? registryEntry?.defaultProps?.data}
                              onChange={(data) => updateWidgetProp(sceneIdx, "data", data)}
                              palette={chartPaletteKey ? scene.props[chartPaletteKey] : undefined}
                              onPaletteChange={chartPaletteKey ? (palette) => updateWidgetProp(sceneIdx, chartPaletteKey, palette) : undefined}
                            />
                          )}

                          {(compactKeys.length > 0 || colorKeys.length > 0) && (
                            <>
                              <div className="flex items-center gap-1 border-b border-neutral-800">
                                {compactKeys.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setActivePropTab((tabs) => ({ ...tabs, [sceneIdx]: "properties" }))}
                                    className={`border-b-2 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${activeTab === "properties" ? "border-emerald-400 text-emerald-300" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
                                  >
                                    Properties
                                  </button>
                                )}
                                {colorKeys.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setActivePropTab((tabs) => ({ ...tabs, [sceneIdx]: "colors" }))}
                                    className={`border-b-2 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${activeTab === "colors" ? "border-emerald-400 text-emerald-300" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
                                  >
                                    Colors <span className="text-neutral-500">({colorKeys.length})</span>
                                  </button>
                                )}
                              </div>

                              {activeTab === "colors" && colorKeys.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                  {colorKeys.map((propKey) => {
                                    const schemaField = schemaFieldMap.get(propKey);
                                    const isPalette = schemaField?.kind === "array";
                                    return (
                                      <div key={propKey} className={`min-w-0 ${isPalette ? "col-span-2" : ""}`}>
                                        <label className="mb-0.5 block truncate text-[10px] font-medium text-neutral-400" title={schemaField?.label ?? propKey}>
                                          {schemaField?.label ?? propKey}
                                        </label>
                                        <ColorInput
                                          value={scene.props[propKey]}
                                          onChange={(value) => updateWidgetProp(sceneIdx, propKey, value)}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {activeTab === "properties" && compactKeys.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                  {compactKeys.map((propKey) => {
                                    const schemaField = schemaFieldMap.get(propKey);
                                    const rawValue = scene.props[propKey];
                                    return (
                                      <div key={propKey}>
                                        <label className="block text-[10px] font-medium text-neutral-400 mb-0.5 truncate" title={schemaField?.label ?? propKey}>
                                          {schemaField?.label ?? propKey}
                                        </label>
                                        <PropInput
                                          field={schemaField}
                                          value={rawValue}
                                          onChange={(value) => updateWidgetProp(sceneIdx, propKey, value)}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Buttons Section */}
      <div className="pt-2 space-y-2 border-t border-neutral-800">
        {localConfig.length > 0 && (
          <button
            onClick={() => setDashboardOpen(true)}
            className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 border border-neutral-700/50"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Open Dashboard</span>
          </button>
        )}

        <button
          onClick={handleApplyConfigRefresh}
          disabled={!isDirty}
          className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/10 bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:shadow-none flex items-center justify-center gap-2"
        >
          <span>Refresh Animation</span>
        </button>

        <RenderAndSaveButtons
          rawText={rawText}
          sceneConfig={sceneConfig}
          projectId={currentJobId || undefined}
          aspectRatio={aspectRatio}
        />
      </div>
    </div>
  );
}
