export const APP_VERSION = '1.0.0';
export const BUILD_CHANNEL = 'Product readiness';

export const releaseNotes = [
  {
    version: '1.0.0',
    date: 'June 23, 2026',
    title: 'Velora OS product readiness',
    notes: [
      'Added launch readiness, backup, settings, notification, documentation, and ecosystem foundations.',
      'Prepared public product landing, demo mode, onboarding, tours, release notes, and showcase mode.',
      'Kept existing website, Android, Windows, Supabase Auth, and operational data flows intact.',
    ],
  },
  {
    version: '0.9.0',
    date: 'June 2026',
    title: 'AI COO and strategic intelligence',
    notes: [
      'Introduced AI COO, Strategic War Room, Time Machine, Digital Twin, and business ecosystem layers.',
      'Added role-aware analytics and decision support over existing operational data.',
    ],
  },
  {
    version: '0.5.0',
    date: 'June 2026',
    title: 'Enterprise operations core',
    notes: [
      'Expanded Velora Tracker into procurement, finance, documents, shipments, reports, audit logs, and alerts.',
      'Added Supabase Auth, RBAC, Vercel deployment, Android Capacitor, and Windows Tauri support.',
    ],
  },
];

export const productFeatures = [
  {
    title: 'Command Center',
    text: 'Executive operating dashboard for revenue, profit, orders, shipments, alerts, and activity.',
  },
  {
    title: 'AI COO',
    text: 'Role-aware operational intelligence that explains risks, opportunities, and management priorities.',
  },
  {
    title: 'Digital Twin',
    text: 'Visual model of company operations, relationships, bottlenecks, lifecycle events, and business flow.',
  },
  {
    title: 'Time Machine',
    text: 'Historical company state reconstruction, comparisons, decision replay, and operational memory.',
  },
  {
    title: 'Strategic War Room',
    text: 'Future simulation engine for procurement, revenue, logistics, risk, and strategy comparison.',
  },
  {
    title: 'Business Ecosystem',
    text: 'Multi-company network foundation for partners, suppliers, customers, and inter-company activity.',
  },
];

export const tourSteps = {
  'Command Center': [
    'Start with the KPI cards to understand current company health.',
    'Review critical alerts and recent activity before opening operational modules.',
    'Use global search or Ctrl+K to jump to any record or module.',
  ],
  Procurement: [
    'Create procurement requests before vehicles enter inventory.',
    'Track supplier, estimated cost, approval, transit, and arrival status.',
    'Move approved arrivals into inventory only after operational review.',
  ],
  Finance: [
    'Monitor sale amount, cost components, profit, invoices, and payment status.',
    'Use finance reports and alerts to identify overdue or margin-risk records.',
  ],
  'Digital Twin': [
    'Inspect the live operating model and company network.',
    'Use bottlenecks and lifecycle signals to understand operational constraints.',
  ],
  'Time Machine': [
    'Select a date to reconstruct the company state at that moment.',
    'Use compare mode to explain operational changes across periods.',
  ],
  'AI COO': [
    'Open the daily executive briefing first.',
    'Review risks, opportunities, recommendations, and generated action items.',
    'Ask executive questions in chat using authorized company context.',
  ],
  Ecosystem: [
    'Use the company switcher to scope the workspace.',
    'Review relationship scores, network risks, and inter-company activities.',
  ],
};

export function buildDemoCompanyState() {
  const vehicles = [
    { id: 'DEMO-VH-001', brand: 'Hyundai', model: 'Verna', category: 'Sedan', quantity: 14, purchasePrice: 950000, sellingPrice: 1180000, status: 'Available' },
    { id: 'DEMO-VH-002', brand: 'Toyota', model: 'Fortuner', category: 'SUV', quantity: 5, purchasePrice: 3200000, sellingPrice: 3950000, status: 'Reserved' },
    { id: 'DEMO-VH-003', brand: 'Kia', model: 'Carnival', category: 'MPV', quantity: 3, purchasePrice: 2800000, sellingPrice: 3450000, status: 'Available' },
  ];
  const orders = [
    { id: 'demo-order-1', orderNumber: 'D-0001', customerName: 'Asterline Demo Motors', vehicle: 'Hyundai Verna', quantity: 4, status: 'Procurement', totalRevenue: 4720000, totalProfit: 920000 },
    { id: 'demo-order-2', orderNumber: 'D-0002', customerName: 'Northstar Fictional Fleet', vehicle: 'Toyota Fortuner', quantity: 2, status: 'Ready', totalRevenue: 7900000, totalProfit: 1500000 },
    { id: 'demo-order-3', orderNumber: 'D-0003', customerName: 'Blue Harbor Sample Group', vehicle: 'Kia Carnival', quantity: 1, status: 'Completed', totalRevenue: 3450000, totalProfit: 650000 },
  ];
  const shipments = [
    { shipmentId: 'D-SHIP-001', customerName: 'Asterline Demo Motors', vehicle: 'Hyundai Verna', destinationCountry: 'Demo Port Alpha', status: 'In Transit', freightCost: 420000 },
    { shipmentId: 'D-SHIP-002', customerName: 'Blue Harbor Sample Group', vehicle: 'Kia Carnival', destinationCountry: 'Demo Port Beta', status: 'Customs Clearance', freightCost: 380000 },
  ];
  const insights = [
    'Fortuner demand is strong and margin positive; prepare procurement review.',
    'One shipment is approaching customs risk and should be monitored by logistics.',
    'Asterline Demo Motors is a high-growth sample customer candidate for follow-up.',
  ];
  return { vehicles, orders, shipments, insights };
}

export function buildOnboardingChecklist({ company, profile, hasData }) {
  return [
    { label: 'Create secure account', done: Boolean(profile?.role), detail: profile?.role || 'Role pending' },
    { label: 'Complete company profile', done: Boolean(company?.name && company?.country), detail: company?.name || 'Company details needed' },
    { label: 'Confirm currency and region', done: true, detail: 'INR and India-ready number formatting active' },
    { label: 'Review team access', done: false, detail: 'Invite foundation prepared for admin review' },
    { label: 'Add or preview sample data', done: Boolean(hasData), detail: hasData ? 'Operational data exists' : 'Use demo mode for a safe preview' },
    { label: 'Open Launch Readiness', done: false, detail: 'Clear launch checklist before investor or customer demos' },
  ];
}
