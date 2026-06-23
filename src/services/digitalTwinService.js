const numberValue = (value) => Number(String(value ?? '').replace(/,/g, '')) || 0;
const textValue = (value) => String(value ?? '').trim();
const normalize = (value) => textValue(value).toLowerCase();

const terminalProcurementStatuses = new Set(['Added To Inventory', 'Received', 'Cancelled']);
const terminalShipmentStatuses = new Set(['Delivered', 'Cancelled']);

const countryCoordinates = {
  argentina: [-64, -34],
  australia: [134, -25],
  belgium: [4.6, 50.8],
  brazil: [-52, -10],
  canada: [-106, 56],
  chad: [18.7, 15.4],
  chile: [-71, -33],
  china: [104, 35],
  egypt: [30.8, 26.8],
  france: [2.2, 46.2],
  germany: [10.4, 51.2],
  india: [78.9, 20.6],
  indonesia: [113.9, -0.8],
  italy: [12.6, 41.9],
  japan: [138.2, 36.2],
  kenya: [37.9, 0.2],
  malaysia: [101.9, 4.2],
  mexico: [-102.5, 23.6],
  monaco: [7.4, 43.7],
  morocco: [-7.1, 31.8],
  netherlands: [5.3, 52.1],
  nigeria: [8.7, 9.1],
  oman: [55.9, 21.5],
  philippines: [121.8, 12.8],
  qatar: [51.2, 25.4],
  'saudi arabia': [45.1, 23.9],
  singapore: [103.8, 1.35],
  'south africa': [22.9, -30.6],
  'south korea': [127.8, 36.4],
  korea: [127.8, 36.4],
  spain: [-3.7, 40.4],
  thailand: [100.9, 15.8],
  turkey: [35.2, 39],
  uae: [53.8, 23.4],
  'united arab emirates': [53.8, 23.4],
  uk: [-3.4, 55.4],
  'united kingdom': [-3.4, 55.4],
  usa: [-98.5, 39.8],
  'united states': [-98.5, 39.8],
  vietnam: [108.3, 14.1],
};

const worldShapes = [
  'M70 116 L112 82 L178 66 L230 84 L250 120 L222 150 L182 154 L157 184 L118 168 L92 142 Z',
  'M223 188 L252 180 L273 209 L266 258 L245 306 L222 274 L208 226 Z',
  'M355 87 L401 67 L459 78 L493 104 L535 101 L582 126 L641 122 L701 145 L735 177 L690 192 L646 181 L602 206 L552 191 L516 211 L470 188 L433 196 L399 164 L365 155 L338 119 Z',
  'M410 182 L461 174 L493 205 L489 252 L466 310 L428 286 L407 238 Z',
  'M663 244 L702 232 L738 255 L731 286 L687 296 L650 273 Z',
  'M742 155 L775 147 L793 165 L779 184 L748 181 Z',
];

function dateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inDateRange(value, startDate, endDate) {
  const date = dateValue(value);
  if (!date) return !startDate && !endDate;
  if (startDate && date < new Date(`${startDate}T00:00:00`)) return false;
  if (endDate && date > new Date(`${endDate}T23:59:59`)) return false;
  return true;
}

function contains(value, query) {
  return !query || normalize(value).includes(normalize(query));
}

function countryMatches(values, country) {
  return !country || country === 'All' || values.some((value) => normalize(value) === normalize(country));
}

function resolveCountry(value) {
  const raw = textValue(value);
  if (!raw) return null;
  const normalized = normalize(raw);
  const direct = countryCoordinates[normalized];
  if (direct) return { country: raw, longitude: direct[0], latitude: direct[1] };
  const partial = Object.entries(countryCoordinates).find(([key]) => normalized.includes(key) || key.includes(normalized));
  if (!partial) return null;
  return { country: raw, longitude: partial[1][0], latitude: partial[1][1] };
}

function mapPoint(location) {
  return {
    x: ((location.longitude + 180) / 360) * 820,
    y: ((90 - location.latitude) / 180) * 390,
  };
}

function quantity(item) {
  return Math.max(numberValue(item.quantity), 1);
}

function procurementValue(item) {
  const approved = numberValue(item.approvedPurchaseAmount);
  const purchase = approved || numberValue(item.unitBuyPrice || item.estimatedPurchaseCost) * quantity(item);
  return purchase + numberValue(item.estimatedFreightCost);
}

