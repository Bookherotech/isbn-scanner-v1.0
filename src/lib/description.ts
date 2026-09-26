function shuffleSentences(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.map((s) => s.trim());
}

function generateTemplateDescription(data: {
  title: string;
  author: string;
  synopsis: string;
  genres: string[];
}): string {
  const { title, author, synopsis, genres } = data;
  const parts: string[] = [];

  if (synopsis && synopsis.length > 20) {
    const sentences = shuffleSentences(synopsis);
    const firstSentence = sentences[0] || '';

    parts.push(firstSentence);

    if (sentences.length > 1) {
      const secondSentence = sentences[1];
      parts.push(secondSentence);
    }

    if (sentences.length > 2) {
      const thirdSentence = sentences[2];
      parts.push(thirdSentence);
    }
  } else {
    if (genres.length > 0) {
      parts.push(
        `${title} is a ${genres[0].toLowerCase()} work${author ? ` by ${author}` : ''} that draws readers into its world with carefully drawn characters and a story that stays with you long after the final page.`
      );
    } else {
      parts.push(
        `${title}${author ? ` by ${author}` : ''} is a book that captures the reader's attention with its engaging narrative and memorable characters.`
      );
    }
  }

  if (author && parts.length < 3) {
    parts.push(
      `Through ${author}'s storytelling, the book explores themes that resonate with readers looking for a thoughtfully written story.`
    );
  }

  if (genres.length > 1 && parts.length < 4) {
    parts.push(
      `Blending elements of ${genres.slice(0, 2).map((g) => g.toLowerCase()).join(' and ')}, it offers a reading experience that feels both familiar and fresh.`
    );
  }

  let desc = parts.join(' ');
  if (desc.length > 600) {
    desc = desc.substring(0, 597).replace(/\s+\S*$/, '') + '...';
  }

  return desc;
}

export function generateDescription(data: {
  title: string;
  author: string;
  synopsis: string;
  genres: string[];
}): string {
  return generateTemplateDescription(data);
}

export function formatBookHeroDescriptionFromFields(
  desc: string,
  fields: {
    dimensions: string;
    author: string;
    isbn: string;
    format: string;
    pages: number | null;
  }
): string {
  const lines: string[] = [desc, ''];
  lines.push(`Dimensions: ${fields.dimensions || ''}`);
  lines.push(`Author: ${fields.author || ''}`);
  lines.push(`ISBN: ${fields.isbn || ''}`);
  lines.push(`Format: ${fields.format || ''}`);
  lines.push(`Pages: ${fields.pages ?? ''}`);
  return lines.join('\n');
}
