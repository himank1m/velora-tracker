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
  BookOpen,
  Bot,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardList,
  Command,
  Compass,
  Contact,
  CircleDollarSign,
  Database,
  Download,
  Eye,
  ExternalLink,
  FileText,
  FolderLock,
  Gauge,
  Globe2,
  History,
  Laptop,
  LayoutDashboard,
  Menu,
  Moon,
  Network,
  PackageCheck,
  PlayCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Sun,
  Target,
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
import AiCooCommandCenter from './components/AiCooCommandCenter';
import AiOperatingSystemCenter from './components/AiOperatingSystemCenter';
import CommunicationCenter from './components/CommunicationCenter';
import DigitalTwin from './components/DigitalTwin';
import EcosystemCenter from './components/EcosystemCenter';
import HrWorkforceCenter from './components/HrWorkforceCenter';
import KnowledgeHub from './components/KnowledgeHub';
import MarketplaceCenter from './components/MarketplaceCenter';
import PayrollCompensationCenter from './components/PayrollCompensationCenter';
import PortalCenter from './components/PortalCenter';
import ProjectManagementCenter from './components/ProjectManagementCenter';
import {
  BackupRecoveryCenter,
  LaunchReadinessDashboard,
  NotificationCenter,
  SettingsCenter,
  UserRoleManagement,
} from './components/LaunchReadinessSuite';
import {
  DemoModePage,
  OnboardingCenter,
  ProductLandingPage,
  ProductShowcasePage,
  ProductTourCenter,
  ReleaseNotesCenter,
  VersionBadge,
} from './components/ProductizationSuite';
import StrategicWarRoom from './components/StrategicWarRoom';
import TimeMachine from './components/TimeMachine';
import useEcosystemWorkspace from './hooks/useEcosystemWorkspace';
import {
  getHealthEvents,
  installGlobalHealthListeners,
  recordHealthEvent,
  subscribeToHealthEvents,
} from './lib/appHealth';
import { buildSearchIndex, searchIndex } from './services/searchService';
import { buildDigitalTwinAiContext } from './services/digitalTwinService';
import { buildTimeMachineAiContext } from './services/timeMachineService';
import { buildStrategicAiContext } from './services/strategicSimulationService';
import { buildAiCooContext } from './services/aiCooService';
import { buildEcosystemAiContext } from './services/ecosystemService';
import { buildNotificationFeed, buildSecurityChecklist } from './services/readinessService';
import {
  applyAppearanceTheme,
  defaultAppearance,
  loadAppearance,
  normalizeAppearance,
  saveAppearance,
} from './services/themeService';
import {
  buildEnterpriseSummary,
  calculateFinanceRecord,
  projectOrderFinance,
} from './services/enterpriseService';
import './styles.css';
import './halo.css';

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

const blankVehicle = {
  id: '',
  brand: '',
  model: '',
  category: '',
  quantity: 1,
  purchasePrice: 0,
  sellingPrice: 0,
  status: 'Available',
  lifecycleStatus: 'In Inventory',
  variant: '',
  vin: '',
  engineNumber: '',
  color: '',
  modelYear: '',
  supplierId: '',
  linkedProcurementId: '',
  linkedOrderId: '',
  linkedShipmentId: '',
  arrivalDate: '',
  deliveryDate: '',
  notes: '',
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
  customerType: 'Company',
  country: '',
  city: '',
  contactPerson: '',
  address: '',
  preferredVehicleTypes: '',
  preferredShippingMethod: '',
  customerRating: 'B',
  paymentReliabilityScore: 75,
  active: true,
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
  destinationCity: '',
  originCountry: '',
  originCity: '',
  portOfDeparture: '',
  portOfArrival: '',
  shippingCompany: '',
  carrierId: '',
  shippingMode: 'Sea',
  freightCost: 0,
  eta: today,
  actualDeliveryDate: '',
  customsStatus: 'Not Started',
  delayReason: '',
  trackingReference: '',
  status: 'Planning',
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
  supplierId: '',
  supplierCountry: '',
  estimatedPurchaseCost: 0,
  estimatedFreightCost: 0,
  itemType: 'Vehicle',
  unitBuyPrice: 0,
  approvedPurchaseAmount: 0,
  currency: 'INR',
  linkedOrderId: '',
  expectedDeliveryDate: '',
  actualDeliveryDate: '',
  paymentStatus: 'Unpaid',
  priority: 'Medium',
  requestedBy: '',
  status: 'Draft',
  notes: '',
};

const blankSupplier = {
  supplierName: '',
  country: '',
  contactPerson: '',
  phone: '',
  email: '',
  rating: '',
  onTimeDeliveryRate: '',
  totalOrders: 0,
  lastActivityAt: '',
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

const blankFinanceRecord = {
  id: '',
  orderId: '',
  customerId: '',
  totalSaleAmount: 0,
  vehicleCost: 0,
  procurementCost: 0,
  freightCost: 0,
  taxDutyCost: 0,
  otherCost: 0,
  amountPaid: 0,
  paymentStatus: 'Unpaid',
  invoiceStatus: 'Not Generated',
  dueDate: '',
  notes: '',
};

const blankDocument = {
  file: null,
  category: 'Other',
  linkedModule: '',
  linkedRecordId: '',
  notes: '',
};

const blankEmployee = {
  employeeCode: '',
  fullName: '',
  profilePhotoUrl: '',
  email: '',
  phone: '',
  department: 'Operations',
  role: '',
  dateOfJoining: today,
  employmentType: 'Full Time',
  reportingManagerId: '',
  status: 'Active',
};

const vehicleStatuses = ['Available', 'Reserved', 'Sold'];
const vehicleLifecycleStatuses = ['Planned', 'Procured', 'In Transit to Velora', 'In Inventory', 'Reserved', 'Sold', 'Assigned to Shipment', 'Shipped', 'Delivered', 'Archived'];
const orderStatuses = ['Inquiry', 'Confirmed', 'Procurement', 'Inspection', 'Ready', 'Shipped', 'Delivered', 'Completed'];
const quoteStatuses = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];
const shipmentStatuses = ['Planning', 'Booked', 'Awaiting Pickup', 'In Transit', 'At Port', 'Customs Clearance', 'Out for Delivery', 'Delivered', 'Delayed', 'Cancelled', 'Preparing', 'Loaded'];
const procurementStatuses = ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'In Transit', 'Received', 'Delayed', 'Cancelled', 'Requested', 'Supplier Identified', 'Negotiation', 'Purchased', 'Arrived', 'Added To Inventory'];
const procurementPriorities = ['Low', 'Medium', 'High', 'Critical'];
const paymentStatuses = ['Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Refunded', 'Cancelled'];
const invoiceStatuses = ['Not Generated', 'Draft', 'Sent', 'Paid', 'Cancelled'];
const customerTypes = ['Individual', 'Company', 'Government', 'Dealer', 'Logistics Partner'];
const customerRatings = ['A+', 'A', 'B', 'C', 'Risk'];
const shippingModes = ['Road', 'Sea', 'Air', 'Rail', 'Internal Velora Logistics'];
const customsStatuses = ['Not Started', 'Documents Pending', 'Submitted', 'Under Review', 'Cleared', 'Held'];
const documentCategories = ['Invoice', 'Supplier Bill', 'Shipping Document', 'Customs Document', 'Insurance', 'Contract', 'ID Document', 'Certification', 'Offer Letter', 'Payroll Document', 'Delivery Proof', 'Vehicle Certificate', 'Payment Receipt', 'Other'];
const locationOptions = ['Seoul HQ', 'New City Showroom', 'Port Operations Office', 'Warehouse'];
const departments = ['Management', 'Sales', 'Logistics', 'Procurement', 'Finance', 'HR', 'Operations', 'IT', 'Inventory'];
const roleOptions = ['CEO', 'Company Manager', 'Logistics Manager', 'Inventory Manager', 'Finance Manager'];
const exclusiveRoles = ['CEO', 'Company Manager'];
const pendingOAuthRoleKey = 'velora-pending-oauth-role';
const pendingAuthErrorKey = 'velora-pending-auth-error';
const pages = ['Command Center', 'Onboarding', 'Product Tour', 'Showcase', 'Ecosystem', 'Marketplace', 'AIOS', 'AI COO', 'Digital Twin', 'Time Machine', 'Strategic War Room', 'Projects', 'Procurement', 'Inventory', 'Orders', 'Quotes', 'Customers', 'Portals', 'Employees', 'Payroll', 'Communication', 'Shipments', 'Finance', 'Documents', 'Knowledge Hub', 'Timeline', 'Reports', 'Alerts Center', 'Notifications', 'Backup & Recovery', 'Settings', 'User Management', 'Release Notes', 'Launch Readiness', 'Audit Logs'];
const navGroups = [
  { label: 'Command', pages: ['Command Center', 'Onboarding', 'Product Tour', 'Showcase', 'Ecosystem', 'Marketplace', 'AIOS', 'AI COO', 'Digital Twin', 'Time Machine', 'Strategic War Room'] },
  { label: 'Operations', pages: ['Projects', 'Procurement', 'Inventory', 'Orders', 'Quotes', 'Customers', 'Portals'] },
  { label: 'People', pages: ['Employees', 'Payroll', 'Communication'] },
  { label: 'Logistics', pages: ['Shipments', 'Timeline'] },
  { label: 'Intelligence', pages: ['Finance', 'Reports', 'Alerts Center', 'Notifications'] },
  { label: 'Knowledge', pages: ['Documents', 'Knowledge Hub', 'Release Notes'] },
  { label: 'System', pages: ['Backup & Recovery', 'Settings', 'User Management', 'Launch Readiness', 'Audit Logs'] },
];
const navIcons = {
  'Command Center': LayoutDashboard,
  Onboarding: Compass,
  'Product Tour': PlayCircle,
  Showcase: Eye,
  Ecosystem: Network,
  Marketplace: Globe2,
  AIOS: Sparkles,
  'AI COO': Bot,
  'Digital Twin': Globe2,
  'Time Machine': History,
  'Strategic War Room': Target,
  Projects: ClipboardList,
  Procurement: ClipboardList,
  Inventory: Boxes,
  Orders: ClipboardList,
  Quotes: FileText,
  Customers: Users,
  Portals: Globe2,
  Employees: Users,
  Payroll: CircleDollarSign,
  Communication: Send,
  Shipments: Truck,
  Finance: CircleDollarSign,
  Documents: FolderLock,
  'Knowledge Hub': BookOpen,
  Timeline: TimelineIcon,
  Reports: FileText,
  'Alerts Center': Bell,
  Notifications: Bell,
  'Backup & Recovery': Database,
  Settings: Gauge,
  'User Management': Users,
  'Release Notes': Clock,
  'Launch Readiness': ShieldCheck,
  'Audit Logs': ShieldCheck,
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function numberValue(value) {
  return Number(String(value ?? '').replace(/,/g, '')) || 0;
}

function textValue(value) {
  return String(value ?? '').trim();
}

function sameText(left, right) {
  return textValue(left).toLowerCase() === textValue(right).toLowerCase();
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
  const quantity = Math.max(numberValue(request.quantity), 1);
  const approved = numberValue(request.approvedPurchaseAmount);
  const unitCost = numberValue(request.unitBuyPrice || request.estimatedPurchaseCost);
  const purchaseTotal = approved || unitCost * quantity;
  return purchaseTotal + numberValue(request.estimatedFreightCost);
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
    const key = event.orderId || event.procurementId || event.recordId;
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
    [textValue(item.status) || 'Unknown']: (result[textValue(item.status) || 'Unknown'] || 0) + 1,
  }), {})).map(([name, value]) => ({ name, value }));
}

function daysUntil(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date - new Date()) / 86400000);
}

