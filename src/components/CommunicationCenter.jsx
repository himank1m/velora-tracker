import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  FileText,
  Megaphone,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import {
  announcementToRow,
  blankAnnouncement,
  blankEvent,
  blankMessage,
  buildAiCommunicationAlerts,
  buildCommunicationAnalytics,
  communicationCategories,
  communicationDepartments,
  communicationPriorities,
  eventToRow,
  eventTypes,
  filterCommunicationItems,
  messageAudiences,
  messageToRow,
  rowToAnnouncement,
  rowToEvent,
  rowToMessage,
  sanitizeAnnouncement,
  sanitizeEvent,
  sanitizeMessage,
} from '../services/communicationService';
import '../communication.css';

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

function PriorityBadge({ priority }) {
  return <span className={`comm-priority ${String(priority).toLowerCase()}`}>{priority}</span>;
}

function CommMetric({ icon: Icon, label, value, detail, tone = '' }) {
  return (
    <article className={`comm-metric ${tone}`}>
      <span><Icon size={18} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <em>{detail}</em>
      </div>
    </article>
  );
}

function CommunicationCenter({
  user,
  profile,
  role,
  companyId,
  alerts = [],
  financeRecords = [],
  procurementRequests = [],
  payrollRecords = [],
  documents = [],
  employees = [],
  canManage = false,
}) {
  const [announcements, setAnnouncements] = useState(() => loadLocal('velora-communications-announcements', sanitizeAnnouncement));
  const [messages, setMessages] = useState(() => loadLocal('velora-communications-messages', sanitizeMessage));
  const [events, setEvents] = useState(() => loadLocal('velora-communications-events', sanitizeEvent));
  const [receipts, setReceipts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('velora-communication-receipts') || '{}');
    } catch {
      return {};
    }
  });
  const [announcementForm, setAnnouncementForm] = useState(blankAnnouncement);
  const [messageForm, setMessageForm] = useState(blankMessage);
  const [eventForm, setEventForm] = useState(blankEvent);
  const [query, setQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [notice, setNotice] = useState('');
  const [syncAvailable, setSyncAvailable] = useState(true);

  const userDisplayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Velora user';
  const aiAlerts = useMemo(
    () => buildAiCommunicationAlerts(alerts, financeRecords, procurementRequests, payrollRecords),
    [alerts, financeRecords, payrollRecords, procurementRequests],
  );
  const combinedAnnouncements = useMemo(
    () => [...aiAlerts, ...announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [aiAlerts, announcements],
  );
  const filteredAnnouncements = useMemo(
    () => filterCommunicationItems(combinedAnnouncements, query, departmentFilter, priorityFilter),
    [combinedAnnouncements, departmentFilter, priorityFilter, query],
  );
  const analytics = useMemo(
    () => buildCommunicationAnalytics(combinedAnnouncements, messages, events, receipts),
    [combinedAnnouncements, events, messages, receipts],
  );
  const upcomingEvents = useMemo(
    () => [...events].sort((a, b) => String(a.eventDate).localeCompare(String(b.eventDate))).slice(0, 6),
    [events],
  );
  const bulletinItems = useMemo(
    () => combinedAnnouncements.filter((item) => ['Notice', 'Policy', 'Reminder', 'Event'].includes(item.category)).slice(0, 6),
    [combinedAnnouncements],
  );

  useEffect(() => {
    let mounted = true;
    async function loadCommunication() {
      if (!user?.id) return;
      const [announcementResult, messageResult, eventResult, receiptResult] = await Promise.all([
        supabase.from('communication_announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('communication_messages').select('*').order('created_at', { ascending: false }),
        supabase.from('communication_events').select('*').order('event_date', { ascending: true }),
        supabase.from('communication_receipts').select('*').eq('user_id', user.id),
      ]);
      if (!mounted) return;
      if (announcementResult.error || messageResult.error || eventResult.error || receiptResult.error) {
        setSyncAvailable(false);
        return;
      }
      const mappedAnnouncements = (announcementResult.data || []).map(rowToAnnouncement);
      const mappedMessages = (messageResult.data || []).map(rowToMessage);
      const mappedEvents = (eventResult.data || []).map(rowToEvent);
      const mappedReceipts = (receiptResult.data || []).reduce((acc, row) => {
        acc[row.announcement_id] = {
          viewed: Boolean(row.viewed),
          acknowledged: Boolean(row.acknowledged),
          viewedAt: row.viewed_at,
          acknowledgedAt: row.acknowledged_at,
        };
        return acc;
      }, {});
      setSyncAvailable(true);
      setAnnouncements(mappedAnnouncements);
      setMessages(mappedMessages);
      setEvents(mappedEvents);
      setReceipts(mappedReceipts);
      saveLocal('velora-communications-announcements', mappedAnnouncements);
      saveLocal('velora-communications-messages', mappedMessages);
      saveLocal('velora-communications-events', mappedEvents);
      localStorage.setItem('velora-communication-receipts', JSON.stringify(mappedReceipts));
    }
    loadCommunication();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  function persistReceipts(nextReceipts) {
    setReceipts(nextReceipts);
    localStorage.setItem('velora-communication-receipts', JSON.stringify(nextReceipts));
  }

  async function saveAnnouncement(event) {
    event.preventDefault();
    if (!canManage) {
      setNotice('Only management can publish company communications.');
      return;
    }
    const clean = sanitizeAnnouncement({
      ...announcementForm,
      author: announcementForm.author || userDisplayName,
    });
    if (!clean.title || !clean.message) {
      setNotice('Add a title and message before publishing.');
      return;
    }
    let saved = clean;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const { data, error } = await supabase
        .from('communication_announcements')
        .insert(announcementToRow(clean, user.id, companyId))
        .select()
        .single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        saved = rowToAnnouncement(data);
        synced = true;
      }
    }
    const next = [saved, ...announcements];
    setAnnouncements(next);
    saveLocal('velora-communications-announcements', next);
    setAnnouncementForm(blankAnnouncement);
    setNotice(synced ? 'Announcement published.' : 'Announcement saved locally. Run the Phase 16 SQL migration to enable Supabase sync.');
  }

  async function saveMessage(event) {
    event.preventDefault();
    const clean = sanitizeMessage({
      ...messageForm,
      sender: messageForm.sender || userDisplayName,
    });
    if (!clean.subject || !clean.body) {
      setNotice('Add a subject and message before sending.');
      return;
    }
    let saved = clean;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const { data, error } = await supabase
        .from('communication_messages')
        .insert(messageToRow(clean, user.id, companyId))
        .select()
        .single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        saved = rowToMessage(data);
        synced = true;
      }
    }
    const next = [saved, ...messages];
    setMessages(next);
    saveLocal('velora-communications-messages', next);
    setMessageForm(blankMessage);
    setNotice(synced ? 'Message recorded.' : 'Message saved locally. Run the Phase 16 SQL migration to enable Supabase sync.');
  }

  async function saveEvent(event) {
    event.preventDefault();
    if (!canManage) {
      setNotice('Only management can add company calendar events.');
      return;
    }
    const clean = sanitizeEvent(eventForm);
    if (!clean.title || !clean.eventDate) {
      setNotice('Add an event title and date.');
      return;
    }
    let saved = clean;
    let synced = syncAvailable;
    if (syncAvailable && user?.id) {
      const { data, error } = await supabase
        .from('communication_events')
        .insert(eventToRow(clean, user.id, companyId))
        .select()
        .single();
      if (error) {
        setSyncAvailable(false);
        synced = false;
      } else {
        saved = rowToEvent(data);
        synced = true;
      }
    }
    const next = [saved, ...events];
    setEvents(next);
    saveLocal('velora-communications-events', next);
    setEventForm(blankEvent);
    setNotice(synced ? 'Event added.' : 'Event saved locally. Run the Phase 16 SQL migration to enable Supabase sync.');
  }

  async function updateReceipt(announcementId, patch) {
    const current = receipts[announcementId] || {};
    const nextReceipt = {
      ...current,
      ...patch,
      viewedAt: patch.viewed ? new Date().toISOString() : current.viewedAt,
      acknowledgedAt: patch.acknowledged ? new Date().toISOString() : current.acknowledgedAt,
    };
    const next = { ...receipts, [announcementId]: nextReceipt };
    persistReceipts(next);
    if (syncAvailable && user?.id && !String(announcementId).startsWith('ai-')) {
      const { error } = await supabase.from('communication_receipts').upsert({
        announcement_id: announcementId,
        user_id: user.id,
        viewed: Boolean(nextReceipt.viewed),
        acknowledged: Boolean(nextReceipt.acknowledged),
        viewed_at: nextReceipt.viewedAt || null,
        acknowledged_at: nextReceipt.acknowledgedAt || null,
      }, { onConflict: 'announcement_id,user_id' });
      if (error) setSyncAvailable(false);
    }
  }

  return (
    <div className="comm-page">
      <header className="section-heading page-header">
        <div>
          <p className="eyebrow">Communication Center</p>
          <h1>Company collaboration hub</h1>
          <p className="page-description">Announcements, department updates, AI COO alerts, events, and internal message foundations in one operational channel.</p>
        </div>
        <div className="comm-sync-card">
          <ShieldCheck size={18} />
          <span>{syncAvailable ? 'Supabase synced' : 'Local fallback'}</span>
        </div>
      </header>

      {notice && <div className="inline-alert success">{notice}</div>}

      <section className="comm-metrics-grid">
        <CommMetric icon={Megaphone} label="Announcements" value={analytics.totalAnnouncements} detail="Manual and AI COO updates" />
        <CommMetric icon={Bell} label="Unread" value={analytics.unread} detail={`${analytics.readRate}% read rate`} tone="info" />
        <CommMetric icon={AlertTriangle} label="Critical" value={analytics.criticalAlerts} detail="Priority communications" tone="danger" />
        <CommMetric icon={CalendarDays} label="Events" value={analytics.totalEvents} detail="Meetings, payroll, reviews" />
      </section>

      <section className="comm-grid main">
        <div className="comm-panel comm-feed-panel">
          <div className="comm-panel-heading">
            <div>
              <p className="eyebrow">Priority feed</p>
              <h2>Announcements and alerts</h2>
            </div>
          </div>
          <div className="comm-filter-bar">
            <label className="comm-search">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search communications" />
            </label>
            <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
              <option>All</option>
              {communicationDepartments.map((department) => <option key={department}>{department}</option>)}
            </select>
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option>All</option>
              {communicationPriorities.map((priority) => <option key={priority}>{priority}</option>)}
            </select>
          </div>
          <div className="comm-feed-list">
            {filteredAnnouncements.map((item) => {
              const receipt = receipts[item.id] || {};
              return (
                <article className={receipt.viewed ? 'read' : ''} key={item.id}>
                  <div className="comm-feed-icon">{item.source === 'AI COO' ? <Sparkles size={18} /> : <Megaphone size={18} />}</div>
                  <div>
                    <div className="comm-feed-title">
                      <PriorityBadge priority={item.priority} />
                      <strong>{item.title}</strong>
                    </div>
                    <p>{item.message}</p>
                    <footer>
                      <span>{item.department}</span>
                      <span>{item.category}</span>
                      <span>{item.author || 'Velora OS'}</span>
                      {item.publishDate && <span>{new Date(item.publishDate).toLocaleDateString()}</span>}
                    </footer>
                  </div>
                  <div className="comm-feed-actions">
                    <button type="button" onClick={() => updateReceipt(item.id, { viewed: true })}>{receipt.viewed ? 'Viewed' : 'Mark read'}</button>
                    <button type="button" onClick={() => updateReceipt(item.id, { viewed: true, acknowledged: true })}>{receipt.acknowledged ? 'Acknowledged' : 'Acknowledge'}</button>
                  </div>
                </article>
              );
            })}
            {!filteredAnnouncements.length && (
              <div className="empty-state">
                <Bell size={28} />
                <strong>No communications found</strong>
                <span>Change the filters or publish a company announcement.</span>
              </div>
            )}
          </div>
        </div>

        <aside className="comm-side-stack">
          <div className="comm-panel">
            <p className="eyebrow">Bulletin board</p>
            <h2>Internal notices</h2>
            <div className="comm-mini-list">
              {bulletinItems.map((item) => (
                <div key={item.id}>
                  <PriorityBadge priority={item.priority} />
                  <span><strong>{item.title}</strong><small>{item.department}</small></span>
                </div>
              ))}
              {!bulletinItems.length && <p className="comm-muted">No bulletin notices yet.</p>}
            </div>
          </div>
          <div className="comm-panel">
            <p className="eyebrow">Engagement</p>
            <h2>Department read rates</h2>
            <div className="comm-engagement-list">
              {analytics.departmentEngagement.map((item) => (
                <div key={item.department}>
                  <span>{item.department}</span>
                  <strong>{item.readRate}%</strong>
                  <meter min="0" max="100" value={item.readRate}>{item.readRate}%</meter>
                </div>
              ))}
              {!analytics.departmentEngagement.length && <p className="comm-muted">Department engagement will appear after targeted updates are published.</p>}
            </div>
          </div>
        </aside>
      </section>

      <section className="comm-grid three">
        <form className="comm-panel comm-form" onSubmit={saveAnnouncement}>
          <p className="eyebrow">Publish</p>
          <h2>Company announcement</h2>
          <label><span>Title</span><input value={announcementForm.title} onChange={(event) => setAnnouncementForm((value) => ({ ...value, title: event.target.value }))} /></label>
          <label><span>Message</span><textarea value={announcementForm.message} onChange={(event) => setAnnouncementForm((value) => ({ ...value, message: event.target.value }))} /></label>
          <div className="comm-form-row">
            <label><span>Department</span><select value={announcementForm.department} onChange={(event) => setAnnouncementForm((value) => ({ ...value, department: event.target.value }))}>{communicationDepartments.map((department) => <option key={department}>{department}</option>)}</select></label>
            <label><span>Priority</span><select value={announcementForm.priority} onChange={(event) => setAnnouncementForm((value) => ({ ...value, priority: event.target.value }))}>{communicationPriorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
          </div>
          <div className="comm-form-row">
            <label><span>Category</span><select value={announcementForm.category} onChange={(event) => setAnnouncementForm((value) => ({ ...value, category: event.target.value }))}>{communicationCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label><span>Expiry date</span><input type="date" value={announcementForm.expiryDate} onChange={(event) => setAnnouncementForm((value) => ({ ...value, expiryDate: event.target.value }))} /></label>
          </div>
          <label><span>Linked document</span><select value={announcementForm.linkedDocumentId} onChange={(event) => setAnnouncementForm((value) => ({ ...value, linkedDocumentId: event.target.value }))}><option value="">No document</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.fileName}</option>)}</select></label>
          <button type="submit" disabled={!canManage}><Send size={17} />Publish announcement</button>
        </form>

        <form className="comm-panel comm-form" onSubmit={saveMessage}>
          <p className="eyebrow">Messages</p>
          <h2>Internal message foundation</h2>
          <label><span>Subject</span><input value={messageForm.subject} onChange={(event) => setMessageForm((value) => ({ ...value, subject: event.target.value }))} /></label>
          <label><span>Message</span><textarea value={messageForm.body} onChange={(event) => setMessageForm((value) => ({ ...value, body: event.target.value }))} /></label>
          <div className="comm-form-row">
            <label><span>Audience</span><select value={messageForm.audienceType} onChange={(event) => setMessageForm((value) => ({ ...value, audienceType: event.target.value }))}>{messageAudiences.map((audience) => <option key={audience}>{audience}</option>)}</select></label>
            <label><span>Department</span><select value={messageForm.targetDepartment} onChange={(event) => setMessageForm((value) => ({ ...value, targetDepartment: event.target.value }))}>{communicationDepartments.filter((department) => department !== 'Company-wide').map((department) => <option key={department}>{department}</option>)}</select></label>
          </div>
          <label><span>Recipient</span><input list="employee-message-recipients" value={messageForm.recipient} onChange={(event) => setMessageForm((value) => ({ ...value, recipient: event.target.value }))} placeholder="Optional direct recipient" /></label>
          <datalist id="employee-message-recipients">
            {employees.map((employee) => <option key={employee.id} value={employee.fullName || employee.email} />)}
          </datalist>
          <button type="submit"><MessageSquare size={17} />Record message</button>
        </form>

        <form className="comm-panel comm-form" onSubmit={saveEvent}>
          <p className="eyebrow">Calendar</p>
          <h2>Company events</h2>
          <label><span>Event title</span><input value={eventForm.title} onChange={(event) => setEventForm((value) => ({ ...value, title: event.target.value }))} /></label>
          <div className="comm-form-row">
            <label><span>Type</span><select value={eventForm.eventType} onChange={(event) => setEventForm((value) => ({ ...value, eventType: event.target.value }))}>{eventTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span>Department</span><select value={eventForm.department} onChange={(event) => setEventForm((value) => ({ ...value, department: event.target.value }))}>{communicationDepartments.map((department) => <option key={department}>{department}</option>)}</select></label>
          </div>
          <div className="comm-form-row">
            <label><span>Date</span><input type="date" value={eventForm.eventDate} onChange={(event) => setEventForm((value) => ({ ...value, eventDate: event.target.value }))} /></label>
            <label><span>Time</span><input type="time" value={eventForm.eventTime} onChange={(event) => setEventForm((value) => ({ ...value, eventTime: event.target.value }))} /></label>
          </div>
          <label><span>Notes</span><textarea value={eventForm.notes} onChange={(event) => setEventForm((value) => ({ ...value, notes: event.target.value }))} /></label>
          <button type="submit" disabled={!canManage}><CalendarDays size={17} />Add event</button>
        </form>
      </section>

      <section className="comm-grid two">
        <div className="comm-panel">
          <p className="eyebrow">Company calendar</p>
          <h2>Upcoming events</h2>
          <div className="comm-event-list">
            {upcomingEvents.map((event) => (
              <article key={event.id}>
                <CalendarDays size={18} />
                <div>
                  <strong>{event.title}</strong>
                  <small>{event.eventType} - {event.department} - {event.eventDate}{event.eventTime ? ` at ${event.eventTime}` : ''}</small>
                </div>
              </article>
            ))}
            {!upcomingEvents.length && <p className="comm-muted">No company events have been scheduled yet.</p>}
          </div>
        </div>
        <div className="comm-panel">
          <p className="eyebrow">History</p>
          <h2>Communication history</h2>
          <div className="comm-history-list">
            {messages.slice(0, 7).map((message) => (
              <article key={message.id}>
                <MessageSquare size={17} />
                <div>
                  <strong>{message.subject}</strong>
                  <small>{message.audienceType} - {message.targetDepartment || message.recipient || 'General'} - {new Date(message.createdAt).toLocaleString()}</small>
                </div>
              </article>
            ))}
            {!messages.length && <p className="comm-muted">Messages and broadcasts recorded here will appear in communication history.</p>}
          </div>
        </div>
      </section>

      <section className="comm-panel comm-ai-foundation">
        <Sparkles size={22} />
        <div>
          <p className="eyebrow">AI summary foundation</p>
          <h2>Daily and weekly summaries are prepared for AI COO</h2>
          <p>Communication records now have enough structure for future daily briefings, weekly executive summaries, mentions, team workspaces, and mobile notification workflows.</p>
        </div>
        <div className="comm-ai-tags">
          <span><CheckCircle2 size={14} />Read receipts</span>
          <span><FileText size={14} />Document links</span>
          <span><Users size={14} />Department targeting</span>
        </div>
      </section>
    </div>
  );
}

export default CommunicationCenter;
