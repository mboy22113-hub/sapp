import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -------------------------------------------------------------
// Persistent Storage Setup
// -------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseState {
  users: Array<{
    id: string;
    username: string;
    email: string;
    role: string;
    department: string;
    avatarUrl?: string;
    createdAt: string;
  }>;
  inceptions: Array<{
    id: string;
    title: string;
    description: string;
    location: string;
    category: string;
    date: string;
    status: 'Open' | 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
    classification?: string;
    inspector?: string;
    additionalDetails?: string;
    evidenceFiles: any[];
    durationSeconds?: number;
    createdAt: string;
    updatedAt?: string;
  }>;
  incidents: Array<{
    id: string;
    title: string;
    description: string;
    location: string;
    originalDate: string;
    status: 'Open' | 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
    evidenceFiles: any[];
    resolutionDate?: string;
    resolutionDurationSeconds?: number;
    resolvedBy?: string;
    resolutionNotes?: string;
    resolutionFiles?: any[];
    createdAt: string;
    updatedAt?: string;
  }>;
  evidence: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
    url?: string;
    uploadedAt: string;
    category: 'inspection_evidence' | 'resolution_evidence' | 'general_evidence';
    recordId?: string;
    recordType?: 'inception' | 'incident';
    uploadedBy?: string;
  }>;
  logs: Array<{
    id: string;
    timestamp: string;
    action: string;
    category: string;
    status: string;
    entityId?: string;
    entityType?: 'inception' | 'incident' | 'evidence' | 'resolution' | 'system';
    performedBy?: string;
    details?: string;
    severity: 'info' | 'warning' | 'error' | 'success';
  }>;
  findings: Array<{
    id: string;
    inspectionId?: string;
    title: string;
    description: string;
    likelihood: number;
    severity: number;
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    createdAt: string;
  }>;
  correctiveActions: Array<{
    id: string;
    findingId?: string;
    title: string;
    description: string;
    assignedTo?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'VERIFIED';
    dueDate?: string;
    createdAt: string;
  }>;
}

