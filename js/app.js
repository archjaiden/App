/* TechDoc – combined single-file build (no ES modules) */
'use strict';

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */
var JOB_TYPES = [
  'Desktop Deployment','Laptop Setup','PC Rebuild / Upgrade',
  'Server Installation','Server Maintenance','NAS / Storage Setup',
  'Network Configuration','WiFi Setup','WiFi Troubleshooting','Cabling & Patching','VPN Setup',
  'Software Installation','Windows Update / Patching','Office 365 Setup',
  'Email Configuration','Antivirus / Security','Virus / Malware Removal',
  'Hardware Repair','Hardware Replacement','Printer Setup','Printer Troubleshooting','UPS Installation',
  'CCTV Installation','Security System Setup','Access Control',
  'VoIP / Phone System','Remote Support Setup',
  'Data Backup','Data Recovery','Data Migration',
  'User Account Setup','Active Directory','Remote Desktop',
  'POS System','Site Survey','User Training','General IT Support'
];

var DEFAULT_CHECKLIST = [
  'Check in with site contact','Document existing setup / take photos','Complete work',
  'Test all functionality','Update asset register','Client sign-off obtained','Clean up workspace'
];

var JOB_PRESETS = {
  'Desktop Deployment': [
    'Confirm equipment is on-site',
    'Check in with site contact',
    'Unbox & set up PC / workstation',
    'Install Windows & all drivers',
    'Install required software',
    'Configure user account & email',
    'Join to domain / Azure AD',
    'Test all functionality',
    'Brief user on the new setup',
    'Get client sign-off',
    'Check out with site contact',
    'Clean up workspace'
  ],
  'Laptop Setup': [
    'Confirm equipment is on-site',
    'Check in with site contact',
    'Unbox & set up laptop',
    'Install Windows & all drivers',
    'Install required software',
    'Configure user account & email',
    'Test all functionality & battery',
    'Brief user on the new setup',
    'Get client sign-off',
    'Check out with site contact'
  ],
  'Server Installation': [
    'Confirm equipment & rack space are ready',
    'Check in with site contact',
    'Rack mount & cable server',
    'Install OS & configure storage / RAID',
    'Configure network & static IP',
    'Install server roles & software',
    'Run burn-in / stress test',
    'Document server configuration',
    'Get client sign-off',
    'Check out with site contact'
  ],
  'Network Configuration': [
    'Check in with site contact',
    'Document existing network layout',
    'Configure router / switch / APs',
    'Test all connectivity & speeds',
    'Label all ports & update diagram',
    'Get client sign-off',
    'Check out with site contact'
  ],
  'CCTV Installation': [
    'Confirm camera positions with client',
    'Check in with site contact',
    'Run cabling & mount cameras',
    'Connect cameras to NVR / DVR',
    'Configure recording & motion settings',
    'Test all camera feeds',
    'Show client how to access system',
    'Get client sign-off',
    'Check out with site contact'
  ],
  'General IT Support': [
    'Check in with site contact',
    'Diagnose the reported issue',
    'Resolve issue',
    'Test that the fix works',
    'Document work performed',
    'Get client sign-off',
    'Check out with site contact'
  ]
};

function pad2(n) { return n < 10 ? '0' + n : String(n); }

var STATUS_BADGE = { pending:'badge-gray','in-progress':'badge-orange',completed:'badge-green',cancelled:'badge-red' };

function todayISO() { return new Date().toISOString().slice(0,10); }
function daysAgo(n) { var d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); }

var SAMPLE_CLIENTS = [
  { name:'Pinnacle Mining Solutions', contact:'Sarah Bennett', phone:'08 9481 2200',
    email:'sarah.bennett@pinnaclemining.com.au', address:'1 William Street',
    suburb:'Perth', postcode:'6000', lat:-31.9530, lng:115.8590,
    notes:'Large corporate client — 80+ workstations across 3 floors. Security door entry, contact Sarah on arrival.', tags:['Corporate','Priority'] },
  { name:'Fremantle Medical Centre', contact:'Dr James Nolan', phone:'08 9335 1100',
    email:'admin@fremantlemedical.com.au', address:'12 High Street',
    suburb:'Fremantle', postcode:'6160', lat:-32.0550, lng:115.7480,
    notes:'Medical practice — strict infection control. Do not enter clinical areas without PPE.', tags:['Medical'] },
  { name:'Scarborough Beach Bar & Grill', contact:'Mike Torrisi', phone:'0412 334 009',
    email:'mike@scarboroughbbg.com.au', address:'150 Scarborough Beach Road',
    suburb:'Scarborough', postcode:'6019', lat:-31.8960, lng:115.7590,
    notes:'POS system + CCTV. Best time to service is Tuesday mornings before 10am.', tags:['Hospitality'] },
  { name:'Joondalup City Council IT', contact:'Rachel Kim', phone:'08 9400 4000',
    email:'rkim@joondalup.wa.gov.au', address:'90 Boas Avenue',
    suburb:'Joondalup', postcode:'6027', lat:-31.7432, lng:115.7648,
    notes:'Government — induction required before first visit.', tags:['Government'] },
  { name:'Rockingham Auto Parts', contact:'Dave Carpenter', phone:'08 9527 8811',
    email:'dave@rockauto.com.au', address:'45 Dixon Road',
    suburb:'Rockingham', postcode:'6168', lat:-32.2769, lng:115.7312,
    notes:'Small business — 3 POS terminals and a NAS.', tags:['SMB'] }
];

var SAMPLE_JOBS = [
  { clientIdx:0, date:daysAgo(2), jobTypes:['Desktop Deployment','Office 365 Setup','User Account Setup'],
    status:'completed', priority:'high', timeIn:'08:00', timeOut:'16:30',
    notes:'Deployed 12 new Dell OptiPlex 7090s on Level 3. Installed Windows 11 Pro, Office 365, and configured AD accounts.' },
  { clientIdx:1, date:daysAgo(5), jobTypes:['Server Maintenance','Data Backup'],
    status:'completed', priority:'medium', timeIn:'07:30', timeOut:'10:00',
    notes:'Monthly server maintenance. Replaced failing drive in RAID array, ran full backup to offsite NAS.' },
  { clientIdx:2, date:daysAgo(1), jobTypes:['CCTV Installation','Network Configuration'],
    status:'in-progress', priority:'medium', timeIn:'09:00', timeOut:'17:00',
    notes:'Installing 8-camera CCTV system. Camera 4 and 5 still need cabling through ceiling.' },
  { clientIdx:3, date:todayISO(), jobTypes:['WiFi Troubleshooting','Network Configuration'],
    status:'pending', priority:'low', timeIn:'', timeOut:'',
    notes:'Reported intermittent WiFi dropouts in east wing. Investigate AP coverage.' }
];

