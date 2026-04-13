function setImagePreview(url) {
    const preview = document.getElementById('imagePreview');
    const prompt = document.getElementById('uploadPrompt');
    document.getElementById('youtubePreview')?.remove();
    const ytMatch = url?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
        preview.classList.remove('visible');
        prompt.style.display = 'none';
        const iframe = document.createElement('iframe');
        iframe.id = 'youtubePreview';
        iframe.src = `https://www.youtube.com/embed/${ytMatch[1]}`;
        iframe.style.cssText = 'width:100%; height:130px; object-fit:cover; border:none; border-radius:8px;';
        document.getElementById('imageUploadBox').appendChild(iframe);
    } else if (url) {
        preview.src = url;
        preview.classList.add('visible');
        prompt.style.display = 'none';
    } else {
        preview.classList.remove('visible');
        prompt.style.display = 'flex';
    }
}

async function submitPostForm(e) {
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
    if (!body.image) { showToast('Please upload or paste an image URL', 'error'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Post'; return; }
    try {
        const res = await fetch(id ? `${API}/posts/${id}` : `${API}/posts`, { method: id ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(body) });
        const data = await res.json();
        if (res.ok) { showToast(id ? 'Post updated!' : 'Post created!'); resetPostForm(); showSection('posts'); }
        else showToast(data.error || 'Save failed', 'error');
    } catch { showToast('Connection error', 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Post'; }
}

async function uploadImage(file) {
    const progress = document.getElementById('uploadProgress');
    const imageBox = document.getElementById('imageUploadBox');
    progress.style.display = 'flex';
    imageBox.style.pointerEvents = 'none';
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'span-blog');
    try {
        const res = await fetch(`${API}/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Bypass-Tunnel-Reminder': 'true' }, body: formData });
        const data = await res.json();
        if (res.ok) { document.getElementById('fImage').value = data.url; setImagePreview(data.url); showToast('Image uploaded!'); }
        else showToast(data.error || 'Upload failed', 'error');
    } catch { showToast('Upload failed', 'error'); }
    finally { progress.style.display = 'none'; imageBox.style.pointerEvents = ''; }
}

function initImageUpload() {
    const imageBox = document.getElementById('imageUploadBox');
    const imageFile = document.getElementById('imageFile');
    imageBox.addEventListener('click', () => imageFile.click());
    imageFile.addEventListener('change', () => { if (imageFile.files[0]) uploadImage(imageFile.files[0]); });
    imageBox.addEventListener('dragover', e => { e.preventDefault(); imageBox.classList.add('drag-over'); });
    imageBox.addEventListener('dragleave', () => imageBox.classList.remove('drag-over'));
    imageBox.addEventListener('drop', e => { e.preventDefault(); imageBox.classList.remove('drag-over'); const file = e.dataTransfer.files[0]; if (file && file.type.startsWith('image/')) uploadImage(file); });
}