import React, { useEffect, useRef } from 'react';
import { HandTrackingData, GestureType, Particle, Star } from '../types';

interface FireworkDisplayProps {
  handData: React.MutableRefObject<HandTrackingData | null>;
}

const FireworkDisplay: React.FC<FireworkDisplayProps> = ({ handData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const lastGestureRef = useRef<GestureType>(GestureType.UNKNOWN);
  const lastExplosionTimeRef = useRef<number>(0);

  // Constants
  const GRAVITY = 0.15;
  const FRICTION = 0.96;
  const COLORS = [
    '#ff0040', // Red
    '#00ff80', // Green
    '#4000ff', // Blue
    '#ffff00', // Yellow
    '#ff8000', // Orange
    '#ff00ff', // Magenta
    '#00ffff', // Cyan
    '#ffffff', // White
  ];

  const initStars = (width: number, height: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.005
      });
    }
    starsRef.current = stars;
  };

  const createExplosion = (x: number, y: number) => {
    const particleCount = 80 + Math.random() * 40;
    const baseColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    // Sometimes mixed colors, sometimes uniform
    const mixColors = Math.random() > 0.5;

    for (let i = 0; i < particleCount; i++) {
      const speed = Math.random() * 8 + 2;
      const angle = Math.random() * Math.PI * 2;
      
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: mixColors ? COLORS[Math.floor(Math.random() * COLORS.length)] : baseColor,
        alpha: 1,
        size: Math.random() * 3 + 1,
        decay: Math.random() * 0.015 + 0.005,
        life: 1.0,
        maxLife: 1.0
      });
    }
  };

  const clearParticles = () => {
    // Rapidly fade out
    particlesRef.current.forEach(p => {
      p.decay = 0.1; // Accelerate decay
      p.vx *= 1.1; // Explode outwards slightly before vanishing
      p.vy *= 1.1;
    });
  };

  const animate = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Handle Window Resize (Naive approach for this example)
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (starsRef.current.length === 0) initStars(canvas.width, canvas.height);
    }

    // 2. Clear Screen with fade effect for trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Draw Stars
    starsRef.current.forEach(star => {
      star.opacity += star.twinkleSpeed;
      if (star.opacity > 1 || star.opacity < 0.2) star.twinkleSpeed *= -1;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.opacity)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Handle Input & Logic
    const currentData = handData.current;
    if (currentData) {
      const { x: normX, y: normY, gesture } = currentData;
      const screenX = normX * canvas.width;
      const screenY = normY * canvas.height;

      // Draw Cursor/Hand indicator
      ctx.beginPath();
      ctx.arc(screenX, screenY, 10, 0, Math.PI * 2);
      ctx.strokeStyle = gesture === GestureType.OPEN ? '#fff' : '#444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Logic: Trigger on Rising Edge (Non-Open -> Open)
      if (gesture === GestureType.OPEN && lastGestureRef.current !== GestureType.OPEN) {
        // Debounce slightly to prevent spam if tracking jitters
        if (time - lastExplosionTimeRef.current > 200) {
            createExplosion(screenX, screenY);
            lastExplosionTimeRef.current = time;
        }
      }

      // Logic: Clear on Fist
      if (gesture === GestureType.CLOSED && lastGestureRef.current !== GestureType.CLOSED) {
        clearParticles();
      }

      lastGestureRef.current = gesture;
    }

    // 5. Update & Draw Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      
      // Physics
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= FRICTION;
      p.vy *= FRICTION;
      p.vy += GRAVITY;
      p.alpha -= p.decay;
      p.life = p.alpha;

      // Draw
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Remove dead particles
      if (p.alpha <= 0) {
        particlesRef.current.splice(i, 1);
      }
    }
    
    // Reset standard drawing state
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 touch-none"
    />
  );
};

export default FireworkDisplay;