/* ═══════════════════════════════════════════════════════
   STORAGE
═══════════════════════════════════════════════════════ */
var K = { JOBS:'td_jobs', CLIENTS:'td_clients', SETTINGS:'td_settings', SEQ:'td_seq' };

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function dbLoad(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e) { return []; } }
function dbSave(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

function nextJobNum() {
  var n = parseInt(localStorage.getItem(K.SEQ) || '0', 10) + 1;
  localStorage.setItem(K.SEQ, String(n));
  return 'JOB-' + (n < 10 ? '000' : n < 100 ? '00' : n < 1000 ? '0' : '') + n;
}

function getClients()  { return dbLoad(K.CLIENTS); }
function getClient(id) { var all=getClients(); for(var i=0;i<all.length;i++) if(all[i].id===id) return all[i]; return null; }
function saveClient(c) {
  var all=getClients();
  if (!c.id) { c.id=genId(); c.createdAt=new Date().toISOString(); }
  c.updatedAt=new Date().toISOString();
  var idx=all.findIndex(function(x){return x.id===c.id;});
  if (idx>=0) all[idx]=c; else all.unshift(c);
  dbSave(K.CLIENTS,all); return c;
}
function deleteClient(id) { dbSave(K.CLIENTS, getClients().filter(function(c){return c.id!==id;})); }

function getJobs()  { return dbLoad(K.JOBS); }
function getJob(id) { var all=getJobs(); for(var i=0;i<all.length;i++) if(all[i].id===id) return all[i]; return null; }
function getJobsForClient(cid) { return getJobs().filter(function(j){return j.clientId===cid;}); }
function saveJob(j) {
  var all=getJobs();
  if (!j.id) {
    j.id=genId(); j.jobNumber=nextJobNum(); j.createdAt=new Date().toISOString();
    if (!j.checklist||!j.checklist.length)
      j.checklist=DEFAULT_CHECKLIST.map(function(lbl){return{id:genId(),label:lbl,checked:false};});
  }
  j.updatedAt=new Date().toISOString();
  var idx=all.findIndex(function(x){return x.id===j.id;});
  if (idx>=0) all[idx]=j; else all.unshift(j);
  dbSave(K.JOBS,all); return j;
}
function deleteJob(id) { dbSave(K.JOBS, getJobs().filter(function(j){return j.id!==id;})); }

function getSettings() {
  try { return Object.assign({technicianName:'',company:'',phone:'',email:'',jobTypes:null}, JSON.parse(localStorage.getItem(K.SETTINGS)||'{}')); }
  catch(e) { return {technicianName:'',company:'',phone:'',email:'',jobTypes:null}; }
}
function saveSettings(s) { localStorage.setItem(K.SETTINGS, JSON.stringify(s)); }
function storageUsage() { var b=0; Object.values(K).forEach(function(k){var v=localStorage.getItem(k);if(v)b+=v.length*2;}); return b; }
function clearAll() { Object.values(K).forEach(function(k){localStorage.removeItem(k);}); }

function seedIfEmpty() {
  if (getClients().length > 0) return;
  var clients = SAMPLE_CLIENTS.map(function(c) {
    return Object.assign({id:genId(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),photos:[],tags:[]}, c);
  });
  dbSave(K.CLIENTS, clients);
  SAMPLE_JOBS.forEach(function(j) {
    var cl=clients[j.clientIdx];
    saveJob({clientId:cl.id,clientName:cl.name,
      clientAddress:cl.address+', '+cl.suburb+' WA '+cl.postcode,
      date:j.date,jobTypes:j.jobTypes,status:j.status,priority:j.priority,
      technician:'',notes:j.notes,internalNotes:'',timeIn:j.timeIn,timeOut:j.timeOut,
      photos:[],documents:[],checklist:[]});
  });
}

/* ═══════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════ */
function esc(s) {
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function toast(msg, type, dur) {
  var icons={success:'✓',error:'✕',info:'ℹ'};
  var el=document.createElement('div');
  el.className='toast toast-'+(type||'info');
  el.innerHTML='<span class="toast-icon">'+(icons[type]||'ℹ')+'</span><span>'+esc(msg)+'</span>';
  document.getElementById('toast-container').appendChild(el);
  setTimeout(function(){el.style.animation='fadeOut .25s ease forwards';setTimeout(function(){el.remove();},260);},dur||3200);
}
function openModal(title, bodyHTML, footerHTML, extraClass) {
  closeModal();
  var ov=document.createElement('div'); ov.className='modal-overlay'; ov.id='modal-overlay';
  ov.innerHTML='<div class="modal '+(extraClass||'')+'" id="modal">'+
    '<div class="modal-header"><span class="modal-title">'+title+'</span>'+
    '<button class="btn btn-ghost btn-icon" id="modal-close-btn">✕</button></div>'+
    '<div class="modal-body">'+bodyHTML+'</div>'+
    (footerHTML?'<div class="modal-footer">'+footerHTML+'</div>':'')+
    '</div>';
  ov.querySelector('#modal-close-btn').addEventListener('click',closeModal);
  ov.addEventListener('click',function(e){if(e.target===ov)closeModal();});
  document.body.appendChild(ov); return ov;
}
function closeModal() { var el=document.getElementById('modal-overlay'); if(el)el.remove(); }
function confirmDlg(msg) {
  return new Promise(function(resolve) {
    var ov=openModal('Confirm','<p style="font-size:14px;color:var(--text-2);line-height:1.6">'+esc(msg)+'</p>',
      '<button class="btn btn-secondary" id="conf-no">Cancel</button><button class="btn btn-danger" id="conf-yes">Delete</button>');
    ov.querySelector('#conf-yes').addEventListener('click',function(){closeModal();resolve(true);});
    ov.querySelector('#conf-no').addEventListener('click',function(){closeModal();resolve(false);});
  });
}
function fmtDate(iso) {
  if (!iso) return '—';
  var d=new Date(iso.length===10?iso+'T00:00:00':iso);
  return d.toLocaleDateString('en-AU',{day:'2-digit',month:'short',year:'numeric'});
}
function fmtTime(t) {
  if (!t) return '';
  var p=t.split(':'),h=parseInt(p[0],10);
  return (h%12||12)+':'+p[1]+' '+(h<12?'AM':'PM');
}
function fmtBytes(b) {
  if (!b) return ''; if(b<1024) return b+' B'; if(b<1048576) return (b/1024).toFixed(1)+' KB'; return (b/1048576).toFixed(1)+' MB';
}
function fileIcon(name) {
  var ext=(name||'').split('.').pop().toLowerCase();
  var images=['png','jpg','jpeg','gif','webp'];
  var archives=['zip','rar'];
  if(images.indexOf(ext)>=0) return icon('camera',16);
  if(archives.indexOf(ext)>=0) return icon('folder',16);
  return icon('doc',16);
}
function statusBadge(status) {
  var cls=STATUS_BADGE[status]||'badge-gray';
  var lbl={pending:'Pending','in-progress':'In Progress',completed:'Completed',cancelled:'Cancelled'};
  return '<span class="badge '+cls+'">'+(lbl[status]||status)+'</span>';
}
function priorityHtml(p) {
  if(!p)return'—';
  return '<span class="priority-dot priority-'+p+'">'+p[0].toUpperCase()+p.slice(1)+'</span>';
}
function svgIcon(path) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="'+path+'"/></svg>';
}
function searchBarHTML(id, ph) {
  return '<div class="search-wrap">'+svgIcon('M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z')+
    '<input class="search-input" id="'+id+'" placeholder="'+ph+'"></div>';
}
function formGrp(full, label, ctrl) {
  return '<div class="form-group '+(full?'full':'')+'"><label class="form-label">'+label+'</label>'+ctrl+'</div>';
}

/* ── SVG icon helper ─────────────────────────── */
var IP = {
  refresh:  'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99',
  clock:    'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  check_c:  'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  users:    'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0',
  camera:   'M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316zM16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zM18.75 10.5h.008v.008h-.008V10.5z',
  clip:     'M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13',
  folder:   'M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44z',
  doc:      'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z',
  dl:       'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
  ul:       'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5',
  trash:    'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0',
  plus:     'M12 4.5v15m7.5-7.5h-15',
  user_add: 'M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766z',
  map:      'M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z',
  list:     'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z',
  clipboard:'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z',
  pencil:   'M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931zm0 0L19.5 7.125',
  play:     'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653z',
  pin:      'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0z',
  phone:    'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z',
  person:   'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  circle:   'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  warn:     'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
};
function icon(name, sz) {
  sz = sz||18;
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="'+sz+'" height="'+sz+'" stroke-linecap="round" stroke-linejoin="round"><path d="'+IP[name]+'"/></svg>';
}

function compressImage(file) {
  return new Promise(function(resolve,reject){
    var reader=new FileReader(); reader.onerror=reject;
    reader.onload=function(e){
      var img=new Image(); img.onerror=reject;
      img.onload=function(){
        var ratio=Math.min(1200/img.width,1),canvas=document.createElement('canvas');
        canvas.width=Math.round(img.width*ratio); canvas.height=Math.round(img.height*ratio);
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        resolve({name:file.name,size:file.size,type:file.type,dataUrl:canvas.toDataURL('image/jpeg',0.72)});
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
function readFileB64(file) {
  return new Promise(function(resolve,reject){
    var reader=new FileReader(); reader.onerror=reject;
    reader.onload=function(e){resolve({name:file.name,size:file.size,type:file.type,dataUrl:e.target.result});};
    reader.readAsDataURL(file);
  });
}
async function geocodeAddress(address,suburb,postcode) {
  var q=encodeURIComponent(address+', '+suburb+' '+postcode+', Western Australia, Australia');
  try {
    var res=await fetch('https://nominatim.openstreetmap.org/search?q='+q+'&format=json&limit=1',{headers:{'Accept-Language':'en','User-Agent':'TechDoc/1.0'}});
    var data=await res.json();
    if(data.length>0) return{lat:parseFloat(data[0].lat),lng:parseFloat(data[0].lon)};
  } catch(e){}
  return null;
}
function makeFileDrop(el,accept,onFiles) {
  el.addEventListener('dragover',function(e){e.preventDefault();el.classList.add('drag-over');});
  el.addEventListener('dragleave',function(){el.classList.remove('drag-over');});
  el.addEventListener('drop',function(e){e.preventDefault();el.classList.remove('drag-over');var f=Array.from(e.dataTransfer.files);if(f.length)onFiles(f);});
  el.addEventListener('click',function(){var inp=document.createElement('input');inp.type='file';inp.accept=accept||'*/*';inp.multiple=true;inp.onchange=function(){onFiles(Array.from(inp.files));};inp.click();});
}

/* ═══════════════════════════════════════════════════════
   ROUTER
═══════════════════════════════════════════════════════ */
var currentView='', _mapInstance=null, _mapMarkers=[], _liveTimerInterval=null;
window.navigate=navigate; // needed for map popup onclick

function navigate(view, params) {
  params=params||{};
  if (currentView==='map'&&view!=='map') cleanupMap();
  if (currentView==='live-job'&&view!=='live-job') {
    if (_liveTimerInterval) { clearInterval(_liveTimerInterval); _liveTimerInterval=null; }
  }
  var content=document.getElementById('page-content');
  content.scrollTop=0;
  if (view==='map') {
    content.style.padding='0'; content.style.overflow='hidden'; content.style.display='';
  } else if (view==='live-job') {
    content.style.padding='0'; content.style.overflow='auto'; content.style.display='flex'; content.style.flexDirection='column';
  } else {
    content.style.padding=''; content.style.overflow=''; content.style.display=''; content.style.flexDirection='';
  }
  window._editingJobId=params.editId||null;
  currentView=view;
  document.querySelectorAll('.nav-item').forEach(function(item){
    var v=item.dataset.view;
    item.classList.toggle('active',v===view||(v==='jobs'&&(view==='new-job'||view==='live-job')));
  });
  var views={dashboard:renderDashboard,clients:renderClients,jobs:renderJobs,'new-job':renderNewJob,'live-job':renderLiveJob,map:renderMap,documents:renderDocuments,settings:renderSettings};
  (views[view]||renderDashboard)(content,params);
  updateBadges();
}
function updateBadges() {
  var jobs=getJobs();
  var n=jobs.filter(function(j){return j.status==='in-progress'||j.status==='pending';}).length;
  document.querySelectorAll('.jobs-badge').forEach(function(badge){badge.textContent=n;badge.style.display=n>0?'inline-flex':'none';});
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
function renderDashboard(el) {
  var s=getSettings();
  var firstName=(s.technicianName||'').split(' ')[0]||'there';
  var hour=new Date().getHours();
  var greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  var now=new Date();
  var dayName=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
  var monthName=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()];
  var dateStr=dayName+', '+now.getDate()+' '+monthName;

  document.getElementById('page-title').textContent='Dashboard';
  document.getElementById('topbar-actions').innerHTML='<button class="btn btn-primary" id="dash-new" style="gap:6px">'+icon('plus',14)+' New Job</button>';

  var jobs=getJobs(), clients=getClients();
  var today=todayISO();
  var tmrw=(function(){var d=new Date();d.setDate(d.getDate()+1);return d.toISOString().slice(0,10);})();
  var active=jobs.filter(function(j){return j.status==='in-progress';});
  var todayPending=jobs.filter(function(j){return j.date===today&&j.status==='pending';});
  var tomorrowJobs=jobs.filter(function(j){return j.date===tmrw&&(j.status==='pending'||j.status==='in-progress');});
  var completedN=jobs.filter(function(j){return j.status==='completed';}).length;
  var pendingN=jobs.filter(function(j){return j.status==='pending';}).length;

  function jobCard(j, highlight) {
    var typeStr=(j.jobTypes||[]).slice(0,2).join(' · ');
    if((j.jobTypes||[]).length>2)typeStr+=' +'+((j.jobTypes.length-2)+' more');
    var addr=j.clientAddress?'<div class="djc-meta">'+icon('pin',12)+' <span>'+esc(j.clientAddress)+'</span></div>':'';
    var time=j.timeIn?'<div class="djc-meta">'+icon('clock',12)+' <span>'+fmtTime(j.timeIn)+(j.timeOut?' — '+fmtTime(j.timeOut):'')+(j.duration?' · '+esc(j.duration):'')+'</span></div>':'';
    return '<div class="dash-job-card'+(highlight?' active-card':'')+'" data-id="'+j.id+'">'+
      '<div class="djc-header">'+
        '<div>'+
          '<div class="djc-client">'+esc(j.clientName||'—')+'</div>'+
          (typeStr?'<div class="djc-type">'+esc(typeStr)+'</div>':'')+
        '</div>'+
        statusBadge(j.status)+
      '</div>'+
      '<div class="djc-details">'+time+addr+'</div>'+
      '<div class="djc-footer">'+
        '<span class="djc-num">'+esc(j.jobNumber)+'</span>'+
        '<button class="btn btn-primary btn-sm go-live-dash" data-id="'+j.id+'" style="gap:5px">'+icon('play',13)+' Go Live</button>'+
      '</div>'+
    '</div>';
  }

  var jobsSection='';
  if(active.length){
    jobsSection+='<div class="dash-section-hd"><span class="dash-section-hd-dot" style="background:var(--orange)"></span>Active Now</div>'+
      '<div class="dash-job-grid">'+active.map(function(j){return jobCard(j,true);}).join('')+'</div>';
  }
  if(todayPending.length){
    jobsSection+='<div class="dash-section-hd"><span class="dash-section-hd-dot" style="background:var(--accent)"></span>Today</div>'+
      '<div class="dash-job-grid">'+todayPending.map(function(j){return jobCard(j,false);}).join('')+'</div>';
  }
  if(tomorrowJobs.length){
    jobsSection+='<div class="dash-section-hd"><span class="dash-section-hd-dot" style="background:var(--text-3)"></span>Tomorrow</div>'+
      '<div class="dash-job-grid">'+tomorrowJobs.map(function(j){return jobCard(j,false);}).join('')+'</div>';
  }
  if(!jobsSection){
    jobsSection='<div class="empty-state" style="padding:40px 0">'+
      '<div class="empty-state-icon">'+icon('check_c',40)+'</div>'+
      '<div class="empty-state-title">All clear!</div>'+
      '<div class="empty-state-desc">No active or upcoming jobs for today or tomorrow.</div>'+
    '</div>';
  }

  var recentDone=jobs.filter(function(j){return j.status==='completed';})
    .sort(function(a,b){return(b.updatedAt||'').localeCompare(a.updatedAt||'');}).slice(0,4);

  var recentHtml=recentDone.length?
    '<div class="card"><div class="card-header"><span class="card-title">Recent Completions</span></div>'+
    '<div class="card-body" style="padding:0">'+
    recentDone.map(function(j,i){
      return '<div class="dash-recent-row'+(i<recentDone.length-1?' dash-recent-divider':'')+'">'+
        '<div>'+
          '<div class="dash-recent-client">'+esc(j.clientName||'—')+'</div>'+
          '<div class="dash-recent-meta">'+esc(j.jobNumber)+' · '+fmtDate(j.date)+'</div>'+
        '</div>'+
        (j.duration?'<span class="dash-recent-dur">'+esc(j.duration)+'</span>':statusBadge(j.status))+
      '</div>';
    }).join('')+
    '</div></div>':'';

  el.innerHTML=
    '<div class="dash-greeting">'+
      '<div class="dash-greeting-text">'+greeting+', '+esc(firstName)+'</div>'+
      '<div class="dash-greeting-date">'+esc(dateStr)+'</div>'+
    '</div>'+
    '<div class="dash-stats">'+
      dStatCard('In Progress',active.length,'var(--orange)','rgba(255,159,10,.12)',icon('refresh',18))+
      dStatCard('Pending',pendingN,'var(--purple)','rgba(191,90,242,.12)',icon('clock',18))+
      dStatCard('Completed',completedN,'var(--green)','rgba(48,209,88,.12)',icon('check_c',18))+
      dStatCard('Clients',clients.length,'var(--teal)','rgba(90,200,245,.12)',icon('users',18))+
    '</div>'+
    '<div class="dash-body">'+
      '<div class="dash-main">'+jobsSection+'</div>'+
      '<div class="dash-side" id="dash-side">'+
        '<div class="card"><div class="card-header"><span class="card-title">Quick Actions</span></div>'+
          '<div class="card-body dash-qa">'+
          '<button class="btn btn-secondary w-full" id="qa-job" style="justify-content:flex-start;gap:10px">'+icon('plus',16)+' New Job</button>'+
          '<button class="btn btn-secondary w-full" id="qa-cl"  style="justify-content:flex-start;gap:10px">'+icon('user_add',16)+' Add Client</button>'+
          '<button class="btn btn-secondary w-full" id="qa-all" style="justify-content:flex-start;gap:10px">'+icon('clipboard',16)+' All Jobs</button>'+
          '<button class="btn btn-secondary w-full" id="qa-map" style="justify-content:flex-start;gap:10px">'+icon('map',16)+' Open Map</button>'+
          '</div></div>'+
        recentHtml+
      '</div>'+
    '</div>';

  document.getElementById('dash-new').addEventListener('click',function(){navigate('new-job');});
  document.getElementById('qa-job').addEventListener('click',function(){navigate('new-job');});
  document.getElementById('qa-cl').addEventListener('click',function(){navigate('clients',{add:true});});
  document.getElementById('qa-all').addEventListener('click',function(){navigate('jobs');});
  document.getElementById('qa-map').addEventListener('click',function(){navigate('map');});
  el.querySelectorAll('.dash-job-card').forEach(function(card){
    card.addEventListener('click',function(e){if(e.target.closest('button'))return;navigate('jobs',{jobId:card.dataset.id});});
  });
  el.querySelectorAll('.go-live-dash').forEach(function(btn){
    btn.addEventListener('click',function(e){e.stopPropagation();navigate('live-job',{jobId:btn.dataset.id});});
  });
}
function dStatCard(label,val,color,bg,icon){
  return '<div class="stat-card"><div class="stat-icon" style="background:'+bg+';font-size:18px">'+icon+'</div>'+
    '<div class="stat-value" style="color:'+color+'">'+val+'</div><div class="stat-label">'+label+'</div></div>';
}

/* ═══════════════════════════════════════════════════════
   CLIENTS
═══════════════════════════════════════════════════════ */
function renderClients(el, params) {
  params=params||{};
  document.getElementById('page-title').textContent='Clients';
  document.getElementById('topbar-actions').innerHTML=searchBarHTML('cl-search','Search clients…')+
    '<button class="btn btn-primary" id="add-cl-btn">'+svgIcon('M12 4.5v15m7.5-7.5h-15')+' Add Client</button>';
  el.innerHTML='<div id="cl-table"></div>';
  var wrap=el.querySelector('#cl-table');
  function refresh(){clRenderTable(wrap,document.getElementById('cl-search')?document.getElementById('cl-search').value:'');}
  refresh();
  document.getElementById('add-cl-btn').addEventListener('click',function(){clOpenModal(refresh);});
  document.getElementById('cl-search').addEventListener('input',function(e){clRenderTable(wrap,e.target.value);});
  if(params.add)clOpenModal(refresh);
}
function clRenderTable(wrap,q){
  var clients=getClients().filter(function(c){return !q||(c.name+' '+c.suburb+' '+c.contact+' '+c.phone).toLowerCase().includes(q.toLowerCase());});
  if(!clients.length){wrap.innerHTML='<div class="empty-state"><div class="empty-state-icon">'+icon('users',40)+'</div><div class="empty-state-title">'+(q?'No results':'No clients yet')+'</div></div>';return;}
  wrap.innerHTML='<div class="list-cards">'+
    clients.map(function(c){
      var jc=getJobsForClient(c.id).length;
      var tags=(c.tags||[]).map(function(t){return '<span class="tag">'+esc(t)+'</span>';}).join('');
      var sub=[c.suburb,c.postcode].filter(Boolean).join(' ');
      return '<div class="list-card cl-row" data-id="'+c.id+'">'+
        '<div class="lc-header">'+
          '<div class="lc-primary">'+esc(c.name)+'</div>'+
          '<span class="badge '+(jc?'badge-blue':'badge-gray')+'" style="flex-shrink:0">'+jc+' job'+(jc!==1?'s':'')+'</span>'+
        '</div>'+
        (c.contact||c.phone?'<div class="lc-secondary">'+[c.contact,c.phone].filter(Boolean).map(esc).join(' · ')+'</div>':'')+
        (sub?'<div class="lc-meta">'+icon('pin',11)+' '+esc(sub)+'</div>':'')+
        (tags?'<div class="tag-strip mt-4">'+tags+'</div>':'')+
        '<div class="lc-footer">'+
          '<span class="lc-date">'+fmtDate(c.createdAt)+'</span>'+
          '<div class="lc-actions">'+
            '<button class="btn btn-ghost btn-icon btn-sm cl-edit" data-id="'+c.id+'">'+icon('pencil',14)+'</button>'+
            '<button class="btn btn-ghost btn-icon btn-sm cl-del"  data-id="'+c.id+'">'+icon('trash',14)+'</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('')+'</div>';
  function refresh(){clRenderTable(wrap,document.getElementById('cl-search')?document.getElementById('cl-search').value:'');}
  wrap.querySelectorAll('.cl-row').forEach(function(row){row.addEventListener('click',function(e){if(e.target.closest('button'))return;navigate('jobs',{clientId:row.dataset.id});});});
  wrap.querySelectorAll('.cl-edit').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();clOpenModal(refresh,btn.dataset.id);});});
  wrap.querySelectorAll('.cl-del').forEach(function(btn){btn.addEventListener('click',async function(e){
    e.stopPropagation();if(!await confirmDlg('Delete this client?'))return;
    deleteClient(btn.dataset.id);toast('Client deleted','info');refresh();
  });});
}
function clOpenModal(onSave,editId){
  var v=editId?getClient(editId)||{}:{};
  openModal(editId?'Edit Client':'Add Client',
    '<div class="form-row">'+
      formGrp(true,'Company / Client Name *','<input class="form-input" id="cf-name" value="'+esc(v.name||'')+'" placeholder="e.g. Acme Corp">')+
      formGrp(false,'Contact Person','<input class="form-input" id="cf-contact" value="'+esc(v.contact||'')+'" placeholder="Full name">')+
      formGrp(false,'Phone','<input class="form-input" id="cf-phone" value="'+esc(v.phone||'')+'" placeholder="08 xxxx xxxx">')+
      formGrp(true,'Email','<input class="form-input" id="cf-email" value="'+esc(v.email||'')+'" placeholder="email@domain.com.au">')+
      formGrp(true,'Street Address','<input class="form-input" id="cf-addr" value="'+esc(v.address||'')+'" placeholder="123 Example St">')+
      formGrp(false,'Suburb','<input class="form-input" id="cf-suburb" value="'+esc(v.suburb||'')+'" placeholder="Perth">')+
      formGrp(false,'Postcode','<input class="form-input" id="cf-pc" value="'+esc(v.postcode||'')+'" placeholder="6000">')+
      formGrp(false,'Lat','<input class="form-input" id="cf-lat" value="'+(v.lat||'')+'" placeholder="−31.9505" type="number" step="any">')+
      formGrp(false,'Lng','<input class="form-input" id="cf-lng" value="'+(v.lng||'')+'" placeholder="115.8605" type="number" step="any">')+
      formGrp(true,'Tags (comma separated)','<input class="form-input" id="cf-tags" value="'+esc((v.tags||[]).join(', '))+'" placeholder="Corporate, Priority">')+
      formGrp(true,'Notes','<textarea class="form-textarea" id="cf-notes" placeholder="Access info, site details…">'+esc(v.notes||'')+'</textarea>')+
    '</div>',
    '<button class="btn btn-secondary" id="cf-geo" style="gap:6px">'+icon('pin',14)+' Geocode</button><div style="flex:1"></div>'+
    '<button class="btn btn-secondary" id="cf-cancel">Cancel</button><button class="btn btn-primary" id="cf-save">'+(editId?'Save':'Add Client')+'</button>',
    'modal-lg');
  document.getElementById('cf-cancel').addEventListener('click',closeModal);
  document.getElementById('cf-geo').addEventListener('click',async function(){
    var btn=document.getElementById('cf-geo');btn.innerHTML=icon('pin',14)+' Geocoding…';btn.disabled=true;
    var coords=await geocodeAddress(document.getElementById('cf-addr').value,document.getElementById('cf-suburb').value,document.getElementById('cf-pc').value);
    btn.innerHTML=icon('pin',14)+' Geocode';btn.disabled=false;
    if(coords){document.getElementById('cf-lat').value=coords.lat.toFixed(6);document.getElementById('cf-lng').value=coords.lng.toFixed(6);toast('Coordinates found!','success');}
    else toast('Could not geocode — enter manually','error');
  });
  document.getElementById('cf-save').addEventListener('click',async function(){
    var name=document.getElementById('cf-name').value.trim();
    if(!name){toast('Client name is required','error');return;}
    var client=Object.assign(v.id?Object.assign({},v):{},{
      name,contact:document.getElementById('cf-contact').value.trim(),phone:document.getElementById('cf-phone').value.trim(),
      email:document.getElementById('cf-email').value.trim(),address:document.getElementById('cf-addr').value.trim(),
      suburb:document.getElementById('cf-suburb').value.trim(),postcode:document.getElementById('cf-pc').value.trim(),
      lat:parseFloat(document.getElementById('cf-lat').value)||null,lng:parseFloat(document.getElementById('cf-lng').value)||null,
      notes:document.getElementById('cf-notes').value.trim(),
      tags:document.getElementById('cf-tags').value.split(',').map(function(t){return t.trim();}).filter(Boolean)
    });
    if(client.address&&client.suburb&&(!client.lat||!client.lng)){
      var coords=await geocodeAddress(client.address,client.suburb,client.postcode);
      if(coords){client.lat=coords.lat;client.lng=coords.lng;}
    }
    saveClient(client);closeModal();toast(editId?'Client updated':'Client added','success');if(onSave)onSave();
  });
}

/* ═══════════════════════════════════════════════════════
   JOBS
═══════════════════════════════════════════════════════ */
function renderJobs(el, params) {
  params=params||{};
  document.getElementById('page-title').textContent='Jobs';
  document.getElementById('topbar-actions').innerHTML=searchBarHTML('jb-search','Search jobs…')+
    '<button class="btn btn-primary" id="new-jb-btn">'+svgIcon('M12 4.5v15m7.5-7.5h-15')+' New Job</button>';
  var clients=getClients();
  el.innerHTML='<div class="filter-row mb-16">'+
    '<select class="form-select" id="flt-s"><option value="">All Statuses</option>'+
    '<option value="pending">Pending</option><option value="in-progress">In Progress</option>'+
    '<option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>'+
    '<select class="form-select" id="flt-p"><option value="">All Priorities</option>'+
    '<option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>'+
    '<select class="form-select" id="flt-c"><option value="">All Clients</option>'+
    clients.map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+'</option>';}).join('')+
    '</select></div><div id="jb-table"></div>';
  if(params.clientId){var s=document.getElementById('flt-c');if(s)s.value=params.clientId;}
  var wrap=el.querySelector('#jb-table');
  function refresh(){jbRenderTable(wrap);}
  refresh();
  document.getElementById('new-jb-btn').addEventListener('click',function(){navigate('new-job');});
  document.getElementById('jb-search').addEventListener('input',refresh);
  ['flt-s','flt-p','flt-c'].forEach(function(id){var el2=document.getElementById(id);if(el2)el2.addEventListener('change',refresh);});
  if(params.jobId)setTimeout(function(){openJobDetail(params.jobId);},80);
}
function jbRenderTable(wrap){
  var q=(document.getElementById('jb-search')||{}).value||'';
  var status=(document.getElementById('flt-s')||{}).value||'';
  var priority=(document.getElementById('flt-p')||{}).value||'';
  var clientId=(document.getElementById('flt-c')||{}).value||'';
  var jobs=getJobs();
  if(status)jobs=jobs.filter(function(j){return j.status===status;});
  if(priority)jobs=jobs.filter(function(j){return j.priority===priority;});
  if(clientId)jobs=jobs.filter(function(j){return j.clientId===clientId;});
  if(q){var ql=q.toLowerCase();jobs=jobs.filter(function(j){return(j.jobNumber+' '+j.clientName+' '+j.notes+' '+(j.jobTypes||[]).join(' ')).toLowerCase().includes(ql);});}
  if(!jobs.length){wrap.innerHTML='<div class="empty-state"><div class="empty-state-icon">'+icon('clipboard',40)+'</div><div class="empty-state-title">'+(q||status||priority||clientId?'No results':'No jobs yet')+'</div></div>';return;}
  wrap.innerHTML='<div class="list-cards">'+
    jobs.map(function(j){
      var types=(j.jobTypes||[]).slice(0,4).map(function(t){return '<span class="tag">'+esc(t)+'</span>';}).join('');
      if((j.jobTypes||[]).length>4)types+='<span class="tag">+'+(j.jobTypes.length-4)+'</span>';
      return '<div class="list-card jb-row" data-id="'+j.id+'">'+
        '<div class="lc-header">'+
          '<span class="job-num">'+esc(j.jobNumber)+'</span>'+
          statusBadge(j.status)+
          '<span style="flex:1"></span>'+
          priorityHtml(j.priority)+
        '</div>'+
        '<div class="lc-primary">'+esc(j.clientName||'—')+'</div>'+
        (types?'<div class="tag-strip" style="margin-top:6px">'+types+'</div>':'')+
        '<div class="lc-footer">'+
          '<span class="lc-meta">'+icon('calendar',11)+' '+fmtDate(j.date)+'</span>'+
          (j.timeIn?'<span class="lc-meta">'+icon('clock',11)+' '+fmtTime(j.timeIn)+(j.timeOut?' → '+fmtTime(j.timeOut):'')+'</span>':'')+
          '<div class="lc-actions">'+
            '<button class="btn btn-ghost btn-icon btn-sm jb-edit" data-id="'+j.id+'">'+icon('pencil',14)+'</button>'+
            '<button class="btn btn-ghost btn-icon btn-sm jb-del"  data-id="'+j.id+'">'+icon('trash',14)+'</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('')+'</div>';
  wrap.querySelectorAll('.jb-row').forEach(function(row){row.addEventListener('click',function(e){if(e.target.closest('button'))return;openJobDetail(row.dataset.id);});});
  wrap.querySelectorAll('.jb-edit').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();navigate('new-job',{editId:btn.dataset.id});});});
  wrap.querySelectorAll('.jb-del').forEach(function(btn){btn.addEventListener('click',async function(e){
    e.stopPropagation();if(!await confirmDlg('Permanently delete this job? Cannot be undone.'))return;
    deleteJob(btn.dataset.id);toast('Job deleted','info');jbRenderTable(wrap);
  });});
}
function openJobDetail(id){
  var j=getJob(id); if(!j)return;
  var types=(j.jobTypes||[]).map(function(t){return '<span class="tag">'+esc(t)+'</span>';}).join('');
  var checks=(j.checklist||[]).map(function(c){return '<div class="checklist-item '+(c.checked?'done':'')+'"><span style="flex-shrink:0;color:'+(c.checked?'var(--green)':'var(--text-3)')+'">'+icon(c.checked?'check_c':'circle',16)+'</span><label>'+esc(c.label)+'</label></div>';}).join('');
  var photos=(j.photos||[]).map(function(p,i){return '<div class="photo-thumb" data-idx="'+i+'" data-src="'+p.dataUrl+'" style="cursor:pointer"><img src="'+p.dataUrl+'" alt="'+esc(p.name)+'" loading="lazy"></div>';}).join('');
  var docs=(j.documents||[]).map(function(d){return '<div class="file-item"><div class="file-item-icon">'+fileIcon(d.name)+'</div><div class="file-item-info"><div class="file-item-name">'+esc(d.name)+'</div><div class="file-item-size">'+fmtBytes(d.size)+'</div></div>'+(d.dataUrl?'<a href="'+d.dataUrl+'" download="'+esc(d.name)+'" class="btn btn-ghost btn-icon btn-sm">'+icon('dl',14)+'</a>':'')+' </div>';}).join('');
  var body='<div class="detail-grid">'+
    '<span class="detail-key">Job #</span><span class="detail-val font-semibold">'+esc(j.jobNumber)+'</span>'+
    '<span class="detail-key">Date</span><span class="detail-val">'+fmtDate(j.date)+'</span>'+
    '<span class="detail-key">Client</span><span class="detail-val">'+esc(j.clientName||'—')+'</span>'+
    '<span class="detail-key">Address</span><span class="detail-val text-muted">'+esc(j.clientAddress||'—')+'</span>'+
    '<span class="detail-key">Status</span><span class="detail-val">'+statusBadge(j.status)+'</span>'+
    '<span class="detail-key">Priority</span><span class="detail-val">'+priorityHtml(j.priority)+'</span>'+
    '<span class="detail-key">Technician</span><span class="detail-val">'+esc(j.technician||'—')+'</span>'+
    '<span class="detail-key">Time</span><span class="detail-val">'+(j.timeIn?fmtTime(j.timeIn):'—')+(j.timeOut?' → '+fmtTime(j.timeOut):'')+' </span>'+
    '</div>'+
    (types?'<div><div class="section-title mt-16">Job Types</div><div class="tag-strip">'+types+'</div></div>':'')+
    (j.notes?'<div><div class="section-title mt-16">Notes</div><p style="font-size:13.5px;line-height:1.7;color:var(--text-2);white-space:pre-wrap">'+esc(j.notes)+'</p></div>':'')+
    (j.internalNotes?'<div><div class="section-title mt-16">Internal Notes</div><p style="font-size:13.5px;line-height:1.7;color:var(--text-2);white-space:pre-wrap">'+esc(j.internalNotes)+'</p></div>':'')+
    (checks?'<div><div class="section-title mt-16">Checklist</div><div class="checklist">'+checks+'</div></div>':'')+
    (photos?'<div><div class="section-title mt-16">Photos ('+j.photos.length+')</div><div class="photo-grid jd-photos">'+photos+'</div></div>':'')+
    (docs?'<div><div class="section-title mt-16">Documents ('+j.documents.length+')</div><div class="file-list">'+docs+'</div></div>':'');
  var canLive=j.status!=='completed'&&j.status!=='cancelled';
  openModal(esc(j.jobNumber)+' — '+esc(j.clientName||'Job'),body,
    '<button class="btn btn-secondary" id="jd-close">Close</button>'+
    '<button class="btn btn-ghost" id="jd-edit">Edit Job</button>'+
    (canLive?'<button class="btn btn-success" id="jd-live" style="gap:6px">'+icon('play',14)+' Go Live</button>':''),
    'modal-lg');
  document.getElementById('jd-close').addEventListener('click',closeModal);
  document.getElementById('jd-edit').addEventListener('click',function(){closeModal();navigate('new-job',{editId:j.id});});
  if(canLive)document.getElementById('jd-live').addEventListener('click',function(){closeModal();navigate('live-job',{jobId:j.id});});
  document.querySelectorAll('.jd-photos .photo-thumb').forEach(function(th){
    th.addEventListener('click',function(){
      var ov=document.createElement('div');
      ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;z-index:9000;cursor:zoom-out';
      ov.innerHTML='<img src="'+th.dataset.src+'" style="max-width:92vw;max-height:90vh;border-radius:8px;object-fit:contain">';
      ov.addEventListener('click',function(){ov.remove();}); document.body.appendChild(ov);
    });
  });
}

