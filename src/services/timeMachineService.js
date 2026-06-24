const ACTIVE_ORDER_STATUSES = new Set(['Inquiry', 'Confirmed', 'Procurement', 'Inspection', 'Ready', 'Shipped'])
const ACTIVE_SHIPMENT_STATUSES = new Set(['Preparing', 'At Port', 'Loaded', 'In Transit', 'Customs Clearance'])
const ACTIVE_PROCUREMENT_STATUSES = new Set([
  'Requested',
  'Supplier Identified',
  'Negotiation',
  'Approved',
  'Purchased',
  'In Transit',
  'Arrived',
])

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0))
const number = (value) => Number(value) || 0

const toDate = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const toDateKey = (value) => {
  const date = toDate(value)
  if (!date) return ''
  return date.toISOString().slice(0, 10)
}

const endOfDay = (value) => {
  const date = toDate(value) || new Date()
  date.setHours(23, 59, 59, 999)
  return date
}

const occurredBy = (value, target) => {
  const date = toDate(value)
  return !date || date <= target
}

const recordCreatedAt = (record) =>
  record?.createdAt ||
  record?.created_at ||
  record?.orderDate ||
  record?.order_date ||
  record?.contactDate ||
  record?.contact_date ||
  record?.date ||
  null

const firstRecordDate = (record, fields = []) =>
  [...fields, 'createdAt', 'created_at', 'date']
    .map((field) => record?.[field])
    .find(Boolean) || null

const recordIdentityValues = (record) =>
  [
    record?.id,
    record?.orderId,
    record?.order_id,
    record?.orderNumber,
    record?.order_number,
    record?.shipmentId,
    record?.shipment_id,
    record?.procurementId,
    record?.procurement_id,
    record?.requestId,
    record?.request_id,
    record?.inventoryId,
    record?.inventory_id,
    record?.vehicleId,
    record?.vehicle_id,
    record?.quoteId,
    record?.quote_id,
    record?.vin,
  ]
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map((value) => String(value))

const latestEventBefore = (events, target) =>
  events
    .filter((event) => occurredBy(event.createdAt || event.created_at || event.eventDate || event.event_date, target))
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.created_at || b.eventDate || b.event_date || 0) -
        new Date(a.createdAt || a.created_at || a.eventDate || a.event_date || 0),
    )[0]

const eventList = (events) =>
  Array.isArray(events) ? events : Object.values(events || {}).flat()

const eventMatches = (event, record, keys) => {
  const recordIds = recordIdentityValues(record)
  if (!recordIds.length) return false
  return keys.some((key) => {
    const value = event?.[key]
    return value !== null && value !== undefined && recordIds.includes(String(value))
  })
}

const reconstructRecords = (records, events, target, eventKeys, options = {}) => {
  const { statusKeys = ['status'], dateFields = [] } = options
  return (records || [])
    .filter((record) => occurredBy(firstRecordDate(record, dateFields), target))
    .map((record) => {
      const related = eventList(events).filter((event) => eventMatches(event, record, eventKeys))
      const latest = latestEventBefore(related, target)
      const status = statusKeys.map((key) => latest?.[key]).find(Boolean)
      return status ? { ...record, status } : { ...record }
    })
}

const orderRevenue = (order) => number(order.totalRevenue) || number(order.sellingPrice)

const orderProfit = (order) =>
  number(order.totalProfit) || number(order.sellingPrice) - number(order.purchaseCost || order.purchasePrice)

const cleanValue = (value) => {
  if (Array.isArray(value)) return value.map(cleanValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => typeof entry !== 'function' && entry !== undefined)
        .map(([key, entry]) => [key, cleanValue(entry)]),
    )
  }
  return value
}

const normalizeState = (data = {}) => ({
  vehicles: cleanValue(data.vehicles || []),
  orders: cleanValue(data.orders || []),
  customers: cleanValue(data.customers || []),
  shipments: cleanValue(data.shipments || []),
  procurementRequests: cleanValue(data.procurementRequests || []),
  suppliers: cleanValue(data.suppliers || []),
  financeRecords: cleanValue(data.financeRecords || []),
  documents: cleanValue(data.documents || []),
})

