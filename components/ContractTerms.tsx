import React, { useEffect, useState } from 'react';
import type { ContractInput } from '../utils/cbt';
import { fillEvenly, setLength, setStartSeason, sortRows } from '../utils/form';
import { CommitNumberInput, Label, MoneyInput, NumberInput } from './fields';
import { PaymentsEditor } from './PaymentsEditor';

const ILIR_TIP =
  'Imputed Loan Interest Rate (Art. XXIII(A)(4), E(6)(b)(ii)): the annual Federal mid-term rate for the October before the first Contract Year the contract covers (or the month before terms are confirmed, if earlier). Only used when the contract has deferred money.';
const BONUS_TIP =
  'Spread evenly over the Guaranteed Years whenever it is paid (E(3)). Installments paid after the contract ends are discounted as deferred compensation. With no schedule, the bonus is treated as paid in the first season.';

export const ContractTerms: React.FC<{ input: ContractInput; onChange: (next: ContractInput) => void }> = ({ input, onChange }) => {
  const rows = sortRows(input.seasons);
  const [total, setTotal] = useState(NaN);
  const hasPayments = input.signingBonus.payments.length > 0;
  // The user controls open/closed; it opens when a schedule appears (e.g. a preset loads) but never closes itself.
  const [scheduleOpen, setScheduleOpen] = useState(hasPayments);
  useEffect(() => {
    if (hasPayments) setScheduleOpen(true);
  }, [hasPayments]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label text="First Season" htmlFor="start-season" />
          <CommitNumberInput id="start-season" min={1900} max={2100} value={rows[0]?.season ?? 2026} onCommit={(y) => onChange(setStartSeason(input, y))} />
        </div>
        <div>
          <Label text="Length (Seasons)" htmlFor="length" />
          <CommitNumberInput id="length" min={1} max={30} value={rows.length} onCommit={(n) => onChange(setLength(input, n))} />
        </div>
      </div>

      <div>
        <Label text="Fill Salaries Evenly From Total ($)" htmlFor="fill-total" />
        <div className="flex gap-2">
          <div className="flex-1">
            <MoneyInput id="fill-total" value={total} onChange={setTotal} />
          </div>
          <button
            type="button"
            disabled={!Number.isFinite(total)}
            onClick={() => onChange(fillEvenly(input, total))}
            className="text-sm bg-slate-100 hover:bg-slate-200 disabled:opacity-50 px-3 rounded-lg"
          >
            Fill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label text="Interest Rate (%)" tip={ILIR_TIP} htmlFor="ilir" />
          <NumberInput id="ilir" step="0.01" min="0" value={input.ilirPct} onChange={(ilirPct) => onChange({ ...input, ilirPct })} />
        </div>
        <div>
          <Label text="Signing Bonus ($)" tip={BONUS_TIP} htmlFor="bonus" />
          <MoneyInput
            id="bonus"
            value={input.signingBonus.amount}
            onChange={(amount) => onChange({ ...input, signingBonus: { ...input.signingBonus, amount } })}
          />
        </div>
      </div>
      {(input.signingBonus.amount > 0 || input.signingBonus.payments.length > 0) && (
        <details className="text-sm" open={scheduleOpen} onToggle={(e) => setScheduleOpen(e.currentTarget.open)}>
          <summary className="cursor-pointer text-slate-600">Signing bonus payment schedule ({input.signingBonus.payments.length || 'paid in first season'})</summary>
          <div className="mt-2">
            <PaymentsEditor
              label="Signing bonus"
              payments={input.signingBonus.payments}
              defaultYear={rows[0]?.season ?? 2026}
              onChange={(payments) => onChange({ ...input, signingBonus: { ...input.signingBonus, payments } })}
            />
          </div>
        </details>
      )}
    </div>
  );
};
