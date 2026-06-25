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
export const serverLinkTypes = ['Primary-Backup', 'Primary-Analytics', 'Primary-AI', 'Regional-Regional', 'Failover', 'Sync', 'Monitoring'];
export const serverGroupTypes = ['Production Cluster', 'Development Cluster', 'Analytics Cluster', 'AI Cluster', 'Regional Cluster', 'Backup Cluster'];

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

export const blankServerLink = {
  id: '',
  sourceServerId: '',
  targetServerId: '',
  linkType: 'Sync',
  status: 'Online',
  latencyMs: 0,
  notes: '',
  createdAt: '',
};

export const blankServerGroup = {
  id: '',
  groupName: '',
  groupType: 'Production Cluster',
  region: 'Global',
  environment: 'Production',
  serverIds: [],
  notes: '',
  createdAt: '',
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

export function sanitizeServerLink(link) {
  return {
    ...blankServerLink,
    ...link,
    id: link.id || `lnk-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    sourceServerId: link.sourceServerId || '',
    targetServerId: link.targetServerId || '',
    linkType: serverLinkTypes.includes(link.linkType) ? link.linkType : 'Sync',
    status: serverStatuses.includes(link.status) ? link.status : 'Online',
    latencyMs: Number(link.latencyMs) || 0,
    createdAt: link.createdAt || todayIso(),
  };
}

export function sanitizeServerGroup(group) {
  return {
    ...blankServerGroup,
    ...group,
    id: group.id || `grp-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    groupName: String(group.groupName || '').trim(),
    groupType: serverGroupTypes.includes(group.groupType) ? group.groupType : 'Production Cluster',
    environment: serverEnvironments.includes(group.environment) ? group.environment : 'Production',
    serverIds: Array.isArray(group.serverIds) ? group.serverIds.filter(Boolean) : [],
    createdAt: group.createdAt || todayIso(),
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

export function buildNetworkHealthScore(servers = [], links = []) {
  if (!servers.length) return 0;
  const onlineScore = (servers.filter((server) => server.status === 'Online').length / servers.length) * 42;
  const uptimeScore = servers.reduce((sum, server) => sum + (Number(server.uptimePercentage) || 0), 0) / servers.length * 0.32;
  const latencyPenalty = Math.min(18, servers.reduce((sum, server) => sum + Math.max(0, (Number(server.responseTimeMs) || 0) - 650), 0) / Math.max(servers.length, 1) / 80);
  const linkScore = links.length ? (links.filter((link) => link.status === 'Online').length / links.length) * 18 : 8;
  return Math.max(0, Math.min(100, Math.round(onlineScore + uptimeScore + linkScore - latencyPenalty)));
}

export function buildRegionalDistribution(servers = []) {
  const regions = servers.reduce((acc, server) => {
    const region = server.region || 'Unassigned';
    acc[region] = acc[region] || { region, total: 0, online: 0, warning: 0, offline: 0, avgLatency: 0, uptime: 0 };
    acc[region].total += 1;
    if (server.status === 'Online') acc[region].online += 1;
    if (['Warning', 'Maintenance', 'Unknown'].includes(server.status)) acc[region].warning += 1;
    if (server.status === 'Offline') acc[region].offline += 1;
    acc[region].avgLatency += Number(server.responseTimeMs) || 0;
    acc[region].uptime += Number(server.uptimePercentage) || 0;
    return acc;
  }, {});
  return Object.values(regions).map((region) => ({
    ...region,
    avgLatency: Math.round(region.avgLatency / Math.max(region.total, 1)),
    uptime: Number((region.uptime / Math.max(region.total, 1)).toFixed(2)),
  })).sort((a, b) => b.total - a.total || a.region.localeCompare(b.region));
}

export function buildGroupHealth(servers = [], groups = []) {
  return groups.map((group) => {
    const groupServers = servers.filter((server) => group.serverIds.includes(server.id));
    return {
      ...group,
      total: groupServers.length,
      online: groupServers.filter((server) => server.status === 'Online').length,
      unhealthy: groupServers.filter((server) => server.status !== 'Online').length,
      avgLatency: Math.round(groupServers.reduce((sum, server) => sum + (Number(server.responseTimeMs) || 0), 0) / Math.max(groupServers.length, 1)),
      uptime: Number((groupServers.reduce((sum, server) => sum + (Number(server.uptimePercentage) || 0), 0) / Math.max(groupServers.length, 1)).toFixed(2)),
    };
  });
}

export function buildInfrastructureAnalytics(servers = [], links = [], groups = []) {
  const highestLatency = [...servers].sort((a, b) => (Number(b.responseTimeMs) || 0) - (Number(a.responseTimeMs) || 0))[0];
  const lowestUptime = [...servers].sort((a, b) => (Number(a.uptimePercentage) || 0) - (Number(b.uptimePercentage) || 0))[0];
  const backups = servers.filter((server) => server.serverType === 'Backup' && server.status === 'Online');
  return {
    networkHealthScore: buildNetworkHealthScore(servers, links),
    regionalDistribution: buildRegionalDistribution(servers),
    groupHealth: buildGroupHealth(servers, groups),
    highestLatency,
    lowestUptime,
    backupCoverage: servers.some((server) => server.serverType === 'Primary') ? backups.length : 0,
    unhealthyServers: servers.filter((server) => server.status !== 'Online'),
    activeLinks: links.filter((link) => link.status === 'Online').length,
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

export function buildNetworkAlerts(servers = [], links = [], groups = []) {
  const baseAlerts = buildInfrastructureAlerts(servers);
  const linkAlerts = links
    .filter((link) => link.status !== 'Online' || Number(link.latencyMs) > 800)
    .map((link) => ({
      id: `${link.id}-network`,
      severity: link.status === 'Offline' ? 'Critical' : 'Medium',
      title: `Server link ${link.linkType} needs review`,
      message: `${link.status} link with ${link.latencyMs || 0} ms latency.`,
    }));
  const groupAlerts = buildGroupHealth(servers, groups)
    .filter((group) => group.unhealthy > 0)
    .map((group) => ({
      id: `${group.id}-group-health`,
      severity: group.unhealthy >= 2 ? 'High' : 'Medium',
      title: `${group.groupName} has unhealthy servers`,
      message: `${group.unhealthy} of ${group.total} servers require attention.`,
    }));
  return [...baseAlerts, ...linkAlerts, ...groupAlerts];
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

export function buildInfrastructureTimeline(servers = [], links = [], groups = []) {
  const serverEvents = buildServerActivity(servers);
  const linkEvents = links.map((link) => ({
    id: `${link.id}-linked`,
    title: `Server link created`,
    detail: `${link.linkType} - ${link.status} - ${link.latencyMs || 0} ms`,
    createdAt: link.createdAt || todayIso(),
  }));
  const groupEvents = groups.map((group) => ({
    id: `${group.id}-group`,
    title: `${group.groupName} created`,
    detail: `${group.groupType} with ${group.serverIds.length} servers`,
    createdAt: group.createdAt || todayIso(),
  }));
  return [...serverEvents, ...linkEvents, ...groupEvents]
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

export function linkToRow(link, userId) {
  return {
    source_server_id: link.sourceServerId || null,
    target_server_id: link.targetServerId || null,
    link_type: link.linkType,
    status: link.status,
    latency_ms: Number(link.latencyMs) || 0,
    notes: link.notes || '',
    created_by: userId || null,
  };
}

export function rowToLink(row) {
  return sanitizeServerLink({
    id: row.id,
    sourceServerId: row.source_server_id,
    targetServerId: row.target_server_id,
    linkType: row.link_type,
    status: row.status,
    latencyMs: row.latency_ms,
    notes: row.notes,
    createdAt: row.created_at,
  });
}

export function groupToRow(group, userId) {
  return {
    group_name: group.groupName,
    group_type: group.groupType,
    region: group.region,
    environment: group.environment,
    server_ids: group.serverIds || [],
    notes: group.notes || '',
    created_by: userId || null,
  };
}

export function rowToGroup(row) {
  return sanitizeServerGroup({
    id: row.id,
    groupName: row.group_name,
    groupType: row.group_type,
    region: row.region,
    environment: row.environment,
    serverIds: row.server_ids,
    notes: row.notes,
    createdAt: row.created_at,
  });
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
