import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Crosshair,
  Filter,
  Globe2,
  Network,
  PackageCheck,
  Route,
  Search,
  Truck,
  Users,
  Warehouse,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  buildDigitalTwin,
  getDigitalTwinFilterOptions,
} from '../services/digitalTwinService';

const initialFilters = {
  search: '',
  country: 'All',
  customer: 'All',
  supplier: 'All',
  vehicle: 'All',
  shipmentStatus: 'All',
  procurementStatus: 'All',
  startDate: '',
  endDate: '',
};

const mapColors = {
  Customer: '#38bdf8',
  Supplier: '#a78bfa',
  Origin: '#22c55e',
  Destination: '#f59e0b',
};

const graphColors = {
  Customer: '#38bdf8',
  Order: '#3b82f6',
  Vehicle: '#22c55e',
  Shipment: '#f59e0b',
  Supplier: '#a78bfa',
  Procurement: '#f472b6',
};

const flowIcons = {
  procurement: Warehouse,
  inventory: Boxes,
  orders: PackageCheck,
  shipments: Truck,
  delivery: Route,
  payment: CircleDollarSign,
};

function formatIndianNumber(value) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function formatMoney(value) {
  return `₹${formatIndianNumber(value)}`;
}

function formatDateTime(value) {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString();
}