function orderRevenue(order) {
  return numberValue(order.totalRevenue || order.sellingPrice);
}

function orderProfit(order) {
  return numberValue(order.totalProfit)
    || numberValue(order.sellingPrice) - numberValue(order.purchaseCost);
}

function recordMatches(record, fields, query) {
  return !query || fields.some((field) => contains(record[field], query));
}

function filterData(data, filters) {
  const {
    search = '',
    country = 'All',
    customer = 'All',
    supplier = 'All',
    vehicle = 'All',
    shipmentStatus = 'All',
    procurementStatus = 'All',
    startDate = '',
    endDate = '',
  } = filters;

  const orders = data.orders.filter((order) => (
    (customer === 'All' || order.customerName === customer)
    && (vehicle === 'All' || order.vehicle === vehicle)
    && inDateRange(order.createdAt || order.orderDate, startDate, endDate)
    && recordMatches(order, ['orderNumber', 'customerName', 'vehicle', 'status'], search)
  ));

  const shipments = data.shipments.filter((shipment) => (
    (customer === 'All' || shipment.customerName === customer)
    && (vehicle === 'All' || shipment.vehicle === vehicle)
    && (shipmentStatus === 'All' || shipment.status === shipmentStatus)
    && countryMatches(
      [shipment.destinationCountry, shipment.originCountry, shipment.portOfArrival, shipment.portOfDeparture],
      country,
    )
    && inDateRange(shipment.createdAt || shipment.eta, startDate, endDate)
    && recordMatches(
      shipment,
      ['shipmentId', 'customerName', 'vehicle', 'destinationCountry', 'originCountry', 'status'],
      search,
    )
  ));

  const procurements = data.procurementRequests.filter((request) => (
    (supplier === 'All' || request.supplierName === supplier)
    && (vehicle === 'All' || `${request.vehicleBrand} ${request.vehicleModel}`.trim() === vehicle)
    && (procurementStatus === 'All' || request.status === procurementStatus)
    && countryMatches([request.supplierCountry], country)
    && inDateRange(request.createdAt, startDate, endDate)
    && recordMatches(
      request,
      ['procurementId', 'vehicleBrand', 'vehicleModel', 'supplierName', 'supplierCountry', 'status'],
      search,
    )
  ));

  const customers = data.customers.filter((item) => (
    (customer === 'All' || item.name === customer)
    && countryMatches([item.country, item.location], country)
    && inDateRange(item.createdAt, startDate, endDate)
    && recordMatches(item, ['name', 'country', 'city', 'location', 'email'], search)
  ));

  const suppliers = data.suppliers.filter((item) => (
    (supplier === 'All' || item.supplierName === supplier)
    && countryMatches([item.country], country)
    && inDateRange(item.createdAt, startDate, endDate)
    && recordMatches(item, ['supplierName', 'country', 'contactPerson', 'email'], search)
  ));

  const vehicles = data.vehicles.filter((item) => {
    const label = `${item.brand} ${item.model}`.trim();
    return (
      (vehicle === 'All' || label === vehicle)
      && inDateRange(item.createdAt, startDate, endDate)
      && recordMatches(item, ['id', 'brand', 'model', 'category', 'status', 'lifecycleStatus'], search)
    );
  });

  const linkedOrderIds = new Set(orders.map((item) => item.id));
  const financeRecords = data.financeRecords.filter((record) => (
    (!record.orderId || linkedOrderIds.has(record.orderId) || (!customer || customer === 'All'))
    && inDateRange(record.createdAt || record.updatedAt, startDate, endDate)
    && recordMatches(record, ['paymentStatus', 'invoiceStatus', 'notes'], search)
  ));
  const documents = data.documents.filter((document) => (
    inDateRange(document.uploadedAt, startDate, endDate)
    && recordMatches(document, ['fileName', 'category', 'linkedModule', 'linkedRecordId'], search)
  ));

  return {
    vehicles,
    orders,
    customers,
    shipments,
    procurementRequests: procurements,
    suppliers,
    financeRecords,
    documents,
  };
}

