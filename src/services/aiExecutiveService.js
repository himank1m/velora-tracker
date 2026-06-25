const DAY = 86400000;

const numberValue = (value) => Number(String(value ?? '').replace(/,/g, '')) || 0;
const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, numberValue(value)));
const today = () => new Date();

const parseDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const daysSince = (value, now = today()) => {
  const date = parseDate(value);
  return date ? Math.max(0, Math.floor((now - date) / DAY)) : null;
};

const activeOrderStatuses = new Set(['Inquiry', 'Confirmed', 'Procurement', 'Inspection', 'Ready', 'Shipped']);
const deliveredStatuses = new Set(['Delivered', 'Completed']);
const terminalProcurementStatuses = new Set(['Arrived', 'Received', 'Added To Inventory', 'Cancelled']);
const terminalShipmentStatuses = new Set(['Delivered', 'Completed', 'Cancelled']);

const orderRevenue = (order) =>
  numberValue(order.totalRevenue) ||
  numberValue(order.total_revenue) ||
  numberValue(order.sellingPrice || order.selling_price) * Math.max(1, numberValue(order.quantity));

const orderProfit = (order) => {
  const explicit = numberValue(order.totalProfit) || numberValue(order.total_profit);
  if (explicit) return explicit;
  const selling = numberValue(order.sellingPrice || order.selling_price);
  const purchase = numberValue(order.purchaseCost || order.purchase_cost || order.purchasePrice);
  return (selling - purchase) * Math.max(1, numberValue(order.quantity));
};

const inventoryValue = (vehicles = []) =>
  vehicles.reduce((sum, vehicle) => {
    const quantity = Math.max(0, numberValue(vehicle.quantity));
    const purchase = numberValue(vehicle.purchasePrice || vehicle.purchase_price);
    return sum + quantity * purchase;
  }, 0);

const procurementValue = (request) =>
  Math.max(1, numberValue(request.quantity)) * numberValue(request.estimatedPurchaseCost || request.estimated_purchase_cost || request.totalBuyPrice) +
  numberValue(request.estimatedFreightCost || request.estimated_freight_cost);

const confidence = (evidence = 1) => {
  const score = Math.round(clamp(52 + Math.min(8, evidence) * 5.5));
  return {
    score,
    label: score >= 82 ? 'High' : score >= 66 ? 'Medium' : 'Developing',
  };
};

const makeFinding = ({ id, executive, type, severity = 'Medium', title, explanation, evidence = [], recommendation = '', module = 'Command Center', impact = 50 }) => ({
  id,
  executive,
  type,
  severity,
  title,
  explanation,
  evidence,
  recommendation,
  module,
  impact: clamp(impact),
  confidence: confidence(evidence.length),
});

const average = (values = []) => {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
};

function buildScorecards(metrics) {
  const finance = clamp(
    50 +
      (metrics.profit > 0 ? 18 : -18) +
      (metrics.outstandingPayments > 0 ? -12 : 10) +
      (metrics.revenue > 0 ? 12 : -8),
  );
  const operations = clamp(
    78 -
      metrics.stuckOrders * 5 -
      metrics.activeOrders * 0.8 +
      metrics.completedOrders * 1.4,
  );
  const logistics = clamp(
    82 -
      metrics.delayedShipments * 12 -
      metrics.activeShipments * 0.8 +
      metrics.deliveredShipments * 1.8,
  );
  const procurement = clamp(
    76 -
      metrics.delayedProcurements * 10 -
      metrics.pendingProcurements * 1.5 +
      (metrics.lowInventory > 0 ? -10 : 8),
  );
  const hr = clamp(
    72 +
      metrics.activeEmployees * 0.8 -
      metrics.employeesOnLeave * 4 -
      metrics.overduePayroll * 12,
  );
  const projects = clamp(72 + metrics.activeScenarios * 3 - metrics.criticalRisks * 4);
  const ecosystem = clamp(66 + metrics.ecosystemCompanies * 1.6 + metrics.marketplacePartners * 2 - metrics.missingCustomerInfo * 4);

  return [
    { key: 'finance', label: 'Finance', score: Math.round(finance), detail: 'Revenue, profit, collections, and cost pressure' },
    { key: 'operations', label: 'Operations', score: Math.round(operations), detail: 'Order execution, throughput, and operational focus' },
    { key: 'logistics', label: 'Logistics', score: Math.round(logistics), detail: 'Shipment performance, ETA risk, and delivery reliability' },
    { key: 'procurement', label: 'Procurement', score: Math.round(procurement), detail: 'Supplier flow, replenishment, and incoming inventory' },
    { key: 'hr', label: 'HR', score: Math.round(hr), detail: 'Workforce availability, payroll, and employee health' },
    { key: 'projects', label: 'Projects', score: Math.round(projects), detail: 'Strategic execution and planning discipline' },
    { key: 'ecosystem', label: 'Ecosystem', score: Math.round(ecosystem), detail: 'Partners, marketplace readiness, and network strength' },
  ];
}

