import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const tonesPath = path.join(process.cwd(), "src/lotties/tones.json");
const metadataPath = path.join(process.cwd(), "src/lotties/metadata.json");
const lottieFolder = path.join(process.cwd(), "src/lotties");

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const tones = JSON.parse(formData.get("tones") as string) as string[];

  if (!file || !tones.length) {
    return NextResponse.json({ error: "Missing file or tones" }, { status: 400 });
  }

  // Read and parse the Lottie file to extract metadata
  const fileContent = await file.text();
    let duration: number;
    let frameRate: number;
  
  try {
    const lottieData = JSON.parse(fileContent);
    if (lottieData.op && lottieData.ip && lottieData.fr) {
      duration = (lottieData.op - lottieData.ip) / lottieData.fr;
      frameRate = lottieData.fr;
    }
  } catch (e) {
    console.warn("Couldn't parse Lottie metadata", e);
  }

  // Save the Lottie file
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = file.name;
  const savePath = path.join(lottieFolder, fileName);
  fs.writeFileSync(savePath, buffer);

  // Ensure tones.json exists
  if (!fs.existsSync(tonesPath)) {
    fs.writeFileSync(tonesPath, JSON.stringify({}, null, 2));
  }

  // Ensure metadata.json exists
  if (!fs.existsSync(metadataPath)) {
    fs.writeFileSync(metadataPath, JSON.stringify({}, null, 2));
  }

  // Update tones mapping
  const tonesData = JSON.parse(fs.readFileSync(tonesPath, "utf-8"));
  for (const tone of tones) {
    if (!tonesData[tone]) tonesData[tone] = [];
    if (!tonesData[tone].includes(fileName)) {
      tonesData[tone].push(fileName);
    }
  }
  fs.writeFileSync(tonesPath, JSON.stringify(tonesData, null, 2));

  // Update metadata
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
  metadata[fileName] = {
    duration,
    frameRate,
    tones, // Store tones here as well for easy lookup
    lastUpdated: new Date().toISOString()
  };
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  return NextResponse.json({ 
    message: "Lottie and tone mapping saved.",
    metadata: {
      fileName,
      duration,
      frameRate
    }
  });
}