'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Clock, MapPin, AlertCircle, ThumbsUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Ticket {
    id: string;
    title: string;
    description: string;
    category: string;
    location: string | { lat: number; lng: number };
    status: 'open' | 'in-progress' | 'resolved';
    timestamp: number;
    userId: string;
    userEmail: string;
    ai_summary?: string;
    ai_priority?: number;
    upvotes?: number;
    upvotedBy?: string[];
    imageUrl?: string;
}

export default function PreviousReportsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        const ticketsRef = ref(database, 'tickets');
        const unsubscribe = onValue(ticketsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const ticketsArray: Ticket[] = Object.entries(data)
                    .map(([id, ticket]: [string, any]) => ({
                        id,
                        ...ticket,
                    }))
                    .filter((ticket) => ticket.userEmail === user.email)
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(1); // Skip the first (most recent) ticket

                setTickets(ticketsArray);
            } else {
                setTickets([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, router]);

    const getStatusBadge = (status: string) => {
        const badges = {
            'open': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            'in-progress': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
            'resolved': 'bg-green-500/20 text-green-300 border-green-500/30',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badges[status as keyof typeof badges]}`}>
                {status.replace('-', ' ').toUpperCase()}
            </span>
        );
    };

    const getPriorityColor = (priority: number) => {
        if (priority >= 8) return 'text-red-400';
        if (priority >= 5) return 'text-yellow-400';
        return 'text-green-400';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-dark pt-20 pb-12 px-4 sm:px-6 lg:px-8 no-overflow">
            <div className="max-w-6xl mx-auto mobile-container">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 mb-4 smooth-transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Dashboard</span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 wrap-text">
                        Your Previous Reports
                    </h1>
                    <p className="text-zinc-400">View all your previously submitted maintenance requests</p>
                </div>

                {/* Tickets List */}
                {tickets.length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center">
                        <Clock className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Previous Reports</h3>
                        <p className="text-zinc-400">You haven't submitted any other reports yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {tickets.map((ticket, index) => (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card rounded-2xl p-4 sm:p-6 hover-lift mobile-card"
                            >
                                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h3 className="text-lg sm:text-xl font-semibold text-white wrap-text">{ticket.title}</h3>
                                            {getStatusBadge(ticket.status)}
                                        </div>
                                        {ticket.ai_summary && (
                                            <p className="text-sm text-zinc-400 mb-2 wrap-text">
                                                🤖 AI Summary: {ticket.ai_summary}
                                            </p>
                                        )}
                                        <p className="text-zinc-300 mb-4 wrap-text">{ticket.description}</p>

                                        {ticket.imageUrl && (
                                            <img
                                                src={ticket.imageUrl}
                                                alt="Issue"
                                                className="w-full max-w-md h-48 object-cover rounded-lg mb-4"
                                            />
                                        )}

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                                            <div className="flex items-center space-x-2">
                                                <ThumbsUp className="w-4 h-4" />
                                                <span>{ticket.upvotes || 0}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="w-4 h-4" />
                                                <span className="wrap-text">{ticket.category}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 wrap-text">
                                                <MapPin className="w-4 h-4" />
                                                <span className="wrap-text">
                                                    {typeof ticket.location === 'object' && ticket.location?.lat && ticket.location?.lng
                                                        ? `${ticket.location.lat.toFixed(4)}, ${ticket.location.lng.toFixed(4)}`
                                                        : typeof ticket.location === 'string'
                                                            ? ticket.location
                                                            : 'Location not available'
                                                    }
                                                </span>
                                            </div>
                                            {ticket.ai_priority && (
                                                <div className={`flex items-center space-x-1 ${getPriorityColor(ticket.ai_priority)}`}>
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>Priority: {ticket.ai_priority}/10</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-zinc-500 text-sm wrap-text flex-shrink-0">
                                        {new Date(ticket.timestamp).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
