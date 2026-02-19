import { getJobs } from '../storage.js';
import { fmtDate, fmtBytes, esc } from '../utils.js';

const navigate = (...a) => window.navigate(...a);

export function render(el) {
  document.getElementById('page-title').textContent = 'Documents';
  document.getElementById('topbar-actions').innerHTML = `
    <div class="search-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
      </svg>
      <input class="search-input" id="doc-search" placeholder="Search documents…">
    </div>
    <select class="form-select" id="doc-type-filter" style="width:auto;padding:6px 28px 6px 10px;font-size:12.5px">
      <option value="">All Types</option>
      <option value="photo">Photos</option>
      <option value="document">Documents</option>
    </select>`;

  renderDocs(el, '', '');

  document.getElementById('doc-search').addEventListener('input', e =>
    renderDocs(el, e.target.value, document.getElementById('doc-type-filter').value));
  document.getElementById('doc-type-filter').addEventListener('change', e =>
    renderDocs(el, document.getElementById('doc-search').value, e.target.value));
}

function renderDocs(el, query, typeFilter) {
  /* Gather all attachments from all jobs */
  const all = [];
  getJobs().forEach(job => {
    if (typeFilter !== 'document') {
      (job.photos || []).forEach(p => all.push({
        type: 'photo', name: p.name, size: p.size, dataUrl: p.dataUrl,
        jobId: job.id, jobNumber: job.jobNumber, clientName: job.clientName, date: job.date,
      }));
    }
    if (typeFilter !== 'photo') {
      (job.documents || []).forEach(d => all.push({
        type: 'document', name: d.name, size: d.size, dataUrl: d.dataUrl, fileType: d.type,
        jobId: job.id, jobNumber: job.jobNumber, clientName: job.clientName, date: job.date,
      }));
    }
  });

  const filtered = query
    ? all.filter(f => `${f.name} ${f.clientName} ${f.jobNumber}`.toLowerCase().includes(query.toLowerCase()))
    : all;

  /* Sort newest first */
  filtered.sort((a,b) => b.date?.localeCompare(a.date));

  const wrap = el.querySelector('#docs-wrap') || (() => {
    const d = document.createElement('div');
    d.id = 'docs-wrap';
    el.appendChild(d);
    return d;
  })();

  if (filtered.length === 0) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📁</div>
        <div class="empty-state-title">${query ? 'No results' : 'No documents yet'}</div>
        <div class="empty-state-desc">${query ? 'Try a different search' : 'Documents and photos attached to jobs will appear here'}</div>
      </div>`;
    return;
  }

  /* Separate photos and docs for display */
  const photos = filtered.filter(f => f.type === 'photo');
  const docs   = filtered.filter(f => f.type === 'document');

  let html = `<div style="display:flex;flex-direction:column;gap:24px">`;

  /* Stats row */
  html += `
    <div class="grid grid-3">
      ${miniStat('Total Files', filtered.length, '#0a84ff')}
      ${miniStat('Photos',      photos.length,   '#30d158')}
      ${miniStat('Documents',   docs.length,      '#bf5af2')}
    </div>`;

  /* Photos grid */
  if (photos.length > 0 && typeFilter !== 'document') {
    html += `
      <div class="card">
        <div class="card-header"><span class="card-title">Photos (${photos.length})</span></div>
        <div class="card-body">
          <div class="photo-grid">
            ${photos.map(p => `
              <div class="photo-thumb" data-job="${p.jobId}" title="${esc(p.name)}\n${esc(p.clientName)} · ${fmtDate(p.date)}" style="cursor:pointer">
                <img src="${p.dataUrl}" alt="${esc(p.name)}" loading="lazy">
                <div style="position:absolute;bottom:0;left:0;right:0;padding:4px 6px;
                  background:linear-gradient(transparent,rgba(0,0,0,.8));
                  font-size:9px;color:#fff;line-height:1.3;pointer-events:none">
                  ${esc(p.jobNumber)}<br>${esc(p.clientName)}
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  /* Documents list */
  if (docs.length > 0 && typeFilter !== 'photo') {
    html += `
      <div class="card">
        <div class="card-header"><span class="card-title">Documents (${docs.length})</span></div>
        <div class="card-body">
          <div class="file-list">
            ${docs.map(d => `
              <div class="file-item" data-job="${d.jobId}" style="cursor:pointer">
                <div class="file-item-icon">${fileIcon(d.name)}</div>
                <div class="file-item-info">
                  <div class="file-item-name">${esc(d.name)}</div>
                  <div class="file-item-size">
                    ${fmtBytes(d.size)} · <span class="text-accent">${esc(d.jobNumber)}</span> · ${esc(d.clientName)} · ${fmtDate(d.date)}
                  </div>
                </div>
                ${d.dataUrl
                  ? `<a href="${d.dataUrl}" download="${esc(d.name)}" class="btn btn-ghost btn-icon btn-sm" title="Download" onclick="event.stopPropagation()">⬇</a>`
                  : ''}
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  }

  html += '</div>';
  wrap.innerHTML = html;

  /* Click photo → lightbox */
  wrap.querySelectorAll('.photo-thumb').forEach(th => {
    th.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      const img = th.querySelector('img');
      const ov  = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;z-index:9000;cursor:zoom-out;flex-direction:column;gap:10px';
      ov.innerHTML = `
        <img src="${img.src}" style="max-width:92vw;max-height:84vh;border-radius:8px;object-fit:contain">
        <div style="font-size:12px;color:rgba(255,255,255,.5)">${th.title.split('\n').join(' · ')}</div>`;
      ov.addEventListener('click', () => ov.remove());
      document.body.appendChild(ov);
    });
  });

  /* Click doc row → open job */
  wrap.querySelectorAll('.file-item[data-job]').forEach(item =>
    item.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      navigate('jobs', { jobId: item.dataset.job });
    }));
}

function fileIcon(name='') {
  const ext = name.split('.').pop().toLowerCase();
  const m={pdf:'📄',doc:'📝',docx:'📝',xls:'📊',xlsx:'📊',txt:'📃',csv:'📊',zip:'🗜',rar:'🗜',png:'🖼',jpg:'🖼',jpeg:'🖼',gif:'🖼'};
  return m[ext]||'📁';
}

function miniStat(label, val, color) {
  return `
    <div class="card">
      <div class="card-body" style="padding:14px 18px">
        <div style="font-size:24px;font-weight:800;color:${color};letter-spacing:-.5px">${val}</div>
        <div style="font-size:12px;color:var(--text-2)">${label}</div>
      </div>
    </div>`;
}
