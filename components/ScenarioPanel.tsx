import React from 'react';
import { defaultScenario, type ContractInput, type Scenario } from '../utils/cbt';
import { sortRows } from '../utils/form';
import { MoneyInput, cardClass } from './fields';
import { KIND_LABELS } from './ScheduleEditor';

/** "What happens?" toggles: option decisions, opt-out, earned bonuses (spec §6). Declining or opting out ends the contract. */
export const ScenarioPanel: React.FC<{
  input: ContractInput;
  scenario: Scenario;
  playedSeasons: number[] | null;
  onChange: (s: Scenario) => void;
}> = ({ input, scenario, playedSeasons, onChange }) => {
  const rows = sortRows(input.seasons);
  const optionSeasons = Object.keys(defaultScenario(input).options).map(Number).sort((a, b) => a - b);
  const played = new Set(playedSeasons ?? rows.map((r) => r.season));
  if (optionSeasons.length === 0 && input.optOuts.length === 0 && rows.length === 0) return null;
  return (
    <div className={`${cardClass} p-6 space-y-4`}>
      <h3 className="text-lg font-semibold text-slate-800">What Happens?</h3>
      {input.optOuts.length > 0 && (
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium text-slate-600 mb-1">Opt-out</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="optout" checked={scenario.optOutTakenAfter === null} onChange={() => onChange({ ...scenario, optOutTakenAfter: null })} />
            Plays out the contract
          </label>
          {input.optOuts.map((o) => (
            <label key={o.afterSeason} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="optout"
                checked={scenario.optOutTakenAfter === o.afterSeason}
                onChange={() => onChange({ ...scenario, optOutTakenAfter: o.afterSeason })}
              />
              Opts out after {o.afterSeason}
            </label>
          ))}
        </fieldset>
      )}
      {optionSeasons.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">Options</p>
          {optionSeasons.map((season) => {
            const row = rows.find((r) => r.season === season)!;
            const vesting = row.kind === 'vesting';
            const value = scenario.options[season] ?? 'declined';
            const voided = !played.has(season) && value === 'exercised';
            return (
              <div key={season} className={`flex items-center justify-between gap-2 text-sm ${voided ? 'opacity-50' : ''}`}>
                <span>
                  {season} {KIND_LABELS[row.kind].toLowerCase()}
                  {voided && <span className="text-xs text-slate-500"> (contract already ended)</span>}
                </span>
                <div className="flex rounded-lg border border-slate-300 overflow-hidden" role="group" aria-label={`${season} option decision`}>
                  {(['exercised', 'declined'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={value === v}
                      onClick={() => onChange({ ...scenario, options: { ...scenario.options, [season]: v } })}
                      className={`px-2 py-1 text-xs ${value === v ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      {vesting ? (v === 'exercised' ? 'Vested' : 'Not vested') : v === 'exercised' ? 'Exercised' : 'Declined'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <details>
        <summary className="text-sm font-medium text-slate-600 cursor-pointer">Earned bonuses (count in the season earned, outside the AAV)</summary>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {rows.map((r) => (
            <label key={r.season} className="text-xs text-slate-500">
              {r.season}
              <MoneyInput
                compact
                ariaLabel={`${r.season} earned bonus`}
                value={scenario.earnedBonuses[r.season] ?? 0}
                onChange={(b) => onChange({ ...scenario, earnedBonuses: { ...scenario.earnedBonuses, [r.season]: b } })}
              />
            </label>
          ))}
        </div>
      </details>
    </div>
  );
};
