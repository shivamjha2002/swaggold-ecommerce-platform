import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorHandler';
import { toast } from 'react-toastify';

interface FormErrors {
    username?: string;
    password?: string;
}

interface LocationState {
    from?: {
        pathname: string;
    };
}

/**
 * AdminLoginPage component for admin authentication
 * 
 * Features:
 * - Reuses regular login with role check
 * - Validates admin role after successful login
 * - Redirects to admin dashboard on success
 * - Shows access denied for non-admin users
 * 
 * Requirements: 1.8.1, 1.8.2, 1.8.3, 1.8.4
 */
export const AdminLoginPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, isAdmin } = useAuth();

    // Get the redirect path from location state, default to /admin
    const from = (location.state as LocationState)?.from?.pathname || '/admin';

    // Redirect if already authenticated as admin
    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            navigate(from, { replace: true });
        } else if (isAuthenticated && !isAdmin) {
            // User is authenticated but not admin
            toast.error('Access denied. Admin privileges required.');
        }
    }, [isAuthenticated, isAdmin, navigate, from]);

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
            case 'username':
                if (!formData.username.trim()) {
                    newErrors.username = 'Email or username is required';
                } else {
                    delete newErrors.username;
                }
                break;

            case 'password':
                if (!formData.password) {
                    newErrors.password = 'Password is required';
                } else {
                    delete newErrors.password;
                }
                break;
        }

        setErrors(newErrors);
        return !newErrors[field as keyof FormErrors];
    };

    const validateForm = (): boolean => {
        const fields = ['username', 'password'];
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

        if (!validateForm()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsLoading(true);

        try {
            await login({
                username: formData.username.trim(),
                password: formData.password,
            });

            // Check if user has admin role after login
            // The useEffect will handle the redirect
            toast.success('Admin login successful!');
        } catch (err) {
            const errorMessage = getErrorMessage(err);

            // Display user-friendly error messages
            if (errorMessage.toLowerCase().includes('invalid') ||
                errorMessage.toLowerCase().includes('incorrect') ||
                errorMessage.toLowerCase().includes('not found')) {
                toast.error('Invalid email/username or password');
                setErrors({
                    username: ' ',
                    password: 'Invalid credentials',
                });
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8 border border-gray-700">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4">
                            <Shield className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-white">Admin Access</h2>
                        <p className="mt-2 text-sm text-gray-400">Sign in with admin credentials</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                        {/* Username/Email Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                                Admin Email or Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    className={`block w-full pl-10 pr-3 py-2 bg-gray-700 border ${touched.username && errors.username
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-600 focus:ring-red-400'
                                        } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm`}
                                    placeholder="Enter admin email or username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('username')}
                                    disabled={isLoading}
                                />
                            </div>
                            {touched.username && errors.username && errors.username.trim() && (
                                <p className="mt-1 text-sm text-red-400">{errors.username}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    className={`block w-full pl-10 pr-10 py-2 bg-gray-700 border ${touched.password && errors.password
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-gray-600 focus:ring-red-400'
                                        } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm`}
                                    placeholder="Enter admin password"
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
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In as Admin'
                                )}
                            </button>
                        </div>

                        {/* Back to regular login */}
                        <div className="text-center">
                            <p className="text-sm text-gray-400">
                                Not an admin?{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="font-medium text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Regular Login
                                </button>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
