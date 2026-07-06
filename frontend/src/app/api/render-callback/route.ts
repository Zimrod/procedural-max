// src/app/api/render-callback/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { renderId, status, videoUrl, error } = await req.json();

    if (status === "completed") {
      console.log(`🎉 Video ${renderId} is live at: ${videoUrl}`);
      // 1. Update Supabase project entry mapping status to 'Done'
      // 2. Push message via WebSockets or allow the polling UI component to capture completion
    } else {
      console.error(`✕ Job ${renderId} failed on the cloud node:`, error);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}