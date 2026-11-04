import React from 'react';
import { ExternalLink } from 'lucide-react';
import { PRESET_GROUPS, type Preset } from '../data/presets';
import { formatMoney } from '../utils/format';
import { reconcile } from '../utils/presets';

export const PresetBar: React.FC<{ presets: Preset[]; activeId: string | null; onLoad: (p: Preset) => void }> = ({ presets, activeId, onLoad }) => {
  const active = presets.find((p) => p.id === activeId) ?? null;
  const rec = active ? reconcile(active) : null;
  return (
    <div className="space-y-3">
      <label htmlFor="preset" className="text-sm font-medium text-slate-600 mb-1 block">Load a Real Contract</label>
      <select
        id="preset"
        value={activeId ?? ''}
        onChange={(e) => {
          const p = presets.find((x) => x.id === e.target.value);
          if (p) onLoad(p);
        }}
        className="w-full border border-blue-200 bg-blue-50 text-blue-700 rounded-lg px-2 py-2 text-sm"
      >
        <option value="" disabled>{activeId ? '' : 'Custom contract — pick one to load…'}</option>
        {PRESET_GROUPS.map((g) => (
          <optgroup key={g} label={g}>
            {presets.filter((p) => p.group === g).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
      {active && (
        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
          {active.note && <p className="text-amber-700">{active.note}</p>}
          {rec && (
            <p className="font-mono">
              Reported CBT {formatMoney(rec.reported)} · Engine {formatMoney(rec.engine)} · Δ {formatMoney(rec.delta)}
              {active.reported && <span className="font-sans text-slate-500"> ({active.reported.note})</span>}
            </p>
          )}
          {active.sources.length > 0 && (
            <ul className="space-y-1">
              {active.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                    {new URL(s.url).hostname.replace(/^www\./, '')} <ExternalLink size={10} />
                  </a>{' '}
                  — {s.confirms}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
