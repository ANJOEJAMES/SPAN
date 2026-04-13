function showToast(msg, type = 'success', duration = 3500) {
    const el = document.getElementById('toast');
    el.innerHTML = msg;
    el.className = `toast ${type} show`;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), duration);
}

function showUndoToast(post, onUndo) {
    const el = document.getElementById('toast');
    el.innerHTML = `Post deleted. <button type="button" onclick="window.undoPost()">Undo</button>`;
    el.className = 'toast success show';
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 8000);
}