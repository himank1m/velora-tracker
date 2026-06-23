/**
 * Velora OS AI COO intelligence layer.
 *
 * All outputs are deterministic, evidence-backed recommendations. This service
 * never mutates operational records and never executes a recommendation.
 */

const DAY = 86400000
const TERMINAL_SHIPMENT = new Set(['Delivered', 'Cancelled'])
const TERMINAL_PROCUREMENT = new Set(['Received', 'Added To Inventory', 'Cancelled'])
const ACTIVE_ORDER = new Set(['Inquiry', 'Confirmed', 'Procurement', 'Inspection', 'Ready', 'Shipped'])

const number = (value) => Number(String(value ?? '').replace(/,/g, '')) || 0
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, number(value)))
const normalize = (value) => String(value ?? '').trim().toLowerCase()

const validDate = (value) => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

const recordDate = (record) =>
  validDate(
    record?.updatedAt ||
      record?.updated_at ||
      record?.createdAt ||
      record?.created_at ||
      record?.orderDate ||
      record?.order_date ||
      record?.date,
  )

const daysSince = (value, now = new Date()) => {
  const date = validDate(value)
  return date ? Math.max(0, (now - date) / DAY) : 0
}

const orderRevenue = (order) =>
  number(order.totalRevenue) || number(order.sellingPrice) * Math.max(1, number(order.quantity))

const orderProfit = (order) => {
  if (number(order.totalProfit)) return number(order.totalProfit)
  return (
    number(order.sellingPrice) - number(order.purchaseCost || order.purchasePrice)
  ) * Math.max(1, number(order.quantity))
}

const amountPending = (record) =>
  Math.max(
    0,
    number(record.amountPending) ||
      number(record.totalSaleAmount) - number(record.amountPaid),
  )

const procurementValue = (request) => {
  const quantity = Math.max(1, number(request.quantity))
  return (
    number(request.approvedPurchaseAmount) ||
    number(request.totalBuyPrice) ||
    number(request.estimatedPurchaseCost) * quantity
  ) + number(request.estimatedFreightCost)
}

const confidence = (evidenceCount, completeness = 1) => {
  const score = clamp(45 + Math.min(evidenceCount, 8) * 6 + completeness * 10)
  return {
    score: Math.round(score),
    label: score >= 80 ? 'High' : score >= 60 ? 'Medium' : 'Developing',
  }
}

const makeInsight = ({
  id,
  category,
  severity = 'Medium',
  title,
  explanation,
  why,
  dataUsed = [],
  expectedImpact,
  confidenceLevel,
  module = 'Command Center',
  recordId = '',
  impactScore = 50,
}) => ({
  id,
  category,
  severity,
  title,
  explanation,
  why: why || explanation,
  dataUsed,
  expectedImpact,
  confidence: confidenceLevel || confidence(dataUsed.length),
  module,
  recordId,
  impactScore: clamp(impactScore),
})

const groupBy = (records, keyGetter) => {
  const grouped = new Map()
  records.forEach((record) => {
    const key = keyGetter(record)
    if (!key) return
    grouped.set(key, [...(grouped.get(key) || []), record])
  })
  return grouped
}

const vehicleLabel = (vehicle) => `${vehicle.brand || ''} ${vehicle.model || ''}`.trim()

