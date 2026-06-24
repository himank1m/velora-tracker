import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Brush,
  CheckCircle2,
  Database,
  Download,
  FileArchive,
  Gauge,
  Lock,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UploadCloud,
  UserPlus,
  UserCog,
  Users,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
  buildBackupPayload,
  buildLaunchReadiness,
  buildNotificationFeed,
  buildSecurityChecklist,
  downloadCsv,
  downloadJson,
} from '../services/readinessService';
import '../launch-readiness.css';

const roles = ['CEO', 'Company Manager', 'Logistics Manager', 'Inventory Manager', 'Finance Manager'];
const exclusiveRoles = ['CEO', 'Company Manager'];

function Metric({ icon: Icon, label, value, detail, tone = 'default' }) {
  return (
    <article className={`launch-metric ${tone}`}>
      <span><Icon size={18} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        {detail && <p>{detail}</p>}
      </div>
    </article>
  );
}

function Panel({ eyebrow, title, description, children, action }) {
  return (
    <section className="launch-panel">
      <div className="launch-panel-head">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ icon: Icon = CheckCircle2, title, text }) {
  return (
    <div className="launch-empty">
      <Icon size={22} />
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function safeFileStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function moduleRows(records, moduleName) {
  return (records || []).map((record) => ({ module: moduleName, ...record }));
}

export function BackupRecoveryCenter({
  company,
  user,
  role,
  canViewFinancials,
  vehicles,
  orders,
  quotes,
  customers,
  shipments,
  procurementRequests,
  suppliers,
  financeRecords,
  documents,
  alerts,
}) {
  const payload = useMemo(() => buildBackupPayload({
    company,
    user,
    role,
    vehicles,
    orders,
    quotes,
    customers,
    shipments,
    procurementRequests,
    suppliers,
    financeRecords: canViewFinancials ? financeRecords : [],
    documents,
    alerts,
  }), [alerts, canViewFinancials, company, customers, documents, financeRecords, orders, procurementRequests, quotes, role, shipments, suppliers, user, vehicles]);

  const exportRows = [
    ...moduleRows(vehicles, 'Inventory'),
    ...moduleRows(orders, 'Orders'),
    ...moduleRows(quotes, 'Quotes'),
    ...moduleRows(customers, 'Customers'),
    ...moduleRows(shipments, 'Shipments'),
    ...moduleRows(procurementRequests, 'Procurement'),
    ...moduleRows(suppliers, 'Suppliers'),
    ...(canViewFinancials ? moduleRows(financeRecords, 'Finance') : []),
    ...moduleRows(documents, 'Documents'),
  ];

  const stamp = safeFileStamp();
  return (
    <div className="launch-page">
      <header className="launch-hero">
        <p className="eyebrow">Backup and recovery</p>
        <h1>Data safety center</h1>
        <p>Export authorized company data for audit, archive, migration planning, and recovery preparation. Restore writes are intentionally disabled in this phase.</p>
      </header>
      <div className="launch-grid three">
        <Metric icon={Database} label="Authorized records" value={exportRows.length} detail="Current role-scoped dataset" />
        <Metric icon={ShieldCheck} label="Restore mode" value="Prepared only" detail="No destructive import actions" tone="success" />
        <Metric icon={Lock} label="Financial scope" value={canViewFinancials ? 'Included' : 'Restricted'} detail="Export follows current role access" tone={canViewFinancials ? 'default' : 'warning'} />
      </div>
      <Panel
        eyebrow="Manual export"
        title="Download backup package"
        description="Use JSON for complete structured backup and CSV for spreadsheet review."
      >
        <div className="launch-actions">
          <button onClick={() => downloadJson(`velora-backup-${stamp}.json`, payload)}>
            <Download size={17} />
            Export JSON backup
          </button>
          <button onClick={() => downloadCsv(`velora-backup-${stamp}.csv`, exportRows)}>
            <FileArchive size={17} />
            Export CSV backup
          </button>
        </div>
        <div className="safety-list">
          <div><ShieldCheck size={18} /><span>Exports contain only data already loaded for this role.</span></div>
          <div><AlertTriangle size={18} /><span>Restore actions must be reviewed manually before any database write.</span></div>
          <div><UploadCloud size={18} /><span>Keep backup files encrypted when stored outside Velora OS.</span></div>
        </div>
      </Panel>
      <Panel eyebrow="Restore preparation" title="Recovery checklist">
        <div className="launch-checklist">
          {['Confirm target Supabase project', 'Verify user and role ownership', 'Validate company scope', 'Review financial access', 'Run restore in a staging project first'].map((item) => (
            <div key={item}><CheckCircle2 size={17} /><span>{item}</span></div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function SettingsCenter({
  theme,
  setTheme,
  company,
  saveCompany,
  canManageCompany,
}) {
  const [profile, setProfile] = useState(() => ({
    name: company?.name || '',
    industry: company?.industry || '',
    country: company?.country || '',
    email: company?.email || '',
    phone: company?.phone || '',
  }));
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('velora-user-preferences') || '{}');
    } catch {
      return {};
    }
  });
  const [notice, setNotice] = useState('');
  const [branding, setBranding] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('velora-branding-preferences') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    setProfile({
      name: company?.name || '',
      industry: company?.industry || '',
      country: company?.country || '',
      email: company?.email || '',
      phone: company?.phone || '',
    });
  }, [company]);

  function updatePref(key, value) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem('velora-user-preferences', JSON.stringify(next));
    setNotice('Preferences saved locally.');
  }

  function updateBranding(key, value) {
    const next = { ...branding, [key]: value };
    setBranding(next);
    localStorage.setItem('velora-branding-preferences', JSON.stringify(next));
    setNotice('Branding preferences saved locally.');
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!canManageCompany || !saveCompany) return;
    await saveCompany({ id: company.id, ...profile });
    setNotice('Company profile saved.');
  }

  return (
    <div className="launch-page">
      <header className="launch-hero">
        <p className="eyebrow">Settings</p>
        <h1>Workspace preferences</h1>
        <p>Control company profile details, interface preferences, notifications, currency defaults, and AI settings foundation.</p>
      </header>
      {notice && <div className="launch-notice success">{notice}</div>}
      <div className="launch-grid two">
        <Panel eyebrow="Company" title="Company profile" description="Visible in the workspace shell and ecosystem context.">
          <form className="launch-form" onSubmit={saveProfile}>
            {['name', 'industry', 'country', 'email', 'phone'].map((field) => (
              <label key={field}>
                <span>{field.replace(/^\w/, (letter) => letter.toUpperCase())}</span>
                <input value={profile[field]} disabled={!canManageCompany} onChange={(event) => setProfile((current) => ({ ...current, [field]: event.target.value }))} />
              </label>
            ))}
            <button disabled={!canManageCompany} type="submit"><Save size={17} />Save company profile</button>
          </form>
        </Panel>
        <Panel eyebrow="Personal" title="User preferences">
          <div className="preference-list">
            <label>
              <span>Theme</span>
              <select value={theme} onChange={(event) => setTheme(event.target.value)}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>
            <label>
              <span>Currency</span>
              <select value="INR" disabled>
                <option>INR</option>
              </select>
            </label>
            <label>
              <span>Region</span>
              <select value={prefs.region || 'India'} onChange={(event) => updatePref('region', event.target.value)}>
                <option>India</option>
                <option>Middle East</option>
                <option>East Asia</option>
                <option>Europe</option>
                <option>Africa</option>
              </select>
            </label>
            <label>
              <span>Notification density</span>
              <select value={prefs.notificationDensity || 'Priority'} onChange={(event) => updatePref('notificationDensity', event.target.value)}>
                <option>Priority</option>
                <option>All operational events</option>
                <option>Critical only</option>
              </select>
            </label>
            <label>
              <span>AI response style</span>
              <select value={prefs.aiStyle || 'Executive'} onChange={(event) => updatePref('aiStyle', event.target.value)}>
                <option>Executive</option>
                <option>Operational</option>
                <option>Detailed audit</option>
              </select>
            </label>
          </div>
        </Panel>
      </div>
      <Panel eyebrow="Branding" title="Product identity foundation" description="Local brand preferences prepare future white-label exports and customer-facing experiences.">
        <div className="preference-list brand-preferences">
          <label>
            <span>Workspace display name</span>
            <input value={branding.displayName || company?.name || ''} onChange={(event) => updateBranding('displayName', event.target.value)} />
          </label>
          <label>
            <span>Accent style</span>
            <select value={branding.accent || 'Deep blue'} onChange={(event) => updateBranding('accent', event.target.value)}>
              <option>Deep blue</option>
              <option>Graphite</option>
              <option>Executive slate</option>
            </select>
          </label>
          <label>
            <span>Logo mode</span>
            <select value={branding.logoMode || 'Velora mark'} onChange={(event) => updateBranding('logoMode', event.target.value)}>
              <option>Velora mark</option>
              <option>Company initials</option>
              <option>Text only</option>
            </select>
          </label>
        </div>
      </Panel>
    </div>
  );
}

