import React, { useEffect, useState } from 'react';
import { InfoTooltip } from './InfoTooltip';
import { moneyInputValue, parseMoney } from '../utils/format';
import { errorRing, inputClass } from './styles';

/** Field label. The tooltip button sits beside the <label>, not inside it, so the input's accessible name stays clean. */
export const Label: React.FC<{ text: string; tip?: string; htmlFor?: string }> = ({ text, tip, htmlFor }) => (
  <div className="mb-1 flex items-center">
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-600">
      {text}
    </label>
    {tip && <InfoTooltip text={tip} />}
  </div>
);

/** Dollar input: keeps the typed text while focused, shows thousands separators otherwise. Empty → NaN. */
export const MoneyInput: React.FC<{
  value: number;
  onChange: (n: number) => void;
  id?: string;
  invalid?: boolean;
  compact?: boolean;
  ariaLabel?: string;
  disabled?: boolean;
}> = ({ value, onChange, id, invalid, compact, ariaLabel, disabled }) => {
  const [text, setText] = useState(moneyInputValue(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(moneyInputValue(value));
  }, [value, focused]);
  return (
    <div className="relative">
      <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 font-semibold ${compact ? 'text-sm' : 'text-lg left-3'}`}>$</span>
      <input
        id={id}
        aria-label={ariaLabel}
        inputMode="decimal"
        type="text"
        value={text}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseMoney(e.target.value));
        }}
        className={`${inputClass} font-mono ${compact ? 'pl-5 pr-2 py-1 text-sm' : 'pl-8 pr-3 py-2 text-lg'} ${invalid ? errorRing : ''} disabled:opacity-40 disabled:cursor-not-allowed`}
      />
    </div>
  );
};

/** Plain number input (years, percentages). Empty → NaN. */
export const NumberInput: React.FC<{
  value: number;
  onChange: (n: number) => void;
  id?: string;
  step?: string;
  min?: string;
  invalid?: boolean;
  compact?: boolean;
  ariaLabel?: string;
}> = ({ value, onChange, id, step, min, invalid, compact, ariaLabel }) => (
  <input
    id={id}
    aria-label={ariaLabel}
    type="number"
    step={step}
    min={min}
    value={Number.isFinite(value) ? value : ''}
    aria-invalid={invalid || undefined}
    onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
    className={`${inputClass} ${compact ? 'px-2 py-1 text-sm' : 'px-3 py-2 text-lg'} ${invalid ? errorRing : ''}`}
  />
);

/**
 * Whole-number input for structural values (first season, length): edits a local draft and commits only on
 * blur or Enter, so intermediate keystrokes ("1" on the way to "12") never reshape the contract. Invalid → revert.
 */
export const CommitNumberInput: React.FC<{
  value: number;
  onCommit: (n: number) => void;
  id?: string;
  min?: number;
  max?: number;
}> = ({ value, onCommit, id, min, max }) => {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Number(draft);
    const valid = draft.trim() !== '' && Number.isInteger(n) && (min === undefined || n >= min) && (max === undefined || n <= max);
    if (valid && n !== value) onCommit(n); // unchanged → no edit (keeps a loaded preset loaded)
    else if (!valid) setDraft(String(value));
  };
  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setDraft(String(value));
      }}
      className={`${inputClass} px-3 py-2 text-lg`}
    />
  );
};
