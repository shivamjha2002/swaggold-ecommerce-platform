import { useState } from 'react';
import { X, Package, User, Phone, Mail, Calendar, CreditCard, FileText, CheckCircle, Clock, XCircle, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { Order } from '../types';
import { orderService } from '../services/orderService';
import { getErrorMessage } from '../utils/errorHandler';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onOrderUpdate: () => void;
}

export const OrderDetailModal = ({ isOpen, onClose, order: initialOrder, onOrderUpdate }: OrderDetailModalProps) => {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  if (!isOpen) return null;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'processing':
        return <Loader className="h-5 w-5" />;
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: 'pending' | 'processing' | 'completed' | 'cancelled') => {
    if (newStatus === order.status) return;

    const confirmMessage = `Are you sure you want to change the order status to "${newStatus}"?`;
    if (!window.confirm(confirmMessage)) return;

    setIsUpdatingStatus(true);
    try {
      const updatedOrder = await orderService.updateOrderStatus(order.id, { status: newStatus });
      setOrder(updatedOrder);
      onOrderUpdate();
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setIsAddingNote(true);
    try {
      const updatedOrder = await orderService.addOrderNote(order.id, { admin_notes: newNote });
      setOrder(updatedOrder);
      setNewNote('');
      setShowNoteInput(false);
      onOrderUpdate();
      toast.success('Note added successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsAddingNote(false);
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
        <div className="inline-block w-full max-w-4xl my-4 sm:my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900">Order Details</h3>
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
          <div className="px-4 sm:px-6 py-4 sm:py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-6">
              {/* Order Status and Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Order Timeline
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="font-semibold capitalize">{order.status}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Created: {formatDate(order.created_at)}
                    </div>
                  </div>
                  {order.completed_at && (
                    <div className="text-sm text-gray-600">
                      Completed: {formatDate(order.completed_at)}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    Last Updated: {formatDate(order.updated_at)}
                  </div>
                </div>
              </div>

              {/* Status Update Section */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Update Order Status</h4>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'processing', 'completed', 'cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      disabled={isUpdatingStatus || order.status === status}
                      className={`px-4 py-3 min-h-touch rounded-lg font-semibold transition-all duration-300 ${
                        order.status === status
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Name</p>
                    <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      Phone
                    </p>
                    <p className="text-sm font-medium text-gray-900">{order.customer_phone}</p>
                  </div>
                  {order.customer_email && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </p>
                      <p className="text-sm font-medium text-gray-900">{order.customer_email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Order Items
                </h4>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-500">
                          Quantity: {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.total_price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">{formatCurrency(order.tax_amount)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-600">Payment Status</span>
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                        order.payment_status
                      )}`}
                    >
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Notes */}
              {order.notes && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Customer Notes
                  </h4>
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              )}

              {/* Admin Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Admin Notes
                </h4>
                {order.admin_notes ? (
                  <div className="mb-3">
                    <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                      {order.admin_notes}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-3">No admin notes yet</p>
                )}

                {!showNoteInput ? (
                  <button
                    onClick={() => setShowNoteInput(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {order.admin_notes ? 'Update Note' : 'Add Note'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter admin notes..."
                      className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-y"
                      rows={3}
                    />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        onClick={handleAddNote}
                        disabled={isAddingNote}
                        className="px-4 py-3 min-h-touch bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAddingNote ? 'Saving...' : 'Save Note'}
                      </button>
                      <button
                        onClick={() => {
                          setShowNoteInput(false);
                          setNewNote('');
                        }}
                        className="px-4 py-3 min-h-touch border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
            <div className="flex items-center justify-end">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 min-h-touch bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
