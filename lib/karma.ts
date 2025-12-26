import { ref, get, set, update } from 'firebase/database';
import { database } from './firebase';

export interface UserProfile {
    karma: number;
    ticketsReported: number;
    upvotesReceived: number;
    level: string;
    email: string;
}

// Calculate contributor level based on karma points
export function calculateLevel(karma: number): string {
    if (karma >= 200) return 'Gold';
    if (karma >= 50) return 'Silver';
    return 'Bronze';
}

// Get level badge styling
export function getLevelBadgeStyle(level: string): string {
    switch (level) {
        case 'Gold':
            return 'bg-yellow-500/30 border-yellow-400/50 text-yellow-300';
        case 'Silver':
            return 'bg-slate-400/30 border-slate-300/50 text-slate-200';
        case 'Bronze':
        default:
            return 'bg-amber-900/30 border-amber-500/50 text-amber-400';
    }
}

// Get or create user profile
export async function getUserProfile(email: string): Promise<UserProfile> {
    const sanitizedEmail = email.replace(/\./g, '_');
    const profileRef = ref(database, `profiles/${sanitizedEmail}`);

    try {
        const snapshot = await get(profileRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            return {
                ...data,
                level: calculateLevel(data.karma || 0),
            };
        } else {
            // Create new profile
            const newProfile: UserProfile = {
                karma: 0,
                ticketsReported: 0,
                upvotesReceived: 0,
                level: 'Bronze',
                email,
            };
            await set(profileRef, newProfile);
            return newProfile;
        }
    } catch (error) {
        console.error('Error getting user profile:', error);
        return {
            karma: 0,
            ticketsReported: 0,
            upvotesReceived: 0,
            level: 'Bronze',
            email,
        };
    }
}

// Update user karma
export async function updateUserKarma(email: string, points: number): Promise<void> {
    const sanitizedEmail = email.replace(/\./g, '_');
    const profileRef = ref(database, `profiles/${sanitizedEmail}`);

    try {
        const profile = await getUserProfile(email);
        const newKarma = Math.max(0, profile.karma + points);

        await update(profileRef, {
            karma: newKarma,
            level: calculateLevel(newKarma),
        });
    } catch (error) {
        console.error('Error updating karma:', error);
    }
}

// Award karma for reporting a ticket (+10 points)
export async function awardTicketReportKarma(email: string): Promise<void> {
    const sanitizedEmail = email.replace(/\./g, '_');
    const profileRef = ref(database, `profiles/${sanitizedEmail}`);

    try {
        const profile = await getUserProfile(email);
        const newKarma = profile.karma + 10;
        const newTicketsReported = profile.ticketsReported + 1;

        await update(profileRef, {
            karma: newKarma,
            ticketsReported: newTicketsReported,
            level: calculateLevel(newKarma),
        });
    } catch (error) {
        console.error('Error awarding ticket report karma:', error);
    }
}

// Award karma for receiving an upvote (+2 points)
export async function awardUpvoteKarma(ticketOwnerEmail: string): Promise<void> {
    const sanitizedEmail = ticketOwnerEmail.replace(/\./g, '_');
    const profileRef = ref(database, `profiles/${sanitizedEmail}`);

    try {
        const profile = await getUserProfile(ticketOwnerEmail);
        const newKarma = profile.karma + 2;
        const newUpvotesReceived = profile.upvotesReceived + 1;

        await update(profileRef, {
            karma: newKarma,
            upvotesReceived: newUpvotesReceived,
            level: calculateLevel(newKarma),
        });
    } catch (error) {
        console.error('Error awarding upvote karma:', error);
    }
}

// Remove karma when upvote is removed (-2 points)
export async function removeUpvoteKarma(ticketOwnerEmail: string): Promise<void> {
    const sanitizedEmail = ticketOwnerEmail.replace(/\./g, '_');
    const profileRef = ref(database, `profiles/${sanitizedEmail}`);

    try {
        const profile = await getUserProfile(ticketOwnerEmail);
        const newKarma = Math.max(0, profile.karma - 2);
        const newUpvotesReceived = Math.max(0, profile.upvotesReceived - 1);

        await update(profileRef, {
            karma: newKarma,
            upvotesReceived: newUpvotesReceived,
            level: calculateLevel(newKarma),
        });
    } catch (error) {
        console.error('Error removing upvote karma:', error);
    }
}

// Upvote a ticket
export async function upvoteTicket(ticketId: string, userEmail: string, ticketOwnerEmail: string): Promise<boolean> {
    const ticketRef = ref(database, `tickets/${ticketId}`);

    try {
        const snapshot = await get(ticketRef);
        if (!snapshot.exists()) return false;

        const ticket = snapshot.val();
        const upvotedBy = ticket.upvotedBy || [];
        const currentUpvotes = ticket.upvotes || 0;

        // Check if user already upvoted
        if (upvotedBy.includes(userEmail)) {
            // Remove upvote
            const newUpvotedBy = upvotedBy.filter((email: string) => email !== userEmail);
            await update(ticketRef, {
                upvotes: Math.max(0, currentUpvotes - 1),
                upvotedBy: newUpvotedBy,
            });

            // Remove karma from ticket owner (if not self-upvote)
            if (userEmail !== ticketOwnerEmail) {
                await removeUpvoteKarma(ticketOwnerEmail);
            }

            return false; // Upvote removed
        } else {
            // Add upvote
            const newUpvotedBy = [...upvotedBy, userEmail];
            await update(ticketRef, {
                upvotes: currentUpvotes + 1,
                upvotedBy: newUpvotedBy,
            });

            // Award karma to ticket owner (if not self-upvote)
            if (userEmail !== ticketOwnerEmail) {
                await awardUpvoteKarma(ticketOwnerEmail);
            }

            return true; // Upvote added
        }
    } catch (error) {
        console.error('Error upvoting ticket:', error);
        return false;
    }
}

// Check if user has upvoted a ticket
export async function hasUserUpvoted(ticketId: string, userEmail: string): Promise<boolean> {
    const ticketRef = ref(database, `tickets/${ticketId}`);

    try {
        const snapshot = await get(ticketRef);
        if (!snapshot.exists()) return false;

        const ticket = snapshot.val();
        const upvotedBy = ticket.upvotedBy || [];

        return upvotedBy.includes(userEmail);
    } catch (error) {
        console.error('Error checking upvote status:', error);
        return false;
    }
}