export function scoreCustomers(data = {}, now = new Date()) {
  const canViewFinancials = data.canViewFinancials !== false
  const ordersByCustomer = groupBy(data.orders || [], (order) => normalize(order.customerName))
  const financeByCustomer = groupBy(data.financeRecords || [], (record) =>
    normalize(record.customerName || record.customerId),
  )

  return (data.customers || [])
    .map((customer) => {
      const key = normalize(customer.name || customer.customerName)
      const orders = ordersByCustomer.get(key) || []
      const finance = financeByCustomer.get(key) || []
      const revenue = canViewFinancials ? orders.reduce((sum, order) => sum + orderRevenue(order), 0) : 0
      const profit = canViewFinancials ? orders.reduce((sum, order) => sum + orderProfit(order), 0) : 0
      const pending = canViewFinancials ? finance.reduce((sum, record) => sum + amountPending(record), 0) : 0
      const latestOrder = orders.map(recordDate).filter(Boolean).sort((a, b) => b - a)[0]
      const recency = latestOrder ? clamp(100 - daysSince(latestOrder, now) * 1.2) : 35
      const paymentReliability = number(customer.paymentReliabilityScore) || (pending ? 55 : 80)
      const ratingScore = { 'A+': 100, A: 90, B: 72, C: 52, Risk: 25 }[customer.customerRating] || 65
      const valueScore = canViewFinancials
        ? clamp(Math.log10(Math.max(1, revenue)) * 13)
        : clamp(orders.length * 18)
      const engagement = clamp(orders.length * 15 + recency * 0.45)
      const score = Math.round(
        valueScore * 0.28 +
          clamp(paymentReliability) * 0.26 +
          ratingScore * 0.16 +
          engagement * 0.3,
      )
      return {
        id: customer.id,
        name: customer.name || customer.customerName || 'Unnamed customer',
        score,
        revenue,
        profit,
        orders: orders.length,
        outstanding: pending,
        recencyDays: latestOrder ? Math.round(daysSince(latestOrder, now)) : null,
        risk: score < 45 || customer.customerRating === 'Risk' || pending > revenue * 0.35,
        confidence: confidence(orders.length + finance.length, customer.email && customer.phone ? 1 : 0.5),
      }
    })
    .sort((a, b) => b.score - a.score)
}

export function scoreSuppliers(data = {}, now = new Date()) {
  const requestsBySupplier = groupBy(data.procurementRequests || [], (request) => normalize(request.supplierName))
  return (data.suppliers || [])
    .map((supplier) => {
      const key = normalize(supplier.supplierName || supplier.name)
      const requests = requestsBySupplier.get(key) || []
      const delayed = requests.filter((request) =>
        request.status === 'Delayed' ||
        (!TERMINAL_PROCUREMENT.has(request.status) && daysSince(request.createdAt, now) > 21),
      )
      const completed = requests.filter((request) =>
        ['Received', 'Added To Inventory'].includes(request.status),
      )
      const totalValue = requests.reduce((sum, request) => sum + procurementValue(request), 0)
      const latest = requests.map(recordDate).filter(Boolean).sort((a, b) => b - a)[0]
      const reliability = requests.length ? (completed.length / requests.length) * 100 : 65
      const delayPenalty = requests.length ? (delayed.length / requests.length) * 55 : 0
      const activity = latest ? clamp(100 - daysSince(latest, now)) : 35
      const score = Math.round(clamp(reliability * 0.6 + activity * 0.3 + 10 - delayPenalty))
      return {
        id: supplier.id,
        name: supplier.supplierName || supplier.name || 'Unnamed supplier',
        score,
        requests: requests.length,
        completed: completed.length,
        delayed: delayed.length,
        totalValue,
        inactiveDays: latest ? Math.round(daysSince(latest, now)) : null,
        risk: score < 45 || delayed.length > 1,
        confidence: confidence(requests.length, supplier.email || supplier.phone ? 1 : 0.5),
      }
    })
    .sort((a, b) => b.score - a.score)
}

export function scoreShipments(data = {}, now = new Date()) {
  return (data.shipments || [])
    .map((shipment) => {
      const eta = validDate(shipment.eta)
      const delayed =
        shipment.status === 'Delayed' ||
        (!TERMINAL_SHIPMENT.has(shipment.status) && eta && eta < now)
      const delivered = shipment.status === 'Delivered'
      const dataCompleteness = [
        shipment.destinationCountry,
        shipment.shippingCompany,
        shipment.eta,
        shipment.customerName,
      ].filter(Boolean).length / 4
      const statusScore = delivered ? 100 : delayed ? 25 : TERMINAL_SHIPMENT.has(shipment.status) ? 45 : 72
      const etaScore = eta && !delayed ? clamp(75 + Math.min(20, (eta - now) / DAY)) : delayed ? 20 : 55
      const score = Math.round(statusScore * 0.6 + etaScore * 0.25 + dataCompleteness * 15)
      return {
        id: shipment.id,
        name: shipment.shipmentId || shipment.id || 'Shipment',
        score,
        status: shipment.status,
        customer: shipment.customerName,
        destination: shipment.destinationCountry,
        delayed,
        eta: shipment.eta,
        freightCost: number(shipment.freightCost),
        confidence: confidence(dataCompleteness * 4, dataCompleteness),
      }
    })
    .sort((a, b) => a.score - b.score)
}

