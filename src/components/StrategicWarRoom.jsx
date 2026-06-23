import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FlaskConical,
  Gauge,
  GitCompareArrows,
  Globe2,
  PackageSearch,
  Plus,
  Radar,
  RefreshCw,
  Rocket,
  Save,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { isSupabaseConfigured, supabase } from '../supabaseClient';
import {
  DEFAULT_SCENARIO_ASSUMPTIONS,
  SIMULATION_HORIZONS,
  compareStrategicScenarios,
  createStressScenario,
  simulateStrategicScenario,
} from '../services/strategicSimulationService';

const money = (value) =>
  `\u20b9${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;
const number = (value) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(Number(value) || 0);

const blankScenario = () => ({
  id: null,
  name: 'Growth strategy',
  description: 'Balanced expansion across demand, procurement, and logistics.',
  horizon: 'Monthly',
  assumptions: { ...DEFAULT_SCENARIO_ASSUMPTIONS },
});

const assumptionGroups = [
  {
    title: 'Commercial growth',
    icon: TrendingUp,
    fields: [
      ['salesGrowthPct', 'Sales growth', -40, 80, '%'],
      ['customerGrowthPct', 'Customer growth', -20, 60, '%'],
      ['newMarketRevenuePct', 'New market contribution', 0, 60, '%'],
      ['newVehicleCategoryGrowthPct', 'New category demand', 0, 50, '%'],
    ],
  },
  {
    title: 'Supply and inventory',
    icon: Warehouse,
    fields: [
      ['procurementChangePct', 'Procurement change', -60, 100, '%'],
      ['supplierFailurePct', 'Supplier disruption', 0, 80, '%'],
      ['newSupplierSavingsPct', 'New supplier savings', 0, 30, '%'],
      ['inventoryBufferPct', 'Inventory buffer', 0, 60, '%'],
    ],
  },
  {
    title: 'Logistics and finance',
    icon: Truck,
    fields: [
      ['shipmentVolumeChangePct', 'Shipment volume', -40, 100, '%'],
      ['freightCostChangePct', 'Freight cost change', -30, 100, '%'],
      ['delayRateChangePct', 'Delay rate change', -30, 60, '%'],
      ['logisticsEfficiencyPct', 'Partner efficiency', -20, 40, '%'],
      ['paymentIssuePct', 'Payment issue rate', 0, 60, '%'],
    ],
  },
];

const isMissingScenarioTable = (error) => {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return text.includes('42p01') || text.includes('pgrst205') || text.includes('strategic_scenarios');
};

const scenarioFromRow = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  horizon: row.horizon || 'Monthly',
  assumptions: { ...DEFAULT_SCENARIO_ASSUMPTIONS, ...(row.assumptions || {}) },
  results: row.results || null,
  status: row.status || 'Active',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

function RiskBadge({ risk }) {
  return <span className={`war-risk-badge ${String(risk?.level || 'Low').toLowerCase()}`}>{risk?.level || 'Low'} risk</span>;
}

function ProjectionCard({ icon: Icon, label, value, detail, tone = '' }) {
  return (
    <article className={`war-kpi ${tone}`}>
      <span><Icon size={19} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function AssumptionControl({ field, label, min, max, suffix, value, onChange }) {
  return (
    <label className="war-assumption">
      <div>
        <span>{label}</span>
        <strong>{value > 0 ? '+' : ''}{value}{suffix}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(field, Number(event.target.value))}
      />
      <div className="war-range">
        <small>{min}{suffix}</small>
        <small>{max}{suffix}</small>
      </div>
    </label>
  );
}

function ScenarioChart({ projections }) {
  return (
    <section className="war-panel war-chart-panel">
      <div className="war-heading">
        <div>
          <p className="eyebrow">Forecast trajectory</p>
          <h2>Revenue, expenses, and profit</h2>
          <span>The scenario recalculates instantly as assumptions change.</span>
        </div>
      </div>
      <div className="war-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={projections} margin={{ top: 8, right: 14, left: 4, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, .12)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={68}
              tickFormatter={(value) => `\u20b9${new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(value)}`}
            />
            <Tooltip
              formatter={(value, name) => [money(value), name]}
              contentStyle={{
                background: 'var(--panel-solid)',
                border: '1px solid var(--line)',
                borderRadius: 10,
              }}
            />
            <Legend />
            <Bar dataKey="expenses" name="Expenses" fill="#334155" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#60a5fa" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function OperationsChart({ projections }) {
  return (
    <section className="war-panel war-chart-panel">
      <div className="war-heading">
        <div>
          <p className="eyebrow">Operating forecast</p>
          <h2>Inventory and logistics demand</h2>
          <span>Projected stock, shipment volume, and shortage pressure.</span>
        </div>
      </div>
      <div className="war-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projections} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="war-inventory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="war-shipments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148, 163, 184, .12)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={48} />
            <Tooltip
              formatter={(value, name) => [number(value), name]}
              contentStyle={{
                background: 'var(--panel-solid)',
                border: '1px solid var(--line)',
                borderRadius: 10,
              }}
            />
            <Legend />
            <Area type="monotone" dataKey="inventoryUnits" name="Inventory" stroke="#a78bfa" fill="url(#war-inventory)" strokeWidth={2.3} />
            <Area type="monotone" dataKey="shipmentUnits" name="Shipments" stroke="#38bdf8" fill="url(#war-shipments)" strokeWidth={2.3} />
            <Line type="monotone" dataKey="shortageUnits" name="Shortage" stroke="#f87171" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function StrategyComparison({ scenarios, selectedIds, onToggle }) {
  const selected = scenarios.filter((scenario) => selectedIds.includes(scenario.id));
  const comparison = compareStrategicScenarios(selected);
  return (
    <section className="war-panel war-comparison">
      <div className="war-heading">
        <div>
          <p className="eyebrow">Strategy comparison</p>
          <h2>Choose up to three futures</h2>
          <span>Compare returns and operating exposure side by side.</span>
        </div>
        {comparison.best && (
          <div className="war-best-strategy">
            <Sparkles size={15} />
            <span>Best balanced strategy</span>
            <strong>{comparison.best.name}</strong>
          </div>
        )}
      </div>
      <div className="war-compare-picker">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            className={selectedIds.includes(scenario.id) ? 'active' : ''}
            onClick={() => onToggle(scenario.id)}
          >
            {selectedIds.includes(scenario.id) ? <CheckCircle2 size={15} /> : <Plus size={15} />}
            {scenario.name}
          </button>
        ))}
      </div>
      {selected.length ? (
        <div className="war-strategy-grid">
          {selected.map((scenario, index) => (
            <article key={scenario.id} className={comparison.best?.id === scenario.id ? 'winner' : ''}>
              <div>
                <small>Strategy {index + 1}</small>
                <h3>{scenario.name}</h3>
                <RiskBadge risk={scenario.summary.risk} />
              </div>
              <dl>
                <div><dt>Revenue</dt><dd>{money(scenario.summary.revenue)}</dd></div>
                <div><dt>Profit</dt><dd>{money(scenario.summary.profit)}</dd></div>
                <div><dt>Profit margin</dt><dd>{scenario.summary.profitMargin.toFixed(1)}%</dd></div>
                <div><dt>Inventory</dt><dd>{number(scenario.summary.inventoryUnits)} units</dd></div>
                <div><dt>Shipments</dt><dd>{number(scenario.summary.shipmentUnits)}</dd></div>
                <div><dt>Outstanding</dt><dd>{money(scenario.summary.outstandingPayments)}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <div className="war-empty">
          <GitCompareArrows size={28} />
          <strong>Select saved scenarios to compare</strong>
          <span>Two or three contrasting strategies reveal the useful trade-offs.</span>
        </div>
      )}
    </section>
  );
}

export default function StrategicWarRoom({
  userId,
  role,
  vehicles,
  orders,
  customers,
  shipments,
  logisticsPartners,
  procurementRequests,
  suppliers,
  financeRecords,
  onNavigate,
  canViewFinancials,
  onScenariosChange,
}) {
  const [draft, setDraft] = useState(blankScenario);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [scenarioState, setScenarioState] = useState({ loading: true, available: false, error: '' });
  const [saving, setSaving] = useState(false);

  const companyData = useMemo(() => ({
    vehicles,
    orders,
    customers,
    shipments,
    logisticsPartners,
    procurementRequests,
    suppliers,
    financeRecords: canViewFinancials ? financeRecords : [],
  }), [
    vehicles,
    orders,
    customers,
    shipments,
    logisticsPartners,
    procurementRequests,
    suppliers,
    financeRecords,
    canViewFinancials,
  ]);
  const result = useMemo(() => simulateStrategicScenario(companyData, draft), [companyData, draft]);
  const comparableScenarios = useMemo(
    () => savedScenarios.map((scenario) => simulateStrategicScenario(companyData, scenario)),
    [companyData, savedScenarios],
  );

  useEffect(() => {
    onScenariosChange?.(savedScenarios);
  }, [onScenariosChange, savedScenarios]);

  useEffect(() => {
    let cancelled = false;
    async function loadScenarios() {
      if (!isSupabaseConfigured || !supabase || !userId) {
        if (!cancelled) setScenarioState({ loading: false, available: false, error: '' });
        return;
      }
      const { data, error } = await supabase
        .from('strategic_scenarios')
        .select('*')
        .eq('created_by', userId)
        .eq('access_scope', role)
        .neq('status', 'Archived')
        .order('updated_at', { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (error) {
        setScenarioState({
          loading: false,
          available: false,
          error: isMissingScenarioTable(error) ? '' : error.message,
        });
        return;
      }
      setSavedScenarios((data || []).map(scenarioFromRow));
      setScenarioState({ loading: false, available: true, error: '' });
    }
    loadScenarios();
    return () => {
      cancelled = true;
    };
  }, [role, userId]);

  const updateAssumption = (field, value) => {
    setDraft((current) => ({
      ...current,
      assumptions: { ...current.assumptions, [field]: value },
    }));
  };

  const usePreset = (type) => {
    setDraft({ ...createStressScenario(type), id: null });
  };

  const saveScenario = async () => {
    if (!draft.name.trim() || saving) return;
    setSaving(true);
    const localId = draft.id || globalThis.crypto?.randomUUID?.() || `scenario-${Date.now()}`;
    const localScenario = { ...draft, id: localId, results: result.summary, status: 'Active' };
    setSavedScenarios((current) => [
      localScenario,
      ...current.filter((scenario) => scenario.id !== localId && scenario.id !== draft.id),
    ]);

    if (!scenarioState.available || !supabase || !userId) {
      setDraft((current) => ({ ...current, id: localId }));
      setSaving(false);
      return;
    }

    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      horizon: draft.horizon,
      assumptions: draft.assumptions,
      results: result,
      status: 'Active',
      access_scope: role,
      created_by: userId,
      updated_at: new Date().toISOString(),
    };
    const query = draft.id
      ? supabase.from('strategic_scenarios').update(payload).eq('id', draft.id).select().single()
      : supabase.from('strategic_scenarios').insert(payload).select().single();
    const { data, error } = await query;
    if (error) {
      setScenarioState((current) => ({ ...current, error: error.message }));
    } else if (data) {
      const saved = scenarioFromRow(data);
      setSavedScenarios((current) => [saved, ...current.filter((scenario) => scenario.id !== localId && scenario.id !== saved.id)]);
      setDraft(saved);
    }
    setSaving(false);
  };

  const archiveScenario = async (scenario) => {
    setSavedScenarios((current) => current.filter((item) => item.id !== scenario.id));
    setSelectedIds((current) => current.filter((id) => id !== scenario.id));
    if (scenarioState.available && supabase && scenario.id) {
      const { error } = await supabase
        .from('strategic_scenarios')
        .update({ status: 'Archived', updated_at: new Date().toISOString() })
        .eq('id', scenario.id);
      if (error) setScenarioState((current) => ({ ...current, error: error.message }));
    }
  };

  const toggleComparison = (id) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return [...current.slice(-2), id];
    });
  };

  const baseline = result.baseline;
  const summary = result.summary;
  const topCustomers = useMemo(() => {
    const totals = new Map();
    orders.forEach((order) => {
      const name = order.customerName || 'Unassigned customer';
      totals.set(name, (totals.get(name) || 0) + (Number(order.totalRevenue) || Number(order.sellingPrice) * Math.max(1, Number(order.quantity) || 1)));
    });
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);

  return (
    <section className="page-stack strategic-war-room">
      <header className="war-hero">
        <div>
          <p className="eyebrow">Velora OS Strategic War Room</p>
          <h1>Test the future before committing to it</h1>
          <p>Model growth, disruption, market expansion, supplier changes, and logistics pressure against Velora's real operating baseline.</p>
        </div>
        <div className="war-hero-status">
          <Radar size={23} />
          <div>
            <small>Simulation engine</small>
            <strong>Scenario active</strong>
            <span><i /> {result.horizon} projection · {result.projections.length} periods</span>
          </div>
        </div>
      </header>

      {!scenarioState.loading && !scenarioState.available && !scenarioState.error && (
        <div className="war-setup-note">
          <FlaskConical size={18} />
          <div>
            <strong>Local simulation mode is active</strong>
            <span>Run <code>supabase/phase6-strategic-war-room.sql</code> to persist scenarios across devices.</span>
          </div>
        </div>
      )}
      {scenarioState.error && (
        <div className="war-setup-note error">
          <AlertTriangle size={18} />
          <div><strong>Scenario sync needs attention</strong><span>{scenarioState.error}</span></div>
        </div>
      )}

      <div className="war-baseline-strip">
        <div><small>Current monthly revenue</small><strong>{canViewFinancials ? money(baseline.monthlyRevenue) : 'Restricted'}</strong></div>
        <div><small>Inventory baseline</small><strong>{number(baseline.inventoryUnits)} units</strong></div>
        <div><small>Monthly shipments</small><strong>{number(baseline.monthlyShipmentUnits)}</strong></div>
        <div><small>Delivery performance</small><strong>{(baseline.deliveryRate * 100).toFixed(1)}%</strong></div>
        <div><small>Supplier concentration</small><strong>{baseline.supplierConcentration.toFixed(1)}%</strong></div>
      </div>

      <section className="war-simulator">
        <aside className="war-controls">
          <div className="war-controls-heading">
            <div>
              <p className="eyebrow">Scenario controls</p>
              <h2>Build a strategy</h2>
            </div>
            <button className="war-new-button" onClick={() => setDraft(blankScenario())} title="New scenario">
              <Plus size={17} />
            </button>
          </div>
          <label className="war-field">
            <span>Scenario name</span>
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="war-field">
            <span>Strategic intent</span>
            <textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} rows="2" />
          </label>
          <div className="war-horizon">
            <span>Projection horizon</span>
            <div>
              {Object.keys(SIMULATION_HORIZONS).map((horizon) => (
                <button
                  key={horizon}
                  className={draft.horizon === horizon ? 'active' : ''}
                  onClick={() => setDraft((current) => ({ ...current, horizon }))}
                >
                  {horizon}
                </button>
              ))}
            </div>
          </div>
          <div className="war-presets">
            <span>Stress-test presets</span>
            <div>
              <button onClick={() => usePreset('growth')}><Rocket size={14} /> Growth</button>
              <button onClick={() => usePreset('market')}><Globe2 size={14} /> New market</button>
              <button onClick={() => usePreset('freight')}><Truck size={14} /> Freight shock</button>
              <button onClick={() => usePreset('supplier')}><ShieldAlert size={14} /> Supplier failure</button>
              <button onClick={() => usePreset('payment')}><CircleDollarSign size={14} /> Payment stress</button>
            </div>
          </div>
          {assumptionGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div className="war-assumption-group" key={group.title}>
                <h3><Icon size={15} />{group.title}</h3>
                {group.fields.map(([field, label, min, max, suffix]) => (
                  <AssumptionControl
                    key={field}
                    field={field}
                    label={label}
                    min={min}
                    max={max}
                    suffix={suffix}
                    value={draft.assumptions[field]}
                    onChange={updateAssumption}
                  />
                ))}
              </div>
            );
          })}
          <button className="war-save-button" onClick={saveScenario} disabled={saving || !draft.name.trim()}>
            {saving ? <RefreshCw className="spin" size={17} /> : <Save size={17} />}
            {draft.id ? 'Update scenario' : 'Save scenario'}
          </button>
        </aside>

        <div className="war-outcomes">
          <div className="war-outcome-header">
            <div>
              <p className="eyebrow">Predicted outcome</p>
              <h2>{result.name}</h2>
              <span>{result.description}</span>
            </div>
            <RiskBadge risk={summary.risk} />
          </div>
          <div className="war-kpi-grid">
            {canViewFinancials && <ProjectionCard icon={BarChart3} label="Projected revenue" value={money(summary.revenue)} detail={`${draft.horizon} cumulative projection`} tone="accent" />}
            {canViewFinancials && <ProjectionCard icon={TrendingUp} label="Projected profit" value={money(summary.profit)} detail={`${summary.profitMargin.toFixed(1)}% projected margin`} tone={summary.profit >= 0 ? 'success' : 'danger'} />}
            <ProjectionCard icon={Boxes} label="Ending inventory" value={`${number(summary.inventoryUnits)} units`} detail={`${number(summary.shortageUnits)} shortage exposure`} />
            <ProjectionCard icon={Truck} label="Shipment demand" value={number(summary.shipmentUnits)} detail={`${summary.deliveryPerformance.toFixed(1)}% delivery performance`} />
            {canViewFinancials && <ProjectionCard icon={PackageSearch} label="Procurement cost" value={money(summary.procurementCost)} detail={`${money(summary.freightCost)} projected freight`} />}
            {canViewFinancials && <ProjectionCard icon={CircleDollarSign} label="Outstanding payments" value={money(summary.outstandingPayments)} detail="Projected collection exposure" tone={summary.outstandingPayments > summary.revenue * .2 ? 'danger' : ''} />}
            <ProjectionCard icon={Users} label="Customer base" value={number(summary.customers)} detail={`${summary.customerGrowth >= 0 ? '+' : ''}${number(summary.customerGrowth)} projected growth`} />
            <ProjectionCard icon={Gauge} label="Composite risk" value={`${summary.risk.score}/100`} detail={`${summary.risk.level} strategic exposure`} tone={summary.risk.score >= 50 ? 'danger' : ''} />
          </div>
          <div className="war-chart-grid">
            <ScenarioChart projections={result.projections} />
            <OperationsChart projections={result.projections} />
          </div>
          <div className="war-intelligence-grid">
            <section className="war-panel war-recommendations">
              <div className="war-heading">
                <div>
                  <p className="eyebrow">Strategic recommendations</p>
                  <h2>What the model would do next</h2>
                </div>
              </div>
              <div>
                {result.recommendations.map((item) => (
                  <button key={item.title} className={item.severity.toLowerCase()} onClick={() => onNavigate(item.action)}>
                    <Sparkles size={16} />
                    <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            </section>
            <section className="war-panel war-customer-growth">
              <div className="war-heading">
                <div>
                  <p className="eyebrow">Customer value</p>
                  <h2>High-growth customer base</h2>
                </div>
              </div>
              <div className="war-customer-list">
                {topCustomers.map(([name, value], index) => (
                  <div key={name}>
                    <span>{index + 1}</span>
                    <div><strong>{name}</strong><small>Current revenue contribution</small></div>
                    <b>{canViewFinancials ? money(value) : 'Visible to Finance'}</b>
                  </div>
                ))}
                {!topCustomers.length && <div className="war-empty compact"><Users size={24} /><strong>Customer value appears after orders are recorded</strong></div>}
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="war-panel war-saved">
        <div className="war-heading">
          <div>
            <p className="eyebrow">Active simulations</p>
            <h2>Saved strategic scenarios</h2>
            <span>Reopen, refine, or archive earlier plans without touching live operations.</span>
          </div>
          <strong>{savedScenarios.length} active</strong>
        </div>
        <div className="war-saved-grid">
          {comparableScenarios.map((scenario) => (
            <article key={scenario.id}>
              <div>
                <span><Target size={17} /></span>
                <div><small>{scenario.horizon}</small><h3>{scenario.name}</h3></div>
                <RiskBadge risk={scenario.summary.risk} />
              </div>
              <p>{scenario.description || 'No strategic note added.'}</p>
              <dl>
                {canViewFinancials && <div><dt>Profit</dt><dd>{money(scenario.summary.profit)}</dd></div>}
                <div><dt>Inventory</dt><dd>{number(scenario.summary.inventoryUnits)}</dd></div>
                <div><dt>Risk</dt><dd>{scenario.summary.risk.score}/100</dd></div>
              </dl>
              <footer>
                <button onClick={() => setDraft(savedScenarios.find((item) => item.id === scenario.id))}><RefreshCw size={15} /> Load</button>
                <button onClick={() => archiveScenario(scenario)}><Archive size={15} /> Archive</button>
              </footer>
            </article>
          ))}
          {!comparableScenarios.length && (
            <div className="war-empty">
              <FlaskConical size={29} />
              <strong>No saved simulations yet</strong>
              <span>Adjust the assumptions and save your first strategic scenario.</span>
            </div>
          )}
        </div>
      </section>

      <StrategyComparison scenarios={comparableScenarios} selectedIds={selectedIds} onToggle={toggleComparison} />

      <div className="war-disclaimer">
        <AlertTriangle size={15} />
        <span>{result.disclaimer}</span>
      </div>
    </section>
  );
}
