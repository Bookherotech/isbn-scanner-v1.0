import { useEffect, useState } from 'react';
import { ScanLine, CheckCircle, AlertTriangle, Layers, BookX, Upload } from 'lucide-react';
import { getDashboardStats } from '@/lib/db';
import type { DashboardStats } from '@/lib/types';

interface DashboardProps {
  onScanClick: () => void;
}

export default function Dashboard({ onScanClick }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((s) => {
        setStats(s);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const cards = [
    { label: "Today's Scans", value: stats?.todayScans ?? 0, icon: ScanLine, color: 'emerald' },
    { label: 'Ready', value: stats?.ready ?? 0, icon: CheckCircle, color: 'green' },
    { label: 'Needs Review', value: stats?.needsReview ?? 0, icon: AlertTriangle, color: 'amber' },
    { label: 'Waiting Queue', value: stats?.waitingQueue ?? 0, icon: Layers, color: 'blue' },
    { label: 'ISBN Not Found', value: stats?.isbnNotFound ?? 0, icon: BookX, color: 'red' },
    { label: 'Published', value: stats?.published ?? 0, icon: Upload, color: 'teal' },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <button
          onClick={onScanClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <ScanLine size={20} />
          Scan a Book
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => {
          const c = colorMap[card.color];
          return (
            <div
              key={card.label}
              className={`rounded-xl border ${c.border} ${c.bg} p-4`}
            >
              <card.icon className={`${c.text} mb-2`} size={24} />
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '—' : card.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
