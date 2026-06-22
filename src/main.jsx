import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Command,
  Download,
  FileText,
  Gauge,
  Laptop,
  LayoutDashboard,
  Menu,
  Moon,
  PackageCheck,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Sun,
  Timeline as TimelineIcon,
  Truck,
  Upload,
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
import { isSupabaseConfigured, supabase, supabaseConfigError } from './supabaseClient';
import AppErrorBoundary from './components/AppErrorBoundary';
import {
  getHealthEvents,
  installGlobalHealthListeners,
  recordHealthEvent,
  subscribeToHealthEvents,
} from './lib/appHealth';
import { buildSearchIndex, searchIndex } from './services/searchService';
import './styles.css';

installGlobalHealthListeners();

function formatIndianNumber(value) {
  const rounded = Math.round(Number(value) || 0);
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded));
  if (digits.length <= 3) return `${sign}${digits}`;
  const lastThree = digits.slice(-3);
  const leading = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${sign}${leading},${lastThree}`;
}

function formatIndianInput(value) {
  const text = String(value ?? '').replace(/,/g, '').replace(/[^\d.]/g, '');
  if (!text) return '';
  const [rawWhole, ...decimalParts] = text.split('.');
  const whole = rawWhole || '0';
  const lastThree = whole.slice(-3);
  const leading = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const formattedWhole = leading ? `${leading},${lastThree}` : lastThree;
  const decimal = decimalParts.length ? `.${decimalParts.join('').slice(0, 2)}` : '';
  return `${formattedWhole}${decimal}`;
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

const blankQuote = {
  quoteId: '',
  customerName: '',
  vehicle: '',
  quantity: 1,
  validUntil: today,
  purchaseCost: 0,
  sellingPrice: 0,
  status: 'Draft',
  notes: '',
  locationName: 'Seoul HQ',
  department: 'Finance',
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

const blankProcurementRequest = {
  procurementId: '',
  vehicleBrand: '',
  vehicleModel: '',
  quantity: 1,
  supplierName: '',
  supplierCountry: '',
  estimatedPurchaseCost: 0,
  estimatedFreightCost: 0,
  requestedBy: '',
  status: 'Requested',
  notes: '',
};

const blankSupplier = {
  supplierName: '',
  country: '',
  contactPerson: '',
  phone: '',
  email: '',
  notes: '',
};

const blankLogisticsPartner = {
  partnerName: '',
  country: '',
  contactPerson: '',
  phone: '',
  email: '',
  serviceType: '',
  notes: '',
};

const vehicleStatuses = ['Available', 'Reserved', 'Sold'];
const orderStatuses = ['Inquiry', 'Confirmed', 'Procurement', 'Inspection', 'Ready', 'Shipped', 'Delivered', 'Completed'];
const quoteStatuses = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];
const shipmentStatuses = ['Preparing', 'At Port', 'Loaded', 'In Transit', 'Customs Clearance', 'Delivered'];
const procurementStatuses = ['Requested', 'Supplier Identified', 'Negotiation', 'Approved', 'Purchased', 'In Transit', 'Arrived', 'Added To Inventory'];
const locationOptions = ['Seoul HQ', 'New City Showroom', 'Port Operations Office', 'Warehouse'];
const departments = ['Sales', 'Inventory', 'Logistics', 'Finance', 'Management'];
const roleOptions = ['CEO', 'Company Manager', 'Logistics Manager', 'Inventory Manager', 'Finance Manager'];
const exclusiveRoles = ['CEO', 'Company Manager'];
const pendingOAuthRoleKey = 'velora-pending-oauth-role';
const pendingAuthErrorKey = 'velora-pending-auth-error';
const pages = ['Command Center', 'Procurement', 'Inventory', 'Orders', 'Quotes', 'Customers', 'Shipments', 'Timeline', 'Reports', 'Alerts Center', 'Audit Logs'];
const navGroups = [
  { label: 'Command', pages: ['Command Center'] },
  { label: 'Operations', pages: ['Procurement', 'Inventory', 'Orders', 'Quotes', 'Customers'] },
  { label: 'Logistics', pages: ['Shipments', 'Timeline'] },
  { label: 'Intelligence', pages: ['Reports', 'Alerts Center'] },
  { label: 'System', pages: ['Audit Logs'] },
];
const navIcons = {
  'Command Center': LayoutDashboard,
  Procurement: ClipboardList,
  Inventory: Boxes,
  Orders: ClipboardList,
  Quotes: FileText,
  Customers: Users,
  Shipments: Truck,
  Timeline: TimelineIcon,
  Reports: FileText,
  'Alerts Center': Bell,
  'Audit Logs': ShieldCheck,
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function numberValue(value) {
  return Number(String(value ?? '').replace(/,/g, '')) || 0;
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
  return numberValue(order.sellingPrice);
}

function orderProfit(order) {
  return numberValue(order.sellingPrice) - numberValue(order.purchaseCost);
}

function procurementValue(request) {
  return (numberValue(request.estimatedPurchaseCost) + numberValue(request.estimatedFreightCost)) * numberValue(request.quantity);
}

function matchesSearch(record, query) {
  const text = Object.values(record).join(' ').toLowerCase();
  return text.includes(query.toLowerCase());
}

function friendlyError(error, fallback = 'Velora could not complete this request.') {
  const message = String(error?.message || error || '').toLowerCase();
  if (!message) return fallback;
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Velora could not reach the server. Check your connection and try again.';
  }
  if (message.includes('jwt') || message.includes('session') || message.includes('token')) {
    return 'Your secure session needs to be refreshed. Sign in again and retry.';
  }
  if (message.includes('permission') || message.includes('row-level security') || message.includes('policy')) {
    return 'Your current role does not have permission to complete this action.';
  }
  if (message.includes('duplicate key') || error?.code === '23505') {
    return 'A record with this identifier already exists. Use a different identifier and try again.';
  }
  if (message.includes('schema cache') || message.includes('does not exist')) {
    return 'A required data service is not available yet. Ask an administrator to verify the Supabase setup.';
  }
  return error?.message || fallback;
}

function useHealthEvents() {
  const [events, setEvents] = useState(() => getHealthEvents());

  useEffect(() => subscribeToHealthEvents(setEvents), []);
  return events;
}

const ConfirmContext = createContext(null);

function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (!request) return undefined;
    window.requestAnimationFrame(() => confirmButtonRef.current?.focus());
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        request.resolve(false);
        setRequest(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [request]);

  function confirm(options) {
    return new Promise((resolve) => {
      setRequest({
        title: options.title || 'Confirm action',
        message: options.message || 'Please confirm that you want to continue.',
        confirmLabel: options.confirmLabel || 'Confirm',
        danger: options.danger !== false,
        resolve,
      });
    });
  }

  function close(result) {
    request?.resolve(result);
    setRequest(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <div className="confirm-backdrop" role="presentation" onMouseDown={() => close(false)}>
          <section
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className={request.danger ? 'danger' : ''}><AlertTriangle size={22} /></span>
            <div>
              <p className="eyebrow">Protected action</p>
              <h2 id="confirm-title">{request.title}</h2>
              <p>{request.message}</p>
            </div>
            <div className="confirm-actions">
              <button className="secondary" onClick={() => close(false)}>Cancel</button>
              <button ref={confirmButtonRef} className={request.danger ? 'danger-button' : ''} onClick={() => close(true)}>
                {request.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

function useConfirm() {
  return useContext(ConfirmContext);
}

function groupTimelineRows(events) {
  return events.reduce((groups, event) => {
    const key = event.orderId || event.procurementId;
    return {
      ...groups,
      [key]: [...(groups[key] || []), event],
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

function createAlerts({ vehicles, orders, customers, shipments, orderTimelines, procurementRequests = [], suppliers = [] }) {
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

  procurementRequests.forEach((request) => {
    const ageDays = Math.floor((new Date() - new Date(request.createdAt || today)) / 86400000);
    if (request.status !== 'Added To Inventory' && ageDays > 14) {
      alerts.push({
        id: `proc-delay-${request.procurementId}`,
        alert_type: 'Delayed Procurement',
        severity: ageDays > 30 ? 'High' : 'Medium',
        title: `Procurement ${request.procurementId} is delayed`,
        message: `${request.vehicleBrand} ${request.vehicleModel} has been in ${request.status} for ${ageDays} days.`,
        linked_module: 'Procurement',
        linked_record_id: request.procurementId,
        resolved: false,
        created_at: request.createdAt,
      });
    }
    if (procurementValue(request) > 5000000) {
      alerts.push({
        id: `proc-cost-${request.procurementId}`,
        alert_type: 'High Purchase Cost',
        severity: 'Medium',
        title: `High procurement value on ${request.procurementId}`,
        message: `${money.format(procurementValue(request))} estimated acquisition value needs review.`,
        linked_module: 'Procurement',
        linked_record_id: request.procurementId,
        resolved: false,
        created_at: request.createdAt,
      });
    }
  });

  suppliers.filter((supplier) => !supplier.phone && !supplier.email).forEach((supplier) => {
    alerts.push({
      id: `supplier-inactive-${supplier.id || supplier.supplierName}`,
      alert_type: 'Supplier Inactivity',
      severity: 'Low',
      title: `Missing contact for ${supplier.supplierName}`,
      message: 'Add phone or email so procurement follow-up is not blocked.',
      linked_module: 'Procurement',
      linked_record_id: supplier.id,
      resolved: false,
      created_at: supplier.createdAt,
    });
  });

  return alerts.sort((a, b) => {
    const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return rank[b.severity] - rank[a.severity];
  });
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

function nextQuoteId(quotes) {
  return nextDisplayId(quotes, 'quoteId') || 'QT-0001';
}

function nextDisplayId(items, key) {
  const best = items.reduce((currentBest, item) => {
    const text = String(item[key] || '');
    const match = text.match(/^(.*?)(\d+)$/);
    if (!match) return currentBest;
    const value = Number.parseInt(match[2], 10);
    if (Number.isNaN(value) || value < currentBest.value) return currentBest;
    return { prefix: match[1], width: match[2].length, value };
  }, { prefix: '', width: 4, value: 0 });

  return `${best.prefix}${String(best.value + 1).padStart(Math.max(best.width, 4), '0')}`;
}

function nextProcurementId(requests) {
  return nextDisplayId(requests, 'procurementId') || 'PR-0001';
}

function nextCustomerId(customers) {
  const highest = customers.reduce((current, customer) => {
    const match = String(customer.id || '').match(/^CUS-(\d+)$/i);
    return match ? Math.max(current, Number.parseInt(match[1], 10) || 0) : current;
  }, 0);
  return `CUS-${String(highest + 1).padStart(4, '0')}`;
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

function parseCsvLine(line) {
  const cells = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }

  cells.push(cell.trim());
  return cells;
}

function normalizeCsvKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseCsv(text) {
  const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map(normalizeCsvKey);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce((row, header, index) => ({ ...row, [header]: cells[index] ?? '' }), {});
  });
}

function csvValue(row, keys, fallback = '') {
  const variants = Array.isArray(keys) ? keys : [keys];
  for (const key of variants) {
    const normalized = normalizeCsvKey(key);
    if (row[normalized] !== undefined && row[normalized] !== '') return row[normalized];
  }
  return fallback;
}

function normalizeCsvStatus(value, allowed, fallback) {
  const text = String(value || '').trim().toLowerCase();
  return allowed.find((status) => status.toLowerCase() === text) || fallback;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
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

let pdfToolsPromise;

function loadPdfTools() {
  if (!pdfToolsPromise) {
    pdfToolsPromise = Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]).then(([jsPdfModule, autoTableModule]) => ({
      jsPDF: jsPdfModule.default,
      autoTable: autoTableModule.default,
    }));
  }
  return pdfToolsPromise;
}

async function exportPdf(report, totals) {
  const { jsPDF, autoTable } = await loadPdfTools();
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

function cleanFilePart(value) {
  return String(value || 'invoice').replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function invoiceNumber(order) {
  return `INV-${order.orderNumber || order.id}`;
}

function quoteTotal(quote) {
  return numberValue(quote.sellingPrice);
}

function quoteProfit(quote) {
  return numberValue(quote.sellingPrice) - numberValue(quote.purchaseCost);
}

async function generateOrderInvoice(order, customer) {
  const { jsPDF, autoTable } = await loadPdfTools();
  const doc = new jsPDF({ orientation: 'portrait' });
  const generatedAt = new Date().toLocaleString();
  const invoiceNo = invoiceNumber(order);
  const quantity = numberValue(order.quantity);
  const total = orderRevenue(order);
  const unitPrice = quantity ? total / quantity : total;

  doc.setFillColor(10, 17, 31);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('Velora Motors', 14, 15);
  doc.setFontSize(9);
  doc.text('Automotive dealership, exports and logistics operations', 14, 23);
  doc.text('Invoice', 176, 15, { align: 'right' });
  doc.text(invoiceNo, 176, 23, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text('Bill To', 14, 48);
  doc.setFontSize(16);
  doc.text(order.customerName || 'Customer', 14, 57);
  doc.setFontSize(9);
  const buyerLines = [
    customer?.email,
    customer?.phone,
    customer?.location,
  ].filter(Boolean);
  buyerLines.forEach((line, index) => doc.text(line, 14, 65 + index * 6));

  doc.setFontSize(10);
  const meta = [
    ['Invoice Date', generatedAt],
    ['Order Number', order.orderNumber || order.id],
    ['Order Date', order.orderDate || '-'],
    ['Order Status', order.status || '-'],
  ];
  meta.forEach(([label, value], index) => {
    const y = 48 + index * 8;
    doc.setTextColor(100, 116, 139);
    doc.text(label, 128, y);
    doc.setTextColor(15, 23, 42);
    doc.text(String(value), 176, y, { align: 'right' });
  });

  autoTable(doc, {
    startY: 92,
    head: [['Vehicle', 'Quantity', 'Unit Price', 'Line Total']],
    body: [[
      order.vehicle || '-',
      formatIndianNumber(quantity),
      money.format(unitPrice),
      money.format(total),
    ]],
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  const finalY = doc.lastAutoTable.finalY + 14;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(120, finalY, 76, 30, 3, 3, 'F');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(10);
  doc.text('Total Payable', 128, finalY + 11);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.text(money.format(total), 188, finalY + 22, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('This invoice was generated automatically from Velora Tracker order records.', 14, 270);
  doc.text('Velora Motors Ltd.', 14, 278);

  doc.save(`${cleanFilePart(invoiceNo)}-${cleanFilePart(order.customerName)}.pdf`);
}

async function generateQuotePdf(quote, customer) {
  const { jsPDF, autoTable } = await loadPdfTools();
  const doc = new jsPDF({ orientation: 'portrait' });
  const generatedAt = new Date().toLocaleString();
  const quantity = numberValue(quote.quantity);
  const total = quoteTotal(quote);
  const unitPrice = quantity ? total / quantity : total;

  doc.setFillColor(10, 17, 31);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('Velora Motors', 14, 15);
  doc.setFontSize(9);
  doc.text('Automotive dealership, exports and logistics operations', 14, 23);
  doc.text('Quotation', 176, 15, { align: 'right' });
  doc.text(quote.quoteId || 'Draft Quote', 176, 23, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text('Prepared For', 14, 48);
  doc.setFontSize(16);
  doc.text(quote.customerName || 'Customer', 14, 57);
  doc.setFontSize(9);
  [customer?.email, customer?.phone, customer?.location].filter(Boolean).forEach((line, index) => {
    doc.text(line, 14, 65 + index * 6);
  });

  const meta = [
    ['Quote Date', generatedAt],
    ['Valid Until', quote.validUntil || '-'],
    ['Quote Status', quote.status || '-'],
    ['Location', quote.locationName || '-'],
  ];
  meta.forEach(([label, value], index) => {
    const y = 48 + index * 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(label, 128, y);
    doc.setTextColor(15, 23, 42);
    doc.text(String(value), 176, y, { align: 'right' });
  });

  autoTable(doc, {
    startY: 92,
    head: [['Vehicle', 'Quantity', 'Unit Price', 'Quoted Total']],
    body: [[
      quote.vehicle || '-',
      formatIndianNumber(quantity),
      money.format(unitPrice),
      money.format(total),
    ]],
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  const finalY = doc.lastAutoTable.finalY + 14;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(120, finalY, 76, 30, 3, 3, 'F');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(10);
  doc.text('Quoted Amount', 128, finalY + 11);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.text(money.format(total), 188, finalY + 22, { align: 'right' });

  if (quote.notes) {
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('Notes', 14, finalY + 11);
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(quote.notes, 90), 14, finalY + 19);
  }

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('This quotation is valid until the date mentioned above and is subject to vehicle availability.', 14, 270);
  doc.text('Velora Motors Ltd.', 14, 278);

  doc.save(`${cleanFilePart(quote.quoteId || 'quote')}-${cleanFilePart(quote.customerName)}.pdf`);
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

function fromQuoteRow(row) {
  return {
    quoteId: row.quote_id,
    customerName: row.customer_name,
    vehicle: row.vehicle,
    quantity: row.quantity,
    validUntil: row.valid_until,
    purchaseCost: Number(row.purchase_cost),
    sellingPrice: Number(row.selling_price),
    status: row.status || 'Draft',
    notes: row.notes || '',
    locationName: row.location_name || 'Seoul HQ',
    department: row.department || 'Finance',
    createdAt: row.created_at,
  };
}

function toQuoteRow(quote, userId) {
  return {
    quote_id: quote.quoteId,
    customer_name: quote.customerName,
    vehicle: quote.vehicle,
    quantity: numberValue(quote.quantity),
    valid_until: quote.validUntil,
    purchase_cost: numberValue(quote.purchaseCost),
    selling_price: numberValue(quote.sellingPrice),
    status: quote.status,
    notes: quote.notes,
    location_name: quote.locationName,
    department: quote.department,
    ...(userId ? { created_by: userId } : {}),
  };
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

function fromProcurementRow(row) {
  return {
    procurementId: row.procurement_id,
    vehicleBrand: row.vehicle_brand,
    vehicleModel: row.vehicle_model,
    quantity: row.quantity,
    supplierName: row.supplier_name || '',
    supplierCountry: row.supplier_country || '',
    estimatedPurchaseCost: Number(row.estimated_purchase_cost),
    estimatedFreightCost: Number(row.estimated_freight_cost),
    requestedBy: row.requested_by || '',
    status: row.status || 'Requested',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function toProcurementRow(request, userId) {
  return {
    procurement_id: request.procurementId,
    vehicle_brand: request.vehicleBrand,
    vehicle_model: request.vehicleModel,
    quantity: numberValue(request.quantity),
    supplier_name: request.supplierName,
    supplier_country: request.supplierCountry,
    estimated_purchase_cost: numberValue(request.estimatedPurchaseCost),
    estimated_freight_cost: numberValue(request.estimatedFreightCost),
    requested_by: request.requestedBy,
    status: request.status,
    notes: request.notes,
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromSupplierRow(row) {
  return {
    id: row.id,
    supplierName: row.supplier_name,
    country: row.country || '',
    contactPerson: row.contact_person || '',
    phone: row.phone || '',
    email: row.email || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function toSupplierRow(supplier, userId) {
  return {
    supplier_name: supplier.supplierName,
    country: supplier.country,
    contact_person: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email,
    notes: supplier.notes,
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromLogisticsPartnerRow(row) {
  return {
    id: row.id,
    partnerName: row.partner_name,
    country: row.country || '',
    contactPerson: row.contact_person || '',
    phone: row.phone || '',
    email: row.email || '',
    serviceType: row.service_type || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function toLogisticsPartnerRow(partner, userId) {
  return {
    partner_name: partner.partnerName,
    country: partner.country,
    contact_person: partner.contactPerson,
    phone: partner.phone,
    email: partner.email,
    service_type: partner.serviceType,
    notes: partner.notes,
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromProcurementTimelineRow(row) {
  return {
    id: row.id,
    procurementId: row.procurement_id,
    status: row.status,
    note: row.note || '',
    createdAt: row.created_at,
  };
}

function toProcurementTimelineRow(event, userId) {
  return {
    procurement_id: event.procurementId,
    status: event.status,
    note: event.note,
    ...(userId ? { created_by: userId } : {}),
  };
}

function userName(user) {
  return user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'Velora user';
}

function normalizeRole(role) {
  return roleOptions.includes(role) ? role : 'Inventory Manager';
}

function createPermissions(role) {
  const normalizedRole = normalizeRole(role);
  const isExecutive = normalizedRole === 'CEO' || normalizedRole === 'Company Manager';
  const allowedPagesByRole = {
    CEO: pages,
    'Company Manager': pages,
    'Logistics Manager': ['Command Center', 'Shipments', 'Timeline', 'Alerts Center'],
    'Inventory Manager': ['Command Center', 'Procurement', 'Inventory', 'Alerts Center'],
    'Finance Manager': ['Command Center', 'Procurement', 'Quotes', 'Reports', 'Alerts Center'],
  };
  const allowedPages = allowedPagesByRole[normalizedRole] || [];

  return {
    role: normalizedRole,
    allowedPages,
    isExecutive,
    canViewPage(page) {
      return allowedPages.includes(page);
    },
    canManageUsers() {
      return normalizedRole === 'CEO';
    },
    canManageInventory() {
      return isExecutive || normalizedRole === 'Inventory Manager';
    },
    canManageProcurement() {
      return isExecutive || normalizedRole === 'Inventory Manager';
    },
    canManageOrders() {
      return isExecutive;
    },
    canManageQuotes() {
      return isExecutive || normalizedRole === 'Finance Manager';
    },
    canManageCustomers() {
      return isExecutive;
    },
    canManageShipments() {
      return isExecutive || normalizedRole === 'Logistics Manager';
    },
    canViewReports() {
      return isExecutive || normalizedRole === 'Finance Manager';
    },
    canViewFinancials() {
      return isExecutive || normalizedRole === 'Finance Manager';
    },
    canDeleteRecords(moduleName) {
      if (isExecutive) return true;
      return moduleName === 'Procurement' && normalizedRole === 'Inventory Manager'
        || moduleName === 'Inventory' && normalizedRole === 'Inventory Manager'
        || moduleName === 'Quotes' && normalizedRole === 'Finance Manager'
        || moduleName === 'Shipments' && normalizedRole === 'Logistics Manager';
    },
  };
}

const aiQuickPrompts = [
  'Summarize today',
  'What needs attention?',
  'Draft customer update',
  'Shipment risk check',
  'Inventory low-stock check',
];

function buildAiContext({
  permissions,
  vehicles,
  orders,
  customers,
  shipments,
  procurementRequests,
  alerts,
}) {
  const generatedAt = new Date().toISOString();
  const activeOrders = orders.filter((order) => order.status !== 'Completed');
  const activeShipments = shipments.filter((shipment) => shipment.status !== 'Delivered');
  const overdueShipments = activeShipments.filter((shipment) => shipment.eta && shipment.eta < today);
  const lowStockVehicles = vehicles.filter((vehicle) => numberValue(vehicle.quantity) <= 2);
  const totalRevenue = orders.reduce((sum, order) => sum + numberValue(order.totalRevenue), 0);
  const totalProfit = orders.reduce((sum, order) => sum + numberValue(order.totalProfit), 0);
  const inventoryValue = vehicles.reduce(
    (sum, vehicle) => sum + numberValue(vehicle.purchasePrice) * numberValue(vehicle.quantity),
    0,
  );
  const freightCost = shipments.reduce((sum, shipment) => sum + numberValue(shipment.freightCost), 0);

  const context = {
    dashboard: {
      generatedAt,
      role: permissions.role,
      inventoryUnits: vehicles.reduce((sum, vehicle) => sum + numberValue(vehicle.quantity), 0),
      activeOrders: activeOrders.length,
      completedOrders: orders.length - activeOrders.length,
      activeShipments: activeShipments.length,
      overdueShipments: overdueShipments.length,
      lowStockVehicles: lowStockVehicles.length,
      openAlerts: alerts.filter((alert) => !alert.resolved).length,
      ...(permissions.canViewFinancials()
        ? { totalRevenue, totalProfit, inventoryValue, freightCost }
        : {}),
    },
  };

  if (permissions.isExecutive || permissions.role === 'Logistics Manager') {
    context.orders = activeOrders.slice(0, 25).map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      vehicle: order.vehicle,
      quantity: numberValue(order.quantity),
      orderDate: order.orderDate,
      status: order.status,
      location: order.location,
      ...(permissions.canViewFinancials()
        ? {
          purchaseCost: numberValue(order.purchaseCost),
          sellingPrice: numberValue(order.sellingPrice),
          totalRevenue: numberValue(order.totalRevenue),
          totalProfit: numberValue(order.totalProfit),
        }
        : {}),
    }));
  }

  if (permissions.isExecutive
    || permissions.role === 'Inventory Manager'
    || permissions.role === 'Finance Manager') {
    context.inventory = {
      lowStock: lowStockVehicles.slice(0, 25).map((vehicle) => ({
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        category: vehicle.category,
        quantity: numberValue(vehicle.quantity),
        status: vehicle.status,
        location: vehicle.location,
        ...(permissions.canViewFinancials()
          ? {
            purchasePrice: numberValue(vehicle.purchasePrice),
            sellingPrice: numberValue(vehicle.sellingPrice),
            profitAmount: profitAmount(vehicle),
            profitMargin: profitMargin(vehicle),
          }
          : {}),
      })),
      activeProcurements: procurementRequests
        .filter((request) => request.status !== 'Added To Inventory')
        .slice(0, 20)
        .map((request) => ({
          id: request.id,
          procurementId: request.procurementId,
          vehicle: `${request.vehicleBrand} ${request.vehicleModel}`.trim(),
          quantity: numberValue(request.quantity),
          supplierName: request.supplierName,
          status: request.status,
          createdAt: request.createdAt,
          ...(permissions.canViewFinancials()
            ? {
              estimatedPurchaseCost: numberValue(request.estimatedPurchaseCost),
              estimatedFreightCost: numberValue(request.estimatedFreightCost),
            }
            : {}),
        })),
    };
  }

  if (permissions.isExecutive
    || permissions.role === 'Logistics Manager'
    || permissions.role === 'Finance Manager') {
    context.shipments = activeShipments.slice(0, 25).map((shipment) => ({
      id: shipment.id,
      shipmentId: shipment.shipmentId,
      linkedOrderId: shipment.linkedOrderId,
      customerName: shipment.customerName,
      vehicle: shipment.vehicle,
      quantity: numberValue(shipment.quantity),
      destinationCountry: shipment.destinationCountry,
      portOfDeparture: shipment.portOfDeparture,
      portOfArrival: shipment.portOfArrival,
      shippingCompany: shipment.shippingCompany,
      eta: shipment.eta,
      status: shipment.status,
      overdue: Boolean(shipment.eta && shipment.eta < today),
      ...(permissions.canViewFinancials()
        ? { freightCost: numberValue(shipment.freightCost) }
        : {}),
    }));
  }

  if (permissions.isExecutive) {
    context.customers = customers.slice(0, 25).map((customer) => ({
      id: customer.id,
      name: customer.name,
      location: customer.countryCity,
      createdAt: customer.createdAt,
      hasPhone: Boolean(customer.phone),
      hasEmail: Boolean(customer.email),
    }));
  }

  if (permissions.canViewReports()) {
    context.reports = {
      generatedAt,
      totalRevenue,
      totalProfit,
      inventoryValue,
      freightCost,
      orderCount: orders.length,
      shipmentCount: shipments.length,
      customerCount: customers.length,
      procurementCount: procurementRequests.length,
    };
  }

  return context;
}

function useAuthSession() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      setAuthError(supabaseConfigError);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        const message = friendlyError(error, 'Velora could not restore your secure session.');
        setAuthError(message);
        recordHealthEvent({ type: 'authentication', message });
      }
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
    window.localStorage.removeItem(pendingOAuthRoleKey);
    const { error } = await supabase.auth.signOut();
    if (error) {
      const message = friendlyError(error, 'Velora could not sign you out.');
      setAuthError(message);
      recordHealthEvent({ type: 'authentication', message });
    }
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

function useUserProfile(user) {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!user || !isSupabaseConfigured) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      setProfileError('');

      try {
        const pendingOAuthRole = window.localStorage.getItem(pendingOAuthRoleKey);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        const fallbackProfile = {
          id: user.id,
          full_name: userName(user),
          email: user.email,
          role: normalizeRole(pendingOAuthRole || user.user_metadata?.role),
        };

        if (!data) {
          const fallbackRole = normalizeRole(pendingOAuthRole || user.user_metadata?.role || 'Inventory Manager');
          fallbackProfile.role = fallbackRole;
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(fallbackProfile)
            .select()
            .maybeSingle();
          if (createError) {
            window.localStorage.removeItem(pendingOAuthRoleKey);
            if (createError.code === '23505' && exclusiveRoles.includes(fallbackRole)) {
              window.sessionStorage.setItem(
                pendingAuthErrorKey,
                `${fallbackRole} is already assigned. Sign in with its existing account or choose another role.`,
              );
              await supabase.auth.signOut();
            }
            throw createError;
          }
          window.localStorage.removeItem(pendingOAuthRoleKey);
          if (mounted) setProfile(createdProfile || fallbackProfile);
        } else if (mounted) {
          window.localStorage.removeItem(pendingOAuthRoleKey);
          setProfile({ ...data, role: normalizeRole(data.role) });
        }
      } catch (requestError) {
        if (mounted) {
          setProfile(requestError.code === '23505'
            ? null
            : {
              id: user.id,
              full_name: userName(user),
              email: user.email,
              role: normalizeRole(user.user_metadata?.role),
            });
          const message = friendlyError(requestError, 'Velora could not load your access profile.');
          setProfileError(message);
          recordHealthEvent({ type: 'profile', message });
        }
      } finally {
        if (mounted) setProfileLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return { profile, profileLoading, profileError };
}

function useSupabaseRecords(user, permissions) {
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [orderTimelines, setOrderTimelines] = useState({});
  const [procurementTimelines, setProcurementTimelines] = useState({});
  const [customers, setCustomers] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [logisticsPartners, setLogisticsPartners] = useState([]);
  const [procurementRequests, setProcurementRequests] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  async function runRequest(request, operation = 'database request') {
    const { data, error: requestError } = await request;
    if (requestError) {
      const message = friendlyError(requestError);
      setError(message);
      recordHealthEvent({
        type: 'supabase-query',
        message,
        context: { operation, code: requestError.code },
      });
      throw requestError;
    }
    return data;
  }

  async function runOptionalRequest(request, operation = 'optional database request') {
    const { data, error: requestError } = await request;
    if (requestError) {
      const message = requestError.message || '';
      if (requestError.code === '42P01' || message.includes('does not exist') || message.includes('schema cache')) return [];
      const friendlyMessage = friendlyError(requestError);
      setError(friendlyMessage);
      recordHealthEvent({
        type: 'supabase-query',
        message: friendlyMessage,
        context: { operation, code: requestError.code },
      });
      throw requestError;
    }
    return data || [];
  }

  async function loadRecords() {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError(supabaseConfigError);
      return;
    }

    if (!user || !permissions) {
      setVehicles([]);
      setOrders([]);
      setQuotes([]);
      setOrderTimelines({});
      setProcurementTimelines({});
      setCustomers([]);
      setShipments([]);
      setLogisticsPartners([]);
      setProcurementRequests([]);
      setSuppliers([]);
      setLoading(false);
      setLastUpdated(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const readAll = permissions.isExecutive || permissions.role === 'Finance Manager';
      const emptyQuery = Promise.resolve({ data: [], error: null });
      const needsVehicles = permissions.canViewPage('Inventory') || permissions.canViewPage('Orders') || permissions.canViewPage('Quotes');
      const needsOrders = permissions.canViewPage('Orders') || permissions.canViewPage('Timeline') || permissions.canViewPage('Shipments');
      const needsQuotes = permissions.canViewPage('Quotes');
      const needsCustomers = permissions.canViewPage('Customers') || permissions.canViewPage('Orders') || permissions.canViewPage('Quotes');
      const needsShipments = permissions.canViewPage('Shipments');
      const needsTimeline = permissions.canViewPage('Timeline') || permissions.canViewPage('Orders');
      const needsProcurement = permissions.canViewPage('Procurement');

      const vehicleQuery = !needsVehicles ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Inventory Manager' || permissions.role === 'Finance Manager'
          ? supabase.from('vehicles').select('*').order('created_at', { ascending: false })
          : supabase.from('vehicles').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
      const orderQuery = !needsOrders ? emptyQuery
        : readAll || permissions.role === 'Logistics Manager'
          ? supabase.from('orders').select('*').order('created_at', { ascending: false })
          : supabase.from('orders').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
      const quoteQuery = !needsQuotes ? emptyQuery
        : readAll
          ? supabase.from('quotes').select('*').order('created_at', { ascending: false })
          : supabase.from('quotes').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
      const customerQuery = !needsCustomers ? emptyQuery
        : readAll
          ? supabase.from('customers').select('*').order('created_at', { ascending: false })
          : supabase.from('customers').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
      const shipmentQuery = !needsShipments ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Logistics Manager' || permissions.role === 'Finance Manager'
          ? supabase.from('shipments').select('*').order('created_at', { ascending: false })
          : supabase.from('shipments').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
      const logisticsPartnerQuery = !needsShipments ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Logistics Manager' || permissions.role === 'Finance Manager'
          ? supabase.from('logistics_partners').select('*').order('created_at', { ascending: false })
          : supabase.from('logistics_partners').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
      const timelineQuery = !needsTimeline ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Logistics Manager'
          ? supabase.from('order_timeline_events').select('*').order('created_at', { ascending: true })
          : supabase.from('order_timeline_events').select('*').eq('created_by', user.id).order('created_at', { ascending: true });
      const procurementQuery = !needsProcurement ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Inventory Manager' || permissions.role === 'Finance Manager'
          ? supabase.from('procurement_requests').select('*').order('created_at', { ascending: false })
          : supabase.from('procurement_requests').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
      const supplierQuery = !needsProcurement ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Inventory Manager' || permissions.role === 'Finance Manager'
          ? supabase.from('suppliers').select('*').order('created_at', { ascending: false })
          : supabase.from('suppliers').select('*').eq('created_by', user.id).order('created_at', { ascending: false });
      const procurementTimelineQuery = !needsProcurement ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Inventory Manager' || permissions.role === 'Finance Manager'
          ? supabase.from('procurement_timeline').select('*').order('created_at', { ascending: true })
          : supabase.from('procurement_timeline').select('*').eq('created_by', user.id).order('created_at', { ascending: true });

      const [vehicleRows, orderRows, quoteRows, customerRows, shipmentRows, logisticsPartnerRows, timelineRows, procurementRows, supplierRows, procurementTimelineRows] = await Promise.all([
        runRequest(vehicleQuery, 'load vehicles'),
        runRequest(orderQuery, 'load orders'),
        runOptionalRequest(quoteQuery, 'load quotes'),
        runRequest(customerQuery, 'load customers'),
        runRequest(shipmentQuery, 'load shipments'),
        runOptionalRequest(logisticsPartnerQuery, 'load logistics partners'),
        runRequest(timelineQuery, 'load order timeline'),
        runOptionalRequest(procurementQuery, 'load procurement requests'),
        runOptionalRequest(supplierQuery, 'load suppliers'),
        runOptionalRequest(procurementTimelineQuery, 'load procurement timeline'),
      ]);

      setVehicles(vehicleRows.map(fromVehicleRow));
      setOrders(orderRows.map(fromOrderRow));
      setQuotes(quoteRows.map(fromQuoteRow));
      setCustomers(customerRows.map(fromCustomerRow));
      setShipments(shipmentRows.map(fromShipmentRow));
      setLogisticsPartners(logisticsPartnerRows.map(fromLogisticsPartnerRow));
      setOrderTimelines(groupTimelineRows(timelineRows.map(fromTimelineRow)));
      setProcurementRequests(procurementRows.map(fromProcurementRow));
      setSuppliers(supplierRows.map(fromSupplierRow));
      setProcurementTimelines(groupTimelineRows(procurementTimelineRows.map(fromProcurementTimelineRow)));
      setLastUpdated(new Date());
    } catch (requestError) {
      setError((current) => current || friendlyError(requestError, 'Velora could not load company records.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [user?.id, permissions?.role]);

  async function saveVehicle(vehicle, editingId) {
    if (!permissions?.canManageInventory()) throw new Error('Your role cannot manage inventory.');
    const query = editingId
      ? supabase.from('vehicles').update(toVehicleRow(vehicle)).eq('id', editingId).select().single()
      : supabase.from('vehicles').insert(toVehicleRow(vehicle, user.id)).select().single();
    const saved = fromVehicleRow(await runRequest(query));
    setVehicles((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteVehicle(id) {
    if (!permissions?.canDeleteRecords('Inventory')) throw new Error('Your role cannot delete inventory records.');
    await runRequest(supabase.from('vehicles').delete().eq('id', id));
    setVehicles((current) => current.filter((item) => item.id !== id));
  }

  async function saveOrder(order, editingId) {
    if (!permissions?.canManageOrders()) throw new Error('Your role cannot manage orders.');
    const orderToSave = {
      ...order,
      orderNumber: order.orderNumber || nextOrderNumber(orders),
    };
    const query = editingId
      ? supabase.from('orders').update(toOrderRow(orderToSave)).eq('id', editingId).select().single()
      : supabase.from('orders').insert(toOrderRow(orderToSave, user.id)).select().single();
    const saved = fromOrderRow(await runRequest(query));
    setOrders((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);

    if (!editingId) {
      await addOrderTimelineEvent(saved.id, saved.status, 'Order created.');
    }

    return saved;
  }

  async function deleteOrder(id) {
    if (!permissions?.canDeleteRecords('Orders')) throw new Error('Your role cannot delete orders.');
    await runRequest(supabase.from('orders').delete().eq('id', id));
    setOrders((current) => current.filter((item) => item.id !== id));
  }

  async function saveQuote(quote, editingId) {
    if (!permissions?.canManageQuotes()) throw new Error('Your role cannot manage quotes.');
    const quoteToSave = {
      ...quote,
      quoteId: quote.quoteId || nextQuoteId(quotes),
    };
    const query = editingId
      ? supabase.from('quotes').update(toQuoteRow(quoteToSave)).eq('quote_id', editingId).select().single()
      : supabase.from('quotes').insert(toQuoteRow(quoteToSave, user.id)).select().single();
    const saved = fromQuoteRow(await runRequest(query));
    setQuotes((current) => editingId ? current.map((item) => item.quoteId === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteQuote(id) {
    if (!permissions?.canDeleteRecords('Quotes')) throw new Error('Your role cannot delete quotes.');
    await runRequest(supabase.from('quotes').delete().eq('quote_id', id));
    setQuotes((current) => current.filter((item) => item.quoteId !== id));
  }

  async function updateOrderStatus(id, status) {
    if (!permissions?.canManageOrders()) throw new Error('Your role cannot update order status.');
    const saved = fromOrderRow(await runRequest(supabase.from('orders').update({ status }).eq('id', id).select().single()));
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
    if (!permissions?.isExecutive && permissions?.role !== 'Logistics Manager') throw new Error('Your role cannot add timeline notes.');
    const order = orders.find((item) => item.id === orderId);
    await addOrderTimelineEvent(orderId, order?.status || 'Inquiry', note);
  }

  async function saveCustomer(customer, editingId) {
    if (!permissions?.canManageCustomers()) throw new Error('Your role cannot manage customers.');
    const query = editingId
      ? supabase.from('customers').update(toCustomerRow(customer)).eq('id', editingId).select().single()
      : supabase.from('customers').insert(toCustomerRow(customer, user.id)).select().single();
    const saved = fromCustomerRow(await runRequest(query));
    setCustomers((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteCustomer(id) {
    if (!permissions?.canDeleteRecords('Customers')) throw new Error('Your role cannot delete customers.');
    await runRequest(supabase.from('customers').delete().eq('id', id));
    setCustomers((current) => current.filter((item) => item.id !== id));
  }

  async function saveShipment(shipment, editingId) {
    if (!permissions?.canManageShipments()) throw new Error('Your role cannot manage shipments.');
    const query = editingId
      ? supabase.from('shipments').update(toShipmentRow(shipment)).eq('shipment_id', editingId).select().single()
      : supabase.from('shipments').insert(toShipmentRow(shipment, user.id)).select().single();
    const saved = fromShipmentRow(await runRequest(query));
    setShipments((current) => editingId ? current.map((item) => item.shipmentId === editingId ? saved : item) : [saved, ...current]);
    return saved;
  }

  async function deleteShipment(id) {
    if (!permissions?.canDeleteRecords('Shipments')) throw new Error('Your role cannot delete shipments.');
    await runRequest(supabase.from('shipments').delete().eq('shipment_id', id));
    setShipments((current) => current.filter((item) => item.shipmentId !== id));
  }

  async function saveLogisticsPartner(partner, editingId) {
    if (!permissions?.canManageShipments()) throw new Error('Your role cannot manage logistics partners.');
    const query = editingId
      ? supabase.from('logistics_partners').update(toLogisticsPartnerRow(partner)).eq('id', editingId).select().single()
      : supabase.from('logistics_partners').insert(toLogisticsPartnerRow(partner, user.id)).select().single();
    const saved = fromLogisticsPartnerRow(await runRequest(query));
    setLogisticsPartners((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteLogisticsPartner(id) {
    if (!permissions?.canDeleteRecords('Shipments')) throw new Error('Your role cannot delete logistics partners.');
    await runRequest(supabase.from('logistics_partners').delete().eq('id', id));
    setLogisticsPartners((current) => current.filter((item) => item.id !== id));
  }

  async function syncProcurementToInventory(request) {
    const vehicleName = `${request.vehicleBrand} ${request.vehicleModel}`.trim().toLowerCase();
    const existing = vehicles.find((vehicle) => `${vehicle.brand} ${vehicle.model}`.trim().toLowerCase() === vehicleName);
    if (existing) {
      const updated = {
        ...existing,
        quantity: numberValue(existing.quantity) + numberValue(request.quantity),
        purchasePrice: request.estimatedPurchaseCost || existing.purchasePrice,
        status: 'Available',
      };
      await saveVehicle(updated, existing.id);
      return;
    }

    const newVehicle = {
      ...blankVehicle,
      id: nextDisplayId(vehicles, 'id'),
      brand: request.vehicleBrand,
      model: request.vehicleModel,
      category: 'Procured Vehicle',
      quantity: numberValue(request.quantity),
      purchasePrice: numberValue(request.estimatedPurchaseCost),
      sellingPrice: numberValue(request.estimatedPurchaseCost),
      status: 'Available',
    };
    await saveVehicle(newVehicle, '');
  }

  async function addProcurementTimelineEvent(procurementId, status, note) {
    const saved = fromProcurementTimelineRow(await runRequest(
      supabase
        .from('procurement_timeline')
        .insert(toProcurementTimelineRow({ procurementId, status, note }, user.id))
        .select()
        .single()
    ));

    setProcurementTimelines((current) => ({
      ...current,
      [procurementId]: [...(current[procurementId] || []), saved],
    }));
  }

  async function saveProcurementRequest(request, editingId) {
    if (!permissions?.canManageProcurement()) throw new Error('Your role cannot manage procurement.');
    const requestToSave = {
      ...request,
      procurementId: request.procurementId || nextProcurementId(procurementRequests),
    };
    const previous = procurementRequests.find((item) => item.procurementId === editingId);
    const query = editingId
      ? supabase.from('procurement_requests').update(toProcurementRow(requestToSave)).eq('procurement_id', editingId).select().single()
      : supabase.from('procurement_requests').insert(toProcurementRow(requestToSave, user.id)).select().single();
    const saved = fromProcurementRow(await runRequest(query));
    setProcurementRequests((current) => editingId ? current.map((item) => item.procurementId === editingId ? saved : item) : [saved, ...current]);

    if (!editingId) {
      await addProcurementTimelineEvent(saved.procurementId, saved.status, 'Procurement request created.');
    } else if (previous?.status !== saved.status) {
      await addProcurementTimelineEvent(saved.procurementId, saved.status, `Status changed to ${saved.status}.`);
    }

    if (saved.status === 'Added To Inventory' && previous?.status !== 'Added To Inventory') {
      await syncProcurementToInventory(saved);
    }
  }

  async function deleteProcurementRequest(id) {
    if (!permissions?.canDeleteRecords('Procurement')) throw new Error('Your role cannot delete procurement records.');
    await runRequest(supabase.from('procurement_requests').delete().eq('procurement_id', id));
    setProcurementRequests((current) => current.filter((item) => item.procurementId !== id));
  }

  async function addProcurementTimelineNote(procurementId, note) {
    const request = procurementRequests.find((item) => item.procurementId === procurementId);
    await addProcurementTimelineEvent(procurementId, request?.status || 'Requested', note);
  }

  async function saveSupplier(supplier, editingId) {
    if (!permissions?.canManageProcurement()) throw new Error('Your role cannot manage suppliers.');
    const query = editingId
      ? supabase.from('suppliers').update(toSupplierRow(supplier)).eq('id', editingId).select().single()
      : supabase.from('suppliers').insert(toSupplierRow(supplier, user.id)).select().single();
    const saved = fromSupplierRow(await runRequest(query));
    setSuppliers((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
  }

  async function deleteSupplier(id) {
    if (!permissions?.canDeleteRecords('Procurement')) throw new Error('Your role cannot delete suppliers.');
    await runRequest(supabase.from('suppliers').delete().eq('id', id));
    setSuppliers((current) => current.filter((item) => item.id !== id));
  }

  return {
    vehicles,
    orders,
    quotes,
    orderTimelines,
    procurementTimelines,
    customers,
    shipments,
    logisticsPartners,
    procurementRequests,
    suppliers,
    loading,
    error,
    lastUpdated,
    refreshRecords: loadRecords,
    saveVehicle,
    deleteVehicle,
    saveOrder,
    deleteOrder,
    saveQuote,
    deleteQuote,
    updateOrderStatus,
    addOrderTimelineNote,
    saveCustomer,
    deleteCustomer,
    saveShipment,
    deleteShipment,
    saveLogisticsPartner,
    deleteLogisticsPartner,
    saveProcurementRequest,
    deleteProcurementRequest,
    addProcurementTimelineNote,
    saveSupplier,
    deleteSupplier,
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

function FormattedNumberInput({ value, onChange, min = 0 }) {
  return (
    <input
      inputMode="decimal"
      min={min}
      value={formatIndianInput(value)}
      onChange={(event) => onChange(formatIndianInput(event.target.value))}
    />
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

function compareTableValues(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (left !== '' && right !== '' && Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }
  return String(left ?? '').localeCompare(String(right ?? ''), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function useTableView(items, {
  initialSortKey,
  pageSize = 10,
} = {}) {
  const [sortKey, setSortKey] = useState(initialSortKey || '');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(1);

  const sortedItems = useMemo(() => {
    if (!sortKey) return items;
    return [...items].sort((left, right) => {
      const comparison = compareTableValues(left?.[sortKey], right?.[sortKey]);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [items.length, sortKey, sortDirection]);

  return {
    rows: sortedItems.slice((page - 1) * pageSize, page * pageSize),
    page,
    setPage,
    totalPages,
    sortKey,
    setSortKey,
    sortDirection,
    setSortDirection,
    count: sortedItems.length,
    firstItem: sortedItems.length ? (page - 1) * pageSize + 1 : 0,
    lastItem: Math.min(page * pageSize, sortedItems.length),
  };
}

function TableSortControl({ table, options }) {
  return (
    <div className="table-sort-control">
      <select
        aria-label="Sort table"
        value={table.sortKey}
        onChange={(event) => table.setSortKey(event.target.value)}
      >
        {options.map((option) => (
          <option value={option.value} key={option.value}>{option.label}</option>
        ))}
      </select>
      <button
        type="button"
        className="sort-direction"
        onClick={() => table.setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')}
        aria-label={`Sort ${table.sortDirection === 'asc' ? 'descending' : 'ascending'}`}
        title={`Sort ${table.sortDirection === 'asc' ? 'descending' : 'ascending'}`}
      >
        {table.sortDirection === 'asc' ? '↑' : '↓'}
      </button>
    </div>
  );
}

function TableFooter({ count, page = 1, totalPages = 1, firstItem = count ? 1 : 0, lastItem = count, onPageChange }) {
  return (
    <div className="table-footer">
      <span>
        {count ? `Showing ${firstItem}-${lastItem} of ${count}` : 'Showing 0 records'}
      </span>
      <div className="pagination">
        <button disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>Previous</button>
        <strong>{page}</strong>
        <span>of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>Next</button>
      </div>
    </div>
  );
}

function CsvImportPanel({ title, description, sampleHeaders, onImport }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage('Reading CSV...');

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) {
        setMessage('No rows found. Make sure the first row contains column headers.');
        return;
      }
      const count = await onImport(rows);
      setMessage(`Imported ${formatIndianNumber(count)} record${count === 1 ? '' : 's'} from ${file.name}.`);
    } catch (error) {
      setMessage(error.message || 'CSV import failed.');
    } finally {
      setBusy(false);
      event.target.value = '';
    }
  }

  return (
    <section className="csv-import-card">
      <div>
        <p className="eyebrow">CSV import</p>
        <h3>{title}</h3>
        <span>{description}</span>
        <code>{sampleHeaders}</code>
        {message && <small>{message}</small>}
      </div>
      <label className={`csv-upload ${busy ? 'disabled' : ''}`}>
        <Upload size={17} />
        <span>{busy ? 'Importing...' : 'Upload CSV'}</span>
        <input type="file" accept=".csv,text/csv" disabled={busy} onChange={handleFile} />
      </label>
    </section>
  );
}

function AlertBadge({ severity }) {
  return <span className={`alert-severity severity-${severity.toLowerCase()}`}>{severity}</span>;
}

function SystemHealthPanel({ vehicles, orders, customers, shipments, error, authError, healthEvents = [] }) {
  const totalRecords = vehicles.length + orders.length + customers.length + shipments.length;
  const lastActivity = buildAuditLogs({ vehicles, orders, customers, shipments })[0]?.time;
  const hasError = Boolean(error || authError);
  const latestHealthEvent = healthEvents[0];
  const checks = [
    { label: 'Database Status', value: hasError ? 'Attention' : 'Connected', tone: hasError ? 'danger' : 'success' },
    { label: 'Authentication Status', value: authError ? 'Check setup' : 'Active', tone: authError ? 'danger' : 'success' },
    { label: 'Total Records', value: formatIndianNumber(totalRecords), tone: 'info' },
    { label: 'Last Activity', value: lastActivity ? new Date(lastActivity).toLocaleString() : 'No activity yet', tone: 'info' },
    { label: 'System Uptime', value: 'Operational', tone: 'success' },
    {
      label: 'Recent Errors',
      value: error || authError || latestHealthEvent?.message || 'None',
      tone: hasError || latestHealthEvent ? 'danger' : 'success',
    },
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

function GlobalSearch({ index, setActivePage, allowedPages }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const results = useMemo(
    () => searchIndex(index, query, allowedPages),
    [index, query, allowedPages],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function focusSearch(event) {
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  function openResult(result) {
    if (!result) return;
    setActivePage(result.page);
    setQuery('');
  }

  function handleKeyDown(event) {
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      openResult(results[selectedIndex]);
    } else if (event.key === 'Escape') {
      setQuery('');
      inputRef.current?.blur();
    }
  }

  return (
    <div className="global-search">
      <Search size={16} />
      <input
        ref={inputRef}
        placeholder="Search vehicles, orders, customers, shipments..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Search Velora records"
        aria-expanded={results.length > 0}
      />
      <kbd>/</kbd>
      {results.length > 0 && (
        <div className="search-popover" role="listbox" aria-label="Search results">
          {results.map((result, indexPosition) => (
            <button
              key={`${result.module}-${result.title}`}
              className={selectedIndex === indexPosition ? 'selected' : ''}
              role="option"
              aria-selected={selectedIndex === indexPosition}
              onMouseEnter={() => setSelectedIndex(indexPosition)}
              onClick={() => openResult(result)}
            >
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

function CommandPalette({ open, onClose, setActivePage, allowedPages }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dialogRef = useRef(null);
  const actions = useMemo(() => [
    { label: 'Open Procurement', page: 'Procurement', icon: ClipboardList },
    { label: 'Add Vehicle', page: 'Inventory', icon: Boxes },
    { label: 'Add Customer', page: 'Customers', icon: Users },
    { label: 'Create Order', page: 'Orders', icon: ClipboardList },
    { label: 'Create Quote', page: 'Quotes', icon: FileText },
    { label: 'Create Shipment', page: 'Shipments', icon: Truck },
    { label: 'Open Reports', page: 'Reports', icon: FileText },
    { label: 'Open Audit Logs', page: 'Audit Logs', icon: ShieldCheck },
    { label: 'Open Command Center', page: 'Command Center', icon: LayoutDashboard },
  ].filter((action) => allowedPages.includes(action.page)), [allowedPages]);

  useEffect(() => {
    if (!open) return;
    setSelectedIndex(0);
    window.requestAnimationFrame(() => dialogRef.current?.focus());
  }, [open]);

  if (!open) return null;

  function runAction(action) {
    if (!action) return;
    setActivePage(action.page);
    onClose();
  }

  function handleKeyDown(event) {
    if (!actions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((current) => (current + 1) % actions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((current) => (current - 1 + actions.length) % actions.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setSelectedIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setSelectedIndex(actions.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runAction(actions[selectedIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <div className="command-backdrop" onClick={onClose}>
      <section
        className="command-dialog"
        ref={dialogRef}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-label="Velora command palette"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="card-heading">
          <div>
            <p className="eyebrow">Command palette</p>
            <h2>Quick actions</h2>
          </div>
          <div className="command-key-hints">
            <kbd>↑↓</kbd>
            <kbd>Enter</kbd>
            <kbd>Esc</kbd>
          </div>
        </div>
        <div className="command-list" role="listbox" aria-label="Quick actions">
          {actions.map((action, index) => {
            const { label, icon: Icon } = action;
            return (
            <button
              key={label}
              className={selectedIndex === index ? 'selected' : ''}
              role="option"
              aria-selected={selectedIndex === index}
              tabIndex="-1"
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => runAction(action)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
            );
          })}
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
        <FormattedNumberInput value={value.quantity} onChange={(nextValue) => onChange({ ...value, quantity: nextValue })} />
      </Field>
      <Field label="Purchase Price">
        <FormattedNumberInput value={value.purchasePrice} onChange={(nextValue) => onChange({ ...value, purchasePrice: nextValue })} />
      </Field>
      <Field label="Selling Price">
        <FormattedNumberInput value={value.sellingPrice} onChange={(nextValue) => onChange({ ...value, sellingPrice: nextValue })} />
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

function OrderForm({ value, onChange, onSubmit, editingId, onCancel, vehicleOptions, customerOptions }) {
  function vehicleLabel(vehicle) {
    return `${vehicle.brand} ${vehicle.model}`;
  }

  function findVehicle(vehicleName) {
    return vehicleOptions.find((vehicle) => vehicleLabel(vehicle).trim().toLowerCase() === String(vehicleName).trim().toLowerCase());
  }

  function withInventoryPricing(nextValue) {
    const selectedVehicle = findVehicle(nextValue.vehicle);
    if (!selectedVehicle) return nextValue;
    const quantity = Math.max(numberValue(nextValue.quantity), 1);
    return {
      ...nextValue,
      purchaseCost: selectedVehicle.purchasePrice * quantity,
      sellingPrice: selectedVehicle.sellingPrice * quantity,
    };
  }

  function updateVehicle(vehicleName) {
    onChange(withInventoryPricing({ ...value, vehicle: vehicleName }));
  }

  function updateQuantity(quantity) {
    onChange(withInventoryPricing({ ...value, quantity }));
  }

  return (
    <form className="entry-form" onSubmit={onSubmit}>
      <Field label="Order Number">
        <input value={value.orderNumber} onChange={(e) => onChange({ ...value, orderNumber: e.target.value })} placeholder="Auto, e.g. 0001" />
      </Field>
      <Field label="Customer Name">
        <input list="customer-list" value={value.customerName} onChange={(e) => onChange({ ...value, customerName: e.target.value })} placeholder="Select existing or type new" required />
        <datalist id="customer-list">
          {customerOptions.map((customer) => (
            <option key={customer.id} value={customer.name} />
          ))}
        </datalist>
      </Field>
      <Field label="Vehicle">
        <input list="vehicle-list" value={value.vehicle} onChange={(e) => updateVehicle(e.target.value)} required />
        <datalist id="vehicle-list">
          {vehicleOptions.map((vehicle) => (
            <option key={vehicle.id} value={vehicleLabel(vehicle)} />
          ))}
        </datalist>
      </Field>
      <Field label="Quantity">
        <FormattedNumberInput min={1} value={value.quantity} onChange={updateQuantity} />
      </Field>
      <Field label="Order Date">
        <input type="date" value={value.orderDate} onChange={(e) => onChange({ ...value, orderDate: e.target.value })} />
      </Field>
      <Field label="Purchase Cost">
        <FormattedNumberInput value={value.purchaseCost} onChange={(nextValue) => onChange({ ...value, purchaseCost: nextValue })} />
      </Field>
      <Field label="Selling Price">
        <FormattedNumberInput value={value.sellingPrice} onChange={(nextValue) => onChange({ ...value, sellingPrice: nextValue })} />
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

function QuoteForm({ value, onChange, onSubmit, editingId, onCancel, vehicleOptions, customerOptions }) {
  function vehicleLabel(vehicle) {
    return `${vehicle.brand} ${vehicle.model}`;
  }

  function findVehicle(vehicleName) {
    return vehicleOptions.find((vehicle) => vehicleLabel(vehicle).trim().toLowerCase() === String(vehicleName).trim().toLowerCase());
  }

  function withInventoryPricing(nextValue) {
    const selectedVehicle = findVehicle(nextValue.vehicle);
    if (!selectedVehicle) return nextValue;
    const quantity = Math.max(numberValue(nextValue.quantity), 1);
    return {
      ...nextValue,
      purchaseCost: selectedVehicle.purchasePrice * quantity,
      sellingPrice: selectedVehicle.sellingPrice * quantity,
    };
  }

  function updateVehicle(vehicleName) {
    onChange(withInventoryPricing({ ...value, vehicle: vehicleName }));
  }

  function updateQuantity(quantity) {
    onChange(withInventoryPricing({ ...value, quantity }));
  }

  return (
    <form className="entry-form" onSubmit={onSubmit}>
      <Field label="Quote ID">
        <input value={value.quoteId} onChange={(e) => onChange({ ...value, quoteId: e.target.value })} placeholder="Auto, e.g. QT-0001" />
      </Field>
      <Field label="Customer Name">
        <input list="quote-customer-list" value={value.customerName} onChange={(e) => onChange({ ...value, customerName: e.target.value })} placeholder="Select existing or type new" required />
        <datalist id="quote-customer-list">
          {customerOptions.map((customer) => (
            <option key={customer.id} value={customer.name} />
          ))}
        </datalist>
      </Field>
      <Field label="Vehicle">
        <input list="quote-vehicle-list" value={value.vehicle} onChange={(e) => updateVehicle(e.target.value)} required />
        <datalist id="quote-vehicle-list">
          {vehicleOptions.map((vehicle) => (
            <option key={vehicle.id} value={vehicleLabel(vehicle)} />
          ))}
        </datalist>
      </Field>
      <Field label="Quantity">
        <FormattedNumberInput min={1} value={value.quantity} onChange={updateQuantity} />
      </Field>
      <Field label="Valid Until">
        <input type="date" value={value.validUntil} onChange={(e) => onChange({ ...value, validUntil: e.target.value })} />
      </Field>
      <Field label="Purchase Cost">
        <FormattedNumberInput value={value.purchaseCost} onChange={(nextValue) => onChange({ ...value, purchaseCost: nextValue })} />
      </Field>
      <Field label="Selling Price">
        <FormattedNumberInput value={value.sellingPrice} onChange={(nextValue) => onChange({ ...value, sellingPrice: nextValue })} />
      </Field>
      <Field label="Status">
        <select value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value })}>
          {quoteStatuses.map((status) => (
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
        <textarea value={value.notes} onChange={(e) => onChange({ ...value, notes: e.target.value })} placeholder="Payment terms, validity notes, delivery assumptions..." />
      </Field>
      <div className="form-actions">
        <button type="submit">{editingId ? 'Save quote' : 'Add quote'}</button>
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

function ShipmentForm({ value, onChange, onSubmit, editingId, onCancel, orderOptions, logisticsPartners = [] }) {
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
        <FormattedNumberInput min={1} value={value.quantity} onChange={(nextValue) => onChange({ ...value, quantity: nextValue })} />
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
        <input list="logistics-partner-list" value={value.shippingCompany} onChange={(e) => onChange({ ...value, shippingCompany: e.target.value })} />
        <datalist id="logistics-partner-list">
          {logisticsPartners.map((partner) => <option key={partner.id} value={partner.partnerName} />)}
        </datalist>
      </Field>
      <Field label="Freight Cost">
        <FormattedNumberInput value={value.freightCost} onChange={(nextValue) => onChange({ ...value, freightCost: nextValue })} />
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

function ProcurementRequestForm({ value, onChange, onSubmit, editingId, onCancel, suppliers }) {
  function applySupplier(name) {
    const supplier = suppliers.find((item) => item.supplierName === name);
    onChange({
      ...value,
      supplierName: name,
      ...(supplier ? { supplierCountry: supplier.country } : {}),
    });
  }

  return (
    <form className="entry-form procurement-form" onSubmit={onSubmit}>
      <Field label="Procurement ID">
        <input value={value.procurementId} onChange={(e) => onChange({ ...value, procurementId: e.target.value })} required />
      </Field>
      <Field label="Vehicle Brand">
        <input value={value.vehicleBrand} onChange={(e) => onChange({ ...value, vehicleBrand: e.target.value })} required />
      </Field>
      <Field label="Vehicle Model">
        <input value={value.vehicleModel} onChange={(e) => onChange({ ...value, vehicleModel: e.target.value })} required />
      </Field>
      <Field label="Quantity">
        <FormattedNumberInput min={1} value={value.quantity} onChange={(nextValue) => onChange({ ...value, quantity: nextValue })} />
      </Field>
      <Field label="Supplier Name">
        <input list="supplier-list" value={value.supplierName} onChange={(e) => applySupplier(e.target.value)} required />
        <datalist id="supplier-list">
          {suppliers.map((supplier) => <option key={supplier.id} value={supplier.supplierName} />)}
        </datalist>
      </Field>
      <Field label="Supplier Country">
        <input value={value.supplierCountry} onChange={(e) => onChange({ ...value, supplierCountry: e.target.value })} />
      </Field>
      <Field label="Estimated Purchase Cost">
        <FormattedNumberInput value={value.estimatedPurchaseCost} onChange={(nextValue) => onChange({ ...value, estimatedPurchaseCost: nextValue })} />
      </Field>
      <Field label="Estimated Freight Cost">
        <FormattedNumberInput value={value.estimatedFreightCost} onChange={(nextValue) => onChange({ ...value, estimatedFreightCost: nextValue })} />
      </Field>
      <Field label="Requested By">
        <input value={value.requestedBy} onChange={(e) => onChange({ ...value, requestedBy: e.target.value })} />
      </Field>
      <Field label="Status">
        <select value={value.status} onChange={(e) => onChange({ ...value, status: e.target.value })}>
          {procurementStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </Field>
      <Field label="Notes">
        <textarea value={value.notes} onChange={(e) => onChange({ ...value, notes: e.target.value })} />
      </Field>
      <div className="form-actions">
        <button type="submit">{editingId ? 'Save request' : 'Create request'}</button>
        {editingId && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function SupplierForm({ value, onChange, onSubmit, editingId, onCancel }) {
  return (
    <form className="entry-form supplier-form" onSubmit={onSubmit}>
      <Field label="Supplier Name">
        <input value={value.supplierName} onChange={(e) => onChange({ ...value, supplierName: e.target.value })} required />
      </Field>
      <Field label="Country">
        <input value={value.country} onChange={(e) => onChange({ ...value, country: e.target.value })} />
      </Field>
      <Field label="Contact Person">
        <input value={value.contactPerson} onChange={(e) => onChange({ ...value, contactPerson: e.target.value })} />
      </Field>
      <Field label="Phone">
        <input value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value })} />
      </Field>
      <Field label="Email">
        <input type="email" value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })} />
      </Field>
      <Field label="Notes">
        <textarea value={value.notes} onChange={(e) => onChange({ ...value, notes: e.target.value })} />
      </Field>
      <div className="form-actions">
        <button type="submit">{editingId ? 'Save supplier' : 'Add supplier'}</button>
        {editingId && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function StatusBadge({ status }) {
  return <span className={`status status-${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>;
}