function getInitialData(): DatabaseState {
  const now = new Date();
  const dateIso = (daysAgo: number) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return d.toISOString();
  };
  const dateYmd = (daysAgo: number) => dateIso(daysAgo).split('T')[0];

  return {
    users: [
      {
        id: 'usr-admin-001',
        username: 'Alex Admin',
        email: 'admin@safetrack.dev',
        role: 'ADMIN',
        department: 'Safety & Compliance',
        createdAt: dateIso(60),
      },
      {
        id: 'usr-insp-002',
        username: 'Ian Inspector',
        email: 'inspector@safetrack.dev',
        role: 'INSPECTOR',
        department: 'Field Operations',
        createdAt: dateIso(45),
      },
      {
        id: 'usr-safe-003',
        username: 'Sara Safety',
        email: 'safety@safetrack.dev',
        role: 'SAFETY_OFFICER',
        department: 'EHS Risk Engineering',
        createdAt: dateIso(30),
      },
      {
        id: 'usr-resp-004',
        username: 'Riley Repair',
        email: 'responsible@safetrack.dev',
        role: 'RESPONSIBLE_PERSON',
        department: 'Mechanical Maintenance',
        createdAt: dateIso(20),
      },
    ],
    inceptions: [
      {
        id: 'INC-001001',
        title: 'Boiler Room Steam Valve Leakage',
        description: 'High pressure safety relief valve showing minor weeping and pressure fluctuation.',
        location: 'Sector B - Thermal Plant',
        category: 'Pressure Systems',
        classification: 'High Risk',
        inspector: 'Sara Safety',
        date: dateYmd(3),
        status: 'Open',
        additionalDetails: 'Immediate lock-out inspection initiated. Requires certified steam pipe technician.',
        evidenceFiles: [
          {
            id: 'ev-001',
            name: 'valve_flange_leak.jpg',
            size: 245000,
            type: 'image/jpeg',
            url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
            uploadedAt: dateIso(3),
            category: 'inspection_evidence',
            recordId: 'INC-001001',
            recordType: 'inception',
            uploadedBy: 'Sara Safety',
          },
        ],
        durationSeconds: 0,
        createdAt: dateIso(3),
        updatedAt: dateIso(1),
      },
      {
        id: 'INC-001002',
        title: 'Unguarded Primary Conveyor Belt Tensioner',
        description: 'Nip point guard removed during weekend motor servicing and not re-fastened.',
        location: 'Assembly Line 3 - West Wing',
        category: 'Machinery Guarding',
        classification: 'Medium Risk',
        inspector: 'Ian Inspector',
        date: dateYmd(6),
        status: 'In Progress',
        additionalDetails: 'Work order #W-984 issued to mechanical team to install interlocked guard.',
        evidenceFiles: [],
        durationSeconds: 0,
        createdAt: dateIso(6),
        updatedAt: dateIso(2),
      },
      {
        id: 'INC-001003',
        title: 'Corrosive Chemical Cabinet Ventilation Inadequacy',
        description: 'Exhaust fan flow rate below 150 CFM required threshold in nitric acid storage area.',
        location: 'Chemical Storage Vault 2',
        category: 'Hazardous Materials',
        classification: 'Critical',
        inspector: 'Alex Admin',
        date: dateYmd(8),
        status: 'Pending',
        additionalDetails: 'Air testing verified trace vapors. Area evacuated and restricted.',
        evidenceFiles: [],
        durationSeconds: 0,
        createdAt: dateIso(8),
        updatedAt: dateIso(5),
      },
    ],
    incidents: [
      {
        id: 'INC-002001',
        title: 'Tripping Hazard along Loading Bay Dock 4',
        description: 'Damaged expansion joint created a 2-inch uneven lip catching pallet jacks.',
        location: 'Logistics Bay 4',
        originalDate: dateYmd(4),
        status: 'Open',
        evidenceFiles: [],
        createdAt: dateIso(4),
        updatedAt: dateIso(4),
      },
      {
        id: 'INC-002002',
        title: 'Overloaded Electrical Multi-tap near CNC Station 2',
        description: 'Daisy-chained surge protectors powering industrial coolants and auxiliary drills.',
        location: 'Precision Machine Shop',
        originalDate: dateYmd(7),
        status: 'In Progress',
        evidenceFiles: [],
        createdAt: dateIso(7),
        updatedAt: dateIso(2),
      },
      {
        id: 'INC-000982',
        title: 'Overheated Hydraulic Pump Unit 3',
        description: 'Bearing friction temperature reached 92°C with hydraulic oil discoloration.',
        location: 'Heavy Stamping Facility',
        originalDate: dateYmd(14),
        status: 'Resolved',
        resolutionDate: dateYmd(12),
        resolutionDurationSeconds: 172800, // 2 days
        resolvedBy: 'Sara Safety',
        resolutionNotes: 'Replaced sealed ceramic bearing, refreshed ISO VG 46 synthetic oil, and ran 4-hour thermal run-in test under 80% payload with maximum 58°C stable operating temp.',
        resolutionFiles: [
          {
            id: 'ev-res-001',
            name: 'repaired_bearing_housing.jpg',
            size: 198000,
            type: 'image/jpeg',
            url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
            uploadedAt: dateIso(12),
            category: 'resolution_evidence',
            recordId: 'INC-000982',
            recordType: 'incident',
            uploadedBy: 'Sara Safety',
          },
        ],
        evidenceFiles: [],
        createdAt: dateIso(14),
        updatedAt: dateIso(12),
      },
      {
        id: 'INC-000975',
        title: 'Emergency Eye Wash Station Low Water Pressure',
        description: 'Stagnant mineral buildup restricted dual spray nozzle output below 0.4 GPM.',
        location: 'Quality Assurance Testing Lab',
        originalDate: dateYmd(22),
        status: 'Resolved',
        resolutionDate: dateYmd(21),
        resolutionDurationSeconds: 86400, // 1 day
        resolvedBy: 'Ian Inspector',
        resolutionNotes: 'Acid descaled supply piping, replaced aerator screens, and calibrated flow rate to 0.48 GPM certified to ANSI Z358.1.',
        resolutionFiles: [
          {
            id: 'ev-res-002',
            name: 'eyewash_flow_calibration.png',
            size: 142000,
            type: 'image/png',
            url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
            uploadedAt: dateIso(21),
            category: 'resolution_evidence',
            recordId: 'INC-000975',
            recordType: 'incident',
            uploadedBy: 'Ian Inspector',
          },
        ],
        evidenceFiles: [],
        createdAt: dateIso(22),
        updatedAt: dateIso(21),
      },
      {
        id: 'INC-000961',
        title: 'Exposed High-Voltage Electrical Wiring Junction',
        description: 'Junction box cover dislodged due to forklift vibration in main transformer corridor.',
        location: 'Substation 2 - Service Tunnel',
        originalDate: dateYmd(35),
        status: 'Resolved',
        resolutionDate: dateYmd(33),
        resolutionDurationSeconds: 172800, // 2 days
        resolvedBy: 'Riley Repair',
        resolutionNotes: 'De-energized circuit using LOTO procedure, installed NEMA 4X weather-sealed steel enclosure, and verified grounding continuity.',
        resolutionFiles: [
          {
            id: 'ev-res-003',
            name: 'locked_junction_box.jpg',
            size: 310000,
            type: 'image/jpeg',
            url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
            uploadedAt: dateIso(33),
            category: 'resolution_evidence',
            recordId: 'INC-000961',
            recordType: 'incident',
            uploadedBy: 'Riley Repair',
          },
        ],
        evidenceFiles: [],
        createdAt: dateIso(35),
        updatedAt: dateIso(33),
      },
    ],
    evidence: [
      {
        id: 'ev-001',
        name: 'valve_flange_leak.jpg',
        size: 245000,
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        uploadedAt: dateIso(3),
        category: 'inspection_evidence',
        recordId: 'INC-001001',
        recordType: 'inception',
        uploadedBy: 'Sara Safety',
      },
      {
        id: 'ev-res-001',
        name: 'repaired_bearing_housing.jpg',
        size: 198000,
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
        uploadedAt: dateIso(12),
        category: 'resolution_evidence',
        recordId: 'INC-000982',
        recordType: 'incident',
        uploadedBy: 'Sara Safety',
      },
      {
        id: 'ev-res-002',
        name: 'eyewash_flow_calibration.png',
        size: 142000,
        type: 'image/png',
        url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
        uploadedAt: dateIso(21),
        category: 'resolution_evidence',
        recordId: 'INC-000975',
        recordType: 'incident',
        uploadedBy: 'Ian Inspector',
      },
      {
        id: 'ev-res-003',
        name: 'locked_junction_box.jpg',
        size: 310000,
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
        uploadedAt: dateIso(33),
        category: 'resolution_evidence',
        recordId: 'INC-000961',
        recordType: 'incident',
        uploadedBy: 'Riley Repair',
      },
    ],
    logs: [
      {
        id: 'log-001',
        timestamp: dateIso(0.1),
        action: 'System Health Check',
        category: 'Telemetry',
        status: 'Success',
        entityType: 'system',
        performedBy: 'Automated Daemon',
        details: 'Safety monitoring backend verified online with database synchronizer active.',
        severity: 'info',
      },
      {
        id: 'log-002',
        timestamp: dateIso(3),
        action: 'Inception Reported',
        category: 'Pressure Systems',
        status: 'Created',
        entityId: 'INC-001001',
        entityType: 'inception',
        performedBy: 'Sara Safety',
        details: 'Logged boiler room steam relief valve weeping in Sector B.',
        severity: 'warning',
      },
      {
        id: 'log-003',
        timestamp: dateIso(12),
        action: 'Incident Resolved',
        category: 'Mechanical',
        status: 'Resolved',
        entityId: 'INC-000982',
        entityType: 'incident',
        performedBy: 'Sara Safety',
        details: 'Hydraulic pump repair certified with 48-hour resolution duration.',
        severity: 'success',
      },
    ],
    findings: [
      {
        id: 'f-001',
        inspectionId: 'INC-001001',
        title: 'Thermal valve weeping',
        description: 'Minor steam escape during high throughput cycles.',
        likelihood: 4,
        severity: 4,
        riskScore: 16,
        riskLevel: 'HIGH',
        status: 'OPEN',
        createdAt: dateIso(3),
      },
    ],
    correctiveActions: [
      {
        id: 'ca-001',
        findingId: 'f-001',
        title: 'Replace valve gasket seal',
        description: 'Install graphite-reinforced ring gasket.',
        assignedTo: 'Riley Repair',
        status: 'IN_PROGRESS',
        dueDate: dateYmd(-4),
        createdAt: dateIso(3),
      },
    ],
  };
}

