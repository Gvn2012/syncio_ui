import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

const generateWaveform = (seed: string | null | undefined, bars: number = 40) => {
  if (!seed) seed = '';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  
  const waveform = [];
  for (let i = 0; i < bars; i++) {
    const x = Math.sin(hash + i) * 10000;
    const val = x - Math.floor(x);
    waveform.push(0.3 + val * 0.7); 
  }
  return waveform;
};

interface AudioPlayerProps {
  src: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const waveformBars = useMemo(() => generateWaveform(src, 36), [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      if (audio.duration && audio.duration !== Infinity) {
         setDuration(audio.duration);
      }
    };

    const setAudioTime = () => setProgress(audio.currentTime);

    const onEnd = () => {
      setIsPlaying(false);
      setProgress(0);
      if (audio) audio.currentTime = 0;
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onEnd);
    
    if (audio.readyState >= 1 && audio.duration && audio.duration !== Infinity) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [src]);

  useEffect(() => {
    const handleOtherPlay = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.src !== src && isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('audioPlay', handleOtherPlay);
    return () => window.removeEventListener('audioPlay', handleOtherPlay);
  }, [src, isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        window.dispatchEvent(new CustomEvent('audioPlay', { detail: { src } }));
        if (audioRef.current.duration === Infinity) {
          audioRef.current.currentTime = 1e101;
          setTimeout(() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            }
          }, 100);
        } else {
          audioRef.current.play();
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (percent: number) => {
    if (audioRef.current && duration) {
      const manualChange = percent * duration;
      audioRef.current.currentTime = manualChange;
      setProgress(manualChange);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time) || time === Infinity) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="audio-player-container">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePlay}
        className="audio-player-btn"
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="audio-player-btn-icon" />}
      </motion.button>

      <div className="audio-player-content">
        <div 
          className="audio-player-waveform-container"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            handleSeek(clickX / rect.width);
          }}
        >
          {waveformBars.map((height, i) => {
            const isPlayed = (i / waveformBars.length) * 100 <= progressPercent;
            return (
              <div
                key={i}
                className={`audio-player-bar ${isPlayed ? 'played' : ''}`}
                style={{ 
                  height: `${height * 100}%`
                }}
              />
            );
          })}
        </div>
        
        <div className="audio-player-time">
          <span>{formatTime(progress)} / {formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
