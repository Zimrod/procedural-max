import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const tonesPath = path.join(process.cwd(), "src/lotties/tones.json");
const metadataPath = path.join(process.cwd(), "src/lotties/metadata.json");
const lottieFolder = path.join(process.cwd(), "src/lotties");

export async function POST(req: NextRequest) {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const tones = JSON.parse(formData.get("tones") as string) as string[];
      const duration = parseFloat(formData.get("duration") as string);
      const frameRate = parseFloat(formData.get("frameRate") as string);
  
      if (!file || !tones.length || isNaN(duration) || isNaN(frameRate)) {
        return NextResponse.json({ error: "Missing or invalid data" }, { status: 400 });
      }
  
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const fileName = file.name;
      const savePath = path.join(lottieFolder, fileName);

      fs.writeFileSync(savePath, bytes);
  
      function readAndParseJSON(filePath: string): any {
        if (!fs.existsSync(filePath)) {
          return {};
        }
      
        const content = fs.readFileSync(filePath, "utf-8");
        if (!content.trim()) {
          // File exists but is empty
          return {};
        }
      
        try {
          return JSON.parse(content);
        } catch (err) {
          console.error(`Failed to parse JSON from ${filePath}`, err);
          return {};
        }
      }
      
      // Ensure tones.json and metadata.json exist
      if (!fs.existsSync(tonesPath)) fs.writeFileSync(tonesPath, JSON.stringify({}, null, 2));
      if (!fs.existsSync(metadataPath)) fs.writeFileSync(metadataPath, JSON.stringify({}, null, 2));
  
      const tonesData = readAndParseJSON(tonesPath);
      // Update tones
    //   const tonesData = JSON.parse(fs.readFileSync(tonesPath, "utf-8"));
      for (const tone of tones) {
        if (!tonesData[tone]) tonesData[tone] = [];
        if (!tonesData[tone].includes(fileName)) tonesData[tone].push(fileName);
      }
      fs.writeFileSync(tonesPath, JSON.stringify(tonesData, null, 2));
  
      // Update metadata
      const metadata = readAndParseJSON(metadataPath);
    //   const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
      metadata[fileName] = {
        duration,
        frameRate,
        tones,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  
      return NextResponse.json({
        message: "Lottie and tone mapping saved.",
        metadata: { fileName, duration, frameRate }
      });
  
    } catch (error) {
      console.error("Upload failed:", error);
      return NextResponse.json(
        { error: "Something went wrong while uploading the Lottie file" },
        { status: 500 }
      );
    };
    console.log("Received file:", file?.name);
    console.log("Tones:", tones);
    console.log("Duration:", duration);
    console.log("FrameRate:", frameRate);

  }
  