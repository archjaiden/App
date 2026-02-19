import { getJobs, getClients } from '../storage.js';
import { fmtDate, statusBadge, priorityHtml, esc } from '../utils.js';

const navigate = (...a) => window.navigate(...a);

export function render(el) {
  document.getElementById('page-title').textContent = 'Dashboard';
  document.getElementById('topbar-actions').innerHTML = `
    <button class="btn btn-primary" id="dash-new-job">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
      </svg>
      New Job
    </button>`;
  document.getElementById('dash-new-job')?.addEventListener('click', () => navigate('new-job'));

  const jobs    = getJobs();
  const clients = getClients();

  const total     = jobs.length;
  const active    = jobs.filter(j => j.status === 'in-progress').length;
  const pending   = jobs.filter(j => j.status === 'pending').length;
  const thisWeek  = (() => {
    const now = new Date();
    const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1); mon.setHours(0,0,0,0);
    return jobs.filter(j => new Date(j.date) >= mon).length;
  })();

  const recent = [...jobs].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

  el.innerHTML = `
    <!-- Stats -->
    <div class="grid grid-4">
      ${statCard('Total Jobs',   total,   '#0a84ff', svgBriefcase())}
      ${statCard('In Progress',  active,  '#ff9f0a', svgClock())}
      ${statCard('Pending',      pending, '#bf5af2', svgHourglass())}
      ${statCard('This Week',    thisWeek,'#30d158', svgCalendar())}
    </div>

    <!-- Bottom panels -->
    <div class="grid grid-2 mt-24" style="align-items:start">

      <!-- Recent Jobs -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Recent Jobs</span>
          <button class="btn btn-ghost btn-sm" id="see-all-jobs">See All</button>
        </div>
        ${recent.length === 0
          ? `<div class="empty-state">
               <div class="empty-state-icon">📋</div>
               <div class="empty-state-title">No jobs yet</div>
               <div class="empty-state-desc">Create your first job to get started</div>
             </div>`
          : `<table>
               <thead>
                 <tr>
                   <th>#</th>
                   <th>Date</th>
                   <th>Client</th>
                   <th>Status</th>
                 </tr>
               </thead>
               <tbody>
                 ${recent.map(j => `
                   <tr data-job="${j.id}" class="recent-job-row">
                     <td><span class="job-num">${esc(j.jobNumber)}</span></td>
                     <td>${fmtDate(j.date)}</td>
                     <td class="truncate" style="max-width:140px">${esc(j.clientName)}</td>
                     <td>${statusBadge(j.status)}</td>
                   </tr>`).join('')}
               </tbody>
             </table>`}
      </div>

      <!-- Quick stats + client count -->
      <div style="display:flex;flex-direction:column;gap:16px">
        ${quickStat('Clients', clients.length, '#5ac8f5', 'Registered in system', svgClients())}
        ${quickStat('Completed', jobs.filter(j=>j.status==='completed').length, '#30d158', 'Jobs finished', svgCheck())}
        ${quickStat('Cancelled', jobs.filter(j=>j.status==='cancelled').length, '#ff453a', 'Jobs cancelled', svgX())}

        <!-- Quick actions -->
        <div class="card">
          <div class="card-header"><span class="card-title">Quick Actions</span></div>
          <div class="card-body" style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-secondary w-full" id="qa-new-job" style="justify-content:flex-start">
              ${svgPlus()} &nbsp;Log a New Job
            </button>
            <button class="btn btn-secondary w-full" id="qa-new-client" style="justify-content:flex-start">
              ${svgPerson()} &nbsp;Add Client
            </button>
            <button class="btn btn-secondary w-full" id="qa-map" style="justify-content:flex-start">
              ${svgMap()} &nbsp;Open Map View
            </button>
          </div>
        </div>
      </div>
    </div>`;

  /* Events */
  el.querySelector('#see-all-jobs')?.addEventListener('click', () => navigate('jobs'));
  el.querySelectorAll('.recent-job-row').forEach(row =>
    row.addEventListener('click', () => navigate('jobs', { jobId: row.dataset.job })));
  el.querySelector('#qa-new-job')?.addEventListener('click',    () => navigate('new-job'));
  el.querySelector('#qa-new-client')?.addEventListener('click', () => navigate('clients', { add: true }));
  el.querySelector('#qa-map')?.addEventListener('click',        () => navigate('map'));
}

/* ── Helpers ─────────────────────────────────────────── */
function statCard(label, value, color, icon) {
  return `
    <div class="stat-card">
      <div class="stat-icon" style="background:${color}1a">${icon}</div>
      <div class="stat-value" style="color:${color}">${value}</div>
      <div class="stat-label">${label}</div>
    </div>`;
}

function quickStat(label, value, color, sub, icon) {
  return `
    <div class="card">
      <div class="card-body" style="display:flex;align-items:center;gap:14px;padding:14px 18px">
        <div class="stat-icon" style="background:${color}1a;margin:0">${icon}</div>
        <div style="flex:1">
          <div style="font-size:22px;font-weight:800;color:${color};letter-spacing:-0.5px">${value}</div>
          <div style="font-size:12px;color:var(--text-2)">${label} — ${sub}</div>
        </div>
      </div>
    </div>`;
}

/* ── Inline SVGs ─────────────────────────────────────── */
function svg(path, vb='0 0 24 24') {
  return `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18">${path}</svg>`;
}
function svgBriefcase(){ return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"/>`); }
function svgClock(){ return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>`); }
function svgHourglass(){ return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/>`); }
function svgCalendar(){ return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>`); }
function svgClients(){ return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>`); }
function svgCheck(){ return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`); }
function svgX(){ return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`); }
function svgPlus(){ return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>`); }
function svgPerson(){ return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>`); }
function svgMap(){ return svg(`<path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/>`); }
