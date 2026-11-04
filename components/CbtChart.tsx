import React, { Suspense, lazy } from 'react';
import type { Result } from '../utils/cbt';
import { cardClass } from './styles';

// Recharts is most of the bundle; load it in its own chunk so the inputs are usable sooner. The import starts when
// this module loads, not at first render, so the chunk downloads while React mounts the app (no waterfall).
const chartModule = import('./CbtBarChart');
chartModule.catch(() => {}); // a failure is handled by ChartErrorBoundary once the chart renders; don't log it as unhandled
const CbtBarChart = lazy(() => chartModule.then((m) => ({ default: m.CbtBarChart })));

const Placeholder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-full w-full flex items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">{children}</div>
);

/**
 * Keeps a chart failure inside this card instead of unmounting the app. A render error clears on the next result
 * (new input); a failed chunk load (e.g. a tab left open across a deploy) stays, since lazy() caches the rejection.
 */
class ChartErrorBoundary extends React.Component<{ resetKey: unknown; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: { resetKey: unknown }) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
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
      <ChartErrorBoundary resetKey={result}>
        <Suspense fallback={<Placeholder>Loading chart…</Placeholder>}>
          <CbtBarChart result={result} />
        </Suspense>
      </ChartErrorBoundary>
    </div>
  </div>
);