function buildFlow(data) {
  const procurementCount = data.procurementRequests
    .filter((item) => !terminalProcurementStatuses.has(item.status))
    .reduce((sum, item) => sum + quantity(item), 0);
  const inventoryCount = data.vehicles.reduce((sum, item) => sum + numberValue(item.quantity), 0);
  const assignedOrders = data.orders
    .filter((item) => !['Inquiry', 'Completed', 'Delivered'].includes(item.status))
    .reduce((sum, item) => sum + quantity(item), 0);
  const activeShipments = data.shipments
    .filter((item) => !terminalShipmentStatuses.has(item.status))
    .reduce((sum, item) => sum + quantity(item), 0);
  const deliveries = data.shipments
    .filter((item) => item.status === 'Delivered')
    .reduce((sum, item) => sum + quantity(item), 0);
  const paid = data.financeRecords.filter((item) => item.paymentStatus === 'Paid').length;

  return [
    { id: 'procurement', label: 'Procurement', count: procurementCount, page: 'Procurement' },
    { id: 'inventory', label: 'Inventory', count: inventoryCount, page: 'Inventory' },
    { id: 'orders', label: 'Order Assignment', count: assignedOrders, page: 'Orders' },
    { id: 'shipments', label: 'Shipment', count: activeShipments, page: 'Shipments' },
    { id: 'delivery', label: 'Delivery', count: deliveries, page: 'Shipments' },
    { id: 'payment', label: 'Payment', count: paid, page: 'Finance' },
  ];
}

function buildBottlenecks(data) {
  const now = new Date();
  const delayedProcurements = data.procurementRequests.filter((item) => {
    if (terminalProcurementStatuses.has(item.status)) return false;
    const reference = dateValue(item.expectedDeliveryDate || item.createdAt);
    return item.status === 'Delayed' || (reference && (now - reference) / 86400000 > 14);
  });
  const delayedShipments = data.shipments.filter((item) => (
    !terminalShipmentStatuses.has(item.status)
    && (item.status === 'Delayed' || (item.eta && new Date(item.eta) < now))
  ));
  const outstanding = data.financeRecords.filter((item) => numberValue(item.amountPending) > 0);
  const lowStock = data.vehicles.filter((item) => numberValue(item.quantity) <= 1);

  return [
    {
      id: 'procurement-delay',
      stage: 'Procurement',
      severity: delayedProcurements.length > 3 ? 'Critical' : 'High',
      count: delayedProcurements.length,
      title: 'Procurement delays',
      explanation: 'Open acquisition records have exceeded the expected sourcing or delivery window.',
      page: 'Procurement',
      records: delayedProcurements,
    },
    {
      id: 'shipment-delay',
      stage: 'Shipment',
      severity: delayedShipments.length > 2 ? 'Critical' : 'High',
      count: delayedShipments.length,
      title: 'Shipment delays',
      explanation: 'Active shipments have missed ETA or are explicitly marked as delayed.',
      page: 'Shipments',
      records: delayedShipments,
    },
    {
      id: 'outstanding-payment',
      stage: 'Payment',
      severity: outstanding.some((item) => item.paymentStatus === 'Overdue') ? 'Critical' : 'Medium',
      count: outstanding.length,
      value: outstanding.reduce((sum, item) => sum + numberValue(item.amountPending), 0),
      title: 'Outstanding payments',
      explanation: 'Revenue has been recorded but customer payments remain partially or fully uncollected.',
      page: 'Finance',
      records: outstanding,
    },
    {
      id: 'inventory-shortage',
      stage: 'Inventory',
      severity: lowStock.some((item) => numberValue(item.quantity) === 0) ? 'Critical' : 'Medium',
      count: lowStock.length,
      title: 'Inventory shortages',
      explanation: 'Vehicle models at zero or one unit may interrupt order fulfilment.',
      page: 'Inventory',
      records: lowStock,
    },
  ].filter((item) => item.count > 0);
}

