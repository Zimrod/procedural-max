// src/types/schema.ts
import { z } from "zod";

// Use an explicit type import to bypass implicit 'any' resolutions
import { CompositionProps } from "./constants.js";

export const RenderRequest = z.object({
  id: z.string(), // Remotion Composition Name (e.g., "MainScene")
  projectId: z.string().optional(), // 👈 Explicitly for your Supabase row query
  inputProps: CompositionProps.optional(),
});

export const ProgressRequest = z.object({
  bucketName: z.string(),
  id: z.string(),
});

export type ProgressResponse =
  | {
      type: "error";
      message: string;
    }
  | {
      type: "progress";
      progress: number;
    }
  | {
      type: "done";
      url: string;
      size: number;
    };