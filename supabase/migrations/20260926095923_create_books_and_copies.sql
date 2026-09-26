/*
# Create books and copies tables for BookHero ISBN Scanner

1. New Tables
- `books`: Book identity (title + author). Used for duplicate grouping.
  - `id` (uuid, primary key)
  - `title` (text, not null) - display title
  - `normalized_title` (text, not null) - normalized for duplicate detection
  - `author` (text)
  - `created_at` (timestamptz)
- `copies`: Physical inventory copies. One book can have many copies (different ISBNs/editions).
  - `id` (uuid, primary key) - Copy ID
  - `book_id` (uuid, FK to books)
  - `isbn` (text) - the scanned ISBN for this edition
  - `title` (text) - denormalized for convenience
  - `author` (text) - denormalized
  - `format` (text) - Paperback, Hardcover, etc.
  - `dimensions` (text) - e.g. "129 x 198 x 22"
  - `pages` (integer) - page count
  - `synopsis` (text) - original synopsis used for AI input
  - `cover_url` (text) - selected cover image URL
  - `cover_candidates` (jsonb) - array of candidate cover URLs found
  - `description` (text) - AI-generated BookHero description
  - `tags` (text[]) - Shopify tags
  - `price` (numeric) - selling price in AED
  - `location` (text) - shelf location e.g. "1RA"
  - `sku` (text, unique) - generated SKU
  - `queue_position` (integer) - 0 = ONLINE, 1+ = WAITING position
  - `status` (text) - ONLINE, WAITING, SOLD, ON_HOLD, REMOVED, CANCELLED
  - `confidence` (text) - Ready, Needs Review, ISBN Not Found
  - `shopify_product_id` (text) - Shopify product ID after publish
  - `shopify_inventory_id` (text) - Shopify inventory item ID
  - `shopify_status` (text) - unpublished, published, error
  - `scan_date` (timestamptz)
  - `sold_date` (timestamptz)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on both tables.
- Single-tenant internal tool (no auth): allow anon + authenticated full CRUD.

3. Indexes
- `copies` on `book_id` for queue lookups
- `copies` on `isbn`
- `copies` on `status`
- `books` on `normalized_title`
- `copies` on `created_at` for history sorting
*/

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  normalized_title text NOT NULL,
  author text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS copies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  isbn text,
  title text,
  author text,
  format text,
  dimensions text,
  pages integer,
  synopsis text,
  cover_url text,
  cover_candidates jsonb,
  description text,
  tags text[] DEFAULT '{}',
  price numeric,
  location text,
  sku text UNIQUE,
  queue_position integer DEFAULT 0,
  status text NOT NULL DEFAULT 'ONLINE',
  confidence text DEFAULT 'Ready',
  shopify_product_id text,
  shopify_inventory_id text,
  shopify_status text DEFAULT 'unpublished',
  scan_date timestamptz DEFAULT now(),
  sold_date timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_copies_book_id ON copies(book_id);
CREATE INDEX IF NOT EXISTS idx_copies_isbn ON copies(isbn);
CREATE INDEX IF NOT EXISTS idx_copies_status ON copies(status);
CREATE INDEX IF NOT EXISTS idx_books_normalized_title ON books(normalized_title);
CREATE INDEX IF NOT EXISTS idx_copies_created_at ON copies(created_at DESC);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE copies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_books" ON books;
CREATE POLICY "anon_select_books" ON books FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_books" ON books;
CREATE POLICY "anon_insert_books" ON books FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_books" ON books;
CREATE POLICY "anon_update_books" ON books FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_books" ON books;
CREATE POLICY "anon_delete_books" ON books FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_copies" ON copies;
CREATE POLICY "anon_select_copies" ON copies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_copies" ON copies;
CREATE POLICY "anon_insert_copies" ON copies FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_copies" ON copies;
CREATE POLICY "anon_update_copies" ON copies FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_copies" ON copies;
CREATE POLICY "anon_delete_copies" ON copies FOR DELETE
  TO anon, authenticated USING (true);