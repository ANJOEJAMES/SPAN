async function loadCategories() {
    try {
        const [blogRes, galleryRes] = await Promise.all([
            fetch(`${API}/categories/blog`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } }),
            fetch(`${API}/categories/gallery`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } })
        ]);
        window.allBlogCategories = await blogRes.json();
        window.allGalleryCategories = await galleryRes.json();
        document.getElementById('fCategory').innerHTML = window.allBlogCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        document.getElementById('gPhotoTag').innerHTML = window.allGalleryCategories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
        const galleryBtnContainer = document.querySelector('#section-gallery .section-header > div:nth-child(2)');
        if (galleryBtnContainer) {
            galleryBtnContainer.innerHTML = `
                <button class="btn btn-ghost" onclick="filterGallery('')" style="border-radius:20px;">All</button>
                ${window.allGalleryCategories.map(c => `<button class="btn btn-ghost" onclick="filterGallery('${c.slug}')" style="border-radius:20px;">${c.name}</button>`).join('')}`;
        }
        renderCategoryTables();
    } catch { console.error("Failed to load categories."); }
}

function renderCategoryTables() {
    const bTbody = document.getElementById('blogCategoriesTableBody');
    if (bTbody) bTbody.innerHTML = window.allBlogCategories.map(c => `<tr><td style="font-weight:500;">${c.name}</td><td style="text-align:center;"><span class="category-badge">${c.usage_count}</span></td><td><button class="btn btn-sm btn-delete btn-icon" onclick="deleteCategory('blog', ${c.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
    const gTbody = document.getElementById('galleryCategoriesTableBody');
    if (gTbody) gTbody.innerHTML = window.allGalleryCategories.map(c => `<tr><td><div style="font-weight:500;">${c.name}</div><div style="font-size:11px;color:var(--text-muted);font-family:monospace;">${c.slug}</div></td><td style="text-align:center;"><span class="category-badge">${c.usage_count}</span></td><td><button class="btn btn-sm btn-delete btn-icon" onclick="deleteCategory('gallery', ${c.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}

async function addBlogCategory(name) {
    const res = await fetch(`${API}/categories/blog`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name }) });
    const data = await res.json();
    if (res.ok) { showToast('Category added!'); loadCategories(); }
    else showToast(data.error || 'Failed to add', 'error');
}

async function addGalleryCategory(name) {
    const res = await fetch(`${API}/categories/gallery`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name }) });
    const data = await res.json();
    if (res.ok) { showToast('Category added!'); loadCategories(); }
    else showToast(data.error || 'Failed to add', 'error');
}

async function deleteCategory(type, id) {
    if (!confirm(`Delete this ${type} category?`)) return;
    const res = await fetch(`${API}/categories/${type}/${id}`, { method: 'DELETE', headers: authHeaders() });
    const data = await res.json();
    if (res.ok) { showToast('Category deleted'); loadCategories(); }
    else showToast(data.error || 'Delete failed', 'error');
}

function initCategories() {
    document.getElementById('addBlogCatForm')?.addEventListener('submit', e => { e.preventDefault(); const name = document.getElementById('newBlogCatName').value.trim(); if (name) addBlogCategory(name); });
    document.getElementById('addGalleryCatForm')?.addEventListener('submit', e => { e.preventDefault(); const name = document.getElementById('newGalleryCatName').value.trim(); if (name) addGalleryCategory(name); });
}