# Mobile localization

English (`en`), Hindi (`hi`) and Marathi (`mr`) are bundled in the app. The migration covers the language flows and shared copy across all application modules. A full screen-by-screen copy and layout review is still open.

## Runtime and navigation

- `src/i18n/index.ts` initializes one i18next instance with English as the starting and fallback language. `resources.ts` registers each bundled namespace. React components subscribe with `useTranslation`, and utility functions use the same instance.
- The language provider restores AsyncStorage preferences using the authenticated numeric user ID. An absent or invalid value opens the picker with English selected. The picker persists even an explicit English choice. Logout and account changes replace the active preference, and delayed reads from another account are ignored.
- OTP authentication flows through the existing terms check and any biometric unlock. The picker appears before the dashboard for an account without a saved preference. The existing welcome bonus and notification permission prompt follow the picker when eligible.
- Profile → Settings → App Language opens the same list of choices with the current selection marked. A successful write updates the running app without resetting navigation. The screen shows a retry message if saving fails.
- `format.ts` supplies Indian locale variants for display formatting. The chat time formatter honors the device's 12/24-hour setting. Booking IDs, request dates, and payment values continue to use their existing formats.

## Migration checklist

| Area | Converted | Remaining review |
| --- | --- | --- |
| Sign-in and onboarding | Active mobile/email OTP screens, terms screen UI, first-login picker and welcome reward | Legacy auth routes, remaining biometric and upgrade copy, and server terms |
| Shared UI and Dashboard | Bottom tabs, standard module names, navbar search prompts, global search labels, and order hub | Remaining results states, dashboard cards, static banners, and dynamic strings |
| Profile, rewards and notifications | Settings and picker, account and card labels, welcome reward, and permission prompt | Account deletion workflow, profile fallbacks, notifications settings states, and reward and wallet detail screens |
| Products | Shared shopping labels across listings, cart, addresses, checkout, wishlist and orders | Product detail, delivery and return flows, checkout validation, and remaining order states |
| Services | Shared service forms, cart and booking labels | Appointment and enquiry workflows, form schemas and dynamic validation, and confirmation/status copy |
| Payments and BBPS | Bill and payment labels, bill confirmation INR and date display, and shared order labels | Remaining bill category forms, BBPS responses/validation, status messages and receipt states |
| Bus booking | Search and recent routes, trip calendar display, boarding and passenger labels, and order date/amount display | Remaining route listing, seat and passenger forms, payment errors, cancellation, and policy copy |
| Chat, groups, polls and status | Shared controls, inbox, conversation copy, attachment previews, and presence/timestamps | Group administration, polls, media/status screens, remaining alerts and attachment actions |
| Insurance | Card, policy, document, claim, and quotation form labels | Remaining quote and claim flows, policy documents, provider-supplied data, and status copy |
| Step counter and games | Shared navigation, goal, progress and game labels | Remaining fitness onboarding, challenges, achievements, game instructions/results, and permissions |

Run `npm run i18n:audit -- --summary` for a file-by-file list of remaining literal candidates, or omit `--summary` for line numbers and text. The audit catches direct JSX text, common JSX props and `Alert.alert` arguments. It includes brand names and sample values that can stay as written. Follow up manually on state-derived text, static configuration objects, computed alerts, and server-supplied copy.

Run `npm run i18n:check` to compare the language resources, interpolation variables, bundled namespace registrations, and explicit namespaced keys in source. Add screen copy to the relevant namespace and use a complete string for each message. Use interpolation or `Trans` for variables and emphasized text.

## Backend work

The checked-in mobile endpoints serve content in its source language, and the app stores each user's preference on this device. Product descriptions, CMS campaigns, service content, BBPS data, legal terms, and messages retain their source text. Chat messages and other employee-generated content remain as authored.

Cross-device preferences need a field and read/write contract in the authenticated profile API. Localized content endpoints need translated values, a documented `Accept-Language` contract, and cache variation by language. Once those endpoints support localization, carry the chosen locale on those requests and include it in React Query keys and any persisted CMS cache keys. Existing server caches can continue to serve the same response in every locale while the payload is language-neutral.

