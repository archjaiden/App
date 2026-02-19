/* ── Utility helpers ──────────────────────────── */

/* Toast notifications */
export function toast(msg, type = 'info', duration = 3200) {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => {
    el.style.animation = 'fadeOut .25s ease forwards';
    setTimeout(() => el.remove(), 260);
  }, duration);
}

/* Modal helpers */
export function openModal(title, bodyHTML, footerHTML, extraClass = '') {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal ${extraClass}" id="modal">
      <div class="modal-header">
        <span class="modal-title">${title}</span>
        <button class="btn btn-ghost btn-icon" id="modal-close-btn" title="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
    </div>`;

  overlay.querySelector('#modal-close-btn').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  return overlay;
}

export function closeModal() {
  document.getElementById('modal-overlay')?.remove();
}

/* Confirm dialog */
export function confirm(msg) {
  return new Promise(resolve => {
    const overlay = openModal(
      'Confirm',
      `<p style="font-size:14px;color:var(--text-2);line-height:1.6">${msg}</p>`,
      `<button class="btn btn-secondary" id="conf-no">Cancel</button>
       <button class="btn btn-danger"    id="conf-yes">Delete</button>`
    );
    overlay.querySelector('#conf-yes').addEventListener('click', () => { closeModal(); resolve(true); });
    overlay.querySelector('#conf-no').addEventListener('click',  () => { closeModal(); resolve(false); });
  });
}

/* Date formatting */
export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`;
}

export function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit' });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* File helpers */
export function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}

export function fileIcon(name = '') {
  const ext = name.split('.').pop().toLowerCase();
  const map = {
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
    ppt: '📋', pptx: '📋', txt: '📃', csv: '📊',
    zip: '🗜', rar: '🗜', '7z': '🗜',
    png: '🖼', jpg: '🖼', jpeg: '🖼', gif: '🖼', svg: '🖼', webp: '🖼',
    mp4: '🎬', mov: '🎬', avi: '🎬',
    mp3: '🎵', wav: '🎵',
  };
  return map[ext] || '📁';
}

/* Image compression via canvas */
export function compressImage(file, maxW = 1200, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const ratio  = Math.min(maxW / img.width, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({
          name:     file.name,
          size:     file.size,
          type:     file.type,
          dataUrl:  canvas.toDataURL('image/jpeg', quality),
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Read any file as base64 */
export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload  = e => resolve({
      name:    file.name,
      size:    file.size,
      type:    file.type,
      dataUrl: e.target.result,
    });
    reader.readAsDataURL(file);
  });
}

/* Geocode an address string via Nominatim (free, no key) */
export async function geocodeAddress(address, suburb, postcode) {
  const q = encodeURIComponent(`${address}, ${suburb} ${postcode}, Western Australia, Australia`);
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'TechDoc/1.0' },
    });
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch { /* offline or quota */ }
  return null;
}

/* Build file-drop zone with drag-and-drop */
export function makeFileDrop(el, accept, onFiles) {
  el.addEventListener('dragover',  e => { e.preventDefault(); el.classList.add('drag-over'); });
  el.addEventListener('dragleave', ()  => el.classList.remove('drag-over'));
  el.addEventListener('drop', e => {
    e.preventDefault();
    el.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(f =>
      !accept || accept.split(',').some(a => f.type.match(a.trim().replace('*','.*'))));
    if (files.length) onFiles(files);
  });
  el.addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type     = 'file';
    inp.accept   = accept || '*/*';
    inp.multiple = true;
    inp.onchange = () => onFiles(Array.from(inp.files));
    inp.click();
  });
}

/* Escape HTML to prevent XSS */
export function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* Generate badge HTML */
export function statusBadge(status) {
  const cls = { pending:'badge-gray','in-progress':'badge-orange',completed:'badge-green',cancelled:'badge-red' };
  const lbl = { pending:'Pending','in-progress':'In Progress',completed:'Completed',cancelled:'Cancelled' };
  return `<span class="badge ${cls[status] || 'badge-gray'}">${lbl[status] || status}</span>`;
}

export function priorityHtml(p) {
  if (!p) return '—';
  return `<span class="priority-dot priority-${p}">${p[0].toUpperCase()+p.slice(1)}</span>`;
}