export function scoreProcurement(data = {}, now = new Date()) {
  return (data.procurementRequests || [])
    .map((request) => {
      const age = daysSince(request.createdAt, now)
      const delayed = request.status === 'Delayed' || (!TERMINAL_PROCUREMENT.has(request.status) && age > 21)
      const progress = {
        Draft: 10,
        Requested: 15,
        'Supplier Identified': 28,
        Negotiation: 38,
        'Pending Approval': 45,
        Approved: 55,
        Ordered: 68,
        Purchased: 70,
        'In Transit': 80,
        Arrived: 92,
        Received: 100,
        'Added To Inventory': 100,
        Delayed: 25,
        Cancelled: 0,
      }[request.status] ?? 50
      const agePenalty = TERMINAL_PROCUREMENT.has(request.status) ? 0 : Math.max(0, age - 10) * 1.3
      const supplierBonus = request.supplierName ? 8 : 0
      const score = Math.round(clamp(progress + supplierBonus - agePenalty))
      return {
        id: request.id,
        name: request.procurementId || request.id || 'Procurement',
        vehicle: `${request.vehicleBrand || ''} ${request.vehicleModel || ''}`.trim(),
        score,
        status: request.status,
        ageDays: Math.round(age),
        delayed,
        value: procurementValue(request),
        supplier: request.supplierName,
        confidence: confidence([request.supplierName, request.status, request.createdAt].filter(Boolean).length),
      }
    })
    .sort((a, b) => a.score - b.score)
}

export function scoreInventory(data = {}) {
  const canViewFinancials = data.canViewFinancials !== false
  const ordersByVehicle = groupBy(data.orders || [], (order) => normalize(order.vehicle))
  return (data.vehicles || [])
    .map((vehicle) => {
      const label = vehicleLabel(vehicle)
      const orders = ordersByVehicle.get(normalize(label)) || []
      const quantity = number(vehicle.quantity)
      const selling = number(vehicle.sellingPrice)
      const purchase = number(vehicle.purchasePrice)
      const margin = canViewFinancials && selling ? ((selling - purchase) / selling) * 100 : 0
      const velocity = orders.reduce((sum, order) => sum + Math.max(1, number(order.quantity)), 0)
      const coverage = velocity ? quantity / Math.max(1, velocity / 6) : quantity
      const availability = quantity === 0 ? 10 : quantity <= 2 ? 35 : clamp(55 + quantity * 4)
      const marginScore = canViewFinancials ? clamp(margin * 3.5) : 60
      const demandScore = clamp(velocity * 12)
      const score = Math.round(availability * 0.4 + marginScore * 0.3 + demandScore * 0.3)
      return {
        id: vehicle.id,
        name: label || vehicle.id || 'Vehicle',
        score,
        quantity,
        margin,
        salesUnits: velocity,
        coverageMonths: coverage,
        shortageRisk: quantity <= Math.max(1, velocity / 6),
        fastMoving: velocity >= 3,
        confidence: confidence(orders.length + 2),
      }
    })
    .sort((a, b) => a.score - b.score)
}

