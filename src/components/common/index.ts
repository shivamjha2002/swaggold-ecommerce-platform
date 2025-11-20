/**
 * Swati Gold Common Components
 * 
 * Centralized exports for all reusable UI components.
 * These components follow the Swati Gold brand design system.
 */

export { Logo } from './Logo';
export type { default as LogoProps } from './Logo';

export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from './Card';
export type { CardProps } from './Card';

export { Modal, ModalFooter } from './Modal';
export type { ModalProps } from './Modal';

export {
    ErrorMessage,
    ErrorMessageCard,
    ErrorMessageBanner,
    ErrorMessageInline,
} from './ErrorMessage';
export type { default as ErrorMessageProps } from './ErrorMessage';

export { LoadingState } from './LoadingState';
export type { default as LoadingStateProps } from './LoadingState';
