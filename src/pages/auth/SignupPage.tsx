import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorHandler';
import { toast } from 'react-toastify';

interface FormErrors {
    fullName?: string;
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
}

interface PasswordStrength {
    score: number; // 0-4
    label: string;
    color: string;
}

export const SignupPage = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
        score: 0,
        label: '',
        color: '',
    });

    const navigate = useNavigate();
    const { signup } = useAuth();

    // Calculate password strength
    useEffect(() => {
        if (!formData.password) {
            setPasswordStrength({ score: 0, label: '', color: '' });
            return;
        }

        let score = 0;
        const password = formData.password;

        // Length check
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;

        // Character variety checks
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        // Cap at 4
        score = Math.min(score, 4);

        const strengthMap: Record<number, { label: string; color: string }> = {
            0: { label: '', color: '' },
            1: { label: 'Weak', color: 'bg-red-500' },
            2: { label: 'Fair', color: 'bg-orange-500' },
            3: { label: 'Good', color: 'bg-yellow-500' },
            4: { label: 'Strong', color: 'bg-green-500' },
        };

        setPasswordStrength({
            score,
            label: strengthMap[score].label,
            color: strengthMap[score].color,
        });
    }, [formData.password]);

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
            case 'fullName':
                if (!formData.fullName.trim()) {
                    newErrors.fullName = 'Full name is required';
                } else if (formData.fullName.trim().length < 2) {
                    newErrors.fullName = 'Full name must be at least 2 characters';
                } else {
                    delete newErrors.fullName;
                }
                break;

            case 'email':
                if (!formData.email.trim()) {
                    newErrors.email = 'Email is required';
                } else {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(formData.email)) {
                        newErrors.email = 'Please enter a valid email address';
                    } else {
                        delete newErrors.email;
                    }
                }
                break;

            case 'username':
                if (!formData.username.trim()) {
                    newErrors.username = 'Username is required';
                } else if (formData.username.length < 3) {
                    newErrors.username = 'Username must be at least 3 characters';
                } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
                    newErrors.username = 'Username can only contain letters, numbers, and underscores';
                } else {
                    delete newErrors.username;
                }
                break;

            case 'password':
                if (!formData.password) {
                    newErrors.password = 'Password is required';
                } else if (formData.password.length < 6) {
                    newErrors.password = 'Password must be at least 6 characters';
                } else {
                    delete newErrors.password;
                }
                // Re-validate confirm password if it's been touched
                if (touched.confirmPassword && formData.confirmPassword) {
                    if (formData.password !== formData.confirmPassword) {
                        newErrors.confirmPassword = 'Passwords do not match';
                    } else {
                        delete newErrors.confirmPassword;
                    }
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
        const fields = ['fullName', 'email', 'username', 'password', 'confirmPassword'];
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
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsLoading(true);

        try {
            await signup({
                username: formData.username.trim(),
                email: formData.email.trim(),
                password: formData.password,
            });

            toast.success('Account created successfully! Please login to continue.');
            navigate('/login');
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            toast.error(errorMessage);

            // Set form-level error for display
            setErrors({
                ...errors,
                email: errorMessage.toLowerCase().includes('email') ? errorMessage : undefined,
                username: errorMessage.toLowerCase().includes('username') ? errorMessage : undefined,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-8 border border-gray-700">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mb-4">
                            <UserPlus className="h-8 w-8 text-black" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-white">Create Account</h2>
                        <p className="mt-2 text-sm text-gray-400">Join Swati Gold Platform today</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                        {/* Full Name Field */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    autoComplete="name"
                                    className={`block w-full pl-10 pr-3 py-2 bg-gray-700 border ${touched.fullName && errors.fullName
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-600 focus:ring-yellow-400'
                                        } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm`}
                                    placeholder="Enter your full name"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('fullName')}
                                    disabled={isLoading}
                                />
                            </div>
                            {touched.fullName && errors.fullName && (
                                <div className="mt-1 flex items-center text-sm text-red-400">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {errors.fullName}
                                </div>
                            )}
                        </div>

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
                                    className={`block w-full pl-10 pr-3 py-2 bg-gray-700 border ${touched.email && errors.email
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-600 focus:ring-yellow-400'
                                        } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm`}
                                    placeholder="your@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('email')}
                                    disabled={isLoading}
                                />
                            </div>
                            {touched.email && errors.email && (
                                <div className="mt-1 flex items-center text-sm text-red-400">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {errors.email}
                                </div>
                            )}
                        </div>

                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                                Username
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
                                            : 'border-gray-600 focus:ring-yellow-400'
                                        } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm`}
                                    placeholder="Choose a username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    onBlur={() => handleBlur('username')}
                                    disabled={isLoading}
                                />
                            </div>
                            {touched.username && errors.username && (
                                <div className="mt-1 flex items-center text-sm text-red-400">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {errors.username}
                                </div>
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
                                    autoComplete="new-password"
                                    className={`block w-full pl-10 pr-10 py-2 bg-gray-700 border ${touched.password && errors.password
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-600 focus:ring-yellow-400'
                                        } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm`}
                                    placeholder="Create a password"
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

                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-400">Password strength:</span>
                                        <span className={`text-xs font-medium ${passwordStrength.score === 1 ? 'text-red-400' :
                                                passwordStrength.score === 2 ? 'text-orange-400' :
                                                    passwordStrength.score === 3 ? 'text-yellow-400' :
                                                        passwordStrength.score === 4 ? 'text-green-400' : 'text-gray-400'
                                            }`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1 flex-1 rounded-full ${level <= passwordStrength.score
                                                        ? passwordStrength.color
                                                        : 'bg-gray-600'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {touched.password && errors.password && (
                                <div className="mt-1 flex items-center text-sm text-red-400">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {errors.password}
                                </div>
                            )}
                            {!errors.password && formData.password && (
                                <p className="mt-1 text-xs text-gray-400">
                                    Use 8+ characters with a mix of letters, numbers & symbols
                                </p>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                                Confirm Password
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
                                            : touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword
                                                ? 'border-green-500 focus:ring-green-500'
                                                : 'border-gray-600 focus:ring-yellow-400'
                                        } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent sm:text-sm`}
                                    placeholder="Confirm your password"
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
                                <div className="mt-1 flex items-center text-sm text-red-400">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {errors.confirmPassword}
                                </div>
                            )}
                            {touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword && (
                                <div className="mt-1 flex items-center text-sm text-green-400">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Passwords match
                                </div>
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
                                        Creating account...
                                    </span>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </div>

                        {/* Login Link */}
                        <div className="text-center">
                            <p className="text-sm text-gray-400">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
