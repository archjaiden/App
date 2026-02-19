import { getJobs, getJob, deleteJob } from '../storage.js';
import { getClients } from '../storage.js';
import { fmtDate, fmtTime, statusBadge, priorityHtml, esc, confirm, toast, openModal, closeModal } from '../utils.js';

const navigate = (...a) => window.navigate(...a);

export function render(el, params = {}) {
  document.getElementById('page-title').textContent = 'Jobs';
  document.getElementById('topbar-actions').innerHTML = `
    <div class="search-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
      </svg>
      <input class="search-input" id="jobs-search" placeholder="Search jobs…">
    </div>
    <button class="btn btn-primary" id="new-job-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
      </svg>
      New Job
    </button>`;

  /* Filter row */
  const clients = getClients();
  el.innerHTML = `
    <div class="filter-row mb-16">
      <select class="form-select" id="flt-status">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <select class="form-select" id="flt-priority">
        <option value="">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select class="form-select" id="flt-client">
        <option value="">All Clients</option>
        ${clients.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}
      </select>
    </div>
    <div id="jobs-table-wrap"></div>`;

  /* Pre-apply filters from params */
  if (params.clientId) document.getElementById('flt-client').value = params.clientId;

  applyFilters(el, params.jobId);

  /* Events */
  document.getElementById('new-job-btn').addEventListener('click', () => navigate('new-job'));
  document.getElementById('jobs-search').addEventListener('input', () => applyFilters(el));
  ['flt-status','flt-priority','flt-client'].forEach(id =>
    document.getElementById(id)?.addEventListener('change', () => applyFilters(el)));

  if (params.jobId) setTimeout(() => openJobDetail(params.jobId, el), 100);
}

