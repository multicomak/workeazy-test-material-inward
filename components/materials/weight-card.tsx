'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fmt } from '@/lib/steel/num';
import { getCategory } from '@/lib/steel/categories';
import { isApproximate, WEIGHT_SOURCE_LABEL, type WeightError } from '@/lib/steel/weight';
import type { CategoryCode, WeightResult } from '@/lib/steel/types';

type Props = {
  category: CategoryCode;
  state: { ok: true; result: WeightResult } | { ok: false; error: WeightError };
};

/**
 * System output, never input. Muted surface, read-only, recomputed on every keystroke
 * by the same pure function the server action uses.
 */
export function WeightCard({ category, state }: Props) {
  const def = getCategory(category);

  return (
    <Card className="bg-muted/60">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Weight · derived</CardTitle>
        {state.ok ? (
          <Badge variant={isApproximate(state.result.source) ? 'amber' : 'blue'}>
            {WEIGHT_SOURCE_LABEL[state.result.source]}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent>
        {state.ok ? (
          <>
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-muted-foreground">Weight / m</dt>
                <dd className="tabular-nums text-xl font-semibold">
                  {fmt(state.result.weightPerM, 4)}{' '}
                  <span className="text-sm font-normal text-muted-foreground">kg/m</span>
                </dd>
              </div>
              {def.hasLength ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Weight / piece</dt>
                  <dd className="tabular-nums text-xl font-semibold">
                    {fmt(state.result.weightPerPiece, 3)}{' '}
                    <span className="text-sm font-normal text-muted-foreground">kg</span>
                  </dd>
                </div>
              ) : null}
            </dl>

            {def.sectionType && state.result.resolvedDesignation ? (
              <p className="mt-3 text-xs text-muted-foreground">
                IS 808 section:{' '}
                <span className="font-medium text-foreground">
                  {def.sectionType} {state.result.resolvedDesignation}
                </span>
                {state.result.source === 'angle_formula' ? (
                  <span className="text-amber-700 dark:text-amber-400">
                    {' '}
                    — not in table, using the approximate formula.{' '}
                    <Link href="/settings/is808" className="underline">
                      Add it
                    </Link>
                  </span>
                ) : null}
              </p>
            ) : null}

            {category === 'di_pipe' && state.result.resolvedThicknessMm !== undefined ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Wall thickness:{' '}
                <span className="font-medium text-foreground">
                  {fmt(state.result.resolvedThicknessMm)} mm
                </span>
                {state.result.source === 'di_formula' ? (
                  <span className="text-amber-700 dark:text-amber-400">
                    {' '}
                    — from the class formula, not the table.{' '}
                    <Link href="/settings/di-classes" className="underline">
                      Add a row
                    </Link>
                  </span>
                ) : (
                  ' — from the DI class table.'
                )}
              </p>
            ) : null}
          </>
        ) : (
          <p
            className={
              state.error.code === 'is808_missing'
                ? 'text-sm text-destructive'
                : 'text-sm text-muted-foreground'
            }
          >
            {state.error.code === 'is808_missing' ? (
              <>
                {state.error.message}{' '}
                <Link href="/settings/is808" className="underline">
                  Open Settings → IS 808
                </Link>
              </>
            ) : (
              'Fill in the technical specs to see the derived weight.'
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
