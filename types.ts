export enum GestureType {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  NEUTRAL = 'NEUTRAL',
  UNKNOWN = 'UNKNOWN'
}

export interface HandTrackingData {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  gesture: GestureType;
  timestamp: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  decay: number;
  life: number;
  maxLife: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
}