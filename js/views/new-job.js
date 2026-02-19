import { getClients, getJob, saveJob, genId } from '../storage.js';
import { JOB_TYPES, DEFAULT_JOB_CHECKLIST } from '../data.js';
import { toast, fmtDate, esc, compressImage, readFile, fmtBytes, makeFileDrop } from '../utils.js';

const navigate     = (...a) => window.navigate(...a);
const updateBadges = ()     => window.updateBadges?.();

/* Temporary state while editing this form */
let _photos    = [];
let _documents = [];
let _checklist = [];

export function render(el, params = {}) {
  const isEdit   = !!params.editId;
  const existing = isEdit ? getJob(params.editId) : null;

  document.getElementById('page-title').textContent = isEdit ? `Edit ${existing?.jobNumber || 'Job'}` : 'New Job';
  document.getElementById('topbar-actions').innerHTML = `
    <button class="btn btn-ghost" id="nj-cancel">Cancel</button>
    <button class="btn btn-primary" id="nj-save">${isEdit ? 'Save Changes' : 'Save Job'}</button>`;

  /* Init temp state from existing record or defaults */
  _photos    = existing?.photos    ? [...existing.photos]    : [];
  _documents = existing?.documents ? [...existing.documents] : [];
  _checklist = existing?.checklist
    ? existing.checklist.map(i => ({...i}))
    : DEFAULT_JOB_CHECKLIST.map(label => ({ id: genId(), label, checked: false }));

  const clients = getClients();
  const today   = new Date().toISOString().slice(0,10);
  const v       = existing || {};
  const selectedTypes = new Set(v.jobTypes || []);

  el.innerHTML = `
    <form id="job-form" style="display:flex;flex-direction:column;gap:22px;max-width:960px">

      <!-- Row 1: Client, Date, Status, Priority -->
      <div class="card">
        <div class="card-header"><span class="card-title">Job Details</span></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group full">
              <label class="form-label">Client *</label>
              <select class="form-select" id="nj-client" required>
                <option value="">— Select a client —</option>
                ${clients.map(c => `<option value="${c.id}" ${v.clientId===c.id?'selected':''}>${esc(c.name)} — ${esc(c.suburb||c.address||'')}</option>`).join('')}
              </select>
              ${clients.length === 0 ? `<small style="color:var(--orange)">No clients yet — <a href="#" id="nj-add-client" class="text-accent">add one first</a></small>` : ''}
            </div>
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input class="form-input" type="date" id="nj-date" value="${v.date||today}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="nj-status">
                <option value="pending"     ${(v.status||'pending')==='pending'     ?'selected':''}>Pending</option>
                <option value="in-progress" ${v.status==='in-progress'?'selected':''}>In Progress</option>
                <option value="completed"   ${v.status==='completed'  ?'selected':''}>Completed</option>
                <option value="cancelled"   ${v.status==='cancelled'  ?'selected':''}>Cancelled</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" id="nj-priority">
                <option value="low"    ${(v.priority||'medium')==='low'   ?'selected':''}>Low</option>
                <option value="medium" ${(v.priority||'medium')==='medium'?'selected':''}>Medium</option>
                <option value="high"   ${v.priority==='high'  ?'selected':''}>High</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Technician</label>
              <input class="form-input" id="nj-tech" value="${esc(v.technician||'')}" placeholder="Your name">
            </div>
            <div class="form-group">
              <label class="form-label">Time In</label>
              <input class="form-input" type="time" id="nj-timein" value="${v.timeIn||''}">
            </div>
            <div class="form-group">
              <label class="form-label">Time Out</label>
              <input class="form-input" type="time" id="nj-timeout" value="${v.timeOut||''}">
            </div>
          </div>
        </div>
      </div>

      <!-- Job Types -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Job Types</span>
          <span id="type-count" class="badge badge-blue">${selectedTypes.size} selected</span>
        </div>
        <div class="card-body">
          <div class="checkbox-grid" id="job-types-grid">
            ${JOB_TYPES.map(t => `
              <div class="check-chip ${selectedTypes.has(t)?'on':''}" data-type="${esc(t)}">
                <span class="chip-box"></span>
                ${esc(t)}
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="card">
        <div class="card-header"><span class="card-title">Notes</span></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:14px">
          <div class="form-group">
            <label class="form-label">Job Notes (visible to client)</label>
            <textarea class="form-textarea" id="nj-notes" style="min-height:120px" placeholder="Describe the work done, any issues encountered…">${esc(v.notes||'')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Internal Notes (private)</label>
            <textarea class="form-textarea" id="nj-internal" placeholder="Internal notes, follow-ups, pricing…">${esc(v.internalNotes||'')}</textarea>
          </div>
        </div>
      </div>

      <!-- Checklist -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Job Checklist</span>
          <button type="button" class="btn btn-ghost btn-sm" id="add-check-item">+ Add Item</button>
        </div>
        <div class="card-body">
          <div class="checklist" id="checklist-wrap"></div>
        </div>
      </div>

      <!-- Photos -->
      <div class="card">
        <div class="card-header"><span class="card-title">Photos</span></div>
        <div class="card-body">
          <div class="file-drop" id="photo-drop">
            <div class="file-drop-icon">📷</div>
            <p><span>Click to upload</span> or drag & drop photos</p>
            <p style="font-size:11px;margin-top:4px;color:var(--text-3)">JPEG, PNG, WEBP — images will be compressed</p>
          </div>
          <div class="photo-grid mt-8" id="photo-grid"></div>
        </div>
      </div>

      <!-- Documents -->
      <div class="card">
        <div class="card-header"><span class="card-title">Documents</span></div>
        <div class="card-body">
          <div class="file-drop" id="doc-drop">
            <div class="file-drop-icon">📎</div>
            <p><span>Click to upload</span> or drag & drop files</p>
            <p style="font-size:11px;margin-top:4px;color:var(--text-3)">PDF, Word, Excel, etc.</p>
          </div>
          <div class="file-list mt-8" id="doc-list"></div>
        </div>
      </div>

    </form>`;

  /* Load technician name from settings */
  if (!v.technician) {
    try {
      const s = JSON.parse(localStorage.getItem('td_settings') || '{}');
      if (s.technicianName) document.getElementById('nj-tech').value = s.technicianName;
    } catch {}
  }

  /* Render checklist */
  renderChecklist();

  /* Job type toggle */
  el.querySelectorAll('.check-chip').forEach(chip =>
    chip.addEventListener('click', () => {
      chip.classList.toggle('on');
      const count = el.querySelectorAll('.check-chip.on').length;
      document.getElementById('type-count').textContent = `${count} selected`;
    }));

  /* Checklist add */
  document.getElementById('add-check-item').addEventListener('click', () => {
    _checklist.push({ id: genId(), label: '', checked: false });
    renderChecklist();
    /* Focus last input */
    const inputs = document.querySelectorAll('.checklist-label-input');
    inputs[inputs.length-1]?.focus();
  });

  /* Photo drop */
  makeFileDrop(document.getElementById('photo-drop'), 'image/*', async files => {
    for (const f of files) {
      try {
        const compressed = await compressImage(f);
        _photos.push(compressed);
      } catch { toast(`Could not read ${f.name}`, 'error'); }
    }
    renderPhotos();
  });

  /* Doc drop */
  makeFileDrop(document.getElementById('doc-drop'), '*/*', async files => {
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) { toast(`${f.name} is over 10 MB — skip`, 'error'); continue; }
      try {
        const doc = await readFile(f);
        _documents.push(doc);
      } catch { toast(`Could not read ${f.name}`, 'error'); }
    }
    renderDocs();
  });

  renderPhotos();
  renderDocs();

  /* Add client shortcut */
  document.getElementById('nj-add-client')?.addEventListener('click', e => {
    e.preventDefault();
    navigate('clients', { add: true });
  });

  /* Cancel */
  document.getElementById('nj-cancel').addEventListener('click', () => navigate('jobs'));

  /* Save */
  document.getElementById('nj-save').addEventListener('click', saveJobHandler);
}

/* ── Checklist render ──────────────────────────────── */
function renderChecklist() {
  const wrap = document.getElementById('checklist-wrap');
  if (!wrap) return;
  wrap.innerHTML = _checklist.map((item, i) => `
    <div class="checklist-item" data-idx="${i}">
      <input type="checkbox" id="ci-${i}" ${item.checked ? 'checked' : ''}>
      <input class="form-input checklist-label-input" value="${esc(item.label)}"
        placeholder="Checklist item…" data-idx="${i}"
        style="border:none;background:transparent;padding:0;flex:1;font-size:13px">
      <button class="btn btn-ghost file-item-rm del-check" data-idx="${i}" type="button" title="Remove">✕</button>
    </div>`).join('');

  wrap.querySelectorAll('input[type="checkbox"]').forEach((cb, i) =>
    cb.addEventListener('change', () => { _checklist[i].checked = cb.checked; }));

  wrap.querySelectorAll('.checklist-label-input').forEach(inp =>
    inp.addEventListener('input', () => { _checklist[parseInt(inp.dataset.idx)].label = inp.value; }));

  wrap.querySelectorAll('.del-check').forEach(btn =>
    btn.addEventListener('click', () => {
      _checklist.splice(parseInt(btn.dataset.idx), 1);
      renderChecklist();
    }));
}

/* ── Photo render ──────────────────────────────────── */
function renderPhotos() {
  const grid = document.getElementById('photo-grid');
  if (!grid) return;
  grid.innerHTML = _photos.map((p, i) => `
    <div class="photo-thumb">
      <img src="${p.dataUrl}" alt="${esc(p.name)}" loading="lazy">
      <div class="photo-thumb-rm del-photo" data-idx="${i}" title="Remove">✕</div>
    </div>`).join('');

  grid.querySelectorAll('.del-photo').forEach(btn =>
    btn.addEventListener('click', e => {
      e.stopPropagation();
      _photos.splice(parseInt(btn.dataset.idx), 1);
      renderPhotos();
    }));
}

/* ── Document render ───────────────────────────────── */
function renderDocs() {
  const list = document.getElementById('doc-list');
  if (!list) return;
  list.innerHTML = _documents.map((d, i) => `
    <div class="file-item">
      <div class="file-item-icon">${fileIcon(d.name)}</div>
      <div class="file-item-info">
        <div class="file-item-name">${esc(d.name)}</div>
        <div class="file-item-size">${fmtBytes(d.size)}</div>
      </div>
      <span class="file-item-rm del-doc" data-idx="${i}" title="Remove">✕</span>
    </div>`).join('');

  list.querySelectorAll('.del-doc').forEach(btn =>
    btn.addEventListener('click', () => {
      _documents.splice(parseInt(btn.dataset.idx), 1);
      renderDocs();
    }));
}

/* ── Save ──────────────────────────────────────────── */
async function saveJobHandler() {
  const clientId = document.getElementById('nj-client').value;
  const date     = document.getElementById('nj-date').value;

  if (!clientId) { toast('Please select a client', 'error'); return; }
  if (!date)     { toast('Please set a date', 'error'); return; }

  const clients  = getClients();
  const client   = clients.find(c => c.id === clientId);
  const jobTypes = Array.from(document.querySelectorAll('.check-chip.on')).map(c => c.dataset.type);

  const existing = window._editingJobId ? getJob(window._editingJobId) : null;

  const job = {
    ...(existing || {}),
    clientId,
    clientName:    client?.name || '',
    clientAddress: client ? `${client.address}, ${client.suburb} WA ${client.postcode}` : '',
    date,
    status:        document.getElementById('nj-status').value,
    priority:      document.getElementById('nj-priority').value,
    technician:    document.getElementById('nj-tech').value.trim(),
    timeIn:        document.getElementById('nj-timein').value,
    timeOut:       document.getElementById('nj-timeout').value,
    jobTypes,
    notes:         document.getElementById('nj-notes').value.trim(),
    internalNotes: document.getElementById('nj-internal').value.trim(),
    checklist:     _checklist,
    photos:        _photos,
    documents:     _documents,
  };

  try {
    saveJob(job);
    updateBadges();
    toast(existing ? 'Job updated!' : 'Job saved!', 'success');
    navigate('jobs');
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      toast('Storage full! Try removing some photos/documents.', 'error');
    } else {
      toast('Error saving job', 'error');
      console.error(e);
    }
  }
}

/* ── Tiny helpers ──────────────────────────────────── */
function fileIcon(name='') {
  const ext = name.split('.').pop().toLowerCase();
  const m={pdf:'📄',doc:'📝',docx:'📝',xls:'📊',xlsx:'📊',txt:'📃',csv:'📊',zip:'🗜',rar:'🗜',png:'🖼',jpg:'🖼',jpeg:'🖼',gif:'🖼'};
  return m[ext]||'📁';
}
function fmtBytes(b){
  if(!b)return'';if(b<1024)return`${b} B`;if(b<1048576)return`${(b/1024).toFixed(1)} KB`;return`${(b/1048576).toFixed(1)} MB`;
}
