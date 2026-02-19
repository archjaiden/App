import { getClients, saveClient, deleteClient, getJobsForClient } from '../storage.js';
import { toast, openModal, closeModal, confirm, esc, fmtDate, geocodeAddress } from '../utils.js';

const navigate = (...a) => window.navigate(...a);

export function render(el, params = {}) {
  document.getElementById('page-title').textContent = 'Clients';
  document.getElementById('topbar-actions').innerHTML = `
    <div class="search-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
      </svg>
      <input class="search-input" id="client-search" placeholder="Search clients…">
    </div>
    <button class="btn btn-primary" id="add-client-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
      </svg>
      Add Client
    </button>`;

  renderTable(el, '');

  document.getElementById('add-client-btn').addEventListener('click', () => openClientModal(el));
  document.getElementById('client-search').addEventListener('input', e => renderTable(el, e.target.value));

  if (params.add) openClientModal(el);
}

/* ── Table ─────────────────────────────────────────── */
function renderTable(el, query) {
  const clients = getClients().filter(c =>
    !query || `${c.name} ${c.suburb} ${c.contact} ${c.email} ${c.phone}`
      .toLowerCase().includes(query.toLowerCase()));

  const wrap = el.querySelector('#client-table-wrap') || (() => {
    const d = document.createElement('div');
    d.id = 'client-table-wrap';
    el.appendChild(d);
    return d;
  })();

  if (clients.length === 0) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <div class="empty-state-title">${query ? 'No results' : 'No clients yet'}</div>
        <div class="empty-state-desc">${query ? 'Try a different search' : 'Add your first client to get started'}</div>
      </div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Contact</th>
            <th>Phone</th>
            <th>Suburb</th>
            <th>Jobs</th>
            <th>Added</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${clients.map(c => {
            const jobCount = getJobsForClient(c.id).length;
            return `
              <tr data-id="${c.id}" class="client-row">
                <td>
                  <div style="font-weight:600">${esc(c.name)}</div>
                  ${c.tags?.length ? `<div class="tag-strip mt-4">${c.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
                </td>
                <td>${esc(c.contact || '—')}</td>
                <td style="white-space:nowrap">${esc(c.phone || '—')}</td>
                <td>${esc(c.suburb || '—')}</td>
                <td>
                  <span class="badge ${jobCount ? 'badge-blue' : 'badge-gray'}">${jobCount}</span>
                </td>
                <td class="text-muted text-sm">${fmtDate(c.createdAt)}</td>
                <td style="text-align:right;white-space:nowrap">
                  <button class="btn btn-ghost btn-icon btn-sm edit-client" data-id="${c.id}" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/>
                    </svg>
                  </button>
                  <button class="btn btn-ghost btn-icon btn-sm del-client" data-id="${c.id}" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var(--red)">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                    </svg>
                  </button>
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

  /* Row click → view jobs for client */
  wrap.querySelectorAll('.client-row').forEach(row =>
    row.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      navigate('jobs', { clientId: row.dataset.id });
    }));

  wrap.querySelectorAll('.edit-client').forEach(btn =>
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openClientModal(el, btn.dataset.id);
    }));

  wrap.querySelectorAll('.del-client').forEach(btn =>
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const ok = await confirm('Delete this client? Associated jobs will not be deleted.');
      if (!ok) return;
      deleteClient(btn.dataset.id);
      toast('Client deleted', 'info');
      renderTable(el, document.getElementById('client-search')?.value || '');
    }));
}

