"use client";

import { CompositionTheme, COMPOSITION_THEME_FIELDS, COMPOSITION_THEME_PRESETS } from "../types/theme";

interface ThemeEditorProps {
  themePresetId: string;
  themeConfig: CompositionTheme;
  selectThemePreset: (id: string) => void;
  updateThemeProp: <K extends keyof CompositionTheme>(key: K, value: CompositionTheme[K]) => void;
}

export function ThemeEditor({ themePresetId, themeConfig, selectThemePreset, updateThemeProp }: ThemeEditorProps) {
  return (
    <div className="flex-1 overflow-y-auto pr-1">
      <div className="mb-3 flex flex-wrap gap-2">
        {COMPOSITION_THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => selectThemePreset(preset.id)}
            className={`rounded-md border px-3 py-1 text-[10px] font-bold uppercase transition-all ${
              themePresetId === preset.id ? "border-emerald-500 bg-emerald-600 text-white" : "border-neutral-800 bg-[#141414] text-neutral-400"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3">
        {COMPOSITION_THEME_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">{field.label}</label>
            {field.kind === "color" ? (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={String(themeConfig[field.key])}
                  onChange={(e) => updateThemeProp(field.key, e.target.value as any)}
                  className="h-10 w-11 rounded-lg border border-neutral-800 bg-[#141414] p-1 cursor-pointer"
                />
                <input
                  type="text"
                  value={String(themeConfig[field.key])}
                  onChange={(e) => updateThemeProp(field.key, e.target.value as any)}
                  className="w-full rounded-lg border border-neutral-800 bg-[#141414] px-3 py-2 text-xs text-neutral-200 font-mono"
                />
              </div>
            ) : (
              <input
                type={field.kind === "number" ? "number" : "text"}
                value={String(themeConfig[field.key])}
                onChange={(e) => updateThemeProp(field.key, (field.kind === "number" ? Number(e.target.value) : e.target.value) as any)}
                className="w-full rounded-lg border border-neutral-800 bg-[#141414] px-3 py-2 text-xs text-neutral-200"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
