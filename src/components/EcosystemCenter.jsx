import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  GitBranch,
  Globe2,
  Handshake,
  HeartPulse,
  Network,
  Plus,
  Route,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { buildEcosystemIntelligence, buildEcosystemNetwork } from '../services/ecosystemService';
import '../ecosystem.css';

const money = (value) =>
  `\u20b9${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;

const blankCompany = {
  name: '',
  industry: '',
  country: '',
  email: '',
  phone: '',
  status: 'Active',
};

const blankRelationship = {
  targetCompanyId: '',
  externalName: '',
  relationshipType: 'Strategic Partner',
  status: 'Active',
  notes: '',
};

const blankTransaction = {
  targetCompanyId: '',
  relationshipId: '',
  transactionType: 'Service',
  amount: 0,
  cost: 0,
  status: 'Planned',
  transactionDate: new Date().toISOString().slice(0, 10),
  notes: '',
};

function Metric({ icon: Icon, label, value, detail, tone = '' }) {
  return (
    <article className={`eco-metric ${tone}`}>
      <span><Icon size={19} /></span>
      <div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div>
    </article>
  );
}

function EcosystemNetwork({ network, onSelect, selected }) {
  const nodeById = Object.fromEntries(network.nodes.map((node) => [node.id, node]));
  return (
    <div className="eco-network-shell">
      <svg viewBox="0 0 820 650" className="eco-network" role="img" aria-label="Business ecosystem relationship map">
        <defs>
          <filter id="eco-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {network.edges.map((edge) => {
          const source = nodeById[edge.source];
          const target = nodeById[edge.target];
          if (!source || !target) return null;
          return (
            <g key={edge.id}>
              <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} className="eco-edge" />
              <text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 5} className="eco-edge-label">{edge.relationship}</text>
            </g>
          );
        })}
        {network.nodes.map((node) => (
          <g
            key={node.id}
            className={`eco-node ${node.type.toLowerCase()} ${selected?.id === node.id ? 'selected' : ''}`}
            onClick={() => onSelect(node)}
            role="button"
            tabIndex="0"
          >
            <circle cx={node.x} cy={node.y} r={node.type === 'Company' ? 34 : 25} filter={node.type === 'Company' ? 'url(#eco-glow)' : undefined} />
            <text x={node.x} y={node.y + 3} textAnchor="middle" className="eco-node-symbol">{node.type === 'Company' ? 'CO' : node.type.slice(0, 2).toUpperCase()}</text>
            <text x={node.x} y={node.y + (node.type === 'Company' ? 51 : 40)} textAnchor="middle" className="eco-node-label">{node.label.slice(0, 24)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal-card eco-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading"><div><p className="eyebrow">Ecosystem administration</p><h2>{title}</h2></div><button onClick={onClose}>Close</button></div>
        {children}
      </section>
    </div>
  );
}

export default function EcosystemCenter({
  companies,
  relationships,
  transactions,
  events,
  currentCompany,
  ready,
  saveCompany,
  saveRelationship,
  saveTransaction,
  vehicles,
  orders,
  customers,
  shipments,
  logisticsPartners,
  procurementRequests,
  suppliers,
  financeRecords,
  canManage,
  canViewFinancials,
}) {
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState('');
  const [company, setCompany] = useState(blankCompany);
  const [relationship, setRelationship] = useState(blankRelationship);
  const [transaction, setTransaction] = useState(blankTransaction);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const operational = useMemo(() => ({
    vehicles,
    orders,
    customers,
    shipments,
    logisticsPartners,
    procurementRequests,
    suppliers,
    financeRecords: canViewFinancials ? financeRecords : [],
  }), [vehicles, orders, customers, shipments, logisticsPartners, procurementRequests, suppliers, financeRecords, canViewFinancials]);
  const intelligence = useMemo(() => buildEcosystemIntelligence({
    companies,
    relationships,
    transactions,
    events,
    currentCompanyId: currentCompany.id,
    operational,
  }), [companies, relationships, transactions, events, currentCompany.id, operational]);
  const network = useMemo(() => buildEcosystemNetwork({
    companies,
    relationships,
    customers,
    suppliers,
    logisticsPartners,
    currentCompanyId: currentCompany.id,
  }), [companies, relationships, customers, suppliers, logisticsPartners, currentCompany.id]);

  const submit = async (type) => {
    setSaving(true);
    setError('');
    try {
      if (type === 'company') {
        await saveCompany(company);
        setCompany(blankCompany);
      }
      if (type === 'relationship') {
        await saveRelationship({ ...relationship, sourceCompanyId: currentCompany.id });
        setRelationship(blankRelationship);
      }
      if (type === 'transaction') {
        await saveTransaction({ ...transaction, sourceCompanyId: currentCompany.id });
        setTransaction(blankTransaction);
      }
      setModal('');
    } catch (saveError) {
      setError(saveError.message || 'The ecosystem record could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page-stack ecosystem-page">
      <header className="eco-hero">
        <div>
          <p className="eyebrow">Velora OS Business Ecosystem</p>
          <h1>One operating universe</h1>
          <p>Understand companies, relationships, transactions, risks, and value creation across the entire Velora network.</p>
        </div>
        <div className="eco-hero-company">
          <span>{currentCompany.name.slice(0, 2).toUpperCase()}</span>
          <div><small>Current operating company</small><strong>{currentCompany.name}</strong><p>{currentCompany.industry || currentCompany.country}</p></div>
        </div>
      </header>

      {!ready && (
        <div className="eco-setup-note">
          <Network size={18} />
          <div><strong>Single-company compatibility mode</strong><span>Run <code>supabase/phase8-business-ecosystem.sql</code> to activate multi-company isolation, relationships, and inter-company operations.</span></div>
        </div>
      )}

      <div className="eco-metric-grid">
        {canViewFinancials && <Metric icon={CircleDollarSign} label="Ecosystem revenue" value={money(intelligence.metrics.revenue)} detail="Operating and inter-company revenue" tone="accent" />}
        {canViewFinancials && <Metric icon={TrendingUp} label="Ecosystem profit" value={money(intelligence.metrics.profit)} detail="Tracked network contribution" tone="success" />}
        <Metric icon={Building2} label="Active companies" value={intelligence.metrics.activeCompanies} detail={`${companies.length} accessible companies`} />
        <Metric icon={Handshake} label="Relationships" value={intelligence.metrics.activeRelationships} detail={`${relationships.length} tracked connections`} />
        <Metric icon={HeartPulse} label="Ecosystem health" value={`${intelligence.metrics.ecosystemHealth}/100`} detail="Company and relationship health" />
      </div>

      <div className="eco-action-bar">
        <div><p className="eyebrow">Network administration</p><strong>Build the connected business graph</strong></div>
        {canManage && <button onClick={() => setModal('company')}><Plus size={16} /> Company</button>}
        {canManage && <button onClick={() => setModal('relationship')}><GitBranch size={16} /> Relationship</button>}
        {canManage && <button onClick={() => setModal('transaction')}><ArrowRight size={16} /> Inter-company activity</button>}
      </div>

      <div className="eco-network-layout">
        <section className="eco-panel">
          <div className="eco-heading"><div><p className="eyebrow">Business network map</p><h2>Connected operating ecosystem</h2><span>Explore companies, suppliers, customers, logistics partners, and strategic relationships.</span></div><Globe2 size={21} /></div>
          <EcosystemNetwork network={network} selected={selected} onSelect={setSelected} />
        </section>
        <aside className="eco-panel eco-selection">
          {selected ? (
            <>
              <span className="eco-entity-type">{selected.type}</span>
              <h2>{selected.label}</h2>
              <p>{selected.meta || 'Connected ecosystem entity'}</p>
              <dl>
                {Object.entries(selected.record || {}).filter(([, value]) => typeof value !== 'object' && value !== '' && value !== null && value !== undefined).slice(0, 7).map(([key, value]) => (
                  <div key={key}><dt>{key.replace(/([A-Z])/g, ' $1')}</dt><dd>{String(value)}</dd></div>
                ))}
              </dl>
            </>
          ) : (
            <div className="eco-empty"><Route size={27} /><strong>Select a network entity</strong><span>Its company or relationship details will appear here.</span></div>
          )}
        </aside>
      </div>

      <div className="eco-analysis-grid">
        <section className="eco-panel">
          <div className="eco-heading"><div><p className="eyebrow">Cross-company analytics</p><h2>Company performance</h2></div><BarChart3 size={20} /></div>
          <div className="eco-company-list">
            {intelligence.companies.map((item, index) => (
              <article key={item.id}>
                <span>{index + 1}</span>
                <div><strong>{item.name}</strong><small>{item.industry || item.country}</small></div>
                {canViewFinancials && <div><small>Revenue</small><b>{money(item.revenue)}</b></div>}
                {canViewFinancials && <div><small>Profit</small><b>{money(item.profit)}</b></div>}
                <div className="eco-health"><small>Health</small><b className={item.healthScore < 50 ? 'low' : ''}>{item.healthScore}/100</b><i><em style={{ width: `${item.healthScore}%` }} /></i></div>
              </article>
            ))}
          </div>
        </section>
        <section className="eco-panel">
          <div className="eco-heading"><div><p className="eyebrow">Relationship engine</p><h2>Strategic network value</h2></div><Handshake size={20} /></div>
          <div className="eco-relationship-list">
            {intelligence.relationships.map((item) => (
              <article key={item.id}>
                <span><Handshake size={16} /></span>
                <div><strong>{item.externalName || companies.find((company) => company.id === item.targetCompanyId)?.name || item.relationshipType}</strong><small>{item.relationshipType} · {item.status}</small></div>
                {canViewFinancials && <div><small>Value</small><b>{money(item.value)}</b></div>}
                <div><small>Score</small><b className={item.score < 45 ? 'low' : ''}>{item.score}/100</b></div>
              </article>
            ))}
            {!intelligence.relationships.length && <div className="eco-empty"><Handshake size={25} /><strong>Relationships will appear here</strong></div>}
          </div>
        </section>
      </div>

      <div className="eco-analysis-grid">
        <section className="eco-panel">
          <div className="eco-heading"><div><p className="eyebrow">Strategic network view</p><h2>Risks and opportunities</h2></div><Sparkles size={20} /></div>
          <div className="eco-insights">
            {intelligence.risks.map((item) => <article className="risk" key={item.id}><span>{item.severity}</span><div><strong>{item.title}</strong><p>{item.explanation}</p></div></article>)}
            {intelligence.opportunities.map((item) => <article className="opportunity" key={item.id}><span>Opportunity</span><div><strong>{item.title}</strong><p>{item.explanation}</p></div></article>)}
            {!intelligence.risks.length && !intelligence.opportunities.length && <div className="eco-empty"><CheckCircle2 size={25} /><strong>The network is stable while history develops</strong></div>}
          </div>
        </section>
        <section className="eco-panel">
          <div className="eco-heading"><div><p className="eyebrow">Ecosystem timeline</p><h2>Activity across connected companies</h2></div><Activity size={20} /></div>
          <div className="eco-timeline">
            {intelligence.timeline.slice(0, 14).map((item) => (
              <article key={item.id}><i /><div><strong>{item.title}</strong><small>{item.type} · {item.detail}</small></div><time>{new Date(item.date).toLocaleDateString('en-IN')}</time></article>
            ))}
            {!intelligence.timeline.length && <div className="eco-empty"><Activity size={25} /><strong>Network activity will form the ecosystem timeline</strong></div>}
          </div>
        </section>
      </div>

      {modal === 'company' && (
        <Modal title="Create company" onClose={() => setModal('')}>
          <div className="form-grid">
            <label className="field"><span>Company name</span><input value={company.name} onChange={(event) => setCompany({ ...company, name: event.target.value })} /></label>
            <label className="field"><span>Industry</span><input value={company.industry} onChange={(event) => setCompany({ ...company, industry: event.target.value })} /></label>
            <label className="field"><span>Country</span><input value={company.country} onChange={(event) => setCompany({ ...company, country: event.target.value })} /></label>
            <label className="field"><span>Email</span><input type="email" value={company.email} onChange={(event) => setCompany({ ...company, email: event.target.value })} /></label>
            <label className="field"><span>Phone</span><input value={company.phone} onChange={(event) => setCompany({ ...company, phone: event.target.value })} /></label>
            <label className="field"><span>Status</span><select value={company.status} onChange={(event) => setCompany({ ...company, status: event.target.value })}><option>Active</option><option>Inactive</option><option>Partner</option></select></label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions"><button onClick={() => setModal('')}>Cancel</button><button disabled={saving || !company.name} onClick={() => submit('company')}>Create company</button></div>
        </Modal>
      )}

      {modal === 'relationship' && (
        <Modal title="Create relationship" onClose={() => setModal('')}>
          <div className="form-grid">
            <label className="field"><span>Connected company</span><select value={relationship.targetCompanyId} onChange={(event) => setRelationship({ ...relationship, targetCompanyId: event.target.value })}><option value="">External organization</option>{companies.filter((item) => item.id !== currentCompany.id).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
            {!relationship.targetCompanyId && <label className="field"><span>External organization name</span><input value={relationship.externalName} onChange={(event) => setRelationship({ ...relationship, externalName: event.target.value })} /></label>}
            <label className="field"><span>Relationship type</span><select value={relationship.relationshipType} onChange={(event) => setRelationship({ ...relationship, relationshipType: event.target.value })}>{['Customer', 'Supplier', 'Logistics', 'Strategic Partner', 'Finance', 'Affiliate'].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="field"><span>Status</span><select value={relationship.status} onChange={(event) => setRelationship({ ...relationship, status: event.target.value })}><option>Active</option><option>Prospective</option><option>Paused</option><option>Ended</option></select></label>
            <label className="field full"><span>Notes</span><textarea value={relationship.notes} onChange={(event) => setRelationship({ ...relationship, notes: event.target.value })} /></label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions"><button onClick={() => setModal('')}>Cancel</button><button disabled={saving || (!relationship.targetCompanyId && !relationship.externalName)} onClick={() => submit('relationship')}>Create relationship</button></div>
        </Modal>
      )}

      {modal === 'transaction' && (
        <Modal title="Record inter-company activity" onClose={() => setModal('')}>
          <div className="form-grid">
            <label className="field"><span>Target company</span><select value={transaction.targetCompanyId} onChange={(event) => setTransaction({ ...transaction, targetCompanyId: event.target.value })}><option value="">Select company</option>{companies.filter((item) => item.id !== currentCompany.id).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
            <label className="field"><span>Relationship</span><select value={transaction.relationshipId} onChange={(event) => setTransaction({ ...transaction, relationshipId: event.target.value })}><option value="">No linked relationship</option>{relationships.map((item) => <option value={item.id} key={item.id}>{item.externalName || item.relationshipType}</option>)}</select></label>
            <label className="field"><span>Activity type</span><select value={transaction.transactionType} onChange={(event) => setTransaction({ ...transaction, transactionType: event.target.value })}>{['Service', 'Procurement', 'Logistics', 'Sale', 'Finance', 'Shared Cost'].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="field"><span>Date</span><input type="date" value={transaction.transactionDate} onChange={(event) => setTransaction({ ...transaction, transactionDate: event.target.value })} /></label>
            <label className="field"><span>Amount</span><input type="number" value={transaction.amount} onChange={(event) => setTransaction({ ...transaction, amount: event.target.value })} /></label>
            <label className="field"><span>Cost</span><input type="number" value={transaction.cost} onChange={(event) => setTransaction({ ...transaction, cost: event.target.value })} /></label>
            <label className="field"><span>Status</span><select value={transaction.status} onChange={(event) => setTransaction({ ...transaction, status: event.target.value })}>{['Planned', 'Confirmed', 'In Progress', 'Completed', 'Delayed', 'Disputed', 'Cancelled'].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="field full"><span>Notes</span><textarea value={transaction.notes} onChange={(event) => setTransaction({ ...transaction, notes: event.target.value })} /></label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions"><button onClick={() => setModal('')}>Cancel</button><button disabled={saving || !transaction.targetCompanyId} onClick={() => submit('transaction')}>Record activity</button></div>
        </Modal>
      )}
    </section>
  );
}
