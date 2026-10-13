import { countAvailableSeats, formatAvailableSeats } from '../src/modules/busbooking/utils/busSeatAvailability';

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
