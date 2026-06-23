/**
 * Velora OS deterministic strategic simulation engine.
 *
 * The engine is intentionally pure: it reads a permission-scoped company
 * state and returns projections without writing to operational records.
 *
 * @typedef {Object} StrategicAssumptions
 * @property {number} salesGrowthPct
 * @property {number} procurementChangePct
 * @property {number} freightCostChangePct
 * @property {number} shipmentVolumeChangePct
 * @property {number} delayRateChangePct
 * @property {number} customerGrowthPct
 * @property {number} paymentIssuePct
 * @property {number} supplierFailurePct
 * @property {number} inventoryBufferPct
 * @property {number} newMarketRevenuePct
 * @property {number} newSupplierSavingsPct
 * @property {number} logisticsEfficiencyPct
 * @property {number} newVehicleCategoryGrowthPct
 *
 * @typedef {Object} StrategicScenario
 * @property {string|null} id
 * @property {string} name
 * @property {string} description
 * @property {'Monthly'|'Quarterly'|'Annual'} horizon
 * @property {StrategicAssumptions} assumptions
 */

export const DEFAULT_SCENARIO_ASSUMPTIONS = Object.freeze({
  salesGrowthPct: 10,
  procurementChangePct: 10,
  freightCostChangePct: 0,
  shipmentVolumeChangePct: 10,
  delayRateChangePct: 0,
  customerGrowthPct: 5,
  paymentIssuePct: 0,
  supplierFailurePct: 0,
  inventoryBufferPct: 15,
  newMarketRevenuePct: 0,
  newSupplierSavingsPct: 0,
  logisticsEfficiencyPct: 0,
  newVehicleCategoryGrowthPct: 0,
})

export const SIMULATION_HORIZONS = Object.freeze({
  Monthly: { periods: 12, monthsPerPeriod: 1, label: 'month' },
  Quarterly: { periods: 8, monthsPerPeriod: 3, label: 'quarter' },
  Annual: { periods: 5, monthsPerPeriod: 12, label: 'year' },
})

const number = (value) => Number(String(value ?? '').replace(/,/g, '')) || 0
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, number(value)))
const ratio = (value) => number(value) / 100

const validDate = (value) => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

const recordDate = (record) =>
  validDate(record?.createdAt || record?.created_at || record?.orderDate || record?.order_date || record?.date)

const recentRecords = (records, months = 12) => {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  const dated = (records || []).filter((record) => recordDate(record))
  if (!dated.length) return records || []
  return dated.filter((record) => recordDate(record) >= cutoff)
}

const average = (values) => {
  const clean = values.map(number).filter((value) => Number.isFinite(value))
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0
}

const sum = (records, getter) => (records || []).reduce((total, record) => total + number(getter(record)), 0)

const orderRevenue = (order) =>
  number(order.totalRevenue) || number(order.sellingPrice) * Math.max(1, number(order.quantity))

const orderProfit = (order) => {
  if (number(order.totalProfit)) return number(order.totalProfit)
  return (
    number(order.sellingPrice) - number(order.purchaseCost || order.purchasePrice)
  ) * Math.max(1, number(order.quantity))
}

const procurementCost = (request) => {
  const quantity = Math.max(1, number(request.quantity))
  return (
    number(request.approvedPurchaseAmount) ||
    number(request.totalBuyPrice) ||
    number(request.estimatedPurchaseCost) * quantity
  ) + number(request.estimatedFreightCost)
}

