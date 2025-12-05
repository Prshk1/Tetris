import { useEffect, useRef, useState, useCallback } from 'react';
import { createStage, checkCollision, randomTetromino, playSound } from './utils';
import { Player, Grid, TetrominoType, GridCell, GameStatus } from './types';
import { STAGE_WIDTH, STAGE_HEIGHT, TETROMINOS } from './constants';

// --- useInterval ---
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// --- useGameStatus ---
export const useGameStatus = () => {
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);
  const [combo, setCombo] = useState(0);

  useEffect(() => {
     // Level up every 10 rows
     setLevel(Math.floor(rows / 10));
  }, [rows]);

  return { score, setScore, rows, setRows, level, setLevel, combo, setCombo };
};

// --- usePlayer ---
export const usePlayer = () => {
  // Spawn at y: 2 (Partially visible).
  // Buffer is 0-3. Visible starts at 4.
  // Spawn at 2 puts piece at 2,3 (or 2,3,4).
  // This ensures if there is a block at row 4, we likely collide visibly.
  const [player, setPlayer] = useState<Player>(() => {
    const initialPiece = randomTetromino();
    return {
      pos: { x: STAGE_WIDTH / 2 - 2, y: 2 },
      tetromino: initialPiece.shape,
      type: initialPiece.type,
      collided: false,
    };
  });

  const [nextPiece, setNextPiece] = useState<{type: TetrominoType, shape: TetrominoType[][]}>(randomTetromino());
  const [holdPiece, setHoldPiece] = useState<{type: TetrominoType, shape: TetrominoType[][]} | null>(null);
  const [hasHeld, setHasHeld] = useState(false);

  const rotate = (matrix: (TetrominoType | 0)[][], dir: number) => {
    // Transpose
    const rotated = matrix.map((_, index) =>
      matrix.map((col) => col[index])
    );
    // Reverse rows for clockwise
    if (dir > 0) return rotated.map((row) => row.reverse());
    return rotated.reverse();
  };

  const playerRotate = (stage: Grid, dir: number) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

    const pos = clonedPlayer.pos.x;
    let offset = 1;
    while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPlayer.tetromino[0].length) {
        rotate(clonedPlayer.tetromino, -dir);
        clonedPlayer.pos.x = pos;
        return;
      }
    }
    setPlayer(clonedPlayer);
    playSound('rotate');
  };

  const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
    setPlayer((prev) => ({
      ...prev,
      pos: { x: prev.pos.x + x, y: prev.pos.y + y },
      collided,
    }));
  };

  const resetPlayer = useCallback(() => {
    setPlayer({
      pos: { x: STAGE_WIDTH / 2 - 2, y: 2 }, 
      tetromino: nextPiece.shape,
      type: nextPiece.type,
      collided: false,
    });
    setNextPiece(randomTetromino());
    setHasHeld(false);
  }, [nextPiece]);

  const hold = () => {
    if (hasHeld) return;
    playSound('hold');

    if (holdPiece === null) {
        // First hold
        const currentType = player.type;
        const defaultShape = TETROMINOS[currentType].shape; // Reset rotation
        setHoldPiece({ type: currentType, shape: defaultShape });
        
        resetPlayer(); // Get next piece
    } else {
        // Swap
        const currentType = player.type;
        const currentShape = TETROMINOS[currentType].shape; // Reset rotation
        
        const nextType = holdPiece.type;
        const nextShape = TETROMINOS[nextType].shape;

        setHoldPiece({ type: currentType, shape: currentShape });
        setPlayer({
            pos: { x: STAGE_WIDTH / 2 - 2, y: 2 },
            tetromino: nextShape,
            type: nextType,
            collided: false
        });
        setHasHeld(true);
    }
  };

  return { player, updatePlayerPos, resetPlayer, playerRotate, setPlayer, nextPiece, holdPiece, hold };
};

