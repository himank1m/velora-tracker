const nowIso = () => new Date().toISOString();

export const communicationDepartments = ['Company-wide', 'HR', 'Sales', 'Finance', 'Logistics', 'Procurement', 'Operations', 'IT', 'Management'];
export const communicationPriorities = ['Low', 'Medium', 'High', 'Critical'];
export const communicationCategories = ['Notice', 'Policy', 'Event', 'Reminder', 'Operational update', 'AI alert'];
export const messageAudiences = ['Direct Message', 'Department Message', 'Management Broadcast'];
export const eventTypes = ['Meeting', 'Payroll Date', 'Holiday', 'Review', 'Deadline', 'Operations Event'];

export const blankAnnouncement = {
  id: '',
  title: '',
  message: '',
  author: '',
  priority: 'Medium',
  department: 'Company-wide',
  category: 'Notice',
  publishDate: new Date().toISOString().slice(0, 10),
  expiryDate: '',
  linkedDocumentId: '',
  source: 'Manual',
  createdAt: '',
};

export const blankMessage = {
  id: '',
  subject: '',
  body: '',
  sender: '',
  audienceType: 'Department Message',
  targetDepartment: 'Operations',
  recipient: '',
  priority: 'Medium',
  createdAt: '',
};

export const blankEvent = {
  id: '',
  title: '',
  eventType: 'Meeting',
  department: 'Company-wide',
  eventDate: new Date().toISOString().slice(0, 10),
  eventTime: '',
  notes: '',
  createdAt: '',
};

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function sanitizeAnnouncement(record = {}) {
  return {
    ...blankAnnouncement,
    ...record,
    id: record.id || uid('comm'),
    title: String(record.title || '').trim(),
    message: String(record.message || '').trim(),
    author: String(record.author || '').trim(),
    priority: communicationPriorities.includes(record.priority) ? record.priority : 'Medium',
    department: communicationDepartments.includes(record.department) ? record.department : 'Company-wide',
    category: communicationCategories.includes(record.category) ? record.category : 'Notice',
    createdAt: record.createdAt || record.created_at || nowIso(),
  };
}

export function sanitizeMessage(record = {}) {
  return {
    ...blankMessage,
    ...record,
    id: record.id || uid('msg'),
    subject: String(record.subject || '').trim(),
    body: String(record.body || '').trim(),
    sender: String(record.sender || '').trim(),
    audienceType: messageAudiences.includes(record.audienceType) ? record.audienceType : 'Department Message',
    priority: communicationPriorities.includes(record.priority) ? record.priority : 'Medium',
    createdAt: record.createdAt || record.created_at || nowIso(),
  };
}

export function sanitizeEvent(record = {}) {
  return {
    ...blankEvent,
    ...record,
    id: record.id || uid('evt'),
    title: String(record.title || '').trim(),
    eventType: eventTypes.includes(record.eventType) ? record.eventType : 'Meeting',
    department: communicationDepartments.includes(record.department) ? record.department : 'Company-wide',
    createdAt: record.createdAt || record.created_at || nowIso(),
  };
}

export function announcementToRow(record, userId, companyId) {
  return {
    title: record.title,
    message: record.message,
    author: record.author,
    priority: record.priority,
    department: record.department,
    category: record.category,
    publish_date: record.publishDate || null,
    expiry_date: record.expiryDate || null,
    linked_document_id: record.linkedDocumentId || null,
    source: record.source || 'Manual',
    company_id: companyId || null,
    created_by: userId || null,
  };
}

export function rowToAnnouncement(row) {
  return sanitizeAnnouncement({
    id: row.id,
    title: row.title,
    message: row.message,
    author: row.author,
    priority: row.priority,
    department: row.department,
    category: row.category,
    publishDate: row.publish_date,
    expiryDate: row.expiry_date,
    linkedDocumentId: row.linked_document_id,
    source: row.source,
    createdAt: row.created_at,
  });
}

export function messageToRow(record, userId, companyId) {
  return {
    subject: record.subject,
    body: record.body,
    sender: record.sender,
    audience_type: record.audienceType,
    target_department: record.targetDepartment || null,
    recipient: record.recipient || null,
    priority: record.priority,
    company_id: companyId || null,
    created_by: userId || null,
  };
}

export function rowToMessage(row) {
  return sanitizeMessage({
    id: row.id,
    subject: row.subject,
    body: row.body,
    sender: row.sender,
    audienceType: row.audience_type,
    targetDepartment: row.target_department,
    recipient: row.recipient,
    priority: row.priority,
    createdAt: row.created_at,
  });
}

