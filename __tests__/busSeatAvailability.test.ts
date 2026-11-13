import { countAvailableSeats, formatAvailableSeats, getVerifiedAvailableSeats } from '../src/modules/busbooking/utils/busSeatAvailability';

test('does not replace search availability with zero for missing or malformed layouts', () => {
  for (const seats of [undefined, null, [], [{}], [{ SeatName: 'A1' }], [[{ SeatName: 'A1', SeatStatus: true }]]]) {
    expect(getVerifiedAvailableSeats(seats)).toBeNull();
  }
});

test('accepts genuine sold-out layouts and normalized provider status strings', () => {
  expect(getVerifiedAvailableSeats([{ SeatName: 'A1', SeatStatus: false }])).toBe(0);
  expect(getVerifiedAvailableSeats([{ SeatName: 'A1', SeatStatus: ' TRUE ' }, { SeatName: 'A2', SeatStatus: 'False' }])).toBe(1);
});

test('counts all provider availability encodings across both decks', () => {
  const statuses = [true, 'true', 1, '1', false, 'false', 0, '0', undefined];
  expect(countAvailableSeats(statuses.map(SeatStatus => ({ SeatStatus })))).toBe(4);
  expect(countAvailableSeats([])).toBe(0);
});

test('preserves zero availability and does not concatenate decimal digits', () => {
  expect(formatAvailableSeats(0)).toBe('0 SEATS LEFT');
  expect(formatAvailableSeats('12.0')).toBe('12 SEATS LEFT');
  expect(formatAvailableSeats('12 SEATS LEFT')).toBe('12 SEATS LEFT');
  expect(formatAvailableSeats(undefined)).toBe('CHECK AVAILABILITY');
  expect(formatAvailableSeats(-1)).toBe('CHECK AVAILABILITY');
});
