import { Tetromino, TetrominoType, Theme, KeyMap } from './types';

export const STAGE_WIDTH = 12;
export const STAGE_HEIGHT = 24; // 0-3 are buffer, 4-23 are visible

export const TETROMINOS: Record<string, Tetromino> = {
  0: { shape: [[0]], color: '0, 0, 0' },
  I: {
    shape: [
      ['I', 'I', 'I', 'I'],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#80FBFF',
  },
  J: {
    shape: [
      ['J', 0, 0],
      ['J', 'J', 'J'],
      [0, 0, 0],
    ],
    color: '#3B82F6',
  },
  L: {
    shape: [
      [0, 0, 'L'],
      ['L', 'L', 'L'],
      [0, 0, 0],
    ],
    color: '#F97316',
  },
  O: {
    shape: [
      ['O', 'O'],
      ['O', 'O'],
    ],
    color: '#EAB308',
  },
  S: {
    shape: [
      [0, 'S', 'S'],
      ['S', 'S', 0],
      [0, 0, 0],
    ],
    color: '#22C55E',
  },
  T: {
    shape: [
      [0, 'T', 0],
      ['T', 'T', 'T'],
      [0, 0, 0],
    ],
    color: '#A855F7',
  },
  Z: {
    shape: [
      ['Z', 'Z', 0],
      [0, 'Z', 'Z'],
      [0, 0, 0],
    ],
    color: '#EF4444',
  },
  G: { shape: [['G']], color: '#4b5563' } // Garbage block
};

export const DEFAULT_THEME: Theme = {
  name: "Neon Cyber",
  background: "#111827", // Gray 900
  gridBackground: "#0f172a", // Slate 900
  gridLine: "#1e293b", // Slate 800
  text: "#f3f4f6", // Gray 100
  tetrominoColors: {
    I: '#22d3ee', // Cyan 400
    J: '#60a5fa', // Blue 400
    L: '#fb923c', // Orange 400
    O: '#facc15', // Yellow 400
    S: '#4ade80', // Green 400
    T: '#c084fc', // Purple 400
    Z: '#f87171', // Red 400
    G: '#4b5563', // Gray 600 (Garbage)
    0: '#00000000'
  }
};

export const CLASSIC_THEME: Theme = {
  name: "Retro Classic",
  background: "#f0f0f0",
  gridBackground: "#ffffff",
  gridLine: "#e5e5e5",
  text: "#1f2937",
  tetrominoColors: {
    I: '#00f0f0',
    J: '#0000f0',
    L: '#f0a000',
    O: '#f0f000',
    S: '#00f000',
    T: '#a000f0',
    Z: '#f00000',
    G: '#808080', // Classic Grey
    0: '#00000000'
  }
};

export const DEFAULT_KEYMAP: KeyMap = {
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  moveDown: 'ArrowDown',
  rotate: 'ArrowUp',
  hardDrop: ' ',
  hold: 'c',
  pause: 'Escape',
};