export const calculateHistoricalMetrics = (state = {}, asOfDate = new Date()) => {
  const orders = state.orders || []
  const vehicles = state.vehicles || []
  const shipments = state.shipments || []
  const procurements = state.procurementRequests || []
  const customers = state.customers || []
  const finance = state.financeRecords || []

  const revenue = orders.reduce((sum, order) => sum + orderRevenue(order), 0)
  const profit = orders.reduce((sum, order) => sum + orderProfit(order), 0)
  const inventoryUnits = vehicles.reduce((sum, vehicle) => sum + number(vehicle.quantity), 0)
  const inventoryValue = vehicles.reduce(
    (sum, vehicle) => sum + number(vehicle.purchasePrice) * number(vehicle.quantity),
    0,
  )
  const activeOrders = orders.filter((order) => ACTIVE_ORDER_STATUSES.has(order.status)).length
  const completedOrders = orders.filter((order) => order.status === 'Completed').length
  const activeShipments = shipments.filter((shipment) => ACTIVE_SHIPMENT_STATUSES.has(shipment.status)).length
  const deliveredShipments = shipments.filter((shipment) => shipment.status === 'Delivered').length
  const activeProcurements = procurements.filter((request) => ACTIVE_PROCUREMENT_STATUSES.has(request.status)).length
  const procurementValue = procurements.reduce(
    (sum, request) =>
      sum +
      (number(request.estimatedPurchaseCost) + number(request.estimatedFreightCost)) *
        Math.max(1, number(request.quantity)),
    0,
  )
  const freightCost = shipments.reduce((sum, shipment) => sum + number(shipment.freightCost), 0)
  const outstandingPayments = finance.reduce(
    (sum, record) => sum + Math.max(0, number(record.totalSaleAmount) - number(record.amountPaid)),
    0,
  )

  const profitability = revenue > 0 ? clamp(50 + (profit / revenue) * 250) : 50
  const deliveryPerformance = shipments.length ? clamp((deliveredShipments / shipments.length) * 100) : 80
  const billed = finance.reduce((sum, record) => sum + number(record.totalSaleAmount), 0)
  const paid = finance.reduce((sum, record) => sum + number(record.amountPaid), 0)
  const paymentCollection = billed > 0 ? clamp((paid / billed) * 100) : 80
  const completedProcurements = procurements.filter((request) =>
    ['Arrived', 'Added To Inventory'].includes(request.status),
  ).length
  const procurementEfficiency = procurements.length ? clamp((completedProcurements / procurements.length) * 100) : 80
  const healthScore = Math.round(
    profitability * 0.3 +
      deliveryPerformance * 0.25 +
      paymentCollection * 0.25 +
      procurementEfficiency * 0.2,
  )

  return {
    asOfDate: toDateKey(asOfDate),
    revenue,
    profit,
    inventoryUnits,
    inventoryValue,
    activeOrders,
    completedOrders,
    activeShipments,
    deliveredShipments,
    activeProcurements,
    procurementValue,
    freightCost,
    outstandingPayments,
    customers: customers.length,
    healthScore,
    healthFactors: {
      profitability: Math.round(profitability),
      deliveryPerformance: Math.round(deliveryPerformance),
      paymentCollection: Math.round(paymentCollection),
      procurementEfficiency: Math.round(procurementEfficiency),
    },
  }
}

export const createCompanySnapshot = (data, snapshotDate = new Date()) => {
  const state = normalizeState(data)
  return {
    snapshotDate: toDateKey(snapshotDate),
    schemaVersion: 1,
    state,
    metrics: calculateHistoricalMetrics(state, snapshotDate),
    recordCounts: Object.fromEntries(
      Object.entries(state)
        .filter(([, value]) => Array.isArray(value))
        .map(([key, value]) => [key, value.length]),
    ),
    createdAt: new Date().toISOString(),
  }
}

