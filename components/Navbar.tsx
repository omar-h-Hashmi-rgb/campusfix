'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, Home, LayoutDashboard, Shield, BarChart3 } from 'lucide-react';

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">CF</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            CampusFix AI
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-4">
                        {user && (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 smooth-transition text-zinc-300 hover:text-white text-sm"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span className="hidden sm:block">Dashboard</span>
                                </Link>
                                {isAdmin() && (
                                    <Link
                                        href="/admin"
                                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 smooth-transition text-red-300 font-medium text-sm border border-red-500/30"
                                    >
                                        <Shield className="w-4 h-4" />
                                        <span className="hidden sm:block">Admin</span>
                                    </Link>
                                )}
                                <Link
                                    href="/report"
                                    className="px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 smooth-transition text-indigo-300 font-medium text-sm border border-indigo-500/30"
                                >
                                    Report Issue
                                </Link>
                            </>
                        )}

                        {!user && (
                            <Link
                                href="/"
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 smooth-transition text-zinc-300 hover:text-white text-sm"
                            >
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:block">Home</span>
                            </Link>
                        )}

                        {user ? (
                            <div className="flex items-center space-x-3">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName || 'User'}
                                        className="w-8 h-8 rounded-full border-2 border-indigo-500"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                        <User size={18} />
                                    </div>
                                )}
                                <span className="text-sm text-zinc-300 hidden sm:block">
                                    {user.displayName || user.email}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 smooth-transition text-sm"
                                >
                                    <LogOut size={16} />
                                    <span className="hidden sm:block">Logout</span>
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="px-6 py-2 rounded-lg indigo-glow text-white font-medium text-sm"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
