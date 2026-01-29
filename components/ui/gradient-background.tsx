'use client';
import type React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type GradientBackgroundProps = React.ComponentProps<'div'> & {
    // Animation customization
    gradients?: string[];
    animationDuration?: number;
    animationDelay?: number;

    // Layout customization
    enableCenterContent?: boolean;

    // Visual customization
    overlay?: boolean;
    overlayOpacity?: number;
};

// Darker default gradients to match the user's "black background" request while keeping the animation
const Default_Gradients = [
    "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", // Zinc-950 to Indigo-950
    "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", // Indigo-950 to Indigo-900
    "linear-gradient(135deg, #09090b 0%, #27272a 100%)", // Zinc-950 to Zinc-800
    "linear-gradient(135deg, #020617 0%, #172554 100%)", // Slate-950 to Blue-950
    "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", // Loop back
]

export function GradientBackground({
    children,
    className = '',
    gradients = Default_Gradients,
    animationDuration = 10,
    animationDelay = 0,
    overlay = true,
    overlayOpacity = 0.5,
}: GradientBackgroundProps) {
    return (
        <div className={cn('w-full relative min-h-screen overflow-hidden', className)}>
            {/* Animated gradient background */}
            <motion.div
                className="absolute inset-0"
                style={{ background: gradients[0] }}
                animate={{ background: gradients }}
                transition={{
                    delay: animationDelay,
                    duration: animationDuration,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                    repeatType: "mirror"
                }}
            />

            {/* Optional overlay */}
            {overlay && (
                <div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: overlayOpacity }}
                />
            )}

            {/* Content wrapper */}
            {children && (
                <div
                    className={cn(
                        'relative z-10',
                        // Removed flex centering default to let parent control layout if needed
                    )}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
