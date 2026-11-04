import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { RULES, type Result, type SeasonClass } from '../utils/cbt';
import { formatMoney } from '../utils/format';
import { cardClass } from './fields';
import { TagBadge } from './FlagsCallout';

function status(c: SeasonClass | undefined, played: boolean): string {
  if (!c) return 'payout year';
  const base = c.effectiveKind === 'guaranteed' ? 'guaranteed' : c.effectiveKind === 'club' ? 'club-type option' : c.isGuaranteed ? 'player option (guaranteed)' : 'player option';
  return played ? base : `${base} · not played`;
}

/** Per-season CBT and cash; each season expands into its charge line items with rule ids, tags and cites (spec §6). */
export const YearTable: React.FC<{ result: Result }> = ({ result }) => {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const played = new Set(result.playedSeasons);
  const toggle = (s: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  return (
    <div className={`${cardClass} overflow-hidden`}>
      <div className="px-6 py-4 border-b border-slate-100 flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-800">Year-by-Year Breakdown</h3>
        <span className="text-xs text-slate-400">expand a season to see why</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Season</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right bg-blue-50/50 text-blue-800">CBT Charge</th>
              <th className="px-6 py-3 text-right">Cash Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.perSeason.map((row) => {
              const charges = result.charges.filter((c) => c.season === row.season);
              const cls = result.classification.find((c) => c.season === row.season);
              const isOpen = open.has(row.season);
              const detailsId = `season-${row.season}-charges`;
              return (
                <React.Fragment key={row.season}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-700">
                      {charges.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggle(row.season)}
                          aria-expanded={isOpen}
                          aria-controls={detailsId}
                          aria-label={`${row.season}: ${isOpen ? 'hide' : 'show'} ${charges.length} charge${charges.length === 1 ? '' : 's'}`}
                          className="inline-flex items-center gap-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          {row.season}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-[14px]" />
                          {row.season}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-500">{status(cls, played.has(row.season))}</td>
                    <td className="px-6 py-3 text-right font-medium bg-blue-50/30 text-blue-600 font-mono">{charges.length ? formatMoney(row.cbt) : '—'}</td>
                    <td className="px-6 py-3 text-right text-slate-800 font-mono">{row.cash ? formatMoney(row.cash) : '—'}</td>
                  </tr>
                  {isOpen && (
                    <tr id={detailsId} className="bg-slate-50/60 text-xs">
                      <td colSpan={4} className="px-6 py-2">
                        <ul className="space-y-2">
                          {charges.map((c, i) => (
                            <li key={i} className="grid grid-cols-[1fr_auto] gap-x-4">
                              <span className="text-slate-700">{c.label}</span>
                              <span className="text-right font-mono text-blue-700">{formatMoney(c.amount)}</span>
                              <span className="col-span-2 flex flex-wrap gap-x-3 gap-y-1 text-slate-500">
                                {c.rules.map((r) => (
                                  <span key={r} className="inline-flex items-center gap-1">
                                    <span className="font-mono text-slate-600">{r}</span>
                                    <TagBadge tag={RULES[r].tag} />
                                    <span>{RULES[r].cite}</span>
                                  </span>
                                ))}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 font-semibold text-slate-700 border-t border-slate-200">
            <tr>
              <td className="px-6 py-3" colSpan={2}>Total</td>
              <td className="px-6 py-3 text-right font-mono text-blue-700">{formatMoney(result.totals.cbt)}</td>
              <td className="px-6 py-3 text-right font-mono">{formatMoney(result.totals.cash)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
