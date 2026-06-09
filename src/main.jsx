import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import './styles.css';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const today = new Date().toISOString().slice(0, 10);

const initialVehicles = [
  {
    id: 'VH-1001',
    brand: 'Toyota',
    model: 'Land Cruiser Prado',
    category: 'SUV',
    quantity: 4,
    purchasePrice: 48500,
    sellingPrice: 57500,
    status: 'Available',
  },
  {
    id: 'VH-1002',
    brand: 'BMW',
    model: 'X5 xDrive',
    category: 'Luxury SUV',
    quantity: 2,
    purchasePrice: 72000,
    sellingPrice: 84500,
    status: 'Reserved',
  },
  {
    id: 'VH-1003',
    brand: 'Mercedes-Benz',
    model: 'C300',
    category: 'Sedan',
    quantity: 1,
    purchasePrice: 43500,
    sellingPrice: 51200,
    status: 'Sold',
  },
];

const initialOrders = [
  {
    id: 'ORD-2101',
    customerName: 'Elias Conte',
    vehicle: 'Toyota Land Cruiser Prado',
    quantity: 2,
    orderDate: '2026-06-02',
    purchaseCost: 48500,
    sellingPrice: 57500,
    status: 'Confirmed',
  },
  {
    id: 'ORD-2102',
    customerName: 'Maya Hassan',
    vehicle: 'BMW X5 xDrive',
    quantity: 1,
    orderDate: '2026-06-05',
    purchaseCost: 72000,
    sellingPrice: 84500,
    status: 'Ready',
  },
  {
    id: 'ORD-2103',
    customerName: 'Daniel Okafor',
    vehicle: 'Mercedes-Benz C300',
    quantity: 1,
    orderDate: '2026-05-27',
    purchaseCost: 43500,
    sellingPrice: 51200,
    status: 'Completed',
  },
];

const initialCustomers = [
  {
    id: 'CUS-301',
    name: 'Elias Conte',
    phone: '+39 345 778 1200',
    email: 'elias.conte@example.com',
    location: 'Italy / Milan',
    notes: 'Prefers white SUVs with tan interior.',
  },
  {
    id: 'CUS-302',
    name: 'Maya Hassan',
    phone: '+971 55 140 9921',
    email: 'maya.hassan@example.com',
    location: 'UAE / Dubai',
    notes: 'Interested in premium models.',
  },
  {
    id: 'CUS-303',
    name: 'Daniel Okafor',
    phone: '+234 803 444 9012',
    email: 'daniel.okafor@example.com',
    location: 'Nigeria / Lagos',
    notes: 'Repeat buyer.',
  },
];

const blankVehicle = {
  id: '',
  brand: '',
  model: '',
  category: '',
  quantity: 1,
  purchasePrice: 0,
  sellingPrice: 0,
  status: 'Available',
};

const blankOrder = {
  id: '',
  customerName: '',
  vehicle: '',
  quantity: 1,
  orderDate: today,
  purchaseCost: 0,
  sellingPrice: 0,
  status: 'Inquiry',
};

const blankCustomer = {
  id: '',
  name: '',
  phone: '',
  email: '',
  location: '',
  notes: '',
};

const vehicleStatuses = ['Available', 'Reserved', 'Sold'];
const orderStatuses = ['Inquiry', 'Confirmed', 'Procurement', 'Ready', 'Delivered', 'Completed'];
const basePages = ['Dashboard', 'Inventory', 'Orders', 'Customers'];
const roles = ['CEO', 'Manager', 'Sales Executive', 'Logistics Officer'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function canManageUsers(profile) {
  return profile?.role === 'CEO';
}

function canManageInventory(profile) {
  return ['CEO', 'Manager'].includes(profile?.role);
}

function canViewInventory(profile) {
  return ['CEO', 'Manager', 'Sales Executive'].includes(profile?.role);
}

function canManageOrders(profile) {
  return ['CEO', 'Manager', 'Sales Executive'].includes(profile?.role);
}

function canManageCustomers(profile) {
  return ['CEO', 'Manager', 'Sales Executive'].includes(profile?.role);
}

function canDeleteRecords(profile) {
  return ['CEO', 'Manager'].includes(profile?.role);
}

function canUpdateOrderStatus(profile) {
  return ['CEO', 'Manager', 'Sales Executive', 'Logistics Officer'].includes(profile?.role);
}

function canViewFinancials(profile) {
  return ['CEO', 'Manager', 'Sales Executive'].includes(profile?.role);
}

function numberValue(value) {
  return Number(value) || 0;
}

function profitAmount(record) {
  return numberValue(record.sellingPrice) - numberValue(record.purchasePrice ?? record.purchaseCost);
}

function profitMargin(record) {
  const selling = numberValue(record.sellingPrice);
  if (!selling) return 0;
  return (profitAmount(record) / selling) * 100;
}

function orderRevenue(order) {
  return numberValue(order.sellingPrice) * numberValue(order.quantity);
}

function orderProfit(order) {
  return profitAmount(order) * numberValue(order.quantity);
}

function matchesSearch(record, query) {
  const text = Object.values(record).join(' ').toLowerCase();
  return text.includes(query.toLowerCase());
}

function fromVehicleRow(row) {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    category: row.category,
    quantity: row.quantity,
    purchasePrice: Number(row.purchase_price),
    sellingPrice: Number(row.selling_price),
    status: row.status,
  };
}

