import React from 'react';

interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface ResponsiveTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T & string;
  onRowClick?: (row: T) => void;
}

export const ResponsiveTable = <T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
}: ResponsiveTableProps<T>): React.ReactElement => {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row) => (
              <tr
                key={String(row[keyField])}
                className={`hover:bg-gray-50 transition-colors duration-200 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4">
                    {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((row) => (
          <div
            key={String(row[keyField])}
            className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${
              onRowClick ? 'cursor-pointer hover:shadow-md' : ''
            } transition-shadow duration-200`}
            onClick={() => onRowClick?.(row)}
          >
            {columns.map((column) => (
              <div key={column.key} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm font-semibold text-gray-600 mr-4">
                  {column.label}:
                </span>
                <span className="text-sm text-gray-900 text-right flex-1">
                  {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
};
