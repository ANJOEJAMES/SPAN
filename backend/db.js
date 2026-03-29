const { createClient } = require('@libsql/client');

// ── Turso / libsql client ─────────────────────────────────────────────────────
// For local development without Turso, set TURSO_DB_URL to a file: URL, e.g.:
//   TURSO_DB_URL=file:./blog.db   (no auth token needed for local file)
const client = createClient({
  url: process.env.TURSO_DB_URL || 'file:./blog.db',
  authToken: process.env.TURSO_AUTH_TOKEN,   // undefined is fine for local file URL
});

// ── Compatibility helpers  (same API that all routes already use) ──────────────

/**
 * run(sql, params)  →  { lastInsertRowid, rowsAffected }
 * Normalised to match the old sqlite3 shape ({ lastID, changes }).
 */
const run = async (sql, params = []) => {
  const result = await client.execute({ sql, args: params });
  return {
    lastID: Number(result.lastInsertRowid ?? 0),
    changes: result.rowsAffected ?? 0,
  };
};

/**
 * get(sql, params)  →  first row as plain object, or undefined
 */
const get = async (sql, params = []) => {
  const result = await client.execute({ sql, args: params });
  return result.rows[0] ?? undefined;
};

/**
 * all(sql, params)  →  array of plain objects
 */
const all = async (sql, params = []) => {
  const result = await client.execute({ sql, args: params });
  return result.rows;
};

