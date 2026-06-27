type BaseItem = {
    from: number;
    durationInFrames: number;
    id: string;
  };
   
  export type SolidItem = BaseItem & {
    type: 'solid';
    color: string;
  };
   
  export type TextItem = BaseItem & {
    type: 'text';
    text: string;
    color: string;
  };
   
  export type VideoItem = BaseItem & {
    type: 'video';
    src: string;
  };

  export type CaptionsItem = BaseItem & {
    type: 'captions';
    captions: {
      word: string;
      start: number;
      end: number;
    }[];
    tone?: string;
  };

  export type LottieItem = BaseItem & {
    type: 'lottie';
    animationData: any;
    loop?: boolean;
  };
  
  export type AudioItem = BaseItem & {
    type: 'audio';
    src: string;
    waveform?: number[]; // Optional waveform data for visualization
  };
  export type Item = SolidItem | TextItem | VideoItem | CaptionsItem | LottieItem | AudioItem;
   
  export type Track = {
    name: string;
    items: Item[];
  };