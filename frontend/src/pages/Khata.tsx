import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, CreditCard, Calendar, IndianRupee, Download, Search, X, QrCode, Mail, Phone } from 'lucide-react';

const Khata = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [loginForm, setLoginForm] = useState({
    customerId: '',
    password: ''
  });

  const customerData = {
    name: "Nagendra Jha",
    customerId: "SJ2024001",
    phone: "+91 82101 61393",
    email: "nagendrajha035@gmail.com",
    joinDate: "2020-03-15",
    totalPurchases: "₹8,50,000",
    pendingAmount: "₹25,000",
    creditLimit: "₹50,000",
    transactions: [
      {
        id: 1,
        date: "2024-12-01",
        description: "Diamond Earrings Purchase",
        amount: "₹85,000",
        type: "purchase",
        status: "paid",
        invoiceNo: "INV-2024-001"
      },
      {
        id: 2,
        date: "2024-11-15",
        description: "Gold Necklace - Partial Payment",
        amount: "₹45,000",
        type: "payment",
        status: "partial",
        invoiceNo: "INV-2024-002"
      },
      {
        id: 3,
        date: "2024-11-01",
        description: "Bridal Set Purchase",
        amount: "₹1,80,000",
        type: "purchase",
        status: "pending",
        invoiceNo: "INV-2024-003"
      },
      {
        id: 4,
        date: "2024-10-20",
        description: "Payment Received",
        amount: "₹75,000",
        type: "payment",
        status: "completed",
        invoiceNo: "PAY-2024-001"
      },
      {
        id: 5,
        date: "2024-10-01",
        description: "Ring Set Purchase",
        amount: "₹65,000",
        type: "purchase",
        status: "paid",
        invoiceNo: "INV-2024-004"
      }
    ]
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.customerId === 'SJ2024001' && loginForm.password === 'demo123') {
      setIsLoggedIn(true);
      setShowErrorModal(false);
    } else {
      setShowErrorModal(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginForm({ customerId: '', password: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type) => {
    return type === 'purchase' ? '↗' : '↙';
  };

  const handleDownloadStatement = () => {
    const header = ['Date', 'Description', 'Invoice', 'Amount', 'Status'];
    const rows = customerData.transactions.map(t => [
      t.date,
      t.description,
      t.invoiceNo,
      t.amount,
      t.status
    ]);
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "transaction_statement.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handlePaymentMethod = (method) => {
    console.log(`Payment via ${method} selected.`);
    setShowPaymentModal(false);
    // In a real app, this would redirect to a payment gateway or show a payment form.
  };

  const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-black to-gray-900 px-8 py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full mb-6">
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Khata Login</h2>
              <p className="text-gray-300">Access your account details and transaction history</p>
            </div>

            <form onSubmit={handleLogin} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your Customer ID"
                    value={loginForm.customerId}
                    onChange={(e) => setLoginForm({ ...loginForm, customerId: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold py-3 rounded-xl hover:from-yellow-400 hover:to-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Login to Khata
              </button>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Demo Credentials: <br />
                  <span className="font-semibold">ID:</span> SJ2024001 <br />
                  <span className="font-semibold">Password:</span> demo123
                </p>
              </div>
            </form>
          </div>
        </div>
        
        {showErrorModal && (
          <Modal title="Login Failed" onClose={() => setShowErrorModal(false)}>
            <p className="text-center text-sm text-red-600">
              Invalid credentials. Please try again.
            </p>
            <div className="mt-4 text-center">
              <span className="font-semibold">ID:</span> SJ2024001, <span className="font-semibold">Password:</span> demo123
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-black to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome, {customerData.name}
              </h1>
              <p className="text-gray-300">Customer ID: {customerData.customerId}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Summary */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-green-400">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">{customerData.totalPurchases}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-red-400">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <CreditCard className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900">{customerData.pendingAmount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-blue-400">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Credit Limit</p>
                <p className="text-2xl font-bold text-gray-900">{customerData.creditLimit}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-yellow-400">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Member Since</p>
                <p className="text-lg font-bold text-gray-900">{customerData.joinDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
              <button
                onClick={handleDownloadStatement}
                className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customerData.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          transaction.type === 'purchase' ? 'bg-red-400' : 'bg-green-400'
                        }`}></span>
                        <span>{transaction.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.invoiceNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span className={transaction.type === 'purchase' ? 'text-red-600' : 'text-green-600'}>
                        {getTransactionIcon(transaction.type)} {transaction.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full mb-4">
              <IndianRupee className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Make Payment</h3>
            <p className="text-sm text-gray-600 mb-4">Pay your pending amount online</p>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white font-semibold py-2 rounded-lg hover:from-green-400 hover:to-green-300 transition-all duration-300"
            >
              Pay Now
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mb-4">
              <Download className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Download Statement</h3>
            <p className="text-sm text-gray-600 mb-4">Get detailed account statement</p>
            <button
              onClick={handleDownloadStatement}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-400 text-white font-semibold py-2 rounded-lg hover:from-blue-400 hover:to-blue-300 transition-all duration-300"
            >
              Download
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full mb-4">
              <User className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Contact Support</h3>
            <p className="text-sm text-gray-600 mb-4">Need help with your account?</p>
            <button
              onClick={() => setShowContactModal(true)}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-semibold py-2 rounded-lg hover:from-yellow-400 hover:to-yellow-300 transition-all duration-300"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <Modal title="Payment Options" onClose={() => setShowPaymentModal(false)}>
          <p className="text-sm text-gray-600 mb-4">Select a payment method to clear your pending amount of {customerData.pendingAmount}.</p>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Online Payments</h4>
              <div className="space-y-3">
                <button
                  onClick={() => handlePaymentMethod('UPI Scan')}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-400 text-white font-bold py-3 rounded-lg hover:from-green-400 hover:to-green-300 transition-all duration-300 shadow-md"
                >
                  <QrCode className="h-6 w-6" />
                  <span>Scan QR Code</span>
                </button>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter UPI ID"
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300 text-sm"
                  />
                  <button
                    onClick={() => handlePaymentMethod('UPI ID')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-500 text-white p-2 rounded-lg"
                  >
                    Pay
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Card Payments</h4>
              <form onSubmit={(e) => { e.preventDefault(); handlePaymentMethod('Card'); }} className="space-y-3">
                <input type="text" placeholder="Card Number" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-sm" />
                <div className="flex space-x-3">
                  <input type="text" placeholder="MM/YY" className="w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-sm" />
                  <input type="text" placeholder="CVV" className="w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-sm" />
                </div>
                <input type="text" placeholder="Name on Card" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-sm" />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-400 text-white font-bold py-3 rounded-lg hover:from-blue-400 hover:to-blue-300 transition-all duration-300 shadow-md"
                >
                  <CreditCard className="h-6 w-6" />
                  <span>Pay with Card</span>
                </button>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {showContactModal && (
        <Modal title="Contact Us" onClose={() => setShowContactModal(false)}>
          <p className="text-sm text-gray-600 mb-4">For any support or queries, you can reach us through the following channels:</p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-gray-800">
              <Phone className="h-5 w-5 text-gray-600" />
              <span className="font-semibold">{customerData.phone}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-800">
              <Mail className="h-5 w-5 text-gray-600" />
              <span className="font-semibold">{customerData.email}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">We are available from 10:00 AM to 6:00 PM, Monday to Saturday.</p>
        </Modal>
      )}
    </div>
  );
};

export default Khata;