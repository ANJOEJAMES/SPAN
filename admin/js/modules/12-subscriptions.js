async function loadSubscriptions() {
    const tbody = document.getElementById('subscriptionsTableBody');
    tbody.innerHTML = '<tr><td colspan="3" class="loading-row"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    try {
        const subscribers = await fetch(`${API}/newsletter/subscribers`).then(r => r.json());
        if (!subscribers.length) return tbody.innerHTML = '<tr><td colspan="3" class="loading-row">No subscribers yet</td></tr>';
        tbody.innerHTML = subscribers.map(sub => `<tr><td>${sub.email}</td><td>${new Date(sub.created_at).toLocaleDateString()}</td><td><button class="btn btn-sm btn-delete" onclick="deleteSubscriber(${sub.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
    } catch { showToast('Failed to load subscribers', 'error'); tbody.innerHTML = '<tr><td colspan="3" class="loading-row">Error loading data</td></tr>'; }
}

async function deleteSubscriber(id) {
    if (!confirm('Delete this subscriber?')) return;
    try {
        const res = await fetch(`${API}/newsletter/subscribers/${id}`, { method: 'DELETE' });
        if (res.ok) { showToast('Subscriber deleted'); loadSubscriptions(); }
        else { const err = await res.json(); showToast(err.error || 'Failed to delete', 'error'); }
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

function initSubscriptions() {
    // No initialization needed for subscriptions - loaded on demand
}