import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Gauge,
  Handshake,
  Lightbulb,
  MessageSquareText,
  Network,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Target,
  Truck,
  Users,
} from 'lucide-react';
import { buildAiExecutiveOperatingSystem } from '../services/aiExecutiveService';
import '../ai-os.css';

const money = (value) => `\u20b9${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;
const number = (value) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value) || 0);

const executiveIcons = {
  coo: Bot,
  cfo: CircleDollarSign,
  hr: Users,
  logistics: Truck,
  procurement: PackageSearch,
  strategy: Target,
};

const scoreIcons = {
  finance: CircleDollarSign,
  operations: Gauge,
  logistics: Truck,
  procurement: PackageSearch,
  hr: Users,
  projects: ClipboardList,
  ecosystem: Network,
};

function Confidence({ value }) {
  const confidence = value || { score: 50, label: 'Developing' };
  return (
    <span className="aios-confidence">
      <i><em style={{ width: `${confidence.score}%` }} /></i>
      {confidence.label}
    </span>
  );
}

function Severity({ value }) {
  return <span className={`aios-severity ${String(value || 'Medium').toLowerCase()}`}>{value}</span>;
}

function AiosMetric({ icon: Icon, label, value, detail, tone = '' }) {
  return (
    <article className={`aios-metric ${tone}`}>
      <span><Icon size={19} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{detail}</em>
      </div>
    </article>
  );
}

function ExecutiveCard({ executive }) {
  const Icon = executiveIcons[executive.id] || Bot;
  return (
    <article className="aios-executive-card">
      <header>
        <span><Icon size={20} /></span>
        <div>
          <small>{executive.domain}</small>
          <h3>{executive.title}</h3>
        </div>
        <strong>{executive.score}</strong>
      </header>
      <p>{executive.stance}</p>
      <div className="aios-executive-section">
        <small>Observations</small>
        {executive.observations.slice(0, 2).map((item) => <span key={item}>{item}</span>)}
      </div>
      <div className="aios-executive-section">
        <small>Recommendation</small>
        <span>{executive.recommendations[0]}</span>
      </div>
      <Confidence value={executive.confidence} />
    </article>
  );
}

function Scorecard({ item }) {
  const Icon = scoreIcons[item.key] || Gauge;
  return (
    <article className="aios-scorecard">
      <header>
        <span><Icon size={18} /></span>
        <strong>{item.label}</strong>
        <b>{item.score}/100</b>
      </header>
      <i><em style={{ width: `${item.score}%` }} /></i>
      <p>{item.detail}</p>
    </article>
  );
}

export default function AiOperatingSystemCenter({
  vehicles = [],
  orders = [],
  customers = [],
  shipments = [],
  procurementRequests = [],
  suppliers = [],
  logisticsPartners = [],
  financeRecords = [],
  employees = [],
  payrollRecords = [],
  documents = [],
  strategicScenarios = [],
  ecosystemCompanies = [],
  ecosystemRelationships = [],
  canViewFinancials = true,
  onNavigate,
}) {
  const [briefingView, setBriefingView] = useState('Daily');
  const [question, setQuestion] = useState('What should we focus on today?');
  const [answer, setAnswer] = useState('');

  const intelligence = useMemo(() => buildAiExecutiveOperatingSystem({
    vehicles,
    orders,
    customers,
    shipments,
    procurementRequests,
    suppliers,
    logisticsPartners,
    financeRecords: canViewFinancials ? financeRecords : [],
    employees,
    payrollRecords: canViewFinancials ? payrollRecords : [],
    documents,
    strategicScenarios,
    ecosystemCompanies,
    ecosystemRelationships,
  }), [
    vehicles,
    orders,
    customers,
    shipments,
    procurementRequests,
    suppliers,
    logisticsPartners,
    financeRecords,
    employees,
    payrollRecords,
    documents,
    strategicScenarios,
    ecosystemCompanies,
    ecosystemRelationships,
    canViewFinancials,
  ]);

  const briefing = intelligence.briefings[briefingView];
  const topRisk = intelligence.findings.find((item) => item.type === 'Risk');
  const topOpportunity = intelligence.findings.find((item) => item.type === 'Opportunity');

  const askBoard = (prompt = question) => {
    setQuestion(prompt);
    setAnswer(intelligence.answerQuestion(prompt));
  };

  return (
    <div className="aios-page">
      <header className="section-heading page-header aios-hero">
        <div>
          <p className="eyebrow">AI Operating System</p>
          <h1>Digital executive board</h1>
          <p className="page-description">
            Specialized AI executives monitor finance, operations, HR, logistics, procurement, strategy, and ecosystem signals with human-approved recommendations.
          </p>
        </div>
        <div className="aios-hero-badge">
          <BrainCircuit size={20} />
          <span>Human approval required</span>
        </div>
      </header>

      <section className="aios-metrics-grid">
        <AiosMetric icon={Sparkles} label="Recommendations" value={number(intelligence.performance.recommendationsGenerated)} detail="Generated by AI executives" />
        <AiosMetric icon={AlertTriangle} label="Risks detected" value={number(intelligence.performance.risksDetected)} detail={topRisk?.title || 'No critical risk'} tone="risk" />
        <AiosMetric icon={Lightbulb} label="Opportunities" value={number(intelligence.performance.opportunitiesDiscovered)} detail={topOpportunity?.title || 'Monitoring market signals'} tone="opportunity" />
        <AiosMetric icon={BarChart3} label="Executive activity" value={number(intelligence.performance.executiveActivity)} detail="Observations and actions" />
        {canViewFinancials && <AiosMetric icon={CircleDollarSign} label="Board revenue" value={money(intelligence.metrics.revenue)} detail={`Profit ${money(intelligence.metrics.profit)}`} tone="finance" />}
      </section>

      <section className="aios-grid main">
        <div className="aios-panel">
          <div className="aios-panel-heading">
            <div>
              <p className="eyebrow">AI Executive Board</p>
              <h2>Specialized digital executives</h2>
            </div>
            <span>{new Date(intelligence.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="aios-executive-grid">
            {intelligence.executives.map((executive) => <ExecutiveCard executive={executive} key={executive.id} />)}
          </div>
        </div>

        <aside className="aios-panel">
          <p className="eyebrow">AI Command Center</p>
          <h2>Ask the executive board</h2>
          <div className="aios-question-list">
            {[
              'What should we focus on today?',
              'What is our biggest risk?',
              'What is our biggest opportunity?',
              'Which department needs attention?',
              'Which supplier is underperforming?',
              'Which project is at risk?',
            ].map((item) => <button type="button" key={item} onClick={() => askBoard(item)}>{item}</button>)}
          </div>
          <label className="aios-command-input">
            <MessageSquareText size={17} />
            <input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && askBoard()} />
          </label>
          <button className="aios-primary-button" type="button" onClick={() => askBoard()}><Sparkles size={16} />Ask board</button>
          <div className="aios-answer">
            <strong>Board response</strong>
            <p>{answer || intelligence.answerQuestion(question)}</p>
          </div>
        </aside>
      </section>

      <section className="aios-grid two">
        <div className="aios-panel">
          <div className="aios-panel-heading">
            <div>
              <p className="eyebrow">Executive briefings</p>
              <h2>{briefing.title}</h2>
            </div>
            <div className="aios-tabs">
              {Object.keys(intelligence.briefings).map((view) => (
                <button type="button" className={briefingView === view ? 'active' : ''} onClick={() => setBriefingView(view)} key={view}>{view}</button>
              ))}
            </div>
          </div>
          <div className="aios-briefing">
            <strong>{briefing.headline}</strong>
            {briefing.bullets.map((bullet) => <p key={bullet}>{bullet}</p>)}
          </div>
        </div>

        <div className="aios-panel">
          <p className="eyebrow">Cross-AI collaboration</p>
          <h2>Shared findings</h2>
          <div className="aios-collaboration-list">
            {intelligence.collaboration.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.explanation}</p>
                </div>
                <footer>
                  {item.contributors.map((contributor) => <span key={contributor}>{contributor}</span>)}
                </footer>
                <em>{item.consensus}</em>
                <Confidence value={item.confidence} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="aios-panel">
        <div className="aios-panel-heading">
          <div>
            <p className="eyebrow">Executive scorecards</p>
            <h2>Department health scores</h2>
          </div>
        </div>
        <div className="aios-score-grid">
          {intelligence.scorecards.map((item) => <Scorecard item={item} key={item.key} />)}
        </div>
      </section>

      <section className="aios-grid two">
        <div className="aios-panel">
          <p className="eyebrow">Strategic recommendation engine</p>
          <h2>Human-approved actions</h2>
          <div className="aios-recommendation-list">
            {intelligence.recommendations.map((item) => (
              <article key={item.id}>
                <header>
                  <span>{item.owner}</span>
                  <b>{item.impact}/100 impact</b>
                </header>
                <strong>{item.title}</strong>
                <p>{item.reason}</p>
                <footer>
                  <button type="button" onClick={() => onNavigate?.(item.module)}>{item.module}</button>
                  <em><ShieldCheck size={13} /> Approval required</em>
                </footer>
              </article>
            ))}
          </div>
        </div>

        <div className="aios-panel">
          <p className="eyebrow">AI Boardroom</p>
          <h2>Consensus view</h2>
          <div className="aios-boardroom">
            {intelligence.boardroom.opinions.map((opinion) => (
              <article key={opinion.executive}>
                <strong>{opinion.executive}</strong>
                <p>{opinion.stance}</p>
                <span>{opinion.score}/100</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="aios-grid two">
        <div className="aios-panel">
          <p className="eyebrow">AI governance</p>
          <h2>Explainability and audit foundation</h2>
          <div className="aios-governance-grid">
            {['Every recommendation includes reasoning', 'Confidence scores are visible', 'No autonomous execution is enabled', 'Human approval remains mandatory'].map((item) => (
              <article key={item}><CheckCircle2 size={17} /><span>{item}</span></article>
            ))}
          </div>
        </div>
        <div className="aios-panel">
          <p className="eyebrow">Executive memory foundation</p>
          <h2>Connected intelligence sources</h2>
          <div className="aios-memory-list">
            {[
              ['Time Machine', 'Historical operating state and change analysis'],
              ['Strategic War Room', 'Future simulations and scenario planning'],
              ['Knowledge Hub', `${documents.length} documents available for future AI memory`],
              ['Marketplace', 'Customers, suppliers, partners, and ecosystem opportunities'],
            ].map(([title, detail]) => (
              <article key={title}><Handshake size={16} /><div><strong>{title}</strong><p>{detail}</p></div></article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
