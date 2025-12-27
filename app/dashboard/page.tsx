'use client';

import { useEffect, useState, Suspense, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { LogOut, Plus, Clock, CheckCircle, AlertCircle, MapPin, Tag, ChevronUp, Trophy, Award } from 'lucide-react';
import { getUserProfile, upvoteTicket, getLevelBadgeStyle, UserProfile } from '@/lib/karma';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import TimelineSkeleton from '@/components/TimelineSkeleton';

// Lazy load LiveTimeline for better performance
const LiveTimeline = dynamic(() => import('@/components/LiveTimeline'), {
    ssr: false,
    loading: () => <TimelineSkeleton />
});

interface Ticket {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    title: string;
    description: string;
    category: string;
    location: {
        lat: number;
        lng: number;
    };
    imageBase64?: string;
    status: 'open' | 'in-progress' | 'resolved';
    priority: string;
    timestamp: number;
    ai_category?: string;
    ai_priority?: number;
    ai_summary?: string;
    processed?: boolean;
    upvotes?: number;
    upvotedBy?: string[];
    history?: Array<{
        status: string;
        timestamp: number;
        message?: string;
        updatedBy?: string;
    }>;
}

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [upvoting, setUpvoting] = useState<string | null>(null);

    useEffect(() => {
        if (!user && !loading) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Load user profile for karma
    useEffect(() => {
        if (!user?.email) return;

        getUserProfile(user.email).then(setUserProfile);
    }, [user]);

    useEffect(() => {
        if (!user) return;

        // Real-time listener for tickets
        const ticketsRef = ref(database, 'tickets');
        const ticketsQuery = query(ticketsRef, orderByChild('timestamp'));

        const unsubscribe = onValue(ticketsQuery, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const ticketsArray: Ticket[] = Object.entries(data)
                    .map(([id, ticket]: [string, any]) => ({
                        id,
                        ...ticket,
                    }))
                    .filter((ticket) => ticket.userEmail === user.email)
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 1); // Only show the most recent ticket

                setTickets(ticketsArray);
            } else {
                setTickets([]);
            }
            setLoadingTickets(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleLogout = useCallback(async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }, [logout, router]);

    const handleUpvote = useCallback(async (ticketId: string, ticketOwnerEmail: string) => {
        if (!user?.email || upvoting) return;

        setUpvoting(ticketId);
        try {
            await upvoteTicket(ticketId, user.email, ticketOwnerEmail);
            // Refresh user profile to show updated karma
            const updated = await getUserProfile(user.email);
            setUserProfile(updated);
        } catch (error) {
            console.error('Upvote error:', error);
        } finally {
            setUpvoting(null);
        }
    }, [user, upvoting]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'resolved':
                return (
                    <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        <span>Resolved</span>
                    </div>
                );
            case 'in-progress':
                return (
                    <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        <span>In Progress</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        <span>Open</span>
                    </div>
                );
        }
    };

    const getPriorityColor = (priority: number) => {
        if (priority >= 8) return 'text-red-400';
        if (priority >= 5) return 'text-yellow-400';
        return 'text-green-400';
    };

    if (loading || loadingTickets) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen px-4 py-12 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 gradient-indigo pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 wrap-text">
                            Welcome, {user.displayName?.split(' ')[0] || 'Student'}! 👋
                        </h1>
                        <p className="text-zinc-400">Track your campus maintenance requests</p>
                    </div>
                    <Link
                        href="/report"
                        className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl indigo-glow text-white font-medium mobile-button"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Report Issue</span>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Karma Card */}
                    <div className="backdrop-blur-md bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 border border-white/10 shadow-xl shadow-black/20">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm text-zinc-400 mb-1">Total Karma</p>
                                <p className="text-3xl font-bold text-white">{userProfile?.karma || 0}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-yellow-400" />
                            </div>
                        </div>
                        {userProfile && (
                            <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full border text-xs font-medium ${getLevelBadgeStyle(userProfile.level)}`}>
                                <Award className="w-3 h-3" />
                                <span>{userProfile.level} Contributor</span>
                            </div>
                        )}
                    </div>

                    <div className="glass rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-400 mb-1">Total Issues</p>
                                <p className="text-3xl font-bold text-white">{tickets.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-indigo-400" />
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-400 mb-1">In Progress</p>
                                <p className="text-3xl font-bold text-white">
                                    {tickets.filter((t) => t.status === 'in-progress').length}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-yellow-400" />
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-zinc-400 mb-1">Resolved</p>
                                <p className="text-3xl font-bold text-white">
                                    {tickets.filter((t) => t.status === 'resolved').length}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tickets List */}
                {tickets.length === 0 ? (
                    <div className="glass rounded-3xl p-12 border border-white/10 text-center">
                        <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2">No Issues Reported Yet</h3>
                        <p className="text-zinc-400 mb-6">
                            Start by reporting your first campus maintenance issue
                        </p>
                        <Link
                            href="/report"
                            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl indigo-glow text-white font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Report Your First Issue</span>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white mb-4">Your Issues</h2>
                        {tickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                className="glass rounded-2xl p-6 border border-indigo-500/20 hover:border-indigo-500/40 smooth-transition"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 wrap-text">{ticket.title}</h3>
                                            {getStatusBadge(ticket.status)}
                                        </div>
                                        {ticket.ai_summary && (
                                            <p className="text-sm text-indigo-300 mb-2">
                                                🤖 AI Summary: {ticket.ai_summary}
                                            </p>
                                        )}
                                        <p className="text-zinc-400 text-sm line-clamp-2">{ticket.description}</p>
                                    </div>
                                    {ticket.imageBase64 && (
                                        <img
                                            src={ticket.imageBase64}
                                            alt="Issue"
                                            className="w-24 h-24 rounded-xl object-cover border border-white/10 ml-4"
                                        />
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-4">
                                        {/* Upvote Button */}
                                        <button
                                            onClick={() => handleUpvote(ticket.id, ticket.userEmail)}
                                            disabled={upvoting === ticket.id}
                                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg smooth-transition ${ticket.upvotedBy?.includes(user.email || '')
                                                ? 'bg-indigo-500 text-white'
                                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                                                } ${upvoting === ticket.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                            <span className="font-medium">{ticket.upvotes || 0}</span>
                                        </button>

                                        <div className="flex items-center space-x-1 text-zinc-400">
                                            <Tag className="w-4 h-4" />
                                            <span>{ticket.ai_category || ticket.category}</span>
                                        </div>
                                        <div className="flex items-center space-x-1 text-zinc-400">
                                            <MapPin className="w-4 h-4" />
                                            <span>
                                                {ticket.location.lat.toFixed(4)}, {ticket.location.lng.toFixed(4)}
                                            </span>
                                        </div>
                                        {ticket.ai_priority && (
                                            <div className={`flex items-center space-x-1 ${getPriorityColor(ticket.ai_priority)}`}>
                                                <AlertCircle className="w-4 h-4" />
                                                <span>Priority: {ticket.ai_priority}/10</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-zinc-500 text-sm wrap-text flex-shrink-0">
                                        {new Date(ticket.timestamp).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>

                                {/* Real-Time Status Timeline */}
                                {ticket.history && ticket.history.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <Suspense fallback={<TimelineSkeleton />}>
                                            <LiveTimeline history={ticket.history} />
                                        </Suspense>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
