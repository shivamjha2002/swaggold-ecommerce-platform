import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/errorHandler';
import { toast } from 'react-toastify';

interface FormErrors {
    email?: string;
}

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);

        // Clear error when user starts typing
        if (errors.email) {
            setErrors({});
        }
    };

    const handleBlur = () => {
        setTouched(true);
        validateEmail();
    };

    const validateEmail = (): boolean => {
        const newErrors: FormErrors = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                newErrors.email = 'Please enter a valid email address';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setTouched(true);

        if (!validateEmail()) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/auth/forgot-password', {
                email: email.trim(),
            });

            if (response.data.success) {
                setIsSuccess(true);
                toast.success('Password reset email sent successfully!');
            } else {
                toast.error(response.data.error?.message || 'Failed to send reset email');
            }
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8 border border-gray-700">
                        <div className="text-center">
                            <div className="mx-auto h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-white">Check Your Email</h2>
                            <p className="mt-4 text-sm text-gray-300">
                                We've sent a password reset link to <span className="font-semibold text-yellow-400">{email}</span>
                            </p>
                            <p className="mt-2 text-sm text-gray-400">
                                Please check your email and click the link to reset your password.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                                <p className="text-xs text-gray-300">
                                    <strong>Didn't receive the email?</strong>
                                </p>
                                <ul className="mt-2 text-xs text-gray-400 space-y-1 list-disc list-inside">
                                    <li>Check your spam or junk folder</li>
                                    <li>Make sure you entered the correct email address</li>
                                    <li>Wait a few minutes and try again</li>
                                </ul>
                            </div>

                            <Link
                                to="/login"
                                className="w-full flex justify-center items-center py-3 px-4 border border-gray-600 text-sm font-semibold rounded-lg text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition-all duration-300"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Login
                            </Link>
                        </div>
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
                            <Mail className="h-8 w-8 text-black" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-white">Forgot Password?</h2>
                        <p className="mt-2 text-sm text-gray-400">
                            No worries! Enter your email and we'll send you reset instructions.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    className={`block w-full pl-10 pr-3 py-2 bg-gray-700 border ${touched && errors.email
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-600 focus:ring-yellow-400'
                                        } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm`}
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    disabled={isLoading}
                                />
                            </div>
                            {touched && errors.email && (
                                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
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
                                        Sending...
                                    </span>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </div>

                        {/* Back to Login Link */}
                        <div className="text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
