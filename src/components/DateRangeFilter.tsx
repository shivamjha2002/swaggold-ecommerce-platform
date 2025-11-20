import { useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import { getErrorMessage } from '../utils/errorHandler';

interface DateRangeFilterProps {
  onExport: (startDate?: string, endDate?: string) => Promise<void>;
  label?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onExport,
  label = 'Export Data',
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      await onExport(startDate || undefined, endDate || undefined);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            <Calendar className="inline h-4 w-4 mr-1" />
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            <Calendar className="inline h-4 w-4 mr-1" />
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleExport}
          disabled={loading}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold px-6 py-2 rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          <span>{loading ? 'Exporting...' : label}</span>
        </button>
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </div>
      )}

      {startDate || endDate ? (
        <div className="mt-2 text-xs text-gray-600">
          {startDate && endDate
            ? `Exporting data from ${startDate} to ${endDate}`
            : startDate
            ? `Exporting data from ${startDate} onwards`
            : `Exporting data up to ${endDate}`}
        </div>
      ) : (
        <div className="mt-2 text-xs text-gray-500">
          Leave dates empty to export all data
        </div>
      )}
    </div>
  );
};
