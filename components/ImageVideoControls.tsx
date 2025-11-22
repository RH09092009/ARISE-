import React from 'react';
import { ImageGenerationConfig, VideoGenerationConfig } from '../types';

interface Props {
  mode: 'image' | 'video';
  imgConfig: ImageGenerationConfig;
  videoConfig: VideoGenerationConfig;
  setImgConfig: (c: ImageGenerationConfig) => void;
  setVideoConfig: (c: VideoGenerationConfig) => void;
}

export const ImageVideoControls: React.FC<Props> = ({ mode, imgConfig, videoConfig, setImgConfig, setVideoConfig }) => {
  
  const aspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
  const extendedRatios = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];

  if (mode === 'image') {
    return (
      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Aspect Ratio</label>
          <select 
            value={imgConfig.aspectRatio}
            onChange={(e) => setImgConfig({...imgConfig, aspectRatio: e.target.value})}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 text-sm"
          >
            {extendedRatios.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Size (Pro)</label>
          <select 
            value={imgConfig.size || ""}
            onChange={(e) => setImgConfig({...imgConfig, size: e.target.value as any || undefined})}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 text-sm"
          >
            <option value="">Auto (Flash)</option>
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Ratio</label>
        <select 
          value={videoConfig.aspectRatio}
          onChange={(e) => setVideoConfig({...videoConfig, aspectRatio: e.target.value as any})}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 text-sm"
        >
          <option value="16:9">Landscape (16:9)</option>
          <option value="9:16">Portrait (9:16)</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Resolution</label>
        <select 
          value={videoConfig.resolution}
          onChange={(e) => setVideoConfig({...videoConfig, resolution: e.target.value as any})}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 text-sm"
        >
          <option value="720p">720p (Fast)</option>
          <option value="1080p">1080p (HD)</option>
        </select>
      </div>
    </div>
  );
};