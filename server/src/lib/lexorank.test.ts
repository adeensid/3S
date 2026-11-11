import { compareRank, initialRank, rankAfter, rankBefore, rankBetween } from './lexorank.js';

describe('lexorank', () => {
  it('creates an initial rank', () => {
    expect(initialRank()).toBe('0|m:');
  });

  it('orders rankAfter above the previous value', () => {
    const first = initialRank();
    const second = rankAfter(first);
    expect(compareRank(second, first)).toBeGreaterThan(0);
  });

  it('orders rankBefore below the next value', () => {
    const next = initialRank();
    const before = rankBefore(next);
    expect(compareRank(before, next)).toBeLessThan(0);
  });

  it('inserts between two ranks', () => {
    const low = initialRank();
    const high = rankAfter(rankAfter(low));
    const mid = rankBetween(low, high);
    expect(compareRank(mid, low)).toBeGreaterThan(0);
    expect(compareRank(high, mid)).toBeGreaterThan(0);
  });

  it('rejects invalid bounds', () => {
    expect(() => rankBetween(rankAfter(initialRank()), initialRank())).toThrow(
      'Invalid rank bounds',
    );
  });

  it('resolves duplicate collisions by extending the rank string', () => {
    const base = initialRank();
    const sibling = rankBetween(base, rankAfter(base));
    const another = rankBetween(base, sibling);
    expect(compareRank(another, base)).toBeGreaterThan(0);
    expect(compareRank(sibling, another)).not.toBe(0);
  });
});
