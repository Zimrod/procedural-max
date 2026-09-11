// src/components/RenderAndSaveButtons.tsx
import React, { useState } from "react";

type RenderAndSaveButtonsProps = {
  readonly rawText: string;
  readonly sceneConfig: any[];
  readonly projectId?: string; 
  readonly aspectRatio?: number;
};

export const RenderAndSaveButtons: React.FC<RenderAndSaveButtonsProps> = ({ 
  rawText, 
  sceneConfig,
  projectId,
  aspectRatio = 16 / 9,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoName, setVideoName] = useState("");
  const [isRendering, setIsRendering] = useState(false); 
  const [renderStatus, setRenderStatus] = useState<"idle" | "rendering" | "success" | "error">("idle");

  const isPopulated = sceneConfig && sceneConfig.length > 0;

  const handleOpenModal = () => {
    if (!isPopulated) return;
    setVideoName(rawText?.slice(0, 30) || "");
    setIsModalOpen(true);
  };

  const handleLambdaRender = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isPopulated) return;

    const finalTitle = videoName.trim() || "Untitled Render";
    const sanitizedFileName = `${finalTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp4`;

    setIsModalOpen(false);
    setIsRendering(true);
    setRenderStatus("rendering");

    try {
      const API = process.env.NEXT_PUBLIC_API_BASE_URL!.replace(/\/$/, "");
      
      const response = await fetch(`${API}/render/lambda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: "MainScene",
          projectId,
          title: finalTitle,
          sceneConfig,
          rawText,
          inputProps: {
            title: finalTitle,
            scene_config: sceneConfig,
            aspectRatio,
          },
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "AWS Lambda orchestration hook rejected dispatch request.");
      }
      
      const data = await response.json();
      console.log("🚀 Serverless render kicked off successfully:", data);
      setRenderStatus("success");

      // Resolve final S3 download URL
      const downloadUrl =
        data.url ||
        `https://${data.bucketName || "remotionlambda-useast1-u8m4fsf2at"}.s3.us-east-1.amazonaws.com/renders/${data.renderId}/${encodeURIComponent(sanitizedFileName)}`;

      // Programmatically trigger immediate automatic browser download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", sanitizedFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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
          background: "#326597",
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
        onClick={handleOpenModal}
      >
        {isRendering ? "⚡ Saving & Rendering..." : "🎬 Render Animation"}
      </button>

      {renderStatus === "success" && (
        <p style={{ color: "#22c55e", fontSize: "11px", marginTop: "4px", textAlign: "center", fontWeight: "500" }}>
          🚀 Saved, rendered & downloaded successfully!
        </p>
      )}
      {renderStatus === "error" && (
        <p style={{ color: "#dc2626", fontSize: "11px", marginTop: "4px", textAlign: "center", fontWeight: "500" }}>
          ✕ Serverless invocation or database save failed. Verify backend terminal logs.
        </p>
      )}

      {/* Light Theme Video Naming Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
              Name Your Render
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Specify a title for this video before initiating the render process.
            </p>

            <form onSubmit={handleLambdaRender} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-600">
                    Video Title
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {videoName.length}/30
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={30}
                  value={videoName}
                  onChange={(e) => setVideoName(e.target.value)}
                  placeholder="Enter video name..."
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!videoName.trim()}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 transition"
                >
                  Confirm & Render
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};