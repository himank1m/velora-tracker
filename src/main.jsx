import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Command,
  FileText,
  Gauge,
  LayoutDashboard,
  Menu,
  Moon,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  Sun,
  Timeline as TimelineIcon,
  Truck,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import './styles.css';

function formatIndianNumber(value) {
  const rounded = Math.round(Number(value) || 0);
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded));
  if (digits.length <= 3) return `${sign}${digits}`;
  const lastThree = digits.slice(-3);
  const leading = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${sign}${leading},${lastThree}`;
}

const money = {
  format(value) {
    return `\u20b9${formatIndianNumber(value)}`;
  },
};

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
  locationName: 'Seoul HQ',
  department: 'Inventory',
};

const blankOrder = {
  id: '',
  orderNumber: '',
  customerName: '',
  vehicle: '',
  quantity: 1,
  orderDate: today,
  purchaseCost: 0,
  sellingPrice: 0,
  status: 'Inquiry',
  locationName: 'Seoul HQ',
  department: 'Sales',
};

const blankCustomer = {
  id: '',
  name: '',
  phone: '',
  email: '',
  location: '',
  notes: '',
  department: 'Sales',
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
  locationName: 'Port Operations Office',
  department: 'Logistics',
};

const vehicleStatuses = ['Available', 'Reserved', 'Sold'];
const orderStatuses = ['Inquiry', 'Confirmed', 'Procurement', 'Inspection', 'Ready', 'Shipped', 'Delivered', 'Completed'];
const shipmentStatuses = ['Preparing', 'At Port', 'Loaded', 'In Transit', 'Customs Clearance', 'Delivered'];
const locationOptions = ['Seoul HQ', 'New City Showroom', 'Port Operations Office', 'Warehouse'];
const departments = ['Sales', 'Inventory', 'Logistics', 'Finance', 'Management'];
const pages = ['Command Center', 'Inventory', 'Orders', 'Customers', 'Shipments', 'Timeline', 'Reports', 'Alerts Center', 'Audit Logs'];
const navGroups = [
  { label: 'Command', pages: ['Command Center'] },
  { label: 'Operations', pages: ['Inventory', 'Orders', 'Customers'] },
  { label: 'Logistics', pages: ['Shipments', 'Timeline'] },
  { label: 'Intelligence', pages: ['Reports', 'Alerts Center'] },
  { label: 'System', pages: ['Audit Logs'] },
];
const navIcons = {
  'Command Center': LayoutDashboard,
  Inventory: Boxes,
  Orders: ClipboardList,
  Customers: Users,
  Shipments: Truck,
  Timeline: TimelineIcon,
  Reports: FileText,
  'Alerts Center': Bell,
  'Audit Logs': ShieldCheck,
};
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

function groupTimelineRows(events) {
  return events.reduce((groups, event) => {
    return {
      ...groups,
      [event.orderId]: [...(groups[event.orderId] || []), event],
    };
  }, {});
}

function delayedOrderCount(orders) {
  const now = new Date();
  return orders.filter((order) => {
    if (order.status === 'Completed') return false;
    const orderDate = new Date(order.orderDate);
    const ageDays = (now - orderDate) / 86400000;
    return ageDays > 14;
  }).length;
}

function monthKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unscheduled';
  return date.toLocaleString('en-US', { month: 'short' });
}

function trendByMonth(items, dateKey, valueGetter) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const totals = months.reduce((result, month) => ({ ...result, [month]: 0 }), {});
  items.forEach((item) => {
    const key = monthKey(item[dateKey]);
    if (totals[key] !== undefined) totals[key] += valueGetter(item);
  });
  return months.map((month) => ({ month, value: totals[month] })).filter((item) => item.value > 0);
}

function countByStatus(items) {
  return Object.entries(items.reduce((result, item) => ({
    ...result,
    [item.status]: (result[item.status] || 0) + 1,
  }), {})).map(([name, value]) => ({ name, value }));
}

function daysUntil(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date - new Date()) / 86400000);
}

function createAlerts({ vehicles, orders, customers, shipments, orderTimelines }) {
  const alerts = [];

  shipments.forEach((shipment) => {
    const days = daysUntil(shipment.eta);
    if (days !== null && days >= 0 && days <= 3 && shipment.status !== 'Delivered') {
      alerts.push({
        id: `eta-${shipment.shipmentId}`,
        alert_type: 'Shipment ETA',
        severity: days <= 1 ? 'High' : 'Medium',
        title: `Shipment ${shipment.shipmentId} ETA is close`,
        message: `${shipment.vehicle} arrives in ${days} day${days === 1 ? '' : 's'} at ${shipment.portOfArrival || shipment.destinationCountry}.`,
        linked_module: 'Shipments',
        linked_record_id: shipment.shipmentId,
        resolved: false,
        created_at: shipment.createdAt,
      });
    }
    if (days !== null && days < 0 && shipment.status !== 'Delivered') {
      alerts.push({
        id: `overdue-${shipment.shipmentId}`,
        alert_type: 'Shipment Overdue',
        severity: 'Critical',
        title: `Shipment ${shipment.shipmentId} is overdue`,
        message: `${shipment.shippingCompany || 'Carrier'} missed ETA by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}.`,
        linked_module: 'Shipments',
        linked_record_id: shipment.shipmentId,
        resolved: false,
        created_at: shipment.createdAt,
      });
    }
    if (numberValue(shipment.freightCost) > 500000) {
      alerts.push({
        id: `freight-${shipment.shipmentId}`,
        alert_type: 'High Freight Cost',
        severity: 'Medium',
        title: `High freight cost on ${shipment.shipmentId}`,
        message: `${money.format(shipment.freightCost)} freight cost needs finance review.`,
        linked_module: 'Shipments',
        linked_record_id: shipment.shipmentId,
        resolved: false,
        created_at: shipment.createdAt,
      });
    }
  });

  orders.forEach((order) => {
    const latestEvent = [...(orderTimelines[order.id] || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const referenceDate = latestEvent?.createdAt || order.orderDate;
    const daysStuck = Math.floor((new Date() - new Date(referenceDate)) / 86400000);
    if (order.status !== 'Completed' && daysStuck > 7) {
      alerts.push({
        id: `stuck-${order.id}`,
        alert_type: 'Order Stalled',
        severity: daysStuck > 14 ? 'High' : 'Medium',
        title: `Order ${order.orderNumber} is stuck`,
        message: `${order.customerName} has been in ${order.status} for ${daysStuck} days.`,
        linked_module: 'Orders',
        linked_record_id: order.id,
        resolved: false,
        created_at: referenceDate,
      });
    }
    if (profitMargin(order) < 0) {
      alerts.push({
        id: `negative-margin-${order.id}`,
        alert_type: 'Negative Profit Margin',
        severity: 'Critical',
        title: `Negative margin on order ${order.orderNumber}`,
        message: `Selling price is below purchase cost.`,
        linked_module: 'Orders',
        linked_record_id: order.id,
        resolved: false,
        created_at: order.createdAt,
      });
    } else if (profitMargin(order) > 0 && profitMargin(order) < 8) {
      alerts.push({
        id: `low-margin-${order.id}`,
        alert_type: 'Low Profit Margin',
        severity: 'Low',
        title: `Low margin on order ${order.orderNumber}`,
        message: `Profit margin is ${profitMargin(order).toFixed(1)}%.`,
        linked_module: 'Orders',
        linked_record_id: order.id,
        resolved: false,
        created_at: order.createdAt,
      });
    }
  });

  vehicles.filter((vehicle) => numberValue(vehicle.quantity) <= 1).forEach((vehicle) => {
    alerts.push({
      id: `low-stock-${vehicle.id}`,
      alert_type: 'Low Inventory',
      severity: numberValue(vehicle.quantity) === 0 ? 'High' : 'Medium',
      title: `Low stock: ${vehicle.brand} ${vehicle.model}`,
      message: `${vehicle.quantity} unit${vehicle.quantity === 1 ? '' : 's'} left at ${vehicle.locationName}.`,
      linked_module: 'Inventory',
      linked_record_id: vehicle.id,
      resolved: false,
      created_at: vehicle.createdAt,
    });
  });

  customers.filter((customer) => !customer.phone || !customer.email).forEach((customer) => {
    alerts.push({
      id: `missing-customer-${customer.id}`,
      alert_type: 'Missing Customer Info',
      severity: 'Low',
      title: `Missing details for ${customer.name}`,
      message: `Add ${!customer.phone ? 'phone' : ''}${!customer.phone && !customer.email ? ' and ' : ''}${!customer.email ? 'email' : ''}.`,
      linked_module: 'Customers',
      linked_record_id: customer.id,
      resolved: false,
      created_at: customer.createdAt,
    });
  });

  return alerts.sort((a, b) => {
    const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return rank[b.severity] - rank[a.severity];
  });
}

function buildGlobalResults({ vehicles, orders, customers, shipments }, query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const toResult = (module, title, subtitle, page) => ({ module, title, subtitle, page });
  return [
    ...vehicles.map((item) => toResult('Vehicle', `${item.brand} ${item.model}`, `${item.id} - ${item.status}`, 'Inventory')),
    ...orders.map((item) => toResult('Order', `Order ${item.orderNumber}`, `${item.customerName} - ${item.status}`, 'Orders')),
    ...customers.map((item) => toResult('Customer', item.name, `${item.email || 'No email'} - ${item.location || 'No city'}`, 'Customers')),
    ...shipments.map((item) => toResult('Shipment', item.shipmentId, `${item.destinationCountry} - ${item.status}`, 'Shipments')),
    toResult('Report', 'Business reports', 'Exports, profit, freight, inventory value', 'Reports'),
    toResult('Audit', 'Audit logs', 'Operational record feed', 'Audit Logs'),
  ].filter((result) => `${result.module} ${result.title} ${result.subtitle}`.toLowerCase().includes(q)).slice(0, 8);
}

function buildAuditLogs({ orders, shipments, customers, vehicles }) {
  return [
    ...orders.map((order) => ({ label: `Order ${order.orderNumber} is ${order.status}`, meta: order.customerName, time: order.createdAt })),
    ...shipments.map((shipment) => ({ label: `Shipment ${shipment.shipmentId} is ${shipment.status}`, meta: shipment.destinationCountry, time: shipment.createdAt })),
    ...customers.map((customer) => ({ label: `Customer record: ${customer.name}`, meta: customer.location, time: customer.createdAt })),
    ...vehicles.map((vehicle) => ({ label: `Inventory record: ${vehicle.brand} ${vehicle.model}`, meta: vehicle.status, time: vehicle.createdAt })),
  ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
}

function nextOrderNumber(orders) {
  const max = orders.reduce((highest, order) => {
    const value = Number.parseInt(order.orderNumber, 10);
    return Number.isNaN(value) ? highest : Math.max(highest, value);
  }, 0);
  return String(max + 1).padStart(4, '0');
}

function inDateRange(value, startDate, endDate) {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  if (startDate && date < new Date(startDate)) return false;
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (date > end) return false;
  }
  return true;
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportCsv(report) {
  const rows = [report.columns.map((column) => column.label)];
  report.rows.forEach((row) => {
    rows.push(report.columns.map((column) => row[column.key]));
  });
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  downloadFile(`${report.slug}.csv`, csv, 'text/csv;charset=utf-8');
}

function exportPdf(report, totals) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const generatedAt = new Date().toLocaleString();

  doc.setFillColor(18, 25, 36);
  doc.rect(0, 0, 297, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Velora Motors Tracker', 14, 12);
  doc.setFontSize(10);
  doc.text(report.title, 14, 20);
  doc.text(`Generated: ${generatedAt}`, 220, 20);

  doc.setTextColor(24, 32, 43);
  doc.setFontSize(11);
  const summary = [
    `Revenue: ${money.format(totals.revenue)}`,
    `Profit: ${money.format(totals.profit)}`,
    `Freight: ${money.format(totals.freightCost)}`,
    `Inventory Value: ${money.format(totals.inventoryValue)}`,
  ];
  doc.text(summary.join('   |   '), 14, 38);

  autoTable(doc, {
    startY: 46,
    head: [report.columns.map((column) => column.label)],
    body: report.rows.map((row) => report.columns.map((column) => row[column.key] ?? '')),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [18, 25, 36], textColor: 255 },
  });

  doc.save(`${report.slug}.pdf`);
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
    locationName: row.location_name || 'Seoul HQ',
    department: row.department || 'Inventory',
    createdAt: row.created_at,
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
    location_name: vehicle.locationName,
    department: vehicle.department,
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromOrderRow(row) {
  return {
    id: row.id,
    orderNumber: row.order_number || row.id,
    customerName: row.customer_name,
    vehicle: row.vehicle,
    quantity: row.quantity,
    orderDate: row.order_date,
    purchaseCost: Number(row.purchase_cost),
    sellingPrice: Number(row.selling_price),
    status: row.status,
    locationName: row.location_name || 'Seoul HQ',
    department: row.department || 'Sales',
    createdAt: row.created_at,
  };
}

function toOrderRow(order, userId) {
  const row = {
    order_number: order.orderNumber,
    customer_name: order.customerName,
    vehicle: order.vehicle,
    quantity: numberValue(order.quantity),
    order_date: order.orderDate,
    purchase_cost: numberValue(order.purchaseCost),
    selling_price: numberValue(order.sellingPrice),
    status: order.status,
    location_name: order.locationName,
    department: order.department,
    ...(userId ? { created_by: userId } : {}),
  };
  delete row.id;
  return row;
}

function fromTimelineRow(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    status: row.status,
    note: row.note || '',
    createdAt: row.created_at,
  };
}

function toTimelineRow(event, userId) {
  return {
    order_id: event.orderId,
    status: event.status,
    note: event.note,
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
    department: row.department || 'Sales',
    createdAt: row.created_at,
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
    department: customer.department,
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
    locationName: row.location_name || 'Port Operations Office',
    department: row.department || 'Logistics',
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
    location_name: shipment.locationName,
    department: shipment.department,
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

function useTheme() {
  const [theme, setTheme] = useState(() => window.localStorage.getItem('velora-theme') || 'dark');

  useEffect(() => {
    window.localStorage.setItem('velora-theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return [theme, setTheme];
}

function useSupabaseRecords(user) {
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderTimelines, setOrderTimelines] = useState({});
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
      setOrderTimelines({});
      setCustomers([]);
      setShipments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [vehicleRows, orderRows, customerRows, shipmentRows, timelineRows] = await Promise.all([
        runRequest(supabase.from('vehicles').select('*').eq('created_by', user.id).order('created_at', { ascending: false })),
        runRequest(supabase.from('orders').select('*').eq('created_by', user.id).order('created_at', { ascending: false })),
        runRequest(supabase.from('customers').select('*').eq('created_by', user.id).order('created_at', { ascending: false })),
        runRequest(supabase.from('shipments').select('*').eq('created_by', user.id).order('created_at', { ascending: false })),
        runRequest(supabase.from('order_timeline_events').select('*').eq('created_by', user.id).order('created_at', { ascending: true })),
      ]);

      setVehicles(vehicleRows.map(fromVehicleRow));
      setOrders(orderRows.map(fromOrderRow));
      setCustomers(customerRows.map(fromCustomerRow));
      setShipments(shipmentRows.map(fromShipmentRow));
      setOrderTimelines(groupTimelineRows(timelineRows.map(fromTimelineRow)));
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
    const orderToSave = {
      ...order,
      orderNumber: order.orderNumber || nextOrderNumber(orders),
    };
    const query = editingId
      ? supabase.from('orders').update(toOrderRow(orderToSave)).eq('id', editingId).eq('created_by', user.id).select().single()
      : supabase.from('orders').insert(toOrderRow(orderToSave, user.id)).select().single();
    const saved = fromOrderRow(await runRequest(query));
    setOrders((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);

    if (!editingId) {
      await addOrderTimelineEvent(saved.id, saved.status, 'Order created.');
    }
  }

  async function deleteOrder(id) {
    await runRequest(supabase.from('orders').delete().eq('id', id).eq('created_by', user.id));
    setOrders((current) => current.filter((item) => item.id !== id));
  }

  async function updateOrderStatus(id, status) {
    const saved = fromOrderRow(await runRequest(supabase.from('orders').update({ status }).eq('id', id).eq('created_by', user.id).select().single()));
    setOrders((current) => current.map((item) => item.id === id ? saved : item));
    await addOrderTimelineEvent(id, status, `Status changed to ${status}.`);
  }

  async function addOrderTimelineEvent(orderId, status, note) {
    const saved = fromTimelineRow(await runRequest(
      supabase
        .from('order_timeline_events')
        .insert(toTimelineRow({ orderId, status, note }, user.id))
        .select()
        .single()
    ));

    setOrderTimelines((current) => ({
      ...current,
      [orderId]: [...(current[orderId] || []), saved],
    }));
  }

  async function addOrderTimelineNote(orderId, note) {
    const order = orders.find((item) => item.id === orderId);
    await addOrderTimelineEvent(orderId, order?.status || 'Inquiry', note);
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
    orderTimelines,
    customers,
    shipments,
    loading,
    error,
    saveVehicle,
    deleteVehicle,
    saveOrder,
    deleteOrder,
    updateOrderStatus,
    addOrderTimelineNote,
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

function Metric({ label, value, tone, icon: Icon = Activity }) {
  return (
    <article className={`metric ${tone || ''}`}>
      <div className="metric-icon"><Icon size={18} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function EmptyState({ label, icon: Icon = Search }) {
  return (
    <div className="empty-state">
      <Icon size={30} />
      <strong>{label}</strong>
      <span>Try adjusting filters or add a new record to keep operations moving.</span>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="section-heading page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function TableFooter({ count }) {
  return (
    <div className="table-footer">
      <span>Showing {count} record{count === 1 ? '' : 's'}</span>
      <div className="pagination">
        <button disabled>Previous</button>
        <strong>1</strong>
        <button disabled>Next</button>
      </div>
    </div>
  );
}

function AlertBadge({ severity }) {
  return <span className={`alert-severity severity-${severity.toLowerCase()}`}>{severity}</span>;
}

function SystemHealthPanel({ vehicles, orders, customers, shipments, error, authError }) {
  const totalRecords = vehicles.length + orders.length + customers.length + shipments.length;
  const lastActivity = buildAuditLogs({ vehicles, orders, customers, shipments })[0]?.time;
  const hasError = Boolean(error || authError);
  const checks = [
    { label: 'Database Status', value: hasError ? 'Attention' : 'Connected', tone: hasError ? 'danger' : 'success' },
    { label: 'Authentication Status', value: authError ? 'Check setup' : 'Active', tone: authError ? 'danger' : 'success' },
    { label: 'Total Records', value: formatIndianNumber(totalRecords), tone: 'info' },
    { label: 'Last Activity', value: lastActivity ? new Date(lastActivity).toLocaleString() : 'No activity yet', tone: 'info' },
    { label: 'System Uptime', value: 'Operational', tone: 'success' },
    { label: 'Recent Errors', value: error || authError || 'None', tone: hasError ? 'danger' : 'success' },
  ];

  return (
    <section className="chart-card health-panel">
      <div className="card-heading">
        <div>
          <p className="eyebrow">System health</p>
          <h2>Platform status</h2>
        </div>
        <Gauge size={20} />
      </div>
      <div className="health-grid">
        {checks.map((item) => (
          <div className={`health-card ${item.tone}`} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function DepartmentShortcuts({ setActivePage, alerts, totals }) {
  const cards = [
    { name: 'Sales', page: 'Orders', icon: ClipboardList, text: 'Orders and customer movement', stat: totals.activeOrders, statLabel: 'active orders' },
    { name: 'Inventory', page: 'Inventory', icon: Warehouse, text: 'Vehicle stock and value', stat: formatIndianNumber(totals.inventory), statLabel: 'units in stock' },
    { name: 'Logistics', page: 'Shipments', icon: Truck, text: 'Freight and delivery workflow', stat: totals.activeShipments, statLabel: 'active shipments' },
    { name: 'Finance', page: 'Reports', icon: BarChart3, text: 'Revenue, profit, and exports', stat: money.format(totals.profit), statLabel: 'total profit' },
    { name: 'Management', page: 'Audit Logs', icon: ShieldCheck, text: 'Activity and control view', stat: alerts.length, statLabel: 'open alerts' },
  ];

  return (
    <section className="chart-card wide department-panel">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Departments</p>
          <h2>Operational shortcuts</h2>
        </div>
      </div>
      <div className="department-grid">
        {cards.map(({ name, page, icon: Icon, text, stat, statLabel }) => (
          <button className="department-card" key={name} onClick={() => setActivePage(page)}>
            <span><Icon size={18} /></span>
            <strong>{name}</strong>
            <small>{text}</small>
            <div className="department-stat">
              <b>{stat}</b>
              <em>{statLabel}</em>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function GlobalSearch({ data, setActivePage }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => buildGlobalResults(data, query), [data, query]);

  return (
    <div className="global-search">
      <Search size={16} />
      <input placeholder="Search vehicles, orders, customers, shipments..." value={query} onChange={(event) => setQuery(event.target.value)} />
      <kbd>Ctrl K</kbd>
      {results.length > 0 && (
        <div className="search-popover">
          {results.map((result) => (
            <button key={`${result.module}-${result.title}`} onClick={() => { setActivePage(result.page); setQuery(''); }}>
              <span>{result.module}</span>
              <strong>{result.title}</strong>
              <small>{result.subtitle}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CommandPalette({ open, onClose, setActivePage }) {
  const actions = [
    { label: 'Add Vehicle', page: 'Inventory', icon: Boxes },
    { label: 'Add Customer', page: 'Customers', icon: Users },
    { label: 'Create Order', page: 'Orders', icon: ClipboardList },
    { label: 'Create Shipment', page: 'Shipments', icon: Truck },
    { label: 'Open Reports', page: 'Reports', icon: FileText },
    { label: 'Open Audit Logs', page: 'Audit Logs', icon: ShieldCheck },
    { label: 'Open Command Center', page: 'Command Center', icon: LayoutDashboard },
  ];

  if (!open) return null;

  return (
    <div className="command-backdrop" onClick={onClose}>
      <section className="command-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="card-heading">
          <div>
            <p className="eyebrow">Command palette</p>
            <h2>Quick actions</h2>
          </div>
          <kbd>Esc</kbd>
        </div>
        <div className="command-list">
          {actions.map(({ label, page, icon: Icon }) => (
            <button key={label} onClick={() => { setActivePage(page); onClose(); }}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
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
      <Field label="Location">
        <select value={value.locationName} onChange={(e) => onChange({ ...value, locationName: e.target.value })}>
          {locationOptions.map((location) => <option key={location}>{location}</option>)}
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
      <Field label="Order Number">
        <input value={value.orderNumber} onChange={(e) => onChange({ ...value, orderNumber: e.target.value })} placeholder="Auto, e.g. 0001" />
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
      <Field label="Location">
        <select value={value.locationName} onChange={(e) => onChange({ ...value, locationName: e.target.value })}>
          {locationOptions.map((location) => <option key={location}>{location}</option>)}
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
      <Field label="Department">
        <select value={value.department} onChange={(e) => onChange({ ...value, department: e.target.value })}>
          {departments.map((department) => <option key={department}>{department}</option>)}
        </select>
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
      <Field label="Linked Order">
        <select value={value.linkedOrderId} onChange={(e) => applyLinkedOrder(e.target.value)}>
          <option value="">Select order</option>
          {orderOptions.map((order) => (
            <option key={order.id} value={order.id}>{order.orderNumber || order.id} - {order.customerName}</option>
          ))}
        </select>
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
      <Field label="Location">
        <select value={value.locationName} onChange={(e) => onChange({ ...value, locationName: e.target.value })}>
          {locationOptions.map((location) => <option key={location}>{location}</option>)}
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

function Dashboard({ vehicles, orders, customers, shipments, orderTimelines, setActivePage, error, authError }) {
  const totals = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== 'Completed').length;
    const completedOrders = orders.filter((order) => order.status === 'Completed').length;
    return {
      inventory: vehicles.reduce((sum, vehicle) => sum + numberValue(vehicle.quantity), 0),
      activeOrders,
      completedOrders,
      pendingOrders: activeOrders,
      delayedOrders: delayedOrderCount(orders),
      revenue: orders.reduce((sum, order) => sum + orderRevenue(order), 0),
      profit: orders.reduce((sum, order) => sum + orderProfit(order), 0),
      shipments: shipments.length,
      activeShipments: shipments.filter((shipment) => shipment.status !== 'Delivered').length,
      deliveredShipments: shipments.filter((shipment) => shipment.status === 'Delivered').length,
      freightCost: shipments.reduce((sum, shipment) => sum + numberValue(shipment.freightCost), 0),
      inventoryValue: vehicles.reduce((sum, vehicle) => sum + numberValue(vehicle.purchasePrice) * numberValue(vehicle.quantity), 0),
    };
  }, [vehicles, orders, shipments]);

  const recentOrders = orders.slice(0, 4);
  const revenueTrend = trendByMonth(orders, 'orderDate', orderRevenue);
  const profitTrend = trendByMonth(orders, 'orderDate', orderProfit);
  const shipmentBreakdown = countByStatus(shipments);
  const alerts = useMemo(() => createAlerts({ vehicles, orders, customers, shipments, orderTimelines }), [vehicles, orders, customers, shipments, orderTimelines]);
  const auditLogs = useMemo(() => buildAuditLogs({ vehicles, orders, customers, shipments }).slice(0, 5), [vehicles, orders, customers, shipments]);
  const recentActivity = [
    ...orders.slice(0, 3).map((order) => ({ label: `Order ${order.orderNumber} moved to ${order.status}`, meta: order.customerName })),
    ...shipments.slice(0, 3).map((shipment) => ({ label: `Shipment ${shipment.shipmentId} is ${shipment.status}`, meta: shipment.destinationCountry })),
  ].slice(0, 5);

  return (
    <section className="page-stack">
      <div className="hero premium-hero">
        <div>
          <p className="eyebrow">Velora Motors Ltd.</p>
          <h1>Operations Command Center</h1>
          <p>Enterprise dealership operations, order workflow, freight visibility, critical alerts, and financial performance in one secure workspace.</p>
        </div>
      </div>
      <div className="metrics-grid enterprise-metrics">
        <Metric label="Revenue" value={money.format(totals.revenue)} tone="accent" icon={BarChart3} />
        <Metric label="Profit" value={money.format(totals.profit)} tone="success" icon={Activity} />
        <Metric label="Inventory value" value={money.format(totals.inventoryValue)} icon={Boxes} />
        <Metric label="Active orders" value={totals.activeOrders} icon={ClipboardList} />
        <Metric label="Active shipments" value={totals.activeShipments} icon={Truck} />
        <Metric label="Delivered orders" value={totals.completedOrders} tone="success" icon={PackageCheck} />
        <Metric label="Delivered shipments" value={totals.deliveredShipments} tone="success" icon={Truck} />
        <Metric label="Freight cost" value={money.format(totals.freightCost)} tone="danger" icon={Gauge} />
      </div>
      <div className="dashboard-grid">
        <section className="chart-card wide">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Revenue trend</p>
              <h2>Monthly revenue</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="month" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />
              <Tooltip formatter={(value) => money.format(value)} contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#revenue)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </section>
        <section className="chart-card wide">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Profit trend</p>
              <h2>Monthly profit</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={profitTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="month" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />
              <Tooltip formatter={(value) => money.format(value)} contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#22c55e" fill="#22c55e33" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </section>
        <section className="chart-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Shipments</p>
              <h2>Status breakdown</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={shipmentBreakdown} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={4}>
                {shipmentBreakdown.map((entry, index) => (
                  <Cell key={entry.name} fill={['#3b82f6', '#22c55e', '#f59e0b', '#38bdf8', '#ef4444'][index % 5]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </section>
        <section className="chart-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Critical alerts</p>
              <h2>Priority watchlist</h2>
            </div>
            <button className="mini" onClick={() => setActivePage('Alerts Center')}>View all</button>
          </div>
          <div className="alert-list compact">
            {alerts.slice(0, 4).map((alert) => (
              <div className="alert-row" key={alert.id}>
                <AlertBadge severity={alert.severity} />
                <div>
                  <strong>{alert.title}</strong>
                  <small>{alert.message}</small>
                </div>
              </div>
            ))}
            {!alerts.length && <EmptyState label="No critical alerts right now." icon={Bell} />}
          </div>
        </section>
        <section className="activity-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h2>Operations pulse</h2>
            </div>
          </div>
          <div className="activity-list">
            {recentActivity.map((item, index) => (
              <div className="activity-item" key={`${item.label}-${index}`}>
                <span><Activity size={16} /></span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.meta}</small>
                </div>
              </div>
            ))}
            {!recentActivity.length && <EmptyState label="No recent activity yet." icon={Activity} />}
          </div>
        </section>
        <section className="activity-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Recent audit logs</p>
              <h2>Governance feed</h2>
            </div>
            <button className="mini" onClick={() => setActivePage('Audit Logs')}>Open logs</button>
          </div>
          <div className="activity-list">
            {auditLogs.map((item, index) => (
              <div className="activity-item" key={`${item.label}-${index}`}>
                <span><ShieldCheck size={16} /></span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.meta || 'Velora record'}</small>
                </div>
              </div>
            ))}
            {!auditLogs.length && <EmptyState label="No audit logs yet." icon={ShieldCheck} />}
          </div>
        </section>
        <DepartmentShortcuts setActivePage={setActivePage} alerts={alerts} totals={totals} />
        <SystemHealthPanel vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} error={error} authError={authError} />
      </div>
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">Live pipeline</p>
          <h2>Recent orders</h2>
        </div>
      </div>
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Order Number</th>
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
                <td>{order.orderNumber}</td>
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
  const [locationFilter, setLocationFilter] = useState('All');
  const [form, setForm] = useState(blankVehicle);
  const [editingId, setEditingId] = useState('');
  const filtered = vehicles.filter((vehicle) => {
    const locationMatches = locationFilter === 'All' || vehicle.locationName === locationFilter;
    return locationMatches && matchesSearch(vehicle, query);
  });

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
      <PageHeader eyebrow="Inventory" title="Vehicle stock" description="Track available, reserved, and sold vehicles across Velora locations.">
        <div className="toolbar">
          <input className="search" placeholder="Search vehicles" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
            <option>All</option>
            {locationOptions.map((location) => <option key={location}>{location}</option>)}
          </select>
        </div>
      </PageHeader>
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
        <TableFooter count={filtered.length} />
      </div>
    </section>
  );
}

function Orders({ orders, saveOrder, deleteOrder, updateOrderStatus, vehicles, orderTimelines, addOrderTimelineNote }) {
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [form, setForm] = useState(blankOrder);
  const [editingId, setEditingId] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState('');
  const filtered = orders.filter((order) => {
    const locationMatches = locationFilter === 'All' || order.locationName === locationFilter;
    return locationMatches && matchesSearch(order, query);
  });

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
      <PageHeader eyebrow="Orders" title="Customer orders" description="Manage customer demand, pricing, workflow status, and order timelines.">
        <div className="toolbar">
          <input className="search" placeholder="Search orders" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
            <option>All</option>
            {locationOptions.map((location) => <option key={location}>{location}</option>)}
          </select>
        </div>
      </PageHeader>
      <OrderForm value={form} onChange={setForm} onSubmit={submitOrder} editingId={editingId} vehicleOptions={vehicles} onCancel={() => { setForm(blankOrder); setEditingId(''); }} />
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Order Number</th>
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
              <React.Fragment key={order.id}>
                <tr>
                  <td>{order.orderNumber}</td>
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
                    <button className="mini" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? '' : order.id)}>
                      {expandedOrderId === order.id ? 'Hide timeline' : 'Timeline'}
                    </button>
                    <button className="mini" onClick={() => { setForm(order); setEditingId(order.id); }}>Edit</button>
                    <button className="mini danger" onClick={() => deleteOrder(order.id)}>Delete</button>
                  </td>
                </tr>
                {expandedOrderId === order.id && (
                  <tr className="timeline-row">
                    <td colSpan="11">
                      <OrderTimeline order={order} events={orderTimelines[order.id] || []} addOrderTimelineNote={addOrderTimelineNote} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No orders found." />}
        <TableFooter count={filtered.length} />
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
      <PageHeader eyebrow="Customers" title="Customer records" description="Maintain clean buyer contact details, notes, and commercial context." />
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
        <TableFooter count={customers.length} />
      </div>
    </section>
  );
}

function Shipments({ shipments, saveShipment, deleteShipment, orders }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [form, setForm] = useState(blankShipment);
  const [editingId, setEditingId] = useState('');
  const filtered = shipments.filter((shipment) => {
    const statusMatches = statusFilter === 'All' || shipment.status === statusFilter;
    const locationMatches = locationFilter === 'All' || shipment.locationName === locationFilter;
    return statusMatches && locationMatches && matchesSearch(shipment, query);
  });
  const orderNumberById = useMemo(() => {
    return orders.reduce((lookup, order) => ({ ...lookup, [order.id]: order.orderNumber || order.id }), {});
  }, [orders]);

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
      <PageHeader eyebrow="Shipments" title="Shipment tracking" description="Monitor freight movement, ports, carriers, ETA, and delivery progress.">
        <div className="toolbar">
          <input className="search" placeholder="Search shipments" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            {shipmentStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
            <option>All</option>
            {locationOptions.map((location) => <option key={location}>{location}</option>)}
          </select>
        </div>
      </PageHeader>
      <ShipmentForm value={form} onChange={setForm} onSubmit={submitShipment} editingId={editingId} orderOptions={orders} onCancel={() => { setForm(blankShipment); setEditingId(''); }} />
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Shipment ID</th>
              <th>Order Number</th>
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
                <td>{orderNumberById[shipment.linkedOrderId] || shipment.linkedOrderId}</td>
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
        <TableFooter count={filtered.length} />
      </div>
    </section>
  );
}

function OrderTimeline({ order, events, addOrderTimelineNote }) {
  const [note, setNote] = useState('');

  async function submitNote(event) {
    event.preventDefault();
    if (!note.trim()) return;
    await addOrderTimelineNote(order.id, note.trim());
    setNote('');
  }

  return (
    <div className="timeline-panel">
      <div className="timeline-track">
        {orderStatuses.map((status) => {
          const event = events.find((item) => item.status === status);
          const isCurrent = order.status === status;
          return (
            <div key={status} className={`timeline-step ${event ? 'complete' : ''} ${isCurrent ? 'current' : ''}`}>
              <span className="timeline-dot" />
              <div>
                <strong>{status}</strong>
                {event ? (
                  <>
                    <small>{new Date(event.createdAt).toLocaleString()}</small>
                    {event.note && <p>{event.note}</p>}
                  </>
                ) : (
                  <small>Pending</small>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <form className="timeline-note-form" onSubmit={submitNote}>
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add timeline note" />
        <button type="submit">Add note</button>
      </form>
    </div>
  );
}

function Reports({ vehicles, orders, customers, shipments }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const filteredOrders = orders.filter((order) => inDateRange(order.orderDate, startDate, endDate));
  const filteredShipments = shipments.filter((shipment) => inDateRange(shipment.eta || shipment.createdAt, startDate, endDate));
  const filteredCustomers = customers.filter((customer) => inDateRange(customer.createdAt, startDate, endDate));
  const filteredVehicles = vehicles.filter((vehicle) => inDateRange(vehicle.createdAt, startDate, endDate));
  const orderNumberById = useMemo(() => {
    return orders.reduce((lookup, order) => ({ ...lookup, [order.id]: order.orderNumber || order.id }), {});
  }, [orders]);

  const totals = {
    revenue: filteredOrders.reduce((sum, order) => sum + orderRevenue(order), 0),
    profit: filteredOrders.reduce((sum, order) => sum + orderProfit(order), 0),
    freightCost: filteredShipments.reduce((sum, shipment) => sum + numberValue(shipment.freightCost), 0),
    inventoryValue: filteredVehicles.reduce((sum, vehicle) => sum + numberValue(vehicle.purchasePrice) * numberValue(vehicle.quantity), 0),
  };

  const reports = [
    {
      title: 'Inventory Report',
      slug: 'velora-inventory-report',
      summary: `${filteredVehicles.length} vehicles, ${filteredVehicles.reduce((sum, vehicle) => sum + numberValue(vehicle.quantity), 0)} units`,
      columns: [
        { key: 'id', label: 'Vehicle ID' },
        { key: 'brand', label: 'Brand' },
        { key: 'model', label: 'Model' },
        { key: 'category', label: 'Category' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'purchasePrice', label: 'Purchase Price' },
        { key: 'sellingPrice', label: 'Selling Price' },
        { key: 'status', label: 'Status' },
      ],
      rows: filteredVehicles.map((vehicle) => ({
        ...vehicle,
        purchasePrice: money.format(vehicle.purchasePrice),
        sellingPrice: money.format(vehicle.sellingPrice),
      })),
    },
    {
      title: 'Orders Report',
      slug: 'velora-orders-report',
      summary: `${filteredOrders.length} orders, ${money.format(totals.revenue)} revenue`,
      columns: [
        { key: 'orderNumber', label: 'Order Number' },
        { key: 'customerName', label: 'Customer' },
        { key: 'vehicle', label: 'Vehicle' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'orderDate', label: 'Order Date' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'profit', label: 'Profit' },
        { key: 'status', label: 'Status' },
      ],
      rows: filteredOrders.map((order) => ({
        ...order,
        revenue: money.format(orderRevenue(order)),
        profit: money.format(orderProfit(order)),
      })),
    },
    {
      title: 'Customers Report',
      slug: 'velora-customers-report',
      summary: `${filteredCustomers.length} customers`,
      columns: [
        { key: 'name', label: 'Customer' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'location', label: 'Country / City' },
        { key: 'notes', label: 'Notes' },
      ],
      rows: filteredCustomers,
    },
    {
      title: 'Shipments Report',
      slug: 'velora-shipments-report',
      summary: `${filteredShipments.length} shipments, ${money.format(totals.freightCost)} freight`,
      columns: [
        { key: 'shipmentId', label: 'Shipment ID' },
        { key: 'linkedOrderNumber', label: 'Order Number' },
        { key: 'customerName', label: 'Customer' },
        { key: 'vehicle', label: 'Vehicle' },
        { key: 'destinationCountry', label: 'Destination' },
        { key: 'freightCost', label: 'Freight Cost' },
        { key: 'eta', label: 'ETA' },
        { key: 'status', label: 'Status' },
      ],
      rows: filteredShipments.map((shipment) => ({
        ...shipment,
        linkedOrderNumber: orderNumberById[shipment.linkedOrderId] || shipment.linkedOrderId,
        freightCost: money.format(shipment.freightCost),
      })),
    },
    {
      title: 'Profit Summary Report',
      slug: 'velora-profit-summary-report',
      summary: `${money.format(totals.profit)} profit`,
      columns: [
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' },
      ],
      rows: [
        { metric: 'Total Revenue', value: money.format(totals.revenue) },
        { metric: 'Total Profit', value: money.format(totals.profit) },
        { metric: 'Total Freight Cost', value: money.format(totals.freightCost) },
        { metric: 'Inventory Value', value: money.format(totals.inventoryValue) },
      ],
    },
  ];

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Reports" title="Business reports" description="Export operational summaries with revenue, profit, freight, and inventory totals.">
        <div className="toolbar">
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
      </PageHeader>
      <div className="metrics-grid reports-summary">
        <Metric label="Revenue" value={money.format(totals.revenue)} tone="accent" />
        <Metric label="Profit" value={money.format(totals.profit)} tone="success" />
        <Metric label="Freight cost" value={money.format(totals.freightCost)} />
        <Metric label="Inventory value" value={money.format(totals.inventoryValue)} />
      </div>
      <div className="report-grid">
        {reports.map((report) => (
          <article className="report-card" key={report.slug}>
            <div>
              <p className="eyebrow">Velora Motors</p>
              <h2>{report.title}</h2>
              <p>{report.summary}</p>
            </div>
            <div className="report-actions">
              <button onClick={() => exportCsv(report)}>Export CSV</button>
              <button onClick={() => exportPdf(report, totals)}>Export PDF</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TimelineOverview({ orders, orderTimelines }) {
  const events = orders.flatMap((order) => (orderTimelines[order.id] || []).map((event) => ({
    ...event,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
  }))).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Workflow" title="Order timeline" description="Review order movement and staff notes across every workflow stage." />
      <div className="timeline-board">
        {events.map((event) => (
          <div className="timeline-event-card" key={event.id}>
            <StatusBadge status={event.status} />
            <div>
              <strong>Order {event.orderNumber}</strong>
              <p>{event.note || `Moved to ${event.status}`}</p>
              <small>{event.customerName} - {new Date(event.createdAt).toLocaleString()}</small>
            </div>
          </div>
        ))}
        {!events.length && <EmptyState label="No workflow activity yet." icon={TimelineIcon} />}
      </div>
    </section>
  );
}

function AlertsCenter({ alerts }) {
  const [severityFilter, setSeverityFilter] = useState('All');
  const [resolvedFilter, setResolvedFilter] = useState('Open');
  const filtered = alerts.filter((alert) => {
    const severityMatches = severityFilter === 'All' || alert.severity === severityFilter;
    const resolvedMatches = resolvedFilter === 'All' || (resolvedFilter === 'Open' ? !alert.resolved : alert.resolved);
    return severityMatches && resolvedMatches;
  });

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Risk operations" title="Alerts Center" description="Spot margin, ETA, stock, freight, and customer data issues before they slow operations.">
        <div className="toolbar">
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
            <option>All</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select value={resolvedFilter} onChange={(event) => setResolvedFilter(event.target.value)}>
            <option>Open</option>
            <option>Resolved</option>
            <option>All</option>
          </select>
        </div>
      </PageHeader>
      <div className="alert-grid">
        {filtered.map((alert) => (
          <article className={`alert-card severity-${alert.severity.toLowerCase()}`} key={alert.id}>
            <div className="card-heading">
              <AlertBadge severity={alert.severity} />
              <span className="status">{alert.linked_module}</span>
            </div>
            <h2>{alert.title}</h2>
            <p>{alert.message}</p>
            <small>{alert.alert_type} - {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Generated now'}</small>
          </article>
        ))}
      </div>
      {!filtered.length && <EmptyState label="No alerts match this view." icon={Bell} />}
    </section>
  );
}

function AuditLogs({ orders, shipments, customers, vehicles }) {
  const logs = buildAuditLogs({ orders, shipments, customers, vehicles });

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Governance" title="Audit logs" description="Trace recent operational changes across orders, shipments, customers, and inventory." />
      <div className="audit-list">
        {logs.map((log, index) => (
          <div className="activity-item audit-item" key={`${log.label}-${index}`}>
            <span><ShieldCheck size={16} /></span>
            <div>
              <strong>{log.label}</strong>
              <small>{log.meta || 'Velora record'} - {log.time ? new Date(log.time).toLocaleString() : 'Recent'}</small>
            </div>
          </div>
        ))}
        {!logs.length && <EmptyState label="No audit activity yet." icon={ShieldCheck} />}
      </div>
    </section>
  );
}

function App() {
  const [activePage, setActivePage] = useState('Command Center');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const { user, authLoading, authError, signOut } = useAuthSession();
  const {
    vehicles,
    orders,
    orderTimelines,
    customers,
    shipments,
    loading,
    error,
    saveVehicle,
    deleteVehicle,
    saveOrder,
    deleteOrder,
    updateOrderStatus,
    addOrderTimelineNote,
    saveCustomer,
    deleteCustomer,
    saveShipment,
    deleteShipment,
  } = useSupabaseRecords(user);
  const alerts = useMemo(() => createAlerts({ vehicles, orders, customers, shipments, orderTimelines }), [vehicles, orders, customers, shipments, orderTimelines]);
  const searchData = useMemo(() => ({ vehicles, orders, customers, shipments }), [vehicles, orders, customers, shipments]);

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === 'Escape') setCommandOpen(false);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (authLoading) {
    return <div className="screen-loader">Checking Velora session...</div>;
  }

  if (!user) {
    return <AuthView authError={authError} />;
  }

  function goToPage(page) {
    setActivePage(page);
    setMobileNavOpen(false);
  }

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileNavOpen ? 'mobile-nav-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand-mark">
          <span>VM</span>
          <div>
            <strong>Velora Motors</strong>
            <small>Enterprise Operations</small>
          </div>
        </div>
        <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation">
          <X size={18} />
        </button>
        <button className="sidebar-toggle" onClick={() => setSidebarCollapsed((value) => !value)} aria-label="Toggle sidebar">
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <button className="quick-action" onClick={() => setCommandOpen(true)}>
          <Plus size={18} />
          <span>Quick action</span>
        </button>
        <div className="user-profile">
          <div className="avatar">{userName(user).slice(0, 1).toUpperCase()}</div>
          <strong>{userName(user)}</strong>
          <small>{user.email}</small>
          <button onClick={signOut}>Sign Out</button>
        </div>
        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <small>{group.label}</small>
              {group.pages.map((page) => {
                const Icon = navIcons[page];
                return (
                  <button key={page} className={activePage === page ? 'active' : ''} onClick={() => goToPage(page)}>
                    <Icon size={18} />
                    <span>{page}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <button className="mobile-scrim" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation overlay" />
      <main>
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div className="page-title">
            <p className="breadcrumb">Velora Motors / {activePage}</p>
            <h1>{activePage}</h1>
          </div>
          <div className="topbar-actions">
            <GlobalSearch data={searchData} setActivePage={setActivePage} />
            <button className="theme-toggle command-button" onClick={() => setCommandOpen(true)}>
              <Command size={17} />
              <span>Commands</span>
            </button>
            <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
        </header>
        {loading && <div className="app-message">Loading Velora records...</div>}
        {error && <div className="app-message error">{error}</div>}
        {activePage === 'Command Center' && <Dashboard vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} orderTimelines={orderTimelines} setActivePage={setActivePage} error={error} authError={authError} />}
        {activePage === 'Inventory' && <Inventory vehicles={vehicles} saveVehicle={saveVehicle} deleteVehicle={deleteVehicle} />}
        {activePage === 'Orders' && <Orders orders={orders} saveOrder={saveOrder} deleteOrder={deleteOrder} updateOrderStatus={updateOrderStatus} vehicles={vehicles} orderTimelines={orderTimelines} addOrderTimelineNote={addOrderTimelineNote} />}
        {activePage === 'Customers' && <Customers customers={customers} saveCustomer={saveCustomer} deleteCustomer={deleteCustomer} />}
        {activePage === 'Shipments' && <Shipments shipments={shipments} saveShipment={saveShipment} deleteShipment={deleteShipment} orders={orders} />}
        {activePage === 'Timeline' && <TimelineOverview orders={orders} orderTimelines={orderTimelines} />}
        {activePage === 'Reports' && <Reports vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} />}
        {activePage === 'Alerts Center' && <AlertsCenter alerts={alerts} />}
        {activePage === 'Audit Logs' && <AuditLogs orders={orders} shipments={shipments} customers={customers} vehicles={vehicles} />}
        <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} setActivePage={setActivePage} />
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
