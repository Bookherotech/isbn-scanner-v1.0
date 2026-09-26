import type { BookData, CoverCandidate } from './types';
import { toIsbn13, normalizeIsbn } from './isbn';

function parseGoogleVolume(item: any): Partial<BookData> {
  const vol = item.volumeInfo || {};

  const coverCandidates: CoverCandidate[] = [];
  if (vol.imageLinks) {
    const links = vol.imageLinks;
    const sizes = ['extraLarge', 'large', 'medium', 'thumbnail', 'small', 'smallThumbnail'];
    const seen = new Set<string>();
    for (const size of sizes) {
      if (links[size] && !seen.has(links[size])) {
        const url = links[size].replace('http://', 'https://');
        coverCandidates.push({ url, source: 'Google Books' });
        seen.add(links[size]);
      }
    }
  }

  const genres: string[] = [];
  if (vol.categories) {
    for (const cat of vol.categories) {
      genres.push(...String(cat).split(/[/,]/).map((c: string) => c.trim()));
    }
  }

  let pages: number | null = null;
  if (vol.pageCount && vol.pageCount > 0) pages = vol.pageCount;

  let format = '';
  if (vol.printType === 'BOOK') {
    format = 'Paperback';
  }

  let dimensions = '';
  if (vol.dimensions && typeof vol.dimensions === 'object') {
    const d = vol.dimensions;
    const parts: string[] = [];
    if (d.width) parts.push(String(d.width));
    if (d.height) parts.push(String(d.height));
    if (d.thickness) parts.push(String(d.thickness));
    dimensions = parts.join(' x ');
  }

  return {
    title: vol.title || '',
    author: vol.authors ? vol.authors.join(', ') : '',
    format,
    dimensions,
    pages,
    synopsis: vol.description || '',
    coverCandidates,
    genres: [...new Set(genres)],
  };
}

async function fetchGoogleBooks(isbn: string): Promise<Partial<BookData> | null> {
  try {
    const clean = normalizeIsbn(isbn);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${clean}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.totalItems === 0 || !data.items?.length) return null;
    return parseGoogleVolume(data.items[0]);
  } catch (err) {
    console.error('Google Books fetch error:', err);
    return null;
  }
}

