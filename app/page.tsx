'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 gradient-indigo pointer-events-none" />

            {/* Hero Section */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                <div className="text-center space-y-8">
                    {/* Badge */}
                    <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass border border-indigo-500/30">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-indigo-300">Powered by AI</span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                        <span className="block text-white">CampusFix AI</span>
                        <span className="block mt-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Intelligent Campus Maintenance Protocol
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="max-w-2xl mx-auto text-lg sm:text-xl text-zinc-400">
                        Transform campus maintenance with AI-powered issue detection, smart reporting,
                        and automated resolution tracking. Built for the modern campus.
                    </p>

                    {/* CTA Button */}
                    <div className="flex justify-center">
                        <Link
                            href="/login"
                            className="group inline-flex items-center space-x-2 px-8 py-4 rounded-xl indigo-glow text-white font-semibold text-lg"
                        >
                            <span>Get Started</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 smooth-transition" />
                        </Link>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
                        <div className="glass rounded-2xl p-6 smooth-transition hover:border-indigo-500/50">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4">
                                <Zap className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
                            <p className="text-zinc-400">
                                Report issues instantly with AI-powered categorization and priority assignment
                            </p>
                        </div>

                        <div className="glass rounded-2xl p-6 smooth-transition hover:border-indigo-500/50">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                                <Shield className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
                            <p className="text-zinc-400">
                                Enterprise-grade security with Firebase authentication and real-time database
                            </p>
                        </div>

                        <div className="glass rounded-2xl p-6 smooth-transition hover:border-indigo-500/50">
                            <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4">
                                <Sparkles className="w-6 h-6 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">AI-Powered</h3>
                            <p className="text-zinc-400">
                                Smart insights and automated workflows powered by Google AI Studio
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
