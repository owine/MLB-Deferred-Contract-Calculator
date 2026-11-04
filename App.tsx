import React, { useMemo, useState } from 'react';
import { Calculator, Info, Plus } from 'lucide-react';
import { calculate, defaultScenario, validate, validateScenario, type ContractInput, type Result, type Scenario } from './utils/cbt';
import { PRESETS, type Preset } from './data/presets';
import { hasDeferral, syncScenario } from './utils/form';
import { cardClass } from './components/styles';
import { PresetBar } from './components/PresetBar';
import { ContractTerms } from './components/ContractTerms';
import { ScheduleEditor } from './components/ScheduleEditor';
import { DeferralEditor } from './components/DeferralEditor';
import { IssuesList } from './components/IssuesList';
import { ScenarioPanel } from './components/ScenarioPanel';
import { ResultCards } from './components/ResultCards';
import { FlagsCallout } from './components/FlagsCallout';
import { CbtChart } from './components/CbtChart';
import { YearTable } from './components/YearTable';
import { FundingSchedule } from './components/FundingSchedule';
import { FundingRules } from './components/FundingRules';

const initial = PRESETS.find((p) => p.id === 'ohtani')!;

const App: React.FC = () => {
  const [input, setInput] = useState<ContractInput>(() => structuredClone(initial.input));
  const [scenario, setScenario] = useState<Scenario>(() => defaultScenario(initial.input));
  const [presetId, setPresetId] = useState<string | null>(initial.id);
  const [showDeferral, setShowDeferral] = useState(false);

  const edit = (next: ContractInput) => {
    if (next === input) return; // no-op edits (e.g. an invalid length) keep the preset and its reconciliation
    setInput(next);
    setScenario((s) => syncScenario(next, s));
    setPresetId(null); // the preset's reported figure no longer applies
  };
  const load = (p: Preset) => {
    const next = structuredClone(p.input);
    setInput(next);
    setScenario(defaultScenario(next));
    setPresetId(p.id);
    setShowDeferral(false); // the card still shows for presets with deferred money (hasDeferral)
  };

  const issues = useMemo(() => [...validate(input), ...validateScenario(input, scenario)], [input, scenario]);
  const result: Result | null = useMemo(
    () => (issues.some((i) => i.severity === 'error') ? null : calculate(input, scenario)),
    [input, scenario, issues],
  );
  const deferralVisible = showDeferral || hasDeferral(input);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <header className="bg-slate-900 text-white pt-8 pb-12 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">MLB Contract Calculator</h1>
          </div>
          <p className="text-slate-400 max-w-3xl">
            Calculate a contract’s Competitive Balance Tax (luxury tax) charge — salaries, signing bonuses, options, opt-outs and deferred money —
            under Article XXIII of the 2022–2026 Basic Agreement.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <div className={`${cardClass} p-6 space-y-5`}>
              <h2 className="text-lg font-semibold text-slate-800">Contract Terms</h2>
              <PresetBar presets={PRESETS} activeId={presetId} onLoad={load} />
              <ContractTerms input={input} onChange={edit} />
            </div>

            {deferralVisible ? (
              <div className={`${cardClass} p-6`}>
                <h2 className="text-lg font-semibold text-slate-800 mb-3">Deferred Money</h2>
                <DeferralEditor input={input} onChange={edit} />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeferral(true)}
                className="w-full flex items-center justify-center gap-1 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl py-3"
              >
                <Plus size={14} /> Add deferred money
              </button>
            )}

            <IssuesList issues={issues} />

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 text-sm text-blue-900 space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Info size={16} /> Calculation Methodology
              </h3>
              <p>
                The <strong>CBT charge</strong> for a multi-year contract is its Average Annual Value: Base Salary, signing bonus and the cost of
                deferred money across the Guaranteed Years, divided by the number of Guaranteed Years (Art. XXIII(E)(2)). Options, opt-outs and
                earned bonuses then adjust individual seasons.
              </p>
              <p>
                Deferred money counts in the season the contract attributes it to — or equally across the Guaranteed Years if it doesn’t (E(6)(b)(i)).
                It is discounted to present value at the Imputed Loan Interest Rate unless it carries interest within 1.5 points of that rate, in which
                case it counts at face value (E(6)(b)(ii)).
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className={`${cardClass} p-6`}>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Season by Season</h2>
              <ScheduleEditor input={input} issues={issues} onChange={edit} />
            </div>
            {/* Always rendered: it holds the earned-bonus inputs, so an invalid bonus must stay editable. */}
            <ScenarioPanel input={input} scenario={scenario} playedSeasons={result?.playedSeasons ?? null} onChange={setScenario} />
            {result ? (
              <>
                <ResultCards result={result} />
                <FlagsCallout flags={result.flags} />
                <CbtChart result={result} />
                <YearTable result={result} />
                <FundingSchedule result={result} />
              </>
            ) : (
              <div className={`${cardClass} p-12 text-center text-slate-500`}>Results appear once the contract terms are valid.</div>
            )}
            <FundingRules />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
