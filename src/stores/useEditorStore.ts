// src/stores/useEditorStore.ts
import create from 'zustand';

type EditorState = {
  currentFrame: number;
  clips: any;
  captions: any;
  setCurrentFrame: (frame: number) => void;
  addClip: (clip: any) => void;
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