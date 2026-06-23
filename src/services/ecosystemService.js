const number = (value) => Number(String(value ?? '').replace(/,/g, '')) || 0
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, number(value)))
const normalize = (value) => String(value ?? '').trim().toLowerCase()

const orderRevenue = (order) =>
  number(order.totalRevenue) || number(order.sellingPrice) * Math.max(1, number(order.quantity))

const orderProfit = (order) => {
  if (number(order.totalProfit)) return number(order.totalProfit)
  return (
    number(order.sellingPrice) - number(order.purchaseCost || order.purchasePrice)
  ) * Math.max(1, number(order.quantity))
}

const companyMetric = (company, transactions, currentCompanyId, operational) => {
  const incoming = transactions.filter((item) => item.targetCompanyId === company.id)
  const outgoing = transactions.filter((item) => item.sourceCompanyId === company.id)
  const transactionRevenue = incoming.reduce((sum, item) => sum + number(item.amount), 0)
  const transactionProfit = [...incoming, ...outgoing].reduce((sum, item) => sum + number(item.profit), 0)
  const isCurrent = company.id === currentCompanyId
  const operatingRevenue = isCurrent ? (operational.orders || []).reduce((sum, item) => sum + orderRevenue(item), 0) : 0
  const operatingProfit = isCurrent ? (operational.orders || []).reduce((sum, item) => sum + orderProfit(item), 0) : 0
  const activeTransactions = [...incoming, ...outgoing].filter((item) => !['Completed', 'Cancelled'].includes(item.status)).length
  const revenue = transactionRevenue + operatingRevenue
  const profit = transactionProfit + operatingProfit
  const profitability = revenue ? clamp(50 + (profit / revenue) * 220) : 60
  const activity = clamp(55 + Math.min(35, (incoming.length + outgoing.length) * 5))
  const relationshipCoverage = clamp(50 + Math.min(40, activeTransactions * 8))
  const healthScore = Math.round(profitability * .5 + activity * .3 + relationshipCoverage * .2)
  return {
    ...company,
    revenue,
    profit,
    activeTransactions,
    healthScore,
  }
}

export function calculateRelationshipScore(relationship, transactions = []) {
  const related = transactions.filter((transaction) =>
    transaction.relationshipId === relationship.id ||
    (
      transaction.sourceCompanyId === relationship.sourceCompanyId &&
      transaction.targetCompanyId === relationship.targetCompanyId
    ),
  )
  const completed = related.filter((item) => item.status === 'Completed').length
  const disputed = related.filter((item) => ['Delayed', 'Disputed', 'Cancelled'].includes(item.status)).length
  const value = related.reduce((sum, item) => sum + number(item.amount), 0)
  const activityScore = clamp(45 + related.length * 7)
  const reliability = related.length ? clamp((completed / related.length) * 100 - disputed * 12) : 65
  const valueScore = clamp(Math.log10(Math.max(1, value)) * 13)
  return Math.round(activityScore * .35 + reliability * .4 + valueScore * .25)
}

