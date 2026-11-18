# RP Move Android changes and verification

## Root causes

- The imported RP Move screens referenced a missing source-text helper, number formatter and `stepCounter` localization namespace. The shared app tab bar also lacked the four fitness routes and the height function RP Move used to reserve its footer.
- Android tried to initialize Health Connect before discovering whether it was available. Both the JS client and the native permission delegate also tried to use the Android system controller's package as a standalone provider. The flow could offer installation on an unsupported device or block setup after a valid zero-step read. [Health Connect SDK availability and provider reference](https://developer.android.com/reference/androidx/health/connect/client/HealthConnectClient)
- The onboarding CTA used a fixed-height, single-line text box. BMI and goal copy reserved only part of the width occupied by their artwork. The dashboard and point statement kept all columns side by side even where they had too little room. The supplied Android permission illustration also highlighted the generic Physical activity control. The Steps permission page now uses the existing Steps illustration component.

## Implementation

- The device picker keeps the existing cards and imagery. On Android it preselects Android, shows a locked iPhone card, checks SDK availability before initialization, and separates cases that need a provider install or update from unavailable devices.
- Opening Health Connect leaves the setup state pending. Android requests and rechecks the native Steps read grant before reading data. A successful read of zero steps can complete the connection. Returning Android users enter the dashboard when the saved profile and goal exist and the live permission check passes. Access loss opens recovery while keeping the saved profile and goal.
- BMI and goal screens give artwork its own space on narrow Android screens and at larger text scales. Dashboard statistics and wallet transactions stack as needed. The fitness bar uses the same reserved height as its parent region, with the system bottom inset counted once. Font-sensitive onboarding CTA wrapping is Android-specific.
- The existing iOS HealthKit request and iOS hero layout paths remain in use. The backend endpoints, goal payloads, reward values, and React Query invalidation paths remain in use.

## Verification

| Check | Result |
| --- | --- |
| TypeScript | Passed with `--noEmit` |
| ESLint for RP Move and its changed shared code | 0 errors, 28 warnings |
| Jest | 209 tests passed across 25 suites. The runner was force-exited after assertions because the suite reports open handles. |
| Translation check | 1,045 keys across 17 namespaces in English, Hindi and Marathi |
| Metro | Development Android bundle built. The running Metro server returned HTTP 200 for the bundle, and the connected app reloaded. |
| Android debug build | Passed `:app:assembleDebug --offline` with the updated native permission delegate |
| Physical Android phone | Android 12, about 393 dp wide, gesture navigation, light theme, font scale 1.0 and Marathi. Visually inspected the device picker and Health Connect instructions. The installed app opened the standalone Health Connect settings and returned to RP Move. |

[Android Health Connect instructions screenshot](./rp-move-android-open-health-connect.png)

The phone used its previously installed debug APK with the Metro JS update. The refreshed APK was built locally. A subsequent reload reached the biometric gate, which prevented further RP Move inspection. Validation is still open for the updated native permission dialog, actual grant and denial, the complete first-user backend flow, saved-goal and account-switching scenarios on device, and the full set of dashboard, BMI, goal, achievements, progress and wallet layouts. Small and large physical screens, modern integrated Health Connect, three-button navigation, larger fonts, dark theme, and iOS visual regressions also remain open.

## Files changed in this pass

- `android/app/src/main/java/com/rewardsplanners/MainActivity.kt`
- `__tests__/rpMoveOnboarding.test.tsx`
- `scripts/check-translations.cjs`
- `src/bottombar/BottomTabs.tsx`
- `src/i18n/format.ts`
- `src/i18n/resources.ts`
- `src/i18n/sourceText.ts`
- `src/i18n/locales/en/stepCounter.json`
- `src/i18n/locales/hi/stepCounter.json`
- `src/i18n/locales/mr/stepCounter.json`
- `src/modules/step_counter/component/StepCode/StepsTrackerScreen.tsx`
- `src/modules/step_counter/component/StepCode/onboarding/components.tsx`
- `src/modules/step_counter/component/StepCode/onboarding/useOnboardingFlow.ts`
- `src/modules/step_counter/component/fitness/AchievementsScreen.tsx`
- `src/modules/step_counter/component/fitness/BMIScreen.tsx`
- `src/modules/step_counter/component/fitness/Dashboard.tsx`
- `src/modules/step_counter/component/fitness/PointStatement.tsx`
- `src/modules/step_counter/component/fitness/ProgressScreen.tsx`
- `src/modules/step_counter/component/fitness/StepForm.tsx`
- `src/modules/step_counter/component/fitness/StepGoal.tsx`
- `src/modules/step_counter/context/StepTrackerContext.tsx`
- `src/modules/step_counter/navigation/RewardHomeStack.tsx`
- `src/modules/step_counter/utils/fitnessSetup.ts`
- `src/modules/step_counter/utils/theme.ts`
- `docs/rp-move-android-validation.md`
- `docs/rp-move-android-open-health-connect.png`
