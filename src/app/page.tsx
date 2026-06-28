"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { Main } from "../remotion/MyComp/Main";
import {
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../types/constants";
import {
  COMPOSITION_THEME_FIELDS,
  DEFAULT_COMPOSITION_THEME,
  COMPOSITION_THEME_PRESETS,
  applyThemeToScenes,
  applyThemeToWidgetProps,
  mergeTheme,
  type CompositionTheme,
} from "../types/theme";
import { getWidgetDefinition, widgetRegistry } from "../core/widgetRegistry";

import { RenderAndSaveButtons } from "../components/RenderAndSaveButtons";

const WIDGET_OPTIONS =
  Object.keys(widgetRegistry);
const DEFAULT_WIDGET_TYPE = WIDGET_OPTIONS[0];

export default function LandingPage() {
  const [prompt, setPrompt] = useState("");
  
  // Separation of concerns for script states
  const [aiScript, setAiScript] = useState("");
  const [customScript, setCustomScript] = useState("");

  // Separation of concerns for audio paths
  const [aiAudioUrl, setAiAudioUrl] = useState("");
  const [aiAudioVersion, setAiAudioVersion] = useState(0);
  
  const [customAudioUrl, setCustomAudioUrl] = useState("");
  const [customAudioVersion, setCustomAudioVersion] = useState(0);

  // Granular tracking of exactly which button is working
  const [activeLoading, setActiveLoading] = useState<"script" | "voiceover" | "animation" | null>(null);

  // Tab state for separating AI text prompting vs Professional Custom Scripts
  const [leftTab, setLeftTab] = useState<"generate" | "custom-script">("generate");

  // Remotion State
  const playerRef = useRef<PlayerRef>(null);
  const [transcription, setTranscription] = useState<{
    text: string;
    words: { word: string; start: number; end: number }[];
  } | null>(null);

  // Workspace Config Data Arrays
  const [sceneConfig, setSceneConfig] = useState<any[]>([]);
  const [localConfig, setLocalConfig] = useState<any[]>([]);
  const [themeConfig, setThemeConfig] = useState<CompositionTheme>(
    mergeTheme(
      COMPOSITION_THEME_PRESETS.find((item) => item.id === "light-stroke")?.theme ??
        DEFAULT_COMPOSITION_THEME
    )
  );
  const [themePresetId, setThemePresetId] = useState<string>("light-stroke");

  const [collapsedScenes, setCollapsedScenes] = useState<Record<number, boolean>>({});
  const toggleSceneCollapse = (
    sceneIndex: number
  ) => {
    setCollapsedScenes(prev => ({
      ...prev,
      [sceneIndex]: !prev[sceneIndex],
    }));
  };

  // Track modifications between master blueprint and local buffer modifications
  const isDirty = useMemo(() => {
    return JSON.stringify(sceneConfig) !== JSON.stringify(localConfig);
  }, [sceneConfig, localConfig]);

  // Sync internal local staging buffer state whenever server engine generates clean timelines
  useEffect(() => {
    if (sceneConfig && sceneConfig.length > 0) {
      setLocalConfig(JSON.parse(JSON.stringify(sceneConfig)));
    }
  }, [sceneConfig]);

  // Derived active script wrapper based on current tab selection
  const currentActiveScript = useMemo(() => {
    return leftTab === "generate" ? aiScript : customScript;
  }, [leftTab, aiScript, customScript]);

  // Derived active audio payload properties based on current tab selection
  const currentActiveAudio = useMemo(() => {
    if (leftTab === "generate") {
      return aiAudioUrl ? `${aiAudioUrl}?v=${aiAudioVersion}` : "";
    } else {
      return customAudioUrl ? `${customAudioUrl}?v=${customAudioVersion}` : "";
    }
  }, [leftTab, aiAudioUrl, aiAudioVersion, customAudioUrl, customAudioVersion]);

  const handleGenerateScript = async () => {
    if (!prompt.trim()) return;
    try {
      setActiveLoading("script");
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setAiScript(data.script || "");
    } catch (err) {
      console.error(err);
    } finally {
      setActiveLoading(null);
    }
  };

  const handleGenerateVoiceover = async () => {
    if (!currentActiveScript.trim()) {
      alert("Please ensure there is a script ready before generating voiceovers.");
      return;
    }
    
    try {
      setActiveLoading("voiceover");
      const res = await fetch("/api/generate-voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: currentActiveScript }),
      });
      const data = await res.json();
      if (data.success) {
        if (leftTab === "generate") {
          setAiAudioUrl(data.audioUrl);
          setAiAudioVersion((prev) => prev + 1);
        } else {
          setCustomAudioUrl(data.audioUrl);
          setCustomAudioVersion((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveLoading(null);
    }
  };

  const handleRenderAnimation = async () => {
    try {
      setActiveLoading("animation");
      const res = await fetch("/api/captions", { method: "POST" });
      const data = await res.json();
      
      if (data.success && data.sceneConfig) {
        setTranscription({ text: data.text, words: data.words });
        // Ensure the API-returned configs use uniform uppercase structure mappings
        const sanitized = data.sceneConfig.map((s: any) => ({
          ...s,
          widget: s.widget || s.type || DEFAULT_WIDGET_TYPE
        }));
        const themed = applyThemeToScenes(sanitized, themeConfig);
        setSceneConfig(themed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveLoading(null);
    }
  };

  // 🛠️ FIX: Recalculates start frame offsets chronologically when durations shift, and pushes a clean object instantiation to force Remotion to reload props.
  const handleApplyConfigRefresh = () => {
    let trackingFrame = 0;
    const computedConfig = localConfig.map((scene) => {
      const start = trackingFrame;
      trackingFrame += Number(scene.durationFrames || 30);
      return {
        ...scene,
        startFrame: start,
        durationFrames: Number(scene.durationFrames || 30),
      };
    });

    // Pushing a deep cloned clean reference array layout forces React state comparison hooks to fire
    setSceneConfig(JSON.parse(JSON.stringify(computedConfig)));
    
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      playerRef.current.play();
    }
  };

  const updateSceneMeta = (index: number, key: string, value: any) => {
    const updated = [...localConfig];
    updated[index] = { ...updated[index], [key]: value };
    setLocalConfig(updated);
  };

  const updateWidgetType = (
    sceneIndex: number,
    newType: string
  ) => {

    const updated = [...localConfig];

    const definition =
      getWidgetDefinition(newType);

    const currentScene =
      updated[sceneIndex];

    const generatedProps =
      definition?.buildFallbackProps
        ? definition.buildFallbackProps({
            text:
              currentScene.props?.text ??
              currentScene.props?.title ??
              "",

            shortSummary:
              currentScene.props?.text ??
              "",

            extractedData:
              currentScene.props?.extractedData,

            durationFrames:
              currentScene.durationFrames ?? 90,
          })
        : definition?.defaultProps ?? {};

    updated[sceneIndex] = {
      ...currentScene,
      widget: newType,
      props: applyThemeToWidgetProps(newType, structuredClone(generatedProps), themeConfig),
    };

    setLocalConfig(updated);
  };

  const updateWidgetProp = (sceneIndex: number, propKey: string, value: any) => {
    const updated = [...localConfig];
    updated[sceneIndex] = {
      ...updated[sceneIndex],
      props: {
        ...updated[sceneIndex].props,
        [propKey]: value
      }
    };
    setLocalConfig(updated);
  };

  const updateThemeProp = <K extends keyof CompositionTheme>(
    key: K,
    value: CompositionTheme[K]
  ) => {
    const nextTheme = mergeTheme({
      ...themeConfig,
      [key]: value,
    });
    const themedScenes = applyThemeToScenes(localConfig, nextTheme);
    setThemeConfig(nextTheme);
    setSceneConfig(JSON.parse(JSON.stringify(themedScenes)));
    setLocalConfig(JSON.parse(JSON.stringify(themedScenes)));
  };

  const selectThemePreset = (presetId: string) => {
    const preset = COMPOSITION_THEME_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setThemePresetId(preset.id);
    const nextTheme = mergeTheme(preset.theme);
    const themedScenes = applyThemeToScenes(localConfig, nextTheme);
    setThemeConfig(nextTheme);
    setSceneConfig(JSON.parse(JSON.stringify(themedScenes)));
    setLocalConfig(JSON.parse(JSON.stringify(themedScenes)));
  };

  const totalDurationInFrames = useMemo(() => {
    if (!sceneConfig || sceneConfig.length === 0) return 300;
    const lastScene = sceneConfig[sceneConfig.length - 1];
    return lastScene.startFrame + lastScene.durationFrames;
  }, [sceneConfig]);

  const inputProps = useMemo(() => {
    return {
      audioUrl: currentActiveAudio,
      // transcription,
      scenes: sceneConfig,
      captions: transcription?.words ?? [],
      theme: themeConfig,
    };
  }, [currentActiveAudio, transcription, sceneConfig, themeConfig]);  

  const deleteScene = (sceneIndex: number) => {
    const updated = [...localConfig];

    updated.splice(sceneIndex, 1);

    setLocalConfig(updated);
  };

  const addSceneAfter = (
    sceneIndex: number
  ) => {

    const definition =
      getWidgetDefinition(DEFAULT_WIDGET_TYPE);

    const newScene = {
      widget: DEFAULT_WIDGET_TYPE,
      startFrame: 0,
      durationFrames: 90,

      props:
        applyThemeToWidgetProps(DEFAULT_WIDGET_TYPE, definition?.buildFallbackProps({
          text: "New Scene",
          shortSummary: "New scene",
          durationFrames: 90,
        }) ?? definition?.defaultProps ?? {}, themeConfig),
    };

    const updated = [...localConfig];

    updated.splice(
      sceneIndex + 1,
      0,
      newScene
    );

    setLocalConfig(updated);
  };

  const moveSceneUp = (index: number) => {
    if (index === 0) return;

    const updated = [...localConfig];

    [updated[index - 1], updated[index]] = [
      updated[index],
      updated[index - 1],
    ];

    setLocalConfig(updated);
  };

  const moveSceneDown = (index: number) => {
    if (index === localConfig.length - 1) return;

    const updated = [...localConfig];

    [updated[index + 1], updated[index]] = [
      updated[index],
      updated[index + 1],
    ];

    setLocalConfig(updated);
  };

  return (
    <main className="min-h-screen w-full bg-[#f5fff4] text-black antialiased">
      <section className="mx-auto max-w-[1700px] px-4 py-8 sm:px-6 lg:px-8">
        
        {/* HEADER SECTION */}
        <div className="mb-8 border-b border-black/5 pb-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Procedural Engine v2
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
              AI Animation Workspace
            </h1>
            <p className="text-sm text-black/50">
              Paste deep professional domain scripts or brainstorm using structural templates.
            </p>
          </div>
        </div>

        <div className="w-full">
          {/* LEFT SIDEBAR AREA */}
          <div className="w-full lg:w-[420px] lg:float-left bg-white rounded-2xl border border-black/5 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
            <div className="flex border-b border-black/5 mb-5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setLeftTab("generate")}
                className={`flex-1 py-2.5 text-xs font-semibold tracking-wide rounded-lg transition-all ${leftTab === "generate" ? "bg-white text-blue-600 shadow-sm" : "text-black/40 hover:text-black/70"}`}
              >
                AI Co-Pilot Script
              </button>
              <button
                onClick={() => setLeftTab("custom-script")}
                className={`flex-1 py-2.5 text-xs font-semibold tracking-wide rounded-lg transition-all ${leftTab === "custom-script" ? "bg-white text-blue-600 shadow-sm" : "text-black/40 hover:text-black/70"}`}
              >
                Domain Expert Script
              </button>
            </div>

            {leftTab === "generate" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">
                    Conceptual Prompt Idea
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe market benchmarks or complex comparisons..."
                    className="w-full min-h-[110px] p-3.5 bg-slate-50 border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white resize-none text-black transition-all"
                  />
                </div>
                <button
                  onClick={handleGenerateScript}
                  disabled={activeLoading !== null || !prompt.trim()}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-black/30 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                >
                  {activeLoading === "script"
                    ? "Processing Narrative..."
                    : "Draft AI Core Script"}
                </button>

                {aiAudioUrl && (
                  <div className="rounded-xl border border-black/5 bg-slate-50/50 p-4 mt-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                      Co-Pilot Voiceover Preview
                    </h3>
                    <audio
                      controls
                      src={`${aiAudioUrl}?v=${aiAudioVersion}`}
                      className="mt-2 w-full h-8 text-sm"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black/40 mb-2">
                    Custom Industry Script Track
                  </label>
                  <textarea
                    value={customScript}
                    onChange={(e) => setCustomScript(e.target.value)}
                    placeholder="Paste deep technical workflows or financial metrics directly here..."
                    className="w-full min-h-[185px] p-3.5 bg-slate-50 border border-black/5 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white text-black transition-all"
                  />
                </div>

                {customAudioUrl && (
                  <div className="rounded-xl border border-black/5 bg-slate-50/50 p-4 mt-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                      Expert Voiceover Preview
                    </h3>
                    <audio
                      controls
                      src={`${customAudioUrl}?v=${customAudioVersion}`}
                      className="mt-2 w-full h-8 text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {currentActiveScript && (
              <div className="mt-5 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1.5">
                  Active Execution Script:
                </div>
                <p className="text-xs text-slate-700 leading-relaxed max-h-[140px] overflow-y-auto pr-1">
                  {currentActiveScript}
                </p>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-black/5 space-y-3">
              <button
                onClick={handleGenerateVoiceover}
                disabled={activeLoading !== null || !currentActiveScript.trim()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-black/30 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-500/10"
              >
                {activeLoading === "voiceover"
                  ? "Generating Audio..."
                  : "Step 2: Synthesize Voiceover File"}
              </button>

              <button
                onClick={handleRenderAnimation}
                disabled={activeLoading !== null || !currentActiveAudio}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-black/30 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10"
              >
                {activeLoading === "animation"
                  ? "Assembling Visual Timelines..."
                  : "Step 3: Analyze & Sync Motion Rig"}
              </button>
            </div>

          </div>

          {/* VIEWPORT CONTROLS VIEW AREA */}
          <div className="w-full lg:w-[calc(100%-445px)] lg:ml-[25px] mt-6 lg:mt-0 lg:float-left flex flex-col xl:flex-row gap-5">
            <div className="flex-1 flex flex-col gap-5">
              {/* VIDEO PLAYER VIEWPORT BOX */}
              <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] h-fit">
                <div className="text-xs font-bold uppercase tracking-wider text-black/40 mb-3 px-1">
                  Live Interactive Remotion Composition
                </div>

                <div className="w-full bg-[#111] rounded-xl overflow-hidden aspect-video border border-black/10">
                  <div className="relative flex h-full w-full items-center justify-center bg-[#fafcff]">
                    {sceneConfig.length > 0 ? (
                      <Player
                        ref={playerRef}
                        component={Main}
                        inputProps={inputProps}
                        durationInFrames={totalDurationInFrames}
                        fps={VIDEO_FPS}
                        compositionHeight={VIDEO_HEIGHT}
                        compositionWidth={VIDEO_WIDTH}                      
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: themeConfig.backgroundColor,
                        }}
                        controls
                        autoPlay
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center px-6 text-center text-black/40">
                        <div className="text-base font-medium">Animated Video Will Appear Here</div>
                        <p className="mt-2 max-w-xs text-xs leading-relaxed text-black/40">
                          Select a tab, prepare your script, then trigger voiceover synthesis to unlock timeline synchronization.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* THEME CONFIG PANEL */}
              <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-black/40 px-1">
                      Theme Config Properties
                    </div>
                    <p className="mt-1 px-1 text-[11px] leading-relaxed text-black/40">
                      This controls the composition-wide look and updates the player live.
                    </p>
                  </div>
                  <div
                    className="h-10 w-10 rounded-xl border border-black/5 shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${themeConfig.backgroundColor}, ${themeConfig.accentSoftColor})`,
                    }}
                  />
                </div>

                <div className="mb-3 flex flex-wrap gap-2 px-1">
                  {COMPOSITION_THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => selectThemePreset(preset.id)}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${themePresetId === preset.id ? "border-black bg-black text-white" : "border-black/10 bg-slate-50 text-black/60 hover:bg-slate-100"}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {COMPOSITION_THEME_FIELDS.map((field) => {
                    const value = themeConfig[field.key];
                    const fieldId = `theme-${String(field.key)}`;

                    return (
                      <div key={field.key} className="space-y-1.5">
                        <label
                          htmlFor={fieldId}
                          className="block text-[10px] font-bold uppercase tracking-wider text-black/40"
                        >
                          {field.label}
                        </label>
                        {field.kind === "select" ? (
                          <select
                            id={fieldId}
                            value={String(value)}
                            onChange={(e) => updateThemeProp(field.key, e.target.value as any)}
                            className="w-full rounded-lg border border-black/5 bg-slate-50 px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {(field.options ?? []).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : field.kind === "color" ? (
                          <div className="flex items-center gap-2">
                            <input
                              id={fieldId}
                              type="color"
                              value={String(value)}
                              onChange={(e) => updateThemeProp(field.key, e.target.value as any)}
                              className="h-10 w-11 rounded-lg border border-black/5 bg-white p-1"
                            />
                            <input
                              type="text"
                              value={String(value)}
                              onChange={(e) => updateThemeProp(field.key, e.target.value as any)}
                              className="w-full rounded-lg border border-black/5 bg-slate-50 px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        ) : (
                          <input
                            id={fieldId}
                            type={field.kind === "number" ? "number" : "text"}
                            value={String(value)}
                            onChange={(e) => updateThemeProp(field.key, (field.kind === "number" ? Number(e.target.value) : e.target.value) as any)}
                            className="w-full rounded-lg border border-black/5 bg-slate-50 px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl border border-black/5 bg-slate-50 p-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-black/40">
                    Chart Palette
                  </div>
                  <input
                    type="text"
                    value={themeConfig.chartPalette.join(", ")}
                    onChange={(e) =>
                      updateThemeProp(
                        "chartPalette",
                        e.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean) as any
                      )
                    }
                    className="w-full rounded-lg border border-black/5 bg-white px-3 py-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {themeConfig.chartPalette.map((swatch) => (
                      <span
                        key={swatch}
                        className="h-5 w-5 rounded-full border border-black/10"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE CONFIG PROPERTY SIDEBAR PANEL */}
            <div className="w-full xl:w-[380px] bg-white rounded-2xl border border-black/5 p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex flex-col max-h-[600px]">
              <div className="text-xs font-bold uppercase tracking-wider text-black/40 mb-3 px-1">
                Scene Config Properties
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin">
                {localConfig.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-black/30 border border-dashed border-black/10 rounded-xl bg-slate-50/50">
                    <span className="text-xs">No active procedural tracks analyzed. Run Step 3 to populate.</span>
                  </div>
                ) : (
                  localConfig.map((scene, sceneIdx) => (
                    <div key={sceneIdx} className="p-3.5 bg-slate-50 border border-black/5 rounded-xl space-y-3">
                      
                      <div className="flex items-center justify-between border-b border-black/5 pb-2">

                        <div className="flex items-center gap-2">

                          <button
                            onClick={() => toggleSceneCollapse(sceneIdx)}
                            className="
                              flex items-center justify-center
                              w-5 h-5
                              text-slate-500
                              hover:text-slate-800
                              transition-all
                              duration-200
                            "
                          >
                            <span
                              className={`
                                inline-block
                                transition-transform
                                duration-200
                                ${
                                  collapsedScenes[sceneIdx]
                                    ? "-rotate-90"
                                    : "rotate-0"
                                }
                              `}
                            >
                              ⌄
                            </span>
                          </button>

                          <span className="text-xs font-bold text-slate-700">
                            Scene #{sceneIdx + 1}

                            {collapsedScenes[sceneIdx] && (
                              <span className="ml-2 text-slate-500 font-medium">
                                · {scene.widget}
                              </span>
                            )}
                          </span>

                        </div>

                        <div className="flex gap-1">

                          <button
                            onClick={() => moveSceneUp(sceneIdx)}
                            disabled={sceneIdx === 0}
                            className="px-2 py-1 rounded bg-slate-200 text-xs disabled:opacity-30"
                          >
                            ↑
                          </button>

                          <button
                            onClick={() => moveSceneDown(sceneIdx)}
                            disabled={sceneIdx === localConfig.length - 1}
                            className="px-2 py-1 rounded bg-slate-200 text-xs disabled:opacity-30"
                          >
                            ↓
                          </button>

                          <button
                            onClick={() => addSceneAfter(sceneIdx)}
                            className="px-2 py-1 rounded bg-blue-500 text-white text-xs"
                          >
                            +
                          </button>

                          <button
                            onClick={() => deleteScene(sceneIdx)}
                            className="px-2 py-1 rounded bg-red-500 text-white text-xs"
                          >
                            ×
                          </button>

                        </div>

                      </div>

                      <div
                        className={`
                          overflow-hidden
                          transition-all
                          duration-300
                          ${
                            collapsedScenes[sceneIdx]
                              ? "max-h-0 opacity-0"
                              : "max-h-[1500px] opacity-100"
                          }
                        `}
                      >
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-black/40 uppercase mb-1">Duration (Frames)</label>
                              <input
                                type="number"
                                value={scene.durationFrames || ""}
                                onChange={(e) => updateSceneMeta(sceneIdx, "durationFrames", Number(e.target.value))}
                                className="w-full p-2 bg-white border border-black/5 rounded-lg text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-black/40 uppercase mb-1">Widget Class</label>
                              <select
                                value={scene.widget || DEFAULT_WIDGET_TYPE}
                                onChange={(e) => updateWidgetType(sceneIdx, e.target.value)}
                                className="w-full p-2 bg-white border border-black/5 rounded-lg text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {WIDGET_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {scene.props && (
                            <div className="pt-2 border-t border-black/5 space-y-2 bg-white/60 p-2 rounded-lg">
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-blue-600/70">
                                Widget Props
                              </span>
                              {(() => {
                                const registryEntry = getWidgetDefinition(scene.widget);
                                const schemaFields = registryEntry?.editorFields ?? [];
                                const schemaFieldMap = new Map(schemaFields.map((item) => [item.key, item]));
                                const orderedKeys = [
                                  ...schemaFields.map((item) => item.key),
                                  ...Object.keys(scene.props).filter((key) => !schemaFieldMap.has(key)),
                                ];

                                return orderedKeys.map((propKey) => {
                                  const schemaField = schemaFieldMap.get(propKey);
                                  const rawValue = scene.props[propKey];
                                  const fieldId = `scene-${sceneIdx}-${propKey}`;

                                  return (
                                    <div key={propKey}>
                                      <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                                        {schemaField?.label ?? propKey}
                                      </label>

                                      {schemaField?.kind === "select" ? (
                                        <select
                                          id={fieldId}
                                          value={String(rawValue ?? "")}
                                          onChange={(e) => updateWidgetProp(sceneIdx, propKey, e.target.value)}
                                          className="w-full p-1.5 bg-white border border-black/5 rounded text-xs text-black"
                                        >
                                          {(schemaField.options ?? []).map((option) => (
                                            <option key={option} value={option}>
                                              {option}
                                            </option>
                                          ))}
                                        </select>
                                      ) : schemaField?.kind === "boolean" ? (
                                        <label className="flex items-center gap-2 rounded border border-black/5 bg-white px-2 py-1.5 text-xs text-black">
                                          <input
                                            id={fieldId}
                                            type="checkbox"
                                            checked={Boolean(rawValue)}
                                            onChange={(e) => updateWidgetProp(sceneIdx, propKey, e.target.checked)}
                                          />
                                          <span>{String(Boolean(rawValue))}</span>
                                        </label>
                                      ) : schemaField?.kind === "color" ? (
                                        <div className="flex items-center gap-2">
                                          <input
                                            id={fieldId}
                                            type="color"
                                            value={String(rawValue || "#000000")}
                                            onChange={(e) => updateWidgetProp(sceneIdx, propKey, e.target.value)}
                                            className="h-8 w-10 rounded border border-black/5 bg-white p-1"
                                          />
                                          <input
                                            type="text"
                                            value={String(rawValue || "")}
                                            onChange={(e) => updateWidgetProp(sceneIdx, propKey, e.target.value)}
                                            className="w-full p-1.5 bg-white border border-black/5 rounded text-xs text-black"
                                          />
                                        </div>
                                      ) : schemaField?.kind === "number" ? (
                                        <input
                                          id={fieldId}
                                          type="number"
                                          value={rawValue ?? ""}
                                          onChange={(e) => updateWidgetProp(sceneIdx, propKey, Number(e.target.value))}
                                          className="w-full p-1.5 bg-white border border-black/5 rounded text-xs font-mono text-black"
                                        />
                                      ) : schemaField?.kind === "array" || Array.isArray(rawValue) ? (
                                        <input
                                          id={fieldId}
                                          type="text"
                                          value={Array.isArray(rawValue) ? rawValue.join(", ") : String(rawValue ?? "")}
                                          onChange={(e) =>
                                            updateWidgetProp(
                                              sceneIdx,
                                              propKey,
                                              e.target.value.split(",").map((item) => {
                                                const trimmed = item.trim();
                                                const numeric = Number(trimmed);
                                                return Number.isFinite(numeric) && trimmed !== "" ? numeric : trimmed;
                                              })
                                            )
                                          }
                                          className="w-full p-1.5 bg-white border border-black/5 rounded text-xs font-mono text-black"
                                        />
                                      ) : schemaField?.kind === "json" || (rawValue && typeof rawValue === "object") ? (
                                        <textarea
                                          value={JSON.stringify(rawValue ?? {}, null, 2)}
                                          onChange={(e) => {
                                            try {
                                              updateWidgetProp(sceneIdx, propKey, JSON.parse(e.target.value));
                                            } catch {
                                              // Keep the last valid JSON until it parses cleanly.
                                            }
                                          }}
                                          className="w-full min-h-[90px] p-1.5 bg-white border border-black/5 rounded text-xs font-mono text-black"
                                        />
                                      ) : (
                                        <input
                                          id={fieldId}
                                          type="text"
                                          value={rawValue ?? ""}
                                          onChange={(e) => updateWidgetProp(sceneIdx, propKey, e.target.value)}
                                          className="w-full p-1.5 bg-white border border-black/5 rounded text-xs text-black"
                                        />
                                      )}
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          )}
                        </>
                      </div>

                    </div>
                  ))
                )}
              </div>

              <button
                onClick={handleApplyConfigRefresh}
                disabled={!isDirty}
                className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-slate-900/10 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-black/30 disabled:shadow-none"
              >
                Refresh Animation
              </button>

              <RenderAndSaveButtons 
                rawText={transcription || ""}
                sceneConfig={localConfig || []}
              />
            </div>

          </div>

          <div className="clear-both" />
          
        </div>
      </section>
    </main>
  );
}
