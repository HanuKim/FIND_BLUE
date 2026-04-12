'use client';

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  AbsoluteFill,
} from 'remotion';

export const HeroAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const loopDuration = 8 * fps;
  const loopFrame = frame % loopDuration;
  const progress = loopFrame / loopDuration;

  /* ── Sphere float ── */
  const sphereY = interpolate(
    Math.sin(progress * Math.PI * 2),
    [-1, 1],
    [-12, 12]
  );

  const sphereScale = interpolate(
    Math.sin(progress * Math.PI * 2 + 0.5),
    [-1, 1],
    [0.95, 1.05]
  );

  /* ── Ripple rings (3 concentric) ── */
  const ripples = [0, 1, 2].map((i) => {
    const delay = i * 0.33;
    const rippleProgress = ((progress + delay) % 1);
    
    const scale = interpolate(rippleProgress, [0, 1], [0.3, 2.5], {
      easing: Easing.out(Easing.cubic),
    });
    
    const opacity = interpolate(rippleProgress, [0, 0.2, 1], [0, 0.6, 0], {
      easing: Easing.out(Easing.cubic),
    });
    
    return { scale, opacity, key: i };
  });

  /* ── Background gradient rotation ── */
  const gradAngle = interpolate(frame, [0, loopDuration * 3], [0, 360]);

  /* ── Glow pulse ── */
  const glowOpacity = interpolate(
    Math.sin(progress * Math.PI * 2),
    [-1, 1],
    [0.15, 0.4]
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradAngle}deg, #e8edf8 0%, #d4dcf4 25%, #c8c6f0 50%, #d4dcf4 75%, #e8edf8 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Subtle grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,83,220,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,83,220,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ripple rings container */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {ripples.map((r) => (
          <div
            key={r.key}
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              border: `2px solid rgba(74, 75, 215, ${r.opacity})`,
              transform: `scale(${r.scale})`,
              boxShadow: `0 0 20px rgba(74, 75, 215, ${r.opacity * 0.3})`,
            }}
          />
        ))}
      </div>

      {/* Surface ripple lines (elliptical) */}
      {[0, 1, 2, 3, 4].map((i) => {
        const lineDelay = i * 0.2;
        const lineProgress = ((progress + lineDelay) % 1);
        const lineScale = interpolate(lineProgress, [0, 1], [0.5, 3]);
        const lineOpacity = interpolate(lineProgress, [0, 0.15, 1], [0, 0.25, 0]);

        return (
          <div
            key={`line-${i}`}
            style={{
              position: 'absolute',
              width: 300,
              height: 80,
              borderRadius: '50%',
              border: `1.5px solid rgba(0, 83, 220, ${lineOpacity})`,
              transform: `scale(${lineScale}) translateY(${60 + i * 5}px)`,
              top: '50%',
              left: '50%',
              marginLeft: -150,
              marginTop: -40,
            }}
          />
        );
      })}

      {/* Glass sphere */}
      <div
        style={{
          position: 'relative',
          width: 180,
          height: 180,
          transform: `translateY(${sphereY}px) scale(${sphereScale})`,
          zIndex: 10,
        }}
      >
        {/* Main sphere */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: `
              radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 20%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(200, 198, 240, 0.6) 0%, rgba(140, 138, 220, 0.4) 40%, rgba(74, 75, 215, 0.3) 70%, rgba(0, 83, 220, 0.15) 100%)
            `,
            boxShadow: `
              0 ${20 + sphereY * 0.3}px ${60 - sphereY * 0.5}px rgba(74, 75, 215, ${glowOpacity}),
              inset 0 -20px 40px rgba(74, 75, 215, 0.1),
              inset 0 10px 30px rgba(255, 255, 255, 0.3)
            `,
          }}
        />
        {/* Highlight arc */}
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: 30,
            width: 80,
            height: 45,
            borderRadius: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)',
            transform: 'rotate(-15deg)',
          }}
        />
        {/* Small refraction dot */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 35,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.5)',
            filter: 'blur(2px)',
          }}
        />
      </div>

      {/* Shadow under sphere */}
      <div
        style={{
          position: 'absolute',
          top: '65%',
          width: 200,
          height: 30,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(74, 75, 215, ${glowOpacity * 0.5}) 0%, transparent 70%)`,
          transform: `scaleX(${1 + sphereY * 0.005})`,
        }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => {
        const particleOffset = (i / 6) * Math.PI * 2;
        const px = Math.cos(progress * Math.PI * 2 + particleOffset) * (120 + i * 30);
        const py = Math.sin(progress * Math.PI * 2 + particleOffset) * (80 + i * 20);
        const pOpacity = interpolate(
          Math.sin(progress * Math.PI * 2 + i),
          [-1, 1],
          [0.1, 0.4]
        );

        return (
          <div
            key={`p-${i}`}
            style={{
              position: 'absolute',
              width: 4 + i,
              height: 4 + i,
              borderRadius: '50%',
              background: `rgba(74, 75, 215, ${pOpacity})`,
              transform: `translate(${px}px, ${py}px)`,
              filter: 'blur(1px)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
