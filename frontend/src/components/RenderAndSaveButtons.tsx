// src/components/RenderAndSaveButtons.tsx
import React, { useState } from "react";

type RenderAndSaveButtonsProps = {
  readonly rawText: string;
  readonly sceneConfig: any[];
  readonly projectId?: string; // 👈 Add the active project UUID pointer from your state
};

export const RenderAndSaveButtons: React.FC<RenderAndSaveButtonsProps> = ({ 
  rawText, 
  sceneConfig,
  projectId 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false); // 👈 Track render state
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [renderStatus, setRenderStatus] = useState<"idle" | "rendering" | "success" | "error">("idle");

  const isProductionMode = true;
  const isPopulated = sceneConfig && sceneConfig.length > 0;

  // 🎬 Trigger AWS Lambda Serverless Render
  const handleLambdaRender = async () => {
    if (!isPopulated || !projectId) {
      console.warn("⚠️ Cannot initiate render: Missing populated scenes or a valid project ID.");
      return;
    }

    setIsRendering(true);
    setRenderStatus("rendering");

    try {
      // 🌐 Dynamically resolve target server address to eliminate local mapping bugs
      const API = process.env.NEXT_PUBLIC_API_BASE_URL!.replace(/\/$/, "");
      
      const response = await fetch(`${API}/render/lambda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) throw new Error("AWS Lambda orchestration hook rejected dispatch request.");
      
      const data = await response.json();
      console.log("🚀 Serverless render kicked off successfully:", data);
      setRenderStatus("success");
    } catch (err) {
      console.error("Serverless render initialization failed:", err);
      setRenderStatus("error");
    } finally {
      setIsRendering(false);
    }
  };

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
        disabled={!isPopulated || isRendering}
        style={{
          width: "100%",
          padding: "14px",
          background: !isPopulated ? "#f1f5f9" : isRendering ? "#64748b" : "#0f172a",
          color: isPopulated ? "#ffffff" : "#94a3b8",
          border: isPopulated ? "none" : "1px solid #e2e8f0",
          borderRadius: "12px",
          fontSize: "0.75rem",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          cursor: (isPopulated && !isRendering) ? "pointer" : "not-allowed",
          marginBottom: "10px",
          transition: "all 0.2s ease",
          boxShadow: isPopulated && !isRendering ? "0 4px 6px -1px rgb(0 0 0 / 0.1)" : "none"
        }}
        onClick={handleLambdaRender}
      >
        {isRendering ? "⚡ Dispatching to the Cloud..." : "🎬 Render Animation"}
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

      {/* RAG Save Alerts */}
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

      {/* ⚙️ Lambda Render Telemetry Alerts */}
      {renderStatus === "success" && (
        <p style={{ color: "#22c55e", fontSize: "11px", marginTop: "4px", textAlign: "center", fontWeight: "500" }}>
          🚀 Render instance running on AWS Lambda. Stitched file processing initiated.
        </p>
      )}
      {renderStatus === "error" && (
        <p style={{ color: "#dc2626", fontSize: "11px", marginTop: "4px", textAlign: "center", fontWeight: "500" }}>
          ✕ Serverless invocation failed. Verify backend logs and S3 cluster sync states.
        </p>
      )}
    </div>
  );
};