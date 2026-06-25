const nowIso = () => new Date().toISOString();

export const marketplaceCompanyTypes = ['Supplier', 'Logistics Provider', 'Strategic Partner', 'Technology Partner', 'Service Provider', 'Customer', 'Other'];
export const marketplaceStatuses = ['Prospect', 'Active', 'Preferred', 'Strategic', 'Paused', 'Archived'];
export const marketplaceIndustries = ['Automotive', 'Logistics', 'Finance', 'Technology', 'Insurance', 'Parts', 'Inspection', 'Export Services', 'Other'];
export const opportunityTypes = ['Procurement Opportunity', 'Logistics Opportunity', 'Partnership Opportunity', 'Service Request', 'Technology Opportunity'];
export const opportunityStatuses = ['Open', 'Reviewing', 'Matched', 'In Discussion', 'Closed'];
export const relationshipTypes = ['Supplier Connection', 'Logistics Partner', 'Strategic Partnership', 'Technology Partner', 'Service Provider', 'Potential Relationship'];

export const blankMarketplaceCompany = {
  id: '',
  name: '',
  logo: '',
  companyType: 'Supplier',
  industry: 'Automotive',
  description: '',
  services: '',
  country: '',
  region: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  status: 'Prospect',
  rating: 0,
  views: 0,
  createdAt: '',
};

export const blankMarketplaceOpportunity = {
  id: '',
  title: '',
  opportunityType: 'Procurement Opportunity',
  description: '',
  region: '',
  industry: 'Automotive',
  serviceType: '',
  budgetRange: '',
  status: 'Open',
  priority: 'Medium',
  postedBy: '',
  views: 0,
  createdAt: '',
};

export const blankMarketplaceRelationship = {
  id: '',
  sourceCompanyId: '',
  targetCompanyId: '',
  relationshipType: 'Potential Relationship',
  status: 'Prospect',
  strategicValue: 'Medium',
  notes: '',
  createdAt: '',
};

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function numberValue(value) {
  return Number(String(value ?? '').replace(/,/g, '')) || 0;
}

function listText(value) {
  return Array.isArray(value) ? value.join(', ') : String(value || '');
}

export function sanitizeMarketplaceCompany(company = {}) {
  return {
    ...blankMarketplaceCompany,
    ...company,
    id: company.id || uid('market-company'),
    name: String(company.name || '').trim(),
    companyType: marketplaceCompanyTypes.includes(company.companyType) ? company.companyType : 'Supplier',
    industry: marketplaceIndustries.includes(company.industry) ? company.industry : 'Automotive',
    services: listText(company.services),
    status: marketplaceStatuses.includes(company.status) ? company.status : 'Prospect',
    rating: Math.min(5, Math.max(0, Number(company.rating) || 0)),
    views: numberValue(company.views),
    createdAt: company.createdAt || company.created_at || nowIso(),
  };
}

export function sanitizeMarketplaceOpportunity(opportunity = {}) {
  return {
    ...blankMarketplaceOpportunity,
    ...opportunity,
    id: opportunity.id || uid('market-opp'),
    title: String(opportunity.title || '').trim(),
    opportunityType: opportunityTypes.includes(opportunity.opportunityType) ? opportunity.opportunityType : 'Procurement Opportunity',
    industry: marketplaceIndustries.includes(opportunity.industry) ? opportunity.industry : 'Automotive',
    status: opportunityStatuses.includes(opportunity.status) ? opportunity.status : 'Open',
    views: numberValue(opportunity.views),
    createdAt: opportunity.createdAt || opportunity.created_at || nowIso(),
  };
}

export function sanitizeMarketplaceRelationship(relationship = {}) {
  return {
    ...blankMarketplaceRelationship,
    ...relationship,
    id: relationship.id || uid('market-rel'),
    relationshipType: relationshipTypes.includes(relationship.relationshipType) ? relationship.relationshipType : 'Potential Relationship',
    status: marketplaceStatuses.includes(relationship.status) ? relationship.status : 'Prospect',
    createdAt: relationship.createdAt || relationship.created_at || nowIso(),
  };
}

