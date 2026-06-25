import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  GraduationCap,
  History,
  Lightbulb,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
  articleToRow,
  blankArticle,
  blankDecision,
  blankRevision,
  blankSop,
  blankTraining,
  buildKnowledgeAiContext,
  buildKnowledgeAnalytics,
  decisionToRow,
  handbookSections,
  knowledgeCategories,
  knowledgeStatuses,
  revisionToRow,
  rowToArticle,
  rowToDecision,
  rowToRevision,
  rowToSop,
  rowToTraining,
  sanitizeArticle,
  sanitizeDecision,
  sanitizeRevision,
  sanitizeSop,
  sanitizeTraining,
  searchKnowledge,
  sopModules,
  sopToRow,
  trainingDifficulties,
  trainingToRow,
} from '../services/knowledgeService';
import '../knowledge.css';

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

function KnowledgeMetric({ icon: Icon, label, value, detail, tone = '' }) {
  return (
    <article className={`knowledge-metric ${tone}`}>
      <span><Icon size={18} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{detail}</em>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  return <span className={`knowledge-status ${String(status).toLowerCase()}`}>{status}</span>;
}

function KnowledgeHub({ user, profile, companyId, documents = [], canEdit = false }) {
  const [articles, setArticles] = useState(() => loadLocal('velora-knowledge-articles', sanitizeArticle));
  const [sops, setSops] = useState(() => loadLocal('velora-knowledge-sops', sanitizeSop));
  const [trainings, setTrainings] = useState(() => loadLocal('velora-knowledge-training', sanitizeTraining));
  const [decisions, setDecisions] = useState(() => loadLocal('velora-knowledge-decisions', sanitizeDecision));
  const [revisions, setRevisions] = useState(() => loadLocal('velora-knowledge-revisions', sanitizeRevision));
  const [articleForm, setArticleForm] = useState(blankArticle);
  const [sopForm, setSopForm] = useState(blankSop);
  const [trainingForm, setTrainingForm] = useState(blankTraining);
  const [decisionForm, setDecisionForm] = useState(blankDecision);
  const [revisionForm, setRevisionForm] = useState(blankRevision);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [notice, setNotice] = useState('');
  const [syncAvailable, setSyncAvailable] = useState(true);

  const userDisplayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Velora user';
  const analytics = useMemo(() => buildKnowledgeAnalytics(articles, sops, trainings, decisions), [articles, decisions, sops, trainings]);
  const aiContext = useMemo(() => buildKnowledgeAiContext(articles, sops, trainings, decisions), [articles, decisions, sops, trainings]);
  const results = useMemo(
    () => searchKnowledge({ articles, sops, trainings, decisions }, query, categoryFilter, statusFilter),
    [articles, categoryFilter, decisions, query, sops, statusFilter, trainings],
  );
  const selectedArticle = articles.find((item) => item.id === selectedArticleId) || articles[0];
  const selectedRevisions = revisions.filter((revision) => revision.articleId === selectedArticle?.id);

  useEffect(() => {
    let mounted = true;
    async function loadKnowledge() {
      if (!user?.id) return;
      const [articleResult, sopResult, trainingResult, decisionResult, revisionResult] = await Promise.all([
        supabase.from('knowledge_articles').select('*').order('updated_at', { ascending: false }),
        supabase.from('knowledge_sops').select('*').order('updated_at', { ascending: false }),
        supabase.from('knowledge_training').select('*').order('created_at', { ascending: false }),
        supabase.from('knowledge_decisions').select('*').order('decision_date', { ascending: false }),
        supabase.from('knowledge_revisions').select('*').order('created_at', { ascending: false }),
      ]);
      if (!mounted) return;
      if (articleResult.error || sopResult.error || trainingResult.error || decisionResult.error || revisionResult.error) {
        setSyncAvailable(false);
        return;
      }
      const mappedArticles = (articleResult.data || []).map(rowToArticle);
      const mappedSops = (sopResult.data || []).map(rowToSop);
      const mappedTraining = (trainingResult.data || []).map(rowToTraining);
      const mappedDecisions = (decisionResult.data || []).map(rowToDecision);
      const mappedRevisions = (revisionResult.data || []).map(rowToRevision);
      setSyncAvailable(true);
      setArticles(mappedArticles);
      setSops(mappedSops);
      setTrainings(mappedTraining);
      setDecisions(mappedDecisions);
      setRevisions(mappedRevisions);
      saveLocal('velora-knowledge-articles', mappedArticles);
      saveLocal('velora-knowledge-sops', mappedSops);
      saveLocal('velora-knowledge-training', mappedTraining);
      saveLocal('velora-knowledge-decisions', mappedDecisions);
      saveLocal('velora-knowledge-revisions', mappedRevisions);
    }
    loadKnowledge();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  function toggleSopModule(module) {
    setSopForm((value) => {
      const current = value.relatedModules || [];
      return { ...value, relatedModules: current.includes(module) ? current.filter((item) => item !== module) : [...current, module] };
    });
  }

  async function saveArticle(event) {
    event.preventDefault();
    if (!canEdit) {
      setNotice('Only management can publish or update knowledge articles.');
      return;
    }
    const clean = sanitizeArticle({ ...articleForm, author: articleForm.author || userDisplayName });
    if (!clean.title || !clean.content) {
      setNotice('Add an article title and content before saving.');
      return;
    }
    let saved = clean;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const { data, error } = await supabase.from('knowledge_articles').insert(articleToRow(clean, user.id, companyId)).select().single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        saved = rowToArticle(data);
      }
    }
    const next = [saved, ...articles];
    setArticles(next);
    saveLocal('velora-knowledge-articles', next);
    setArticleForm(blankArticle);
    setSelectedArticleId(saved.id);
    setNotice(synced ? 'Knowledge article saved.' : 'Article saved locally. Run the Phase 18 SQL migration to enable Supabase sync.');
  }

  async function saveSop(event) {
    event.preventDefault();
    if (!canEdit) {
      setNotice('Only management can create SOP records.');
      return;
    }
    const clean = sanitizeSop(sopForm);
    if (!clean.title || !clean.steps) {
      setNotice('Add an SOP title and steps before saving.');
      return;
    }
    let saved = clean;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const { data, error } = await supabase.from('knowledge_sops').insert(sopToRow(clean, user.id, companyId)).select().single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        saved = rowToSop(data);
      }
    }
    const next = [saved, ...sops];
    setSops(next);
    saveLocal('velora-knowledge-sops', next);
    setSopForm(blankSop);
    setNotice(synced ? 'SOP saved.' : 'SOP saved locally.');
  }

  async function saveTraining(event) {
    event.preventDefault();
    if (!canEdit) {
      setNotice('Only management can create training material.');
      return;
    }
    const clean = sanitizeTraining(trainingForm);
    if (!clean.trainingTitle) {
      setNotice('Add a training title before saving.');
      return;
    }
    let saved = clean;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const { data, error } = await supabase.from('knowledge_training').insert(trainingToRow(clean, user.id, companyId)).select().single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        saved = rowToTraining(data);
      }
    }
    const next = [saved, ...trainings];
    setTrainings(next);
    saveLocal('velora-knowledge-training', next);
    setTrainingForm(blankTraining);
    setNotice(synced ? 'Training material saved.' : 'Training saved locally.');
  }

  async function saveDecision(event) {
    event.preventDefault();
    if (!canEdit) {
      setNotice('Only management can record decision logs.');
      return;
    }
    const clean = sanitizeDecision(decisionForm);
    if (!clean.decisionTitle || !clean.reason) {
      setNotice('Add a decision title and reason before saving.');
      return;
    }
    let saved = clean;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const { data, error } = await supabase.from('knowledge_decisions').insert(decisionToRow(clean, user.id, companyId)).select().single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        saved = rowToDecision(data);
      }
    }
    const next = [saved, ...decisions];
    setDecisions(next);
    saveLocal('velora-knowledge-decisions', next);
    setDecisionForm(blankDecision);
    setNotice(synced ? 'Decision record saved.' : 'Decision saved locally.');
  }

  async function saveRevision(event) {
    event.preventDefault();
    if (!selectedArticle) {
      setNotice('Select an article before adding revision history.');
      return;
    }
    const clean = sanitizeRevision({
      ...revisionForm,
      articleId: selectedArticle.id,
      updatedBy: revisionForm.updatedBy || userDisplayName,
      snapshot: revisionForm.snapshot || selectedArticle.content,
    });
    if (!clean.changeNotes) {
      setNotice('Add change notes before saving a revision.');
      return;
    }
    let saved = clean;
    if (syncAvailable && user?.id && !String(selectedArticle.id).startsWith('article-')) {
      const { data, error } = await supabase.from('knowledge_revisions').insert(revisionToRow(clean, user.id)).select().single();
      if (error) setSyncAvailable(false);
      else saved = rowToRevision(data);
    }
    const next = [saved, ...revisions];
    setRevisions(next);
    saveLocal('velora-knowledge-revisions', next);
    setRevisionForm(blankRevision);
    setNotice('Revision history saved.');
  }

  return (
    <div className="knowledge-page">
      <header className="section-heading page-header">
        <div>
          <p className="eyebrow">Knowledge Hub</p>
          <h1>Company brain and AI knowledge base</h1>
          <p className="page-description">Policies, SOPs, training material, handbook sections, decision records, and operational knowledge in one searchable workspace.</p>
        </div>
        <div className="knowledge-sync-card">
          <ShieldCheck size={18} />
          <span>{syncAvailable ? 'Supabase synced' : 'Local fallback'}</span>
        </div>
      </header>

      {notice && <div className="inline-alert success">{notice}</div>}

      <section className="knowledge-metrics-grid">
        <KnowledgeMetric icon={BookOpen} label="Articles" value={analytics.totalArticles} detail={`${analytics.publishedArticles} published`} />
        <KnowledgeMetric icon={FileText} label="SOPs" value={analytics.totalSops} detail="Operational procedures" />
        <KnowledgeMetric icon={GraduationCap} label="Training" value={analytics.totalTraining} detail="Learning material" />
        <KnowledgeMetric icon={Lightbulb} label="Decisions" value={analytics.totalDecisions} detail="Recorded reasoning" />
      </section>

      <section className="knowledge-grid main">
        <div className="knowledge-panel">
          <div className="knowledge-panel-heading">
            <div>
              <p className="eyebrow">Searchable knowledge base</p>
              <h2>Find policies, SOPs, guides, decisions, and training</h2>
            </div>
          </div>
          <div className="knowledge-filter-bar">
            <label className="knowledge-search">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company knowledge" />
            </label>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option>All</option>
              {knowledgeCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All</option>
              {knowledgeStatuses.map((status) => <option key={status}>{status}</option>)}
              <option>Published</option>
              <option>Recorded</option>
            </select>
          </div>
          <div className="knowledge-results">
            {results.map((item) => (
              <article key={`${item.type}-${item.id}`}>
                <span>{item.type}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.summary || 'No summary recorded.'}</p>
                  <footer><em>{item.category}</em><StatusBadge status={item.status} /></footer>
                </div>
              </article>
            ))}
            {!results.length && (
              <div className="empty-state">
                <BookOpen size={28} />
                <strong>No knowledge found</strong>
                <span>Create an article, SOP, decision, or training item to build the company brain.</span>
              </div>
            )}
          </div>
        </div>
        <aside className="knowledge-panel">
          <p className="eyebrow">AI knowledge preparation</p>
          <h2>Questions Velora AI can prepare to answer</h2>
          <div className="knowledge-ai-list">
            <div><Brain size={17} /><span>What is the SOP for shipments?</span><strong>{aiContext.shipmentSops.length}</strong></div>
            <div><Brain size={17} /><span>What is our payroll policy?</span><strong>{aiContext.payrollKnowledge.length}</strong></div>
            <div><Brain size={17} /><span>Why was a decision made?</span><strong>{aiContext.decisionReasons.length}</strong></div>
            <div><Brain size={17} /><span>Where is the training guide?</span><strong>{aiContext.trainingGuides.length}</strong></div>
          </div>
          <div className="knowledge-category-list">
            <h3>Most used categories</h3>
            {analytics.categoryUsage.map((item) => (
              <div key={item.category}><span>{item.category}</span><strong>{item.count}</strong><meter min="0" max="10" value={Math.min(10, item.count)}>{item.count}</meter></div>
            ))}
            {!analytics.categoryUsage.length && <p className="knowledge-muted">Category analytics appear after knowledge is created.</p>}
          </div>
        </aside>
      </section>

      <section className="knowledge-grid four">
        <form className="knowledge-panel knowledge-form" onSubmit={saveArticle}>
          <p className="eyebrow">Articles</p>
          <h2>Create knowledge article</h2>
          <label><span>Title</span><input value={articleForm.title} onChange={(event) => setArticleForm((value) => ({ ...value, title: event.target.value }))} /></label>
          <label><span>Summary</span><input value={articleForm.summary} onChange={(event) => setArticleForm((value) => ({ ...value, summary: event.target.value }))} /></label>
          <label><span>Content</span><textarea value={articleForm.content} onChange={(event) => setArticleForm((value) => ({ ...value, content: event.target.value }))} /></label>
          <div className="knowledge-form-row">
            <label><span>Category</span><select value={articleForm.category} onChange={(event) => setArticleForm((value) => ({ ...value, category: event.target.value }))}>{knowledgeCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label><span>Status</span><select value={articleForm.status} onChange={(event) => setArticleForm((value) => ({ ...value, status: event.target.value }))}>{knowledgeStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          </div>
          <div className="knowledge-form-row">
            <label><span>Department</span><select value={articleForm.department} onChange={(event) => setArticleForm((value) => ({ ...value, department: event.target.value }))}>{knowledgeCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label><span>Tags</span><input value={articleForm.tags} onChange={(event) => setArticleForm((value) => ({ ...value, tags: event.target.value }))} placeholder="policy, export, safety" /></label>
          </div>
          <label><span>Linked document</span><select value={articleForm.linkedDocumentId} onChange={(event) => setArticleForm((value) => ({ ...value, linkedDocumentId: event.target.value }))}><option value="">No document</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.fileName}</option>)}</select></label>
          <button type="submit" disabled={!canEdit}>Save article</button>
        </form>

        <form className="knowledge-panel knowledge-form" onSubmit={saveSop}>
          <p className="eyebrow">SOP Library</p>
          <h2>Create SOP</h2>
          <label><span>SOP title</span><input value={sopForm.title} onChange={(event) => setSopForm((value) => ({ ...value, title: event.target.value }))} /></label>
          <label><span>Purpose</span><textarea value={sopForm.purpose} onChange={(event) => setSopForm((value) => ({ ...value, purpose: event.target.value }))} /></label>
          <label><span>Steps</span><textarea value={sopForm.steps} onChange={(event) => setSopForm((value) => ({ ...value, steps: event.target.value }))} placeholder="1. Confirm request&#10;2. Verify documents&#10;3. Update status" /></label>
          <label><span>Responsible department</span><select value={sopForm.responsibleDepartment} onChange={(event) => setSopForm((value) => ({ ...value, responsibleDepartment: event.target.value }))}>{knowledgeCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label><span>Required documents</span><input value={sopForm.requiredDocuments} onChange={(event) => setSopForm((value) => ({ ...value, requiredDocuments: event.target.value }))} /></label>
          <div className="knowledge-chip-picker">
            <span>Related modules</span>
            <div>{sopModules.map((module) => <button type="button" className={(sopForm.relatedModules || []).includes(module) ? 'active' : ''} key={module} onClick={() => toggleSopModule(module)}>{module}</button>)}</div>
          </div>
          <button type="submit" disabled={!canEdit}>Save SOP</button>
        </form>

        <form className="knowledge-panel knowledge-form" onSubmit={saveTraining}>
          <p className="eyebrow">Training Center</p>
          <h2>Create training item</h2>
          <label><span>Training title</span><input value={trainingForm.trainingTitle} onChange={(event) => setTrainingForm((value) => ({ ...value, trainingTitle: event.target.value }))} /></label>
          <label><span>Summary</span><textarea value={trainingForm.summary} onChange={(event) => setTrainingForm((value) => ({ ...value, summary: event.target.value }))} /></label>
          <div className="knowledge-form-row">
            <label><span>Department</span><select value={trainingForm.department} onChange={(event) => setTrainingForm((value) => ({ ...value, department: event.target.value }))}>{knowledgeCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label><span>Difficulty</span><select value={trainingForm.difficulty} onChange={(event) => setTrainingForm((value) => ({ ...value, difficulty: event.target.value }))}>{trainingDifficulties.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select></label>
          </div>
          <label><span>Estimated time</span><input value={trainingForm.estimatedTime} onChange={(event) => setTrainingForm((value) => ({ ...value, estimatedTime: event.target.value }))} placeholder="45 minutes" /></label>
          <label><span>Linked document</span><select value={trainingForm.linkedDocumentId} onChange={(event) => setTrainingForm((value) => ({ ...value, linkedDocumentId: event.target.value }))}><option value="">No document</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.fileName}</option>)}</select></label>
          <button type="submit" disabled={!canEdit}>Save training</button>
        </form>

        <form className="knowledge-panel knowledge-form" onSubmit={saveDecision}>
          <p className="eyebrow">Decision Records</p>
          <h2>Record decision</h2>
          <label><span>Decision title</span><input value={decisionForm.decisionTitle} onChange={(event) => setDecisionForm((value) => ({ ...value, decisionTitle: event.target.value }))} /></label>
          <label><span>Reason</span><textarea value={decisionForm.reason} onChange={(event) => setDecisionForm((value) => ({ ...value, reason: event.target.value }))} /></label>
          <label><span>Impact</span><textarea value={decisionForm.impact} onChange={(event) => setDecisionForm((value) => ({ ...value, impact: event.target.value }))} /></label>
          <div className="knowledge-form-row">
            <label><span>Date</span><input type="date" value={decisionForm.decisionDate} onChange={(event) => setDecisionForm((value) => ({ ...value, decisionDate: event.target.value }))} /></label>
            <label><span>Department</span><select value={decisionForm.relatedDepartment} onChange={(event) => setDecisionForm((value) => ({ ...value, relatedDepartment: event.target.value }))}>{knowledgeCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
          </div>
          <label><span>Related project</span><input value={decisionForm.relatedProject} onChange={(event) => setDecisionForm((value) => ({ ...value, relatedProject: event.target.value }))} /></label>
          <button type="submit" disabled={!canEdit}>Save decision</button>
        </form>
      </section>

      <section className="knowledge-grid two">
        <div className="knowledge-panel">
          <p className="eyebrow">Company handbook</p>
          <h2>Structured handbook areas</h2>
          <div className="handbook-grid">
            {handbookSections.map((section) => <article key={section}><BookOpen size={17} /><strong>{section}</strong></article>)}
          </div>
        </div>
        <div className="knowledge-panel">
          <p className="eyebrow">Version history</p>
          <h2>{selectedArticle?.title || 'Select article'}</h2>
          {selectedArticle && (
            <form className="knowledge-form compact" onSubmit={saveRevision}>
              <label><span>Change notes</span><input value={revisionForm.changeNotes} onChange={(event) => setRevisionForm((value) => ({ ...value, changeNotes: event.target.value }))} /></label>
              <button type="submit"><History size={16} />Add revision</button>
            </form>
          )}
          <div className="revision-list">
            {selectedRevisions.map((revision) => <article key={revision.id}><History size={16} /><span><strong>{revision.changeNotes}</strong><small>{revision.updatedBy} - {new Date(revision.createdAt).toLocaleString()}</small></span></article>)}
            {!selectedRevisions.length && <p className="knowledge-muted">Previous versions and change notes will appear here.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

export default KnowledgeHub;
