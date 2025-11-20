import React from 'react';

interface AccessibleImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    alt: string;
    decorative?: boolean;
}

/**
 * Accessible Image Component
 * 
 * Ensures all images have proper alt text and handles decorative images correctly.
 * Decorative images get empty alt text and aria-hidden="true".
 */
export const AccessibleImage: React.FC<AccessibleImageProps> = ({
    alt,
    decorative = false,
    ...props
}) => {
    if (decorative) {
        return (
            <img
                {...props}
                alt=""
                role="presentation"
                aria-hidden="true"
            />
        );
    }

    return (
        <img
            {...props}
            alt={alt}
        />
    );
};

export default AccessibleImage;
