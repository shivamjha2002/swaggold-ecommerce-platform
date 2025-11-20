import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/errorHandler';
import { toast } from 'react-toastify';
import {
    calculatePasswordStrength,
    getPasswordStrengthLabel,
    getPasswordStrengthColor,
    getPasswordStrengthTextColor,
} from '../../utils/passwordStrength';

interface FormErrors {
    password?: string;
    confirmPassword?: string;
}

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [tokenError, setTokenError] = useState(false);

    const passwordStrength = calculatePasswordStrength(formData.password);

    // Check if token exists
    useEffect(() => {
        if (!token) {
            setTokenError(true);
            toast.error('Invalid or missing reset token');
        }
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Clear error for this field when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors({
                ...errors,
                [name]: undefined,
            });
        }
    };

    const handleBlur = (field: string) => {
        setTouched({
            ...touched,
            [field]: true,
        });
        validateField(field);
    };

    const validateField = (field: string): boolean => {
        const newErrors: FormErrors = { ...errors };

        switch (field) {
            case 'password':
                if (!formData.password) {
                    newErrors.password = 'Password is required';
                } else if (formData.password.length < 6) {
                    newErrors.password = 'Password must be at least 6 characters';
                } else {
                    delete newErrors.password;
                }
                break;

            case 'confirmPassword':
                if (!formData.confirmPassword) {
                    newErrors.confirmPassword = 'Please confirm your password';
                } else if (formData.password !== formData.confirmPassword) {
                    newErrors.confirmPassword = 'Passwords do not match';
                } else {
                    delete newErrors.confirmPassword;
                }
                break;
        }

        setErrors(newErrors);
        return !newErrors[field as keyof FormErrors];
    };

    const validateForm = (): boolean => {
        const fields = ['password', 'confirmPassword'];
        let isValid = true;

        fields.forEach((field) => {
            if (!validateField(field)) {
                isValid = false;
            }
        });

        // Mark all fields as touched
        const allTouched: Record<string, boolean> = {};
        fields.forEach((field) => {
            allTouched[field] = true;
        });
        setTouched(allTouched);

        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            toast.error('Invalid or missing reset token');
            return;
        }

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/auth/reset-password', {
                token,
                new_password: formData.password,
            });

            if (response.data.success) {
                setIsSuccess(true);
                toast.success('Password reset successfully!');
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                toast.error(response.data.error?.message || 'Failed to reset password');
            }
        } catch (err) {
            const errorMessage = getErrorMessage(err);

            // Check for token-specific errors
            if (
                errorMessage.toLowerCase().includes('expired') ||
                errorMessage.toLowerCase().includes('invalid token')
            ) {
                setTokenError(true);
                toast.error('Reset link has expired or is invalid. Please request a new one.');
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Show error state if token is missing or invalid
    if (tokenError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8 border border-gray-700">
                        <div className="text-center">
                            <div className="mx-auto h-16 w-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-white">Invalid Reset Link</h2>
                            <p className="mt-4 text-sm text-gray-300">
                                This password reset link is invalid or has expired.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Link
                                to="/forgot-password"
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all duration-300"
                            >
                                Request New Reset Link
                            </Link>

                            <Link
                                to="/login"
                                className="w-full flex justify-center py-3 px-4 border border-gray-600 text-sm font-semibold rounded-lg text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all duration-300"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show success state
    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8 border border-gray-700">
                        <div className="text-center">
                            <div className="mx-auto h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-white">Password Reset Successful!</h2>
                            <p className="mt-4 text-sm text-gray-300">
                                Your password has been reset successfully.
                            </p>
                            <p className="mt-2 text-sm text-gray-400">
                                Redirecting you to login page...
                            </p>
                        </div>

                        <Link
                            to="/login"
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all duration-300"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8 border border-gray-700">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-8 w-8 text-black" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-white">Reset Password</h2>
                        <p className="mt-2 text-sm text-gray-400">
                            Enter your new password below
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    className={`block w-full pl-10 pr-10 py-2 bg-gray-700 border ${touched.password && errors.password
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-600 focus:ring-yellow-400'
                                        } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm`}
                                    placeholder="Enter your new password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('password')}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                                    )}
                                </button>
                            </div>
                            {touched.password && errors.password && (
                                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                            )}

                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-400">Password strength:</span>
                                        <span className={`text-xs font-medium ${getPasswordStrengthTextColor(passwordStrength)}`}>
                                            {getPasswordStrengthLabel(passwordStrength)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-600 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(
                                                passwordStrength
                                            )}`}
                                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400">
                                        Use 8+ characters with a mix of letters, numbers & symbols
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    className={`block w-full pl-10 pr-10 py-2 bg-gray-700 border ${touched.confirmPassword && errors.confirmPassword
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-600 focus:ring-yellow-400'
                                        } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm`}
                                    placeholder="Confirm your new password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('confirmPassword')}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                                    )}
                                </button>
                            </div>
                            {touched.confirmPassword && errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Resetting Password...
                                    </span>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </div>

                        {/* Back to Login Link */}
                        <div className="text-center">
                            <Link
                                to="/login"
                                className="text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
