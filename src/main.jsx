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

const blankShipment = {
  shipmentId: '',
  linkedOrderId: '',
  customerName: '',
  vehicle: '',
  quantity: 1,
  destinationCountry: '',
  portOfDeparture: '',
  portOfArrival: '',
  shippingCompany: '',
  freightCost: 0,
  eta: today,
  status: 'Preparing',
  notes: '',
};

const vehicleStatuses = ['Available', 'Reserved', 'Sold'];
const orderStatuses = ['Inquiry', 'Confirmed', 'Procurement', 'Ready', 'Delivered', 'Completed'];
const shipmentStatuses = ['Preparing', 'At Port', 'Loaded', 'In Transit', 'Customs Clearance', 'Delivered'];
const pages = ['Dashboard', 'Inventory', 'Orders', 'Customers', 'Shipments'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function fromShipmentRow(row) {
  return {
    shipmentId: row.shipment_id,
    linkedOrderId: row.linked_order_id || '',
    customerName: row.customer_name,
    vehicle: row.vehicle,
    quantity: row.quantity,
    destinationCountry: row.destination_country,
    portOfDeparture: row.port_of_departure,
    portOfArrival: row.port_of_arrival,
    shippingCompany: row.shipping_company,
    freightCost: Number(row.freight_cost),
    eta: row.eta,
    status: row.status,
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function toShipmentRow(shipment, userId) {
  return {
    shipment_id: shipment.shipmentId,
    linked_order_id: shipment.linkedOrderId,
    customer_name: shipment.customerName,
    vehicle: shipment.vehicle,
    quantity: numberValue(shipment.quantity),
    destination_country: shipment.destinationCountry,
    port_of_departure: shipment.portOfDeparture,
    port_of_arrival: shipment.portOfArrival,
    shipping_company: shipment.shippingCompany,
    freight_cost: numberValue(shipment.freightCost),
    eta: shipment.eta,
    status: shipment.status,
    notes: shipment.notes,
    ...(userId ? { created_by: userId } : {}),
  };
}

function userName(user) {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Velora user';
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

function useSupabaseRecords(user) {
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [shipments, setShipments] = useState([]);
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

    if (!user) {
      setVehicles([]);
      setOrders([]);
      setCustomers([]);
      setShipments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [vehicleRows, orderRows, customerRows, shipmentRows] = await Promise.all([
        runRequest(supabase.from('vehicles').select('*').eq('created_by', user.id).order('created_at', { ascending: false })),
        runRequest(supabase.from('orders').select('*').eq('created_by', user.id).order('created_at', { ascending: false })),
        runRequest(supabase.from('customers').select('*').eq('created_by', user.id).order('created_at', { ascending: false })),
        runRequest(supabase.from('shipments').select('*').eq('created_by', user.id).order('created_at', { ascending: false })),
      ]);

      setVehicles(vehicleRows.map(fromVehicleRow));
      setOrders(orderRows.map(fromOrderRow));
      setCustomers(customerRows.map(fromCustomerRow));
      setShipments(shipmentRows.map(fromShipmentRow));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [user?.id]);

  async function saveVehicle(vehicle, editingId) {
    const query = editingId
      ? supabase.from('vehicles').update(toVehicleRow(vehicle)).eq('id', editingId).eq('created_by', user.id).select().single()
      : supabase.from('vehicles').insert(toVehicleRow(vehicle, user.id)).select().single();
    const saved = fromVehicleRow(await runRequest(query));
    setVehicles((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteVehicle(id) {
    await runRequest(supabase.from('vehicles').delete().eq('id', id).eq('created_by', user.id));
    setVehicles((current) => current.filter((item) => item.id !== id));
  }

  async function saveOrder(order, editingId) {
    const query = editingId
      ? supabase.from('orders').update(toOrderRow(order)).eq('id', editingId).eq('created_by', user.id).select().single()
      : supabase.from('orders').insert(toOrderRow(order, user.id)).select().single();
    const saved = fromOrderRow(await runRequest(query));
    setOrders((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteOrder(id) {
    await runRequest(supabase.from('orders').delete().eq('id', id).eq('created_by', user.id));
    setOrders((current) => current.filter((item) => item.id !== id));
  }

  async function updateOrderStatus(id, status) {
    const saved = fromOrderRow(await runRequest(supabase.from('orders').update({ status }).eq('id', id).eq('created_by', user.id).select().single()));
    setOrders((current) => current.map((item) => item.id === id ? saved : item));
  }

  async function saveCustomer(customer, editingId) {
    const query = editingId
      ? supabase.from('customers').update(toCustomerRow(customer)).eq('id', editingId).eq('created_by', user.id).select().single()
      : supabase.from('customers').insert(toCustomerRow(customer, user.id)).select().single();
    const saved = fromCustomerRow(await runRequest(query));
    setCustomers((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteCustomer(id) {
    await runRequest(supabase.from('customers').delete().eq('id', id).eq('created_by', user.id));
    setCustomers((current) => current.filter((item) => item.id !== id));
  }

  async function saveShipment(shipment, editingId) {
    const query = editingId
      ? supabase.from('shipments').update(toShipmentRow(shipment)).eq('shipment_id', editingId).eq('created_by', user.id).select().single()
      : supabase.from('shipments').insert(toShipmentRow(shipment, user.id)).select().single();
    const saved = fromShipmentRow(await runRequest(query));
    setShipments((current) => editingId ? current.map((item) => item.shipmentId === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteShipment(id) {
    await runRequest(supabase.from('shipments').delete().eq('shipment_id', id).eq('created_by', user.id));
    setShipments((current) => current.filter((item) => item.shipmentId !== id));
  }

  return {
    vehicles,
    orders,
    customers,
    shipments,
    loading,
    error,
    saveVehicle,
    deleteVehicle,
    saveOrder,
    deleteOrder,
    updateOrderStatus,
    saveCustomer,
    deleteCustomer,
    saveShipment,
    deleteShipment,
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

function ShipmentForm({ value, onChange, onSubmit, editingId, onCancel, orderOptions }) {
  function applyLinkedOrder(orderId) {
    const linkedOrder = orderOptions.find((order) => order.id === orderId);
    onChange({
      ...value,
      linkedOrderId: orderId,
      ...(linkedOrder ? {
        customerName: linkedOrder.customerName,
        vehicle: linkedOrder.vehicle,
        quantity: linkedOrder.quantity,
      } : {}),
    });
  }

  return (
    <form className="entry-form shipment-form" onSubmit={onSubmit}>
      <Field label="Shipment ID">
        <input value={value.shipmentId} onChange={(e) => onChange({ ...value, shipmentId: e.target.value })} required />
      </Field>
      <Field label="Linked Order ID">
        <input list="order-list" value={value.linkedOrderId} onChange={(e) => applyLinkedOrder(e.target.value)} />
        <datalist id="order-list">
          {orderOptions.map((order) => (
            <option key={order.id} value={order.id}>{order.customerName}</option>
          ))}
        </datalist>
      </Field>
      <Field label="Customer Name">
        <input value={value.customerName} onChange={(e) => onChange({ ...value, customerName: e.target.value })} required />
      </Field>
      <Field label="Vehicle">
        <input value={value.vehicle} onChange={(e) => onChange({ ...value, vehicle: e.target.value })} required />
      </Field>
      <Field label="Quantity">
        <input type="number" min="1" value={value.quantity} onChange={(e) => onChange({ ...value, quantity: e.target.value })} />
      </Field>
      <Field label="Destination Country">
        <input value={value.destinationCountry} onChange={(e) => onChange({ ...value, destinationCountry: e.target.value })} required />
      </Field>
      <Field label="Port of Departure">
        <input value={value.portOfDeparture} onChange={(e) => onChange({ ...value, portOfDeparture: e.target.value })} />
      </Field>
      <Field label="Port of Arrival">
        <input value={value.portOfArrival} onChange={(e) => onChange({ ...value, portOfArrival: e.target.value })} />
      </Field>
      <Field label="Shipping Company">
        <input value={value.shippingCompany} onChange={(e) => onChange({ ...value, shippingCompany: e.target.value })} />
      </Field>
      <Field label="Freight Cost">
        <input type="number" min="0" value={value.freightCost} onChange={(e) => onChange({ ...value, freightCost: e.target.value })} />
      </Field>
      <Field label="ETA">
        <input type="date" value={value.eta} onChange={(e) => onChange({ ...value, eta: e.target.value })} />
      </Field>
      <Field label="Status">
        <select value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value })}>
          {shipmentStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </Field>
      <Field label="Notes">
        <textarea value={value.notes} onChange={(e) => onChange({ ...value, notes: e.target.value })} />
      </Field>
      <div className="form-actions">
        <button type="submit">{editingId ? 'Save shipment' : 'Add shipment'}</button>
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

function Dashboard({ vehicles, orders, shipments }) {
  const totals = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== 'Completed').length;
    const completedOrders = orders.filter((order) => order.status === 'Completed').length;
    return {
      inventory: vehicles.reduce((sum, vehicle) => sum + numberValue(vehicle.quantity), 0),
      activeOrders,
      completedOrders,
      revenue: orders.reduce((sum, order) => sum + orderRevenue(order), 0),
      profit: orders.reduce((sum, order) => sum + orderProfit(order), 0),
      shipments: shipments.length,
      freightCost: shipments.reduce((sum, shipment) => sum + numberValue(shipment.freightCost), 0),
    };
  }, [vehicles, orders, shipments]);

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
        <Metric label="Vehicles in inventory" value={totals.inventory} />
        <Metric label="Active orders" value={totals.activeOrders} />
        <Metric label="Completed orders" value={totals.completedOrders} />
        <Metric label="Total revenue" value={money.format(totals.revenue)} tone="accent" />
        <Metric label="Total profit" value={money.format(totals.profit)} tone="success" />
        <Metric label="Shipments" value={totals.shipments} />
        <Metric label="Total freight cost" value={money.format(totals.freightCost)} tone="accent" />
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
              <th>Revenue</th>
              <th>Profit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customerName}</td>
                <td>{order.vehicle}</td>
                <td>{money.format(orderRevenue(order))}</td>
                <td>{money.format(orderProfit(order))}</td>
                <td><StatusBadge status={order.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Inventory({ vehicles, saveVehicle, deleteVehicle }) {
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
      <VehicleForm value={form} onChange={setForm} onSubmit={submitVehicle} editingId={editingId} onCancel={() => { setForm(blankVehicle); setEditingId(''); }} />
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Vehicle ID</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Purchase Price</th>
              <th>Selling Price</th>
              <th>Profit Amount</th>
              <th>Profit Margin %</th>
              <th>Status</th>
              <th>Actions</th>
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
                <td>{money.format(vehicle.purchasePrice)}</td>
                <td>{money.format(vehicle.sellingPrice)}</td>
                <td>{money.format(profitAmount(vehicle))}</td>
                <td>{profitMargin(vehicle).toFixed(1)}%</td>
                <td><StatusBadge status={vehicle.status} /></td>
                <td className="row-actions">
                  <button className="mini" onClick={() => editVehicle(vehicle)}>Edit</button>
                  <button className="mini danger" onClick={() => deleteVehicle(vehicle.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No vehicles found." />}
      </div>
    </section>
  );
}

function Orders({ orders, saveOrder, deleteOrder, updateOrderStatus, vehicles }) {
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
      <OrderForm value={form} onChange={setForm} onSubmit={submitOrder} editingId={editingId} vehicleOptions={vehicles} onCancel={() => { setForm(blankOrder); setEditingId(''); }} />
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Name</th>
              <th>Vehicle</th>
              <th>Qty</th>
              <th>Order Date</th>
              <th>Purchase Cost</th>
              <th>Selling Price</th>
              <th>Total Revenue</th>
              <th>Total Profit</th>
              <th>Status</th>
              <th>Actions</th>
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
                <td>{money.format(order.purchaseCost)}</td>
                <td>{money.format(order.sellingPrice)}</td>
                <td>{money.format(orderRevenue(order))}</td>
                <td>{money.format(orderProfit(order))}</td>
                <td>
                  <select className="status-select" value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)}>
                    {orderStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td className="row-actions">
                  <button className="mini" onClick={() => { setForm(order); setEditingId(order.id); }}>Edit</button>
                  <button className="mini danger" onClick={() => deleteOrder(order.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No orders found." />}
      </div>
    </section>
  );
}

function Customers({ customers, saveCustomer, deleteCustomer }) {
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
      <CustomerForm value={form} onChange={setForm} onSubmit={submitCustomer} editingId={editingId} onCancel={() => { setForm(blankCustomer); setEditingId(''); }} />
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Country / City</th>
              <th>Notes</th>
              <th>Actions</th>
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
                <td className="row-actions">
                  <button className="mini" onClick={() => { setForm(customer); setEditingId(customer.id); }}>Edit</button>
                  <button className="mini danger" onClick={() => deleteCustomer(customer.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Shipments({ shipments, saveShipment, deleteShipment, orders }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [form, setForm] = useState(blankShipment);
  const [editingId, setEditingId] = useState('');
  const filtered = shipments.filter((shipment) => {
    const statusMatches = statusFilter === 'All' || shipment.status === statusFilter;
    return statusMatches && matchesSearch(shipment, query);
  });

  async function submitShipment(event) {
    event.preventDefault();
    const saved = {
      ...form,
      quantity: numberValue(form.quantity),
      freightCost: numberValue(form.freightCost),
    };
    await saveShipment(saved, editingId);
    setForm(blankShipment);
    setEditingId('');
  }

  function editShipment(shipment) {
    setForm(shipment);
    setEditingId(shipment.shipmentId);
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Shipments</p>
          <h1>Shipment tracking</h1>
        </div>
        <div className="toolbar">
          <input className="search" placeholder="Search shipments" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            {shipmentStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      <ShipmentForm value={form} onChange={setForm} onSubmit={submitShipment} editingId={editingId} orderOptions={orders} onCancel={() => { setForm(blankShipment); setEditingId(''); }} />
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Shipment ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Qty</th>
              <th>Destination</th>
              <th>Departure Port</th>
              <th>Arrival Port</th>
              <th>Shipping Company</th>
              <th>Freight Cost</th>
              <th>ETA</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((shipment) => (
              <tr key={shipment.shipmentId}>
                <td>{shipment.shipmentId}</td>
                <td>{shipment.linkedOrderId}</td>
                <td>{shipment.customerName}</td>
                <td>{shipment.vehicle}</td>
                <td>{shipment.quantity}</td>
                <td>{shipment.destinationCountry}</td>
                <td>{shipment.portOfDeparture}</td>
                <td>{shipment.portOfArrival}</td>
                <td>{shipment.shippingCompany}</td>
                <td>{money.format(shipment.freightCost)}</td>
                <td>{shipment.eta}</td>
                <td><StatusBadge status={shipment.status} /></td>
                <td>{shipment.notes}</td>
                <td className="row-actions">
                  <button className="mini" onClick={() => editShipment(shipment)}>Edit</button>
                  <button className="mini danger" onClick={() => deleteShipment(shipment.shipmentId)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No shipments found." />}
      </div>
    </section>
  );
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const { user, authLoading, authError, signOut } = useAuthSession();
  const {
    vehicles,
    orders,
    customers,
    shipments,
    loading,
    error,
    saveVehicle,
    deleteVehicle,
    saveOrder,
    deleteOrder,
    updateOrderStatus,
    saveCustomer,
    deleteCustomer,
    saveShipment,
    deleteShipment,
  } = useSupabaseRecords(user);

  if (authLoading) {
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
          <strong>{userName(user)}</strong>
          <small>{user.email}</small>
          <button onClick={signOut}>Sign Out</button>
        </div>
        <nav>
          {pages.map((page) => (
            <button key={page} className={activePage === page ? 'active' : ''} onClick={() => setActivePage(page)}>
              {page}
            </button>
          ))}
        </nav>
      </aside>
      <main>
        {loading && <div className="app-message">Loading Velora records...</div>}
        {error && <div className="app-message error">{error}</div>}
        {activePage === 'Dashboard' && <Dashboard vehicles={vehicles} orders={orders} shipments={shipments} />}
        {activePage === 'Inventory' && <Inventory vehicles={vehicles} saveVehicle={saveVehicle} deleteVehicle={deleteVehicle} />}
        {activePage === 'Orders' && <Orders orders={orders} saveOrder={saveOrder} deleteOrder={deleteOrder} updateOrderStatus={updateOrderStatus} vehicles={vehicles} />}
        {activePage === 'Customers' && <Customers customers={customers} saveCustomer={saveCustomer} deleteCustomer={deleteCustomer} />}
        {activePage === 'Shipments' && <Shipments shipments={shipments} saveShipment={saveShipment} deleteShipment={deleteShipment} orders={orders} />}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
