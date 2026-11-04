import { describe, expect, it } from 'vitest';
import { computeAav, selectDeemedBuyout } from '../aav';
import { classify } from '../classify';
import { deferralCosts, signingBonusCost } from '../deferral';
import type { ContractInput } from '../types';
import { build, guaranteed, Y1 } from './helpers';

function aavOf(input: ContractInput) {
  const classes = classify(input);
  return computeAav(input, classes, deferralCosts(input, classes), signingBonusCost(input, classes).cost);
}

describe('AAV at signing (A1–A5)', () => {
  it('A1 W1: 5 × 20 → 20', () => expect(aavOf(build(guaranteed(5, 20))).aav).toBeCloseTo(20, 9));

  it('A2 W2: signing bonus spread over Guaranteed Years', () => {
    const input = build([{ currentSalary: 30 }, { currentSalary: 30 }, { currentSalary: 20 }], { signingBonus: { amount: 6, payments: [] } });
    expect(aavOf(input).aav).toBeCloseTo(86 / 3, 9);
  });

  it('A3 W3: club option buyout is deemed Signing Bonus', () => {
    const r = aavOf(build([...guaranteed(4, 20), { currentSalary: 25, kind: 'club', buyout: 2 }]));
    expect(r.aav).toBeCloseTo(20.5, 9);
    expect(r.deemed).toMatchObject({ season: Y1 + 4, amount: 2, a5: false });
  });

  it('A3 W5: buyout of a non-guaranteed player option is deemed Signing Bonus', () => {
    expect(aavOf(build([...guaranteed(3, 20), { currentSalary: 10, kind: 'player', buyout: 6 }])).aav).toBeCloseTo(22, 9);
  });

  it('A3: buyout of a guaranteed player option is NOT a Signing Bonus', () => {
    expect(aavOf(build([...guaranteed(3, 20), { currentSalary: 12, kind: 'player', buyout: 5 }])).aav).toBeCloseTo(72 / 4, 9);
  });

  it('A4 W8: only the earliest option buyout counts', () => {
    const r = aavOf(build([...guaranteed(4, 20), { currentSalary: 25, kind: 'club', buyout: 2 }, { currentSalary: 26, kind: 'club', buyout: 3 }]));
    expect(r.aav).toBeCloseTo(20.5, 9);
    expect(r.deemed.rules).toEqual(['A3', 'A4']);
  });

  it('A5 W16: club + player buyouts → the higher one', () => {
    const r = aavOf(build([...guaranteed(4, 20), { currentSalary: 25, kind: 'club', buyout: 2 }, { currentSalary: 4, kind: 'player', buyout: 3 }]));
    expect(r.aav).toBeCloseTo(20.75, 9);
    expect(r.deemed).toMatchObject({ season: Y1 + 5, amount: 3, a5: true });
  });

  it('selectDeemedBuyout returns nothing when no option carries a buyout', () => {
    expect(selectDeemedBuyout(classify(build(guaranteed(2, 10)))).season).toBeNull();
  });
});
