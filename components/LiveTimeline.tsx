'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, Wrench, Sparkles, User } from 'lucide-react';

interface TimelineStep {
    status: string;
    timestamp: number;
    message?: string;
    updatedBy?: string;
}

interface LiveTimelineProps {
    history: TimelineStep[];
}

const statusConfig = {
    'open': {
        icon: Clock,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        label: 'Reported'
    },
    'ai_analyzed': {
        icon: Sparkles,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/20',
        borderColor: 'border-indigo-500/30',
        label: 'AI Analyzed'
    },
    'assigned': {
        icon: User,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        label: 'Worker Assigned'
    },
    'in-progress': {
        icon: Wrench,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/30',
        label: 'In Progress'
    },
    'resolved': {
        icon: CheckCircle,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/30',
        label: 'Resolved'
    }
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: "spring" as const,
            stiffness: 200,
            damping: 20
        }
    }
};

const lineVariants = {
    hidden: { scaleY: 0 },
    visible: {
        scaleY: 1,
        transition: {
            duration: 0.5,
            ease: "easeOut" as const
        }
    }
};

export default function LiveTimeline({ history }: LiveTimelineProps) {
    if (!history || history.length === 0) {
        return (
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-zinc-400 text-center">No timeline data available</p>
            </div>
        );
    }

    return (
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>Status Timeline</span>
            </h3>

            <motion.div
                className="relative"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {history.map((step, index) => {
                    const config = statusConfig[step.status as keyof typeof statusConfig] || statusConfig['open'];
                    const Icon = config.icon;
                    const isLast = index === history.length - 1;

                    return (
                        <div key={index} className="relative">
                            <motion.div
                                variants={itemVariants}
                                className="flex items-start space-x-4 pb-8"
                            >
                                {/* Icon with glow */}
                                <div className="relative flex-shrink-0">
                                    <motion.div
                                        className={`w-12 h-12 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center relative z-10`}
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <Icon className={`w-6 h-6 ${config.color}`} />
                                    </motion.div>

                                    {/* Glow effect */}
                                    <div className={`absolute inset-0 ${config.bgColor} rounded-full blur-xl opacity-50`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-white font-medium">{config.label}</h4>
                                        <span className="text-xs text-zinc-500">
                                            {new Date(step.timestamp).toLocaleString('en-IN', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    {step.message && (
                                        <p className="text-sm text-zinc-400">{step.message}</p>
                                    )}
                                    {step.updatedBy && (
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Updated by: {step.updatedBy}
                                        </p>
                                    )}
                                </div>
                            </motion.div>

                            {/* Connecting line */}
                            {!isLast && (
                                <motion.div
                                    className="absolute left-6 top-12 w-0.5 h-8 bg-gradient-to-b from-indigo-500/50 to-indigo-500/20"
                                    variants={lineVariants}
                                    style={{ originY: 0 }}
                                />
                            )}
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
}