function createAlerts({
  vehicles,
  orders,
  customers,
  shipments,
  orderTimelines,
  procurementRequests = [],
  suppliers = [],
  financeRecords = [],
}) {
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

  financeRecords.forEach((record) => {
    const outstanding = numberValue(record.amountPending);
    const overdue = record.paymentStatus === 'Overdue'
      || (record.dueDate && record.dueDate < today && outstanding > 0);
    if (overdue) {
      alerts.push({
        id: `payment-overdue-${record.id}`,
        alert_type: 'Overdue Payment',
        severity: outstanding > 1000000 ? 'Critical' : 'High',
        title: 'Payment collection is overdue',
        message: `${money.format(outstanding)} remains outstanding${record.dueDate ? ` since ${new Date(record.dueDate).toLocaleDateString()}` : ''}.`,
        linked_module: 'Finance',
        linked_record_id: record.id,
        resolved: false,
        created_at: record.updatedAt || record.createdAt,
      });
    }
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

function csvBoolean(value, fallback = false) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return fallback;
  if (['true', 'yes', 'y', '1', 'active'].includes(text)) return true;
  if (['false', 'no', 'n', '0', 'inactive'].includes(text)) return false;
  return fallback;
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
    lifecycleStatus: row.lifecycle_status || (row.status === 'Sold' ? 'Sold' : 'In Inventory'),
    variant: row.variant || '',
    vin: row.vin || '',
    engineNumber: row.engine_number || '',
    color: row.color || '',
    modelYear: row.model_year || '',
    supplierId: row.supplier_id || '',
    linkedProcurementId: row.linked_procurement_id || '',
    linkedOrderId: row.linked_order_id || '',
    linkedShipmentId: row.linked_shipment_id || '',
    arrivalDate: row.arrival_date || '',
    deliveryDate: row.delivery_date || '',
    notes: row.notes || '',
    locationName: row.location_name || 'Seoul HQ',
    department: row.department || 'Inventory',
    createdAt: row.created_at,
  };
}

function toVehicleRow(vehicle, userId, includeEnterprise = true) {
  const row = {
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
  if (includeEnterprise) Object.assign(row, {
    lifecycle_status: vehicle.lifecycleStatus,
    variant: vehicle.variant,
    vin: vehicle.vin,
    engine_number: vehicle.engineNumber,
    color: vehicle.color,
    model_year: vehicle.modelYear ? numberValue(vehicle.modelYear) : null,
    supplier_id: vehicle.supplierId || null,
    linked_procurement_id: vehicle.linkedProcurementId || null,
    linked_order_id: vehicle.linkedOrderId || null,
    linked_shipment_id: vehicle.linkedShipmentId || null,
    arrival_date: vehicle.arrivalDate || null,
    delivery_date: vehicle.deliveryDate || null,
    notes: vehicle.notes,
  });
  return row;
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
    customerType: row.customer_type || 'Company',
    country: row.country || '',
    city: row.city || '',
    contactPerson: row.contact_person || '',
    address: row.address || '',
    preferredVehicleTypes: row.preferred_vehicle_types || '',
    preferredShippingMethod: row.preferred_shipping_method || '',
    customerRating: row.customer_rating || 'B',
    paymentReliabilityScore: Number(row.payment_reliability_score ?? 75),
    active: row.active !== false,
    notes: row.notes || '',
    department: row.department || 'Sales',
    createdAt: row.created_at,
  };
}

function toCustomerRow(customer, userId, includeEnterprise = true) {
  const row = {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    location: customer.location,
    notes: customer.notes,
    department: customer.department,
    ...(userId ? { created_by: userId } : {}),
  };
  if (includeEnterprise) Object.assign(row, {
    customer_type: customer.customerType,
    country: customer.country,
    city: customer.city,
    contact_person: customer.contactPerson,
    address: customer.address,
    preferred_vehicle_types: customer.preferredVehicleTypes,
    preferred_shipping_method: customer.preferredShippingMethod,
    customer_rating: customer.customerRating,
    payment_reliability_score: numberValue(customer.paymentReliabilityScore),
    active: customer.active !== false,
  });
  return row;
}

function fromEmployeeRow(row) {
  return {
    id: row.id,
    employeeCode: row.employee_id || '',
    fullName: row.full_name || '',
    profilePhotoUrl: row.profile_photo_url || '',
    email: row.email || '',
    phone: row.phone || '',
    department: row.department || 'Operations',
    role: row.role || '',
    dateOfJoining: row.date_of_joining || '',
    employmentType: row.employment_type || 'Full Time',
    reportingManagerId: row.reporting_manager_id || '',
    status: row.status || 'Active',
    createdAt: row.created_at,
  };
}

function toEmployeeRow(employee, userId) {
  return {
    employee_id: employee.employeeCode,
    full_name: employee.fullName,
    profile_photo_url: employee.profilePhotoUrl,
    email: employee.email,
    phone: employee.phone,
    department: employee.department,
    role: employee.role,
    date_of_joining: employee.dateOfJoining || null,
    employment_type: employee.employmentType,
    reporting_manager_id: employee.reportingManagerId || null,
    status: employee.status,
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromHrDepartmentRow(row) {
  return {
    id: row.id,
    name: row.name || '',
    description: row.description || '',
    managerEmployeeId: row.manager_employee_id || '',
    status: row.status || 'Active',
    createdAt: row.created_at,
  };
}

function toHrDepartmentRow(department, userId) {
  return {
    name: department.name,
    description: department.description,
    manager_employee_id: department.managerEmployeeId || null,
    status: department.status || 'Active',
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromPayrollRow(row) {
  const baseSalary = Number(row.base_salary || 0);
  const bonus = Number(row.bonus || 0);
  const deductions = Number(row.deductions || 0);
  return {
    id: row.id,
    employeeId: row.employee_id || '',
    employeeCode: row.employee_code || '',
    payrollCycleId: row.payroll_cycle_id || '',
    baseSalary,
    bonus,
    deductions,
    netSalary: Number(row.net_salary ?? (baseSalary + bonus - deductions)),
    paymentDate: row.payment_date || '',
    paymentStatus: row.payment_status || 'Pending',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function toPayrollRow(record, employees, userId) {
  const employee = employees.find((item) => item.id === record.employeeId);
  const baseSalary = numberValue(record.baseSalary);
  const bonus = numberValue(record.bonus);
  const deductions = numberValue(record.deductions);
  return {
    employee_id: record.employeeId,
    employee_code: employee?.employeeCode || record.employeeCode || '',
    payroll_cycle_id: record.payrollCycleId || null,
    base_salary: baseSalary,
    bonus,
    deductions,
    net_salary: baseSalary + bonus - deductions,
    payment_date: record.paymentDate || null,
    payment_status: record.paymentStatus || 'Pending',
    notes: record.notes || '',
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromPayrollCycleRow(row) {
  return {
    id: row.id,
    cycleName: row.cycle_name || '',
    periodStart: row.period_start || '',
    periodEnd: row.period_end || '',
    runStatus: row.run_status || 'Draft',
    approvalStatus: row.approval_status || 'Draft',
    approvedBy: row.approved_by || '',
    approvedAt: row.approved_at || '',
    lockedAt: row.locked_at || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function toPayrollCycleRow(cycle, userId) {
  return {
    cycle_name: cycle.cycleName,
    period_start: cycle.periodStart || null,
    period_end: cycle.periodEnd || null,
    run_status: cycle.runStatus || 'Draft',
    approval_status: cycle.approvalStatus || cycle.runStatus || 'Draft',
    notes: cycle.notes || '',
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromSalaryHistoryRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id || '',
    previousSalary: Number(row.previous_salary || 0),
    newSalary: Number(row.new_salary || 0),
    effectiveDate: row.effective_date || '',
    reason: row.reason || '',
    approvedBy: row.approved_by || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function toSalaryHistoryRow(record, userId) {
  return {
    employee_id: record.employeeId,
    previous_salary: numberValue(record.previousSalary),
    new_salary: numberValue(record.newSalary),
    effective_date: record.effectiveDate || null,
    reason: record.reason || '',
    approved_by: record.approvedBy || null,
    notes: record.notes || '',
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromBonusRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id || '',
    department: row.department || '',
    payrollCycleId: row.payroll_cycle_id || '',
    performanceNoteId: row.performance_note_id || '',
    bonusType: row.bonus_type || 'Performance Bonus',
    amount: Number(row.amount || 0),
    paymentDate: row.payment_date || '',
    status: row.status || 'Pending',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function toBonusRow(record, userId) {
  return {
    employee_id: record.employeeId,
    department: record.department || '',
    payroll_cycle_id: record.payrollCycleId || null,
    performance_note_id: record.performanceNoteId || null,
    bonus_type: record.bonusType,
    amount: numberValue(record.amount),
    payment_date: record.paymentDate || null,
    status: record.status || 'Pending',
    notes: record.notes || '',
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromDeductionRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id || '',
    department: row.department || '',
    payrollCycleId: row.payroll_cycle_id || '',
    deductionType: row.deduction_type || 'Other Deduction',
    amount: Number(row.amount || 0),
    deductionDate: row.deduction_date || '',
    status: row.status || 'Pending',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function toDeductionRow(record, userId) {
  return {
    employee_id: record.employeeId,
    department: record.department || '',
    payroll_cycle_id: record.payrollCycleId || null,
    deduction_type: record.deductionType,
    amount: numberValue(record.amount),
    deduction_date: record.deductionDate || null,
    status: record.status || 'Pending',
    notes: record.notes || '',
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromAttendanceRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id || '',
    attendanceDate: row.attendance_date || '',
    status: row.status || 'Present',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function toAttendanceRow(record, userId) {
  return {
    employee_id: record.employeeId,
    attendance_date: record.attendanceDate || null,
    status: record.status,
    notes: record.notes || '',
    ...(userId ? { created_by: userId } : {}),
  };
}

function leaveDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate || startDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, Math.ceil((end - start) / 86400000) + 1);
}

function fromLeaveRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id || '',
    leaveType: row.leave_type || 'Annual Leave',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    days: Number(row.days || 0),
    status: row.status || 'Requested',
    reason: row.reason || '',
    approvedBy: row.approved_by || '',
    approvedAt: row.approved_at || '',
    createdAt: row.created_at,
  };
}

function toLeaveRow(record, userId) {
  return {
    employee_id: record.employeeId,
    leave_type: record.leaveType,
    start_date: record.startDate || null,
    end_date: record.endDate || null,
    days: leaveDays(record.startDate, record.endDate),
    status: record.status || 'Requested',
    reason: record.reason || '',
    approved_by: record.approvedBy || null,
    approved_at: record.approvedAt || null,
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromPerformanceNoteRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id || '',
    noteType: row.note_type || 'Performance Note',
    title: row.title || '',
    note: row.note || '',
    rating: row.rating ?? '',
    createdAt: row.created_at,
  };
}

function toPerformanceNoteRow(note, userId) {
  return {
    employee_id: note.employeeId,
    note_type: note.noteType,
    title: note.title,
    note: note.note,
    rating: note.rating === '' ? null : numberValue(note.rating),
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
    customerId: row.customer_id || '',
    destinationCountry: row.destination_country,
    destinationCity: row.destination_city || '',
    originCountry: row.origin_country || '',
    originCity: row.origin_city || '',
    portOfDeparture: row.port_of_departure,
    portOfArrival: row.port_of_arrival,
    shippingCompany: row.shipping_company,
    carrierId: row.carrier_id || '',
    shippingMode: row.shipping_mode || 'Sea',
    freightCost: Number(row.freight_cost),
    eta: row.eta,
    actualDeliveryDate: row.actual_delivery_date || '',
    customsStatus: row.customs_status || 'Not Started',
    delayReason: row.delay_reason || '',
    trackingReference: row.tracking_reference || '',
    deliveryProofPath: row.delivery_proof_path || '',
    status: row.status,
    notes: row.notes || '',
    locationName: row.location_name || 'Port Operations Office',
    department: row.department || 'Logistics',
    createdAt: row.created_at,
  };
}

function toShipmentRow(shipment, userId, includeEnterprise = true) {
  const row = {
    shipment_id: shipment.shipmentId,
    linked_order_id: shipment.linkedOrderId || null,
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
  if (includeEnterprise) Object.assign(row, {
    customer_id: shipment.customerId || null,
    destination_city: shipment.destinationCity,
    origin_country: shipment.originCountry,
    origin_city: shipment.originCity,
    carrier_id: shipment.carrierId || null,
    shipping_mode: shipment.shippingMode,
    actual_delivery_date: shipment.actualDeliveryDate || null,
    customs_status: shipment.customsStatus,
    delay_reason: shipment.delayReason,
    tracking_reference: shipment.trackingReference,
    delivery_proof_path: shipment.deliveryProofPath || null,
  });
  return row;
}

function fromProcurementRow(row) {
  const request = {
    procurementId: row.procurement_id,
    vehicleBrand: row.vehicle_brand,
    vehicleModel: row.vehicle_model,
    quantity: row.quantity,
    supplierName: row.supplier_name || '',
    supplierId: row.supplier_id || '',
    supplierCountry: row.supplier_country || '',
    estimatedPurchaseCost: Number(row.estimated_purchase_cost),
    estimatedFreightCost: Number(row.estimated_freight_cost),
    itemType: row.item_type || 'Vehicle',
    unitBuyPrice: Number(row.unit_buy_price ?? row.estimated_purchase_cost),
    approvedPurchaseAmount: Number(row.approved_purchase_amount || 0),
    currency: row.currency || 'INR',
    linkedOrderId: row.linked_order_id || '',
    expectedDeliveryDate: row.expected_delivery_date || '',
    actualDeliveryDate: row.actual_delivery_date || '',
    paymentStatus: row.payment_status || 'Unpaid',
    priority: row.priority || 'Medium',
    requestedBy: row.requested_by || '',
    status: row.status || 'Requested',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
  return { ...request, totalBuyPrice: procurementValue(request) };
}

function toProcurementRow(request, userId, includeEnterprise = true) {
  const row = {
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
  if (includeEnterprise) Object.assign(row, {
    supplier_id: request.supplierId || null,
    item_type: request.itemType,
    unit_buy_price: numberValue(request.unitBuyPrice || request.estimatedPurchaseCost),
    approved_purchase_amount: numberValue(request.approvedPurchaseAmount),
    currency: request.currency || 'INR',
    linked_order_id: request.linkedOrderId || null,
    expected_delivery_date: request.expectedDeliveryDate || null,
    actual_delivery_date: request.actualDeliveryDate || null,
    payment_status: request.paymentStatus,
    priority: request.priority,
  });
  return row;
}

function fromSupplierRow(row) {
  return {
    id: row.id,
    supplierName: row.supplier_name,
    country: row.country || '',
    contactPerson: row.contact_person || '',
    phone: row.phone || '',
    email: row.email || '',
    rating: row.rating ?? '',
    onTimeDeliveryRate: row.on_time_delivery_rate ?? '',
    totalOrders: Number(row.total_orders || 0),
    lastActivityAt: row.last_activity_at || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function toSupplierRow(supplier, userId, includeEnterprise = true) {
  const row = {
    supplier_name: supplier.supplierName,
    country: supplier.country,
    contact_person: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email,
    notes: supplier.notes,
    ...(userId ? { created_by: userId } : {}),
  };
  if (includeEnterprise) Object.assign(row, {
    rating: supplier.rating === '' ? null : numberValue(supplier.rating),
    on_time_delivery_rate: supplier.onTimeDeliveryRate === '' ? null : numberValue(supplier.onTimeDeliveryRate),
    total_orders: numberValue(supplier.totalOrders),
    last_activity_at: supplier.lastActivityAt || null,
  });
  return row;
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

function fromFinanceRow(row) {
  return calculateFinanceRecord({
    id: row.id,
    orderId: row.order_id || '',
    customerId: row.customer_id || '',
    totalSaleAmount: Number(row.total_sale_amount),
    vehicleCost: Number(row.vehicle_cost),
    procurementCost: Number(row.procurement_cost),
    freightCost: Number(row.freight_cost),
    taxDutyCost: Number(row.tax_duty_cost),
    otherCost: Number(row.other_cost),
    amountPaid: Number(row.amount_paid),
    paymentStatus: row.payment_status || 'Unpaid',
    invoiceStatus: row.invoice_status || 'Not Generated',
    dueDate: row.due_date || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function toFinanceRow(record, userId) {
  return {
    order_id: record.orderId || null,
    customer_id: record.customerId || null,
    total_sale_amount: numberValue(record.totalSaleAmount),
    vehicle_cost: numberValue(record.vehicleCost),
    procurement_cost: numberValue(record.procurementCost),
    freight_cost: numberValue(record.freightCost),
    tax_duty_cost: numberValue(record.taxDutyCost),
    other_cost: numberValue(record.otherCost),
    amount_paid: numberValue(record.amountPaid),
    payment_status: record.paymentStatus,
    invoice_status: record.invoiceStatus,
    due_date: record.dueDate || null,
    notes: record.notes,
    ...(userId ? { created_by: userId } : {}),
  };
}

function fromDocumentRow(row) {
  return {
    id: row.id,
    fileName: row.file_name,
    fileType: row.file_type || '',
    fileSize: Number(row.file_size || 0),
    category: row.category || 'Other',
    linkedModule: row.linked_module || '',
    linkedRecordId: row.linked_record_id || '',
    storagePath: row.storage_path,
    notes: row.notes || '',
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  };
}

function fromCustomerContactRow(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    fullName: row.full_name,
    jobTitle: row.job_title || '',
    email: row.email || '',
    phone: row.phone || '',
    isPrimary: Boolean(row.is_primary),
    createdAt: row.created_at,
  };
}

function fromCustomerNoteRow(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    note: row.note,
    createdAt: row.created_at,
  };
}

function fromOperationalEvent(row, key) {
  return {
    id: row.id,
    recordId: row[key],
    status: row.status,
    note: row.note || '',
    createdAt: row.created_at,
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

function getHaloContext(page) {
  if (['AIOS', 'AI COO', 'Time Machine', 'Digital Twin', 'Strategic War Room'].includes(page)) return 'ai';
  if (['Command Center', 'Showcase', 'Ecosystem', 'Marketplace', 'Reports', 'Launch Readiness'].includes(page)) return 'management';
  if (['Finance', 'Payroll', 'Backup & Recovery'].includes(page)) return 'finance';
  if (['Shipments', 'Timeline'].includes(page)) return 'logistics';
  if (['Inventory', 'Procurement', 'Orders', 'Quotes', 'Customers', 'Projects', 'Portals'].includes(page)) return 'operations';
  if (['Employees', 'Communication', 'User Management', 'Settings', 'Notifications'].includes(page)) return 'people';
  return 'system';
}

function createPermissions(role) {
  const normalizedRole = normalizeRole(role);
  const isExecutive = normalizedRole === 'CEO' || normalizedRole === 'Company Manager';
  const allowedPagesByRole = {
    CEO: pages,
    'Company Manager': pages.filter((page) => page !== 'User Management'),
    'Logistics Manager': ['Command Center', 'Onboarding', 'Product Tour', 'Showcase', 'Ecosystem', 'Marketplace', 'AIOS', 'AI COO', 'Digital Twin', 'Time Machine', 'Strategic War Room', 'Projects', 'Portals', 'Communication', 'Shipments', 'Documents', 'Knowledge Hub', 'Timeline', 'Alerts Center', 'Notifications', 'Settings', 'Release Notes'],
    'Inventory Manager': ['Command Center', 'Onboarding', 'Product Tour', 'Showcase', 'Ecosystem', 'Marketplace', 'AIOS', 'AI COO', 'Digital Twin', 'Time Machine', 'Strategic War Room', 'Projects', 'Portals', 'Communication', 'Procurement', 'Inventory', 'Documents', 'Knowledge Hub', 'Alerts Center', 'Notifications', 'Settings', 'Release Notes'],
    'Finance Manager': ['Command Center', 'Onboarding', 'Product Tour', 'Showcase', 'Ecosystem', 'Marketplace', 'AIOS', 'AI COO', 'Digital Twin', 'Time Machine', 'Strategic War Room', 'Projects', 'Portals', 'Communication', 'Procurement', 'Quotes', 'Payroll', 'Finance', 'Documents', 'Knowledge Hub', 'Reports', 'Alerts Center', 'Notifications', 'Backup & Recovery', 'Settings', 'Release Notes'],
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
    canManageHR() {
      return isExecutive;
    },
    canViewPayroll() {
      return isExecutive || normalizedRole === 'Finance Manager';
    },
    canManagePayroll() {
      return isExecutive || normalizedRole === 'Finance Manager';
    },
    canManageShipments() {
      return isExecutive || normalizedRole === 'Logistics Manager';
    },
    canViewReports() {
      return isExecutive || normalizedRole === 'Finance Manager';
    },
    canViewBackupCenter() {
      return isExecutive || normalizedRole === 'Finance Manager';
    },
    canViewLaunchReadiness() {
      return isExecutive;
    },
    canManageFinance() {
      return isExecutive || normalizedRole === 'Finance Manager';
    },
    canManageDocuments() {
      return roleOptions.includes(normalizedRole);
    },
    canManageCommunication() {
      return isExecutive;
    },
    canManageProjects() {
      return isExecutive;
    },
    canManageKnowledge() {
      return isExecutive;
    },
    canManagePortals() {
      return isExecutive;
    },
    canManageMarketplace() {
      return isExecutive;
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
  'What should management focus on today?',
  'What is our biggest risk?',
  'Which customer is most valuable?',
  'What should we procure next?',
  'Which supplier is underperforming?',
  'What happens if freight costs rise by 30%?',
];

function buildAiContext({
  permissions,
  vehicles,
  orders,
  customers,
  shipments,
  procurementRequests,
  alerts,
  enterpriseSummary,
  employees = [],
  hrDepartments = [],
  payrollRecords = [],
  leaveRequests = [],
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
      totalEmployees: employees.length,
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

    context.workforce = {
      totalEmployees: employees.length,
      activeEmployees: employees.filter((employee) => employee.status === 'Active').length,
      employeesOnLeave: employees.filter((employee) => employee.status === 'On Leave').length,
      departments: hrDepartments.map((department) => ({
        name: department.name,
        status: department.status,
        employeeCount: employees.filter((employee) => employee.department === department.name).length,
      })),
      recentJoiners: employees
        .filter((employee) => employee.dateOfJoining && (new Date() - new Date(employee.dateOfJoining)) / 86400000 <= 30)
        .slice(0, 10)
        .map((employee) => ({
          employeeId: employee.employeeCode,
          name: employee.fullName,
          department: employee.department,
          role: employee.role,
          dateOfJoining: employee.dateOfJoining,
        })),
      pendingLeaveRequests: leaveRequests.filter((request) => request.status === 'Requested').length,
      ...(permissions.canViewFinancials()
        ? {
          overduePayroll: payrollRecords.filter((record) => record.paymentStatus === 'Overdue').length,
          pendingPayrollValue: payrollRecords
            .filter((record) => record.paymentStatus !== 'Paid')
            .reduce((sum, record) => sum + numberValue(record.netSalary), 0),
        }
        : {}),
    };
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

function useTheme(userId) {
  const [appearance, setAppearance] = useState(() => loadAppearance(userId));

  useEffect(() => {
    setAppearance(loadAppearance(userId));
  }, [userId]);

  useEffect(() => {
    const safeAppearance = normalizeAppearance(appearance);
    applyAppearanceTheme(safeAppearance);
    saveAppearance(userId, safeAppearance);
  }, [appearance, userId]);

  function setTheme(themeId) {
    setAppearance((current) => normalizeAppearance({ ...current, themeId }));
  }

  function updateAppearance(patch) {
    setAppearance((current) => normalizeAppearance({ ...current, ...patch }));
  }

  function resetAppearance() {
    setAppearance(defaultAppearance);
  }

  return [appearance.themeId, setTheme, appearance, updateAppearance, resetAppearance];
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

function useSupabaseRecords(user, permissions, currentCompanyId, ecosystemReady) {
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
  const [financeRecords, setFinanceRecords] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [vehicleEvents, setVehicleEvents] = useState({});
  const [shipmentEvents, setShipmentEvents] = useState({});
  const [customerContacts, setCustomerContacts] = useState([]);
  const [customerNotes, setCustomerNotes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [hrDepartments, setHrDepartments] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [payrollCycles, setPayrollCycles] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [performanceNotes, setPerformanceNotes] = useState([]);
  const [phase2Ready, setPhase2Ready] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const scopeQuery = (query) => ecosystemReady && currentCompanyId
    ? query.eq('company_id', currentCompanyId)
    : query;
  const scopeRow = (row) => ecosystemReady && currentCompanyId
    ? { ...row, company_id: currentCompanyId }
    : row;

  function isOptionalSchemaError(requestError) {
    const message = requestError?.message || '';
    return ['42P01', '42703', 'PGRST204', 'PGRST205'].includes(requestError?.code)
      || message.includes('does not exist')
      || message.includes('schema cache')
      || message.includes('Could not find');
  }

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
      if (isOptionalSchemaError(requestError)) return [];
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

  async function runEnterpriseRequest(request, operation) {
    const { data, error: requestError } = await request;
    if (requestError) {
      if (isOptionalSchemaError(requestError)) {
        return { rows: [], available: false };
      }
      const friendlyMessage = friendlyError(requestError);
      setError(friendlyMessage);
      recordHealthEvent({
        type: 'supabase-query',
        message: friendlyMessage,
        context: { operation, code: requestError.code },
      });
      throw requestError;
    }
    return { rows: data || [], available: true };
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
      setFinanceRecords([]);
      setDocuments([]);
      setVehicleEvents({});
      setShipmentEvents({});
      setCustomerContacts([]);
      setCustomerNotes([]);
      setEmployees([]);
      setHrDepartments([]);
      setPayrollRecords([]);
      setPayrollCycles([]);
      setSalaryHistory([]);
      setBonuses([]);
      setDeductions([]);
      setAttendanceRecords([]);
      setLeaveRequests([]);
      setPerformanceNotes([]);
      setPhase2Ready(false);
      setLoading(false);
      setLastUpdated(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const readAll = permissions.isExecutive || permissions.role === 'Finance Manager';
      const emptyQuery = Promise.resolve({ data: [], error: null });
      const needsCompanyModel = permissions.canViewPage('Digital Twin')
        || permissions.canViewPage('Time Machine')
        || permissions.canViewPage('Strategic War Room')
        || permissions.canViewPage('AI COO');
      const needsVehicles = permissions.canViewPage('Inventory')
        || permissions.canViewPage('Orders')
        || permissions.canViewPage('Quotes')
        || (needsCompanyModel && (permissions.isExecutive || permissions.role === 'Inventory Manager' || permissions.role === 'Finance Manager'));
      const needsOrders = permissions.canViewPage('Orders')
        || permissions.canViewPage('Timeline')
        || permissions.canViewPage('Shipments')
        || permissions.canViewPage('Finance')
        || (needsCompanyModel && (permissions.isExecutive || permissions.role === 'Logistics Manager' || permissions.role === 'Finance Manager'));
      const needsQuotes = permissions.canViewPage('Quotes');
      const needsCustomers = permissions.canViewPage('Customers')
        || permissions.canViewPage('Orders')
        || permissions.canViewPage('Quotes')
        || permissions.canViewPage('Finance')
        || (needsCompanyModel && permissions.isExecutive);
      const needsShipments = permissions.canViewPage('Shipments')
        || permissions.canViewPage('Finance')
        || (needsCompanyModel && (permissions.isExecutive || permissions.role === 'Logistics Manager' || permissions.role === 'Finance Manager'));
      const needsTimeline = permissions.canViewPage('Timeline') || permissions.canViewPage('Orders') || permissions.canViewPage('Time Machine');
      const needsProcurement = permissions.canViewPage('Procurement')
        || permissions.canViewPage('Finance')
        || (needsCompanyModel && (permissions.isExecutive || permissions.role === 'Inventory Manager' || permissions.role === 'Finance Manager'));
      const needsFinance = permissions.canViewPage('Finance')
        || (needsCompanyModel && (permissions.isExecutive || permissions.role === 'Finance Manager'));
      const needsDocuments = permissions.canViewPage('Documents') || needsCompanyModel;
      const needsHr = permissions.canViewPage('Employees') || (permissions.isExecutive && permissions.canViewPage('AI COO'));
      const needsPayroll = permissions.canViewPayroll?.() || (permissions.isExecutive && permissions.canViewPage('AI COO'));

      const vehicleQuery = !needsVehicles ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Inventory Manager' || permissions.role === 'Finance Manager'
          ? scopeQuery(supabase.from('vehicles').select('*')).order('created_at', { ascending: false })
          : scopeQuery(supabase.from('vehicles').select('*').eq('created_by', user.id)).order('created_at', { ascending: false });
      const orderQuery = !needsOrders ? emptyQuery
        : readAll || permissions.role === 'Logistics Manager'
          ? scopeQuery(supabase.from('orders').select('*')).order('created_at', { ascending: false })
          : scopeQuery(supabase.from('orders').select('*').eq('created_by', user.id)).order('created_at', { ascending: false });
      const quoteQuery = !needsQuotes ? emptyQuery
        : readAll
          ? scopeQuery(supabase.from('quotes').select('*')).order('created_at', { ascending: false })
          : scopeQuery(supabase.from('quotes').select('*').eq('created_by', user.id)).order('created_at', { ascending: false });
      const customerQuery = !needsCustomers ? emptyQuery
        : readAll
          ? scopeQuery(supabase.from('customers').select('*')).order('created_at', { ascending: false })
          : scopeQuery(supabase.from('customers').select('*').eq('created_by', user.id)).order('created_at', { ascending: false });
      const shipmentQuery = !needsShipments ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Logistics Manager' || permissions.role === 'Finance Manager'
          ? scopeQuery(supabase.from('shipments').select('*')).order('created_at', { ascending: false })
          : scopeQuery(supabase.from('shipments').select('*').eq('created_by', user.id)).order('created_at', { ascending: false });
      const logisticsPartnerQuery = !needsShipments ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Logistics Manager' || permissions.role === 'Finance Manager'
          ? scopeQuery(supabase.from('logistics_partners').select('*')).order('created_at', { ascending: false })
          : scopeQuery(supabase.from('logistics_partners').select('*').eq('created_by', user.id)).order('created_at', { ascending: false });
      const timelineQuery = !needsTimeline ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Logistics Manager'
          ? scopeQuery(supabase.from('order_timeline_events').select('*')).order('created_at', { ascending: true })
          : scopeQuery(supabase.from('order_timeline_events').select('*').eq('created_by', user.id)).order('created_at', { ascending: true });
      const procurementQuery = !needsProcurement ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Inventory Manager' || permissions.role === 'Finance Manager'
          ? scopeQuery(supabase.from('procurement_requests').select('*')).order('created_at', { ascending: false })
          : scopeQuery(supabase.from('procurement_requests').select('*').eq('created_by', user.id)).order('created_at', { ascending: false });
      const supplierQuery = !needsProcurement ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Inventory Manager' || permissions.role === 'Finance Manager'
          ? scopeQuery(supabase.from('suppliers').select('*')).order('created_at', { ascending: false })
          : scopeQuery(supabase.from('suppliers').select('*').eq('created_by', user.id)).order('created_at', { ascending: false });
      const procurementTimelineQuery = !needsProcurement ? emptyQuery
        : permissions.isExecutive || permissions.role === 'Inventory Manager' || permissions.role === 'Finance Manager'
          ? scopeQuery(supabase.from('procurement_timeline').select('*')).order('created_at', { ascending: true })
          : scopeQuery(supabase.from('procurement_timeline').select('*').eq('created_by', user.id)).order('created_at', { ascending: true });
      const financeQuery = needsFinance
        ? scopeQuery(supabase.from('finance_records').select('*')).order('created_at', { ascending: false })
        : supabase.from('finance_records').select('id').limit(1);
      const documentQuery = !needsDocuments ? emptyQuery
        : scopeQuery(supabase.from('documents').select('*')).order('uploaded_at', { ascending: false });
      const vehicleEventQuery = !needsVehicles ? emptyQuery
        : scopeQuery(supabase.from('vehicle_lifecycle_events').select('*')).order('created_at', { ascending: true });
      const shipmentEventQuery = !needsShipments ? emptyQuery
        : scopeQuery(supabase.from('shipment_events').select('*')).order('created_at', { ascending: true });
      const customerContactQuery = !needsCustomers ? emptyQuery
        : scopeQuery(supabase.from('customer_contacts').select('*')).order('created_at', { ascending: true });
      const customerNoteQuery = !needsCustomers ? emptyQuery
        : scopeQuery(supabase.from('customer_notes').select('*')).order('created_at', { ascending: false });
      const employeeQuery = !needsHr ? emptyQuery
        : scopeQuery(supabase.from('employees').select('*')).order('created_at', { ascending: false });
      const hrDepartmentQuery = !needsHr ? emptyQuery
        : scopeQuery(supabase.from('hr_departments').select('*')).order('name', { ascending: true });
      const payrollQuery = !needsPayroll || !permissions.canViewFinancials() ? emptyQuery
        : scopeQuery(supabase.from('payroll_records').select('*')).order('payment_date', { ascending: false });
      const payrollCycleQuery = !needsPayroll ? emptyQuery
        : scopeQuery(supabase.from('payroll_cycles').select('*')).order('period_start', { ascending: false });
      const salaryHistoryQuery = !needsPayroll ? emptyQuery
        : scopeQuery(supabase.from('salary_history').select('*')).order('effective_date', { ascending: false });
      const bonusQuery = !needsPayroll ? emptyQuery
        : scopeQuery(supabase.from('employee_bonuses').select('*')).order('payment_date', { ascending: false });
      const deductionQuery = !needsPayroll ? emptyQuery
        : scopeQuery(supabase.from('employee_deductions').select('*')).order('deduction_date', { ascending: false });
      const attendanceQuery = !needsHr ? emptyQuery
        : scopeQuery(supabase.from('attendance_records').select('*')).order('attendance_date', { ascending: false });
      const leaveQuery = !needsHr ? emptyQuery
        : scopeQuery(supabase.from('leave_requests').select('*')).order('created_at', { ascending: false });
      const performanceQuery = !needsHr ? emptyQuery
        : scopeQuery(supabase.from('performance_notes').select('*')).order('created_at', { ascending: false });

      const [vehicleRows, orderRows, quoteRows, customerRows, shipmentRows, logisticsPartnerRows, timelineRows, procurementRows, supplierRows, procurementTimelineRows, financeResult, documentResult, vehicleEventResult, shipmentEventResult, customerContactResult, customerNoteResult, employeeRows, hrDepartmentRows, payrollRows, payrollCycleRows, salaryHistoryRows, bonusRows, deductionRows, attendanceRows, leaveRows, performanceRows] = await Promise.all([
        runRequest(vehicleQuery, 'load vehicles'),
        runRequest(orderQuery, 'load orders'),
        runOptionalRequest(quoteQuery, 'load quotes'),
        runRequest(customerQuery, 'load customers'),
        runRequest(shipmentQuery, 'load shipments'),
        runOptionalRequest(logisticsPartnerQuery, 'load logistics partners'),
        runOptionalRequest(timelineQuery, 'load order timeline'),
        runOptionalRequest(procurementQuery, 'load procurement requests'),
        runOptionalRequest(supplierQuery, 'load suppliers'),
        runOptionalRequest(procurementTimelineQuery, 'load procurement timeline'),
        runEnterpriseRequest(financeQuery, 'load finance records'),
        runEnterpriseRequest(documentQuery, 'load documents'),
        runEnterpriseRequest(vehicleEventQuery, 'load vehicle lifecycle'),
        runEnterpriseRequest(shipmentEventQuery, 'load shipment timeline'),
        runEnterpriseRequest(customerContactQuery, 'load customer contacts'),
        runEnterpriseRequest(customerNoteQuery, 'load customer notes'),
        runOptionalRequest(employeeQuery, 'load employees'),
        runOptionalRequest(hrDepartmentQuery, 'load HR departments'),
        runOptionalRequest(payrollQuery, 'load payroll records'),
        runOptionalRequest(payrollCycleQuery, 'load payroll cycles'),
        runOptionalRequest(salaryHistoryQuery, 'load salary history'),
        runOptionalRequest(bonusQuery, 'load employee bonuses'),
        runOptionalRequest(deductionQuery, 'load employee deductions'),
        runOptionalRequest(attendanceQuery, 'load attendance records'),
        runOptionalRequest(leaveQuery, 'load leave requests'),
        runOptionalRequest(performanceQuery, 'load performance notes'),
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
      setFinanceRecords(needsFinance ? financeResult.rows.map(fromFinanceRow) : []);
      setDocuments(documentResult.rows.map(fromDocumentRow));
      setVehicleEvents(groupTimelineRows(vehicleEventResult.rows.map((row) => fromOperationalEvent(row, 'vehicle_id'))));
      setShipmentEvents(groupTimelineRows(shipmentEventResult.rows.map((row) => fromOperationalEvent(row, 'shipment_id'))));
      setCustomerContacts(customerContactResult.rows.map(fromCustomerContactRow));
      setCustomerNotes(customerNoteResult.rows.map(fromCustomerNoteRow));
      setEmployees(employeeRows.map(fromEmployeeRow));
      setHrDepartments(hrDepartmentRows.map(fromHrDepartmentRow));
      setPayrollRecords(payrollRows.map(fromPayrollRow));
      setPayrollCycles(payrollCycleRows.map(fromPayrollCycleRow));
      setSalaryHistory(salaryHistoryRows.map(fromSalaryHistoryRow));
      setBonuses(bonusRows.map(fromBonusRow));
      setDeductions(deductionRows.map(fromDeductionRow));
      setAttendanceRecords(attendanceRows.map(fromAttendanceRow));
      setLeaveRequests(leaveRows.map(fromLeaveRow));
      setPerformanceNotes(performanceRows.map(fromPerformanceNoteRow));
      setPhase2Ready(financeResult.available);
      setLastUpdated(new Date());
    } catch (requestError) {
      setError((current) => current || friendlyError(requestError, 'Velora could not load company records.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [user?.id, permissions?.role, currentCompanyId, ecosystemReady]);

  async function saveVehicle(vehicle, editingId) {
    if (!permissions?.canManageInventory()) throw new Error('Your role cannot manage inventory.');
    const previous = vehicles.find((item) => item.id === editingId);
    const query = editingId
      ? scopeQuery(supabase.from('vehicles').update(toVehicleRow(vehicle, null, phase2Ready)).eq('id', editingId)).select().single()
      : supabase.from('vehicles').insert(scopeRow(toVehicleRow(vehicle, user.id, phase2Ready))).select().single();
    const saved = fromVehicleRow(await runRequest(query));
    setVehicles((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
    if (phase2Ready && (!editingId || previous?.lifecycleStatus !== saved.lifecycleStatus)) {
      await addVehicleLifecycleEvent(saved.id, saved.lifecycleStatus, editingId ? `Lifecycle moved to ${saved.lifecycleStatus}.` : 'Vehicle record created.');
    }
    return saved;
  }

  async function deleteVehicle(id) {
    if (!permissions?.canDeleteRecords('Inventory')) throw new Error('Your role cannot delete inventory records.');
    await runRequest(scopeQuery(supabase.from('vehicles').delete().eq('id', id)));
    setVehicles((current) => current.filter((item) => item.id !== id));
  }

  async function saveOrder(order, editingId) {
    if (!permissions?.canManageOrders()) throw new Error('Your role cannot manage orders.');
    const orderToSave = {
      ...order,
      orderNumber: order.orderNumber || nextOrderNumber(orders),
    };
    const query = editingId
      ? scopeQuery(supabase.from('orders').update(toOrderRow(orderToSave)).eq('id', editingId)).select().single()
      : supabase.from('orders').insert(scopeRow(toOrderRow(orderToSave, user.id))).select().single();
    const saved = fromOrderRow(await runRequest(query));
    setOrders((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);

    if (!editingId) {
      await addOrderTimelineEvent(saved.id, saved.status, 'Order created.');
    }

    return saved;
  }

  async function deleteOrder(id) {
    if (!permissions?.canDeleteRecords('Orders')) throw new Error('Your role cannot delete orders.');
    await runRequest(scopeQuery(supabase.from('orders').delete().eq('id', id)));
    setOrders((current) => current.filter((item) => item.id !== id));
  }

  async function saveQuote(quote, editingId) {
    if (!permissions?.canManageQuotes()) throw new Error('Your role cannot manage quotes.');
    const quoteToSave = {
      ...quote,
      quoteId: quote.quoteId || nextQuoteId(quotes),
    };
    const query = editingId
      ? scopeQuery(supabase.from('quotes').update(toQuoteRow(quoteToSave)).eq('quote_id', editingId)).select().single()
      : supabase.from('quotes').insert(scopeRow(toQuoteRow(quoteToSave, user.id))).select().single();
    const saved = fromQuoteRow(await runRequest(query));
    setQuotes((current) => editingId ? current.map((item) => item.quoteId === editingId ? saved : item) : [saved, ...current]);
    return saved;
  }

  async function deleteQuote(id) {
    if (!permissions?.canDeleteRecords('Quotes')) throw new Error('Your role cannot delete quotes.');
    await runRequest(scopeQuery(supabase.from('quotes').delete().eq('quote_id', id)));
    setQuotes((current) => current.filter((item) => item.quoteId !== id));
  }

  async function updateOrderStatus(id, status) {
    if (!permissions?.canManageOrders()) throw new Error('Your role cannot update order status.');
    const saved = fromOrderRow(await runRequest(scopeQuery(supabase.from('orders').update({ status }).eq('id', id)).select().single()));
    setOrders((current) => current.map((item) => item.id === id ? saved : item));
    await addOrderTimelineEvent(id, status, `Status changed to ${status}.`);
  }

  async function addOrderTimelineEvent(orderId, status, note) {
    const { data, error: requestError } = await supabase
      .from('order_timeline_events')
      .insert(scopeRow(toTimelineRow({ orderId, status, note }, user.id)))
      .select()
      .single();
    if (requestError) {
      if (isOptionalSchemaError(requestError)) {
        recordHealthEvent({
          type: 'supabase-query',
          message: 'Order timeline storage is not available. Core order data was saved.',
          context: { operation: 'add order timeline event', code: requestError.code },
        });
        return null;
      }
      const message = friendlyError(requestError);
      setError(message);
      recordHealthEvent({
        type: 'supabase-query',
        message,
        context: { operation: 'add order timeline event', code: requestError.code },
      });
      throw requestError;
    }
    const saved = fromTimelineRow(data);

    setOrderTimelines((current) => ({
      ...current,
      [orderId]: [...(current[orderId] || []), saved],
    }));
    return saved;
  }

  async function addOrderTimelineNote(orderId, note) {
    if (!permissions?.isExecutive && permissions?.role !== 'Logistics Manager') throw new Error('Your role cannot add timeline notes.');
    const order = orders.find((item) => item.id === orderId);
    await addOrderTimelineEvent(orderId, order?.status || 'Inquiry', note);
  }

  async function saveCustomer(customer, editingId) {
    if (!permissions?.canManageCustomers()) throw new Error('Your role cannot manage customers.');
    const query = editingId
      ? scopeQuery(supabase.from('customers').update(toCustomerRow(customer, null, phase2Ready)).eq('id', editingId)).select().single()
      : supabase.from('customers').insert(scopeRow(toCustomerRow(customer, user.id, phase2Ready))).select().single();
    const saved = fromCustomerRow(await runRequest(query));
    setCustomers((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
    return saved;
  }

  async function deleteCustomer(id) {
    if (!permissions?.canDeleteRecords('Customers')) throw new Error('Your role cannot delete customers.');
    await runRequest(scopeQuery(supabase.from('customers').delete().eq('id', id)));
    setCustomers((current) => current.filter((item) => item.id !== id));
  }

  async function saveShipment(shipment, editingId) {
    if (!permissions?.canManageShipments()) throw new Error('Your role cannot manage shipments.');
    const linkedCustomer = customers.find((customer) => sameText(customer.name, shipment.customerName));
    const shipmentToSave = { ...shipment, customerId: shipment.customerId || linkedCustomer?.id || '' };
    const query = editingId
      ? scopeQuery(supabase.from('shipments').update(toShipmentRow(shipmentToSave, null, phase2Ready)).eq('shipment_id', editingId)).select().single()
      : supabase.from('shipments').insert(scopeRow(toShipmentRow(shipmentToSave, user.id, phase2Ready))).select().single();
    const saved = fromShipmentRow(await runRequest(query));
    const previous = shipments.find((item) => item.shipmentId === editingId);
    setShipments((current) => editingId ? current.map((item) => item.shipmentId === editingId ? saved : item) : [saved, ...current]);
    if (phase2Ready && (!editingId || previous?.status !== saved.status)) {
      await addShipmentEvent(saved.shipmentId, saved.status, editingId ? `Status changed to ${saved.status}.` : 'Shipment created.');
    }
    return saved;
  }

  async function deleteShipment(id) {
    if (!permissions?.canDeleteRecords('Shipments')) throw new Error('Your role cannot delete shipments.');
    await runRequest(scopeQuery(supabase.from('shipments').delete().eq('shipment_id', id)));
    setShipments((current) => current.filter((item) => item.shipmentId !== id));
  }

  async function saveLogisticsPartner(partner, editingId) {
    if (!permissions?.canManageShipments()) throw new Error('Your role cannot manage logistics partners.');
    const query = editingId
      ? scopeQuery(supabase.from('logistics_partners').update(toLogisticsPartnerRow(partner)).eq('id', editingId)).select().single()
      : supabase.from('logistics_partners').insert(scopeRow(toLogisticsPartnerRow(partner, user.id))).select().single();
    const saved = fromLogisticsPartnerRow(await runRequest(query));
    setLogisticsPartners((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
    return saved;
  }

  async function deleteLogisticsPartner(id) {
    if (!permissions?.canDeleteRecords('Shipments')) throw new Error('Your role cannot delete logistics partners.');
    await runRequest(scopeQuery(supabase.from('logistics_partners').delete().eq('id', id)));
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
        lifecycleStatus: 'In Inventory',
        linkedProcurementId: request.procurementId,
        arrivalDate: request.actualDeliveryDate || existing.arrivalDate || today,
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
      lifecycleStatus: 'In Inventory',
      linkedProcurementId: request.procurementId,
      arrivalDate: request.actualDeliveryDate || today,
      supplierId: request.supplierId || '',
    };
    await saveVehicle(newVehicle, '');
  }

  async function addProcurementTimelineEvent(procurementId, status, note) {
    const { data, error: requestError } = await supabase
      .from('procurement_timeline')
      .insert(scopeRow(toProcurementTimelineRow({ procurementId, status, note }, user.id)))
      .select()
      .single();
    if (requestError) {
      if (isOptionalSchemaError(requestError)) {
        recordHealthEvent({
          type: 'supabase-query',
          message: 'Procurement timeline storage is not available. Core procurement data was saved.',
          context: { operation: 'add procurement timeline event', code: requestError.code },
        });
        return null;
      }
      const message = friendlyError(requestError);
      setError(message);
      recordHealthEvent({
        type: 'supabase-query',
        message,
        context: { operation: 'add procurement timeline event', code: requestError.code },
      });
      throw requestError;
    }
    const saved = fromProcurementTimelineRow(data);

    setProcurementTimelines((current) => ({
      ...current,
      [procurementId]: [...(current[procurementId] || []), saved],
    }));
    return saved;
  }

  async function saveProcurementRequest(request, editingId) {
    if (!permissions?.canManageProcurement()) throw new Error('Your role cannot manage procurement.');
    const requestToSave = {
      ...request,
      procurementId: request.procurementId || nextProcurementId(procurementRequests),
    };
    const previous = procurementRequests.find((item) => item.procurementId === editingId);
    const query = editingId
      ? scopeQuery(supabase.from('procurement_requests').update(toProcurementRow(requestToSave, null, phase2Ready)).eq('procurement_id', editingId)).select().single()
      : supabase.from('procurement_requests').insert(scopeRow(toProcurementRow(requestToSave, user.id, phase2Ready))).select().single();
    const saved = fromProcurementRow(await runRequest(query));
    setProcurementRequests((current) => editingId ? current.map((item) => item.procurementId === editingId ? saved : item) : [saved, ...current]);

    if (!editingId) {
      await addProcurementTimelineEvent(saved.procurementId, saved.status, 'Procurement request created.');
    } else if (previous?.status !== saved.status) {
      await addProcurementTimelineEvent(saved.procurementId, saved.status, `Status changed to ${saved.status}.`);
    }

    const inventoryStatuses = ['Received', 'Added To Inventory'];
    if (inventoryStatuses.includes(saved.status) && !inventoryStatuses.includes(previous?.status)) {
      await syncProcurementToInventory(saved);
    }
    return saved;
  }

  async function deleteProcurementRequest(id) {
    if (!permissions?.canDeleteRecords('Procurement')) throw new Error('Your role cannot delete procurement records.');
    await runRequest(scopeQuery(supabase.from('procurement_requests').delete().eq('procurement_id', id)));
    setProcurementRequests((current) => current.filter((item) => item.procurementId !== id));
  }

  async function addProcurementTimelineNote(procurementId, note) {
    const request = procurementRequests.find((item) => item.procurementId === procurementId);
    await addProcurementTimelineEvent(procurementId, request?.status || 'Requested', note);
  }

  async function saveSupplier(supplier, editingId) {
    if (!permissions?.canManageProcurement()) throw new Error('Your role cannot manage suppliers.');
    const query = editingId
      ? scopeQuery(supabase.from('suppliers').update(toSupplierRow(supplier, null, phase2Ready)).eq('id', editingId)).select().single()
      : supabase.from('suppliers').insert(scopeRow(toSupplierRow(supplier, user.id, phase2Ready))).select().single();
    const saved = fromSupplierRow(await runRequest(query));
    setSuppliers((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
    return saved;
  }

  async function deleteSupplier(id) {
    if (!permissions?.canDeleteRecords('Procurement')) throw new Error('Your role cannot delete suppliers.');
    await runRequest(scopeQuery(supabase.from('suppliers').delete().eq('id', id)));
    setSuppliers((current) => current.filter((item) => item.id !== id));
  }

  async function addVehicleLifecycleEvent(vehicleId, status, note) {
    if (!phase2Ready) return;
    const { data, error: requestError } = await supabase
      .from('vehicle_lifecycle_events')
      .insert(scopeRow({ vehicle_id: vehicleId, status, note, created_by: user.id }))
      .select()
      .single();
    if (requestError) {
      if (isOptionalSchemaError(requestError)) return;
      const message = friendlyError(requestError);
      setError(message);
      recordHealthEvent({
        type: 'supabase-query',
        message,
        context: { operation: 'add vehicle lifecycle event', code: requestError.code },
      });
      throw requestError;
    }
    const saved = fromOperationalEvent(data, 'vehicle_id');
    setVehicleEvents((current) => ({
      ...current,
      [vehicleId]: [...(current[vehicleId] || []), saved],
    }));
  }

  async function addShipmentEvent(shipmentId, status, note) {
    if (!phase2Ready) return;
    const { data, error: requestError } = await supabase
      .from('shipment_events')
      .insert(scopeRow({ shipment_id: shipmentId, status, note, created_by: user.id }))
      .select()
      .single();
    if (requestError) {
      if (isOptionalSchemaError(requestError)) return;
      const message = friendlyError(requestError);
      setError(message);
      recordHealthEvent({
        type: 'supabase-query',
        message,
        context: { operation: 'add shipment event', code: requestError.code },
      });
      throw requestError;
    }
    const saved = fromOperationalEvent(data, 'shipment_id');
    setShipmentEvents((current) => ({
      ...current,
      [shipmentId]: [...(current[shipmentId] || []), saved],
    }));
  }

  async function saveFinanceRecord(record, editingId) {
    if (!permissions?.canManageFinance()) throw new Error('Your role cannot manage finance records.');
    if (!phase2Ready) throw new Error('Install the Phase 2 Supabase migration before creating finance records.');
    const query = editingId
      ? scopeQuery(supabase.from('finance_records').update(toFinanceRow(record)).eq('id', editingId)).select().single()
      : supabase.from('finance_records').insert(scopeRow(toFinanceRow(record, user.id))).select().single();
    const saved = fromFinanceRow(await runRequest(query, 'save finance record'));
    setFinanceRecords((current) => editingId
      ? current.map((item) => item.id === editingId ? saved : item)
      : [saved, ...current]);
    return saved;
  }

  async function deleteFinanceRecord(id) {
    if (!permissions?.canManageFinance()) throw new Error('Your role cannot delete finance records.');
    await runRequest(scopeQuery(supabase.from('finance_records').delete().eq('id', id)), 'delete finance record');
    setFinanceRecords((current) => current.filter((item) => item.id !== id));
  }

  async function uploadDocument(documentInput) {
    if (!permissions?.canManageDocuments()) throw new Error('Your role cannot upload documents.');
    if (!phase2Ready) throw new Error('Install the Phase 2 Supabase migration before uploading documents.');
    const file = documentInput.file;
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!file) throw new Error('Choose a document to upload.');
    if (!allowedTypes.includes(file.type)) throw new Error('Use PDF, PNG, JPG, CSV, or DOCX files.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Documents must be 10 MB or smaller.');

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const storagePath = `${ecosystemReady && currentCompanyId ? `${currentCompanyId}/` : ''}${user.id}/${Date.now()}-${safeName}`;
    await runRequest(
      supabase.storage.from('velora-documents').upload(storagePath, file, { upsert: false }),
      'upload document file',
    );
    try {
      const saved = fromDocumentRow(await runRequest(
        supabase.from('documents').insert(scopeRow({
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          category: documentInput.category,
          linked_module: documentInput.linkedModule || null,
          linked_record_id: documentInput.linkedRecordId || null,
          storage_path: storagePath,
          notes: documentInput.notes,
          uploaded_by: user.id,
        })).select().single(),
        'save document metadata',
      ));
      setDocuments((current) => [saved, ...current]);
      return saved;
    } catch (metadataError) {
      await supabase.storage.from('velora-documents').remove([storagePath]);
      throw metadataError;
    }
  }

  async function openDocument(documentRecord) {
    const { data, error: signedUrlError } = await supabase.storage
      .from('velora-documents')
      .createSignedUrl(documentRecord.storagePath, 60);
    if (signedUrlError) {
      const message = friendlyError(signedUrlError, 'Velora could not open this document.');
      setError(message);
      recordHealthEvent({ type: 'document-storage', message });
      throw signedUrlError;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function deleteDocument(id) {
    if (!permissions?.canManageDocuments()) throw new Error('Your role cannot delete documents.');
    const documentRecord = documents.find((item) => item.id === id);
    if (!documentRecord) return;
    await runRequest(supabase.storage.from('velora-documents').remove([documentRecord.storagePath]), 'delete document file');
    await runRequest(scopeQuery(supabase.from('documents').delete().eq('id', id)), 'delete document metadata');
    setDocuments((current) => current.filter((item) => item.id !== id));
  }

  async function saveCustomerContact(contact) {
    if (!permissions?.canManageCustomers()) throw new Error('Your role cannot manage customer contacts.');
    const saved = fromCustomerContactRow(await runRequest(
      supabase.from('customer_contacts').insert(scopeRow({
        customer_id: contact.customerId,
        full_name: contact.fullName,
        job_title: contact.jobTitle,
        email: contact.email,
        phone: contact.phone,
        is_primary: Boolean(contact.isPrimary),
        created_by: user.id,
      })).select().single(),
      'save customer contact',
    ));
    setCustomerContacts((current) => [...current, saved]);
    return saved;
  }

  async function deleteCustomerContact(id) {
    if (!permissions?.canManageCustomers()) throw new Error('Your role cannot delete customer contacts.');
    await runRequest(scopeQuery(supabase.from('customer_contacts').delete().eq('id', id)), 'delete customer contact');
    setCustomerContacts((current) => current.filter((item) => item.id !== id));
  }

  async function addCustomerNote(customerId, note) {
    if (!permissions?.canManageCustomers()) throw new Error('Your role cannot add customer notes.');
    const saved = fromCustomerNoteRow(await runRequest(
      supabase.from('customer_notes').insert(scopeRow({ customer_id: customerId, note, created_by: user.id })).select().single(),
      'add customer note',
    ));
    setCustomerNotes((current) => [saved, ...current]);
    return saved;
  }

  async function deleteCustomerNote(id) {
    if (!permissions?.canManageCustomers()) throw new Error('Your role cannot delete customer notes.');
    await runRequest(scopeQuery(supabase.from('customer_notes').delete().eq('id', id)), 'delete customer note');
    setCustomerNotes((current) => current.filter((item) => item.id !== id));
  }

  function nextEmployeeCode() {
    const max = employees.reduce((highest, employee) => {
      const match = String(employee.employeeCode || '').match(/(\d+)$/);
      return match ? Math.max(highest, Number.parseInt(match[1], 10) || 0) : highest;
    }, 0);
    return `EMP-${String(max + 1).padStart(4, '0')}`;
  }

  async function saveEmployee(employee, editingId) {
    if (!permissions?.canManageHR()) throw new Error('Your role cannot manage employees.');
    const employeeToSave = { ...employee, employeeCode: employee.employeeCode || nextEmployeeCode() };
    const query = editingId
      ? scopeQuery(supabase.from('employees').update(toEmployeeRow(employeeToSave)).eq('id', editingId)).select().single()
      : supabase.from('employees').insert(scopeRow(toEmployeeRow(employeeToSave, user.id))).select().single();
    const saved = fromEmployeeRow(await runRequest(query, 'save employee'));
    setEmployees((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
    return saved;
  }

  async function deleteEmployee(id) {
    if (!permissions?.canManageHR()) throw new Error('Your role cannot delete employee records.');
    await runRequest(scopeQuery(supabase.from('employees').delete().eq('id', id)), 'delete employee');
    setEmployees((current) => current.filter((item) => item.id !== id));
  }

  async function saveHrDepartment(department, editingId) {
    if (!permissions?.canManageHR()) throw new Error('Your role cannot manage departments.');
    const query = editingId
      ? scopeQuery(supabase.from('hr_departments').update(toHrDepartmentRow(department)).eq('id', editingId)).select().single()
      : supabase.from('hr_departments').insert(scopeRow(toHrDepartmentRow(department, user.id))).select().single();
    const saved = fromHrDepartmentRow(await runRequest(query, 'save HR department'));
    setHrDepartments((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [...current, saved]);
    return saved;
  }

  async function deleteHrDepartment(id) {
    if (!permissions?.canManageHR()) throw new Error('Your role cannot delete departments.');
    await runRequest(scopeQuery(supabase.from('hr_departments').delete().eq('id', id)), 'delete HR department');
    setHrDepartments((current) => current.filter((item) => item.id !== id));
  }

  async function savePayrollRecord(record, editingId) {
    if (!permissions?.canManageHR() || !permissions?.canViewFinancials()) throw new Error('Your role cannot manage payroll.');
    const query = editingId
      ? scopeQuery(supabase.from('payroll_records').update(toPayrollRow(record, employees)).eq('id', editingId)).select().single()
      : supabase.from('payroll_records').insert(scopeRow(toPayrollRow(record, employees, user.id))).select().single();
    const saved = fromPayrollRow(await runRequest(query, 'save payroll record'));
    setPayrollRecords((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
    return saved;
  }

  async function deletePayrollRecord(id) {
    if (!permissions?.canManageHR() || !permissions?.canViewFinancials()) throw new Error('Your role cannot delete payroll.');
    await runRequest(scopeQuery(supabase.from('payroll_records').delete().eq('id', id)), 'delete payroll record');
    setPayrollRecords((current) => current.filter((item) => item.id !== id));
  }

  async function savePayrollCycle(cycle, editingId) {
    if (!permissions?.canManagePayroll()) throw new Error('Your role cannot manage payroll cycles.');
    const existing = payrollCycles.find((item) => item.id === editingId);
    if (existing?.runStatus === 'Locked') throw new Error('Locked payroll cycles cannot be edited.');
    const query = editingId
      ? scopeQuery(supabase.from('payroll_cycles').update(toPayrollCycleRow(cycle)).eq('id', editingId)).select().single()
      : supabase.from('payroll_cycles').insert(scopeRow(toPayrollCycleRow(cycle, user.id))).select().single();
    const saved = fromPayrollCycleRow(await runRequest(query, 'save payroll cycle'));
    setPayrollCycles((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
    return saved;
  }

  async function updatePayrollCycleStatus(id, status) {
    if (!permissions?.canManagePayroll()) throw new Error('Your role cannot approve payroll.');
    const cycle = payrollCycles.find((item) => item.id === id);
    if (cycle?.runStatus === 'Locked') throw new Error('Locked payroll cycles cannot be changed.');
    const patch = {
      run_status: status,
      approval_status: status === 'Approved' ? 'Approved' : cycle?.approvalStatus || status,
      ...(status === 'Approved' ? { approved_by: user.id, approved_at: new Date().toISOString() } : {}),
      ...(status === 'Locked' ? { locked_at: new Date().toISOString() } : {}),
    };
    const saved = fromPayrollCycleRow(await runRequest(
      scopeQuery(supabase.from('payroll_cycles').update(patch).eq('id', id)).select().single(),
      'update payroll cycle status',
    ));
    setPayrollCycles((current) => current.map((item) => item.id === id ? saved : item));
    return saved;
  }

  async function saveSalaryHistory(record) {
    if (!permissions?.canManagePayroll()) throw new Error('Your role cannot manage salary history.');
    const saved = fromSalaryHistoryRow(await runRequest(
      supabase.from('salary_history').insert(scopeRow(toSalaryHistoryRow(record, user.id))).select().single(),
      'save salary history',
    ));
    setSalaryHistory((current) => [saved, ...current]);
    return saved;
  }

  async function saveBonus(record) {
    if (!permissions?.canManagePayroll()) throw new Error('Your role cannot manage bonuses.');
    const cycle = payrollCycles.find((item) => item.id === record.payrollCycleId);
    if (cycle?.runStatus === 'Locked') throw new Error('Locked payroll cycles cannot be edited.');
    const saved = fromBonusRow(await runRequest(
      supabase.from('employee_bonuses').insert(scopeRow(toBonusRow(record, user.id))).select().single(),
      'save employee bonus',
    ));
    setBonuses((current) => [saved, ...current]);
    return saved;
  }

  async function saveDeduction(record) {
    if (!permissions?.canManagePayroll()) throw new Error('Your role cannot manage deductions.');
    const cycle = payrollCycles.find((item) => item.id === record.payrollCycleId);
    if (cycle?.runStatus === 'Locked') throw new Error('Locked payroll cycles cannot be edited.');
    const saved = fromDeductionRow(await runRequest(
      supabase.from('employee_deductions').insert(scopeRow(toDeductionRow(record, user.id))).select().single(),
      'save employee deduction',
    ));
    setDeductions((current) => [saved, ...current]);
    return saved;
  }

  async function saveAttendanceRecord(record, editingId) {
    if (!permissions?.canManageHR()) throw new Error('Your role cannot manage attendance.');
    const query = editingId
      ? scopeQuery(supabase.from('attendance_records').update(toAttendanceRow(record)).eq('id', editingId)).select().single()
      : supabase.from('attendance_records').insert(scopeRow(toAttendanceRow(record, user.id))).select().single();
    const saved = fromAttendanceRow(await runRequest(query, 'save attendance record'));
    setAttendanceRecords((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
    return saved;
  }

  async function deleteAttendanceRecord(id) {
    if (!permissions?.canManageHR()) throw new Error('Your role cannot delete attendance.');
    await runRequest(scopeQuery(supabase.from('attendance_records').delete().eq('id', id)), 'delete attendance record');
    setAttendanceRecords((current) => current.filter((item) => item.id !== id));
  }

  async function saveLeaveRequest(record, editingId) {
    if (!permissions?.canManageHR()) throw new Error('Your role cannot manage leave.');
    const query = editingId
      ? scopeQuery(supabase.from('leave_requests').update(toLeaveRow(record)).eq('id', editingId)).select().single()
      : supabase.from('leave_requests').insert(scopeRow(toLeaveRow(record, user.id))).select().single();
    const saved = fromLeaveRow(await runRequest(query, 'save leave request'));
    setLeaveRequests((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
    return saved;
  }

  async function updateLeaveStatus(id, status) {
    if (!permissions?.canManageHR()) throw new Error('Your role cannot approve leave.');
    const saved = fromLeaveRow(await runRequest(
      scopeQuery(supabase.from('leave_requests').update({ status, approved_by: user.id, approved_at: new Date().toISOString() }).eq('id', id)).select().single(),
      'update leave status',
    ));
    setLeaveRequests((current) => current.map((item) => item.id === id ? saved : item));
    return saved;
  }

  async function deleteLeaveRequest(id) {
    if (!permissions?.canManageHR()) throw new Error('Your role cannot delete leave requests.');
    await runRequest(scopeQuery(supabase.from('leave_requests').delete().eq('id', id)), 'delete leave request');
    setLeaveRequests((current) => current.filter((item) => item.id !== id));
  }

  async function savePerformanceNote(note, editingId) {
    if (!permissions?.canManageHR()) throw new Error('Your role cannot manage performance notes.');
    const query = editingId
      ? scopeQuery(supabase.from('performance_notes').update(toPerformanceNoteRow(note)).eq('id', editingId)).select().single()
      : supabase.from('performance_notes').insert(scopeRow(toPerformanceNoteRow(note, user.id))).select().single();
    const saved = fromPerformanceNoteRow(await runRequest(query, 'save performance note'));
    setPerformanceNotes((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
    return saved;
  }

  async function deletePerformanceNote(id) {
    if (!permissions?.canManageHR()) throw new Error('Your role cannot delete performance notes.');
    await runRequest(scopeQuery(supabase.from('performance_notes').delete().eq('id', id)), 'delete performance note');
    setPerformanceNotes((current) => current.filter((item) => item.id !== id));
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
    financeRecords,
    documents,
    vehicleEvents,
    shipmentEvents,
    customerContacts,
    customerNotes,
    employees,
    hrDepartments,
    payrollRecords,
    payrollCycles,
    salaryHistory,
    bonuses,
    deductions,
    attendanceRecords,
    leaveRequests,
    performanceNotes,
    phase2Ready,
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
    saveFinanceRecord,
    deleteFinanceRecord,
    uploadDocument,
    openDocument,
    deleteDocument,
    saveCustomerContact,
    deleteCustomerContact,
    addCustomerNote,
    deleteCustomerNote,
    saveEmployee,
    deleteEmployee,
    saveHrDepartment,
    deleteHrDepartment,
    savePayrollRecord,
    deletePayrollRecord,
    savePayrollCycle,
    updatePayrollCycleStatus,
    saveSalaryHistory,
    saveBonus,
    saveDeduction,
    saveAttendanceRecord,
    deleteAttendanceRecord,
    saveLeaveRequest,
    updateLeaveStatus,
    deleteLeaveRequest,
    savePerformanceNote,
    deletePerformanceNote,
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

function Phase2SetupState({ moduleName }) {
  return (
    <section className="setup-state">
      <span><FolderLock size={26} /></span>
      <p className="eyebrow">Database setup required</p>
      <h2>{moduleName} is ready to activate</h2>
      <p>Run the safe Phase 2 migration in the Supabase SQL editor. Existing records are preserved and no tables are dropped.</p>
      <code>supabase/phase2-enterprise-core.sql</code>
    </section>
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
  const safeSeverity = textValue(severity) || 'Low';
  return <span className={`alert-severity severity-${safeSeverity.toLowerCase()}`}>{safeSeverity}</span>;
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
    { name: 'Finance', page: 'Finance', icon: BarChart3, text: 'Revenue, profit, and payments', stat: money.format(totals.profit), statLabel: 'order profit' },
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
    { label: 'Open Onboarding', page: 'Onboarding', icon: Compass },
    { label: 'Open Product Tour', page: 'Product Tour', icon: PlayCircle },
    { label: 'Open Showcase', page: 'Showcase', icon: Eye },
    { label: 'Open Ecosystem', page: 'Ecosystem', icon: Network },
    { label: 'Open AI COO', page: 'AI COO', icon: Bot },
    { label: 'Open Digital Twin', page: 'Digital Twin', icon: Globe2 },
    { label: 'Open Time Machine', page: 'Time Machine', icon: History },
    { label: 'Open Strategic War Room', page: 'Strategic War Room', icon: Target },
    { label: 'Open Procurement', page: 'Procurement', icon: ClipboardList },
    { label: 'Add Vehicle', page: 'Inventory', icon: Boxes },
    { label: 'Add Customer', page: 'Customers', icon: Users },
    { label: 'Open Employees', page: 'Employees', icon: Users },
    { label: 'Open Payroll', page: 'Payroll', icon: CircleDollarSign },
    { label: 'Create Order', page: 'Orders', icon: ClipboardList },
    { label: 'Create Quote', page: 'Quotes', icon: FileText },
    { label: 'Create Shipment', page: 'Shipments', icon: Truck },
    { label: 'Open Finance', page: 'Finance', icon: CircleDollarSign },
    { label: 'Open Document Vault', page: 'Documents', icon: FolderLock },
    { label: 'Open Reports', page: 'Reports', icon: FileText },
    { label: 'Open Notifications', page: 'Notifications', icon: Bell },
    { label: 'Open Backup Center', page: 'Backup & Recovery', icon: Database },
    { label: 'Open Settings', page: 'Settings', icon: Gauge },
    { label: 'Open User Management', page: 'User Management', icon: Users },
    { label: 'Open Release Notes', page: 'Release Notes', icon: Clock },
    { label: 'Open Launch Readiness', page: 'Launch Readiness', icon: ShieldCheck },
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
      <Field label="Variant">
        <input value={value.variant} onChange={(e) => onChange({ ...value, variant: e.target.value })} />
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
      <Field label="Lifecycle Stage">
        <select value={value.lifecycleStatus} onChange={(e) => onChange({ ...value, lifecycleStatus: e.target.value })}>
          {vehicleLifecycleStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </Field>
      <Field label="VIN / Chassis Number">
        <input value={value.vin} onChange={(e) => onChange({ ...value, vin: e.target.value })} />
      </Field>
      <Field label="Engine Number">
        <input value={value.engineNumber} onChange={(e) => onChange({ ...value, engineNumber: e.target.value })} />
      </Field>
      <Field label="Color">
        <input value={value.color} onChange={(e) => onChange({ ...value, color: e.target.value })} />
      </Field>
      <Field label="Model Year">
        <input type="number" min="1900" max="2100" value={value.modelYear} onChange={(e) => onChange({ ...value, modelYear: e.target.value })} />
      </Field>
      <Field label="Arrival Date">
        <input type="date" value={value.arrivalDate} onChange={(e) => onChange({ ...value, arrivalDate: e.target.value })} />
      </Field>
      <Field label="Delivery Date">
        <input type="date" value={value.deliveryDate} onChange={(e) => onChange({ ...value, deliveryDate: e.target.value })} />
      </Field>
      <Field label="Location">
        <select value={value.locationName} onChange={(e) => onChange({ ...value, locationName: e.target.value })}>
          {locationOptions.map((location) => <option key={location}>{location}</option>)}
        </select>
      </Field>
      <Field label="Lifecycle Notes">
        <textarea value={value.notes} onChange={(e) => onChange({ ...value, notes: e.target.value })} />
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
      <Field label="Customer Type">
        <select value={value.customerType} onChange={(e) => onChange({ ...value, customerType: e.target.value })}>
          {customerTypes.map((type) => <option key={type}>{type}</option>)}
        </select>
      </Field>
      <Field label="Contact Person">
        <input value={value.contactPerson} onChange={(e) => onChange({ ...value, contactPerson: e.target.value })} />
      </Field>
      <Field label="Email">
        <input type="email" value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })} />
      </Field>
      <Field label="Supplier Rating (0-5)">
        <input type="number" min="0" max="5" step="0.1" value={value.rating} onChange={(e) => onChange({ ...value, rating: e.target.value })} />
      </Field>
      <Field label="On-time Delivery %">
        <input type="number" min="0" max="100" value={value.onTimeDeliveryRate} onChange={(e) => onChange({ ...value, onTimeDeliveryRate: e.target.value })} />
      </Field>
      <Field label="Country / City">
        <input value={value.location} onChange={(e) => onChange({ ...value, location: e.target.value })} />
      </Field>
      <Field label="Country">
        <input value={value.country} onChange={(e) => onChange({ ...value, country: e.target.value })} />
      </Field>
      <Field label="City">
        <input value={value.city} onChange={(e) => onChange({ ...value, city: e.target.value })} />
      </Field>
      <Field label="Address">
        <input value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })} />
      </Field>
      <Field label="Preferred Vehicles">
        <input value={value.preferredVehicleTypes} onChange={(e) => onChange({ ...value, preferredVehicleTypes: e.target.value })} />
      </Field>
      <Field label="Preferred Shipping">
        <input value={value.preferredShippingMethod} onChange={(e) => onChange({ ...value, preferredShippingMethod: e.target.value })} />
      </Field>
      <Field label="Customer Rating">
        <select value={value.customerRating} onChange={(e) => onChange({ ...value, customerRating: e.target.value })}>
          {customerRatings.map((rating) => <option key={rating}>{rating}</option>)}
        </select>
      </Field>
      <Field label="Payment Reliability">
        <input type="number" min="0" max="100" value={value.paymentReliabilityScore} onChange={(e) => onChange({ ...value, paymentReliabilityScore: e.target.value })} />
      </Field>
      <Field label="Account Status">
        <select value={value.active ? 'Active' : 'Inactive'} onChange={(e) => onChange({ ...value, active: e.target.value === 'Active' })}>
          <option>Active</option>
          <option>Inactive</option>
        </select>
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

  function applyCarrier(name) {
    const carrier = logisticsPartners.find((item) => item.partnerName === name);
    onChange({ ...value, shippingCompany: name, carrierId: carrier?.id || '' });
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
      <Field label="Destination City">
        <input value={value.destinationCity} onChange={(e) => onChange({ ...value, destinationCity: e.target.value })} />
      </Field>
      <Field label="Origin Country">
        <input value={value.originCountry} onChange={(e) => onChange({ ...value, originCountry: e.target.value })} />
      </Field>
      <Field label="Origin City">
        <input value={value.originCity} onChange={(e) => onChange({ ...value, originCity: e.target.value })} />
      </Field>
      <Field label="Port of Departure">
        <input value={value.portOfDeparture} onChange={(e) => onChange({ ...value, portOfDeparture: e.target.value })} />
      </Field>
      <Field label="Port of Arrival">
        <input value={value.portOfArrival} onChange={(e) => onChange({ ...value, portOfArrival: e.target.value })} />
      </Field>
      <Field label="Shipping Company">
        <input list="logistics-partner-list" value={value.shippingCompany} onChange={(e) => applyCarrier(e.target.value)} />
        <datalist id="logistics-partner-list">
          {logisticsPartners.map((partner) => <option key={partner.id} value={partner.partnerName} />)}
        </datalist>
      </Field>
      <Field label="Shipping Mode">
        <select value={value.shippingMode} onChange={(e) => onChange({ ...value, shippingMode: e.target.value })}>
          {shippingModes.map((mode) => <option key={mode}>{mode}</option>)}
        </select>
      </Field>
      <Field label="Tracking Reference">
        <input value={value.trackingReference} onChange={(e) => onChange({ ...value, trackingReference: e.target.value })} />
      </Field>
      <Field label="Freight Cost">
        <FormattedNumberInput value={value.freightCost} onChange={(nextValue) => onChange({ ...value, freightCost: nextValue })} />
      </Field>
      <Field label="ETA">
        <input type="date" value={value.eta} onChange={(e) => onChange({ ...value, eta: e.target.value })} />
      </Field>
      <Field label="Actual Delivery Date">
        <input type="date" value={value.actualDeliveryDate} onChange={(e) => onChange({ ...value, actualDeliveryDate: e.target.value })} />
      </Field>
      <Field label="Customs Status">
        <select value={value.customsStatus} onChange={(e) => onChange({ ...value, customsStatus: e.target.value })}>
          {customsStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </Field>
      <Field label="Delay Reason">
        <input value={value.delayReason} onChange={(e) => onChange({ ...value, delayReason: e.target.value })} />
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

function ProcurementRequestForm({ value, onChange, onSubmit, editingId, onCancel, suppliers, orders = [] }) {
  function applySupplier(name) {
    const supplier = suppliers.find((item) => item.supplierName === name);
    onChange({
      ...value,
      supplierName: name,
      ...(supplier ? { supplierCountry: supplier.country, supplierId: supplier.id } : { supplierId: '' }),
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
      <Field label="Item Type">
        <select value={value.itemType} onChange={(e) => onChange({ ...value, itemType: e.target.value })}>
          <option>Vehicle</option>
          <option>Service</option>
          <option>Parts</option>
          <option>Other</option>
        </select>
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
      <Field label="Unit Buy Price">
        <FormattedNumberInput value={value.unitBuyPrice} onChange={(nextValue) => onChange({ ...value, unitBuyPrice: nextValue, estimatedPurchaseCost: nextValue })} />
      </Field>
      <Field label="Approved Purchase Amount">
        <FormattedNumberInput value={value.approvedPurchaseAmount} onChange={(nextValue) => onChange({ ...value, approvedPurchaseAmount: nextValue })} />
      </Field>
      <Field label="Estimated Freight Cost">
        <FormattedNumberInput value={value.estimatedFreightCost} onChange={(nextValue) => onChange({ ...value, estimatedFreightCost: nextValue })} />
      </Field>
      <Field label="Requested By">
        <input value={value.requestedBy} onChange={(e) => onChange({ ...value, requestedBy: e.target.value })} />
      </Field>
      <Field label="Linked Customer Order">
        <select value={value.linkedOrderId} onChange={(e) => onChange({ ...value, linkedOrderId: e.target.value })}>
          <option value="">No linked order</option>
          {orders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber} - {order.customerName}</option>)}
        </select>
      </Field>
      <Field label="Expected Delivery">
        <input type="date" value={value.expectedDeliveryDate} onChange={(e) => onChange({ ...value, expectedDeliveryDate: e.target.value })} />
      </Field>
      <Field label="Actual Delivery">
        <input type="date" value={value.actualDeliveryDate} onChange={(e) => onChange({ ...value, actualDeliveryDate: e.target.value })} />
      </Field>
      <Field label="Priority">
        <select value={value.priority} onChange={(e) => onChange({ ...value, priority: e.target.value })}>
          {procurementPriorities.map((priority) => <option key={priority}>{priority}</option>)}
        </select>
      </Field>
      <Field label="Payment Status">
        <select value={value.paymentStatus} onChange={(e) => onChange({ ...value, paymentStatus: e.target.value })}>
          {paymentStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
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
  const safeStatus = textValue(status) || 'Unknown';
  return <span className={`status status-${safeStatus.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{safeStatus}</span>;
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
          redirectTo: `${window.location.origin}/app`,
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
            emailRedirectTo: `${window.location.origin}/app`,
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
          redirectTo: `${window.location.origin}/app`,
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


function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function rankExecutiveData(values, formatter = (value) => value) {
  return Object.entries(values)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value, displayValue: formatter(value) }));
}

function buildExecutiveAnalytics({
  vehicles = [],
  orders = [],
  customers = [],
  shipments = [],
  procurementRequests = [],
  suppliers = [],
  financeRecords = [],
  documents = [],
}) {
  const finance = financeRecords.map(calculateFinanceRecord);
  const financeRevenue = finance.reduce((sum, record) => sum + numberValue(record.totalSaleAmount), 0);
  const financeProfit = finance.reduce((sum, record) => sum + numberValue(record.netProfit), 0);
  const orderRevenueTotal = orders.reduce((sum, order) => sum + orderRevenue(order), 0);
  const orderProfitTotal = orders.reduce((sum, order) => sum + orderProfit(order), 0);
  const revenue = finance.length ? financeRevenue : orderRevenueTotal;
  const profit = finance.length ? financeProfit : orderProfitTotal;
  const outstandingPayments = finance.reduce((sum, record) => sum + numberValue(record.amountPending), 0);
  const amountPaid = finance.reduce((sum, record) => sum + numberValue(record.amountPaid), 0);
  const activeShipments = shipments.filter((shipment) => !['Delivered', 'Cancelled'].includes(shipment.status));
  const delayedShipments = activeShipments.filter((shipment) => (
    shipment.status === 'Delayed' || (shipment.eta && shipment.eta < today)
  ));
  const deliveredShipments = shipments.filter((shipment) => shipment.status === 'Delivered');
  const completedProcurements = procurementRequests.filter((request) => (
    ['Arrived', 'Received', 'Added To Inventory'].includes(request.status)
  ));
  const delayedProcurements = procurementRequests.filter((request) => {
    if (['Arrived', 'Received', 'Added To Inventory', 'Cancelled'].includes(request.status)) return false;
    if (request.status === 'Delayed') return true;
    const reference = request.expectedDeliveryDate || request.createdAt;
    return reference && Math.floor((new Date() - new Date(reference)) / 86400000) > 14;
  });

  const profitability = revenue ? clampScore(50 + (profit / revenue) * 250) : 50;
  const deliveryPerformance = shipments.length
    ? clampScore((deliveredShipments.length / shipments.length) * 100 - delayedShipments.length * 8)
    : 100;
  const paymentCollection = financeRevenue ? clampScore((amountPaid / financeRevenue) * 100) : 100;
  const procurementEfficiency = procurementRequests.length
    ? clampScore((completedProcurements.length / procurementRequests.length) * 100 - delayedProcurements.length * 8)
    : 100;
  const healthScore = clampScore(
    profitability * 0.3
      + deliveryPerformance * 0.25
      + paymentCollection * 0.25
      + procurementEfficiency * 0.2,
  );

  const customerRevenue = orders.reduce((result, order) => {
    const key = textValue(order.customerName) || 'Unassigned customer';
    result[key] = (result[key] || 0) + orderRevenue(order);
    return result;
  }, {});
  const supplierValue = procurementRequests.reduce((result, request) => {
    const key = textValue(request.supplierName) || 'Unassigned supplier';
    result[key] = (result[key] || 0) + procurementValue(request);
    return result;
  }, {});
  const modelSales = orders.reduce((result, order) => {
    const key = textValue(order.vehicle) || 'Unspecified vehicle';
    result[key] = (result[key] || 0) + Math.max(numberValue(order.quantity), 1);
    return result;
  }, {});

  const activities = [
    ...orders.map((order) => ({ type: 'Order', label: `Order ${order.orderNumber} is ${order.status}`, meta: order.customerName, time: order.createdAt || order.orderDate })),
    ...shipments.map((shipment) => ({ type: 'Shipment', label: `Shipment ${shipment.shipmentId} is ${shipment.status}`, meta: shipment.destinationCountry, time: shipment.createdAt || shipment.eta })),
    ...procurementRequests.map((request) => ({ type: 'Procurement', label: `${request.procurementId} is ${request.status}`, meta: `${request.vehicleBrand} ${request.vehicleModel}`.trim(), time: request.createdAt })),
    ...finance.map((record) => ({ type: 'Finance', label: `${record.paymentStatus} finance record`, meta: money.format(record.amountPending || record.totalSaleAmount), time: record.updatedAt || record.createdAt })),
    ...documents.map((document) => ({ type: 'Document', label: document.fileName || 'Business document', meta: document.category || document.linkedModule || 'Document Vault', time: document.uploadedAt })),
  ].sort((left, right) => new Date(right.time || 0) - new Date(left.time || 0));

  const recommendations = [];
  const lowStock = vehicles.filter((vehicle) => numberValue(vehicle.quantity) <= 1);
  if (lowStock.length) recommendations.push({ title: `Reorder ${lowStock.length} low-stock vehicle${lowStock.length === 1 ? '' : 's'}`, detail: 'Protect sales continuity by opening procurement requests for depleted models.', page: 'Inventory', severity: 'High' });
  if (outstandingPayments > 0) recommendations.push({ title: `Follow up ${money.format(outstandingPayments)} in outstanding payments`, detail: 'Prioritize overdue accounts and confirm collection dates with customers.', page: 'Finance', severity: 'High' });
  if (delayedShipments.length) recommendations.push({ title: `Review ${delayedShipments.length} delayed shipment${delayedShipments.length === 1 ? '' : 's'}`, detail: 'Confirm revised ETAs, customs status, and customer communication.', page: 'Shipments', severity: 'Critical' });
  if (delayedProcurements.length) recommendations.push({ title: `Investigate ${delayedProcurements.length} procurement delay${delayedProcurements.length === 1 ? '' : 's'}`, detail: 'Escalate supplier follow-up and validate incoming inventory dates.', page: 'Procurement', severity: 'Medium' });
  const weakSuppliers = suppliers.filter((supplier) => numberValue(supplier.onTimeDeliveryRate) > 0 && numberValue(supplier.onTimeDeliveryRate) < 75);
  if (weakSuppliers.length) recommendations.push({ title: `Review ${weakSuppliers.length} underperforming supplier${weakSuppliers.length === 1 ? '' : 's'}`, detail: 'Compare on-time performance before approving the next procurement order.', page: 'Procurement', severity: 'Medium' });

  return {
    revenue,
    profit,
    outstandingPayments,
    activeOrders: orders.filter((order) => order.status !== 'Completed').length,
    activeShipments: activeShipments.length,
    delayedShipments: delayedShipments.length,
    inventoryValue: vehicles.reduce((sum, vehicle) => sum + numberValue(vehicle.purchasePrice) * numberValue(vehicle.quantity), 0),
    freightCost: shipments.reduce((sum, shipment) => sum + numberValue(shipment.freightCost), 0),
    revenueTrend: trendByMonth(orders, 'orderDate', orderRevenue),
    profitTrend: trendByMonth(orders, 'orderDate', orderProfit),
    customerGrowth: trendByMonth(customers, 'createdAt', () => 1),
    topCustomers: rankExecutiveData(customerRevenue, money.format),
    topSuppliers: rankExecutiveData(supplierValue, money.format),
    topModels: rankExecutiveData(modelSales, (value) => `${formatIndianNumber(value)} units`),
    health: { score: healthScore, profitability, deliveryPerformance, paymentCollection, procurementEfficiency },
    activities,
    recommendations,
  };
}

function ExecutiveRanking({ title, eyebrow, items, emptyLabel }) {
  const maximum = Math.max(...items.map((item) => item.value), 1);
  return (
    <section className="chart-card executive-ranking-card">
      <div className="card-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>
      <div className="executive-ranking-list">
        {items.map((item, index) => (
          <div className="executive-ranking-row" key={item.label}>
            <span>{index + 1}</span>
            <div><strong>{item.label}</strong><i style={{ width: `${Math.max((item.value / maximum) * 100, 4)}%` }} /></div>
            <b>{item.displayValue}</b>
          </div>
        ))}
        {!items.length && <EmptyState label={emptyLabel} icon={BarChart3} />}
      </div>
    </section>
  );
}

function CompanyHealthScore({ health }) {
  const tone = health.score >= 80 ? 'healthy' : health.score >= 60 ? 'watch' : 'risk';
  const factors = [
    ['Profitability', health.profitability],
    ['Delivery performance', health.deliveryPerformance],
    ['Payment collection', health.paymentCollection],
    ['Procurement efficiency', health.procurementEfficiency],
  ];
  return (
    <section className="chart-card company-health-card">
      <div className="card-heading"><div><p className="eyebrow">Company health</p><h2>Operating score</h2></div><span className={`health-score health-${tone}`}>{health.score}</span></div>
      <div className="health-factor-list">
        {factors.map(([label, value]) => <div key={label}><span><b>{label}</b><strong>{value}/100</strong></span><i><em style={{ width: `${value}%` }} /></i></div>)}
      </div>
      <p className="health-caption">Weighted across profitability, delivery reliability, collections, and procurement execution.</p>
    </section>
  );
}

function Dashboard({ vehicles, orders, customers, shipments, procurementRequests, suppliers, financeRecords, documents, orderTimelines, setActivePage, error, authError, healthEvents, canViewFinancials = true }) {
  const analytics = useMemo(() => buildExecutiveAnalytics({
    vehicles, orders, customers, shipments, procurementRequests, suppliers, financeRecords, documents,
  }), [vehicles, orders, customers, shipments, procurementRequests, suppliers, financeRecords, documents]);
  const alerts = useMemo(() => createAlerts({
    vehicles, orders, customers, shipments, orderTimelines, procurementRequests, suppliers, financeRecords,
  }), [vehicles, orders, customers, shipments, orderTimelines, procurementRequests, suppliers, financeRecords]);
  const shipmentBreakdown = countByStatus(shipments);
  const recentOrders = orders.slice(0, 5);
  const visibleRecommendations = analytics.recommendations.filter((item) => canViewFinancials || item.page !== 'Finance');

  return (
    <section className="page-stack executive-dashboard">
      <div className="hero premium-hero executive-hero">
        <div>
          <p className="eyebrow">Velora Motors Ltd.</p>
          <h1>Executive Command Center</h1>
          <p>Company performance, operating risk, cash collection, and management priorities in one decision-ready workspace.</p>
        </div>
        <div className="executive-hero-score"><span>Company health</span><strong>{analytics.health.score}</strong><small>out of 100</small></div>
      </div>

      <div className="metrics-grid executive-kpis">
        {canViewFinancials && <Metric label="Revenue" value={money.format(analytics.revenue)} tone="accent" icon={BarChart3} />}
        {canViewFinancials && <Metric label="Profit" value={money.format(analytics.profit)} tone="success" icon={Activity} />}
        <Metric label="Active orders" value={analytics.activeOrders} icon={ClipboardList} />
        <Metric label="Active shipments" value={analytics.activeShipments} icon={Truck} />
        <Metric label="Delayed shipments" value={analytics.delayedShipments} tone={analytics.delayedShipments ? 'danger' : 'success'} icon={AlertTriangle} />
        {canViewFinancials && <Metric label="Outstanding payments" value={money.format(analytics.outstandingPayments)} tone={analytics.outstandingPayments ? 'danger' : 'success'} icon={CircleDollarSign} />}
        {canViewFinancials && <Metric label="Inventory value" value={money.format(analytics.inventoryValue)} icon={Boxes} />}
        {canViewFinancials && <Metric label="Freight cost" value={money.format(analytics.freightCost)} icon={Truck} />}
      </div>

      <div className="executive-primary-grid">
        {canViewFinancials && (
          <section className="chart-card executive-trend-card">
            <div className="card-heading"><div><p className="eyebrow">Financial performance</p><h2>Revenue and profit trend</h2></div></div>
            {analytics.revenueTrend.length || analytics.profitTrend.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.revenueTrend.map((item) => ({ ...item, revenue: item.value, profit: analytics.profitTrend.find((profit) => profit.month === item.month)?.value || 0 }))}>
                  <defs><linearGradient id="executiveRevenue" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="month" stroke="var(--muted)" /><YAxis stroke="var(--muted)" />
                  <Tooltip formatter={(value) => money.format(value)} contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#executiveRevenue)" strokeWidth={3} />
                  <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="transparent" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState label="Revenue and profit trends will appear after orders are recorded." icon={BarChart3} />}
          </section>
        )}
        <CompanyHealthScore health={analytics.health} />
      </div>

      <div className="dashboard-grid executive-analytics-grid">
        <section className="chart-card customer-growth-card">
          <div className="card-heading"><div><p className="eyebrow">Customer analytics</p><h2>Customer growth</h2></div></div>
          {analytics.customerGrowth.length ? <ResponsiveContainer width="100%" height={230}><AreaChart data={analytics.customerGrowth}><CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" /><XAxis dataKey="month" stroke="var(--muted)" /><YAxis allowDecimals={false} stroke="var(--muted)" /><Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12 }} /><Area type="monotone" dataKey="value" stroke="#38bdf8" fill="#38bdf833" strokeWidth={3} /></AreaChart></ResponsiveContainer> : <EmptyState label="Customer growth will appear as records are added." icon={Users} />}
        </section>
        <section className="chart-card shipment-status-card">
          <div className="card-heading"><div><p className="eyebrow">Logistics analytics</p><h2>Shipment status</h2></div></div>
          {shipmentBreakdown.length ? <ResponsiveContainer width="100%" height={230}><PieChart><Pie data={shipmentBreakdown} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={4}>{shipmentBreakdown.map((entry, index) => <Cell key={entry.name} fill={['#3b82f6', '#22c55e', '#f59e0b', '#38bdf8', '#ef4444'][index % 5]} />)}</Pie><Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12 }} /></PieChart></ResponsiveContainer> : <EmptyState label="Shipment status appears when logistics records are added." icon={Truck} />}
        </section>
        <ExecutiveRanking eyebrow="Commercial" title="Top customers" items={analytics.topCustomers} emptyLabel="Customer rankings need order data." />
        <ExecutiveRanking eyebrow="Procurement" title="Top suppliers" items={analytics.topSuppliers} emptyLabel="Supplier rankings need procurement data." />
        <ExecutiveRanking eyebrow="Product demand" title="Top vehicle models" items={analytics.topModels} emptyLabel="Vehicle rankings need order data." />
      </div>

      <div className="executive-decision-grid">
        <section className="chart-card executive-alert-card">
          <div className="card-heading"><div><p className="eyebrow">Alert Center</p><h2>Priority risks</h2></div><button className="mini" onClick={() => setActivePage('Alerts Center')}>View all</button></div>
          <div className="alert-list compact">{alerts.slice(0, 5).map((alert) => <div className="alert-row" key={alert.id}><AlertBadge severity={alert.severity} /><div><strong>{alert.title}</strong><small>{alert.message}</small></div></div>)}{!alerts.length && <EmptyState label="No operating risks need attention." icon={ShieldCheck} />}</div>
        </section>
        <section className="chart-card recommendation-card">
          <div className="card-heading"><div><p className="eyebrow">Decision support</p><h2>Recommended actions</h2></div></div>
          <div className="recommendation-list">{visibleRecommendations.slice(0, 5).map((item) => <button key={item.title} onClick={() => setActivePage(item.page)}><AlertBadge severity={item.severity} /><span><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight size={17} /></button>)}{!visibleRecommendations.length && <EmptyState label="No immediate management actions are required." icon={PackageCheck} />}</div>
        </section>
      </div>

      <section className="activity-card executive-activity-card">
        <div className="card-heading"><div><p className="eyebrow">Global activity</p><h2>Company-wide operating feed</h2></div></div>
        <div className="activity-list">{analytics.activities.slice(0, 10).map((item, index) => <div className="activity-item" key={`${item.type}-${item.label}-${index}`}><span><Activity size={16} /></span><div><strong>{item.label}</strong><small>{item.type} - {item.meta || 'Velora record'}{item.time ? ` - ${new Date(item.time).toLocaleString()}` : ''}</small></div></div>)}{!analytics.activities.length && <EmptyState label="Company activity will appear as teams update records." icon={Activity} />}</div>
      </section>

      {canViewFinancials && <section className="chart-card executive-report-center"><div className="card-heading"><div><p className="eyebrow">Report Center</p><h2>Management exports</h2></div><button className="report-center-action" onClick={() => setActivePage('Reports')}><FileText size={17} />Open all reports</button></div><div className="executive-report-links">{['Revenue report', 'Profit report', 'Customer report', 'Shipment report'].map((label) => <button key={label} onClick={() => setActivePage('Reports')}><FileText size={18} /><span>{label}</span><Download size={16} /></button>)}</div></section>}

      <div className="section-heading compact-heading"><div><p className="eyebrow">Live pipeline</p><h2>Recent orders</h2></div></div>
      <div className="table-shell"><table><thead><tr><th>Order Number</th><th>Customer</th><th>Vehicle</th>{canViewFinancials && <th>Revenue</th>}{canViewFinancials && <th>Profit</th>}<th>Status</th></tr></thead><tbody>{recentOrders.map((order) => <tr key={order.id}><td>{order.orderNumber}</td><td>{order.customerName}</td><td>{order.vehicle}</td>{canViewFinancials && <td>{money.format(orderRevenue(order))}</td>}{canViewFinancials && <td>{money.format(orderProfit(order))}</td>}<td><StatusBadge status={order.status} /></td></tr>)}</tbody></table>{!recentOrders.length && <EmptyState label="Recent orders will appear here." icon={ClipboardList} />}</div>
      <SystemHealthPanel vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} error={error} authError={authError} healthEvents={healthEvents} />
    </section>
  );
}
function Inventory({ vehicles, vehicleEvents = {}, saveVehicle, deleteVehicle, canEdit, canDelete }) {
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const nextVehicleId = useMemo(() => nextDisplayId(vehicles, 'id'), [vehicles]);
  const newVehicleForm = useMemo(() => ({ ...blankVehicle, id: nextVehicleId }), [nextVehicleId]);
  const [form, setForm] = useState(newVehicleForm);
  const [editingId, setEditingId] = useState('');
  const [expandedId, setExpandedId] = useState('');
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

  async function importVehicles(rows) {
    let imported = 0;
    const workingVehicles = [...vehicles];
    for (const row of rows) {
      const requestedId = csvValue(row, ['vehicle_id', 'inventory_id', 'id']);
      const vehicle = {
        ...blankVehicle,
        id: requestedId || nextDisplayId(workingVehicles, 'id'),
        brand: csvValue(row, 'brand'),
        model: csvValue(row, 'model'),
        category: csvValue(row, 'category'),
        quantity: Math.max(numberValue(csvValue(row, 'quantity', 1)), 0),
        purchasePrice: numberValue(csvValue(row, ['purchase_price', 'purchase_cost', 'buy_price'])),
        sellingPrice: numberValue(csvValue(row, ['selling_price', 'sale_price', 'listed_price'])),
        status: normalizeCsvStatus(csvValue(row, 'status'), vehicleStatuses, 'Available'),
        lifecycleStatus: normalizeCsvStatus(csvValue(row, ['lifecycle_status', 'lifecycle']), vehicleLifecycleStatuses, 'In Inventory'),
        variant: csvValue(row, 'variant'),
        vin: csvValue(row, 'vin'),
        engineNumber: csvValue(row, ['engine_number', 'engine_no']),
        color: csvValue(row, 'color'),
        modelYear: csvValue(row, ['model_year', 'year']),
        supplierId: csvValue(row, ['supplier_id', 'supplier']),
        linkedProcurementId: csvValue(row, ['linked_procurement_id', 'procurement_id']),
        linkedOrderId: csvValue(row, ['linked_order_id', 'order_id']),
        linkedShipmentId: csvValue(row, ['linked_shipment_id', 'shipment_id']),
        arrivalDate: csvValue(row, ['arrival_date', 'received_date']),
        deliveryDate: csvValue(row, ['delivery_date', 'sold_date']),
        notes: csvValue(row, ['notes', 'note', 'remarks']),
        locationName: csvValue(row, ['location_name', 'location'], 'Seoul HQ'),
        department: csvValue(row, 'department', 'Inventory'),
      };
      if (!vehicle.id || !vehicle.brand || !vehicle.model) continue;
      const saved = await saveVehicle(vehicle, '');
      workingVehicles.push(saved || vehicle);
      imported += 1;
    }
    return imported;
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
      {canEdit && (
        <CsvImportPanel
          title="Import inventory"
          description="Bulk-create vehicle inventory records from a CSV file, including lifecycle, location, VIN, supplier, and linked operation fields."
          sampleHeaders="vehicle_id,brand,model,category,quantity,purchase_price,selling_price,status,lifecycle_status,variant,vin,engine_number,color,model_year,supplier_id,linked_procurement_id,linked_order_id,linked_shipment_id,arrival_date,delivery_date,location_name,department,notes"
          onImport={importVehicles}
        />
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
              <th>Purchase Price</th>
              <th>Selling Price</th>
              <th>Profit Amount</th>
              <th>Profit Margin %</th>
              <th>Status</th>
              <th>Lifecycle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((vehicle) => (
              <React.Fragment key={vehicle.id}>
                <tr>
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
                  <td><StatusBadge status={vehicle.lifecycleStatus} /></td>
                  <td className="row-actions">
                    <button className="mini" onClick={() => setExpandedId(expandedId === vehicle.id ? '' : vehicle.id)}>{expandedId === vehicle.id ? 'Close' : 'Details'}</button>
                    {canEdit && <button className="mini" onClick={() => editVehicle(vehicle)}>Edit</button>}
                    {canDelete && <button className="mini danger" onClick={() => confirmDeleteVehicle(vehicle)}>Delete</button>}
                    {!canEdit && !canDelete && <span className="locked-label">Locked</span>}
                  </td>
                </tr>
                {expandedId === vehicle.id && (
                  <tr className="timeline-row">
                    <td colSpan="12">
                      <div className="enterprise-detail">
                        <div className="detail-facts">
                          <span><small>VIN</small><strong>{vehicle.vin || 'Not recorded'}</strong></span>
                          <span><small>Variant</small><strong>{vehicle.variant || 'Standard'}</strong></span>
                          <span><small>Color / Year</small><strong>{[vehicle.color, vehicle.modelYear].filter(Boolean).join(' / ') || 'Not recorded'}</strong></span>
                          <span><small>Current location</small><strong>{vehicle.locationName}</strong></span>
                        </div>
                        <div className="timeline-track compact-timeline">
                          {(vehicleEvents[vehicle.id] || []).map((event) => (
                            <div className="timeline-step complete" key={event.id}>
                              <span className="timeline-dot" />
                              <div><strong>{event.status}</strong><small>{new Date(event.createdAt).toLocaleString()}</small><p>{event.note}</p></div>
                            </div>
                          ))}
                          {!(vehicleEvents[vehicle.id] || []).length && <EmptyState label="Lifecycle history begins after the Phase 2 migration is installed." icon={Activity} />}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No vehicles found." />}
        <TableFooter count={table.count} page={table.page} totalPages={table.totalPages} firstItem={table.firstItem} lastItem={table.lastItem} onPageChange={table.setPage} />
      </div>
    </section>
  );
}

function Procurement({ procurementRequests, suppliers, orders, procurementTimelines, saveProcurementRequest, deleteProcurementRequest, addProcurementTimelineNote, saveSupplier, deleteSupplier, canEdit, canDelete }) {
  const confirm = useConfirm();
  const nextId = useMemo(() => nextProcurementId(procurementRequests), [procurementRequests]);
  const newRequestForm = useMemo(() => ({ ...blankProcurementRequest, procurementId: nextId }), [nextId]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
    const priorityMatches = priorityFilter === 'All' || request.priority === priorityFilter;
    const supplierMatches = supplierFilter === 'All' || request.supplierName === supplierFilter;
    return statusMatches && priorityMatches && supplierMatches && inDateRange(request.createdAt, startDate, endDate) && matchesSearch(request, query);
  });
  const requestTable = useTableView(filtered, { initialSortKey: 'procurementId' });
  const supplierTable = useTableView(suppliers, { initialSortKey: 'supplierName' });
  const totals = {
    active: procurementRequests.filter((request) => !['Received', 'Added To Inventory', 'Cancelled'].includes(request.status)).length,
    value: procurementRequests.reduce((sum, request) => sum + procurementValue(request), 0),
    pendingApprovals: procurementRequests.filter((request) => ['Draft', 'Pending Approval', 'Requested', 'Supplier Identified', 'Negotiation'].includes(request.status)).length,
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

  async function importProcurements(rows) {
    let imported = 0;
    const workingRequests = [...procurementRequests];
    for (const row of rows) {
      const supplierName = csvValue(row, ['supplier_name', 'supplier']);
      const supplier = suppliers.find((item) => sameText(item.supplierName, supplierName));
      const orderReference = csvValue(row, ['linked_order_id', 'order_id', 'order_number']);
      const linkedOrder = orders.find((order) => order.id === orderReference || order.orderNumber === orderReference);
      const request = {
        ...blankProcurementRequest,
        procurementId: csvValue(row, ['procurement_id', 'request_id']) || nextProcurementId(workingRequests),
        vehicleBrand: csvValue(row, ['vehicle_brand', 'brand']),
        vehicleModel: csvValue(row, ['vehicle_model', 'model']),
        quantity: Math.max(numberValue(csvValue(row, 'quantity', 1)), 1),
        supplierName,
        supplierId: csvValue(row, 'supplier_id', supplier?.id || ''),
        supplierCountry: csvValue(row, ['supplier_country', 'country'], supplier?.country || ''),
        estimatedPurchaseCost: numberValue(csvValue(row, ['estimated_purchase_cost', 'purchase_cost', 'unit_purchase_cost'])),
        estimatedFreightCost: numberValue(csvValue(row, ['estimated_freight_cost', 'freight_cost'])),
        itemType: csvValue(row, ['item_type', 'type'], 'Vehicle'),
        unitBuyPrice: numberValue(csvValue(row, ['unit_buy_price', 'unit_price'])),
        approvedPurchaseAmount: numberValue(csvValue(row, ['approved_purchase_amount', 'approved_amount'])),
        currency: csvValue(row, 'currency', 'INR'),
        linkedOrderId: linkedOrder?.id || (isUuid(orderReference) ? orderReference : ''),
        expectedDeliveryDate: csvValue(row, ['expected_delivery_date', 'expected_date']),
        actualDeliveryDate: csvValue(row, ['actual_delivery_date', 'arrival_date']),
        paymentStatus: normalizeCsvStatus(csvValue(row, 'payment_status'), paymentStatuses, 'Unpaid'),
        priority: normalizeCsvStatus(csvValue(row, 'priority'), procurementPriorities, 'Medium'),
        requestedBy: csvValue(row, ['requested_by', 'requester']),
        status: normalizeCsvStatus(csvValue(row, 'status'), procurementStatuses, 'Requested'),
        notes: csvValue(row, ['notes', 'note', 'remarks']),
      };
      if (!request.vehicleBrand || !request.vehicleModel) continue;
      const saved = await saveProcurementRequest(request, '');
      workingRequests.push(saved || request);
      imported += 1;
    }
    return imported;
  }

  async function importSuppliers(rows) {
    let imported = 0;
    for (const row of rows) {
      const supplier = {
        ...blankSupplier,
        supplierName: csvValue(row, ['supplier_name', 'supplier', 'name']),
        country: csvValue(row, 'country'),
        contactPerson: csvValue(row, ['contact_person', 'contact']),
        phone: csvValue(row, ['phone', 'phone_number', 'mobile']),
        email: csvValue(row, ['email', 'email_address']),
        rating: csvValue(row, 'rating'),
        onTimeDeliveryRate: csvValue(row, ['on_time_delivery_rate', 'on_time_rate']),
        totalOrders: numberValue(csvValue(row, ['total_orders', 'orders'])),
        lastActivityAt: csvValue(row, ['last_activity_at', 'last_activity_date']),
        notes: csvValue(row, ['notes', 'note', 'remarks']),
      };
      if (!supplier.supplierName) continue;
      await saveSupplier(supplier, '');
      imported += 1;
    }
    return imported;
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
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option>All</option>
            {procurementPriorities.map((priority) => <option key={priority}>{priority}</option>)}
          </select>
          <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
            <option>All</option>
            {suppliers.map((supplier) => <option key={supplier.id}>{supplier.supplierName}</option>)}
          </select>
          <input type="date" aria-label="Procurement start date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" aria-label="Procurement end date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
      {canEdit && <ProcurementRequestForm value={requestForm} onChange={setRequestForm} onSubmit={submitRequest} editingId={editingRequestId} suppliers={suppliers} orders={orders} onCancel={() => { setRequestForm(newRequestForm); setEditingRequestId(''); }} />}
      {canEdit && (
        <CsvImportPanel
          title="Import procurement"
          description="Bulk-create procurement requests from CSV, including supplier, linked order, payment, priority, and delivery fields."
          sampleHeaders="procurement_id,vehicle_brand,vehicle_model,quantity,supplier_name,supplier_id,supplier_country,estimated_purchase_cost,estimated_freight_cost,item_type,unit_buy_price,approved_purchase_amount,currency,linked_order_id,expected_delivery_date,actual_delivery_date,payment_status,priority,requested_by,status,notes"
          onImport={importProcurements}
        />
      )}
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
              <th>Priority</th>
              <th>Expected</th>
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
                  <td><StatusBadge status={request.priority} /></td>
                  <td>{request.expectedDeliveryDate || 'Not set'}</td>
                  <td><StatusBadge status={request.status} /></td>
                  <td className="row-actions">
                    <button className="mini" onClick={() => setExpandedId(expandedId === request.procurementId ? '' : request.procurementId)}>{expandedId === request.procurementId ? 'Hide timeline' : 'Timeline'}</button>
                    {canEdit && <button className="mini" onClick={() => { setRequestForm(request); setEditingRequestId(request.procurementId); }}>Edit</button>}
                    {canDelete && <button className="mini danger" onClick={() => confirmDeleteProcurement(request)}>Delete</button>}
                  </td>
                </tr>
                {expandedId === request.procurementId && (
                  <tr className="timeline-row">
                    <td colSpan="13">
                      <div className="timeline-panel">
                        <div className="detail-facts">
                          <span><small>Approved amount</small><strong>{money.format(request.approvedPurchaseAmount)}</strong></span>
                          <span><small>Payment</small><strong>{request.paymentStatus}</strong></span>
                          <span><small>Linked order</small><strong>{orders.find((order) => order.id === request.linkedOrderId)?.orderNumber || 'Not linked'}</strong></span>
                          <span><small>Actual arrival</small><strong>{request.actualDeliveryDate || 'Pending'}</strong></span>
                        </div>
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
      {canEdit && (
        <CsvImportPanel
          title="Import suppliers"
          description="Bulk-create supplier records with contacts, rating, delivery history, and notes."
          sampleHeaders="supplier_name,country,contact_person,phone,email,rating,on_time_delivery_rate,total_orders,last_activity_at,notes"
          onImport={importSuppliers}
        />
      )}
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Country</th>
              <th>Contact</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Rating</th>
              <th>On-time %</th>
              <th>Orders</th>
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
                <td>{supplier.rating === '' ? 'Not rated' : `${supplier.rating}/5`}</td>
                <td>{supplier.onTimeDeliveryRate === '' ? 'No history' : `${supplier.onTimeDeliveryRate}%`}</td>
                <td>{procurementRequests.filter((request) => request.supplierName === supplier.supplierName).length}</td>
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
    const customer = customers.find((item) => sameText(item.name, order.customerName));
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
        department: csvValue(row, 'department', 'Sales'),
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
          sampleHeaders="order_number,customer_name,vehicle,quantity,order_date,purchase_cost,selling_price,status,location_name,department"
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
    return customers.find((item) => sameText(item.name, quote.customerName));
  }

  async function confirmDeleteQuote(quote) {
    const approved = await confirm({
      title: 'Delete quote?',
      message: `${quote.quoteId} for ${quote.customerName} will be permanently removed.`,
      confirmLabel: 'Delete quote',
    });
    if (approved) await deleteQuote(quote.quoteId);
  }

  async function importQuotes(rows) {
    let imported = 0;
    const workingQuotes = [...quotes];
    for (const row of rows) {
      const vehicleName = csvValue(row, 'vehicle');
      const quantity = Math.max(numberValue(csvValue(row, 'quantity', 1)), 1);
      const inventoryVehicle = vehicles.find((vehicle) => `${vehicle.brand} ${vehicle.model}`.trim().toLowerCase() === vehicleName.trim().toLowerCase());
      const purchaseCost = csvValue(row, ['purchase_cost', 'purchase_price'])
        || (inventoryVehicle ? inventoryVehicle.purchasePrice * quantity : 0);
      const sellingPrice = csvValue(row, ['selling_price', 'quoted_price', 'quote_price'])
        || (inventoryVehicle ? inventoryVehicle.sellingPrice * quantity : 0);
      const quote = {
        ...blankQuote,
        quoteId: csvValue(row, ['quote_id', 'quote_number']) || nextQuoteId(workingQuotes),
        customerName: csvValue(row, ['customer_name', 'customer']),
        vehicle: vehicleName,
        quantity,
        validUntil: csvValue(row, ['valid_until', 'expiry_date'], today),
        purchaseCost: numberValue(purchaseCost),
        sellingPrice: numberValue(sellingPrice),
        status: normalizeCsvStatus(csvValue(row, 'status'), quoteStatuses, 'Draft'),
        notes: csvValue(row, ['notes', 'note', 'remarks']),
        locationName: csvValue(row, ['location_name', 'location'], 'Seoul HQ'),
        department: csvValue(row, 'department', 'Finance'),
      };
      if (!quote.customerName || !quote.vehicle) continue;
      const saved = await saveQuote(quote, '');
      workingQuotes.push(saved || quote);
      imported += 1;
    }
    return imported;
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
      {canEdit && (
        <CsvImportPanel
          title="Import quotes"
          description="Bulk-create customer quotation records from CSV. Missing prices can be filled from matching inventory vehicles."
          sampleHeaders="quote_id,customer_name,vehicle,quantity,valid_until,purchase_cost,selling_price,status,location_name,department,notes"
          onImport={importQuotes}
        />
      )}
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

function Customers({
  customers,
  orders = [],
  shipments = [],
  financeRecords = [],
  documents = [],
  customerContacts = [],
  customerNotes = [],
  saveCustomer,
  deleteCustomer,
  saveCustomerContact,
  deleteCustomerContact,
  addCustomerNote,
  deleteCustomerNote,
  canEdit,
  canDelete,
}) {
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(blankCustomer);
  const [editingId, setEditingId] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [contactForm, setContactForm] = useState({ fullName: '', jobTitle: '', email: '', phone: '', isPrimary: false });
  const [noteText, setNoteText] = useState('');
  const filtered = customers.filter((customer) => matchesSearch(customer, query));
  const table = useTableView(filtered, { initialSortKey: 'name' });
  const customerMetrics = {
    total: customers.length,
    active: customers.filter((customer) => customer.active).length,
    highValue: customers.filter((customer) => {
      const revenue = orders.filter((order) => order.customerName === customer.name).reduce((sum, order) => sum + orderRevenue(order), 0);
      return revenue >= 5000000;
    }).length,
    risk: customers.filter((customer) => customer.customerRating === 'Risk').length,
  };

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
        location: csvValue(row, ['country_city', 'location'], [csvValue(row, 'country'), csvValue(row, 'city')].filter(Boolean).join(' / ')),
        customerType: csvValue(row, ['customer_type', 'type'], 'Company'),
        country: csvValue(row, 'country'),
        city: csvValue(row, 'city'),
        contactPerson: csvValue(row, ['contact_person', 'primary_contact', 'contact']),
        address: csvValue(row, 'address'),
        preferredVehicleTypes: csvValue(row, ['preferred_vehicle_types', 'preferred_vehicles', 'vehicle_preferences']),
        preferredShippingMethod: csvValue(row, ['preferred_shipping_method', 'shipping_method']),
        customerRating: csvValue(row, ['customer_rating', 'rating'], 'B'),
        paymentReliabilityScore: numberValue(csvValue(row, ['payment_reliability_score', 'reliability_score'], 75)),
        active: csvBoolean(csvValue(row, 'active'), true),
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

  async function submitContact(event, customerId) {
    event.preventDefault();
    if (!contactForm.fullName.trim()) return;
    await saveCustomerContact({ ...contactForm, customerId });
    setContactForm({ fullName: '', jobTitle: '', email: '', phone: '', isPrimary: false });
  }

  async function submitNote(event, customerId) {
    event.preventDefault();
    if (!noteText.trim()) return;
    await addCustomerNote(customerId, noteText.trim());
    setNoteText('');
  }

  async function confirmDeleteContact(contact) {
    const approved = await confirm({
      title: 'Delete customer contact?',
      message: `${contact.fullName} will be removed from this customer profile.`,
      confirmLabel: 'Delete contact',
    });
    if (approved) await deleteCustomerContact(contact.id);
  }

  async function confirmDeleteNote(note) {
    const approved = await confirm({
      title: 'Delete customer note?',
      message: 'This timestamped CRM note will be permanently removed.',
      confirmLabel: 'Delete note',
    });
    if (approved) await deleteCustomerNote(note.id);
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
      <div className="metrics-grid reports-summary">
        <Metric label="Total customers" value={customerMetrics.total} icon={Users} />
        <Metric label="Active customers" value={customerMetrics.active} tone="success" icon={Contact} />
        <Metric label="High-value customers" value={customerMetrics.highValue} tone="accent" icon={CircleDollarSign} />
        <Metric label="Risk customers" value={customerMetrics.risk} tone="danger" icon={AlertTriangle} />
      </div>
      {canEdit && <CustomerForm value={form} onChange={setForm} onSubmit={submitCustomer} editingId={editingId} onCancel={() => { setForm(blankCustomer); setEditingId(''); }} />}
      {canEdit && (
        <CsvImportPanel
          title="Import customers"
          description="Bulk-create customer records from a CSV file. Customer IDs are generated automatically when omitted or already in use."
          sampleHeaders="customer_id,customer_name,phone,email,country,city,location,customer_type,contact_person,address,preferred_vehicle_types,preferred_shipping_method,customer_rating,payment_reliability_score,active,notes,department"
          onImport={importCustomers}
        />
      )}
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Type</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Country / City</th>
              <th>Rating</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((customer) => {
              const customerOrders = orders.filter((order) => sameText(order.customerName, customer.name));
              const customerShipments = shipments.filter((shipment) => shipment.customerId === customer.id || sameText(shipment.customerName, customer.name));
              const customerFinance = financeRecords.filter((record) => record.customerId === customer.id);
              const customerDocuments = documents.filter((item) => item.linkedModule === 'Customers' && item.linkedRecordId === customer.id);
              const contacts = customerContacts.filter((item) => item.customerId === customer.id);
              const notes = customerNotes.filter((item) => item.customerId === customer.id);
              const revenue = customerOrders.reduce((sum, order) => sum + orderRevenue(order), 0);
              const profit = customerFinance.reduce((sum, record) => sum + record.netProfit, 0);
              const outstanding = customerFinance.reduce((sum, record) => sum + record.amountPending, 0);
              return (
                <React.Fragment key={customer.id}>
                  <tr>
                    <td>{customer.name}</td>
                    <td>{customer.customerType}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.email}</td>
                    <td>{customer.location || [customer.country, customer.city].filter(Boolean).join(' / ')}</td>
                    <td><StatusBadge status={customer.customerRating} /></td>
                    <td>{customer.notes}</td>
                    <td className="row-actions">
                      <button className="mini" onClick={() => setExpandedId(expandedId === customer.id ? '' : customer.id)}>{expandedId === customer.id ? 'Close' : 'Profile'}</button>
                      {canEdit && <button className="mini" onClick={() => { setForm(customer); setEditingId(customer.id); }}>Edit</button>}
                      {canDelete && <button className="mini danger" onClick={() => confirmDeleteCustomer(customer)}>Delete</button>}
                      {!canEdit && !canDelete && <span className="locked-label">Locked</span>}
                    </td>
                  </tr>
                  {expandedId === customer.id && (
                    <tr className="timeline-row">
                      <td colSpan="8">
                        <div className="customer-profile">
                          <div className="profile-identity">
                            <span className="avatar large">{customer.name.slice(0, 1).toUpperCase()}</span>
                            <div><h3>{customer.name}</h3><p>{customer.contactPerson || 'Primary contact not recorded'} · Reliability {customer.paymentReliabilityScore}/100</p></div>
                          </div>
                          <div className="detail-facts">
                            <span><small>Total orders</small><strong>{customerOrders.length}</strong></span>
                            <span><small>Total revenue</small><strong>{money.format(revenue)}</strong></span>
                            <span><small>Recorded profit</small><strong>{money.format(profit)}</strong></span>
                            <span><small>Outstanding</small><strong>{money.format(outstanding)}</strong></span>
                            <span><small>Shipments</small><strong>{customerShipments.length}</strong></span>
                            <span><small>Documents</small><strong>{customerDocuments.length}</strong></span>
                          </div>
                          <div className="linked-records">
                            <div><small>Recent orders</small>{customerOrders.slice(0, 3).map((order) => <p key={order.id}>{order.orderNumber} · {order.vehicle} · {order.status}</p>)}</div>
                            <div><small>Recent shipments</small>{customerShipments.slice(0, 3).map((shipment) => <p key={shipment.shipmentId}>{shipment.shipmentId} · {shipment.status}</p>)}</div>
                          </div>
                          <div className="crm-profile-grid">
                            <section>
                              <div className="card-heading"><div><p className="eyebrow">Contacts</p><h3>Customer team</h3></div></div>
                              <div className="crm-list">
                                {contacts.map((contact) => (
                                  <article key={contact.id}>
                                    <div><strong>{contact.fullName}{contact.isPrimary ? ' · Primary' : ''}</strong><small>{contact.jobTitle || 'Contact'} · {contact.email || contact.phone || 'No details'}</small></div>
                                    {canEdit && <button className="mini danger" onClick={() => confirmDeleteContact(contact)}>Delete</button>}
                                  </article>
                                ))}
                                {!contacts.length && <p className="muted-copy">No additional contacts yet.</p>}
                              </div>
                              {canEdit && (
                                <form className="crm-inline-form" onSubmit={(event) => submitContact(event, customer.id)}>
                                  <input placeholder="Full name" value={contactForm.fullName} onChange={(event) => setContactForm({ ...contactForm, fullName: event.target.value })} required />
                                  <input placeholder="Job title" value={contactForm.jobTitle} onChange={(event) => setContactForm({ ...contactForm, jobTitle: event.target.value })} />
                                  <input type="email" placeholder="Email" value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} />
                                  <input placeholder="Phone" value={contactForm.phone} onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })} />
                                  <label className="inline-check"><input type="checkbox" checked={contactForm.isPrimary} onChange={(event) => setContactForm({ ...contactForm, isPrimary: event.target.checked })} /> Primary contact</label>
                                  <button type="submit">Add contact</button>
                                </form>
                              )}
                            </section>
                            <section>
                              <div className="card-heading"><div><p className="eyebrow">CRM notes</p><h3>Relationship history</h3></div></div>
                              <div className="crm-list">
                                {notes.slice(0, 6).map((note) => (
                                  <article key={note.id}>
                                    <div><strong>{note.note}</strong><small>{new Date(note.createdAt).toLocaleString()}</small></div>
                                    {canEdit && <button className="mini danger" onClick={() => confirmDeleteNote(note)}>Delete</button>}
                                  </article>
                                ))}
                                {!notes.length && <p className="muted-copy">No timestamped notes yet.</p>}
                              </div>
                              {canEdit && (
                                <form className="timeline-note-form" onSubmit={(event) => submitNote(event, customer.id)}>
                                  <input placeholder="Add a customer note" value={noteText} onChange={(event) => setNoteText(event.target.value)} />
                                  <button type="submit">Add note</button>
                                </form>
                              )}
                            </section>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No customers found." icon={Users} />}
        <TableFooter count={table.count} page={table.page} totalPages={table.totalPages} firstItem={table.firstItem} lastItem={table.lastItem} onPageChange={table.setPage} />
      </div>
    </section>
  );
}

function Shipments({ shipments, shipmentEvents = {}, saveShipment, deleteShipment, orders, logisticsPartners = [], saveLogisticsPartner, deleteLogisticsPartner, canEdit, canDelete }) {
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [carrierFilter, setCarrierFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [form, setForm] = useState(blankShipment);
  const [editingId, setEditingId] = useState('');
  const [partnerForm, setPartnerForm] = useState(blankLogisticsPartner);
  const [editingPartnerId, setEditingPartnerId] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const filtered = shipments.filter((shipment) => {
    const statusMatches = statusFilter === 'All' || shipment.status === statusFilter;
    const locationMatches = locationFilter === 'All' || shipment.locationName === locationFilter;
    const carrierMatches = carrierFilter === 'All' || shipment.shippingCompany === carrierFilter;
    return statusMatches && locationMatches && carrierMatches && inDateRange(shipment.eta, startDate, endDate) && matchesSearch(shipment, query);
  });
  const table = useTableView(filtered, { initialSortKey: 'shipmentId' });
  const partnerTable = useTableView(logisticsPartners, { initialSortKey: 'partnerName' });
  const orderNumberById = useMemo(() => {
    return orders.reduce((lookup, order) => ({ ...lookup, [order.id]: order.orderNumber || order.id }), {});
  }, [orders]);
  const shipmentMetrics = {
    active: shipments.filter((shipment) => !['Delivered', 'Cancelled'].includes(shipment.status)).length,
    delayed: shipments.filter((shipment) => shipment.status === 'Delayed').length,
    deliveredThisMonth: shipments.filter((shipment) => shipment.status === 'Delivered' && String(shipment.actualDeliveryDate || '').startsWith(today.slice(0, 7))).length,
    freight: shipments.reduce((sum, shipment) => sum + numberValue(shipment.freightCost), 0),
  };

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
        customerId: csvValue(row, ['customer_id'], ''),
        customerName: csvValue(row, ['customer_name', 'customer'], linkedOrder?.customerName || ''),
        vehicle: csvValue(row, 'vehicle', linkedOrder?.vehicle || ''),
        quantity: Math.max(numberValue(csvValue(row, 'quantity', linkedOrder?.quantity || 1)), 1),
        destinationCountry: csvValue(row, ['destination_country', 'destination']),
        destinationCity: csvValue(row, ['destination_city', 'destination_port_city']),
        originCountry: csvValue(row, ['origin_country', 'origin']),
        originCity: csvValue(row, ['origin_city']),
        portOfDeparture: csvValue(row, ['port_of_departure', 'departure_port']),
        portOfArrival: csvValue(row, ['port_of_arrival', 'arrival_port']),
        shippingCompany: csvValue(row, ['shipping_company', 'carrier']),
        carrierId: csvValue(row, ['carrier_id', 'logistics_partner_id']),
        shippingMode: csvValue(row, ['shipping_mode', 'mode'], 'Sea'),
        freightCost: numberValue(csvValue(row, ['freight_cost', 'freight'])),
        eta: csvValue(row, 'eta', today),
        actualDeliveryDate: csvValue(row, ['actual_delivery_date', 'delivered_date']),
        customsStatus: csvValue(row, ['customs_status', 'customs'], 'Not Started'),
        delayReason: csvValue(row, ['delay_reason', 'delay_notes']),
        trackingReference: csvValue(row, ['tracking_reference', 'tracking_number', 'tracking']),
        deliveryProofPath: csvValue(row, ['delivery_proof_path', 'delivery_proof']),
        status: normalizeCsvStatus(csvValue(row, 'status'), shipmentStatuses, 'Preparing'),
        notes: csvValue(row, 'notes'),
        locationName: csvValue(row, ['location_name', 'location'], 'Port Operations Office'),
        department: csvValue(row, 'department', 'Logistics'),
      };
      if (!shipment.shipmentId || !shipment.customerName || !shipment.vehicle || !shipment.destinationCountry) continue;
      const saved = await saveShipment(shipment, '');
      workingShipments.push(saved || shipment);
      imported += 1;
    }
    return imported;
  }

  async function importLogisticsPartners(rows) {
    let imported = 0;
    for (const row of rows) {
      const partner = {
        ...blankLogisticsPartner,
        partnerName: csvValue(row, ['partner_name', 'logistics_partner', 'shipping_company', 'carrier', 'name']),
        country: csvValue(row, 'country'),
        contactPerson: csvValue(row, ['contact_person', 'contact']),
        phone: csvValue(row, ['phone', 'phone_number', 'mobile']),
        email: csvValue(row, ['email', 'email_address']),
        serviceType: csvValue(row, ['service_type', 'service']),
        notes: csvValue(row, ['notes', 'note', 'remarks']),
      };
      if (!partner.partnerName) continue;
      await saveLogisticsPartner?.(partner, '');
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
          <select value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)}>
            <option>All</option>
            {logisticsPartners.map((partner) => <option key={partner.id}>{partner.partnerName}</option>)}
          </select>
          <input type="date" aria-label="Shipment ETA start" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" aria-label="Shipment ETA end" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <TableSortControl table={table} options={[
            { value: 'shipmentId', label: 'Shipment ID' },
            { value: 'customerName', label: 'Customer' },
            { value: 'eta', label: 'ETA' },
            { value: 'status', label: 'Status' },
            { value: 'destinationCountry', label: 'Destination' },
          ]} />
        </div>
      </PageHeader>
      <div className="metrics-grid reports-summary">
        <Metric label="Active shipments" value={shipmentMetrics.active} icon={Truck} />
        <Metric label="Delayed shipments" value={shipmentMetrics.delayed} tone="danger" icon={AlertTriangle} />
        <Metric label="Delivered this month" value={shipmentMetrics.deliveredThisMonth} tone="success" icon={PackageCheck} />
        <Metric label="Total freight cost" value={money.format(shipmentMetrics.freight)} tone="accent" icon={CircleDollarSign} />
      </div>
      {canEdit && <ShipmentForm value={form} onChange={setForm} onSubmit={submitShipment} editingId={editingId} orderOptions={orders} logisticsPartners={logisticsPartners} onCancel={() => { setForm(blankShipment); setEditingId(''); }} />}
      {canEdit && (
        <CsvImportPanel
          title="Import shipments"
          description="Bulk-create shipment records from a CSV file. Use order_number or linked_order_id to connect shipments to orders."
          sampleHeaders="shipment_id,order_number,customer_id,customer_name,vehicle,quantity,origin_country,origin_city,destination_country,destination_city,port_of_departure,port_of_arrival,shipping_company,carrier_id,shipping_mode,freight_cost,eta,actual_delivery_date,customs_status,delay_reason,tracking_reference,status,location_name,department,notes"
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
              <th>Mode</th>
              <th>Freight Cost</th>
              <th>ETA</th>
              <th>Status</th>
              <th>Customs</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((shipment) => (
              <React.Fragment key={shipment.shipmentId}>
                <tr className={shipment.status === 'Delayed' ? 'row-attention' : ''}>
                  <td>{shipment.shipmentId}</td>
                  <td>{orderNumberById[shipment.linkedOrderId] || shipment.linkedOrderId}</td>
                  <td>{shipment.customerName}</td>
                  <td>{shipment.vehicle}</td>
                  <td>{shipment.quantity}</td>
                  <td>{[shipment.destinationCountry, shipment.destinationCity].filter(Boolean).join(' / ')}</td>
                  <td>{shipment.portOfDeparture}</td>
                  <td>{shipment.portOfArrival}</td>
                  <td>{shipment.shippingCompany}</td>
                  <td>{shipment.shippingMode}</td>
                  <td>{money.format(shipment.freightCost)}</td>
                  <td>{shipment.eta}</td>
                  <td><StatusBadge status={shipment.status} /></td>
                  <td><StatusBadge status={shipment.customsStatus} /></td>
                  <td>{shipment.notes}</td>
                  <td className="row-actions">
                    <button className="mini" onClick={() => setExpandedId(expandedId === shipment.shipmentId ? '' : shipment.shipmentId)}>{expandedId === shipment.shipmentId ? 'Close' : 'Details'}</button>
                    {canEdit && <button className="mini" onClick={() => editShipment(shipment)}>Edit</button>}
                    {canDelete && <button className="mini danger" onClick={() => confirmDeleteShipment(shipment)}>Delete</button>}
                    {!canEdit && !canDelete && <span className="locked-label">Locked</span>}
                  </td>
                </tr>
                {expandedId === shipment.shipmentId && (
                  <tr className="timeline-row">
                    <td colSpan="16">
                      <div className="enterprise-detail">
                        <div className="detail-facts">
                          <span><small>Route</small><strong>{shipment.originCountry || 'Origin pending'} → {shipment.destinationCountry}</strong></span>
                          <span><small>Tracking reference</small><strong>{shipment.trackingReference || 'Not assigned'}</strong></span>
                          <span><small>Delay reason</small><strong>{shipment.delayReason || 'No delay reported'}</strong></span>
                          <span><small>Actual delivery</small><strong>{shipment.actualDeliveryDate || 'Pending'}</strong></span>
                        </div>
                        <div className="timeline-track compact-timeline">
                          {(shipmentEvents[shipment.shipmentId] || []).map((event) => (
                            <div className="timeline-step complete" key={event.id}>
                              <span className="timeline-dot" />
                              <div><strong>{event.status}</strong><small>{new Date(event.createdAt).toLocaleString()}</small><p>{event.note}</p></div>
                            </div>
                          ))}
                          {!(shipmentEvents[shipment.shipmentId] || []).length && <EmptyState label="Shipment timeline begins after the Phase 2 migration is installed." icon={Truck} />}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
      {canEdit && saveLogisticsPartner && (
        <CsvImportPanel
          title="Import logistics partners"
          description="Bulk-create logistics partner records for carriers, freight forwarders, customs brokers, and port contacts."
          sampleHeaders="partner_name,country,contact_person,phone,email,service_type,notes"
          onImport={importLogisticsPartners}
        />
      )}
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

function Finance({ financeRecords, orders, customers, shipments, procurementRequests, saveFinanceRecord, deleteFinanceRecord, canEdit }) {
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [form, setForm] = useState(blankFinanceRecord);
  const [editingId, setEditingId] = useState('');
  const records = financeRecords.map(calculateFinanceRecord);
  const filtered = records.filter((record) => {
    const paymentMatches = paymentFilter === 'All' || record.paymentStatus === paymentFilter;
    const order = orders.find((item) => item.id === record.orderId);
    const customer = customers.find((item) => item.id === record.customerId);
    const customerMatches = customerFilter === 'All' || record.customerId === customerFilter;
    return paymentMatches && customerMatches && inDateRange(record.createdAt, startDate, endDate) && matchesSearch({ ...record, orderNumber: order?.orderNumber, customerName: customer?.name }, query);
  });
  const table = useTableView(filtered, { initialSortKey: 'createdAt', initialSortDirection: 'desc' });
  const totals = {
    revenue: records.reduce((sum, item) => sum + item.totalSaleAmount, 0),
    cost: records.reduce((sum, item) => sum + item.totalCost, 0),
    gross: records.reduce((sum, item) => sum + item.grossProfit, 0),
    net: records.reduce((sum, item) => sum + item.netProfit, 0),
    pending: records.reduce((sum, item) => sum + item.amountPending, 0),
    overdue: records.filter((item) => item.paymentStatus === 'Overdue').reduce((sum, item) => sum + item.amountPending, 0),
  };

  function applyOrder(orderId) {
    const order = orders.find((item) => item.id === orderId);
    if (!order) {
      setForm({ ...form, orderId });
      return;
    }
    const customer = customers.find((item) => sameText(item.name, order.customerName));
    const projection = projectOrderFinance(order, shipments, procurementRequests);
    setForm({
      ...form,
      ...projection,
      orderId,
      customerId: customer?.id || '',
      paymentStatus: projection.totalSaleAmount > 0 ? 'Unpaid' : form.paymentStatus,
    });
  }

  async function submitFinance(event) {
    event.preventDefault();
    await saveFinanceRecord(calculateFinanceRecord(form), editingId);
    setForm(blankFinanceRecord);
    setEditingId('');
  }

  async function confirmDelete(record) {
    const approved = await confirm({
      title: 'Delete finance record?',
      message: 'This financial record will be removed. The linked order and customer will remain unchanged.',
      confirmLabel: 'Delete record',
    });
    if (approved) await deleteFinanceRecord(record.id);
  }

  async function importFinanceRecords(rows) {
    let imported = 0;
    for (const row of rows) {
      const orderReference = csvValue(row, ['order_id', 'order_number']);
      const order = orders.find((item) => item.id === orderReference || item.orderNumber === orderReference);
      const customerReference = csvValue(row, ['customer_id', 'customer_name', 'customer']);
      const customer = customers.find((item) => item.id === customerReference || sameText(item.name, customerReference));
      const projected = order ? projectOrderFinance(order, shipments, procurementRequests) : {};
      const record = calculateFinanceRecord({
        ...blankFinanceRecord,
        ...projected,
        orderId: order?.id || (isUuid(orderReference) ? orderReference : ''),
        customerId: customer?.id || (isUuid(customerReference) ? customerReference : ''),
        totalSaleAmount: numberValue(csvValue(row, ['total_sale_amount', 'revenue', 'sale_amount'], projected.totalSaleAmount || 0)),
        vehicleCost: numberValue(csvValue(row, ['vehicle_cost', 'purchase_cost'], projected.vehicleCost || 0)),
        procurementCost: numberValue(csvValue(row, ['procurement_cost'], projected.procurementCost || 0)),
        freightCost: numberValue(csvValue(row, ['freight_cost'], projected.freightCost || 0)),
        taxDutyCost: numberValue(csvValue(row, ['tax_duty_cost', 'tax_cost', 'duty_cost'])),
        otherCost: numberValue(csvValue(row, ['other_cost', 'misc_cost'])),
        amountPaid: numberValue(csvValue(row, ['amount_paid', 'paid'])),
        paymentStatus: normalizeCsvStatus(csvValue(row, 'payment_status'), paymentStatuses, 'Unpaid'),
        invoiceStatus: normalizeCsvStatus(csvValue(row, 'invoice_status'), invoiceStatuses, 'Not Generated'),
        dueDate: csvValue(row, ['due_date', 'payment_due_date']),
        notes: csvValue(row, ['notes', 'note', 'remarks']),
      });
      if (!record.orderId && !record.customerId && !record.totalSaleAmount) continue;
      await saveFinanceRecord(record, '');
      imported += 1;
    }
    return imported;
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Finance" title="Profit center" description="Consolidate real revenue, acquisition cost, freight, duties, payments, invoices, and net margin.">
        <div className="toolbar">
          <input className="search" placeholder="Search finance records" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
            <option>All</option>
            {paymentStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)}>
            <option>All</option>
            {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}
          </select>
          <input type="date" aria-label="Finance start date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <input type="date" aria-label="Finance end date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <TableSortControl table={table} options={[
            { value: 'createdAt', label: 'Created date' },
            { value: 'totalSaleAmount', label: 'Revenue' },
            { value: 'netProfit', label: 'Net profit' },
            { value: 'amountPending', label: 'Outstanding' },
            { value: 'paymentStatus', label: 'Payment status' },
          ]} />
        </div>
      </PageHeader>
      <div className="metrics-grid enterprise-metrics">
        <Metric label="Total revenue" value={money.format(totals.revenue)} icon={BarChart3} />
        <Metric label="Total cost" value={money.format(totals.cost)} icon={CircleDollarSign} />
        <Metric label="Gross profit" value={money.format(totals.gross)} tone="accent" icon={Activity} />
        <Metric label="Net profit" value={money.format(totals.net)} tone={totals.net < 0 ? 'danger' : 'success'} icon={Gauge} />
        <Metric label="Pending payments" value={money.format(totals.pending)} icon={FileText} />
        <Metric label="Overdue payments" value={money.format(totals.overdue)} tone="danger" icon={AlertTriangle} />
      </div>
      {canEdit && (
        <form className="entry-form finance-form" onSubmit={submitFinance}>
          <Field label="Linked Order">
            <select value={form.orderId} onChange={(event) => applyOrder(event.target.value)} required>
              <option value="">Select order</option>
              {orders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber} - {order.customerName}</option>)}
            </select>
          </Field>
          <Field label="Customer">
            <select value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}>
              <option value="">Select customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </Field>
          {[
            ['Total Sale Amount', 'totalSaleAmount'],
            ['Vehicle Cost', 'vehicleCost'],
            ['Procurement Cost', 'procurementCost'],
            ['Freight Cost', 'freightCost'],
            ['Tax / Duty Cost', 'taxDutyCost'],
            ['Other Cost', 'otherCost'],
            ['Amount Paid', 'amountPaid'],
          ].map(([label, key]) => (
            <Field label={label} key={key}>
              <FormattedNumberInput value={form[key]} onChange={(value) => setForm({ ...form, [key]: value })} />
            </Field>
          ))}
          <Field label="Payment Status">
            <select value={form.paymentStatus} onChange={(event) => setForm({ ...form, paymentStatus: event.target.value })}>
              {paymentStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </Field>
          <Field label="Invoice Status">
            <select value={form.invoiceStatus} onChange={(event) => setForm({ ...form, invoiceStatus: event.target.value })}>
              {invoiceStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </Field>
          <Field label="Due Date"><input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
          <div className="form-actions">
            <button type="submit">{editingId ? 'Save finance record' : 'Create finance record'}</button>
            {editingId && <button type="button" className="secondary" onClick={() => { setForm(blankFinanceRecord); setEditingId(''); }}>Cancel</button>}
          </div>
        </form>
      )}
      {canEdit && (
        <CsvImportPanel
          title="Import finance records"
          description="Bulk-create profit center records. Use order_number/customer_name or UUID IDs to link records."
          sampleHeaders="order_number,customer_name,total_sale_amount,vehicle_cost,procurement_cost,freight_cost,tax_duty_cost,other_cost,amount_paid,payment_status,invoice_status,due_date,notes"
          onImport={importFinanceRecords}
        />
      )}
      <div className="table-shell">
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Revenue</th><th>Total Cost</th><th>Gross Profit</th><th>Net Profit</th><th>Margin</th><th>Paid</th><th>Pending</th><th>Payment</th><th>Invoice</th><th>Actions</th></tr></thead>
          <tbody>
            {table.rows.map((record) => {
              const order = orders.find((item) => item.id === record.orderId);
              const customer = customers.find((item) => item.id === record.customerId);
              return (
                <tr key={record.id} className={record.netProfit < 0 ? 'row-attention' : ''}>
                  <td>{order?.orderNumber || 'Unlinked'}</td>
                  <td>{customer?.name || order?.customerName || 'Unlinked'}</td>
                  <td>{money.format(record.totalSaleAmount)}</td>
                  <td>{money.format(record.totalCost)}</td>
                  <td>{money.format(record.grossProfit)}</td>
                  <td>{money.format(record.netProfit)}</td>
                  <td>{record.marginPercentage.toFixed(1)}%</td>
                  <td>{money.format(record.amountPaid)}</td>
                  <td>{money.format(record.amountPending)}</td>
                  <td><StatusBadge status={record.paymentStatus} /></td>
                  <td><StatusBadge status={record.invoiceStatus} /></td>
                  <td className="row-actions">
                    {canEdit && <button className="mini" onClick={() => { setForm(record); setEditingId(record.id); }}>Edit</button>}
                    {canEdit && <button className="mini danger" onClick={() => confirmDelete(record)}>Delete</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && <EmptyState label="No finance records yet. Select an order to create the first profit record." icon={CircleDollarSign} />}
        <TableFooter count={table.count} page={table.page} totalPages={table.totalPages} firstItem={table.firstItem} lastItem={table.lastItem} onPageChange={table.setPage} />
      </div>
    </section>
  );
}

function DocumentVault({ documents, uploadDocument, openDocument, deleteDocument, canEdit }) {
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [form, setForm] = useState(blankDocument);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const filtered = documents.filter((item) => {
    const categoryMatches = categoryFilter === 'All' || item.category === categoryFilter;
    const moduleMatches = moduleFilter === 'All' || item.linkedModule === moduleFilter;
    return categoryMatches && moduleMatches && inDateRange(item.uploadedAt, startDate, endDate) && matchesSearch(item, query);
  });
  const table = useTableView(filtered, { initialSortKey: 'uploadedAt', initialSortDirection: 'desc' });

  async function submitDocument(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage('');
    try {
      await uploadDocument(form);
      setForm(blankDocument);
      formElement.reset();
      setMessage('Document uploaded securely.');
    } catch (uploadError) {
      setMessage(friendlyError(uploadError, 'Velora could not upload this document.'));
    } finally {
      setBusy(false);
    }
  }

  async function openFile(item) {
    setMessage('');
    try {
      await openDocument(item);
    } catch (openError) {
      setMessage(friendlyError(openError, 'Velora could not open this document.'));
    }
  }

  async function confirmDelete(item) {
    const approved = await confirm({
      title: 'Delete document?',
      message: `${item.fileName} will be removed from the secure vault. This cannot be undone.`,
      confirmLabel: 'Delete document',
    });
    if (approved) await deleteDocument(item.id);
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Document Vault" title="Secure business files" description="Organize invoices, supplier bills, customs documents, contracts, certificates, and delivery proof against operational records.">
        <div className="toolbar">
          <input className="search" placeholder="Search documents" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>All</option>{documentCategories.map((category) => <option key={category}>{category}</option>)}</select>
          <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}><option>All</option>{['Orders', 'Customers', 'Shipments', 'Procurement', 'Finance', 'Inventory'].map((module) => <option key={module}>{module}</option>)}</select>
          <input type="date" aria-label="Document upload start" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <input type="date" aria-label="Document upload end" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <TableSortControl table={table} options={[{ value: 'uploadedAt', label: 'Upload date' }, { value: 'fileName', label: 'File name' }, { value: 'category', label: 'Category' }, { value: 'linkedModule', label: 'Linked module' }]} />
        </div>
      </PageHeader>
      {canEdit && (
        <form className="entry-form document-form" onSubmit={submitDocument}>
          <Field label="File">
            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.csv,.docx" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} required />
          </Field>
          <Field label="Category"><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{documentCategories.map((category) => <option key={category}>{category}</option>)}</select></Field>
          <Field label="Linked Module"><select value={form.linkedModule} onChange={(event) => setForm({ ...form, linkedModule: event.target.value })}><option value="">General document</option>{['Orders', 'Customers', 'Shipments', 'Procurement', 'Finance', 'Inventory'].map((module) => <option key={module}>{module}</option>)}</select></Field>
          <Field label="Linked Record ID"><input value={form.linkedRecordId} onChange={(event) => setForm({ ...form, linkedRecordId: event.target.value })} placeholder="Order UUID, customer ID, shipment ID..." /></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Field>
          <div className="form-actions"><button type="submit" disabled={busy}>{busy ? 'Uploading securely...' : 'Upload document'}</button></div>
        </form>
      )}
      {message && <div className={`app-message ${message.includes('uploaded') ? '' : 'error'}`}>{message}</div>}
      <div className="document-grid">
        {table.rows.map((item) => (
          <article className="document-card" key={item.id}>
            <span className="document-icon"><FileText size={22} /></span>
            <div className="document-meta">
              <strong>{item.fileName}</strong>
              <small>{item.category} · {formatFileSize(item.fileSize)}</small>
              <p>{item.linkedModule ? `${item.linkedModule} / ${item.linkedRecordId || 'Unspecified record'}` : 'General company document'}</p>
              <time>{new Date(item.uploadedAt).toLocaleString()}</time>
            </div>
            <div className="row-actions">
              <button className="mini" onClick={() => openFile(item)}><ExternalLink size={15} /> Open</button>
              {canEdit && <button className="mini danger" onClick={() => confirmDelete(item)}>Delete</button>}
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && <EmptyState label="No documents match this view. Upload a file to begin the secure vault." icon={FolderLock} />}
      <TableFooter count={table.count} page={table.page} totalPages={table.totalPages} firstItem={table.firstItem} lastItem={table.lastItem} onPageChange={table.setPage} />
    </section>
  );
}

function Reports({ vehicles, orders, customers, shipments, procurementRequests, suppliers, employees = [], payrollRecords = [], attendanceRecords = [], hrDepartments = [] }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const filteredOrders = orders.filter((order) => inDateRange(order.orderDate, startDate, endDate));
  const filteredShipments = shipments.filter((shipment) => inDateRange(shipment.eta || shipment.createdAt, startDate, endDate));
  const filteredProcurements = procurementRequests.filter((request) => inDateRange(request.createdAt, startDate, endDate));
  const filteredCustomers = customers.filter((customer) => inDateRange(customer.createdAt, startDate, endDate));
  const filteredVehicles = vehicles.filter((vehicle) => inDateRange(vehicle.createdAt, startDate, endDate));
  const filteredEmployees = employees.filter((employee) => inDateRange(employee.dateOfJoining || employee.createdAt, startDate, endDate));
  const filteredPayroll = payrollRecords.filter((record) => inDateRange(record.paymentDate || record.createdAt, startDate, endDate));
  const filteredAttendance = attendanceRecords.filter((record) => inDateRange(record.attendanceDate || record.createdAt, startDate, endDate));
  const orderNumberById = useMemo(() => {
    return orders.reduce((lookup, order) => ({ ...lookup, [order.id]: order.orderNumber || order.id }), {});
  }, [orders]);

  const totals = {
    revenue: filteredOrders.reduce((sum, order) => sum + orderRevenue(order), 0),
    profit: filteredOrders.reduce((sum, order) => sum + orderProfit(order), 0),
    freightCost: filteredShipments.reduce((sum, shipment) => sum + numberValue(shipment.freightCost), 0),
    inventoryValue: filteredVehicles.reduce((sum, vehicle) => sum + numberValue(vehicle.purchasePrice) * numberValue(vehicle.quantity), 0),
    procurementValue: filteredProcurements.reduce((sum, request) => sum + procurementValue(request), 0),
    payrollValue: filteredPayroll.reduce((sum, record) => sum + numberValue(record.netSalary), 0),
  };

  const reports = [
    {
      title: 'Revenue Report',
      slug: 'velora-revenue-report',
      summary: `${filteredOrders.length} orders, ${money.format(totals.revenue)} revenue`,
      columns: [
        { key: 'orderNumber', label: 'Order Number' },
        { key: 'orderDate', label: 'Order Date' },
        { key: 'customerName', label: 'Customer' },
        { key: 'vehicle', label: 'Vehicle' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'status', label: 'Status' },
      ],
      rows: filteredOrders.map((order) => ({
        ...order,
        revenue: money.format(orderRevenue(order)),
      })),
    },
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
    {
      title: 'Employee Report',
      slug: 'velora-employee-report',
      summary: `${filteredEmployees.length} employees`,
      columns: [
        { key: 'employeeCode', label: 'Employee ID' },
        { key: 'fullName', label: 'Full Name' },
        { key: 'email', label: 'Email' },
        { key: 'department', label: 'Department' },
        { key: 'role', label: 'Role' },
        { key: 'dateOfJoining', label: 'Joining Date' },
        { key: 'employmentType', label: 'Employment Type' },
        { key: 'status', label: 'Status' },
      ],
      rows: filteredEmployees,
    },
    {
      title: 'Payroll Report',
      slug: 'velora-payroll-report',
      summary: `${filteredPayroll.length} payroll records, ${money.format(totals.payrollValue)} net salary`,
      columns: [
        { key: 'employeeCode', label: 'Employee ID' },
        { key: 'employeeName', label: 'Employee' },
        { key: 'baseSalary', label: 'Base Salary' },
        { key: 'bonus', label: 'Bonus' },
        { key: 'deductions', label: 'Deductions' },
        { key: 'netSalary', label: 'Net Salary' },
        { key: 'paymentDate', label: 'Payment Date' },
        { key: 'paymentStatus', label: 'Status' },
      ],
      rows: filteredPayroll.map((record) => ({
        ...record,
        employeeName: employees.find((employee) => employee.id === record.employeeId)?.fullName || record.employeeId,
        baseSalary: money.format(record.baseSalary),
        bonus: money.format(record.bonus),
        deductions: money.format(record.deductions),
        netSalary: money.format(record.netSalary),
      })),
    },
    {
      title: 'Department Report',
      slug: 'velora-department-report',
      summary: `${hrDepartments.length} departments`,
      columns: [
        { key: 'name', label: 'Department' },
        { key: 'employeeCount', label: 'Employees' },
        { key: 'status', label: 'Status' },
      ],
      rows: hrDepartments.map((department) => ({
        ...department,
        employeeCount: employees.filter((employee) => employee.department === department.name).length,
      })),
    },
    {
      title: 'Attendance Report',
      slug: 'velora-attendance-report',
      summary: `${filteredAttendance.length} attendance records`,
      columns: [
        { key: 'employeeName', label: 'Employee' },
        { key: 'attendanceDate', label: 'Date' },
        { key: 'status', label: 'Status' },
        { key: 'notes', label: 'Notes' },
      ],
      rows: filteredAttendance.map((record) => ({
        ...record,
        employeeName: employees.find((employee) => employee.id === record.employeeId)?.fullName || record.employeeId,
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
        <Metric label="Payroll value" value={money.format(totals.payrollValue)} />
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
          <article className={`alert-card severity-${(textValue(alert.severity) || 'Low').toLowerCase()}`} key={alert.id}>
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
  suppliers,
  financeRecords,
  documents,
  alerts,
  enterpriseSummary,
  orderTimelines,
  procurementTimelines,
  shipmentEvents,
  vehicleEvents,
  logisticsPartners,
  strategicScenarios,
  ecosystem,
  employees,
  hrDepartments,
  payrollRecords,
  payrollCycles,
  salaryHistory,
  bonuses,
  deductions,
  attendanceRecords,
  leaveRequests,
  performanceNotes,
  appearance,
}) {
  const confirm = useConfirm();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'I am your Velora AI COO. Ask what management should focus on, which risks are emerging, where opportunities exist, or why a recommendation was generated.',
    },
  ]);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [loading, setLoading] = useState(false);

  const context = useMemo(() => ({
    ...buildAiContext({
      permissions,
      vehicles,
      orders,
      customers,
      shipments,
      procurementRequests,
      alerts,
      employees,
      hrDepartments,
      payrollRecords: permissions.canViewFinancials() ? payrollRecords : [],
      leaveRequests,
    }),
    enterpriseSummary,
    digitalTwin: buildDigitalTwinAiContext({
      vehicles,
      orders,
      customers,
      shipments,
      procurementRequests,
      suppliers,
      financeRecords: permissions.canViewFinancials() ? financeRecords : [],
      documents,
    }),
    timeMachine: buildTimeMachineAiContext({
      vehicles,
      orders,
      customers,
      shipments,
      procurementRequests,
      suppliers,
      financeRecords: permissions.canViewFinancials() ? financeRecords : [],
      documents,
    }, {
      orderTimelines,
      procurementTimelines,
      shipmentEvents,
      vehicleEvents,
    }),
    strategicWarRoom: buildStrategicAiContext({
      vehicles,
      orders,
      customers,
      shipments,
      logisticsPartners,
      procurementRequests,
      suppliers,
      financeRecords: permissions.canViewFinancials() ? financeRecords : [],
    }, strategicScenarios),
    aiCoo: buildAiCooContext({
      vehicles,
      orders,
      customers,
      shipments,
      procurementRequests,
      suppliers,
      financeRecords: permissions.canViewFinancials() ? financeRecords : [],
      canViewFinancials: permissions.canViewFinancials(),
    }),
    ecosystem: buildEcosystemAiContext({
      companies: ecosystem.companies,
      relationships: ecosystem.relationships,
      transactions: ecosystem.transactions,
      events: ecosystem.events,
      currentCompanyId: ecosystem.currentCompanyId,
      operational: {
        vehicles,
        orders,
        customers,
        shipments,
        logisticsPartners,
        procurementRequests,
        suppliers,
        financeRecords: permissions.canViewFinancials() ? financeRecords : [],
      },
    }),
    workforce: {
      employees: employees.slice(0, 40).map((employee) => ({
        employeeId: employee.employeeCode,
        fullName: employee.fullName,
        department: employee.department,
        role: employee.role,
        status: employee.status,
        dateOfJoining: employee.dateOfJoining,
      })),
      departments: hrDepartments.map((department) => ({
        name: department.name,
        status: department.status,
        managerEmployeeId: department.managerEmployeeId,
      })),
      payroll: permissions.canViewFinancials()
        ? payrollRecords.slice(0, 40).map((record) => ({
          employeeId: record.employeeId,
          netSalary: numberValue(record.netSalary),
          paymentDate: record.paymentDate,
          paymentStatus: record.paymentStatus,
        }))
        : [],
      compensation: permissions.canViewFinancials()
        ? {
          cycles: payrollCycles.slice(0, 12),
          salaryChanges: salaryHistory.slice(0, 30),
          bonuses: bonuses.slice(0, 30),
          deductions: deductions.slice(0, 30),
          pendingCycles: payrollCycles.filter((cycle) => ['Draft', 'Calculating', 'Pending Approval'].includes(cycle.runStatus)).length,
          pendingPayrollValue: payrollRecords
            .filter((record) => record.paymentStatus !== 'Paid')
            .reduce((sum, record) => sum + numberValue(record.netSalary), 0),
          highestPayrollDepartment: hrDepartments
            .map((department) => ({
              department: department.name,
              payroll: payrollRecords
                .filter((record) => employees.find((employee) => employee.id === record.employeeId)?.department === department.name)
                .reduce((sum, record) => sum + numberValue(record.netSalary), 0),
            }))
            .sort((a, b) => b.payroll - a.payroll)[0],
        }
        : {},
      attendanceSummary: {
        present: attendanceRecords.filter((record) => record.status === 'Present').length,
        absent: attendanceRecords.filter((record) => record.status === 'Absent').length,
        leave: attendanceRecords.filter((record) => record.status === 'Leave').length,
        halfDay: attendanceRecords.filter((record) => record.status === 'Half Day').length,
      },
      leaveRequests: leaveRequests.slice(0, 30),
      performanceNotes: performanceNotes.slice(0, 20),
    },
    settings: {
      appearance: {
        themeId: appearance?.themeId,
        density: appearance?.density,
        dashboardStyle: appearance?.dashboardStyle,
        brandMode: appearance?.brandMode,
        hasCustomAccent: Boolean(appearance?.accentColor),
        hasLogoUrl: Boolean(appearance?.logoUrl),
      },
    },
  }), [
    permissions,
    vehicles,
    orders,
    customers,
    shipments,
    procurementRequests,
    suppliers,
    financeRecords,
    documents,
    alerts,
    enterpriseSummary,
    orderTimelines,
    procurementTimelines,
    shipmentEvents,
    vehicleEvents,
    logisticsPartners,
    strategicScenarios,
    ecosystem,
    employees,
    hrDepartments,
    payrollRecords,
    payrollCycles,
    salaryHistory,
    bonuses,
    deductions,
    attendanceRecords,
    leaveRequests,
    performanceNotes,
    appearance,
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
      recordHealthEvent({ type: 'ai-assistant', message: friendlyError(requestError) });
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
      <button className="ai-backdrop" onClick={onClose} aria-label="Close Velora AI COO" />
      <aside className="ai-panel" aria-label="Velora AI COO">
        <header className="ai-panel-header">
          <div className="ai-title">
            <span><Sparkles size={19} /></span>
            <div>
              <p className="eyebrow">Digital executive layer</p>
              <h2>Velora AI COO</h2>
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
            placeholder="Ask the AI COO what management should focus on..."
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
  const [strategicScenarios, setStrategicScenarios] = useState([]);
  const healthEvents = useHealthEvents();
  const { user, authLoading, authError, signOut } = useAuthSession();
  const [theme, setTheme, appearance, updateAppearance, resetAppearance] = useTheme(user?.id);
  const { profile, profileLoading, profileError } = useUserProfile(user);
  const permissions = useMemo(() => createPermissions(profile?.role), [profile?.role]);
  const ecosystem = useEcosystemWorkspace(user, profile?.role);
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
    financeRecords,
    documents,
    vehicleEvents,
    shipmentEvents,
    customerContacts,
    customerNotes,
    employees,
    hrDepartments,
    payrollRecords,
    payrollCycles,
    salaryHistory,
    bonuses,
    deductions,
    attendanceRecords,
    leaveRequests,
    performanceNotes,
    phase2Ready,
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
    saveFinanceRecord,
    deleteFinanceRecord,
    uploadDocument,
    openDocument,
    deleteDocument,
    saveCustomerContact,
    deleteCustomerContact,
    addCustomerNote,
    deleteCustomerNote,
    saveEmployee,
    deleteEmployee,
    saveHrDepartment,
    deleteHrDepartment,
    savePayrollRecord,
    deletePayrollRecord,
    savePayrollCycle,
    updatePayrollCycleStatus,
    saveSalaryHistory,
    saveBonus,
    saveDeduction,
    saveAttendanceRecord,
    deleteAttendanceRecord,
    saveLeaveRequest,
    updateLeaveStatus,
    deleteLeaveRequest,
    savePerformanceNote,
    deletePerformanceNote,
  } = useSupabaseRecords(
    user,
    profileLoading || ecosystem.loading ? null : permissions,
    ecosystem.currentCompanyId,
    ecosystem.ready,
  );
  const alerts = useMemo(() => createAlerts({ vehicles, orders, customers, shipments, orderTimelines, procurementRequests, suppliers, financeRecords }), [vehicles, orders, customers, shipments, orderTimelines, procurementRequests, suppliers, financeRecords]);
  const notificationFeed = useMemo(() => buildNotificationFeed({
    alerts,
    orders,
    shipments,
    procurementRequests,
    financeRecords: permissions.canViewFinancials() ? financeRecords : [],
    healthEvents,
  }), [alerts, financeRecords, healthEvents, orders, permissions, procurementRequests, shipments]);
  const securityChecklist = useMemo(() => buildSecurityChecklist({
    isSupabaseConfigured,
    user,
    role: permissions.role,
    phase2Ready,
    ecosystemReady: ecosystem.ready,
    canViewFinancials: permissions.canViewFinancials(),
  }), [ecosystem.ready, permissions, phase2Ready, user]);
  const recordCounts = useMemo(() => ({
    vehicles: vehicles.length,
    orders: orders.length,
    quotes: quotes.length,
    customers: customers.length,
    shipments: shipments.length,
    procurement: procurementRequests.length,
    suppliers: suppliers.length,
    finance: permissions.canViewFinancials() ? financeRecords.length : 0,
    documents: documents.length,
    employees: employees.length,
  }), [customers.length, documents.length, employees.length, financeRecords.length, orders.length, permissions, procurementRequests.length, quotes.length, shipments.length, suppliers.length, vehicles.length]);
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
      financeRecords,
      documents,
      employees,
      payrollCycles,
    }),
    [vehicles, orders, quotes, customers, shipments, logisticsPartners, procurementRequests, suppliers, financeRecords, documents, employees, payrollCycles],
  );
  const enterpriseSummary = useMemo(() => buildEnterpriseSummary({
    vehicles,
    orders,
    customers,
    shipments,
    procurements: procurementRequests,
    financeRecords,
    documents,
  }), [vehicles, orders, customers, shipments, procurementRequests, financeRecords, documents]);
  const visibleNavGroups = useMemo(() => navGroups
    .map((group) => ({ ...group, pages: group.pages.filter((page) => permissions.canViewPage(page)) }))
    .filter((group) => group.pages.length), [permissions]);
  const haloContext = useMemo(() => getHaloContext(activePage), [activePage]);

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

  if (ecosystem.loading) {
    return <ScreenLoader label="Resolving your company workspace..." />;
  }

  function goToPage(page) {
    setActivePage(permissions.canViewPage(page) ? page : permissions.allowedPages[0]);
    setMobileNavOpen(false);
  }

  return (
    <div className={`app halo-shell halo-context-${haloContext} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileNavOpen ? 'mobile-nav-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand-mark">
          <span>{ecosystem.currentCompany.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{ecosystem.currentCompany.name}</strong>
            <small>Velora OS Ecosystem</small>
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
            <VersionBadge />
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
            <p className="breadcrumb">{ecosystem.currentCompany.name} / {activePage}</p>
            <h1>{activePage}</h1>
            <span className="halo-operating-mode">{haloContext} workspace</span>
          </div>
          <div className="topbar-actions">
            <GlobalSearch index={searchIndexData} setActivePage={goToPage} allowedPages={permissions.allowedPages} />
            <button className="theme-toggle ai-button" onClick={() => setAiOpen(true)}>
              <Sparkles size={17} />
              <span>AI COO</span>
            </button>
            <button className="theme-toggle command-button" onClick={() => setCommandOpen(true)}>
              <Command size={17} />
              <span>Commands</span>
            </button>
            <button className="theme-toggle" onClick={() => setTheme(appearance.themeId === 'velora-light' ? 'velora-dark' : 'velora-light')}>
              {appearance.themeId === 'velora-light' ? <Moon size={17} /> : <Sun size={17} />}
              <span>{appearance.themeId === 'velora-light' ? 'Dark mode' : 'Light mode'}</span>
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
        {!phase2Ready && (
          <div className="app-message phase2-notice">
            Phase 2 database features are in compatibility mode. Run <code>supabase/phase2-enterprise-core.sql</code> in Supabase to enable Finance, Documents, and lifecycle history.
          </div>
        )}
        {!loading && !error && lastUpdated && (
          <div className="data-freshness">Data refreshed {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        )}
        {permissions.canViewPage(activePage) ? (
          <>
            {activePage === 'Command Center' && <Dashboard vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} procurementRequests={procurementRequests} suppliers={suppliers} financeRecords={financeRecords} documents={documents} orderTimelines={orderTimelines} setActivePage={goToPage} error={error} authError={authError} healthEvents={healthEvents} canViewFinancials={permissions.canViewFinancials()} />}
            {activePage === 'Onboarding' && <OnboardingCenter company={ecosystem.currentCompany} profile={profile} hasData={Boolean(vehicles.length || orders.length || customers.length || shipments.length)} onNavigate={goToPage} />}
            {activePage === 'Product Tour' && <ProductTourCenter activePage={activePage} onNavigate={goToPage} />}
            {activePage === 'Showcase' && <ProductShowcasePage embedded />}
            {activePage === 'Ecosystem' && <EcosystemCenter companies={ecosystem.companies} relationships={ecosystem.relationships} transactions={ecosystem.transactions} events={ecosystem.events} currentCompany={ecosystem.currentCompany} ready={ecosystem.ready} saveCompany={ecosystem.saveCompany} saveRelationship={ecosystem.saveRelationship} saveTransaction={ecosystem.saveTransaction} vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} logisticsPartners={logisticsPartners} procurementRequests={procurementRequests} suppliers={suppliers} financeRecords={financeRecords} canManage={permissions.isExecutive} canViewFinancials={permissions.canViewFinancials()} />}
            {activePage === 'Marketplace' && <MarketplaceCenter user={user} companyId={ecosystem.ready ? ecosystem.currentCompanyId : null} suppliers={suppliers} logisticsPartners={logisticsPartners} ecosystemCompanies={ecosystem.companies} ecosystemRelationships={ecosystem.relationships} canManage={permissions.canManageMarketplace()} />}
            {activePage === 'AIOS' && <AiOperatingSystemCenter vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} procurementRequests={procurementRequests} suppliers={suppliers} logisticsPartners={logisticsPartners} financeRecords={financeRecords} employees={employees} payrollRecords={payrollRecords} documents={documents} strategicScenarios={strategicScenarios} ecosystemCompanies={ecosystem.companies} ecosystemRelationships={ecosystem.relationships} canViewFinancials={permissions.canViewFinancials()} onNavigate={goToPage} />}
            {activePage === 'AI COO' && <AiCooCommandCenter userId={user.id} role={permissions.role} companyId={ecosystem.ready ? ecosystem.currentCompanyId : null} vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} procurementRequests={procurementRequests} suppliers={suppliers} financeRecords={financeRecords} onNavigate={goToPage} canViewFinancials={permissions.canViewFinancials()} onOpenChat={() => setAiOpen(true)} />}
            {activePage === 'Digital Twin' && <DigitalTwin vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} procurementRequests={procurementRequests} suppliers={suppliers} financeRecords={financeRecords} documents={documents} onNavigate={goToPage} canViewFinancials={permissions.canViewFinancials()} />}
            {activePage === 'Time Machine' && <TimeMachine userId={user.id} role={permissions.role} companyId={ecosystem.ready ? ecosystem.currentCompanyId : null} vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} procurementRequests={procurementRequests} suppliers={suppliers} financeRecords={financeRecords} documents={documents} orderTimelines={orderTimelines} procurementTimelines={procurementTimelines} shipmentEvents={shipmentEvents} vehicleEvents={vehicleEvents} onNavigate={goToPage} canViewFinancials={permissions.canViewFinancials()} />}
            {activePage === 'Strategic War Room' && <StrategicWarRoom userId={user.id} role={permissions.role} companyId={ecosystem.ready ? ecosystem.currentCompanyId : null} vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} logisticsPartners={logisticsPartners} procurementRequests={procurementRequests} suppliers={suppliers} financeRecords={financeRecords} onNavigate={goToPage} canViewFinancials={permissions.canViewFinancials()} onScenariosChange={setStrategicScenarios} />}
            {activePage === 'Projects' && <ProjectManagementCenter user={user} profile={profile} companyId={ecosystem.ready ? ecosystem.currentCompanyId : null} employees={employees} documents={documents} canEdit={permissions.canManageProjects()} />}
            {activePage === 'Procurement' && <Procurement procurementRequests={procurementRequests} suppliers={suppliers} orders={orders} procurementTimelines={procurementTimelines} saveProcurementRequest={saveProcurementRequest} deleteProcurementRequest={deleteProcurementRequest} addProcurementTimelineNote={addProcurementTimelineNote} saveSupplier={saveSupplier} deleteSupplier={deleteSupplier} canEdit={permissions.canManageProcurement()} canDelete={permissions.canDeleteRecords('Procurement')} />}
            {activePage === 'Inventory' && <Inventory vehicles={vehicles} vehicleEvents={vehicleEvents} saveVehicle={saveVehicle} deleteVehicle={deleteVehicle} canEdit={permissions.canManageInventory()} canDelete={permissions.canDeleteRecords('Inventory')} />}
            {activePage === 'Orders' && <Orders orders={orders} saveOrder={saveOrder} deleteOrder={deleteOrder} updateOrderStatus={updateOrderStatus} vehicles={vehicles} customers={customers} orderTimelines={orderTimelines} addOrderTimelineNote={addOrderTimelineNote} canEdit={permissions.canManageOrders()} canDelete={permissions.canDeleteRecords('Orders')} />}
            {activePage === 'Quotes' && <Quotes quotes={quotes} saveQuote={saveQuote} deleteQuote={deleteQuote} vehicles={vehicles} customers={customers} canEdit={permissions.canManageQuotes()} canDelete={permissions.canDeleteRecords('Quotes')} />}
            {activePage === 'Customers' && <Customers customers={customers} orders={orders} shipments={shipments} financeRecords={financeRecords} documents={documents} customerContacts={customerContacts} customerNotes={customerNotes} saveCustomer={saveCustomer} deleteCustomer={deleteCustomer} saveCustomerContact={saveCustomerContact} deleteCustomerContact={deleteCustomerContact} addCustomerNote={addCustomerNote} deleteCustomerNote={deleteCustomerNote} canEdit={permissions.canManageCustomers()} canDelete={permissions.canDeleteRecords('Customers')} />}
            {activePage === 'Portals' && <PortalCenter user={user} companyId={ecosystem.ready ? ecosystem.currentCompanyId : null} customers={customers} suppliers={suppliers} orders={orders} shipments={shipments} procurementRequests={procurementRequests} documents={documents} canManage={permissions.canManagePortals()} />}
            {activePage === 'Employees' && <HrWorkforceCenter employees={employees} hrDepartments={hrDepartments} payrollRecords={payrollRecords} attendanceRecords={attendanceRecords} leaveRequests={leaveRequests} performanceNotes={performanceNotes} documents={documents} saveEmployee={saveEmployee} deleteEmployee={deleteEmployee} saveHrDepartment={saveHrDepartment} deleteHrDepartment={deleteHrDepartment} savePayrollRecord={savePayrollRecord} deletePayrollRecord={deletePayrollRecord} saveAttendanceRecord={saveAttendanceRecord} deleteAttendanceRecord={deleteAttendanceRecord} saveLeaveRequest={saveLeaveRequest} updateLeaveStatus={updateLeaveStatus} deleteLeaveRequest={deleteLeaveRequest} savePerformanceNote={savePerformanceNote} deletePerformanceNote={deletePerformanceNote} uploadDocument={uploadDocument} canEdit={permissions.canManageHR()} canDelete={permissions.canDeleteRecords('Employees')} canViewFinancials={permissions.canViewFinancials()} />}
            {activePage === 'Payroll' && <PayrollCompensationCenter employees={employees} hrDepartments={hrDepartments} payrollRecords={payrollRecords} payrollCycles={payrollCycles} salaryHistory={salaryHistory} bonuses={bonuses} deductions={deductions} performanceNotes={performanceNotes} savePayrollCycle={savePayrollCycle} updatePayrollCycleStatus={updatePayrollCycleStatus} saveSalaryHistory={saveSalaryHistory} saveBonus={saveBonus} saveDeduction={saveDeduction} canEdit={permissions.canManagePayroll()} canApprove={permissions.canManagePayroll()} canViewFinancials={permissions.canViewFinancials()} />}
            {activePage === 'Communication' && <CommunicationCenter user={user} profile={profile} role={permissions.role} companyId={ecosystem.ready ? ecosystem.currentCompanyId : null} alerts={alerts} financeRecords={permissions.canViewFinancials() ? financeRecords : []} procurementRequests={procurementRequests} payrollRecords={permissions.canViewFinancials() ? payrollRecords : []} documents={documents} employees={employees} canManage={permissions.canManageCommunication()} />}
            {activePage === 'Shipments' && <Shipments shipments={shipments} shipmentEvents={shipmentEvents} saveShipment={saveShipment} deleteShipment={deleteShipment} orders={orders} logisticsPartners={logisticsPartners} saveLogisticsPartner={saveLogisticsPartner} deleteLogisticsPartner={deleteLogisticsPartner} canEdit={permissions.canManageShipments()} canDelete={permissions.canDeleteRecords('Shipments')} />}
            {activePage === 'Finance' && (phase2Ready ? <Finance financeRecords={financeRecords} orders={orders} customers={customers} shipments={shipments} procurementRequests={procurementRequests} saveFinanceRecord={saveFinanceRecord} deleteFinanceRecord={deleteFinanceRecord} canEdit={permissions.canManageFinance()} /> : <Phase2SetupState moduleName="Finance & Profit Center" />)}
            {activePage === 'Documents' && (phase2Ready ? <DocumentVault documents={documents} uploadDocument={uploadDocument} openDocument={openDocument} deleteDocument={deleteDocument} canEdit={permissions.canManageDocuments()} /> : <Phase2SetupState moduleName="Document Vault" />)}
            {activePage === 'Knowledge Hub' && <KnowledgeHub user={user} profile={profile} companyId={ecosystem.ready ? ecosystem.currentCompanyId : null} documents={documents} canEdit={permissions.canManageKnowledge()} />}
            {activePage === 'Timeline' && <TimelineOverview orders={orders} orderTimelines={orderTimelines} />}
            {activePage === 'Reports' && <Reports vehicles={vehicles} orders={orders} customers={customers} shipments={shipments} procurementRequests={procurementRequests} suppliers={suppliers} employees={employees} payrollRecords={payrollRecords} attendanceRecords={attendanceRecords} hrDepartments={hrDepartments} />}
            {activePage === 'Alerts Center' && <AlertsCenter alerts={alerts} />}
            {activePage === 'Notifications' && <NotificationCenter alerts={alerts} orders={orders} shipments={shipments} procurementRequests={procurementRequests} financeRecords={permissions.canViewFinancials() ? financeRecords : []} healthEvents={healthEvents} onNavigate={goToPage} />}
            {activePage === 'Backup & Recovery' && <BackupRecoveryCenter company={ecosystem.currentCompany} user={user} role={permissions.role} canViewFinancials={permissions.canViewFinancials()} vehicles={vehicles} orders={orders} quotes={quotes} customers={customers} shipments={shipments} procurementRequests={procurementRequests} suppliers={suppliers} financeRecords={financeRecords} documents={documents} alerts={alerts} />}
            {activePage === 'Settings' && <SettingsCenter theme={theme} setTheme={setTheme} appearance={appearance} updateAppearance={updateAppearance} resetAppearance={resetAppearance} user={user} company={ecosystem.currentCompany} companies={ecosystem.companies} currentCompanyId={ecosystem.currentCompanyId} setCurrentCompanyId={ecosystem.setCurrentCompanyId} saveCompany={ecosystem.saveCompany} canManageCompany={permissions.isExecutive} />}
            {activePage === 'User Management' && <UserRoleManagement currentUser={user} permissions={permissions} />}
            {activePage === 'Release Notes' && <ReleaseNotesCenter />}
            {activePage === 'Launch Readiness' && <LaunchReadinessDashboard isSupabaseConfigured={isSupabaseConfigured} phase2Ready={phase2Ready} ecosystemReady={ecosystem.ready} authError={authError} dataError={error} healthEvents={healthEvents} documents={documents} counts={recordCounts} notifications={notificationFeed} securityChecklist={securityChecklist} />}
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
        suppliers={suppliers}
        financeRecords={financeRecords}
        documents={documents}
        alerts={alerts}
        enterpriseSummary={enterpriseSummary}
        orderTimelines={orderTimelines}
        procurementTimelines={procurementTimelines}
        shipmentEvents={shipmentEvents}
        vehicleEvents={vehicleEvents}
        logisticsPartners={logisticsPartners}
        strategicScenarios={strategicScenarios}
        ecosystem={ecosystem}
        employees={employees}
        hrDepartments={hrDepartments}
        payrollRecords={payrollRecords}
        payrollCycles={payrollCycles}
        salaryHistory={salaryHistory}
        bonuses={bonuses}
        deductions={deductions}
        attendanceRecords={attendanceRecords}
        leaveRequests={leaveRequests}
        performanceNotes={performanceNotes}
        appearance={appearance}
      />
    </div>
  );
}

function ProductLandingGate() {
  const { user, authLoading } = useAuthSession();

  useEffect(() => {
    if (user && !isNativeShell) {
      window.history.replaceState(null, '', '/app');
    }
  }, [user]);

  if (authLoading) {
    return <ScreenLoader label="Checking your Velora session..." />;
  }

  if (user) {
    return <App />;
  }

  return <ProductLandingPage />;
}

const publicPath = window.location.pathname.replace(/\/+$/, '') || '/';
const isNativeShell = Boolean(window.Capacitor || window.__TAURI_INTERNALS__);

createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <ConfirmProvider>
      {!isNativeShell && publicPath === '/privacy' && <PrivacyPolicy />}
      {!isNativeShell && publicPath === '/demo' && <DemoModePage />}
      {!isNativeShell && publicPath === '/showcase' && <ProductShowcasePage />}
      {!isNativeShell && (publicPath === '/' || publicPath === '/home') && <ProductLandingGate />}
      {(isNativeShell || !['/privacy', '/demo', '/showcase', '/', '/home'].includes(publicPath)) && <App />}
    </ConfirmProvider>
  </AppErrorBoundary>,
);