function parseOpenLibraryBook(book: any): Partial<BookData> {
  const coverCandidates: CoverCandidate[] = [];
  if (book.cover?.large) {
    coverCandidates.push({ url: book.cover.large, source: 'Open Library' });
  }
  if (book.cover?.medium) {
    coverCandidates.push({ url: book.cover.medium, source: 'Open Library' });
  }
  if (book.covers?.length) {
    for (const coverId of book.covers.slice(0, 3)) {
      coverCandidates.push({
        url: `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`,
        source: 'Open Library',
      });
    }
  }

  let pages: number | null = null;
  if (book.number_of_pages) pages = book.number_of_pages;

  let dimensions = '';
  if (typeof book.physical_dimensions === 'string') {
    dimensions = book.physical_dimensions.replace(/inches|cm|centimeters/gi, '').trim();
  } else if (typeof book.dimensions === 'string') {
    dimensions = book.dimensions.replace(/inches|cm|centimeters/gi, '').trim();
  } else if (book.physical_dimensions && typeof book.physical_dimensions === 'object') {
    const d = book.physical_dimensions;
    const parts: string[] = [];
    if (d.width) parts.push(String(d.width));
    if (d.height) parts.push(String(d.height));
    if (d.depth) parts.push(String(d.depth));
    dimensions = parts.join(' x ');
  }

  const genres: string[] = [];
  if (book.subjects) {
    for (const subj of book.subjects) {
      if (typeof subj === 'string') {
        genres.push(subj);
      } else if (subj && subj.name) {
        genres.push(subj.name);
      }
    }
  }

  let format = '';
  if (book.physical_format) {
    format = String(book.physical_format)
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  let synopsis = '';
  if (typeof book.description === 'string') {
    synopsis = book.description;
  } else if (book.description && book.description.value) {
    synopsis = book.description.value;
  }

  let author = '';
  if (book.authors) {
    author = book.authors
      .map((a: any) => (typeof a === 'string' ? a : a.name || ''))
      .filter(Boolean)
      .join(', ');
  } else if (book.by_statement) {
    author = book.by_statement;
  }

  return {
    title: book.title || '',
    author,
    format,
    dimensions,
    pages,
    synopsis,
    coverCandidates,
    genres,
  };
}

async function fetchOpenLibrary(isbn: string): Promise<Partial<BookData> | null> {
  try {
    const clean = normalizeIsbn(isbn);
    const isbn13 = toIsbn13(clean);
    const bibkeys = isbn13 !== clean ? `ISBN:${isbn13},ISBN:${clean}` : `ISBN:${isbn13}`;
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=${bibkeys}&format=json&jscmd=data`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const key13 = `ISBN:${isbn13}`;
    const key10 = `ISBN:${clean}`;
    const book = data[key13] || data[key10];
    if (!book) return null;
    return parseOpenLibraryBook(book);
  } catch (err) {
    console.error('Open Library fetch error:', err);
    return null;
  }
}

async function fetchOpenLibrarySearch(isbn: string): Promise<Partial<BookData> | null> {
  try {
    const clean = normalizeIsbn(isbn);
    const res = await fetch(
      `https://openlibrary.org/search.json?isbn=${clean}&fields=title,author_name,subject,physical_format,number_of_pages_median,cover_edition_key&limit=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.docs || data.docs.length === 0) return null;
    const doc = data.docs[0];

    const coverCandidates: CoverCandidate[] = [];
    if (doc.cover_edition_key) {
      coverCandidates.push({
        url: `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-L.jpg`,
        source: 'Open Library',
      });
    }

    const genres: string[] = [];
    if (doc.subject) {
      for (const subj of doc.subject) {
        genres.push(...String(subj).split(/[/,]/).map((s: string) => s.trim()));
      }
    }

    let format = '';
    if (doc.physical_format) {
      format = String(doc.physical_format)
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }

    return {
      title: doc.title || '',
      author: doc.author_name ? doc.author_name.join(', ') : '',
      format,
      pages: doc.number_of_pages_median || null,
      coverCandidates,
      genres: [...new Set(genres)],
      synopsis: '',
      dimensions: '',
    };
  } catch (err) {
    console.error('Open Library search error:', err);
    return null;
  }
}

function mergeBookData(
  isbn: string,
  sources: (Partial<BookData> | null)[]
): BookData {
  const valid = sources.filter((s): s is Partial<BookData> => s !== null);

  const get = (key: keyof BookData): any => {
    for (const s of valid) {
      const val = s[key as keyof typeof s];
      if (val && (typeof val !== 'string' || val.length > 0) && (!Array.isArray(val) || val.length > 0)) {
        return val;
      }
    }
    return undefined;
  };

  const merged: BookData = {
    title: get('title') || '',
    author: get('author') || '',
    isbn,
    format: get('format') || '',
    dimensions: get('dimensions') || '',
    pages: get('pages') ?? null,
    synopsis: get('synopsis') || '',
    coverCandidates: [],
    coverUrl: '',
    genres: [...new Set(valid.flatMap((s) => s.genres || []))],
  };

  const seen = new Set<string>();
  for (const s of valid) {
    for (const c of s.coverCandidates || []) {
      if (!seen.has(c.url)) {
        merged.coverCandidates.push(c);
        seen.add(c.url);
      }
    }
  }
  merged.coverUrl = merged.coverCandidates[0]?.url || '';

  return merged;
}

export async function fetchBookData(isbn: string): Promise<BookData> {
  const [google, openLib, openLibSearch] = await Promise.all([
    fetchGoogleBooks(isbn),
    fetchOpenLibrary(isbn),
    fetchOpenLibrarySearch(isbn),
  ]);

  return mergeBookData(isbn, [google, openLib, openLibSearch]);
}

export function hasBookData(data: BookData): boolean {
  return !!(data.title || data.author);
}
