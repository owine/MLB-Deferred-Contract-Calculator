import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Payment } from '../utils/cbt';
import { equalPayments } from '../utils/form';
import { MoneyInput, NumberInput } from './fields';

/** Edits a list of {year, amount} payments, with an optional "N equal payments" generator. */
export const PaymentsEditor: React.FC<{
  payments: Payment[];
  onChange: (p: Payment[]) => void;
  defaultYear: number;
  /** Total to split when generating equal payments; omit to hide the generator. */
  generateTotal?: number;
  label: string;
}> = ({ payments, onChange, defaultYear, generateTotal, label }) => {
  const [countText, setCountText] = useState('5');
  const count = Number(countText);
  const [firstYear, setFirstYear] = useState(defaultYear);
  useEffect(() => setFirstYear(defaultYear), [defaultYear]); // follow the contract when its seasons move
  const canGenerate = countText.trim() !== '' && Number.isInteger(count) && count >= 1 && Number.isInteger(firstYear) && firstYear >= 1900 && generateTotal !== undefined && generateTotal > 0;
  const set = (i: number, patch: Partial<Payment>) => onChange(payments.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <div className="space-y-2">
      {payments.map((p, i) => (
        <div key={i} className="grid grid-cols-[5.5rem_1fr_auto] gap-2 items-center">
          <NumberInput compact value={p.year} onChange={(year) => set(i, { year })} ariaLabel={`${label} payment ${i + 1} year`} />
          <MoneyInput compact value={p.amount} onChange={(amount) => set(i, { amount })} ariaLabel={`${label} payment ${i + 1} amount`} />
          <button
            type="button"
            onClick={() => onChange(payments.filter((_, j) => j !== i))}
            className="p-1 text-slate-400 hover:text-red-600"
            aria-label={`Remove ${label} payment ${i + 1}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => onChange([...payments, { year: payments.length ? payments[payments.length - 1].year + 1 : defaultYear, amount: 0 }])}
          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
        >
          <Plus size={12} /> Add payment
        </button>
        {generateTotal !== undefined && (
          <span className="flex items-center gap-1 text-slate-500">
            or
            <input aria-label="Number of equal payments" type="number" min="1" value={countText} onChange={(e) => setCountText(e.target.value)} className="w-12 border border-slate-300 rounded px-1 py-0.5" />
            equal payments from
            <input aria-label="First payment year" type="number" value={firstYear} onChange={(e) => setFirstYear(Number(e.target.value))} className="w-16 border border-slate-300 rounded px-1 py-0.5" />
            <button
              type="button"
              disabled={!canGenerate}
              onClick={() => canGenerate && onChange(equalPayments(firstYear, count, generateTotal))}
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded disabled:opacity-50"
            >
              Generate
            </button>
          </span>
        )}
      </div>
    </div>
  );
};
