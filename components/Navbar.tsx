'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, Home, LayoutDashboard, Shield, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            setMobileMenuOpen(false);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">CF</span>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                CampusFix AI
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-4">
                            {user && (
                                <>
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 smooth-transition text-zinc-300 hover:text-white text-sm"
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        <span>Dashboard</span>
                                    </Link>
                                    {isAdmin() && (
                                        <Link
                                            href="/admin"
                                            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 smooth-transition text-red-300 font-medium text-sm border border-red-500/30"
                                        >
                                            <Shield className="w-4 h-4" />
                                            <span>Admin</span>
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
                                    <span>Home</span>
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
                                    <span className="text-sm text-zinc-300">
                                        {user.displayName || user.email}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 smooth-transition text-sm"
                                    >
                                        <LogOut size={16} />
                                        <span>Logout</span>
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

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 smooth-transition touch-target"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu - Outside nav for proper positioning */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeMobileMenu}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden"
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-16 right-0 bottom-0 w-80 max-w-[85vw] backdrop-blur-xl bg-zinc-900/95 border-l border-white/10 shadow-2xl z-[60] md:hidden overflow-y-auto"
                        >
                            <div className="p-6 space-y-4">
                                {/* User Info */}
                                {user && (
                                    <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName || 'User'}
                                                className="w-12 h-12 rounded-full border-2 border-indigo-500"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center">
                                                <User size={24} />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-medium truncate">
                                                {user.displayName || 'User'}
                                            </p>
                                            <p className="text-zinc-400 text-sm truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Links */}
                                {user ? (
                                    <>
                                        <Link
                                            href="/dashboard"
                                            onClick={closeMobileMenu}
                                            className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 smooth-transition text-white touch-target"
                                        >
                                            <LayoutDashboard className="w-5 h-5" />
                                            <span className="font-medium">Dashboard</span>
                                        </Link>

                                        {isAdmin() && (
                                            <Link
                                                href="/admin"
                                                onClick={closeMobileMenu}
                                                className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 smooth-transition text-red-300 border border-red-500/30 touch-target"
                                            >
                                                <Shield className="w-5 h-5" />
                                                <span className="font-medium">Admin Panel</span>
                                            </Link>
                                        )}

                                        <Link
                                            href="/report"
                                            onClick={closeMobileMenu}
                                            className="flex items-center justify-center px-4 py-3 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 smooth-transition text-indigo-300 font-medium border border-indigo-500/30 touch-target"
                                        >
                                            Report Issue
                                        </Link>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 smooth-transition text-white touch-target"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            <span className="font-medium">Logout</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/"
                                            onClick={closeMobileMenu}
                                            className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 smooth-transition text-white touch-target"
                                        >
                                            <Home className="w-5 h-5" />
                                            <span className="font-medium">Home</span>
                                        </Link>

                                        <Link
                                            href="/login"
                                            onClick={closeMobileMenu}
                                            className="block text-center px-6 py-3 rounded-lg indigo-glow text-white font-medium touch-target"
                                        >
                                            Login
                                        </Link>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
