import { normalizeAuthUser } from '../src/modules/common/auth/utils/normalizeAuthUser';

test('maps profile and login IDs to the identity used by status filtering and caches', () => {
  expect(normalizeAuthUser({ data: { userId: 24, name: 'First' } })).toEqual({ userId: 24, user_id: 24, name: 'First' });
  expect(normalizeAuthUser({ user: { userId: 25 } }).user_id).toBe(25);
  expect(normalizeAuthUser({ data: { user_id: '24' } }).user_id).toBe(24);
});

test('does not produce an undefined shared account identity', () => {
  expect(normalizeAuthUser({ data: { name: 'Unknown' } })).toBeNull();
  expect(normalizeAuthUser({ data: { userId: 0 } })).toBeNull();
  expect(normalizeAuthUser(null)).toBeNull();
});
