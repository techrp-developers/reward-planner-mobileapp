import {
  calculateOffer,
  isAdult,
  LOAN_MAX,
  LOAN_MIN,
  TENURES,
} from '../src/modules/loan/utils/loanMath';

test('loan illustration reconciles interest, principal, fees and net disbursal', () => {
  for (const amount of [LOAN_MIN, 100000, LOAN_MAX]) {
    for (const months of TENURES) {
      const offer = calculateOffer(amount, months);
      expect(offer.schedule).toHaveLength(months);
      expect(
        offer.schedule.reduce((sum, row) => sum + row.principal, 0),
      ).toBeCloseTo(amount, 6);
      expect(
        offer.schedule.reduce((sum, row) => sum + row.interest, 0),
      ).toBeCloseTo(offer.interest, 6);
      expect(offer.schedule[months - 1].balance).toBe(0);
      expect(offer.total).toBeCloseTo(offer.emi * months, 6);
      expect(offer.net + offer.fee).toBe(amount);
      expect(offer.schedule.every(row => row.balance >= 0)).toBe(true);
    }
  }
  expect(calculateOffer(100000, 12).emi).toBeCloseTo(8884.8789, 3);
});

test('zero interest works and invalid loan inputs are rejected', () => {
  expect(calculateOffer(120000, 12, 0).emi).toBe(10000);
  expect(calculateOffer(120000, 12, 0).interest).toBe(0);
  for (const amount of [NaN, Infinity, 0, LOAN_MIN - 1, LOAN_MAX + 1]) {
    expect(() => calculateOffer(amount, 12)).toThrow('Invalid loan terms');
  }
  expect(() => calculateOffer(100000, 0)).toThrow();
  expect(() => calculateOffer(100000, 13)).toThrow();
  expect(() => calculateOffer(100000, 12, -1)).toThrow();
  expect(() => calculateOffer(100000, 12, NaN)).toThrow();
});

test('date validation respects real calendar dates and eighteenth birthdays', () => {
  const today = new Date(2026, 10, 14);
  expect(isAdult('14/11/2008', today)).toBe(true);
  expect(isAdult('15/11/2008', today)).toBe(false);
  expect(isAdult('31/02/1995', today)).toBe(false);
  expect(isAdult('29/02/2000', today)).toBe(true);
  expect(isAdult('29/02/2001', today)).toBe(false);
  expect(isAdult('01/01/2030', today)).toBe(false);
  expect(isAdult('1995-06-15', today)).toBe(false);
});
