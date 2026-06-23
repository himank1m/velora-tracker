import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  GitCompareArrows,
  HeartPulse,
  History,
  PackageSearch,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { isSupabaseConfigured, supabase } from '../supabaseClient';
import DigitalTwin from './DigitalTwin';
import {
  buildCompanyTimeline,
  buildHistoricalSeries,
  compareHistoricalStates,
  createCompanySnapshot,
  explainHistoricalChanges,
  reconstructCompanyState,
  toDateKey,
} from '../services/timeMachineService';

const DAY = 86400000;

const money = (value) =>
  `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;

const number = (value) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0);

const formatDate = (value, options = {}) => {
  if (!value) return 'Date unavailable';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...options });
};

const isMissingSnapshotTable = (error) => {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return text.includes('42p01') || text.includes('pgrst205') || text.includes('company_snapshots');
};

const snapshotFromRow = (row) => ({
  id: row.id,
  snapshotDate: row.snapshot_date,
  schemaVersion: row.schema_version,
  state: row.state || {},
  metrics: row.metrics || {},
  recordCounts: row.record_counts || {},
  createdAt: row.created_at,
});

function Delta({ value, moneyValue = false, suffix = '' }) {
  const positive = value > 0;
  const negative = value < 0;
  const Icon = positive ? TrendingUp : negative ? TrendingDown : ArrowRight;
  return (
    <span className={`time-delta ${positive ? 'positive' : negative ? 'negative' : 'neutral'}`}>
      <Icon size={14} />
      {positive ? '+' : ''}
      {moneyValue ? money(value) : number(value)}
      {suffix}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, detail, delta, moneyValue = false }) {
  return (
    <article className="time-kpi">
      <span className="time-kpi-icon"><Icon size={19} /></span>
      <div>
        <small>{label}</small>
        <strong>{moneyValue ? money(value) : number(value)}</strong>
        <p>{detail}</p>
      </div>
      {delta !== undefined && <Delta value={delta} moneyValue={moneyValue} />}
    </article>
  );
}

function HistoricalChart({ title, description, data, firstKey, secondKey, firstLabel, secondLabel, moneyValues = false }) {
  return (
    <section className="time-panel time-chart-panel">
      <div className="time-section-heading">
        <div>
          <p className="eyebrow">Historical analytics</p>
          <h2>{title}</h2>
          <span>{description}</span>
        </div>
      </div>
      {data.length ? (
        <div className="time-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`${firstKey}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`${secondKey}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={62}
                tickFormatter={(value) => (moneyValues ? `₹${number(value)}` : number(value))}
              />
              <Tooltip
                formatter={(value, name) => [moneyValues ? money(value) : number(value), name]}
                contentStyle={{
                  background: 'var(--panel-solid)',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey={firstKey}
                name={firstLabel}
                stroke="#60a5fa"
                strokeWidth={2.5}
                fill={`url(#${firstKey}-fill)`}
              />
              <Area
                type="monotone"
                dataKey={secondKey}
                name={secondLabel}
                stroke="#22c55e"
                strokeWidth={2.5}
                fill={`url(#${secondKey}-fill)`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="time-empty"><Activity size={26} /><strong>No historical points yet</strong></div>
      )}
    </section>
  );
}

