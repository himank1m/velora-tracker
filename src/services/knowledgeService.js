const nowIso = () => new Date().toISOString();

export const knowledgeCategories = ['HR', 'Finance', 'Logistics', 'Procurement', 'Sales', 'IT', 'Operations', 'AI COO', 'Security', 'Company Policies'];
export const knowledgeStatuses = ['Draft', 'Review', 'Published', 'Archived'];
export const sopModules = ['Orders', 'Inventory', 'Customers', 'Shipments', 'Procurement', 'Finance', 'HR', 'Projects', 'Communication', 'Reports'];
export const trainingDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
export const handbookSections = ['Company overview', 'Work rules', 'HR policies', 'Payroll rules', 'Communication guidelines', 'Security guidelines', 'Operational standards'];

export const blankArticle = {
  id: '',
  title: '',
  category: 'Operations',
  summary: '',
  content: '',
  author: '',
  department: 'Operations',
  status: 'Draft',
  tags: '',
  visibility: 'Internal',
  linkedDocumentId: '',
  updatedAt: '',
  createdAt: '',
};

export const blankSop = {
  id: '',
  title: '',
  purpose: '',
  steps: '',
  responsibleDepartment: 'Operations',
  requiredDocuments: '',
  relatedModules: [],
  revisionNotes: '',
  linkedDocumentId: '',
  updatedAt: '',
  createdAt: '',
};

export const blankTraining = {
  id: '',
  trainingTitle: '',
  department: 'Operations',
  difficulty: 'Beginner',
  estimatedTime: '',
  completionStatus: 'Not Started',
  summary: '',
  linkedDocumentId: '',
  createdAt: '',
};

export const blankDecision = {
  id: '',
  decisionTitle: '',
  reason: '',
  decisionDate: new Date().toISOString().slice(0, 10),
  impact: '',
  relatedDepartment: 'Management',
  relatedProject: '',
  linkedDocumentId: '',
  createdAt: '',
};

export const blankRevision = {
  id: '',
  articleId: '',
  updatedBy: '',
  changeNotes: '',
  snapshot: '',
  createdAt: '',
};

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function listValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

export function sanitizeArticle(article = {}) {
  return {
    ...blankArticle,
    ...article,
    id: article.id || uid('article'),
    title: String(article.title || '').trim(),
    category: knowledgeCategories.includes(article.category) ? article.category : 'Operations',
    status: knowledgeStatuses.includes(article.status) ? article.status : 'Draft',
    tags: Array.isArray(article.tags) ? article.tags.join(', ') : String(article.tags || ''),
    updatedAt: article.updatedAt || article.updated_at || nowIso(),
    createdAt: article.createdAt || article.created_at || nowIso(),
  };
}

export function sanitizeSop(sop = {}) {
  return {
    ...blankSop,
    ...sop,
    id: sop.id || uid('sop'),
    title: String(sop.title || '').trim(),
    responsibleDepartment: knowledgeCategories.includes(sop.responsibleDepartment) ? sop.responsibleDepartment : 'Operations',
    relatedModules: listValue(sop.relatedModules),
    updatedAt: sop.updatedAt || sop.updated_at || nowIso(),
    createdAt: sop.createdAt || sop.created_at || nowIso(),
  };
}

export function sanitizeTraining(training = {}) {
  return {
    ...blankTraining,
    ...training,
    id: training.id || uid('training'),
    trainingTitle: String(training.trainingTitle || '').trim(),
    department: knowledgeCategories.includes(training.department) ? training.department : 'Operations',
    difficulty: trainingDifficulties.includes(training.difficulty) ? training.difficulty : 'Beginner',
    createdAt: training.createdAt || training.created_at || nowIso(),
  };
}

export function sanitizeDecision(decision = {}) {
  return {
    ...blankDecision,
    ...decision,
    id: decision.id || uid('decision'),
    decisionTitle: String(decision.decisionTitle || '').trim(),
    relatedDepartment: knowledgeCategories.includes(decision.relatedDepartment) ? decision.relatedDepartment : 'Management',
    createdAt: decision.createdAt || decision.created_at || nowIso(),
  };
}

export function sanitizeRevision(revision = {}) {
  return {
    ...blankRevision,
    ...revision,
    id: revision.id || uid('revision'),
    createdAt: revision.createdAt || revision.created_at || nowIso(),
  };
}

export function articleToRow(article, userId, companyId) {
  return {
    title: article.title,
    category: article.category,
    summary: article.summary,
    content: article.content,
    author: article.author,
    department: article.department,
    status: article.status,
    tags: listValue(article.tags),
    visibility: article.visibility || 'Internal',
    linked_document_id: article.linkedDocumentId || null,
    company_id: companyId || null,
    created_by: userId || null,
  };
}

export function rowToArticle(row) {
  return sanitizeArticle({
    id: row.id,
    title: row.title,
    category: row.category,
    summary: row.summary,
    content: row.content,
    author: row.author,
    department: row.department,
    status: row.status,
    tags: row.tags,
    visibility: row.visibility,
    linkedDocumentId: row.linked_document_id,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  });
}

export function sopToRow(sop, userId, companyId) {
  return {
    title: sop.title,
    purpose: sop.purpose,
    steps: sop.steps,
    responsible_department: sop.responsibleDepartment,
    required_documents: sop.requiredDocuments,
    related_modules: sop.relatedModules || [],
    revision_notes: sop.revisionNotes,
    linked_document_id: sop.linkedDocumentId || null,
    company_id: companyId || null,
    created_by: userId || null,
  };
}

