export type CategoryCode =
  | 'pipe'
  | 'angle'
  | 'channel'
  | 'ibeam'
  | 'hbeam'
  | 'rod'
  | 'sheet'
  | 'di_pipe'
  | 'coil';

export type SectionType = 'ISA' | 'ISMC' | 'ISMB' | 'ISWB';

export type Unit = 'KG' | 'M' | 'NOS' | 'SQFT' | 'SQM';

export type WeightMethod = 'pipe' | 'solid' | 'is808' | 'di_pipe';

export type WeightSource =
  | 'formula'
  | 'is808'
  | 'angle_formula'
  | 'di_table'
  | 'di_formula';

export type SpecFieldUnit = 'mm' | 'm';

export type SpecField =
  | {
      name: string;
      label: string;
      kind: 'number';
      unit: SpecFieldUnit;
      step: number;
    }
  | {
      name: string;
      label: string;
      kind: 'select';
      /** Static option list, or a marker to source options from the IS 808 lookup. */
      options?: readonly string[];
      optionsFrom?: SectionType;
    };

export type CategoryDef = {
  code: CategoryCode;
  label: string;
  /** The IS 808 section family this category resolves against, when applicable. */
  sectionType?: SectionType;
  weightMethod: WeightMethod;
  /** Coils are the only category without a length. */
  hasLength: boolean;
  fields: readonly SpecField[];
  buyUnits: readonly Unit[];
  sellUnits: readonly Unit[];
  defaultBuyUnits: readonly Unit[];
  defaultSellUnits: readonly Unit[];
};

export type Is808Row = {
  section_type: SectionType;
  designation: string;
  kg_per_m: number;
};

export type DiPipeClassRow = {
  od_mm: number;
  class: string;
  thickness_mm: number;
};

export type Lookups = {
  is808: readonly Is808Row[];
  diClasses: readonly DiPipeClassRow[];
};

export type WeightResult = {
  /** kg/m. For sheet: kg per running metre at the given width. */
  weightPerM: number;
  /** kg. Null for coil, which has no length. */
  weightPerPiece: number | null;
  source: WeightSource;
  /** For IS 808 categories: the designation the lookup resolved to. */
  resolvedDesignation?: string;
  /** For DI pipes: the wall thickness used. */
  resolvedThicknessMm?: number;
};

/** A material row as the domain layer needs to see it. */
export type MaterialLike = {
  category: CategoryCode;
  specs: Record<string, unknown>;
  weight_per_m: number;
  weight_per_piece: number | null;
  sub_category?: string | null;
  grade?: string | null;
};

export type InwardStatus = 'accepted' | 'pending_approval' | 'approved' | 'rejected';
