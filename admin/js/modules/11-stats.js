async function loadStats() {
    try {
        const stats = await fetch(`${API}/stats`, { headers: { 'Bypass-Tunnel-Reminder': 'true' } }).then(r => r.json());
        const statMap = {}; stats.forEach(s => { statMap[s.key] = s.value; });
        document.getElementById('statPeopleHelped').value = statMap.people_helped || 0;
        document.getElementById('statVolunteersTrained').value = statMap.volunteers_trained || 0;
        document.getElementById('statPeerCounsellors').value = statMap.peer_counsellors || 0;
        document.getElementById('statWorkshopsHeld').value = statMap.workshops_held || 0;
    } catch { showToast('Failed to load stats', 'error'); }
}

async function saveStats() {
    const btn = document.getElementById('saveStatsBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    const stats = [
        { key: 'people_helped', value: parseInt(document.getElementById('statPeopleHelped').value) || 0 },
        { key: 'volunteers_trained', value: parseInt(document.getElementById('statVolunteersTrained').value) || 0 },
        { key: 'peer_counsellors', value: parseInt(document.getElementById('statPeerCounsellors').value) || 0 },
        { key: 'workshops_held', value: parseInt(document.getElementById('statWorkshopsHeld').value) || 0 }
    ];
    try {
        for (const stat of stats) {
            const res = await fetch(`${API}/stats/${stat.key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ value: stat.value }) });
            if (!res.ok) throw new Error('Save failed');
        }
        showToast('Stats saved!');
    } catch { showToast('Failed to save stats', 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Stats'; }
}

function initStats() {
    document.getElementById('saveStatsBtn')?.addEventListener('click', saveStats);
}