function buildExecutiveBoard(data, metrics, scorecards) {
  const financeEvidence = [`Revenue ${metrics.revenue}`, `Profit ${metrics.profit}`, `Outstanding ${metrics.outstandingPayments}`];
  const operationsEvidence = [`Active orders ${metrics.activeOrders}`, `Stuck orders ${metrics.stuckOrders}`];
  const logisticsEvidence = [`Active shipments ${metrics.activeShipments}`, `Delayed shipments ${metrics.delayedShipments}`];
  const procurementEvidence = [`Procurements ${metrics.pendingProcurements}`, `Low inventory ${metrics.lowInventory}`];
  const hrEvidence = [`Employees ${metrics.totalEmployees}`, `Payroll overdue ${metrics.overduePayroll}`];
  const strategyEvidence = [`Scenarios ${metrics.activeScenarios}`, `Ecosystem companies ${metrics.ecosystemCompanies}`];

  return [
    {
      id: 'coo',
      title: 'AI COO',
      domain: 'Operations, efficiency, execution',
      score: scorecards.find((item) => item.key === 'operations')?.score || 0,
      stance: metrics.stuckOrders ? 'Execution needs immediate follow-up.' : 'Operating rhythm is stable.',
      observations: [
        `${metrics.activeOrders} active orders are moving through the operating pipeline.`,
        `${metrics.completedOrders} orders are marked delivered or completed.`,
      ],
      risks: metrics.stuckOrders ? [`${metrics.stuckOrders} orders appear stuck beyond seven days.`] : ['No major order execution bottleneck detected.'],
      opportunities: ['Use status discipline to shorten order cycle time.'],
      recommendations: metrics.stuckOrders ? ['Review stuck orders and assign owners today.'] : ['Maintain daily order review cadence.'],
      confidence: confidence(operationsEvidence.length),
    },
    {
      id: 'cfo',
      title: 'AI CFO',
      domain: 'Finance, revenue, costs, forecasting',
      score: scorecards.find((item) => item.key === 'finance')?.score || 0,
      stance: metrics.profit < 0 ? 'Profitability is under pressure.' : 'Financial position is positive.',
      observations: [`Revenue is ${metrics.revenue}.`, `Profit is ${metrics.profit}.`],
      risks: metrics.outstandingPayments ? [`Outstanding payments require collection focus.`] : ['No outstanding payment concentration detected.'],
      opportunities: ['Protect high-margin vehicle categories and review freight-heavy orders.'],
      recommendations: metrics.outstandingPayments ? ['Prioritize overdue collections and finance review.'] : ['Convert profit trend into a monthly forecast review.'],
      confidence: confidence(financeEvidence.length),
    },
    {
      id: 'hr',
      title: 'AI HR Director',
      domain: 'Employees, payroll, workforce health',
      score: scorecards.find((item) => item.key === 'hr')?.score || 0,
      stance: metrics.totalEmployees ? 'Workforce system has enough data for monitoring.' : 'Workforce data foundation is still light.',
      observations: [`${metrics.totalEmployees} employees tracked.`, `${metrics.employeesOnLeave} employees currently on leave.`],
      risks: metrics.overduePayroll ? [`${metrics.overduePayroll} payroll records are overdue.`] : ['No overdue payroll issue detected.'],
      opportunities: ['Use workforce data to plan department capacity before expansion.'],
      recommendations: metrics.overduePayroll ? ['Clear overdue payroll records before month close.'] : ['Keep employee status and payroll records current.'],
      confidence: confidence(hrEvidence.length),
    },
    {
      id: 'logistics',
      title: 'AI Logistics Director',
      domain: 'Shipments, freight, delivery performance',
      score: scorecards.find((item) => item.key === 'logistics')?.score || 0,
      stance: metrics.delayedShipments ? 'Delivery reliability needs attention.' : 'Shipment flow is currently healthy.',
      observations: [`${metrics.activeShipments} active shipments.`, `${metrics.deliveredShipments} delivered shipments.`],
      risks: metrics.delayedShipments ? [`${metrics.delayedShipments} shipments are delayed or overdue.`] : ['No critical shipment delay cluster detected.'],
      opportunities: ['Negotiate repeat lanes with reliable logistics partners.'],
      recommendations: metrics.delayedShipments ? ['Escalate delayed shipments and update customers proactively.'] : ['Monitor ETA changes daily.'],
      confidence: confidence(logisticsEvidence.length),
    },
    {
      id: 'procurement',
      title: 'AI Procurement Director',
      domain: 'Suppliers, procurement, replenishment',
      score: scorecards.find((item) => item.key === 'procurement')?.score || 0,
      stance: metrics.lowInventory ? 'Replenishment planning should be reviewed.' : 'Procurement and stock position is balanced.',
      observations: [`${metrics.pendingProcurements} procurement requests are open.`, `${metrics.lowInventory} low-stock vehicle records found.`],
      risks: metrics.delayedProcurements ? [`${metrics.delayedProcurements} procurement requests may be delayed.`] : ['No procurement delay cluster detected.'],
      opportunities: ['Build preferred supplier lanes for fast-moving vehicle categories.'],
      recommendations: metrics.lowInventory ? ['Create replenishment opportunities for low-stock models.'] : ['Keep supplier response times under review.'],
      confidence: confidence(procurementEvidence.length),
    },
    {
      id: 'strategy',
      title: 'AI Strategy Director',
      domain: 'Growth, expansion, opportunities, planning',
      score: Math.round(average([
        scorecards.find((item) => item.key === 'projects')?.score || 0,
        scorecards.find((item) => item.key === 'ecosystem')?.score || 0,
      ])),
      stance: metrics.activeScenarios ? 'Strategic planning is active.' : 'Strategy foundation is ready for scenario planning.',
      observations: [`${metrics.activeScenarios} strategic simulations available.`, `${metrics.ecosystemCompanies} ecosystem companies connected.`],
      risks: metrics.criticalRisks ? [`${metrics.criticalRisks} high-impact risks need board attention.`] : ['No severe cross-department strategy risk detected.'],
      opportunities: ['Use marketplace and ecosystem data to identify expansion partners.'],
      recommendations: ['Compare the best growth scenario against logistics and procurement capacity.'],
      confidence: confidence(strategyEvidence.length),
    },
  ];
}

