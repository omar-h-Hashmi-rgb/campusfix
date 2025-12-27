'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { database } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
    Shield,
    AlertTriangle,
    Clock,
    CheckCircle,
    MapPin,
    Tag,
    Flame,
    Eye,
    Wrench,
    X,
    ChevronUp,
    ArrowUpDown,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { generateFixGuide } from '@/lib/gemini';
import { upvoteTicket } from '@/lib/karma';

const AdminHeatmap = dynamic(() => import('@/components/AdminHeatmap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full glass rounded-xl flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    ),
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
    ai_fix_guide?: string;
    translated_text?: string;
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

export default function AdminPage() {
    const { user, loading, isAdmin } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [flyToLocation, setFlyToLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [fixGuide, setFixGuide] = useState<string>('');
    const [generatingGuide, setGeneratingGuide] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [sortByUpvotes, setSortByUpvotes] = useState(false);
    const [upvoting, setUpvoting] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && (!user || !isAdmin())) {
            router.push('/dashboard');
        }
    }, [user, loading, isAdmin, router]);

    useEffect(() => {
        if (!user || !isAdmin()) return;

        const ticketsRef = ref(database, 'tickets');
        const unsubscribe = onValue(ticketsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                let ticketsList: Ticket[] = Object.entries(data)
                    .map(([id, ticket]: [string, any]) => ({
                        id,
                        ...ticket,
                    }));

                // Sort by upvotes or priority
                if (sortByUpvotes) {
                    ticketsList.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
                } else {
                    ticketsList.sort((a, b) => (b.ai_priority || 5) - (a.ai_priority || 5));
                }

                setTickets(ticketsList);
            } else {
                setTickets([]);
            }
            setLoadingTickets(false);
        });

        return () => unsubscribe();
    }, [user, isAdmin, sortByUpvotes]);

    const handleUpvote = useCallback(async (ticketId: string, ticketOwnerEmail: string) => {
        if (!user?.email || upvoting) return;

        setUpvoting(ticketId);
        try {
            await upvoteTicket(ticketId, user.email, ticketOwnerEmail);
        } catch (error) {
            console.error('Upvote error:', error);
        } finally {
            setUpvoting(null);
        }
    }, [user, upvoting]);

    const syncToGoogleSheets = useCallback(() => {
        setIsSyncing(true);
        try {
            console.log('Syncing tickets to Google Sheets...', tickets.length, 'tickets');

            // Create hidden form to bypass CORS
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = 'https://script.google.com/macros/s/AKfycbzNOmYP401nHS5xCG_4rF-YjIDNuociJqirBEuJSHnbVpBM_QgOhc6gHrKOASChUgdF/exec';
            form.target = '_blank';

            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'data';
            input.value = JSON.stringify({ tickets });
            form.appendChild(input);

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);

            showToast(`Syncing ${tickets.length} tickets! Check the new tab.`, 'success');
        } catch (error) {
            console.error('Sync error:', error);
            showToast('Sync failed. Please try again.', 'error');
        } finally {
            setTimeout(() => setIsSyncing(false), 1000);
        }
    }, [tickets, showToast]);

    const updateTicketStatus = useCallback(async (ticketId: string, newStatus: 'open' | 'in-progress' | 'resolved') => {
        try {
            const ticketRef = ref(database, `tickets/${ticketId}`);

            // Get current ticket to access history
            const currentTicket = tickets.find(t => t.id === ticketId);
            const currentHistory = currentTicket?.history || [];

            // Create new history entry
            const newHistoryEntry = {
                status: newStatus,
                timestamp: Date.now(),
                message: `Status updated to ${newStatus}`,
                updatedBy: user?.displayName || user?.email || 'Admin'
            };

            // Update ticket with new status and history
            await update(ticketRef, {
                status: newStatus,
                history: [...currentHistory, newHistoryEntry]
            });

            showToast(`Ticket marked as ${newStatus}`, 'success');
        } catch (error) {
            console.error('Error updating ticket:', error);
            showToast('Failed to update ticket status', 'error');
        }
    }, [tickets, user, showToast]);

    const viewOnMap = (lat: number, lng: number) => {
        setFlyToLocation({ lat, lng });
        setTimeout(() => setFlyToLocation(null), 2000);
    };

    const isEscalated = (timestamp: number) => {
        const hoursSinceCreation = (Date.now() - timestamp) / (1000 * 60 * 60);
        return hoursSinceCreation > 24;
    };

    const getPriorityColor = (priority: number) => {
        if (priority >= 8) return 'text-red-400 bg-red-500/20 border-red-500/30';
        if (priority >= 5) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
        return 'text-green-400 bg-green-500/20 border-green-500/30';
    };

    const handleGenerateFixGuide = async (ticket: Ticket) => {
        setGeneratingGuide(true);
        setSelectedTicket(ticket);

        try {
            const guide = await generateFixGuide(
                ticket.title,
                ticket.description,
                ticket.ai_category || ticket.category,
                ticket.imageBase64
            );
            setFixGuide(guide);

            // Save to database
            const ticketRef = ref(database, `tickets/${ticket.id}`);
            await update(ticketRef, { ai_fix_guide: guide });

            showToast('AI Fix Guide generated successfully', 'success');
        } catch (error) {
            console.error('Error generating fix guide:', error);
            showToast('Failed to generate fix guide', 'error');
        } finally {
            setGeneratingGuide(false);
        }
    };

    if (loading || loadingTickets) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!user || !isAdmin()) {
        return null;
    }

    const stats = {
        total: tickets.length,
        open: tickets.filter((t) => t.status === 'open').length,
        inProgress: tickets.filter((t) => t.status === 'in-progress').length,
        resolved: tickets.filter((t) => t.status === 'resolved').length,
        escalated: tickets.filter((t) => t.status === 'open' && isEscalated(t.timestamp)).length,
    };

    return (
        <div className="min-h-screen px-4 py-12 relative overflow-hidden">
            <div className="absolute inset-0 gradient-indigo pointer-events-none" />

            <div className="relative z-10 max-w-[1800px] mx-auto">
                {/* Header */}
                <div className="mb-8">
                    {/* Logo and Title Row */}
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                            <Shield className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white wrap-text">Admin Command Center</h1>
                    </div>

                    {/* Subtitle */}
                    <p className="text-zinc-400 mb-4 ml-15">Campus-wide maintenance oversight</p>

                    {/* Buttons Row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3 ml-0 sm:ml-15">
                        {/* Sort Toggle */}
                        <button
                            onClick={() => setSortByUpvotes(!sortByUpvotes)}
                            className={`flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 rounded-xl border font-medium smooth-transition mobile-button touch-target ${sortByUpvotes
                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20'
                                }`}
                        >
                            <ArrowUpDown className="w-5 h-5" />
                            <span>{sortByUpvotes ? 'Most Upvoted' : 'By Priority'}</span>
                        </button>

                        <button
                            onClick={syncToGoogleSheets}
                            disabled={isSyncing}
                            className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 smooth-transition text-emerald-300 font-medium border border-emerald-500/30 mobile-button touch-target disabled:opacity-50"
                        >
                            {isSyncing ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-400"></div>
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                                    </svg>
                                    <span>Sync to Analytics</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-xl p-4 border border-white/10"
                    >
                        <p className="text-sm text-zinc-400 mb-1">Total Issues</p>
                        <p className="text-3xl font-bold text-white">{stats.total}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass rounded-xl p-4 border border-indigo-500/30"
                    >
                        <p className="text-sm text-zinc-400 mb-1">Open</p>
                        <p className="text-3xl font-bold text-indigo-400">{stats.open}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-xl p-4 border border-yellow-500/30"
                    >
                        <p className="text-sm text-zinc-400 mb-1">In Progress</p>
                        <p className="text-3xl font-bold text-yellow-400">{stats.inProgress}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass rounded-xl p-4 border border-green-500/30"
                    >
                        <p className="text-sm text-zinc-400 mb-1">Resolved</p>
                        <p className="text-3xl font-bold text-green-400">{stats.resolved}</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass rounded-xl p-4 border border-red-500/30"
                    >
                        <p className="text-sm text-zinc-400 mb-1">Escalated</p>
                        <p className="text-3xl font-bold text-red-400">{stats.escalated}</p>
                    </motion.div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Ticket List */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white flex items-center space-x-2">
                            <AlertTriangle className="w-6 h-6 text-indigo-400" />
                            <span>Priority Queue</span>
                        </h2>

                        <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                            {tickets.length === 0 ? (
                                <div className="glass rounded-xl p-8 text-center border border-white/10">
                                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                    <p className="text-zinc-400">No tickets to display</p>
                                </div>
                            ) : (
                                tickets.map((ticket, index) => (
                                    <motion.div
                                        key={ticket.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`glass rounded-xl p-4 border smooth-transition hover:border-indigo-500/40 ${ticket.status === 'open' && isEscalated(ticket.timestamp)
                                            ? 'border-red-500/50 shadow-lg shadow-red-500/20'
                                            : 'border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <h3 className="text-lg font-semibold text-white">{ticket.title}</h3>
                                                    {ticket.status === 'open' && isEscalated(ticket.timestamp) && (
                                                        <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs">
                                                            <Flame className="w-3 h-3" />
                                                            <span>ESCALATED</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {ticket.ai_summary && (
                                                    <p className="text-sm text-indigo-300 mb-1">🤖 {ticket.ai_summary}</p>
                                                )}
                                                <p className="text-sm text-zinc-400 line-clamp-2">{ticket.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs mb-3">
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                                                {/* Upvote Button */}
                                                <button
                                                    onClick={() => handleUpvote(ticket.id, ticket.userEmail)}
                                                    disabled={upvoting === ticket.id}
                                                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg smooth-transition ${ticket.upvotedBy?.includes(user.email || '')
                                                        ? 'bg-indigo-500 text-white'
                                                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                                                        } ${upvoting === ticket.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <ChevronUp className="w-3 h-3" />
                                                    <span className="font-medium text-xs">{ticket.upvotes || 0}</span>
                                                </button>

                                                <div className="flex items-center space-x-1 text-zinc-400">
                                                    <Tag className="w-3 h-3" />
                                                    <span>{ticket.ai_category || ticket.category}</span>
                                                </div>
                                                {ticket.ai_priority && (
                                                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border ${getPriorityColor(ticket.ai_priority)}`}>
                                                        <AlertTriangle className="w-3 h-3" />
                                                        <span>P{ticket.ai_priority}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-zinc-500">
                                                {new Date(ticket.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {ticket.status !== 'in-progress' && (
                                                <button
                                                    onClick={() => updateTicketStatus(ticket.id, 'in-progress')}
                                                    className="flex-1 px-3 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-300 text-sm smooth-transition"
                                                >
                                                    <Clock className="w-4 h-4 inline mr-1" />
                                                    In Progress
                                                </button>
                                            )}
                                            {ticket.status !== 'resolved' && (
                                                <button
                                                    onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                                                    className="flex-1 px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 text-sm smooth-transition"
                                                >
                                                    <CheckCircle className="w-4 h-4 inline mr-1" />
                                                    Resolve
                                                </button>
                                            )}
                                            <button
                                                onClick={() => viewOnMap(ticket.location.lat, ticket.location.lng)}
                                                className="px-3 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-sm smooth-transition"
                                            >
                                                <Eye className="w-4 h-4 inline mr-1" />
                                                Map
                                            </button>
                                            <button
                                                onClick={() => handleGenerateFixGuide(ticket)}
                                                className="px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-sm smooth-transition"
                                                title="Generate AI Fix Guide"
                                            >
                                                <Wrench className="w-4 h-4 inline mr-1" />
                                                AI Fix
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Heatmap */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold text-white flex items-center space-x-2">
                            <MapPin className="w-6 h-6 text-indigo-400" />
                            <span>Campus Heatmap</span>
                        </h2>
                        <div className="h-[800px]">
                            <AdminHeatmap tickets={tickets} flyToLocation={flyToLocation} />
                        </div>
                        <div className="glass rounded-xl p-4 border border-white/10">
                            <p className="text-sm text-zinc-400 mb-2">Heat Intensity Legend:</p>
                            <div className="flex items-center space-x-4 text-xs">
                                <div className="flex items-center space-x-1">
                                    <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                                    <span className="text-zinc-300">Low (1-4)</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                                    <span className="text-zinc-300">Medium (5-7)</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                                    <span className="text-zinc-300">Critical (8-10)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fix Guide Modal */}
            {
                selectedTicket && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-2xl p-6 max-w-2xl w-full border border-white/10 max-h-[80vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <Wrench className="w-6 h-6 text-purple-400" />
                                    <h3 className="text-2xl font-semibold text-white">AI Fix Guide</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedTicket(null);
                                        setFixGuide('');
                                    }}
                                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 smooth-transition"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            <div className="mb-4 p-4 bg-zinc-900 rounded-xl">
                                <h4 className="text-lg font-semibold text-white mb-1">{selectedTicket.title}</h4>
                                <p className="text-sm text-zinc-400">{selectedTicket.ai_category || selectedTicket.category}</p>
                            </div>

                            {generatingGuide ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                                    <p className="text-zinc-400">AI is generating fix guide...</p>
                                </div>
                            ) : fixGuide ? (
                                <div className="prose prose-invert max-w-none">
                                    <div className="p-4 bg-zinc-900 rounded-xl text-zinc-300 whitespace-pre-wrap">
                                        {fixGuide}
                                    </div>
                                </div>
                            ) : selectedTicket.ai_fix_guide ? (
                                <div className="prose prose-invert max-w-none">
                                    <div className="p-4 bg-zinc-900 rounded-xl text-zinc-300 whitespace-pre-wrap">
                                        {selectedTicket.ai_fix_guide}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-zinc-400 text-center py-8">No fix guide available yet.</p>
                            )}
                        </motion.div>
                    </div>
                )
            }
        </div >
    );
}
