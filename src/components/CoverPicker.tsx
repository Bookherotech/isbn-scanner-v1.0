import { useState } from 'react';
import { Check, Upload, ChevronLeft } from 'lucide-react';
import type { CoverCandidate } from '@/lib/types';

interface CoverPickerProps {
  candidates: CoverCandidate[];
  selectedUrl: string;
  onSelect: (url: string) => void;
  onUpload: (url: string) => void;
  onBack: () => void;
}

export default function CoverPicker({
  candidates,
  selectedUrl,
  onSelect,
  onUpload,
  onBack,
}: CoverPickerProps) {
  const [uploadError, setUploadError] = useState('');

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onUpload(reader.result as string);
      setUploadError('');
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Select Cover</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {candidates.map((candidate, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(candidate.url)}
            className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
              selectedUrl === candidate.url
                ? 'border-emerald-500 ring-2 ring-emerald-200'
                : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <div className="aspect-[2/3] bg-gray-100 flex items-center justify-center">
              <img
                src={candidate.url}
                alt={`Cover from ${candidate.source}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div className="p-2 bg-white">
              <p className="text-xs text-gray-500 truncate">{candidate.source}</p>
            </div>
            {selectedUrl === candidate.url && (
              <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                <Check size={16} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {candidates.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No cover candidates were found. Upload your own below.</p>
        </div>
      )}

      <div className="mt-8 border-t border-gray-200 pt-6">
        <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
          <Upload size={32} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            Upload Your Own Cover
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        {uploadError && (
          <p className="mt-2 text-sm text-red-600">{uploadError}</p>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          Use Selected Cover
        </button>
      </div>
    </div>
  );
}