function PrivacyPolicy() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Privacy Policy | Velora Tracker';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="privacy-page">
      <div className="privacy-shell">
        <header className="privacy-header">
          <a className="privacy-brand brand-mark" href="/" aria-label="Return to Velora Tracker">
            <span>VM</span>
            <div>
              <strong>Velora Motors</strong>
              <small>Tracker</small>
            </div>
          </a>
          <a className="privacy-home-link" href="/">
            <ChevronLeft size={17} />
            Back to homepage
          </a>
        </header>

        <article className="privacy-document">
          <div className="privacy-hero">
            <div className="privacy-icon"><ShieldCheck size={28} /></div>
            <p className="eyebrow">Velora Tracker</p>
            <h1>Privacy Policy</h1>
            <p>
              This policy explains how Velora Motors collects, uses, and protects
              information when you use the Velora Tracker operations platform.
            </p>
          </div>

          <div className="privacy-content">
            <section>
              <h2>Information we collect</h2>
              <p>
                Velora Tracker collects account information necessary to authenticate
                users and operate the platform. This may include your name, email
                address, assigned role, authentication identifiers, and information
                you enter while using Velora Tracker.
              </p>
            </section>

            <section>
              <h2>How we use information</h2>
              <p>
                We use this information to provide secure account access, apply
                role-based permissions, maintain business records, support platform
                functionality, troubleshoot issues, and protect Velora Motors&apos;
                systems and data.
              </p>
            </section>

            <section>
              <h2>Authentication providers</h2>
              <p>
                Users may sign in with email and password, Google OAuth, or Microsoft
                OAuth. When you use Google or Microsoft sign-in, those providers
                process authentication information under their own privacy policies
                and share the account details needed to complete sign-in.
              </p>
            </section>

            <section>
              <h2>Supabase services</h2>
              <p>
                Velora Tracker uses Supabase as its authentication and database
                provider. Account and operational data may be stored and processed
                through Supabase infrastructure to provide the platform&apos;s core
                services.
              </p>
            </section>

            <section>
              <h2>Data sharing and sale</h2>
              <p>
                Velora Motors does not sell user data to third parties. Information
                may be shared with service providers only where necessary to operate,
                secure, or support Velora Tracker, or where disclosure is required by
                law.
              </p>
            </section>

            <section>
              <h2>Data security and retention</h2>
              <p>
                We use reasonable administrative and technical safeguards designed
                to protect user information. Data is retained for as long as needed
                to operate Velora Tracker, meet legitimate business requirements,
                and comply with applicable obligations.
              </p>
            </section>

            <section>
              <h2>Your privacy questions</h2>
              <p>
                Users may contact Velora Motors through its official business contact
                channels to ask questions, raise privacy concerns, or request
                assistance regarding their personal information.
              </p>
            </section>

            <section className="privacy-effective-date">
              <h2>Effective Date</h2>
              <p>June 19, 2026</p>
            </section>
          </div>
        </article>

        <footer className="privacy-footer">
          <span>&copy; 2026 Velora Motors. All rights reserved.</span>
          <a href="/">Return to Velora Tracker</a>
        </footer>
      </div>
    </main>
  );
}

