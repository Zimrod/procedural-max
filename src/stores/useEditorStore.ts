// src/stores/useEditorStore.ts
import create from 'zustand';

// 🚀 Fix: Define the structural interfaces expected by your store collections
export interface MediaClip {
  id: string;
  type: string;
  startFrame: number;
  durationFrames: number;
  props?: Record<string, any>;
}

export interface Caption {
  id: string;
  text: string;
  startSec?: number;
  endSec?: number;
}

type EditorState = {
  currentFrame: number;
  clips: MediaClip[];
  captions: Caption[];
  setCurrentFrame: (frame: number) => void;
  addClip: (clip: MediaClip) => void;
  updateCaption: (id: string, text: string) => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  currentFrame: 0,
  clips: [],
  captions: [],
  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  addClip: (clip) => set((state) => ({ clips: [...state.clips, clip] })),
  updateCaption: (id, text) => set((state) => ({
    captions: state.captions.map(c => 
      c.id === id ? { ...c, text } : c
    )
  }))
}));