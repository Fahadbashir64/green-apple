/**
 * Allergen & additive codes from Green Apple flyer (A3 2F, 09/25).
 * Keys match menu_items.code in seed-brochure.sql.
 * Used when API allergens are missing (e.g. before DB migration).
 */
export const MENU_ITEM_ALLERGENS: Readonly<Record<string, string>> = {
  'pz-085': 'A,Wh,G',
  'pz-086': 'A,Wh,G,2,1,2,2',
  'pz-087': 'A,Wh,G,2,1,2,2',
  'pz-088': 'A,Wh,G',
  'pz-089': 'A,Wh,G',
  'pz-090': 'A,Wh,G,2,1,2,2',
  'pz-091': 'A,Wh,G,2,1,2,2',
  'pz-092': 'A,Wh,G,2,1,2,2',
  'pz-093': 'A,Wh,G',
  'pz-094': 'A,Wh,G',
  'pz-095': 'A,Wh,G,16',
  'pz-096': 'A,Wh,G',
  'pz-097': 'A,Wh,G',
  'pz-098': 'A,Wh,G,C,2,16',
  'pz-099': 'A,Wh,G,2',
  'pz-100': 'A,Wh,G,2,1,2,2',
  'pz-101': 'A,Wh,G,2,1,2,2',
  'pz-102': 'A,Wh,G,D,2,1,2,2',
  'pz-103': 'A,Wh,G,17,18',
  'pz-104': 'A,Wh,G,D,2,3',
  'pz-105': 'A,Wh,G,D,17,18',
  'pz-106': 'A,Wh,G',

  'cz-110': 'A,Wh,G,2,1,2,2',
  'cz-111': 'A,Wh,G,17,18',
  'cz-112': 'A,Wh,G,17,18',
  'cz-113': 'A,Wh,G',

  'bg-115': 'A,Wh,G,17,10',
  'bg-116': 'A,Wh,G,17,18',
  'bg-117': 'A,Wh,G,D',
  'bg-118': 'A,Wh,G,2,1,2,2',
  'bg-119': 'A,Wh,G,2,1,2,2',
  'bg-120': 'A,Wh,G',
  'bg-121': 'A,Wh,G',

  'su-001': '',
  'su-002': '',

  'dn-005': 'A,Wh,C,G,1,7,18',
  'dn-006': 'A,Wh,C,G,1,7,18',
  'dn-007': 'A,Wh,C,G,1,7,18',
  'dn-008': 'G,1,7,18',
  'dn-009': 'A,Wh,C,G,1,7,18',
  'dn-010': 'G,1,7,18',
  'dn-011': 'G,1,7,18',
  'dn-012': '',
  'dn-013': 'A,Wh,C,G,1,7,18',
  'dn-014k': 'A,Wh,C,G,1,7,18',
  'dn-014g': 'A,Wh,C,G,1,7,18',
  'dn-015': 'A,Wh,C,G,1,7,18',

  'lm-018': 'A,Wh,C',
  'lm-019': 'A,Wh,C,G',
  'lm-020': 'A,Wh,C,G,1,7,18',
  'lm-021': 'A,Wh,C,G,1,7,18',

  'pd-025': 'A,Wh,C,G',
  'pd-026': 'A,Wh,C,G',
  'pd-027': 'A,Wh,C,G',
  'pd-028': 'A,Wh,C,G',
  'pd-029': 'A,Wh,C,G',
  'pd-030': 'A,Wh,C,G',
  'pd-031': 'A,Wh,C,G',

  'kl-035': 'A,Wh,C',
  'kl-036': 'A,Wh,C',
  'kl-037': 'A,Wh,C,G',
  'kl-038': 'A,Wh,C',
  'kl-039': 'A,Wh,C',
  'kl-040k': '',
  'kl-040g': '',
  'kl-041': 'A,Wh,C',
  'kl-042': 'A,Wh,C',
  'kl-043': 'A,Wh,C',
  'kl-044': '',

  'sp-045': 'A,Wh,C',
  'sp-046': 'A,Wh,C',
  'sp-047': 'A,Wh,C',
  'sp-048': 'A,Wh,C',
  'sp-049': 'A,Wh,C,17,3',
  'sp-050': '',
  'sp-051': '',
  'sp-052': '',
  'sp-053': '',
  'sp-054': '',
  'sp-055': '',

  'sl-060': '',
  'sl-061': '1,3,5,1,2,2,2',
  'sl-062': 'D',
  'sl-063': 'G,2,1,2,2',
  'sl-064': 'G',
  'sl-065': 'G',
  'sl-066': 'G',

  'nt-125': '',
  'nt-126': '',

  'sc-donner': '',
  'sc-schafs': '',
  'sc-cocktail': '',
  'sc-zaziki': '',
  'sc-krauter': '',
  'sc-curry': '',
  'sc-joghurt': '',

  'dr-125': '1,10,11,1',
  'dr-126': '1,13,14',
  'dr-127': '1,13,14',
  'dr-128': '1,13,14',
  'dr-129': '1,10,13,14',
  'dr-130': '1,13,14',
  'dr-131': '2',
  'dr-132': '',
  'dr-133': '',
  'dr-134': 'G',
  'dr-135': '10,1,11,1,23',
  'dr-136': '',
  'dr-137': '',
  'dr-138': '',
  'dr-139': '',
  'dr-140': '',
  'dr-141': '',

  // Legacy demo seed (backend/db/seed.sql)
  'pz-margherita': 'A,Wh,G',
  'pz-tonno': 'A,Wh,G,D,2,3',
  'doener-durum': 'A,Wh,C,G,1,7,18',
  'salat-greek': 'G',
  'drink-cola': '1,10,11,1'
};

