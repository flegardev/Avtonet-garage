import { describe, it, expect } from 'vitest';
import { validateExpense } from '../src/utils/ownership.js';
describe('ownership expenses', () => {
  it('stores cents without unbounded text', () => { expect(validateExpense({ amount:'12.345', note:' Servis ', date:'2026-10-21' })).toEqual({ amount:12.35, note:'Servis', date:'2026-10-21' }); });
  it.each([-1, 0, Infinity, 'abc', 10000001])('rejects invalid amount %s', amount => { expect(() => validateExpense({ amount, note:'Servis', date:'2026-10-21' })).toThrow(); });
  it('rejects invalid dates and empty descriptions', () => { expect(() => validateExpense({ amount:1,note:'',date:'2026-10-21' })).toThrow(); expect(() => validateExpense({ amount:1,note:'Test',date:'invalid' })).toThrow(); });
});
