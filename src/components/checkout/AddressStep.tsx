import React, { useState, useEffect } from 'react';
import { addressService, Address, CreateAddressRequest } from '../../services/addressService';
import { Plus, MapPin, Check, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface AddressStepProps {
    onComplete: (address: Address) => void;
}

/**
 * AddressStep component - Address selection and management
 * 
 * Features:
 * - Displays saved addresses for selection
 * - "Add New Address" form with validation
 * - Calls POST /api/addresses to save new address
 * - Edit and delete existing addresses
 * - Validates required fields
 * 
 * Requirements: 1.13.2
 */
export const AddressStep: React.FC<AddressStepProps> = ({ onComplete }) => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState<CreateAddressRequest>({
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false
    });

    const [errors, setErrors] = useState<Partial<Record<keyof CreateAddressRequest, string>>>({});

    // Fetch addresses on mount
    useEffect(() => {
        fetchAddresses();
    }, []);

    /**
     * Fetch all saved addresses
     */
    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const response = await addressService.getAddresses();

            if (response.success && response.data) {
                setAddresses(response.data);

                // Auto-select default address or first address
                const defaultAddress = response.data.find(addr => addr.is_default);
                if (defaultAddress) {
                    setSelectedAddressId(defaultAddress.id);
                } else if (response.data.length > 0) {
                    setSelectedAddressId(response.data[0].id);
                }
            }
        } catch (error: any) {
            console.error('Error fetching addresses:', error);
            toast.error('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Validate form data
     */
    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof CreateAddressRequest, string>> = {};

        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Full name is required';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Please enter a valid 10-digit phone number';
        }

        if (!formData.address_line1.trim()) {
            newErrors.address_line1 = 'Address is required';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }

        if (!formData.state.trim()) {
            newErrors.state = 'State is required';
        }

        if (!formData.pincode.trim()) {
            newErrors.pincode = 'Pincode is required';
        } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
            newErrors.pincode = 'Please enter a valid 6-digit pincode';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Handle form input change
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error for this field
        if (errors[name as keyof CreateAddressRequest]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    /**
     * Handle add new address
     */
    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);
            const response = await addressService.createAddress(formData);

            if (response.success && response.data) {
                toast.success('Address added successfully');
                setAddresses(prev => [...prev, response.data]);
                setSelectedAddressId(response.data.id);
                setShowAddForm(false);

                // Reset form
                setFormData({
                    full_name: '',
                    phone: '',
                    address_line1: '',
                    address_line2: '',
                    city: '',
                    state: '',
                    pincode: '',
                    is_default: false
                });
            }
        } catch (error: any) {
            console.error('Error adding address:', error);
            const errorMessage = error.response?.data?.error?.message || 'Failed to add address';
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Handle delete address
     */
    const handleDeleteAddress = async (addressId: string) => {
        if (!confirm('Are you sure you want to delete this address?')) {
            return;
        }

        try {
            await addressService.deleteAddress(addressId);
            toast.success('Address deleted successfully');
            setAddresses(prev => prev.filter(addr => addr.id !== addressId));

            // Clear selection if deleted address was selected
            if (selectedAddressId === addressId) {
                setSelectedAddressId(null);
            }
        } catch (error: any) {
            console.error('Error deleting address:', error);
            toast.error('Failed to delete address');
        }
    };

    /**
     * Handle continue to payment
     */
    const handleContinue = () => {
        const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);

        if (!selectedAddress) {
            toast.error('Please select a delivery address');
            return;
        }

        onComplete(selectedAddress);
    };

    // Loading state
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading addresses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Select Delivery Address</h2>
                {!showAddForm && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Address
                    </button>
                )}
            </div>

            {/* Add New Address Form */}
            {showAddForm && (
                <div className="mb-6 p-4 border-2 border-yellow-200 rounded-lg bg-yellow-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Address</h3>
                    <form onSubmit={handleAddAddress} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="full_name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${errors.full_name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter full name"
                                />
                                {errors.full_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="10-digit mobile number"
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                                )}
                            </div>
                        </div>

                        {/* Address Line 1 */}
                        <div>
                            <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-1">
                                Address Line 1 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="address_line1"
                                name="address_line1"
                                value={formData.address_line1}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${errors.address_line1 ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="House No., Building Name"
                            />
                            {errors.address_line1 && (
                                <p className="mt-1 text-sm text-red-600">{errors.address_line1}</p>
                            )}
                        </div>

                        {/* Address Line 2 */}
                        <div>
                            <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-1">
                                Address Line 2 (Optional)
                            </label>
                            <input
                                type="text"
                                id="address_line2"
                                name="address_line2"
                                value={formData.address_line2}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                placeholder="Road Name, Area, Colony"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* City */}
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${errors.city ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="City"
                                />
                                {errors.city && (
                                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                                )}
                            </div>

                            {/* State */}
                            <div>
                                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                                    State <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="state"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${errors.state ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="State"
                                />
                                {errors.state && (
                                    <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                                )}
                            </div>

                            {/* Pincode */}
                            <div>
                                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pincode <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="pincode"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${errors.pincode ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="6-digit pincode"
                                    maxLength={6}
                                />
                                {errors.pincode && (
                                    <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>
                                )}
                            </div>
                        </div>

                        {/* Set as Default */}
                        <div>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_default"
                                    checked={formData.is_default}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                                />
                                <span className="text-sm text-gray-700">Set as default address</span>
                            </label>
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Saving...' : 'Save Address'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setErrors({});
                                }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Saved Addresses List */}
            {addresses.length > 0 ? (
                <div className="space-y-4 mb-6">
                    {addresses.map((address) => (
                        <div
                            key={address.id}
                            onClick={() => setSelectedAddressId(address.id)}
                            className={`
                                relative p-4 border-2 rounded-lg cursor-pointer transition-all
                                ${selectedAddressId === address.id
                                    ? 'border-yellow-600 bg-yellow-50'
                                    : 'border-gray-200 hover:border-yellow-300'
                                }
                            `}
                        >
                            {/* Selection Indicator */}
                            {selectedAddressId === address.id && (
                                <div className="absolute top-4 right-4">
                                    <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start">
                                <MapPin className="h-5 w-5 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-gray-900">{address.full_name}</h3>
                                        {address.is_default && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-700 mb-1">{address.address_line1}</p>
                                    {address.address_line2 && (
                                        <p className="text-gray-700 mb-1">{address.address_line2}</p>
                                    )}
                                    <p className="text-gray-700 mb-1">
                                        {address.city}, {address.state} - {address.pincode}
                                    </p>
                                    <p className="text-gray-600 text-sm">Phone: {address.phone}</p>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 mt-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteAddress(address.id);
                                            }}
                                            className="inline-flex items-center text-sm text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                !showAddForm && (
                    <div className="text-center py-8">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No saved addresses found</p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Add Your First Address
                        </button>
                    </div>
                )
            )}

            {/* Continue Button */}
            {addresses.length > 0 && !showAddForm && (
                <div className="pt-6 border-t border-gray-200">
                    <button
                        onClick={handleContinue}
                        disabled={!selectedAddressId}
                        className="w-full bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Continue to Payment
                    </button>
                </div>
            )}
        </div>
    );
};
