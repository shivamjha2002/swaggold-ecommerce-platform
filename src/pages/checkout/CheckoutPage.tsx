import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { AddressStep } from '../../components/checkout/AddressStep';
import { PaymentStep } from '../../components/checkout/PaymentStep';
import { ConfirmationStep } from '../../components/checkout/ConfirmationStep';
import { CheckoutSidebar } from '../../components/checkout/CheckoutSidebar';
import { ArrowLeft, Truck, CreditCard, CheckCircle } from 'lucide-react';
import { Address } from '../../services/addressService';

/**
 * CheckoutPage component - Multi-step checkout flow with address selection
 * 
 * Features:
 * - Wrapped with ProtectedRoute component for authentication
 * - Multi-step checkout wizard: Address → Payment → Confirmation
 * - Address selection step showing saved addresses
 * - "Add New Address" form with validation
 * - Calls POST /api/addresses to save new address
 * - Order summary sidebar with items and totals
 * - "Continue to Payment" button
 * 
 * Requirements: 1.13.1, 1.13.2, 1.13.3, 1.13.4
 */

type CheckoutStep = 'address' | 'payment' | 'confirmation';

interface CheckoutStepConfig {
    id: CheckoutStep;
    title: string;
    icon: React.ReactNode;
    description: string;
}

const CheckoutPageContent: React.FC = () => {
    const navigate = useNavigate();
    const {
        items,
        subtotal,
        gstAmount,
        shippingAmount,
        discountAmount,
        totalAmount,
        itemCount,
        loading: cartLoading,
    } = useCart();

    const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [orderData, setOrderData] = useState<any>(null);

    // Checkout steps configuration
    const steps: CheckoutStepConfig[] = [
        {
            id: 'address',
            title: 'Shipping Address',
            icon: <Truck className="h-5 w-5" />,
            description: 'Select or add delivery address'
        },
        {
            id: 'payment',
            title: 'Payment',
            icon: <CreditCard className="h-5 w-5" />,
            description: 'Choose payment method'
        },
        {
            id: 'confirmation',
            title: 'Confirmation',
            icon: <CheckCircle className="h-5 w-5" />,
            description: 'Review and confirm order'
        }
    ];

    // Redirect if cart is empty
    useEffect(() => {
        if (!cartLoading && items.length === 0) {
            navigate('/cart');
        }
    }, [items, cartLoading, navigate]);

    /**
     * Handle address selection and proceed to payment
     */
    const handleAddressComplete = (address: Address) => {
        setSelectedAddress(address);
        setCurrentStep('payment');
    };

    /**
     * Handle payment completion and proceed to confirmation
     */
    const handlePaymentComplete = (paymentData: any) => {
        setOrderData(paymentData);
        setCurrentStep('confirmation');
    };

    /**
     * Handle order confirmation
     */
    const handleOrderComplete = () => {
        // Navigate to order success page or orders list
        navigate('/orders');
    };

    /**
     * Navigate back to previous step
     */
    const handleBack = () => {
        if (currentStep === 'payment') {
            setCurrentStep('address');
        } else if (currentStep === 'confirmation') {
            setCurrentStep('payment');
        } else {
            navigate('/cart');
        }
    };

    /**
     * Get current step index for progress indicator
     */
    const getCurrentStepIndex = (): number => {
        return steps.findIndex(step => step.id === currentStep);
    };

    // Loading state
    if (cartLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading checkout...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Empty cart - will redirect
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-semibold mb-4"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
                    <p className="text-gray-600 mt-2">
                        Complete your order in {steps.length} simple steps
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const isActive = step.id === currentStep;
                            const isCompleted = index < getCurrentStepIndex();

                            return (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center flex-1">
                                        <div
                                            className={`
                                                w-12 h-12 rounded-full flex items-center justify-center
                                                ${isActive ? 'bg-yellow-600 text-white' : ''}
                                                ${isCompleted ? 'bg-green-500 text-white' : ''}
                                                ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                                            `}
                                        >
                                            {step.icon}
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p className={`text-sm font-semibold ${isActive ? 'text-yellow-600' : 'text-gray-600'}`}>
                                                {step.title}
                                            </p>
                                            <p className="text-xs text-gray-500 hidden sm:block">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`
                                                flex-1 h-1 mx-4 rounded
                                                ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                                            `}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Step Content */}
                    <div className="lg:col-span-2">
                        {currentStep === 'address' && (
                            <AddressStep onComplete={handleAddressComplete} />
                        )}
                        {currentStep === 'payment' && selectedAddress && (
                            <PaymentStep
                                address={selectedAddress}
                                onComplete={handlePaymentComplete}
                                onBack={() => setCurrentStep('address')}
                            />
                        )}
                        {currentStep === 'confirmation' && orderData && (
                            <ConfirmationStep
                                orderData={orderData}
                                onComplete={handleOrderComplete}
                            />
                        )}
                    </div>

                    {/* Right Column - Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <CheckoutSidebar
                            items={items}
                            subtotal={subtotal}
                            gstAmount={gstAmount}
                            shippingAmount={shippingAmount}
                            discountAmount={discountAmount}
                            total={totalAmount}
                            itemCount={itemCount}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * CheckoutPage component wrapped with ProtectedRoute
 * Ensures only authenticated users can access the checkout page
 */
const CheckoutPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <CheckoutPageContent />
        </ProtectedRoute>
    );
};

export default CheckoutPage;
