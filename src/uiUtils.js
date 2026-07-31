// ============================================
// UI UTILITIES - Toast, Flash (no DOM dependencies)
// ============================================

let toastTimer = null;

export function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 2600);
}

export function flash(msg) {
  const c = document.getElementById('coins');
  if (!c) return;
  c.title = msg;
  c.animate([{ color: '#ff6b6b' }, { color: '#ffd54a' }], { duration: 500 });
}