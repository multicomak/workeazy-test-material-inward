import type { CategoryCode, CategoryDef, Unit } from './types';

const LENGTH_FIELD = {
  name: 'length',
  label: 'Length',
  kind: 'number',
  unit: 'm',
  step: 0.001,
} as const;

/**
 * Category definitions live in code, not the DB: they drive the material form,
 * the weight engine and the display-name builder in lockstep.
 */
export const CATEGORIES: Record<CategoryCode, CategoryDef> = {
  pipe: {
    code: 'pipe',
    label: 'Pipes (MS/GI/SS)',
    weightMethod: 'pipe',
    hasLength: true,
    fields: [
      { name: 'nb', label: 'NB', kind: 'number', unit: 'mm', step: 0.01 },
      { name: 'od', label: 'OD', kind: 'number', unit: 'mm', step: 0.01 },
      { name: 'thickness', label: 'Thickness', kind: 'number', unit: 'mm', step: 0.01 },
      LENGTH_FIELD,
    ],
    buyUnits: ['KG', 'M'],
    sellUnits: ['KG', 'M', 'NOS'],
    defaultBuyUnits: ['KG', 'M'],
    defaultSellUnits: ['KG', 'M', 'NOS'],
  },
  angle: {
    code: 'angle',
    label: 'Angles',
    sectionType: 'ISA',
    weightMethod: 'is808',
    hasLength: true,
    fields: [
      { name: 'leg_a', label: 'Leg A', kind: 'number', unit: 'mm', step: 0.1 },
      { name: 'leg_b', label: 'Leg B', kind: 'number', unit: 'mm', step: 0.1 },
      { name: 'thickness', label: 'Thickness', kind: 'number', unit: 'mm', step: 0.1 },
      LENGTH_FIELD,
    ],
    buyUnits: ['KG', 'M'],
    sellUnits: ['KG', 'M', 'NOS'],
    defaultBuyUnits: ['KG', 'M'],
    defaultSellUnits: ['KG', 'M', 'NOS'],
  },
  channel: {
    code: 'channel',
    label: 'Channels',
    sectionType: 'ISMC',
    weightMethod: 'is808',
    hasLength: true,
    fields: [
      { name: 'designation', label: 'Designation', kind: 'select', optionsFrom: 'ISMC' },
      LENGTH_FIELD,
    ],
    buyUnits: ['KG', 'M'],
    sellUnits: ['KG', 'M', 'NOS'],
    defaultBuyUnits: ['KG', 'M'],
    defaultSellUnits: ['KG', 'M', 'NOS'],
  },
  ibeam: {
    code: 'ibeam',
    label: 'I-Beams',
    sectionType: 'ISMB',
    weightMethod: 'is808',
    hasLength: true,
    fields: [
      { name: 'designation', label: 'Designation', kind: 'select', optionsFrom: 'ISMB' },
      LENGTH_FIELD,
    ],
    buyUnits: ['KG', 'M'],
    sellUnits: ['KG', 'M', 'NOS'],
    defaultBuyUnits: ['KG', 'M'],
    defaultSellUnits: ['KG', 'M', 'NOS'],
  },
  hbeam: {
    code: 'hbeam',
    label: 'H-Beams',
    sectionType: 'ISWB',
    weightMethod: 'is808',
    hasLength: true,
    fields: [
      { name: 'designation', label: 'Designation', kind: 'select', optionsFrom: 'ISWB' },
      LENGTH_FIELD,
    ],
    buyUnits: ['KG', 'M'],
    sellUnits: ['KG', 'M', 'NOS'],
    defaultBuyUnits: ['KG', 'M'],
    defaultSellUnits: ['KG', 'M', 'NOS'],
  },
  rod: {
    code: 'rod',
    label: 'Square/Flat Rods',
    weightMethod: 'solid',
    hasLength: true,
    fields: [
      { name: 'width', label: 'Width', kind: 'number', unit: 'mm', step: 0.1 },
      { name: 'thickness', label: 'Thickness', kind: 'number', unit: 'mm', step: 0.1 },
      LENGTH_FIELD,
    ],
    buyUnits: ['KG', 'M'],
    sellUnits: ['KG', 'M', 'NOS'],
    defaultBuyUnits: ['KG', 'M'],
    defaultSellUnits: ['KG', 'M', 'NOS'],
  },
  sheet: {
    code: 'sheet',
    label: 'Colour Coated Sheets',
    weightMethod: 'solid',
    hasLength: true,
    fields: [
      { name: 'width', label: 'Width', kind: 'number', unit: 'mm', step: 0.1 },
      { name: 'thickness', label: 'Thickness', kind: 'number', unit: 'mm', step: 0.01 },
      LENGTH_FIELD,
    ],
    buyUnits: ['KG'],
    sellUnits: ['KG', 'NOS', 'SQFT', 'SQM'],
    defaultBuyUnits: ['KG'],
    defaultSellUnits: ['KG', 'NOS', 'SQFT', 'SQM'],
  },
  di_pipe: {
    code: 'di_pipe',
    label: 'DI Pipes',
    weightMethod: 'di_pipe',
    hasLength: true,
    fields: [
      { name: 'od', label: 'OD', kind: 'number', unit: 'mm', step: 0.1 },
      { name: 'class', label: 'Class', kind: 'select', options: ['K7', 'K9', 'K12'] },
      LENGTH_FIELD,
    ],
    // DI pipes are bought by the metre but rated per KG.
    buyUnits: ['M'],
    sellUnits: ['M', 'NOS'],
    defaultBuyUnits: ['M'],
    defaultSellUnits: ['M', 'NOS'],
  },
  coil: {
    code: 'coil',
    label: 'Coils (HR/CR/GI/PPGI)',
    weightMethod: 'solid',
    // Coils are the only category without a length: it is derived at inward.
    hasLength: false,
    fields: [
      { name: 'width', label: 'Width', kind: 'number', unit: 'mm', step: 0.1 },
      { name: 'thickness', label: 'Thickness', kind: 'number', unit: 'mm', step: 0.01 },
    ],
    buyUnits: ['KG'],
    sellUnits: ['KG', 'M'],
    defaultBuyUnits: ['KG'],
    defaultSellUnits: ['KG', 'M'],
  },
};

export const CATEGORY_CODES = Object.keys(CATEGORIES) as CategoryCode[];

export const CATEGORY_LIST: readonly CategoryDef[] = CATEGORY_CODES.map(
  (code) => CATEGORIES[code],
);

export function isCategoryCode(value: unknown): value is CategoryCode {
  return typeof value === 'string' && value in CATEGORIES;
}

export function getCategory(code: CategoryCode): CategoryDef {
  return CATEGORIES[code];
}

/** Units the category permits. The user may untick defaults but never add outside this set. */
export function allowedUnits(code: CategoryCode, side: 'buy' | 'sell'): readonly Unit[] {
  const def = CATEGORIES[code];
  return side === 'buy' ? def.buyUnits : def.sellUnits;
}
