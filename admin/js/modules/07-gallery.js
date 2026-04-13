async function loadGallery() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '<div style="color:var(--text-muted);padding:20px;"><i class="fas fa-spinner fa-spin"></i> Loading photos…</div>';
    try {
        window.allGalleryPhotos = await fetch(`${API}/gallery`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } }).then(r => r.json());
        document.getElementById('statTotalPhotos').textContent = window.allGalleryPhotos.length;
        renderGalleryGrid(window.allGalleryPhotos);
    } catch { grid.innerHTML = '<div style="color:#fca5a5;padding:20px;">Failed to load photos</div>'; }
}

function renderGalleryGrid(photos) {
    const grid = document.getElementById('galleryGrid');
    if (!photos.length) return grid.innerHTML = '<div style="color:var(--text-muted);padding:30px;text-align:center;"><i class="fas fa-images" style="font-size:32px;margin-bottom:10px;"></i>No photos yet</div>';
    grid.innerHTML = photos.map(p => `
        <div style="width:200px;border-radius:12px;overflow:hidden;background:var(--card-bg);box-shadow:0 2px 12px rgba(0,0,0,.18);position:relative;">
            <img src="${p.image}" alt="${p.title}" style="width:100%;height:140px;object-fit:cover;" onerror="this.src='https://placehold.co/200x140/1e2330/7a8494?text=img'">
            <div style="padding:10px 12px;">
                <div style="font-size:12px;font-weight:600;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.title || '(no title)'}</div>
                <span style="font-size:11px;background:var(--accent);color:#fff;padding:2px 8px;border-radius:10px;">${TAG_LABELS[p.tag] || p.tag}</span>
            </div>
            <button onclick="openDeletePhotoModal(${p.id})" style="position:absolute;top:8px;right:8px;background:rgba(220,38,38,.85);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="fas fa-trash"></i></button>
        </div>`).join('');
}

function filterGallery(tag) {
    window.galleryTagFilter = tag;
    ['all', 'medical', 'education', 'animal', 'shelter'].forEach(t => {
        const btn = document.getElementById('gf-' + (t === '' ? 'all' : t));
        if (btn) { btn.style.background = (tag === t || (tag === '' && t === 'all')) ? 'var(--accent)' : ''; btn.style.color = (tag === t || (tag === '' && t === 'all')) ? '#fff' : ''; }
    });
    renderGalleryGrid(tag ? window.allGalleryPhotos.filter(p => p.tag === tag) : window.allGalleryPhotos);
}

function openDeletePhotoModal(id) { window.pendingDeletePhotoId = id; document.getElementById('deletePhotoModal').classList.add('open'); }
function closeDeletePhotoModal() { window.pendingDeletePhotoId = null; document.getElementById('deletePhotoModal').classList.remove('open'); }

async function deletePhoto() {
    if (!window.pendingDeletePhotoId) return;
    const btn = document.getElementById('confirmDeletePhotoBtn');
    btn.disabled = true;
    btn.textContent = 'Deleting…';
    try {
        const res = await fetch(`${API}/gallery/${window.pendingDeletePhotoId}`, { method: 'DELETE', headers: authHeaders() });
        const data = await res.json();
        if (res.ok) { showToast('Photo deleted'); closeDeletePhotoModal(); loadGallery(); }
        else showToast(data.error || 'Delete failed', 'error');
    } catch { showToast('Connection error', 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Delete'; }
}

let gallerySearchTimer;
function initGallery() {
    document.getElementById('gallerySearchInput').addEventListener('input', e => {
        clearTimeout(gallerySearchTimer);
        gallerySearchTimer = setTimeout(() => {
            const q = e.target.value.trim().toLowerCase();
            renderGalleryGrid(window.allGalleryPhotos.filter(p => (!window.galleryTagFilter || p.tag === window.galleryTagFilter) && (!q || p.title.toLowerCase().includes(q))));
        }, 300);
    });
    document.getElementById('confirmDeletePhotoBtn').addEventListener('click', deletePhoto);
    document.getElementById('deletePhotoModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeDeletePhotoModal(); });
}