export function detectOperationalRisks(data = {}, scores = {}, now = new Date()) {
  const risks = []

  ;(scores.shipments || []).filter((item) => item.delayed).forEach((shipment) => {
    risks.push(makeInsight({
      id: `shipment-delay-${shipment.id}`,
      category: 'Risk',
      severity: shipment.score < 25 ? 'Critical' : 'High',
      title: `${shipment.name} requires delay intervention`,
      explanation: `${shipment.destination || 'The destination'} shipment is ${shipment.status || 'past ETA'}.`,
      why: 'Delivery delays can trigger customer dissatisfaction, storage charges, and revenue collection delays.',
      dataUsed: [`Status: ${shipment.status}`, shipment.eta ? `ETA: ${shipment.eta}` : 'ETA missing', shipment.customer ? `Customer: ${shipment.customer}` : 'Customer missing'],
      expectedImpact: 'Escalation can protect delivery performance and customer confidence.',
      confidenceLevel: shipment.confidence,
      module: 'Shipments',
      recordId: shipment.id,
      impactScore: 90,
    }))
  })

  ;(scores.procurement || []).filter((item) => item.delayed || item.score < 35).forEach((request) => {
    risks.push(makeInsight({
      id: `procurement-delay-${request.id}`,
      category: 'Risk',
      severity: request.ageDays > 30 ? 'Critical' : 'High',
      title: `${request.name} is a procurement bottleneck`,
      explanation: `${request.vehicle || 'Vehicle acquisition'} has remained ${request.status} for ${request.ageDays} days.`,
      why: 'Slow acquisition can create inventory shortages and delay linked customer orders.',
      dataUsed: [`Status: ${request.status}`, `Age: ${request.ageDays} days`, request.supplier ? `Supplier: ${request.supplier}` : 'Supplier missing'],
      expectedImpact: 'Resolving the bottleneck improves incoming inventory reliability.',
      confidenceLevel: request.confidence,
      module: 'Procurement',
      recordId: request.id,
      impactScore: 86,
    }))
  })

  ;(data.financeRecords || []).filter((record) => amountPending(record) > 0).forEach((record) => {
    const pending = amountPending(record)
    const overdue = record.paymentStatus === 'Overdue'
    risks.push(makeInsight({
      id: `payment-${record.id}`,
      category: 'Risk',
      severity: overdue ? 'Critical' : pending > 1000000 ? 'High' : 'Medium',
      title: overdue ? 'Overdue payment requires follow-up' : 'Outstanding payment needs monitoring',
      explanation: `${pending.toLocaleString('en-IN')} remains uncollected${record.customerName ? ` from ${record.customerName}` : ''}.`,
      why: 'Uncollected revenue weakens working capital available for procurement and logistics.',
      dataUsed: [`Pending: ${pending}`, `Payment status: ${record.paymentStatus || 'Unknown'}`, `Finance record: ${record.id}`],
      expectedImpact: 'A timely follow-up may improve cash conversion and reduce credit exposure.',
      confidenceLevel: confidence(3),
      module: 'Finance',
      recordId: record.id,
      impactScore: overdue ? 94 : 72,
    }))
  })

  ;(scores.customers || []).filter((customer) => customer.risk).forEach((customer) => {
    risks.push(makeInsight({
      id: `customer-risk-${customer.id}`,
      category: 'Risk',
      severity: customer.score < 35 ? 'High' : 'Medium',
      title: `${customer.name} shows customer risk`,
      explanation: `Customer operating score is ${customer.score}/100 with ${customer.outstanding.toLocaleString('en-IN')} outstanding.`,
      why: 'Low payment reliability or weak engagement can increase collection and retention risk.',
      dataUsed: [`Customer score: ${customer.score}`, `Orders: ${customer.orders}`, `Outstanding: ${customer.outstanding}`],
      expectedImpact: 'Account review can protect revenue quality before further credit or allocation.',
      confidenceLevel: customer.confidence,
      module: 'Customers',
      recordId: customer.id,
      impactScore: 70,
    }))
  })

  ;(scores.suppliers || []).filter((supplier) => supplier.risk).forEach((supplier) => {
    risks.push(makeInsight({
      id: `supplier-risk-${supplier.id}`,
      category: 'Risk',
      severity: supplier.score < 35 ? 'High' : 'Medium',
      title: `${supplier.name} needs supplier review`,
      explanation: `Supplier score is ${supplier.score}/100 with ${supplier.delayed} delayed procurement records.`,
      why: 'Supplier reliability directly affects procurement lead time, stock availability, and order fulfilment.',
      dataUsed: [`Supplier score: ${supplier.score}`, `Requests: ${supplier.requests}`, `Delayed: ${supplier.delayed}`],
      expectedImpact: 'Reviewing terms or alternatives can reduce supply interruption exposure.',
      confidenceLevel: supplier.confidence,
      module: 'Procurement',
      recordId: supplier.id,
      impactScore: 75,
    }))
  })

  ;(scores.inventory || []).filter((vehicle) => vehicle.shortageRisk).forEach((vehicle) => {
    risks.push(makeInsight({
      id: `inventory-shortage-${vehicle.id}`,
      category: 'Risk',
      severity: vehicle.quantity === 0 ? 'Critical' : 'High',
      title: `${vehicle.name} may run short`,
      explanation: `${vehicle.quantity} units remain against ${vehicle.salesUnits} observed sales units.`,
      why: 'Stock below recent demand can block order conversion and force expensive urgent procurement.',
      dataUsed: data.canViewFinancials === false
        ? [`Quantity: ${vehicle.quantity}`, `Observed sales units: ${vehicle.salesUnits}`]
        : [`Quantity: ${vehicle.quantity}`, `Observed sales units: ${vehicle.salesUnits}`, `Margin: ${vehicle.margin.toFixed(1)}%`],
      expectedImpact: 'A targeted reorder can preserve sales continuity without broadly increasing inventory.',
      confidenceLevel: vehicle.confidence,
      module: 'Inventory',
      recordId: vehicle.id,
      impactScore: 88,
    }))
  })

  return risks.sort((a, b) => b.impactScore - a.impactScore)
}