function DetailPanel({ item, onNavigate }) {
  if (!item) {
    return (
      <div className="twin-detail-empty">
        <Crosshair size={24} />
        <strong>Select a map point or graph node</strong>
        <span>Linked operational details will appear here.</span>
      </div>
    );
  }

  const record = item.record || {};
  const details = Object.entries(record)
    .filter(([, value]) => value !== '' && value !== null && value !== undefined && typeof value !== 'object')
    .slice(0, 7);

  return (
    <div className="twin-detail">
      <div>
        <span className="twin-node-type">{item.type || item.module || 'Record'}</span>
        <h3>{item.label || item.title}</h3>
        {item.meta && <p>{item.meta}</p>}
      </div>
      <dl>
        {details.map(([key, value]) => (
          <div key={key}>
            <dt>{key.replace(/([A-Z])/g, ' $1')}</dt>
            <dd>{String(value)}</dd>
          </div>
        ))}
      </dl>
      {item.page && (
        <button onClick={() => onNavigate(item.page)}>
          Open {item.page}
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

function TwinFilters({ filters, options, onChange, onReset }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });
  return (
    <section className="twin-filter-bar" aria-label="Digital Twin filters">
      <div className="twin-filter-title">
        <Filter size={17} />
        <div>
          <strong>Live scope</strong>
          <small>All twin views update together</small>
        </div>
      </div>
      <label className="twin-search">
        <Search size={16} />
        <input
          value={filters.search}
          onChange={(event) => set('search', event.target.value)}
          placeholder="Search the company twin"
        />
      </label>
      <select aria-label="Country" value={filters.country} onChange={(event) => set('country', event.target.value)}>
        <option>All</option>
        {options.countries.map((value) => <option key={value}>{value}</option>)}
      </select>
      <select aria-label="Customer" value={filters.customer} onChange={(event) => set('customer', event.target.value)}>
        <option>All</option>
        {options.customers.map((value) => <option key={value}>{value}</option>)}
      </select>
      <select aria-label="Supplier" value={filters.supplier} onChange={(event) => set('supplier', event.target.value)}>
        <option>All</option>
        {options.suppliers.map((value) => <option key={value}>{value}</option>)}
      </select>
      <select aria-label="Vehicle" value={filters.vehicle} onChange={(event) => set('vehicle', event.target.value)}>
        <option>All</option>
        {options.vehicles.map((value) => <option key={value}>{value}</option>)}
      </select>
      <select aria-label="Shipment status" value={filters.shipmentStatus} onChange={(event) => set('shipmentStatus', event.target.value)}>
        <option>All</option>
        {options.shipmentStatuses.map((value) => <option key={value}>{value}</option>)}
      </select>
      <select aria-label="Procurement status" value={filters.procurementStatus} onChange={(event) => set('procurementStatus', event.target.value)}>
        <option>All</option>
        {options.procurementStatuses.map((value) => <option key={value}>{value}</option>)}
      </select>
      <input aria-label="Start date" type="date" value={filters.startDate} onChange={(event) => set('startDate', event.target.value)} />
      <input aria-label="End date" type="date" value={filters.endDate} onChange={(event) => set('endDate', event.target.value)} />
      <button className="twin-reset-button" type="button" onClick={onReset}>Reset</button>
    </section>
  );
}

function OperationFlow({ stages, bottlenecks, onNavigate }) {
  const bottleneckByStage = Object.fromEntries(bottlenecks.map((item) => [item.stage, item]));
  return (
    <section className="twin-panel twin-flow-panel">
      <div className="twin-panel-heading">
        <div>
          <p className="eyebrow">Operation flow</p>
          <h2>Company movement</h2>
        </div>
        <span className="live-indicator"><i /> Live</span>
      </div>
      <div className="twin-flow">
        {stages.map((stage, index) => {
          const Icon = flowIcons[stage.id] || Activity;
          const issue = bottleneckByStage[stage.label] || bottleneckByStage[stage.id];
          return (
            <React.Fragment key={stage.id}>
              <button
                className={`twin-flow-stage ${issue ? 'has-bottleneck' : ''}`}
                onClick={() => onNavigate(stage.page)}
              >
                <span><Icon size={20} /></span>
                <strong>{stage.count}</strong>
                <small>{stage.label}</small>
                {issue && <b>{issue.count} blocked</b>}
              </button>
              {index < stages.length - 1 && (
                <div className="twin-flow-link" aria-hidden="true">
                  <i />
                  <ChevronRight size={17} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}

function CompanyMap({ map, selected, onSelect }) {
  const [zoom, setZoom] = useState(1);
  const transform = `translate(${410 - 410 * zoom} ${195 - 195 * zoom}) scale(${zoom})`;

  return (
    <section className="twin-panel twin-map-panel">
      <div className="twin-panel-heading">
        <div>
          <p className="eyebrow">Live company map</p>
          <h2>Global operating footprint</h2>
        </div>
        <div className="map-controls">
          <button aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(1, value - 0.25))}><ZoomOut size={17} /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(2.25, value + 0.25))}><ZoomIn size={17} /></button>
        </div>
      </div>
      <div className="twin-map-shell">
        <svg
          className="twin-world-map"
          viewBox="0 0 820 390"
          role="img"
          aria-label="World map of customers, suppliers, and shipment routes"
          onWheel={(event) => {
            event.preventDefault();
            setZoom((value) => Math.min(2.25, Math.max(1, value + (event.deltaY < 0 ? 0.15 : -0.15))));
          }}
        >
          <defs>
            <radialGradient id="mapGlow">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity=".22" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="820" height="390" fill="transparent" />
          <circle cx="410" cy="195" r="280" fill="url(#mapGlow)" />
          <g transform={transform}>
            {map.shapes.map((path, index) => <path className="twin-continent" d={path} key={index} />)}
            {map.routes.map((route) => {
              const midX = (route.origin.x + route.destination.x) / 2;
              const curve = Math.min(85, Math.abs(route.destination.x - route.origin.x) * 0.22);
              return (
                <path
                  className={`twin-route ${route.status === 'Delayed' ? 'delayed' : ''}`}
                  d={`M${route.origin.x},${route.origin.y} Q${midX},${Math.min(route.origin.y, route.destination.y) - curve} ${route.destination.x},${route.destination.y}`}
                  key={route.id}
                  onClick={() => onSelect(route)}
                />
              );
            })}
            {map.points.map((point) => (
              <g
                className={`twin-map-point ${selected?.id === point.id ? 'selected' : ''}`}
                key={point.id}
                transform={`translate(${point.x} ${point.y})`}
                onClick={() => onSelect(point)}
                role="button"
                tabIndex="0"
              >
                <circle className="point-pulse" r="11" fill={mapColors[point.type]} />
                <circle r="4.5" fill={mapColors[point.type]} />
                <title>{point.type}: {point.label}</title>
              </g>
            ))}
          </g>
        </svg>
        {!map.points.length && (
          <div className="twin-map-empty">
            <Globe2 size={28} />
            <strong>No mappable country data in this view</strong>
            <span>Add customer, supplier, origin, or destination countries to populate the map.</span>
          </div>
        )}
        <div className="map-legend">
          {Object.entries(mapColors).map(([label, color]) => (
            <span key={label}><i style={{ background: color }} />{label}</span>
          ))}
        </div>
      </div>
      {map.truncated && <p className="twin-cap-note">Map capped for browser performance. Use filters to inspect a narrower route or country scope.</p>}
    </section>
  );
}

function RelationshipGraph({ graph, selected, onSelect }) {
  return (
    <section className="twin-panel twin-graph-panel">
      <div className="twin-panel-heading">
        <div>
          <p className="eyebrow">Relationship graph</p>
          <h2>Connected business network</h2>
        </div>
        <span className="twin-count">{graph.nodes.length} nodes · {graph.edges.length} links</span>
      </div>
      <div className="twin-graph-shell">
        {graph.nodes.length ? (
          <svg viewBox="0 0 900 450" className="twin-graph" role="img" aria-label="Company relationship network">
            {graph.edges.map((edge) => {
              const source = graph.nodes.find((node) => node.id === edge.source);
              const target = graph.nodes.find((node) => node.id === edge.target);
              if (!source || !target) return null;
              return (
                <g key={edge.id}>
                  <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} />
                  <title>{edge.relationship}</title>
                </g>
              );
            })}
            {graph.nodes.map((node) => (
              <g
                className={`twin-graph-node ${selected?.id === node.id ? 'selected' : ''}`}
                key={node.id}
                transform={`translate(${node.x} ${node.y})`}
                onClick={() => onSelect(node)}
                role="button"
                tabIndex="0"
              >
                <circle r="17" fill={graphColors[node.type] || '#94a3b8'} />
                <text y="31">{node.label.length > 18 ? `${node.label.slice(0, 17)}…` : node.label}</text>
                <title>{node.type}: {node.label}</title>
              </g>
            ))}
          </svg>
        ) : (
          <div className="twin-graph-empty">
            <Network size={28} />
            <strong>No linked records in this scope</strong>
            <span>Relationships appear when orders, shipments, procurement, and master records share identifiers.</span>
          </div>
        )}
      </div>
      {graph.truncated && <p className="twin-cap-note">Graph capped at 120 nodes for browser performance. Narrow the filters to drill deeper.</p>}
    </section>
  );
}

function BottleneckPanel({ bottlenecks, onNavigate, canViewFinancials }) {
  const visible = bottlenecks.filter((item) => canViewFinancials || item.page !== 'Finance');
  return (
    <section className="twin-panel twin-bottleneck-panel">
      <div className="twin-panel-heading">
        <div>
          <p className="eyebrow">Bottleneck engine</p>
          <h2>What is slowing the company</h2>
        </div>
        <AlertTriangle size={20} />
      </div>
      <div className="twin-bottleneck-list">
        {visible.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.page)}>
            <span className={`twin-severity severity-${item.severity.toLowerCase()}`}>{item.severity}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.explanation}</p>
              <small>{item.count} affected{item.value ? ` · ${formatMoney(item.value)}` : ''}</small>
            </div>
            <ChevronRight size={17} />
          </button>
        ))}
        {!visible.length && (
          <div className="twin-clear-state">
            <PackageCheck size={28} />
            <strong>No active bottlenecks</strong>
            <span>The scoped operation flow is currently clear.</span>
          </div>
        )}
      </div>
    </section>
  );
}

