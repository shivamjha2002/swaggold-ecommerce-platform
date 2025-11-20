import { useState } from 'react';
import { X, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Order, ProcessRefundRequest } from '../types';
import { orderService } from '../services/orderService';
import { getErrorMessage } from '../utils/errorHandler';

interface RefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    onRefundSuccess: () => void;
}

export const RefundModal = ({ isOpen, onClose, order, onRefundSuccess }: RefundModalProps) => {
    const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
    const [amount, setAmount] = useState<string>(order.total_amount.toString());
    const [reason, setReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Handle refund type change
    const handleRefundTypeChange = (type: 'full' | 'partial') => {
        setRefundType(type);
        if (type === 'full') {
            setAmount(order.total_amount.toString());
        } else {
            setAmount('');
        }
    };

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const refundAmount = parseFloat(amount);

        // Validation
        if (!reason.trim()) {
            toast.error('Please provide a reason for the refund');
            return;
        }

        if (isNaN(refundAmount) || refundAmount <= 0) {
            toast.error('Please enter a valid refund amount');
            return;
        }

        if (refundAmount > order.total_amount) {
            toast.error('Refund amount cannot exceed order total');
            return;
        }

        const confirmMessage = `Are you sure you want to process a ${refundType} refund of ${formatCurrency(refundAmount)}?`;
        if (!window.confirm(confirmMessage)) return;

        setIsProcessing(true);
        try {
            const data: ProcessRefundRequest = {
                amount: refundAmount,
                refund_type: refundType,
                reason: reason.trim(),
            };

            await orderService.processRefund(order.id, data);
            toast.success('Refund processed successfully');
            onRefundSuccess();
            onClose();
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <div className="inline-block w-full max-w-lg my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Process Refund</h3>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">Order #{order.order_number}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors duration-300 p-2 min-w-touch min-h-touch flex items-center justify-center"
                                aria-label="Close modal"
                            >
                                <X className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-6">
                        <div className="space-y-4">
                            {/* Warning */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
                                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-semibold">Important</p>
                                    <p>This action will process a refund through Razorpay. This cannot be undone.</p>
                                </div>
                            </div>

                            {/* Order Total */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Order Total</span>
                                    <span className="text-lg font-bold text-gray-900">{formatCurrency(order.total_amount)}</span>
                                </div>
                            </div>

                            {/* Refund Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Refund Type</label>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => handleRefundTypeChange('full')}
                                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${refundType === 'full'
                                                ? 'bg-gradient-to-r from-red-400 to-red-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Full Refund
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRefundTypeChange('partial')}
                                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${refundType === 'partial'
                                                ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Partial Refund
                                    </button>
                                </div>
                            </div>

                            {/* Refund Amount */}
                            <div>
                                <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Refund Amount
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        id="amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        disabled={refundType === 'full'}
                                        step="0.01"
                                        min="0"
                                        max={order.total_amount}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        placeholder="Enter refund amount"
                                        required
                                    />
                                </div>
                                {refundType === 'partial' && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Maximum: {formatCurrency(order.total_amount)}
                                    </p>
                                )}
                            </div>

                            {/* Reason */}
                            <div>
                                <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason for Refund <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent resize-y"
                                    placeholder="Enter the reason for this refund..."
                                    required
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 min-h-touch border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="flex-1 px-6 py-3 min-h-touch bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Processing...' : 'Process Refund'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