export function discoverOpportunities(data = {}, scores = {}, now = new Date()) {
  const opportunities = []

  ;(scores.customers || []).filter((customer) =>
    customer.orders >= 2 && customer.recencyDays !== null && customer.recencyDays <= 120 && !customer.risk,
  ).slice(0, 6).forEach((customer) => {
    opportunities.push(makeInsight({
      id: `reorder-${customer.id}`,
      category: 'Opportunity',
      severity: 'Positive',
      title: `${customer.name} is a likely reorder candidate`,
      explanation: `${customer.orders} orders and recent activity ${customer.recencyDays} days ago indicate repeat demand.`,
      why: 'Repeat customers typically require less acquisition effort and convert faster than cold prospects.',
      dataUsed: data.canViewFinancials === false
        ? [`Orders: ${customer.orders}`, `Customer score: ${customer.score}`, `Last order: ${customer.recencyDays} days ago`]
        : [`Orders: ${customer.orders}`, `Revenue: ${customer.revenue}`, `Last order: ${customer.recencyDays} days ago`],
      expectedImpact: 'A targeted account conversation could create near-term repeat revenue.',
      confidenceLevel: customer.confidence,
      module: 'Customers',
      recordId: customer.id,
      impactScore: clamp(55 + customer.orders * 8 + customer.score * 0.2),
    }))
  })

  ;(scores.inventory || []).filter((vehicle) =>
    vehicle.fastMoving && (data.canViewFinancials === false || vehicle.margin >= 10),
  ).slice(0, 6).forEach((vehicle) => {
    opportunities.push(makeInsight({
      id: `fast-moving-${vehicle.id}`,
      category: 'Opportunity',
      severity: 'Positive',
      title: data.canViewFinancials === false
        ? `${vehicle.name} is fast-moving`
        : `${vehicle.name} combines demand and margin`,
      explanation: data.canViewFinancials === false
        ? `${vehicle.salesUnits} observed sales units indicate strong inventory movement.`
        : `${vehicle.salesUnits} observed sales units with a ${vehicle.margin.toFixed(1)}% margin.`,
      why: data.canViewFinancials === false
        ? 'Fast-moving vehicles are candidates for focused replenishment and sales planning.'
        : 'Fast-moving, profitable vehicles are strong candidates for focused procurement and sales campaigns.',
      dataUsed: data.canViewFinancials === false
        ? [`Sales units: ${vehicle.salesUnits}`, `Stock: ${vehicle.quantity}`]
        : [`Sales units: ${vehicle.salesUnits}`, `Margin: ${vehicle.margin.toFixed(1)}%`, `Stock: ${vehicle.quantity}`],
      expectedImpact: 'Focused availability can increase profitable sales without diluting the wider inventory mix.',
      confidenceLevel: vehicle.confidence,
      module: 'Inventory',
      recordId: vehicle.id,
      impactScore: clamp(60 + vehicle.margin + vehicle.salesUnits * 3),
    }))
  })

  ;(scores.suppliers || []).filter((supplier) => supplier.score >= 75 && supplier.requests >= 2).slice(0, 4).forEach((supplier) => {
    opportunities.push(makeInsight({
      id: `supplier-opportunity-${supplier.id}`,
      category: 'Opportunity',
      severity: 'Positive',
      title: `${supplier.name} is a strong supplier candidate`,
      explanation: `Supplier score is ${supplier.score}/100 across ${supplier.requests} procurement records.`,
      why: 'Reliable suppliers may support better allocation, pricing negotiations, or expanded sourcing volume.',
      dataUsed: [`Supplier score: ${supplier.score}`, `Completed: ${supplier.completed}`, `Delayed: ${supplier.delayed}`],
      expectedImpact: 'Consolidating suitable volume may improve procurement reliability and commercial terms.',
      confidenceLevel: supplier.confidence,
      module: 'Procurement',
      recordId: supplier.id,
      impactScore: clamp(55 + supplier.score * 0.4),
    }))
  })

  const customerGrowth = (scores.customers || [])
    .filter((customer) => !customer.risk && customer.recencyDays !== null && customer.recencyDays <= 90)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)
  customerGrowth.forEach((customer) => {
    opportunities.push(makeInsight({
      id: `growth-customer-${customer.id}`,
      category: 'Opportunity',
      severity: 'Positive',
      title: `${customer.name} is an emerging high-value account`,
      explanation: data.canViewFinancials === false
        ? `Recent engagement and ${customer.orders} recorded orders indicate an important active account.`
        : `Recent engagement supports ${customer.revenue.toLocaleString('en-IN')} in recorded revenue.`,
      why: 'High-value customers with recent activity can respond well to proactive allocation and relationship planning.',
      dataUsed: data.canViewFinancials === false
        ? [`Orders: ${customer.orders}`, `Customer score: ${customer.score}`, `Last activity: ${customer.recencyDays} days ago`]
        : [`Revenue: ${customer.revenue}`, `Profit: ${customer.profit}`, `Customer score: ${customer.score}`],
      expectedImpact: 'Executive account attention can improve retention and share of wallet.',
      confidenceLevel: customer.confidence,
      module: 'Customers',
      recordId: customer.id,
      impactScore: clamp(60 + customer.score * 0.35),
    }))
  })

  return opportunities
    .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((a, b) => b.impactScore - a.impactScore)
}