export function buildEcosystemTimeline({ events = [], transactions = [], relationships = [], companies = [] }) {
  const companyName = (id) => companies.find((company) => company.id === id)?.name || 'External company'
  return [
    ...events.map((event) => ({
      id: `event-${event.id}`,
      type: event.eventType || 'Company',
      title: event.title,
      detail: event.description || companyName(event.companyId),
      date: event.occurredAt || event.createdAt,
      companyId: event.companyId,
    })),
    ...transactions.map((transaction) => ({
      id: `transaction-${transaction.id}`,
      type: transaction.transactionType || 'Transaction',
      title: `${companyName(transaction.sourceCompanyId)} to ${companyName(transaction.targetCompanyId)}`,
      detail: `${transaction.status} - ${transaction.transactionNumber || 'Inter-company activity'}`,
      date: transaction.transactionDate || transaction.createdAt,
      companyId: transaction.sourceCompanyId,
    })),
    ...relationships.map((relationship) => ({
      id: `relationship-${relationship.id}`,
      type: 'Partnership',
      title: `${relationship.relationshipType} relationship established`,
      detail: relationship.externalName || companyName(relationship.targetCompanyId),
      date: relationship.startedAt || relationship.createdAt,
      companyId: relationship.sourceCompanyId,
    })),
  ]
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function buildEcosystemNetwork({
  companies = [],
  relationships = [],
  customers = [],
  suppliers = [],
  logisticsPartners = [],
  currentCompanyId,
}) {
  const nodes = companies.map((company, index) => ({
    id: `company:${company.id}`,
    entityId: company.id,
    type: 'Company',
    label: company.name,
    meta: company.industry || company.country,
    x: 130 + (index % 4) * 190,
    y: 80 + Math.floor(index / 4) * 160,
    record: company,
  }))
  const edges = []
  const addExternal = (type, records, nameGetter, limit = 10) => {
    records.slice(0, limit).forEach((record, index) => {
      const entityId = record.id || nameGetter(record)
      const id = `${type.toLowerCase()}:${entityId}`
      nodes.push({
        id,
        entityId,
        type,
        label: nameGetter(record),
        meta: record.country || record.location || record.serviceType || '',
        x: 90 + (index % 5) * 155,
        y: 400 + Math.floor(index / 5) * 120 + ({ Supplier: 0, Customer: 35, Logistics: 70 }[type] || 0),
        record,
      })
      edges.push({
        id: `edge-${currentCompanyId}-${id}`,
        source: `company:${currentCompanyId}`,
        target: id,
        relationship: type,
      })
    })
  }

  relationships.forEach((relationship) => {
    const source = `company:${relationship.sourceCompanyId}`
    let target = relationship.targetCompanyId ? `company:${relationship.targetCompanyId}` : ''
    if (!target && relationship.externalName) {
      target = `external:${relationship.id}`
      nodes.push({
        id: target,
        entityId: relationship.id,
        type: relationship.relationshipType || 'Partner',
        label: relationship.externalName,
        meta: relationship.status,
        x: 110 + (nodes.length % 5) * 155,
        y: 310 + Math.floor(nodes.length / 5) * 90,
        record: relationship,
      })
    }
    if (nodes.some((node) => node.id === source) && nodes.some((node) => node.id === target)) {
      edges.push({
        id: `relationship:${relationship.id}`,
        source,
        target,
        relationship: relationship.relationshipType,
        score: relationship.score,
      })
    }
  })

  addExternal('Supplier', suppliers, (item) => item.supplierName || item.name || 'Supplier')
  addExternal('Customer', customers, (item) => item.name || item.customerName || 'Customer')
  addExternal('Logistics', logisticsPartners, (item) => item.partnerName || item.name || 'Logistics partner')
  return { nodes, edges }
}

export function buildEcosystemIntelligence({
  companies = [],
  relationships = [],
  transactions = [],
  events = [],
  currentCompanyId,
  operational = {},
}) {
  const scoredRelationships = relationships
    .map((relationship) => ({
      ...relationship,
      score: relationship.score || calculateRelationshipScore(relationship, transactions),
      value: transactions
        .filter((item) =>
          item.relationshipId === relationship.id ||
          (
            item.sourceCompanyId === relationship.sourceCompanyId &&
            item.targetCompanyId === relationship.targetCompanyId
          ),
        )
        .reduce((sum, item) => sum + number(item.amount), 0),
    }))
    .sort((a, b) => b.score - a.score)
  const companyMetrics = companies
    .map((company) => companyMetric(company, transactions, currentCompanyId, operational))
    .sort((a, b) => b.revenue - a.revenue)
  const revenue = companyMetrics.reduce((sum, company) => sum + company.revenue, 0)
  const profit = companyMetrics.reduce((sum, company) => sum + company.profit, 0)
  const activeCompanies = companies.filter((company) => company.status === 'Active').length
  const activeRelationships = relationships.filter((relationship) => relationship.status === 'Active').length
  const relationshipHealth = scoredRelationships.length
    ? scoredRelationships.reduce((sum, item) => sum + item.score, 0) / scoredRelationships.length
    : 70
  const companyHealth = companyMetrics.length
    ? companyMetrics.reduce((sum, item) => sum + item.healthScore, 0) / companyMetrics.length
    : 70
  const ecosystemHealth = Math.round(companyHealth * .6 + relationshipHealth * .4)
  const risks = [
    ...companyMetrics
      .filter((company) => company.healthScore < 50)
      .map((company) => ({
        id: `company-risk-${company.id}`,
        severity: company.healthScore < 35 ? 'Critical' : 'High',
        title: `${company.name} is underperforming`,
        explanation: `Company health is ${company.healthScore}/100.`,
        companyId: company.id,
      })),
    ...scoredRelationships
      .filter((relationship) => relationship.score < 45)
      .map((relationship) => ({
        id: `relationship-risk-${relationship.id}`,
        severity: relationship.score < 30 ? 'Critical' : 'High',
        title: `${relationship.externalName || relationship.relationshipType} relationship needs review`,
        explanation: `Relationship score is ${relationship.score}/100.`,
        relationshipId: relationship.id,
      })),
  ]
  const opportunities = scoredRelationships
    .filter((relationship) => relationship.score >= 75)
    .slice(0, 6)
    .map((relationship) => ({
      id: `relationship-opportunity-${relationship.id}`,
      title: `Expand ${relationship.externalName || relationship.relationshipType} collaboration`,
      explanation: `Relationship score is ${relationship.score}/100 with ${relationship.value.toLocaleString('en-IN')} in tracked value.`,
      relationshipId: relationship.id,
    }))

  return {
    metrics: {
      revenue,
      profit,
      activeCompanies,
      activeRelationships,
      ecosystemHealth,
    },
    companies: companyMetrics,
    relationships: scoredRelationships,
    timeline: buildEcosystemTimeline({ events, transactions, relationships, companies }),
    risks,
    opportunities,
    topCompany: companyMetrics[0] || null,
    topRelationship: scoredRelationships[0] || null,
  }
}

export function buildEcosystemAiContext(input) {
  const intelligence = buildEcosystemIntelligence(input)
  return {
    metrics: intelligence.metrics,
    companyPerformance: intelligence.companies.slice(0, 10).map(({ id, name, industry, country, revenue, profit, healthScore }) => ({
      id,
      name,
      industry,
      country,
      revenue,
      profit,
      healthScore,
    })),
    criticalRelationships: intelligence.relationships.slice(0, 10).map(({ id, relationshipType, externalName, score, value, status }) => ({
      id,
      relationshipType,
      externalName,
      score,
      value,
      status,
    })),
    risks: intelligence.risks.slice(0, 8),
    opportunities: intelligence.opportunities.slice(0, 8),
    recentActivity: intelligence.timeline.slice(0, 12),
  }
}