## Release checks

- Finish the remaining copy migration and have Hindi and Marathi reviewers check the financial and insurance terminology in context.
- Run Android and iOS device checks for OTP, terms, first login, account switching, restarts, and switching from Profile while keeping navigation state.
- Check Hindi and Marathi glyphs and wrapping at large system text sizes, especially tabs, forms, dialogs, payment controls, the bus calendar, and accessibility labels.
- Rebuild the apps to autolink `react-native-localize`. Install the iOS CocoaPods dependencies on macOS before building iOS.
- Verify the offline screen and restoration on devices. Translation resources ship in the app bundle and the existing offline guard continues to control network-dependent screens.

## Automated verification

- The resource checker passed for 646 keys in 16 namespaces across all three languages.
- TypeScript passed with `--noEmit`. Jest passed 204 tests across 24 suites, including login routing, language persistence, account isolation, chat presence, and payment safety. The verification run used `--forceExit` because the suite reported open handles at shutdown.
- Android and iOS Metro bundling passed. The Android debug APK also built with the cached Gradle installation. The iOS native build requires macOS. Device checks for typography, navigation and offline restoration are pending.
- Repository-wide ESLint reported 89 errors. The localization foundation files passed the focused lint check. The focused pass also reported an existing hook dependency error in `StatusTray.tsx`.

## Inventory

The repository contains 95 files matching the screen filename or folder convention, and 189 literal navigator registrations across 145 distinct route names. Route names can recur in multiple stacks, and some screens and subflows render through conditional components.

| Source area | Files using i18n | Files with audit candidates | Literal candidates |
| --- | ---: | ---: | ---: |
| `bottombar` | 2 | 0 | 0 |
| `bbps` | 15 | 15 | 73 |
| `busbooking` | 8 | 11 | 126 |
| `chat` | 10 | 4 | 15 |
| `common` | 18 | 22 | 70 |
| `dashboard` | 13 | 18 | 61 |
| `ecommerce` | 60 | 63 | 334 |
| `games` | 2 | 1 | 3 |
| `inssurance` | 9 | 10 | 229 |
| `polls` | 1 | 0 | 0 |
| `services` | 39 | 60 | 377 |
| `status` | 1 | 1 | 5 |
| `step_counter` | 18 | 23 | 166 |
| `navbar` | 1 | 0 | 0 |
| **Total** | **197** | **228** | **1459** |

<details><summary>Changed and added files (265)</summary>