function AuthView({ authError }) {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Inventory Manager',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState(() => {
    const pendingError = window.sessionStorage.getItem(pendingAuthErrorKey);
    if (pendingError) window.sessionStorage.removeItem(pendingAuthErrorKey);
    return pendingError || authError;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittingProvider, setSubmittingProvider] = useState('');

  useEffect(() => {
    if (authError) setError(authError);
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

  async function continueWithProvider(provider) {
    setError('');
    setMessage('');

    if (!isSupabaseConfigured) {
      setError(supabaseConfigError);
      return;
    }

    setSubmittingProvider(provider);
    window.localStorage.setItem(pendingOAuthRoleKey, form.role);

    try {
      const { error: providerError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          ...(provider === 'google'
            ? { queryParams: { prompt: 'select_account' } }
            : {}),
        },
      });
      if (providerError) throw providerError;
    } catch (requestError) {
      window.localStorage.removeItem(pendingOAuthRoleKey);
      const providerName = provider === 'google' ? 'Google' : 'Microsoft';
      const providerDisabled = requestError.code === 'validation_failed'
        && requestError.message?.toLowerCase().includes('provider is not enabled');
      setError(providerDisabled
        ? `${providerName} sign-in is not enabled in Supabase yet. Enable ${providerName} under Authentication > Providers and add its OAuth credentials.`
        : requestError.message || `Could not continue with ${providerName}.`);
      setSubmittingProvider('');
    }
  }

  async function submitAuth(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!isSupabaseConfigured) {
      setError(supabaseConfigError);
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
      async function roleAlreadyAssigned(role) {
        if (!exclusiveRoles.includes(role)) return false;
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', role);
        if (countError) return false;
        return Number(count) > 0;
      }

      if (mode === 'signin') {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInError) throw signInError;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', signInData.user.id)
          .maybeSingle();
        if (profileData?.role && normalizeRole(profileData.role) !== form.role) {
          await supabase.auth.signOut();
          throw new Error(`This account is registered as ${profileData.role}. Please select that role to sign in.`);
        }
        if (!profileData) {
          if (await roleAlreadyAssigned(form.role)) {
            await supabase.auth.signOut();
            throw new Error(`${form.role} is already assigned to another account.`);
          }
          await supabase.from('profiles').insert({
            id: signInData.user.id,
            full_name: userName(signInData.user),
            email: signInData.user.email,
            role: form.role,
          });
        }
      }

      if (mode === 'signup') {
        if (await roleAlreadyAssigned(form.role)) {
          throw new Error(`${form.role} is already assigned. Please choose another role or ask the CEO to update access.`);
        }
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.fullName, role: form.role },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;
        if (signUpData.user && signUpData.session) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: signUpData.user.id,
            full_name: form.fullName,
            email: form.email,
            role: form.role,
          });
          if (profileError) throw profileError;
        }
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
          {mode !== 'forgot' && (
            <Field label="Role">
              <select value={form.role} onChange={(e) => updateField('role', e.target.value)}>
                {roleOptions.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
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
        {mode !== 'forgot' && (
          <>
            <div className="auth-divider"><span>or continue with</span></div>
            <div className="oauth-actions">
              <button
                type="button"
                className="oauth-button"
                onClick={() => continueWithProvider('google')}
                disabled={Boolean(submittingProvider)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z" />
                  <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z" />
                  <path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.53l3.35-2.61Z" />
                  <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z" />
                </svg>
                {submittingProvider === 'google' ? 'Opening Google...' : 'Google'}
              </button>
              <button
                type="button"
                className="oauth-button"
                onClick={() => continueWithProvider('azure')}
                disabled={Boolean(submittingProvider)}
              >
                <svg className="microsoft-mark" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
                  <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
                  <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
                  <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
                </svg>
                {submittingProvider === 'azure' ? 'Opening Microsoft...' : 'Continue with Microsoft'}
              </button>
            </div>
            <p className="oauth-role-note">
              New social accounts will be created as <strong>{form.role}</strong>. Existing accounts keep their saved role.
            </p>
          </>
        )}
        <div className="auth-links">
          {mode !== 'signin' && <button onClick={() => setMode('signin')}>Back to sign in</button>}
          {mode !== 'signup' && <button onClick={() => setMode('signup')}>Create account</button>}
          {mode !== 'forgot' && <button onClick={() => setMode('forgot')}>Forgot password?</button>}
        </div>
        <section className="auth-downloads" aria-labelledby="downloads-title">
          <div className="auth-downloads-heading">
            <div>
              <p className="eyebrow">Desktop and mobile</p>
              <h2 id="downloads-title">Downloads</h2>
            </div>
            <Download size={19} />
          </div>
          <div className="download-list">
            <a href="/downloads/VeloraTracker-1.0.0.msi" download>
              <span className="download-platform-icon"><Laptop size={18} /></span>
              <span>
                <strong>Download for Windows</strong>
                <small>MSI installer</small>
              </span>
              <Download className="download-action-icon" size={17} />
            </a>
            <a href="/downloads/VeloraTracker-1.0.0-setup.exe" download>
              <span className="download-platform-icon"><Laptop size={18} /></span>
              <span>
                <strong>Download for Windows</strong>
                <small>Setup EXE</small>
              </span>
              <Download className="download-action-icon" size={17} />
            </a>
            <a href="/downloads/VeloraTracker-1.0.0.apk" download>
              <span className="download-platform-icon"><Smartphone size={18} /></span>
              <span>
                <strong>Download for Android</strong>
                <small>APK package</small>
              </span>
              <Download className="download-action-icon" size={17} />
            </a>
          </div>
        </section>
        <a className="auth-privacy-link" href="/privacy">Privacy Policy</a>
      </section>
    </main>
  );
}

function LogisticsPartnerForm({ value, onChange, onSubmit, editingId, onCancel }) {
  return (
    <form className="entry-form supplier-form" onSubmit={onSubmit}>
      <Field label="Partner Name">
        <input value={value.partnerName} onChange={(e) => onChange({ ...value, partnerName: e.target.value })} required />
      </Field>
      <Field label="Country">
        <input value={value.country} onChange={(e) => onChange({ ...value, country: e.target.value })} />
      </Field>
      <Field label="Contact Person">
        <input value={value.contactPerson} onChange={(e) => onChange({ ...value, contactPerson: e.target.value })} />
      </Field>
      <Field label="Phone">
        <input value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value })} />
      </Field>
      <Field label="Email">
        <input type="email" value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })} />
      </Field>
      <Field label="Service Type">
        <input value={value.serviceType} onChange={(e) => onChange({ ...value, serviceType: e.target.value })} placeholder="Freight, customs, port handling..." />
      </Field>
      <Field label="Notes">
        <textarea value={value.notes} onChange={(e) => onChange({ ...value, notes: e.target.value })} />
      </Field>
      <div className="form-actions">
        <button type="submit">{editingId ? 'Save partner' : 'Add partner'}</button>
        {editingId && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function Dashboard({ vehicles, orders, customers, shipments, procurementRequests, suppliers, orderTimelines, setActivePage, error, authError, healthEvents }) {
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
      activeProcurements: procurementRequests.filter((request) => request.status !== 'Added To Inventory').length,
      procurementValue: procurementRequests.reduce((sum, request) => sum + procurementValue(request), 0),
      incomingInventory: procurementRequests.filter((request) => request.status !== 'Added To Inventory').reduce((sum, request) => sum + numberValue(request.quantity), 0),
    };
  }, [vehicles, orders, shipments, procurementRequests]);

  const recentOrders = orders.slice(0, 4);
  const revenueTrend = trendByMonth(orders, 'orderDate', orderRevenue);
  const profitTrend = trendByMonth(orders, 'orderDate', orderProfit);
  const shipmentBreakdown = countByStatus(shipments);
  const alerts = useMemo(() => createAlerts({ vehicles, orders, customers, shipments, orderTimelines, procurementRequests, suppliers }), [vehicles, orders, customers, shipments, orderTimelines, procurementRequests, suppliers]);
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
        <Metric label="Active procurements" value={totals.activeProcurements} icon={ClipboardList} />
        <Metric label="Procurement value" value={money.format(totals.procurementValue)} tone="accent" icon={BarChart3} />
        <Metric label="Incoming inventory" value={totals.incomingInventory} tone="success" icon={Warehouse} />
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
        <section className="chart-card dashboard-half-card shipment-breakdown-card">
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
        <section className="chart-card dashboard-half-card alert-watchlist-card">
          <div className="card-heading alert-heading">
            <div>
              <p className="eyebrow">Critical alerts</p>
              <h2>Priority watchlist</h2>
            </div>
            <button className="mini view-all-button" onClick={() => setActivePage('Alerts Center')}>View all</button>
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
        <section className="activity-card audit-feed-card">
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
        <section className="activity-card audit-feed-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Recent audit logs</p>
              <h2>Governance feed</h2>
            </div>
            <button className="mini open-logs-button" onClick={() => setActivePage('Audit Logs')}>Open logs</button>
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
        <SystemHealthPanel vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} error={error} authError={authError} healthEvents={healthEvents} />
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

