import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import type { ValidationIssue } from '../utils/cbt';

/** Prefix a season-level message with its season ("2027: …") so errors aren't conveyed by row colour alone. */
const describe = (i: ValidationIssue) => {
  const season = /^seasons\.(\d{4})/.exec(i.field)?.[1];
  return season && !i.message.includes(season) ? `${season}: ${i.message}` : i.message;
};

export const IssuesList: React.FC<{ issues: ValidationIssue[] }> = ({ issues }) => {
  if (issues.length === 0) return null;
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  return (
    <div role="alert" className="space-y-2">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          <p className="font-semibold flex items-center gap-1 mb-1">
            <AlertCircle size={14} /> Fix {errors.length === 1 ? 'this' : `these ${errors.length}`} to see results
          </p>
          <ul className="list-disc pl-5 space-y-0.5">
            {errors.map((e, i) => (
              <li key={i}>{describe(e)}{e.rule && <span className="font-mono text-xs text-red-500"> · {e.rule}</span>}</li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <ul className="space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i} className="flex gap-1"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{describe(w)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
