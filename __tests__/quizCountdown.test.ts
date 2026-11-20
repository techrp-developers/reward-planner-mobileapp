import { startQuizCountdown } from '../src/modules/games/utils/quizCountdown';

beforeEach(() => {
  jest.useFakeTimers({ now: 0 });
});

afterEach(() => {
  jest.useRealTimers();
});

test('updates at each displayed second and stops at the deadline', () => {
  const previousTick = jest.fn();
  previousTick();
  const previousTimer = setInterval(previousTick, 200);
  const tick = jest.fn();
  startQuizCountdown(15000, tick);

  jest.advanceTimersByTime(15000);
  clearInterval(previousTimer);
  expect(previousTick).toHaveBeenCalledTimes(76);
  expect(tick.mock.calls.map(([seconds]) => seconds)).toEqual([
    15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
  ]);

  jest.advanceTimersByTime(10000);
  expect(tick).toHaveBeenCalledTimes(16);
});

test('resumes from the original deadline after a pause', () => {
  const tick = jest.fn();
  const stop = startQuizCountdown(5250, tick);
  jest.advanceTimersByTime(250);
  stop();
  jest.advanceTimersByTime(2000);
  expect(tick.mock.calls.map(([seconds]) => seconds)).toEqual([6, 5]);

  startQuizCountdown(5250, tick);
  expect(tick).toHaveBeenLastCalledWith(3);
  jest.advanceTimersByTime(3000);
  expect(tick).toHaveBeenLastCalledWith(0);
});
