'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';
import { HorizonHero } from '@/components/ui/horizon-hero-section';
import WaveFeatureCard from '@/components/ui/wave-feature-card';
import { GradientBackground } from '@/components/ui/gradient-background';

export default function Home() {
    return (
        <div className="relative min-h-[300vh]">
            {/* 3D Background - Fixed in component */}
            <HorizonHero />

            {/* Content Overlays for Scroll sections - Transparent spacers to allow scrolling */}
            <div className="h-screen w-full relative z-0" /> {/* Section 1 Spacer */}
            <div className="h-screen w-full relative z-0" /> {/* Section 2 Spacer */}
            <div className="h-screen w-full relative z-0" /> {/* Section 3 Spacer */}

            {/* Final Content Section - Visible after scrolling through 3D effect */}
            <GradientBackground className="relative z-10 border-t border-white/10 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-8 drop-shadow-xl">
                            Ready to Transform <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Campus Maintenance?</span>
                        </h2>
                        <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto mb-12 leading-relaxed">
                            Join the revolution in intelligent facility management. Report, track, and resolve issues with the power of Google Gemini AI.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/tour"
                                className="px-8 py-4 rounded-xl font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:scale-105 transition-all flex items-center gap-2 backdrop-blur-md"
                            >
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                <span>Take a Tour</span>
                            </Link>
                            <Link
                                href="/auth"
                                className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_50px_rgba(99,102,241,0.7)] hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <span>Get Started</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Feature Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <WaveFeatureCard
                            title="Lightning Fast"
                            description="Report issues instantly with AI-powered categorization and priority assignment."
                            icon={Zap}
                            tag="Performance"
                            color="#818cf8" // Indigo-400
                            delay={0}
                        />
                        <WaveFeatureCard
                            title="Secure & Private"
                            description="Enterprise-grade security with Firebase authentication and real-time database."
                            icon={Shield}
                            tag="Security"
                            color="#c084fc" // Purple-400
                            delay={0.2}
                        />
                        <WaveFeatureCard
                            title="AI-Powered"
                            description="Smart insights and automated workflows powered by Google Gemini AI."
                            icon={Sparkles}
                            tag="Intelligence"
                            color="#f472b6" // Pink-400
                            delay={0.4}
                        />
                    </div>

                    <div className="mt-24 text-center text-zinc-500 text-sm">
                        <p>&copy; 2026 CampusFix AI. Built with 💖 by Omar Hashmi.</p>
                    </div>
                </div>
            </GradientBackground>
        </div>
    );
}