const fromSnapshot = (snapshot) => ({
  state: normalizeState(snapshot.state || {}),
  source: 'snapshot',
  confidence: 'Exact daily snapshot',
  snapshotDate: snapshot.snapshotDate || snapshot.snapshot_date,
  limitations: [],
})

export const reconstructCompanyState = (data, targetDate, snapshots = [], timelines = {}) => {
  const target = endOfDay(targetDate)
  const targetKey = toDateKey(target)
  const snapshot = [...(snapshots || [])]
    .filter((item) => (item.snapshotDate || item.snapshot_date) === targetKey)
    .sort((a, b) =>
      String(b.snapshotDate || b.snapshot_date).localeCompare(String(a.snapshotDate || a.snapshot_date)),
    )[0]

  if (snapshot) {
    const exact = fromSnapshot(snapshot)
    const metrics = calculateHistoricalMetrics(exact.state, target)
    return {
      ...exact,
      targetDate: targetKey,
      metrics: Object.values(metrics).some((value) => Number(value) > 0) ? metrics : (snapshot.metrics || metrics),
    }
  }

  const state = {
    vehicles: reconstructRecords(data.vehicles, timelines.vehicleEvents, target, [
      'vehicleId',
      'vehicle_id',
      'inventoryId',
      'inventory_id',
      'recordId',
    ], { dateFields: ['arrivalDate', 'arrival_date', 'createdAt', 'created_at'] }),
    orders: reconstructRecords(data.orders, timelines.orderTimelines, target, ['orderId', 'order_id', 'recordId'], {
      dateFields: ['orderDate', 'order_date', 'createdAt', 'created_at'],
    }),
    customers: (data.customers || []).filter((record) => occurredBy(recordCreatedAt(record), target)),
    shipments: reconstructRecords(data.shipments, timelines.shipmentEvents, target, ['shipmentId', 'shipment_id', 'recordId'], {
      dateFields: ['createdAt', 'created_at', 'eta'],
    }),
    procurementRequests: reconstructRecords(
      data.procurementRequests,
      timelines.procurementTimelines,
      target,
      ['procurementId', 'procurement_id', 'requestId', 'request_id', 'recordId'],
      { dateFields: ['createdAt', 'created_at'] },
    ),
    suppliers: (data.suppliers || []).filter((record) => occurredBy(recordCreatedAt(record), target)),
    financeRecords: (data.financeRecords || []).filter((record) => occurredBy(recordCreatedAt(record), target)),
    documents: (data.documents || []).filter((record) => occurredBy(recordCreatedAt(record), target)),
  }

  return {
    state,
    targetDate: targetKey,
    source: 'reconstructed',
    confidence: 'Reconstructed from records and timeline events',
    snapshotDate: null,
    metrics: calculateHistoricalMetrics(state, target),
    limitations: [
      'Inventory quantities and edited financial values are estimates before the first exact snapshot.',
      'Records without status timeline events use their earliest available state.',
    ],
  }
}

const metricDifference = (current, baseline) => ({
  value: current,
  previous: baseline,
  difference: current - baseline,
  percent: baseline ? ((current - baseline) / Math.abs(baseline)) * 100 : current ? 100 : 0,
})

export const compareHistoricalStates = (current, baseline) => {
  const a = current.metrics || calculateHistoricalMetrics(current.state, current.targetDate)
  const b = baseline.metrics || calculateHistoricalMetrics(baseline.state, baseline.targetDate)
  return {
    revenue: metricDifference(a.revenue, b.revenue),
    profit: metricDifference(a.profit, b.profit),
    inventoryValue: metricDifference(a.inventoryValue, b.inventoryValue),
    inventoryUnits: metricDifference(a.inventoryUnits, b.inventoryUnits),
    activeShipments: metricDifference(a.activeShipments, b.activeShipments),
    customers: metricDifference(a.customers, b.customers),
    healthScore: metricDifference(a.healthScore, b.healthScore),
  }
}

const timelineEvent = (type, title, detail, date, recordId, status = '') => ({
  id: `${type}-${recordId || title}-${date || 'unknown'}`,
  type,
  title,
  detail,
  date: date || null,
  recordId: recordId || null,
  status,
})

