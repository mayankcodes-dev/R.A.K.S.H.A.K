'use client';

import { useRef, useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';

export function RadarScope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phase = useGameStore((s) => s.phase);
  const droneDistance = useGameStore((s) => s.droneDistance);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const size = 220;
    const center = size / 2;
    const maxRadius = 95;
    let angle = 0;
    let frameId: number;

    const showBlip = ['DETECTED', 'CLASSIFYING', 'AWAITING_ACTION', 'WRONG_ACTION', 'CORRECT_ACTION', 'ENGAGEMENT', 'NEUTRALIZED'].includes(phase);
    // Map droneDistance (2000 -> edge, 0 -> center) to radar radius
    const blipRadius = showBlip ? Math.max(5, (droneDistance / 2000) * maxRadius) : 0;
    // Fixed angle for the blip (upper right quadrant)
    const blipAngle = -0.8;

    const draw = () => {
      // Dark background
      ctx.fillStyle = '#001a00';
      ctx.fillRect(0, 0, size, size);

      // Range rings
      [30, 60, 90].forEach((r) => {
        ctx.strokeStyle = '#003300';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(center, center, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.strokeStyle = '#002200';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(center, 10);
      ctx.lineTo(center, size - 10);
      ctx.moveTo(10, center);
      ctx.lineTo(size - 10, center);
      ctx.stroke();

      // Sweep trail (fading gradient)
      const trailGrad = ctx.createConicGradient(angle - Math.PI / 2, center, center);
      trailGrad.addColorStop(0, 'rgba(0, 255, 65, 0.15)');
      trailGrad.addColorStop(0.08, 'rgba(0, 255, 65, 0.05)');
      trailGrad.addColorStop(0.15, 'rgba(0, 255, 65, 0)');
      trailGrad.addColorStop(1, 'rgba(0, 255, 65, 0)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.arc(center, center, maxRadius, 0, Math.PI * 2);
      ctx.fill();

      // Sweep line
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ff41';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(
        center + maxRadius * Math.cos(angle),
        center + maxRadius * Math.sin(angle)
      );
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Drone blip
      if (showBlip) {
        const blipX = center + blipRadius * Math.cos(blipAngle);
        const blipY = center + blipRadius * Math.sin(blipAngle);
        
        // Outer glow
        ctx.fillStyle = 'rgba(255, 0, 51, 0.3)';
        ctx.beginPath();
        ctx.arc(blipX, blipY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner dot
        ctx.fillStyle = '#ff0033';
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(blipX, blipY, 3 + Math.sin(Date.now() / 200) * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Track ID label
        ctx.fillStyle = '#ff0033';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText('TRK-0042', blipX + 10, blipY - 5);
      }

      // Center dot
      ctx.fillStyle = '#00ff41';
      ctx.beginPath();
      ctx.arc(center, center, 2, 0, Math.PI * 2);
      ctx.fill();

      // Range labels
      ctx.fillStyle = '#004400';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText('1km', center + 28, center - 3);
      ctx.fillText('2km', center + 58, center - 3);

      angle += 0.03;
      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [phase, droneDistance]);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] font-[family-name:var(--font-display)] tracking-widest text-[var(--color-primary)] uppercase">RADAR SCOPE</p>
      <canvas
        ref={canvasRef}
        width={220}
        height={220}
        className="rounded-full border border-[var(--color-border)]"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
}
