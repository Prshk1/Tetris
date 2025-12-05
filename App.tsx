import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Play, RefreshCw, Trophy, Zap, Pause, ChevronsUp, RotateCcw, Flame } from 'lucide-react';
import Board from './components/Board';
import SettingsModal from './components/Settings';
import PiecePreview from './components/PiecePreview';
import { useGameStatus, useInterval, usePlayer, useStage } from './hooks';
import { createStage, checkCollision, playSound } from './utils';
import { DEFAULT_KEYMAP, DEFAULT_THEME } from './constants';
import { GameStatus, KeyMap, Theme } from './types';

function App() {
  const [dropTime, setDropTime] = useState<number | null>(null);
  const [garbageTime, setGarbageTime] = useState<number | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.MENU);
  const [keyMap, setKeyMap] = useState<KeyMap>(DEFAULT_KEYMAP);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Stats hooks
  const { score, setScore, rows, setRows, level, setLevel, combo, setCombo } = useGameStatus();

  const { player, updatePlayerPos, resetPlayer, playerRotate, setPlayer, nextPiece, holdPiece, hold } = usePlayer();
  
  // Callback for when a piece locks
  const onPieceLocked = useCallback((linesCleared: number) => {
    if (linesCleared > 0) {
        setRows(prev => prev + linesCleared);
        
        // Update Combo
        setCombo(prev => prev + 1);
        
        // Calculate Score
        const linePoints = [40, 100, 300, 1200];
        const basePoints = linePoints[linesCleared - 1] || 0;
        
        setScore(prevScore => {
            const currentCombo = combo + 1;
            const multiplier = Math.min(10, 1 + ((currentCombo - 1) * 0.5));
            return prevScore + Math.floor(basePoints * (level + 1) * multiplier);
        });

    } else {
        setCombo(0);
        playSound('drop'); // Sound for locking piece without clear
    }
  }, [combo, level, setRows, setCombo, setScore]);

  const { stage, setStage, addGarbageRow } = useStage(
    player,
    resetPlayer,
    (gameOver) => {
      if (gameOver) {
        setGameStatus(GameStatus.GAMEOVER);
        setDropTime(null);
        setGarbageTime(null);
      }
    },
    onPieceLocked,
    setPlayer // Pass setPlayer to handle garbage collision "nudge"
  );

  // Difficulty logic
  useEffect(() => {
    if (gameStatus === GameStatus.PLAYING) {
        // 1. Gravity (Drop Speed)
        const newDropTime = Math.max(150, Math.floor(800 * Math.pow(0.95, level)));
        setDropTime(newDropTime);

        // 2. Garbage Lines
        if (level > 0) {
            const newGarbageTime = Math.max(2000, 15000 - (level * 1200));
            setGarbageTime(newGarbageTime);
        } else {
            setGarbageTime(null);
        }
    }
  }, [level, gameStatus]);

  const movePlayer = (dir: number) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
      playSound('move');
    }
  };

  const startGame = () => {
    setStage(createStage());
    setDropTime(800);
    setGarbageTime(null);
    resetPlayer();
    setScore(0);
    setRows(0);
    setLevel(0);
    setCombo(0);
    setGameStatus(GameStatus.PLAYING);
    playSound('move'); // Feedback for start
  };

  const drop = () => {
    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  };

  const hardDrop = () => {
    let tempY = 0;
    while (!checkCollision(player, stage, { x: 0, y: tempY + 1 })) {
        tempY += 1;
    }
    updatePlayerPos({ x: 0, y: tempY, collided: true });
    playSound('hardDrop');
  };

  const keyUp = ({ key }: { key: string }) => {
    if (gameStatus !== GameStatus.PLAYING) return;
    if (key === keyMap.moveDown) {
      const currentSpeed = Math.max(150, Math.floor(800 * Math.pow(0.95, level)));
      setDropTime(currentSpeed);
    }
  };

  const move = ({ keyCode, key }: { keyCode: number; key: string }) => {
    if (gameStatus !== GameStatus.PLAYING) return;

    if (key === keyMap.moveLeft) {
      movePlayer(-1);
    } else if (key === keyMap.moveRight) {
      movePlayer(1);
    } else if (key === keyMap.moveDown) {
      drop();
    } else if (key === keyMap.rotate) {
      playerRotate(stage, 1);
    } else if (key === keyMap.hold) {
      hold();
    } else if (key === keyMap.hardDrop) {
      hardDrop();
    }
  };

  const dropPlayer = () => {
    setDropTime(null);
    drop();
  };

  const handleKeyDown = (e: React.KeyboardEvent | KeyboardEvent) => {
    if (gameStatus !== GameStatus.PLAYING) {
        if ((gameStatus === GameStatus.MENU || gameStatus === GameStatus.GAMEOVER) && e.key === 'Enter') {
            startGame();
        }
        return;
    }

    if (Object.values(keyMap).includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === keyMap.moveDown) {
        dropPlayer();
    } else if (e.key === keyMap.pause) {
        togglePause();
    } else {
        move({ keyCode: e.keyCode, key: e.key });
    }
  };

  React.useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => handleKeyDown(e);
    const handleWindowKeyUp = (e: KeyboardEvent) => keyUp({ key: e.key });
    
    window.addEventListener('keydown', handleWindowKeyDown);
    window.addEventListener('keyup', handleWindowKeyUp);
    return () => {
        window.removeEventListener('keydown', handleWindowKeyDown);
        window.removeEventListener('keyup', handleWindowKeyUp);
    }
  });

  useInterval(() => {
    drop();
  }, dropTime);

  useInterval(() => {
    addGarbageRow();
  }, garbageTime);

  const togglePause = () => {
      if (gameStatus === GameStatus.PLAYING) {
          setGameStatus(GameStatus.PAUSED);
          setDropTime(null);
          setGarbageTime(null);
      } else if (gameStatus === GameStatus.PAUSED) {
          setGameStatus(GameStatus.PLAYING);
          const currentSpeed = Math.max(150, Math.floor(800 * Math.pow(0.95, level)));
          setDropTime(currentSpeed);
          if (level > 0) {
             setGarbageTime(Math.max(2000, 15000 - (level * 1200)));
          }
      }
  };

  const formatKey = (key: string) => {
      if (key === ' ') return 'Space';
      if (key.startsWith('Arrow')) return key.replace('Arrow', '');
      return key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500 overflow-hidden"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div className="flex flex-col md:flex-row gap-6 items-start justify-center w-full max-w-5xl">
        
        {/* Left Stats & Controls Column */}
        <div className="hidden md:flex flex-col gap-4 w-56 shrink-0 order-1">
             <div className="p-6 rounded-2xl border bg-black/5 backdrop-blur-sm shadow-lg flex flex-col gap-1" style={{ borderColor: theme.gridLine }}>
                <h3 className="text-xs uppercase tracking-wider opacity-70 font-bold">Score</h3>
                <div className="text-3xl font-mono font-bold flex items-center gap-2">
                    <Trophy size={20} className="text-yellow-400" />
                    {score}
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                 <div className="p-4 rounded-2xl border bg-black/5 backdrop-blur-sm shadow-lg flex flex-col items-center justify-center" style={{ borderColor: theme.gridLine }}>
                    <h3 className="text-[10px] uppercase tracking-wider opacity-70 font-bold">Level</h3>
                    <div className="text-2xl font-mono font-bold flex items-center gap-1">
                        {level} <Zap size={14} className="text-purple-400" />
                    </div>
                 </div>
                 
                 <div className={`p-4 rounded-2xl border backdrop-blur-sm shadow-lg flex flex-col items-center justify-center transition-all duration-200 ${combo > 1 ? 'bg-orange-500/10 border-orange-500/50' : 'bg-black/5'}`} 
                      style={{ borderColor: combo > 1 ? undefined : theme.gridLine }}>
                    <h3 className="text-[10px] uppercase tracking-wider opacity-70 font-bold flex items-center gap-1">
                        Combo <Flame size={10} className={combo > 1 ? 'text-orange-500 animate-pulse' : 'opacity-0'} />
                    </h3>
                    <div className={`text-xl font-mono font-bold ${combo > 1 ? 'text-orange-500' : ''}`}>
                        x{Math.min(10, 1 + (combo * 0.5)).toFixed(1)}
                    </div>
                 </div>
             </div>

             <div className="p-5 rounded-2xl border bg-black/5 backdrop-blur-sm text-sm shadow-lg flex-1 overflow-y-auto max-h-[400px]" style={{ borderColor: theme.gridLine }}>
                <h3 className="font-bold opacity-70 mb-3 uppercase tracking-wider text-xs">Controls</h3>
                <ul className="space-y-3 font-mono opacity-80 text-xs">
                    <li className="flex justify-between items-center">
                        <span>Left / Right</span> <span className="px-2 py-1 rounded font-bold" style={{ backgroundColor: theme.gridLine }}>{formatKey(keyMap.moveLeft)}/{formatKey(keyMap.moveRight)}</span>
                    </li>
                    <li className="flex justify-between items-center">
                        <span>Soft Drop</span> <span className="px-2 py-1 rounded font-bold" style={{ backgroundColor: theme.gridLine }}>{formatKey(keyMap.moveDown)}</span>
                    </li>
                    <li className="flex justify-between items-center">
                        <span>Rotate</span> <span className="px-2 py-1 rounded font-bold" style={{ backgroundColor: theme.gridLine }}>{formatKey(keyMap.rotate)}</span>
                    </li>
                    <li className="flex justify-between items-center">
                        <span>Hard Drop</span> <span className="px-2 py-1 rounded font-bold" style={{ backgroundColor: theme.gridLine }}>{formatKey(keyMap.hardDrop)}</span>
                    </li>
                    <li className="flex justify-between items-center">
                        <span>Hold</span> <span className="px-2 py-1 rounded font-bold" style={{ backgroundColor: theme.gridLine }}>{formatKey(keyMap.hold)}</span>
                    </li>
                    <li className="flex justify-between items-center">
                        <span>Pause</span> <span className="px-2 py-1 rounded font-bold" style={{ backgroundColor: theme.gridLine }}>{formatKey(keyMap.pause)}</span>
                    </li>
                </ul>
            </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 w-full flex flex-col items-center relative order-2 min-w-[300px]">
            {/* Board Container */}
            <div className="relative h-[75vh] w-auto aspect-[12/20] max-w-full">
                <Board stage={stage} theme={theme} />
                
                {/* Overlay */}
                {gameStatus !== GameStatus.PLAYING && gameStatus !== GameStatus.PAUSED && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg overflow-hidden">
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                        <div className="relative z-30 flex flex-col items-center p-8 text-center animate-in fade-in zoom-in duration-300 w-full">
                            <h1 className="text-5xl md:text-7xl font-bold mb-4 uppercase tracking-tighter" style={{ textShadow: `0 0 20px ${theme.tetrominoColors.T}` }}>
                                {gameStatus === GameStatus.GAMEOVER ? 'Game Over' : 'Tetris'}
                            </h1>
                            
                            {gameStatus === GameStatus.GAMEOVER && (
                                <div className="bg-white/10 p-6 rounded-2xl border border-white/20 mb-8 backdrop-blur-md w-full max-w-xs">
                                    <div className="text-sm font-bold opacity-70 uppercase mb-1">Final Score</div>
                                    <div className="text-4xl font-mono font-bold text-white mb-4">{score}</div>
                                    <div className="text-xs opacity-60">Board Full! The blocks reached the top.</div>
                                </div>
                            )}

                            <button 
                                onClick={startGame}
                                className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-full overflow-hidden hover:scale-105 transition-transform shadow-xl"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {gameStatus === GameStatus.GAMEOVER ? <RefreshCw size={20}/> : <Play size={20}/>}
                                    {gameStatus === GameStatus.GAMEOVER ? 'Try Again' : 'Start Game'}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            
                            {gameStatus === GameStatus.MENU && (
                                <div className="mt-4 text-sm opacity-60">Press Enter to Start</div>
                            )}
                        </div>
                    </div>
                )}

                {gameStatus === GameStatus.PAUSED && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg overflow-hidden">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                        <div className="relative z-30 bg-black/90 p-8 rounded-2xl border border-white/10 text-center shadow-2xl w-64">
                            <Pause size={48} className="mx-auto mb-4 opacity-50"/>
                            <h2 className="text-3xl font-bold mb-6 tracking-widest text-white">PAUSED</h2>
                            
                            <div className="flex flex-col gap-3">
                                <button onClick={togglePause} className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2">
                                    <Play size={18} fill="currentColor" /> Resume
                                </button>
                                <button onClick={startGame} className="px-6 py-3 bg-white/10 text-white border border-white/10 rounded-xl font-bold hover:bg-white/20 transition flex items-center justify-center gap-2">
                                    <RotateCcw size={18} /> Restart
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {garbageTime && garbageTime < 5000 && gameStatus === GameStatus.PLAYING && (
                    <div className="absolute bottom-0 w-full h-1 bg-red-500 animate-pulse z-10" />
                )}
            </div>
        </div>

        {/* Right Previews Column */}
        <div className="flex flex-col gap-4 w-full md:w-56 shrink-0 order-3">
            {/* Stacked Next and Hold */}
            <div className="hidden md:flex flex-col gap-4">
                <PiecePreview title="Next" type={nextPiece.type} theme={theme} />
                
                <div>
                    <PiecePreview title="Hold" type={holdPiece?.type || null} theme={theme} />
                    <div className="text-center text-xs opacity-50 mt-1">Press '{formatKey(keyMap.hold)}'</div>
                </div>
            </div>
            
            {level > 0 && (
                <div className="hidden md:flex p-4 rounded-2xl border bg-red-500/10 backdrop-blur-sm shadow-lg items-center gap-3" style={{ borderColor: theme.gridLine }}>
                   <ChevronsUp className="text-red-500 animate-bounce" size={24} />
                   <div className="flex flex-col">
                       <span className="text-xs font-bold uppercase tracking-wider text-red-400">Danger</span>
                       <span className="text-xs opacity-70">Rising Lines</span>
                   </div>
                </div>
            )}

            {/* Mobile Stats */}
            <div className="md:hidden flex justify-between w-full mb-4 bg-black/5 p-4 rounded-xl border" style={{borderColor: theme.gridLine}}>
                 <div className="flex flex-col">
                    <span className="text-xs opacity-70 uppercase">Score</span>
                    <span className="font-mono font-bold text-xl">{score}</span>
                 </div>
                 <div className="flex flex-col text-right">
                    <span className="text-xs opacity-70 uppercase">Level</span>
                    <span className="font-mono font-bold text-xl">{level}</span>
                 </div>
            </div>
            
            {/* Mobile Previews */}
            <div className="md:hidden grid grid-cols-2 gap-4 mb-4">
                 <PiecePreview title="Hold" type={holdPiece?.type || null} theme={theme} />
                 <PiecePreview title="Next" type={nextPiece.type} theme={theme} />
            </div>

            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-4 rounded-2xl border bg-black/5 hover:bg-current hover:bg-opacity-10 transition flex items-center justify-center gap-2 font-bold backdrop-blur-sm shadow-lg mt-auto"
                style={{ borderColor: theme.gridLine }}
            >
                <Settings size={20} />
                Settings
            </button>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        currentKeyMap={keyMap}
        onUpdateKeyMap={setKeyMap}
        currentTheme={theme}
        onUpdateTheme={setTheme}
      />
    </div>
  );
}

export default App;