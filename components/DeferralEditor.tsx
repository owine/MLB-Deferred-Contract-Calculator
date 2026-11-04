import React from 'react';
import type { ContractInput, DeferralSchedule } from '../utils/cbt';
import { sortRows, totalDeferred } from '../utils/form';
import { formatMoney } from '../utils/format';
import { Label, MoneyInput, NumberInput } from './fields';
import { PaymentsEditor } from './PaymentsEditor';

const ATTRIBUTION_TIP =
  'How the contract ties deferred money to seasons (E(6)(b)(i)). Sequential: first-earned paid first (reproduces Ohtani, Scherzer, Snell). Pro-rata: each season’s deferral is spread across every payment (reproduces Tucker, Bregman/Cubs). Not assigned: the CBA default — spread equally over the Guaranteed Years.';
const STATED_TIP =
  'Interest the contract pays on deferred money. Within 1.5 points of the interest rate above, deferrals count at face value (E(6)(b)(ii)); otherwise they are discounted to present value.';

export const DeferralEditor: React.FC<{ input: ContractInput; onChange: (next: ContractInput) => void }> = ({ input, onChange }) => {
  const d = input.deferral;
  const set = (patch: Partial<DeferralSchedule>) => onChange({ ...input, deferral: { ...d, ...patch } });
  const rows = sortRows(input.seasons);
  const lastSeason = rows[rows.length - 1]?.season ?? 2026;
  const principal = d.attribution === 'unattributed' ? (d.unattributedPrincipal ?? NaN) : totalDeferred(input);
  const paid = d.payments.reduce((s, p) => s + (Number.isFinite(p.amount) ? p.amount : 0), 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label text="Attribution" tip={ATTRIBUTION_TIP} htmlFor="attribution" />
          <select
            id="attribution"
            value={d.attribution}
            onChange={(e) => {
              const attribution = e.target.value as DeferralSchedule['attribution'];
              // Switching to the CBA default: start from the per-season total so the principal isn't blank.
              const prefill = attribution === 'unattributed' && d.unattributedPrincipal === undefined ? { unattributedPrincipal: totalDeferred(input) } : {};
              set({ attribution, ...prefill });
            }}
            className="w-full border border-slate-300 rounded-lg px-2 py-2 bg-white text-sm"
          >
            <option value="sequential">Contract assigns seasons (sequential)</option>
            <option value="prorata">Each season spread over every payment (pro-rata)</option>
            <option value="unattributed">Not assigned (CBA default)</option>
          </select>
        </div>
        <div>
          <Label text="Stated Interest (%)" tip={STATED_TIP} htmlFor="stated" />
          <NumberInput id="stated" step="0.01" min="0" value={d.statedInterestPct} onChange={(statedInterestPct) => set({ statedInterestPct })} />
        </div>
      </div>
      {d.attribution === 'unattributed' && (
        <div>
          <Label text="Total Deferred Principal ($)" htmlFor="principal" />
          <MoneyInput id="principal" value={d.unattributedPrincipal ?? NaN} onChange={(unattributedPrincipal) => set({ unattributedPrincipal })} />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-slate-600 mb-1">Payments (after {lastSeason})</p>
        <PaymentsEditor
          label="Deferral"
          payments={d.payments}
          defaultYear={lastSeason + 1}
          generateTotal={Number.isFinite(principal) ? principal : undefined}
          onChange={(payments) => set({ payments })}
        />
        <p className="text-xs text-slate-500 mt-2 font-mono">
          principal {Number.isFinite(principal) ? formatMoney(principal) : '—'} · scheduled {formatMoney(paid)}
        </p>
      </div>
    </div>
  );
};
