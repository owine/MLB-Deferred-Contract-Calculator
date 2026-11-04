import React from 'react';
import type { Result } from '../utils/cbt';
import { formatMoney } from '../utils/format';
import { cardClass } from './fields';

/** Article XVI: the funded balance the club must hold each July 1 (X1–X5). Hidden when nothing is deferred. */
export const FundingSchedule: React.FC<{ result: Result }> = ({ result }) => {
  const { snapshots, peak } = result.funding;
  if (snapshots.length === 0) return null;
  return (
    <div className={`${cardClass} p-6`}>
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Required Funding (Article XVI)</h3>
        <p className="text-sm text-slate-500">
          peak <span className="font-mono font-semibold text-slate-800">{formatMoney(peak)}</span>
        </p>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Present value at 5% of the deferred payments still owed, held from the second July 1 after each season they were earned. Snapshots use
        whole years; a payment due on July 1 counts as paid.
      </p>
      <details>
        <summary className="text-sm text-slate-600 cursor-pointer">Balance by July 1 ({snapshots.length} years)</summary>
        <table className="w-full text-sm mt-2">
          <tbody className="divide-y divide-slate-100">
            {snapshots.map((s) => (
              <tr key={s.july1}>
                <td className="py-1 text-slate-600">July 1, {s.july1}</td>
                <td className="py-1 text-right font-mono">{formatMoney(s.required)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};
