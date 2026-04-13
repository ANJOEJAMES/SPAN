function toggleGroup(id) { document.getElementById(id).classList.toggle('open'); }
function openGroup(id) { document.getElementById(id)?.classList.add('open'); }

function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${name}`).classList.add('active');
    document.querySelectorAll('.nav-item[data-section]').forEach(a => a.classList.toggle('active', a.dataset.section === name));
    document.getElementById('pageTitle').textContent = SECTION_TITLES[name] || 'Admin';
    const groupId = GROUP_MAP[name]; if (groupId) openGroup(groupId);
    if (name === 'posts') loadPosts();
    if (name === 'new-post' && !document.getElementById('editPostId').value) resetPostForm();
    if (name === 'gallery') loadGallery();
    if (name === 'testimonials') loadTestimonials();
    if (name === 'stats') loadStats();
    if (name === 'subscriptions') loadSubscriptions();
    if (['new-post', 'upload-photo', 'categories', 'gallery'].includes(name)) loadCategories();
}

function initNavigation() {
    document.querySelectorAll('.nav-item[data-section]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); showSection(a.dataset.section); }));
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('sidebarToggle').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
    document.addEventListener('click', e => {
        if (window.innerWidth <= 768 && document.querySelector('.sidebar').classList.contains('open') && !e.target.closest('.sidebar') && !e.target.closest('#sidebarToggle')) {
            document.querySelector('.sidebar').classList.remove('open');
        }
    });
    document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => { if (window.innerWidth <= 768) document.querySelector('.sidebar').classList.remove('open'); }));
    openGroup('grp-blog');
}