/* ═══════════════════════════════════════════════════════
   NEW JOB
═══════════════════════════════════════════════════════ */
var _njPhotos=[], _njDocs=[], _njCheck=[];

function renderNewJob(el, params) {
  params=params||{};
  var isEdit=!!params.editId, v=isEdit?getJob(params.editId)||{}:{};
  document.getElementById('page-title').textContent=isEdit?'Edit '+(v.jobNumber||'Job'):'New Job';
  document.getElementById('topbar-actions').innerHTML=
    '<button class="btn btn-ghost" id="nj-cancel">Cancel</button>'+
    '<button class="btn btn-primary" id="nj-save">'+(isEdit?'Save Changes':'Save Job')+'</button>';
  _njPhotos=v.photos?v.photos.slice():[];
  _njDocs=v.documents?v.documents.slice():[];
  _njCheck=v.checklist?v.checklist.map(function(i){return Object.assign({},i);}):DEFAULT_CHECKLIST.map(function(lbl){return{id:genId(),label:lbl,checked:false};});
  var clients=getClients(), s=getSettings();
  var jobTypesList=s.jobTypes||JOB_TYPES;
  var chipsHTML=jobTypesList.map(function(t){var on=(v.jobTypes||[]).indexOf(t)>=0;return '<div class="check-chip'+(on?' on':'')+'" data-type="'+esc(t)+'"><span class="chip-box"></span>'+esc(t)+'</div>';}).join('');
  var clientOpts=clients.map(function(c){return '<option value="'+c.id+'"'+(v.clientId===c.id?' selected':'')+'>'+esc(c.name)+' — '+esc(c.suburb||c.address||'')+'</option>';}).join('');
  var today=todayISO();
  function sOpt(val,cur){var lbl={pending:'Pending','in-progress':'In Progress',completed:'Completed',cancelled:'Cancelled'};var sel=(cur===val||(!cur&&val==='pending'))?' selected':'';return '<option value="'+val+'"'+sel+'>'+lbl[val]+'</option>';}
  function pOpt(val,cur){var sel=(cur===val||(!cur&&val==='medium'))?' selected':'';return '<option value="'+val+'"'+sel+'>'+val[0].toUpperCase()+val.slice(1)+'</option>';}
  el.innerHTML=
    '<div style="display:flex;flex-direction:column;gap:22px;max-width:960px">'+
    '<div class="card"><div class="card-header"><span class="card-title">Job Details</span></div><div class="card-body"><div class="form-row">'+
      formGrp(true,'Client *','<select class="form-select" id="nj-cl"><option value="">— Select a client —</option>'+clientOpts+'</select>'+(clients.length===0?'<small style="color:var(--orange)">No clients yet</small>':''))+
      formGrp(false,'Date *','<input class="form-input" type="date" id="nj-date" value="'+(v.date||today)+'">')+
      formGrp(false,'Status','<select class="form-select" id="nj-status">'+sOpt('pending',v.status)+sOpt('in-progress',v.status)+sOpt('completed',v.status)+sOpt('cancelled',v.status)+'</select>')+
      formGrp(false,'Priority','<select class="form-select" id="nj-priority">'+pOpt('low',v.priority)+pOpt('medium',v.priority)+pOpt('high',v.priority)+'</select>')+
      formGrp(false,'Technician','<input class="form-input" id="nj-tech" value="'+esc(v.technician||s.technicianName||'')+'" placeholder="Your name">')+
      formGrp(false,'Time In','<input class="form-input" type="time" id="nj-timein" value="'+(v.timeIn||'')+'">')+
      formGrp(false,'Time Out','<input class="form-input" type="time" id="nj-timeout" value="'+(v.timeOut||'')+'">') +
    '</div></div></div>'+
    '<div class="card"><div class="card-header"><span class="card-title">Job Types</span><span class="badge badge-blue" id="nj-tc">0 selected</span></div>'+
      '<div class="card-body"><div class="checkbox-grid" id="nj-chips">'+chipsHTML+'</div></div></div>'+
    '<div class="card"><div class="card-header"><span class="card-title">Notes</span></div><div class="card-body" style="display:flex;flex-direction:column;gap:14px">'+
      formGrp(false,'Job Notes (visible to client)','<textarea class="form-textarea" id="nj-notes" style="min-height:120px" placeholder="Describe work done…">'+esc(v.notes||'')+'</textarea>')+
      formGrp(false,'Internal Notes (private)','<textarea class="form-textarea" id="nj-internal" placeholder="Internal notes, follow-ups…">'+esc(v.internalNotes||'')+'</textarea>')+
    '</div></div>'+
    '<div class="card"><div class="card-header"><span class="card-title">Job Checklist</span>'+
      '<div style="display:flex;gap:6px;align-items:center">'+
        '<select class="form-select" id="nj-preset" style="width:auto;padding:5px 24px 5px 8px;font-size:12px">'+
          '<option value="">Load preset…</option>'+
          Object.keys(JOB_PRESETS).map(function(k){return '<option value="'+esc(k)+'">'+esc(k)+'</option>';}).join('')+
        '</select>'+
        '<button class="btn btn-ghost btn-sm" id="nj-addcheck">+ Item</button>'+
      '</div>'+
    '</div>'+
    '<div class="card-body"><div class="checklist" id="nj-checklist"></div></div></div>'+
    '<div class="card"><div class="card-header"><span class="card-title">Photos</span></div><div class="card-body">'+
      '<div class="file-drop" id="nj-photodrop"><div class="file-drop-icon">'+icon('camera',28)+'</div><p><span>Click to upload</span> or drag &amp; drop photos</p><p style="font-size:11px;margin-top:4px;color:var(--text-3)">JPEG, PNG, WEBP — compressed automatically</p></div>'+
      '<div class="photo-grid mt-8" id="nj-photogrid"></div></div></div>'+
    '<div class="card"><div class="card-header"><span class="card-title">Documents</span></div><div class="card-body">'+
      '<div class="file-drop" id="nj-docdrop"><div class="file-drop-icon">'+icon('clip',28)+'</div><p><span>Click to upload</span> or drag &amp; drop files</p></div>'+
      '<div class="file-list mt-8" id="nj-doclist"></div></div></div>'+
    '</div>';

  function refreshTypeCount(){document.getElementById('nj-tc').textContent=el.querySelectorAll('.check-chip.on').length+' selected';}
  refreshTypeCount();
  el.querySelectorAll('.check-chip').forEach(function(c){c.addEventListener('click',function(){c.classList.toggle('on');refreshTypeCount();});});
  njRenderCheck(); njRenderPhotos(); njRenderDocs();
  el.querySelector('#nj-addcheck').addEventListener('click',function(){_njCheck.push({id:genId(),label:'',checked:false});njRenderCheck();});
  el.querySelector('#nj-preset').addEventListener('change',function(e){
    var key=e.target.value;
    if(!key||!JOB_PRESETS[key])return;
    _njCheck=JOB_PRESETS[key].map(function(lbl){return{id:genId(),label:lbl,checked:false};});
    njRenderCheck();e.target.value='';toast('Preset loaded: '+key,'success');
  });
  document.getElementById('nj-cancel').addEventListener('click',function(){navigate('jobs');});
  document.getElementById('nj-save').addEventListener('click',njSave);
  makeFileDrop(el.querySelector('#nj-photodrop'),'image/*',async function(files){
    for(var i=0;i<files.length;i++){try{_njPhotos.push(await compressImage(files[i]));}catch(e){toast('Could not read '+files[i].name,'error');}}njRenderPhotos();
  });
  makeFileDrop(el.querySelector('#nj-docdrop'),'*/*',async function(files){
    for(var i=0;i<files.length;i++){if(files[i].size>10*1024*1024){toast(files[i].name+' over 10 MB','error');continue;}try{_njDocs.push(await readFileB64(files[i]));}catch(e){toast('Could not read '+files[i].name,'error');}}njRenderDocs();
  });
}
function njRenderCheck(){
  var wrap=document.getElementById('nj-checklist');if(!wrap)return;
  wrap.innerHTML=_njCheck.map(function(item,i){
    return '<div class="checklist-item"><input type="checkbox" id="nci'+i+'"'+(item.checked?' checked':'')+'>'+
      '<input class="form-input" value="'+esc(item.label)+'" placeholder="Checklist item…" data-idx="'+i+'" style="border:none;background:transparent;padding:0;flex:1;font-size:13px;outline:none">'+
      '<span style="cursor:pointer;color:var(--text-3);padding:4px;margin-left:4px" data-idx="'+i+'" class="nj-del-check">✕</span></div>';
  }).join('');
  wrap.querySelectorAll('input[type="checkbox"]').forEach(function(cb,i){cb.addEventListener('change',function(){_njCheck[i].checked=cb.checked;});});
  wrap.querySelectorAll('input[type="text"],input:not([type]),.form-input:not([type="checkbox"])').forEach(function(inp){if(inp.dataset.idx!==undefined)inp.addEventListener('input',function(){_njCheck[parseInt(inp.dataset.idx)].label=inp.value;});});
  wrap.querySelectorAll('.nj-del-check').forEach(function(btn){btn.addEventListener('click',function(){_njCheck.splice(parseInt(btn.dataset.idx),1);njRenderCheck();});});
}
function njRenderPhotos(){
  var g=document.getElementById('nj-photogrid');if(!g)return;
  g.innerHTML=_njPhotos.map(function(p,i){return '<div class="photo-thumb"><img src="'+p.dataUrl+'" alt="'+esc(p.name)+'" loading="lazy"><div class="photo-thumb-rm" data-idx="'+i+'" style="opacity:1;cursor:pointer">✕</div></div>';}).join('');
  g.querySelectorAll('.photo-thumb-rm').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();_njPhotos.splice(parseInt(btn.dataset.idx),1);njRenderPhotos();});});
}
function njRenderDocs(){
  var l=document.getElementById('nj-doclist');if(!l)return;
  l.innerHTML=_njDocs.map(function(d,i){return '<div class="file-item"><div class="file-item-icon">'+fileIcon(d.name)+'</div><div class="file-item-info"><div class="file-item-name">'+esc(d.name)+'</div><div class="file-item-size">'+fmtBytes(d.size)+'</div></div><span style="cursor:pointer;color:var(--text-3);padding:4px;margin-left:4px" class="nj-del-doc" data-idx="'+i+'">✕</span></div>';}).join('');
  l.querySelectorAll('.nj-del-doc').forEach(function(btn){btn.addEventListener('click',function(){_njDocs.splice(parseInt(btn.dataset.idx),1);njRenderDocs();});});
}
async function njSave(){
  var clientId=document.getElementById('nj-cl').value, date=document.getElementById('nj-date').value;
  if(!clientId){toast('Please select a client','error');return;}
  if(!date){toast('Please set a date','error');return;}
  var client=getClient(clientId);
  var jobTypes=Array.from(document.querySelectorAll('.check-chip.on')).map(function(c){return c.dataset.type;});
  var existing=window._editingJobId?getJob(window._editingJobId):null;
  var job=Object.assign(existing?Object.assign({},existing):{},{
    clientId,clientName:client?client.name:'',
    clientAddress:client?client.address+', '+client.suburb+' WA '+client.postcode:'',
    date,jobTypes,
    status:document.getElementById('nj-status').value,
    priority:document.getElementById('nj-priority').value,
    technician:document.getElementById('nj-tech').value.trim(),
    timeIn:document.getElementById('nj-timein').value,
    timeOut:document.getElementById('nj-timeout').value,
    notes:document.getElementById('nj-notes').value.trim(),
    internalNotes:document.getElementById('nj-internal').value.trim(),
    checklist:_njCheck, photos:_njPhotos, documents:_njDocs
  });
  try{saveJob(job);updateBadges();toast(existing?'Job updated!':'Job saved!','success');navigate('jobs');}
  catch(e){if(e.name==='QuotaExceededError')toast('Storage full! Remove some photos.','error');else toast('Error saving','error');}
}