let db: DatabaseState;
try {
  if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } else {
    db = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }
} catch (e) {
  db = getInitialData();
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db file', err);
  }
}

// -------------------------------------------------------------
// REST API ROUTE BUILDERS (Attached to both /api/* and /*)
// -------------------------------------------------------------
const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    records: {
      inceptions: db.inceptions.length,
      incidents: db.incidents.length,
      evidence: db.evidence.length,
      logs: db.logs.length,
    },
  });
});

// Auth Routes
apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  let user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      username: (email || 'Safety Operator').split('@')[0],
      email: email || 'operator@safetrack.dev',
      role: 'Safety Officer',
      department: 'Safety & Compliance',
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDb();
  }

  const token = `jwt_token_${user.id}_${Date.now()}`;
  res.json({
    user,
    token,
    expiresIn: 86400,
  });
});

apiRouter.post('/auth/register', (req, res) => {
  const { username, email } = req.body || {};
  let user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      username: username || 'Safety Specialist',
      email: email || `user_${Date.now()}@safetrack.dev`,
      role: 'Safety Officer',
      department: 'Field Operations',
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    saveDb();
  }

  const token = `jwt_token_${user.id}_${Date.now()}`;
  res.json({
    user,
    token,
    expiresIn: 86400,
  });
});

