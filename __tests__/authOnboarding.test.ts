jest.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock("react-native-keychain", () => ({
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

import { isOnboardingComplete } from "../src/modules/common/auth/api/AuthAPI";

describe("isOnboardingComplete", () => {
  it("returns false when either onboarding flag is not complete", () => {
    expect(isOnboardingComplete({ terms_accepted: 1, fitness_onboarding_done: 0 })).toBe(false);
    expect(isOnboardingComplete({ terms_accepted: 0, fitness_onboarding_done: 1 })).toBe(false);
  });

  it("returns true only when both flags are complete", () => {
    expect(isOnboardingComplete({ terms_accepted: 1, fitness_onboarding_done: 1 })).toBe(true);
  });
});
