import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Eye,
  FileText,
  Gauge,
  Globe2,
  History,
  LayoutDashboard,
  Network,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import {
  APP_VERSION,
  BUILD_CHANNEL,
  buildDemoCompanyState,
  buildOnboardingChecklist,
  productFeatures,
  releaseNotes,
  tourSteps,
} from '../services/productizationService';
import '../productization.css';

const money = (value) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;

function ProductBrand({ compact = false }) {
  return (
    <div className={`product-brand ${compact ? 'compact' : ''}`}>
      <span>VO</span>
      <div>
        <strong>Velora OS</strong>
        <small>Automotive operations platform</small>
      </div>
    </div>
  );
}

function DemoPreview({ compact = false }) {
  const demo = useMemo(() => buildDemoCompanyState(), []);
  const revenue = demo.orders.reduce((sum, order) => sum + Number(order.totalRevenue || 0), 0);
  const profit = demo.orders.reduce((sum, order) => sum + Number(order.totalProfit || 0), 0);
  return (
    <div className={`demo-preview ${compact ? 'compact' : ''}`}>
      <div className="demo-window-bar"><span /><span /><span /></div>
      <div className="demo-kpis">
        <article><small>Revenue</small><strong>{money(revenue)}</strong></article>
        <article><small>Profit</small><strong>{money(profit)}</strong></article>
        <article><small>Shipments</small><strong>{demo.shipments.length}</strong></article>
      </div>
      <div className="demo-flow">
        {demo.orders.map((order) => (
          <div key={order.id}>
            <span>{order.orderNumber}</span>
            <strong>{order.customerName}</strong>
            <small>{order.status}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductLandingPage() {
  return (
    <main className="product-page">
      <nav className="product-nav">
        <ProductBrand compact />
        <div>
          <a href="/demo">Demo</a>
          <a href="/showcase">Showcase</a>
          <a href="/privacy">Privacy</a>
          <a className="product-login" href="/app">Login / Sign up</a>
        </div>
      </nav>
      <section className="product-hero">
        <div>
          <p className="eyebrow">Velora Motors operating system</p>
          <h1>Run automotive sales, exports, logistics, finance, and strategy from one command layer.</h1>
          <p>
            Velora OS combines dealership operations, procurement, shipment tracking,
            financial intelligence, AI COO recommendations, historical memory, and
            future simulations in a premium enterprise workspace.
          </p>
          <div className="product-actions">
            <a href="/app">Open Velora OS <ArrowRight size={17} /></a>
            <a href="/demo" className="secondary">View safe demo <PlayCircle size={17} /></a>
          </div>
        </div>
        <DemoPreview />
      </section>
      <section className="product-strip">
        {[
          ['AI COO', 'Executive recommendations'],
          ['Time Machine', 'Historical company memory'],
          ['War Room', 'Future simulations'],
          ['Ecosystem', 'Multi-company network'],
        ].map(([label, text]) => (
          <article key={label}><strong>{label}</strong><span>{text}</span></article>
        ))}
      </section>
      <section className="feature-section">
        <div className="section-heading">
          <p className="eyebrow">Platform</p>
          <h2>Built for serious automotive operations</h2>
        </div>
        <div className="feature-grid">
          {productFeatures.map((feature) => (
            <article key={feature.title}>
              <Sparkles size={19} />
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="showcase-band">
        <div>
          <p className="eyebrow">Investor-ready</p>
          <h2>A platform story, not just an internal tool.</h2>
          <p>Use Showcase Mode to present AI COO, Digital Twin, Time Machine, Strategic War Room, and Ecosystem capabilities without exposing production data.</p>
        </div>
        <a href="/showcase">Open showcase <ArrowRight size={17} /></a>
      </section>
    </main>
  );
}

export function DemoModePage() {
  const demo = useMemo(() => buildDemoCompanyState(), []);
  return (
    <main className="product-page demo-mode-page">
      <nav className="product-nav">
        <ProductBrand compact />
        <a className="product-login" href="/">Back to product</a>
      </nav>
      <header className="product-hero compact">
        <div>
          <p className="eyebrow">Safe demo mode</p>
          <h1>Explore Velora OS with isolated sample data.</h1>
          <p>Demo mode is read-only and does not write to your Supabase project or real company records.</p>
          <div className="product-actions">
            <a href="/app">Use real workspace <ArrowRight size={17} /></a>
          </div>
        </div>
        <DemoPreview />
      </header>
      <section className="demo-sections">
        <article>
          <h2>Demo AI COO insights</h2>
          {demo.insights.map((insight) => <p key={insight}><Bot size={16} />{insight}</p>)}
        </article>
        <article>
          <h2>Demo shipments</h2>
          {demo.shipments.map((shipment) => (
            <p key={shipment.shipmentId}><Globe2 size={16} />{shipment.shipmentId} - {shipment.destinationCountry} - {shipment.status}</p>
          ))}
        </article>
      </section>
    </main>
  );
}

export function ProductShowcasePage({ embedded = false }) {
  const cards = [
    ['Company health', Gauge, 'Unified score across profit, delivery, payments, procurement, and operational risk.'],
    ['AI COO', Bot, 'Daily priorities, risks, opportunities, recommendations, and explainable action items.'],
    ['Digital Twin', Globe2, 'Live operational map of vehicles, customers, suppliers, shipments, and bottlenecks.'],
    ['Time Machine', History, 'Replay company history and compare any two dates without changing data.'],
    ['Strategic War Room', Target, 'Simulate procurement, sales, freight, delays, supplier risk, and market expansion.'],
    ['Ecosystem map', Network, 'Understand companies, partners, suppliers, customers, and inter-company value flow.'],
  ];
  const content = (
    <>
      <header className="showcase-hero">
        <p className="eyebrow">Showcase mode</p>
        <h1>Velora OS as an enterprise operating layer.</h1>
        <p>Presentation-friendly overview for investors, partners, customers, and enterprise stakeholders.</p>
      </header>
      <div className="showcase-grid">
        {cards.map(([title, Icon, text]) => (
          <article key={title}>
            <Icon size={22} />
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </>
  );
  if (embedded) return <div className="product-embedded-showcase">{content}</div>;
  return (
    <main className="product-page">
      <nav className="product-nav">
        <ProductBrand compact />
        <a className="product-login" href="/">Back to product</a>
      </nav>
      {content}
    </main>
  );
}

export function OnboardingCenter({ company, profile, hasData, onNavigate }) {
  const checklist = useMemo(() => buildOnboardingChecklist({ company, profile, hasData }), [company, hasData, profile]);
  const completed = checklist.filter((item) => item.done).length;
  return (
    <div className="product-workspace-page">
      <header className="workspace-product-hero">
        <p className="eyebrow">First-time setup</p>
        <h1>Launch Velora OS with a clean operating foundation.</h1>
        <p>Complete company profile, role access, demo preview, team setup, and readiness checks before sharing the workspace.</p>
        <div className="setup-progress"><span style={{ width: `${(completed / checklist.length) * 100}%` }} /></div>
      </header>
      <div className="onboarding-grid">
        {checklist.map((item) => (
          <article key={item.label} className={item.done ? 'done' : ''}>
            <CheckCircle2 size={19} />
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="onboarding-actions">
        <button onClick={() => onNavigate('Settings')}><Building2 size={17} />Company setup</button>
        <button onClick={() => onNavigate('User Management')}><Users size={17} />Team access</button>
        <button onClick={() => onNavigate('Launch Readiness')}><ShieldCheck size={17} />Launch checklist</button>
        <a href="/demo" target="_blank" rel="noreferrer"><Eye size={17} />Open demo mode</a>
      </div>
    </div>
  );
}

export function ProductTourCenter({ activePage, onNavigate }) {
  const [selected, setSelected] = useState(tourSteps[activePage] ? activePage : 'Command Center');
  const modules = Object.keys(tourSteps);
  return (
    <div className="product-workspace-page">
      <header className="workspace-product-hero">
        <p className="eyebrow">Guided tours</p>
        <h1>Learn the flagship workflows without guessing.</h1>
        <p>Short, role-friendly tours for the modules that matter most during demos and onboarding.</p>
      </header>
      <div className="tour-layout">
        <aside>
          {modules.map((module) => (
            <button key={module} className={selected === module ? 'active' : ''} onClick={() => setSelected(module)}>
              <Compass size={16} />{module}
            </button>
          ))}
        </aside>
        <section>
          <h2>{selected}</h2>
          {tourSteps[selected].map((step, index) => (
            <article key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </article>
          ))}
          <button onClick={() => onNavigate(selected)}><ArrowRight size={17} />Open {selected}</button>
        </section>
      </div>
    </div>
  );
}

export function ReleaseNotesCenter() {
  return (
    <div className="product-workspace-page">
      <header className="workspace-product-hero compact">
        <p className="eyebrow">Release notes</p>
        <h1>Velora OS {APP_VERSION}</h1>
        <p>{BUILD_CHANNEL}. Track platform progress, product milestones, and launch-readiness changes.</p>
      </header>
      <div className="release-list">
        {releaseNotes.map((release) => (
          <article key={release.version}>
            <div>
              <span>v{release.version}</span>
              <small>{release.date}</small>
            </div>
            <section>
              <h2>{release.title}</h2>
              {release.notes.map((note) => <p key={note}><FileText size={15} />{note}</p>)}
            </section>
          </article>
        ))}
      </div>
    </div>
  );
}

export function VersionBadge() {
  return (
    <span className="version-badge">
      <Clock size={13} />
      v{APP_VERSION}
    </span>
  );
}
