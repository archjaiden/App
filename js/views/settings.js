import { getSettings, saveSettings, clearAll, storageUsage } from '../storage.js';
import { JOB_TYPES } from '../data.js';
import { toast, esc, fmtBytes, confirm } from '../utils.js';

const navigate     = (...a) => window.navigate(...a);
const updateBadges = ()     => window.updateBadges?.();

let activeTab = 'general';

export function render(el, params = {}) {
  document.getElementById('page-title').textContent = 'Settings';
  document.getElementById('topbar-actions').innerHTML = `
    <button class="btn btn-primary" id="save-settings-btn">Save Settings</button>`;

  if (params.tab) activeTab = params.tab;

  el.innerHTML = `
    <div style="max-width:760px">
      <div class="tabs">
        <button class="tab-btn ${activeTab==='general'?'active':''}"   data-tab="general">General</button>
        <button class="tab-btn ${activeTab==='jobtypes'?'active':''}"  data-tab="jobtypes">Job Types</button>
        <button class="tab-btn ${activeTab==='data'?'active':''}"      data-tab="data">Data & Storage</button>
      </div>
      <div id="tab-content"></div>
    </div>`;

  renderTab(el, activeTab);

  el.querySelectorAll('.tab-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      el.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b===btn));
      renderTab(el, activeTab);
    }));

  document.getElementById('save-settings-btn').addEventListener('click', () => saveAll(el));
}

