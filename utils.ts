import { STAGE_HEIGHT, STAGE_WIDTH, TETROMINOS } from './constants';
import { Grid, GridCell, Player, TetrominoType } from './types';

export const createStage = (): Grid =>
  Array.from(Array(STAGE_HEIGHT), () =>
    new Array(STAGE_WIDTH).fill([0, 'clear'])
  );

export const randomTetromino = () => {
  const tetrominos = 'IJLOSTZ';
  const randTetromino =
    tetrominos[Math.floor(Math.random() * tetrominos.length)] as TetrominoType;
  return { type: randTetromino, ...TETROMINOS[randTetromino] };
};

export const checkCollision = (
  player: Player,
  stage: Grid,
  { x: moveX, y: moveY }: { x: number; y: number }
): boolean => {
  for (let y = 0; y < player.tetromino.length; y += 1) {
    for (let x = 0; x < player.tetromino[y].length; x += 1) {
      // 1. Check that we're on an actual Tetromino cell
      if (player.tetromino[y][x] !== 0) {
        if (
          // 2. Check that our move is inside the game areas height (y)
          // We shouldn't go through the bottom of the play area
          !stage[y + player.pos.y + moveY] ||
          // 3. Check that our move is inside the game areas width (x)
          !stage[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
          // 4. Check that the cell we're moving to isn't set to clear (and isn't a ghost)
          (stage[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !==
            'clear' &&
            stage[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !==
              'ghost')
        ) {
          return true;
        }
      }
    }
  }
  return false;
};

// Singleton AudioContext to prevent hitting the browser limit of 6 contexts
let audioCtx: AudioContext | null = null;

// Simple Synth for Sound Effects
export const playSound = (type: 'move' | 'rotate' | 'drop' | 'hardDrop' | 'clear' | 'gameover' | 'hold') => {
  try {
      if (!audioCtx) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          audioCtx = new AudioContext();
      }

      // Resume context if it's suspended (browsers often suspend contexts created before user interaction)
      if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
      }

      const ctx = audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'move') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(300, now);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
      } else if (type === 'rotate') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
      } else if (type === 'drop') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(200, now);
          gain.gain.setValueAtTime(0.03, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
      } else if (type === 'hardDrop') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
      } else if (type === 'hold') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, now);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
      } else if (type === 'clear') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
          osc.frequency.linearRampToValueAtTime(800, now + 0.2);
          osc.frequency.linearRampToValueAtTime(1500, now + 0.3);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
      } else if (type === 'gameover') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(50, now + 1);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
          osc.start(now);
          osc.stop(now + 1);
      }
  } catch (e) {
      // Ignore audio errors
  }
};