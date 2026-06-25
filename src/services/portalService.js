const nowIso = () => new Date().toISOString();

export const portalTypes = ['Customer', 'Supplier'];
export const portalStatuses = ['Invited', 'Active', 'Suspended', 'Pending Setup'];
export const portalNoticeTypes = ['Order Update', 'Shipment Update', 'Procurement Update', 'Document Shared', 'Account Alert', 'General Notice'];

export const blankPortalUser = {
  id: '',
  portalType: 'Customer',
  displayName: '',
  email: '',
  linkedRecordId: '',
  status: 'Pending Setup',
  lastLoginAt: '',
  notes: '',
  createdAt: '',
};

export const blankPortalNotice = {
  id: '',
  portalType: 'Customer',
  linkedRecordId: '',
  title: '',
  message: '',
  noticeType: 'General Notice',
  priority: 'Medium',
  createdAt: '',
};

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function sanitizePortalUser(user = {}) {
  return {
    ...blankPortalUser,
    ...user,
    id: user.id || uid('portal-user'),
    portalType: portalTypes.includes(user.portalType) ? user.portalType : 'Customer',
    displayName: String(user.displayName || '').trim(),
    email: String(user.email || '').trim(),
    status: portalStatuses.includes(user.status) ? user.status : 'Pending Setup',
    createdAt: user.createdAt || user.created_at || nowIso(),
  };
}

export function sanitizePortalNotice(notice = {}) {
  return {
    ...blankPortalNotice,
    ...notice,
    id: notice.id || uid('portal-notice'),
    portalType: portalTypes.includes(notice.portalType) ? notice.portalType : 'Customer',
    noticeType: portalNoticeTypes.includes(notice.noticeType) ? notice.noticeType : 'General Notice',
    createdAt: notice.createdAt || notice.created_at || nowIso(),
  };
}

export function portalUserToRow(user, actorId, companyId) {
  return {
    portal_type: user.portalType,
    display_name: user.displayName,
    email: user.email,
    linked_record_id: user.linkedRecordId || null,
    status: user.status,
    last_login_at: user.lastLoginAt || null,
    notes: user.notes || '',
    company_id: companyId || null,
    created_by: actorId || null,
  };
}

export function rowToPortalUser(row) {
  return sanitizePortalUser({
    id: row.id,
    portalType: row.portal_type,
    displayName: row.display_name,
    email: row.email,
    linkedRecordId: row.linked_record_id,
    status: row.status,
    lastLoginAt: row.last_login_at,
    notes: row.notes,
    createdAt: row.created_at,
  });
}

export function portalNoticeToRow(notice, actorId, companyId) {
  return {
    portal_type: notice.portalType,
    linked_record_id: notice.linkedRecordId || null,
    title: notice.title,
    message: notice.message,
    notice_type: notice.noticeType,
    priority: notice.priority,
    company_id: companyId || null,
    created_by: actorId || null,
  };
}

export function rowToPortalNotice(row) {
  return sanitizePortalNotice({
    id: row.id,
    portalType: row.portal_type,
    linkedRecordId: row.linked_record_id,
    title: row.title,
    message: row.message,
    noticeType: row.notice_type,
    priority: row.priority,
    createdAt: row.created_at,
  });
}

