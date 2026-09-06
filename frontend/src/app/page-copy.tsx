"use client";

import { useState, useMemo, useRef, useEffect, ChangeEvent } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { Main } from "../graphics/Main";
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
import { Navbar } from "../components/Navbar";

const DYNAMIC_WIDGET_OPTIONS = Object.keys(widgetRegistry);
const DEFAULT_WIDGET_TYPE = DYNAMIC_WIDGET_OPTIONS[0] || "";

function Spinner({ colorClass = "text-white" }: { colorClass?: string }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 ${colorClass}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function LandingPage() {
  const [prompt, setPrompt] = useState("");
  
  // Script States
  const [aiScript, setAiScript] = useState("");
  const [customScript, setCustomScript] = useState("");
  const [uploadedScript, setUploadedScript] = useState("");

  // Audio States
  const [aiAudioUrl, setAiAudioUrl] = useState("");
  const [aiAudioVersion, setAiAudioVersion] = useState(0);
  
  const [customAudioUrl, setCustomAudioUrl] = useState("");
  const [customAudioVersion, setCustomAudioVersion] = useState(0);

  const [uploadedAudioUrl, setUploadedAudioUrl] = useState("");
  const [uploadedAudioVersion, setUploadedAudioVersion] = useState(0);

  // Pipeline tracking
  const [activeLoading, setActiveLoading] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<any>(null);

  // 3-Tab Navigation State
  const [leftTab, setLeftTab] = useState<"generate" | "custom-script" | "upload-voiceover">("generate");

  // Remotion Player Reference & Captions
  const playerRef = useRef<PlayerRef>(null);
  const [transcription, setTranscription] = useState<{
    text: string;
    words: { word: string; start: number; end: number }[];
  } | null>(null);

  // Config States
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
  const toggleSceneCollapse = (sceneIndex: number) => {
    setCollapsedScenes((prev) => ({
      ...prev,
      [sceneIndex]: !prev[sceneIndex],
    }));
  };

  const isDirty = useMemo(() => {
    return JSON.stringify(sceneConfig) !== JSON.stringify(localConfig);
  }, [sceneConfig, localConfig]);

  useEffect(() => {
    if (sceneConfig && sceneConfig.length > 0) {
      setLocalConfig(JSON.parse(JSON.stringify(sceneConfig)));
    }
  }, [sceneConfig]);

  // Derived active script payload across 3 tabs
  const currentActiveScript = useMemo(() => {
    if (leftTab === "generate") return aiScript;
    if (leftTab === "custom-script") return customScript;
    return uploadedScript;
  }, [leftTab, aiScript, customScript, uploadedScript]);

  const API = process.env.NEXT_PUBLIC_API_BASE_URL!.replace(/\/$/, "");

  // Derived active audio payload across 3 tabs
  const currentActiveAudio = useMemo(() => {
    let rawUrl = "";
    let version = 0;

    if (leftTab === "generate") {
      rawUrl = aiAudioUrl;
      version = aiAudioVersion;
    } else if (leftTab === "custom-script") {
      rawUrl = customAudioUrl;
      version = customAudioVersion;
    } else {
      rawUrl = uploadedAudioUrl;
      version = uploadedAudioVersion;
    }
    
    if (!rawUrl) return "";

    const completeUrl = rawUrl.startsWith("http") ? rawUrl : `${API}${rawUrl}`;
    return `${completeUrl}?v=${version}`;
  }, [
    leftTab,
    aiAudioUrl,
    aiAudioVersion,
    customAudioUrl,
    customAudioVersion,
    uploadedAudioUrl,
    uploadedAudioVersion,
    API,
  ]);

  // Tab 1: AI Prompt Script Generation
  const handleGenerateScript = async () => {
    if (!prompt.trim()) return;

    try {
      setActiveLoading("script");

      const res = await fetch(`${API}/script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Failed to generate script.");

      const data = await res.json();
      setAiScript(data.script);
    } catch (err) {
      console.error("Script generation error:", err);
    } finally {
      setActiveLoading(null);
    }
  };

  // Tab 3: Upload Audio File & Process Automatic Transcription
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setActiveLoading("uploading_audio");
      setPipelineResult(null);
      setTranscription(null);
      setSceneConfig([]);

      const formData = new FormData();
      formData.append("audio", file);
      if (currentJobId) {
        formData.append("jobId", currentJobId);
      }

      const res = await fetch(`${API}/voiceover/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setUploadedAudioUrl(data.audioUrl);
        setUploadedAudioVersion((prev) => prev + 1);
        setUploadedScript(data.transcript?.text || "");
        
        if (data.transcript) {
          setTranscription(data.transcript);
        }

        setCurrentJobId(data.jobId);
        
        // Trigger background scene assembly from transcription
        setActiveLoading("assembling_scenes");
        startBackgroundSync(data.jobId);
      } else {
        setActiveLoading(null);
      }
    } catch (err) {
      console.error("Audio upload error:", err);
      setActiveLoading(null);
    }
  };

  // Tab 1 & 2: Step 2 Voiceover Synthesis & Pipeline Trigger
  const handleGenerateVoiceover = async () => {
    try {
      setPipelineResult(null);
      setTranscription(null);
      setSceneConfig([]);
      setActiveLoading("generating_audio");
      
      const res = await fetch(`${API}/voiceover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          script: currentActiveScript,
          jobId: currentJobId || undefined 
        }),
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
        
        setCurrentJobId(data.jobId);
        setActiveLoading("assembling_scenes"); 
        startBackgroundSync(data.jobId);
      } else {
        setActiveLoading(null);
      }
    } catch (err) {
      console.error("Voiceover synthesis error:", err);
      setActiveLoading(null);
    }
  };

  const startBackgroundSync = async (jobId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      try {
        attempts++;
        if (attempts > 120) {
          clearInterval(interval);
          console.error("Background extraction pipeline timed out.");
          setActiveLoading(null);
          return;
        }

        const res = await fetch(`${API}/voiceover/status/${jobId}`);
        const statusData = await res.json();

        if (statusData.status === "done") {
          clearInterval(interval);
          setPipelineResult(statusData.result); 
          setActiveLoading(null);
        } else if (statusData.status === "failed") {
          clearInterval(interval);
          console.error("Pipeline status reported failure.");
          setActiveLoading(null);
        }
      } catch (err) {
        console.error("Network error during status check", err);
      }
    }, 1500);
  };

  // Step 3: Render animation timeline
  const handleRenderAnimation = async () => {
    if (!pipelineResult) return;

    setActiveLoading("animation");

    try {
      const { transcript, sceneConfig: incomingScenes } = pipelineResult;

      // Prefer user-edited text if edits were made to transcript text
      if (transcript) {
        setTranscription({
          text: currentActiveScript || transcript.text,
          words: transcript.words || [],
        });
      }

      const sanitized = (incomingScenes || []).map((s: any) => {
        const widgetType = s.widget || s.type || DEFAULT_WIDGET_TYPE;
        return {
          ...s,
          widget: widgetType,
        };
      });

      const themed = applyThemeToScenes(sanitized, themeConfig);
      setSceneConfig(themed);

      if (playerRef.current) {
        playerRef.current.seekTo(0);
      }
    } catch (err) {
      console.error("Failed to render animation layout:", err);
    } finally {
      setActiveLoading(null);
    }
  };

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

  const updateWidgetType = (sceneIndex: number, newType: string) => {
    const updated = [...localConfig];
    const definition = getWidgetDefinition(newType);
    const currentScene = updated[sceneIndex];

    const generatedProps = definition?.buildFallbackProps
      ? definition.buildFallbackProps({
          text: currentScene.props?.text ?? currentScene.props?.title ?? "",
          shortSummary: currentScene.props?.text ?? "",
          extractedData: currentScene.props?.extractedData,
          durationFrames: currentScene.durationFrames ?? 90,
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
        [propKey]: value,
      },
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

  const addSceneAfter = (sceneIndex: number) => {
    const definition = getWidgetDefinition(DEFAULT_WIDGET_TYPE);
    const newScene = {
      widget: DEFAULT_WIDGET_TYPE,
      startFrame: 0,
      durationFrames: 90,
      props: applyThemeToWidgetProps(DEFAULT_WIDGET_TYPE, definition?.buildFallbackProps({
        text: "New Scene",
        shortSummary: "New scene",
        durationFrames: 90,
      }) ?? definition?.defaultProps ?? {}, themeConfig),
    };

    const updated = [...localConfig];
    updated.splice(sceneIndex + 1, 0, newScene);
    setLocalConfig(updated);
  };

  const moveSceneUp = (index: number) => {
    if (index === 0) return;
    const updated = [...localConfig];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setLocalConfig(updated);
  };

  const moveSceneDown = (index: number) => {
    if (index === localConfig.length - 1) return;
    const updated = [...localConfig];
    [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
    setLocalConfig(updated);
  };

  return (
    <main className="min-h-screen w-full bg-[#121212] text-gray-100 antialiased selection:bg-emerald-500 selection:text-white">
      <section className="mx-auto max-w-[1700px] px-4 py-8 sm:px-6 lg:px-8">
        <Navbar />
        
        {/* HEADER SECTION */}
        <div className="mb-8 border-b border-neutral-800 pb-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Procedural Animation Engine v2
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Automated Motion Graphics
            </h1>
          </div>
        </div>

        <div className="w-full">
          {/* LEFT SIDEBAR AREA */}
          <div className="w-full lg:w-[420px] lg:float-left bg-[#1e1e1e] rounded-2xl border border-neutral-800 p-5 shadow-2xl shadow-black/60">
            {/* 3-TAB NAVIGATION */}
            <div className="flex border border-neutral-800 mb-5 p-1 bg-[#141414] rounded-xl text-center">
              <button
                onClick={() => setLeftTab("generate")}
                className={`flex-1 py-2 text-[11px] font-semibold tracking-wide rounded-lg transition-all ${leftTab === "generate" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                AI Prompt
              </button>
              <button
                onClick={() => setLeftTab("custom-script")}
                className={`flex-1 py-2 text-[11px] font-semibold tracking-wide rounded-lg transition-all ${leftTab === "custom-script" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                Custom Script
              </button>
              <button
                onClick={() => setLeftTab("upload-voiceover")}
                className={`flex-1 py-2 text-[11px] font-semibold tracking-wide rounded-lg transition-all ${leftTab === "upload-voiceover" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                Upload Audio
              </button>
            </div>

            {leftTab === "generate" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Conceptual Prompt Idea
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the type of script you want created..."
                    className="w-full min-h-[90px] p-3.5 bg-[#141414] border border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none text-neutral-100 placeholder:text-neutral-600 transition-all"
                  />
                </div>
                <button
                  onClick={handleGenerateScript}
                  disabled={activeLoading !== null || !prompt.trim()}
                  className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900/50 disabled:text-neutral-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 border border-neutral-700/50"
                >
                  <span>
                    {activeLoading === "script"
                      ? "Processing Narrative..."
                      : "Step 1: Generate Script"}
                  </span>
                  {activeLoading === "script" && <Spinner colorClass="text-emerald-400" />}
                </button>

                {aiScript !== "" && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                      Editable Generated Script
                    </label>
                    <textarea
                      value={aiScript}
                      onChange={(e) => setAiScript(e.target.value)}
                      placeholder="AI generated script will appear here..."
                      className="w-full min-h-[140px] p-3.5 bg-[#141414] border border-emerald-900/60 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-neutral-100 placeholder:text-neutral-600 transition-all"
                    />
                  </div>
                )}

                {aiAudioUrl && (
                  <div className="rounded-xl border border-neutral-800 bg-[#141414] p-4 mt-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Co-Pilot Voiceover Preview
                    </h3>
                    <audio
                      controls
                      src={`${aiAudioUrl}?v=${aiAudioVersion}`}
                      className="mt-2 w-full h-8 text-sm accent-emerald-500"
                    />
                  </div>
                )}
              </div>
            ) : leftTab === "custom-script" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Custom Script Track
                  </label>
                  <textarea
                    value={customScript}
                    onChange={(e) => setCustomScript(e.target.value)}
                    placeholder="Paste your script directly here..."
                    className="w-full min-h-[185px] p-3.5 bg-[#141414] border border-neutral-800 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-neutral-100 placeholder:text-neutral-600 transition-all"
                  />
                </div>

                {customAudioUrl && (
                  <div className="rounded-xl border border-neutral-800 bg-[#141414] p-4 mt-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Expert Voiceover Preview
                    </h3>
                    <audio
                      controls
                      src={`${customAudioUrl}?v=${customAudioVersion}`}
                      className="mt-2 w-full h-8 text-sm accent-emerald-500"
                    />
                  </div>
                )}
              </div>
            ) : (
              /* TAB 3: UPLOAD VOICEOVER & AUTOMATIC TRANSCRIPTION */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Upload Audio File (.mp3, .wav, .m4a)
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 hover:border-emerald-500/50 rounded-xl p-4 bg-[#141414] cursor-pointer transition-all">
                    <span className="text-xs text-neutral-400 font-medium">Click to select audio file</span>
                    <span className="text-[10px] text-neutral-600 mt-1">Automatic STT transcription will execute on upload</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={activeLoading !== null}
                    />
                  </label>
                </div>

                {uploadedAudioUrl && (
                  <div className="rounded-xl border border-neutral-800 bg-[#141414] p-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Uploaded Voiceover Track
                    </h3>
                    <audio
                      controls
                      src={`${uploadedAudioUrl}?v=${uploadedAudioVersion}`}
                      className="mt-2 w-full h-8 text-sm accent-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Editable Auto-Transcript
                    </label>
                    <span className="text-[9px] text-neutral-500">Fix typos or misheard terms</span>
                  </div>
                  <textarea
                    value={uploadedScript}
                    onChange={(e) => setUploadedScript(e.target.value)}
                    placeholder="Uploaded audio transcription will populate here. Edit typos directly..."
                    className="w-full min-h-[140px] p-3.5 bg-[#141414] border border-emerald-900/60 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-neutral-100 placeholder:text-neutral-600 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-neutral-800 space-y-3">
              {leftTab !== "upload-voiceover" && (
                <button 
                  onClick={handleGenerateVoiceover}
                  disabled={activeLoading !== null || !currentActiveScript.trim()}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800/50 disabled:text-neutral-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <span>
                    {activeLoading === "generating_audio"
                      ? "Generating Audio..."
                      : activeLoading === "assembling_scenes"
                      ? "Assembling Scenes..."
                      : currentJobId
                      ? "Step 2: Update Voiceover & Script"
                      : "Step 2: Generate Voiceover"
                    }
                  </span>
                  {(activeLoading === "generating_audio" || activeLoading === "assembling_scenes") && (
                    <Spinner colorClass="text-amber-300" />
                  )}
                </button>
              )}
      
              <button
                onClick={handleRenderAnimation}
                disabled={activeLoading !== null || !pipelineResult}
                className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800/50 disabled:text-neutral-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
              >
                <span>
                  {activeLoading === "animation"
                    ? "Rendering Animation..."
                    : activeLoading === "uploading_audio"
                    ? "Transcribing Audio File..."
                    : leftTab === "upload-voiceover"
                    ? "Step 2: Render Animation from Audio"
                    : "Step 3: Generate Animation"}
                </span>
                {(activeLoading === "animation" || activeLoading === "uploading_audio") && (
                  <Spinner colorClass="text-rose-200" />
                )}
              </button>
            </div>

          </div>

          {/* VIEWPORT CONTROLS VIEW AREA */}
          <div className="w-full lg:w-[calc(100%-445px)] lg:ml-[25px] mt-6 lg:mt-0 lg:float-left flex flex-col xl:flex-row gap-5">
            <div className="flex-1 flex flex-col gap-5">
              {/* VIDEO PLAYER VIEWPORT BOX */}
              <div className="bg-[#1e1e1e] rounded-2xl border border-neutral-800 p-4 shadow-2xl shadow-black/60 h-fit">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 px-1 flex items-center justify-between">
                  <span>Live Interactive Remotion Composition</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">1920x1080 @ 30fps</span>
                </div>

                <div className="w-full bg-black rounded-xl overflow-hidden aspect-video border border-neutral-800 shadow-inner">
                  <div className="relative flex h-full w-full items-center justify-center bg-[#121212]">
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
                      <div className="flex flex-col items-center justify-center px-6 text-center text-neutral-500">
                        <div className="text-base font-medium text-neutral-300">Animated Video Will Appear Here</div>
                        <p className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-500">
                          Select a tab, prepare your script, then trigger voiceover synthesis to unlock timeline synchronization.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* THEME CONFIG PANEL */}
              <div className="bg-[#1e1e1e] rounded-2xl border border-neutral-800 p-4 shadow-2xl shadow-black/60">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">
                      Theme Config Properties
                    </div>
                    <p className="mt-1 px-1 text-[11px] leading-relaxed text-neutral-400">
                      This controls the composition-wide look and updates the player live.
                    </p>
                  </div>
                  <div
                    className="h-10 w-10 rounded-xl border border-neutral-700 shadow-sm"
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
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${themePresetId === preset.id ? "border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "border-neutral-800 bg-[#141414] text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"}`}
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
                          className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400"
                        >
                          {field.label}
                        </label>
                        {field.kind === "select" ? (
                          <select
                            id={fieldId}
                            value={String(value)}
                            onChange={(e) => updateThemeProp(field.key, e.target.value as any)}
                            className="w-full rounded-lg border border-neutral-800 bg-[#141414] px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                              className="h-10 w-11 rounded-lg border border-neutral-800 bg-[#141414] p-1 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={String(value)}
                              onChange={(e) => updateThemeProp(field.key, e.target.value as any)}
                              className="w-full rounded-lg border border-neutral-800 bg-[#141414] px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                            />
                          </div>
                        ) : (
                          <input
                            id={fieldId}
                            type={field.kind === "number" ? "number" : "text"}
                            value={String(value)}
                            onChange={(e) => updateThemeProp(field.key, (field.kind === "number" ? Number(e.target.value) : e.target.value) as any)}
                            className="w-full rounded-lg border border-neutral-800 bg-[#141414] px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl border border-neutral-800 bg-[#141414] p-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
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
                    className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {themeConfig.chartPalette.map((swatch) => (
                      <span
                        key={swatch}
                        className="h-5 w-5 rounded-full border border-neutral-700/80 shadow-sm"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE CONFIG PROPERTY SIDEBAR PANEL */}
            <div className="w-full xl:w-[380px] bg-[#1e1e1e] rounded-2xl border border-neutral-800 p-4 shadow-2xl shadow-black/60 flex flex-col max-h-[600px]">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 px-1">
                Scene Config Properties
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin">
                {localConfig.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500 border border-dashed border-neutral-800 rounded-xl bg-[#141414]/50">
                    <span className="text-xs">No active procedural tracks analyzed. Trigger animation to populate.</span>
                  </div>
                ) : (
                  localConfig.map((scene, sceneIdx) => (
                    <div key={sceneIdx} className="p-3.5 bg-[#141414] border border-neutral-800 rounded-xl space-y-3">
                      
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSceneCollapse(sceneIdx)}
                            className="flex items-center justify-center w-5 h-5 text-neutral-400 hover:text-white transition-all duration-200"
                          >
                            <span
                              className={`inline-block transition-transform duration-200 ${
                                collapsedScenes[sceneIdx]
                                  ? "-rotate-90"
                                  : "rotate-0"
                              }`}
                            >
                              ⌄
                            </span>
                          </button>

                          <span className="text-xs font-bold text-neutral-200">
                            Scene #{sceneIdx + 1}
                            {collapsedScenes[sceneIdx] && (
                              <span className="ml-2 text-neutral-400 font-normal">
                                · {scene.widget}
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => moveSceneUp(sceneIdx)}
                            disabled={sceneIdx === 0}
                            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs disabled:opacity-30 border border-neutral-700/50"
                          >
                            ↑
                          </button>

                          <button
                            onClick={() => moveSceneDown(sceneIdx)}
                            disabled={sceneIdx === localConfig.length - 1}
                            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs disabled:opacity-30 border border-neutral-700/50"
                          >
                            ↓
                          </button>

                          <button
                            onClick={() => addSceneAfter(sceneIdx)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs border border-emerald-500/50"
                          >
                            +
                          </button>

                          <button
                            onClick={() => deleteScene(sceneIdx)}
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs border border-rose-500/50"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          collapsedScenes[sceneIdx]
                            ? "max-h-0 opacity-0"
                            : "max-h-[1500px] opacity-100"
                        }`}
                      >
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Duration (Frames)</label>
                              <input
                                type="number"
                                value={scene.durationFrames || ""}
                                onChange={(e) => updateSceneMeta(sceneIdx, "durationFrames", Number(e.target.value))}
                                className="w-full p-2 bg-black border border-neutral-800 rounded-lg text-xs font-medium text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Widget Class</label>
                              <select
                                value={scene.widget || DEFAULT_WIDGET_TYPE}
                                onChange={(e) => updateWidgetType(sceneIdx, e.target.value)}
                                className="w-full p-2 bg-black border border-neutral-800 rounded-lg text-xs font-medium text-neutral-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              >
                                {DYNAMIC_WIDGET_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {scene.props && (
                            <div className="pt-2 border-t border-neutral-800 space-y-2 bg-black/50 p-2.5 rounded-lg mt-3 border">
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-emerald-400">
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
                                      <label className="block text-[10px] font-medium text-neutral-400 mb-0.5">
                                        {schemaField?.label ?? propKey}
                                      </label>

                                      {schemaField?.kind === "select" ? (
                                        <select
                                          id={fieldId}
                                          value={String(rawValue ?? "")}
                                          onChange={(e) => updateWidgetProp(sceneIdx, propKey, e.target.value)}
                                          className="w-full p-1.5 bg-[#1e1e1e] border border-neutral-800 rounded text-xs text-neutral-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        >
                                          {(schemaField.options ?? []).map((option) => (
                                            <option key={option} value={option}>
                                              {option}
                                            </option>
                                          ))}
                                        </select>
                                      ) : schemaField?.kind === "boolean" ? (
                                        <label className="flex items-center gap-2 rounded border border-neutral-800 bg-[#1e1e1e] px-2 py-1.5 text-xs text-neutral-200">
                                          <input
                                            id={fieldId}
                                            type="checkbox"
                                            checked={Boolean(rawValue)}
                                            onChange={(e) => updateWidgetProp(sceneIdx, propKey, e.target.checked)}
                                            className="accent-emerald-500"
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
                                            className="h-8 w-10 rounded border border-neutral-800 bg-[#1e1e1e] p-0.5 cursor-pointer"
                                          />
                                          <input
                                            type="text"
                                            value={String(rawValue || "")}
                                            onChange={(e) => updateWidgetProp(sceneIdx, propKey, e.target.value)}
                                            className="w-full p-1.5 bg-[#1e1e1e] border border-neutral-800 rounded text-xs font-mono text-neutral-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                          />
                                        </div>
                                      ) : schemaField?.kind === "number" ? (
                                        <input
                                          id={fieldId}
                                          type="number"
                                          value={rawValue ?? ""}
                                          onChange={(e) => updateWidgetProp(sceneIdx, propKey, Number(e.target.value))}
                                          className="w-full p-1.5 bg-[#1e1e1e] border border-neutral-800 rounded text-xs font-mono text-neutral-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
                                          className="w-full p-1.5 bg-[#1e1e1e] border border-neutral-800 rounded text-xs font-mono text-neutral-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        />
                                      ) : schemaField?.kind === "json" || (rawValue && typeof rawValue === "object") ? (
                                        <textarea
                                          value={JSON.stringify(rawValue ?? {}, null, 2)}
                                          onChange={(e) => {
                                            try {
                                              updateWidgetProp(sceneIdx, propKey, JSON.parse(e.target.value));
                                            } catch {
                                              // Retain text state until parsed
                                            }
                                          }}
                                          className="w-full min-h-[90px] p-1.5 bg-[#1e1e1e] border border-neutral-800 rounded text-xs font-mono text-neutral-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        />
                                      ) : (
                                        <input
                                          id={fieldId}
                                          type="text"
                                          value={rawValue ?? ""}
                                          onChange={(e) => updateWidgetProp(sceneIdx, propKey, e.target.value)}
                                          className="w-full p-1.5 bg-[#1e1e1e] border border-neutral-800 rounded text-xs text-neutral-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
                className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/10 bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:shadow-none flex items-center justify-center gap-2"
              >
                <span>Refresh Animation</span>
              </button>

              <RenderAndSaveButtons 
                rawText={transcription?.text || currentActiveScript}
                sceneConfig={sceneConfig}
                projectId={currentJobId || undefined}
              />
            </div>

          </div>

          <div className="clear-both" />
          
        </div>
      </section>
    </main>
  );
}