export function rowToSop(row) {
  return sanitizeSop({
    id: row.id,
    title: row.title,
    purpose: row.purpose,
    steps: row.steps,
    responsibleDepartment: row.responsible_department,
    requiredDocuments: row.required_documents,
    relatedModules: row.related_modules,
    revisionNotes: row.revision_notes,
    linkedDocumentId: row.linked_document_id,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  });
}

export function trainingToRow(training, userId, companyId) {
  return {
    training_title: training.trainingTitle,
    department: training.department,
    difficulty: training.difficulty,
    estimated_time: training.estimatedTime,
    completion_status: training.completionStatus,
    summary: training.summary,
    linked_document_id: training.linkedDocumentId || null,
    company_id: companyId || null,
    created_by: userId || null,
  };
}

export function rowToTraining(row) {
  return sanitizeTraining({
    id: row.id,
    trainingTitle: row.training_title,
    department: row.department,
    difficulty: row.difficulty,
    estimatedTime: row.estimated_time,
    completionStatus: row.completion_status,
    summary: row.summary,
    linkedDocumentId: row.linked_document_id,
    createdAt: row.created_at,
  });
}

export function decisionToRow(decision, userId, companyId) {
  return {
    decision_title: decision.decisionTitle,
    reason: decision.reason,
    decision_date: decision.decisionDate || null,
    impact: decision.impact,
    related_department: decision.relatedDepartment,
    related_project: decision.relatedProject,
    linked_document_id: decision.linkedDocumentId || null,
    company_id: companyId || null,
    created_by: userId || null,
  };
}

export function rowToDecision(row) {
  return sanitizeDecision({
    id: row.id,
    decisionTitle: row.decision_title,
    reason: row.reason,
    decisionDate: row.decision_date,
    impact: row.impact,
    relatedDepartment: row.related_department,
    relatedProject: row.related_project,
    linkedDocumentId: row.linked_document_id,
    createdAt: row.created_at,
  });
}

export function revisionToRow(revision, userId) {
  return {
    article_id: revision.articleId,
    updated_by: revision.updatedBy,
    change_notes: revision.changeNotes,
    snapshot: revision.snapshot,
    created_by: userId || null,
  };
}

export function rowToRevision(row) {
  return sanitizeRevision({
    id: row.id,
    articleId: row.article_id,
    updatedBy: row.updated_by,
    changeNotes: row.change_notes,
    snapshot: row.snapshot,
    createdAt: row.created_at,
  });
}

export function buildKnowledgeAnalytics(articles = [], sops = [], trainings = [], decisions = []) {
  const published = articles.filter((item) => item.status === 'Published');
  const drafts = articles.filter((item) => item.status === 'Draft' || item.status === 'Review');
  const recent = [...articles].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);
  const categories = knowledgeCategories.map((category) => ({
    category,
    count: articles.filter((item) => item.category === category).length
      + sops.filter((item) => item.responsibleDepartment === category).length
      + trainings.filter((item) => item.department === category).length
      + decisions.filter((item) => item.relatedDepartment === category).length,
  })).filter((item) => item.count).sort((a, b) => b.count - a.count);
  return {
    totalArticles: articles.length,
    publishedArticles: published.length,
    draftArticles: drafts.length,
    totalSops: sops.length,
    totalTraining: trainings.length,
    totalDecisions: decisions.length,
    recentlyUpdated: recent,
    categoryUsage: categories,
  };
}

export function buildKnowledgeAiContext(articles = [], sops = [], trainings = [], decisions = []) {
  return {
    policies: articles.filter((item) => item.category === 'Company Policies' || item.category === 'HR').map((item) => item.title),
    shipmentSops: sops.filter((item) => item.relatedModules.includes('Shipments') || item.responsibleDepartment === 'Logistics').map((item) => item.title),
    payrollKnowledge: articles.filter((item) => item.category === 'Finance' || item.summary.toLowerCase().includes('payroll')).map((item) => item.title),
    decisionReasons: decisions.map((item) => ({ title: item.decisionTitle, reason: item.reason, impact: item.impact })),
    trainingGuides: trainings.map((item) => ({ title: item.trainingTitle, department: item.department, difficulty: item.difficulty })),
  };
}

export function searchKnowledge({ articles = [], sops = [], trainings = [], decisions = [] }, query = '', category = 'All', status = 'All') {
  const needle = String(query || '').toLowerCase();
  const rows = [
    ...articles.map((item) => ({ type: 'Article', title: item.title, category: item.category, status: item.status, summary: item.summary, body: item.content, id: item.id })),
    ...sops.map((item) => ({ type: 'SOP', title: item.title, category: item.responsibleDepartment, status: 'Published', summary: item.purpose, body: item.steps, id: item.id })),
    ...trainings.map((item) => ({ type: 'Training', title: item.trainingTitle, category: item.department, status: item.completionStatus, summary: item.summary, body: item.difficulty, id: item.id })),
    ...decisions.map((item) => ({ type: 'Decision', title: item.decisionTitle, category: item.relatedDepartment, status: 'Recorded', summary: item.reason, body: item.impact, id: item.id })),
  ];
  return rows.filter((item) => {
    const haystack = [item.type, item.title, item.category, item.status, item.summary, item.body].join(' ').toLowerCase();
    return (!needle || haystack.includes(needle))
      && (category === 'All' || item.category === category)
      && (status === 'All' || item.status === status);
  });
}