function renderTab(el, tab) {
  const content = el.querySelector('#tab-content');
  const s = getSettings();

  if (tab === 'general') {
    content.innerHTML = `
      <div class="card">
        <div class="card-header"><span class="card-title">Technician Profile</span></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Your Name</label>
              <input class="form-input" id="s-name" value="${esc(s.technicianName||'')}" placeholder="Full name">
            </div>
            <div class="form-group">
              <label class="form-label">Company</label>
              <input class="form-input" id="s-company" value="${esc(s.company||'')}" placeholder="Company name">
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" id="s-phone" value="${esc(s.phone||'')}" placeholder="04xx xxx xxx">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" id="s-email" value="${esc(s.email||'')}" placeholder="you@example.com">
            </div>
          </div>
        </div>
      </div>`;
    return;
  }

  if (tab === 'jobtypes') {
    const customTypes = s.jobTypes || JOB_TYPES;
    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Available Job Types</span>
          <button class="btn btn-ghost btn-sm" id="reset-types">Reset to Defaults</button>
        </div>
        <div class="card-body">
          <p style="font-size:12.5px;color:var(--text-2);margin-bottom:14px">
            These appear as checkboxes on the New Job form. Add custom types below.
          </p>
          <div id="types-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
            ${customTypes.map((t, i) => `
              <div class="file-item" data-idx="${i}" style="cursor:default">
                <div class="file-item-info"><span style="font-size:13px">${esc(t)}</span></div>
                <span class="file-item-rm del-type" data-idx="${i}" title="Remove">✕</span>
              </div>`).join('')}
          </div>
          <div style="display:flex;gap:8px">
            <input class="form-input" id="new-type-input" placeholder="Add custom job type…" style="flex:1">
            <button class="btn btn-secondary" id="add-type-btn">Add</button>
          </div>
        </div>
      </div>`;

    /* Local mutable copy */
    let localTypes = [...customTypes];

    function rerender() {
      const list = content.querySelector('#types-list');
      list.innerHTML = localTypes.map((t, i) => `
        <div class="file-item" data-idx="${i}" style="cursor:default">
          <div class="file-item-info"><span style="font-size:13px">${esc(t)}</span></div>
          <span class="file-item-rm del-type" data-idx="${i}" title="Remove">✕</span>
        </div>`).join('');
      list.querySelectorAll('.del-type').forEach(btn =>
        btn.addEventListener('click', () => {
          localTypes.splice(parseInt(btn.dataset.idx), 1);
          rerender();
        }));
    }
    rerender();

    content.querySelector('#add-type-btn').addEventListener('click', () => {
      const v = content.querySelector('#new-type-input').value.trim();
      if (!v) return;
      if (localTypes.includes(v)) { toast('Already in list', 'error'); return; }
      localTypes.push(v);
      content.querySelector('#new-type-input').value = '';
      rerender();
    });
    content.querySelector('#new-type-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') content.querySelector('#add-type-btn').click();
    });
    content.querySelector('#reset-types').addEventListener('click', () => {
      localTypes = [...JOB_TYPES];
      rerender();
      toast('Reset to defaults', 'info');
    });

    /* Intercept save to grab localTypes */
    document.getElementById('save-settings-btn').onclick = () => {
      const s = getSettings();
      s.jobTypes = localTypes;
      saveSettings(s);
      toast('Job types saved', 'success');
    };
    return;
  }

  if (tab === 'data') {
    const used = storageUsage();
    const pct  = Math.min(Math.round(used / (5*1024*1024) * 100), 100);

    content.innerHTML = `
      <div class="card">
        <div class="card-header"><span class="card-title">Storage Usage</span></div>
        <div class="card-body">
          <div style="margin-bottom:10px;font-size:13px">
            <strong>${fmtBytes(used)}</strong> used of ~5 MB localStorage limit
          </div>
          <div style="background:var(--bg-3);border-radius:10px;height:8px;overflow:hidden">
            <div style="background:${pct>85?'var(--red)':pct>60?'var(--orange)':'var(--accent)'};height:100%;width:${pct}%;border-radius:10px;transition:.5s"></div>
          </div>
          <p style="font-size:12px;color:var(--text-2);margin-top:8px">
            Note: Large photos are compressed automatically. Storing too many photos may fill storage.
          </p>
        </div>
      </div>

      <div class="card mt-16">
        <div class="card-header"><span class="card-title">Export / Import</span></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-secondary" id="export-btn">⬇ Export All Data (JSON)</button>
            <span style="font-size:12px;color:var(--text-2)">Downloads a backup of all jobs and clients</span>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-secondary" id="import-btn">⬆ Import Data (JSON)</button>
            <span style="font-size:12px;color:var(--text-2)">Merges imported jobs and clients with existing data</span>
          </div>
        </div>
      </div>

      <div class="card mt-16" style="border-color:rgba(255,69,58,.2)">
        <div class="card-header"><span class="card-title" style="color:var(--red)">Danger Zone</span></div>
        <div class="card-body">
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-danger" id="clear-data-btn">🗑 Clear All Data</button>
            <span style="font-size:12px;color:var(--text-2)">Permanently removes all jobs, clients and settings</span>
          </div>
        </div>
      </div>`;

    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('import-btn').addEventListener('click', importData);
    document.getElementById('clear-data-btn').addEventListener('click', async () => {
      const ok = await confirm('Clear ALL data? This deletes every job, client and setting. This cannot be undone.');
      if (!ok) return;
      clearAll();
      toast('All data cleared', 'info');
      updateBadges();
      navigate('dashboard');
    });
  }
}

function saveAll(el) {
  const s = getSettings();
  const name = document.getElementById('s-name');
  if (name) {
    s.technicianName = name.value.trim();
    s.company  = document.getElementById('s-company').value.trim();
    s.phone    = document.getElementById('s-phone').value.trim();
    s.email    = document.getElementById('s-email').value.trim();
    saveSettings(s);
    /* Update sidebar display */
    const sub = document.getElementById('tech-name-display');
    if (sub) sub.textContent = s.technicianName || 'Field Technician';
    toast('Settings saved', 'success');
  }
}

function exportData() {
  const data = {
    exported:  new Date().toISOString(),
    version:   1,
    jobs:      JSON.parse(localStorage.getItem('td_jobs')    || '[]'),
    clients:   JSON.parse(localStorage.getItem('td_clients') || '[]'),
    settings:  JSON.parse(localStorage.getItem('td_settings')|| '{}'),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `techdoc-export-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Export downloaded', 'success');
}

function importData() {
  const inp    = document.createElement('input');
  inp.type     = 'file';
  inp.accept   = '.json';
  inp.onchange = () => {
    const file = inp.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.jobs || !data.clients) throw new Error('Invalid format');

        /* Merge clients */
        const existing = JSON.parse(localStorage.getItem('td_clients') || '[]');
        const merged   = [...existing];
        data.clients.forEach(c => {
          if (!merged.find(e => e.id === c.id)) merged.push(c);
        });
        localStorage.setItem('td_clients', JSON.stringify(merged));

        /* Merge jobs */
        const exJobs = JSON.parse(localStorage.getItem('td_jobs') || '[]');
        const mergedJ = [...exJobs];
        data.jobs.forEach(j => {
          if (!mergedJ.find(e => e.id === j.id)) mergedJ.push(j);
        });
        localStorage.setItem('td_jobs', JSON.stringify(mergedJ));

        toast(`Imported ${data.clients.length} clients, ${data.jobs.length} jobs`, 'success');
        updateBadges();
        navigate('dashboard');
      } catch (err) {
        toast('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
  };
  inp.click();
}
