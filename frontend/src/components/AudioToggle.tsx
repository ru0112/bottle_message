import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../utils/audio';

export const AudioToggle: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(soundManager.getIsPlaying());

  const handleToggle = () => {
    const active = soundManager.toggleOcean();
    setIsPlaying(active);
  };

  return (
    <button
      onClick={handleToggle}
      title={isPlaying ? '波の音を止める' : '波の音を流す（環境音）'}
      className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/70 border border-slate-700/60 backdrop-blur-md text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all shadow-lg text-xs tracking-wider"
    >
      {isPlaying ? (
        <>
          <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline text-cyan-300">波音 再生中</span>
        </>
      ) : (
        <>
          <VolumeX className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline text-slate-400">波音 OFF</span>
        </>
      )}
    </button>
  );
};
