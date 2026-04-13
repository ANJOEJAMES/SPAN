async function loadTestimonials() {
    const tbody = document.getElementById('testimonialsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading-row"><i class="fas fa-spinner fa-spin"></i> Loading…</td></tr>';
    try {
        window.allTestimonials = await fetch(`${API}/testimonials`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } }).then(r => r.json());
        renderTestimonialsTable(window.allTestimonials);
    } catch (e) { tbody.innerHTML = `<tr><td colspan="5" class="loading-row" style="color:#fca5a5;">Failed: ${e.message}</td></tr>`; }
}

function renderTestimonialsTable(testimonials) {
    const tbody = document.getElementById('testimonialsTableBody');
    if (!testimonials?.length) return tbody.innerHTML = '<tr><td colspan="5" class="loading-row">No testimonials</td></tr>';
    tbody.innerHTML = testimonials.map(t => `
        <tr>
            <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.quote}</td>
            <td style="font-weight:600;">${t.author}</td>
            <td><span class="category-badge">${t.designation}</span></td>
            <td>${new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td class="actions-cell"><button class="btn btn-sm btn-delete btn-icon" onclick="openDeleteTestimonialModal(${t.id})"><i class="fas fa-trash"></i></button></td>
        </tr>`).join('');
}

function openDeleteTestimonialModal(id) { window.pendingDelTestId = id; document.getElementById('deleteTestimonialModal').classList.add('open'); }
function closeDeleteTestimonialModal() { window.pendingDelTestId = null; document.getElementById('deleteTestimonialModal').classList.remove('open'); }

async function deleteTestimonial() {
    if (!window.pendingDelTestId) return;
    const btn = document.getElementById('confirmDeleteTestimonialBtn');
    btn.disabled = true;
    btn.textContent = 'Deleting...';
    window.lastDeletedTestimonial = window.allTestimonials.find(t => t.id == window.pendingDelTestId);
    try {
        const res = await fetch(`${API}/testimonials/${window.pendingDelTestId}`, { method: 'DELETE', headers: authHeaders() });
        const data = await res.json();
        if (res.ok) {
            closeDeleteTestimonialModal(); loadTestimonials();
            const toastEl = document.getElementById('toast');
            toastEl.innerHTML = 'Testimonial deleted. <button type="button" onclick="undoTestimonial()">Undo</button>';
            toastEl.className = 'toast success show';
            clearTimeout(toastEl._timer);
            toastEl._timer = setTimeout(() => toastEl.classList.remove('show'), 8000);
        } else showToast(data.error || 'Delete failed', 'error');
    } catch { showToast('Connection error', 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Delete'; }
}

window.undoTestimonial = async () => {
    if (!window.lastDeletedTestimonial) return;
    document.getElementById('toast').classList.remove('show');
    try {
        const res = await fetch(`${API}/testimonials`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ quote: window.lastDeletedTestimonial.quote, author: window.lastDeletedTestimonial.author, designation: window.lastDeletedTestimonial.designation }) });
        if (res.ok) { showToast('Testimonial restored!'); window.lastDeletedTestimonial = null; loadTestimonials(); }
        else showToast('Restore failed', 'error');
    } catch { showToast('Connection error', 'error'); }
};

let testSearchTimer;
function initTestimonials() {
    document.getElementById('testSearchInput')?.addEventListener('input', e => {
        clearTimeout(testSearchTimer);
        testSearchTimer = setTimeout(() => {
            const q = e.target.value.trim().toLowerCase();
            renderTestimonialsTable(window.allTestimonials.filter(t => (t.author||'').toLowerCase().includes(q) || (t.quote||'').toLowerCase().includes(q) || (t.designation||'').toLowerCase().includes(q)));
        }, 300);
    });
    document.getElementById('testimonialForm')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('submitTestimonialBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        const body = { quote: document.getElementById('tQuote').value.trim(), author: document.getElementById('tAuthor').value.trim(), designation: document.getElementById('tDesignation').value.trim() };
        try {
            const res = await fetch(`${API}/testimonials`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
            const data = await res.json();
            if (res.ok) { showToast('Testimonial added!'); document.getElementById('testimonialForm').reset(); showSection('testimonials'); loadTestimonials(); }
            else showToast(data.error || 'Failed to add', 'error');
        } catch { showToast('Connection error', 'error'); }
        finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Testimonial'; }
    });
    document.getElementById('confirmDeleteTestimonialBtn')?.addEventListener('click', deleteTestimonial);
    document.getElementById('deleteTestimonialModal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeDeleteTestimonialModal(); });
}