export function buildCooRecommendations(risks = [], opportunities = []) {
  const recommendations = [
    ...risks.slice(0, 8).map((risk) => ({
      ...risk,
      category: 'Recommendation',
      title: risk.module === 'Inventory'
        ? `Reorder or reallocate: ${risk.title.replace(' may run short', '')}`
        : risk.module === 'Finance'
          ? 'Follow up the highest-priority outstanding payment'
          : risk.module === 'Shipments'
            ? 'Investigate the delayed shipment'
            : risk.module === 'Procurement'
              ? 'Resolve the procurement or supplier bottleneck'
              : `Review ${risk.title}`,
    })),
    ...opportunities.slice(0, 6).map((opportunity) => ({
      ...opportunity,
      category: 'Recommendation',
      title: opportunity.module === 'Customers'
        ? `Contact ${opportunity.title.split(' is ')[0]}`
        : opportunity.module === 'Inventory'
          ? `Prioritize ${opportunity.title.split(' combines ')[0]}`
          : `Evaluate ${opportunity.title}`,
    })),
  ]
  return recommendations
    .sort((a, b) => b.impactScore - a.impactScore)
    .filter((item, index, rows) =>
      rows.findIndex((candidate) =>
        candidate.title === item.title &&
        candidate.module === item.module &&
        candidate.recordId === item.recordId,
      ) === index)
}

export function generateCooTasks(recommendations = []) {
  return recommendations.slice(0, 12).map((recommendation, index) => ({
    sourceKey: recommendation.id,
    title: recommendation.title,
    description: recommendation.explanation,
    reason: recommendation.why,
    priority:
      recommendation.severity === 'Critical' || recommendation.impactScore >= 90
        ? 'Immediate'
        : recommendation.severity === 'High' || recommendation.impactScore >= 75
          ? 'High'
          : 'Planned',
    module: recommendation.module,
    linkedRecordId: recommendation.recordId || '',
    expectedImpact: recommendation.expectedImpact,
    confidence: recommendation.confidence,
    status: 'Open',
    rank: index + 1,
  }))
}