- `App.tsx`
- `__tests__/App.test.tsx`
- `__tests__/languagePreference.test.tsx`
- `docs/localization-migration.md`
- `jest.setup.js`
- `package-lock.json`
- `package.json`
- `scripts/audit-localization.cjs`
- `scripts/check-translations.cjs`
- `src/bottombar/BottomTabs.tsx`
- `src/bottombar/MainTabs.tsx`
- `src/i18n/LanguageContext.tsx`
- `src/i18n/LanguageScreens.tsx`
- `src/i18n/format.ts`
- `src/i18n/index.ts`
- `src/i18n/languageStorage.ts`
- `src/i18n/languages.ts`
- `src/i18n/locales/en/auth.json`
- `src/i18n/locales/en/busBooking.json`
- `src/i18n/locales/en/chat.json`
- `src/i18n/locales/en/common.json`
- `src/i18n/locales/en/dashboard.json`
- `src/i18n/locales/en/fitness.json`
- `src/i18n/locales/en/games.json`
- `src/i18n/locales/en/insurance.json`
- `src/i18n/locales/en/language.json`
- `src/i18n/locales/en/notifications.json`
- `src/i18n/locales/en/payments.json`
- `src/i18n/locales/en/polls.json`
- `src/i18n/locales/en/products.json`
- `src/i18n/locales/en/profile.json`
- `src/i18n/locales/en/services.json`
- `src/i18n/locales/en/status.json`
- `src/i18n/locales/hi/auth.json`
- `src/i18n/locales/hi/busBooking.json`
- `src/i18n/locales/hi/chat.json`
- `src/i18n/locales/hi/common.json`
- `src/i18n/locales/hi/dashboard.json`
- `src/i18n/locales/hi/fitness.json`
- `src/i18n/locales/hi/games.json`
- `src/i18n/locales/hi/insurance.json`
- `src/i18n/locales/hi/language.json`
- `src/i18n/locales/hi/notifications.json`
- `src/i18n/locales/hi/payments.json`
- `src/i18n/locales/hi/polls.json`
- `src/i18n/locales/hi/products.json`
- `src/i18n/locales/hi/profile.json`
- `src/i18n/locales/hi/services.json`
- `src/i18n/locales/hi/status.json`
- `src/i18n/locales/mr/auth.json`
- `src/i18n/locales/mr/busBooking.json`
- `src/i18n/locales/mr/chat.json`
- `src/i18n/locales/mr/common.json`
- `src/i18n/locales/mr/dashboard.json`
- `src/i18n/locales/mr/fitness.json`
- `src/i18n/locales/mr/games.json`
- `src/i18n/locales/mr/insurance.json`
- `src/i18n/locales/mr/language.json`
- `src/i18n/locales/mr/notifications.json`
- `src/i18n/locales/mr/payments.json`
- `src/i18n/locales/mr/polls.json`
- `src/i18n/locales/mr/products.json`
- `src/i18n/locales/mr/profile.json`
- `src/i18n/locales/mr/services.json`
- `src/i18n/locales/mr/status.json`
- `src/i18n/resources.ts`
- `src/modules/bbps/component/home/BillsCard.tsx`
- `src/modules/bbps/component/order/BBPSOrderFilterSheet.tsx`
- `src/modules/bbps/component/order/OrderHistory.tsx`
- `src/modules/bbps/component/order/RechargeSuccessCard.tsx`
- `src/modules/bbps/component/order/RecommendedServices.tsx`
- `src/modules/bbps/component/recharge/ReachargeHomeScreen.tsx`
- `src/modules/bbps/component/recharge/RechargeSection.tsx`
- `src/modules/bbps/constatnt/BBPSHead.tsx`
- `src/modules/bbps/constatnt/RewardProductCard.tsx`
- `src/modules/bbps/screen/BillDetailsScreen.tsx`
- `src/modules/bbps/screen/BillerSelectScreen.tsx`
- `src/modules/bbps/screen/PaymentConfirmationScreen.tsx`
- `src/modules/bbps/screen/ProductScreen.tsx`
- `src/modules/bbps/screen/RechargeConfirmationScreen.tsx`
- `src/modules/bbps/screen/TransactionStatusScreen.tsx`
- `src/modules/busbooking/components/screens/AllFilterScreen.tsx`
- `src/modules/busbooking/components/screens/BoardingDroppingSelectionScreen.tsx`
- `src/modules/busbooking/components/screens/BookingHomeScreen.tsx`
- `src/modules/busbooking/components/screens/BusListingScreen.tsx`
- `src/modules/busbooking/components/screens/BusOrderDetailScreen.tsx`
- `src/modules/busbooking/components/screens/BusOrdersScreen.tsx`
- `src/modules/busbooking/components/screens/PassengerDetailsScreen.tsx`
- `src/modules/busbooking/components/screens/SeatSelectionScreen.tsx`
- `src/modules/busbooking/utils/busOrderFormat.ts`
- `src/modules/chat/components/ChatAttachmentSheet.tsx`
- `src/modules/chat/components/ChatEmojiPanel.tsx`
- `src/modules/chat/components/ChatSettingsSheet.tsx`
- `src/modules/chat/components/CreatePollModal.tsx`
- `src/modules/chat/screens/ChatConversationScreen.tsx`
- `src/modules/chat/screens/ChatInboxScreen.tsx`
- `src/modules/chat/screens/GroupInfoScreen.tsx`
- `src/modules/chat/screens/MemberProfileScreen.tsx`
- `src/modules/chat/screens/NewChatScreen.tsx`
- `src/modules/chat/utils.ts`
- `src/modules/common/auth/screens/AccountActivate.tsx`
- `src/modules/common/auth/screens/AccountActivationSuccess.tsx`
- `src/modules/common/auth/screens/BiometricLockScreen.tsx`
- `src/modules/common/auth/screens/ForgotPasswordScreen.tsx`
- `src/modules/common/auth/screens/LoginScreen.tsx`
- `src/modules/common/auth/screens/LogoutConfirmationModal.tsx`
- `src/modules/common/auth/screens/OTPScreen.tsx`
- `src/modules/common/auth/screens/PasswordUpdatedSuccess.tsx`
- `src/modules/common/auth/screens/RegisterScreen.tsx`
- `src/modules/common/auth/screens/SetNewPassword.tsx`
- `src/modules/common/auth/screens/TermsGateScreen.tsx`
- `src/modules/common/cms/splash/PromotionalSplashScreen.tsx`
- `src/modules/common/cms/splash/__tests__/launchFlow.test.tsx`
- `src/modules/common/noInternet/NoInternet.tsx`
- `src/modules/common/notifications/NotificationPermissionPrompt.tsx`
- `src/modules/common/order/InvoiceAndServiceBanner.tsx`
- `src/modules/common/order/OrderReceipt.tsx`
- `src/modules/common/order/PriceDetailsCard.tsx`
- `src/modules/common/reward/RewardModal.tsx`
- `src/modules/dashboard/birthday/BirthdayWishModal.tsx`
- `src/modules/dashboard/dashboard/GlobalSearchScreen.tsx`
- `src/modules/dashboard/dashboard/InvestmentInsuranceOverview.tsx`
- `src/modules/dashboard/explore/ExploreModule.tsx`
- `src/modules/dashboard/explore/ServicesModule.tsx`
- `src/modules/dashboard/globalorder/TrackOrderScreen.tsx`
- `src/modules/dashboard/header/SearchDropdown.tsx`
- `src/modules/dashboard/notification/Notification.tsx`
- `src/modules/dashboard/notification/NotificationSettings.tsx`
- `src/modules/dashboard/reward/Rewardsoverview.tsx`
- `src/modules/dashboard/stepcount/Home_Chart.tsx`
- `src/modules/dashboard/stepcount/PaymentsQuickAccessCard.tsx`
- `src/modules/dashboard/stepcount/StepsCounterCard.tsx`
- `src/modules/ecommerce/chart/RadialProgressCard.tsx`
- `src/modules/ecommerce/components/ItemCardAddress/AddAddressMapScreen.tsx`
- `src/modules/ecommerce/components/ItemCardAddress/AddressFormPayload.tsx`
- `src/modules/ecommerce/components/ItemCardAddress/AddressPage.tsx`
- `src/modules/ecommerce/components/ItemCardAddress/AddressSelectScreen.tsx`
- `src/modules/ecommerce/components/ItemCardAddress/CheckoutSummary.tsx`
- `src/modules/ecommerce/components/ItemCardAddress/WithAddress.tsx`
- `src/modules/ecommerce/components/ItemCardAddress/WithoutAddress.tsx`
- `src/modules/ecommerce/components/Promotion/BestSeller.tsx`
- `src/modules/ecommerce/components/Promotion/MostView.tsx`
- `src/modules/ecommerce/components/Promotion/NewArrivals.tsx`
- `src/modules/ecommerce/components/Promotion/RecentProduct.tsx`
- `src/modules/ecommerce/components/Promotion/RecommendedProducts.tsx`
- `src/modules/ecommerce/components/Promotion/TopRated.tsx`
- `src/modules/ecommerce/components/cart/buysections.tsx`
- `src/modules/ecommerce/components/cart/deliverysections.tsx`
- `src/modules/ecommerce/components/cart/offersection.tsx`
- `src/modules/ecommerce/components/cart/productvariants.tsx`
- `src/modules/ecommerce/components/checkout/CheckoutSummary.tsx`
- `src/modules/ecommerce/components/checkout/OrderProcedbutton.tsx`
- `src/modules/ecommerce/components/checkout/OrderStepUI.tsx`
- `src/modules/ecommerce/components/home/OfferHome.tsx`
- `src/modules/ecommerce/components/home/TransactionHistory.tsx`
- `src/modules/ecommerce/components/home/Wallet_History.tsx`
- `src/modules/ecommerce/components/home/categories_section.tsx`
- `src/modules/ecommerce/components/home/featuresProduct.tsx`
- `src/modules/ecommerce/components/invoice/DownloadInvoice.tsx`
- `src/modules/ecommerce/components/order/FilterBottomSheet.tsx`
- `src/modules/ecommerce/components/order/ItemReturnRequest.tsx`
- `src/modules/ecommerce/components/order/MyOrder.tsx`
- `src/modules/ecommerce/components/order/SelectItemCancellationReason.tsx`
- `src/modules/ecommerce/components/product/product_section/Categories_Product.tsx`
- `src/modules/ecommerce/components/product/product_section/CustomerReviewsView.tsx`
- `src/modules/ecommerce/constants/ComingSoon.tsx`
- `src/modules/ecommerce/constants/Support/HelpForm.tsx`
- `src/modules/ecommerce/constants/Support/MyTickets.tsx`
- `src/modules/ecommerce/constants/coupan/CouponsPage.tsx`
- `src/modules/ecommerce/constants/coupan/CouponsSection.tsx`
- `src/modules/ecommerce/constants/heading/LoginHead.tsx`
- `src/modules/ecommerce/constants/heading/OrderHeading.tsx`
- `src/modules/ecommerce/constants/itemcart/BillDetailsCard.tsx`
- `src/modules/ecommerce/constants/itemcart/CartItemCard.tsx`
- `src/modules/ecommerce/constants/product_cart/PointsButton.tsx`
- `src/modules/ecommerce/constants/product_cart/ProductCard.tsx`
- `src/modules/ecommerce/profile/Profile.tsx`
- `src/modules/ecommerce/profile/ProfileScreen.tsx`
- `src/modules/ecommerce/profile/TermsandCondition.tsx`
- `src/modules/ecommerce/profile/TodoList.tsx`
- `src/modules/ecommerce/screens/BrandProductsScreen.tsx`
- `src/modules/ecommerce/screens/CategoriesScreen.tsx`
- `src/modules/ecommerce/screens/Explore.tsx`
- `src/modules/ecommerce/screens/ItemCancellationDetailsScreen.tsx`
- `src/modules/ecommerce/screens/OrderConfirmedScreen.tsx`
- `src/modules/ecommerce/screens/PaymentScreen.tsx`
- `src/modules/ecommerce/screens/ProductScreen.tsx`
- `src/modules/ecommerce/screens/ReviewScreen.tsx`
- `src/modules/ecommerce/screens/SearchScreen.tsx`
- `src/modules/ecommerce/screens/WishlistScreen.tsx`
- `src/modules/ecommerce/screens/categoryScreen.tsx`
- `src/modules/ecommerce/screens/product_description_screen.tsx`
- `src/modules/games/components/GamesDrawer.tsx`
- `src/modules/games/screens/QuizScreen.tsx`
- `src/modules/inssurance/components/screens/CashlessReviewScreen.tsx`
- `src/modules/inssurance/components/screens/ClaimEnquiryFormScreen.tsx`
- `src/modules/inssurance/components/screens/FindHospitalScreen.tsx`
- `src/modules/inssurance/components/screens/HealthClaimsScreen.tsx`
- `src/modules/inssurance/components/screens/HealthDashboard.tsx`
- `src/modules/inssurance/components/screens/MyECardScreen.tsx`
- `src/modules/inssurance/components/screens/NetworkHospitalsScreen.tsx`
- `src/modules/inssurance/components/screens/ReimbursementDetailsScreen.tsx`
- `src/modules/inssurance/components/screens/StartClaimScreen.tsx`
- `src/modules/polls/components/LivePollCard.tsx`
- `src/modules/services/component/cart/DocumentUpload.tsx`
- `src/modules/services/component/constant/BundleEnquiryForm.tsx`
- `src/modules/services/component/constant/DynamicEnquiryForm.tsx`
- `src/modules/services/component/constant/ServiceInterestForm.tsx`
- `src/modules/services/component/constant/navbar/CartHead.tsx`
- `src/modules/services/component/government/NeedHelpBanner.tsx`
- `src/modules/services/component/home/QuickServices.tsx`
- `src/modules/services/component/insurance/Health.tsx`
- `src/modules/services/component/insurance/PA.tsx`
- `src/modules/services/component/insurance/QuotesResult.tsx`
- `src/modules/services/component/insurance/Step1.tsx`
- `src/modules/services/component/insurance/Step1PA.tsx`
- `src/modules/services/component/insurance/Step2.tsx`
- `src/modules/services/component/insurance/Step2PA.tsx`
- `src/modules/services/component/insurance/Step3.tsx`
- `src/modules/services/component/insurance/Step3PA.tsx`
- `src/modules/services/component/insurance/Step3SuperTopUp.tsx`
- `src/modules/services/component/insurance/SuperTop.tsx`
- `src/modules/services/component/mutualfund/Calculators.tsx`
- `src/modules/services/component/mutualfund/CommonQuestionsScreen.tsx`
- `src/modules/services/component/mutualfund/FAQListingScreen.tsx`
- `src/modules/services/component/mutualfund/FAQSection.tsx`
- `src/modules/services/component/mutualfund/MFBeginners.tsx`
- `src/modules/services/component/mutualfund/MFInformedInvestors.tsx`
- `src/modules/services/component/mutualfund/MFInvestorsDetail.tsx`
- `src/modules/services/component/mutualfund/MFSectionArticles.tsx`
- `src/modules/services/component/order/MyOrder.tsx`
- `src/modules/services/component/order/ServiceCancellationDetails.tsx`
- `src/modules/services/component/order/ServiceCancellationRequest.tsx`
- `src/modules/services/component/order/ServiceDocumentsCard.tsx`
- `src/modules/services/component/order/ServiceFeedback.tsx`
- `src/modules/services/component/order/ServiceOrderDetail.tsx`
- `src/modules/services/component/pack/EnquireForm.tsx`
- `src/modules/services/component/pack/home_pack/PackFooterCTA.tsx`
- `src/modules/services/component/screens/CartScreen.tsx`
- `src/modules/services/component/screens/PackScreen.tsx`
- `src/modules/services/component/screens/Profile.tsx`
- `src/modules/services/component/screens/ServiceCheckoutScreen.tsx`
- `src/modules/services/component/screens/ServiceDescription.tsx`
- `src/modules/status/components/StatusTray.tsx`
- `src/modules/step_counter/component/StepCode/StepsTrackerScreen.tsx`
- `src/modules/step_counter/component/fitness/AchievementsScreen.tsx`
- `src/modules/step_counter/component/fitness/BMICard.tsx`
- `src/modules/step_counter/component/fitness/CoinHistoryAndPlan.tsx`
- `src/modules/step_counter/component/fitness/DailyStats.tsx`
- `src/modules/step_counter/component/fitness/Dashboard.tsx`
- `src/modules/step_counter/component/fitness/GoalReachedScreen.tsx`
- `src/modules/step_counter/component/fitness/PlanProgressCard.tsx`
- `src/modules/step_counter/component/fitness/PointStatement.tsx`
- `src/modules/step_counter/component/fitness/ProgressScreen.tsx`
- `src/modules/step_counter/component/fitness/StatisticsGraph.tsx`
- `src/modules/step_counter/component/fitness/StepForm.tsx`
- `src/modules/step_counter/component/fitness/StepGoal.tsx`
- `src/modules/step_counter/component/fitness/TodayGoalCompletedScreen.tsx`
- `src/modules/step_counter/component/fitness/WeeklyGraph.tsx`
- `src/modules/step_counter/component/home/Banner.tsx`
- `src/modules/step_counter/component/home/FeaturedProducts.tsx`
- `src/modules/step_counter/component/home/HomeCategories.tsx`
- `src/navbar/Navbar.tsx`
- `src/navigation/RootNavigator.tsx`
- `tsconfig.json`

</details>
