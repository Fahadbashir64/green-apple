import { MenuItem } from '../models/menu-item.model';

export interface MenuAddonOption {
  id: string;
  labelDe: string;
  labelEn: string;
  price?: number;
}

export interface MenuAddonGroup {
  id: string;
  labelDe: string;
  labelEn: string;
  required?: boolean;
  type: 'single' | 'multi';
  options: MenuAddonOption[];
}

/** Flyer-based addon groups (Green Apple menu, 09/25). */
export const MENU_ADDON_GROUPS: Readonly<Record<string, MenuAddonGroup>> = {
  doner_meat: {
    id: 'doner_meat',
    labelDe: 'Fleisch',
    labelEn: 'Meat',
    required: true,
    type: 'single',
    options: [
      { id: 'chicken', labelDe: 'Hähnchenfleisch', labelEn: 'Chicken döner' },
      { id: 'veal', labelDe: 'Kalbfleisch', labelEn: 'Veal döner' }
    ]
  },
  doner_sauce: {
    id: 'doner_sauce',
    labelDe: 'Sauce',
    labelEn: 'Sauce',
    required: true,
    type: 'single',
    options: [
      { id: 'cocktail', labelDe: 'Cocktail', labelEn: 'Cocktail' },
      { id: 'yogurt', labelDe: 'Joghurt', labelEn: 'Yogurt' },
      { id: 'hot', labelDe: 'Scharfe Sauce', labelEn: 'Hot sauce' },
      { id: 'tzatziki', labelDe: 'Tzatziki', labelEn: 'Tzatziki' }
    ]
  },
  doner_side: {
    id: 'doner_side',
    labelDe: 'Beilage',
    labelEn: 'Side',
    required: true,
    type: 'single',
    options: [
      { id: 'salad', labelDe: 'Salat', labelEn: 'Salad' },
      { id: 'rice', labelDe: 'Reis', labelEn: 'Rice' },
      { id: 'fries', labelDe: 'Pommes Frites', labelEn: 'Fries' }
    ]
  },
  salad_dressing: {
    id: 'salad_dressing',
    labelDe: 'Dressing',
    labelEn: 'Dressing',
    required: true,
    type: 'single',
    options: [
      { id: 'cocktail', labelDe: 'Cocktail', labelEn: 'Cocktail' },
      { id: 'yogurt', labelDe: 'Joghurt', labelEn: 'Yogurt' },
      { id: 'hot', labelDe: 'Scharf', labelEn: 'Hot' }
    ]
  },
  extra_sauce: {
    id: 'extra_sauce',
    labelDe: 'Extra Sauce (klein)',
    labelEn: 'Extra sauce (small)',
    type: 'multi',
    options: [
      { id: 'doner', labelDe: 'Dönersauce', labelEn: 'Döner sauce', price: 3 },
      { id: 'sheep', labelDe: 'Schafskäsesauce', labelEn: 'Sheep cheese sauce', price: 3 },
      { id: 'cocktail', labelDe: 'Cocktailsauce', labelEn: 'Cocktail sauce', price: 3 },
      { id: 'tzatziki', labelDe: 'Tzatziki', labelEn: 'Tzatziki', price: 3 },
      { id: 'herbs', labelDe: 'Kräutersauce', labelEn: 'Herb sauce', price: 3 },
      { id: 'curry', labelDe: 'Currysauce', labelEn: 'Curry sauce', price: 3 },
      { id: 'yogurt', labelDe: 'Joghurtsauce', labelEn: 'Yogurt sauce', price: 3 }
    ]
  }
};

const DONER_MEAT_CODES = new Set([
  'pz-103',
  'pz-105',
  'cz-111',
  'cz-112',
  'bg-115',
  'bg-116',
  'lm-020',
  'lm-021',
  'pd-029',
  'kl-035',
  'dn-005',
  'dn-006',
  'dn-007',
  'dn-008',
  'dn-009',
  'dn-010',
  'dn-011',
  'dn-014k',
  'dn-014g',
  'dn-015'
]);