/* ── Filtered table ───────────────────────────────── */
function applyFilters(el, openId) {
  const q        = document.getElementById('jobs-search')?.value?.toLowerCase() || '';
  const status   = document.getElementById('flt-status')?.value   || '';
  const priority = document.getElementById('flt-priority')?.value || '';
  const clientId = document.getElementById('flt-client')?.value   || '';

  let jobs = getJobs();
  if (status)   jobs = jobs.filter(j => j.status === status);
  if (priority) jobs = jobs.filter(j => j.priority === priority);
  if (clientId) jobs = jobs.filter(j => j.clientId === clientId);
  if (q) jobs = jobs.filter(j =>
    `${j.jobNumber} ${j.clientName} ${j.notes} ${(j.jobTypes||[]).join(' ')}`
      .toLowerCase().includes(q));

  const wrap = el.querySelector('#jobs-table-wrap');

  if (jobs.length === 0) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">No jobs found</div>
        <div class="empty-state-desc">Adjust filters or create a new job</div>
      </div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Client</th>
            <th>Job Types</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Time</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${jobs.map(j => `
            <tr data-id="${j.id}" class="job-row">
              <td><span class="job-num">${esc(j.jobNumber)}</span></td>
              <td style="white-space:nowrap">${fmtDate(j.date)}</td>
              <td style="max-width:160px" class="truncate">${esc(j.clientName || '—')}</td>
              <td style="max-width:220px">
                <div class="tag-strip">
                  ${(j.jobTypes||[]).slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}
                  ${j.jobTypes?.length > 3 ? `<span class="tag">+${j.jobTypes.length-3}</span>` : ''}
                </div>
              </td>
              <td>${statusBadge(j.status)}</td>
              <td>${priorityHtml(j.priority)}</td>
              <td class="text-muted text-sm" style="white-space:nowrap">
                ${j.timeIn ? fmtTime(j.timeIn) : '—'}
                ${j.timeOut ? ` → ${fmtTime(j.timeOut)}` : ''}
              </td>
              <td style="text-align:right;white-space:nowrap">
                <button class="btn btn-ghost btn-icon btn-sm edit-job" data-id="${j.id}" title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/>
                  </svg>
                </button>
                <button class="btn btn-ghost btn-icon btn-sm del-job" data-id="${j.id}" title="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var(--red)">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                  </svg>
                </button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  wrap.querySelectorAll('.job-row').forEach(row =>
    row.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      openJobDetail(row.dataset.id, el);
    }));

  wrap.querySelectorAll('.edit-job').forEach(btn =>
    btn.addEventListener('click', e => {
      e.stopPropagation();
      navigate('new-job', { editId: btn.dataset.id });
    }));

  wrap.querySelectorAll('.del-job').forEach(btn =>
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const ok = await confirm('Permanently delete this job record? This cannot be undone.');
      if (!ok) return;
      deleteJob(btn.dataset.id);
      toast('Job deleted', 'info');
      applyFilters(el);
    }));
}

/* ── Job Detail Modal ─────────────────────────────── */
function openJobDetail(id, el) {
  const j = getJob(id);
  if (!j) return;

  const body = `
    <div class="detail-grid">
      <span class="detail-key">Job #</span>   <span class="detail-val font-semibold">${esc(j.jobNumber)}</span>
      <span class="detail-key">Date</span>     <span class="detail-val">${fmtDate(j.date)}</span>
      <span class="detail-key">Client</span>   <span class="detail-val">${esc(j.clientName || '—')}</span>
      <span class="detail-key">Address</span>  <span class="detail-val text-muted">${esc(j.clientAddress || '—')}</span>
      <span class="detail-key">Status</span>   <span class="detail-val">${statusBadge(j.status)}</span>
      <span class="detail-key">Priority</span> <span class="detail-val">${priorityHtml(j.priority)}</span>
      <span class="detail-key">Technician</span><span class="detail-val">${esc(j.technician || '—')}</span>
      <span class="detail-key">Time</span>     <span class="detail-val">${j.timeIn ? fmtTime(j.timeIn) : '—'}${j.timeOut ? ` → ${fmtTime(j.timeOut)}` : ''}</span>
    </div>

    ${j.jobTypes?.length ? `
      <div>
        <div class="section-title mt-16">Job Types</div>
        <div class="tag-strip">${j.jobTypes.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
      </div>` : ''}

    ${j.notes ? `
      <div>
        <div class="section-title mt-16">Notes</div>
        <p style="font-size:13.5px;line-height:1.7;color:var(--text-2);white-space:pre-wrap">${esc(j.notes)}</p>
      </div>` : ''}

    ${j.internalNotes ? `
      <div>
        <div class="section-title mt-16">Internal Notes</div>
        <p style="font-size:13.5px;line-height:1.7;color:var(--text-2);white-space:pre-wrap">${esc(j.internalNotes)}</p>
      </div>` : ''}

    ${j.checklist?.length ? `
      <div>
        <div class="section-title mt-16">Checklist</div>
        <div class="checklist">
          ${j.checklist.map(item => `
            <div class="checklist-item ${item.checked ? 'done' : ''}">
              <span style="font-size:14px">${item.checked ? '✅' : '⬜'}</span>
              <label>${esc(item.label)}</label>
            </div>`).join('')}
        </div>
      </div>` : ''}

    ${j.photos?.length ? `
      <div>
        <div class="section-title mt-16">Photos (${j.photos.length})</div>
        <div class="photo-grid">
          ${j.photos.map(p => `
            <div class="photo-thumb" title="${esc(p.name)}">
              <img src="${p.dataUrl}" alt="${esc(p.name)}" loading="lazy">
            </div>`).join('')}
        </div>
      </div>` : ''}

    ${j.documents?.length ? `
      <div>
        <div class="section-title mt-16">Documents (${j.documents.length})</div>
        <div class="file-list">
          ${j.documents.map(d => `
            <div class="file-item">
              <div class="file-item-icon">${fileIcon(d.name)}</div>
              <div class="file-item-info">
                <div class="file-item-name">${esc(d.name)}</div>
                <div class="file-item-size">${fmtBytes(d.size)}</div>
              </div>
              ${d.dataUrl ? `<a href="${d.dataUrl}" download="${esc(d.name)}" class="btn btn-ghost btn-icon btn-sm" title="Download">⬇</a>` : ''}
            </div>`).join('')}
        </div>
      </div>` : ''}`;

  const footer = `
    <button class="btn btn-secondary" id="jd-close">Close</button>
    <button class="btn btn-primary"   id="jd-edit" data-id="${j.id}">Edit Job</button>`;

  openModal(`${j.jobNumber} — ${esc(j.clientName || 'Job Detail')}`, body, footer, 'modal-lg');
  document.getElementById('jd-close').addEventListener('click', closeModal);
  document.getElementById('jd-edit').addEventListener('click', () => {
    closeModal();
    navigate('new-job', { editId: j.id });
  });

  /* Photo lightbox */
  document.querySelectorAll('.photo-thumb').forEach(th =>
    th.addEventListener('click', () => {
      const img = th.querySelector('img');
      const ov  = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;z-index:9000;cursor:zoom-out';
      ov.innerHTML = `<img src="${img.src}" style="max-width:92vw;max-height:90vh;border-radius:8px;object-fit:contain">`;
      ov.addEventListener('click', () => ov.remove());
      document.body.appendChild(ov);
    }));
}

/* ── helpers (duplicated locally to avoid circular) ── */
function fileIcon(name='') {
  const ext = name.split('.').pop().toLowerCase();
  const m={pdf:'📄',doc:'📝',docx:'📝',xls:'📊',xlsx:'📊',txt:'📃',csv:'📊',zip:'🗜',rar:'🗜',png:'🖼',jpg:'🖼',jpeg:'🖼',gif:'🖼'};
  return m[ext]||'📁';
}
function fmtBytes(b){
  if(b<1024)return`${b} B`;if(b<1048576)return`${(b/1024).toFixed(1)} KB`;return`${(b/1048576).toFixed(1)} MB`;
}