function TimelineList({ events, selectedDate, onNavigate }) {
  const selected = new Date(`${selectedDate}T23:59:59`);
  const visible = events.filter((event) => new Date(event.date) <= selected).slice(0, 18);
  const pageByType = {
    Order: 'Orders',
    Inventory: 'Inventory',
    Shipment: 'Shipments',
    Procurement: 'Procurement',
    Finance: 'Finance',
    Customer: 'Customers',
    Document: 'Documents',
  };
  return (
    <section className="time-panel time-history-panel">
      <div className="time-section-heading">
        <div>
          <p className="eyebrow">Company timeline</p>
          <h2>Events shaping the business</h2>
          <span>Orders, shipments, procurement, finance, customers, and documents in one chronology.</span>
        </div>
      </div>
      <div className="time-event-list">
        {visible.map((event) => (
          <button key={event.id} className="time-event" onClick={() => onNavigate(pageByType[event.type] || 'Command Center')}>
            <span className={`time-event-dot ${event.type.toLowerCase()}`} />
            <div>
              <strong>{event.title}</strong>
              <small>{event.detail}</small>
            </div>
            <time>{formatDate(event.date)}</time>
            <ChevronRight size={16} />
          </button>
        ))}
        {!visible.length && (
          <div className="time-empty">
            <History size={28} />
            <strong>No company events existed by this date</strong>
            <span>Move the timeline forward to explore recorded activity.</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default function TimeMachine({
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
  documents,
  orderTimelines,
  procurementTimelines,
  shipmentEvents,
  vehicleEvents,
  onNavigate,
  canViewFinancials,
}) {
  const currentDate = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [comparisonDate, setComparisonDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return toDateKey(date);
  });
  const [compareMode, setCompareMode] = useState(false);
  const [showHistoricalTwin, setShowHistoricalTwin] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotState, setSnapshotState] = useState({ loading: true, available: false, error: '' });
  const capturedStateRef = useRef('');

  const data = useMemo(() => ({
    vehicles,
    orders,
    customers,
    shipments,
    procurementRequests,
    suppliers,
    financeRecords: canViewFinancials ? financeRecords : [],
    documents,
  }), [
    vehicles,
    orders,
    customers,
    shipments,
    procurementRequests,
    suppliers,
    financeRecords,
    documents,
    canViewFinancials,
  ]);
  const timelines = useMemo(() => ({
    orderTimelines,
    procurementTimelines,
    shipmentEvents,
    vehicleEvents,
  }), [orderTimelines, procurementTimelines, shipmentEvents, vehicleEvents]);
  const companyTimeline = useMemo(() => buildCompanyTimeline(data, timelines), [data, timelines]);

  useEffect(() => {
    let cancelled = false;
    async function loadSnapshots() {
      if (!isSupabaseConfigured || !supabase || !userId) {
        if (!cancelled) setSnapshotState({ loading: false, available: false, error: '' });
        return;
      }
      let query = supabase
        .from('company_snapshots')
        .select('id, snapshot_date, schema_version, state, metrics, record_counts, created_at')
        .eq('created_by', userId)
        .eq('access_scope', role);
      if (companyId) query = query.eq('company_id', companyId);
      const { data: rows, error } = await query
        .order('snapshot_date', { ascending: false })
        .limit(400);
      if (cancelled) return;
      if (error) {
        setSnapshotState({
          loading: false,
          available: false,
          error: isMissingSnapshotTable(error) ? '' : error.message,
        });
        return;
      }
      setSnapshots((rows || []).map(snapshotFromRow));
      setSnapshotState({ loading: false, available: true, error: '' });
    }
    loadSnapshots();
    return () => {
      cancelled = true;
    };
  }, [companyId, role, userId]);

  const liveSnapshot = useMemo(() => createCompanySnapshot(data, new Date()), [data]);
  const liveSnapshotKey = useMemo(
    () => JSON.stringify({ date: liveSnapshot.snapshotDate, state: liveSnapshot.state }),
    [liveSnapshot],
  );

  useEffect(() => {
    if (!snapshotState.available || !supabase || !userId) return;
    if (capturedStateRef.current === liveSnapshotKey) return;
    capturedStateRef.current = liveSnapshotKey;
    let cancelled = false;
    async function captureToday() {
      const payload = {
        snapshot_date: liveSnapshot.snapshotDate,
        schema_version: liveSnapshot.schemaVersion,
        state: liveSnapshot.state,
        metrics: liveSnapshot.metrics,
        record_counts: liveSnapshot.recordCounts,
        created_by: userId,
        access_scope: role,
        ...(companyId ? { company_id: companyId } : {}),
      };
      const { data: row, error } = await supabase
        .from('company_snapshots')
        .upsert(payload, { onConflict: companyId ? 'company_id,created_by,snapshot_date,access_scope' : 'created_by,snapshot_date,access_scope' })
        .select('id, snapshot_date, schema_version, state, metrics, record_counts, created_at')
        .single();
      if (!cancelled && error) {
        capturedStateRef.current = '';
        setSnapshotState((current) => ({ ...current, error: error.message }));
        return;
      }
      if (!cancelled && !error && row) {
        setSnapshots((current) => [snapshotFromRow(row), ...current.filter((item) => item.snapshotDate !== row.snapshot_date)]);
      }
    }
    captureToday();
    return () => {
      cancelled = true;
    };
  }, [companyId, liveSnapshot, liveSnapshotKey, role, snapshotState.available, userId]);

  const earliestDate = useMemo(() => {
    const dates = [
      ...companyTimeline.map((event) => new Date(event.date)),
      ...snapshots.map((snapshot) => new Date(`${snapshot.snapshotDate}T12:00:00`)),
    ].filter((date) => !Number.isNaN(date.getTime()));
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() - 1);
    return toDateKey(dates.sort((a, b) => a - b)[0] || fallback);
  }, [companyTimeline, snapshots]);
  const totalDays = Math.max(1, Math.round((new Date(`${currentDate}T12:00:00`) - new Date(`${earliestDate}T12:00:00`)) / DAY));
  const selectedDay = Math.max(
    0,
    Math.min(totalDays, Math.round((new Date(`${selectedDate}T12:00:00`) - new Date(`${earliestDate}T12:00:00`)) / DAY)),
  );

  const selectedState = useMemo(
    () => reconstructCompanyState(data, selectedDate, snapshots, timelines),
    [data, selectedDate, snapshots, timelines],
  );
  const baselineState = useMemo(
    () => reconstructCompanyState(data, comparisonDate, snapshots, timelines),
    [data, comparisonDate, snapshots, timelines],
  );
  const comparison = useMemo(
    () => compareHistoricalStates(selectedState, baselineState),
    [selectedState, baselineState],
  );
  const replay = useMemo(
    () => explainHistoricalChanges(selectedState, baselineState, companyTimeline),
    [selectedState, baselineState, companyTimeline],
  );
  const historicalSeries = useMemo(
    () => buildHistoricalSeries(data, timelines, snapshots, { endDate: selectedDate }),
    [data, timelines, snapshots, selectedDate],
  );
  const bestPeriod = historicalSeries.reduce((best, point) => (!best || point.healthScore > best.healthScore ? point : best), null);
  const worstPeriod = historicalSeries.reduce((worst, point) => (!worst || point.healthScore < worst.healthScore ? point : worst), null);

  const jumpTo = (kind) => {
    const date = new Date();
    if (kind === '7') date.setDate(date.getDate() - 7);
    if (kind === '30') date.setDate(date.getDate() - 30);
    if (kind === 'month') date.setDate(1);
    if (kind === 'year') {
      date.setMonth(0);
      date.setDate(1);
    }
    setSelectedDate(toDateKey(date));
  };

  const updateSlider = (value) => {
    const date = new Date(`${earliestDate}T12:00:00`);
    date.setDate(date.getDate() + Number(value));
    setSelectedDate(toDateKey(date));
  };

  const metrics = selectedState.metrics;
  const state = selectedState.state;

  return (
    <section className="page-stack time-machine-page">
      <header className="time-hero">
        <div>
          <p className="eyebrow">Velora OS Time Machine</p>
          <h1>The company remembers</h1>
          <p>Travel through Velora's operating history, compare company states, and replay the decisions behind every major change.</p>
        </div>
        <div className="time-hero-date">
          <CalendarClock size={22} />
          <div>
            <small>Viewing company state</small>
            <strong>{formatDate(selectedDate)}</strong>
            <span className={selectedState.source === 'snapshot' ? 'exact' : 'estimated'}>
              {selectedState.source === 'snapshot' ? <CheckCircle2 size={13} /> : <RefreshCw size={13} />}
              {selectedState.confidence}
            </span>
          </div>
        </div>
      </header>

      <section className="time-controls">
        <div className="time-date-control">
          <label>
            <CalendarDays size={17} />
            <span>Travel to date</span>
            <input
              type="date"
              min={earliestDate}
              max={currentDate}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <div className="time-quick-jumps">
            <button onClick={() => jumpTo('7')}>7 days ago</button>
            <button onClick={() => jumpTo('30')}>30 days ago</button>
            <button onClick={() => jumpTo('month')}>Start of month</button>
            <button onClick={() => jumpTo('year')}>Start of year</button>
            <button onClick={() => setSelectedDate(currentDate)}>Today</button>
          </div>
        </div>
        <div className="time-slider-wrap">
          <span>{formatDate(earliestDate, { month: 'short', year: 'numeric' })}</span>
          <input
            aria-label="Company history timeline"
            type="range"
            min="0"
            max={totalDays}
            value={selectedDay}
            onChange={(event) => updateSlider(event.target.value)}
          />
          <span>Today</span>
        </div>
        <div className="time-compare-control">
          <button className={compareMode ? 'active' : ''} onClick={() => setCompareMode((value) => !value)}>
            <GitCompareArrows size={17} />
            Compare dates
          </button>
          {compareMode && (
            <label>
              <span>Baseline</span>
              <input
                type="date"
                min={earliestDate}
                max={selectedDate}
                value={comparisonDate}
                onChange={(event) => setComparisonDate(event.target.value)}
              />
            </label>
          )}
        </div>
      </section>

      {!snapshotState.loading && !snapshotState.available && !snapshotState.error && (
        <div className="time-setup-note">
          <History size={18} />
          <div>
            <strong>Historical reconstruction is active</strong>
            <span>Run <code>supabase/phase5-time-machine.sql</code> to begin exact daily snapshots. Existing history remains available as an estimate.</span>
          </div>
        </div>
      )}
      {snapshotState.error && (
        <div className="time-setup-note error">
          <RefreshCw size={18} />
          <div><strong>Snapshot sync is temporarily unavailable</strong><span>{snapshotState.error}</span></div>
        </div>
      )}

      <div className="time-kpi-grid">
        <MetricCard icon={CircleDollarSign} label="Revenue" value={metrics.revenue} detail="Recorded order value" delta={compareMode ? comparison.revenue.difference : undefined} moneyValue />
        <MetricCard icon={TrendingUp} label="Profit" value={metrics.profit} detail="Operating order profit" delta={compareMode ? comparison.profit.difference : undefined} moneyValue />
        <MetricCard icon={PackageSearch} label="Inventory value" value={metrics.inventoryValue} detail={`${number(metrics.inventoryUnits)} units in stock`} delta={compareMode ? comparison.inventoryValue.difference : undefined} moneyValue />
        <MetricCard icon={Truck} label="Active shipments" value={metrics.activeShipments} detail={`${number(metrics.deliveredShipments)} delivered`} delta={compareMode ? comparison.activeShipments.difference : undefined} />
        <MetricCard icon={Users} label="Customers" value={metrics.customers} detail="Known customer records" delta={compareMode ? comparison.customers.difference : undefined} />
        <MetricCard icon={HeartPulse} label="Company health" value={metrics.healthScore} detail="Composite operating score" delta={compareMode ? comparison.healthScore.difference : undefined} suffix="/100" />
      </div>

      {compareMode && (
        <section className="time-panel time-compare-panel">
          <div className="time-section-heading">
            <div>
              <p className="eyebrow">Compare mode</p>
              <h2>{formatDate(comparisonDate)} <ArrowRight size={18} /> {formatDate(selectedDate)}</h2>
              <span>Movement between the two reconstructed company states.</span>
            </div>
          </div>
          <div className="time-compare-grid">
            {[
              ['Revenue', comparison.revenue, true],
              ['Profit', comparison.profit, true],
              ['Inventory', comparison.inventoryUnits, false],
              ['Shipments', comparison.activeShipments, false],
              ['Customer growth', comparison.customers, false],
            ].map(([label, metric, isMoney]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{isMoney ? money(metric.value) : number(metric.value)}</strong>
                <Delta value={metric.difference} moneyValue={isMoney} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="time-analytics-grid">
        <HistoricalChart
          title="Commercial trajectory"
          description="Revenue and profit reconstructed across the company timeline."
          data={historicalSeries}
          firstKey="revenue"
          secondKey="profit"
          firstLabel="Revenue"
          secondLabel="Profit"
          moneyValues
        />
        <HistoricalChart
          title="Operational growth"
          description="Customer and shipment movement over time."
          data={historicalSeries}
          firstKey="customers"
          secondKey="activeShipments"
          firstLabel="Customers"
          secondLabel="Active shipments"
        />
      </div>

      <div className="time-insight-grid">
        <section className="time-panel time-health-panel">
          <div className="time-section-heading">
            <div>
              <p className="eyebrow">Historical company health</p>
              <h2>{metrics.healthScore}/100 on {formatDate(selectedDate)}</h2>
            </div>
          </div>
          <div className="time-health-score">
            <div className="time-health-ring" style={{ '--score': `${metrics.healthScore * 3.6}deg` }}>
              <strong>{metrics.healthScore}</strong><small>Health</small>
            </div>
            <div className="time-health-factors">
              {Object.entries(metrics.healthFactors).map(([key, value]) => (
                <div key={key}>
                  <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                  <b>{value}%</b>
                  <i><em style={{ width: `${value}%` }} /></i>
                </div>
              ))}
            </div>
          </div>
          <div className="time-periods">
            <div><TrendingUp size={17} /><span>Best period</span><strong>{bestPeriod?.label || 'Building history'}</strong></div>
            <div><TrendingDown size={17} /><span>Lowest period</span><strong>{worstPeriod?.label || 'Building history'}</strong></div>
          </div>
        </section>

        <section className="time-panel time-replay-panel">
          <div className="time-section-heading">
            <div>
              <p className="eyebrow">Decision replay</p>
              <h2>What changed, and why?</h2>
              <span>Evidence-led explanations from company activity between the compared dates.</span>
            </div>
          </div>
          <div className="time-replay-list">
            {replay.recommendations.map((item) => (
              <article key={item.title} className={`time-replay ${item.severity.toLowerCase()}`}>
                <Sparkles size={17} />
                <div><strong>{item.title}</strong><p>{item.explanation}</p></div>
              </article>
            ))}
          </div>
          <div className="time-replay-events">
            {replay.relatedEvents.slice(0, 5).map((event) => (
              <div key={event.id}><Clock3 size={14} /><span>{event.title}</span><time>{formatDate(event.date)}</time></div>
            ))}
          </div>
        </section>
      </div>

      <TimelineList events={companyTimeline} selectedDate={selectedDate} onNavigate={onNavigate} />

      <section className="time-panel time-twin-launcher">
        <div>
          <p className="eyebrow">Digital Twin history mode</p>
          <h2>Walk through the company as it operated then</h2>
          <span>Load the reconstructed records into Velora's connected operational model.</span>
        </div>
        <button onClick={() => setShowHistoricalTwin((value) => !value)}>
          <History size={17} />
          {showHistoricalTwin ? 'Close historical twin' : 'Open historical twin'}
        </button>
      </section>

      {showHistoricalTwin && (
        <div className="time-historical-twin">
          <DigitalTwin
            {...state}
            onNavigate={onNavigate}
            canViewFinancials={canViewFinancials}
            asOfDate={selectedDate}
            historyMode
          />
        </div>
      )}
    </section>
  );
}