export function buildCustomerPortalView(customer, { orders = [], shipments = [], documents = [], notices = [] } = {}) {
  if (!customer) {
    return { profile: null, orders: [], shipments: [], documents: [], notices: [], activity: [], metrics: {} };
  }
  const customerName = customer.customerName || customer.name || customer.fullName;
  const customerOrders = orders.filter((order) => order.customerName === customerName || order.customerId === customer.id);
  const orderIds = new Set(customerOrders.map((order) => order.id));
  const customerShipments = shipments.filter((shipment) => shipment.customerName === customerName || orderIds.has(shipment.linkedOrderId));
  const customerDocuments = documents.filter((document) => {
    const moduleName = String(document.linkedModule || '').toLowerCase();
    return document.linkedRecordId === customer.id
      || customerOrders.some((order) => document.linkedRecordId === order.id)
      || customerShipments.some((shipment) => document.linkedRecordId === shipment.shipmentId)
      || moduleName.includes('customer');
  });
  const deliveredOrders = customerOrders.filter((order) => ['Delivered', 'Completed'].includes(order.status));
  const pendingOrders = customerOrders.filter((order) => !['Delivered', 'Completed', 'Cancelled'].includes(order.status));
  const customerNotices = notices.filter((notice) => notice.portalType === 'Customer' && (!notice.linkedRecordId || notice.linkedRecordId === customer.id));
  const activity = [
    ...customerOrders.slice(0, 4).map((order) => ({
      id: `order-${order.id}`,
      title: `Order ${order.orderNumber || order.id} is ${order.status}`,
      detail: order.vehicle || 'Vehicle order',
      date: order.orderDate || order.createdAt,
    })),
    ...customerShipments.slice(0, 4).map((shipment) => ({
      id: `shipment-${shipment.shipmentId}`,
      title: `Shipment ${shipment.shipmentId} is ${shipment.status}`,
      detail: shipment.destinationCountry || shipment.portOfArrival || 'Shipment tracking',
      date: shipment.eta || shipment.createdAt,
    })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return {
    profile: customer,
    orders: customerOrders,
    shipments: customerShipments,
    documents: customerDocuments,
    notices: customerNotices,
    activity,
    metrics: {
      activeOrders: pendingOrders.length,
      deliveredOrders: deliveredOrders.length,
      pendingOrders: pendingOrders.length,
      activeShipments: customerShipments.filter((shipment) => shipment.status !== 'Delivered').length,
      documents: customerDocuments.length,
    },
  };
}

export function buildSupplierPortalView(supplier, { procurementRequests = [], documents = [], notices = [] } = {}) {
  if (!supplier) {
    return { profile: null, procurements: [], documents: [], notices: [], activity: [], metrics: {} };
  }
  const supplierName = supplier.supplierName || supplier.name;
  const procurements = procurementRequests.filter((request) => request.supplierName === supplierName || request.supplierId === supplier.id);
  const supplierDocuments = documents.filter((document) => {
    const moduleName = String(document.linkedModule || '').toLowerCase();
    return document.linkedRecordId === supplier.id
      || procurements.some((request) => document.linkedRecordId === request.procurementId)
      || moduleName.includes('supplier') || moduleName.includes('procurement');
  });
  const supplierNotices = notices.filter((notice) => notice.portalType === 'Supplier' && (!notice.linkedRecordId || notice.linkedRecordId === supplier.id));
  const activity = procurements.slice(0, 8).map((request) => ({
    id: `proc-${request.procurementId}`,
    title: `Procurement ${request.procurementId || request.id} is ${request.status}`,
    detail: `${request.vehicleBrand || ''} ${request.vehicleModel || ''}`.trim() || 'Procurement request',
    date: request.expectedDeliveryDate || request.createdAt,
  }));
  return {
    profile: supplier,
    procurements,
    documents: supplierDocuments,
    notices: supplierNotices,
    activity,
    metrics: {
      openRequests: procurements.filter((item) => !['Completed', 'Added To Inventory', 'Cancelled'].includes(item.status)).length,
      approvedRequests: procurements.filter((item) => ['Approved', 'Purchased', 'Ordered'].includes(item.status)).length,
      completedRequests: procurements.filter((item) => ['Completed', 'Added To Inventory', 'Received'].includes(item.status)).length,
      documents: supplierDocuments.length,
    },
  };
}

export function buildPortalAnalytics(users = [], activity = [], customerViews = [], supplierViews = []) {
  return {
    portalUsers: users.length,
    activeUsers: users.filter((user) => user.status === 'Active').length,
    loginActivity: users.filter((user) => user.lastLoginAt).length,
    viewedItems: activity.length,
    customerEngagement: customerViews.reduce((sum, view) => sum + (view.activity?.length || 0) + (view.documents?.length || 0), 0),
    supplierEngagement: supplierViews.reduce((sum, view) => sum + (view.activity?.length || 0) + (view.documents?.length || 0), 0),
  };
}

export function buildPortalAiInsights({ customers = [], suppliers = [], portalUsers = [], activity = [] } = {}) {
  const activeCustomers = customers.filter((view) => (view.metrics?.activeOrders || 0) || (view.metrics?.activeShipments || 0));
  const engagedSuppliers = suppliers.filter((view) => (view.metrics?.openRequests || 0) || (view.documents?.length || 0));
  const staleUsers = portalUsers.filter((user) => user.status === 'Invited' || !user.lastLoginAt);
  return [
    {
      title: 'Active customer portals',
      detail: `${activeCustomers.length} customers have active orders or shipments visible in the portal.`,
      tone: activeCustomers.length ? 'High' : 'Low',
    },
    {
      title: 'Supplier engagement',
      detail: `${engagedSuppliers.length} suppliers have active procurement or document visibility.`,
      tone: engagedSuppliers.length ? 'Medium' : 'Low',
    },
    {
      title: 'Portal users needing attention',
      detail: `${staleUsers.length} portal users are invited, pending, or have no login activity.`,
      tone: staleUsers.length ? 'High' : 'Low',
    },
    {
      title: 'Portal activity trail',
      detail: `${activity.length} portal events are available for future audit and AI COO analysis.`,
      tone: 'Medium',
    },
  ];
}
