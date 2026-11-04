import React, { Suspense, lazy } from 'react';
import type { Result } from '../utils/cbt';
import { cardClass } from './styles';

// Recharts is most of the bundle; load it in its own chunk so the inputs are usable sooner.
const CbtBarChart = lazy(() => import('./CbtBarChart').then((m) => ({ default: m.CbtBarChart })));

const Placeholder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-full w-full flex items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">{children}</div>
);

/** Keeps a failed chunk load (e.g. a tab left open across a deploy) inside this card instead of unmounting the app. */
class ChartErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Placeholder>The chart couldn’t load. Reload the page to try again.</Placeholder> : this.props.children;
  }
}

/** Financial Timeline card. The heading and fixed-height frame render at once, so the lazy chart causes no layout shift. */
export const CbtChart: React.FC<{ result: Result }> = ({ result }) => (
  <div className={`${cardClass} p-6`}>
    <h3 className="text-lg font-semibold text-slate-800 mb-6">Financial Timeline</h3>
    <div className="h-80 w-full">
      <ChartErrorBoundary>
        <Suspense fallback={<Placeholder>Loading chart…</Placeholder>}>
          <CbtBarChart result={result} />
        </Suspense>
      </ChartErrorBoundary>
    </div>
  </div>
);