function toVehicleRow(vehicle, userId) {
  return {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    category: vehicle.category,
    quantity: numberValue(vehicle.quantity),
    purchase_price: numberValue(vehicle.purchasePrice),
    selling_price: numberValue(vehicle.sellingPrice),
    status: vehicle.status,
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromOrderRow(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    vehicle: row.vehicle,
    quantity: row.quantity,
    orderDate: row.order_date,
    purchaseCost: Number(row.purchase_cost),
    sellingPrice: Number(row.selling_price),
    status: row.status,
  };
}

function toOrderRow(order, userId) {
  return {
    id: order.id,
    customer_name: order.customerName,
    vehicle: order.vehicle,
    quantity: numberValue(order.quantity),
    order_date: order.orderDate,
    purchase_cost: numberValue(order.purchaseCost),
    selling_price: numberValue(order.sellingPrice),
    status: order.status,
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromCustomerRow(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    email: row.email || '',
    location: row.location || '',
    notes: row.notes || '',
  };
}

function toCustomerRow(customer, userId) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    location: customer.location,
    notes: customer.notes,
    ...(userId ? { created_by: userId } : {}),
  };
}

function userName(user) {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Velora user';
}

function profileName(profile, user) {
  return profile?.full_name || userName(user);
}

function useAuthSession() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      setAuthError('Supabase environment variables are missing.');
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) setAuthError(error.message);
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    setAuthError('');
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error.message);
  }

  return { session, user: session?.user || null, authLoading, authError, signOut };
}

function useProfile(user) {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  async function loadProfile() {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setProfileError('');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      setProfileError(error.message);
      setProfile(null);
    } else {
      setProfile(data);
    }

    setProfileLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  return { profile, profileLoading, profileError, refreshProfile: loadProfile };
}

function useUserManagement(profile) {
  const [profiles, setProfiles] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState('');

  async function loadProfiles() {
    if (!canManageUsers(profile)) {
      setProfiles([]);
      return;
    }

    setLoadingUsers(true);
    setUserError('');

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setUserError(error.message);
    } else {
      setProfiles(data);
    }

    setLoadingUsers(false);
  }

  useEffect(() => {
    loadProfiles();
  }, [profile?.role]);

  async function updateUserRole(id, role) {
    if (!canManageUsers(profile)) {
      setUserError('Only the CEO can manage user roles.');
      return;
    }

    setUserError('');
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select('id, full_name, email, role, created_at')
      .single();

    if (error) {
      setUserError(error.message);
      return;
    }

    setProfiles((current) => current.map((item) => item.id === id ? data : item));
  }

  return { profiles, loadingUsers, userError, updateUserRole };
}

