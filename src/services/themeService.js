export const defaultAccentColor = '#4f8cff';

export const themePresets = [
  {
    id: 'velora-dark',
    name: 'Velora Dark',
    mode: 'dark',
    description: 'Default graphite and deep-blue operations theme.',
    tokens: {
      bg: '#0b111c',
      bgSoft: '#101827',
      panel: 'rgba(17, 25, 40, .82)',
      panelSolid: '#121b2b',
      panelElevated: '#182335',
      ink: '#f8fafc',
      muted: '#9aa8bd',
      nav: 'rgba(9, 14, 24, .9)',
      accent: '#4f8cff',
      info: '#38bdf8',
    },
  },
  {
    id: 'velora-light',
    name: 'Velora Light',
    mode: 'light',
    description: 'Bright, clean workspace for daytime operations.',
    tokens: {
      bg: '#f6f8fb',
      bgSoft: '#eef3f8',
      panel: 'rgba(255, 255, 255, .9)',
      panelSolid: '#ffffff',
      panelElevated: '#ffffff',
      ink: '#101827',
      muted: '#64748b',
      nav: 'rgba(255, 255, 255, .92)',
      accent: '#2563eb',
      info: '#0284c7',
    },
  },
  {
    id: 'black-white',
    name: 'Black & White',
    mode: 'dark',
    description: 'High-contrast monochrome command environment.',
    tokens: {
      bg: '#050505',
      bgSoft: '#101010',
      panel: 'rgba(20, 20, 20, .9)',
      panelSolid: '#141414',
      panelElevated: '#1f1f1f',
      ink: '#ffffff',
      muted: '#b5b5b5',
      nav: 'rgba(0, 0, 0, .92)',
      accent: '#f8fafc',
      info: '#d4d4d4',
    },
  },
  {
    id: 'velora-blue',
    name: 'Velora Blue',
    mode: 'dark',
    description: 'Deeper blue workspace for executive operations.',
    tokens: {
      bg: '#071528',
      bgSoft: '#0d213d',
      panel: 'rgba(15, 35, 65, .86)',
      panelSolid: '#10233f',
      panelElevated: '#17345d',
      ink: '#f8fbff',
      muted: '#a9bfdb',
      nav: 'rgba(6, 18, 34, .92)',
      accent: '#60a5fa',
      info: '#38bdf8',
    },
  },
  {
    id: 'velora-red',
    name: 'Velora Red',
    mode: 'dark',
    description: 'Premium red-accent command theme for urgent work.',
    tokens: {
      bg: '#14090c',
      bgSoft: '#1f1116',
      panel: 'rgba(35, 18, 24, .88)',
      panelSolid: '#24131a',
      panelElevated: '#331a24',
      ink: '#fff7f8',
      muted: '#d0a8b0',
      nav: 'rgba(20, 9, 12, .94)',
      accent: '#ef4444',
      info: '#fb7185',
    },
  },
  {
    id: 'grey-white',
    name: 'Grey & White',
    mode: 'light',
    description: 'Neutral ERP-style workspace with restrained contrast.',
    tokens: {
      bg: '#f3f4f6',
      bgSoft: '#e5e7eb',
      panel: 'rgba(255, 255, 255, .94)',
      panelSolid: '#ffffff',
      panelElevated: '#f9fafb',
      ink: '#111827',
      muted: '#6b7280',
      nav: 'rgba(255, 255, 255, .94)',
      accent: '#475569',
      info: '#64748b',
    },
  },
  {
    id: 'executive-midnight',
    name: 'Executive Midnight',
    mode: 'dark',
    description: 'Luxury midnight theme with refined cyan highlights.',
    tokens: {
      bg: '#050b16',
      bgSoft: '#0b1324',
      panel: 'rgba(13, 24, 43, .9)',
      panelSolid: '#0e1a2f',
      panelElevated: '#16233a',
      ink: '#f8fafc',
      muted: '#9fb3cc',
      nav: 'rgba(5, 11, 22, .94)',
      accent: '#22d3ee',
      info: '#67e8f9',
    },
  },
  {
    id: 'arctic-minimal',
    name: 'Arctic Minimal',
    mode: 'light',
    description: 'Cool minimal theme for clean investor demos.',
    tokens: {
      bg: '#f8fbff',
      bgSoft: '#eef7ff',
      panel: 'rgba(255, 255, 255, .92)',
      panelSolid: '#ffffff',
      panelElevated: '#f3f9ff',
      ink: '#0f172a',
      muted: '#64748b',
      nav: 'rgba(248, 251, 255, .94)',
      accent: '#0ea5e9',
      info: '#0284c7',
    },
  },
];

