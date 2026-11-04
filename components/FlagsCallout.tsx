import React from 'react';
import { Scale } from 'lucide-react';
import { RULES, type Flag } from '../utils/cbt';
import { TagBadge } from './TagBadge';

/** E(5)(d)(i) ¶1, quoted for the V8 callout (spec §6). */
const V8_QUOTE =
  '“…the difference between the amount paid to the Player under his Contract (including any Option Buyout payment) and the amount that has been attributed to Actual Club Payroll (excluding any amounts attributed pursuant to subparagraph (ii) below) of the Club under that Contract shall be added to (or subtracted from) Actual Club Payroll in the Contract Year in which the Player Option Year falls.”';

/** Every reading, practice or convention the current result depends on, with cite and the alternative reading. */
export const FlagsCallout: React.FC<{ flags: Flag[] }> = ({ flags }) => {
  if (flags.length === 0) return null;
  return (
    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-6 text-sm">
      <h3 className="font-semibold text-amber-900 flex items-center gap-2 mb-3">
        <Scale size={16} /> This result depends on {flags.length} rule{flags.length === 1 ? '' : 's'} worth knowing
      </h3>
      <ul className="space-y-3">
        {flags.map((f) => {
          const rule = RULES[f.rule];
          const alt = 'alternative' in rule ? rule.alternative : undefined;
          return (
            <li key={f.rule}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-700">{f.rule}</span>
                <TagBadge tag={rule.tag} />
                <span className="text-slate-800">{f.message}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {rule.cite}
                {alt && <> · other reading: {alt}</>}
              </p>
              {f.rule === 'V8' && <blockquote className="mt-2 border-l-2 border-amber-300 pl-3 text-xs italic text-slate-600">E(5)(d)(i): {V8_QUOTE}</blockquote>}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
