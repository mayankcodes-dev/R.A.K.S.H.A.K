'use client';

import { useRef, useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';

export function RadarScope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phase = useGameStore((s) => s.phase);
  const droneDistance = useGameStore((s) => s.droneDistance);
  const droneWave = useGameStore((s) => s.droneWave);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const size = 200;
    const center = size / 2;
    const maxRadius = 88;
    let angle = 0;
    let frameId: number;

    const showBlip = ['DETECTED', 'CLASSIFYING', 'AWAITING_ACTION', 'WRONG_ACTION', 'CORRECT_ACTION', 'ENGAGEMENT', 'NEUTRALIZED'].includes(phase);
    const isThreatActive = ['AWAITING_ACTION', 'WRONG_ACTION', 'CORRECT_ACTION', 'ENGAGEMENT'].includes(phase);
    const blipRadius = showBlip ? Math.max(5, (droneDistance / 2000) * maxRadius) : 0;
    const blipAngle = -0.8;

    // Sweep color: red when threat active, green otherwise
    const sweepColor = isThreatActive ? '#ff0033' : '#00ff41';
    const ringColor = isThreatActive ? '#330000' : '#003300';
    const sweepTrailColor = isThreatActive ? 'rgba(255,0,51,' : 'rgba(0,255,65,';

    const draw = () => {
      ctx.fillStyle = isThreatActive ? '#0d0000' : '#001a00';
      ctx.fillRect(0, 0, size, size);

      // Range rings — change colour with threat
      [28, 55, 82].forEach((r) => {
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(center, center, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.strokeStyle = isThreatActive ? '#220000' : '#002200';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(center, 8);
      ctx.lineTo(center, size - 8);
      ctx.moveTo(8, center);
      ctx.lineTo(size - 8, center);
      ctx.stroke();

      // Sweep trail
      const trailGrad = ctx.createConicGradient(angle - Math.PI / 2, center, center);
      trailGrad.addColorStop(0, `${sweepTrailColor}0.18)`);
      trailGrad.addColorStop(0.08, `${sweepTrailColor}0.06)`);
      trailGrad.addColorStop(0.15, `${sweepTrailColor}0)`);
      trailGrad.addColorStop(1, `${sweepTrailColor}0)`);
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.arc(center, center, maxRadius, 0, Math.PI * 2);
      ctx.fill();

      // Sweep line — red when threat, green when clear
      ctx.strokeStyle = sweepColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = sweepColor;
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

        ctx.fillStyle = 'rgba(255,0,51,0.25)';
        ctx.beginPath();
        ctx.arc(blipX, blipY, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff0033';
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(blipX, blipY, 3 + Math.sin(Date.now() / 200) * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Wave label — TRK-001 / TRK-002 / TRK-003
        ctx.fillStyle = '#ff0033';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillText(`TRK-00${droneWave}`, blipX + 10, blipY - 5);
      }

      // Center dot
      ctx.fillStyle = sweepColor;
      ctx.beginPath();
      ctx.arc(center, center, 2, 0, Math.PI * 2);
      ctx.fill();

      angle += 0.03;
      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [phase, droneDistance, droneWave]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center justify-between w-full px-1">
        <span className="text-[9px] tracking-[0.2em] text-[#334455]" style={{ fontFamily: '"Orbitron", sans-serif' }}>RADAR</span>
      </div>
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="rounded-full"
        style={{ border: '1px solid rgba(0,255,65,0.08)', imageRendering: 'auto' }}
      />
    </div>
  );
}