export const densityOptions = ['Comfortable', 'Compact', 'Executive'];
export const dashboardStyles = ['Classic', 'Command Center', 'Minimal', 'Executive'];
export const brandModes = ['Velora mark', 'Company initials', 'Text only', 'Branded workspace'];

export const defaultAppearance = {
  themeId: 'velora-dark',
  accentColor: defaultAccentColor,
  density: 'Comfortable',
  dashboardStyle: 'Command Center',
  displayName: '',
  logoUrl: '',
  brandMode: 'Velora mark',
};

export function resolveTheme(themeId) {
  if (themeId === 'dark') return themePresets[0];
  if (themeId === 'light') return themePresets[1];
  return themePresets.find((preset) => preset.id === themeId) || themePresets[0];
}

export function normalizeAppearance(value = {}) {
  const theme = resolveTheme(value.themeId || value.theme || value.mode);
  const density = densityOptions.includes(value.density) ? value.density : defaultAppearance.density;
  const dashboardStyle = dashboardStyles.includes(value.dashboardStyle) ? value.dashboardStyle : defaultAppearance.dashboardStyle;
  const brandMode = brandModes.includes(value.brandMode) ? value.brandMode : defaultAppearance.brandMode;
  const accentColor = /^#[0-9a-f]{6}$/i.test(String(value.accentColor || '')) ? value.accentColor : theme.tokens.accent || defaultAccentColor;

  return {
    ...defaultAppearance,
    ...value,
    themeId: theme.id,
    accentColor,
    density,
    dashboardStyle,
    brandMode,
  };
}

export function storageKeyForAppearance(userId) {
  return `velora-appearance-preferences:${userId || 'local'}`;
}

export function loadAppearance(userId) {
  if (typeof window === 'undefined') return defaultAppearance;
  const userKey = storageKeyForAppearance(userId);
  const legacyTheme = window.localStorage.getItem('velora-theme');
  try {
    const stored = JSON.parse(window.localStorage.getItem(userKey) || 'null');
    if (stored) return normalizeAppearance(stored);
  } catch {
    // Fall through to legacy/default recovery.
  }
  return normalizeAppearance({ themeId: legacyTheme || defaultAppearance.themeId });
}

export function saveAppearance(userId, appearance) {
  if (typeof window === 'undefined') return;
  const normalized = normalizeAppearance(appearance);
  window.localStorage.setItem(storageKeyForAppearance(userId), JSON.stringify(normalized));
  window.localStorage.setItem('velora-theme', normalized.themeId);
}

export function applyAppearanceTheme(appearance) {
  if (typeof document === 'undefined') return;
  const normalized = normalizeAppearance(appearance);
  const theme = resolveTheme(normalized.themeId);
  const root = document.documentElement;
  const accent = normalized.accentColor || theme.tokens.accent;

  root.dataset.theme = theme.mode;
  root.dataset.themePreset = theme.id;
  root.dataset.density = normalized.density.toLowerCase().replace(/\s+/g, '-');
  root.dataset.dashboardStyle = normalized.dashboardStyle.toLowerCase().replace(/\s+/g, '-');
  root.style.setProperty('--bg', theme.tokens.bg);
  root.style.setProperty('--bg-soft', theme.tokens.bgSoft);
  root.style.setProperty('--panel', theme.tokens.panel);
  root.style.setProperty('--panel-solid', theme.tokens.panelSolid);
  root.style.setProperty('--panel-elevated', theme.tokens.panelElevated);
  root.style.setProperty('--ink', theme.tokens.ink);
  root.style.setProperty('--text', theme.tokens.ink);
  root.style.setProperty('--muted', theme.tokens.muted);
  root.style.setProperty('--nav', theme.tokens.nav);
  root.style.setProperty('--blue', accent);
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--blue-soft', `${accent}24`);
  root.style.setProperty('--info', theme.tokens.info || accent);
}
