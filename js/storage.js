/* ── Storage layer — all data lives in localStorage ── */

import { SAMPLE_CLIENTS, SAMPLE_JOBS, DEFAULT_JOB_CHECKLIST } from './data.js';

const K = {
  JOBS:     'td_jobs',
  CLIENTS:  'td_clients',
  SETTINGS: 'td_settings',
  SEQ:      'td_seq',       // job number counter
};

/* ── ID / sequence ───────────────────────────────────── */
export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function nextJobNumber() {
  const n = parseInt(localStorage.getItem(K.SEQ) || '0', 10) + 1;
  localStorage.setItem(K.SEQ, n);
  return `JOB-${String(n).padStart(4, '0')}`;
}

/* ── Generic helpers ─────────────────────────────────── */
function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ── Clients ─────────────────────────────────────────── */
export function getClients() { return load(K.CLIENTS); }

export function getClient(id) { return getClients().find(c => c.id === id) || null; }

export function saveClient(client) {
  const all = getClients();
  if (!client.id) {
    client.id        = genId();
    client.createdAt = new Date().toISOString();
  }
  client.updatedAt = new Date().toISOString();
  const idx = all.findIndex(c => c.id === client.id);
  if (idx >= 0) all[idx] = client; else all.unshift(client);
  save(K.CLIENTS, all);
  return client;
}

export function deleteClient(id) {
  save(K.CLIENTS, getClients().filter(c => c.id !== id));
}

/* ── Jobs ────────────────────────────────────────────── */
export function getJobs() { return load(K.JOBS); }

export function getJob(id) { return getJobs().find(j => j.id === id) || null; }

export function getJobsForClient(clientId) {
  return getJobs().filter(j => j.clientId === clientId);
}

export function saveJob(job) {
  const all = getJobs();
  if (!job.id) {
    job.id        = genId();
    job.jobNumber = nextJobNumber();
    job.createdAt = new Date().toISOString();
    // seed default checklist if none provided
    if (!job.checklist || job.checklist.length === 0) {
      job.checklist = DEFAULT_JOB_CHECKLIST.map(label => ({ id: genId(), label, checked: false }));
    }
  }
  job.updatedAt = new Date().toISOString();
  const idx = all.findIndex(j => j.id === job.id);
  if (idx >= 0) all[idx] = job; else all.unshift(job);
  save(K.JOBS, all);
  return job;
}

export function deleteJob(id) {
  save(K.JOBS, getJobs().filter(j => j.id !== id));
}

/* ── Settings ────────────────────────────────────────── */
const DEFAULT_SETTINGS = {
  technicianName: '',
  company: '',
  phone: '',
  email: '',
  jobTypes: null,      // null = use data.js defaults
  defaultChecklist: [], // extra items to always add
};

export function getSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(K.SETTINGS));
    return s ? { ...DEFAULT_SETTINGS, ...s } : { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveSettings(s) {
  localStorage.setItem(K.SETTINGS, JSON.stringify(s));
}

/* ── Seed ────────────────────────────────────────────── */
export function seedIfEmpty() {
  if (getClients().length > 0) return;

  const clients = SAMPLE_CLIENTS.map(c => ({
    id:        genId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    photos:    [],
    tags:      c.tags || [],
    ...c,
  }));
  save(K.CLIENTS, clients);

  const jobs = SAMPLE_JOBS.map(j => {
    const client = clients[j.clientIdx];
    return saveJob({
      clientId:      client.id,
      clientName:    client.name,
      clientAddress: `${client.address}, ${client.suburb} WA ${client.postcode}`,
      date:          j.date,
      jobTypes:      j.jobTypes,
      status:        j.status,
      priority:      j.priority,
      technician:    '',
      notes:         j.notes,
      internalNotes: '',
      timeIn:        j.timeIn,
      timeOut:       j.timeOut,
      photos:        [],
      documents:     [],
      checklist:     [],
    });
  });
  return { clients, jobs };
}

/* ── Storage usage estimate ──────────────────────────── */
export function storageUsage() {
  let bytes = 0;
  for (const key of Object.values(K)) {
    const v = localStorage.getItem(key);
    if (v) bytes += v.length * 2; // UTF-16
  }
  return bytes;
}

export function clearAll() {
  Object.values(K).forEach(k => localStorage.removeItem(k));
}
