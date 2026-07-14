// src/components/RenderAndSaveButtons.tsx
import React, { useState } from "react";

type RenderAndSaveButtonsProps = {
  readonly rawText: string;
  readonly sceneConfig: any[];
  readonly projectId?: string; 
};

export const RenderAndSaveButtons: React.FC<RenderAndSaveButtonsProps> = ({ 
  rawText, 
  sceneConfig,
  projectId 
}) => {
  const [isRendering, setIsRendering] = useState(false); 
  const [renderStatus, setRenderStatus] = useState<"idle" | "rendering" | "success" | "error">("idle");

  const isPopulated = sceneConfig && sceneConfig.length > 0;

  const handleLambdaRender = async () => {
    if (!isPopulated || !projectId) {
      console.warn("⚠️ Cannot initiate render: Missing populated scenes or a valid project ID.");
      return;
    }

    setIsRendering(true);
    setRenderStatus("rendering");

    try {
      const API = process.env.NEXT_PUBLIC_API_BASE_URL!.replace(/\/$/, "");
      
      // Send both the render directives AND the configuration data to be saved in one transaction
      const response = await fetch(`${API}/render/lambda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectId,
          sceneConfig, // Fastify backend intercepts this and updates Supabase
          rawText
        }),
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

  return (
    <div style={{ marginTop: "12px", width: "100%" }}>
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
        {isRendering ? "⚡ Saving & Rendering..." : "🎬 Render Animation"}
      </button>

      {renderStatus === "success" && (
        <p style={{ color: "#22c55e", fontSize: "11px", marginTop: "4px", textAlign: "center", fontWeight: "500" }}>
          🚀 Saved & dispatched to AWS Lambda successfully!
        </p>
      )}
      {renderStatus === "error" && (
        <p style={{ color: "#dc2626", fontSize: "11px", marginTop: "4px", textAlign: "center", fontWeight: "500" }}>
          ✕ Serverless invocation or database save failed. Verify backend terminal logs.
        </p>
      )}
    </div>
  );
};