const DONER_SAUCE_CODES = new Set([
  'dn-005',
  'dn-006',
  'dn-007',
  'dn-009',
  'dn-010',
  'dn-011',
  'dn-014k',
  'dn-014g',
  'dn-015'
]);

const DONER_SIDE_CODES = new Set(['dn-010']);

const EXTRA_SAUCE_CATEGORIES = new Set([
  'pizza',
  'calzone',
  'baguette',
  'doner',
  'lahmacun',
  'pide',
  'kleinigkeiten',
  'spezial',
  'salad'
]);

function itemCode(item: MenuItem): string {
  return String(item.id ?? '').trim().toLowerCase();
}

function itemCategory(item: MenuItem): string {
  return String(item.category ?? '').trim().toLowerCase();
}

export function addonGroupsForItem(item: MenuItem): MenuAddonGroup[] {
  const code = itemCode(item);
  const category = itemCategory(item);
  const groups: MenuAddonGroup[] = [];

  if (DONER_MEAT_CODES.has(code)) {
    groups.push(MENU_ADDON_GROUPS['doner_meat']);
  }
  if (DONER_SAUCE_CODES.has(code)) {
    groups.push(MENU_ADDON_GROUPS['doner_sauce']);
  }
  if (DONER_SIDE_CODES.has(code)) {
    groups.push(MENU_ADDON_GROUPS['doner_side']);
  }
  if (category === 'salad') {
    groups.push(MENU_ADDON_GROUPS['salad_dressing']);
  }
  if (EXTRA_SAUCE_CATEGORIES.has(category)) {
    groups.push(MENU_ADDON_GROUPS['extra_sauce']);
  }

  return groups;
}

export function addonOptionById(group: MenuAddonGroup, optionId: string): MenuAddonOption | undefined {
  return group.options.find((opt) => opt.id === optionId);
}

export function addonSelectionsTotal(
  groups: MenuAddonGroup[],
  selected: Readonly<Record<string, string | string[]>>
): number {
  let total = 0;
  for (const group of groups) {
    const value = selected[group.id];
    const ids = Array.isArray(value) ? value : value ? [value] : [];
    for (const id of ids) {
      const opt = addonOptionById(group, id);
      if (opt?.price) {
        total += opt.price;
      }
    }
  }
  return total;
}

export function formatAddonLabels(
  groups: MenuAddonGroup[],
  selected: Readonly<Record<string, string | string[]>>,
  lang: 'de' | 'en'
): string[] {
  const labels: string[] = [];
  for (const group of groups) {
    const value = selected[group.id];
    const ids = Array.isArray(value) ? value : value ? [value] : [];
    for (const id of ids) {
      const opt = addonOptionById(group, id);
      if (opt) {
        labels.push(lang === 'de' ? opt.labelDe : opt.labelEn);
      }
    }
  }
  return labels;
}

export function cartLineKey(item: MenuItem, sizeLabel?: string, addons?: string[], instructions?: string): string {
  const addonKey = (addons ?? []).slice().sort().join('|');
  const note = (instructions ?? '').trim();
  return `${item.id}::${sizeLabel ?? ''}::${addonKey}::${note}`;
}

export function serializeAddonSelections(selected: Record<string, string | string[]>): string[] {
  const out: string[] = [];
  for (const [groupId, value] of Object.entries(selected)) {
    if (Array.isArray(value)) {
      for (const optionId of value) {
        out.push(`${groupId}:${optionId}`);
      }
    } else if (value) {
      out.push(`${groupId}:${value}`);
    }
  }
  return out.sort();
}

export function deserializeAddonSelections(tokens: string[]): Record<string, string | string[]> {
  const map: Record<string, string[]> = {};
  for (const token of tokens) {
    const [groupId, optionId] = token.split(':');
    if (!groupId || !optionId) {
      continue;
    }
    if (!map[groupId]) {
      map[groupId] = [];
    }
    map[groupId].push(optionId);
  }
  const result: Record<string, string | string[]> = {};
  for (const [groupId, ids] of Object.entries(map)) {
    const group = MENU_ADDON_GROUPS[groupId];
    result[groupId] = group?.type === 'multi' ? ids : ids[0] ?? '';
  }
  return result;
}