function HealthView({ health, canViewFinancials }) {
  const metrics = [
    ...(canViewFinancials ? [
      { label: 'Revenue', value: formatMoney(health.revenue), icon: CircleDollarSign, tone: 'blue' },
      { label: 'Profit', value: formatMoney(health.profit), icon: Activity, tone: 'green' },
    ] : []),
    { label: 'Active orders', value: health.activeOrders, icon: PackageCheck, tone: 'blue' },
    { label: 'Active shipments', value: health.activeShipments, icon: Truck, tone: 'amber' },
    { label: 'Procurement efficiency', value: `${health.procurementEfficiency}%`, icon: Warehouse, tone: 'violet' },
    { label: 'Customer activity', value: `${health.customerActivity}%`, icon: Users, tone: 'cyan' },
  ];
  return (
    <section className="twin-panel twin-health-panel">
      <div className="twin-panel-heading">
        <div>
          <p className="eyebrow">Operational health</p>
          <h2>Live company vitals</h2>
        </div>
      </div>
      <div className="twin-health-grid">
        {metrics.map(({ label, value, icon: Icon, tone }) => (
          <article className={`twin-health-metric tone-${tone}`} key={label}>
            <span><Icon size={17} /></span>
            <div><small>{label}</small><strong>{value}</strong></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function VehicleLifecycle({ stages, onNavigate }) {
  const maximum = Math.max(...stages.map((item) => item.count), 1);
  return (
    <section className="twin-panel twin-lifecycle-panel">
      <div className="twin-panel-heading">
        <div>
          <p className="eyebrow">Vehicle flow</p>
          <h2>Lifecycle movement</h2>
        </div>
      </div>
      <div className="twin-lifecycle">
        {stages.map((stage, index) => (
          <button key={stage.id} onClick={() => onNavigate(stage.page)}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong>{stage.label}</strong>
              <i><em style={{ width: `${Math.max((stage.count / maximum) * 100, 3)}%` }} /></i>
            </div>
            <b>{formatIndianNumber(stage.count)}</b>
          </button>
        ))}
      </div>
    </section>
  );
}

function ActivityStream({ activity, onNavigate }) {
  const [module, setModule] = useState('All');
  const modules = ['All', ...new Set(activity.map((item) => item.module))];
  const visible = activity.filter((item) => module === 'All' || item.module === module);
  return (
    <section className="twin-panel twin-stream-panel">
      <div className="twin-panel-heading">
        <div>
          <p className="eyebrow">Company activity stream</p>
          <h2>Live operating events</h2>
        </div>
        <select value={module} onChange={(event) => setModule(event.target.value)}>
          {modules.map((value) => <option key={value}>{value}</option>)}
        </select>
      </div>
      <div className="twin-stream">
        {visible.slice(0, 18).map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.page)}>
            <span><Activity size={15} /></span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.module} · {item.detail}</small>
            </div>
            <time><Clock3 size={13} />{formatDateTime(item.time)}</time>
          </button>
        ))}
        {!visible.length && (
          <div className="twin-clear-state">
            <Clock3 size={27} />
            <strong>No activity in this scope</strong>
            <span>Change the filters or add operational records.</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default function DigitalTwin({
  vehicles,
  orders,
  customers,
  shipments,
  procurementRequests,
  suppliers,
  financeRecords,
  documents,
  onNavigate,
  canViewFinancials,
  asOfDate = null,
  historyMode = false,
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [selected, setSelected] = useState(null);
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
  const options = useMemo(() => getDigitalTwinFilterOptions(data), [data]);
  const twin = useMemo(
    () => buildDigitalTwin(data, filters, { asOfDate: asOfDate || undefined }),
    [data, filters, asOfDate],
  );

  return (
    <section className="page-stack digital-twin-page">
      <header className="twin-hero">
        <div>
          <p className="eyebrow">{historyMode ? 'Velora OS Historical Digital Twin' : 'Velora OS Digital Company Twin'}</p>
          <h1>{historyMode ? `Company state on ${new Date(`${asOfDate}T12:00:00`).toLocaleDateString('en-IN')}` : 'The company, alive'}</h1>
          <p>{historyMode
            ? 'Explore the operational flow, relationships, routes, and bottlenecks reconstructed for this point in company history.'
            : 'Follow every vehicle, relationship, route, delay, and commercial movement through one connected operational model.'}</p>
        </div>
        <div className="twin-live-summary">
          <span><i /> {historyMode ? 'Historical model' : 'Live model'}</span>
          <strong>{twin.graph.nodes.length + twin.map.points.length}</strong>
          <small>active visual entities</small>
        </div>
      </header>

      <TwinFilters filters={filters} options={options} onChange={setFilters} onReset={() => setFilters(initialFilters)} />
      <OperationFlow stages={twin.flow} bottlenecks={twin.bottlenecks} onNavigate={onNavigate} />

      <div className="twin-map-layout">
        <CompanyMap map={twin.map} selected={selected} onSelect={setSelected} />
        <aside className="twin-detail-panel">
          <DetailPanel item={selected} onNavigate={onNavigate} />
        </aside>
      </div>

      <div className="twin-insight-grid">
        <BottleneckPanel bottlenecks={twin.bottlenecks} onNavigate={onNavigate} canViewFinancials={canViewFinancials} />
        <HealthView health={twin.health} canViewFinancials={canViewFinancials} />
      </div>

      <VehicleLifecycle stages={twin.vehicleLifecycle} onNavigate={onNavigate} />
      <ActivityStream activity={twin.activity} onNavigate={onNavigate} />
    </section>
  );
}