/* ═══════════════════════════════════════════════════════
   LIVE JOB MODE
═══════════════════════════════════════════════════════ */
function renderLiveJob(el, params) {
  params=params||{};
  var j=getJob(params.jobId);
  if(!j){navigate('jobs');return;}

  /* Auto-set timeIn and flip to in-progress */
  var now=new Date(), changed=false;
  if(!j.timeIn){j.timeIn=pad2(now.getHours())+':'+pad2(now.getMinutes());changed=true;}
  if(j.status==='pending'){j.status='in-progress';changed=true;}
  if(changed){saveJob(j);updateBadges();}

  /* Timer base — timeIn on today's date */
  var startMs=new Date(todayISO()+'T'+j.timeIn+':00').getTime();

  document.getElementById('page-title').textContent='Live Job';
  document.getElementById('topbar-actions').innerHTML=
    '<button class="btn btn-ghost" id="lj-back">← Exit</button>'+
    '<button class="btn btn-success" id="lj-done" style="gap:6px">'+icon('check_c',16)+' Complete Job</button>';

  var types=(j.jobTypes||[]).map(function(t){return '<span class="tag">'+esc(t)+'</span>';}).join('');
  var checklist=j.checklist||[];
  var doneCnt=checklist.filter(function(c){return c.checked;}).length;

  el.innerHTML=
    '<div class="live-timer-bar">'+
      '<div>'+
        '<div class="live-timer" id="lj-timer">00:00:00</div>'+
        '<div style="font-size:11px;color:var(--text-3);margin-top:4px;text-transform:uppercase;letter-spacing:.5px">Time On-Site</div>'+
      '</div>'+
      '<div style="text-align:right">'+
        '<div style="font-weight:700;font-size:18px;margin-bottom:4px">'+esc(j.clientName||'—')+'</div>'+
        '<div style="font-size:12px;color:var(--text-2);margin-bottom:6px">'+esc(j.jobNumber)+' · '+fmtDate(j.date)+'</div>'+
        '<div class="tag-strip" style="justify-content:flex-end">'+types+'</div>'+
      '</div>'+
    '</div>'+
    '<div class="live-body">'+
      /* Left: checklist */
      '<div>'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'+
          '<div class="section-title" style="margin-bottom:0">Checklist</div>'+
          '<span id="lj-prog" style="font-size:12px;color:var(--text-2)">'+doneCnt+' / '+checklist.length+' done</span>'+
        '</div>'+
        '<div id="lj-checklist" class="live-checklist"></div>'+
      '</div>'+
      /* Right: photos + notes */
      '<div class="live-right">'+
        '<div class="section-title">Photos</div>'+
        '<div class="file-drop file-drop-sm" id="lj-photodrop">'+
          '<div class="file-drop-icon">'+icon('camera',20)+'</div><p style="font-size:12px">Tap to add photos</p>'+
        '</div>'+
        '<div class="photo-grid mt-8" id="lj-photogrid"></div>'+
        '<div class="section-title mt-16">Notes</div>'+
        '<textarea class="form-textarea" id="lj-notes" style="min-height:120px;resize:vertical" placeholder="Notes about this job…">'+esc(j.notes||'')+'</textarea>'+
        '<button class="btn btn-secondary w-full" id="lj-savenotes" style="margin-top:6px">Save Notes</button>'+
      '</div>'+
    '</div>';

  /* ── Timer ─────────────────────────────────────── */
  if(_liveTimerInterval)clearInterval(_liveTimerInterval);
  function tickTimer(){
    var el2=document.getElementById('lj-timer');if(!el2)return;
    var e=Math.max(0,Date.now()-startMs);
    el2.textContent=pad2(Math.floor(e/3600000))+':'+pad2(Math.floor((e%3600000)/60000))+':'+pad2(Math.floor((e%60000)/1000));
  }
  tickTimer();
  _liveTimerInterval=setInterval(tickTimer,1000);

  /* ── Checklist ─────────────────────────────────── */
  function ljRenderCheck(){
    var fresh=getJob(j.id);if(!fresh)return;
    var items=fresh.checklist||[];
    var done=items.filter(function(c){return c.checked;}).length;
    var prog=document.getElementById('lj-prog');
    if(prog)prog.textContent=done+' / '+items.length+' done';
    var wrap=document.getElementById('lj-checklist');if(!wrap)return;
    wrap.innerHTML=items.map(function(item,i){
      return '<div class="live-check-item'+(item.checked?' live-check-done':'')+'" data-idx="'+i+'">'+
        '<div class="live-check-box">'+(item.checked?'✓':'')+'</div>'+
        '<span style="flex:1">'+esc(item.label)+'</span>'+
      '</div>';
    }).join('')||'<div style="color:var(--text-3);font-size:13px;padding:12px 0">No checklist items.</div>';
    wrap.querySelectorAll('.live-check-item').forEach(function(item){
      item.addEventListener('click',function(){
        var f=getJob(j.id);if(!f||!f.checklist)return;
        var idx=parseInt(item.dataset.idx);
        f.checklist[idx].checked=!f.checklist[idx].checked;
        saveJob(f);ljRenderCheck();
      });
    });
  }
  ljRenderCheck();

  /* ── Photos ─────────────────────────────────────── */
  var livePhotos=(getJob(j.id).photos||[]).slice();
  function ljRenderPhotos(){
    var g=document.getElementById('lj-photogrid');if(!g)return;
    g.innerHTML=livePhotos.map(function(p,i){
      return '<div class="photo-thumb"><img src="'+p.dataUrl+'" alt="'+esc(p.name)+'" loading="lazy">'+
        '<div class="photo-thumb-rm" data-idx="'+i+'" style="opacity:1">✕</div></div>';
    }).join('');
    g.querySelectorAll('.photo-thumb-rm').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.stopPropagation();livePhotos.splice(parseInt(btn.dataset.idx),1);
        var f=getJob(j.id);f.photos=livePhotos;saveJob(f);ljRenderPhotos();
      });
    });
  }
  ljRenderPhotos();
  makeFileDrop(document.getElementById('lj-photodrop'),'image/*',async function(files){
    for(var i=0;i<files.length;i++){
      try{livePhotos.push(await compressImage(files[i]));}catch(e){toast('Could not read '+files[i].name,'error');}
    }
    var f=getJob(j.id);f.photos=livePhotos;saveJob(f);ljRenderPhotos();
  });

  /* ── Notes save ─────────────────────────────────── */
  document.getElementById('lj-savenotes').addEventListener('click',function(){
    var f=getJob(j.id);if(!f)return;
    f.notes=document.getElementById('lj-notes').value.trim();
    saveJob(f);toast('Notes saved','success');
  });

  /* ── Exit ───────────────────────────────────────── */
  document.getElementById('lj-back').addEventListener('click',function(){
    clearInterval(_liveTimerInterval);_liveTimerInterval=null;
    navigate('jobs',{jobId:j.id});
  });

  /* ── Complete ───────────────────────────────────── */
  document.getElementById('lj-done').addEventListener('click',async function(){
    if(!await confirmDlg('Mark this job as completed? The time will be recorded.'))return;
    var now2=new Date();
    var f=getJob(j.id);
    f.status='completed';
    f.timeOut=pad2(now2.getHours())+':'+pad2(now2.getMinutes());
    var durMs=Math.max(0,now2.getTime()-startMs);
    var dh=Math.floor(durMs/3600000), dm=Math.floor((durMs%3600000)/60000);
    f.duration=(dh>0?dh+'h ':'')+dm+'m';
    var notesEl=document.getElementById('lj-notes');
    if(notesEl)f.notes=notesEl.value.trim();
    saveJob(f);
    clearInterval(_liveTimerInterval);_liveTimerInterval=null;
    toast('Job completed! Duration: '+f.duration,'success');
    updateBadges();navigate('dashboard');
  });
}