export function eventToRow(record, userId, companyId) {
  return {
    title: record.title,
    event_type: record.eventType,
    department: record.department,
    event_date: record.eventDate || null,
    event_time: record.eventTime || null,
    notes: record.notes || '',
    company_id: companyId || null,
    created_by: userId || null,
  };
}

export function rowToEvent(row) {
  return sanitizeEvent({
    id: row.id,
    title: row.title,
    eventType: row.event_type,
    department: row.department,
    eventDate: row.event_date,
    eventTime: row.event_time,
    notes: row.notes,
    createdAt: row.created_at,
  });
}

export function buildAiCommunicationAlerts(alerts = [], financeRecords = [], procurementRequests = [], payrollRecords = []) {
  const operationalAlerts = alerts.slice(0, 8).map((alert) => sanitizeAnnouncement({
    id: `ai-${alert.id}`,
    title: alert.title,
    message: alert.message,
    author: 'AI COO',
    priority: alert.severity || 'High',
    department: alert.linkedModule === 'Shipments' ? 'Logistics' : 'Operations',
    category: 'AI alert',
    source: 'AI COO',
    publishDate: new Date().toISOString().slice(0, 10),
  }));

  const overdueFinance = financeRecords
    .filter((record) => record.paymentStatus === 'Overdue')
    .slice(0, 4)
    .map((record) => sanitizeAnnouncement({
      id: `ai-finance-${record.id}`,
      title: `Overdue payment needs follow-up`,
      message: `${record.customerName || 'Customer'} has an overdue finance record. Review collection priority.`,
      author: 'AI COO',
      priority: 'High',
      department: 'Finance',
      category: 'AI alert',
      source: 'AI COO',
    }));

  const procurementRisks = procurementRequests
    .filter((request) => ['Delayed', 'Pending Approval', 'Negotiation'].includes(request.status))
    .slice(0, 4)
    .map((request) => sanitizeAnnouncement({
      id: `ai-proc-${request.procurementId || request.id}`,
      title: `Procurement requires attention`,
      message: `${request.vehicleBrand || 'Vehicle'} ${request.vehicleModel || ''} is currently ${request.status}.`,
      author: 'AI COO',
      priority: request.status === 'Delayed' ? 'Critical' : 'Medium',
      department: 'Procurement',
      category: 'AI alert',
      source: 'AI COO',
    }));

  const payrollRisks = payrollRecords
    .filter((record) => ['Overdue', 'Pending'].includes(record.paymentStatus))
    .slice(0, 4)
    .map((record) => sanitizeAnnouncement({
      id: `ai-payroll-${record.id}`,
      title: `Payroll item is ${record.paymentStatus}`,
      message: `${record.employeeName || 'Employee'} payroll record needs HR or Finance review.`,
      author: 'AI COO',
      priority: record.paymentStatus === 'Overdue' ? 'High' : 'Medium',
      department: 'HR',
      category: 'AI alert',
      source: 'AI COO',
    }));

  return [...operationalAlerts, ...overdueFinance, ...procurementRisks, ...payrollRisks];
}

export function buildCommunicationAnalytics(announcements = [], messages = [], events = [], receipts = {}) {
  const total = announcements.length;
  const acknowledged = announcements.filter((item) => receipts[item.id]?.acknowledged).length;
  const viewed = announcements.filter((item) => receipts[item.id]?.viewed).length;
  const critical = announcements.filter((item) => item.priority === 'Critical').length;
  const unread = announcements.filter((item) => !receipts[item.id]?.viewed).length;
  const departments = communicationDepartments
    .filter((department) => department !== 'Company-wide')
    .map((department) => {
      const departmentItems = announcements.filter((item) => item.department === department);
      const departmentViewed = departmentItems.filter((item) => receipts[item.id]?.viewed).length;
      return {
        department,
        total: departmentItems.length,
        readRate: departmentItems.length ? Math.round((departmentViewed / departmentItems.length) * 100) : 0,
      };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  return {
    totalAnnouncements: total,
    totalMessages: messages.length,
    totalEvents: events.length,
    criticalAlerts: critical,
    unread,
    readRate: total ? Math.round((viewed / total) * 100) : 0,
    acknowledgementRate: total ? Math.round((acknowledged / total) * 100) : 0,
    departmentEngagement: departments,
  };
}

export function filterCommunicationItems(items = [], query = '', department = 'All', priority = 'All') {
  const needle = String(query || '').toLowerCase();
  return items.filter((item) => {
    const matchesQuery = !needle || [item.title, item.message, item.author, item.department, item.category]
      .join(' ')
      .toLowerCase()
      .includes(needle);
    const matchesDepartment = department === 'All' || item.department === department;
    const matchesPriority = priority === 'All' || item.priority === priority;
    return matchesQuery && matchesDepartment && matchesPriority;
  });
}