function Inventory({ vehicles, saveVehicle, deleteVehicle, canEdit, canDelete }) {
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const nextVehicleId = useMemo(() => nextDisplayId(vehicles, 'id'), [vehicles]);
  const newVehicleForm = useMemo(() => ({ ...blankVehicle, id: nextVehicleId }), [nextVehicleId]);
  const [form, setForm] = useState(newVehicleForm);
  const [editingId, setEditingId] = useState('');
  const filtered = vehicles.filter((vehicle) => {
    const locationMatches = locationFilter === 'All' || vehicle.locationName === locationFilter;
    return locationMatches && matchesSearch(vehicle, query);
  });
  const table = useTableView(filtered, { initialSortKey: 'id' });

  async function submitVehicle(event) {
    event.preventDefault();
    const saved = {
      ...form,
      quantity: numberValue(form.quantity),
      purchasePrice: numberValue(form.purchasePrice),
      sellingPrice: numberValue(form.sellingPrice),
    };
    await saveVehicle(saved, editingId);
    setForm(newVehicleForm);
    setEditingId('');
  }

  useEffect(() => {
    if (!editingId) setForm(newVehicleForm);
  }, [newVehicleForm, editingId]);

  function editVehicle(vehicle) {
    setForm(vehicle);
    setEditingId(vehicle.id);
  }

  async function confirmDeleteVehicle(vehicle) {
    const approved = await confirm({
      title: 'Delete vehicle record?',
      message: `${vehicle.brand} ${vehicle.model} (${vehicle.id}) will be permanently removed from inventory.`,
      confirmLabel: 'Delete vehicle',
    });
    if (approved) await deleteVehicle(vehicle.id);
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
          <TableSortControl table={table} options={[
            { value: 'id', label: 'Vehicle ID' },
            { value: 'brand', label: 'Brand' },
            { value: 'model', label: 'Model' },
            { value: 'quantity', label: 'Quantity' },
            { value: 'status', label: 'Status' },
          ]} />
        </div>
      </PageHeader>
      {canEdit && <VehicleForm value={form} onChange={setForm} onSubmit={submitVehicle} editingId={editingId} onCancel={() => { setForm(newVehicleForm); setEditingId(''); }} />}
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
            {table.rows.map((vehicle) => (
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
                  {canEdit && <button className="mini" onClick={() => editVehicle(vehicle)}>Edit</button>}
                  {canDelete && <button className="mini danger" onClick={() => confirmDeleteVehicle(vehicle)}>Delete</button>}
                  {!canEdit && !canDelete && <span className="locked-label">Locked</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No vehicles found." />}
        <TableFooter count={table.count} page={table.page} totalPages={table.totalPages} firstItem={table.firstItem} lastItem={table.lastItem} onPageChange={table.setPage} />
      </div>
    </section>
  );
}

function Procurement({ procurementRequests, suppliers, procurementTimelines, saveProcurementRequest, deleteProcurementRequest, addProcurementTimelineNote, saveSupplier, deleteSupplier, canEdit, canDelete }) {
  const confirm = useConfirm();
  const nextId = useMemo(() => nextProcurementId(procurementRequests), [procurementRequests]);
  const newRequestForm = useMemo(() => ({ ...blankProcurementRequest, procurementId: nextId }), [nextId]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [requestForm, setRequestForm] = useState(newRequestForm);
  const [editingRequestId, setEditingRequestId] = useState('');
  const [supplierForm, setSupplierForm] = useState(blankSupplier);
  const [editingSupplierId, setEditingSupplierId] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [timelineNote, setTimelineNote] = useState('');

  useEffect(() => {
    if (!editingRequestId) setRequestForm(newRequestForm);
  }, [newRequestForm, editingRequestId]);

  const filtered = procurementRequests.filter((request) => {
    const statusMatches = statusFilter === 'All' || request.status === statusFilter;
    return statusMatches && matchesSearch(request, query);
  });
  const requestTable = useTableView(filtered, { initialSortKey: 'procurementId' });
  const supplierTable = useTableView(suppliers, { initialSortKey: 'supplierName' });
  const totals = {
    active: procurementRequests.filter((request) => request.status !== 'Added To Inventory').length,
    value: procurementRequests.reduce((sum, request) => sum + procurementValue(request), 0),
    pendingApprovals: procurementRequests.filter((request) => ['Requested', 'Supplier Identified', 'Negotiation'].includes(request.status)).length,
    inTransit: procurementRequests.filter((request) => request.status === 'In Transit').length,
    incomingInventory: procurementRequests.filter((request) => request.status !== 'Added To Inventory').reduce((sum, request) => sum + numberValue(request.quantity), 0),
  };

  async function submitRequest(event) {
    event.preventDefault();
    await saveProcurementRequest(requestForm, editingRequestId);
    setRequestForm(newRequestForm);
    setEditingRequestId('');
  }

  async function submitSupplier(event) {
    event.preventDefault();
    await saveSupplier(supplierForm, editingSupplierId);
    setSupplierForm(blankSupplier);
    setEditingSupplierId('');
  }

  async function submitTimelineNote(event, procurementId) {
    event.preventDefault();
    if (!timelineNote.trim()) return;
    await addProcurementTimelineNote(procurementId, timelineNote.trim());
    setTimelineNote('');
  }

  async function confirmDeleteProcurement(request) {
    const approved = await confirm({
      title: 'Delete procurement request?',
      message: `${request.procurementId} and its operational record will be permanently removed.`,
      confirmLabel: 'Delete request',
    });
    if (approved) await deleteProcurementRequest(request.procurementId);
  }

  async function confirmDeleteSupplier(supplier) {
    const approved = await confirm({
      title: 'Delete supplier?',
      message: `${supplier.supplierName} will be permanently removed from the supplier directory.`,
      confirmLabel: 'Delete supplier',
    });
    if (approved) await deleteSupplier(supplier.id);
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Procurement" title="Vehicle acquisition" description="Track sourcing, supplier negotiation, purchase progress, and incoming inventory before stock entry.">
        <div className="toolbar">
          <input className="search" placeholder="Search procurement" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            {procurementStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <TableSortControl table={requestTable} options={[
            { value: 'procurementId', label: 'Procurement ID' },
            { value: 'vehicleBrand', label: 'Vehicle brand' },
            { value: 'supplierName', label: 'Supplier' },
            { value: 'quantity', label: 'Quantity' },
            { value: 'status', label: 'Status' },
          ]} />
        </div>
      </PageHeader>
      <div className="metrics-grid reports-summary">
        <Metric label="Active procurements" value={totals.active} icon={ClipboardList} />
        <Metric label="Procurement value" value={money.format(totals.value)} tone="accent" icon={BarChart3} />
        <Metric label="Pending approvals" value={totals.pendingApprovals} tone="danger" icon={ShieldCheck} />
        <Metric label="Incoming inventory" value={totals.incomingInventory} tone="success" icon={Warehouse} />
      </div>
      {canEdit && <ProcurementRequestForm value={requestForm} onChange={setRequestForm} onSubmit={submitRequest} editingId={editingRequestId} suppliers={suppliers} onCancel={() => { setRequestForm(newRequestForm); setEditingRequestId(''); }} />}
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Procurement ID</th>
              <th>Vehicle</th>
              <th>Qty</th>
              <th>Supplier</th>
              <th>Country</th>
              <th>Purchase Cost</th>
              <th>Freight Cost</th>
              <th>Total Value</th>
              <th>Requested By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requestTable.rows.map((request) => (
              <React.Fragment key={request.procurementId}>
                <tr>
                  <td>{request.procurementId}</td>
                  <td>{request.vehicleBrand} {request.vehicleModel}</td>
                  <td>{request.quantity}</td>
                  <td>{request.supplierName}</td>
                  <td>{request.supplierCountry}</td>
                  <td>{money.format(request.estimatedPurchaseCost)}</td>
                  <td>{money.format(request.estimatedFreightCost)}</td>
                  <td>{money.format(procurementValue(request))}</td>
                  <td>{request.requestedBy}</td>
                  <td><StatusBadge status={request.status} /></td>
                  <td className="row-actions">
                    <button className="mini" onClick={() => setExpandedId(expandedId === request.procurementId ? '' : request.procurementId)}>{expandedId === request.procurementId ? 'Hide timeline' : 'Timeline'}</button>
                    {canEdit && <button className="mini" onClick={() => { setRequestForm(request); setEditingRequestId(request.procurementId); }}>Edit</button>}
                    {canDelete && <button className="mini danger" onClick={() => confirmDeleteProcurement(request)}>Delete</button>}
                  </td>
                </tr>
                {expandedId === request.procurementId && (
                  <tr className="timeline-row">
                    <td colSpan="11">
                      <div className="timeline-panel">
                        <div className="timeline-track">
                          {procurementStatuses.map((status) => {
                            const event = (procurementTimelines[request.procurementId] || []).find((item) => item.status === status);
                            return (
                              <div key={status} className={`timeline-step ${event ? 'complete' : ''} ${request.status === status ? 'current' : ''}`}>
                                <span className="timeline-dot" />
                                <div>
                                  <strong>{status}</strong>
                                  <small>{event ? new Date(event.createdAt).toLocaleString() : 'Pending'}</small>
                                  {event?.note && <p>{event.note}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {canEdit && (
                          <form className="timeline-note-form" onSubmit={(event) => submitTimelineNote(event, request.procurementId)}>
                            <input placeholder="Add procurement note" value={timelineNote} onChange={(event) => setTimelineNote(event.target.value)} />
                            <button type="submit">Add note</button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No procurement requests found." icon={ClipboardList} />}
        <TableFooter count={requestTable.count} page={requestTable.page} totalPages={requestTable.totalPages} firstItem={requestTable.firstItem} lastItem={requestTable.lastItem} onPageChange={requestTable.setPage} />
      </div>
      <PageHeader eyebrow="Suppliers" title="Supplier management" description="Maintain sourcing partners and their contact details for procurement follow-up." />
      <div className="table-toolbar">
        <TableSortControl table={supplierTable} options={[
          { value: 'supplierName', label: 'Supplier name' },
          { value: 'country', label: 'Country' },
          { value: 'contactPerson', label: 'Contact person' },
        ]} />
      </div>
      {canEdit && <SupplierForm value={supplierForm} onChange={setSupplierForm} onSubmit={submitSupplier} editingId={editingSupplierId} onCancel={() => { setSupplierForm(blankSupplier); setEditingSupplierId(''); }} />}
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Country</th>
              <th>Contact</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {supplierTable.rows.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.supplierName}</td>
                <td>{supplier.country}</td>
                <td>{supplier.contactPerson}</td>
                <td>{supplier.phone}</td>
                <td>{supplier.email}</td>
                <td>{supplier.notes}</td>
                <td className="row-actions">
                  {canEdit && <button className="mini" onClick={() => { setSupplierForm(supplier); setEditingSupplierId(supplier.id); }}>Edit</button>}
                  {canDelete && <button className="mini danger" onClick={() => confirmDeleteSupplier(supplier)}>Delete</button>}
                  {!canEdit && !canDelete && <span className="locked-label">Locked</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!suppliers.length && <EmptyState label="No suppliers saved yet." icon={Users} />}
        <TableFooter count={supplierTable.count} page={supplierTable.page} totalPages={supplierTable.totalPages} firstItem={supplierTable.firstItem} lastItem={supplierTable.lastItem} onPageChange={supplierTable.setPage} />
      </div>
    </section>
  );
}

function Orders({ orders, saveOrder, deleteOrder, updateOrderStatus, vehicles, customers, orderTimelines, addOrderTimelineNote, canEdit, canDelete }) {
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const nextNumber = useMemo(() => nextOrderNumber(orders), [orders]);
  const newOrderForm = useMemo(() => ({ ...blankOrder, orderNumber: nextNumber }), [nextNumber]);
  const [form, setForm] = useState(newOrderForm);
  const [editingId, setEditingId] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState('');
  const filtered = orders.filter((order) => {
    const locationMatches = locationFilter === 'All' || order.locationName === locationFilter;
    return locationMatches && matchesSearch(order, query);
  });
  const table = useTableView(filtered, { initialSortKey: 'orderNumber' });

  async function submitOrder(event) {
    event.preventDefault();
    const saved = {
      ...form,
      quantity: numberValue(form.quantity),
      purchaseCost: numberValue(form.purchaseCost),
      sellingPrice: numberValue(form.sellingPrice),
    };
    await saveOrder(saved, editingId);
    setForm(newOrderForm);
    setEditingId('');
  }

  function generateInvoice(order) {
    const customer = customers.find((item) => item.name.trim().toLowerCase() === order.customerName.trim().toLowerCase());
    generateOrderInvoice(order, customer);
  }

  async function confirmDeleteOrder(order) {
    const approved = await confirm({
      title: 'Delete order?',
      message: `Order ${order.orderNumber} for ${order.customerName} will be permanently removed.`,
      confirmLabel: 'Delete order',
    });
    if (approved) await deleteOrder(order.id);
  }

  async function importOrders(rows) {
    let imported = 0;
    const workingOrders = [...orders];
    for (const row of rows) {
      const vehicleName = csvValue(row, 'vehicle');
      const quantity = Math.max(numberValue(csvValue(row, 'quantity', 1)), 1);
      const inventoryVehicle = vehicles.find((vehicle) => `${vehicle.brand} ${vehicle.model}`.trim().toLowerCase() === vehicleName.trim().toLowerCase());
      const purchaseCost = csvValue(row, ['purchase_cost', 'purchase_price'])
        || (inventoryVehicle ? inventoryVehicle.purchasePrice * quantity : 0);
      const sellingPrice = csvValue(row, ['selling_price', 'sale_price', 'quoted_price'])
        || (inventoryVehicle ? inventoryVehicle.sellingPrice * quantity : 0);
      const order = {
        ...blankOrder,
        orderNumber: csvValue(row, ['order_number', 'order_id']) || nextOrderNumber(workingOrders),
        customerName: csvValue(row, ['customer_name', 'customer']),
        vehicle: vehicleName,
        quantity,
        orderDate: csvValue(row, ['order_date', 'date'], today),
        purchaseCost: numberValue(purchaseCost),
        sellingPrice: numberValue(sellingPrice),
        status: normalizeCsvStatus(csvValue(row, 'status'), orderStatuses, 'Inquiry'),
        locationName: csvValue(row, ['location_name', 'location'], 'Seoul HQ'),
      };
      if (!order.customerName || !order.vehicle) continue;
      const saved = await saveOrder(order, '');
      workingOrders.push(saved || order);
      imported += 1;
    }
    return imported;
  }

  useEffect(() => {
    if (!editingId) setForm(newOrderForm);
  }, [newOrderForm, editingId]);

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Orders" title="Customer orders" description="Manage customer demand, pricing, workflow status, and order timelines.">
        <div className="toolbar">
          <input className="search" placeholder="Search orders" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
            <option>All</option>
            {locationOptions.map((location) => <option key={location}>{location}</option>)}
          </select>
          <TableSortControl table={table} options={[
            { value: 'orderNumber', label: 'Order number' },
            { value: 'customerName', label: 'Customer' },
            { value: 'orderDate', label: 'Order date' },
            { value: 'status', label: 'Status' },
            { value: 'sellingPrice', label: 'Selling price' },
          ]} />
        </div>
      </PageHeader>
      {canEdit && <OrderForm value={form} onChange={setForm} onSubmit={submitOrder} editingId={editingId} vehicleOptions={vehicles} customerOptions={customers} onCancel={() => { setForm(newOrderForm); setEditingId(''); }} />}
      {canEdit && (
        <CsvImportPanel
          title="Import orders"
          description="Bulk-create order records from a CSV file. Missing prices can be filled from inventory when vehicle names match."
          sampleHeaders="order_number,customer_name,vehicle,quantity,order_date,purchase_cost,selling_price,status,location_name"
          onImport={importOrders}
        />
      )}
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
            {table.rows.map((order) => (
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
                    {canEdit ? (
                      <select className="status-select" value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)}>
                        {orderStatuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    ) : <StatusBadge status={order.status} />}
                  </td>
                  <td className="row-actions">
                    <button className="mini invoice-action" onClick={() => generateInvoice(order)}>Invoice</button>
                    <button className="mini" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? '' : order.id)}>
                      {expandedOrderId === order.id ? 'Hide timeline' : 'Timeline'}
                    </button>
                    {canEdit && <button className="mini" onClick={() => { setForm(order); setEditingId(order.id); }}>Edit</button>}
                    {canDelete && <button className="mini danger" onClick={() => confirmDeleteOrder(order)}>Delete</button>}
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
        <TableFooter count={table.count} page={table.page} totalPages={table.totalPages} firstItem={table.firstItem} lastItem={table.lastItem} onPageChange={table.setPage} />
      </div>
    </section>
  );
}

function Quotes({ quotes, saveQuote, deleteQuote, vehicles, customers, canEdit, canDelete }) {
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const nextId = useMemo(() => nextQuoteId(quotes), [quotes]);
  const newQuoteForm = useMemo(() => ({ ...blankQuote, quoteId: nextId }), [nextId]);
  const [form, setForm] = useState(newQuoteForm);
  const [editingId, setEditingId] = useState('');
  const filtered = quotes.filter((quote) => {
    const statusMatches = statusFilter === 'All' || quote.status === statusFilter;
    const locationMatches = locationFilter === 'All' || quote.locationName === locationFilter;
    return statusMatches && locationMatches && matchesSearch(quote, query);
  });
  const table = useTableView(filtered, { initialSortKey: 'quoteId' });

  async function submitQuote(event) {
    event.preventDefault();
    const saved = {
      ...form,
      quantity: numberValue(form.quantity),
      purchaseCost: numberValue(form.purchaseCost),
      sellingPrice: numberValue(form.sellingPrice),
    };
    await saveQuote(saved, editingId);
    setForm(newQuoteForm);
    setEditingId('');
  }

  function quoteCustomer(quote) {
    return customers.find((item) => item.name.trim().toLowerCase() === quote.customerName.trim().toLowerCase());
  }

  async function confirmDeleteQuote(quote) {
    const approved = await confirm({
      title: 'Delete quote?',
      message: `${quote.quoteId} for ${quote.customerName} will be permanently removed.`,
      confirmLabel: 'Delete quote',
    });
    if (approved) await deleteQuote(quote.quoteId);
  }

  useEffect(() => {
    if (!editingId) setForm(newQuoteForm);
  }, [newQuoteForm, editingId]);

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Quotes" title="Customer quotations" description="Prepare proforma quotes before converting customer interest into confirmed orders.">
        <div className="toolbar">
          <input className="search" placeholder="Search quotes" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="status-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            {quoteStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
            <option>All</option>
            {locationOptions.map((location) => <option key={location}>{location}</option>)}
          </select>
          <TableSortControl table={table} options={[
            { value: 'quoteId', label: 'Quote ID' },
            { value: 'customerName', label: 'Customer' },
            { value: 'validUntil', label: 'Valid until' },
            { value: 'status', label: 'Status' },
            { value: 'sellingPrice', label: 'Quoted price' },
          ]} />
        </div>
      </PageHeader>
      {canEdit && <QuoteForm value={form} onChange={setForm} onSubmit={submitQuote} editingId={editingId} vehicleOptions={vehicles} customerOptions={customers} onCancel={() => { setForm(newQuoteForm); setEditingId(''); }} />}
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Quote ID</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Qty</th>
              <th>Valid Until</th>
              <th>Purchase Cost</th>
              <th>Quoted Price</th>
              <th>Profit</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((quote) => (
              <tr key={quote.quoteId}>
                <td>{quote.quoteId}</td>
                <td>{quote.customerName}</td>
                <td>{quote.vehicle}</td>
                <td>{quote.quantity}</td>
                <td>{quote.validUntil}</td>
                <td>{money.format(quote.purchaseCost)}</td>
                <td>{money.format(quoteTotal(quote))}</td>
                <td>{money.format(quoteProfit(quote))}</td>
                <td><StatusBadge status={quote.status} /></td>
                <td>{quote.notes}</td>
                <td className="row-actions">
                  <button className="mini invoice-action" onClick={() => generateQuotePdf(quote, quoteCustomer(quote))}>Quote PDF</button>
                  {canEdit && <button className="mini" onClick={() => { setForm(quote); setEditingId(quote.quoteId); }}>Edit</button>}
                  {canDelete && <button className="mini danger" onClick={() => confirmDeleteQuote(quote)}>Delete</button>}
                  {!canEdit && !canDelete && <span className="locked-label">Locked</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No quotes found." icon={FileText} />}
        <TableFooter count={table.count} page={table.page} totalPages={table.totalPages} firstItem={table.firstItem} lastItem={table.lastItem} onPageChange={table.setPage} />
      </div>
    </section>
  );
}

function Customers({ customers, saveCustomer, deleteCustomer, canEdit, canDelete }) {
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(blankCustomer);
  const [editingId, setEditingId] = useState('');
  const filtered = customers.filter((customer) => matchesSearch(customer, query));
  const table = useTableView(filtered, { initialSortKey: 'name' });

  async function submitCustomer(event) {
    event.preventDefault();
    const saved = { ...form, id: editingId || `CUS-${Date.now().toString().slice(-5)}` };
    await saveCustomer(saved, editingId);
    setForm(blankCustomer);
    setEditingId('');
  }

  async function importCustomers(rows) {
    let imported = 0;
    const workingCustomers = [...customers];

    for (const row of rows) {
      const requestedId = csvValue(row, ['customer_id', 'id']);
      const generatedId = nextCustomerId(workingCustomers);
      const customerId = requestedId
        && !workingCustomers.some((customer) => customer.id === requestedId)
        ? requestedId
        : generatedId;
      const customer = {
        ...blankCustomer,
        id: customerId,
        name: csvValue(row, ['customer_name', 'name', 'customer']),
        phone: csvValue(row, ['phone', 'phone_number', 'mobile']),
        email: csvValue(row, ['email', 'email_address']),
        location: csvValue(row, ['country_city', 'country', 'city', 'location']),
        notes: csvValue(row, ['notes', 'note', 'remarks']),
        department: csvValue(row, 'department', 'Sales'),
      };

      if (!customer.name) continue;
      const saved = await saveCustomer(customer, '');
      workingCustomers.push(saved || customer);
      imported += 1;
    }

    return imported;
  }

  async function confirmDeleteCustomer(customer) {
    const approved = await confirm({
      title: 'Delete customer?',
      message: `${customer.name} and their saved contact details will be permanently removed.`,
      confirmLabel: 'Delete customer',
    });
    if (approved) await deleteCustomer(customer.id);
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Customers" title="Customer records" description="Maintain clean buyer contact details, notes, and commercial context.">
        <div className="toolbar">
          <input className="search" placeholder="Search customers" value={query} onChange={(event) => setQuery(event.target.value)} />
          <TableSortControl table={table} options={[
            { value: 'name', label: 'Customer name' },
            { value: 'location', label: 'Country / City' },
            { value: 'email', label: 'Email' },
            { value: 'createdAt', label: 'Created date' },
          ]} />
        </div>
      </PageHeader>
      {canEdit && <CustomerForm value={form} onChange={setForm} onSubmit={submitCustomer} editingId={editingId} onCancel={() => { setForm(blankCustomer); setEditingId(''); }} />}
      {canEdit && (
        <CsvImportPanel
          title="Import customers"
          description="Bulk-create customer records from a CSV file. Customer IDs are generated automatically when omitted or already in use."
          sampleHeaders="customer_id,customer_name,phone,email,country_city,notes,department"
          onImport={importCustomers}
        />
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td>{customer.location}</td>
                <td>{customer.notes}</td>
                <td className="row-actions">
                  {canEdit && <button className="mini" onClick={() => { setForm(customer); setEditingId(customer.id); }}>Edit</button>}
                  {canDelete && <button className="mini danger" onClick={() => confirmDeleteCustomer(customer)}>Delete</button>}
                  {!canEdit && !canDelete && <span className="locked-label">Locked</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No customers found." icon={Users} />}
        <TableFooter count={table.count} page={table.page} totalPages={table.totalPages} firstItem={table.firstItem} lastItem={table.lastItem} onPageChange={table.setPage} />
      </div>
    </section>
  );
}

function Shipments({ shipments, saveShipment, deleteShipment, orders, logisticsPartners = [], saveLogisticsPartner, deleteLogisticsPartner, canEdit, canDelete }) {
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [form, setForm] = useState(blankShipment);
  const [editingId, setEditingId] = useState('');
  const [partnerForm, setPartnerForm] = useState(blankLogisticsPartner);
  const [editingPartnerId, setEditingPartnerId] = useState('');
  const filtered = shipments.filter((shipment) => {
    const statusMatches = statusFilter === 'All' || shipment.status === statusFilter;
    const locationMatches = locationFilter === 'All' || shipment.locationName === locationFilter;
    return statusMatches && locationMatches && matchesSearch(shipment, query);
  });
  const table = useTableView(filtered, { initialSortKey: 'shipmentId' });
  const partnerTable = useTableView(logisticsPartners, { initialSortKey: 'partnerName' });
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

  async function submitPartner(event) {
    event.preventDefault();
    if (!saveLogisticsPartner) return;
    await saveLogisticsPartner(partnerForm, editingPartnerId);
    setPartnerForm(blankLogisticsPartner);
    setEditingPartnerId('');
  }

  async function importShipments(rows) {
    let imported = 0;
    const workingShipments = [...shipments];
    for (const row of rows) {
      const orderReference = csvValue(row, ['linked_order_id', 'order_id', 'order_number']);
      const linkedOrder = orders.find((order) => order.id === orderReference || order.orderNumber === orderReference);
      const shipment = {
        ...blankShipment,
        shipmentId: csvValue(row, ['shipment_id', 'shipment_number']) || nextDisplayId(workingShipments, 'shipmentId'),
        linkedOrderId: linkedOrder?.id || (isUuid(orderReference) ? orderReference : ''),
        customerName: csvValue(row, ['customer_name', 'customer'], linkedOrder?.customerName || ''),
        vehicle: csvValue(row, 'vehicle', linkedOrder?.vehicle || ''),
        quantity: Math.max(numberValue(csvValue(row, 'quantity', linkedOrder?.quantity || 1)), 1),
        destinationCountry: csvValue(row, ['destination_country', 'destination']),
        portOfDeparture: csvValue(row, ['port_of_departure', 'departure_port']),
        portOfArrival: csvValue(row, ['port_of_arrival', 'arrival_port']),
        shippingCompany: csvValue(row, ['shipping_company', 'carrier']),
        freightCost: numberValue(csvValue(row, ['freight_cost', 'freight'])),
        eta: csvValue(row, 'eta', today),
        status: normalizeCsvStatus(csvValue(row, 'status'), shipmentStatuses, 'Preparing'),
        notes: csvValue(row, 'notes'),
        locationName: csvValue(row, ['location_name', 'location'], 'Port Operations Office'),
      };
      if (!shipment.shipmentId || !shipment.customerName || !shipment.vehicle || !shipment.destinationCountry) continue;
      const saved = await saveShipment(shipment, '');
      workingShipments.push(saved || shipment);
      imported += 1;
    }
    return imported;
  }

  async function confirmDeleteShipment(shipment) {
    const approved = await confirm({
      title: 'Delete shipment?',
      message: `Shipment ${shipment.shipmentId} will be permanently removed from tracking.`,
      confirmLabel: 'Delete shipment',
    });
    if (approved) await deleteShipment(shipment.shipmentId);
  }

  async function confirmDeletePartner(partner) {
    const approved = await confirm({
      title: 'Delete logistics partner?',
      message: `${partner.partnerName} will be permanently removed from the partner directory.`,
      confirmLabel: 'Delete partner',
    });
    if (approved) await deleteLogisticsPartner?.(partner.id);
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
          <TableSortControl table={table} options={[
            { value: 'shipmentId', label: 'Shipment ID' },
            { value: 'customerName', label: 'Customer' },
            { value: 'eta', label: 'ETA' },
            { value: 'status', label: 'Status' },
            { value: 'destinationCountry', label: 'Destination' },
          ]} />
        </div>
      </PageHeader>
      {canEdit && <ShipmentForm value={form} onChange={setForm} onSubmit={submitShipment} editingId={editingId} orderOptions={orders} logisticsPartners={logisticsPartners} onCancel={() => { setForm(blankShipment); setEditingId(''); }} />}
      {canEdit && (
        <CsvImportPanel
          title="Import shipments"
          description="Bulk-create shipment records from a CSV file. Use order_number or linked_order_id to connect shipments to orders."
          sampleHeaders="shipment_id,order_number,customer_name,vehicle,quantity,destination_country,port_of_departure,port_of_arrival,shipping_company,freight_cost,eta,status,notes"
          onImport={importShipments}
        />
      )}
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
            {table.rows.map((shipment) => (
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
                  {canEdit && <button className="mini" onClick={() => editShipment(shipment)}>Edit</button>}
                  {canDelete && <button className="mini danger" onClick={() => confirmDeleteShipment(shipment)}>Delete</button>}
                  {!canEdit && !canDelete && <span className="locked-label">Locked</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No shipments found." />}
        <TableFooter count={table.count} page={table.page} totalPages={table.totalPages} firstItem={table.firstItem} lastItem={table.lastItem} onPageChange={table.setPage} />
      </div>
      <PageHeader eyebrow="Logistics partners" title="Partner management" description="Maintain freight forwarders, shipping agents, customs brokers, and port handling contacts." />
      <div className="table-toolbar">
        <TableSortControl table={partnerTable} options={[
          { value: 'partnerName', label: 'Partner name' },
          { value: 'country', label: 'Country' },
          { value: 'serviceType', label: 'Service type' },
        ]} />
      </div>
      {canEdit && <LogisticsPartnerForm value={partnerForm} onChange={setPartnerForm} onSubmit={submitPartner} editingId={editingPartnerId} onCancel={() => { setPartnerForm(blankLogisticsPartner); setEditingPartnerId(''); }} />}
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Partner</th>
              <th>Country</th>
              <th>Contact</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Service Type</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {partnerTable.rows.map((partner) => (
              <tr key={partner.id}>
                <td>{partner.partnerName}</td>
                <td>{partner.country}</td>
                <td>{partner.contactPerson}</td>
                <td>{partner.phone}</td>
                <td>{partner.email}</td>
                <td>{partner.serviceType}</td>
                <td>{partner.notes}</td>
                <td className="row-actions">
                  {canEdit && <button className="mini" onClick={() => { setPartnerForm(partner); setEditingPartnerId(partner.id); }}>Edit</button>}
                  {canDelete && <button className="mini danger" onClick={() => confirmDeletePartner(partner)}>Delete</button>}
                  {!canEdit && !canDelete && <span className="locked-label">Locked</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logisticsPartners.length && <EmptyState label="No logistics partners saved yet." icon={Truck} />}
        <TableFooter count={partnerTable.count} page={partnerTable.page} totalPages={partnerTable.totalPages} firstItem={partnerTable.firstItem} lastItem={partnerTable.lastItem} onPageChange={partnerTable.setPage} />
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

function Reports({ vehicles, orders, customers, shipments, procurementRequests, suppliers }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const filteredOrders = orders.filter((order) => inDateRange(order.orderDate, startDate, endDate));
  const filteredShipments = shipments.filter((shipment) => inDateRange(shipment.eta || shipment.createdAt, startDate, endDate));
  const filteredProcurements = procurementRequests.filter((request) => inDateRange(request.createdAt, startDate, endDate));
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
    procurementValue: filteredProcurements.reduce((sum, request) => sum + procurementValue(request), 0),
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
    {
      title: 'Procurement Report',
      slug: 'velora-procurement-report',
      summary: `${filteredProcurements.length} requests, ${money.format(totals.procurementValue)} estimated value`,
      columns: [
        { key: 'procurementId', label: 'Procurement ID' },
        { key: 'vehicle', label: 'Vehicle' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'supplierName', label: 'Supplier' },
        { key: 'supplierCountry', label: 'Country' },
        { key: 'estimatedPurchaseCost', label: 'Purchase Cost' },
        { key: 'estimatedFreightCost', label: 'Freight Cost' },
        { key: 'totalValue', label: 'Total Value' },
        { key: 'status', label: 'Status' },
      ],
      rows: filteredProcurements.map((request) => ({
        ...request,
        vehicle: `${request.vehicleBrand} ${request.vehicleModel}`,
        estimatedPurchaseCost: money.format(request.estimatedPurchaseCost),
        estimatedFreightCost: money.format(request.estimatedFreightCost),
        totalValue: money.format(procurementValue(request)),
      })),
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
        <Metric label="Procurement value" value={money.format(totals.procurementValue)} />
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

function AiAssistant({
  open,
  onClose,
  onNavigate,
  permissions,
  vehicles,
  orders,
  customers,
  shipments,
  procurementRequests,
  alerts,
}) {
  const confirm = useConfirm();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Ask about current operations, risks, customers, inventory, shipments, or reports. I only use data available to your role.',
    },
  ]);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [loading, setLoading] = useState(false);

  const context = useMemo(() => buildAiContext({
    permissions,
    vehicles,
    orders,
    customers,
    shipments,
    procurementRequests,
    alerts,
  }), [
    permissions,
    vehicles,
    orders,
    customers,
    shipments,
    procurementRequests,
    alerts,
  ]);

  async function askAssistant(prompt) {
    const nextQuestion = String(prompt || question).trim();
    if (!nextQuestion || loading) return;

    setQuestion('');
    setLoading(true);
    setSuggestedActions([]);
    setMessages((current) => [...current, { role: 'user', text: nextQuestion }]);

    try {
      if (!supabase) throw new Error(supabaseConfigError);
      const { data, error: invokeError } = await supabase.functions.invoke('ai-assistant', {
        body: {
          question: nextQuestion,
          context,
        },
      });

      if (invokeError) {
        let detail = invokeError.message;
        try {
          const errorBody = await invokeError.context?.json();
          if (errorBody?.error) detail = errorBody.error;
        } catch {
          // Keep the Supabase function error when no JSON body is available.
        }
        throw new Error(detail || 'The AI assistant request failed.');
      }

      setMessages((current) => [
        ...current,
        { role: 'assistant', text: data?.answer || 'No assistant response was returned.' },
      ]);
      setSuggestedActions(Array.isArray(data?.actions) ? data.actions : []);
    } catch (requestError) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          error: true,
          text: requestError.message || 'The AI assistant could not complete this request.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    askAssistant(question);
  }

  async function reviewAction(action) {
    if (action.requiresConfirmation) {
      const approved = await confirm({
        title: 'Review sensitive AI suggestion?',
        message: 'This suggestion could change or remove company data. No record will be changed automatically; Velora will only open the relevant module.',
        confirmLabel: 'Open for review',
      });
      if (!approved) return;
    }
    onNavigate(action.module);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <button className="ai-backdrop" onClick={onClose} aria-label="Close Velora AI Assistant" />
      <aside className="ai-panel" aria-label="Velora AI Assistant">
        <header className="ai-panel-header">
          <div className="ai-title">
            <span><Sparkles size={19} /></span>
            <div>
              <p className="eyebrow">Secure operations copilot</p>
              <h2>Velora AI Assistant</h2>
            </div>
          </div>
          <button className="ai-close" onClick={onClose} aria-label="Close assistant">
            <X size={19} />
          </button>
        </header>

        <div className="ai-role-notice">
          <ShieldCheck size={16} />
          <span>Using authorized context for <strong>{permissions.role}</strong></span>
        </div>

        <div className="ai-quick-actions">
          {aiQuickPrompts.map((prompt) => (
            <button key={prompt} onClick={() => askAssistant(prompt)} disabled={loading}>
              {prompt}
            </button>
          ))}
        </div>

        <div className="ai-conversation" aria-live="polite">
          {messages.map((message, index) => (
            <div className={`ai-message ${message.role} ${message.error ? 'error' : ''}`} key={`${message.role}-${index}`}>
              <span className="ai-message-icon">
                {message.role === 'assistant' ? <Bot size={16} /> : 'Y'}
              </span>
              <p>{message.text}</p>
            </div>
          ))}
          {loading && (
            <div className="ai-message assistant loading">
              <span className="ai-message-icon"><Bot size={16} /></span>
              <p>Reviewing authorized company data...</p>
            </div>
          )}
        </div>

        {suggestedActions.length > 0 && (
          <div className="ai-suggestions">
            <p className="eyebrow">Suggested actions</p>
            {suggestedActions.map((action, index) => (
              <article key={`${action.title}-${index}`}>
                <div>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                </div>
                <button onClick={() => reviewAction(action)}>
                  {action.requiresConfirmation && <AlertTriangle size={15} />}
                  {action.requiresConfirmation ? 'Review and confirm' : `Open ${action.module}`}
                </button>
              </article>
            ))}
          </div>
        )}

        <form className="ai-composer" onSubmit={handleSubmit}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask Velora AI about company operations..."
            maxLength={1500}
            rows={3}
          />
          <button type="submit" disabled={loading || !question.trim()} aria-label="Send question">
            <Send size={18} />
          </button>
        </form>
        <small className="ai-disclaimer">
          Suggestions can be incomplete. Review operational and financial decisions before acting.
        </small>
      </aside>
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-label="Loading Velora records" aria-busy="true">
      <div className="skeleton-line wide" />
      <div className="skeleton-metrics">
        {Array.from({ length: 4 }, (_, index) => <div className="skeleton-card" key={index} />)}
      </div>
      <div className="skeleton-panel">
        <div className="skeleton-line" />
        <div className="skeleton-line medium" />
        <div className="skeleton-line short" />
      </div>
    </div>
  );
}

function ScreenLoader({ label }) {
  return (
    <div className="screen-loader">
      <div className="screen-loader-content">
        <span className="loader-mark">VM</span>
        <span className="loader-spinner" />
        <strong>{label}</strong>
      </div>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState('Command Center');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const healthEvents = useHealthEvents();
  const { user, authLoading, authError, signOut } = useAuthSession();
  const { profile, profileLoading, profileError } = useUserProfile(user);
  const permissions = useMemo(() => createPermissions(profile?.role), [profile?.role]);
  const {
    vehicles,
    orders,
    quotes,
    orderTimelines,
    procurementTimelines,
    customers,
    shipments,
    logisticsPartners,
    procurementRequests,
    suppliers,
    loading,
    error,
    lastUpdated,
    refreshRecords,
    saveVehicle,
    deleteVehicle,
    saveOrder,
    deleteOrder,
    saveQuote,
    deleteQuote,
    updateOrderStatus,
    addOrderTimelineNote,
    saveCustomer,
    deleteCustomer,
    saveShipment,
    deleteShipment,
    saveLogisticsPartner,
    deleteLogisticsPartner,
    saveProcurementRequest,
    deleteProcurementRequest,
    addProcurementTimelineNote,
    saveSupplier,
    deleteSupplier,
  } = useSupabaseRecords(user, profileLoading ? null : permissions);
  const alerts = useMemo(() => createAlerts({ vehicles, orders, customers, shipments, orderTimelines, procurementRequests, suppliers }), [vehicles, orders, customers, shipments, orderTimelines, procurementRequests, suppliers]);
  const searchIndexData = useMemo(
    () => buildSearchIndex({
      vehicles,
      orders,
      quotes,
      customers,
      shipments,
      logisticsPartners,
      procurementRequests,
      suppliers,
    }),
    [vehicles, orders, quotes, customers, shipments, logisticsPartners, procurementRequests, suppliers],
  );
  const visibleNavGroups = useMemo(() => navGroups
    .map((group) => ({ ...group, pages: group.pages.filter((page) => permissions.canViewPage(page)) }))
    .filter((group) => group.pages.length), [permissions]);

  useEffect(() => {
    if (!profileLoading && !permissions.canViewPage(activePage) && permissions.allowedPages[0]) {
      setActivePage(permissions.allowedPages[0]);
    }
  }, [activePage, permissions, profileLoading]);

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === 'Escape') setCommandOpen(false);
      if (event.key === 'Escape') setAiOpen(false);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (authLoading) {
    return <ScreenLoader label="Restoring your secure session..." />;
  }

  if (!user) {
    return <AuthView authError={authError} />;
  }

  if (profileLoading) {
    return <ScreenLoader label="Preparing your Velora workspace..." />;
  }

  function goToPage(page) {
    setActivePage(permissions.canViewPage(page) ? page : permissions.allowedPages[0]);
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
          <span className="role-badge">{permissions.role}</span>
          <button onClick={signOut}>Sign Out</button>
        </div>
        <nav>
          {visibleNavGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <small>{group.label}</small>
              {group.pages.map((page) => {
                const Icon = navIcons[page];
                return (
                  <button
                    key={page}
                    className={activePage === page ? 'active' : ''}
                    aria-current={activePage === page ? 'page' : undefined}
                    onClick={() => goToPage(page)}
                  >
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
            <GlobalSearch index={searchIndexData} setActivePage={goToPage} allowedPages={permissions.allowedPages} />
            <button className="theme-toggle ai-button" onClick={() => setAiOpen(true)}>
              <Sparkles size={17} />
              <span>AI Assistant</span>
            </button>
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
        {loading && <PageSkeleton />}
        {error && (
          <div className="app-message error retry-message">
            <span>{error}</span>
            <button onClick={refreshRecords}>Retry</button>
          </div>
        )}
        {profileError && <div className="app-message error">{profileError}</div>}
        {!loading && !error && lastUpdated && (
          <div className="data-freshness">Data refreshed {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        )}
        {permissions.canViewPage(activePage) ? (
          <>
            {activePage === 'Command Center' && <Dashboard vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} procurementRequests={procurementRequests} suppliers={suppliers} orderTimelines={orderTimelines} setActivePage={goToPage} error={error} authError={authError} healthEvents={healthEvents} />}
            {activePage === 'Procurement' && <Procurement procurementRequests={procurementRequests} suppliers={suppliers} procurementTimelines={procurementTimelines} saveProcurementRequest={saveProcurementRequest} deleteProcurementRequest={deleteProcurementRequest} addProcurementTimelineNote={addProcurementTimelineNote} saveSupplier={saveSupplier} deleteSupplier={deleteSupplier} canEdit={permissions.canManageProcurement()} canDelete={permissions.canDeleteRecords('Procurement')} />}
            {activePage === 'Inventory' && <Inventory vehicles={vehicles} saveVehicle={saveVehicle} deleteVehicle={deleteVehicle} canEdit={permissions.canManageInventory()} canDelete={permissions.canDeleteRecords('Inventory')} />}
            {activePage === 'Orders' && <Orders orders={orders} saveOrder={saveOrder} deleteOrder={deleteOrder} updateOrderStatus={updateOrderStatus} vehicles={vehicles} customers={customers} orderTimelines={orderTimelines} addOrderTimelineNote={addOrderTimelineNote} canEdit={permissions.canManageOrders()} canDelete={permissions.canDeleteRecords('Orders')} />}
            {activePage === 'Quotes' && <Quotes quotes={quotes} saveQuote={saveQuote} deleteQuote={deleteQuote} vehicles={vehicles} customers={customers} canEdit={permissions.canManageQuotes()} canDelete={permissions.canDeleteRecords('Quotes')} />}
            {activePage === 'Customers' && <Customers customers={customers} saveCustomer={saveCustomer} deleteCustomer={deleteCustomer} canEdit={permissions.canManageCustomers()} canDelete={permissions.canDeleteRecords('Customers')} />}
            {activePage === 'Shipments' && <Shipments shipments={shipments} saveShipment={saveShipment} deleteShipment={deleteShipment} orders={orders} logisticsPartners={logisticsPartners} saveLogisticsPartner={saveLogisticsPartner} deleteLogisticsPartner={deleteLogisticsPartner} canEdit={permissions.canManageShipments()} canDelete={permissions.canDeleteRecords('Shipments')} />}
            {activePage === 'Timeline' && <TimelineOverview orders={orders} orderTimelines={orderTimelines} />}
            {activePage === 'Reports' && <Reports vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} procurementRequests={procurementRequests} suppliers={suppliers} />}
            {activePage === 'Alerts Center' && <AlertsCenter alerts={alerts} />}
            {activePage === 'Audit Logs' && <AuditLogs orders={orders} shipments={shipments} customers={customers} vehicles={vehicles} />}
          </>
        ) : (
          <div className="app-message error">This area is locked for {permissions.role}.</div>
        )}
        <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} setActivePage={goToPage} allowedPages={permissions.allowedPages} />
      </main>
      <AiAssistant
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onNavigate={goToPage}
        permissions={permissions}
        vehicles={vehicles}
        orders={orders}
        customers={customers}
        shipments={shipments}
        procurementRequests={procurementRequests}
        alerts={alerts}
      />
    </div>
  );
}

const publicPath = window.location.pathname.replace(/\/+$/, '') || '/';

createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <ConfirmProvider>
      {publicPath === '/privacy' ? <PrivacyPolicy /> : <App />}
    </ConfirmProvider>
  </AppErrorBoundary>,
);
