/**
 * admin.js — SPAN Admin Panel Logic
 * Handles: auth guard, post listing, create/edit/delete, Cloudinary image upload
 */

const API = 'http://localhost:3000/api';

// ── Auth guard & 24-hour auto-logout ─────────────────────────────────────────
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function checkSessionExpiry() {
    const loginTime = parseInt(localStorage.getItem('span_admin_login_time') || '0', 10);
    const token = localStorage.getItem('span_admin_token');
    if (!token || !loginTime || (Date.now() - loginTime) >= SESSION_DURATION_MS) {
        localStorage.removeItem('span_admin_token');
        localStorage.removeItem('span_admin_email');
        localStorage.removeItem('span_admin_login_time');
        window.location.href = 'login.html';
    }
}

// Check immediately on page load
checkSessionExpiry();

// Re-check every 60 seconds (catches tabs left open past the deadline)
setInterval(checkSessionExpiry, 60 * 1000);

const token = localStorage.getItem('span_admin_token');
// Display admin email
document.getElementById('adminEmail').textContent =
    localStorage.getItem('span_admin_email') || 'Admin';

function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type} show`;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ── Sidebar accordion groups ───────────────────────────────────────────
const GROUP_MAP = {
    posts: 'grp-blog', 'new-post': 'grp-blog', 'categories': 'grp-blog',
    gallery: 'grp-gallery', 'upload-photo': 'grp-gallery'
};

function toggleGroup(id) {
    const grp = document.getElementById(id);
    grp.classList.toggle('open');
}

function openGroup(id) {
    const grp = document.getElementById(id);
    if (grp) grp.classList.add('open');
}

// Auto-open Blog group on first load
openGroup('grp-blog');

// ── Section navigation ────────────────────────────────────────────────────────
function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${name}`).classList.add('active');
    document.querySelectorAll('.nav-item[data-section]').forEach(a => {
        a.classList.toggle('active', a.dataset.section === name);
    });
    const titles = { posts: 'Blog Posts', 'new-post': 'New Post', categories: 'Categories Management', gallery: 'Gallery', 'upload-photo': 'Upload Photo' };
    document.getElementById('pageTitle').textContent = titles[name] || 'Admin';

    // Expand the group that owns this section
    const groupId = GROUP_MAP[name];
    if (groupId) openGroup(groupId);

    if (name === 'posts') loadPosts();
    if (name === 'new-post' && !document.getElementById('editPostId').value) resetForm();
    if (name === 'gallery') loadGallery();

    // Always refresh categories when opening forms or category management
    if (['new-post', 'upload-photo', 'categories', 'gallery'].includes(name)) {
        loadCategories();
    }
}

document.querySelectorAll('.nav-item[data-section]').forEach(a => {
    a.addEventListener('click', (e) => { e.preventDefault(); showSection(a.dataset.section); });
});

// ── Logout ────────────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('span_admin_token');
    localStorage.removeItem('span_admin_email');
    localStorage.removeItem('span_admin_login_time');
    window.location.href = 'login.html';
});

// ── Sidebar toggle (mobile) ───────────────────────────────────────────────────
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
});

// ── Load Posts ────────────────────────────────────────────────────────────────
let allPosts = [];

