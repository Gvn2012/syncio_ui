import React, { useEffect, useRef } from 'react';

interface CallVisualizerProps {
  stream: MediaStream | null;
  color?: string;
  height?: number;
}

export const CallVisualizer: React.FC<CallVisualizerProps> = ({ stream, color = '#ffffff', height = 40 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

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
        
        ctx.fillStyle = color;
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
      style={{ opacity: 0.8 }}
    />
  );
};
