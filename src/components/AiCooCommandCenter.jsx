import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BellRing,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Gauge,
  Lightbulb,
  PackageSearch,
  Radar,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../supabaseClient';
import { buildAiCooIntelligence } from '../services/aiCooService';
import '../ai-coo.css';

const money = (value) =>
  `\u20b9${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;
const number = (value) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0);

const scoreIcons = {
  customers: Users,
  suppliers: BriefcaseBusiness,
  shipments: Truck,
  procurement: PackageSearch,
  inventory: Warehouse,
};

const moduleIcon = {
  Shipments: Truck,
  Procurement: PackageSearch,
  Finance: CircleDollarSign,
  Customers: Users,
  Inventory: Warehouse,
};

const isMissingTaskTable = (error) => {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return text.includes('42p01') || text.includes('pgrst205') || text.includes('ai_coo_tasks');
};

const taskFromRow = (row) => ({
  id: row.id,
  sourceKey: row.source_key,
  title: row.title,
  description: row.description || '',
  reason: row.reason || '',
  priority: row.priority || 'Planned',
  module: row.linked_module || 'Command Center',
  linkedRecordId: row.linked_record_id || '',
  expectedImpact: row.expected_impact || '',
  confidence: row.confidence || { label: 'Developing', score: 50 },
  status: row.status || 'Open',
  rank: row.rank || 99,
});

function SeverityBadge({ value }) {
  return <span className={`coo-severity ${String(value || 'Medium').toLowerCase()}`}>{value}</span>;
}

function Confidence({ value }) {
  const confidence = value || { label: 'Developing', score: 50 };
  return (
    <span className="coo-confidence">
      <i><em style={{ width: `${confidence.score}%` }} /></i>
      {confidence.label} confidence
    </span>
  );
}

function InsightCard({ item, onNavigate, compact = false }) {
  const Icon = moduleIcon[item.module] || Sparkles;
  return (
    <article className={`coo-insight-card ${compact ? 'compact' : ''}`}>
      <div className="coo-insight-icon"><Icon size={18} /></div>
      <div className="coo-insight-body">
        <div className="coo-insight-title">
          <SeverityBadge value={item.severity} />
          <strong>{item.title}</strong>
        </div>
        <p>{item.explanation}</p>
        {!compact && (
          <div className="coo-explanation">
            <div><small>Why it matters</small><span>{item.why}</span></div>
            <div><small>Expected impact</small><span>{item.expectedImpact}</span></div>
            <div>
              <small>Data used</small>
              <span>{item.dataUsed?.join(' · ') || 'Current operational records'}</span>
            </div>
          </div>
        )}
        <Confidence value={item.confidence} />
      </div>
      <button onClick={() => onNavigate(item.module)} title={`Open ${item.module}`}>
        <ArrowUpRight size={16} />
      </button>
    </article>
  );
}

function Briefing({ briefing, canViewFinancials }) {
  const icons = {
    revenue: BarChart3,
    profit: TrendingUp,
    shipments: Truck,
    procurement: PackageSearch,
    customers: Users,
  };
  return (
    <section className="coo-briefing">
      <header>
        <div>
          <p className="eyebrow">Daily executive briefing</p>
          <h2>{new Date(briefing.generatedAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          <p>{briefing.headline}</p>
        </div>
        <span><Radar size={17} /> Generated from current company state</span>
      </header>
      <div className="coo-briefing-grid">
        {briefing.sections
          .filter((section) => canViewFinancials || !['revenue', 'profit'].includes(section.key))
          .map((section) => {
            const Icon = icons[section.key] || Gauge;
            return (
              <article key={section.key}>
                <span><Icon size={18} /></span>
                <div>
                  <small>{section.label}</small>
                  <strong>{['revenue', 'profit'].includes(section.key) ? money(section.value) : number(section.value)}</strong>
                  <p>{section.summary}</p>
                </div>
              </article>
            );
          })}
      </div>
    </section>
  );
}

function TaskBoard({ tasks, onStatus, onNavigate }) {
  const columns = [
    ['Immediate', tasks.filter((task) => task.priority === 'Immediate' && task.status !== 'Completed')],
    ['High priority', tasks.filter((task) => task.priority === 'High' && task.status !== 'Completed')],
    ['Strategic', tasks.filter((task) => task.priority === 'Planned' && task.status !== 'Completed')],
    ['Completed', tasks.filter((task) => task.status === 'Completed')],
  ];
  return (
    <section className="coo-board">
      {columns.map(([title, items]) => (
        <div className="coo-board-column" key={title}>
          <header><strong>{title}</strong><span>{items.length}</span></header>
          <div>
            {items.slice(0, 8).map((task) => (
              <article key={task.sourceKey}>
                <div>
                  <SeverityBadge value={task.priority === 'Immediate' ? 'Critical' : task.priority === 'High' ? 'High' : 'Medium'} />
                  <strong>{task.title}</strong>
                  <p>{task.description}</p>
                </div>
                <small>{task.expectedImpact}</small>
                <footer>
                  <button onClick={() => onNavigate(task.module)}>{task.module}<ChevronRight size={13} /></button>
                  {task.status !== 'Completed' ? (
                    <button onClick={() => onStatus(task, task.status === 'In Progress' ? 'Completed' : 'In Progress')}>
                      {task.status === 'In Progress' ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
                      {task.status === 'In Progress' ? 'Complete' : 'Start'}
                    </button>
                  ) : (
                    <button onClick={() => onStatus(task, 'Open')}><RefreshCw size={14} /> Reopen</button>
                  )}
                </footer>
              </article>
            ))}
            {!items.length && <div className="coo-column-empty"><CheckCircle2 size={20} /><span>Nothing waiting here</span></div>}
          </div>
        </div>
      ))}
    </section>
  );
}

function PerformanceScores({ scores }) {
  return (
    <section className="coo-score-grid">
      {Object.entries(scores).map(([type, rows]) => {
        const Icon = scoreIcons[type] || Gauge;
        const average = rows.length ? rows.reduce((sum, row) => sum + row.score, 0) / rows.length : 0;
        return (
          <article className="coo-score-panel" key={type}>
            <header>
              <span><Icon size={18} /></span>
              <div><small>Operational score</small><h3>{type}</h3></div>
              <strong>{Math.round(average)}/100</strong>
            </header>
            <div>
              {rows.slice(0, 5).map((row) => (
                <div key={row.id || row.name}>
                  <span title={row.name}>{row.name}</span>
                  <i><em style={{ width: `${row.score}%` }} /></i>
                  <b className={row.score < 45 ? 'low' : row.score >= 75 ? 'high' : ''}>{row.score}</b>
                </div>
              ))}
              {!rows.length && <p>No scored records in this role scope.</p>}
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default function AiCooCommandCenter({
  userId,
  role,
  companyId,
  vehicles,
  orders,
  customers,
  shipments,
  procurementRequests,
  suppliers,
  financeRecords,
  onNavigate,
  canViewFinancials,
  onOpenChat,
  onIntelligenceChange,
}) {
  const [activeView, setActiveView] = useState('Overview');
  const [persistedTasks, setPersistedTasks] = useState([]);
  const [taskState, setTaskState] = useState({ loading: true, available: false, error: '' });

  const companyData = useMemo(() => ({
    vehicles,
    orders,
    customers,
    shipments,
    procurementRequests,
    suppliers,
    financeRecords: canViewFinancials ? financeRecords : [],
    canViewFinancials,
  }), [vehicles, orders, customers, shipments, procurementRequests, suppliers, financeRecords, canViewFinancials]);
  const intelligence = useMemo(() => buildAiCooIntelligence(companyData), [companyData]);
  const tasks = useMemo(() => {
    const persistedBySource = new Map(persistedTasks.map((task) => [task.sourceKey, task]));
    return intelligence.tasks.map((task) => ({ ...task, ...(persistedBySource.get(task.sourceKey) || {}) }))
      .concat(persistedTasks.filter((task) => !intelligence.tasks.some((generated) => generated.sourceKey === task.sourceKey)))
      .sort((a, b) => a.rank - b.rank);
  }, [intelligence.tasks, persistedTasks]);

  useEffect(() => {
    onIntelligenceChange?.(intelligence);
  }, [intelligence, onIntelligenceChange]);

  useEffect(() => {
    let cancelled = false;
    async function loadTasks() {
      if (!isSupabaseConfigured || !supabase || !userId) {
        if (!cancelled) setTaskState({ loading: false, available: false, error: '' });
        return;
      }
      let query = supabase
        .from('ai_coo_tasks')
        .select('*')
        .eq('created_by', userId)
        .eq('access_scope', role);
      if (companyId) query = query.eq('company_id', companyId);
      const { data, error } = await query
        .neq('status', 'Dismissed')
        .order('rank', { ascending: true })
        .limit(100);
      if (cancelled) return;
      if (error) {
        setTaskState({ loading: false, available: false, error: isMissingTaskTable(error) ? '' : error.message });
        return;
      }
      setPersistedTasks((data || []).map(taskFromRow));
      setTaskState({ loading: false, available: true, error: '' });
    }
    loadTasks();
    return () => {
      cancelled = true;
    };
  }, [companyId, role, userId]);

  useEffect(() => {
    if (!taskState.available || !supabase || !userId || !intelligence.tasks.length) return;
    let cancelled = false;
    async function syncTasks() {
      const generatedOn = new Date().toISOString().slice(0, 10);
      const payload = intelligence.tasks.map((task) => ({
        source_key: task.sourceKey,
        title: task.title,
        description: task.description,
        reason: task.reason,
        priority: task.priority,
        linked_module: task.module,
        linked_record_id: task.linkedRecordId,
        expected_impact: task.expectedImpact,
        confidence: task.confidence,
        rank: task.rank,
        generated_on: generatedOn,
        access_scope: role,
        created_by: userId,
        ...(companyId ? { company_id: companyId } : {}),
        updated_at: new Date().toISOString(),
      }));
      const { data, error } = await supabase
        .from('ai_coo_tasks')
        .upsert(payload, { onConflict: companyId ? 'company_id,created_by,access_scope,source_key' : 'created_by,access_scope,source_key' })
        .select('*');
      if (!cancelled && !error && data) {
        const synced = data.map(taskFromRow);
        setPersistedTasks((current) => [
          ...synced,
          ...current.filter((task) => !synced.some((item) => item.sourceKey === task.sourceKey)),
        ]);
      }
      if (!cancelled && error) setTaskState((current) => ({ ...current, error: error.message }));
    }
    syncTasks();
    return () => {
      cancelled = true;
    };
  }, [companyId, intelligence.tasks, role, taskState.available, userId]);

  const updateTaskStatus = async (task, status) => {
    setPersistedTasks((current) => {
      const exists = current.some((item) => item.sourceKey === task.sourceKey);
      return exists
        ? current.map((item) => item.sourceKey === task.sourceKey ? { ...item, status } : item)
        : [...current, { ...task, status }];
    });
    if (taskState.available && supabase) {
      let query = supabase
        .from('ai_coo_tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('created_by', userId)
        .eq('access_scope', role);
      if (companyId) query = query.eq('company_id', companyId);
      const { error } = await query.eq('source_key', task.sourceKey);
      if (error) setTaskState((current) => ({ ...current, error: error.message }));
    }
  };

  return (
    <section className="page-stack ai-coo-page">
      <header className="coo-hero">
        <div>
          <p className="eyebrow">Velora OS AI Chief Operating Officer</p>
          <h1>Your digital executive layer</h1>
          <p>Continuous operational monitoring, explainable priorities, emerging risks, and decision support across the company.</p>
        </div>
        <div className="coo-hero-actions">
          <div>
            <span><i /> Monitoring active</span>
            <strong>{intelligence.criticalIssues.length}</strong>
            <small>high-priority issues</small>
          </div>
          <button onClick={onOpenChat}><Bot size={17} /> Ask AI COO</button>
        </div>
      </header>

      {!taskState.loading && !taskState.available && !taskState.error && (
        <div className="coo-setup-note">
          <ClipboardCheck size={18} />
          <div><strong>Live intelligence is active</strong><span>Run <code>supabase/phase7-ai-coo.sql</code> to sync task progress across devices.</span></div>
        </div>
      )}
      {taskState.error && (
        <div className="coo-setup-note error">
          <AlertTriangle size={18} />
          <div><strong>Task sync needs attention</strong><span>{taskState.error}</span></div>
        </div>
      )}

      <nav className="coo-tabs" aria-label="AI COO views">
        {['Overview', 'Briefing', 'Priority Board', 'Performance Scores'].map((view) => (
          <button key={view} className={activeView === view ? 'active' : ''} onClick={() => setActiveView(view)}>{view}</button>
        ))}
      </nav>

      {activeView === 'Overview' && (
        <>
          <div className="coo-kpi-grid">
            <article className="critical"><span><ShieldAlert size={20} /></span><div><small>Critical issues</small><strong>{intelligence.criticalIssues.length}</strong><p>Items requiring management intervention</p></div></article>
            <article className="opportunity"><span><Lightbulb size={20} /></span><div><small>Opportunities</small><strong>{intelligence.opportunities.length}</strong><p>Ranked commercial and operating upside</p></div></article>
            <article><span><BellRing size={20} /></span><div><small>Risk alerts</small><strong>{intelligence.risks.length}</strong><p>Evidence-backed operating risks</p></div></article>
            <article><span><Target size={20} /></span><div><small>Recommendations</small><strong>{intelligence.recommendations.length}</strong><p>Actions proposed for human review</p></div></article>
            <article><span><ClipboardCheck size={20} /></span><div><small>Daily priorities</small><strong>{intelligence.dailyPriorities.length}</strong><p>Sequenced management action items</p></div></article>
          </div>

          <Briefing briefing={intelligence.briefing} canViewFinancials={canViewFinancials} />

          <div className="coo-overview-grid">
            <section className="coo-panel">
              <div className="coo-heading"><div><p className="eyebrow">Critical issues</p><h2>Requires attention now</h2></div><ShieldAlert size={20} /></div>
              <div className="coo-insight-list">
                {intelligence.criticalIssues.slice(0, 5).map((item) => <InsightCard key={item.id} item={item} onNavigate={onNavigate} compact />)}
                {!intelligence.criticalIssues.length && <div className="coo-empty"><CheckCircle2 size={25} /><strong>No critical operating issues detected</strong></div>}
              </div>
            </section>
            <section className="coo-panel">
              <div className="coo-heading"><div><p className="eyebrow">Opportunity engine</p><h2>Highest-potential moves</h2></div><Lightbulb size={20} /></div>
              <div className="coo-insight-list">
                {intelligence.opportunities.slice(0, 5).map((item) => <InsightCard key={item.id} item={item} onNavigate={onNavigate} compact />)}
                {!intelligence.opportunities.length && <div className="coo-empty"><Lightbulb size={25} /><strong>More operating history will reveal opportunities</strong></div>}
              </div>
            </section>
          </div>

          <section className="coo-panel">
            <div className="coo-heading"><div><p className="eyebrow">Smart recommendation engine</p><h2>Recommended management decisions</h2><span>Every recommendation includes its evidence, expected impact, and confidence.</span></div><Sparkles size={20} /></div>
            <div className="coo-recommendation-grid">
              {intelligence.recommendations.slice(0, 8).map((item) => <InsightCard key={item.id} item={item} onNavigate={onNavigate} />)}
            </div>
          </section>

          <section className="coo-panel">
            <div className="coo-heading"><div><p className="eyebrow">AI COO insights</p><h2>Findings across the operating system</h2></div><Radar size={20} /></div>
            <div className="coo-findings">
              {intelligence.insights.keyFindings.map((item) => (
                <button key={item.id} onClick={() => onNavigate(item.module)}>
                  <span><Sparkles size={15} /></span>
                  <div><strong>{item.title}</strong><small>{item.why}</small></div>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {activeView === 'Briefing' && (
        <>
          <Briefing briefing={intelligence.briefing} canViewFinancials={canViewFinancials} />
          <div className="coo-overview-grid">
            <section className="coo-panel">
              <div className="coo-heading"><div><p className="eyebrow">Risk summary</p><h2>What could interrupt operations</h2></div></div>
              <div className="coo-insight-list">{intelligence.briefing.topRisks.map((item) => <InsightCard key={item.id} item={item} onNavigate={onNavigate} compact />)}</div>
            </section>
            <section className="coo-panel">
              <div className="coo-heading"><div><p className="eyebrow">Opportunity summary</p><h2>Where management can create upside</h2></div></div>
              <div className="coo-insight-list">{intelligence.briefing.topOpportunities.map((item) => <InsightCard key={item.id} item={item} onNavigate={onNavigate} compact />)}</div>
            </section>
          </div>
        </>
      )}

      {activeView === 'Priority Board' && <TaskBoard tasks={tasks} onStatus={updateTaskStatus} onNavigate={onNavigate} />}
      {activeView === 'Performance Scores' && <PerformanceScores scores={intelligence.scores} />}

      <div className="coo-policy"><Bot size={15} /><span>{intelligence.policy}</span></div>
    </section>
  );
}