async function loadPosts(search = '') {
    const tbody = document.getElementById('postsTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading-row"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>';

    try {
        const qs = search ? `?search=${encodeURIComponent(search)}&limit=50` : '?limit=50';
        const res = await fetch(`${API}/posts${qs}`);
        const data = await res.json();
        allPosts = data.data || [];
        renderPostsTable(allPosts);
        updateStats(allPosts);
    } catch {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-row" style="color:#fca5a5;">Failed to load posts. Is the server running?</td></tr>';
    }
}

function updateStats(posts) {
    document.getElementById('statTotal').textContent = posts.length;
    document.getElementById('statLikes').textContent = posts.reduce((s, p) => s + p.likes, 0).toLocaleString();
    document.getElementById('statComments').textContent = posts.reduce((s, p) => s + p.comments_count, 0).toLocaleString();
}

function renderPostsTable(posts) {
    const tbody = document.getElementById('postsTableBody');
    if (!posts.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-row">No posts found.</td></tr>';
        return;
    }
    tbody.innerHTML = posts.map(p => {
        const d = new Date(p.date);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `
      <tr>
        <td><img class="post-thumb" src="${p.image}" alt="" onerror="this.src='https://placehold.co/54x40/1e2330/7a8494?text=img'"></td>
        <td class="post-title-cell">
          <a href="../blog-single.html?id=${p.id}" target="_blank">${p.title}</a>
          <div class="post-excerpt">${p.excerpt}</div>
        </td>
        <td><span class="category-badge">${p.category}</span></td>
        <td style="white-space:nowrap;font-size:13px;color:var(--text-muted)">${dateStr}</td>
        <td style="color:var(--accent);font-weight:600">${p.likes.toLocaleString()}</td>
        <td style="color:var(--text-muted)">${p.comments_count}</td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-edit btn-icon" onclick="editPost(${p.id})" title="Edit">
            <i class="fas fa-pen"></i>
          </button>
          <button class="btn btn-sm btn-delete btn-icon" onclick="openDeleteModal(${p.id})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    }).join('');
}

// ── Search ────────────────────────────────────────────────────────────────────
let searchTimer;
document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadPosts(e.target.value.trim()), 300);
});

// ── Create / Edit Post Form ───────────────────────────────────────────────────
function resetForm() {
    document.getElementById('editPostId').value = '';
    document.getElementById('postForm').reset();
    document.getElementById('fDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('fIsHtml').checked = false;
    document.getElementById('formTitle').textContent = 'Create New Post';
    setImagePreview('');
}

async function editPost(id) {
    try {
        const res = await fetch(`${API}/posts/${id}`);
        const post = await res.json();
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
    } catch {
        showToast('Failed to load post data', 'error');
    }
}

function setImagePreview(url) {
    const uploadBox = document.getElementById('imageUploadBox');
    const preview = document.getElementById('imagePreview');
    const prompt = document.getElementById('uploadPrompt');

    // Remove any existing iframe
    const existingIframe = document.getElementById('youtubePreview');
    if (existingIframe) existingIframe.remove();

    const ytMatch = url ? url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i) : null;

    if (ytMatch && ytMatch[1]) {
        preview.classList.remove('visible');
        prompt.style.display = 'none';
        const iframe = document.createElement('iframe');
        iframe.id = 'youtubePreview';
        iframe.src = `https://www.youtube.com/embed/${ytMatch[1]}`;
        iframe.style.cssText = 'width:100%; height:130px; object-fit:cover; border:none; border-radius:8px;';
        uploadBox.appendChild(iframe);
    } else if (url) {
        preview.src = url;
        preview.classList.add('visible');
        prompt.style.display = 'none';
    } else {
        preview.classList.remove('visible');
        prompt.style.display = 'flex';
    }
}

document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';

    const id = document.getElementById('editPostId').value;
    const body = {
        title: document.getElementById('fTitle').value.trim(),
        excerpt: document.getElementById('fExcerpt').value.trim(),
        content: document.getElementById('fContent').value.trim(),
        author: document.getElementById('fAuthor').value.trim() || 'SPAN Team',
        date: document.getElementById('fDate').value,
        category: document.getElementById('fCategory').value,
        image: document.getElementById('fImage').value.trim(),
        is_html: document.getElementById('fIsHtml').checked
    };

    if (!body.image) {
        showToast('Please upload or paste an image URL', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save Post';
        return;
    }

    try {
        const url = id ? `${API}/posts/${id}` : `${API}/posts`;
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || 'Save failed', 'error');
        } else {
            showToast(id ? 'Post updated successfully!' : 'Post created successfully!');
            resetForm();
            showSection('posts');
        }
    } catch {
        showToast('Error connecting to server', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save Post';
    }
});

// Sync URL input → image preview
document.getElementById('fImage').addEventListener('input', (e) => {
    setImagePreview(e.target.value.trim());
});

// ── Cloudinary Image Upload ───────────────────────────────────────────────────
const imageBox = document.getElementById('imageUploadBox');
const imageFile = document.getElementById('imageFile');
const progress = document.getElementById('uploadProgress');

imageBox.addEventListener('click', () => imageFile.click());
imageFile.addEventListener('change', () => {
    if (imageFile.files[0]) uploadImage(imageFile.files[0]);
});

