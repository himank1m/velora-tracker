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
