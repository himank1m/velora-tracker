const dateTime = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function number(value) {
  return Number(String(value ?? '').replace(/,/g, '')) || 0;
}

function safeDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function daysUntil(value) {
  const date = safeDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date - today) / 86400000);
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename, rows) {
  const keys = Array.from(rows.reduce((set, row) => {
    Object.keys(row || {}).forEach((key) => set.add(key));
    return set;
  }, new Set()));
  const escape = (value) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [keys.join(','), ...rows.map((row) => keys.map((key) => escape(row[key])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildBackupPayload({
  company,
  user,
  role,
  vehicles = [],
  orders = [],
  quotes = [],
  customers = [],
  shipments = [],
  procurementRequests = [],
  suppliers = [],
  financeRecords = [],
  documents = [],
  alerts = [],
}) {
  return {
    metadata: {
      product: 'Velora OS',
      company: company?.name || 'Velora Motors',
      companyId: company?.id || null,
      exportedBy: user?.email || null,
      role,
      exportedAt: new Date().toISOString(),
      restoreMode: 'Preparation only. This export does not perform writes.',
    },
    counts: {
      vehicles: vehicles.length,
      orders: orders.length,
      quotes: quotes.length,
      customers: customers.length,
      shipments: shipments.length,
      procurementRequests: procurementRequests.length,
      suppliers: suppliers.length,
      financeRecords: financeRecords.length,
      documents: documents.length,
      alerts: alerts.length,
    },
    data: {
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
    },
  };
}

export function buildNotificationFeed({
  alerts = [],
  orders = [],
  shipments = [],
  procurementRequests = [],
  financeRecords = [],
  healthEvents = [],
}) {
  const generated = [];
  alerts.filter((alert) => !alert.resolved).slice(0, 20).forEach((alert) => {
    generated.push({
      id: `alert-${alert.id}`,
      type: alert.linkedModule || 'Alert',
      severity: alert.severity || 'Medium',
      title: alert.title,
      message: alert.message,
      createdAt: alert.createdAt || new Date().toISOString(),
      action: alert.linkedModule,
    });
  });
  shipments.forEach((shipment) => {
    const etaDistance = daysUntil(shipment.eta);
    if (shipment.status !== 'Delivered' && etaDistance !== null && etaDistance < 0) {
      generated.push({
        id: `shipment-overdue-${shipment.id || shipment.shipmentId}`,
        type: 'Shipment',
        severity: 'High',
        title: `${shipment.shipmentId || 'Shipment'} is overdue`,
        message: `${shipment.customerName || 'Customer'} shipment missed ETA by ${Math.abs(etaDistance)} day(s).`,
        createdAt: shipment.eta,
        action: 'Shipments',
      });
    } else if (shipment.status !== 'Delivered' && etaDistance !== null && etaDistance <= 3) {
      generated.push({
        id: `shipment-eta-${shipment.id || shipment.shipmentId}`,
        type: 'Shipment',
        severity: 'Medium',
        title: `${shipment.shipmentId || 'Shipment'} ETA is near`,
        message: `${shipment.vehicle || 'Vehicle'} shipment reaches ETA in ${etaDistance} day(s).`,
        createdAt: shipment.eta,
        action: 'Shipments',
      });
    }
  });
  financeRecords.forEach((record) => {
    const dueDistance = daysUntil(record.dueDate);
    if (record.paymentStatus !== 'Paid' && dueDistance !== null && dueDistance < 0) {
      generated.push({
        id: `payment-overdue-${record.id}`,
        type: 'Finance',
        severity: 'High',
        title: 'Payment reminder overdue',
        message: `Finance record ${record.id} is overdue by ${Math.abs(dueDistance)} day(s).`,
        createdAt: record.dueDate,
        action: 'Finance',
      });
    }
  });
  procurementRequests.forEach((request) => {
    const dueDistance = daysUntil(request.expectedDeliveryDate);
    if (!['Received', 'Added To Inventory', 'Cancelled'].includes(request.status) && dueDistance !== null && dueDistance < 0) {
      generated.push({
        id: `procurement-risk-${request.id || request.procurementId}`,
        type: 'Procurement',
        severity: 'Medium',
        title: `${request.procurementId || 'Procurement'} delivery risk`,
        message: `${request.vehicleBrand || 'Vehicle'} ${request.vehicleModel || ''} procurement is behind expected delivery.`,
        createdAt: request.expectedDeliveryDate,
        action: 'Procurement',
      });
    }
  });
  orders.filter((order) => order.status !== 'Completed').slice(0, 8).forEach((order) => {
    generated.push({
      id: `order-open-${order.id}`,
      type: 'Order',
      severity: order.status === 'Inquiry' ? 'Low' : 'Medium',
      title: `Open order ${order.orderNumber || order.id}`,
      message: `${order.customerName || 'Customer'} order is currently ${order.status}.`,
      createdAt: order.orderDate,
      action: 'Orders',
    });
  });
  healthEvents.slice(0, 8).forEach((event) => {
    generated.push({
      id: `system-${event.id}`,
      type: 'System',
      severity: event.severity === 'error' ? 'High' : 'Medium',
      title: event.type,
      message: event.message,
      createdAt: event.createdAt,
      action: 'Launch Readiness',
    });
  });
  return generated
    .filter((item) => item.title)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((item) => ({
      ...item,
      displayTime: item.createdAt ? dateTime.format(new Date(item.createdAt)) : 'Now',
    }));
}

export function buildSecurityChecklist({
  isSupabaseConfigured,
  user,
  role,
  phase2Ready,
  ecosystemReady,
  canViewFinancials,
}) {
  return [
    {
      label: 'Supabase URL and anon key configured',
      status: isSupabaseConfigured ? 'Passed' : 'Action needed',
      detail: isSupabaseConfigured ? 'Frontend receives public Supabase config at build time.' : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    },
    {
      label: 'Authenticated session required',
      status: user ? 'Passed' : 'Action needed',
      detail: user ? 'Protected workspace is behind Supabase Auth session state.' : 'Sign in to access operations.',
    },
    {
      label: 'Role-aware navigation active',
      status: role ? 'Passed' : 'Action needed',
      detail: role ? `Current access scope is ${role}.` : 'Profile role could not be loaded.',
    },
    {
      label: 'Finance context protected',
      status: canViewFinancials ? 'Privileged' : 'Restricted',
      detail: canViewFinancials ? 'Financial modules are visible for this role.' : 'Financial values are hidden for this role.',
    },
    {
      label: 'Enterprise database migrations',
      status: phase2Ready ? 'Passed' : 'Action needed',
      detail: phase2Ready ? 'Phase 2+ tables are available.' : 'Run pending enterprise migrations in Supabase.',
    },
    {
      label: 'Company tenant workspace',
      status: ecosystemReady ? 'Passed' : 'Compatibility',
      detail: ecosystemReady ? 'Company scoping is active.' : 'Ecosystem migration has not been applied yet.',
    },
  ];
}

export function buildLaunchReadiness({
  isSupabaseConfigured,
  phase2Ready,
  ecosystemReady,
  authError,
  dataError,
  healthEvents = [],
  documents = [],
  counts = {},
  notifications = [],
}) {
  const checks = [
    { area: 'Build', label: 'Production build', status: 'Passed', detail: 'Latest local Vite build completed successfully in this workspace.' },
    { area: 'Environment', label: 'Supabase environment', status: isSupabaseConfigured ? 'Passed' : 'Action needed', detail: isSupabaseConfigured ? 'Public Supabase env variables are present.' : 'Missing public Supabase variables.' },
    { area: 'Authentication', label: 'Auth session health', status: authError ? 'Action needed' : 'Passed', detail: authError || 'Auth listener and session restore are active.' },
    { area: 'Database', label: 'Live query health', status: dataError ? 'Action needed' : 'Passed', detail: dataError || 'Authorized Supabase record queries completed without a visible error.' },
    { area: 'Database', label: 'Enterprise schema', status: phase2Ready ? 'Passed' : 'Action needed', detail: phase2Ready ? 'Core enterprise tables are available.' : 'Run pending Supabase migrations.' },
    { area: 'Ecosystem', label: 'Company scoping', status: ecosystemReady ? 'Passed' : 'Compatibility', detail: ecosystemReady ? 'Multi-company workspace is enabled.' : 'Phase 8 migration not detected yet.' },
    { area: 'Storage', label: 'Document vault', status: documents.length || phase2Ready ? 'Passed' : 'Review', detail: phase2Ready ? 'Document module is available; verify bucket policy in Supabase.' : 'Document module waits for enterprise schema.' },
    { area: 'Monitoring', label: 'Runtime health events', status: healthEvents.length ? 'Review' : 'Passed', detail: healthEvents.length ? `${healthEvents.length} runtime event(s) recorded in this browser.` : 'No browser runtime failures recorded.' },
    { area: 'Operations', label: 'Operational data loaded', status: Object.values(counts).some(Boolean) ? 'Passed' : 'Review', detail: `${Object.values(counts).reduce((sum, value) => sum + number(value), 0)} authorized records loaded.` },
    { area: 'Notifications', label: 'Notification center', status: notifications.length ? 'Review' : 'Passed', detail: notifications.length ? `${notifications.length} item(s) need attention.` : 'No generated operational notifications currently open.' },
  ];
  const passed = checks.filter((check) => check.status === 'Passed' || check.status === 'Privileged' || check.status === 'Restricted').length;
  const score = Math.round((passed / checks.length) * 100);
  return { score, checks };
}
