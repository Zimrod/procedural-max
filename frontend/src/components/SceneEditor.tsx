"use client";

import { getWidgetDefinition } from "../core/widgetRegistry";
import { RenderAndSaveButtons } from "./RenderAndSaveButtons";

interface SceneEditorProps {
  localConfig: any[];
  sceneConfig: any[];
  collapsedScenes: Record<number, boolean>;
  isDirty: boolean;
  rawText: string;
  currentJobId: string | null;
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
  toggleSceneCollapse, moveSceneUp, moveSceneDown, addSceneAfter, deleteScene,
  updateSceneMeta, updateWidgetType, updateWidgetProp, handleApplyConfigRefresh,
  widgetOptions, defaultWidgetType, setDashboardOpen,
}: SceneEditorProps) {
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
                      const compactKeys = orderedKeys.filter((key) => !isContentProp(key, schemaFieldMap.get(key)));

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

                          {/* Scene Layout, Colors & Param Controls - 3 Column Flex Grid */}
                          {compactKeys.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {compactKeys.map((propKey) => {
                                const schemaField = schemaFieldMap.get(propKey);
                                const rawValue = scene.props[propKey];
                                return (
                                  <div key={propKey}>
                                    <label className="block text-[10px] font-medium text-neutral-400 mb-0.5 truncate" title={schemaField?.label ?? propKey}>
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
        />
      </div>
    </div>
  );
}