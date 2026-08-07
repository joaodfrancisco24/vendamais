export interface ThemePreset {
  id: string;
  name: string;
  primaryHex: string;
  hoverHex: string;
  lightHex: string;
  borderHex: string;
}

export class ThemePalette {
  static PRESETS: ThemePreset[] = [
    {
      id: 'blue',
      name: 'Azul Corporativo (Padrão)',
      primaryHex: '#2563eb',
      hoverHex: '#1d4ed8',
      lightHex: '#eff6ff',
      borderHex: '#bfdbfe'
    },
    {
      id: 'emerald',
      name: 'Verde Esmeralda',
      primaryHex: '#059669',
      hoverHex: '#047857',
      lightHex: '#ecfdf5',
      borderHex: '#a7f3d0'
    },
    {
      id: 'purple',
      name: 'Púrpura Imperial',
      primaryHex: '#7c3aed',
      hoverHex: '#6d28d9',
      lightHex: '#f5f3ff',
      borderHex: '#ddd6fe'
    },
    {
      id: 'indigo',
      name: 'Índigo Safira',
      primaryHex: '#4f46e5',
      hoverHex: '#4338ca',
      lightHex: '#eef2ff',
      borderHex: '#c7d2fe'
    },
    {
      id: 'teal',
      name: 'Verde Água (Teal)',
      primaryHex: '#0d9488',
      hoverHex: '#0f766e',
      lightHex: '#f0fdf4',
      borderHex: '#99f6e4'
    },
    {
      id: 'rose',
      name: 'Vermelho Carmim',
      primaryHex: '#e11d48',
      hoverHex: '#be123c',
      lightHex: '#fff1f2',
      borderHex: '#fecdd3'
    },
    {
      id: 'amber',
      name: 'Âmbar / Dourado',
      primaryHex: '#d97706',
      hoverHex: '#b45309',
      lightHex: '#fffbeb',
      borderHex: '#fde68a'
    },
    {
      id: 'slate',
      name: 'Grafite / Onix',
      primaryHex: '#1e293b',
      hoverHex: '#0f172a',
      lightHex: '#f8fafc',
      borderHex: '#cbd5e1'
    }
  ];

  static applyTheme(colorKeyOrHex?: string) {
    let key = colorKeyOrHex;
    if (!key) {
      try {
        key = localStorage.getItem('vm_theme_color') || 'blue';
      } catch (e) {
        key = 'blue';
      }
    }
    let preset = ThemePalette.PRESETS.find(p => p.id === key);

    if (!preset) {
      if (key && key.startsWith('#')) {
        preset = {
          id: 'custom',
          name: 'Cor Personalizada',
          primaryHex: key,
          hoverHex: key,
          lightHex: key + '15',
          borderHex: key + '40'
        };
      } else {
        preset = ThemePalette.PRESETS[0];
      }
    }

    const root = document.documentElement;
    root.style.setProperty('--brand-primary', preset.primaryHex);
    root.style.setProperty('--brand-hover', preset.hoverHex);
    root.style.setProperty('--brand-light', preset.lightHex);
    root.style.setProperty('--brand-border', preset.borderHex);

    try {
      if (key) {
        localStorage.setItem('vm_theme_color', key);
      }
    } catch (e) {}
  }
}