function buildMap(data) {
  const points = [];
  const routes = [];
  const maxPoints = 500;
  const maxRoutes = 250;
  const addPoint = (type, label, country, meta, page, record) => {
    if (points.length >= maxPoints) return null;
    const location = resolveCountry(country);
    if (!location) return null;
    const point = {
      id: `${type}-${points.length}-${normalize(label)}`,
      type,
      label,
      meta,
      page,
      record,
      ...location,
      ...mapPoint(location),
    };
    points.push(point);
    return point;
  };

  data.customers.forEach((item) => addPoint(
    'Customer',
    item.name,
    item.country || item.location,
    item.city || item.email,
    'Customers',
    item,
  ));
  data.suppliers.forEach((item) => addPoint(
    'Supplier',
    item.supplierName,
    item.country,
    item.contactPerson || item.email,
    'Procurement',
    item,
  ));
  data.shipments.forEach((item) => {
    const origin = addPoint(
      'Origin',
      item.originCity || item.portOfDeparture || item.originCountry || 'Shipment origin',
      item.originCountry || item.portOfDeparture || 'South Korea',
      item.shipmentId,
      'Shipments',
      item,
    );
    const destination = addPoint(
      'Destination',
      item.destinationCity || item.portOfArrival || item.destinationCountry,
      item.destinationCountry || item.portOfArrival,
      `${item.shipmentId} - ${item.status}`,
      'Shipments',
      item,
    );
    if (origin && destination && routes.length < maxRoutes) {
      routes.push({
        id: `route-${item.shipmentId}`,
        label: item.shipmentId,
        status: item.status,
        origin,
        destination,
        page: 'Shipments',
        record: item,
      });
    }
  });

  return {
    points,
    routes,
    shapes: worldShapes,
    truncated: points.length >= maxPoints || routes.length >= maxRoutes,
  };
}

function buildRelationshipGraph(data, limit = 120) {
  const nodes = [];
  const edges = [];
  const nodeIds = new Set();
  const addNode = (node) => {
    if (nodeIds.has(node.id) || nodes.length >= limit) return false;
    nodeIds.add(node.id);
    nodes.push(node);
    return true;
  };
  const addEdge = (source, target, relationship) => {
    if (nodeIds.has(source) && nodeIds.has(target) && edges.length < limit * 2) {
      edges.push({ id: `${source}-${target}-${relationship}`, source, target, relationship });
    }
  };
  const perTypeLimit = Math.max(Math.floor(limit / 6), 1);

  data.customers.slice(0, perTypeLimit).forEach((item) => addNode({
    id: `customer:${normalize(item.id || item.name)}`,
    type: 'Customer',
    label: item.name,
    page: 'Customers',
    record: item,
  }));
  data.suppliers.slice(0, perTypeLimit).forEach((item) => addNode({
    id: `supplier:${normalize(item.id || item.supplierName)}`,
    type: 'Supplier',
    label: item.supplierName,
    page: 'Procurement',
    record: item,
  }));
  data.vehicles.slice(0, perTypeLimit).forEach((item) => addNode({
    id: `vehicle:${normalize(item.id || `${item.brand}-${item.model}`)}`,
    type: 'Vehicle',
    label: `${item.brand} ${item.model}`.trim(),
    page: 'Inventory',
    record: item,
  }));
  data.orders.slice(0, perTypeLimit).forEach((item) => addNode({
    id: `order:${item.id}`,
    type: 'Order',
    label: `Order ${item.orderNumber}`,
    page: 'Orders',
    record: item,
  }));
  data.procurementRequests.slice(0, perTypeLimit).forEach((item) => addNode({
    id: `procurement:${normalize(item.procurementId)}`,
    type: 'Procurement',
    label: item.procurementId,
    page: 'Procurement',
    record: item,
  }));
  data.shipments.slice(0, perTypeLimit).forEach((item) => addNode({
    id: `shipment:${normalize(item.shipmentId)}`,
    type: 'Shipment',
    label: item.shipmentId,
    page: 'Shipments',
    record: item,
  }));

  data.orders.forEach((item) => {
    const orderId = `order:${item.id}`;
    const customer = data.customers.find((entry) => (
      entry.id === item.customerId || normalize(entry.name) === normalize(item.customerName)
    ));
    const vehicle = data.vehicles.find((entry) => (
      normalize(`${entry.brand} ${entry.model}`) === normalize(item.vehicle)
      || normalize(entry.id) === normalize(item.vehicleId)
    ));
    if (customer) addEdge(`customer:${normalize(customer.id || customer.name)}`, orderId, 'placed');
    if (vehicle) addEdge(orderId, `vehicle:${normalize(vehicle.id || `${vehicle.brand}-${vehicle.model}`)}`, 'assigned');
  });
  data.shipments.forEach((item) => {
    const order = data.orders.find((entry) => entry.id === item.linkedOrderId);
    if (order) addEdge(`order:${order.id}`, `shipment:${normalize(item.shipmentId)}`, 'fulfilled by');
  });
  data.procurementRequests.forEach((item) => {
    const procurementId = `procurement:${normalize(item.procurementId)}`;
    const supplier = data.suppliers.find((entry) => (
      entry.id === item.supplierId || normalize(entry.supplierName) === normalize(item.supplierName)
    ));
    const vehicle = data.vehicles.find((entry) => (
      normalize(`${entry.brand} ${entry.model}`) === normalize(`${item.vehicleBrand} ${item.vehicleModel}`)
      || normalize(entry.linkedProcurementId) === normalize(item.procurementId)
    ));
    if (supplier) addEdge(`supplier:${normalize(supplier.id || supplier.supplierName)}`, procurementId, 'supplies');
    if (vehicle) addEdge(procurementId, `vehicle:${normalize(vehicle.id || `${vehicle.brand}-${vehicle.model}`)}`, 'acquired');
  });

  const typeOrder = ['Supplier', 'Procurement', 'Vehicle', 'Customer', 'Order', 'Shipment'];
  const columns = Object.fromEntries(typeOrder.map((type) => [type, nodes.filter((node) => node.type === type)]));
  typeOrder.forEach((type, columnIndex) => {
    const column = columns[type];
    column.forEach((node, rowIndex) => {
      node.x = 85 + columnIndex * 145;
      node.y = 55 + ((rowIndex + 1) * 340) / (column.length + 1);
    });
  });

  const totalCandidates = data.customers.length
    + data.suppliers.length
    + data.vehicles.length
    + data.orders.length
    + data.procurementRequests.length
    + data.shipments.length;
  return { nodes, edges, truncated: totalCandidates > nodes.length };
}