export const buildCompanyTimeline = (data = {}, timelines = {}) => {
  const events = []

  ;(data.vehicles || []).forEach((vehicle) => {
    events.push(
      timelineEvent(
        'Inventory',
        `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || `Vehicle ${vehicle.id || ''}`,
        `${vehicle.quantity || 0} unit${number(vehicle.quantity) === 1 ? '' : 's'} recorded in inventory`,
        vehicle.createdAt,
        vehicle.id,
        vehicle.lifecycleStatus || vehicle.status,
      ),
    )
  })
  eventList(timelines.vehicleEvents).forEach((event) => {
    events.push(
      timelineEvent(
        'Inventory',
        `Vehicle moved to ${event.status || 'a new lifecycle stage'}`,
        event.note || 'Inventory lifecycle updated',
        event.createdAt,
        event.recordId,
        event.status,
      ),
    )
  })
  ;(data.orders || []).forEach((order) => {
    events.push(
      timelineEvent(
        'Order',
        `Order ${order.orderNumber || order.id || ''} created`,
        order.customerName || order.vehicle || 'New order',
        order.createdAt || order.orderDate,
        order.id,
        order.status,
      ),
    )
  })
  eventList(timelines.orderTimelines).forEach((event) => {
    events.push(
      timelineEvent(
        'Order',
        `Order moved to ${event.status}`,
        event.note || 'Order workflow updated',
        event.createdAt,
        event.orderId || event.recordId,
        event.status,
      ),
    )
  })
  ;(data.shipments || []).forEach((shipment) => {
    events.push(
      timelineEvent(
        'Shipment',
        `Shipment ${shipment.shipmentId || shipment.id || ''} created`,
        shipment.destinationCountry || shipment.customerName || 'Shipment opened',
        shipment.createdAt,
        shipment.id,
        shipment.status,
      ),
    )
  })
  eventList(timelines.shipmentEvents).forEach((event) => {
    events.push(
      timelineEvent(
        'Shipment',
        `Shipment moved to ${event.status || event.eventType || 'a new stage'}`,
        event.note || event.description || 'Shipment workflow updated',
        event.createdAt || event.eventDate,
        event.shipmentId || event.recordId,
        event.status,
      ),
    )
  })
  ;(data.procurementRequests || []).forEach((request) => {
    events.push(
      timelineEvent(
        'Procurement',
        `Procurement ${request.procurementId || request.id || ''} requested`,
        `${request.vehicleBrand || ''} ${request.vehicleModel || ''}`.trim() || request.supplierName || 'Request opened',
        request.createdAt,
        request.id,
        request.status,
      ),
    )
  })
  eventList(timelines.procurementTimelines).forEach((event) => {
    events.push(
      timelineEvent(
        'Procurement',
        `Procurement moved to ${event.status}`,
        event.note || 'Procurement workflow updated',
        event.createdAt,
        event.procurementId || event.recordId,
        event.status,
      ),
    )
  })
  ;(data.financeRecords || []).forEach((record) => {
    events.push(
      timelineEvent(
        'Finance',
        record.paymentStatus === 'Paid' ? 'Payment completed' : 'Financial record updated',
        record.customerName || record.referenceNumber || 'Finance activity',
        record.updatedAt || record.createdAt,
        record.id,
        record.paymentStatus,
      ),
    )
  })
  ;(data.customers || []).forEach((customer) => {
    events.push(
      timelineEvent(
        'Customer',
        `Customer record: ${customer.name || customer.customerName || 'New customer'}`,
        customer.countryCity || customer.email || 'Customer milestone',
        customer.createdAt,
        customer.id,
      ),
    )
  })
  ;(data.documents || []).forEach((document) => {
    events.push(
      timelineEvent(
        'Document',
        document.title || document.name || 'Document added',
        document.category || document.documentType || 'Company document',
        document.createdAt,
        document.id,
      ),
    )
  })

  return events
    .filter((event) => toDate(event.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

const monthStarts = (start, end, maxPoints = 24) => {
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const result = []
  while (cursor <= end) {
    result.push(new Date(cursor))
    cursor.setMonth(cursor.getMonth() + 1)
  }
  if (result.length <= maxPoints) return result
  const step = Math.ceil(result.length / maxPoints)
  return result.filter((_, index) => index % step === 0 || index === result.length - 1)
}

export const buildHistoricalSeries = (data, timelines = {}, snapshots = [], options = {}) => {
  const allDates = buildCompanyTimeline(data, timelines).map((event) => toDate(event.date)).filter(Boolean)
  const snapshotDates = snapshots.map((snapshot) => toDate(snapshot.snapshotDate || snapshot.snapshot_date)).filter(Boolean)
  const fallback = new Date()
  fallback.setMonth(fallback.getMonth() - 11)
  const earliest = [...allDates, ...snapshotDates].sort((a, b) => a - b)[0] || fallback
  const end = endOfDay(options.endDate || new Date())
  const start = toDate(options.startDate) || earliest

  return monthStarts(start, end, options.maxPoints || 24).map((date) => {
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
    const reconstructed = reconstructCompanyState(data, monthEnd > end ? end : monthEnd, snapshots, timelines)
    return {
      date: toDateKey(monthEnd > end ? end : monthEnd),
      label: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      ...reconstructed.metrics,
    }
  })
}

export const explainHistoricalChanges = (current, baseline, timeline = []) => {
  const comparison = compareHistoricalStates(current, baseline)
  const start = toDate(baseline.targetDate)
  const end = endOfDay(current.targetDate)
  const relatedEvents = timeline
    .filter((event) => {
      const date = toDate(event.date)
      return date && (!start || date > start) && date <= end
    })
    .slice(0, 12)
  const recommendations = []

  if (comparison.profit.difference < 0) {
    recommendations.push({
      severity: 'High',
      title: 'Profit declined during this period',
      explanation: `Profit changed by ${comparison.profit.percent.toFixed(1)}%. Review order margin, freight, and procurement events in the replay window.`,
    })
  } else if (comparison.profit.difference > 0) {
    recommendations.push({
      severity: 'Positive',
      title: 'Profit improved',
      explanation: `Profit increased by ${comparison.profit.percent.toFixed(1)}%, supported by activity recorded in this period.`,
    })
  }
  if (comparison.inventoryUnits.difference < 0) {
    recommendations.push({
      severity: 'Medium',
      title: 'Inventory contracted',
      explanation: `${Math.abs(comparison.inventoryUnits.difference)} units left available inventory. Check completed orders and shipment milestones.`,
    })
  }
  if (comparison.activeShipments.difference > 0) {
    recommendations.push({
      severity: 'Medium',
      title: 'Shipment workload increased',
      explanation: `${comparison.activeShipments.difference} additional shipments were active at the selected date.`,
    })
  }
  if (comparison.customers.difference > 0) {
    recommendations.push({
      severity: 'Positive',
      title: 'Customer base expanded',
      explanation: `${comparison.customers.difference} customers were added during the comparison window.`,
    })
  }
  if (!recommendations.length) {
    recommendations.push({
      severity: 'Info',
      title: 'Company state remained stable',
      explanation: 'No material movement was detected in the headline operating indicators.',
    })
  }

  return { recommendations, relatedEvents }
}

export const buildTimeMachineAiContext = (data, timelines = {}, snapshots = []) => {
  const today = reconstructCompanyState(data, new Date(), snapshots, timelines)
  const priorDate = new Date()
  priorDate.setDate(priorDate.getDate() - 30)
  const prior = reconstructCompanyState(data, priorDate, snapshots, timelines)
  const timeline = buildCompanyTimeline(data, timelines)
  const replay = explainHistoricalChanges(today, prior, timeline)
  return {
    currentDate: today.targetDate,
    comparisonDate: prior.targetDate,
    metrics: today.metrics,
    changeOver30Days: compareHistoricalStates(today, prior),
    notableChanges: replay.recommendations,
    recentHistoricalEvents: replay.relatedEvents.slice(0, 8),
    dataQuality: today.confidence,
  }
}
