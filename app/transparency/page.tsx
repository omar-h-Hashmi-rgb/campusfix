'use client';

import { useEffect, useState } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    TrendingUp,
    CheckCircle,
    BarChart3,
    MapPin,
    Clock,
    Sparkles,
    ArrowRight,
} from 'lucide-react';

interface Ticket {
    id: string;
    title: string;
    description: string;
    category: string;
    status: 'open' | 'in-progress' | 'resolved';
    timestamp: number;
    ai_category?: string;
    ai_priority?: number;
    ai_summary?: string;
    location: {
        lat: number;
        lng: number;
    };
}

export default function TransparencyPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const ticketsRef = ref(database, 'tickets');
        const unsubscribe = onValue(ticketsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const ticketsList: Ticket[] = Object.entries(data).map(([id, ticket]: [string, any]) => ({
                    id,
                    ...ticket,
                }));
                setTickets(ticketsList);
            } else {
                setTickets([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const stats = {
        total: tickets.length,
        resolved: tickets.filter((t) => t.status === 'resolved').length,
        resolutionRate: tickets.length > 0 ? Math.round((tickets.filter((t) => t.status === 'resolved').length / tickets.length) * 100) : 0,
    };

    const recentFixes = tickets
        .filter((t) => t.status === 'resolved')
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);

    // Find hotspot (most reported category)
    const categoryCount: { [key: string]: number } = {};
    tickets.forEach((ticket) => {
        const cat = ticket.ai_category || ticket.category;
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    const hotspot = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 py-12 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 gradient-indigo pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm mb-4">
                        <Sparkles className="w-4 h-4" />
                        <span>Live Campus Transparency</span>
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Campus Maintenance Dashboard
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Real-time insights into campus maintenance activities. See what's being fixed, track progress, and hold us accountable.
                    </p>
                </motion.div>

                {/* Live Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass rounded-2xl p-8 border border-white/10 text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="w-8 h-8 text-indigo-400" />
                        </div>
                        <p className="text-5xl font-bold text-white mb-2">{stats.total}</p>
                        <p className="text-zinc-400">Total Tickets Reported</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-2xl p-8 border border-green-500/30 text-center indigo-glow"
                    >
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <p className="text-5xl font-bold text-white mb-2">{stats.resolved}</p>
                        <p className="text-zinc-400">Issues Resolved</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass rounded-2xl p-8 border border-white/10 text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="w-8 h-8 text-purple-400" />
                        </div>
                        <p className="text-5xl font-bold text-white mb-2">{stats.resolutionRate}%</p>
                        <p className="text-zinc-400">Resolution Rate</p>
                    </motion.div>
                </div>

                {/* Recent Fixes Feed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl font-bold text-white mb-6 flex items-center space-x-3">
                        <Clock className="w-8 h-8 text-indigo-400" />
                        <span>Recent Fixes</span>
                    </h2>

                    {recentFixes.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center border border-white/10">
                            <p className="text-zinc-400">No resolved issues yet. Check back soon!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentFixes.map((ticket, index) => (
                                <motion.div
                                    key={ticket.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                    className="glass rounded-xl p-6 border border-green-500/20 hover:border-green-500/40 smooth-transition"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                            <span className="text-xs text-green-400 font-medium">RESOLVED</span>
                                        </div>
                                        <span className="text-xs text-zinc-500">
                                            {new Date(ticket.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">{ticket.title}</h3>
                                    {ticket.ai_summary && (
                                        <p className="text-sm text-indigo-300 mb-2">🤖 {ticket.ai_summary}</p>
                                    )}
                                    <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{ticket.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                                            {ticket.ai_category || ticket.category}
                                        </span>
                                        {ticket.ai_priority && (
                                            <span className="text-xs text-zinc-500">Priority: {ticket.ai_priority}/10</span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Hotspot Card */}
                {hotspot && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="glass rounded-2xl p-8 border border-red-500/30 mb-12"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <MapPin className="w-6 h-6 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">Current Hotspot</h3>
                                        <p className="text-zinc-400">Area requiring most attention</p>
                                    </div>
                                </div>
                                <div className="flex items-baseline space-x-4">
                                    <p className="text-4xl font-bold text-red-400">{hotspot[0]}</p>
                                    <p className="text-xl text-zinc-400">{hotspot[1]} reports</p>
                                </div>
                                <p className="text-sm text-zinc-500 mt-2">
                                    This category has the highest number of reported issues. Our team is prioritizing fixes in this area.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-center"
                >
                    <div className="glass rounded-2xl p-12 border border-white/10">
                        <h3 className="text-3xl font-bold text-white mb-4">See an Issue?</h3>
                        <p className="text-zinc-400 mb-6 max-w-2xl mx-auto">
                            Help us maintain our campus by reporting maintenance issues. Every report helps us improve.
                        </p>
                        <Link
                            href="/report"
                            className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl indigo-glow text-white font-medium text-lg"
                        >
                            <span>Report an Issue</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
