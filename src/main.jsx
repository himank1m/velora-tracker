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
const pages = ['Dashboard', 'Inventory', 'Orders', 'Customers'];

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

function toVehicleRow(vehicle) {
  return {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    category: vehicle.category,
    quantity: numberValue(vehicle.quantity),
    purchase_price: numberValue(vehicle.purchasePrice),
    selling_price: numberValue(vehicle.sellingPrice),
    status: vehicle.status,
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

function toOrderRow(order) {
  return {
    id: order.id,
    customer_name: order.customerName,
    vehicle: order.vehicle,
    quantity: numberValue(order.quantity),
    order_date: order.orderDate,
    purchase_cost: numberValue(order.purchaseCost),
    selling_price: numberValue(order.sellingPrice),
    status: order.status,
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

function toCustomerRow(customer) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    location: customer.location,
    notes: customer.notes,
  };
}

function useSupabaseRecords() {
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

    setLoading(true);
    setError('');

    try {
      const [vehicleRows, orderRows, customerRows] = await Promise.all([
        runRequest(supabase.from('vehicles').select('*').order('created_at', { ascending: false })),
        runRequest(supabase.from('orders').select('*').order('created_at', { ascending: false })),
        runRequest(supabase.from('customers').select('*').order('created_at', { ascending: false })),
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
  }, []);

  async function saveVehicle(vehicle, editingId) {
    const query = editingId
      ? supabase.from('vehicles').update(toVehicleRow(vehicle)).eq('id', editingId).select().single()
      : supabase.from('vehicles').insert(toVehicleRow(vehicle)).select().single();
    const saved = fromVehicleRow(await runRequest(query));
    setVehicles((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteVehicle(id) {
    await runRequest(supabase.from('vehicles').delete().eq('id', id));
    setVehicles((current) => current.filter((item) => item.id !== id));
  }

  async function saveOrder(order, editingId) {
    const query = editingId
      ? supabase.from('orders').update(toOrderRow(order)).eq('id', editingId).select().single()
      : supabase.from('orders').insert(toOrderRow(order)).select().single();
    const saved = fromOrderRow(await runRequest(query));
    setOrders((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteOrder(id) {
    await runRequest(supabase.from('orders').delete().eq('id', id));
    setOrders((current) => current.filter((item) => item.id !== id));
  }

  async function updateOrderStatus(id, status) {
    const saved = fromOrderRow(await runRequest(supabase.from('orders').update({ status }).eq('id', id).select().single()));
    setOrders((current) => current.map((item) => item.id === id ? saved : item));
  }

  async function saveCustomer(customer, editingId) {
    const query = editingId
      ? supabase.from('customers').update(toCustomerRow(customer)).eq('id', editingId).select().single()
      : supabase.from('customers').insert(toCustomerRow(customer)).select().single();
    const saved = fromCustomerRow(await runRequest(query));
    setCustomers((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteCustomer(id) {
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

function Dashboard({ vehicles, orders }) {
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
        <Metric label="Vehicles in inventory" value={totals.inventory} />
        <Metric label="Active orders" value={totals.activeOrders} />
        <Metric label="Completed orders" value={totals.completedOrders} />
        <Metric label="Total revenue" value={money.format(totals.revenue)} tone="accent" />
        <Metric label="Total profit" value={money.format(totals.profit)} tone="success" />
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

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
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
  } = useSupabaseRecords();

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
        {activePage === 'Dashboard' && <Dashboard vehicles={vehicles} orders={orders} />}
        {activePage === 'Inventory' && <Inventory vehicles={vehicles} saveVehicle={saveVehicle} deleteVehicle={deleteVehicle} />}
        {activePage === 'Orders' && <Orders orders={orders} saveOrder={saveOrder} deleteOrder={deleteOrder} updateOrderStatus={updateOrderStatus} vehicles={vehicles} />}
        {activePage === 'Customers' && <Customers customers={customers} saveCustomer={saveCustomer} deleteCustomer={deleteCustomer} />}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