/* ═══════════════════════════════════════════════════════
   MAP
═══════════════════════════════════════════════════════ */
function renderMap(el){
  document.getElementById('page-title').textContent='Map';
  document.getElementById('topbar-actions').innerHTML='<button class="btn btn-secondary" id="map-refresh-btn">↺ Refresh</button>';
  el.style.padding='0'; el.style.overflow='hidden';
  el.innerHTML='<div id="map-wrap"><div id="map"></div>'+
    '<div id="map-panel" style="width:280px;flex-shrink:0;background:var(--bg-1);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden">'+
    '<div style="padding:14px 16px;border-bottom:1px solid var(--border)"><div style="font-weight:700;font-size:13px;margin-bottom:6px">Jobs</div>'+
    '<input class="search-input" id="map-search" placeholder="Filter jobs…" style="width:100%;border-radius:6px"></div>'+
    '<div id="map-client-list" style="overflow-y:auto;flex:1;padding:8px"></div></div></div>';
  cleanupMap();
  _mapInstance=L.map('map',{center:[-28.5,121.6],zoom:5});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains:'abcd',maxZoom:19}).addTo(_mapInstance);
  mapRefreshMarkers();
  setTimeout(function(){if(_mapInstance)_mapInstance.invalidateSize();},120);
  document.getElementById('map-refresh-btn').addEventListener('click',mapRefreshMarkers);
  document.getElementById('map-search').addEventListener('input',function(e){mapRenderList(e.target.value);});
}
function mapRefreshMarkers(){
  _mapMarkers.forEach(function(m){m.remove();}); _mapMarkers=[];
  var clients=getClients();
  clients.filter(function(c){return c.lat&&c.lng;}).forEach(function(c){
    var jobs=getJobsForClient(c.id);
    var active=jobs.filter(function(j){return j.status==='in-progress';}).length;
    var done=jobs.filter(function(j){return j.status==='completed';}).length;
    var icon=L.divIcon({className:'',
      html:'<div style="background:'+(active?'var(--orange)':'var(--accent)')+';color:#fff;font-size:11px;font-weight:700;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.3);box-shadow:0 2px 8px rgba(0,0,0,.5)">'+jobs.length+'</div>',
      iconSize:[28,28],iconAnchor:[14,14]});
    var marker=L.marker([c.lat,c.lng],{icon:icon}).addTo(_mapInstance);
    marker.bindPopup(
      '<div style="min-width:200px;font-family:-apple-system,sans-serif">'+
      '<div style="font-weight:700;font-size:14px;margin-bottom:4px">'+esc(c.name)+'</div>'+
      '<div style="font-size:12px;color:#aaa;margin-bottom:8px">'+esc(c.address)+', '+esc(c.suburb)+'</div>'+
      (c.contact?'<div style="font-size:12px;margin-bottom:2px;display:flex;align-items:center;gap:4px">'+icon('person',12)+' '+esc(c.contact)+'</div>':'')+
      (c.phone?'<div style="font-size:12px;margin-bottom:2px;display:flex;align-items:center;gap:4px">'+icon('phone',12)+' '+esc(c.phone)+'</div>':'')+
      '<hr style="border:none;border-top:1px solid rgba(255,255,255,.1);margin:8px 0">'+
      '<div style="font-size:12px;color:#aaa">'+jobs.length+' job'+(jobs.length!==1?'s':'')+
        (active?' · <span style="color:var(--orange)">'+active+' active</span>':'')+
        (done?' · <span style="color:var(--green)">'+done+' done</span>':'')+
      '</div>'+
      '<div style="margin-top:8px;display:flex;gap:6px">'+
        '<button onclick="window.navigate(\'jobs\',{clientId:\''+c.id+'\'})" style="background:var(--accent);color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;font-weight:600">View Jobs</button>'+
        '<button onclick="window.navigate(\'clients\')" style="background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer">Clients</button>'+
      '</div></div>',{maxWidth:260});
    _mapMarkers.push(marker);
  });
  if(_mapMarkers.length>0){try{var g=L.featureGroup(_mapMarkers);_mapInstance.fitBounds(g.getBounds().pad(0.15),{maxZoom:12});}catch(e){}}
  mapRenderList('');
}
function mapRenderList(q){
  var listEl=document.getElementById('map-client-list');if(!listEl)return;
  var clientMap={};getClients().forEach(function(c){clientMap[c.id]=c;});
  var statusOrder={'in-progress':0,'pending':1,'completed':2,'cancelled':3};
  var statusCol={'in-progress':'var(--orange)','pending':'var(--accent)','completed':'var(--green)','cancelled':'var(--text-3)'};
  var jobs=getJobs().filter(function(j){
    return !q||(j.clientName+' '+j.jobNumber+' '+(j.clientAddress||'')).toLowerCase().includes(q.toLowerCase());
  }).sort(function(a,b){return(statusOrder[a.status]||2)-(statusOrder[b.status]||2);});
  if(!jobs.length){listEl.innerHTML='<div style="padding:20px;text-align:center;color:var(--text-3);font-size:13px">No jobs</div>';return;}
  listEl.innerHTML=jobs.map(function(j){
    var client=clientMap[j.clientId]||{};
    var hasCoords=client.lat&&client.lng;
    var dot='<div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:3px;background:'+(hasCoords?statusCol[j.status]||'var(--text-3)':'var(--text-3)')+'"></div>';
    return '<div class="map-list-item" data-lat="'+(client.lat||'')+'" data-lng="'+(client.lng||'')+'" style="padding:10px 12px;border-radius:8px;cursor:pointer;margin-bottom:4px;border:1px solid transparent;transition:.15s">'+
      '<div style="display:flex;align-items:flex-start;gap:8px">'+dot+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(j.clientName||'—')+'</div>'+
        '<div style="font-size:11px;color:var(--text-2);margin-top:1px">'+esc(j.jobNumber)+' · '+fmtDate(j.date)+'</div>'+
        (j.clientAddress?'<div style="font-size:11px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px">'+esc(j.clientAddress)+'</div>':'')+
      '</div>'+
      '</div></div>';
  }).join('');
  listEl.querySelectorAll('.map-list-item').forEach(function(item){
    item.addEventListener('mouseenter',function(){item.style.background='rgba(255,255,255,.04)';item.style.borderColor='var(--border)';});
    item.addEventListener('mouseleave',function(){item.style.background='';item.style.borderColor='transparent';});
    item.addEventListener('click',function(){
      var lat=parseFloat(item.dataset.lat),lng=parseFloat(item.dataset.lng);
      if(lat&&lng&&_mapInstance){
        _mapInstance.flyTo([lat,lng],16,{duration:1.2});
        var found=_mapMarkers.find(function(m){var ll=m.getLatLng();return Math.abs(ll.lat-lat)<.001&&Math.abs(ll.lng-lng)<.001;});
        if(found)setTimeout(function(){found.openPopup();},1100);
      }
    });
  });
}
function cleanupMap(){if(_mapInstance){_mapInstance.remove();_mapInstance=null;}_mapMarkers=[];}