export function companyToRow(company, userId, companyId) {
  return {
    name: company.name,
    logo: company.logo || '',
    company_type: company.companyType,
    industry: company.industry,
    description: company.description,
    services: company.services,
    country: company.country,
    region: company.region,
    contact_name: company.contactName,
    contact_email: company.contactEmail,
    contact_phone: company.contactPhone,
    status: company.status,
    rating: Number(company.rating) || 0,
    views: Number(company.views) || 0,
    owner_company_id: companyId || null,
    created_by: userId || null,
  };
}

export function rowToCompany(row) {
  return sanitizeMarketplaceCompany({
    id: row.id,
    name: row.name,
    logo: row.logo,
    companyType: row.company_type,
    industry: row.industry,
    description: row.description,
    services: row.services,
    country: row.country,
    region: row.region,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    status: row.status,
    rating: row.rating,
    views: row.views,
    createdAt: row.created_at,
  });
}

export function opportunityToRow(opportunity, userId, companyId) {
  return {
    title: opportunity.title,
    opportunity_type: opportunity.opportunityType,
    description: opportunity.description,
    region: opportunity.region,
    industry: opportunity.industry,
    service_type: opportunity.serviceType,
    budget_range: opportunity.budgetRange,
    status: opportunity.status,
    priority: opportunity.priority,
    posted_by: opportunity.postedBy,
    views: Number(opportunity.views) || 0,
    owner_company_id: companyId || null,
    created_by: userId || null,
  };
}

export function rowToOpportunity(row) {
  return sanitizeMarketplaceOpportunity({
    id: row.id,
    title: row.title,
    opportunityType: row.opportunity_type,
    description: row.description,
    region: row.region,
    industry: row.industry,
    serviceType: row.service_type,
    budgetRange: row.budget_range,
    status: row.status,
    priority: row.priority,
    postedBy: row.posted_by,
    views: row.views,
    createdAt: row.created_at,
  });
}

export function relationshipToRow(relationship, userId, companyId) {
  return {
    source_company_id: relationship.sourceCompanyId || null,
    target_company_id: relationship.targetCompanyId || null,
    relationship_type: relationship.relationshipType,
    status: relationship.status,
    strategic_value: relationship.strategicValue,
    notes: relationship.notes,
    owner_company_id: companyId || null,
    created_by: userId || null,
  };
}

export function rowToRelationship(row) {
  return sanitizeMarketplaceRelationship({
    id: row.id,
    sourceCompanyId: row.source_company_id,
    targetCompanyId: row.target_company_id,
    relationshipType: row.relationship_type,
    status: row.status,
    strategicValue: row.strategic_value,
    notes: row.notes,
    createdAt: row.created_at,
  });
}

export function seedMarketplaceFromExisting({ suppliers = [], logisticsPartners = [], companies = [], relationships = [] } = {}) {
  const supplierCompanies = suppliers.map((supplier) => sanitizeMarketplaceCompany({
    id: `supplier-${supplier.id}`,
    name: supplier.supplierName || supplier.name,
    companyType: 'Supplier',
    industry: 'Automotive',
    services: supplier.notes || 'Vehicle sourcing and procurement',
    country: supplier.country || supplier.supplierCountry || '',
    region: supplier.country || '',
    contactName: supplier.contactPerson || '',
    contactEmail: supplier.email || '',
    contactPhone: supplier.phone || '',
    status: 'Active',
    rating: 4,
  }));
  const logisticsCompanies = logisticsPartners.map((partner) => sanitizeMarketplaceCompany({
    id: `logistics-${partner.id}`,
    name: partner.partnerName || partner.name,
    companyType: 'Logistics Provider',
    industry: 'Logistics',
    services: partner.capabilities || partner.notes || 'Freight, customs, and vehicle movement',
    country: partner.country || '',
    region: partner.serviceRegions || partner.country || '',
    contactName: partner.contactPerson || '',
    contactEmail: partner.email || '',
    contactPhone: partner.phone || '',
    status: 'Active',
    rating: 4,
  }));
  const ecosystemCompanies = companies.map((company) => sanitizeMarketplaceCompany({
    id: `ecosystem-${company.id}`,
    name: company.name,
    companyType: company.type || 'Strategic Partner',
    industry: company.industry || 'Automotive',
    description: company.description || '',
    services: company.services || '',
    country: company.country || '',
    region: company.region || company.country || '',
    contactEmail: company.email || '',
    contactPhone: company.phone || '',
    status: 'Strategic',
    rating: 5,
  }));
  const seededRelationships = relationships.map((relationship) => sanitizeMarketplaceRelationship({
    id: `ecosystem-rel-${relationship.id}`,
    sourceCompanyId: `ecosystem-${relationship.fromCompanyId || relationship.sourceCompanyId}`,
    targetCompanyId: `ecosystem-${relationship.toCompanyId || relationship.targetCompanyId}`,
    relationshipType: relationship.relationshipType || relationship.type || 'Strategic Partnership',
    status: 'Strategic',
    strategicValue: relationship.strategicValue || 'High',
    notes: relationship.notes || '',
  }));
  return {
    companies: [...supplierCompanies, ...logisticsCompanies, ...ecosystemCompanies],
    relationships: seededRelationships,
  };
}

