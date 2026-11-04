import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Result } from '../utils/cbt';
import { formatMoney } from '../utils/format';
import { cardClass } from './fields';

/** CBT charged vs cash received per calendar year, with the last played season marked (spec §6). */
export const CbtChart: React.FC<{ result: Result }> = ({ result }) => {
  const lastPlayed = result.playedSeasons[result.playedSeasons.length - 1];
  return (
    <div className={`${cardClass} p-6`}>
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Financial Timeline</h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={result.perSeason} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="season" interval="preserveStartEnd" minTickGap={5} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v: number) => `$${Math.round(v / 1_000_000)}M`} />
            <Tooltip formatter={(v) => formatMoney(Number(v))} labelStyle={{ color: '#1e293b', fontWeight: 'bold' }} />
            <Legend />
            {lastPlayed !== undefined && <ReferenceLine x={lastPlayed} stroke="red" strokeDasharray="3 3" label={{ value: 'last season played', fontSize: 10, fill: '#ef4444', position: 'top' }} />}
            <Bar dataKey="cash" name="Cash Received" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cbt" name="CBT Charge" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
