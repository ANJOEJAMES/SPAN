function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Bypass-Tunnel-Reminder': 'true' };
}

function checkSessionExpiry() {
    const loginTimeRaw = localStorage.getItem('span_admin_login_time');
    const localToken = localStorage.getItem('span_admin_token');
    if (!localToken) return window.location.href = '/admin/login.html';
    if (loginTimeRaw && (Date.now() - parseInt(loginTimeRaw)) >= SESSION_DURATION_MS) {
        localStorage.removeItem('span_admin_token', 'span_admin_email', 'span_admin_login_time');
        window.location.href = '/admin/login.html';
    }
}

function initAuth() {
    checkSessionExpiry();
    setInterval(checkSessionExpiry, 60000);
    document.getElementById('adminEmail').textContent = localStorage.getItem('span_admin_email') || 'Admin';
}

function logout() {
    localStorage.removeItem('span_admin_token', 'span_admin_email', 'span_admin_login_time');
    window.location.href = '/admin/login.html';
}