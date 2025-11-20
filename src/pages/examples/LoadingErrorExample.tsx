import React, { useEffect } from 'react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import {
    ErrorMessage,
    ErrorMessageCard,
    ErrorMessageBanner,
    LoadingState
} from '../../components/common';
import { LoadingButton } from '../../components/LoadingButton';
import { useApiCall } from '../../hooks/useApiCall';
import { productService } from '../../services/productService';
import showToast from '../../utils/toast';

/**
 * LoadingErrorExample Component
 * 
 * Demonstrates all loading and error handling components and patterns.
 * This is an example page for development reference.
 */
export const LoadingErrorExample: React.FC = () => {
    const [buttonLoading, setButtonLoading] = React.useState(false);

    // Example 1: Using useApiCall hook with LoadingState
    const {
        data: products,
        loading: productsLoading,
        error: productsError,
        execute: loadProducts,
        retry: retryProducts
    } = useApiCall(productService.getProducts);

    useEffect(() => {
        loadProducts();
    }, []);

    // Example 2: Manual loading state
    const handleButtonClick = async () => {
        setButtonLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            showToast.success('Action completed successfully!');
        } catch (error) {
            showToast.error('Action failed');
        } finally {
            setButtonLoading(false);
        }
    };

    // Example 3: Toast notifications
    const showToastExamples = () => {
        showToast.success('This is a success message!');
        setTimeout(() => showToast.error('This is an error message!'), 500);
        setTimeout(() => showToast.info('This is an info message!'), 1000);
        setTimeout(() => showToast.warning('This is a warning message!'), 1500);
    };

    return (
        <div className="min-h-screen pt-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold mb-8 text-gray-900">
                    Loading & Error Handling Examples
                </h1>

                {/* Section 1: LoadingSpinner */}
                <section className="mb-12 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                        1. LoadingSpinner Component
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Small</h3>
                            <LoadingSpinner size="sm" text="Loading..." />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Medium (Default)</h3>
                            <LoadingSpinner size="md" text="Loading data..." />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Large</h3>
                            <LoadingSpinner size="lg" text="Please wait..." />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Extra Large</h3>
                            <LoadingSpinner size="xl" />
                        </div>
                    </div>
                </section>

                {/* Section 2: ErrorMessage Variants */}
                <section className="mb-12 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                        2. ErrorMessage Component Variants
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Inline Error</h3>
                            <ErrorMessage
                                message="Invalid email format"
                                variant="inline"
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Card Error with Retry</h3>
                            <ErrorMessageCard
                                message="Failed to load products. Please try again."
                                onRetry={() => showToast.info('Retrying...')}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Banner Error</h3>
                            <ErrorMessageBanner
                                message="Unable to connect to server. Please check your internet connection."
                                onRetry={() => showToast.info('Retrying connection...')}
                            />
                        </div>
                    </div>
                </section>

                {/* Section 3: LoadingButton */}
                <section className="mb-12 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                        3. LoadingButton Component
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Normal State</h3>
                            <LoadingButton
                                onClick={handleButtonClick}
                                loading={false}
                                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Click Me
                            </LoadingButton>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Loading State</h3>
                            <LoadingButton
                                onClick={handleButtonClick}
                                loading={buttonLoading}
                                loadingText="Processing..."
                                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Submit Form
                            </LoadingButton>
                        </div>
                    </div>
                </section>

                {/* Section 4: LoadingState Wrapper */}
                <section className="mb-12 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                        4. LoadingState Wrapper Component
                    </h2>
                    <LoadingState
                        loading={productsLoading}
                        error={productsError}
                        onRetry={retryProducts}
                        loadingText="Loading products..."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {products?.data?.slice(0, 6).map((product: any) => (
                                <div
                                    key={product.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                                >
                                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                    <p className="text-gray-600 text-sm mt-2">{product.description}</p>
                                    <p className="text-yellow-600 font-bold mt-2">₹{product.price}</p>
                                </div>
                            ))}
                        </div>
                    </LoadingState>
                </section>

                {/* Section 5: Toast Notifications */}
                <section className="mb-12 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                        5. Toast Notifications
                    </h2>
                    <div className="space-y-4">
                        <p className="text-gray-600 mb-4">
                            Click the button below to see different toast notification types:
                        </p>
                        <button
                            onClick={showToastExamples}
                            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                        >
                            Show Toast Examples
                        </button>
                        <div className="mt-4 space-y-2">
                            <button
                                onClick={() => showToast.success('Success!')}
                                className="mr-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            >
                                Success
                            </button>
                            <button
                                onClick={() => showToast.error('Error!')}
                                className="mr-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Error
                            </button>
                            <button
                                onClick={() => showToast.info('Info!')}
                                className="mr-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Info
                            </button>
                            <button
                                onClick={() => showToast.warning('Warning!')}
                                className="mr-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                            >
                                Warning
                            </button>
                        </div>
                    </div>
                </section>

                {/* Section 6: useApiCall Hook */}
                <section className="mb-12 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                        6. useApiCall Hook
                    </h2>
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            The useApiCall hook simplifies API state management. See Section 4 above for a live example.
                        </p>
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                            {`const { data, loading, error, execute, retry } = useApiCall(
  productService.getProducts
);

useEffect(() => {
  execute();
}, []);

return (
  <LoadingState loading={loading} error={error} onRetry={retry}>
    {/* Your content */}
  </LoadingState>
);`}
                        </pre>
                    </div>
                </section>

                {/* Section 7: Best Practices */}
                <section className="mb-12 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                        7. Best Practices
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>Always show loading states for async operations</li>
                        <li>Display user-friendly error messages (not technical details)</li>
                        <li>Provide retry buttons for failed API calls</li>
                        <li>Use toast notifications for success/error feedback</li>
                        <li>Implement proper ARIA labels for accessibility</li>
                        <li>Use LoadingState wrapper for consistent patterns</li>
                        <li>Wrap critical sections with ErrorBoundary</li>
                    </ul>
                </section>

                {/* Documentation Link */}
                <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-2 text-blue-900">
                        📚 Full Documentation
                    </h2>
                    <p className="text-blue-700">
                        For complete documentation and more examples, see:{' '}
                        <code className="bg-blue-100 px-2 py-1 rounded">
                            src/components/common/LOADING_ERROR_HANDLING.md
                        </code>
                    </p>
                </section>
            </div>
        </div>
    );
};

export default LoadingErrorExample;
