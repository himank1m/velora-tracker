const todayIso = () => new Date().toISOString();

export const serverTypes = ['Primary', 'Backup', 'Regional', 'Analytics', 'Storage', 'AI Function', 'Development'];
export const serverEnvironments = ['Production', 'Staging', 'Development', 'Testing'];
export const serverStatuses = ['Online', 'Offline', 'Warning', 'Maintenance', 'Unknown'];
export const connectedServiceOptions = [
  'Supabase Database',
  'Supabase Storage',
  'Edge Functions',
  'Vercel Deployment',
  'AI Assistant',
  'Backup Storage',
];

export const blankServerConfig = {
  id: '',
  serverName: '',
  serverType: 'Primary',
  region: 'India',
  environment: 'Production',
  apiUrl: '',
  databaseReference: '',
  storageUrl: '',
  status: 'Unknown',
  responseTimeMs: 0,
  uptimePercentage: 99.9,
  lastCheckedAt: '',
  errorMessage: '',
  linkedServices: ['Supabase Database', 'Supabase Storage'],
  notes: '',
};

export function maskSensitiveValue(value) {
  const text = String(value || '').trim();
  if (!text) return 'Not configured';
  if (text.length <= 18) return `${text.slice(0, 5)}...`;
  return `${text.slice(0, 11)}...${text.slice(-6)}`;
}

export function sanitizeServerConfig(server) {
  const status = serverStatuses.includes(server.status) ? server.status : 'Unknown';
  const serverType = serverTypes.includes(server.serverType) ? server.serverType : 'Regional';
  const environment = serverEnvironments.includes(server.environment) ? server.environment : 'Production';
  const linkedServices = Array.isArray(server.linkedServices)
    ? server.linkedServices.filter((item) => connectedServiceOptions.includes(item))
    : String(server.linkedServices || '').split(',').map((item) => item.trim()).filter((item) => connectedServiceOptions.includes(item));

  return {
    ...blankServerConfig,
    ...server,
    id: server.id || `srv-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    serverName: String(server.serverName || '').trim(),
    serverType,
    environment,
    status,
    responseTimeMs: Number(server.responseTimeMs) || 0,
    uptimePercentage: Math.min(100, Math.max(0, Number(server.uptimePercentage) || 0)),
    linkedServices,
    lastCheckedAt: server.lastCheckedAt || todayIso(),
  };
}

export function buildServerSummary(servers = []) {
  const active = servers.filter((server) => server.status === 'Online');
  const offline = servers.filter((server) => server.status === 'Offline');
  const warning = servers.filter((server) => ['Warning', 'Maintenance', 'Unknown'].includes(server.status));
  const primary = servers.find((server) => server.serverType === 'Primary');
  const backup = servers.find((server) => server.serverType === 'Backup');

  return {
    total: servers.length,
    active: active.length,
    offline: offline.length,
    warning: warning.length,
    primary: primary?.serverName || 'Not assigned',
    backup: backup?.serverName || 'Not assigned',
  };
}

export function buildInfrastructureAlerts(servers = []) {
  return servers.flatMap((server) => {
    const alerts = [];
    if (server.status === 'Offline') {
      alerts.push({
        id: `${server.id}-offline`,
        severity: 'Critical',
        title: `${server.serverName} is offline`,
        message: `${server.region} ${server.environment} server requires immediate review.`,
      });
    }
    if (server.status === 'Warning') {
      alerts.push({
        id: `${server.id}-warning`,
        severity: 'High',
        title: `${server.serverName} has warnings`,
        message: server.errorMessage || 'Recent health check reported degraded service.',
      });
    }
    if (Number(server.responseTimeMs) > 1200) {
      alerts.push({
        id: `${server.id}-latency`,
        severity: 'Medium',
        title: `${server.serverName} latency is high`,
        message: `Latest response time is ${server.responseTimeMs} ms.`,
      });
    }
    if (!server.apiUrl || !server.databaseReference) {
      alerts.push({
        id: `${server.id}-missing-config`,
        severity: 'Medium',
        title: `${server.serverName} has missing configuration`,
        message: 'API URL or database reference is not configured.',
      });
    }
    if (server.serverType === 'AI Function' && server.status !== 'Online') {
      alerts.push({
        id: `${server.id}-ai-function`,
        severity: 'High',
        title: 'AI function unavailable',
        message: `${server.serverName} is not online.`,
      });
    }
    return alerts;
  });
}

export function buildServerActivity(servers = []) {
  return servers
    .flatMap((server) => [
      {
        id: `${server.id}-added`,
        title: `${server.serverName} registered`,
        detail: `${server.serverType} server in ${server.region}`,
        createdAt: server.createdAt || server.lastCheckedAt || todayIso(),
      },
      {
        id: `${server.id}-checked`,
        title: `${server.serverName} health check`,
        detail: `${server.status} - ${server.responseTimeMs || 0} ms`,
        createdAt: server.lastCheckedAt || todayIso(),
      },
    ])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function serverToRow(server, userId) {
  return {
    server_name: server.serverName,
    server_type: server.serverType,
    region: server.region,
    environment: server.environment,
    api_url: server.apiUrl || null,
    database_reference: server.databaseReference || null,
    storage_url: server.storageUrl || null,
    status: server.status,
    response_time_ms: Number(server.responseTimeMs) || 0,
    uptime_percentage: Number(server.uptimePercentage) || 0,
    last_checked_at: server.lastCheckedAt || todayIso(),
    error_message: server.errorMessage || null,
    linked_services: server.linkedServices || [],
    notes: server.notes || '',
    created_by: userId || null,
  };
}

export function rowToServer(row) {
  return sanitizeServerConfig({
    id: row.id,
    serverName: row.server_name,
    serverType: row.server_type,
    region: row.region,
    environment: row.environment,
    apiUrl: row.api_url,
    databaseReference: row.database_reference,
    storageUrl: row.storage_url,
    status: row.status,
    responseTimeMs: row.response_time_ms,
    uptimePercentage: row.uptime_percentage,
    lastCheckedAt: row.last_checked_at,
    errorMessage: row.error_message,
    linkedServices: row.linked_services,
    notes: row.notes,
    createdAt: row.created_at,
  });
}