function buildFindings(metrics) {
  const findings = [];
  if (metrics.profit < 0 || metrics.lowProfitMargin) {
    findings.push(makeFinding({
      id: 'finance-margin-pressure',
      executive: 'AI CFO',
      type: 'Risk',
      severity: metrics.profit < 0 ? 'Critical' : 'High',
      title: 'Profitability pressure detected',
      explanation: 'Profit or margin quality is below the preferred operating threshold.',
      evidence: ['orders', 'finance records', 'inventory pricing'],
      recommendation: 'Review selling prices, procurement costs, and freight-heavy orders.',
      module: 'Finance',
      impact: 88,
    }));
  }
  if (metrics.delayedShipments) {
    findings.push(makeFinding({
      id: 'logistics-delay-risk',
      executive: 'AI Logistics Director',
      type: 'Risk',
      severity: metrics.delayedShipments > 2 ? 'Critical' : 'High',
      title: 'Shipment delay cluster requires attention',
      explanation: `${metrics.delayedShipments} shipments are delayed or past ETA.`,
      evidence: ['shipments', 'ETA', 'status'],
      recommendation: 'Escalate logistics partners and send customer updates.',
      module: 'Shipments',
      impact: 82,
    }));
  }
  if (metrics.lowInventory) {
    findings.push(makeFinding({
      id: 'inventory-replenishment',
      executive: 'AI Procurement Director',
      type: 'Opportunity',
      severity: 'Medium',
      title: 'Replenishment opportunity found',
      explanation: `${metrics.lowInventory} inventory records are low or depleted.`,
      evidence: ['inventory quantity', 'procurement pipeline'],
      recommendation: 'Create procurement opportunities for fast-moving low-stock vehicles.',
      module: 'Procurement',
      impact: 68,
    }));
  }
  if (metrics.outstandingPayments) {
    findings.push(makeFinding({
      id: 'collection-focus',
      executive: 'AI CFO',
      type: 'Recommendation',
      severity: 'High',
      title: 'Outstanding payments need finance follow-up',
      explanation: 'Open receivables reduce cash visibility and planning accuracy.',
      evidence: ['finance records', 'payment status'],
      recommendation: 'Prioritize high-value overdue or pending accounts.',
      module: 'Finance',
      impact: 74,
    }));
  }
  if (metrics.ecosystemCompanies >= 5 || metrics.marketplacePartners >= 3) {
    findings.push(makeFinding({
      id: 'ecosystem-growth',
      executive: 'AI Strategy Director',
      type: 'Opportunity',
      severity: 'Medium',
      title: 'Ecosystem network can support expansion',
      explanation: 'Marketplace and ecosystem records show enough partners for regional opportunity review.',
      evidence: ['ecosystem companies', 'suppliers', 'logistics partners'],
      recommendation: 'Evaluate new regional partnerships through the Marketplace.',
      module: 'Marketplace',
      impact: 66,
    }));
  }
  if (metrics.overduePayroll) {
    findings.push(makeFinding({
      id: 'hr-payroll-risk',
      executive: 'AI HR Director',
      type: 'Risk',
      severity: 'High',
      title: 'Payroll exception detected',
      explanation: `${metrics.overduePayroll} payroll records are overdue.`,
      evidence: ['payroll records', 'employee records'],
      recommendation: 'Resolve payroll exceptions and document approval status.',
      module: 'Payroll',
      impact: 70,
    }));
  }
  if (!findings.length) {
    findings.push(makeFinding({
      id: 'stable-board',
      executive: 'AI COO',
      type: 'Observation',
      severity: 'Low',
      title: 'Executive board sees stable operations',
      explanation: 'No critical cross-department issue was detected from current records.',
      evidence: ['orders', 'shipments', 'inventory', 'finance'],
      recommendation: 'Continue daily executive review and keep records updated.',
      module: 'Command Center',
      impact: 45,
    }));
  }
  return findings.sort((a, b) => b.impact - a.impact);
}

