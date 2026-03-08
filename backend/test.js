/**
 * test.js — Simple API test for the SPAN Blog backend
 * Run: node backend/test.js   (while server is running on port 3000)
 */

const BASE = 'http://localhost:3000/api';

let passed = 0;
let failed = 0;

async function test(label, fn) {
    try {
        await fn();
        console.log(`  ✅ PASS  ${label}`);
        passed++;
    } catch (err) {
        console.log(`  ❌ FAIL  ${label}`);
        console.log(`         ${err.message}`);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

(async () => {
    console.log('\n🧪 Running SPAN Blog API tests...\n');

    // Health
    await test('GET /api/health returns ok', async () => {
        const res = await fetch(`${BASE}/health`);
        const data = await res.json();
        assert(res.ok, `Expected 200, got ${res.status}`);
        assert(data.status === 'ok', `Expected status "ok", got "${data.status}"`);
    });

    // Posts list
    await test('GET /api/posts returns array of posts', async () => {
        const res = await fetch(`${BASE}/posts`);
        const data = await res.json();
        assert(res.ok, `Expected 200, got ${res.status}`);
        assert(Array.isArray(data.data), 'Expected data.data to be an array');
        assert(data.data.length > 0, 'Expected at least one post');
        assert(typeof data.total === 'number', 'Expected total to be a number');
    });

    // Single post
    await test('GET /api/posts/1 returns a post with id=1', async () => {
        const res = await fetch(`${BASE}/posts/1`);
        const post = await res.json();
        assert(res.ok, `Expected 200, got ${res.status}`);
        assert(post.id === 1, `Expected id 1, got ${post.id}`);
        assert(typeof post.title === 'string', 'Expected title to be a string');
    });

    // Non-existent post
    await test('GET /api/posts/9999 returns 404', async () => {
        const res = await fetch(`${BASE}/posts/9999`);
        assert(res.status === 404, `Expected 404, got ${res.status}`);
    });

    // Search
    await test('GET /api/posts?search=mental returns filtered results', async () => {
        const res = await fetch(`${BASE}/posts?search=mental`);
        const data = await res.json();
        assert(res.ok, `Expected 200, got ${res.status}`);
        assert(data.data.every(p =>
            p.title.toLowerCase().includes('mental') ||
            p.excerpt.toLowerCase().includes('mental')
        ), 'All results should match the search term');
    });

    // Category filter
    await test('GET /api/posts?category=Social Welfare returns only matching posts', async () => {
        const res = await fetch(`${BASE}/posts?category=${encodeURIComponent('Social Welfare')}`);
        const data = await res.json();
        assert(res.ok, `Expected 200, got ${res.status}`);
        assert(data.data.every(p => p.category === 'Social Welfare'), 'All posts should be in the requested category');
    });

    // Categories
    await test('GET /api/categories returns category list with counts', async () => {
        const res = await fetch(`${BASE}/categories`);
        const cats = await res.json();
        assert(res.ok, `Expected 200, got ${res.status}`);
        assert(Array.isArray(cats), 'Expected an array');
        assert(cats.length > 0, 'Expected at least one category');
        assert(cats.every(c => c.name && typeof c.count === 'number'), 'Each category should have name and count');
    });

    // Comments GET
    await test('GET /api/posts/1/comments returns comments array', async () => {
        const res = await fetch(`${BASE}/posts/1/comments`);
        const comments = await res.json();
        assert(res.ok, `Expected 200, got ${res.status}`);
        assert(Array.isArray(comments), 'Expected an array of comments');
    });

    // Comment POST
    await test('POST /api/posts/1/comments creates and returns a new comment', async () => {
        const res = await fetch(`${BASE}/posts/1/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', email: 'test@example.com', message: 'Great article!' })
        });
        const comment = await res.json();
        assert(res.status === 201, `Expected 201, got ${res.status}`);
        assert(comment.name === 'Test User', `Expected name "Test User", got "${comment.name}"`);
        assert(comment.post_id === 1, `Expected post_id 1, got ${comment.post_id}`);
    });

    // Comment POST validation
    await test('POST /api/posts/1/comments with missing fields returns 400', async () => {
        const res = await fetch(`${BASE}/posts/1/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'No Email' })
        });
        assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    // Like
    await test('POST /api/posts/1/like increments likes', async () => {
        const before = await (await fetch(`${BASE}/posts/1`)).json();
        await fetch(`${BASE}/posts/1/like`, { method: 'POST' });
        const after = await (await fetch(`${BASE}/posts/1`)).json();
        assert(after.likes === before.likes + 1, `Expected likes to increment from ${before.likes} to ${before.likes + 1}, got ${after.likes}`);
    });

    // Newsletter
    const testEmail = `test_${Date.now()}@example.com`;
    await test('POST /api/newsletter/subscribe saves an email', async () => {
        const res = await fetch(`${BASE}/newsletter/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail })
        });
        const data = await res.json();
        assert(res.ok, `Expected 200, got ${res.status}`);
        assert(data.message, 'Expected a success message');
    });

    // Newsletter duplicate
    await test('POST /api/newsletter/subscribe with duplicate email returns 409', async () => {
        const res = await fetch(`${BASE}/newsletter/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail })
        });
        assert(res.status === 409, `Expected 409, got ${res.status}`);
    });

    console.log(`\n─────────────────────────────────────`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    if (failed === 0) console.log('🎉 All tests passed!');
    console.log('─────────────────────────────────────\n');

    process.exit(failed > 0 ? 1 : 0);
})();
