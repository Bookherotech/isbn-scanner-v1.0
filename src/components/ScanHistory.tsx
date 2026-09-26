import { useEffect, useState } from 'react';
import { Search, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { getScanHistory } from '@/lib/db';
import type { CopyRecord } from '@/lib/types';

interface ScanHistoryProps {
  onBack: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  ONLINE: 'bg-emerald-100 text-emerald-700',
  WAITING: 'bg-blue-100 text-blue-700',
  SOLD: 'bg-gray-100 text-gray-600',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  REMOVED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function ScanHistory({ onBack }: ScanHistoryProps) {
  const [records, setRecords] = useState<CopyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      getScanHistory({ query, status: statusFilter }).then((data) => {
        setRecords(data);
        setLoading(false);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, statusFilter]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Scan History</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, ISBN, or location..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="all">All Statuses</option>
          <option value="ONLINE">Online</option>
          <option value="WAITING">Waiting</option>
          <option value="SOLD">Sold</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="published">Published to Shopify</option>
          <option value="unpublished">Not Published</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No scans found. Scan a book to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Cover</th>
                  <th className="px-4 py-3 text-left font-semibold">Title</th>
                  <th className="px-4 py-3 text-left font-semibold">Author</th>
                  <th className="px-4 py-3 text-left font-semibold">ISBN</th>
                  <th className="px-4 py-3 text-left font-semibold">Location</th>
                  <th className="px-4 py-3 text-left font-semibold">Price</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Shopify</th>
                  <th className="px-4 py-3 text-left font-semibold">Scanned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {rec.cover_url ? (
                        <img
                          src={rec.cover_url}
                          alt=""
                          className="w-10 h-14 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-gray-100 rounded flex items-center justify-center">
                          <ImageIcon size={14} className="text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900 max-w-[200px] truncate">
                      {rec.title || '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-600 max-w-[120px] truncate">
                      {rec.author || '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                      {rec.isbn || '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {rec.location || '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {rec.price ? `AED ${rec.price}` : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[rec.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rec.status}
                        {rec.status === 'WAITING' && rec.queue_position > 0
                          ? ` #${rec.queue_position}`
                          : ''}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          rec.shopify_status === 'published'
                            ? 'bg-teal-100 text-teal-700'
                            : rec.shopify_status === 'error'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {rec.shopify_status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">
                      {rec.scan_date
                        ? new Date(rec.scan_date).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