export function buildExecutiveBriefing(data = {}, intelligence = {}) {
  const orders = data.orders || []
  const shipments = data.shipments || []
  const procurements = data.procurementRequests || []
  const customers = data.customers || []
  const revenue = data.canViewFinancials === false ? 0 : orders.reduce((sum, order) => sum + orderRevenue(order), 0)
  const profit = data.canViewFinancials === false ? 0 : orders.reduce((sum, order) => sum + orderProfit(order), 0)
  const activeOrders = orders.filter((order) => ACTIVE_ORDER.has(order.status)).length
  const activeShipments = shipments.filter((shipment) => !TERMINAL_SHIPMENT.has(shipment.status)).length
  const activeProcurements = procurements.filter((request) => !TERMINAL_PROCUREMENT.has(request.status)).length

  return {
    generatedAt: new Date().toISOString(),
    headline:
      intelligence.risks?.length
        ? `${intelligence.risks.length} operating risks and ${intelligence.opportunities?.length || 0} opportunities require management review.`
        : `Operations are stable with ${intelligence.opportunities?.length || 0} identified growth opportunities.`,
    sections: [
      { key: 'revenue', label: 'Revenue', value: revenue, summary: `${orders.length} total orders; ${activeOrders} currently active.` },
      { key: 'profit', label: 'Profit', value: profit, summary: `${revenue ? ((profit / revenue) * 100).toFixed(1) : '0.0'}% recorded order margin.` },
      { key: 'shipments', label: 'Shipments', value: activeShipments, summary: `${intelligence.scores?.shipments?.filter((item) => item.delayed).length || 0} delayed or overdue shipments.` },
      { key: 'procurement', label: 'Procurement', value: activeProcurements, summary: `${intelligence.scores?.procurement?.filter((item) => item.delayed).length || 0} acquisition bottlenecks.` },
      { key: 'customers', label: 'Customers', value: customers.length, summary: `${intelligence.scores?.customers?.filter((item) => item.risk).length || 0} customer accounts flagged for review.` },
    ],
    topRisks: (intelligence.risks || []).slice(0, 5),
    topOpportunities: (intelligence.opportunities || []).slice(0, 5),
    dailyPriorities: (intelligence.tasks || []).slice(0, 6),
  }
}

export function buildAiCooIntelligence(data = {}) {
  const scores = {
    customers: scoreCustomers(data),
    suppliers: scoreSuppliers(data),
    shipments: scoreShipments(data),
    procurement: scoreProcurement(data),
    inventory: scoreInventory(data),
  }
  const risks = detectOperationalRisks(data, scores)
  const opportunities = discoverOpportunities(data, scores)
  const recommendations = buildCooRecommendations(risks, opportunities)
  const tasks = generateCooTasks(recommendations)
  const base = { scores, risks, opportunities, recommendations, tasks }
  const briefing = buildExecutiveBriefing(data, base)
  const criticalIssues = risks.filter((risk) => ['Critical', 'High'].includes(risk.severity))
  const keyFindings = [
    risks[0],
    opportunities[0],
    recommendations.find((item) => item.module === 'Procurement'),
    recommendations.find((item) => item.module === 'Customers'),
  ].filter(Boolean)

  return {
    ...base,
    briefing,
    criticalIssues,
    dailyPriorities: tasks.slice(0, 6),
    insights: {
      keyFindings,
      emergingRisks: risks.slice(0, 5),
      emergingOpportunities: opportunities.slice(0, 5),
      strategicObservations: recommendations.slice(0, 5),
    },
    generatedAt: new Date().toISOString(),
    policy: 'Recommendations only. No operational action is executed automatically.',
  }
}

export function buildAiCooContext(data = {}) {
  const intelligence = buildAiCooIntelligence(data)
  const compactScores = Object.fromEntries(
    Object.entries(intelligence.scores).map(([key, rows]) => [
      key,
      rows.slice(0, 8).map(({ id, name, score, risk, delayed, quantity, margin, orders, outstanding }) => ({
        id,
        name,
        score,
        risk,
        delayed,
        quantity,
        margin,
        orders,
        outstanding,
      })),
    ]),
  )
  return {
    executiveBriefing: intelligence.briefing,
    criticalIssues: intelligence.criticalIssues.slice(0, 8),
    opportunities: intelligence.opportunities.slice(0, 8),
    recommendations: intelligence.recommendations.slice(0, 10),
    dailyPriorities: intelligence.dailyPriorities,
    performanceScores: compactScores,
    policy: intelligence.policy,
  }
}
