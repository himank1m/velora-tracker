import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  FileText,
  Globe2,
  PackageCheck,
  Search,
  Send,
  ShieldCheck,
  Truck,
  UserPlus,
  Users,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
  blankPortalNotice,
  blankPortalUser,
  buildCustomerPortalView,
  buildPortalAiInsights,
  buildPortalAnalytics,
  buildSupplierPortalView,
  portalNoticeToRow,
  portalNoticeTypes,
  portalStatuses,
  portalTypes,
  portalUserToRow,
  rowToPortalNotice,
  rowToPortalUser,
  sanitizePortalNotice,
  sanitizePortalUser,
} from '../services/portalService';
import '../portals.css';

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

function PortalMetric({ icon: Icon, label, value, detail, tone = '' }) {
  return (
    <article className={`portal-metric ${tone}`}>
      <span><Icon size={18} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{detail}</em>
      </div>
    </article>
  );
}

function PortalCenter({
  user,
  companyId,
  customers = [],
  suppliers = [],
  orders = [],
  shipments = [],
  procurementRequests = [],
  documents = [],
  canManage = false,
}) {
  const [portalUsers, setPortalUsers] = useState(() => loadLocal('velora-portal-users', sanitizePortalUser));
  const [portalNotices, setPortalNotices] = useState(() => loadLocal('velora-portal-notices', sanitizePortalNotice));
  const [portalActivity, setPortalActivity] = useState(() => loadLocal('velora-portal-activity', (item) => item));
  const [userForm, setUserForm] = useState(blankPortalUser);
  const [noticeForm, setNoticeForm] = useState(blankPortalNotice);
  const [activePortal, setActivePortal] = useState('Customer');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [syncAvailable, setSyncAvailable] = useState(true);

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) || customers[0];
  const selectedSupplier = suppliers.find((supplier) => supplier.id === selectedSupplierId) || suppliers[0];
  const customerView = useMemo(
    () => buildCustomerPortalView(selectedCustomer, { orders, shipments, documents, notices: portalNotices }),
    [documents, orders, portalNotices, selectedCustomer, shipments],
  );
  const supplierView = useMemo(
    () => buildSupplierPortalView(selectedSupplier, { procurementRequests, documents, notices: portalNotices }),
    [documents, portalNotices, procurementRequests, selectedSupplier],
  );
  const customerViews = useMemo(
    () => customers.map((customer) => buildCustomerPortalView(customer, { orders, shipments, documents, notices: portalNotices })),
    [customers, documents, orders, portalNotices, shipments],
  );
  const supplierViews = useMemo(
    () => suppliers.map((supplier) => buildSupplierPortalView(supplier, { procurementRequests, documents, notices: portalNotices })),
    [documents, portalNotices, procurementRequests, suppliers],
  );
  const analytics = useMemo(
    () => buildPortalAnalytics(portalUsers, portalActivity, customerViews, supplierViews),
    [customerViews, portalActivity, portalUsers, supplierViews],
  );
  const aiInsights = useMemo(
    () => buildPortalAiInsights({ customers: customerViews, suppliers: supplierViews, portalUsers, activity: portalActivity }),
    [customerViews, portalActivity, portalUsers, supplierViews],
  );
  const filteredUsers = portalUsers.filter((portalUser) => {
    const text = [portalUser.displayName, portalUser.email, portalUser.portalType, portalUser.status].join(' ').toLowerCase();
    return !query || text.includes(query.toLowerCase());
  });
  const activeView = activePortal === 'Customer' ? customerView : supplierView;

  useEffect(() => {
    let mounted = true;
    async function loadPortals() {
      if (!user?.id) return;
      const [usersResult, noticesResult, activityResult] = await Promise.all([
        supabase.from('portal_users').select('*').order('created_at', { ascending: false }),
        supabase.from('portal_notices').select('*').order('created_at', { ascending: false }),
        supabase.from('portal_activity').select('*').order('created_at', { ascending: false }).limit(200),
      ]);
      if (!mounted) return;
      if (usersResult.error || noticesResult.error || activityResult.error) {
        setSyncAvailable(false);
        return;
      }
      const mappedUsers = (usersResult.data || []).map(rowToPortalUser);
      const mappedNotices = (noticesResult.data || []).map(rowToPortalNotice);
      const mappedActivity = (activityResult.data || []).map((row) => ({
        id: row.id,
        portalType: row.portal_type,
        linkedRecordId: row.linked_record_id,
        activityType: row.activity_type,
        title: row.title,
        detail: row.detail,
        createdAt: row.created_at,
      }));
      setSyncAvailable(true);
      setPortalUsers(mappedUsers);
      setPortalNotices(mappedNotices);
      setPortalActivity(mappedActivity);
      saveLocal('velora-portal-users', mappedUsers);
      saveLocal('velora-portal-notices', mappedNotices);
      saveLocal('velora-portal-activity', mappedActivity);
    }
    loadPortals();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  async function savePortalUser(event) {
    event.preventDefault();
    if (!canManage) {
      setNotice('Only management can configure external portal users.');
      return;
    }
    const clean = sanitizePortalUser(userForm);
    if (!clean.displayName || !clean.email) {
      setNotice('Add a portal user name and email.');
      return;
    }
    let saved = clean;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const { data, error } = await supabase.from('portal_users').insert(portalUserToRow(clean, user.id, companyId)).select().single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        saved = rowToPortalUser(data);
      }
    }
    const next = [saved, ...portalUsers];
    setPortalUsers(next);
    saveLocal('velora-portal-users', next);
    setUserForm(blankPortalUser);
    setNotice(synced ? 'Portal user saved.' : 'Portal user saved locally. Run the Phase 19 SQL migration to enable Supabase sync.');
  }

  async function savePortalNotice(event) {
    event.preventDefault();
    if (!canManage) {
      setNotice('Only management can publish portal notices.');
      return;
    }
    const clean = sanitizePortalNotice(noticeForm);
    if (!clean.title || !clean.message) {
      setNotice('Add a notice title and message.');
      return;
    }
    let saved = clean;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const { data, error } = await supabase.from('portal_notices').insert(portalNoticeToRow(clean, user.id, companyId)).select().single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        saved = rowToPortalNotice(data);
      }
    }
    const next = [saved, ...portalNotices];
    setPortalNotices(next);
    saveLocal('velora-portal-notices', next);
    setNoticeForm(blankPortalNotice);
    setNotice(synced ? 'Portal notice published.' : 'Portal notice saved locally.');
  }

  function linkedOptions(type) {
    return type === 'Customer'
      ? customers.map((customer) => ({ id: customer.id, label: customer.customerName || customer.name || customer.email }))
      : suppliers.map((supplier) => ({ id: supplier.id, label: supplier.supplierName || supplier.name || supplier.email }));
  }

  return (
    <div className="portal-page">
      <header className="section-heading page-header">
        <div>
          <p className="eyebrow">Partner Portals</p>
          <h1>Customer and supplier self-service</h1>
          <p className="page-description">Secure portal foundations for external customers and suppliers to view scoped orders, shipments, procurement, documents, notices, and activity.</p>
        </div>
        <div className="portal-sync-card">
          <ShieldCheck size={18} />
          <span>{syncAvailable ? 'Supabase synced' : 'Local fallback'}</span>
        </div>
      </header>

      {notice && <div className="inline-alert success">{notice}</div>}

      <section className="portal-metrics-grid">
        <PortalMetric icon={Users} label="Portal users" value={analytics.portalUsers} detail={`${analytics.activeUsers} active`} />
        <PortalMetric icon={Globe2} label="Login activity" value={analytics.loginActivity} detail="Users with login activity" />
        <PortalMetric icon={FileText} label="Viewed items" value={analytics.viewedItems} detail="Tracked portal activity" />
        <PortalMetric icon={Bell} label="Engagement" value={analytics.customerEngagement + analytics.supplierEngagement} detail="Customer and supplier signals" />
      </section>

      <section className="portal-grid main">
        <div className="portal-panel">
          <div className="portal-panel-heading">
            <div>
              <p className="eyebrow">Portal experience</p>
              <h2>{activePortal} portal preview</h2>
            </div>
            <div className="portal-tabs">
              {portalTypes.map((type) => <button type="button" className={activePortal === type ? 'active' : ''} key={type} onClick={() => setActivePortal(type)}>{type}</button>)}
            </div>
          </div>
          <div className="portal-selector-row">
            {activePortal === 'Customer' ? (
              <select value={selectedCustomer?.id || ''} onChange={(event) => setSelectedCustomerId(event.target.value)}>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.customerName || customer.name || customer.email}</option>)}
              </select>
            ) : (
              <select value={selectedSupplier?.id || ''} onChange={(event) => setSelectedSupplierId(event.target.value)}>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.supplierName || supplier.name || supplier.email}</option>)}
              </select>
            )}
          </div>
          <div className="portal-preview-card">
            <div className="portal-profile">
              <span>{activePortal.slice(0, 2)}</span>
              <div>
                <strong>{activePortal === 'Customer' ? activeView.profile?.customerName || 'No customer selected' : activeView.profile?.supplierName || 'No supplier selected'}</strong>
                <small>{activePortal === 'Customer' ? activeView.profile?.email || activeView.profile?.countryCity || 'Customer profile' : activeView.profile?.email || activeView.profile?.country || 'Supplier profile'}</small>
              </div>
            </div>
            <div className="portal-stat-row">
              {activePortal === 'Customer' ? (
                <>
                  <PortalMetric icon={ClipboardList} label="Active orders" value={activeView.metrics.activeOrders || 0} detail="Visible to customer" />
                  <PortalMetric icon={Truck} label="Shipments" value={activeView.metrics.activeShipments || 0} detail="Tracking enabled" />
                  <PortalMetric icon={PackageCheck} label="Delivered" value={activeView.metrics.deliveredOrders || 0} detail="Order history" />
                </>
              ) : (
                <>
                  <PortalMetric icon={ClipboardList} label="Open requests" value={activeView.metrics.openRequests || 0} detail="Procurement visibility" />
                  <PortalMetric icon={CheckCircle2} label="Approved" value={activeView.metrics.approvedRequests || 0} detail="Supplier action" />
                  <PortalMetric icon={PackageCheck} label="Completed" value={activeView.metrics.completedRequests || 0} detail="Procurement history" />
                </>
              )}
            </div>
            <div className="portal-lists-grid">
              <div>
                <h3>Recent activity</h3>
                <div className="portal-mini-list">
                  {activeView.activity?.slice(0, 6).map((item) => <article key={item.id}><Globe2 size={16} /><span><strong>{item.title}</strong><small>{item.detail}</small></span></article>)}
                  {!activeView.activity?.length && <p className="portal-muted">No visible activity yet.</p>}
                </div>
              </div>
              <div>
                <h3>Documents and notices</h3>
                <div className="portal-mini-list">
                  {activeView.documents?.slice(0, 3).map((document) => <article key={document.id}><FileText size={16} /><span><strong>{document.fileName}</strong><small>{document.category || 'Shared file'}</small></span></article>)}
                  {activeView.notices?.slice(0, 3).map((portalNotice) => <article key={portalNotice.id}><Bell size={16} /><span><strong>{portalNotice.title}</strong><small>{portalNotice.noticeType}</small></span></article>)}
                  {!activeView.documents?.length && !activeView.notices?.length && <p className="portal-muted">Shared files and notices will appear here.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
        <aside className="portal-panel">
          <p className="eyebrow">AI COO portal insights</p>
          <h2>External engagement signals</h2>
          <div className="portal-insight-list">
            {aiInsights.map((item) => (
              <article key={item.title}>
                <span className={`portal-tone ${item.tone.toLowerCase()}`}>{item.tone}</span>
                <div><strong>{item.title}</strong><p>{item.detail}</p></div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="portal-grid three">
        <form className="portal-panel portal-form" onSubmit={savePortalUser}>
          <p className="eyebrow">Access control</p>
          <h2>Create portal user</h2>
          <label><span>Portal type</span><select value={userForm.portalType} onChange={(event) => setUserForm((value) => ({ ...value, portalType: event.target.value, linkedRecordId: '' }))}>{portalTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label><span>Name</span><input value={userForm.displayName} onChange={(event) => setUserForm((value) => ({ ...value, displayName: event.target.value }))} /></label>
          <label><span>Email</span><input type="email" value={userForm.email} onChange={(event) => setUserForm((value) => ({ ...value, email: event.target.value }))} /></label>
          <label><span>Linked record</span><select value={userForm.linkedRecordId} onChange={(event) => setUserForm((value) => ({ ...value, linkedRecordId: event.target.value }))}><option value="">Choose record</option>{linkedOptions(userForm.portalType).map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
          <label><span>Status</span><select value={userForm.status} onChange={(event) => setUserForm((value) => ({ ...value, status: event.target.value }))}>{portalStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label><span>Notes</span><textarea value={userForm.notes} onChange={(event) => setUserForm((value) => ({ ...value, notes: event.target.value }))} /></label>
          <button type="submit" disabled={!canManage}><UserPlus size={16} />Save portal user</button>
        </form>

        <form className="portal-panel portal-form" onSubmit={savePortalNotice}>
          <p className="eyebrow">Communication</p>
          <h2>Publish portal notice</h2>
          <label><span>Portal type</span><select value={noticeForm.portalType} onChange={(event) => setNoticeForm((value) => ({ ...value, portalType: event.target.value, linkedRecordId: '' }))}>{portalTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label><span>Linked record</span><select value={noticeForm.linkedRecordId} onChange={(event) => setNoticeForm((value) => ({ ...value, linkedRecordId: event.target.value }))}><option value="">All {noticeForm.portalType.toLowerCase()}s</option>{linkedOptions(noticeForm.portalType).map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
          <label><span>Notice type</span><select value={noticeForm.noticeType} onChange={(event) => setNoticeForm((value) => ({ ...value, noticeType: event.target.value }))}>{portalNoticeTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label><span>Title</span><input value={noticeForm.title} onChange={(event) => setNoticeForm((value) => ({ ...value, title: event.target.value }))} /></label>
          <label><span>Message</span><textarea value={noticeForm.message} onChange={(event) => setNoticeForm((value) => ({ ...value, message: event.target.value }))} /></label>
          <button type="submit" disabled={!canManage}><Send size={16} />Publish notice</button>
        </form>

        <div className="portal-panel">
          <div className="portal-panel-heading">
            <div>
              <p className="eyebrow">Portal users</p>
              <h2>Access registry</h2>
            </div>
          </div>
          <label className="portal-search">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search portal users" />
          </label>
          <div className="portal-user-list">
            {filteredUsers.map((portalUser) => (
              <article key={portalUser.id}>
                <span>{portalUser.portalType.slice(0, 2)}</span>
                <div><strong>{portalUser.displayName}</strong><small>{portalUser.email} - {portalUser.status}</small></div>
              </article>
            ))}
            {!filteredUsers.length && <p className="portal-muted">No portal users configured yet.</p>}
          </div>
        </div>
      </section>

      <section className="portal-grid two">
        <div className="portal-panel">
          <p className="eyebrow">Activity history</p>
          <h2>Portal audit foundation</h2>
          <div className="portal-mini-list">
            {portalActivity.slice(0, 10).map((item) => <article key={item.id}><Globe2 size={16} /><span><strong>{item.title}</strong><small>{item.activityType} - {new Date(item.createdAt).toLocaleString()}</small></span></article>)}
            {!portalActivity.length && <p className="portal-muted">Logins, viewed items, document downloads, and status events will appear here.</p>}
          </div>
        </div>
        <div className="portal-panel portal-security-card">
          <ShieldCheck size={22} />
          <div>
            <p className="eyebrow">Security foundation</p>
            <h2>Scoped external access prepared</h2>
            <p>Customer users are designed to see only their orders, shipments, documents, and notices. Supplier users are designed to see only their procurement records, shared documents, and supplier notices.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PortalCenter;