apiRouter.post('/auth/logout', (_req, res) => {
  res.json({ status: 'ok', message: 'Logged out successfully' });
});

apiRouter.get('/auth/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const matched = db.users.find((u) => token.includes(u.id));
    if (matched) return res.json(matched);
  }
  const defaultUser = db.users[0];
  res.json(defaultUser);
});

apiRouter.post('/auth/refresh', (req, res) => {
  const refreshedToken = `jwt_refresh_${Date.now()}`;
  res.json({ token: refreshedToken });
});

// Inceptions / Inspections
apiRouter.get('/inceptions', (req, res) => {
  const { page = '1', pageSize = '20', search } = req.query as Record<string, string>;
  let list = [...db.inceptions];
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, parseInt(pageSize, 10) || 20);
  const total = list.length;
  const totalPages = Math.ceil(total / ps) || 1;
  const data = list.slice((p - 1) * ps, p * ps);

  res.json({
    data,
    page: p,
    pageSize: ps,
    total,
    totalPages,
  });
});

apiRouter.get('/inceptions/:id', (req, res) => {
  const item = db.inceptions.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Inception not found' });
  res.json(item);
});

apiRouter.post('/inceptions', (req, res) => {
  const dto = req.body || {};
  const newInception = {
    id: `INC-${Date.now().toString().slice(-6)}`,
    title: dto.title || 'Untitled Inception',
    description: dto.description || '',
    location: dto.location || 'Site Facility',
    category: dto.category || 'General',
    classification: dto.classification || 'Low Risk',
    inspector: dto.inspector || 'Current Inspector',
    date: dto.date || new Date().toISOString().split('T')[0],
    status: (dto.status || 'Open') as any,
    additionalDetails: dto.additionalDetails || '',
    evidenceFiles: dto.evidenceFiles || [],
    durationSeconds: dto.durationSeconds || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.inceptions.unshift(newInception);

  // Sync attached evidence files into central evidence store
  if (Array.isArray(dto.evidenceFiles)) {
    dto.evidenceFiles.forEach((file: any) => {
      if (!db.evidence.some((e) => e.id === file.id)) {
        db.evidence.unshift({
          ...file,
          recordId: newInception.id,
          recordType: 'inception',
        });
      }
    });
  }

  // Audit log
  db.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'Inception Created',
    category: newInception.category,
    status: 'Created',
    entityId: newInception.id,
    entityType: 'inception',
    performedBy: newInception.inspector,
    details: `Created new inception record: ${newInception.title}`,
    severity: 'info',
  });

  saveDb();
  res.status(201).json(newInception);
});

