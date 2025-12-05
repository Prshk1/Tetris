import React, { useState } from 'react';
import { X, Loader2, Sparkles, Keyboard, Palette } from 'lucide-react';
import { KeyMap, Theme } from '../types';
import { generateTheme } from '../services/ai';
import { DEFAULT_THEME, CLASSIC_THEME } from '../constants';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentKeyMap: KeyMap;
  onUpdateKeyMap: (k: KeyMap) => void;
  currentTheme: Theme;
  onUpdateTheme: (t: Theme) => void;
}

const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  currentKeyMap,
  onUpdateKeyMap,
  currentTheme,
  onUpdateTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'themes'>('controls');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [listeningKey, setListeningKey] = useState<keyof KeyMap | null>(null);

  if (!isOpen) return null;

  const handleKeyBind = (keyAction: keyof KeyMap) => {
    setListeningKey(keyAction);
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      onUpdateKeyMap({ ...currentKeyMap, [keyAction]: e.key });
      setListeningKey(null);
      window.removeEventListener('keydown', handler);
    };
    window.addEventListener('keydown', handler);
  };

  const handleGenerateTheme = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    const theme = await generateTheme(prompt);
    if (theme) {
      onUpdateTheme(theme);
    }
    setIsGenerating(false);
  };

  const formatKey = (key: string) => {
      if (key === ' ') return 'Space';
      if (key.startsWith('Arrow')) return key.replace('Arrow', '');
      return key; // Keep case as is or uppercase if preferred
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh]"
        style={{ 
            backgroundColor: currentTheme.background, 
            borderColor: currentTheme.gridLine,
            color: currentTheme.text
        }}
      >
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: currentTheme.gridLine }}>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full transition hover:opacity-70"
            style={{ backgroundColor: currentTheme.gridLine }}
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b" style={{ borderColor: currentTheme.gridLine }}>
            <button
                onClick={() => setActiveTab('controls')}
                className="flex-1 p-4 flex items-center justify-center gap-2 font-medium transition"
                style={{ 
                    backgroundColor: activeTab === 'controls' ? currentTheme.gridLine : 'transparent',
                    color: currentTheme.text,
                    opacity: activeTab === 'controls' ? 1 : 0.7
                }}
            >
                <Keyboard size={18} /> Controls
            </button>
            <button
                onClick={() => setActiveTab('themes')}
                className="flex-1 p-4 flex items-center justify-center gap-2 font-medium transition"
                style={{ 
                    backgroundColor: activeTab === 'themes' ? currentTheme.gridLine : 'transparent',
                    color: currentTheme.text,
                    opacity: activeTab === 'themes' ? 1 : 0.7
                }}
            >
                <Palette size={18} /> Themes
            </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === 'controls' && (
            <div className="grid gap-4">
              {Object.entries(currentKeyMap).map(([action, key]) => (
                <div 
                    key={action} 
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: currentTheme.gridBackground }}
                >
                  <span className="capitalize font-medium">{action.replace(/([A-Z])/g, ' $1')}</span>
                  <button
                    onClick={() => handleKeyBind(action as keyof KeyMap)}
                    className={`px-4 py-2 rounded-md font-mono text-sm min-w-[100px] text-center transition border ${
                        listeningKey === action 
                        ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' 
                        : 'border-transparent'
                    }`}
                    style={listeningKey !== action ? {
                        backgroundColor: currentTheme.gridLine,
                        color: currentTheme.text,
                        fontWeight: 'bold'
                    } : {}}
                  >
                    {listeningKey === action ? 'Press key...' : formatKey(key)}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="space-y-8">
              <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Preset Themes</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => onUpdateTheme(DEFAULT_THEME)}
                        className="p-4 rounded-xl border transition text-left relative overflow-hidden group hover:scale-[1.02]"
                        style={{ background: DEFAULT_THEME.background, borderColor: currentTheme.gridLine }}
                      >
                          <span className="relative z-10 font-bold" style={{ color: DEFAULT_THEME.text }}>Neon Cyber</span>
                      </button>
                      <button 
                        onClick={() => onUpdateTheme(CLASSIC_THEME)}
                        className="p-4 rounded-xl border transition text-left relative overflow-hidden group hover:scale-[1.02]"
                        style={{ background: CLASSIC_THEME.background, borderColor: currentTheme.gridLine }}
                      >
                          <span className="relative z-10 font-bold" style={{ color: CLASSIC_THEME.text }}>Classic Retro</span>
                      </button>
                  </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">AI Theme Generator</h3>
                    <Sparkles size={16} className="text-purple-400" />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. 'Volcanic Eruption', 'Deep Space'"
                    className="flex-1 px-4 py-3 rounded-xl focus:outline-none transition border border-transparent focus:border-purple-500"
                    style={{ 
                        backgroundColor: currentTheme.gridLine, 
                        color: currentTheme.text,
                    }}
                  />
                  <button
                    onClick={handleGenerateTheme}
                    disabled={isGenerating || !prompt}
                    className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition flex items-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    Generate
                  </button>
                </div>
                <p className="text-xs opacity-60">
                    Enter any concept to generate a unique color palette.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;