// Drag & drop
imageBox.addEventListener('dragover', (e) => { e.preventDefault(); imageBox.classList.add('drag-over'); });
imageBox.addEventListener('dragleave', () => imageBox.classList.remove('drag-over'));
imageBox.addEventListener('drop', (e) => {
    e.preventDefault();
    imageBox.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) uploadImage(file);
});

async function uploadImage(file) {
    progress.style.display = 'flex';
    imageBox.style.pointerEvents = 'none';

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'span-blog');

    try {
        const res = await fetch(`${API}/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || 'Upload failed', 'error');
        } else {
            document.getElementById('fImage').value = data.url;
            setImagePreview(data.url);
            showToast('Image uploaded to Cloudinary ✓');
        }
    } catch {
        showToast('Upload failed — check server connection', 'error');
    } finally {
        progress.style.display = 'none';
        imageBox.style.pointerEvents = '';
    }
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
let pendingDeleteId = null;

function openDeleteModal(id) {
    pendingDeleteId = id;
    document.getElementById('deleteModal').classList.add('open');
}
function closeDeleteModal() {
    pendingDeleteId = null;
    document.getElementById('deleteModal').classList.remove('open');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true;
    btn.textContent = 'Deleting…';

    try {
        const res = await fetch(`${API}/posts/${pendingDeleteId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Post deleted successfully');
            closeDeleteModal();
            loadPosts();
        } else {
            showToast(data.error || 'Delete failed', 'error');
        }
    } catch {
        showToast('Error connecting to server', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Delete';
    }
});

// Close modal on backdrop click
document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDeleteModal();
});

// ── Init ──────────────────────────────────────────────────────────────────────
document.getElementById('fDate').value = new Date().toISOString().split('T')[0];
loadPosts();

// ════════════════════════════════════════════════════════════════════════════
// GALLERY MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════

const TAG_LABELS = {
    medical: 'Voices of Hope',
    education: 'Safe Spaces',
    animal: 'Cultural Resilience',
    shelter: 'Educational Hub'
};

let allGalleryPhotos = [];
let galleryTagFilter = '';

// ── Load & Render ──────────────────────────────────────────────────────────
async function loadGallery() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '<div style="color:var(--text-muted);padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading photos…</div>';
    try {
        const res = await fetch(`${API}/gallery`);
        allGalleryPhotos = await res.json();
        document.getElementById('statTotalPhotos').textContent = allGalleryPhotos.length;
        renderGalleryGrid(allGalleryPhotos);
    } catch {
        grid.innerHTML = '<div style="color:#fca5a5;padding:20px;">Failed to load photos. Is the server running?</div>';
    }
}

function renderGalleryGrid(photos) {
    const grid = document.getElementById('galleryGrid');
    if (!photos.length) {
        grid.innerHTML = '<div style="color:var(--text-muted);padding:30px;text-align:center;"><i class="fas fa-images" style="font-size:32px;display:block;margin-bottom:10px;"></i>No photos yet. Upload your first photo!</div>';
        return;
    }
    grid.innerHTML = photos.map(p => {
        const cat = allGalleryCategories.find(c => c.slug === p.tag);
        const tagName = cat ? cat.name : p.tag;
        return `
        <div style="width:200px;border-radius:12px;overflow:hidden;background:var(--card-bg);box-shadow:0 2px 12px rgba(0,0,0,.18);position:relative;">
            <img src="${p.image}" alt="${p.title}" style="width:100%;height:140px;object-fit:cover;display:block;"
                 onerror="this.src='https://placehold.co/200x140/1e2330/7a8494?text=img'">
            <div style="padding:10px 12px;">
                <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.title || '(no title)'}</div>
                <span style="font-size:11px;background:var(--accent);color:#fff;padding:2px 8px;border-radius:10px;">${tagName}</span>
            </div>
            <button onclick="openDeletePhotoModal(${p.id})"
                style="position:absolute;top:8px;right:8px;background:rgba(220,38,38,.85);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `}).join('');
}

