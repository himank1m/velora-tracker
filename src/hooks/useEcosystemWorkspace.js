import { useCallback, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../supabaseClient';

const fallbackCompany = {
  id: 'legacy-velora-motors',
  name: 'Velora Motors',
  slug: 'velora-motors',
  industry: 'Automotive Dealership & Export',
  country: 'India',
  email: '',
  phone: '',
  status: 'Active',
  isPrimary: true,
};

const companyFromRow = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  logoUrl: row.logo_url || '',
  industry: row.industry || '',
  country: row.country || '',
  email: row.email || '',
  phone: row.phone || '',
  status: row.status || 'Active',
  isPrimary: Boolean(row.is_primary),
  createdAt: row.created_at,
});

const relationshipFromRow = (row) => ({
  id: row.id,
  sourceCompanyId: row.source_company_id,
  targetCompanyId: row.target_company_id || '',
  externalName: row.external_name || '',
  relationshipType: row.relationship_type,
  status: row.status || 'Active',
  score: Number(row.score) || 0,
  notes: row.notes || '',
  sharedData: row.shared_data || {},
  startedAt: row.started_at,
  createdAt: row.created_at,
});

const transactionFromRow = (row) => ({
  id: row.id,
  transactionNumber: row.transaction_number,
  sourceCompanyId: row.source_company_id,
  targetCompanyId: row.target_company_id || '',
  relationshipId: row.relationship_id || '',
  transactionType: row.transaction_type,
  amount: Number(row.amount) || 0,
  cost: Number(row.cost) || 0,
  profit: Number(row.profit) || 0,
  status: row.status || 'Planned',
  transactionDate: row.transaction_date,
  notes: row.notes || '',
  createdAt: row.created_at,
});

const eventFromRow = (row) => ({
  id: row.id,
  companyId: row.company_id,
  eventType: row.event_type,
  title: row.title,
  description: row.description || '',
  linkedModule: row.linked_module || '',
  linkedRecordId: row.linked_record_id || '',
  occurredAt: row.occurred_at,
  createdAt: row.created_at,
});

const missingTable = (error) => {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return text.includes('42p01') || text.includes('pgrst205') || text.includes('schema cache');
};

export default function useEcosystemWorkspace(user, role) {
  const [companies, setCompanies] = useState([fallbackCompany]);
  const [relationships, setRelationships] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [currentCompanyId, setCurrentCompanyIdState] = useState(
    () => localStorage.getItem('velora-current-company') || fallbackCompany.id,
  );
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user || !isSupabaseConfigured || !supabase) {
      setCompanies([fallbackCompany]);
      setReady(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const canViewFinancials = ['CEO', 'Company Manager', 'Finance Manager'].includes(role);
    const transactionFields = canViewFinancials
      ? '*'
      : 'id,transaction_number,source_company_id,target_company_id,relationship_id,transaction_type,status,transaction_date,notes,created_at';
    const [companyResult, relationshipResult, transactionResult, eventResult] = await Promise.all([
      supabase.from('companies').select('*').order('is_primary', { ascending: false }).order('name'),
      supabase.from('ecosystem_relationships').select('*').order('created_at', { ascending: false }),
      supabase.from('intercompany_transactions').select(transactionFields).order('transaction_date', { ascending: false }),
      supabase.from('company_events').select('*').order('occurred_at', { ascending: false }).limit(250),
    ]);
    const firstError = [companyResult, relationshipResult, transactionResult, eventResult].find((result) => result.error)?.error;
    if (firstError) {
      if (missingTable(firstError)) {
        setCompanies([fallbackCompany]);
        setReady(false);
        setLoading(false);
        return;
      }
      setError(firstError.message);
      setLoading(false);
      return;
    }
    const nextCompanies = (companyResult.data || []).map(companyFromRow);
    setCompanies(nextCompanies.length ? nextCompanies : [fallbackCompany]);
    setRelationships((relationshipResult.data || []).map(relationshipFromRow));
    setTransactions((transactionResult.data || []).map(transactionFromRow));
    setEvents((eventResult.data || []).map(eventFromRow));
    setReady(true);
    setLoading(false);
    setCurrentCompanyIdState((current) => {
      const exists = nextCompanies.some((company) => company.id === current);
      return exists ? current : nextCompanies.find((company) => company.isPrimary)?.id || nextCompanies[0]?.id || fallbackCompany.id;
    });
  }, [user?.id, role]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    localStorage.setItem('velora-current-company', currentCompanyId);
  }, [currentCompanyId]);

  const setCurrentCompanyId = useCallback((id) => {
    setCurrentCompanyIdState(id);
    localStorage.setItem('velora-current-company', id);
  }, []);

  const currentCompany = useMemo(
    () => companies.find((company) => company.id === currentCompanyId) || companies[0] || fallbackCompany,
    [companies, currentCompanyId],
  );

  const saveCompany = async (company) => {
    if (!ready || !supabase) throw new Error('Run the ecosystem migration before creating companies.');
    const payload = {
      name: company.name,
      slug: company.slug || company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      logo_url: company.logoUrl || null,
      industry: company.industry || null,
      country: company.country || null,
      email: company.email || null,
      phone: company.phone || null,
      status: company.status || 'Active',
      created_by: user.id,
    };
    const { data, error: saveError } = await supabase.from('companies').insert(payload).select().single();
    if (saveError) throw saveError;
    const saved = companyFromRow(data);
    setCompanies((current) => [...current, saved]);
    return saved;
  };

  const saveRelationship = async (relationship) => {
    if (!ready || !supabase) throw new Error('Run the ecosystem migration before creating relationships.');
    const { data, error: saveError } = await supabase.from('ecosystem_relationships').insert({
      source_company_id: relationship.sourceCompanyId || currentCompany.id,
      target_company_id: relationship.targetCompanyId || null,
      external_name: relationship.externalName || null,
      relationship_type: relationship.relationshipType,
      status: relationship.status || 'Active',
      score: Number(relationship.score) || 0,
      notes: relationship.notes || null,
      shared_data: relationship.sharedData || {},
      created_by: user.id,
    }).select().single();
    if (saveError) throw saveError;
    const saved = relationshipFromRow(data);
    setRelationships((current) => [saved, ...current]);
    return saved;
  };

  const saveTransaction = async (transaction) => {
    if (!ready || !supabase) throw new Error('Run the ecosystem migration before creating transactions.');
    const { data, error: saveError } = await supabase.from('intercompany_transactions').insert({
      transaction_number: transaction.transactionNumber || `ECO-${Date.now().toString().slice(-8)}`,
      source_company_id: transaction.sourceCompanyId || currentCompany.id,
      target_company_id: transaction.targetCompanyId || null,
      relationship_id: transaction.relationshipId || null,
      transaction_type: transaction.transactionType,
      amount: Number(transaction.amount) || 0,
      cost: Number(transaction.cost) || 0,
      profit: (Number(transaction.amount) || 0) - (Number(transaction.cost) || 0),
      status: transaction.status || 'Planned',
      transaction_date: transaction.transactionDate || new Date().toISOString().slice(0, 10),
      notes: transaction.notes || null,
      created_by: user.id,
    }).select().single();
    if (saveError) throw saveError;
    const saved = transactionFromRow(data);
    setTransactions((current) => [saved, ...current]);
    return saved;
  };

  return {
    companies,
    relationships,
    transactions,
    events,
    currentCompany,
    currentCompanyId: currentCompany.id,
    setCurrentCompanyId,
    ready,
    loading,
    error,
    refresh: load,
    saveCompany,
    saveRelationship,
    saveTransaction,
  };
}
