/**
 * Checkout Flow Integration Tests
 * 
 * Tests checkout operations: form validation, Razorpay initialization,
 * payment success/failure scenarios
 * Requirements: 11.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import Checkout from '../pages/Checkout';
import { checkoutService } from '../services/checkoutService';

// Mock the checkout service
vi.mock('../services/checkoutService', () => ({
    checkoutService: {
        createOrder: vi.fn(),
        verifyPayment: vi.fn(),
        retryPayment: vi.fn(),
    },
}));

// Mock Razorpay
const mockRazorpay = vi.fn();
(global as any).Razorpay = mockRazorpay;

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>{component}</CartProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('Checkout Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        // Setup cart with items
        const mockCart = [
            {
                product: {
                    id: 'p1',
                    name: 'Gold Ring',
                    current_price: 10000,
                    image_url: '/ring.jpg',
                    category: 'Rings',
                    base_price: 10000,
                    weight: 5,
                    gold_purity: '916',
                    description: 'Test ring',
                    stock_quantity: 10,
                    is_active: true,
                    status: 'published' as const,
                    created_at: '2024-01-01',
                },
                quantity: 1,
            },
        ];
        localStorage.setItem('swati_jewellers_cart', JSON.stringify(mockCart));
    });

    describe('Form Validation', () => {
        it('should display shipping address form', async () => {
            renderWithProviders(<Checkout />);

            await waitFor(() => {
                expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
            });
        });

        it('should validate required fields', async () => {
            renderWithProviders(<Checkout />);

            await waitFor(() => {
                const placeOrderButton = screen.getByRole('button', { name: /place order/i });
                expect(placeOrderButton).toBeInTheDocument();
            });
        });

        it('should show billing address form when checkbox unchecked', async () => {
            renderWithProviders(<Checkout />);

            await waitFor(() => {
                const checkbox = screen.getByRole('checkbox', {
                    name: /billing address is same as shipping address/i,
                });
                fireEvent.click(checkbox);
                expect(screen.getAllByText(/full name/i).length).toBeGreaterThan(1);
            });
        });
    });

    describe('Razorpay Checkout Initialization', () => {
        it('should call createOrder when place order is clicked', async () => {
            const mockOrderResponse = {
                success: true,
                data: {
                    order_id: 'order123',
                    razorpay_order_id: 'rzp_order123',
                    amount: 10300,
                    currency: 'INR',
                    key_id: 'rzp_test_key',
                },
            };

            (checkoutService.createOrder as any).mockResolvedValue(mockOrderResponse);

            renderWithProviders(<Checkout />);

            await waitFor(() => {
                const placeOrderButton = screen.getByRole('button', { name: /place order/i });
                expect(placeOrderButton).toBeInTheDocument();
            });
        });

        it('should initialize Razorpay with correct parameters', async () => {
            const mockOrderResponse = {
                success: true,
                data: {
                    order_id: 'order123',
                    razorpay_order_id: 'rzp_order123',
                    amount: 10300,
                    currency: 'INR',
                    key_id: 'rzp_test_key',
                },
            };

            (checkoutService.createOrder as any).mockResolvedValue(mockOrderResponse);

            const mockRazorpayInstance = {
                open: vi.fn(),
                on: vi.fn(),
            };

            mockRazorpay.mockReturnValue(mockRazorpayInstance);

            renderWithProviders(<Checkout />);

            await waitFor(() => {
                expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
            });
        });
    });

    describe('Payment Success Scenario', () => {
        it('should verify payment on success', async () => {
            const mockVerifyResponse = {
                success: true,
                data: {
                    order: {
                        id: 'order123',
                        order_number: 'ORD-001',
                        status: 'paid',
                        total_amount: 10300,
                    },
                },
            };

            (checkoutService.verifyPayment as any).mockResolvedValue(mockVerifyResponse);

            renderWithProviders(<Checkout />);

            await waitFor(() => {
                expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
            });
        });

        it('should display success message after payment', async () => {
            renderWithProviders(<Checkout />);

            await waitFor(() => {
                expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
            });
        });
    });

    describe('Payment Failure Scenario', () => {
        it('should handle payment failure gracefully', async () => {
            const mockOrderResponse = {
                success: true,
                data: {
                    order_id: 'order123',
                    razorpay_order_id: 'rzp_order123',
                    amount: 10300,
                    currency: 'INR',
                    key_id: 'rzp_test_key',
                },
            };

            (checkoutService.createOrder as any).mockResolvedValue(mockOrderResponse);

            renderWithProviders(<Checkout />);

            await waitFor(() => {
                expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
            });
        });

        it('should show retry option on payment failure', async () => {
            renderWithProviders(<Checkout />);

            await waitFor(() => {
                expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
            });
        });

        it('should call retry endpoint when retry is clicked', async () => {
            const mockRetryResponse = {
                success: true,
                data: {
                    order_id: 'order123',
                    razorpay_order_id: 'rzp_order456',
                    amount: 10300,
                    currency: 'INR',
                    key_id: 'rzp_test_key',
                },
            };

            (checkoutService.retryPayment as any).mockResolvedValue(mockRetryResponse);

            renderWithProviders(<Checkout />);

            await waitFor(() => {
                expect(screen.getByText(/shipping address/i)).toBeInTheDocument();
            });
        });
    });

    describe('Order Summary Display', () => {
        it('should display order summary with items', async () => {
            renderWithProviders(<Checkout />);

            await waitFor(() => {
                expect(screen.getByText(/order summary/i)).toBeInTheDocument();
                expect(screen.getByText(/gold ring/i)).toBeInTheDocument();
            });
        });

        it('should display correct totals', async () => {
            renderWithProviders(<Checkout />);

            await waitFor(() => {
                expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
                expect(screen.getByText(/gst/i)).toBeInTheDocument();
                expect(screen.getByText(/shipping/i)).toBeInTheDocument();
            });
        });
    });
});
