'use client';

import React, { useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface WaveFeatureCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    tag: string;
    color?: string; // Hex color for the wave
    delay?: number; // Animation delay
}

export default function WaveFeatureCard({
    title,
    description,
    icon: Icon,
    tag,
    color = '#6366f1', // Default indigo
    delay = 0
}: WaveFeatureCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let time = 0;
        let animationFrameId: number;

        // Parse color to RGB for rgba manipulation
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 99, g: 102, b: 241 };
        };

        const rgb = hexToRgb(color);

        const waveData = Array.from({ length: 5 }).map(() => ({
            value: Math.random() * 0.5 + 0.1,
            targetValue: Math.random() * 0.5 + 0.1,
            speed: Math.random() * 0.02 + 0.01
        }));

        function resizeCanvas() {
            if (!cardRef.current || !canvas) return;
            // Make canvas match the card header size
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        }

        function updateWaveData() {
            waveData.forEach(data => {
                if (Math.random() < 0.01) data.targetValue = Math.random() * 0.7 + 0.1;
                const diff = data.targetValue - data.value;
                data.value += diff * data.speed;
            });
        }

        function draw() {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            waveData.forEach((data, i) => {
                const freq = data.value * 7;
                ctx.beginPath();

                for (let x = 0; x < canvas.width; x++) {
                    const nx = (x / canvas.width) * 2 - 1;
                    const px = nx + i * 0.04 + freq * 0.03;
                    // Modified math for smaller container
                    const py = Math.sin(px * 10 + time) * Math.cos(px * 2) * freq * 0.1 * ((i + 1) / 5);
                    const y = (py + 1) * canvas.height / 2;
                    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }

                const intensity = Math.min(1, freq * 0.3);
                ctx.lineWidth = 1 + i * 0.3;
                ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.4 + intensity * 0.4})`;
                ctx.shadowColor = `rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`;
                ctx.shadowBlur = 5;
                ctx.stroke();
                ctx.shadowBlur = 0;
            });
        }

        function animate() {
            time += 0.02;
            updateWaveData();
            draw();
            animationFrameId = requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [color]);

    return (
        <div ref={cardRef} className="w-full h-full" style={{ animationDelay: `${delay}s` }}>
            <div className="relative card-border overflow-hidden rounded-2xl flex flex-col h-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors duration-300 animate-float group">

                {/* Visual Header with Wave */}
                <div className="p-4 flex justify-center relative h-48 shrink-0">
                    <div className="w-full h-full rounded-xl bg-black/20 overflow-hidden relative border border-white/5">
                        {/* Animated grid background */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="w-full h-full" style={{
                                backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }} />
                        </div>

                        {/* Canvas Wave */}
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                        {/* Icon Centered */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl group-hover:scale-110 transition-transform duration-300">
                                <Icon className="w-8 h-8 text-white relative z-10" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="p-6 flex flex-col grow">
                    <div className="flex justify-between items-start mb-4">
                        <span
                            className="inline-block px-3 py-1 bg-white/5 text-xs font-medium rounded-full border border-white/10 backdrop-blur-sm"
                            style={{ color: color, borderColor: `${color}30`, backgroundColor: `${color}10` }}
                        >
                            {tag}
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors">{title}</h3>

                    <p className="text-zinc-400 mb-6 leading-relaxed text-sm grow">
                        {description}
                    </p>

                    <div className="flex items-center text-sm font-medium text-white/40 group-hover:text-white transition-colors">
                        <span>Learn more</span>
                        <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
}