/* ═══════════════════════════════════════════════════════
   DOCUMENTS
═══════════════════════════════════════════════════════ */
function renderDocuments(el){
  document.getElementById('page-title').textContent='Documents';
  document.getElementById('topbar-actions').innerHTML=searchBarHTML('doc-search','Search documents…')+
    '<select class="form-select" id="doc-type" style="width:auto;padding:6px 28px 6px 10px;font-size:12.5px"><option value="">All Types</option><option value="photo">Photos</option><option value="document">Documents</option></select>';
  el.innerHTML='<div id="docs-wrap"></div>';
  var wrap=el.querySelector('#docs-wrap');
  function refresh(){docRenderTable(wrap,(document.getElementById('doc-search')||{}).value||'',(document.getElementById('doc-type')||{}).value||'');}
  refresh();
  document.getElementById('doc-search').addEventListener('input',refresh);
  document.getElementById('doc-type').addEventListener('change',refresh);
}
function docRenderTable(wrap,q,typeFilter){
  var all=[];
  getJobs().forEach(function(job){
    if(typeFilter!=='document')(job.photos||[]).forEach(function(p){all.push({type:'photo',name:p.name,size:p.size,dataUrl:p.dataUrl,jobId:job.id,jobNumber:job.jobNumber,clientName:job.clientName,date:job.date});});
    if(typeFilter!=='photo')(job.documents||[]).forEach(function(d){all.push({type:'document',name:d.name,size:d.size,dataUrl:d.dataUrl,jobId:job.id,jobNumber:job.jobNumber,clientName:job.clientName,date:job.date});});
  });
  var filtered=q?all.filter(function(f){return(f.name+' '+f.clientName+' '+f.jobNumber).toLowerCase().includes(q.toLowerCase());}):all;
  filtered.sort(function(a,b){return(b.date||'').localeCompare(a.date||'');});
  if(!filtered.length){wrap.innerHTML='<div class="empty-state"><div class="empty-state-icon">'+icon('folder',40)+'</div><div class="empty-state-title">'+(q?'No results':'No documents yet')+'</div><div class="empty-state-desc">Photos &amp; documents attached to jobs appear here</div></div>';return;}
  var photos=filtered.filter(function(f){return f.type==='photo';});
  var docs=filtered.filter(function(f){return f.type==='document';});
  var html='<div class="grid grid-3 mb-16">'+
    '<div class="card"><div class="card-body" style="padding:14px 18px"><div style="font-size:24px;font-weight:800;color:var(--accent)">'+filtered.length+'</div><div style="font-size:12px;color:var(--text-2)">Total Files</div></div></div>'+
    '<div class="card"><div class="card-body" style="padding:14px 18px"><div style="font-size:24px;font-weight:800;color:var(--green)">'+photos.length+'</div><div style="font-size:12px;color:var(--text-2)">Photos</div></div></div>'+
    '<div class="card"><div class="card-body" style="padding:14px 18px"><div style="font-size:24px;font-weight:800;color:var(--purple)">'+docs.length+'</div><div style="font-size:12px;color:var(--text-2)">Documents</div></div></div>'+
    '</div>';
  if(photos.length&&typeFilter!=='document'){
    html+='<div class="card mb-16"><div class="card-header"><span class="card-title">Photos ('+photos.length+')</span></div><div class="card-body">'+
      '<div class="photo-grid">'+photos.map(function(p){return '<div class="photo-thumb doc-ph" data-src="'+p.dataUrl+'" data-job="'+p.jobId+'" style="cursor:pointer" title="'+esc(p.name)+' · '+esc(p.clientName)+'"><img src="'+p.dataUrl+'" alt="'+esc(p.name)+'" loading="lazy"><div style="position:absolute;bottom:0;left:0;right:0;padding:4px 6px;background:linear-gradient(transparent,rgba(0,0,0,.8));font-size:9px;color:#fff;line-height:1.3;pointer-events:none">'+esc(p.jobNumber)+'<br>'+esc(p.clientName)+'</div></div>';}).join('')+
      '</div></div></div>';
  }
  if(docs.length&&typeFilter!=='photo'){
    html+='<div class="card"><div class="card-header"><span class="card-title">Documents ('+docs.length+')</span></div><div class="card-body"><div class="file-list">'+
      docs.map(function(d){return '<div class="file-item doc-row" data-job="'+d.jobId+'" style="cursor:pointer"><div class="file-item-icon">'+fileIcon(d.name)+'</div><div class="file-item-info"><div class="file-item-name">'+esc(d.name)+'</div><div class="file-item-size">'+fmtBytes(d.size)+' · <span class="text-accent">'+esc(d.jobNumber)+'</span> · '+esc(d.clientName)+' · '+fmtDate(d.date)+'</div></div>'+(d.dataUrl?'<a href="'+d.dataUrl+'" download="'+esc(d.name)+'" class="btn btn-ghost btn-icon btn-sm" onclick="event.stopPropagation()">'+icon('dl',14)+'</a>':'')+' </div>';}).join('')+
      '</div></div></div>';
  }
  wrap.innerHTML=html;
  wrap.querySelectorAll('.doc-ph').forEach(function(th){
    th.addEventListener('click',function(){
      var ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;z-index:9000;cursor:zoom-out;flex-direction:column;gap:10px';
      ov.innerHTML='<img src="'+th.dataset.src+'" style="max-width:92vw;max-height:84vh;border-radius:8px;object-fit:contain"><div style="font-size:12px;color:rgba(255,255,255,.5)">'+th.title+'</div>';
      ov.addEventListener('click',function(){ov.remove();});document.body.appendChild(ov);
    });
  });
  wrap.querySelectorAll('.doc-row').forEach(function(row){row.addEventListener('click',function(e){if(e.target.closest('a'))return;navigate('jobs',{jobId:row.dataset.job});});});
}

