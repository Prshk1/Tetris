export type TetrominoType = 0 | 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z' | 'G';

export interface Tetromino {
  shape: TetrominoType[][];
  color: string;
}

export type GridCell = [TetrominoType, 'clear' | 'merged' | 'ghost'];
export type Grid = GridCell[][];

export interface Player {
  pos: { x: number; y: number };
  tetromino: TetrominoType[][];
  type: TetrominoType; // Track the type for hold functionality
  collided: boolean;
}

export interface Theme {
  name: string;
  background: string;
  gridBackground: string;
  gridLine: string;
  text: string;
  tetrominoColors: Record<string, string>; // Maps type (I, J, etc) to hex
}

export interface KeyMap {
  moveLeft: string;
  moveRight: string;
  moveDown: string;
  rotate: string;
  hardDrop: string;
  hold: string;
  pause: string;
}

export enum GameStatus {
  MENU,
  PLAYING,
  PAUSED,
  GAMEOVER,
}