function buildActivity(data) {
  return [
    ...data.orders.map((item) => ({
      id: `order-${item.id}`,
      module: 'Orders',
      title: `Order ${item.orderNumber} is ${item.status}`,
      detail: `${item.customerName} - ${item.vehicle}`,
      time: item.createdAt || item.orderDate,
      page: 'Orders',
      record: item,
    })),
    ...data.shipments.map((item) => ({
      id: `shipment-${item.shipmentId}`,
      module: 'Shipments',
      title: `${item.shipmentId} is ${item.status}`,
      detail: `${item.originCountry || 'Origin'} to ${item.destinationCountry || 'Destination'}`,
      time: item.createdAt || item.eta,
      page: 'Shipments',
      record: item,
    })),
    ...data.procurementRequests.map((item) => ({
      id: `procurement-${item.procurementId}`,
      module: 'Procurement',
      title: `${item.procurementId} is ${item.status}`,
      detail: `${item.vehicleBrand} ${item.vehicleModel} - ${item.supplierName || 'Supplier pending'}`,
      time: item.createdAt,
      page: 'Procurement',
      record: item,
    })),
    ...data.financeRecords.map((item) => ({
      id: `finance-${item.id}`,
      module: 'Finance',
      title: `${item.paymentStatus} finance record`,
      detail: item.invoiceStatus || 'Finance activity',
      time: item.updatedAt || item.createdAt,
      page: 'Finance',
      record: item,
    })),
    ...data.documents.map((item) => ({
      id: `document-${item.id}`,
      module: 'Documents',
      title: item.fileName || 'Document uploaded',
      detail: item.category || item.linkedModule || 'Company document',
      time: item.uploadedAt,
      page: 'Documents',
      record: item,
    })),
  ].sort((left, right) => new Date(right.time || 0) - new Date(left.time || 0));
}

function buildVehicleLifecycle(data) {
  const procurementQuantity = (statuses) => data.procurementRequests
    .filter((item) => statuses.includes(item.status))
    .reduce((sum, item) => sum + quantity(item), 0);
  const vehicleQuantity = (statuses) => data.vehicles
    .filter((item) => statuses.includes(item.lifecycleStatus || item.status))
    .reduce((sum, item) => sum + numberValue(item.quantity), 0);
  const shipmentQuantity = (statuses) => data.shipments
    .filter((item) => statuses.includes(item.status))
    .reduce((sum, item) => sum + quantity(item), 0);

  return [
    { id: 'planned', label: 'Planned', count: procurementQuantity(['Requested', 'Supplier Identified', 'Negotiation', 'Approved']), page: 'Procurement' },
    { id: 'procured', label: 'Procured', count: procurementQuantity(['Purchased', 'In Transit', 'Arrived', 'Received']), page: 'Procurement' },
    { id: 'inventory', label: 'Inventory', count: vehicleQuantity(['In Inventory', 'Available']), page: 'Inventory' },
    { id: 'reserved', label: 'Reserved', count: vehicleQuantity(['Reserved']), page: 'Inventory' },
    { id: 'sold', label: 'Sold', count: vehicleQuantity(['Sold']), page: 'Inventory' },
    { id: 'shipped', label: 'Shipped', count: shipmentQuantity(['Loaded', 'In Transit', 'Customs Clearance']), page: 'Shipments' },
    { id: 'delivered', label: 'Delivered', count: shipmentQuantity(['Delivered']), page: 'Shipments' },
  ];
}

