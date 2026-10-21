'use client';

import { useRef, useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';

export function RFSpectrum() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phase = useGameStore((s) => s.phase);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const width = 220;
    const height = 120;
    let frameId: number;
    let scrollOffset = 0;

    const draw = () => {
      // Dark background
      ctx.fillStyle = '#000d1a';
      ctx.fillRect(0, 0, width, height);

      // Frequency grid
      for (let x = 0; x < width; x += 22) {
        ctx.strokeStyle = 'rgba(0, 170, 255, 0.08)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Waterfall rows (scrolling)
      for (let row = 0; row < height; row += 2) {
        for (let x = 0; x < width; x += 2) {
          // Generate noise pattern
          const noise = Math.random();
          const intensity = noise < 0.92 ? noise * 0.1 : noise * 0.3;
          const scrolledRow = (row + scrollOffset) % height;
          
          // Color: dark blue noise floor
          const r = Math.floor(intensity * 20);
          const g = Math.floor(intensity * 40);
          const b = Math.floor(intensity * 80 + 20);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, scrolledRow, 2, 2);
        }
      }

      // "NO SIGNAL" overlay when appropriate
      const showNoSignal = ['DETECTED', 'CLASSIFYING', 'AWAITING_ACTION', 'WRONG_ACTION', 'CORRECT_ACTION'].includes(phase);
      if (showNoSignal) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, height / 2 - 15, width, 30);
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NO RF SIGNAL DETECTED', width / 2, height / 2 + 4);
        ctx.textAlign = 'start';
      }

      // Frequency axis labels
      ctx.fillStyle = 'rgba(0, 170, 255, 0.4)';
      ctx.font = '7px "JetBrains Mono", monospace';
      ctx.fillText('2.4GHz', 4, height - 4);
      ctx.fillText('5.8GHz', width - 38, height - 4);

      scrollOffset = (scrollOffset + 0.5) % height;
      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [phase]);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] font-[family-name:var(--font-display)] tracking-widest text-[var(--color-info,#00aaff)] uppercase">RF SPECTRUM</p>
      <canvas
        ref={canvasRef}
        width={220}
        height={120}
        className="rounded border border-[rgba(0,170,255,0.15)]"
      />
    </div>
  );
}
