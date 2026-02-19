/* ── Static reference data ────────────────────── */

export const JOB_TYPES = [
  // Desktop & Laptops
  'Desktop Deployment',
  'Laptop Setup',
  'PC Rebuild / Upgrade',
  // Servers & Infrastructure
  'Server Installation',
  'Server Maintenance',
  'NAS / Storage Setup',
  // Network
  'Network Configuration',
  'WiFi Setup',
  'WiFi Troubleshooting',
  'Cabling & Patching',
  'VPN Setup',
  // Software
  'Software Installation',
  'Windows Update / Patching',
  'Office 365 Setup',
  'Email Configuration',
  'Antivirus / Security',
  'Virus / Malware Removal',
  // Hardware
  'Hardware Repair',
  'Hardware Replacement',
  'Printer Setup',
  'Printer Troubleshooting',
  'UPS Installation',
  // Security & Surveillance
  'CCTV Installation',
  'Security System Setup',
  'Access Control',
  // Communications
  'VoIP / Phone System',
  'Remote Support Setup',
  // Data
  'Data Backup',
  'Data Recovery',
  'Data Migration',
  // Users & Admin
  'User Account Setup',
  'Active Directory',
  'Remote Desktop',
  // Other
  'POS System',
  'Site Survey',
  'User Training',
  'General IT Support',
];

export const DEFAULT_JOB_CHECKLIST = [
  'Check in with site contact',
  'Document existing setup / take photos',
  'Complete work',
  'Test all functionality',
  'Update asset register',
  'Client sign-off obtained',
  'Clean up workspace',
];

export const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending',     badge: 'badge-gray' },
  { value: 'in-progress', label: 'In Progress',  badge: 'badge-orange' },
  { value: 'completed',   label: 'Completed',    badge: 'badge-green' },
  { value: 'cancelled',   label: 'Cancelled',    badge: 'badge-red' },
];

export const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
];

export const STATUS_BADGE = {
  'pending':     'badge-gray',
  'in-progress': 'badge-orange',
  'completed':   'badge-green',
  'cancelled':   'badge-red',
};

export const PRIORITY_LABEL = {
  'low':    'Low',
  'medium': 'Medium',
  'high':   'High',
};

/* ── Sample seed data (Perth, WA) ────────────── */
export const SAMPLE_CLIENTS = [
  {
    name: 'Pinnacle Mining Solutions',
    contact: 'Sarah Bennett',
    phone: '08 9481 2200',
    email: 'sarah.bennett@pinnaclemining.com.au',
    address: '1 William Street',
    suburb: 'Perth',
    postcode: '6000',
    lat: -31.9530,
    lng: 115.8590,
    notes: 'Large corporate client — 80+ workstations across 3 floors. Security door entry, contact Sarah on arrival.',
    tags: ['Corporate', 'Priority'],
  },
  {
    name: 'Fremantle Medical Centre',
    contact: 'Dr James Nolan',
    phone: '08 9335 1100',
    email: 'admin@fremantlemedical.com.au',
    address: '12 High Street',
    suburb: 'Fremantle',
    postcode: '6160',
    lat: -32.0550,
    lng: 115.7480,
    notes: 'Medical practice — strict infection control. Do not enter clinical areas without PPE. After-hours access via Dr Nolan.',
    tags: ['Medical'],
  },
  {
    name: 'Scarborough Beach Bar & Grill',
    contact: 'Mike Torrisi',
    phone: '0412 334 009',
    email: 'mike@scarboroughbbg.com.au',
    address: '150 Scarborough Beach Road',
    suburb: 'Scarborough',
    postcode: '6019',
    lat: -31.8960,
    lng: 115.7590,
    notes: 'POS system + CCTV. Best time to service is Tuesday mornings before 10am.',
    tags: ['Hospitality'],
  },
  {
    name: 'Joondalup City Council IT',
    contact: 'Rachel Kim',
    phone: '08 9400 4000',
    email: 'rkim@joondalup.wa.gov.au',
    address: '90 Boas Avenue',
    suburb: 'Joondalup',
    postcode: '6027',
    lat: -31.7432,
    lng: 115.7648,
    notes: 'Government — induction required before first visit. Parking behind building on Boas Ave.',
    tags: ['Government'],
  },
  {
    name: 'Rockingham Auto Parts',
    contact: 'Dave Carpenter',
    phone: '08 9527 8811',
    email: 'dave@rockauto.com.au',
    address: '45 Dixon Road',
    suburb: 'Rockingham',
    postcode: '6168',
    lat: -32.2769,
    lng: 115.7312,
    notes: 'Small business — 3 POS terminals and a NAS. Dave is very hands-on and likes updates.',
    tags: ['SMB'],
  },
];

export const SAMPLE_JOBS = [
  {
    clientIdx: 0,
    date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0,10),
    jobTypes: ['Desktop Deployment', 'Office 365 Setup', 'User Account Setup'],
    status: 'completed',
    priority: 'high',
    notes: 'Deployed 12 new Dell OptiPlex 7090s on Level 3. Installed Windows 11 Pro, Office 365, and configured AD accounts. All machines joined to domain and tested successfully.',
    timeIn: '08:00',
    timeOut: '16:30',
  },
  {
    clientIdx: 1,
    date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0,10),
    jobTypes: ['Server Maintenance', 'Data Backup'],
    status: 'completed',
    priority: 'medium',
    notes: 'Monthly server maintenance. Replaced failing drive in RAID array, ran full backup to offsite NAS. Server health checks all clear.',
    timeIn: '07:30',
    timeOut: '10:00',
  },
  {
    clientIdx: 2,
    date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0,10),
    jobTypes: ['CCTV Installation', 'Network Configuration'],
    status: 'in-progress',
    priority: 'medium',
    notes: 'Installing 8-camera CCTV system. Camera 4 and 5 still need cabling through ceiling. Return visit needed to finish.',
    timeIn: '09:00',
    timeOut: '17:00',
  },
  {
    clientIdx: 3,
    date: new Date().toISOString().slice(0,10),
    jobTypes: ['WiFi Troubleshooting', 'Network Configuration'],
    status: 'pending',
    priority: 'low',
    notes: 'Reported intermittent WiFi dropouts in east wing. Investigate AP coverage and channel interference.',
    timeIn: '',
    timeOut: '',
  },
];