function buildHealth(data) {
  const revenue = data.financeRecords.length
    ? data.financeRecords.reduce((sum, item) => sum + numberValue(item.totalSaleAmount), 0)
    : data.orders.reduce((sum, item) => sum + orderRevenue(item), 0);
  const profit = data.financeRecords.length
    ? data.financeRecords.reduce((sum, item) => sum + numberValue(item.netProfit), 0)
    : data.orders.reduce((sum, item) => sum + orderProfit(item), 0);
  const completedProcurements = data.procurementRequests.filter((item) => terminalProcurementStatuses.has(item.status)).length;
  const activeCustomers = data.customers.filter((item) => {
    const created = dateValue(item.createdAt);
    return !created || (new Date() - created) / 86400000 <= 90;
  }).length;

  return {
    revenue,
    profit,
    activeOrders: data.orders.filter((item) => item.status !== 'Completed').length,
    activeShipments: data.shipments.filter((item) => !terminalShipmentStatuses.has(item.status)).length,
    procurementEfficiency: data.procurementRequests.length
      ? Math.round((completedProcurements / data.procurementRequests.length) * 100)
      : 100,
    customerActivity: data.customers.length
      ? Math.round((activeCustomers / data.customers.length) * 100)
      : 100,
  };
}

export function getDigitalTwinFilterOptions(data) {
  const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  return {
    countries: unique([
      ...data.customers.map((item) => item.country || item.location),
      ...data.suppliers.map((item) => item.country),
      ...data.shipments.flatMap((item) => [item.originCountry, item.destinationCountry]),
      ...data.procurementRequests.map((item) => item.supplierCountry),
    ]),
    customers: unique(data.customers.map((item) => item.name)),
    suppliers: unique(data.suppliers.map((item) => item.supplierName)),
    vehicles: unique([
      ...data.vehicles.map((item) => `${item.brand} ${item.model}`.trim()),
      ...data.orders.map((item) => item.vehicle),
      ...data.procurementRequests.map((item) => `${item.vehicleBrand} ${item.vehicleModel}`.trim()),
    ]),
    shipmentStatuses: unique(data.shipments.map((item) => item.status)),
    procurementStatuses: unique(data.procurementRequests.map((item) => item.status)),
  };
}

export function buildDigitalTwin(data, filters = {}) {
  const scoped = filterData({
    vehicles: data.vehicles || [],
    orders: data.orders || [],
    customers: data.customers || [],
    shipments: data.shipments || [],
    procurementRequests: data.procurementRequests || [],
    suppliers: data.suppliers || [],
    financeRecords: data.financeRecords || [],
    documents: data.documents || [],
  }, filters);

  return {
    generatedAt: new Date().toISOString(),
    filters,
    counts: Object.fromEntries(Object.entries(scoped).map(([key, rows]) => [key, rows.length])),
    flow: buildFlow(scoped),
    map: buildMap(scoped),
    graph: buildRelationshipGraph(scoped),
    bottlenecks: buildBottlenecks(scoped),
    health: buildHealth(scoped),
    activity: buildActivity(scoped),
    vehicleLifecycle: buildVehicleLifecycle(scoped),
  };
}

export function buildDigitalTwinAiContext(data, filters = {}) {
  const twin = buildDigitalTwin(data, filters);
  return {
    generatedAt: twin.generatedAt,
    health: twin.health,
    flow: twin.flow.map(({ id, label, count }) => ({ id, label, count })),
    bottlenecks: twin.bottlenecks.map(({ id, title, stage, severity, count, value, explanation }) => ({
      id,
      title,
      stage,
      severity,
      count,
      value: value || 0,
      explanation,
    })),
    relationships: {
      nodes: twin.graph.nodes.length,
      edges: twin.graph.edges.length,
      truncated: twin.graph.truncated,
    },
    activity: twin.activity.slice(0, 25).map(({ module, title, detail, time }) => ({
      module,
      title,
      detail,
      time,
    })),
  };
}
