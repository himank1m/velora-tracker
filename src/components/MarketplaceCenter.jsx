import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  Globe2,
  Handshake,
  Network,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
  blankMarketplaceCompany,
  blankMarketplaceOpportunity,
  blankMarketplaceRelationship,
  buildMarketplaceAiInsights,
  buildMarketplaceAnalytics,
  companyToRow,
  filterMarketplaceCompanies,
  marketplaceCompanyTypes,
  marketplaceIndustries,
  marketplaceStatuses,
  opportunityStatuses,
  opportunityToRow,
  opportunityTypes,
  relationshipToRow,
  relationshipTypes,
  rowToCompany,
  rowToOpportunity,
  rowToRelationship,
  sanitizeMarketplaceCompany,
  sanitizeMarketplaceOpportunity,
  sanitizeMarketplaceRelationship,
  seedMarketplaceFromExisting,
} from '../services/marketplaceService';
import '../marketplace.css';

function loadLocal(key, mapper) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]').map(mapper);
  } catch {
    return [];
  }
}

function saveLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function MarketMetric({ icon: Icon, label, value, detail, tone = '' }) {
  return (
    <article className={`market-metric ${tone}`}>
      <span><Icon size={18} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{detail}</em>
      </div>
    </article>
  );
}

function MarketplaceCenter({
  user,
  companyId,
  suppliers = [],
  logisticsPartners = [],
  ecosystemCompanies = [],
  ecosystemRelationships = [],
  canManage = false,
}) {
  const seeded = useMemo(
    () => seedMarketplaceFromExisting({ suppliers, logisticsPartners, companies: ecosystemCompanies, relationships: ecosystemRelationships }),
    [ecosystemCompanies, ecosystemRelationships, logisticsPartners, suppliers],
  );
  const [companies, setCompanies] = useState(() => loadLocal('velora-marketplace-companies', sanitizeMarketplaceCompany));
  const [opportunities, setOpportunities] = useState(() => loadLocal('velora-marketplace-opportunities', sanitizeMarketplaceOpportunity));
  const [relationships, setRelationships] = useState(() => loadLocal('velora-marketplace-relationships', sanitizeMarketplaceRelationship));
  const [companyForm, setCompanyForm] = useState(blankMarketplaceCompany);
  const [opportunityForm, setOpportunityForm] = useState(blankMarketplaceOpportunity);
  const [relationshipForm, setRelationshipForm] = useState(blankMarketplaceRelationship);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [notice, setNotice] = useState('');
  const [syncAvailable, setSyncAvailable] = useState(true);

  const allCompanies = useMemo(() => {
    const existingIds = new Set(companies.map((company) => company.id));
    return [...companies, ...seeded.companies.filter((company) => !existingIds.has(company.id))];
  }, [companies, seeded.companies]);
  const allRelationships = useMemo(() => {
    const existingIds = new Set(relationships.map((relationship) => relationship.id));
    return [...relationships, ...seeded.relationships.filter((relationship) => !existingIds.has(relationship.id))];
  }, [relationships, seeded.relationships]);
  const regions = useMemo(() => [...new Set(allCompanies.map((company) => company.region || company.country).filter(Boolean))], [allCompanies]);
  const analytics = useMemo(() => buildMarketplaceAnalytics(allCompanies, opportunities, allRelationships), [allCompanies, opportunities, allRelationships]);
  const aiInsights = useMemo(() => buildMarketplaceAiInsights(allCompanies, opportunities, allRelationships), [allCompanies, opportunities, allRelationships]);
  const filteredCompanies = useMemo(
    () => filterMarketplaceCompanies(allCompanies, query, typeFilter, industryFilter, regionFilter),
    [allCompanies, industryFilter, query, regionFilter, typeFilter],
  );
  const mapNodes = allCompanies.slice(0, 18).map((company, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(Math.min(allCompanies.length, 18), 1);
    const radius = index === 0 ? 0 : 38;
    return { ...company, x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
  });
  const mapLines = allRelationships
    .map((relationship) => ({
      ...relationship,
      source: mapNodes.find((node) => node.id === relationship.sourceCompanyId),
      target: mapNodes.find((node) => node.id === relationship.targetCompanyId),
    }))
    .filter((line) => line.source && line.target);

  useEffect(() => {
    let mounted = true;
    async function loadMarketplace() {
      if (!user?.id) return;
      const [companyResult, opportunityResult, relationshipResult] = await Promise.all([
        supabase.from('marketplace_companies').select('*').order('created_at', { ascending: false }),
        supabase.from('marketplace_opportunities').select('*').order('created_at', { ascending: false }),
        supabase.from('marketplace_relationships').select('*').order('created_at', { ascending: false }),
      ]);
      if (!mounted) return;
      if (companyResult.error || opportunityResult.error || relationshipResult.error) {
        setSyncAvailable(false);
        return;
      }
      const mappedCompanies = (companyResult.data || []).map(rowToCompany);
      const mappedOpportunities = (opportunityResult.data || []).map(rowToOpportunity);
      const mappedRelationships = (relationshipResult.data || []).map(rowToRelationship);
      setSyncAvailable(true);
      setCompanies(mappedCompanies);
      setOpportunities(mappedOpportunities);
      setRelationships(mappedRelationships);
      saveLocal('velora-marketplace-companies', mappedCompanies);
      saveLocal('velora-marketplace-opportunities', mappedOpportunities);
      saveLocal('velora-marketplace-relationships', mappedRelationships);
    }
    loadMarketplace();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  async function saveCompany(event) {
    event.preventDefault();
    if (!canManage) {
      setNotice('Only management can publish marketplace company profiles.');
      return;
    }
    const clean = sanitizeMarketplaceCompany(companyForm);
    if (!clean.name) {
      setNotice('Add a company name before saving.');
      return;
    }
    let saved = clean;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const { data, error } = await supabase.from('marketplace_companies').insert(companyToRow(clean, user.id, companyId)).select().single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        saved = rowToCompany(data);
      }
    }
    const next = [saved, ...companies];
    setCompanies(next);
    saveLocal('velora-marketplace-companies', next);
    setCompanyForm(blankMarketplaceCompany);
    setNotice(synced ? 'Marketplace company saved.' : 'Company saved locally. Run the Phase 20 SQL migration to enable Supabase sync.');
  }

  async function saveOpportunity(event) {
    event.preventDefault();
    if (!canManage) {
      setNotice('Only management can publish marketplace opportunities.');
      return;
    }
    const clean = sanitizeMarketplaceOpportunity(opportunityForm);
    if (!clean.title) {
      setNotice('Add an opportunity title before publishing.');
      return;
    }
    let saved = clean;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const { data, error } = await supabase.from('marketplace_opportunities').insert(opportunityToRow(clean, user.id, companyId)).select().single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        saved = rowToOpportunity(data);
      }
    }
    const next = [saved, ...opportunities];
    setOpportunities(next);
    saveLocal('velora-marketplace-opportunities', next);
    setOpportunityForm(blankMarketplaceOpportunity);
    setNotice(synced ? 'Opportunity published.' : 'Opportunity saved locally.');
  }

  async function saveRelationship(event) {
    event.preventDefault();
    if (!canManage) {
      setNotice('Only management can create marketplace relationships.');
      return;
    }
    const clean = sanitizeMarketplaceRelationship(relationshipForm);
    if (!clean.sourceCompanyId || !clean.targetCompanyId || clean.sourceCompanyId === clean.targetCompanyId) {
      setNotice('Choose two different companies before creating a relationship.');
      return;
    }
    let saved = clean;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const { data, error } = await supabase.from('marketplace_relationships').insert(relationshipToRow(clean, user.id, companyId)).select().single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        saved = rowToRelationship(data);
      }
    }
    const next = [saved, ...relationships];
    setRelationships(next);
    saveLocal('velora-marketplace-relationships', next);
    setRelationshipForm(blankMarketplaceRelationship);
    setNotice(synced ? 'Relationship created.' : 'Relationship saved locally.');
  }

  return (
    <div className="market-page">
      <header className="section-heading page-header">
        <div>
          <p className="eyebrow">Ecosystem Marketplace</p>
          <h1>Business network exchange</h1>
          <p className="page-description">Discover suppliers, logistics providers, partners, opportunities, and strategic relationships across the Velora business ecosystem.</p>
        </div>
        <div className="market-sync-card">
          <ShieldCheck size={18} />
          <span>{syncAvailable ? 'Supabase synced' : 'Local fallback'}</span>
        </div>
      </header>

      {notice && <div className="inline-alert success">{notice}</div>}

      <section className="market-metrics-grid">
        <MarketMetric icon={BriefcaseBusiness} label="Active opportunities" value={analytics.activeOpportunities} detail="Open or reviewing" />
        <MarketMetric icon={Building2} label="Suppliers discovered" value={analytics.suppliersDiscovered} detail="Sourcing network" />
        <MarketMetric icon={Handshake} label="Partnerships" value={analytics.partnershipsCreated} detail="Active strategic links" />
        <MarketMetric icon={Globe2} label="Ecosystem growth" value={analytics.ecosystemGrowth} detail="Companies in network" />
      </section>

      <section className="market-grid main">
        <div className="market-panel">
          <div className="market-panel-heading">
            <div>
              <p className="eyebrow">Marketplace search</p>
              <h2>Discover companies, suppliers, logistics providers, and partners</h2>
            </div>
          </div>
          <div className="market-filter-bar">
            <label className="market-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search marketplace" /></label>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All</option>{marketplaceCompanyTypes.map((type) => <option key={type}>{type}</option>)}</select>
            <select value={industryFilter} onChange={(event) => setIndustryFilter(event.target.value)}><option>All</option>{marketplaceIndustries.map((industry) => <option key={industry}>{industry}</option>)}</select>
            <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}><option>All</option>{regions.map((region) => <option key={region}>{region}</option>)}</select>
          </div>
          <div className="market-company-grid">
            {filteredCompanies.map((company) => (
              <article key={company.id}>
                <div className="market-company-head">
                  <span>{company.name.slice(0, 2).toUpperCase()}</span>
                  <strong>{company.name}</strong>
                </div>
                <p>{company.description || company.services || 'Marketplace company profile.'}</p>
                <footer>
                  <em>{company.companyType}</em>
                  <em>{company.industry}</em>
                  <em>{company.region || company.country || 'Global'}</em>
                  <em>{company.status}</em>
                </footer>
              </article>
            ))}
            {!filteredCompanies.length && <div className="empty-state"><Building2 size={28} /><strong>No companies found</strong><span>Add marketplace companies or adjust filters.</span></div>}
          </div>
        </div>
        <aside className="market-panel">
          <p className="eyebrow">AI COO ecosystem intelligence</p>
          <h2>Network recommendations</h2>
          <div className="market-insight-list">
            {aiInsights.map((item) => (
              <article key={item.title}>
                <span className={`market-priority ${item.priority.toLowerCase()}`}>{item.priority}</span>
                <div><strong>{item.title}</strong><p>{item.detail}</p></div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="market-grid two">
        <div className="market-panel">
          <div className="market-panel-heading">
            <div>
              <p className="eyebrow">Business network map</p>
              <h2>Connected ecosystem</h2>
            </div>
            <span className="market-map-count">{mapNodes.length} nodes - {mapLines.length} links</span>
          </div>
          <svg className="market-network-map" viewBox="0 0 100 100" role="img" aria-label="Marketplace business network map">
            {mapLines.map((line) => <line key={line.id} x1={line.source.x} y1={line.source.y} x2={line.target.x} y2={line.target.y} />)}
            {mapNodes.map((node) => (
              <g key={node.id}>
                <circle cx={node.x} cy={node.y} r="5.5" />
                <text x={node.x} y={node.y + 1.2}>{node.name.slice(0, 2).toUpperCase()}</text>
              </g>
            ))}
          </svg>
        </div>
        <div className="market-panel">
          <p className="eyebrow">Opportunity exchange</p>
          <h2>Open business opportunities</h2>
          <div className="market-opportunity-list">
            {opportunities.slice(0, 8).map((opportunity) => (
              <article key={opportunity.id}>
                <BriefcaseBusiness size={17} />
                <div><strong>{opportunity.title}</strong><small>{opportunity.opportunityType} - {opportunity.region || 'Global'} - {opportunity.status}</small></div>
              </article>
            ))}
            {!opportunities.length && <p className="market-muted">No opportunities published yet.</p>}
          </div>
        </div>
      </section>

      <section className="market-grid three">
        <form className="market-panel market-form" onSubmit={saveCompany}>
          <p className="eyebrow">Company profiles</p>
          <h2>Add marketplace company</h2>
          <label><span>Name</span><input value={companyForm.name} onChange={(event) => setCompanyForm((value) => ({ ...value, name: event.target.value }))} /></label>
          <label><span>Description</span><textarea value={companyForm.description} onChange={(event) => setCompanyForm((value) => ({ ...value, description: event.target.value }))} /></label>
          <div className="market-form-row">
            <label><span>Type</span><select value={companyForm.companyType} onChange={(event) => setCompanyForm((value) => ({ ...value, companyType: event.target.value }))}>{marketplaceCompanyTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span>Industry</span><select value={companyForm.industry} onChange={(event) => setCompanyForm((value) => ({ ...value, industry: event.target.value }))}>{marketplaceIndustries.map((industry) => <option key={industry}>{industry}</option>)}</select></label>
          </div>
          <div className="market-form-row">
            <label><span>Country</span><input value={companyForm.country} onChange={(event) => setCompanyForm((value) => ({ ...value, country: event.target.value }))} /></label>
            <label><span>Region</span><input value={companyForm.region} onChange={(event) => setCompanyForm((value) => ({ ...value, region: event.target.value }))} /></label>
          </div>
          <label><span>Services</span><input value={companyForm.services} onChange={(event) => setCompanyForm((value) => ({ ...value, services: event.target.value }))} /></label>
          <label><span>Contact email</span><input type="email" value={companyForm.contactEmail} onChange={(event) => setCompanyForm((value) => ({ ...value, contactEmail: event.target.value }))} /></label>
          <button type="submit" disabled={!canManage}><Send size={16} />Save company</button>
        </form>

        <form className="market-panel market-form" onSubmit={saveOpportunity}>
          <p className="eyebrow">Opportunities</p>
          <h2>Publish opportunity</h2>
          <label><span>Title</span><input value={opportunityForm.title} onChange={(event) => setOpportunityForm((value) => ({ ...value, title: event.target.value }))} /></label>
          <label><span>Description</span><textarea value={opportunityForm.description} onChange={(event) => setOpportunityForm((value) => ({ ...value, description: event.target.value }))} /></label>
          <div className="market-form-row">
            <label><span>Type</span><select value={opportunityForm.opportunityType} onChange={(event) => setOpportunityForm((value) => ({ ...value, opportunityType: event.target.value }))}>{opportunityTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span>Status</span><select value={opportunityForm.status} onChange={(event) => setOpportunityForm((value) => ({ ...value, status: event.target.value }))}>{opportunityStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          </div>
          <div className="market-form-row">
            <label><span>Region</span><input value={opportunityForm.region} onChange={(event) => setOpportunityForm((value) => ({ ...value, region: event.target.value }))} /></label>
            <label><span>Service type</span><input value={opportunityForm.serviceType} onChange={(event) => setOpportunityForm((value) => ({ ...value, serviceType: event.target.value }))} /></label>
          </div>
          <label><span>Budget range</span><input value={opportunityForm.budgetRange} onChange={(event) => setOpportunityForm((value) => ({ ...value, budgetRange: event.target.value }))} /></label>
          <button type="submit" disabled={!canManage}><BriefcaseBusiness size={16} />Publish opportunity</button>
        </form>

        <form className="market-panel market-form" onSubmit={saveRelationship}>
          <p className="eyebrow">Relationship engine</p>
          <h2>Create partnership link</h2>
          <label><span>Source company</span><select value={relationshipForm.sourceCompanyId} onChange={(event) => setRelationshipForm((value) => ({ ...value, sourceCompanyId: event.target.value }))}><option value="">Choose source</option>{allCompanies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
          <label><span>Target company</span><select value={relationshipForm.targetCompanyId} onChange={(event) => setRelationshipForm((value) => ({ ...value, targetCompanyId: event.target.value }))}><option value="">Choose target</option>{allCompanies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
          <label><span>Relationship type</span><select value={relationshipForm.relationshipType} onChange={(event) => setRelationshipForm((value) => ({ ...value, relationshipType: event.target.value }))}>{relationshipTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label><span>Status</span><select value={relationshipForm.status} onChange={(event) => setRelationshipForm((value) => ({ ...value, status: event.target.value }))}>{marketplaceStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label><span>Notes</span><textarea value={relationshipForm.notes} onChange={(event) => setRelationshipForm((value) => ({ ...value, notes: event.target.value }))} /></label>
          <button type="submit" disabled={!canManage}><Handshake size={16} />Create relationship</button>
        </form>
      </section>

      <section className="market-grid two">
        <div className="market-panel">
          <p className="eyebrow">Marketplace analytics</p>
          <h2>Industry and regional distribution</h2>
          <div className="market-distribution-list">
            {analytics.industryDistribution.map((item) => <div key={item.industry}><span>{item.industry}</span><strong>{item.count}</strong><meter min="0" max="10" value={Math.min(10, item.count)}>{item.count}</meter></div>)}
            {analytics.regionalDistribution.map((item) => <div key={item.region}><span>{item.region}</span><strong>{item.count}</strong><meter min="0" max="10" value={Math.min(10, item.count)}>{item.count}</meter></div>)}
          </div>
        </div>
        <div className="market-panel market-foundation-card">
          <Bell size={22} />
          <div>
            <p className="eyebrow">Future commercial foundation</p>
            <h2>Ready for applications, onboarding, and service requests</h2>
            <p>Marketplace records now support supplier onboarding, partnership requests, vendor discovery, opportunity exchange, notifications, and future public listings.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MarketplaceCenter;
