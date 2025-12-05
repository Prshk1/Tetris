import React from 'react';
import { TetrominoType, Theme } from '../types';
import { TETROMINOS } from '../constants';

interface PiecePreviewProps {
  title: string;
  type: TetrominoType | null;
  theme: Theme;
}

const PiecePreview: React.FC<PiecePreviewProps> = ({ title, type, theme }) => {
  const shape = type ? TETROMINOS[type].shape : [[0]];

  return (
    <div className="flex flex-col items-center p-4 rounded-2xl border bg-black/5 backdrop-blur-sm w-full shadow-lg" style={{ borderColor: theme.gridLine }}>
      <h3 className="text-xs uppercase tracking-wider opacity-70 mb-4 font-bold">{title}</h3>
      <div 
        className="grid gap-[1px]"
        style={{
            gridTemplateRows: `repeat(4, 1fr)`,
            gridTemplateColumns: `repeat(4, 1fr)`,
            width: '80px',
            height: '80px',
        }}
      >
        {/* Render a 4x4 grid always to keep size consistent */}
        {Array.from({ length: 4 }).map((_, y) => 
            Array.from({ length: 4 }).map((_, x) => {
                let hasBlock = false;
                if (type && shape) {
                    if (y < shape.length && x < shape[y].length) {
                        hasBlock = shape[y][x] !== 0;
                    }
                }

                return (
                    <div
                        key={`${y}-${x}`}
                        style={{
                            backgroundColor: hasBlock ? theme.tetrominoColors[type!] : 'transparent',
                            borderRadius: '2px'
                        }}
                        className={hasBlock ? 'bevel' : ''}
                    />
                );
            })
        )}
      </div>
    </div>
  );
};

export default PiecePreview;