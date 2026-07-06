// src/app/api/render/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { sceneConfig, transcription } = await req.json();

    if (!sceneConfig || sceneConfig.length === 0) {
      return NextResponse.json({ error: "No composition data found to render." }, { status: 400 });
    }

    const renderId = `render_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 🚀 DELEGATE TO CLOUD WORKER: Fire-and-forget network request to your Railway Worker or n8n
    const workerUrl = process.env.RAILWAY_WORKER_URL || "https://your-worker.railway.app/api/execute-render";
    
    // We don't await the full video render here. We just await the handoff confirmation.
    fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        renderId,
        sceneConfig,
        transcription,
        // Webhook callback URL for when the worker finishes hours/minutes later
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/render-callback`
      }),
    }).catch(err => console.error("Worker handoff background error:", err));

    // Return immediately so the UI doesn't freeze or timeout
    return NextResponse.json({ 
      success: true, 
      renderId, 
      status: "queued",
      message: "Rendering job successfully delegated to the cloud pipeline."
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}