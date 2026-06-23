function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function searchDocument(module, page, title, subtitle, keywords = []) {
  return {
    module,
    page,
    title,
    subtitle,
    searchText: normalize([module, title, subtitle, ...keywords].join(' ')),
  };
}

export function buildSearchIndex({
  vehicles = [],
  orders = [],
  quotes = [],
  customers = [],
  shipments = [],
  logisticsPartners = [],
  procurementRequests = [],
  suppliers = [],
  financeRecords = [],
  documents = [],
}) {
  return [
    ...vehicles.map((item) => searchDocument(
      'Vehicle',
      'Inventory',
      `${item.brand} ${item.model}`,
      `${item.id} - ${item.status}`,
      [item.category, item.locationName],
    )),
    ...orders.map((item) => searchDocument(
      'Order',
      'Orders',
      `Order ${item.orderNumber}`,
      `${item.customerName} - ${item.status}`,
      [item.vehicle, item.locationName],
    )),
    ...quotes.map((item) => searchDocument(
      'Quote',
      'Quotes',
      item.quoteId,
      `${item.customerName} - ${item.status}`,
      [item.vehicle],
    )),
    ...customers.map((item) => searchDocument(
      'Customer',
      'Customers',
      item.name,
      `${item.email || 'No email'} - ${item.location || 'No city'}`,
      [item.phone, item.notes],
    )),
    ...shipments.map((item) => searchDocument(
      'Shipment',
      'Shipments',
      item.shipmentId,
      `${item.destinationCountry} - ${item.status}`,
      [item.customerName, item.vehicle, item.shippingCompany],
    )),
    ...logisticsPartners.map((item) => searchDocument(
      'Logistics Partner',
      'Shipments',
      item.partnerName,
      `${item.country || 'No country'} - ${item.serviceType || 'Logistics'}`,
      [item.contactPerson, item.email],
    )),
    ...procurementRequests.map((item) => searchDocument(
      'Procurement',
      'Procurement',
      item.procurementId,
      `${item.vehicleBrand} ${item.vehicleModel} - ${item.status}`,
      [item.supplierName, item.supplierCountry],
    )),
    ...suppliers.map((item) => searchDocument(
      'Supplier',
      'Procurement',
      item.supplierName,
      `${item.country || 'No country'} - ${item.email || 'No email'}`,
      [item.contactPerson, item.phone],
    )),
    ...financeRecords.map((item) => searchDocument(
      'Finance',
      'Finance',
      `Finance record ${item.id}`,
      `${item.paymentStatus} - ${item.invoiceStatus}`,
      [item.orderId, item.customerId, item.notes],
    )),
    ...documents.map((item) => searchDocument(
      'Document',
      'Documents',
      item.fileName,
      `${item.category} - ${item.linkedModule || 'General'}`,
      [item.linkedRecordId, item.notes],
    )),
    searchDocument(
      'Digital Twin',
      'Digital Twin',
      'Digital Company Twin',
      'Live operation flow, world map, relationships, bottlenecks, and vehicle lifecycle',
      ['company map', 'relationship graph', 'operations', 'health', 'activity'],
    ),
    searchDocument(
      'Time Machine',
      'Time Machine',
      'Company history and Time Machine',
      'Point-in-time company state, comparisons, decision replay, and historical analytics',
      ['history', 'snapshot', 'compare dates', 'historical health', 'timeline', 'decision replay'],
    ),
    searchDocument(
      'Strategy',
      'Strategic War Room',
      'Strategic War Room and future simulations',
      'Forecast revenue, profit, inventory, procurement, shipments, customers, and business risk',
      ['scenario', 'forecast', 'simulation', 'future', 'supplier failure', 'market expansion', 'strategy comparison'],
    ),
    searchDocument(
      'AI COO',
      'AI COO',
      'AI COO Command Center',
      'Daily briefing, company priorities, risks, opportunities, recommendations, and operational scores',
      ['chief operating officer', 'management focus', 'priority board', 'executive briefing', 'customer score', 'supplier score'],
    ),
    searchDocument('Report', 'Reports', 'Business reports', 'Revenue, profit, freight, and inventory exports'),
    searchDocument('Audit', 'Audit Logs', 'Audit logs', 'Operational record activity'),
  ];
}

export function searchIndex(index, query, allowedPages, limit = 10) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  return index
    .filter((result) => allowedPages.includes(result.page))
    .map((result) => ({
      ...result,
      score: terms.reduce((score, term) => {
        if (normalize(result.title).includes(term)) return score + 4;
        if (normalize(result.module).includes(term)) return score + 3;
        return result.searchText.includes(term) ? score + 1 : score;
      }, 0),
    }))
    .filter((result) => result.score > 0 && terms.every((term) => result.searchText.includes(term)))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
