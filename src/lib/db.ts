import { supabase } from './supabase';
import { normalizeTitle } from './isbn';
import { generateUniqueSku } from './sku';
import type { ReviewState, CopyRecord, DashboardStats, CopyStatus } from './types';

export async function findDuplicateBook(
  title: string,
  author: string
): Promise<{ bookId: string | null; queuePosition: number; isDuplicate: boolean }> {
  const normTitle = normalizeTitle(title);
  if (!normTitle) return { bookId: null, queuePosition: 0, isDuplicate: false };

  const { data: existingBooks } = await supabase
    .from('books')
    .select('id, author')
    .eq('normalized_title', normTitle);

  if (!existingBooks || existingBooks.length === 0) {
    return { bookId: null, queuePosition: 0, isDuplicate: false };
  }

  let bestMatch = existingBooks[0];
  if (author) {
    const normAuthor = author.toLowerCase();
    const match = existingBooks.find(
      (b) => b.author && b.author.toLowerCase().includes(normAuthor)
    );
    if (match) bestMatch = match;
  }

  const { count } = await supabase
    .from('copies')
    .select('id', { count: 'exact', head: true })
    .eq('book_id', bestMatch.id)
    .in('status', ['ONLINE', 'WAITING']);

  const queuePosition = (count || 0);
  return { bookId: bestMatch.id, queuePosition, isDuplicate: queuePosition > 0 };
}

export async function saveCopy(
  review: ReviewState,
  bookId: string | null
): Promise<{ copy: CopyRecord | null; error: string | null }> {
  const normTitle = normalizeTitle(review.title);

  let finalBookId = bookId;
  if (!finalBookId) {
    const { data: newBook, error: bookErr } = await supabase
      .from('books')
      .insert({
        title: review.title,
        normalized_title: normTitle,
        author: review.author,
      })
      .select('id')
      .maybeSingle();

    if (bookErr || !newBook) {
      return { copy: null, error: bookErr?.message || 'Failed to create book record' };
    }
    finalBookId = newBook.id;
  }

  const dup = await findDuplicateBook(review.title, review.author);
  const queuePosition = dup.queuePosition;
  const status: CopyStatus = queuePosition > 0 ? 'WAITING' : 'ONLINE';

  const { data: existingSkus } = await supabase
    .from('copies')
    .select('sku')
    .like('sku', `${review.location.trim()}%`);
  const skuList = (existingSkus || []).map((r: any) => r.sku).filter(Boolean) as string[];
  const sku = generateUniqueSku(review.location, review.isbn, skuList);

  const { data: copy, error } = await supabase
    .from('copies')
    .insert({
      book_id: finalBookId,
      isbn: review.isbn,
      title: review.title,
      author: review.author,
      format: review.format,
      dimensions: review.dimensions,
      pages: review.pages,
      synopsis: review.synopsis,
      cover_url: review.coverUrl,
      cover_candidates: review.coverCandidates,
      description: review.description,
      tags: review.tags,
      price: review.price,
      location: review.location,
      sku,
      queue_position: queuePosition,
      status,
      confidence: review.confidence,
      shopify_status: 'unpublished',
      scan_date: new Date().toISOString(),
    })
    .select('*')
    .maybeSingle();

  if (error) return { copy: null, error: error.message };
  return { copy: copy as CopyRecord, error: null };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const { count: todayScans } = await supabase
    .from('copies')
    .select('id', { count: 'exact', head: true })
    .gte('scan_date', todayIso);

  const { count: ready } = await supabase
    .from('copies')
    .select('id', { count: 'exact', head: true })
    .eq('confidence', 'Ready')
    .neq('status', 'SOLD');

  const { count: needsReview } = await supabase
    .from('copies')
    .select('id', { count: 'exact', head: true })
    .eq('confidence', 'Needs Review')
    .neq('status', 'SOLD');

  const { count: isbnNotFound } = await supabase
    .from('copies')
    .select('id', { count: 'exact', head: true })
    .eq('confidence', 'ISBN Not Found')
    .neq('status', 'SOLD');

  const { count: waitingQueue } = await supabase
    .from('copies')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'WAITING');

  const { count: published } = await supabase
    .from('copies')
    .select('id', { count: 'exact', head: true })
    .eq('shopify_status', 'published');

  return {
    todayScans: todayScans || 0,
    ready: ready || 0,
    needsReview: needsReview || 0,
    waitingQueue: waitingQueue || 0,
    isbnNotFound: isbnNotFound || 0,
    published: published || 0,
  };
}

export async function getScanHistory(filters: {
  query?: string;
  status?: string;
  limit?: number;
}): Promise<CopyRecord[]> {
  let query = supabase
    .from('copies')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters.limit || 50);

  if (filters.query) {
    query = query.or(
      `title.ilike.%${filters.query}%,author.ilike.%${filters.query}%,isbn.ilike.%${filters.query}%,location.ilike.%${filters.query}%`
    );
  }

  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'published') {
      query = query.eq('shopify_status', 'published');
    } else if (filters.status === 'unpublished') {
      query = query.eq('shopify_status', 'unpublished');
    } else {
      query = query.eq('status', filters.status);
    }
  }

  const { data, error } = await query;
  if (error) return [];
  return (data as CopyRecord[]) || [];
}

export async function updateCopy(
  id: string,
  updates: Partial<CopyRecord>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('copies').update(updates).eq('id', id);
  return { error: error?.message || null };
}
