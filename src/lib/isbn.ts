export function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, '');
}

export function isValidIsbn10(isbn: string): boolean {
  const s = normalizeIsbn(isbn);
  if (s.length !== 10) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const d = parseInt(s[i], 10);
    if (isNaN(d)) return false;
    sum += d * (10 - i);
  }
  const last = s[9].toUpperCase();
  const check = last === 'X' ? 10 : parseInt(last, 10);
  if (isNaN(check)) return false;
  sum += check;
  return sum % 11 === 0;
}

export function isValidIsbn13(isbn: string): boolean {
  const s = normalizeIsbn(isbn);
  if (s.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const d = parseInt(s[i], 10);
    if (isNaN(d)) return false;
    sum += d * (i % 2 === 0 ? 1 : 3);
  }
  return sum % 10 === 0;
}

export function isValidIsbn(isbn: string): boolean {
  const s = normalizeIsbn(isbn);
  return isValidIsbn10(s) || isValidIsbn13(s);
}

export function isbn10To13(isbn10: string): string {
  const s = normalizeIsbn(isbn10);
  if (s.length !== 10) return s;
  const base = '978' + s.substring(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return base + check;
}

export function toIsbn13(isbn: string): string {
  const s = normalizeIsbn(isbn);
  if (s.length === 13) return s;
  if (s.length === 10) return isbn10To13(s);
  return s;
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