// ── Schema initialisation (runs once at startup) ──────────────────────────────
async function initDB() {
  // WAL pragma – Turso manages this internally; skip for remote connections
  // db.run('PRAGMA journal_mode = WAL');

  await client.execute(`
        CREATE TABLE IF NOT EXISTS posts (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            title          TEXT    NOT NULL,
            image          TEXT    NOT NULL,
            excerpt        TEXT    NOT NULL,
            content        TEXT    NOT NULL,
            author         TEXT    NOT NULL DEFAULT 'SPAN Team',
            date           TEXT    NOT NULL,
            category       TEXT    NOT NULL DEFAULT 'General',
            likes          INTEGER NOT NULL DEFAULT 0,
            comments_count INTEGER NOT NULL DEFAULT 0,
            is_html        INTEGER NOT NULL DEFAULT 0
        )
    `);

  // Migration: add is_html column if missing (safe on Turso – will error if
  // column already exists, so we swallow the error)
  try {
    await client.execute('ALTER TABLE posts ADD COLUMN is_html INTEGER NOT NULL DEFAULT 0');
    await client.execute('UPDATE posts SET is_html = 1');
  } catch (_) { /* column already exists – that's fine */ }

  await client.execute(`
        CREATE TABLE IF NOT EXISTS comments (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id    INTEGER NOT NULL,
            name       TEXT    NOT NULL,
            email      TEXT    NOT NULL,
            message    TEXT    NOT NULL,
            created_at TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    `);

  await client.execute(`
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            email      TEXT    NOT NULL UNIQUE,
            created_at TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    `);

  await client.execute(`
        CREATE TABLE IF NOT EXISTS events (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title      TEXT    NOT NULL,
            date       TEXT    NOT NULL,
            time_from  TEXT    NOT NULL DEFAULT '',
            time_to    TEXT    NOT NULL DEFAULT '',
            location   TEXT    NOT NULL DEFAULT '',
            image      TEXT    NOT NULL DEFAULT '',
            theme      TEXT    NOT NULL DEFAULT 'default'
        )
    `);

  await client.execute(`
        CREATE TABLE IF NOT EXISTS gallery_photos (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            image      TEXT    NOT NULL,
            public_id  TEXT    NOT NULL DEFAULT '',
            title      TEXT    NOT NULL DEFAULT '',
            tag        TEXT    NOT NULL DEFAULT 'medical',
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    `);

  await client.execute(`
        CREATE TABLE IF NOT EXISTS blog_categories (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT    NOT NULL UNIQUE,
            created_at TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    `);

  await client.execute(`
        CREATE TABLE IF NOT EXISTS gallery_categories (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT    NOT NULL,
            slug       TEXT    NOT NULL UNIQUE,
            created_at TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    `);

  // ── Seed blog categories if empty ─────────────────────────────────────────
  const bCatCount = await get('SELECT COUNT(*) as count FROM blog_categories');
  if ((bCatCount?.count ?? 0) == 0) {
    const initBCats = ['Health & Medical', 'Social Welfare', 'International Aid', 'Disability', 'Poor Education', 'Animals & Pets', 'General'];
    for (const cat of initBCats) {
      await run('INSERT INTO blog_categories (name) VALUES (?)', [cat]);
    }
  }

  // ── Seed gallery categories if empty ──────────────────────────────────────
  const gCatCount = await get('SELECT COUNT(*) as count FROM gallery_categories');
  if ((gCatCount?.count ?? 0) == 0) {
    const initGCats = [
      { name: 'Voices of Hope', slug: 'medical' },
      { name: 'Safe Spaces', slug: 'education' },
      { name: 'Cultural Resilience', slug: 'animal' },
      { name: 'Educational Hub', slug: 'shelter' }
    ];
    for (const cat of initGCats) {
      await run('INSERT INTO gallery_categories (name, slug) VALUES (?, ?)', [cat.name, cat.slug]);
    }
  }

  // ── Seed posts if empty ───────────────────────────────────────────────────
  const postCount = await get('SELECT COUNT(*) as count FROM posts');
  if ((postCount?.count ?? 0) == 0) {
    const POSTS = [
      {
        title: 'Millions Collected By SPAN Charity For Mental Health Awareness',
        image: 'images/resource/blog-image-4.jpg',
        excerpt: 'SPAN has reached a major milestone in suicide prevention funding, collecting millions to support at-risk individuals and mental health research programs across the country.',
        content: `<p>SPAN (Suicide Prevention  Awareness Network- Research & Training) has achieved a historic fundraising milestone, collecting millions of dollars dedicated to mental health awareness and suicide prevention programs across the nation.</p><p>The funds, raised through a combination of community events, online campaigns, and generous individual donors, will be directed toward crisis intervention programs, research initiatives, and public education campaigns designed to reduce stigma around mental health.</p><p>People like you are helping make good things happen. Every dollar donated goes directly to programs that save lives and support families affected by the mental health crisis.</p><p>Our dedicated team of researchers, counselors, and advocates work tirelessly to ensure that every resource reaches those who need it most. This milestone is a testament to the community's commitment to creating a world where suicide prevention is a shared responsibility.</p>`,
        author: 'Mark Shawn', date: '2024-08-20', category: 'Health & Medical', likes: 1600, comments_count: 845
      },
      {
        title: 'Awareness Grows By 50%: More Support Goes To Mental Health Causes',
        image: 'images/resource/blog-image-5.jpg',
        excerpt: 'Public awareness around suicide prevention has surged by 50% this year, fueled by SPAN campaigns and community outreach programs reaching millions of households.',
        content: `<p>New data released by SPAN shows a remarkable 50% increase in public awareness around suicide prevention and mental health. This surge in awareness is directly tied to the organization's expanded outreach campaigns, school programs, and social media initiatives.</p><p>The awareness increase has translated into a proportional rise in community involvement—more volunteers, more donations, and most importantly, more individuals reaching out for help before reaching a crisis point.</p><p>SPAN's director noted: "When people understand the signs and know what resources are available, they become part of the solution. This data tells us our message is getting through."</p><p>The organization plans to maintain this momentum by launching a new digital campaign targeting young adults, a demographic particularly vulnerable to mental health challenges.</p>`,
        author: 'Sarah Johnson', date: '2024-08-15', category: 'Social Welfare', likes: 980, comments_count: 412
      },
      {
        title: 'Cancer Survivors Launch T-Shirt Campaign to Support Mental Health Charity',
        image: 'images/resource/blog-image-6.jpg',
        excerpt: 'A group of cancer survivors have united to raise funds for SPAN by selling limited-edition awareness t-shirts, blending two vital health causes into one powerful movement.',
        content: `<p>In a heartwarming show of solidarity, a group of cancer survivors have launched a limited-edition t-shirt campaign to raise funds for SPAN's mental health programs. The initiative, called "Strength in Every Thread," recognizes the profound overlap between physical illness and mental health struggles.</p><p>"Going through cancer treatment, I saw firsthand how mental health care was often overlooked," said campaign organizer Linda Torres. "I wanted to do something that bridges both worlds and shows people that healing is holistic."</p><p>The campaign raised over $25,000 in its first week, with t-shirts featuring original artwork designed by cancer survivors and mental health advocates. All proceeds go directly to SPAN's crisis support helpline.</p>`,
        author: 'Linda Torres', date: '2024-08-10', category: 'International Aid', likes: 754, comments_count: 203
      },
      {
        title: "Why Community Walks Are Changing The Way We Talk About Mental Health",
        image: 'images/resource/blog-image-7.jpg',
        excerpt: "SPAN's annual awareness walks have become more than fundraisers — they are reshaping conversations around mental health across communities, one step at a time.",
        content: `<p>SPAN's annual community awareness walks have evolved far beyond traditional fundraising events. This year, over 15,000 participants joined walks in 42 cities, turning each event into a powerful, public statement about mental health destigmatization.</p><p>Participants walked alongside mental health professionals, survivors, and first responders—creating a visible, unified front against the silence that often surrounds suicide and mental health struggles.</p><p>"There is something profoundly cathartic about walking with thousands of people who understand," said volunteer coordinator James Patel. "The conversations that happen on these walks change minds and save lives."</p><p>Surveys conducted after the events showed that 87% of participants felt more comfortable discussing mental health with friends and family after attending. SPAN plans to expand the program to 60 cities next year.</p>`,
        author: 'James Patel', date: '2024-08-05', category: 'Social Welfare', likes: 521, comments_count: 167
      }
    ];

    for (const p of POSTS) {
      const { lastID } = await run(
        `INSERT INTO posts (title, image, excerpt, content, author, date, category, likes, comments_count, is_html)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [p.title, p.image, p.excerpt, p.content, p.author, p.date, p.category, p.likes, p.comments_count]
      );
      // Seed two comments on the first post
      if (lastID === 1) {
        await run(`INSERT INTO comments (post_id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)`,
          [1, 'Scott William', 'scott@example.com', 'This is truly inspiring work. SPAN has made such a difference in our community.', '2024-08-31T10:00:00']);
        await run(`INSERT INTO comments (post_id, name, email, message, created_at) VALUES (?, ?, ?, ?, ?)`,
          [1, 'Liam Irvines', 'liam@example.com', 'Thank you for the detailed coverage. Mental health awareness is so important.', '2024-08-30T15:30:00']);
      }
    }

    console.log('✅ Database seeded with sample posts and comments.');
  }

  console.log('✅ Database initialised and connected to Turso.');
}

// Export client for edge cases, plus the three helpers every route uses
module.exports = { db: client, run, get, all, initDB };
