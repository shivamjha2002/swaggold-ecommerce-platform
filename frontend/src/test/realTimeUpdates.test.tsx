/**
 * Real-Time Updates Test
 * 
 * Tests the real-time polling and notification system in the Admin Dashboard
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useState, useEffect } from 'react';

// Mock the analytics service
const mockAnalyticsService = {
  getDashboardAnalytics: vi.fn(),
  getSalesTrend: vi.fn(),
  getEnhancedMetrics: vi.fn(),
};

// Simulate the polling hook
function useRealTimeUpdates(
  isAuthenticated: boolean,
  autoRefresh: boolean,
  activeTab: string,
  loadAnalytics: () => Promise<void>
) {
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh || activeTab !== 'dashboard') {
      return;
    }

    const intervalId = setInterval(() => {
      loadAnalytics();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, autoRefresh, activeTab, loadAnalytics]);
}

describe('Real-Time Updates', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockAnalyticsService.getDashboardAnalytics.mockResolvedValue({
      summary: { total_revenue: 100000, total_transactions: 50, total_customers: 25, outstanding_balance: 5000 },
      sales_analytics: {},
      top_selling_products: [],
      khata_summary: {},
      recent_sales: [],
    });
    mockAnalyticsService.getSalesTrend.mockResolvedValue([]);
    mockAnalyticsService.getEnhancedMetrics.mockResolvedValue({
      order_status_breakdown: { total_orders: 10 },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should poll every 30 seconds when auto-refresh is enabled', async () => {
    const loadAnalytics = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      useRealTimeUpdates(true, true, 'dashboard', loadAnalytics)
    );

    // Initial call should not happen from the interval
    expect(loadAnalytics).not.toHaveBeenCalled();

    // Fast-forward 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(loadAnalytics).toHaveBeenCalledTimes(1);
    });

    // Fast-forward another 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(loadAnalytics).toHaveBeenCalledTimes(2);
    });
  });

  it('should not poll when auto-refresh is disabled', async () => {
    const loadAnalytics = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      useRealTimeUpdates(true, false, 'dashboard', loadAnalytics)
    );

    // Fast-forward 60 seconds
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    // Should not have been called
    expect(loadAnalytics).not.toHaveBeenCalled();
  });

  it('should not poll when not authenticated', async () => {
    const loadAnalytics = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      useRealTimeUpdates(false, true, 'dashboard', loadAnalytics)
    );

    // Fast-forward 60 seconds
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    // Should not have been called
    expect(loadAnalytics).not.toHaveBeenCalled();
  });

  it('should not poll when not on dashboard tab', async () => {
    const loadAnalytics = vi.fn().mockResolvedValue(undefined);

    renderHook(() =>
      useRealTimeUpdates(true, true, 'products', loadAnalytics)
    );

    // Fast-forward 60 seconds
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    // Should not have been called
    expect(loadAnalytics).not.toHaveBeenCalled();
  });

  it('should cleanup interval on unmount', async () => {
    const loadAnalytics = vi.fn().mockResolvedValue(undefined);

    const { unmount } = renderHook(() =>
      useRealTimeUpdates(true, true, 'dashboard', loadAnalytics)
    );

    // Fast-forward 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(loadAnalytics).toHaveBeenCalledTimes(1);
    });

    // Unmount the hook
    unmount();

    // Fast-forward another 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    // Should still be 1 (not called again after unmount)
    expect(loadAnalytics).toHaveBeenCalledTimes(1);
  });

  it('should detect new orders and increment count', () => {
    const { result } = renderHook(() => {
      const [previousOrderCount, setPreviousOrderCount] = useState<number | null>(null);
      const [newOrdersCount, setNewOrdersCount] = useState(0);

      const checkForNewOrders = (currentOrderCount: number) => {
        if (previousOrderCount !== null && currentOrderCount > previousOrderCount) {
          const newOrders = currentOrderCount - previousOrderCount;
          setNewOrdersCount(prev => prev + newOrders);
        }
        setPreviousOrderCount(currentOrderCount);
      };

      return { previousOrderCount, newOrdersCount, checkForNewOrders };
    });

    // Initial state
    expect(result.current.newOrdersCount).toBe(0);
    expect(result.current.previousOrderCount).toBeNull();

    // First check - set baseline
    act(() => {
      result.current.checkForNewOrders(10);
    });

    expect(result.current.previousOrderCount).toBe(10);
    expect(result.current.newOrdersCount).toBe(0); // No new orders yet

    // Second check - 2 new orders
    act(() => {
      result.current.checkForNewOrders(12);
    });

    expect(result.current.previousOrderCount).toBe(12);
    expect(result.current.newOrdersCount).toBe(2);

    // Third check - 1 more new order
    act(() => {
      result.current.checkForNewOrders(13);
    });

    expect(result.current.previousOrderCount).toBe(13);
    expect(result.current.newOrdersCount).toBe(3); // Cumulative count
  });

  it('should not increment count when order count decreases or stays same', () => {
    const { result } = renderHook(() => {
      const [previousOrderCount, setPreviousOrderCount] = useState<number | null>(10);
      const [newOrdersCount, setNewOrdersCount] = useState(0);

      const checkForNewOrders = (currentOrderCount: number) => {
        if (previousOrderCount !== null && currentOrderCount > previousOrderCount) {
          const newOrders = currentOrderCount - previousOrderCount;
          setNewOrdersCount(prev => prev + newOrders);
        }
        setPreviousOrderCount(currentOrderCount);
      };

      return { previousOrderCount, newOrdersCount, checkForNewOrders };
    });

    // Same count
    act(() => {
      result.current.checkForNewOrders(10);
    });

    expect(result.current.newOrdersCount).toBe(0);

    // Decreased count (shouldn't happen in real scenario, but test it)
    act(() => {
      result.current.checkForNewOrders(8);
    });

    expect(result.current.newOrdersCount).toBe(0);
  });
});