apiRouter.put('/inceptions/:id', (req, res) => {
  const index = db.inceptions.findIndex((i) => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Inception not found' });

  const updated = {
    ...db.inceptions[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  db.inceptions[index] = updated;

  db.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'Inception Updated',
    category: updated.category,
    status: updated.status,
    entityId: updated.id,
    entityType: 'inception',
    performedBy: updated.inspector || 'Safety Specialist',
    details: `Updated details for ${updated.title}`,
    severity: 'info',
  });

  saveDb();
  res.json(updated);
});

apiRouter.delete('/inceptions/:id', (req, res) => {
  const id = req.params.id;
  const initialCount = db.inceptions.length;
  db.inceptions = db.inceptions.filter((i) => i.id !== id);
  if (db.inceptions.length === initialCount) {
    return res.status(404).json({ message: 'Inception not found' });
  }

  db.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'Inception Deleted',
    category: 'Safety Management',
    status: 'Deleted',
    entityId: id,
    entityType: 'inception',
    performedBy: 'Administrator',
    details: `Deleted inception record ${id}`,
    severity: 'warning',
  });

  saveDb();
  res.json({ success: true, message: `Inception ${id} deleted` });
});

// Inspections alias routes (for backend compatibility)
apiRouter.get('/inspections', (req, res) => {
  res.json(db.inceptions);
});
apiRouter.get('/inspections/:id', (req, res) => {
  const item = db.inceptions.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Inspection not found' });
  res.json(item);
});

// Incidents
apiRouter.get('/incidents', (req, res) => {
  const { status, search, page = '1', pageSize = '20' } = req.query as Record<string, string>;
  let list = [...db.incidents];

  if (status) {
    list = list.filter((i) => i.status.toLowerCase() === status.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (i) => i.title.toLowerCase().includes(q) || i.location.toLowerCase().includes(q)
    );
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, parseInt(pageSize, 10) || 20);
  const total = list.length;
  const totalPages = Math.ceil(total / ps) || 1;
  const data = list.slice((p - 1) * ps, p * ps);

  res.json({
    data,
    page: p,
    pageSize: ps,
    total,
    totalPages,
  });
});

apiRouter.get('/incidents/resolved', (req, res) => {
  const { search, page = '1', pageSize = '20' } = req.query as Record<string, string>;
  let list = db.incidents.filter((i) => i.status === 'Resolved');

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        (i.resolvedBy && i.resolvedBy.toLowerCase().includes(q))
    );
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, parseInt(pageSize, 10) || 20);
  const total = list.length;
  const totalPages = Math.ceil(total / ps) || 1;
  const data = list.slice((p - 1) * ps, p * ps);

  res.json({
    data,
    page: p,
    pageSize: ps,
    total,
    totalPages,
  });
});

apiRouter.get('/incidents/:id', (req, res) => {
  const item = db.incidents.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Incident not found' });
  res.json(item);
});

apiRouter.post('/incidents', (req, res) => {
  const dto = req.body || {};
  const newIncident = {
    id: `INC-${Date.now().toString().slice(-6)}`,
    title: dto.title || 'Untitled Incident',
    description: dto.description || '',
    location: dto.location || 'Facility Dock',
    originalDate: dto.originalDate || new Date().toISOString().split('T')[0],
    status: (dto.status || 'Open') as any,
    evidenceFiles: dto.evidenceFiles || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.incidents.unshift(newIncident);
  saveDb();
  res.status(201).json(newIncident);
});

apiRouter.post('/incidents/:id/resolve', (req, res) => {
  const id = req.params.id;
  const index = db.incidents.findIndex((i) => i.id === id);
  if (index === -1) return res.status(404).json({ message: 'Incident not found' });

  const inc = db.incidents[index];
  const { resolutionNotes, resolvedBy, resolutionDate, resolutionFiles } = req.body || {};

  const resDate = resolutionDate || new Date().toISOString().split('T')[0];
  const startMs = new Date(inc.originalDate).getTime();
  const endMs = new Date(resDate).getTime();
  let durationSeconds = 0;
  if (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs) {
    durationSeconds = Math.floor((endMs - startMs) / 1000);
  }

  const resolved = {
    ...inc,
    status: 'Resolved' as const,
    resolutionDate: resDate,
    resolvedBy: resolvedBy || 'Safety Officer',
    resolutionNotes: resolutionNotes || 'Resolution completed and verified.',
    resolutionFiles: resolutionFiles || [],
    resolutionDurationSeconds: durationSeconds,
    updatedAt: new Date().toISOString(),
  };

  db.incidents[index] = resolved;

  // Add resolution files to evidence store
  if (Array.isArray(resolutionFiles)) {
    resolutionFiles.forEach((file: any) => {
      if (!db.evidence.some((e) => e.id === file.id)) {
        db.evidence.unshift({
          ...file,
          recordId: id,
          recordType: 'incident',
          category: 'resolution_evidence',
        });
      }
    });
  }

  // Audit log
  db.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'Incident Resolved',
    category: 'Resolution',
    status: 'Resolved',
    entityId: id,
    entityType: 'resolution',
    performedBy: resolved.resolvedBy,
    details: `Resolved with duration of ${durationSeconds} seconds. Notes: ${resolved.resolutionNotes.slice(0, 50)}...`,
    severity: 'success',
  });

  saveDb();
  res.json(resolved);
});

