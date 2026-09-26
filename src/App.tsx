import { useState } from 'react';
import { BookOpen, LayoutDashboard, ScanLine, History, Loader2, AlertCircle } from 'lucide-react';
import Scanner from '@/components/Scanner';
import ReviewScreen from '@/components/ReviewScreen';
import Dashboard from '@/components/Dashboard';
import ScanHistory from '@/components/ScanHistory';
import { fetchBookData, hasBookData } from '@/lib/bookApi';
import { generateDescription } from '@/lib/description';
import { generateTags } from '@/lib/tags';
import { findDuplicateBook, saveCopy } from '@/lib/db';
import type { ReviewState } from '@/lib/types';

type View = 'dashboard' | 'scan' | 'review' | 'history';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState('');
  const [review, setReview] = useState<ReviewState | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    isDuplicate: boolean;
    queuePosition: number;
    bookId: string | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleScan(isbn: string) {
    setLoading(true);
    setLoadingError('');
    try {
      const bookData = await fetchBookData(isbn);
      const found = hasBookData(bookData);

      const description = found
        ? generateDescription({
            title: bookData.title,
            author: bookData.author,
            synopsis: bookData.synopsis,
            genres: bookData.genres,
          })
        : '';

      const tags = found ? generateTags(bookData) : ['used books dubai'];

      const dup = found
        ? await findDuplicateBook(bookData.title, bookData.author)
        : { bookId: null, queuePosition: 0, isDuplicate: false };
      setDuplicateInfo(dup);

      const confidence = found ? 'Ready' : 'ISBN Not Found';

      const newReview: ReviewState = {
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
        format: bookData.format,
        dimensions: bookData.dimensions,
        pages: bookData.pages,
        synopsis: bookData.synopsis,
        coverUrl: bookData.coverUrl,
        coverCandidates: bookData.coverCandidates,
        description,
        tags,
        price: null,
        location: '',
        confidence,
      };
      setReview(newReview);
      setView('review');
    } catch (err: any) {
      setLoadingError(
        err.message || 'Something went wrong while looking up the book.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(finalReview: ReviewState) {
    if (!finalReview) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { error } = await saveCopy(finalReview, duplicateInfo?.bookId || null);
      if (error) {
        setSaveError(error);
        setSaving(false);
        return;
      }
      setReview(null);
      setDuplicateInfo(null);
      setSaving(false);
      setView('scan');
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save the book.');
      setSaving(false);
    }
  }

  function handleBackToScan() {
    setReview(null);
    setDuplicateInfo(null);
    setSaveError(null);
    setView('scan');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 rounded-lg p-1.5">
                <BookOpen size={22} className="text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">BookHero</span>
              <span className="text-sm text-gray-400 hidden sm:inline">ISBN Scanner</span>
            </div>
            <nav className="flex items-center gap-1">
              <NavButton
                active={view === 'dashboard'}
                onClick={() => setView('dashboard')}
                icon={LayoutDashboard}
                label="Dashboard"
              />
              <NavButton
                active={view === 'scan' || view === 'review'}
                onClick={() => setView('scan')}
                icon={ScanLine}
                label="Scan"
              />
              <NavButton
                active={view === 'history'}
                onClick={() => setView('history')}
                icon={History}
                label="History"
              />
            </nav>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="text-emerald-600 animate-spin mb-4" />
            <p className="text-gray-500">Looking up book information...</p>
          </div>
        )}

        {!loading && loadingError && (
          <div className="max-w-2xl mx-auto flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-xl">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p>{loadingError}</p>
              <button
                onClick={() => {
                  setLoadingError('');
                  setView('scan');
                }}
                className="mt-2 text-sm font-medium text-red-700 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!loading && !loadingError && view === 'dashboard' && (
          <Dashboard onScanClick={() => setView('scan')} />
        )}

        {!loading && !loadingError && view === 'scan' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Scan a Book
              </h2>
              <p className="text-gray-500">
                Point the camera at a barcode or enter the ISBN manually.
              </p>
            </div>
            <Scanner onScan={handleScan} />
          </div>
        )}

        {!loading && !loadingError && view === 'review' && review && (
          <ReviewScreen
            review={review}
            onSave={handleSave}
            onBack={handleBackToScan}
            saving={saving}
            saveError={saveError}
            duplicateInfo={duplicateInfo}
          />
        )}

        {!loading && !loadingError && view === 'history' && (
          <ScanHistory onBack={() => setView('dashboard')} />
        )}
      </main>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
