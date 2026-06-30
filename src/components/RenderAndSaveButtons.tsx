// src/components/RenderAndSaveButtons.tsx
import React, { useState } from "react";

type RenderAndSaveButtonsProps = {
  readonly rawText: string;
  readonly sceneConfig: any[];
};

export const RenderAndSaveButtons: React.FC<RenderAndSaveButtonsProps> = ({ rawText, sceneConfig }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // const isProductionMode = process.env.NODE_ENV === "production";
  const isProductionMode = true;
  
  // 🚀 VALIDATION RULE: The panel is populated if sceneConfig exists and has active scenes
  const isPopulated = sceneConfig && sceneConfig.length > 0;
  console.log('Is sceneConfig populated: ', sceneConfig);
  

  const handleSaveToSupabase = async () => {
    if (isProductionMode || !isPopulated) return;
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const response = await fetch("/api/save-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "SaaS Promotion Video Asset",
          rawText: rawText,
          sceneConfig: sceneConfig,
        }),
      });

      if (!response.ok) throw new Error("Failed to secure network payload update.");
      setSaveStatus("success");
    } catch (err) {
      console.error("Database persistence failure:", err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ marginTop: "12px", width: "100%" }}>
      {/* 🎬 Render Animation Action Trigger */}
      <button
        disabled={!isPopulated}
        style={{
          width: "100%",
          padding: "14px",
          background: isPopulated ? "#0f172a" : "#f1f5f9",
          color: isPopulated ? "#ffffff" : "#94a3b8",
          border: isPopulated ? "none" : "1px solid #e2e8f0",
          borderRadius: "12px",
          fontSize: "0.75rem",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          cursor: isPopulated ? "pointer" : "not-allowed",
          marginBottom: "10px",
          transition: "all 0.2s ease",
          boxShadow: isPopulated ? "0 4px 6px -1px rgb(0 0 0 / 0.1)" : "none"
        }}
        onClick={() => console.log("Invoking Remotion Render Core with active items:", sceneConfig)}
      >
        🎬 Render Animation
      </button>

      {/* ☁️ Save to Supabase Cloud Storage Action Trigger */}
      {!isProductionMode && (
        <button
          disabled={isSaving || !isPopulated}
          style={{
            width: "100%",
            padding: "14px",
            background: !isPopulated ? "#f8fafc" : isSaving ? "#64748b" : "#22c55e",
            color: isPopulated ? "#ffffff" : "#94a3b8",
            border: isPopulated ? "none" : "1px solid #e2e8f0",
            borderRadius: "12px",
            fontSize: "0.75rem",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            cursor: (isSaving || !isPopulated) ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            boxShadow: isPopulated && !isSaving ? "0 4px 6px -1px rgb(34 197 94 / 0.2)" : "none"
          }}
          onClick={handleSaveToSupabase}
        >
          {isSaving ? "⚡ Saving Embeddings..." : "☁️ Save to Supabase"}
        </button>
      )}

      {/* Dynamic Operational Success/Error Feedback Alerts */}
      {saveStatus === "success" && (
        <p style={{ color: "#16a34a", fontSize: "11px", marginTop: "8px", textAlign: "center", fontWeight: "500" }}>
          ✓ Track configuration layout and vector metrics synced to cloud storage.
        </p>
      )}
      {saveStatus === "error" && (
        <p style={{ color: "#dc2626", fontSize: "11px", marginTop: "8px", textAlign: "center", fontWeight: "500" }}>
          ✕ Persistent transfer execution failed. Reference backend terminal reports.
        </p>
      )}
    </div>
  );
};