// Evidence
apiRouter.get('/evidence', (req, res) => {
  const { recordId, category, page = '1', pageSize = '50' } = req.query as Record<string, string>;
  let list = [...db.evidence];

  if (recordId) {
    list = list.filter((e) => e.recordId === recordId);
  }
  if (category) {
    list = list.filter((e) => e.category === category);
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, parseInt(pageSize, 10) || 50);
  const total = list.length;
  const totalPages = Math.ceil(total / ps) || 1;
  const data = list.slice((p - 1) * ps, p * ps);

  res.json({
    data,
    page: p,
    pageSize: ps,
    total,
    totalPages,
  });
});

apiRouter.post('/evidence/upload', (req, res) => {
  const file = req.body;
  if (!file || !file.name) {
    return res.status(400).json({ message: 'Invalid evidence file payload' });
  }

  const newFile = {
    id: file.id || `ev-${Date.now()}`,
    name: file.name,
    size: file.size || 0,
    type: file.type || 'application/octet-stream',
    dataUrl: file.dataUrl,
    url: file.url || file.dataUrl,
    uploadedAt: file.uploadedAt || new Date().toISOString(),
    category: file.category || 'general_evidence',
    recordId: file.recordId,
    recordType: file.recordType,
    uploadedBy: file.uploadedBy || 'Current User',
  };

  db.evidence.unshift(newFile);

  db.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'Evidence Uploaded',
    category: newFile.category,
    status: 'Stored',
    entityId: newFile.id,
    entityType: 'evidence',
    performedBy: newFile.uploadedBy,
    details: `Uploaded evidence file ${newFile.name} (${Math.round(newFile.size / 1024)} KB)`,
    severity: 'info',
  });

  saveDb();
  res.status(201).json(newFile);
});

apiRouter.delete('/evidence/:id', (req, res) => {
  const id = req.params.id;
  db.evidence = db.evidence.filter((e) => e.id !== id);
  saveDb();
  res.json({ success: true, message: `Evidence ${id} deleted` });
});

// Logs & Audits
apiRouter.get('/logs', (req, res) => {
  const {
    category,
    status,
    severity,
    search,
    page = '1',
    pageSize = '50',
  } = req.query as Record<string, string>;
  let list = [...db.logs];

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        (l.performedBy && l.performedBy.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q))
    );
  }

  if (category && category !== 'all') {
    list = list.filter((l) => l.category.toLowerCase() === category.toLowerCase());
  }

  if (status && status !== 'all') {
    list = list.filter((l) => l.status.toLowerCase() === status.toLowerCase());
  }

  if (severity && severity !== 'all') {
    list = list.filter((l) => l.severity === severity);
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, parseInt(pageSize, 10) || 50);
  const total = list.length;
  const totalPages = Math.ceil(total / ps) || 1;
  const data = list.slice((p - 1) * ps, p * ps);

  res.json({
    data,
    page: p,
    pageSize: ps,
    total,
    totalPages,
  });
});

apiRouter.post('/logs', (req, res) => {
  const body = req.body || {};
  const newLog = {
    id: body.id || `log-${Date.now()}`,
    timestamp: body.timestamp || new Date().toISOString(),
    action: body.action || 'Custom Action',
    category: body.category || 'General',
    status: body.status || 'Recorded',
    entityId: body.entityId,
    entityType: body.entityType,
    performedBy: body.performedBy || 'System User',
    details: body.details || '',
    severity: body.severity || 'info',
  };

  db.logs.unshift(newLog);
  saveDb();
  res.status(201).json(newLog);
});

apiRouter.get('/audit-logs', (_req, res) => {
  res.json(db.logs);
});

