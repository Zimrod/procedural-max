// src/app/api/metadata/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const metadataPath = path.join(process.cwd(), "src/lotties/metadata.json");

export async function GET() {
  try {
    const content = fs.readFileSync(metadataPath, "utf-8");
    const metadata = JSON.parse(content || "{}");

    const res = NextResponse.json(metadata);
    res.headers.set("Access-Control-Allow-Origin", "*"); // Allow all origins (or restrict to specific)
    res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    return res;
  } catch (error) {
    console.error("Failed to read metadata:", error);
    const res = NextResponse.json({}, { status: 500 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    return res;
  }
}

// Also handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