/* ═══════════════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════════════ */
var _stab='general';
function renderSettings(el,params){
  params=params||{};
  document.getElementById('page-title').textContent='Settings';
  document.getElementById('topbar-actions').innerHTML='<button class="btn btn-primary" id="sv-settings">Save Settings</button>';
  if(params.tab)_stab=params.tab;
  el.innerHTML='<div style="max-width:760px"><div class="tabs">'+
    '<button class="tab-btn" data-tab="general">General</button>'+
    '<button class="tab-btn" data-tab="jobtypes">Job Types</button>'+
    '<button class="tab-btn" data-tab="data">Data &amp; Storage</button>'+
    '</div><div id="stab-body"></div></div>';
  el.querySelectorAll('.tab-btn').forEach(function(btn){
    btn.classList.toggle('active',btn.dataset.tab===_stab);
    btn.addEventListener('click',function(){_stab=btn.dataset.tab;el.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b===btn);});stRenderTab();stAttachSave();});
  });
  stRenderTab(); stAttachSave();
}
function stRenderTab(){
  var s=getSettings(), body=document.getElementById('stab-body'); if(!body)return;
  if(_stab==='general'){
    body.innerHTML='<div class="card"><div class="card-header"><span class="card-title">Technician Profile</span></div><div class="card-body"><div class="form-row">'+
      formGrp(false,'Your Name','<input class="form-input" id="s-name" value="'+esc(s.technicianName||'')+'" placeholder="Full name">')+
      formGrp(false,'Company','<input class="form-input" id="s-company" value="'+esc(s.company||'')+'" placeholder="Company name">')+
      formGrp(false,'Phone','<input class="form-input" id="s-phone" value="'+esc(s.phone||'')+'" placeholder="04xx xxx xxx">')+
      formGrp(false,'Email','<input class="form-input" id="s-email" value="'+esc(s.email||'')+'" placeholder="you@example.com">') +
      '</div></div></div>'+
      '<div class="card mt-16"><div class="card-header"><span class="card-title">Account</span></div><div class="card-body">'+
      '<div style="display:flex;gap:8px;align-items:center"><button class="btn btn-secondary" id="st-logout" style="gap:6px">'+icon('person',14)+' Sign Out</button><span style="font-size:12px;color:var(--text-2)">Signed in as Jaiden</span></div>'+
      '</div></div>';
    body.querySelector('#st-logout').addEventListener('click',logout);
  } else if(_stab==='jobtypes'){
    var types=(s.jobTypes||JOB_TYPES).slice();
    function renderTList(){
      var l=body.querySelector('#types-list');
      l.innerHTML=types.map(function(t,i){return '<div class="file-item" style="cursor:default"><div class="file-item-info"><span style="font-size:13px">'+esc(t)+'</span></div><span style="cursor:pointer;color:var(--text-3);padding:4px" class="del-type" data-idx="'+i+'">✕</span></div>';}).join('');
      l.querySelectorAll('.del-type').forEach(function(btn){btn.addEventListener('click',function(){types.splice(parseInt(btn.dataset.idx),1);renderTList();});});
    }
    body.innerHTML='<div class="card"><div class="card-header"><span class="card-title">Available Job Types</span><button class="btn btn-ghost btn-sm" id="reset-types">Reset to Defaults</button></div><div class="card-body">'+
      '<p style="font-size:12.5px;color:var(--text-2);margin-bottom:14px">These appear as checkboxes when creating a new job.</p>'+
      '<div id="types-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px"></div>'+
      '<div style="display:flex;gap:8px"><input class="form-input" id="new-type-inp" placeholder="Add custom job type…" style="flex:1"><button class="btn btn-secondary" id="add-type-btn">Add</button></div></div></div>';
    renderTList();
    body.querySelector('#reset-types').addEventListener('click',function(){types=JOB_TYPES.slice();renderTList();toast('Reset to defaults','info');});
    body.querySelector('#add-type-btn').addEventListener('click',function(){var v=body.querySelector('#new-type-inp').value.trim();if(!v)return;if(types.includes(v)){toast('Already in list','error');return;}types.push(v);body.querySelector('#new-type-inp').value='';renderTList();});
    body.querySelector('#new-type-inp').addEventListener('keydown',function(e){if(e.key==='Enter')body.querySelector('#add-type-btn').click();});
    document.getElementById('sv-settings').onclick=function(){var s2=getSettings();s2.jobTypes=types;saveSettings(s2);toast('Job types saved','success');};
  } else if(_stab==='data'){
    var used=storageUsage(), pct=Math.min(Math.round(used/(5*1024*1024)*100),100);
    body.innerHTML='<div class="card"><div class="card-header"><span class="card-title">Storage Usage</span></div><div class="card-body">'+
      '<div style="margin-bottom:10px;font-size:13px"><strong>'+fmtBytes(used)+'</strong> used of ~5 MB limit</div>'+
      '<div style="background:var(--bg-3);border-radius:10px;height:8px;overflow:hidden"><div style="background:'+(pct>85?'var(--red)':pct>60?'var(--orange)':'var(--accent)')+';height:100%;width:'+pct+'%;border-radius:10px"></div></div>'+
      '<p style="font-size:12px;color:var(--text-2);margin-top:8px">Large photos are compressed automatically before storing.</p></div></div>'+
      '<div class="card mt-16"><div class="card-header"><span class="card-title">Export / Import</span></div><div class="card-body" style="display:flex;flex-direction:column;gap:10px">'+
      '<div style="display:flex;gap:8px;align-items:center"><button class="btn btn-secondary" id="st-export" style="gap:6px">'+icon('dl',14)+' Export All Data (JSON)</button><span style="font-size:12px;color:var(--text-2)">Downloads a full backup</span></div>'+
      '<div style="display:flex;gap:8px;align-items:center"><button class="btn btn-secondary" id="st-import" style="gap:6px">'+icon('ul',14)+' Import Data (JSON)</button><span style="font-size:12px;color:var(--text-2)">Merges with existing data</span></div>'+
      '</div></div>'+
      '<div class="card mt-16" style="border-color:rgba(255,69,58,.2)"><div class="card-header"><span class="card-title" style="color:var(--red)">Danger Zone</span></div><div class="card-body">'+
      '<div style="display:flex;gap:8px;align-items:center"><button class="btn btn-danger" id="st-clear" style="gap:6px">'+icon('trash',14)+' Clear All Data</button><span style="font-size:12px;color:var(--text-2)">Permanently removes everything</span></div></div></div>';
    body.querySelector('#st-export').addEventListener('click',stExport);
    body.querySelector('#st-import').addEventListener('click',stImport);
    body.querySelector('#st-clear').addEventListener('click',async function(){
      if(!await confirmDlg('Clear ALL data? This deletes every job, client and setting. Cannot be undone.'))return;
      clearAll();toast('All data cleared','info');updateBadges();navigate('dashboard');
    });
  }
}
function stAttachSave(){
  var btn=document.getElementById('sv-settings');if(!btn)return;
  btn.onclick=function(){
    var n=document.getElementById('s-name');if(!n)return;
    var s=getSettings();
    s.technicianName=n.value.trim();
    s.company=(document.getElementById('s-company')||{}).value||'';
    s.phone=(document.getElementById('s-phone')||{}).value||'';
    s.email=(document.getElementById('s-email')||{}).value||'';
    saveSettings(s);
    var sub=document.getElementById('tech-name-display');if(sub)sub.textContent=s.technicianName||'Field Technician';
    toast('Settings saved','success');
  };
}
function stExport(){
  var data={exported:new Date().toISOString(),version:1,jobs:JSON.parse(localStorage.getItem('td_jobs')||'[]'),clients:JSON.parse(localStorage.getItem('td_clients')||'[]'),settings:JSON.parse(localStorage.getItem('td_settings')||'{}')};
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='techdoc-export-'+todayISO()+'.json';a.click();URL.revokeObjectURL(url);toast('Export downloaded','success');
}
function stImport(){
  var inp=document.createElement('input');inp.type='file';inp.accept='.json';
  inp.onchange=function(){
    var file=inp.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(e){
      try{
        var data=JSON.parse(e.target.result);
        if(!data.jobs||!data.clients)throw new Error('Invalid format');
        var ec=JSON.parse(localStorage.getItem('td_clients')||'[]');
        data.clients.forEach(function(c){if(!ec.find(function(x){return x.id===c.id;}))ec.push(c);});
        localStorage.setItem('td_clients',JSON.stringify(ec));
        var ej=JSON.parse(localStorage.getItem('td_jobs')||'[]');
        data.jobs.forEach(function(j){if(!ej.find(function(x){return x.id===j.id;}))ej.push(j);});
        localStorage.setItem('td_jobs',JSON.stringify(ej));
        toast('Imported '+data.clients.length+' clients, '+data.jobs.length+' jobs','success');updateBadges();navigate('dashboard');
      }catch(err){toast('Invalid JSON file','error');}
    };
    reader.readAsText(file);
  };
  inp.click();
}

