"use client";

import { useState, useMemo, useRef, useEffect, ChangeEvent } from "react";
import { PlayerRef } from "@remotion/player";
import { DEFAULT_COMPOSITION_THEME, COMPOSITION_THEME_PRESETS, applyThemeToScenes, applyThemeToWidgetProps, mergeTheme, CompositionTheme } from "../types/theme";
import { getWidgetDefinition, widgetRegistry } from "../core/widgetRegistry";
import { Navbar, RenderedVideoItem } from "../components/Navbar";

import { ScriptSidebar } from "../components/ScriptSidebar";
import { PreviewPlayer } from "../components/PreviewPlayer";
import { SceneEditor } from "../components/SceneEditor";
import { ThemeEditor } from "../components/ThemeEditor";
import { Dashboard } from "../components/dashboard/Dashboard";
import { AudioConfig } from "../graphics/AudioLayers";

const DYNAMIC_WIDGET_OPTIONS = Object.keys(widgetRegistry);
const DEFAULT_WIDGET_TYPE = DYNAMIC_WIDGET_OPTIONS[0] || "";
const ASPECT_RATIOS = [
  { label: "16:9", value: 16 / 9 },
  { label: "1:1", value: 1 },
  { label: "9:16", value: 9 / 16 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
];

const ensureSceneId = (scene: any, index: number) => ({
  ...scene,
  id: scene.id ?? scene.entityId ?? scene.sceneId ?? `${scene.widget || scene.widgetType || "asset"}_${index + 1}`,
});

function normalizeSceneTiming(scene: any) {
  const startFrame = Math.max(0, Number(scene.startFrame ?? scene.start ?? 0));
  const endValue = scene.endFrame ?? scene.end;
  const durationFrames = Math.max(
    1,
    Number(scene.durationFrames ?? scene.durationInFrames ?? scene.duration ?? (
      endValue === undefined ? 90 : Number(endValue) - startFrame
    ))
  );
  const endFrame = Number(endValue ?? startFrame + durationFrames);

  return {
    ...scene,
    startFrame,
    start: startFrame,
    durationFrames,
    durationInFrames: durationFrames,
    duration: durationFrames,
    endFrame,
    end: endFrame,
  };
}

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
  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
    voUrl: "",
    voVolume: 1,
    voStartFrame: 0,
    voDurationFrames: 0,
    bgmUrl: "",
    bgmVolume: 0.3,
    bgmStartFrame: 0,
    bgmDurationFrames: 0,
    masterVolume: 1,
    autoDucking: true,
  });

  const [activeLoading, setActiveLoading] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<any>(null);
  const [renders, setRenders] = useState<RenderedVideoItem[]>([]);

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

  const previewSceneConfig = useMemo(() => {
    const source = localConfig.length > 0 ? localConfig : sceneConfig;
    return source.map(normalizeSceneTiming);
  }, [localConfig, sceneConfig]);

  useEffect(() => {
    if (sceneConfig && sceneConfig.length > 0) {
      setLocalConfig(JSON.parse(JSON.stringify(sceneConfig)).map(ensureSceneId));
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

  useEffect(() => {
    setAudioConfig((current) => current.voUrl === currentActiveAudio
      ? current
      : { ...current, voUrl: currentActiveAudio });
  }, [currentActiveAudio]);

  const handleApplyConfigRefresh = () => {
    setSceneConfig(JSON.parse(JSON.stringify(localConfig.map(normalizeSceneTiming))));
    
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
    setLocalConfig((scenes) => scenes.map((scene, sceneIndex) => (
      sceneIndex === index ? { ...scene, [key]: value } : scene
    )));
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
    setLocalConfig((scenes) => scenes.map((scene, sceneIndex) => (
      sceneIndex === index
        ? { ...scene, props: { ...scene.props, [propKey]: value } }
        : scene
    )));
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

  const handleRenderComplete = (render: RenderedVideoItem) => {
    setRenders((current) => [render, ...current.filter((item) => item.id !== render.id)]);
  };

  const groupedWidgets = useMemo(() => {
    const filtered = DYNAMIC_WIDGET_OPTIONS.filter((w) => w.toLowerCase().includes(widgetSearch.toLowerCase()));
    const categoryLabels: Record<string, string> = {
      TEXT_TYPOGRAPHY: "Typography",
      DATA_REPORTING: "Data Visualization",
      GEOGRAPHY: "Geography",
      INDUSTRIAL: "Industrial",
    };

    const groups = filtered.reduce((acc, w) => {
      const registryCategory = getWidgetDefinition(w)?.category ?? "TEXT_TYPOGRAPHY";
      const cat = categoryLabels[registryCategory] ?? "Typography";
      acc[cat] = acc[cat] ? [...acc[cat], w] : [w];
      return acc;
    }, {} as Record<string, string[]>);

    if (!widgetSearch.trim()) {
      Object.assign(groups, {
        Geography: ["COUNTRY_FOCUS", "COUNTRY_ROUTE", "COUNTRY_DROP_PIN"],
        Finance: ["Stock Ticker", "Portfolio Breakdown", "Financial KPI"],
        Industrial: ["PALLET", "OIL_DRUM"],
        Medical: ["Patient Journey", "Health Metric", "Anatomy Callout"],
        Education: ["Lesson Timeline", "Knowledge Map", "Quiz Progress"],
      });
    }

    return groups;
  }, [widgetSearch]);

  return (
    <main className="h-screen w-full bg-[#121212] text-gray-100 antialiased flex flex-col overflow-hidden">
      <Navbar renders={renders} />

      <div className="flex-1 w-full max-w-none mx-0 px-0 py-3 overflow-hidden">
        <div className="h-full w-full flex flex-col lg:flex-row gap-2 overflow-hidden">
          {/* First Column: ScriptSidebar (380px width) */}
          <div className="w-full lg:w-[380px] shrink-0 h-full overflow-y-auto">
            <ScriptSidebar
              leftTab={leftTab} setLeftTab={setLeftTab} prompt={prompt} setPrompt={setPrompt}
              aiScript={aiScript} setAiScript={setAiScript} customScript={customScript} setCustomScript={setCustomScript}
              uploadedScript={uploadedScript} setUploadedScript={setUploadedScript} aiAudioUrl={aiAudioUrl} aiAudioVersion={aiAudioVersion}
              customAudioUrl={customAudioUrl} customAudioVersion={customAudioVersion} uploadedAudioUrl={uploadedAudioUrl} uploadedAudioVersion={uploadedAudioVersion}
              activeLoading={activeLoading} currentJobId={currentJobId} pipelineResult={pipelineResult} currentActiveScript={currentActiveScript}
              handleGenerateScript={handleGenerateScript} handleFileUpload={handleFileUpload} handleGenerateVoiceover={handleGenerateVoiceover} handleRenderAnimation={handleRenderAnimation}
              onOpenDashboard={() => setDashboardOpen(true)}
            />
          </div>

          {/* Center & Right Column Container */}
          <div className="flex-1 h-full flex flex-col xl:flex-row gap-2 min-w-0 overflow-hidden">
            {/* Center Column: PreviewPlayer (Scrollable) */}
            <div className="flex-1 h-full overflow-y-auto pr-1">
              <PreviewPlayer
                playerRef={playerRef} selectedAspect={selectedAspect} setSelectedAspect={setSelectedAspect} aspectRatios={ASPECT_RATIOS}
                sceneConfig={previewSceneConfig} inputProps={{ audioUrl: currentActiveAudio, scenes: previewSceneConfig, captions: transcription?.words ?? [], theme: themeConfig }}
                totalDurationInFrames={previewSceneConfig.length
                  ? Math.max(...previewSceneConfig.map((scene) => scene.endFrame))
                  : 300}
                themeConfig={themeConfig}
                onScenesChange={setLocalConfig}
                audioConfig={audioConfig}
                onAudioConfigChange={setAudioConfig}
              />
            </div>

            {/* Third Column: Scene / Theme Editor Panel (420px width) */}
            <div className="w-full xl:w-[calc(420px+5.5rem+max(0px,100vw-1700px))] shrink-0 bg-[#1e1e1e] rounded-lg border border-neutral-800 p-4 flex flex-col h-full overflow-y-auto">
              <div className="flex border border-neutral-800 mb-3 p-1 bg-[#141414] rounded-md shrink-0">
                <button
                  onClick={() => setRightPanelTab("scene")}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-sm transition-all ${rightPanelTab === "scene" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-neutral-400 hover:text-neutral-200"}`}
                >Scene Config</button>
                <button
                  onClick={() => setRightPanelTab("theme")}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-sm transition-all ${rightPanelTab === "theme" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-neutral-400 hover:text-neutral-200"}`}
                >Theme Config</button>
              </div>

              {rightPanelTab === "scene" ? (
                <SceneEditor
                  localConfig={localConfig} sceneConfig={previewSceneConfig} collapsedScenes={collapsedScenes} isDirty={isDirty}
                  rawText={transcription?.text || currentActiveScript} currentJobId={currentJobId}
                  toggleSceneCollapse={(i) => setCollapsedScenes((p) => ({ ...p, [i]: !p[i] }))}
                  moveSceneUp={(i) => i > 0 && setLocalConfig((c) => { const n = [...c]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}
                  moveSceneDown={(i) => i < localConfig.length - 1 && setLocalConfig((c) => { const n = [...c]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })}
                  addSceneAfter={(i) => setLocalConfig((c) => { const n = [...c]; n.splice(i + 1, 0, { id: `${DEFAULT_WIDGET_TYPE}_${Date.now()}`, widget: DEFAULT_WIDGET_TYPE, startFrame: 0, durationFrames: 90, props: {} }); return n; })}
                  deleteScene={(i) => setLocalConfig((c) => c.filter((_, idx) => idx !== i))} updateSceneMeta={updateSceneMeta} updateWidgetType={updateWidgetType}
                  updateWidgetProp={updateWidgetProp} handleApplyConfigRefresh={handleApplyConfigRefresh} widgetOptions={DYNAMIC_WIDGET_OPTIONS}
                  defaultWidgetType={DEFAULT_WIDGET_TYPE} setDashboardOpen={setDashboardOpen} aspectRatio={selectedAspect.value}
                  onRenderComplete={handleRenderComplete}
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
        groupedWidgets={groupedWidgets} filteredWidgets={DYNAMIC_WIDGET_OPTIONS} themeConfig={themeConfig} setLocalConfig={setLocalConfig} renders={renders}
      />
    </main>
  );
}
