'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Enable persistence
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);

            // Store auth state in localStorage for persistence
            if (user) {
                localStorage.setItem('campusfix_user', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                }));
            } else {
                localStorage.removeItem('campusfix_user');
            }
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth); // Changed from firebaseSignOut to signOut
            localStorage.removeItem('campusfix_user'); // Added this line
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    // Admin check - Add your admin email here
    const isAdmin = () => {
        const adminEmails = [
            'admin@campusfix.com', // Default admin
            'omarhashmi494@gmail.com', // User admin
        ];
        return user ? adminEmails.includes(user.email || '') : false;
    };

    const value = {
        user,
        loading,
        signInWithGoogle,
        logout,
        isAdmin, // Added isAdmin to the value object
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