// ── Tag filter buttons ─────────────────────────────────────────────────────
function filterGallery(tag) {
    galleryTagFilter = tag;
    // Update button active states
    ['all', 'medical', 'education', 'animal', 'shelter'].forEach(t => {
        const btn = document.getElementById('gf-' + (t === '' ? 'all' : t));
        if (btn) btn.style.background = (tag === t || (tag === '' && t === 'all')) ? 'var(--accent)' : '';
        if (btn) btn.style.color = (tag === t || (tag === '' && t === 'all')) ? '#fff' : '';
    });
    const filtered = tag ? allGalleryPhotos.filter(p => p.tag === tag) : allGalleryPhotos;
    renderGalleryGrid(filtered);
}

// Search
let gallerySearchTimer;
document.getElementById('gallerySearchInput').addEventListener('input', e => {
    clearTimeout(gallerySearchTimer);
    gallerySearchTimer = setTimeout(() => {
        const q = e.target.value.trim().toLowerCase();
        const filtered = allGalleryPhotos.filter(p =>
            (!galleryTagFilter || p.tag === galleryTagFilter) &&
            (!q || p.title.toLowerCase().includes(q))
        );
        renderGalleryGrid(filtered);
    }, 300);
});

// ── File preview ───────────────────────────────────────────────────────────
document.getElementById('gPhotoFile').addEventListener('change', e => {
    const file = e.target.files[0];
    const preview = document.getElementById('gPhotoPreview');
    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
});