// --- useStage ---
export const useStage = (
    player: Player, 
    resetPlayer: () => void, 
    setGameOver: (s: boolean) => void,
    onPieceLocked: (rowsCleared: number) => void,
    setPlayer: React.Dispatch<React.SetStateAction<Player>>
  ) => {
  const [stage, setStage] = useState(createStage());
  const VISIBLE_START_ROW = 4;
  
  useEffect(() => {
    const sweepRows = (newStage: Grid) => {
      let cleared = 0;
      const sweptStage = newStage.reduce((ack, row) => {
        if (row.findIndex((cell) => cell[0] === 0) === -1) {
          cleared += 1;
          ack.unshift(new Array(newStage[0].length).fill([0, 'clear']));
          return ack;
        }
        ack.push(row);
        return ack;
      }, [] as Grid);
      return { sweptStage, cleared };
    };

    const updateStage = (prevStage: Grid) => {
      // 1. Flush the stage from the previous render
      const newStage = prevStage.map(
        (row) =>
          row.map((cell) => (cell[1] === 'clear' || cell[1] === 'ghost' ? [0, 'clear'] : cell)) as GridCell[]
      );

      // Safety check
      if (player.type === 0) return newStage;

      // 2. Calculate and Draw Ghost (only visual, doesn't affect game over)
      let ghostPos = { ...player.pos };
      while (!checkCollision({ ...player, pos: { x: ghostPos.x, y: ghostPos.y + 1 } }, newStage, { x: 0, y: 0 })) {
          ghostPos.y += 1;
      }
      
      // Draw Ghost
      player.tetromino.forEach((row, y) => {
          row.forEach((value, x) => {
              if (value !== 0) {
                  if (
                      newStage[y + ghostPos.y] &&
                      newStage[y + ghostPos.y][x + ghostPos.x]
                  ) {
                      newStage[y + ghostPos.y][x + ghostPos.x] = [value, 'ghost'];
                  }
              }
          });
      });

      // 3. Draw the tetromino (Player) over the locked board
      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            if (
              newStage[y + player.pos.y] &&
              newStage[y + player.pos.y][x + player.pos.x]
            ) {
              newStage[y + player.pos.y][x + player.pos.x] = [
                value,
                `${player.collided ? 'merged' : 'clear'}`,
              ];
            }
          }
        });
      });

      // 4. Check collision and merging (only locked blocks can trigger game over)
      if (player.collided) {
        const { sweptStage, cleared } = sweepRows(newStage);
        if (cleared > 0) playSound('clear');
        onPieceLocked(cleared);

        const isVisibleTopBlocked = sweptStage[VISIBLE_START_ROW].some(
            (cell) => cell[1] === 'merged'
        );

        if (isVisibleTopBlocked) {
            setGameOver(true);
            playSound('gameover');
            return sweptStage;
        }

        resetPlayer();
        return sweptStage;
      }

      return newStage;
    };

    setStage((prev) => updateStage(prev));
  }, [player, resetPlayer, setGameOver, onPieceLocked, setPlayer]);

  const addGarbageRow = useCallback(() => {
    setStage((prev) => {
        // Check top BUFFER row (index 0) for Game Over. 
        const isBufferTopBlocked = prev[0].some(cell => cell[1] === 'merged');
        
        if (isBufferTopBlocked) {
            setGameOver(true);
            playSound('gameover');
            return prev;
        }

        // Create new stage shifted up
        const newStage = prev.slice(1);
        const newRow: GridCell[] = Array(STAGE_WIDTH).fill(['G', 'merged']);
        const holeIndex = Math.floor(Math.random() * STAGE_WIDTH);
        newRow[holeIndex] = [0, 'clear'];
        newStage.push(newRow);

        // Nudge Player if Collision
        setPlayer((currentPlayer) => {
            if (checkCollision(currentPlayer, newStage, { x: 0, y: 0 })) {
                 if (!checkCollision(currentPlayer, newStage, { x: 0, y: -1 })) {
                     return { ...currentPlayer, pos: { ...currentPlayer.pos, y: currentPlayer.pos.y - 1 } };
                 } 
                 else {
                     setGameOver(true);
                     playSound('gameover');
                     return currentPlayer;
                 }
            }
            return currentPlayer;
        });

        return newStage;
    });
  }, [setGameOver, setPlayer]);

  return { stage, setStage, addGarbageRow };
};