const periodLabel = (index, horizon) => {
  const date = new Date()
  const config = SIMULATION_HORIZONS[horizon] || SIMULATION_HORIZONS.Monthly
  date.setMonth(date.getMonth() + config.monthsPerPeriod * (index + 1))
  if (horizon === 'Annual') return String(date.getFullYear())
  if (horizon === 'Quarterly') return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

const concentration = (records, key, valueGetter) => {
  const totals = new Map()
  records.forEach((record) => {
    const label = String(record?.[key] || 'Unassigned')
    totals.set(label, (totals.get(label) || 0) + number(valueGetter(record)))
  })
  const total = [...totals.values()].reduce((sumValue, value) => sumValue + value, 0)
  const largest = Math.max(0, ...totals.values())
  return total ? (largest / total) * 100 : 0
}

export function buildStrategicBaseline(data = {}) {
  const orders = data.orders || []
  const vehicles = data.vehicles || []
  const shipments = data.shipments || []
  const procurements = data.procurementRequests || []
  const customers = data.customers || []
  const suppliers = data.suppliers || []
  const finance = data.financeRecords || []

  const recentOrders = recentRecords(orders)
  const recentShipments = recentRecords(shipments)
  const recentProcurements = recentRecords(procurements)
  const recentCustomers = recentRecords(customers)
  const observedMonths = Math.max(
    1,
    Math.min(
      12,
      new Set(
        recentOrders
          .map(recordDate)
          .filter(Boolean)
          .map((date) => `${date.getFullYear()}-${date.getMonth()}`),
      ).size || 1,
    ),
  )

  const annualRevenue = sum(recentOrders, orderRevenue)
  const annualProfit = sum(recentOrders, orderProfit)
  const annualFreight = sum(recentShipments, (shipment) => shipment.freightCost)
  const annualProcurement = sum(recentProcurements, procurementCost)
  const annualSalesUnits = sum(recentOrders, (order) => Math.max(1, number(order.quantity)))
  const annualProcurementUnits = sum(recentProcurements, (request) => Math.max(1, number(request.quantity)))
  const annualShipmentUnits = sum(recentShipments, (shipment) => Math.max(1, number(shipment.quantity)))
  const delivered = shipments.filter((shipment) => shipment.status === 'Delivered').length
  const delayed = shipments.filter((shipment) => shipment.status === 'Delayed').length
  const completedOrders = orders.filter((order) => order.status === 'Completed').length
  const outstanding = finance.length
    ? sum(finance, (record) =>
        Math.max(
          0,
          number(record.amountPending) ||
            number(record.totalSaleAmount) - number(record.amountPaid),
        ))
    : 0
  const billed = sum(finance, (record) => record.totalSaleAmount)
  const inventoryUnits = sum(vehicles, (vehicle) => vehicle.quantity)
  const inventoryValue = sum(
    vehicles,
    (vehicle) => number(vehicle.purchasePrice) * number(vehicle.quantity),
  )
  const averagePurchasePrice =
    average(vehicles.map((vehicle) => vehicle.purchasePrice)) ||
    (annualSalesUnits ? Math.max(0, annualRevenue - annualProfit) / annualSalesUnits : 0)
  const averageSellingPrice =
    average(vehicles.map((vehicle) => vehicle.sellingPrice)) ||
    (annualSalesUnits ? annualRevenue / annualSalesUnits : 0)

  return {
    source: 'Permission-scoped Velora operating data',
    observedMonths,
    monthlyRevenue: annualRevenue / observedMonths,
    monthlyProfit: annualProfit / observedMonths,
    monthlyOperatingCost: Math.max(0, annualRevenue - annualProfit) / observedMonths,
    monthlyFreightCost: annualFreight / observedMonths,
    monthlyProcurementCost: annualProcurement / observedMonths,
    monthlySalesUnits: annualSalesUnits / observedMonths,
    monthlyProcurementUnits: annualProcurementUnits / observedMonths,
    monthlyShipmentUnits: annualShipmentUnits / observedMonths,
    monthlyCustomerGrowth: recentCustomers.length / observedMonths,
    inventoryUnits,
    inventoryValue,
    averagePurchasePrice,
    averageSellingPrice,
    customers: customers.length,
    suppliers: suppliers.length,
    outstandingPayments: outstanding,
    outstandingRate: billed ? outstanding / billed : 0.12,
    deliveryRate: shipments.length ? delivered / shipments.length : 0.85,
    delayRate: shipments.length ? delayed / shipments.length : 0.08,
    orderCompletionRate: orders.length ? completedOrders / orders.length : 0.75,
    supplierConcentration: concentration(procurements, 'supplierName', procurementCost),
    customerConcentration: concentration(orders, 'customerName', orderRevenue),
  }
}

const scenarioDefaults = (scenario = {}) => ({
  id: scenario.id || null,
  name: scenario.name || 'Untitled strategy',
  description: scenario.description || '',
  horizon: SIMULATION_HORIZONS[scenario.horizon] ? scenario.horizon : 'Monthly',
  assumptions: {
    ...DEFAULT_SCENARIO_ASSUMPTIONS,
    ...(scenario.assumptions || {}),
  },
})

const projectedRisk = ({
  shortageRate,
  delayRate,
  paymentIssueRate,
  supplierFailureRate,
  overstockRate,
  supplierConcentration,
}) => {
  const score = clamp(
    shortageRate * 28 +
      delayRate * 22 +
      paymentIssueRate * 18 +
      supplierFailureRate * 18 +
      overstockRate * 7 +
      ratio(supplierConcentration) * 7,
  )
  const level = score >= 75 ? 'Critical' : score >= 50 ? 'High' : score >= 25 ? 'Medium' : 'Low'
  return { score: Math.round(score), level }
}

const buildRecommendations = (baseline, assumptions, summary) => {
  const recommendations = []
  if (summary.shortageUnits > 0) {
    recommendations.push({
      severity: summary.shortageUnits > baseline.monthlySalesUnits * 2 ? 'High' : 'Medium',
      title: 'Raise procurement capacity before demand accelerates',
      detail: `${Math.ceil(summary.shortageUnits)} projected unit shortages appear across the simulation horizon.`,
      action: 'Procurement',
    })
  }
  if (summary.overstockUnits > baseline.monthlySalesUnits * 3) {
    recommendations.push({
      severity: 'Medium',
      title: 'Reduce planned procurement or expand sales coverage',
      detail: `${Math.ceil(summary.overstockUnits)} units are projected above the operating buffer.`,
      action: 'Inventory',
    })
  }
  if (summary.deliveryPerformance < 75) {
    recommendations.push({
      severity: 'High',
      title: 'Add logistics capacity before increasing shipment volume',
      detail: `Projected delivery performance falls to ${summary.deliveryPerformance.toFixed(1)}%.`,
      action: 'Shipments',
    })
  }
  if (summary.outstandingPayments > summary.revenue * 0.2) {
    recommendations.push({
      severity: 'High',
      title: 'Protect cash collection during growth',
      detail: `Outstanding payments may reach ${Math.round((summary.outstandingPayments / Math.max(1, summary.revenue)) * 100)}% of projected revenue.`,
      action: 'Finance',
    })
  }
  if (assumptions.supplierFailurePct > 0 || baseline.supplierConcentration > 45) {
    recommendations.push({
      severity: baseline.supplierConcentration > 60 ? 'High' : 'Medium',
      title: 'Diversify supplier dependency',
      detail: `Largest supplier concentration is ${baseline.supplierConcentration.toFixed(1)}%, increasing disruption exposure.`,
      action: 'Procurement',
    })
  }
  if (summary.profit > 0 && summary.risk.score < 35) {
    recommendations.push({
      severity: 'Positive',
      title: 'Strategy has room for controlled execution',
      detail: 'Projected profit remains positive while the composite risk score stays within the lower range.',
      action: 'Command Center',
    })
  }
  if (!recommendations.length) {
    recommendations.push({
      severity: 'Info',
      title: 'Strategy remains close to the current operating baseline',
      detail: 'Increase or stress individual assumptions to expose meaningful trade-offs.',
      action: 'Strategic War Room',
    })
  }
  return recommendations
}

export function simulateStrategicScenario(data, rawScenario = {}) {
  const scenario = scenarioDefaults(rawScenario)
  const baseline = buildStrategicBaseline(data)
  const assumptions = scenario.assumptions
  const config = SIMULATION_HORIZONS[scenario.horizon]
  const months = config.monthsPerPeriod

  const salesGrowth = ratio(assumptions.salesGrowthPct)
  const procurementGrowth = ratio(assumptions.procurementChangePct)
  const freightInflation = ratio(assumptions.freightCostChangePct)
  const shipmentGrowth = ratio(assumptions.shipmentVolumeChangePct)
  const customerGrowth = ratio(assumptions.customerGrowthPct)
  const newMarketGrowth = ratio(assumptions.newMarketRevenuePct)
  const categoryGrowth = ratio(assumptions.newVehicleCategoryGrowthPct)
  const supplierSavings = ratio(assumptions.newSupplierSavingsPct)
  const logisticsEfficiency = ratio(assumptions.logisticsEfficiencyPct)
  const supplierFailure = ratio(assumptions.supplierFailurePct)
  const paymentIssues = ratio(assumptions.paymentIssuePct)
  const delayShock = ratio(assumptions.delayRateChangePct)
  const targetBuffer = ratio(assumptions.inventoryBufferPct)

  let inventory = baseline.inventoryUnits
  let customers = baseline.customers
  let outstanding = baseline.outstandingPayments
  let cumulativeRevenue = 0
  let cumulativeExpenses = 0
  let cumulativeProfit = 0
  let cumulativeProcurement = 0
  let cumulativeFreight = 0
  let cumulativeShipments = 0
  let cumulativeShortage = 0
  let cumulativeOverstock = 0

  const projections = Array.from({ length: config.periods }, (_, index) => {
    const growthExponent = (index + 1) * months / 12
    const demandMultiplier =
      Math.pow(1 + salesGrowth, growthExponent) *
      (1 + newMarketGrowth) *
      (1 + categoryGrowth)
    const requestedDemand = Math.max(0, baseline.monthlySalesUnits * months * demandMultiplier)
    const expectedSupply = Math.max(
      0,
      baseline.monthlyProcurementUnits *
        months *
        (1 + procurementGrowth) *
        (1 - supplierFailure),
    )
    const available = inventory + expectedSupply
    const fulfilledUnits = Math.min(requestedDemand, available)
    const shortageUnits = Math.max(0, requestedDemand - available)
    inventory = Math.max(0, available - fulfilledUnits)
    const targetInventory = requestedDemand * (1 + targetBuffer)
    const overstockUnits = Math.max(0, inventory - targetInventory)
    const fulfilmentRate = requestedDemand ? fulfilledUnits / requestedDemand : 1

    const revenue =
      baseline.monthlyRevenue *
      months *
      demandMultiplier *
      fulfilmentRate
    const operatingCost =
      baseline.monthlyOperatingCost *
      months *
      demandMultiplier *
      fulfilmentRate *
      (1 - supplierSavings * 0.45) *
      (1 + supplierFailure * 0.18)
    const procurement =
      baseline.monthlyProcurementCost *
      months *
      (1 + procurementGrowth) *
      (1 - supplierSavings) *
      (1 + supplierFailure * 0.25)
    const shipmentUnits =
      baseline.monthlyShipmentUnits *
      months *
      (1 + shipmentGrowth) *
      Math.max(0.25, fulfilmentRate)
    const freight =
      baseline.monthlyFreightCost *
      months *
      (1 + shipmentGrowth) *
      (1 + freightInflation) *
      (1 - logisticsEfficiency)
    const disruptionCost =
      revenue * supplierFailure * 0.08 +
      revenue * Math.max(0, delayShock) * 0.035 +
      shortageUnits * baseline.averageSellingPrice * 0.03
    const expenses = operatingCost + freight + disruptionCost
    const profit = revenue - expenses
    const paymentIssueRate = clamp((baseline.outstandingRate + paymentIssues) * 100) / 100
    outstanding = Math.max(0, outstanding * 0.7 + revenue * paymentIssueRate)
    const delayRate = clamp(
      (baseline.delayRate + delayShock + shipmentGrowth * 0.12 - logisticsEfficiency * 0.3) * 100,
    ) / 100
    const deliveryPerformance = clamp((1 - delayRate) * baseline.deliveryRate * 100)
    customers +=
      baseline.monthlyCustomerGrowth *
      months *
      Math.pow(1 + customerGrowth + newMarketGrowth * 0.5, growthExponent)

    const shortageRate = requestedDemand ? shortageUnits / requestedDemand : 0
    const overstockRate = targetInventory ? overstockUnits / targetInventory : 0
    const risk = projectedRisk({
      shortageRate,
      delayRate,
      paymentIssueRate,
      supplierFailureRate: supplierFailure,
      overstockRate,
      supplierConcentration: baseline.supplierConcentration,
    })

    cumulativeRevenue += revenue
    cumulativeExpenses += expenses
    cumulativeProfit += profit
    cumulativeProcurement += procurement
    cumulativeFreight += freight
    cumulativeShipments += shipmentUnits
    cumulativeShortage += shortageUnits
    cumulativeOverstock += overstockUnits

    return {
      index,
      label: periodLabel(index, scenario.horizon),
      revenue,
      expenses,
      profit,
      procurementCost: procurement,
      freightCost: freight,
      outstandingPayments: outstanding,
      inventoryUnits: inventory,
      inventoryValue: inventory * baseline.averagePurchasePrice,
      requestedDemand,
      fulfilledUnits,
      shortageUnits,
      overstockUnits,
      shipmentUnits,
      customers: Math.round(customers),
      deliveryPerformance,
      riskScore: risk.score,
      riskLevel: risk.level,
    }
  })

  const final = projections.at(-1) || {}
  const risk = projectedRisk({
    shortageRate: cumulativeShortage / Math.max(1, baseline.monthlySalesUnits * config.periods * months),
    delayRate: Math.max(0, 1 - number(final.deliveryPerformance) / 100),
    paymentIssueRate: cumulativeRevenue ? outstanding / cumulativeRevenue : 0,
    supplierFailureRate: supplierFailure,
    overstockRate: cumulativeOverstock / Math.max(1, baseline.inventoryUnits),
    supplierConcentration: baseline.supplierConcentration,
  })
  const summary = {
    revenue: cumulativeRevenue,
    expenses: cumulativeExpenses,
    profit: cumulativeProfit,
    profitMargin: cumulativeRevenue ? (cumulativeProfit / cumulativeRevenue) * 100 : 0,
    outstandingPayments: outstanding,
    procurementCost: cumulativeProcurement,
    freightCost: cumulativeFreight,
    inventoryUnits: number(final.inventoryUnits),
    inventoryValue: number(final.inventoryValue),
    shortageUnits: cumulativeShortage,
    overstockUnits: cumulativeOverstock,
    shipmentUnits: cumulativeShipments,
    customers: number(final.customers),
    customerGrowth: number(final.customers) - baseline.customers,
    deliveryPerformance: number(final.deliveryPerformance),
    risk,
  }

  return {
    ...scenario,
    baseline,
    projections,
    summary,
    recommendations: buildRecommendations(baseline, assumptions, summary),
    generatedAt: new Date().toISOString(),
    disclaimer:
      'Strategic projection based on current Velora records and explicit scenario assumptions; it is not a guaranteed financial outcome.',
  }
}

export function compareStrategicScenarios(results = []) {
  const ranked = [...results]
    .map((result) => ({
      id: result.id,
      name: result.name,
      revenue: result.summary.revenue,
      profit: result.summary.profit,
      profitMargin: result.summary.profitMargin,
      riskScore: result.summary.risk.score,
      inventoryUnits: result.summary.inventoryUnits,
      shipmentUnits: result.summary.shipmentUnits,
      outstandingPayments: result.summary.outstandingPayments,
      strategyScore:
        result.summary.profit * 0.55 +
        result.summary.revenue * 0.15 -
        result.summary.risk.score * Math.max(1, result.summary.revenue * 0.003) -
        result.summary.shortageUnits * result.baseline.averageSellingPrice * 0.2,
    }))
    .sort((a, b) => b.strategyScore - a.strategyScore)

  return {
    ranked,
    best: ranked[0] || null,
    lowestRisk: [...ranked].sort((a, b) => a.riskScore - b.riskScore)[0] || null,
    highestProfit: [...ranked].sort((a, b) => b.profit - a.profit)[0] || null,
  }
}

export function createStressScenario(type) {
  const presets = {
    growth: {
      name: 'Accelerated growth',
      description: 'Expand sales, procurement, shipments, and customer acquisition together.',
      assumptions: {
        salesGrowthPct: 25,
        procurementChangePct: 28,
        shipmentVolumeChangePct: 25,
        customerGrowthPct: 18,
        inventoryBufferPct: 20,
      },
    },
    freight: {
      name: 'Freight cost shock',
      description: 'Stress-test rising freight costs and reduced delivery performance.',
      assumptions: {
        freightCostChangePct: 30,
        shipmentVolumeChangePct: 10,
        delayRateChangePct: 10,
        logisticsEfficiencyPct: -5,
      },
    },
    supplier: {
      name: 'Supplier disruption',
      description: 'Model a major supplier partially failing during the forecast horizon.',
      assumptions: {
        supplierFailurePct: 35,
        procurementChangePct: -15,
        freightCostChangePct: 12,
        delayRateChangePct: 15,
      },
    },
    market: {
      name: 'New market entry',
      description: 'Estimate a new region with stronger demand and customer acquisition.',
      assumptions: {
        newMarketRevenuePct: 20,
        customerGrowthPct: 22,
        shipmentVolumeChangePct: 20,
        procurementChangePct: 18,
      },
    },
    payment: {
      name: 'Payment collection stress',
      description: 'Model weaker customer payment performance during continued growth.',
      assumptions: {
        salesGrowthPct: 12,
        paymentIssuePct: 20,
        customerGrowthPct: 8,
      },
    },
  }
  const preset = presets[type] || presets.growth
  return scenarioDefaults({ ...preset, horizon: 'Monthly' })
}

export function buildStrategicAiContext(data, scenarios = []) {
  const baseline = buildStrategicBaseline(data)
  const sourceScenarios = scenarios.length
    ? scenarios
    : ['growth', 'freight', 'supplier', 'market', 'payment'].map(createStressScenario)
  const simulations = sourceScenarios.slice(0, 8).map((scenario) => {
    const result = scenario.summary ? scenario : simulateStrategicScenario(data, scenario)
    return {
      name: result.name,
      horizon: result.horizon,
      assumptions: result.assumptions,
      projectedOutcome: result.summary,
      recommendations: result.recommendations.slice(0, 4),
    }
  })
  const comparison = compareStrategicScenarios(
    sourceScenarios.map((scenario) => (scenario.summary ? scenario : simulateStrategicScenario(data, scenario))),
  )
  return {
    baseline,
    simulations,
    preferredStrategy: comparison.best,
    supportedQuestions: [
      'What happens if procurement increases?',
      'What happens if freight costs rise?',
      'What happens if a supplier fails?',
      'Which saved strategy generates the highest projected profit?',
    ],
  }
}
