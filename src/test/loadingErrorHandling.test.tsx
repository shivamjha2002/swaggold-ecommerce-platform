import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
    ErrorMessage,
    ErrorMessageCard,
    ErrorMessageBanner
} from '../components/common/ErrorMessage';
import { LoadingState } from '../components/common/LoadingState';
import { LoadingButton } from '../components/LoadingButton';

describe('Loading and Error Handling Components', () => {
    describe('LoadingSpinner', () => {
        it('renders with default props', () => {
            render(<LoadingSpinner />);
            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('renders with custom text', () => {
            render(<LoadingSpinner text="Loading products..." />);
            expect(screen.getByText('Loading products...')).toBeInTheDocument();
        });

        it('renders different sizes', () => {
            const { rerender } = render(<LoadingSpinner size="sm" />);
            expect(screen.getByRole('status')).toBeInTheDocument();

            rerender(<LoadingSpinner size="lg" />);
            expect(screen.getByRole('status')).toBeInTheDocument();
        });

        it('has proper accessibility attributes', () => {
            render(<LoadingSpinner text="Loading" />);
            const status = screen.getByRole('status');
            expect(status).toHaveAttribute('aria-live', 'polite');
            expect(status).toHaveAttribute('aria-label', 'Loading');
        });
    });

    describe('ErrorMessage', () => {
        it('renders error message', () => {
            render(<ErrorMessage message="Something went wrong" />);
            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        });

        it('renders retry button when onRetry is provided', () => {
            const onRetry = vi.fn();
            render(<ErrorMessage message="Error" onRetry={onRetry} />);

            const retryButton = screen.getByRole('button', { name: /retry failed operation/i });
            expect(retryButton).toBeInTheDocument();
            expect(screen.getByText(/try again/i)).toBeInTheDocument();

            fireEvent.click(retryButton);
            expect(onRetry).toHaveBeenCalledTimes(1);
        });

        it('does not render retry button when onRetry is not provided', () => {
            render(<ErrorMessage message="Error" />);
            expect(screen.queryByRole('button', { name: /retry failed operation/i })).not.toBeInTheDocument();
        });

        it('renders different variants', () => {
            const { rerender } = render(<ErrorMessage message="Error" variant="inline" />);
            expect(screen.getByRole('alert')).toBeInTheDocument();

            rerender(<ErrorMessage message="Error" variant="card" />);
            expect(screen.getByRole('alert')).toBeInTheDocument();

            rerender(<ErrorMessage message="Error" variant="banner" />);
            expect(screen.getByRole('alert')).toBeInTheDocument();
        });

        it('can hide icon', () => {
            const { container } = render(<ErrorMessage message="Error" showIcon={false} />);
            const icon = container.querySelector('svg');
            expect(icon).not.toBeInTheDocument();
        });
    });

    describe('ErrorMessageCard', () => {
        it('renders as card variant', () => {
            render(<ErrorMessageCard message="Card error" />);
            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByText('Card error')).toBeInTheDocument();
        });
    });

    describe('ErrorMessageBanner', () => {
        it('renders as banner variant', () => {
            render(<ErrorMessageBanner message="Banner error" />);
            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByText('Banner error')).toBeInTheDocument();
        });
    });

    describe('LoadingState', () => {
        it('shows loading spinner when loading is true', () => {
            render(
                <LoadingState loading={true} error={null}>
                    <div>Content</div>
                </LoadingState>
            );

            expect(screen.getByRole('status')).toBeInTheDocument();
            expect(screen.queryByText('Content')).not.toBeInTheDocument();
        });

        it('shows error message when error is present', () => {
            render(
                <LoadingState loading={false} error="Something went wrong">
                    <div>Content</div>
                </LoadingState>
            );

            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(screen.queryByText('Content')).not.toBeInTheDocument();
        });

        it('shows content when not loading and no error', () => {
            render(
                <LoadingState loading={false} error={null}>
                    <div>Content</div>
                </LoadingState>
            );

            expect(screen.queryByRole('status')).not.toBeInTheDocument();
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
            expect(screen.getByText('Content')).toBeInTheDocument();
        });

        it('calls onRetry when retry button is clicked', () => {
            const onRetry = vi.fn();
            render(
                <LoadingState loading={false} error="Error" onRetry={onRetry}>
                    <div>Content</div>
                </LoadingState>
            );

            const retryButton = screen.getByRole('button', { name: /retry failed operation/i });
            fireEvent.click(retryButton);
            expect(onRetry).toHaveBeenCalledTimes(1);
        });

        it('shows custom loading text', () => {
            render(
                <LoadingState loading={true} error={null} loadingText="Loading products...">
                    <div>Content</div>
                </LoadingState>
            );

            expect(screen.getByText('Loading products...')).toBeInTheDocument();
        });
    });

    describe('LoadingButton', () => {
        it('renders children when not loading', () => {
            render(<LoadingButton loading={false}>Click Me</LoadingButton>);
            expect(screen.getByText('Click Me')).toBeInTheDocument();
        });

        it('shows loading text when loading', () => {
            render(
                <LoadingButton loading={true} loadingText="Processing...">
                    Click Me
                </LoadingButton>
            );
            expect(screen.getByText('Processing...')).toBeInTheDocument();
        });

        it('is disabled when loading', () => {
            render(<LoadingButton loading={true}>Click Me</LoadingButton>);
            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
        });

        it('is disabled when disabled prop is true', () => {
            render(<LoadingButton disabled={true}>Click Me</LoadingButton>);
            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
        });

        it('calls onClick when clicked and not loading', () => {
            const onClick = vi.fn();
            render(<LoadingButton loading={false} onClick={onClick}>Click Me</LoadingButton>);

            const button = screen.getByRole('button');
            fireEvent.click(button);
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('does not call onClick when loading', () => {
            const onClick = vi.fn();
            render(<LoadingButton loading={true} onClick={onClick}>Click Me</LoadingButton>);

            const button = screen.getByRole('button');
            fireEvent.click(button);
            expect(onClick).not.toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        it('LoadingSpinner has proper ARIA attributes', () => {
            render(<LoadingSpinner text="Loading" />);
            const status = screen.getByRole('status');
            expect(status).toHaveAttribute('aria-live', 'polite');
        });

        it('ErrorMessage has proper ARIA attributes', () => {
            render(<ErrorMessage message="Error" />);
            const alert = screen.getByRole('alert');
            expect(alert).toHaveAttribute('aria-live', 'polite');
        });

        it('Retry button has proper aria-label', () => {
            render(<ErrorMessage message="Error" onRetry={() => { }} />);
            const button = screen.getByRole('button', { name: /retry failed operation/i });
            expect(button).toBeInTheDocument();
        });
    });
});
