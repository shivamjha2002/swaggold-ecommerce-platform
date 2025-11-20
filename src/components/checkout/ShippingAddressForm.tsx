import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { ShippingAddress } from '../../services/checkoutService';

interface ShippingAddressFormProps {
    onSubmit: (address: ShippingAddress) => void;
    initialData?: Partial<ShippingAddress>;
    disabled?: boolean;
}

export interface ShippingAddressFormHandle {
    getFormData: () => ShippingAddress | null;
    validate: () => boolean;
}

interface FormErrors {
    full_name?: string;
    mobile?: string;
    email?: string;
    address_line1?: string;
    city?: string;
    state?: string;
    pin_code?: string;
}

export const ShippingAddressForm = forwardRef<ShippingAddressFormHandle, ShippingAddressFormProps>(({
    onSubmit,
    initialData = {},
    disabled = false
}, ref) => {
    const [formData, setFormData] = useState<ShippingAddress>({
        full_name: initialData.full_name || '',
        mobile: initialData.mobile || '',
        email: initialData.email || '',
        address_line1: initialData.address_line1 || '',
        address_line2: initialData.address_line2 || '',
        city: initialData.city || '',
        state: initialData.state || '',
        pin_code: initialData.pin_code || '',
        landmark: initialData.landmark || '',
        preferred_delivery_date: initialData.preferred_delivery_date || ''
    });

    const [errors, setErrors] = useState<FormErrors>({});

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Full name validation
        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Full name is required';
        }

        // Mobile validation (10 digits)
        if (!formData.mobile.trim()) {
            newErrors.mobile = 'Mobile number is required';
        } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
            newErrors.mobile = 'Mobile number must be exactly 10 digits';
        }

        // Email validation (optional but must be valid if provided)
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Address line 1 validation
        if (!formData.address_line1.trim()) {
            newErrors.address_line1 = 'Address is required';
        }

        // City validation
        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }

        // State validation
        if (!formData.state.trim()) {
            newErrors.state = 'State is required';
        }

        // PIN code validation
        if (!formData.pin_code.trim()) {
            newErrors.pin_code = 'PIN code is required';
        } else if (!/^\d{6}$/.test(formData.pin_code.trim())) {
            newErrors.pin_code = 'PIN code must be exactly 6 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        getFormData: () => {
            if (validateForm()) {
                return formData;
            }
            return null;
        },
        validate: () => validateForm()
    }));

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
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
                    onChange={handleChange}
                    disabled={disabled}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${errors.full_name ? 'border-red-500' : 'border-gray-300'
                        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Enter your full name"
                />
                {errors.full_name && (
                    <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>
                )}
            </div>

            {/* Mobile Number */}
            <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    disabled={disabled}
                    maxLength={10}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${errors.mobile ? 'border-red-500' : 'border-gray-300'
                        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="10-digit mobile number"
                />
                {errors.mobile && (
                    <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>
                )}
            </div>

            {/* Email (Optional) */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address (Optional)
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={disabled}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="your.email@example.com"
                />
                {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
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
                    onChange={handleChange}
                    disabled={disabled}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${errors.address_line1 ? 'border-red-500' : 'border-gray-300'
                        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="House/Flat No., Building Name"
                />
                {errors.address_line1 && (
                    <p className="mt-1 text-sm text-red-500">{errors.address_line1}</p>
                )}
            </div>

            {/* Address Line 2 (Optional) */}
            <div>
                <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2 (Optional)
                </label>
                <input
                    type="text"
                    id="address_line2"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    disabled={disabled}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Street, Area, Colony"
                />
            </div>

            {/* City and State */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={disabled}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${errors.city ? 'border-red-500' : 'border-gray-300'
                            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="City"
                    />
                    {errors.city && (
                        <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        disabled={disabled}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${errors.state ? 'border-red-500' : 'border-gray-300'
                            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="State"
                    />
                    {errors.state && (
                        <p className="mt-1 text-sm text-red-500">{errors.state}</p>
                    )}
                </div>
            </div>

            {/* PIN Code and Landmark */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="pin_code" className="block text-sm font-medium text-gray-700 mb-1">
                        PIN Code <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="pin_code"
                        name="pin_code"
                        value={formData.pin_code}
                        onChange={handleChange}
                        disabled={disabled}
                        maxLength={6}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${errors.pin_code ? 'border-red-500' : 'border-gray-300'
                            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="6-digit PIN code"
                    />
                    {errors.pin_code && (
                        <p className="mt-1 text-sm text-red-500">{errors.pin_code}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="landmark" className="block text-sm font-medium text-gray-700 mb-1">
                        Landmark (Optional)
                    </label>
                    <input
                        type="text"
                        id="landmark"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleChange}
                        disabled={disabled}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Nearby landmark"
                    />
                </div>
            </div>

            {/* Preferred Delivery Date (Optional) */}
            <div>
                <label htmlFor="preferred_delivery_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Delivery Date (Optional)
                </label>
                <input
                    type="date"
                    id="preferred_delivery_date"
                    name="preferred_delivery_date"
                    value={formData.preferred_delivery_date}
                    onChange={handleChange}
                    disabled={disabled}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
            </div>

            {/* Submit Button - Hidden, form will be submitted by parent */}
            <button type="submit" className="hidden">Submit</button>
        </form>
    );
});
