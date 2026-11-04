import React from 'react';
import type { ContractInput, ValidationIssue, YearKind } from '../utils/cbt';
import { setOptOutPayment, sortRows, toggleOptOut, updateRow } from '../utils/form';
import { InfoTooltip } from './InfoTooltip';
import { MoneyInput } from './fields';
import { KIND_LABELS } from './labels';

const OPTION = new Set<YearKind>(['club', 'mutual', 'vesting', 'player', 'dual']);

const KIND_TIP =
  'Guaranteed years are averaged into the AAV. Club, mutual and vesting options are not guaranteed: their buyout counts up front and the salary only if exercised. Player and dual options count as guaranteed unless the buyout is more than 50% of that year’s salary (E(5)(a)). Option years must come after all guaranteed years.';
const OPT_OUT_TIP =
  'A player opt-out after this season. The seasons after it stay guaranteed (as player option years) unless the opt-out payment is more than 50% of their salaries (E(5)(a)(ii)). Front-loaded deals can trigger a Valley Charge.';

export const ScheduleEditor: React.FC<{
  input: ContractInput;
  issues: ValidationIssue[];
  onChange: (next: ContractInput) => void;
}> = ({ input, issues, onChange }) => {
  const rows = sortRows(input.seasons);
  const unattributed = input.deferral.attribution === 'unattributed';
  const bad = (season: number) => issues.some((i) => i.severity === 'error' && i.field.startsWith(`seasons.${season}`));
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="px-2 py-1 text-left font-medium">Season</th>
            <th className="px-2 py-1 text-left font-medium">Current salary</th>
            <th className="px-2 py-1 text-left font-medium">Deferred</th>
            <th className="px-2 py-1 text-left font-medium">
              <span className="inline-flex items-center">Type<InfoTooltip text={KIND_TIP} /></span>
            </th>
            <th className="px-2 py-1 text-left font-medium">Buyout</th>
            <th className="px-2 py-1 text-center font-medium">
              <span className="inline-flex items-center">Opt-out after<InfoTooltip text={OPT_OUT_TIP} /></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const optOut = input.optOuts.find((o) => o.afterSeason === r.season);
            const isLast = i === rows.length - 1;
            return (
              <React.Fragment key={r.season}>
                <tr className={bad(r.season) ? 'bg-red-50' : ''}>
                  <td className="px-2 py-1 font-medium text-slate-700">{r.season}</td>
                  <td className="px-2 py-1 min-w-[8rem]">
                    <MoneyInput compact invalid={bad(r.season)} value={r.currentSalary} onChange={(currentSalary) => onChange(updateRow(input, r.season, { currentSalary }))} ariaLabel={`${r.season} current salary`} />
                  </td>
                  <td className="px-2 py-1 min-w-[7rem]">
                    <MoneyInput
                      compact
                      invalid={bad(r.season)}
                      disabled={unattributed && Number.isFinite(r.deferred) && r.deferred >= 0} // keep an invalid value fixable
                      value={r.deferred}
                      onChange={(deferred) => onChange(updateRow(input, r.season, { deferred }))}
                      ariaLabel={unattributed ? `${r.season} deferred (not used: deferrals are not assigned to seasons)` : `${r.season} deferred`}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      aria-label={`${r.season} type`}
                      value={r.kind}
                      onChange={(e) => onChange(updateRow(input, r.season, { kind: e.target.value as YearKind }))}
                      className="border border-slate-300 rounded px-1 py-1 bg-white"
                    >
                      {Object.entries(KIND_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>{label}</option>
                      ))}
                    </select>
                    {(r.kind === 'player' || r.kind === 'dual') && (
                      <label className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <input
                          type="checkbox"
                          checked={r.guaranteedIfExercised ?? true}
                          onChange={(e) => onChange(updateRow(input, r.season, { guaranteedIfExercised: e.target.checked }))}
                        />
                        salary guaranteed if exercised
                      </label>
                    )}
                  </td>
                  <td className="px-2 py-1 min-w-[7rem]">
                    {OPTION.has(r.kind) ? (
                      <MoneyInput compact invalid={bad(r.season)} value={r.buyout ?? 0} onChange={(buyout) => onChange(updateRow(input, r.season, { buyout }))} ariaLabel={`${r.season} buyout`} />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-2 py-1 text-center">
                    {!isLast && (
                      <input
                        type="checkbox"
                        aria-label={`Opt-out after ${r.season}`}
                        checked={!!optOut}
                        onChange={() => onChange(toggleOptOut(input, r.season))}
                      />
                    )}
                  </td>
                </tr>
                {optOut && (
                  <tr className="bg-amber-50/60">
                    <td colSpan={6} className="px-2 py-1">
                      <div className="flex items-center gap-2 text-xs text-amber-900">
                        <span className="whitespace-nowrap">↳ opt-out after {r.season}, payment if he opts out:</span>
                        <div className="w-40">
                          <MoneyInput compact value={optOut.payment} onChange={(p) => onChange(setOptOutPayment(input, r.season, p))} ariaLabel={`Opt-out after ${r.season} payment`} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