/* ── Add / Edit Modal ──────────────────────────────── */
function openClientModal(el, editId = null) {
  const existing = editId ? getClients().find(c => c.id === editId) : null;
  const v = existing || {};

  const body = `
    <div class="form-row">
      <div class="form-group full">
        <label class="form-label">Company / Client Name *</label>
        <input class="form-input" id="cf-name" value="${esc(v.name||'')}" placeholder="e.g. Acme Corp">
      </div>
      <div class="form-group">
        <label class="form-label">Contact Person</label>
        <input class="form-input" id="cf-contact" value="${esc(v.contact||'')}" placeholder="Full name">
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-input" id="cf-phone" value="${esc(v.phone||'')}" placeholder="08 xxxx xxxx">
      </div>
      <div class="form-group full">
        <label class="form-label">Email</label>
        <input class="form-input" id="cf-email" value="${esc(v.email||'')}" placeholder="email@domain.com.au">
      </div>
      <div class="form-group full">
        <label class="form-label">Street Address</label>
        <input class="form-input" id="cf-addr" value="${esc(v.address||'')}" placeholder="123 Example St">
      </div>
      <div class="form-group">
        <label class="form-label">Suburb</label>
        <input class="form-input" id="cf-suburb" value="${esc(v.suburb||'')}" placeholder="Perth">
      </div>
      <div class="form-group">
        <label class="form-label">Postcode</label>
        <input class="form-input" id="cf-postcode" value="${esc(v.postcode||'')}" placeholder="6000">
      </div>
      <div class="form-group">
        <label class="form-label">Lat (auto-filled)</label>
        <input class="form-input" id="cf-lat" value="${v.lat||''}" placeholder="−31.9505" type="number" step="any">
      </div>
      <div class="form-group">
        <label class="form-label">Lng (auto-filled)</label>
        <input class="form-input" id="cf-lng" value="${v.lng||''}" placeholder="115.8605" type="number" step="any">
      </div>
      <div class="form-group full">
        <label class="form-label">Tags (comma separated)</label>
        <input class="form-input" id="cf-tags" value="${esc((v.tags||[]).join(', '))}" placeholder="Corporate, Priority">
      </div>
      <div class="form-group full">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="cf-notes" placeholder="Access info, site details…">${esc(v.notes||'')}</textarea>
      </div>
    </div>`;

  const footer = `
    <button class="btn btn-secondary" id="cf-geocode">📍 Geocode Address</button>
    <div style="flex:1"></div>
    <button class="btn btn-secondary" id="cf-cancel">Cancel</button>
    <button class="btn btn-primary"   id="cf-save">${existing ? 'Save Changes' : 'Add Client'}</button>`;

  openModal(existing ? 'Edit Client' : 'Add Client', body, footer, 'modal-lg');

  document.getElementById('cf-cancel').addEventListener('click', closeModal);

  document.getElementById('cf-geocode').addEventListener('click', async () => {
    const btn = document.getElementById('cf-geocode');
    btn.textContent = 'Geocoding…';
    btn.disabled = true;
    const addr    = document.getElementById('cf-addr').value;
    const suburb  = document.getElementById('cf-suburb').value;
    const postcode= document.getElementById('cf-postcode').value;
    const coords  = await geocodeAddress(addr, suburb, postcode);
    btn.textContent = '📍 Geocode Address';
    btn.disabled = false;
    if (coords) {
      document.getElementById('cf-lat').value = coords.lat.toFixed(6);
      document.getElementById('cf-lng').value = coords.lng.toFixed(6);
      toast('Coordinates found!', 'success');
    } else {
      toast('Could not geocode — enter coordinates manually', 'error');
    }
  });

  document.getElementById('cf-save').addEventListener('click', async () => {
    const name = document.getElementById('cf-name').value.trim();
    if (!name) { toast('Client name is required', 'error'); return; }

    const client = {
      ...(existing || {}),
      name,
      contact:  document.getElementById('cf-contact').value.trim(),
      phone:    document.getElementById('cf-phone').value.trim(),
      email:    document.getElementById('cf-email').value.trim(),
      address:  document.getElementById('cf-addr').value.trim(),
      suburb:   document.getElementById('cf-suburb').value.trim(),
      postcode: document.getElementById('cf-postcode').value.trim(),
      lat:      parseFloat(document.getElementById('cf-lat').value) || null,
      lng:      parseFloat(document.getElementById('cf-lng').value) || null,
      notes:    document.getElementById('cf-notes').value.trim(),
      tags:     document.getElementById('cf-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
    };

    // Auto-geocode if address given but no coords
    if (client.address && client.suburb && (!client.lat || !client.lng)) {
      const coords = await geocodeAddress(client.address, client.suburb, client.postcode);
      if (coords) { client.lat = coords.lat; client.lng = coords.lng; }
    }

    saveClient(client);
    closeModal();
    toast(existing ? 'Client updated' : 'Client added', 'success');
    renderTable(el, document.getElementById('client-search')?.value || '');
  });
}
