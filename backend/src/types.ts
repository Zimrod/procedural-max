export interface Transform {
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
}

export interface Entity {
  id: string;
  type: string;
  transform: Transform;
  props?: Record<string, any>;

  getPivots: () => Record<string, { x: number; y: number }>;
}