import React from 'react';
import { Landmark, RefreshCw, Wallet } from 'lucide-react';
import type { Result } from '../utils/cbt';
import { formatMillions, formatMoney } from '../utils/format';

/** AAV at signing (A1, scenario-independent) and the selected scenario's totals (spec §6). */
export const ResultCards: React.FC<{ result: Result }> = ({ result }) => {
  const diff = result.totals.cbt - result.totals.cash;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 ring-4 ring-blue-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-blue-700">CBT AAV at Signing</h3>
          <RefreshCw className="w-5 h-5 text-blue-500" />
        </div>
        <p className="text-3xl font-bold text-blue-600" data-testid="aav">{formatMillions(result.aavAtSigning)}</p>
        <p className="text-xs text-blue-400 mt-1 font-mono">{formatMoney(result.aavAtSigning)} per guaranteed year</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-500">Total CBT (This Scenario)</h3>
          <Landmark className="w-5 h-5 text-slate-300" />
        </div>
        <p className="text-3xl font-bold text-slate-900" data-testid="total-cbt">{formatMillions(result.totals.cbt)}</p>
        <p className="text-xs text-slate-500 mt-1">charged across every season</p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-500">Total Cash (This Scenario)</h3>
          <Wallet className="w-5 h-5 text-green-500" />
        </div>
        <p className="text-3xl font-bold text-slate-900" data-testid="total-cash">{formatMillions(result.totals.cash)}</p>
        <p className={`text-xs mt-1 ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
          CBT {diff < 0 ? 'below' : diff > 0 ? 'above' : 'equals'} cash{diff !== 0 && ` by ${formatMillions(Math.abs(diff))}`} — see the breakdown
        </p>
      </div>
    </div>
  );
};