/* ═══════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════ */
var _AUTH_USER='Jaiden', _AUTH_PASS='Jaiden2020', _AUTH_KEY='td_auth';

function isLoggedIn(){ return localStorage.getItem(_AUTH_KEY)==='1'; }

function logout(){
  localStorage.removeItem(_AUTH_KEY);
  location.reload();
}

function initLogin(){
  var screen=document.getElementById('login-screen');
  var form=document.getElementById('login-form');
  if(!screen||!form)return;
  // Focus username field
  var uField=document.getElementById('login-user');
  if(uField)setTimeout(function(){uField.focus();},120);
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var u=(document.getElementById('login-user').value||'').trim();
    var p=(document.getElementById('login-pass').value||'');
    var err=document.getElementById('login-err');
    if(u===_AUTH_USER && p===_AUTH_PASS){
      localStorage.setItem(_AUTH_KEY,'1');
      screen.classList.add('hidden');
      startApp();
    } else {
      err.style.display='';
      document.getElementById('login-pass').value='';
      document.getElementById('login-pass').focus();
    }
  });
}

function startApp(){
  try{
    seedIfEmpty();
    var s=getSettings();
    if(s.technicianName){var sub=document.getElementById('tech-name-display');if(sub)sub.textContent=s.technicianName;}
    document.querySelectorAll('.nav-item[data-view]').forEach(function(item){item.addEventListener('click',function(){navigate(item.dataset.view);});});
    document.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key==='n'){e.preventDefault();navigate('new-job');}});
    navigate('dashboard');
  }catch(err){
    var el=document.getElementById('page-content');
    if(el)el.innerHTML='<div class="empty-state"><div class="empty-state-icon" style="color:var(--red)">'+icon('warn',40)+'</div><div class="empty-state-title" style="opacity:1;color:var(--red)">Startup Error</div><div class="empty-state-desc" style="color:var(--red)">'+esc(String(err))+'</div></div>';
    console.error('TechDoc init error:',err);
  }
}

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
function init(){
  if(isLoggedIn()){
    document.getElementById('login-screen').classList.add('hidden');
    startApp();
  } else {
    initLogin();
  }
}
document.addEventListener('DOMContentLoaded',init);
