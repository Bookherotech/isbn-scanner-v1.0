import { toIsbn13 } from './isbn';

export function generateSku(location: string, isbn: string, suffix?: string): string {
  const loc = (location || '').trim();
  const isbn13 = toIsbn13(isbn);
  const base = `${loc}${isbn13}`;
  return suffix ? `${base}-${suffix}` : base;
}

export function generateUniqueSku(location: string, isbn: string, existingSkus: string[]): string {
  const base = generateSku(location, isbn);
  if (!existingSkus.includes(base)) return base;
  let counter = 2;
  while (existingSkus.includes(`${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}
