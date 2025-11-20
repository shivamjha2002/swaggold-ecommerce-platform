/**
 * Cache Service for API responses
 * Implements in-memory caching with TTL (Time To Live)
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class CacheService {
    private cache: Map<string, CacheEntry<any>>;
    private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

    constructor() {
        this.cache = new Map();

        // Clean up expired entries every minute
        setInterval(() => this.cleanup(), 60 * 1000);
    }

    /**
     * Get cached data if it exists and is not expired
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        const now = Date.now();
        const isExpired = now - entry.timestamp > entry.ttl;

        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set data in cache with optional TTL
     */
    set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    /**
     * Check if a key exists and is not expired
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Remove a specific key from cache
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Remove expired entries from cache
     */
    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        this.cache.forEach((entry, key) => {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Get cache statistics
     */
    getStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

// Export singleton instance
export const cacheService = new CacheService();

/**
 * Higher-order function to wrap API calls with caching
 */
export function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
): Promise<T> {
    // Check cache first
    const cached = cacheService.get<T>(key);
    if (cached !== null) {
        return Promise.resolve(cached);
    }

    // Fetch and cache
    return fetcher().then(data => {
        cacheService.set(key, data, ttl);
        return data;
    });
}
