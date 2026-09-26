import { useState } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Save,
  ChevronLeft,
  AlertCircle,
  Layers,
  Pencil,
  X,
} from 'lucide-react';
import type { ReviewState, CoverCandidate } from '@/lib/types';
import { generateDescription, formatBookHeroDescriptionFromFields } from '@/lib/description';
import CoverPicker from './CoverPicker';

interface ReviewScreenProps {
  review: ReviewState;
  onSave: (review: ReviewState) => void;
  onBack: () => void;
  saving: boolean;
  saveError: string | null;
  duplicateInfo: { isDuplicate: boolean; queuePosition: number } | null;
}

const PRICE_OPTIONS = [10, 20, 30, 40];

export default function ReviewScreen({
  review: initialReview,
  onSave,
  onBack,
  saving,
  saveError,
  duplicateInfo,
}: ReviewScreenProps) {
  const [review, setReview] = useState<ReviewState>(initialReview);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  function update<K extends keyof ReviewState>(key: K, value: ReviewState[K]) {
    setReview((prev) => ({ ...prev, [key]: value }));
  }

  function handleRegenerate() {
    const newDesc = generateDescription({
      title: review.title,
      author: review.author,
      synopsis: review.synopsis,
      genres: review.tags.filter((t) => t !== 'used books dubai'),
    });
    update('description', newDesc);
  }

  function handleCopyDescription() {
    const formatted = formatBookHeroDescriptionFromFields(review.description, {
      dimensions: review.dimensions,
      author: review.author,
      isbn: review.isbn,
      format: review.format,
      pages: review.pages,
    });
    navigator.clipboard.writeText(formatted).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = formatted;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
      document.body.removeChild(textarea);
    });
  }

  function handleRemoveTag(tagToRemove: string) {
    update('tags', review.tags.filter((t) => t !== tagToRemove));
  }

  function handleAddTag() {
    const trimmed = newTagInput.trim().toLowerCase();
    if (trimmed && !review.tags.includes(trimmed)) {
      update('tags', [...review.tags, trimmed]);
    }
    setNewTagInput('');
  }

  function handleCoverSelect(url: string) {
    update('coverUrl', url);
    setShowCoverPicker(false);
  }

  function handleCoverUpload(url: string) {
    const newCandidate: CoverCandidate = { url, source: 'Uploaded' };
    update('coverUrl', url);
    update('coverCandidates', [...review.coverCandidates, newCandidate]);
    setShowCoverPicker(false);
  }

  function handlePriceSelect(price: number) {
    update('price', price);
    setCustomPrice('');
  }

  function handleCustomPrice() {
    const val = parseFloat(customPrice);
    if (!isNaN(val) && val > 0) {
      update('price', val);
    }
  }

  function handleSave() {
    onSave(review);
  }

  if (showCoverPicker) {
    return (
      <CoverPicker
        candidates={review.coverCandidates}
        selectedUrl={review.coverUrl}
        onSelect={handleCoverSelect}
        onUpload={handleCoverUpload}
        onBack={() => setShowCoverPicker(false)}
      />
    );
  }

  const fullDescription = formatBookHeroDescriptionFromFields(review.description, {
    dimensions: review.dimensions,
    author: review.author,
    isbn: review.isbn,
    format: review.format,
    pages: review.pages,
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Book Preview</h2>
        {review.confidence === 'ISBN Not Found' && (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <AlertCircle size={14} />
            ISBN Not Found
          </span>
        )}
        {review.confidence === 'Needs Review' && (
          <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            <AlertCircle size={14} />
            Needs Review
          </span>
        )}
        {duplicateInfo?.isDuplicate && (
          <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <Layers size={14} />
            Duplicate — Waiting #{duplicateInfo.queuePosition}
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        {/* Cover */}
        <div>
          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            {review.coverUrl ? (
              <img
                src={review.coverUrl}
                alt={review.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ImageIcon size={48} />
              </div>
            )}
          </div>
          <button
            onClick={() => setShowCoverPicker(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <ImageIcon size={16} />
            Change Cover
          </button>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Title"
                value={review.title}
                editing={editing}
                onChange={(v) => update('title', v)}
              />
              <Field
                label="Author"
                value={review.author}
                editing={editing}
                onChange={(v) => update('author', v)}
              />
              <Field
                label="ISBN"
                value={review.isbn}
                editing={editing}
                onChange={(v) => update('isbn', v)}
              />
              <Field
                label="Format"
                value={review.format}
                editing={editing}
                onChange={(v) => update('format', v)}
              />
              <Field
                label="Pages"
                value={review.pages?.toString() || ''}
                editing={editing}
                onChange={(v) => update('pages', v ? parseInt(v) || null : null)}
              />
              <Field
                label="Dimensions"
                value={review.dimensions}
                editing={editing}
                onChange={(v) => update('dimensions', v)}
              />
            </div>
          </div>

          {/* Price & Location */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                  Price (AED)
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRICE_OPTIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePriceSelect(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        review.price === p
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                      }`}
                    >
                      AED {p}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomPrice()}
                    placeholder="Custom"
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <button
                    onClick={handleCustomPrice}
                    className="px-3 py-1 text-sm text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50"
                  >
                    Set
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                  Shelf / Location
                </label>
                <input
                  type="text"
                  value={review.location}
                  onChange={(e) => update('location', e.target.value.toUpperCase())}
                  placeholder="e.g. 1RA"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {review.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium group"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-emerald-400 hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1.5 text-sm text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase">
                Description
              </label>
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-600"
              >
                <Pencil size={14} />
                {editing ? 'Done' : 'Edit All'}
              </button>
            </div>
            {editing ? (
              <textarea
                value={review.description}
                onChange={(e) => update('description', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {fullDescription}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <RefreshCw size={14} />
                Regenerate
              </button>
              <button
                onClick={handleCopyDescription}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Description'}
              </button>
            </div>
          </div>

          {saveError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save & Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
        {label}
      </label>
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      ) : (
        <p className="text-sm text-gray-900">{value || '—'}</p>
      )}
    </div>
  );
}