function buildCollaboration(findings, metrics) {
  const rows = [];
  if (metrics.profit <= 0 || metrics.lowProfitMargin || metrics.delayedShipments || metrics.delayedProcurements) {
    rows.push({
      id: 'profit-ops-link',
      title: 'Profit movement may be linked to operating friction',
      contributors: ['AI CFO', 'AI Procurement Director', 'AI Logistics Director', 'AI COO'],
      explanation: 'Finance pressure, procurement delays, and logistics delays are reviewed together because they often combine into margin erosion.',
      consensus: 'Prioritize high-value delayed shipments, supplier cost review, and freight cost checks before expanding volume.',
      confidence: confidence(5),
    });
  }
  if (metrics.lowInventory && metrics.activeOrders) {
    rows.push({
      id: 'demand-stock-link',
      title: 'Demand and inventory need coordinated planning',
      contributors: ['AI COO', 'AI Procurement Director', 'AI Strategy Director'],
      explanation: 'Active orders and low inventory can indicate either healthy demand or upcoming stock pressure.',
      consensus: 'Create replenishment scenarios and verify supplier availability for fast-moving models.',
      confidence: confidence(4),
    });
  }
  if (metrics.ecosystemCompanies || metrics.marketplacePartners) {
    rows.push({
      id: 'ecosystem-strategy-link',
      title: 'Marketplace relationships can support growth strategy',
      contributors: ['AI Strategy Director', 'AI Procurement Director', 'AI Logistics Director'],
      explanation: 'Connected suppliers, logistics providers, and partners can reduce expansion risk when reviewed before market entry.',
      consensus: 'Use the Marketplace as the sourcing layer for future strategic simulations.',
      confidence: confidence(4),
    });
  }
  return rows.length ? rows : [{
    id: 'board-sync',
    title: 'AI executives are aligned on current stability',
    contributors: ['AI COO', 'AI CFO', 'AI Strategy Director'],
    explanation: 'The executive board does not detect a strong cross-department conflict in current data.',
    consensus: 'Keep monitoring active and use weekly briefings for trend changes.',
    confidence: confidence(3),
  }];
}

