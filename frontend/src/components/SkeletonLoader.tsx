import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'rectangular',
  width = 'w-full',
  height = 'h-4',
  count = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-300';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const skeletonElement = (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${width} ${height} ${className}`}
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-2">
          {skeletonElement}
        </div>
      ))}
    </>
  );
};

// Product Card Skeleton
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <SkeletonLoader variant="rectangular" height="h-48" />
      <div className="p-4 space-y-3">
        <SkeletonLoader variant="text" height="h-6" width="w-3/4" />
        <SkeletonLoader variant="text" height="h-4" width="w-1/2" />
        <SkeletonLoader variant="text" height="h-4" width="w-full" count={2} />
        <div className="flex justify-between items-center pt-2">
          <SkeletonLoader variant="text" height="h-6" width="w-1/3" />
          <SkeletonLoader variant="rectangular" height="h-10" width="w-24" />
        </div>
      </div>
    </div>
  );
};

// Product List Skeleton
export const ProductListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <SkeletonLoader variant="text" height="h-4" />
        </td>
      ))}
    </tr>
  );
};

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-4 py-3">
                <SkeletonLoader variant="text" height="h-4" width="w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SkeletonLoader;