function useSupabaseRecords(user, profile) {
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function runRequest(request) {
    setError('');
    const { data, error: requestError } = await request;
    if (requestError) {
      setError(requestError.message);
      throw requestError;
    }
    return data;
  }

  async function loadRecords() {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError('Supabase environment variables are missing.');
      return;
    }

    if (!user || !profile) {
      setVehicles([]);
      setOrders([]);
      setCustomers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const vehicleQuery = supabase.from('vehicles').select('*').order('created_at', { ascending: false });
      const orderQuery = supabase.from('orders').select('*').order('created_at', { ascending: false });
      const customerQuery = supabase.from('customers').select('*').order('created_at', { ascending: false });

      const [vehicleRows, orderRows, customerRows] = await Promise.all([
        canViewInventory(profile) ? runRequest(vehicleQuery) : Promise.resolve([]),
        runRequest(orderQuery),
        canManageCustomers(profile) ? runRequest(customerQuery) : Promise.resolve([]),
      ]);

      setVehicles(vehicleRows.map(fromVehicleRow));
      setOrders(orderRows.map(fromOrderRow));
      setCustomers(customerRows.map(fromCustomerRow));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [user?.id, profile?.role]);

  async function saveVehicle(vehicle, editingId) {
    if (!canManageInventory(profile)) {
      setError('Your role cannot manage inventory.');
      return;
    }

    const query = editingId
      ? supabase.from('vehicles').update(toVehicleRow(vehicle)).eq('id', editingId).select().single()
      : supabase.from('vehicles').insert(toVehicleRow(vehicle, user.id)).select().single();
    const saved = fromVehicleRow(await runRequest(query));
    setVehicles((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteVehicle(id) {
    if (!canDeleteRecords(profile)) {
      setError('Your role cannot delete records.');
      return;
    }

    await runRequest(supabase.from('vehicles').delete().eq('id', id));
    setVehicles((current) => current.filter((item) => item.id !== id));
  }

  async function saveOrder(order, editingId) {
    if (!canManageOrders(profile)) {
      setError('Your role cannot create or edit orders.');
      return;
    }

    const query = editingId
      ? supabase.from('orders').update(toOrderRow(order)).eq('id', editingId).select().single()
      : supabase.from('orders').insert(toOrderRow(order, user.id)).select().single();
    const saved = fromOrderRow(await runRequest(query));
    setOrders((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteOrder(id) {
    if (!canDeleteRecords(profile)) {
      setError('Your role cannot delete records.');
      return;
    }

    await runRequest(supabase.from('orders').delete().eq('id', id));
    setOrders((current) => current.filter((item) => item.id !== id));
  }

  async function updateOrderStatus(id, status) {
    if (!canUpdateOrderStatus(profile)) {
      setError('Your role cannot update order status.');
      return;
    }

    const saved = fromOrderRow(await runRequest(supabase.from('orders').update({ status }).eq('id', id).select().single()));
    setOrders((current) => current.map((item) => item.id === id ? saved : item));
  }

  async function saveCustomer(customer, editingId) {
    if (!canManageCustomers(profile)) {
      setError('Your role cannot create or edit customers.');
      return;
    }

    const query = editingId
      ? supabase.from('customers').update(toCustomerRow(customer)).eq('id', editingId).select().single()
      : supabase.from('customers').insert(toCustomerRow(customer, user.id)).select().single();
    const saved = fromCustomerRow(await runRequest(query));
    setCustomers((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteCustomer(id) {
    if (!canDeleteRecords(profile)) {
      setError('Your role cannot delete records.');
      return;
    }

    await runRequest(supabase.from('customers').delete().eq('id', id));
    setCustomers((current) => current.filter((item) => item.id !== id));
  }

  return {
    vehicles,
    orders,
    customers,
    loading,
    error,
    saveVehicle,
    deleteVehicle,
    saveOrder,
    deleteOrder,
    updateOrderStatus,
    saveCustomer,
    deleteCustomer,
  };
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value, tone }) {
  return (
    <article className={`metric ${tone || ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EmptyState({ label }) {
  return <div className="empty-state">{label}</div>;
}

function VehicleForm({ value, onChange, onSubmit, editingId, onCancel }) {
  return (
    <form className="entry-form" onSubmit={onSubmit}>
      <Field label="Vehicle ID">
        <input value={value.id} onChange={(e) => onChange({ ...value, id: e.target.value })} required />
      </Field>
      <Field label="Brand">
        <input value={value.brand} onChange={(e) => onChange({ ...value, brand: e.target.value })} required />
      </Field>
      <Field label="Model">
        <input value={value.model} onChange={(e) => onChange({ ...value, model: e.target.value })} required />
      </Field>
      <Field label="Category">
        <input value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value })} required />
      </Field>
      <Field label="Quantity">
        <input type="number" min="0" value={value.quantity} onChange={(e) => onChange({ ...value, quantity: e.target.value })} />
      </Field>
      <Field label="Purchase Price">
        <input type="number" min="0" value={value.purchasePrice} onChange={(e) => onChange({ ...value, purchasePrice: e.target.value })} />
      </Field>
      <Field label="Selling Price">
        <input type="number" min="0" value={value.sellingPrice} onChange={(e) => onChange({ ...value, sellingPrice: e.target.value })} />
      </Field>
      <Field label="Status">
        <select value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value })}>
          {vehicleStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </Field>
      <div className="form-actions">
        <button type="submit">{editingId ? 'Save vehicle' : 'Add vehicle'}</button>
        {editingId && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function OrderForm({ value, onChange, onSubmit, editingId, onCancel, vehicleOptions }) {
  return (
    <form className="entry-form" onSubmit={onSubmit}>
      <Field label="Order ID">
        <input value={value.id} onChange={(e) => onChange({ ...value, id: e.target.value })} required />
      </Field>
      <Field label="Customer Name">
        <input value={value.customerName} onChange={(e) => onChange({ ...value, customerName: e.target.value })} required />
      </Field>
      <Field label="Vehicle">
        <input list="vehicle-list" value={value.vehicle} onChange={(e) => onChange({ ...value, vehicle: e.target.value })} required />
        <datalist id="vehicle-list">
          {vehicleOptions.map((vehicle) => (
            <option key={vehicle.id} value={`${vehicle.brand} ${vehicle.model}`} />
          ))}
        </datalist>
      </Field>
      <Field label="Quantity">
        <input type="number" min="1" value={value.quantity} onChange={(e) => onChange({ ...value, quantity: e.target.value })} />
      </Field>
      <Field label="Order Date">
        <input type="date" value={value.orderDate} onChange={(e) => onChange({ ...value, orderDate: e.target.value })} />
      </Field>
      <Field label="Purchase Cost">
        <input type="number" min="0" value={value.purchaseCost} onChange={(e) => onChange({ ...value, purchaseCost: e.target.value })} />
      </Field>
      <Field label="Selling Price">
        <input type="number" min="0" value={value.sellingPrice} onChange={(e) => onChange({ ...value, sellingPrice: e.target.value })} />
      </Field>
      <Field label="Status">
        <select value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value })}>
          {orderStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </Field>
      <div className="form-actions">
        <button type="submit">{editingId ? 'Save order' : 'Add order'}</button>
        {editingId && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function CustomerForm({ value, onChange, onSubmit, editingId, onCancel }) {
  return (
    <form className="entry-form customer-form" onSubmit={onSubmit}>
      <Field label="Customer Name">
        <input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} required />
      </Field>
      <Field label="Phone">
        <input value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value })} />
      </Field>
      <Field label="Email">
        <input type="email" value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })} />
      </Field>
      <Field label="Country / City">
        <input value={value.location} onChange={(e) => onChange({ ...value, location: e.target.value })} />
      </Field>
      <Field label="Notes">
        <textarea value={value.notes} onChange={(e) => onChange({ ...value, notes: e.target.value })} />
      </Field>
      <div className="form-actions">
        <button type="submit">{editingId ? 'Save customer' : 'Add customer'}</button>
        {editingId && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function StatusBadge({ status }) {
  return <span className={`status status-${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>;
}

function AuthView({ authError }) {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState(authError);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setError(authError);
  }, [authError]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
    setMessage('');
  }

  function validateEmail() {
    if (!emailPattern.test(form.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    return true;
  }

  async function submitAuth(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!isSupabaseConfigured) {
      setError('Supabase environment variables are missing.');
      return;
    }

    if (!validateEmail()) return;

    if (mode !== 'forgot' && form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (mode === 'signup' && form.password !== form.confirmPassword) {
      setError('Passwords must match.');
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInError) throw signInError;
      }

      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;
        setMessage('Account created. Check your email if confirmation is enabled.');
      }

      if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: window.location.origin,
        });
        if (resetError) throw resetError;
        setMessage('Password reset instructions have been sent to your email.');
      }
    } catch (requestError) {
      setError(requestError.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password';
  const helper = mode === 'signin'
    ? 'Access Velora inventory, orders, and customer records.'
    : mode === 'signup'
      ? 'Create a secure Velora Tracker account.'
      : 'Enter your email and we will send reset instructions.';

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark auth-brand">
          <span>VM</span>
          <div>
            <strong>Velora Motors</strong>
            <small>Tracker</small>
          </div>
        </div>
        <div>
          <p className="eyebrow">Secure access</p>
          <h1>{title}</h1>
          <p>{helper}</p>
        </div>
        <form className="auth-form" onSubmit={submitAuth}>
          {mode === 'signup' && (
            <Field label="Full Name">
              <input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} required />
            </Field>
          )}
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
          </Field>
          {mode !== 'forgot' && (
            <Field label="Password">
              <input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} minLength="8" required />
            </Field>
          )}
          {mode === 'signup' && (
            <Field label="Confirm Password">
              <input type="password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} minLength="8" required />
            </Field>
          )}
          {error && <div className="auth-alert error">{error}</div>}
          {message && <div className="auth-alert">{message}</div>}
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : title}
          </button>
        </form>
        <div className="auth-links">
          {mode !== 'signin' && <button onClick={() => setMode('signin')}>Back to sign in</button>}
          {mode !== 'signup' && <button onClick={() => setMode('signup')}>Create account</button>}
          {mode !== 'forgot' && <button onClick={() => setMode('forgot')}>Forgot password?</button>}
        </div>
      </section>
    </main>
  );
}

function Dashboard({ vehicles, orders, profile }) {
  const totals = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== 'Completed').length;
    const completedOrders = orders.filter((order) => order.status === 'Completed').length;
    return {
      inventory: vehicles.reduce((sum, vehicle) => sum + numberValue(vehicle.quantity), 0),
      activeOrders,
      completedOrders,
      revenue: orders.reduce((sum, order) => sum + orderRevenue(order), 0),
      profit: orders.reduce((sum, order) => sum + orderProfit(order), 0),
    };
  }, [vehicles, orders]);

  const recentOrders = orders.slice(0, 4);

  return (
    <section className="page-stack">
      <div className="hero">
        <div>
          <p className="eyebrow">Velora Motors Ltd.</p>
          <h1>Velora Motors Tracker</h1>
          <p>Inventory, customer orders, and profit records in one tidy Phase 1 workspace.</p>
        </div>
      </div>
      <div className="metrics-grid">
        <Metric label="Vehicles in inventory" value={canViewInventory(profile) ? totals.inventory : 'Restricted'} />
        <Metric label="Active orders" value={totals.activeOrders} />
        <Metric label="Completed orders" value={totals.completedOrders} />
        <Metric label="Total revenue" value={canViewFinancials(profile) ? money.format(totals.revenue) : 'Restricted'} tone="accent" />
        <Metric label="Total profit" value={canViewFinancials(profile) ? money.format(totals.profit) : 'Restricted'} tone="success" />
      </div>
      <div className="section-heading">
        <h2>Recent orders</h2>
      </div>
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Vehicle</th>
              {canViewFinancials(profile) && <th>Revenue</th>}
              {canViewFinancials(profile) && <th>Profit</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customerName}</td>
                <td>{order.vehicle}</td>
                {canViewFinancials(profile) && <td>{money.format(orderRevenue(order))}</td>}
                {canViewFinancials(profile) && <td>{money.format(orderProfit(order))}</td>}
                <td><StatusBadge status={order.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Inventory({ vehicles, saveVehicle, deleteVehicle, profile }) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(blankVehicle);
  const [editingId, setEditingId] = useState('');
  const filtered = vehicles.filter((vehicle) => matchesSearch(vehicle, query));

  async function submitVehicle(event) {
    event.preventDefault();
    const saved = {
      ...form,
      quantity: numberValue(form.quantity),
      purchasePrice: numberValue(form.purchasePrice),
      sellingPrice: numberValue(form.sellingPrice),
    };
    await saveVehicle(saved, editingId);
    setForm(blankVehicle);
    setEditingId('');
  }

  function editVehicle(vehicle) {
    setForm(vehicle);
    setEditingId(vehicle.id);
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>Vehicle stock</h1>
        </div>
        <input className="search" placeholder="Search vehicles" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {canManageInventory(profile) && (
        <VehicleForm value={form} onChange={setForm} onSubmit={submitVehicle} editingId={editingId} onCancel={() => { setForm(blankVehicle); setEditingId(''); }} />
      )}
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Vehicle ID</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Category</th>
              <th>Qty</th>
              {canViewFinancials(profile) && <th>Purchase Price</th>}
              {canViewFinancials(profile) && <th>Selling Price</th>}
              {canViewFinancials(profile) && <th>Profit Amount</th>}
              {canViewFinancials(profile) && <th>Profit Margin %</th>}
              <th>Status</th>
              {(canManageInventory(profile) || canDeleteRecords(profile)) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>{vehicle.id}</td>
                <td>{vehicle.brand}</td>
                <td>{vehicle.model}</td>
                <td>{vehicle.category}</td>
                <td>{vehicle.quantity}</td>
                {canViewFinancials(profile) && <td>{money.format(vehicle.purchasePrice)}</td>}
                {canViewFinancials(profile) && <td>{money.format(vehicle.sellingPrice)}</td>}
                {canViewFinancials(profile) && <td>{money.format(profitAmount(vehicle))}</td>}
                {canViewFinancials(profile) && <td>{profitMargin(vehicle).toFixed(1)}%</td>}
                <td><StatusBadge status={vehicle.status} /></td>
                {(canManageInventory(profile) || canDeleteRecords(profile)) && (
                  <td className="row-actions">
                    {canManageInventory(profile) && <button className="mini" onClick={() => editVehicle(vehicle)}>Edit</button>}
                    {canDeleteRecords(profile) && <button className="mini danger" onClick={() => deleteVehicle(vehicle.id)}>Delete</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No vehicles found." />}
      </div>
    </section>
  );
}

function Orders({ orders, saveOrder, deleteOrder, updateOrderStatus, vehicles, profile }) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(blankOrder);
  const [editingId, setEditingId] = useState('');
  const filtered = orders.filter((order) => matchesSearch(order, query));

  async function submitOrder(event) {
    event.preventDefault();
    const saved = {
      ...form,
      quantity: numberValue(form.quantity),
      purchaseCost: numberValue(form.purchaseCost),
      sellingPrice: numberValue(form.sellingPrice),
    };
    await saveOrder(saved, editingId);
    setForm(blankOrder);
    setEditingId('');
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Orders</p>
          <h1>Customer orders</h1>
        </div>
        <input className="search" placeholder="Search orders" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {canManageOrders(profile) && (
        <OrderForm value={form} onChange={setForm} onSubmit={submitOrder} editingId={editingId} vehicleOptions={vehicles} onCancel={() => { setForm(blankOrder); setEditingId(''); }} />
      )}
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Name</th>
              <th>Vehicle</th>
              <th>Qty</th>
              <th>Order Date</th>
              {canViewFinancials(profile) && <th>Purchase Cost</th>}
              {canViewFinancials(profile) && <th>Selling Price</th>}
              {canViewFinancials(profile) && <th>Total Revenue</th>}
              {canViewFinancials(profile) && <th>Total Profit</th>}
              <th>Status</th>
              {(canManageOrders(profile) || canDeleteRecords(profile)) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customerName}</td>
                <td>{order.vehicle}</td>
                <td>{order.quantity}</td>
                <td>{order.orderDate}</td>
                {canViewFinancials(profile) && <td>{money.format(order.purchaseCost)}</td>}
                {canViewFinancials(profile) && <td>{money.format(order.sellingPrice)}</td>}
                {canViewFinancials(profile) && <td>{money.format(orderRevenue(order))}</td>}
                {canViewFinancials(profile) && <td>{money.format(orderProfit(order))}</td>}
                <td>
                  {canUpdateOrderStatus(profile) ? (
                    <select className="status-select" value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)}>
                      {orderStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  ) : (
                    <StatusBadge status={order.status} />
                  )}
                </td>
                {(canManageOrders(profile) || canDeleteRecords(profile)) && (
                  <td className="row-actions">
                    {canManageOrders(profile) && <button className="mini" onClick={() => { setForm(order); setEditingId(order.id); }}>Edit</button>}
                    {canDeleteRecords(profile) && <button className="mini danger" onClick={() => deleteOrder(order.id)}>Delete</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No orders found." />}
      </div>
    </section>
  );
}

function Customers({ customers, saveCustomer, deleteCustomer, profile }) {
  const [form, setForm] = useState(blankCustomer);
  const [editingId, setEditingId] = useState('');

  async function submitCustomer(event) {
    event.preventDefault();
    const saved = { ...form, id: editingId || `CUS-${Date.now().toString().slice(-5)}` };
    await saveCustomer(saved, editingId);
    setForm(blankCustomer);
    setEditingId('');
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Customers</p>
          <h1>Customer records</h1>
        </div>
      </div>
      {canManageCustomers(profile) && (
        <CustomerForm value={form} onChange={setForm} onSubmit={submitCustomer} editingId={editingId} onCancel={() => { setForm(blankCustomer); setEditingId(''); }} />
      )}
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Country / City</th>
              <th>Notes</th>
              {(canManageCustomers(profile) || canDeleteRecords(profile)) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td>{customer.location}</td>
                <td>{customer.notes}</td>
                {(canManageCustomers(profile) || canDeleteRecords(profile)) && (
                  <td className="row-actions">
                    {canManageCustomers(profile) && <button className="mini" onClick={() => { setForm(customer); setEditingId(customer.id); }}>Edit</button>}
                    {canDeleteRecords(profile) && <button className="mini danger" onClick={() => deleteCustomer(customer.id)}>Delete</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UserManagement({ profiles, loadingUsers, userError, updateUserRole }) {
  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>User management</h1>
        </div>
      </div>
      {loadingUsers && <div className="app-message">Loading users...</div>}
      {userError && <div className="app-message error">{userError}</div>}
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>{profile.full_name || 'Unnamed user'}</td>
                <td>{profile.email}</td>
                <td>
                  <select className="status-select" value={profile.role} onChange={(event) => updateUserRole(profile.id, event.target.value)}>
                    {roles.map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                </td>
                <td>{new Date(profile.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!profiles.length && !loadingUsers && <EmptyState label="No users found." />}
      </div>
    </section>
  );
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const { user, authLoading, authError, signOut } = useAuthSession();
  const { profile, profileLoading, profileError } = useProfile(user);
  const availablePages = useMemo(() => {
    if (!profile) return ['Dashboard'];
    const pages = basePages.filter((page) => {
      if (page === 'Inventory') return canViewInventory(profile);
      if (page === 'Customers') return canManageCustomers(profile);
      if (page === 'Orders') return canManageOrders(profile) || profile.role === 'Logistics Officer';
      return true;
    });

    return canManageUsers(profile) ? [...pages, 'User Management'] : pages;
  }, [profile]);
  const { profiles, loadingUsers, userError, updateUserRole } = useUserManagement(profile);
  const {
    vehicles,
    orders,
    customers,
    loading,
    error,
    saveVehicle,
    deleteVehicle,
    saveOrder,
    deleteOrder,
    updateOrderStatus,
    saveCustomer,
    deleteCustomer,
  } = useSupabaseRecords(user, profile);

  useEffect(() => {
    if (!availablePages.includes(activePage)) {
      setActivePage('Dashboard');
    }
  }, [availablePages, activePage]);

  if (authLoading || (user && profileLoading)) {
    return <div className="screen-loader">Checking Velora session...</div>;
  }

  if (!user) {
    return <AuthView authError={authError} />;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand-mark">
          <span>VM</span>
          <div>
            <strong>Velora Motors</strong>
            <small>Tracker</small>
          </div>
        </div>
        <div className="user-profile">
          <strong>{profileName(profile, user)}</strong>
          <small>{user.email}</small>
          <span className={`role-badge role-${profile?.role?.toLowerCase().replace(/\s+/g, '-')}`}>{profile?.role || 'Loading role'}</span>
          <button onClick={signOut}>Sign Out</button>
        </div>
        <nav>
          {availablePages.map((page) => (
            <button key={page} className={activePage === page ? 'active' : ''} onClick={() => setActivePage(page)}>
              {page}
            </button>
          ))}
        </nav>
      </aside>
      <main>
        {loading && <div className="app-message">Loading Velora records...</div>}
        {error && <div className="app-message error">{error}</div>}
        {profileError && <div className="app-message error">{profileError}</div>}
        {activePage === 'Dashboard' && <Dashboard vehicles={vehicles} orders={orders} profile={profile} />}
        {activePage === 'Inventory' && <Inventory vehicles={vehicles} saveVehicle={saveVehicle} deleteVehicle={deleteVehicle} profile={profile} />}
        {activePage === 'Orders' && <Orders orders={orders} saveOrder={saveOrder} deleteOrder={deleteOrder} updateOrderStatus={updateOrderStatus} vehicles={vehicles} profile={profile} />}
        {activePage === 'Customers' && <Customers customers={customers} saveCustomer={saveCustomer} deleteCustomer={deleteCustomer} profile={profile} />}
        {activePage === 'User Management' && canManageUsers(profile) && (
          <UserManagement profiles={profiles} loadingUsers={loadingUsers} userError={userError} updateUserRole={updateUserRole} />
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
