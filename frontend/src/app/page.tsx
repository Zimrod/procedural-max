"use client";

import { useState, useMemo, useRef, useEffect, ChangeEvent } from "react";
import { PlayerRef } from "@remotion/player";
import { DEFAULT_COMPOSITION_THEME, COMPOSITION_THEME_PRESETS, applyThemeToScenes, applyThemeToWidgetProps, mergeTheme, CompositionTheme } from "../types/theme";
import { getWidgetDefinition, widgetRegistry } from "../core/widgetRegistry";
import { Navbar } from "../components/Navbar";

import { ScriptSidebar } from "../components/ScriptSidebar";
import { PreviewPlayer } from "../components/PreviewPlayer";
import { SceneEditor } from "../components/SceneEditor";
import { ThemeEditor } from "../components/ThemeEditor";
import { Dashboard } from "../components/dashboard/Dashboard";

const DYNAMIC_WIDGET_OPTIONS = Object.keys(widgetRegistry);
const DEFAULT_WIDGET_TYPE = DYNAMIC_WIDGET_OPTIONS[0] || "";
const ASPECT_RATIOS = [
  { label: "16:9", value: 16 / 9 },
  { label: "1:1", value: 1 },
  { label: "9:16", value: 9 / 16 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
];

export default function LandingPage() {
  const [prompt, setPrompt] = useState("");
  const [aiScript, setAiScript] = useState("");
  const [customScript, setCustomScript] = useState("");
  const [uploadedScript, setUploadedScript] = useState("");

  const [aiAudioUrl, setAiAudioUrl] = useState("");
  const [aiAudioVersion, setAiAudioVersion] = useState(0);
  const [customAudioUrl, setCustomAudioUrl] = useState("");
  const [customAudioVersion, setCustomAudioVersion] = useState(0);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState("");
  const [uploadedAudioVersion, setUploadedAudioVersion] = useState(0);

  const [activeLoading, setActiveLoading] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<any>(null);

  const [leftTab, setLeftTab] = useState<"generate" | "custom-script" | "upload-voiceover">("generate");
  const playerRef = useRef<PlayerRef>(null);
  const [transcription, setTranscription] = useState<any>(null);

  const [sceneConfig, setSceneConfig] = useState<any[]>([]);
  const [localConfig, setLocalConfig] = useState<any[]>([]);
  const [themeConfig, setThemeConfig] = useState<CompositionTheme>(
    mergeTheme(COMPOSITION_THEME_PRESETS.find((item) => item.id === "light-stroke")?.theme ?? DEFAULT_COMPOSITION_THEME)
  );
  const [themePresetId, setThemePresetId] = useState("light-stroke");
  const [collapsedScenes, setCollapsedScenes] = useState<Record<number, boolean>>({});

  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [selectedAspect, setSelectedAspect] = useState(ASPECT_RATIOS[0]);
  const [rightPanelTab, setRightPanelTab] = useState<"scene" | "theme">("scene");
  const [widgetSearch, setWidgetSearch] = useState("");

  const API = process.env.NEXT_PUBLIC_API_BASE_URL!.replace(/\/$/, "");

  const isDirty = useMemo(() => {
    return JSON.stringify(sceneConfig) !== JSON.stringify(localConfig);
  }, [sceneConfig, localConfig]);

  // The editor is a draft, but the preview should still respond while it is being edited.
  // Recalculate offsets here so inserted, removed, or reordered scenes remain contiguous.
  const previewSceneConfig = useMemo(() => {
    const source = localConfig.length > 0 ? localConfig : sceneConfig;
    let trackingFrame = 0;

    return source.map((scene) => {
      const durationFrames = Number(scene.durationFrames || 30);
      const previewScene = {
        ...scene,
        startFrame: trackingFrame,
        durationFrames,
      };
      trackingFrame += durationFrames;
      return previewScene;
    });
  }, [localConfig, sceneConfig]);

  useEffect(() => {
    if (sceneConfig && sceneConfig.length > 0) {
      setLocalConfig(JSON.parse(JSON.stringify(sceneConfig)));
    }
  }, [sceneConfig]);

  const currentActiveScript = useMemo(() => {
    if (leftTab === "generate") return aiScript;
    if (leftTab === "custom-script") return customScript;
    return uploadedScript;
  }, [leftTab, aiScript, customScript, uploadedScript]);

  const currentActiveAudio = useMemo(() => {
    let rawUrl = leftTab === "generate" ? aiAudioUrl : leftTab === "custom-script" ? customAudioUrl : uploadedAudioUrl;
    let version = leftTab === "generate" ? aiAudioVersion : leftTab === "custom-script" ? customAudioVersion : uploadedAudioVersion;
    if (!rawUrl) return "";
    return `${rawUrl.startsWith("http") ? rawUrl : `${API}${rawUrl}`}?v=${version}`;
  }, [leftTab, aiAudioUrl, aiAudioVersion, customAudioUrl, customAudioVersion, uploadedAudioUrl, uploadedAudioVersion, API]);

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

  const handleGenerateScript = async () => {
    if (!prompt.trim()) return;
    try {
      setActiveLoading("script");
      const res = await fetch(`${API}/script`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const data = await res.json();
      setAiScript(data.script);
    } finally {
      setActiveLoading(null);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setActiveLoading("uploading_audio");
      const formData = new FormData();
      formData.append("audio", file);
      if (currentJobId) formData.append("jobId", currentJobId);

      const res = await fetch(`${API}/voiceover/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setUploadedAudioUrl(data.audioUrl);
        setUploadedAudioVersion((v) => v + 1);
        setUploadedScript(data.transcript?.text || "");
        if (data.transcript) setTranscription(data.transcript);
        setCurrentJobId(data.jobId);
        setActiveLoading("assembling_scenes");
        startBackgroundSync(data.jobId);
      }
    } finally {
      setActiveLoading(null);
    }
  };

  const handleGenerateVoiceover = async () => {
    try {
      setActiveLoading("generating_audio");
      const res = await fetch(`${API}/voiceover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: currentActiveScript, jobId: currentJobId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        if (leftTab === "generate") {
          setAiAudioUrl(data.audioUrl);
          setAiAudioVersion((v) => v + 1);
        } else {
          setCustomAudioUrl(data.audioUrl);
          setCustomAudioVersion((v) => v + 1);
        }
        setCurrentJobId(data.jobId);
        setActiveLoading("assembling_scenes");
        startBackgroundSync(data.jobId);
      }
    } finally {
      setActiveLoading(null);
    }
  };

  const startBackgroundSync = async (jobId: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`${API}/voiceover/status/${jobId}`);
      const statusData = await res.json();
      if (statusData.status === "done") {
        clearInterval(interval);
        setPipelineResult(statusData.result);
        setActiveLoading(null);
      }
    }, 1500);
  };

  const handleRenderAnimation = async () => {
    if (!pipelineResult) return;
    setActiveLoading("animation");
    try {
      const { transcript, sceneConfig: incomingScenes } = pipelineResult;
      if (transcript) setTranscription({ text: currentActiveScript || transcript.text, words: transcript.words || [] });
      const sanitized = (incomingScenes || []).map((s: any) => ({ ...s, widget: s.widget || s.type || DEFAULT_WIDGET_TYPE }));
      setSceneConfig(applyThemeToScenes(sanitized, themeConfig));
    } finally {
      setActiveLoading(null);
    }
  };

  const updateSceneMeta = (index: number, key: string, value: any) => {
    const updated = [...localConfig];
    updated[index] = { ...updated[index], [key]: value };
    setLocalConfig(updated);
  };

  const updateWidgetType = (index: number, newType: string) => {
    const updated = [...localConfig];
    const definition = getWidgetDefinition(newType);
    updated[index] = {
      ...updated[index],
      widget: newType,
      props: applyThemeToWidgetProps(newType, definition?.defaultProps ?? {}, themeConfig),
    };
    setLocalConfig(updated);
  };

  const updateWidgetProp = (index: number, propKey: string, value: any) => {
    const updated = [...localConfig];
    updated[index] = { ...updated[index], props: { ...updated[index].props, [propKey]: value } };
    setLocalConfig(updated);
  };

  const updateThemeProp = <K extends keyof CompositionTheme>(key: K, value: CompositionTheme[K]) => {
    const nextTheme = mergeTheme({ ...themeConfig, [key]: value });
    setThemeConfig(nextTheme);
    setSceneConfig((scenes) => applyThemeToScenes(scenes, nextTheme));
    setLocalConfig((scenes) => applyThemeToScenes(scenes, nextTheme));
  };

  const selectThemePreset = (presetId: string) => {
    const preset = COMPOSITION_THEME_PRESETS.find((i) => i.id === presetId);
    if (!preset) return;
    setThemePresetId(preset.id);
    updateThemeProp("backgroundColor", preset.theme.backgroundColor);
  };

  const groupedWidgets = useMemo(() => {
    const filtered = DYNAMIC_WIDGET_OPTIONS.filter((w) => w.toLowerCase().includes(widgetSearch.toLowerCase()));
    return filtered.reduce((acc, w) => {
      const cat = w.includes("chart") ? "Charts" : "Text";
      acc[cat] = acc[cat] ? [...acc[cat], w] : [w];
      return acc;
    }, {} as Record<string, string[]>);
  }, [widgetSearch]);

  return (
    <main className="min-h-screen w-full bg-[#121212] text-gray-100 antialiased">
      {/* <Navbar title="Automated Motion Graphics" /> */}
      <Navbar />
      <div className="mx-auto max-w-[1700px] px-4 py-2 sm:px-6 lg:px-8 mt-2">
        <div className="w-full">
          <ScriptSidebar
            leftTab={leftTab} setLeftTab={setLeftTab} prompt={prompt} setPrompt={setPrompt}
            aiScript={aiScript} setAiScript={setAiScript} customScript={customScript} setCustomScript={setCustomScript}
            uploadedScript={uploadedScript} setUploadedScript={setUploadedScript} aiAudioUrl={aiAudioUrl} aiAudioVersion={aiAudioVersion}
            customAudioUrl={customAudioUrl} customAudioVersion={customAudioVersion} uploadedAudioUrl={uploadedAudioUrl} uploadedAudioVersion={uploadedAudioVersion}
            activeLoading={activeLoading} currentJobId={currentJobId} pipelineResult={pipelineResult} currentActiveScript={currentActiveScript}
            handleGenerateScript={handleGenerateScript} handleFileUpload={handleFileUpload} handleGenerateVoiceover={handleGenerateVoiceover} handleRenderAnimation={handleRenderAnimation}
            onOpenDashboard={() => setDashboardOpen(true)}
          />

          <div className="w-full lg:w-[calc(100%-445px)] lg:ml-[25px] mt-6 lg:mt-0 lg:float-left flex flex-col xl:flex-row gap-5">
            <PreviewPlayer
              playerRef={playerRef} selectedAspect={selectedAspect} setSelectedAspect={setSelectedAspect} aspectRatios={ASPECT_RATIOS}
              sceneConfig={previewSceneConfig} inputProps={{ audioUrl: currentActiveAudio, scenes: previewSceneConfig, captions: transcription?.words ?? [], theme: themeConfig }}
              totalDurationInFrames={previewSceneConfig.length ? previewSceneConfig[previewSceneConfig.length - 1].startFrame + previewSceneConfig[previewSceneConfig.length - 1].durationFrames : 300}
              themeConfig={themeConfig}
              onScenesChange={setLocalConfig}
            />

            <div className="w-full xl:w-[380px] bg-[#1e1e1e] rounded-2xl border border-neutral-800 p-4 flex flex-col max-h-[600px]">
              <div className="flex border border-neutral-800 mb-3 p-1 bg-[#141414] rounded-xl">
                <button
                  onClick={() => setRightPanelTab("scene")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    rightPanelTab === "scene" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Scene Config
                </button>
                <button
                  onClick={() => setRightPanelTab("theme")}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    rightPanelTab === "theme" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Theme Config
                </button>
              </div>

              {rightPanelTab === "scene" ? (
                <SceneEditor
                  localConfig={localConfig} sceneConfig={previewSceneConfig} collapsedScenes={collapsedScenes} isDirty={isDirty}
                  rawText={transcription?.text || currentActiveScript} currentJobId={currentJobId}
                  toggleSceneCollapse={(i) => setCollapsedScenes((p) => ({ ...p, [i]: !p[i] }))}
                  moveSceneUp={(i) => i > 0 && setLocalConfig((c) => { const n = [...c]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}
                  moveSceneDown={(i) => i < localConfig.length - 1 && setLocalConfig((c) => { const n = [...c]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })}
                  addSceneAfter={(i) => setLocalConfig((c) => { const n = [...c]; n.splice(i + 1, 0, { widget: DEFAULT_WIDGET_TYPE, startFrame: 0, durationFrames: 90, props: {} }); return n; })}
                  deleteScene={(i) => setLocalConfig((c) => c.filter((_, idx) => idx !== i))} updateSceneMeta={updateSceneMeta} updateWidgetType={updateWidgetType}
                  updateWidgetProp={updateWidgetProp} handleApplyConfigRefresh={handleApplyConfigRefresh} widgetOptions={DYNAMIC_WIDGET_OPTIONS}
                  defaultWidgetType={DEFAULT_WIDGET_TYPE} setDashboardOpen={setDashboardOpen}
                />
              ) : (
                <ThemeEditor themePresetId={themePresetId} themeConfig={themeConfig} selectThemePreset={selectThemePreset} updateThemeProp={updateThemeProp} />
              )}
            </div>
          </div>
        </div>
      </div>

      <Dashboard
        dashboardOpen={dashboardOpen} setDashboardOpen={setDashboardOpen} widgetSearch={widgetSearch} setWidgetSearch={setWidgetSearch}
        groupedWidgets={groupedWidgets} filteredWidgets={DYNAMIC_WIDGET_OPTIONS} themeConfig={themeConfig} setLocalConfig={setLocalConfig}
      />
    </main>
  );
}