// Dashboard Metrics
apiRouter.get('/dashboard/summary', (_req, res) => {
  const openInceptions = db.inceptions.filter((i) => i.status === 'Open' || i.status === 'In Progress').length;
  const resolvedIncidents = db.incidents.filter((i) => i.status === 'Resolved').length;

  res.json({
    totalInspections: db.inceptions.length,
    openInspections: openInceptions,
    totalIncidents: db.incidents.length,
    resolvedIncidents,
    evidenceFilesCount: db.evidence.length,
    logsCount: db.logs.length,
    complianceRate: '94.2%',
  });
});

apiRouter.get('/dashboard/risk-distribution', (_req, res) => {
  const riskMap: Record<string, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };
  db.inceptions.forEach((i) => {
    const cls = i.classification || 'Low Risk';
    if (cls.includes('Critical')) riskMap.Critical++;
    else if (cls.includes('High')) riskMap.High++;
    else if (cls.includes('Medium')) riskMap.Medium++;
    else riskMap.Low++;
  });

  res.json({
    distribution: Object.entries(riskMap).map(([tier, count]) => ({
      tier,
      count,
      percentage: db.inceptions.length > 0 ? Math.round((count / db.inceptions.length) * 100) : 0,
    })),
  });
});

apiRouter.get('/dashboard/compliance', (_req, res) => {
  res.json({
    rate: 94.2,
    passCount: 48,
    failCount: 3,
    naCount: 2,
  });
});

apiRouter.get('/dashboard/overdue-actions', (_req, res) => {
  res.json(db.correctiveActions);
});

// Profile and Users
apiRouter.get('/profile', (_req, res) => {
  res.json(db.users[0]);
});

apiRouter.patch('/profile', (req, res) => {
  const user = db.users[0];
  if (req.body.full_name || req.body.username) {
    user.username = req.body.full_name || req.body.username;
  }
  if (req.body.department) {
    user.department = req.body.department;
  }
  saveDb();
  res.json(user);
});

apiRouter.get('/users', (_req, res) => {
  res.json(db.users);
});

// Findings & Corrective actions endpoints
apiRouter.get('/findings', (_req, res) => {
  res.json(db.findings);
});

apiRouter.post('/findings', (req, res) => {
  const { title, description, likelihood, severity } = req.body || {};
  const l = Number(likelihood) || 3;
  const s = Number(severity) || 3;
  const score = l * s;
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (score > 16) riskLevel = 'CRITICAL';
  else if (score > 9) riskLevel = 'HIGH';
  else if (score > 4) riskLevel = 'MEDIUM';

  const finding = {
    id: `f-${Date.now()}`,
    title: title || 'Finding',
    description: description || '',
    likelihood: l,
    severity: s,
    riskScore: score,
    riskLevel,
    status: 'OPEN' as const,
    createdAt: new Date().toISOString(),
  };
  db.findings.unshift(finding);
  saveDb();
  res.status(201).json(finding);
});

apiRouter.get('/corrective-actions', (_req, res) => {
  res.json(db.correctiveActions);
});

// Mount the API Router under /api, custom env prefix (e.g. VITE_API_BASE_URL=sid1720), and root
app.use('/api', apiRouter);

const envBase = (process.env.VITE_API_BASE_URL || '').trim();
if (envBase && !envBase.startsWith('http')) {
  const cleanEnvBase = `/${envBase.replace(/^\/+|\/+$/g, '')}`;
  if (cleanEnvBase !== '/api') {
    app.use(cleanEnvBase, apiRouter);
    app.use(`${cleanEnvBase}/api`, apiRouter);
  }
}

// Support any dynamic prefix like /:prefix/api or /:prefix/auth/*
app.use('/:prefix/api', apiRouter);
app.use('/:prefix', (req, res, next) => {
  const apiPaths = [
    'auth',
    'inceptions',
    'inspections',
    'incidents',
    'evidence',
    'logs',
    'audit-logs',
    'dashboard',
    'profile',
    'users',
    'findings',
    'corrective-actions',
    'health',
  ];
  const sub = req.url.split('?')[0].replace(/^\/+/, '').split('/')[0];
  if (apiPaths.includes(sub)) {
    return apiRouter(req, res, next);
  }
  next();
});

app.use('/', apiRouter);

// -------------------------------------------------------------
// Vite Frontend Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('{*all}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 SafeTrack Full-Stack Server connected on http://0.0.0.0:${PORT}`);
    console.log(`🔗 REST API mounted at http://0.0.0.0:${PORT}/api\n`);
  });
}

startServer();
