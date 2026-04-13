document.getElementById('gPhotoFile').addEventListener('change', e => {
    const file = e.target.files[0];
    const preview = document.getElementById('gPhotoPreview');
    if (file) { preview.src = URL.createObjectURL(file); preview.style.display = 'block'; }
    else preview.style.display = 'none';
});

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
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'span-gallery');
        if (title) formData.append('caption', title);
        const upRes = await fetch(`${API}/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Bypass-Tunnel-Reminder': 'true' }, body: formData });
        const upData = await upRes.json();
        if (!upRes.ok) { showToast(upData.error || 'Upload failed', 'error'); return; }
        bar.style.width = '70%';
        statusEl.textContent = 'Saving to database…';
        const saveRes = await fetch(`${API}/gallery`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ image: upData.url, public_id: upData.public_id, title, tag }) });
        const saveData = await saveRes.json();
        if (!saveRes.ok) { showToast(saveData.error || 'Save failed', 'error'); return; }
        bar.style.width = '100%';
        statusEl.textContent = 'Done!';
        showToast('Photo uploaded!');
        document.getElementById('uploadPhotoForm').reset();
        document.getElementById('gPhotoPreview').style.display = 'none';
        setTimeout(() => showSection('gallery'), 700);
    } catch { showToast('Connection error', 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload & Save'; setTimeout(() => { progressEl.style.display = 'none'; bar.style.width = '0%'; }, 1200); }
});