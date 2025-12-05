import React from 'react';
import { Grid, Theme } from '../types';

interface BoardProps {
  stage: Grid;
  theme: Theme;
}

const Board: React.FC<BoardProps> = ({ stage, theme }) => {
  // Only render the visible part of the stage (skip the first 4 buffer rows)
  const visibleStage = stage.slice(4);

  return (
    <div
      className="grid gap-[1px] border-4 rounded-lg overflow-hidden shadow-2xl relative w-full h-full"
      style={{
        gridTemplateRows: `repeat(${visibleStage.length}, 1fr)`,
        gridTemplateColumns: `repeat(${visibleStage[0].length}, 1fr)`,
        backgroundColor: theme.gridLine,
        borderColor: theme.gridLine,
      }}
    >
      {visibleStage.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: cell[0] === 0 
                ? theme.gridBackground 
                : theme.tetrominoColors[cell[0]],
              opacity: cell[1] === 'ghost' ? 0.4 : 1,
              border: cell[1] === 'ghost' ? '2px solid' : 'none',
              borderColor: cell[1] === 'ghost' ? theme.tetrominoColors[cell[0]] : 'transparent',
            }}
            className={cell[0] !== 0 && cell[1] !== 'ghost' ? 'bevel' : ''}
          />
        ))
      )}
      <style>{`
        .bevel {
            box-shadow: inset 3px 3px 0px rgba(255,255,255,0.4), inset -3px -3px 0px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default Board;