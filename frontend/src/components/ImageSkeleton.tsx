import React, { memo } from 'react';

interface ImageSkeletonProps {
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
}

const ImageSkeletonComponent: React.FC<ImageSkeletonProps> = ({
  className = '',
  aspectRatio = 'square',
}) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  return (
    <div
      className={`${aspectRatioClasses[aspectRatio]} ${className} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded overflow-hidden`}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export const ImageSkeleton = memo(ImageSkeletonComponent);