// ── Upload form submit ─────────────────────────────────────────────────────
document.getElementById('uploadPhotoForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('uploadPhotoBtn');
    const progressEl = document.getElementById('uploadProgress');
    const statusEl = document.getElementById('uploadStatus');
    const bar = document.getElementById('uploadProgressBar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading…';
    progressEl.style.display = 'block';
    bar.style.width = '30%';
    statusEl.textContent = 'Uploading to Cloudinary…';

    const file = document.getElementById('gPhotoFile').files[0];
    const title = document.getElementById('gPhotoTitle').value.trim();
    const tag = document.getElementById('gPhotoTag').value;

    try {
        // Step 1 — Upload file to Cloudinary via /api/upload
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'span-gallery');
        if (title) formData.append('caption', title);

        const upRes = await fetch(`${API}/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        const upData = await upRes.json();
        if (!upRes.ok) { showToast(upData.error || 'Upload failed', 'error'); return; }

        bar.style.width = '70%';
        statusEl.textContent = 'Saving to database…';

        // Step 2 — Save record in gallery_photos table
        const saveRes = await fetch(`${API}/gallery`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ image: upData.url, public_id: upData.public_id, title, tag })
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) { showToast(saveData.error || 'Save failed', 'error'); return; }

        bar.style.width = '100%';
        statusEl.textContent = 'Done!';
        showToast('Photo uploaded successfully!');
        document.getElementById('uploadPhotoForm').reset();
        document.getElementById('gPhotoPreview').style.display = 'none';
        setTimeout(() => { showSection('gallery'); }, 700);
    } catch {
        showToast('Error connecting to server', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload & Save';
        setTimeout(() => { progressEl.style.display = 'none'; bar.style.width = '0%'; }, 1200);
    }
});

// ── Delete modal ───────────────────────────────────────────────────────────
let pendingDeletePhotoId = null;

function openDeletePhotoModal(id) {
    pendingDeletePhotoId = id;
    document.getElementById('deletePhotoModal').classList.add('open');
}
function closeDeletePhotoModal() {
    pendingDeletePhotoId = null;
    document.getElementById('deletePhotoModal').classList.remove('open');
}

document.getElementById('confirmDeletePhotoBtn').addEventListener('click', async () => {
    if (!pendingDeletePhotoId) return;
    const btn = document.getElementById('confirmDeletePhotoBtn');
    btn.disabled = true; btn.textContent = 'Deleting…';
    try {
        const res = await fetch(`${API}/gallery/${pendingDeletePhotoId}`, {
            method: 'DELETE', headers: authHeaders()
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Photo deleted');
            closeDeletePhotoModal();
            loadGallery();
        } else {
            showToast(data.error || 'Delete failed', 'error');
        }
    } catch {
        showToast('Error connecting to server', 'error');
    } finally {
        btn.disabled = false; btn.textContent = 'Delete';
    }
});

document.getElementById('deletePhotoModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDeletePhotoModal();
});

// ════════════════════════════════════════════════════════════════════════════
// CATEGORY MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════

let allBlogCategories = [];
let allGalleryCategories = [];

async function loadCategories() {
    try {
        const [blogRes, galleryRes] = await Promise.all([
            fetch(`${API}/categories/blog`),
            fetch(`${API}/categories/gallery`)
        ]);
        allBlogCategories = await blogRes.json();
        allGalleryCategories = await galleryRes.json();

        // 1. Update form selects
        const fCat = document.getElementById('fCategory');
        if (fCat) fCat.innerHTML = allBlogCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

        const gTag = document.getElementById('gPhotoTag');
        if (gTag) gTag.innerHTML = allGalleryCategories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');

        // 2. Update Gallery header filter buttons dynamically
        const galleryBtnContainer = document.querySelector('#section-gallery .section-header > div:nth-child(2)');
        if (galleryBtnContainer) {
            galleryBtnContainer.innerHTML = `
                <button class="btn btn-ghost" data-tag="" onclick="filterGallery('')" style="border-radius:20px; ${galleryTagFilter === '' ? 'background:var(--accent);color:#fff;' : ''}">All</button>
                ${allGalleryCategories.map(c => `
                    <button class="btn btn-ghost" data-tag="${c.slug}" onclick="filterGallery('${c.slug}')" style="border-radius:20px; ${galleryTagFilter === c.slug ? 'background:var(--accent);color:#fff;' : ''}">${c.name}</button>
                `).join('')}
            `;
        }

        // 3. Update management tables
        renderCategoryTables();
    } catch {
        console.error("Failed to load categories.");
    }
}

function renderCategoryTables() {
    // Blog table
    const bTbody = document.getElementById('blogCategoriesTableBody');
    if (bTbody) {
        bTbody.innerHTML = allBlogCategories.map(c => `
            <tr>
                <td style="font-weight:500;">${c.name}</td>
                <td style="text-align:center;"><span class="category-badge">${c.usage_count}</span></td>
                <td>
                    <button class="btn btn-sm btn-delete btn-icon" onclick="deleteCategory('blog', ${c.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Gallery table
    const gTbody = document.getElementById('galleryCategoriesTableBody');
    if (gTbody) {
        gTbody.innerHTML = allGalleryCategories.map(c => `
            <tr>
                <td>
                    <div style="font-weight:500;">${c.name}</div>
                    <div style="font-size:11px;color:var(--text-muted);font-family:monospace;">${c.slug}</div>
                </td>
                <td style="text-align:center;"><span class="category-badge">${c.usage_count}</span></td>
                <td>
                    <button class="btn btn-sm btn-delete btn-icon" onclick="deleteCategory('gallery', ${c.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

// Add Blog Category
document.getElementById('addBlogCatForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const input = document.getElementById('newBlogCatName');
    const name = input.value.trim();
    if (!name) return;

    try {
        const res = await fetch(`${API}/categories/blog`, {
            method: 'POST', headers: authHeaders(), body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (res.ok) {
            input.value = '';
            showToast('Blog category added!');
            loadCategories();
        } else {
            showToast(data.error || 'Failed to add', 'error');
        }
    } catch { showToast('Connection error', 'error'); }
});

// Add Gallery Category
document.getElementById('addGalleryCatForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const input = document.getElementById('newGalleryCatName');
    const name = input.value.trim();
    if (!name) return;

    try {
        const res = await fetch(`${API}/categories/gallery`, {
            method: 'POST', headers: authHeaders(), body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (res.ok) {
            input.value = '';
            showToast('Gallery category added!');
            loadCategories();
        } else {
            showToast(data.error || 'Failed to add', 'error');
        }
    } catch { showToast('Connection error', 'error'); }
});

// Delete Category
async function deleteCategory(type, id) {
    if (!confirm(`Are you sure you want to delete this ${type} category? Existing items using this category will remain unchanged but won't be filterable.`)) return;

    try {
        const res = await fetch(`${API}/categories/${type}/${id}`, {
            method: 'DELETE', headers: authHeaders()
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Category deleted');
            loadCategories();
        } else {
            showToast(data.error || 'Delete failed', 'error');
        }
    } catch { showToast('Connection error', 'error'); }
}