function buildBriefings(metrics, findings) {
  const topRisk = findings.find((item) => item.type === 'Risk');
  const topOpportunity = findings.find((item) => item.type === 'Opportunity');
  return {
    Daily: {
      title: 'Daily executive briefing',
      headline: topRisk ? topRisk.title : 'Company operating state is stable today.',
      bullets: [
        `${metrics.activeOrders} active orders and ${metrics.activeShipments} active shipments need daily visibility.`,
        topRisk ? topRisk.explanation : 'No critical risk cluster detected from current data.',
        topOpportunity ? topOpportunity.recommendation : 'Keep Marketplace, procurement, and customer records current for stronger AI memory.',
      ],
    },
    Weekly: {
      title: 'Weekly executive briefing',
      headline: 'Review execution quality, collections, and capacity planning.',
      bullets: [
        `${metrics.delayedShipments + metrics.stuckOrders + metrics.delayedProcurements} operational exceptions should be reviewed this week.`,
        `${metrics.ecosystemCompanies} ecosystem companies and ${metrics.marketplacePartners} partners can support expansion planning.`,
        'Use Strategic War Room scenarios to test procurement, freight, and revenue assumptions.',
      ],
    },
    Monthly: {
      title: 'Monthly executive briefing',
      headline: 'Convert operating data into board-level planning.',
      bullets: [
        `Revenue, profit, inventory value, and outstanding payments are ready for monthly management review.`,
        'Compare Time Machine history against current scorecards to understand direction of change.',
        'Prepare future automation rules only after human-approved recommendation history is established.',
      ],
    },
  };
}