const MENU_NAME_ALLERGENS: Readonly<Record<string, string>> = {
  margherita: 'A,Wh,G',
  'pizza margherita': 'A,Wh,G',
  'pizza tonno': 'A,Wh,G,D,2,3',
  dürüm: 'A,Wh,C,G,1,7,18',
  durum: 'A,Wh,C,G,1,7,18',
  'doener dueruem': 'A,Wh,C,G,1,7,18',
  'greek salad': 'G',
  'coca cola 0.33l': '1,10,11,1'
};

function normalizeMenuName(name: string | undefined | null): string {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function lookupKeys(...rawKeys: Array<string | undefined | null>): string[] {
  const keys = new Set<string>();
  for (const raw of rawKeys) {
    const key = String(raw ?? '').trim().toLowerCase();
    if (!key) {
      continue;
    }
    keys.add(key);
    const brochure = key.match(/^([a-z]{2})-(\d{2,3}[a-z]?)$/);
    if (brochure) {
      keys.add(brochure[2]);
    }
    if (/^\d{2,3}[a-z]?$/.test(key)) {
      for (const mapKey of Object.keys(MENU_ITEM_ALLERGENS)) {
        if (mapKey.endsWith(`-${key}`) || mapKey.endsWith(`-${key.padStart(3, '0')}`)) {
          keys.add(mapKey);
        }
      }
    }
  }
  return [...keys];
}

export function allergensForMenuCode(
  code: string | undefined | null,
  fromApi?: string | null,
  altCode?: string | undefined | null,
  name?: string | undefined | null
): string | null {
  const fromServer = fromApi?.trim();
  if (fromServer) {
    return fromServer;
  }
  for (const key of lookupKeys(code, altCode)) {
    const flyer = MENU_ITEM_ALLERGENS[key]?.trim();
    if (flyer) {
      return flyer;
    }
  }
  const normalizedName = normalizeMenuName(name);
  if (normalizedName) {
    const byName = MENU_NAME_ALLERGENS[normalizedName]?.trim();
    if (byName) {
      return byName;
    }
  }
  return null;
}

export function allergensForMenuItem(item: {
  code?: string | null;
  id?: string | null;
  name?: string | null;
  allergens?: string | null;
}): string | null {
  return allergensForMenuCode(item.code ?? item.id, item.allergens, item.code, item.name);
}

/** Flyer-style display: (A,Wh,G) */
export function formatAllergenLabel(codes: string | null | undefined): string | null {
  const value = codes?.trim();
  return value ? `(${value})` : null;
}
