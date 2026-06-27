// worker/server.js
const express = require("express");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());

app.post("/api/execute-render", async (req, requireResponse) => {
  const { renderId, sceneConfig, callbackUrl } = req.body;
  
  // Acknowledge receipt to the main app instantly
  requireResponse.status(202).json({ status: "processing", renderId });

  try {
    console.log(`🎬 Starting cloud render job: ${renderId}`);
    
    // 1. Point to your main Remotion entry file 
    const entryPoint = path.resolve(__dirname, "../src/remotion/index.ts"); 
    const compositionId = "MainVideoComposition"; // Your Remotion composition ID

    // 2. Build the bundle asset matrix 
    const bundleLocation = await bundle(entryPoint);

    // 3. Extract composition metrics dynamically
    const composition = await selectComposition({
      bundleLocation,
      id: compositionId,
      inputProps: { sceneConfig } // Pass down your custom user configurations
    });

    const outputFilePath = path.join(__dirname, `output-${renderId}.mp4`);

    // 4. Fire the headless engine to render frames and stitch audio
    await renderMedia({
      bundleLocation,
      composition,
      outputLocation: outputFilePath,
      codec: "h246",
      inputProps: { sceneConfig },
    });

    console.log(`✨ Render complete for ${renderId}. Uploading...`);

    // 5. UPLOAD TO CLOUD STORAGE (Example: Uploading via Supabase Client)
    // const videoUrl = await uploadToSupabaseBucket(outputFilePath, `${renderId}.mp4`);
    const mockCloudVideoUrl = `https://your-storage-bucket.com/renders/${renderId}.mp4`;

    // 6. HIT CALLBACK LINK: Tell the main web app or n8n that the asset is ready!
    if (callbackUrl) {
      await fetch(callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renderId, status: "completed", videoUrl: mockCloudVideoUrl })
      });
    }

    // Cleanup local file inside the container space
    fs.unlinkSync(outputFilePath);

  } catch (error) {
    console.error(`❌ Cloud Render Failure [${renderId}]:`, error);
    if (callbackUrl) {
      await fetch(callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renderId, status: "failed", error: error.message })
      });
    }
  }
});

app.listen(process.env.PORT || 8080, () => console.log("🚀 Cloud Render Worker Standing By..."));