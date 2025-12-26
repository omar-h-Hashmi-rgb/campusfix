'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Target, CheckCircle, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';

const steps = [
    {
        id: 1,
        title: 'Report Issues Instantly',
        description: 'Spot a problem on campus? Report it in seconds with photos, voice input, and precise location mapping.',
        icon: Target,
        features: [
            'Multi-language support (9 Indian languages + English)',
            'Voice-to-text reporting',
            'Interactive map location picker',
            'Photo upload with compression'
        ],
        color: 'from-indigo-500 to-purple-500'
    },
    {
        id: 2,
        title: 'AI-Powered Analysis',
        description: 'Our advanced AI instantly categorizes, prioritizes, and generates smart summaries of your maintenance requests.',
        icon: Sparkles,
        features: [
            'Automatic issue categorization',
            'Intelligent priority scoring (1-10)',
            'AI-generated fix guides',
            'Real-time translation'
        ],
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: 3,
        title: 'Track & Resolve',
        description: 'Monitor your tickets in real-time, earn karma points, and watch as campus maintenance becomes a community effort.',
        icon: CheckCircle,
        features: [
            'Live status tracking',
            'Karma points & contributor badges',
            'Community upvoting system',
            'Public transparency dashboard'
        ],
        color: 'from-pink-500 to-rose-500'
    }
];

export default function OnboardingPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const router = useRouter();

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            router.push('/dashboard');
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        router.push('/dashboard');
    };

    const step = steps[currentStep];
    const Icon = step.icon;

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-950 flex items-center justify-center p-4 overflow-hidden relative pt-16">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.5, 0.3, 0.5],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1
                        }}
                    />
                </div>

                <div className="relative z-10 w-full max-w-4xl">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center mb-8 space-x-2">
                        {steps.map((_, index) => (
                            <motion.div
                                key={index}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentStep
                                    ? 'w-12 bg-indigo-500'
                                    : index < currentStep
                                        ? 'w-8 bg-indigo-500/50'
                                        : 'w-8 bg-white/20'
                                    }`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                            />
                        ))}
                    </div>

                    {/* Main Card */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl"
                        >
                            {/* Icon */}
                            <motion.div
                                className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 mx-auto`}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            >
                                <Icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                            </motion.div>

                            {/* Step Number */}
                            <motion.p
                                className="text-center text-indigo-400 font-semibold mb-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Step {currentStep + 1} of {steps.length}
                            </motion.p>

                            {/* Title */}
                            <motion.h1
                                className="text-3xl md:text-5xl font-bold text-white text-center mb-4 tracking-tight"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                {step.title}
                            </motion.h1>

                            {/* Description */}
                            <motion.p
                                className="text-lg md:text-xl text-zinc-300 text-center mb-8 max-w-2xl mx-auto"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                {step.description}
                            </motion.p>

                            {/* Features */}
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                {step.features.map((feature, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-start space-x-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.7 + index * 0.1 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <p className="text-sm md:text-base text-zinc-200">{feature}</p>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Navigation Buttons */}
                            <div className="flex items-center justify-between gap-4">
                                {currentStep > 0 ? (
                                    <motion.button
                                        onClick={handleBack}
                                        className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium smooth-transition"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                        <span className="hidden sm:inline">Back</span>
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        onClick={handleSkip}
                                        className="px-6 py-3 rounded-xl text-zinc-400 hover:text-white font-medium smooth-transition"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Skip
                                    </motion.button>
                                )}

                                <motion.button
                                    onClick={handleNext}
                                    className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-semibold smooth-transition ${currentStep === steps.length - 1
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white glow-indigo'
                                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                                        }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
                                    {currentStep === steps.length - 1 ? (
                                        <ArrowRight className="w-5 h-5" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5" />
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Skip Button (Mobile) */}
                    {currentStep === 0 && (
                        <motion.div
                            className="text-center mt-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                        >
                            <button
                                onClick={handleSkip}
                                className="text-zinc-400 hover:text-white text-sm smooth-transition"
                            >
                                Already know how it works? <span className="text-indigo-400">Skip intro</span>
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
}
