import { getClients } from '../storage.js';
import { getJobsForClient } from '../storage.js';
import { esc } from '../utils.js';

const navigate = (...a) => window.navigate(...a);

let mapInstance = null;

export function render(el) {
  document.getElementById('page-title').textContent = 'Map';
  document.getElementById('topbar-actions').innerHTML = `
    <button class="btn btn-secondary" id="map-refresh">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
      </svg>
      Refresh Markers
    </button>`;

  /* Map lives outside .page-content so it can be full height */
  el.style.padding = '0';
  el.style.overflow = 'hidden';

  el.innerHTML = `
    <div id="map-wrap">
      <div id="map"></div>
      <!-- Side panel -->
      <div id="map-panel" style="
        width:280px;flex-shrink:0;
        background:var(--bg-1);border-left:1px solid var(--border);
        display:flex;flex-direction:column;overflow:hidden">
        <div style="padding:14px 16px;border-bottom:1px solid var(--border)">
          <div style="font-weight:700;font-size:13px;margin-bottom:6px">Clients in WA</div>
          <input class="search-input" id="map-search" placeholder="Filter clients…" style="width:100%;border-radius:6px">
        </div>
        <div id="map-client-list" style="overflow-y:auto;flex:1;padding:8px"></div>
      </div>
    </div>`;

  initMap();

  document.getElementById('map-refresh').addEventListener('click', () => {
    refreshMarkers();
  });

  document.getElementById('map-search').addEventListener('input', e => {
    renderClientList(e.target.value);
  });
}

/* ── Map setup ──────────────────────────────────────── */
const MARKERS = [];

function initMap() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  /* WA default: Perth */
  mapInstance = L.map('map', {
    center: [-28.5, 121.6], // WA centre
    zoom: 5,
    zoomControl: true,
  });

  /* Dark CartoDB tiles */
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(mapInstance);

  refreshMarkers();
}

function refreshMarkers() {
  MARKERS.forEach(m => m.remove());
  MARKERS.length = 0;

  const clients = getClients();
  const mapped  = clients.filter(c => c.lat && c.lng);
  const missing = clients.filter(c => !c.lat || !c.lng);

  mapped.forEach(client => {
    const jobs     = getJobsForClient(client.id);
    const active   = jobs.filter(j => j.status === 'in-progress').length;
    const completed= jobs.filter(j => j.status === 'completed').length;

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        background:${active ? 'var(--orange)' : 'var(--accent)'};
        color:#fff;
        font-size:11px;
        font-weight:700;
        border-radius:50%;
        width:28px;height:28px;
        display:flex;align-items:center;justify-content:center;
        border:2px solid rgba(255,255,255,.3);
        box-shadow:0 2px 8px rgba(0,0,0,.5);
        cursor:pointer;
        font-family:-apple-system,sans-serif;
      ">${jobs.length}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([client.lat, client.lng], { icon }).addTo(mapInstance);

    marker.bindPopup(`
      <div style="min-width:200px;font-family:-apple-system,sans-serif">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">${esc(client.name)}</div>
        <div style="font-size:12px;color:#aaa;margin-bottom:8px">${esc(client.address)}, ${esc(client.suburb)}</div>
        ${client.contact ? `<div style="font-size:12px;margin-bottom:2px">👤 ${esc(client.contact)}</div>` : ''}
        ${client.phone   ? `<div style="font-size:12px;margin-bottom:2px">📞 ${esc(client.phone)}</div>` : ''}
        <hr style="border:none;border-top:1px solid rgba(255,255,255,.1);margin:8px 0">
        <div style="font-size:12px;color:#aaa">
          ${jobs.length} job${jobs.length!==1?'s':''} total
          ${active ? `· <span style="color:var(--orange)">${active} active</span>` : ''}
          ${completed ? `· <span style="color:var(--green)">${completed} done</span>` : ''}
        </div>
        <div style="margin-top:8px;display:flex;gap:6px">
          <button onclick="window._mapNavigate('jobs','${client.id}')"
            style="background:var(--accent);color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;font-weight:600">
            View Jobs
          </button>
          <button onclick="window._mapNavigate('clients')"
            style="background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer">
            Edit Client
          </button>
        </div>
      </div>`, { maxWidth: 260 });

    MARKERS.push(marker);
  });

  /* Fit to all markers */
  if (mapped.length > 0) {
    const group = L.featureGroup(MARKERS);
    mapInstance.fitBounds(group.getBounds().pad(0.15), { maxZoom: 12 });
  }

  /* Attach popup nav bridge */
  window._mapNavigate = (view, clientId) => {
    if (view === 'jobs' && clientId) navigate('jobs', { clientId });
    else navigate(view);
  };

  renderClientList('');

  if (missing.length > 0) {
    const msg = document.getElementById('map-missing-msg');
    if (!msg) {
      const panel = document.getElementById('map-panel');
      const note  = document.createElement('div');
      note.id = 'map-missing-msg';
      note.style.cssText = 'padding:10px 14px;background:rgba(255,159,10,.08);border-top:1px solid rgba(255,159,10,.2);font-size:11.5px;color:var(--orange)';
      note.textContent   = `${missing.length} client${missing.length>1?'s':''} missing coordinates — edit them to geocode`;
      panel.appendChild(note);
    }
  }
}

/* ── Side panel list ────────────────────────────────── */
function renderClientList(query) {
  const listEl = document.getElementById('map-client-list');
  if (!listEl) return;

  const clients = getClients().filter(c =>
    !query || `${c.name} ${c.suburb}`.toLowerCase().includes(query.toLowerCase()));

  listEl.innerHTML = clients.map(c => {
    const hasCords = c.lat && c.lng;
    const jobs     = getJobsForClient(c.id);
    return `
      <div class="map-client-item" data-id="${c.id}" data-lat="${c.lat||''}" data-lng="${c.lng||''}"
        style="padding:10px 12px;border-radius:8px;cursor:pointer;transition:.15s;margin-bottom:4px;
               border:1px solid transparent;">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:8px;height:8px;border-radius:50%;background:${hasCords?'var(--green)':'var(--text-3)'};flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</div>
            <div style="font-size:11px;color:var(--text-2)">${esc(c.suburb||'—')} · ${jobs.length} job${jobs.length!==1?'s':''}</div>
          </div>
        </div>
      </div>`;
  }).join('') || `<div style="padding:20px;text-align:center;color:var(--text-3);font-size:13px">No clients</div>`;

  listEl.querySelectorAll('.map-client-item').forEach(item => {
    item.addEventListener('mouseenter', () => item.style.background = 'rgba(255,255,255,.04)');
    item.addEventListener('mouseleave', () => item.style.background = '');
    item.addEventListener('click', () => {
      const lat = parseFloat(item.dataset.lat);
      const lng = parseFloat(item.dataset.lng);
      if (lat && lng && mapInstance) {
        mapInstance.flyTo([lat, lng], 15, { duration: 1 });
        const marker = MARKERS.find(m => {
          const ll = m.getLatLng();
          return Math.abs(ll.lat - lat) < 0.001 && Math.abs(ll.lng - lng) < 0.001;
        });
        marker?.openPopup();
      } else {
        navigate('clients');
      }
    });
  });
}

/* Cleanup on navigate away */
export function cleanup() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
  MARKERS.length = 0;
}
