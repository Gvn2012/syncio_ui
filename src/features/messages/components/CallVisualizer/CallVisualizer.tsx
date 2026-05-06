import React, { useEffect, useRef } from 'react';
import './CallVisualizer.css';

interface CallVisualizerProps {
  stream: MediaStream | null;
  color?: string;
  height?: number;
}

export const CallVisualizer: React.FC<CallVisualizerProps> = ({ 
  stream, 
  color = 'var(--primary)', 
  height = 40 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0 || !canvasRef.current) return;

    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const audioContext = new AudioContextClass();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let resolvedColor = color;
    if (color.startsWith('var(')) {
      resolvedColor = getComputedStyle(document.documentElement).getPropertyValue(
        color.replace(/^var\(|\)$/g, '')
      ).trim() || '#ffffff';
    }

    let animationId: number;

    const draw = () => {
      if (!ctx) return;
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;
        
        ctx.fillStyle = resolvedColor;
        const radius = barWidth / 2;
        const y = (height - barHeight) / 2;
        
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth - 1, barHeight, radius);
        ctx.fill();

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      audioContext.close();
    };
  }, [stream, color, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={height} 
      className="call-visualizer-canvas"
    />
  );
};
