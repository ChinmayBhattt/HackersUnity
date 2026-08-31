'use client';

import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    let gridLines = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();

    // Grid lines (moving)
    const gridCount = 25;
    for (let i = 0; i < gridCount; i++) {
      gridLines.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: 80 + Math.random() * 140,
        speed: 0.25 + Math.random() * 0.5,
        horizontal: Math.random() > 0.5,
        color: 'rgba(15, 23, 42, 0.08)',
      });
    }

    // Floating code particles
    const codeSnippets = ['{', '}', '</', '()', '=>', '[]', '01', '/>', '&&', '||', '!=', '++', '::', '//', '#!'];
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        text: codeSnippets[Math.floor(Math.random() * codeSnippets.length)],
        size: 13 + Math.random() * 8,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: -0.25 - Math.random() * 0.35,
        opacity: 0.22 + Math.random() * 0.22,
        color: Math.random() > 0.5 ? '#FF6A00' : '#0088FF',
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      gridLines.forEach((line) => {
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (line.horizontal) {
          ctx.moveTo(line.x, line.y);
          ctx.lineTo(line.x + line.length, line.y);
          line.x += line.speed;
          if (line.x > canvas.width) line.x = -line.length;
        } else {
          ctx.moveTo(line.x, line.y);
          ctx.lineTo(line.x, line.y + line.length);
          line.y += line.speed;
          if (line.y > canvas.height) line.y = -line.length;
        }
        ctx.stroke();
      });

      // Draw code particles
      particles.forEach((p) => {
        ctx.font = `${p.size}px JetBrains Mono, monospace`;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < -20) {
          p.y = canvas.height + 20;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -20 || p.x > canvas.width + 20) {
          p.x = Math.random() * canvas.width;
        }
      });

      animationId = requestAnimationFrame(draw);
    }

    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
