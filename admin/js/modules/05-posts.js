async function loadPosts(search = '') {
    const tbody = document.getElementById('postsTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>';
    try {
        const qs = search ? `?search=${encodeURIComponent(search)}&limit=50` : '?limit=50';
        const res = await fetch(`${API}/posts${qs}`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } });
        const data = await res.json();
        window.allPosts = data.data || [];
        renderPostsTable(window.allPosts);
        document.getElementById('statTotal').textContent = window.allPosts.length;
        document.getElementById('statLikes').textContent = window.allPosts.reduce((s, p) => s + p.likes, 0).toLocaleString();
        document.getElementById('statComments').textContent = window.allPosts.reduce((s, p) => s + p.comments_count, 0).toLocaleString();
    } catch { tbody.innerHTML = '<tr><td colspan="7" class="loading-row" style="color:#fca5a5;">Failed to load posts</td></tr>'; }
}

function renderPostsTable(posts) {
    const tbody = document.getElementById('postsTableBody');
    if (!posts.length) return tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No posts found.</td></tr>';
    tbody.innerHTML = posts.map(p => `
        <tr>
            <td><img class="post-thumb" src="${p.image}" alt="" onerror="this.src='https://placehold.co/54x40/1e2330/7a8494?text=img'"></td>
            <td class="post-title-cell"><a href="/blog-single.html?id=${p.id}" target="_blank">${p.title}</a><div class="post-excerpt">${p.excerpt}</div></td>
            <td><span class="category-badge">${p.category}</span></td>
            <td>${new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td style="color:var(--accent);font-weight:600">${p.likes}</td>
            <td>${p.comments_count}</td>
            <td class="actions-cell">
                <button class="btn btn-sm btn-edit btn-icon" onclick="editPost(${p.id})"><i class="fas fa-pen"></i></button>
                <button class="btn btn-sm btn-delete btn-icon" onclick="openDeleteModal(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
}

function resetPostForm() {
    document.getElementById('editPostId').value = '';
    document.getElementById('postForm').reset();
    document.getElementById('fDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('fIsHtml').checked = false;
    document.getElementById('formTitle').textContent = 'Create New Post';
    setImagePreview('');
}

async function editPost(id) {
    const post = await fetch(`${API}/posts/${id}`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } }).then(r => r.json());
    document.getElementById('editPostId').value = post.id;
    document.getElementById('fTitle').value = post.title;
    document.getElementById('fExcerpt').value = post.excerpt;
    document.getElementById('fAuthor').value = post.author;
    document.getElementById('fDate').value = post.date;
    document.getElementById('fCategory').value = post.category;
    document.getElementById('fImage').value = post.image;
    document.getElementById('fContent').value = post.content;
    document.getElementById('fIsHtml').checked = !!post.is_html;
    document.getElementById('formTitle').textContent = 'Edit Post';
    setImagePreview(post.image);
    showSection('new-post');
}

function openDeleteModal(id) { window.pendingDeleteId = id; document.getElementById('deleteModal').classList.add('open'); }
function closeDeleteModal() { window.pendingDeleteId = null; document.getElementById('deleteModal').classList.remove('open'); }

async function deletePost() {
    if (!window.pendingDeleteId) return;
    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true;
    btn.textContent = 'Deleting…';
    window.lastDeletedPost = window.allPosts.find(p => p.id == window.pendingDeleteId);
    try {
        const res = await fetch(`${API}/posts/${window.pendingDeleteId}`, { method: 'DELETE', headers: authHeaders() });
        const data = await res.json();
        if (res.ok) {
            showUndoToast(window.lastDeletedPost);
            closeDeleteModal(); loadPosts();
        } else showToast(data.error || 'Delete failed', 'error');
    } catch { showToast('Connection error', 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Delete'; }
}

window.undoPost = async () => {
    if (!window.lastDeletedPost) return;
    document.getElementById('toast').classList.remove('show');
    try {
        const res = await fetch(`${API}/posts`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ title: window.lastDeletedPost.title, excerpt: window.lastDeletedPost.excerpt, content: window.lastDeletedPost.content, author: window.lastDeletedPost.author, date: window.lastDeletedPost.date, category: window.lastDeletedPost.category, image: window.lastDeletedPost.image, is_html: window.lastDeletedPost.is_html }) });
        if (res.ok) { showToast('Post restored!'); window.lastDeletedPost = null; loadPosts(); }
        else showToast('Restore failed', 'error');
    } catch { showToast('Connection error', 'error'); }
};

let searchTimer;
function initPosts() {
    document.getElementById('searchInput').addEventListener('input', e => { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadPosts(e.target.value.trim()), 300); });
    document.getElementById('postForm').addEventListener('submit', submitPostForm);
    document.getElementById('fImage').addEventListener('input', e => setImagePreview(e.target.value.trim()));
    document.getElementById('confirmDeleteBtn').addEventListener('click', deletePost);
    document.getElementById('deleteModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeDeleteModal(); });
    document.getElementById('fDate').value = new Date().toISOString().split('T')[0];
    loadPosts();
}