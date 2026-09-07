import { z } from 'zod';
import { CATEGORY_CODES, getCategory, allowedUnits } from './categories';
import { ALL_UNITS } from './units';
import type { CategoryCode, Unit } from './types';

export const categoryCodeSchema = z.enum(CATEGORY_CODES as [CategoryCode, ...CategoryCode[]]);
export const unitSchema = z.enum(ALL_UNITS as unknown as [Unit, ...Unit[]]);

const optionalText = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((v) => (v === '' ? undefined : v));

/** Specs schema derived from the category definition — the form and the action share it. */
export function specsSchemaFor(category: CategoryCode) {
  const def = getCategory(category);
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of def.fields) {
    if (field.kind === 'number') {
      shape[field.name] = z.coerce
        .number({ message: `${field.label} is required` })
        .positive(`${field.label} must be greater than 0`)
        .finite();
    } else if (field.options) {
      shape[field.name] = z.enum(field.options as [string, ...string[]]);
    } else {
      shape[field.name] = z.string().trim().min(1, `${field.label} is required`);
    }
  }

  return z.object(shape);
}

function unitsSchemaFor(category: CategoryCode, side: 'buy' | 'sell') {
  const allowed = allowedUnits(category, side);
  return z
    .array(unitSchema)
    .min(1, `Pick at least one ${side} unit`)
    .refine((units) => units.every((u) => allowed.includes(u)), {
      message: `Only ${allowed.join(', ')} are valid ${side} units for this category`,
    });
}

/** Full material payload. Weight is never part of it — it is always derived on save. */
export function materialSchemaFor(category: CategoryCode) {
  return z.object({
    category: z.literal(category),
    sub_category: optionalText,
    grade: optionalText,
    hsn_code: optionalText,
    manufacturer: optionalText,
    brand: optionalText,
    is_active: z.boolean().default(true),
    specs: specsSchemaFor(category),
    buy_units: unitsSchemaFor(category, 'buy'),
    sell_units: unitsSchemaFor(category, 'sell'),
  });
}

export type MaterialInput = {
  category: CategoryCode;
  sub_category?: string;
  grade?: string;
  hsn_code?: string;
  manufacturer?: string;
  brand?: string;
  is_active: boolean;
  specs: Record<string, unknown>;
  buy_units: Unit[];
  sell_units: Unit[];
};

/** Validate an untrusted payload against the schema for its own category. */
export function parseMaterialInput(raw: unknown) {
  const outer = z.object({ category: categoryCodeSchema }).safeParse(raw);
  if (!outer.success) {
    return { success: false as const, error: 'Unknown category.' };
  }
  const parsed = materialSchemaFor(outer.data.category).safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false as const,
      error: first ? `${first.path.join('.')}: ${first.message}` : 'Invalid material.',
      issues: parsed.error.issues,
    };
  }
  return { success: true as const, data: parsed.data as MaterialInput };
}

export const inwardSchema = z.object({
  material_id: z.string().uuid('Pick a material'),
  supplier: optionalText,
  vehicle_no: optionalText,
  batch_no: optionalText,
  actual_weight_kg: z.coerce
    .number({ message: 'Actual weight is required' })
    .positive('Actual weight must be greater than 0'),
  pieces: z.coerce
    .number({ message: 'Number of pieces is required' })
    .int('Pieces must be a whole number')
    .positive('Pieces must be greater than 0'),
  actual_length_m: z
    .union([z.coerce.number().positive(), z.literal('').transform(() => undefined)])
    .optional(),
});

export type InwardInput = z.infer<typeof inwardSchema>;

export const decisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(['approve', 'reject']),
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters'),
});

export const is808Schema = z.object({
  section_type: z.enum(['ISA', 'ISMC', 'ISMB', 'ISWB']),
  designation: z.string().trim().min(1, 'Designation is required').max(40),
  kg_per_m: z.coerce.number().positive('kg/m must be greater than 0'),
});

export const diClassSchema = z.object({
  od_mm: z.coerce.number().positive('OD must be greater than 0'),
  class: z.enum(['K7', 'K9', 'K12']),
  thickness_mm: z.coerce.number().positive('Thickness must be greater than 0'),
});
