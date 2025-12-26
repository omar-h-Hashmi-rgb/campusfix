'use client';

import { motion } from 'framer-motion';

export default function TimelineSkeleton() {
    return (
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-6">
                <div className="w-5 h-5 bg-zinc-700 rounded animate-pulse" />
                <div className="h-6 w-32 bg-zinc-700 rounded animate-pulse" />
            </div>

            <div className="space-y-8">
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="flex items-start space-x-4">
                        {/* Icon skeleton */}
                        <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-zinc-700 animate-pulse" />
                        </div>

                        {/* Content skeleton */}
                        <div className="flex-1 pt-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="h-5 w-24 bg-zinc-700 rounded animate-pulse" />
                                <div className="h-4 w-20 bg-zinc-700 rounded animate-pulse" />
                            </div>
                            <div className="h-4 w-48 bg-zinc-700 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