function calculateMetrics(data = {}, now = today()) {
  const orders = data.orders || [];
  const shipments = data.shipments || [];
  const procurementRequests = data.procurementRequests || [];
  const vehicles = data.vehicles || [];
  const financeRecords = data.financeRecords || [];
  const employees = data.employees || [];
  const payrollRecords = data.payrollRecords || [];
  const suppliers = data.suppliers || [];
  const logisticsPartners = data.logisticsPartners || [];
  const ecosystemCompanies = data.ecosystemCompanies || [];
  const ecosystemRelationships = data.ecosystemRelationships || [];
  const strategicScenarios = data.strategicScenarios || [];
  const customers = data.customers || [];

  const revenue = orders.reduce((sum, order) => sum + orderRevenue(order), 0);
  const profit = orders.reduce((sum, order) => sum + orderProfit(order), 0);
  const outstandingPayments = financeRecords.reduce((sum, record) => {
    const pending = numberValue(record.amountPending) || Math.max(0, numberValue(record.totalSaleAmount) - numberValue(record.amountPaid));
    return ['Pending', 'Overdue', 'Unpaid', 'Partially Paid'].includes(record.paymentStatus || record.status) ? sum + pending : sum;
  }, 0);
  const activeOrders = orders.filter((order) => activeOrderStatuses.has(order.status)).length;
  const completedOrders = orders.filter((order) => deliveredStatuses.has(order.status)).length;
  const stuckOrders = orders.filter((order) => activeOrderStatuses.has(order.status) && (daysSince(order.updatedAt || order.createdAt || order.orderDate, now) || 0) > 7).length;
  const activeShipments = shipments.filter((shipment) => !terminalShipmentStatuses.has(shipment.status)).length;
  const deliveredShipments = shipments.filter((shipment) => deliveredStatuses.has(shipment.status)).length;
  const delayedShipments = shipments.filter((shipment) => {
    const eta = parseDate(shipment.eta);
    return shipment.status === 'Delayed' || (!terminalShipmentStatuses.has(shipment.status) && eta && eta < now);
  }).length;
  const pendingProcurements = procurementRequests.filter((request) => !terminalProcurementStatuses.has(request.status)).length;
  const delayedProcurements = procurementRequests.filter((request) => {
    const age = daysSince(request.updatedAt || request.createdAt, now);
    return request.status === 'Delayed' || (!terminalProcurementStatuses.has(request.status) && age !== null && age > 21);
  }).length;
  const lowInventory = vehicles.filter((vehicle) => numberValue(vehicle.quantity) <= 1).length;
  const lowProfitMargin = vehicles.filter((vehicle) => {
    const selling = numberValue(vehicle.sellingPrice || vehicle.selling_price);
    const purchase = numberValue(vehicle.purchasePrice || vehicle.purchase_price);
    return selling > 0 && ((selling - purchase) / selling) * 100 < 8;
  }).length;
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((employee) => employee.status === 'Active').length;
  const employeesOnLeave = employees.filter((employee) => employee.status === 'On Leave').length;
  const overduePayroll = payrollRecords.filter((record) => ['Overdue', 'Pending'].includes(record.paymentStatus) && parseDate(record.paymentDate) && parseDate(record.paymentDate) < now).length;
  const missingCustomerInfo = customers.filter((customer) => !(customer.email && customer.phone)).length;
  const marketplacePartners = suppliers.length + logisticsPartners.length;
  const ecosystemCount = ecosystemCompanies.length + suppliers.length + logisticsPartners.length;
  const criticalRisks = delayedShipments + delayedProcurements + stuckOrders + overduePayroll + (profit < 0 ? 1 : 0);

  return {
    revenue,
    profit,
    outstandingPayments,
    activeOrders,
    completedOrders,
    stuckOrders,
    activeShipments,
    deliveredShipments,
    delayedShipments,
    pendingProcurements,
    delayedProcurements,
    procurementValue: procurementRequests.reduce((sum, request) => sum + procurementValue(request), 0),
    inventoryValue: inventoryValue(vehicles),
    lowInventory,
    lowProfitMargin,
    totalEmployees,
    activeEmployees,
    employeesOnLeave,
    overduePayroll,
    missingCustomerInfo,
    suppliers: suppliers.length,
    logisticsPartners: logisticsPartners.length,
    marketplacePartners,
    ecosystemCompanies: ecosystemCount,
    ecosystemRelationships: ecosystemRelationships.length,
    activeScenarios: strategicScenarios.length,
    criticalRisks,
  };
}

