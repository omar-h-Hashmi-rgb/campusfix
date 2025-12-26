// AI Cache Utility for CampusFix AI
// Manages localStorage-based caching for AI analysis results

export interface CachedAnalysis {
    description: string;
    category: string;
    urgency: number;
    summary: string;
    timestamp: number;
    hash: string;
}

interface CacheStorage {
    entries: CachedAnalysis[];
    lastCleanup: number;
}

const CACHE_KEY = 'campusfix_ai_cache';
const MAX_CACHE_SIZE = 50;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const SIMILARITY_THRESHOLD = 80; // 80% similarity for fuzzy matching

// Simple hash function for quick lookup
export function generateHash(text: string): string {
    let hash = 0;
    const normalized = text.toLowerCase().trim();

    for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
}

// Calculate Levenshtein distance for similarity matching
function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j - 1] + 1, // substitution
                    dp[i - 1][j] + 1,     // deletion
                    dp[i][j - 1] + 1      // insertion
                );
            }
        }
    }

    return dp[m][n];
}

// Calculate similarity percentage between two strings
function calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 100;
    if (s1.length === 0 || s2.length === 0) return 0;

    const distance = levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    return ((maxLength - distance) / maxLength) * 100;
}

// Get cache from localStorage
function getCache(): CacheStorage {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) {
            return { entries: [], lastCleanup: Date.now() };
        }
        return JSON.parse(cached);
    } catch (error) {
        console.error('Error reading cache:', error);
        return { entries: [], lastCleanup: Date.now() };
    }
}

// Save cache to localStorage
function saveCache(cache: CacheStorage): void {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
            // Storage full, clear old entries and retry
            console.warn('localStorage quota exceeded, clearing old cache');
            clearOldCache();
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            } catch (retryError) {
                console.error('Failed to save cache after cleanup:', retryError);
            }
        } else {
            console.error('Error saving cache:', error);
        }
    }
}

// Clear cache entries older than 24 hours
export function clearOldCache(): void {
    const cache = getCache();
    const now = Date.now();

    cache.entries = cache.entries.filter(
        entry => (now - entry.timestamp) < CACHE_EXPIRY_MS
    );

    cache.lastCleanup = now;
    saveCache(cache);
}

// Clear all cache (for manual refresh)
export function clearAllCache(): void {
    try {
        localStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
}

// Save analysis result to cache
export function cacheAnalysis(
    description: string,
    category: string,
    urgency: number,
    summary: string
): void {
    const cache = getCache();
    const hash = generateHash(description);

    // Check if already cached
    const existingIndex = cache.entries.findIndex(e => e.hash === hash);

    const newEntry: CachedAnalysis = {
        description: description.trim(),
        category,
        urgency,
        summary,
        timestamp: Date.now(),
        hash
    };

    if (existingIndex >= 0) {
        // Update existing entry
        cache.entries[existingIndex] = newEntry;
    } else {
        // Add new entry
        cache.entries.push(newEntry);

        // Enforce max cache size (FIFO eviction)
        if (cache.entries.length > MAX_CACHE_SIZE) {
            cache.entries.shift(); // Remove oldest entry
        }
    }

    saveCache(cache);
}

// Get exact cached analysis
export function getCachedAnalysis(description: string): CachedAnalysis | null {
    const cache = getCache();
    const hash = generateHash(description);

    const entry = cache.entries.find(e => e.hash === hash);

    if (entry) {
        // Check if expired
        if ((Date.now() - entry.timestamp) < CACHE_EXPIRY_MS) {
            return entry;
        }
    }

    return null;
}

// Find similar cached analysis using fuzzy matching
export function findSimilarAnalysis(description: string): CachedAnalysis | null {
    const cache = getCache();
    const normalized = description.toLowerCase().trim();

    if (normalized.length < 10) {
        // Too short for meaningful similarity matching
        return null;
    }

    let bestMatch: CachedAnalysis | null = null;
    let highestSimilarity = 0;

    for (const entry of cache.entries) {
        // Check if expired
        if ((Date.now() - entry.timestamp) >= CACHE_EXPIRY_MS) {
            continue;
        }

        const similarity = calculateSimilarity(normalized, entry.description);

        if (similarity >= SIMILARITY_THRESHOLD && similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestMatch = entry;
        }
    }

    return bestMatch;
}

// Auto-cleanup on initialization
export function initializeCache(): void {
    const cache = getCache();
    const now = Date.now();

    // Run cleanup if last cleanup was more than 24 hours ago
    if ((now - cache.lastCleanup) >= CACHE_EXPIRY_MS) {
        clearOldCache();
    }
}

// Get cache statistics (for debugging/analytics)
export function getCacheStats(): {
    totalEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
    cacheSize: number;
} {
    const cache = getCache();

    if (cache.entries.length === 0) {
        return {
            totalEntries: 0,
            oldestEntry: null,
            newestEntry: null,
            cacheSize: 0
        };
    }

    const timestamps = cache.entries.map(e => e.timestamp);
    const cacheString = JSON.stringify(cache);

    return {
        totalEntries: cache.entries.length,
        oldestEntry: Math.min(...timestamps),
        newestEntry: Math.max(...timestamps),
        cacheSize: new Blob([cacheString]).size
    };
}
