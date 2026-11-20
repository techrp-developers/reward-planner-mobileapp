import React from "react";
import { Text } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useAchievementsQuery } from "../src/modules/step_counter/api/useFitnessQueries";
import AchievementsScreen from "../src/modules/step_counter/component/fitness/AchievementsScreen";

jest.mock("@react-navigation/native", () => ({ useNavigation: () => ({}) }));
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "NavigationIcon");
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../src/i18n/sourceText", () => ({
  translateSourceText: (_namespace: string, text: string) => text,
}));
jest.mock("../src/theme/ThemeContext", () => ({ useAppTheme: () => ({ isDark: false }) }));
jest.mock("../src/modules/step_counter/api/useFitnessQueries", () => ({
  useAchievementsQuery: jest.fn(),
}));
jest.mock("../src/modules/step_counter/component/fitness/FitnessGradient", () => "Gradient");
jest.mock("../src/modules/step_counter/assets/StepCount/UnAchievedShield.svg", () => "LockedShield");
jest.mock("../src/modules/step_counter/component/fitness/achievementArtwork", () => ({
  achievementArtwork: {
    walking: { BadgeSvg: "WalkingShield", IconSvg: "WalkingIcon" },
    streak: { BadgeSvg: "StreakShield", IconSvg: "StreakIcon" },
    trail: { BadgeSvg: "TrailShield", IconSvg: "TrailIcon" },
    sunrise: { BadgeSvg: "SunriseShield", IconSvg: "SunriseIcon" },
  },
}));

let screen: ReactTestRenderer;

async function renderAchievements(groups: unknown[]) {
  jest.mocked(useAchievementsQuery).mockReturnValue({
    isLoading: false,
    data: { success: true, data: groups },
  } as ReturnType<typeof useAchievementsQuery>);

  await act(async () => {
    screen = create(<AchievementsScreen />);
  });
}

afterEach(async () => {
  await act(async () => screen.unmount());
});

test("renders earned and locked milestones from every group, including unfamiliar groups", async () => {
  await renderAchievements([
    {
      group_id: 1, group_key: "walking", title: "Walking Enthusiast",
      milestones: [
        { achievement_id: 1, type: "steps", target_value: 5000, achieved: true },
        { achievement_id: 2, type: "steps", target_value: 10000, achieved: false },
      ],
    },
    {
      group_id: 2, group_key: "streak_keeper", title: "Streak Keeper",
      milestones: [{ achievement_id: 3, type: "streak", target_value: 7, achieved: true }],
    },
    {
      group_id: 3, group_key: "new_group", title: "Long Walks",
      milestones: [{ achievement_id: 4, type: "steps", target_value: 1000000, achieved: false }],
    },
  ]);

  expect(screen.root.findAllByType(Text).map(({ props }) => props.children)).toEqual([
    "stepCounter:achievementsScreen.achievements",
    "Walking Enthusiast", "5K", "10K",
    "Streak Keeper", "7",
    "Long Walks", "1M",
  ]);
  expect(screen.root.findAllByType("WalkingShield")).toHaveLength(1);
  expect(screen.root.findAllByType("StreakShield")).toHaveLength(1);
  expect(screen.root.findAllByType("LockedShield")).toHaveLength(2);
});

test("shows an empty state when the API returns no groups", async () => {
  await renderAchievements([]);

  expect(screen.root.findAllByType(Text).map(({ props }) => props.children)).toContain(
    "stepCounter:achievementsScreen.empty",
  );
});