function buildRecommendations(findings, board) {
  const generated = findings.map((finding) => ({
    id: `rec-${finding.id}`,
    title: finding.recommendation || finding.title,
    owner: finding.executive,
    reason: finding.explanation,
    module: finding.module,
    impact: finding.impact,
    confidence: finding.confidence,
    approvalRequired: true,
  }));
  board.forEach((executive) => {
    if (!generated.find((item) => item.owner === executive.title)) {
      generated.push({
        id: `rec-${executive.id}`,
        title: executive.recommendations[0],
        owner: executive.title,
        reason: executive.stance,
        module: executive.id === 'strategy' ? 'Strategic War Room' : 'Command Center',
        impact: executive.score,
        confidence: executive.confidence,
        approvalRequired: true,
      });
    }
  });
  return generated.sort((a, b) => b.impact - a.impact).slice(0, 10);
}

function buildBoardroom(board, findings, collaborations) {
  return {
    opinions: board.map((executive) => ({
      executive: executive.title,
      stance: executive.stance,
      score: executive.score,
      confidence: executive.confidence,
    })),
    risks: findings.filter((item) => item.type === 'Risk').slice(0, 5),
    opportunities: findings.filter((item) => item.type === 'Opportunity').slice(0, 5),
    consensus: collaborations.map((item) => item.consensus),
  };
}

function answerFromIntelligence(question, intelligence) {
  const query = String(question || '').toLowerCase();
  const topRisk = intelligence.findings.find((item) => item.type === 'Risk') || intelligence.findings[0];
  const topOpportunity = intelligence.findings.find((item) => item.type === 'Opportunity') || intelligence.findings[0];
  const weakest = [...intelligence.scorecards].sort((a, b) => a.score - b.score)[0];

  if (query.includes('risk')) {
    return topRisk ? `${topRisk.title}: ${topRisk.explanation} Recommended action: ${topRisk.recommendation}` : 'No major risk is visible in current records.';
  }
  if (query.includes('opportunity')) {
    return topOpportunity ? `${topOpportunity.title}: ${topOpportunity.explanation} Suggested move: ${topOpportunity.recommendation}` : 'No standout opportunity is visible yet. Add more marketplace, customer, and procurement data.';
  }
  if (query.includes('department') || query.includes('attention')) {
    return `${weakest.label} needs the most attention with a score of ${weakest.score}/100. ${weakest.detail}`;
  }
  if (query.includes('supplier')) {
    const procurement = intelligence.executives.find((item) => item.id === 'procurement');
    return `${procurement.title}: ${procurement.stance} ${procurement.recommendations[0]}`;
  }
  if (query.includes('project')) {
    const strategy = intelligence.executives.find((item) => item.id === 'strategy');
    return `${strategy.title}: ${strategy.stance} ${strategy.recommendations[0]}`;
  }
  return `Focus today on ${topRisk?.title || weakest.label}. The board consensus is: ${intelligence.collaboration[0]?.consensus || 'maintain monitoring and improve data completeness.'}`;
}

export function buildAiExecutiveOperatingSystem(data = {}) {
  const metrics = calculateMetrics(data);
  const scorecards = buildScorecards(metrics);
  const executives = buildExecutiveBoard(data, metrics, scorecards);
  const findings = buildFindings(metrics);
  const collaboration = buildCollaboration(findings, metrics);
  const briefings = buildBriefings(metrics, findings);
  const recommendations = buildRecommendations(findings, executives);
  const boardroom = buildBoardroom(executives, findings, collaboration);
  const performance = {
    recommendationsGenerated: recommendations.length,
    risksDetected: findings.filter((item) => item.type === 'Risk').length,
    opportunitiesDiscovered: findings.filter((item) => item.type === 'Opportunity').length,
    executiveActivity: executives.reduce((sum, executive) => sum + executive.observations.length + executive.recommendations.length, 0),
  };

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    scorecards,
    executives,
    findings,
    collaboration,
    briefings,
    recommendations,
    boardroom,
    performance,
    answerQuestion(question) {
      return answerFromIntelligence(question, { scorecards, executives, findings, collaboration });
    },
  };
}