export function buildMarketplaceAnalytics(companies = [], opportunities = [], relationships = []) {
  const activeOpportunities = opportunities.filter((item) => item.status === 'Open' || item.status === 'Reviewing');
  const partnerships = relationships.filter((item) => ['Active', 'Preferred', 'Strategic'].includes(item.status));
  const industryDistribution = marketplaceIndustries.map((industry) => ({
    industry,
    count: companies.filter((company) => company.industry === industry).length,
  })).filter((item) => item.count).sort((a, b) => b.count - a.count);
  const regionalDistribution = Object.values(companies.reduce((acc, company) => {
    const region = company.region || company.country || 'Unassigned';
    acc[region] = acc[region] || { region, count: 0 };
    acc[region].count += 1;
    return acc;
  }, {})).sort((a, b) => b.count - a.count);
  return {
    activeOpportunities: activeOpportunities.length,
    suppliersDiscovered: companies.filter((company) => company.companyType === 'Supplier').length,
    partnershipsCreated: partnerships.length,
    ecosystemGrowth: companies.length,
    marketplaceActivity: opportunities.length + relationships.length,
    mostViewedCompanies: [...companies].sort((a, b) => b.views - a.views).slice(0, 5),
    mostViewedOpportunities: [...opportunities].sort((a, b) => b.views - a.views).slice(0, 5),
    industryDistribution,
    regionalDistribution,
  };
}

export function buildMarketplaceAiInsights(companies = [], opportunities = [], relationships = []) {
  const preferredSuppliers = companies.filter((company) => company.companyType === 'Supplier' && ['Preferred', 'Strategic', 'Active'].includes(company.status));
  const growingRegions = buildMarketplaceAnalytics(companies, opportunities, relationships).regionalDistribution.slice(0, 2);
  const highPriorityOpps = opportunities.filter((opportunity) => ['High', 'Critical', 'Strategic'].includes(opportunity.priority) && opportunity.status !== 'Closed');
  const valuablePartners = relationships.filter((relationship) => ['High', 'Strategic'].includes(relationship.strategicValue));
  return [
    {
      title: 'Supplier matches available',
      detail: `${preferredSuppliers.length} active or preferred suppliers can be considered for sourcing needs.`,
      priority: preferredSuppliers.length ? 'High' : 'Medium',
    },
    {
      title: 'Growing regions',
      detail: growingRegions.length ? `${growingRegions.map((item) => item.region).join(', ')} show the strongest ecosystem density.` : 'Regional growth will appear as marketplace profiles expand.',
      priority: 'Medium',
    },
    {
      title: 'Opportunities needing attention',
      detail: `${highPriorityOpps.length} high-priority opportunities are open or under review.`,
      priority: highPriorityOpps.length ? 'High' : 'Low',
    },
    {
      title: 'Strategic partnerships',
      detail: `${valuablePartners.length} relationships are marked high or strategic value.`,
      priority: valuablePartners.length ? 'High' : 'Medium',
    },
  ];
}

export function filterMarketplaceCompanies(companies = [], query = '', type = 'All', industry = 'All', region = 'All') {
  const needle = String(query || '').toLowerCase();
  return companies.filter((company) => {
    const text = [company.name, company.companyType, company.industry, company.region, company.country, company.services, company.description].join(' ').toLowerCase();
    return (!needle || text.includes(needle))
      && (type === 'All' || company.companyType === type)
      && (industry === 'All' || company.industry === industry)
      && (region === 'All' || company.region === region || company.country === region);
  });
}
