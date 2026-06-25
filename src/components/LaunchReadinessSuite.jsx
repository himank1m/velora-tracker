import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Brush,
  Building2,
  CheckCircle2,
  Cloud,
  Database,
  Download,
  FileArchive,
  Gauge,
  HardDrive,
  Link2,
  Lock,
  Map,
  Network,
  RefreshCw,
  Save,
  Server,
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
import {
  brandModes,
  dashboardStyles,
  densityOptions,
  resolveTheme,
  themePresets,
} from '../services/themeService';
import {
  blankServerConfig,
  blankServerGroup,
  blankServerLink,
  buildInfrastructureAnalytics,
  buildInfrastructureTimeline,
  buildNetworkAlerts,
  buildServerSummary,
  connectedServiceOptions,
  groupToRow,
  rowToGroup,
  rowToLink,
  sanitizeServerGroup,
  maskSensitiveValue,
  rowToServer,
  sanitizeServerConfig,
  sanitizeServerLink,
  serverEnvironments,
  serverGroupTypes,
  serverLinkTypes,
  serverStatuses,
  serverToRow,
  linkToRow,
  serverTypes,
} from '../services/infrastructureService';
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

function SparklinePreview() {
  return (
    <span className="theme-sparkline" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
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
  appearance,
  updateAppearance,
  resetAppearance,
  user,
  company,
  companies = [],
  currentCompanyId,
  setCurrentCompanyId,
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
  const [serverFoundation, setServerFoundation] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('velora-server-foundation') || '{}');
    } catch {
      return {};
    }
  });
  const [servers, setServers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('velora-server-control-center') || '[]').map(sanitizeServerConfig);
    } catch {
      return [];
    }
  });
  const [serverLinks, setServerLinks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('velora-server-links') || '[]').map(sanitizeServerLink);
    } catch {
      return [];
    }
  });
  const [serverGroups, setServerGroups] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('velora-server-groups') || '[]').map(sanitizeServerGroup);
    } catch {
      return [];
    }
  });
  const [serverForm, setServerForm] = useState(blankServerConfig);
  const [linkForm, setLinkForm] = useState(blankServerLink);
  const [groupForm, setGroupForm] = useState(blankServerGroup);
  const [editingServerId, setEditingServerId] = useState('');
  const [selectedServerId, setSelectedServerId] = useState('');
  const [serverSyncAvailable, setServerSyncAvailable] = useState(true);
  const [networkSyncAvailable, setNetworkSyncAvailable] = useState(true);

  useEffect(() => {
    setProfile({
      name: company?.name || '',
      industry: company?.industry || '',
      country: company?.country || '',
      email: company?.email || '',
      phone: company?.phone || '',
    });
  }, [company]);

  useEffect(() => {
    let mounted = true;
    async function loadServers() {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('server_configurations')
        .select('*')
        .order('created_at', { ascending: false });
      if (!mounted) return;
      if (error) {
        setServerSyncAvailable(false);
        return;
      }
      setServerSyncAvailable(true);
      const mapped = (data || []).map(rowToServer);
      setServers(mapped);
      localStorage.setItem('velora-server-control-center', JSON.stringify(mapped));
    }
    loadServers();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    async function loadNetwork() {
      if (!user?.id) return;
      const [linksResult, groupsResult] = await Promise.all([
        supabase.from('server_links').select('*').order('created_at', { ascending: false }),
        supabase.from('server_groups').select('*').order('created_at', { ascending: false }),
      ]);
      if (!mounted) return;
      if (linksResult.error || groupsResult.error) {
        setNetworkSyncAvailable(false);
        return;
      }
      setNetworkSyncAvailable(true);
      const mappedLinks = (linksResult.data || []).map(rowToLink);
      const mappedGroups = (groupsResult.data || []).map(rowToGroup);
      setServerLinks(mappedLinks);
      setServerGroups(mappedGroups);
      localStorage.setItem('velora-server-links', JSON.stringify(mappedLinks));
      localStorage.setItem('velora-server-groups', JSON.stringify(mappedGroups));
    }
    loadNetwork();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

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
    updateAppearance?.(key === 'accent' ? { accentColor: value } : { [key]: value });
    setNotice('Branding preferences saved locally.');
  }

  function updateServerFoundation(key, value) {
    const next = { ...serverFoundation, [key]: value };
    setServerFoundation(next);
    localStorage.setItem('velora-server-foundation', JSON.stringify(next));
    setNotice('Server configuration foundation saved locally.');
  }

  async function persistServers(nextServers) {
    setServers(nextServers);
    localStorage.setItem('velora-server-control-center', JSON.stringify(nextServers));
  }

  async function persistServerLinks(nextLinks) {
    setServerLinks(nextLinks);
    localStorage.setItem('velora-server-links', JSON.stringify(nextLinks));
  }

  async function persistServerGroups(nextGroups) {
    setServerGroups(nextGroups);
    localStorage.setItem('velora-server-groups', JSON.stringify(nextGroups));
  }

  async function saveServerConfiguration(event) {
    event.preventDefault();
    if (!canManageCompany) {
      setNotice('Only CEO and Company Manager accounts can manage server configurations.');
      return;
    }
    const cleanServer = sanitizeServerConfig({
      ...serverForm,
      id: editingServerId || serverForm.id,
      lastCheckedAt: serverForm.lastCheckedAt || new Date().toISOString(),
    });
    if (!cleanServer.serverName) {
      setNotice('Add a server name before saving.');
      return;
    }

    let savedServer = cleanServer;
    let syncedToSupabase = serverSyncAvailable;
    if (serverSyncAvailable && user?.id) {
      const query = editingServerId
        ? supabase.from('server_configurations').update(serverToRow(cleanServer, user.id)).eq('id', editingServerId).select().single()
        : supabase.from('server_configurations').insert(serverToRow(cleanServer, user.id)).select().single();
      const { data, error } = await query;
      if (error) {
        setServerSyncAvailable(false);
        syncedToSupabase = false;
      } else {
        savedServer = rowToServer(data);
        syncedToSupabase = true;
      }
    }

    const nextServers = editingServerId
      ? servers.map((server) => server.id === editingServerId ? savedServer : server)
      : [savedServer, ...servers];
    await persistServers(nextServers);
    setServerForm(blankServerConfig);
    setEditingServerId('');
    setSelectedServerId(savedServer.id);
    setNotice(syncedToSupabase ? 'Server configuration saved.' : 'Server saved locally. Run the Phase 14 SQL migration to enable Supabase sync.');
  }

  function editServer(server) {
    if (!canManageCompany) {
      setNotice('Only CEO and Company Manager accounts can edit server configurations.');
      return;
    }
    setServerForm(server);
    setEditingServerId(server.id);
    setSelectedServerId(server.id);
  }

  async function simulateHealthCheck(server) {
    const nextStatus = server.apiUrl ? 'Online' : 'Warning';
    const checkedServer = sanitizeServerConfig({
      ...server,
      status: nextStatus,
      responseTimeMs: server.apiUrl ? Math.max(80, Math.round(220 + Math.random() * 520)) : 0,
      uptimePercentage: server.apiUrl ? Math.max(97, Number(server.uptimePercentage) || 99.2) : Number(server.uptimePercentage) || 0,
      lastCheckedAt: new Date().toISOString(),
      errorMessage: server.apiUrl ? '' : 'Missing API URL placeholder.',
    });
    const nextServers = servers.map((item) => item.id === server.id ? checkedServer : item);
    await persistServers(nextServers);
    setSelectedServerId(server.id);
    setNotice('Health check simulated. Live network probing will be connected in a future backend phase.');
  }

  function toggleLinkedService(service) {
    const current = serverForm.linkedServices || [];
    const linkedServices = current.includes(service)
      ? current.filter((item) => item !== service)
      : [...current, service];
    setServerForm((value) => ({ ...value, linkedServices }));
  }

  async function saveServerLink(event) {
    event.preventDefault();
    if (!canManageCompany) {
      setNotice('Only CEO and Company Manager accounts can link servers.');
      return;
    }
    const cleanLink = sanitizeServerLink(linkForm);
    if (!cleanLink.sourceServerId || !cleanLink.targetServerId || cleanLink.sourceServerId === cleanLink.targetServerId) {
      setNotice('Choose two different servers before creating a network link.');
      return;
    }

    let savedLink = cleanLink;
    let syncedToSupabase = networkSyncAvailable;
    if (networkSyncAvailable && user?.id) {
      const { data, error } = await supabase
        .from('server_links')
        .insert(linkToRow(cleanLink, user.id))
        .select()
        .single();
      if (error) {
        setNetworkSyncAvailable(false);
        syncedToSupabase = false;
      } else {
        savedLink = rowToLink(data);
        syncedToSupabase = true;
      }
    }

    await persistServerLinks([savedLink, ...serverLinks]);
    setLinkForm(blankServerLink);
    setNotice(syncedToSupabase ? 'Server link saved.' : 'Server link saved locally. Run the Phase 15 SQL migration to enable Supabase sync.');
  }

  function toggleGroupServer(serverId) {
    setGroupForm((value) => {
      const current = value.serverIds || [];
      return {
        ...value,
        serverIds: current.includes(serverId)
          ? current.filter((id) => id !== serverId)
          : [...current, serverId],
      };
    });
  }

  async function saveServerGroup(event) {
    event.preventDefault();
    if (!canManageCompany) {
      setNotice('Only CEO and Company Manager accounts can manage server groups.');
      return;
    }
    const cleanGroup = sanitizeServerGroup(groupForm);
    if (!cleanGroup.groupName) {
      setNotice('Add a group name before saving.');
      return;
    }

    let savedGroup = cleanGroup;
    let syncedToSupabase = networkSyncAvailable;
    if (networkSyncAvailable && user?.id) {
      const { data, error } = await supabase
        .from('server_groups')
        .insert(groupToRow(cleanGroup, user.id))
        .select()
        .single();
      if (error) {
        setNetworkSyncAvailable(false);
        syncedToSupabase = false;
      } else {
        savedGroup = rowToGroup(data);
        syncedToSupabase = true;
      }
    }

    await persistServerGroups([savedGroup, ...serverGroups]);
    setGroupForm(blankServerGroup);
    setNotice(syncedToSupabase ? 'Server group saved.' : 'Server group saved locally. Run the Phase 15 SQL migration to enable Supabase sync.');
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!canManageCompany || !saveCompany) return;
    await saveCompany({ id: company.id, ...profile });
    setNotice('Company profile saved.');
  }

  function applyPreset(themeId) {
    setTheme(themeId);
    setNotice('Theme applied and saved.');
  }

  function updateAppearanceSetting(key, value) {
    updateAppearance?.({ [key]: value });
    setNotice('Appearance preferences saved.');
  }

  function resetThemeStudio() {
    resetAppearance?.();
    setNotice('Theme Studio reset to Velora defaults.');
  }

  const activePreset = resolveTheme(theme);
  const activeAppearance = appearance || {};
  const serverSummary = buildServerSummary(servers);
  const infrastructureAnalytics = buildInfrastructureAnalytics(servers, serverLinks, serverGroups);
  const networkAlerts = buildNetworkAlerts(servers, serverLinks, serverGroups);
  const infrastructureTimeline = buildInfrastructureTimeline(servers, serverLinks, serverGroups);
  const selectedServer = servers.find((server) => server.id === selectedServerId) || servers[0];
  const networkNodes = servers.map((server, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(servers.length, 1);
    const radius = servers.length > 4 ? 38 : 30;
    return {
      ...server,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
    };
  });
  const networkLinkLines = serverLinks
    .map((link) => ({
      ...link,
      source: networkNodes.find((node) => node.id === link.sourceServerId),
      target: networkNodes.find((node) => node.id === link.targetServerId),
    }))
    .filter((link) => link.source && link.target);
  const serverNameById = (serverId) => servers.find((server) => server.id === serverId)?.serverName || 'Unknown server';

  return (
    <div className="launch-page">
      <header className="launch-hero">
        <p className="eyebrow">Settings</p>
        <h1>Workspace preferences</h1>
        <p>Control company profile details, interface preferences, notifications, currency defaults, and AI settings foundation.</p>
      </header>
      {notice && <div className="launch-notice success">{notice}</div>}
      <Panel eyebrow="Workspace" title="Company workspace" description="Choose the active company context from Settings instead of the top navigation.">
        <div className="settings-company-switcher">
          <div>
            <Building2 size={22} />
            <span>
              <strong>{company?.name || 'Velora Motors'}</strong>
              <small>Current operating company</small>
            </span>
          </div>
          <label>
            <span>Active company</span>
            <select
              value={currentCompanyId || company?.id || ''}
              onChange={(event) => setCurrentCompanyId?.(event.target.value)}
            >
              {companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </div>
      </Panel>
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
                {themePresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Interface density</span>
              <select value={activeAppearance.density || 'Comfortable'} onChange={(event) => updateAppearanceSetting('density', event.target.value)}>
                {densityOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              <span>Dashboard style</span>
              <select value={activeAppearance.dashboardStyle || 'Command Center'} onChange={(event) => updateAppearanceSetting('dashboardStyle', event.target.value)}>
                {dashboardStyles.map((option) => <option key={option}>{option}</option>)}
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
            <input value={activeAppearance.displayName || branding.displayName || company?.name || ''} onChange={(event) => updateBranding('displayName', event.target.value)} />
          </label>
          <label>
            <span>Custom accent color</span>
            <input type="color" value={activeAppearance.accentColor || activePreset.tokens.accent} onChange={(event) => updateBranding('accent', event.target.value)} />
          </label>
          <label>
            <span>Logo mode</span>
            <select value={activeAppearance.brandMode || branding.logoMode || 'Velora mark'} onChange={(event) => updateBranding('brandMode', event.target.value)}>
              {brandModes.map((mode) => <option key={mode}>{mode}</option>)}
            </select>
          </label>
          <label>
            <span>Logo URL foundation</span>
            <input value={activeAppearance.logoUrl || ''} onChange={(event) => updateAppearanceSetting('logoUrl', event.target.value)} placeholder="Optional future hosted logo URL" />
          </label>
        </div>
      </Panel>
      <Panel eyebrow="Theme Studio" title="Appearance control room" description="Preview, apply, and recover professional Velora OS themes without changing business data.">
        <div className="theme-studio-toolbar">
          <div>
            <Brush size={20} />
            <span>
              <strong>{activePreset.name}</strong>
              <small>{activePreset.description}</small>
            </span>
          </div>
          <button type="button" onClick={resetThemeStudio}><RefreshCw size={16} />Reset to default</button>
        </div>
        <div className="theme-preset-grid">
          {themePresets.map((preset) => (
            <article className={`theme-preset-card ${preset.id === activePreset.id ? 'active' : ''}`} key={preset.id}>
              <div className="theme-preview-surface" style={{
                '--preview-bg': preset.tokens.bg,
                '--preview-panel': preset.tokens.panelSolid,
                '--preview-ink': preset.tokens.ink,
                '--preview-muted': preset.tokens.muted,
                '--preview-accent': preset.id === activePreset.id ? activeAppearance.accentColor || preset.tokens.accent : preset.tokens.accent,
              }}>
                <div className="preview-kpi">
                  <span>Revenue</span>
                  <strong>₹82.4L</strong>
                </div>
                <button type="button">Primary</button>
                <div className="preview-table-row"><span>Order 0007</span><em>Ready</em></div>
                <div className="preview-ai-panel"><SparklinePreview /><span>AI COO insight</span></div>
              </div>
              <div className="theme-preset-meta">
                <div>
                  <h3>{preset.name}</h3>
                  <p>{preset.description}</p>
                </div>
                <button type="button" onClick={() => applyPreset(preset.id)}>{preset.id === activePreset.id ? 'Applied' : 'Apply'}</button>
              </div>
            </article>
          ))}
        </div>
      </Panel>
      <div className="launch-grid two">
        <Panel eyebrow="Server Control Center" title="Infrastructure command layer" description="Add, monitor, and prepare server configurations for multi-region Velora OS infrastructure. Secrets are never stored here.">
          <div className="launch-grid three server-metrics-grid">
            <Metric icon={Server} label="Total servers" value={serverSummary.total} detail="Configured infrastructure nodes" />
            <Metric icon={CheckCircle2} label="Active servers" value={serverSummary.active} detail="Currently marked online" tone="success" />
            <Metric icon={AlertTriangle} label="Warnings" value={serverSummary.warning + serverSummary.offline} detail="Offline, warning, maintenance, unknown" tone="warning" />
          </div>
          <div className="server-primary-strip">
            <div><small>Primary server</small><strong>{serverSummary.primary}</strong></div>
            <div><small>Backup server</small><strong>{serverSummary.backup}</strong></div>
            <div><small>Sync mode</small><strong>{serverSyncAvailable ? 'Supabase ready' : 'Local fallback'}</strong></div>
          </div>
          <form className="launch-form server-form" onSubmit={saveServerConfiguration}>
            <label><span>Server name</span><input value={serverForm.serverName} onChange={(event) => setServerForm((value) => ({ ...value, serverName: event.target.value }))} placeholder="Velora Primary Supabase" /></label>
            <label><span>Server type</span><select value={serverForm.serverType} onChange={(event) => setServerForm((value) => ({ ...value, serverType: event.target.value }))}>{serverTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span>Region</span><input value={serverForm.region} onChange={(event) => setServerForm((value) => ({ ...value, region: event.target.value }))} placeholder="India / Mumbai" /></label>
            <label><span>Environment</span><select value={serverForm.environment} onChange={(event) => setServerForm((value) => ({ ...value, environment: event.target.value }))}>{serverEnvironments.map((environment) => <option key={environment}>{environment}</option>)}</select></label>
            <label><span>API URL</span><input value={serverForm.apiUrl} onChange={(event) => setServerForm((value) => ({ ...value, apiUrl: event.target.value }))} placeholder="https://api.example.com" /></label>
            <label><span>Database reference</span><input value={serverForm.databaseReference} onChange={(event) => setServerForm((value) => ({ ...value, databaseReference: event.target.value }))} placeholder="Project ref or masked database URL" /></label>
            <label><span>Storage URL</span><input value={serverForm.storageUrl} onChange={(event) => setServerForm((value) => ({ ...value, storageUrl: event.target.value }))} placeholder="https://storage.example.com" /></label>
            <label><span>Status</span><select value={serverForm.status} onChange={(event) => setServerForm((value) => ({ ...value, status: event.target.value }))}>{serverStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label><span>Response time ms</span><input type="number" value={serverForm.responseTimeMs} onChange={(event) => setServerForm((value) => ({ ...value, responseTimeMs: event.target.value }))} /></label>
            <label><span>Uptime %</span><input type="number" step="0.01" value={serverForm.uptimePercentage} onChange={(event) => setServerForm((value) => ({ ...value, uptimePercentage: event.target.value }))} /></label>
            <label className="server-form-wide"><span>Error message</span><input value={serverForm.errorMessage} onChange={(event) => setServerForm((value) => ({ ...value, errorMessage: event.target.value }))} placeholder="Shown only when health checks fail" /></label>
            <label className="server-form-wide"><span>Notes</span><textarea value={serverForm.notes} onChange={(event) => setServerForm((value) => ({ ...value, notes: event.target.value }))} placeholder="Operational notes, failover plan, owner, region policy" /></label>
            <div className="server-service-picker server-form-wide">
              <span>Connected services</span>
              <div>
                {connectedServiceOptions.map((service) => (
                  <button type="button" className={(serverForm.linkedServices || []).includes(service) ? 'active' : ''} key={service} onClick={() => toggleLinkedService(service)}>{service}</button>
                ))}
              </div>
            </div>
            <div className="server-form-actions server-form-wide">
              <button type="submit" disabled={!canManageCompany}><Save size={17} />{editingServerId ? 'Update server' : 'Add server'}</button>
              {editingServerId && <button type="button" className="secondary-action" onClick={() => { setServerForm(blankServerConfig); setEditingServerId(''); }}>Cancel edit</button>}
            </div>
          </form>
        </Panel>
        <Panel eyebrow="Server detail" title={selectedServer?.serverName || 'No server selected'} description="Configuration, health, linked services, recent errors, and activity history.">
          {selectedServer ? (
            <div className="server-detail-stack">
              <div className="server-detail-card">
                <span className={`server-status-dot ${selectedServer.status.toLowerCase()}`} />
                <div>
                  <strong>{selectedServer.status}</strong>
                  <small>{selectedServer.serverType} - {selectedServer.environment} - {selectedServer.region}</small>
                </div>
                <button type="button" className="secondary-action" onClick={() => simulateHealthCheck(selectedServer)}><RefreshCw size={16} />Check</button>
              </div>
              <div className="server-facts">
                <span><small>API URL</small><strong>{maskSensitiveValue(selectedServer.apiUrl)}</strong></span>
                <span><small>Database</small><strong>{maskSensitiveValue(selectedServer.databaseReference)}</strong></span>
                <span><small>Storage</small><strong>{maskSensitiveValue(selectedServer.storageUrl)}</strong></span>
                <span><small>Response</small><strong>{selectedServer.responseTimeMs || 0} ms</strong></span>
                <span><small>Uptime</small><strong>{selectedServer.uptimePercentage || 0}%</strong></span>
                <span><small>Last checked</small><strong>{selectedServer.lastCheckedAt ? new Date(selectedServer.lastCheckedAt).toLocaleString() : 'Not checked'}</strong></span>
              </div>
              <div className="server-linked-services">
                {selectedServer.linkedServices.map((service) => <span key={service}><Cloud size={14} />{service}</span>)}
                {!selectedServer.linkedServices.length && <span><Cloud size={14} />No linked services</span>}
              </div>
              {selectedServer.errorMessage && <div className="launch-notice"><AlertTriangle size={16} />{selectedServer.errorMessage}</div>}
              <p className="server-notes">{selectedServer.notes || 'No infrastructure notes recorded yet.'}</p>
            </div>
          ) : (
            <EmptyState icon={Server} title="No servers yet" text="Add a server configuration to begin infrastructure monitoring." />
          )}
        </Panel>
      </div>
      <Panel eyebrow="Multi-server network" title="Infrastructure universe" description="Monitor regional servers, linked services, failover readiness, and cluster health from one control surface.">
        <div className="infrastructure-network-dashboard">
          <Metric icon={Gauge} label="Network health" value={`${infrastructureAnalytics.networkHealthScore}/100`} detail="Availability, latency, uptime, and link quality" tone={infrastructureAnalytics.networkHealthScore >= 80 ? 'success' : 'warning'} />
          <Metric icon={Map} label="Regions" value={infrastructureAnalytics.regionalDistribution.length} detail="Active infrastructure footprints" />
          <Metric icon={Link2} label="Active links" value={infrastructureAnalytics.activeLinks} detail={`${serverLinks.length} total server relationships`} />
          <Metric icon={ShieldCheck} label="Backup coverage" value={infrastructureAnalytics.backupCoverage ? 'Ready' : 'Gap'} detail="Primary to backup readiness" tone={infrastructureAnalytics.backupCoverage ? 'success' : 'warning'} />
        </div>
        <div className="launch-grid two infrastructure-network-grid">
          <div className="server-network-map">
            <div className="network-map-header">
              <span><Network size={18} />Server network map</span>
              <small>{servers.length} nodes - {serverLinks.length} links</small>
            </div>
            <svg className="network-map-frame" viewBox="0 0 100 100" role="img" aria-label="Server network relationship map">
              <defs>
                <radialGradient id="serverNodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.18" />
                </radialGradient>
              </defs>
              {networkLinkLines.map((link) => (
                <line
                  className={`network-link ${link.status.toLowerCase()}`}
                  key={link.id}
                  x1={link.source.x}
                  y1={link.source.y}
                  x2={link.target.x}
                  y2={link.target.y}
                />
              ))}
              {networkNodes.map((node) => (
                <g className={`network-node ${node.status.toLowerCase()}`} key={node.id} onClick={() => setSelectedServerId(node.id)} tabIndex="0" role="button">
                  <circle cx={node.x} cy={node.y} r="5.6" />
                  <text x={node.x} y={node.y + 1.2}>{node.serverName.slice(0, 2).toUpperCase()}</text>
                </g>
              ))}
            </svg>
            <div className="network-map-legend">
              <span><i className="online" />Online</span>
              <span><i className="warning" />Warning</span>
              <span><i className="offline" />Offline</span>
              <span><i className="maintenance" />Maintenance</span>
            </div>
          </div>
          <div className="region-distribution">
            <h3>Regional performance</h3>
            {infrastructureAnalytics.regionalDistribution.map((region) => (
              <article className="region-card" key={region.region}>
                <div>
                  <strong>{region.region}</strong>
                  <small>{region.total} servers - {region.online} online - {region.warning + region.offline} issues</small>
                </div>
                <span>{region.avgLatency} ms</span>
                <meter min="0" max="100" value={region.uptime}>{region.uptime}%</meter>
              </article>
            ))}
            {!infrastructureAnalytics.regionalDistribution.length && <EmptyState icon={Map} title="No regional servers" text="Add server configurations to begin regional infrastructure monitoring." />}
          </div>
        </div>
      </Panel>
      <div className="launch-grid two">
        <Panel eyebrow="Server linking" title="Relationship and failover links" description="Connect primary, backup, analytics, AI, and regional servers without storing secrets.">
          <form className="launch-form server-network-form" onSubmit={saveServerLink}>
            <label><span>Source server</span><select value={linkForm.sourceServerId} onChange={(event) => setLinkForm((value) => ({ ...value, sourceServerId: event.target.value }))}><option value="">Choose source</option>{servers.map((server) => <option value={server.id} key={server.id}>{server.serverName}</option>)}</select></label>
            <label><span>Target server</span><select value={linkForm.targetServerId} onChange={(event) => setLinkForm((value) => ({ ...value, targetServerId: event.target.value }))}><option value="">Choose target</option>{servers.map((server) => <option value={server.id} key={server.id}>{server.serverName}</option>)}</select></label>
            <label><span>Link type</span><select value={linkForm.linkType} onChange={(event) => setLinkForm((value) => ({ ...value, linkType: event.target.value }))}>{serverLinkTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span>Status</span><select value={linkForm.status} onChange={(event) => setLinkForm((value) => ({ ...value, status: event.target.value }))}>{serverStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label><span>Latency ms</span><input type="number" value={linkForm.latencyMs} onChange={(event) => setLinkForm((value) => ({ ...value, latencyMs: event.target.value }))} /></label>
            <label><span>Notes</span><input value={linkForm.notes} onChange={(event) => setLinkForm((value) => ({ ...value, notes: event.target.value }))} placeholder="Failover, sync, monitoring, or routing note" /></label>
            <div className="server-form-actions server-form-wide">
              <button type="submit" disabled={!canManageCompany || servers.length < 2}><Link2 size={17} />Link servers</button>
            </div>
          </form>
          <div className="server-link-list">
            {serverLinks.map((link) => (
              <article key={link.id}>
                <span className={`server-status-dot ${link.status.toLowerCase()}`} />
                <div>
                  <strong>{serverNameById(link.sourceServerId)} {'->'} {serverNameById(link.targetServerId)}</strong>
                  <small>{link.linkType} - {link.status} - {link.latencyMs || 0} ms</small>
                </div>
              </article>
            ))}
            {!serverLinks.length && <EmptyState icon={Link2} title="No server links yet" text="Create links to model primary-backup, analytics, AI, regional, and failover relationships." />}
          </div>
        </Panel>
        <Panel eyebrow="Server groups" title="Clusters and regional foundations" description="Group infrastructure into production, analytics, AI, backup, and regional clusters.">
          <form className="launch-form server-network-form" onSubmit={saveServerGroup}>
            <label><span>Group name</span><input value={groupForm.groupName} onChange={(event) => setGroupForm((value) => ({ ...value, groupName: event.target.value }))} placeholder="Production Cluster" /></label>
            <label><span>Group type</span><select value={groupForm.groupType} onChange={(event) => setGroupForm((value) => ({ ...value, groupType: event.target.value }))}>{serverGroupTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span>Region</span><input value={groupForm.region} onChange={(event) => setGroupForm((value) => ({ ...value, region: event.target.value }))} placeholder="India / Global" /></label>
            <label><span>Environment</span><select value={groupForm.environment} onChange={(event) => setGroupForm((value) => ({ ...value, environment: event.target.value }))}>{serverEnvironments.map((environment) => <option key={environment}>{environment}</option>)}</select></label>
            <div className="server-mini-picker server-form-wide">
              <span>Servers in group</span>
              <div>
                {servers.map((server) => (
                  <button type="button" className={(groupForm.serverIds || []).includes(server.id) ? 'active' : ''} key={server.id} onClick={() => toggleGroupServer(server.id)}>{server.serverName}</button>
                ))}
              </div>
            </div>
            <label className="server-form-wide"><span>Notes</span><input value={groupForm.notes} onChange={(event) => setGroupForm((value) => ({ ...value, notes: event.target.value }))} placeholder="Ownership, region policy, disaster recovery note" /></label>
            <div className="server-form-actions server-form-wide">
              <button type="submit" disabled={!canManageCompany}><Network size={17} />Create group</button>
            </div>
          </form>
          <div className="server-group-list">
            {infrastructureAnalytics.groupHealth.map((group) => (
              <article className="server-group-card" key={group.id}>
                <div>
                  <strong>{group.groupName}</strong>
                  <small>{group.groupType} - {group.region} - {group.environment}</small>
                </div>
                <span>{group.online}/{group.total} online</span>
                <meter min="0" max="100" value={group.uptime}>{group.uptime}%</meter>
              </article>
            ))}
            {!serverGroups.length && <EmptyState icon={Network} title="No server groups yet" text="Create a cluster to prepare global scaling, regional routing, and future failover." />}
          </div>
        </Panel>
      </div>
      <div className="launch-grid two">
        <Panel eyebrow="Server registry" title="Configured infrastructure">
          <div className="server-list">
            {servers.map((server) => (
              <button type="button" className={selectedServer?.id === server.id ? 'active' : ''} key={server.id} onClick={() => setSelectedServerId(server.id)}>
                <span className={`server-status-dot ${server.status.toLowerCase()}`} />
                <div><strong>{server.serverName}</strong><small>{server.serverType} - {server.region} - {server.environment}</small></div>
                <em>{server.status}</em>
                <span className="server-row-actions">
                  {canManageCompany && <span onClick={(event) => { event.stopPropagation(); editServer(server); }}>Edit</span>}
                  <span onClick={(event) => { event.stopPropagation(); simulateHealthCheck(server); }}>Check</span>
                </span>
              </button>
            ))}
            {!servers.length && <EmptyState icon={HardDrive} title="No server configurations" text="Use the form above to add primary, backup, regional, storage, analytics, AI function, or development servers." />}
          </div>
        </Panel>
        <Panel eyebrow="Infrastructure alerts" title="Health and configuration risks">
          <div className="server-alert-list">
            {networkAlerts.map((alert) => (
              <article key={alert.id}>
                <span className={`severity-pill ${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                <div><strong>{alert.title}</strong><p>{alert.message}</p></div>
              </article>
            ))}
            {!networkAlerts.length && <EmptyState icon={ShieldCheck} title="Infrastructure looks clean" text="No offline, high-latency, missing configuration, group, or AI function alerts detected." />}
          </div>
        </Panel>
      </div>
      <Panel eyebrow="Server activity log" title="Infrastructure timeline" description="Tracks server added, updated, status checked, failed checks, backups, and configuration changes.">
        <div className="server-activity-list">
          {infrastructureTimeline.slice(0, 12).map((item) => (
            <div key={item.id}>
              <Database size={16} />
              <span><strong>{item.title}</strong><small>{item.detail} - {new Date(item.createdAt).toLocaleString()}</small></span>
            </div>
          ))}
          {!infrastructureTimeline.length && <EmptyState icon={Database} title="No server activity yet" text="Activity will appear as infrastructure records, links, groups, and health checks are added." />}
        </div>
      </Panel>
      <div className="launch-grid two">
        <Panel eyebrow="Server" title="Server configuration foundation" description="Prepared for future multi-server deployment and environment routing.">
          <div className="preference-list">
            <label>
              <span>Server profile</span>
              <select value={serverFoundation.profile || 'Primary Supabase'} onChange={(event) => updateServerFoundation('profile', event.target.value)}>
                <option>Primary Supabase</option>
                <option>Staging workspace</option>
                <option>Regional server ready</option>
              </select>
            </label>
            <label>
              <span>Data residency note</span>
              <input value={serverFoundation.residency || ''} onChange={(event) => updateServerFoundation('residency', event.target.value)} placeholder="Future server policy note" />
            </label>
          </div>
        </Panel>
      </div>
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