export function NotificationCenter({
  alerts,
  orders,
  shipments,
  procurementRequests,
  financeRecords,
  healthEvents,
  onNavigate,
}) {
  const notifications = useMemo(() => buildNotificationFeed({
    alerts,
    orders,
    shipments,
    procurementRequests,
    financeRecords,
    healthEvents,
  }), [alerts, financeRecords, healthEvents, orders, procurementRequests, shipments]);

  return (
    <div className="launch-page">
      <header className="launch-hero">
        <p className="eyebrow">Notifications</p>
        <h1>Operational notification center</h1>
        <p>Role-aware alerts for AI COO risks, shipment delays, payment reminders, procurement issues, and system events.</p>
      </header>
      <div className="launch-grid three">
        <Metric icon={Bell} label="Open notifications" value={notifications.length} detail="Generated from authorized data" />
        <Metric icon={AlertTriangle} label="High priority" value={notifications.filter((item) => ['High', 'Critical'].includes(item.severity)).length} detail="Needs management review" tone="warning" />
        <Metric icon={CheckCircle2} label="Delivery mode" value="In-app" detail="Email and push foundation ready" tone="success" />
      </div>
      <Panel eyebrow="Priority inbox" title="What needs attention">
        {notifications.length ? (
          <div className="notification-list">
            {notifications.map((item) => (
              <button key={item.id} onClick={() => item.action && onNavigate(item.action)}>
                <span className={`severity-pill ${String(item.severity).toLowerCase()}`}>{item.severity}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.message}</p>
                  <small>{item.type} - {item.displayTime}</small>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="No notifications right now" text="Velora OS will surface shipment, payment, procurement, and system events here." />
        )}
      </Panel>
    </div>
  );
}

export function UserRoleManagement({ currentUser, permissions }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [invite, setInvite] = useState({ email: '', role: 'Inventory Manager', note: '' });
  const [draftInvites, setDraftInvites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('velora-draft-invites') || '[]');
    } catch {
      return [];
    }
  });

  async function loadProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      setMessage(error.message);
    } else {
      setProfiles(data || []);
      setMessage('');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (permissions.canManageUsers()) loadProfiles();
  }, [permissions]);

  async function updateRole(profile, role) {
    if (!permissions.canManageUsers()) return;
    if (exclusiveRoles.includes(role)) {
      const taken = profiles.find((item) => item.role === role && item.id !== profile.id);
      if (taken) {
        setMessage(`${role} is already assigned to ${taken.email || taken.full_name}.`);
        return;
      }
    }
    const { error } = await supabase.from('profiles').update({ role }).eq('id', profile.id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setProfiles((current) => current.map((item) => (item.id === profile.id ? { ...item, role } : item)));
    setMessage('Role updated safely.');
  }

  function saveInviteDraft(event) {
    event.preventDefault();
    if (!invite.email.trim()) {
      setMessage('Enter an email before saving an invite draft.');
      return;
    }
    const next = [{ ...invite, id: Date.now(), status: 'Draft' }, ...draftInvites].slice(0, 12);
    setDraftInvites(next);
    localStorage.setItem('velora-draft-invites', JSON.stringify(next));
    setInvite({ email: '', role: 'Inventory Manager', note: '' });
    setMessage('Invite draft saved. Email automation can be connected later.');
  }

  if (!permissions.canManageUsers()) {
    return (
      <div className="launch-page">
        <header className="launch-hero">
          <p className="eyebrow">Users</p>
          <h1>User and role management</h1>
          <p>This area is locked to the CEO role.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="launch-page">
      <header className="launch-hero">
        <p className="eyebrow">Access control</p>
        <h1>User and role management</h1>
        <p>Review profiles, role assignments, and access levels. Invite workflows are prepared for a future backend flow.</p>
      </header>
      {message && <div className="launch-notice">{message}</div>}
      <Panel
        eyebrow="Profiles"
        title="Registered users"
        action={<button className="secondary-action" onClick={loadProfiles}><RefreshCw size={16} />Refresh</button>}
      >
        {loading ? <div className="launch-empty"><RefreshCw size={20} /><strong>Loading profiles...</strong></div> : (
          <div className="launch-table-wrap">
            <table className="launch-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Access level</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td>{profile.full_name || (profile.id === currentUser?.id ? 'Current user' : 'Unnamed user')}</td>
                    <td>{profile.email || 'No email'}</td>
                    <td>
                      <select value={profile.role || 'Inventory Manager'} onChange={(event) => updateRole(profile, event.target.value)}>
                        {roles.map((role) => <option key={role}>{role}</option>)}
                      </select>
                    </td>
                    <td><span className="severity-pill low">{exclusiveRoles.includes(profile.role) ? 'Executive' : 'Manager'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Panel eyebrow="Invite foundation" title="Prepare team invitations" description="Draft role assignments without sending email automation yet.">
        <form className="launch-form invite-form" onSubmit={saveInviteDraft}>
          <label>
            <span>Email</span>
            <input type="email" value={invite.email} onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <label>
            <span>Role</span>
            <select value={invite.role} onChange={(event) => setInvite((current) => ({ ...current, role: event.target.value }))}>
              {roles.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
          <label>
            <span>Note</span>
            <input value={invite.note} onChange={(event) => setInvite((current) => ({ ...current, note: event.target.value }))} />
          </label>
          <button type="submit"><UserPlus size={17} />Save invite draft</button>
        </form>
        <div className="invite-drafts">
          {draftInvites.map((item) => (
            <div key={item.id}>
              <UserCog size={17} />
              <span><strong>{item.email}</strong><small>{item.role} - {item.status}</small></span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function DocumentationCenter() {
  const sections = [
    ['Getting started', 'Sign in, complete company settings, confirm roles, review onboarding, and open Launch Readiness before operational rollout.'],
    ['Modules guide', 'Command Center shows priorities. Operations modules manage records. Intelligence modules explain performance. System modules protect and prepare the platform.'],
    ['AI COO guide', 'AI COO uses role-authorized context only. It recommends actions but does not execute destructive operations.'],
    ['Digital Twin guide', 'Use the twin to inspect live operational flow, relationships, bottlenecks, and lifecycle signals.'],
    ['Time Machine guide', 'Use historical snapshots to compare dates, replay decisions, and understand how the business changed.'],
    ['Strategic War Room guide', 'Model future decisions across revenue, profit, freight, procurement, inventory, and risk before acting.'],
    ['Admin and security guide', 'Keep roles accurate, run migrations in order, review launch readiness, and export backups before large operational changes.'],
    ['Data safety guide', 'Never restore directly into production. Export, verify, test in staging, then use controlled SQL or import tooling.'],
  ];
  return (
    <div className="launch-page">
      <header className="launch-hero">
        <p className="eyebrow">Documentation</p>
        <h1>Velora OS knowledge center</h1>
        <p>In-app operating manual for admins, managers, and teams using Velora OS in production.</p>
      </header>
      <div className="doc-grid">
        {sections.map(([title, text]) => (
          <article key={title}>
            <BookOpen size={20} />
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function LaunchReadinessDashboard({
  isSupabaseConfigured,
  phase2Ready,
  ecosystemReady,
  authError,
  dataError,
  healthEvents,
  documents,
  counts,
  notifications,
  securityChecklist,
}) {
  const readiness = useMemo(() => buildLaunchReadiness({
    isSupabaseConfigured,
    phase2Ready,
    ecosystemReady,
    authError,
    dataError,
    healthEvents,
    documents,
    counts,
    notifications,
  }), [authError, counts, dataError, documents, ecosystemReady, healthEvents, isSupabaseConfigured, notifications, phase2Ready]);

  return (
    <div className="launch-page">
      <header className="launch-hero readiness">
        <div>
          <p className="eyebrow">Launch readiness</p>
          <h1>Production readiness dashboard</h1>
          <p>One screen for build health, environment setup, database readiness, AI foundation, storage, security, and operational quality checks.</p>
        </div>
        <div className="readiness-score">
          <span>{readiness.score}</span>
          <small>/ 100</small>
        </div>
      </header>
      <div className="launch-grid three">
        <Metric icon={Gauge} label="Readiness score" value={`${readiness.score}%`} detail="Client-side launch checks" tone="success" />
        <Metric icon={ShieldCheck} label="Security checks" value={securityChecklist.length} detail="Auth, role, RLS and tenant posture" />
        <Metric icon={AlertTriangle} label="Runtime events" value={healthEvents.length} detail="Browser health monitor" tone={healthEvents.length ? 'warning' : 'success'} />
      </div>
      <div className="launch-grid two">
        <Panel eyebrow="System" title="Launch checklist">
          <div className="readiness-list">
            {readiness.checks.map((check) => (
              <div key={`${check.area}-${check.label}`}>
                <span className={`status-dot ${check.status.toLowerCase().replace(/\s+/g, '-')}`} />
                <div>
                  <strong>{check.label}</strong>
                  <small>{check.area} - {check.status}</small>
                  <p>{check.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel eyebrow="Security" title="Security hardening posture">
          <div className="readiness-list">
            {securityChecklist.map((check) => (
              <div key={check.label}>
                <span className={`status-dot ${check.status.toLowerCase().replace(/\s+/g, '-')}`} />
                <div>
                  <strong>{check.label}</strong>
                  <small>{check.status}</small>
                  <p>{check.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function buildSettingsSecurityChecklist(input) {
  return buildSecurityChecklist(input);
}
