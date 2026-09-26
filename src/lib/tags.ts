import type { BookData } from './types';

function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateTags(data: {
  title: string;
  author: string;
  genres: string[];
}): string[] {
  const tags = new Set<string>();
  tags.add('used books dubai');

  for (const genre of data.genres) {
    const normalized = normalizeTag(genre);
    if (normalized) tags.add(normalized);

    const subGenres = genre.split(/[/,]/).map((g) => normalizeTag(g));
    for (const sg of subGenres) {
      if (sg) tags.add(sg);
    }
  }

  return Array.from(tags);
}
