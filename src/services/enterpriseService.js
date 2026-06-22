const n = (value) => Number(value) || 0;

/**
 * Produces a stable finance projection from existing operational records.
 * These projections are useful before a dedicated finance record is created.
 */
export function projectOrderFinance(order, shipments = [], procurements = []) {
  const linkedShipments = shipments.filter((shipment) => shipment.linkedOrderId === order.id);
  const linkedProcurements = procurements.filter((item) => item.linkedOrderId === order.id);
  const sale = n(order.sellingPrice);
  const vehicleCost = n(order.purchaseCost);
  const freight = linkedShipments.reduce((sum, item) => sum + n(item.freightCost), 0);
  const procurement = linkedProcurements.reduce(
    (sum, item) => sum + n(item.approvedPurchaseAmount || item.totalBuyPrice),
    0,
  );
  const totalCost = vehicleCost + freight + procurement;
  const netProfit = sale - totalCost;

  return {
    orderId: order.id,
    totalSaleAmount: sale,
    vehicleCost,
    procurementCost: procurement,
    freightCost: freight,
    totalCost,
    grossProfit: sale - vehicleCost,
    netProfit,
    marginPercentage: sale ? (netProfit / sale) * 100 : 0,
  };
}

export function calculateFinanceRecord(record) {
  const totalSaleAmount = n(record.totalSaleAmount);
  const totalCost = n(record.vehicleCost)
    + n(record.procurementCost)
    + n(record.freightCost)
    + n(record.taxDutyCost)
    + n(record.otherCost);
  const grossProfit = totalSaleAmount - n(record.vehicleCost);
  const netProfit = totalSaleAmount - totalCost;

  return {
    ...record,
    totalCost,
    grossProfit,
    netProfit,
    marginPercentage: totalSaleAmount ? (netProfit / totalSaleAmount) * 100 : 0,
    amountPending: Math.max(totalSaleAmount - n(record.amountPaid), 0),
  };
}

export function buildEnterpriseSummary({
  vehicles = [],
  orders = [],
  customers = [],
  shipments = [],
  procurements = [],
  financeRecords = [],
  documents = [],
}) {
  const finance = financeRecords.map(calculateFinanceRecord);
  return {
    procurement: {
      active: procurements.filter((item) => !['Received', 'Added To Inventory', 'Cancelled'].includes(item.status)).length,
      delayed: procurements.filter((item) => item.status === 'Delayed').length,
      value: procurements.reduce((sum, item) => sum + n(item.totalBuyPrice || item.approvedPurchaseAmount), 0),
    },
    finance: {
      revenue: finance.reduce((sum, item) => sum + n(item.totalSaleAmount), 0),
      netProfit: finance.reduce((sum, item) => sum + n(item.netProfit), 0),
      outstanding: finance.reduce((sum, item) => sum + n(item.amountPending), 0),
      overdue: finance.filter((item) => item.paymentStatus === 'Overdue').length,
    },
    crm: {
      customers: customers.length,
      riskCustomers: customers.filter((item) => item.customerRating === 'Risk').length,
    },
    logistics: {
      active: shipments.filter((item) => !['Delivered', 'Cancelled'].includes(item.status)).length,
      delayed: shipments.filter((item) => item.status === 'Delayed').length,
    },
    inventory: {
      units: vehicles.reduce((sum, item) => sum + n(item.quantity), 0),
      lifecycleExceptions: vehicles.filter((item) => !item.lifecycleStatus).length,
    },
    orders: orders.length,
    documents: documents.length,
  };
}
