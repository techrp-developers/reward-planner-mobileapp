# Software Requirements Specification
## Ecommerce Module — Reward Planner Mobile App

**Document version:** 1.0
**Date:** 2026-07-20
**Module scope:** `src/modules/ecommerce` (React Native client) and `src/server/app/ecommerce/v1` (Node.js/Express API)

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements of the **Ecommerce module** of the Reward Planner mobile application, as implemented by the current codebase. It covers the complete customer journey from product discovery through login-gated actions (cart, checkout, payment), order placement, shipment tracking, delivery, post-purchase actions (review, cancellation, invoice), and supporting features (wishlist, reward wallet, campaigns, support tickets). It is written for developers, QA, and product stakeholders who need an authoritative, code-derived reference of what the module does today.

### 1.2 Scope
The Ecommerce module lets an authenticated user of the Reward Planner app:
- Discover and search products (home rails, categories, search).
- View product details, variants, stock, and reviews.
- Maintain a wishlist and a shopping cart.
- Manage delivery addresses.
- Check out (whole cart or single "Buy Now" item), optionally redeeming reward coins.
- Pay via Razorpay (UPI/card/netbanking/wallet).
- Track order and shipment status through to delivery.
- Cancel eligible orders, view invoices, and write product reviews.
- Browse campaigns/flash sales and view reward-wallet transactions.
- Raise support tickets related to orders.

**Out of scope for this document:** the shared **login/registration/session** system (`src/modules/common/auth`, `src/server/app/common`) is only described to the extent the Ecommerce module depends on it. Other sibling modules (`bbps`, `services`, `games`, `step-counter`, `dashboard`) are out of scope.

### 1.3 Definitions, Acronyms, Abbreviations
| Term | Meaning |
|---|---|
| SRS | Software Requirements Specification |
| RN | React Native (mobile client) |
| JWT | JSON Web Token, used for session auth |
| AWB | Air Waybill number (courier tracking number) |
| NDR | Non-Delivery Report (failed delivery attempt) |
| RTO | Return To Origin (shipment returned to seller after failed delivery) |
| SLA | Service Level Agreement (expected delivery timeframe) |
| Reward Coins | In-app wallet currency earned/redeemed on purchases |
| Vendor | Seller/merchant that fulfils one or more items in an order |

### 1.4 References
- Frontend source: `src/modules/ecommerce/**`
- Backend source: `src/server/app/ecommerce/v1/**`
- Shared auth: `src/modules/common/auth/**`, `src/server/app/common/**`
- Mount point: `src/server/app.js` — `app.use("/v1", ecommerceRoute)`

### 1.5 Overview
Section 2 gives an overall description of the system and its actors. Section 3 details functional requirements module by module, following the user journey. Section 4 covers external interfaces (screens, APIs, third-party services). Section 5 covers non-functional requirements. Section 6 documents the state machines that govern order/payment/shipment lifecycles. Section 7 lists known gaps and technical debt observed in the code, relevant to future requirements work.

---

## 2. Overall Description

### 2.1 Product Perspective
The Ecommerce module is a sub-module of a larger multi-feature mobile app (rewards, bill payments, services, games, step counter). It is a client-server system:

- **Client:** React Native screens under `src/modules/ecommerce/screens` and `components`, using React Query for server-state caching, a shared Axios instance with auto token-refresh, and a lightweight `CartContext` for cart state.
- **Server:** Express routers/controllers/models under `src/server/app/ecommerce/v1`, backed by MySQL (transactional, row-locking used for stock/wallet integrity), mounted at `/v1/*`.
- **Third-party integrations:** Razorpay (payments), XpressBees (courier serviceability, booking, and tracking), WhatsApp/email notification services (order confirmations, NDR alerts).

> **Note on a stray directory:** `src/modules/ecommerce/v1/**` (controllers/models/routes/utils) contains what appears to be a duplicate/legacy copy of backend logic accidentally nested inside the mobile app repository. It is not executable by the RN client and is not the code actually mounted by `src/server/app.js` (that is `src/server/app/ecommerce/v1`). It is useful only as corroborating reference for business rules (e.g., lifecycle policy) and should be treated as dead weight in the repo, not a live architectural component. See §7.

### 2.2 Product Functions (Summary)
1. Product catalog browsing, search, and filtering.
2. Wishlist management.
3. Cart management (add/update/remove/clear).
4. Address book management (CRUD, map-based entry).
5. Checkout pricing preview and order creation (cart and buy-now flows).
6. Reward-coin redemption and earning.
7. Payment processing via Razorpay with server-side verification via webhook.
8. Order creation, listing, and detail retrieval.
9. Shipment booking, tracking, and status synchronization with courier (XpressBees).
10. Order cancellation (pre-delivery, policy-gated).
11. Invoice generation and download.
12. Product reviews and ratings (verified-purchase gated).
13. Campaigns/flash sales/promotional pricing.
14. Reward wallet balance and transaction history.
15. Support ticket creation and tracking.

### 2.3 User Classes and Characteristics
| User class | Description |
|---|---|
| Guest / unauthenticated user | Can browse products, categories, search, and view product details (endpoints using `optionalAuth`) but cannot see personalized wishlist/reward state, add to cart, checkout, or pay. |
| Authenticated customer | Full access: cart, checkout, payment, order tracking, cancellation, reviews, wishlist, wallet, support. |
| Vendor / back-office (implied, out of module) | Orders are grouped by vendor (`vendor_orders`); vendor-side fulfilment/admin approval (e.g., cancellation confirmation) is implied but not implemented within this module — see §7. |

### 2.4 Operating Environment
- Client: Android/iOS via React Native.
- Server: Node.js/Express, MySQL, hosted behind `https://rewardplanners.com/api/crm`.
- Payment gateway: Razorpay (server-side order creation + webhook; client-side Razorpay Checkout SDK).
- Logistics provider: XpressBees (serviceability, booking, tracking), polled via a 30-minute cron plus retry crons for booking and cancellation sync.

### 2.5 Design and Implementation Constraints
- All monetary/stock-affecting operations (`checkoutCart`, `buyNow`, payment capture) run inside DB transactions with row-level locks (`FOR UPDATE`) to prevent race conditions on stock and wallet balance.
- Client-declared order totals (`expected_total`, `expected_redeemable`) are re-validated server-side within a ₹0.50 tolerance before order creation — a tamper-resistance constraint.
- Shipment tracking is **cron-polled**, not webhook-pushed by the courier — real-time tracking latency is bounded by the 30-minute poll interval (plus faster retry crons for booking/cancellation).
- A global `drainMode` maintenance switch can block new checkout/payment-creation requests (returns HTTP 503) without affecting reads.

### 2.6 Assumptions and Dependencies
- A user must already be authenticated (via the shared `common` auth module) to perform any cart, checkout, payment, order, wishlist, or review action.
- The client trusts a Bearer JWT (`ACCESS_TOKEN_SECRET`-signed) attached automatically by the shared Axios instance, with token refresh and forced logout on refresh failure.
- Product/vendor/inventory data is assumed to be pre-populated by an external admin/vendor onboarding system not covered by this document.

---

## 3. System Features (Functional Requirements)

Each subsection lists the primary screen(s), the API(s) it calls, and numbered functional requirements (FR).

### 3.1 Authentication & Session (dependency, not owned by this module)
Ecommerce screens gate their functionality on `useAuth()` (`isAuthenticated`, `user`, `logout`) from the shared `common/auth` module. The Axios instance auto-attaches `Authorization: Bearer <token>`, refreshes on 401 (queuing concurrent requests during refresh), and force-logs-out the user on refresh failure, redirecting into the shared Auth stack.

- **FR-1.1** All cart, checkout, payment, order, wishlist, and review-write endpoints require a valid JWT (server middleware `auth`); requests without one receive HTTP 401.
- **FR-1.2** Product browsing, taxonomy, and read-only review endpoints use `optionalAuth`, personalizing output (e.g., wishlist flags) when a token is present but not rejecting anonymous requests.
- **FR-1.3** An account with `status !== 1` (inactive) is rejected with HTTP 403 even with a valid token.

### 3.2 Product Discovery & Browsing
**Screens:** `homescreen.tsx`, `CategoriesScreen.tsx`, `ProductCategoriesScreen.tsx`, `categoryScreen.tsx`, `ProductScreen.tsx`, `SearchScreen.tsx`.
**APIs:** `ProductApi.tsx`, `PromotionalApi.tsx`, `CampaignAPI.tsx` → backend `productController.js`, `campaignController.js` (`/v1/product/*`, `/v1/campaign/*`).

- **FR-2.1** The home screen shall display, as independently-loading sections: Categories, Best Sellers, Top Rated, Offer banners/campaigns, New Arrivals, Most Viewed, Recommended (auth required), Recently Viewed, and a full category product grid.
- **FR-2.2** The system shall support category and sub-category browsing (`GET /v1/product/categories`, `/subcategories/:categoryId`, `/categories-with-subcategories`).
- **FR-2.3** Product listings shall support pagination (offset/limit) and, for category views, filtering by search text, sort order, price range, and minimum rating.
- **FR-2.4** The system shall provide live search suggestions (`GET /v1/product/search/suggestions`) and full search results (`GET /v1/product/search/products`), and persist/retrieve/clear per-user search history.
- **FR-2.5** The system shall log a product view to `recently_viewed` when an authenticated user opens a product detail page.
- **FR-2.6** Promotional product rails (new arrivals, recent, recommended, similar, trending, best sellers, most viewed, top rated, "customers also bought") shall each be independently fetchable and paginated (fixed page size of 10), client-cached for 5 minutes.
- **FR-2.7** Home campaign content (posters, dashboard posters, active flash sales) shall be fetched from `GET /v1/campaign/home`, restricted server-side to campaigns with `status='active'` and, for flash sales, current time within `[start_at, end_at]`.
- **FR-2.8** All product-list responses shall be normalized client-side into one canonical shape (`utils/normalizeProduct.ts`) reconciling inconsistent field names across endpoints (price, discount, rating, wishlist flag, reward coins).

### 3.3 Product Details
**Screen:** `product_description_screen.tsx`.
**APIs:** `ProductApi.fetchProductDetailsByID`, `checkStock`, `ReviewApi.fetchProductReviews`, `WishlistApi`.

- **FR-3.1** The product detail page shall display images, variant options, price, stock availability (`GET /v1/cart/cart-items/check-stock/:variantId`), delivery estimate, description/specs, and a rating/review summary.
- **FR-3.2** The user shall be able to add the selected variant/quantity to the cart, toggle wishlist status, or proceed directly to checkout via "Buy Now" (bypassing the cart).
- **FR-3.3** The page shall show a "customers also bought" / similar-products section.

### 3.4 Wishlist
**Screen:** `WishlistScreen.tsx`.
**API:** `WishlistApi.tsx` → `wishListController.js` (`/v1/wishlist/*`).

- **FR-4.1** An authenticated user shall be able to add a `(product, variant)` pair to their wishlist; the operation is idempotent/toggle-like — adding an already-wishlisted item removes it, enforced uniquely per `(user_id, product_id, variant_id)`.
- **FR-4.2** The system shall reject adding an out-of-stock variant to the wishlist.
- **FR-4.3** The user shall be able to view, remove, and check membership of wishlist items, and move a wishlist item directly into the cart (`POST /move-to-cart`), which adds it to the cart then removes it from the wishlist.
- **FR-4.4** A wishlist item-count badge shall be available (`GET /badge`).

### 3.5 Cart Management
**Screen:** `cartScreen.tsx` (routed as `Cart`; renders `WithAddress`/`WithoutAddress`), state via `context/CartContext.tsx`.
**API:** `CartApi.tsx` → `cartController.js` (`/v1/cart/*`).

- **FR-5.1** The system shall allow adding a `(product, variant, quantity)` to the cart, validating stock under a row lock; errors `INVALID_VARIANT`/`INSUFFICIENT_STOCK` are surfaced to the user.
- **FR-5.2** The system shall allow updating a cart line's quantity (`quantity=0` removes the line), removing a single line, and clearing the entire cart.
- **FR-5.3** The system shall provide a cart summary (`GET /v1/cart/cart-summary?use_rewards=`) including totals and reward-coin impact, and the client shall keep this in sync with cart mutations via cache invalidation (`CartContext`).
- **FR-5.4** The cart screen shall branch its layout based on whether the user has a saved address: prompting address entry if none exists, otherwise showing line items, quantity controls, and a bill summary (`BillDetailsCard`: cart total, payable total, coins earned, coins redeemed, bag discount, shipping, handling fees) with a proceed-to-checkout action.
- **FR-5.5** Discount-coupon-code entry is present in the UI as inactive/hardcoded mock data only (`constants/coupan`) and is not wired to any backend endpoint; it shall not be represented as a functioning requirement (see §7). The only functioning discount mechanism is reward-coin redemption.

### 3.6 Address Management
**Screens/components:** `ItemCardAddress/AddressSelectScreen.tsx`, `NewAddressForm.tsx`, `AddAddressMapScreen.tsx`.
**API:** `AddressApi.tsx` → shared `common` address endpoints (`/v1/auth/address*`).

- **FR-6.1** The user shall be able to list, add, edit, and delete delivery addresses, including country/state lookups and map-assisted pin entry.
- **FR-6.2** Checkout and buy-now flows shall validate that the selected `address_id` belongs to the authenticated user, rejecting otherwise with `INVALID_ADDRESS`.

### 3.7 Checkout
**Component:** `components/checkout/OrderStepUI.tsx` (modes: `cart`, `buy_now`).
**API:** `CheckoutApi.tsx` → `checkoutController.js`/`checkoutModel.js` (`/v1/checkout/*`).

- **FR-7.1** The system shall provide a checkout preview (`GET /v1/checkout/get-cart` or `/get-buy-now`) showing item total, per-vendor shipping, and reward-coin redemption/earning, parameterized by `address_id` and `use_rewards`.
- **FR-7.2** The user shall be able to toggle reward-coin usage; redemption shall be capped by wallet balance and per-item reward rules (category/subcategory/discount-eligibility aware).
- **FR-7.3** Shipping cost per vendor shall be computed from the cheapest serviceable courier option (XpressBees serviceability check); if no courier services the destination pincode, checkout shall fail with `NOT_SERVICEABLE`.
- **FR-7.4** Order placement (`POST /v1/checkout/cart` or `/buy-now`) shall re-validate, within a DB transaction: current stock, current wallet balance, and that the client-supplied `expected_total`/`expected_redeemable` match the server-computed total within ₹0.50 (`PRICE_MISMATCH` otherwise) — an anti-tamper safeguard against stale/manipulated client pricing.
- **FR-7.5** On successful placement, the system shall: create one `eorders` row (status `pending_payment`, 15-minute expiry), reserve the redeemed wallet coins, create one `vendor_orders` row per vendor represented in the order, create `eorder_items` rows, atomically decrement variant stock (failing with `STOCK_RACE_CONDITION` if stock was lost to a concurrent order), create `order_shipments` rows (status `awaiting_payment`), and — for the cart flow only — clear the cart.
- **FR-7.6** Order creation shall retry on order-reference collision up to 3 times (order references are generated in the form `ORD-<timestamp36>-<random>`).
- **FR-7.7** A checkout/buy-now request rate limit (20 requests / 10 minutes per user) and a global maintenance "drain mode" (HTTP 503) shall both be enforceable ahead of order creation.

### 3.8 Payment
**Component:** `OrderStepUI.tsx` (Razorpay Checkout SDK integration).
**API:** `Payment.tsx` → `paymentController.js` (`/v1/payment/*`); gateway: Razorpay.

- **FR-8.1** After order creation, the client shall request a Razorpay order (`POST /v1/payment/create-order`), which the server creates idempotently (reusing an existing pending/created payment row for the same order if present) and rejects if the order is already `cancelled`/`paid` or has expired.
- **FR-8.2** The client shall present the Razorpay Checkout UI and, upon completion, submit the payment signature for verification (`POST /v1/payment/verify-payment`), which performs HMAC-SHA256 signature validation. This endpoint reflects, but does not itself authoritatively set, final payment state.
- **FR-8.3** The authoritative payment state transition (order → `paid`) shall occur only via the Razorpay webhook handler processing `payment.captured`/`payment.failed` events, with idempotency protection against duplicate webhook delivery and automatic refund on amount/currency mismatch or capture against an already-cancelled order.
- **FR-8.4** The client shall poll `GET /v1/payment/payment-status/:orderId` (up to 10 attempts at 2-second intervals) as a fallback confirmation mechanism if the synchronous verification response is inconclusive.
- **FR-8.5** The user shall be able to abandon/release an unpaid order (`POST /v1/payment/cancel-order/:orderId`), which restores stock, releases reserved wallet coins, cancels the awaiting-payment shipment records, and marks the order `cancelled` / payment `expired`. The same release logic runs automatically when a `pending_payment` order's 15-minute expiry elapses.
- **FR-8.6** On successful payment capture, the system shall: mark the order `paid`, consume the reserved wallet coins, generate one invoice per vendor, flip shipment records from `awaiting_payment` to `pending`, asynchronously initiate shipment booking, and enqueue user notifications (in-app, WhatsApp/email).
- **FR-8.7** Payment-related endpoints shall be rate-limited (10 requests / 10 minutes per user) and subject to the same maintenance drain-mode gate for order creation.
- **FR-8.8** Cash-on-delivery is not supported; all shipping-quote calls use a hardcoded `prepaid` payment type.

### 3.9 Order Placement, Confirmation & Receipt
**Screens:** `OrderConfirmedScreen.tsx` (doubles as confirmation + details/tracking).
**API:** `OrderApi.fetchOrderReceipt`, `CheckoutApi` → `checkoutController.getOrderReceipt` (`GET /v1/checkout/order-receipt/:orderId`, requires `paid_at` set).

- **FR-9.1** After payment success, the system shall present an order-confirmation view combining: order status/tracking journey, delivery address, price breakdown, items purchased, and links to invoice and review actions.
- **FR-9.2** The order receipt endpoint shall be reachable only for orders that have completed payment (`paid_at IS NOT NULL`).

### 3.10 Order Tracking & Shipment Logistics
**Screens:** `OrderConfirmedScreen.tsx` (embeds `OrderStatusJourney`).
**API:** `OrderApi.trackOrder`, `OrderApi.fetchOrderDetails` → `logisticsController.js`/`orderController.js` (`GET /v1/orders/order-details/:orderId`, `GET /v1/logistics/track-status/:orderId`).

- **FR-10.1** The system shall expose a 4-stage customer-facing tracking journey: **Processing → Shipped → Out for Delivery → Delivered**, each stage flagged completed/current, derived from the more granular shipment status.
- **FR-10.2** Shipment status shall be synchronized from the courier (XpressBees) via a scheduled poll every 30 minutes (not a real-time webhook), normalizing courier-specific status strings into a canonical set: `booked, picked_up, in_transit, out_for_delivery, delivered, ndr, rto, cancelled`. Unrecognized courier statuses shall be logged and ignored (no state change).
- **FR-10.3** Shipment booking shall occur automatically after payment capture, selecting the cheapest untried courier option per vendor, retrying against the next-cheapest option on failure (up to 5 attempts) before marking `booking_failed`; a separate retry cron re-attempts stuck bookings every 10 minutes.
- **FR-10.4** On a shipment reaching `delivered`, the system shall check for SLA breach against the expected delivery date, send a delivery notification, and credit any pending reward coins for that order.
- **FR-10.5** On a shipment reaching `ndr` (failed delivery attempt), the system shall log the event, mark the shipment NDR-active, increment an NDR counter, and send a high-priority notification. *(No customer-facing NDR resolution action — e.g., reschedule, update address — is currently implemented; see §7.)*
- **FR-10.6** On a shipment reaching `rto` (returned to origin), the system shall restore stock, reverse/refund reward coins used, trigger an automatic refund, and notify the user once.
- **FR-10.7** A pre-purchase courier serviceability check (`POST /v1/logistics/check-serviceability`) shall be available to confirm a pincode is deliverable before checkout completes.
- **FR-10.8** The user (via the app) shall be able to request cancellation of an individual shipment (`POST /v1/logistics/shipment-cancel/:shipmentId`) with ownership verification.

### 3.11 Order History, Cancellation & Invoice
**Screens:** `order/MyOrder.tsx` (list), `OrderConfirmedScreen.tsx` (details), `order/SelectCancellationReason.tsx`.
**API:** `OrderApi.tsx` → `orderController.js` (`/v1/orders/*`).

- **FR-11.1** The order history list shall support filtering by search text, status, and time range, and shall exclude orders still in `pending_payment` status.
- **FR-11.2** The order details view shall include items, per-vendor shipment tracking, and price summary.
- **FR-11.3** "Buy Again" shall list distinct previously purchased variants, sortable by recency/frequency/price.
- **FR-11.4** A user shall be able to request cancellation of an order (`POST /v1/orders/cancel/:orderId`) with a reason (from a fixed reason list) and optional comment, **only** while the order status is `paid` or `processing` and no cancellation has already been requested (`cancellation_status='none'`). This creates a cancellation request and a timeline entry (`cancellation_requested`) and sets `cancellation_status='requested'`; the module does not itself auto-approve, refund, or complete the cancellation (implied to depend on an external/back-office process — see §7).
- **FR-11.5** Cancellation-request status and timeline (including implied downstream states `cancellation_confirmed`, `refund_initiated`, `refund_completed`, `cancellation_rejected`) shall be viewable (`GET /v1/orders/cancellation-details/:orderId`).
- **FR-11.6** An order invoice shall be downloadable as a PDF (single vendor) or ZIP (multi-vendor) via `GET /v1/orders/invoice/:orderId`.
- **FR-11.7** There is no customer-initiated "return a delivered item" capability in this module; the only automated return path is courier-driven RTO prior to successful delivery (§3.10, FR-10.6).

### 3.12 Reviews & Ratings
**Screen:** `ReviewScreen.tsx`.
**API:** `ReviewApi.tsx` → `reviewController.js` (`/v1/review/*`).

- **FR-12.1** A user shall be permitted to review a `(product, variant)` only if they have a **delivered** order line containing that exact variant, and have not already reviewed that combination for that order.
- **FR-12.2** A review shall capture a star rating (1–5, server-validated), three optional sentiment flags (value for money, good quality, smooth experience), free-text, and up to 5 media attachments (image: jpeg/png/webp; video: mp4/mov; max 20 MB each).
- **FR-12.3** On submission, the product's aggregate `avg_rating`/`rating_count` shall be updated incrementally (running average).
- **FR-12.4** Reviews shall be listable per product with summary/breakdown by star rating (1–5), paginated, sortable (`latest`, `helpful`, `rating_high`, `rating_low`), filterable by rating.
- **FR-12.5** A user shall be able to mark a review "helpful" (and un-mark), enforced unique per `(review, user)`, maintaining a running helpful-vote counter.
- **FR-12.6** Reviews carry a moderation `status` field; only `approved` reviews are currently ever produced/read within this module's visible code paths (a broader moderation workflow is implied but not exposed here).

### 3.13 Campaigns & Promotions
**API:** `CampaignAPI.tsx` → `campaignController.js` (`/v1/campaign/*`).

- **FR-13.1** The system shall support merchandising campaigns of types including poster, dashboard poster, and time-boxed flash sale, each with a display order and active/draft status.
- **FR-13.2** A campaign may attach specific `(product, variant)` items with an `offer_price` override and a maximum-quantity cap; the effective price for a campaign item is the offer price if set, otherwise the standard sale price.
- **FR-13.3** There is no generic coupon/promo-code redemption mechanism anywhere in the module; the only price-reduction mechanisms are campaign offer-price overrides and reward-coin redemption (see §7 for the inactive coupon UI).

### 3.14 Reward Wallet
**Screens:** `home/TransactionHistory.tsx` / `Wallet_History.tsx`.
**API:** `WalleteAPI.tsx`.

- **FR-14.1** The user shall be able to view their current wallet balance and any coins nearing expiry.
- **FR-14.2** The user shall be able to view wallet transaction history, filterable by `all`/`credit`/`debit`/`expired`.
- **FR-14.3** Reward coins are earned on delivered orders and may be reserved/redeemed at checkout, reversed on order cancellation/RTO, subject to per-product/category reward-eligibility rules.

### 3.15 Support
**Screens:** `constants/Support/HelpForm.tsx`, `MyTickets.tsx`.
**API:** `SupportApi.tsx`.

- **FR-15.1** A user shall be able to raise a support ticket with a subject, description, and category (from a fetched category list).
- **FR-15.2** A user shall be able to view their own ticket history with normalized status values: `open`, `in_progress`, `closed`, `resolved`.

### 3.16 Profile, Terms & Privacy
**Screens:** `profile/ProfileScreen.tsx`/`Profile.tsx`, `TermsandCondition.tsx`, `PrivacyPolicy.tsx`, `TodoList.tsx`.
**API:** `ProfileApi.tsx`, `TermsConditionAPI.tsx`.

- **FR-16.1** The ecommerce-context profile screen shall show the user's name/avatar (editable), an entry point into order history, address management, a dark-mode toggle, logout, and account deletion.
- **FR-16.2** Terms & Conditions and Privacy Policy content shall be fetchable and acceptance trackable/updatable per user.
- **FR-16.3** A personal to-do/reminder list is bundled into this module's Profile area; it is unrelated to ecommerce transactions and should be treated as a supplementary productivity feature rather than core commerce functionality.

---

## 4. External Interface Requirements

### 4.1 User Interfaces (Screen Inventory)
| Screen | Route (HomeStack) | Purpose |
|---|---|---|
| `homescreen.tsx` | `Home` | Landing/discovery |
| `Explore.tsx` | — | Cross-module launcher |
| `CategoriesScreen.tsx` | `CategoriesScreen` | Category/subcategory browser |
| `ProductCategoriesScreen.tsx` | embedded in Home | Category tabs + infinite product grid |
| `categoryScreen.tsx` | `Category` (via `Categories_Product.tsx`) | Sidebar category browser |
| `ProductScreen.tsx` | "See all" targets | Generic paginated product collection viewer |
| `product_description_screen.tsx` | `ProductDescription` | Product details |
| `SearchScreen.tsx` | `SearchScreen` | Search + suggestions + history |
| `WishlistScreen.tsx` | `WishList` | Wishlist |
| `cartScreen.tsx` | `Cart` | Cart (address-gated view) |
| `ItemCardAddress/*` | `AddressSelect`, `AddressDetails`, `AddAddressMap` | Address management |
| `OrderStepUI.tsx` | checkout step within `Cart`/`BuyNow` flow | Checkout + payment |
| `OrderConfirmedScreen.tsx` | `OrderConfirmedScreen` | Order confirmation + details/tracking |
| `order/MyOrder.tsx` | `MyOrder` | Order history list |
| `order/SelectCancellationReason.tsx` | `SelectCancellationReason` | Cancellation flow |
| `ReviewScreen.tsx` | `ReviewScreen` | Write a review |
| `product_section/BuyAgain.tsx` | `BuyNow` | Reorder past purchases |
| `profile/*` | `Profile`, `TermsAndConditions`, `PrivacyPolicy`, `TodoList` | Account & policy screens |
| `Support/HelpForm.tsx`, `MyTickets.tsx` | `HelpForm`, `MyTickets` | Support tickets |

### 4.2 API Interfaces (Backend Endpoint Summary)
All paths are prefixed `/v1` (mounted in `src/server/app.js`). Full detail per module is in §3; summary by router:

| Router | Base path | Auth |
|---|---|---|
| `productRoute.js` | `/v1/product/*` | `optionalAuth` (read-only) |
| `cartRoute.js` | `/v1/cart/*` | `auth` (except stock check) |
| `checkoutRoute.js` | `/v1/checkout/*` | `auth` + rate limit + drain-mode gate |
| `ordersRoute.js` | `/v1/orders/*` | `auth` (except cancellation-reasons lookup) |
| `wishlistRoute.js` | `/v1/wishlist/*` | `auth` |
| `logisticsRoute.js` | `/v1/logistics/*` | `auth` + rate limit |
| `reviewRoute.js` | `/v1/review/*` | `auth` for writes, `optionalAuth` for reads |
| `paymentRoute.js` | `/v1/payment/*` | `auth` + rate limit + drain-mode gate |
| `campaignRoute.js` | `/v1/campaign/*` | `optionalAuth` |

### 4.3 Hardware Interfaces
- Camera/photo gallery access for review media attachments and profile avatar upload.
- Device GPS/map interaction for address pin entry (`AddAddressMapScreen.tsx`).

### 4.4 Software Interfaces
| System | Purpose |
|---|---|
| Razorpay | Payment order creation, Checkout SDK, signature verification, webhook-driven capture/failure/refund |
| XpressBees | Courier serviceability check, shipment booking, tracking polling, shipment cancellation |
| MySQL | Primary transactional datastore |
| WhatsApp/Email notification services | Order confirmation, delivery, and NDR notifications |

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **NFR-1** Home-screen sections and promotional rails load independently/lazily (viewability-based mounting) rather than blocking on a single monolithic request.
- **NFR-2** Promotional product-list endpoints are client-cached for 5 minutes; fixed page size of 10 items.
- **NFR-3** Payment-status confirmation polling is capped at 10 attempts / 2-second interval to bound client-side wait time.
- **NFR-4** Shipment tracking freshness is bounded by a 30-minute polling cycle; this is an accepted latency trade-off, not a defect.

### 5.2 Security
- **NFR-5** All state-changing endpoints require JWT bearer authentication; inactive accounts (`status != 1`) are rejected even with a valid token.
- **NFR-6** Payment signatures are verified via HMAC-SHA256; authoritative payment state changes occur only through the verified Razorpay webhook, not client-submitted verification calls, to prevent client-side spoofing of payment success.
- **NFR-7** Server-computed order totals are re-validated against client-declared totals (₹0.50 tolerance) before order creation, preventing price tampering.
- **NFR-8** Rate limiting is enforced per user (or IP) on checkout (20/10 min), payment (10/10 min), and general read endpoints (100/15 min) to mitigate abuse.
- **NFR-9** File uploads (review media) are restricted by MIME type and size (20 MB/file, max 5 files).

### 5.3 Reliability & Data Integrity
- **NFR-10** Stock decrement and wallet-coin reservation occur within a single DB transaction using row-level locks (`FOR UPDATE`), with explicit conflict errors (`STOCK_RACE_CONDITION`, `WALLET_BALANCE_CHANGED`) rather than silent overselling/overspending.
- **NFR-11** Payment webhook processing is idempotent against duplicate delivery (guards against double-crediting an order on a repeated `payment.captured` event).
- **NFR-12** Order reference generation retries up to 3 times on collision.
- **NFR-13** A global maintenance "drain mode" can suspend new checkout/payment-creation requests (HTTP 503) without affecting read traffic, to support safe deploys/maintenance windows.
- **NFR-14** Stuck shipment bookings are retried automatically (10-minute cron, up to 5 attempts, with stale-lock release after 15 minutes); stuck cancellation syncs retried every 15 minutes up to 8 attempts.

### 5.4 Availability / Degradation
- **NFR-15** Several client API wrappers (e.g., address list, checkout preview) degrade gracefully on error (empty list / handled "cart empty" state) rather than crashing the screen.

---

## 6. State Models

### 6.1 Order Status (`eorders.status`)
```
pending_payment --(payment capture webhook)--> paid --(all shipments booked)--> processing
   |                                                                                 |
   |--(expiry / user-cancels-pending)--> cancelled                                  |--(courier progression)--> shipped / partially_shipped --> delivered
                                                                                     |--(courier failure path)--> delivery_failed (NDR) / rto
```
- `pending_payment`: order created, awaiting payment; expires after 15 minutes if unpaid.
- `paid`: payment captured (set only by the Razorpay webhook).
- `processing`: shipment(s) booked with the courier.
- `shipped` / `partially_shipped`: courier has picked up all / some vendor shipments.
- `delivered`: all shipments delivered.
- `delivery_failed`: NDR condition on one or more shipments.
- `rto`: shipment returned to origin after failed delivery.
- `cancelled`: only reachable from `pending_payment` (payment never completed).

### 6.2 Shipment Status (`order_shipments.shipping_status`)
```
awaiting_payment -> pending -> booking_in_progress -> booked | booking_failed
booked -> picked_up -> in_transit -> out_for_delivery -> delivered
                                                        \-> ndr -> rto
(any pre-delivery stage) -> cancelled
```

### 6.3 Payment Status (`order_payments.status`)
```
pending -> created -> success | failed | expired
success -> refunded | partially_refunded
```

### 6.4 Cancellation Status (`eorders.cancellation_status`)
```
none -> requested -> (confirmed | rejected)   [confirmed/rejected inferred from timeline labels; not written by this module — see §7]
requested (confirmed path) -> refund_initiated -> refund_completed
```
Cancellation is only requestable while order status is `paid` or `processing`.

### 6.5 Refund Status (`order_refunds.status`)
```
initiated -> completed | failed
```
`refund_method`: `original` (back to payment source) or `wallet` (reward coins).

---

## 7. Known Gaps, Dead Code & Technical Debt

These are observations from the current codebase relevant to future requirements/cleanup decisions — not proposed requirements:

1. **Coupon/promo-code UI is non-functional.** `constants/coupan/CouponsPage.tsx` renders hardcoded coupon data with a non-wired "Apply" button; there is no backend coupon-redemption endpoint. The real cart/checkout screens only reference it in commented-out code. Discounting is exclusively via reward-coin redemption and campaign offer-price overrides.
2. **Duplicate/orphaned Payment screens.** `screens/PaymentScreen.tsx` and `PaymentScreen copy.tsx` are byte-identical, unrouted demo screens with a hardcoded order ID; the real payment flow lives entirely in `components/checkout/OrderStepUI.tsx`.
3. **Duplicate Payment API file.** `api/Payment.tsx` and `api/Payment copy.tsx` are identical duplicates.
4. **Orphaned invoice mock screen.** `components/invoice/DownloadInvoice.tsx` renders fully hardcoded invoice data and is not wired to real order data; the functioning invoice download path is `OrderApi.fetchOrderInvoice`.
5. **Orphaned product adapter.** `adapters/productAdapter.tsx` appears superseded by `utils/normalizeProduct.ts`, which is the actually-used normalizer across the app.
6. **NDR resolution is not customer-facing.** A validator (`validateResolveNDR`) exists for actions (`retry`, `address_update`, `cancel`, `rto`) but no route/controller wires it up — a failed-delivery-attempt cannot currently be resolved by the customer through the app.
7. **No customer-initiated return for delivered items.** Only pre-delivery RTO (courier-driven) is automated; there is no "return a delivered order" endpoint.
8. **Cancellation approval is external to this module.** `POST /orders/cancel/:orderId` only records a request (`cancellation_status='requested'`); no code path in this module advances it to `confirmed`/`refund_initiated`/`refund_completed`/`rejected` — this is presumably completed by an admin/back-office system not included in this module.
9. **Refund endpoint disabled.** `/v1/payment/refund` is commented out in the route file; refunds are only triggered internally (webhook mismatch, duplicate capture, RTO) via `EcommerceRefundService`, not directly user-invocable.
10. **Two overlapping Profile screens.** `profile/ProfileScreen.tsx` and `profile/Profile.tsx` appear to be alternate/overlapping implementations rather than a single canonical screen.
11. **Stray backend copy inside the mobile repo.** `src/modules/ecommerce/v1/**` duplicates backend-style logic but is not the code actually mounted/executed (`src/server/app/ecommerce/v1` is authoritative per `src/server/app.js`). Worth removing or clearly marking to avoid confusion during future development.
12. **Legacy dead code path in refund controller.** `paymentController.processRefund`'s old inline logic is retained but unreachable after an early `return` to the new refund service.

---

## 8. Appendix — Full Backend Endpoint List

| Method | Path | Auth | Controller.function |
|---|---|---|---|
| GET | `/v1/product/all-products` | optional | productController.getAllProducts |
| GET | `/v1/product/by-category/:categoryId` | optional | productController (category listing) |
| GET | `/v1/product/product-details/:productId` | optional | productController (details + recently_viewed log) |
| GET | `/v1/product/by-subcategory/:subcategoryId` | optional | productController |
| GET | `/v1/product/categories` | optional | productController |
| GET | `/v1/product/subcategories/:categoryId` | optional | productController |
| GET | `/v1/product/categories-with-subcategories` | optional | productController |
| GET | `/v1/product/similar/:productId` | optional | productController |
| GET | `/v1/product/recent-products` | optional | productController |
| GET | `/v1/product/recommendations` | auth | productController |
| GET | `/v1/product/new-arrivals` | optional | productController |
| GET | `/v1/product/:productId/customers-also-bought` | optional | productController |
| GET | `/v1/product/trending` | optional | productController |
| GET | `/v1/product/best-sellers` | optional | productController |
| GET | `/v1/product/most-viewed` | optional | productController |
| GET | `/v1/product/top-rated` | optional | productController |
| GET | `/v1/product/search/suggestions` | optional | productController |
| GET | `/v1/product/search/products` | optional | productController |
| POST | `/v1/product/search/history` | optional | productController |
| GET | `/v1/product/search/history` | optional | productController |
| DELETE | `/v1/product/search/history` | optional | productController |
| GET | `/v1/cart/cart-items` | auth | cartController.getCart |
| GET | `/v1/cart/cart-summary` | auth | cartController.getCartSummary |
| POST | `/v1/cart/cart-item` | auth | cartController.addToCart |
| GET | `/v1/cart/cart-items/check-stock/:variantId` | none | cartController.checkStock |
| PUT | `/v1/cart/cart-items/:cart_item_id` | auth | cartController.updateCartItem |
| DELETE | `/v1/cart/cart-items/:cart_item_id` | auth | cartController.deleteCartItem |
| DELETE | `/v1/cart/cart-items` | auth | cartController.clearCart |
| GET | `/v1/checkout/get-cart` | auth | checkoutController.getCheckoutCart |
| GET | `/v1/checkout/get-buy-now` | auth | checkoutController.getBuyNowCheckout |
| POST | `/v1/checkout/cart` | auth + limiter + drain-mode | checkoutController.checkoutCart |
| POST | `/v1/checkout/buy-now` | auth + limiter + drain-mode | checkoutController.buyNow |
| GET | `/v1/checkout/order-receipt/:orderId` | auth | checkoutController.getOrderReceipt |
| GET | `/v1/orders/orders-history` | auth | orderController.getOrderHistory |
| GET | `/v1/orders/order-details/:orderId` | auth | orderController.getOrderDetails |
| GET | `/v1/orders/buy-again` | auth | orderController.getBuyAgainProducts |
| GET | `/v1/orders/cancellation-reasons` | none | orderController.getCancellationReasons |
| POST | `/v1/orders/cancel/:orderId` | auth | orderController.requestOrderCancellation |
| GET | `/v1/orders/cancellation-details/:orderId` | auth | orderController.cancellationDetails |
| GET | `/v1/orders/invoice/:orderId` | auth | orderController.getInvoice |
| POST | `/v1/wishlist/add-wishlist` | auth | wishListController |
| DELETE | `/v1/wishlist/remove/:product_id/:variant_id` | auth | wishListController |
| GET | `/v1/wishlist/get-wishlist` | auth | wishListController |
| GET | `/v1/wishlist/check/:product_id/:variant_id` | auth | wishListController |
| POST | `/v1/wishlist/move-to-cart` | auth | wishListController |
| GET | `/v1/wishlist/badge` | auth | wishListController |
| POST | `/v1/logistics/check-serviceability` | auth + limiter | logisticsController.checkServiceAbility |
| GET | `/v1/logistics/track-status/:orderId` | auth + limiter | logisticsController.getTracking |
| POST | `/v1/logistics/shipment-cancel/:shipmentId` | auth + limiter | logisticsController.cancelShipmentHandler |
| GET | `/v1/review/reviewable-order/:variant_id` | auth | reviewController |
| POST | `/v1/review/create-review` | auth + upload | reviewController |
| GET | `/v1/review/all-reviews/:product_id` | optional | reviewController |
| POST | `/v1/review/:reviewId/helpful` | auth | reviewController |
| DELETE | `/v1/review/:reviewId/helpful` | auth | reviewController |
| POST | `/v1/payment/create-order` | auth + limiter + drain-mode | paymentController.createOrder |
| POST | `/v1/payment/verify-payment` | auth + limiter | paymentController.verifyPayment |
| GET | `/v1/payment/payment-status/:orderId` | auth | paymentController.paymentStatus |
| POST | `/v1/payment/cancel-order/:orderId` | auth + limiter | paymentController.cancelPendingOrder |
| GET | `/v1/campaign/home` | optional | campaignController.getHomeCampaigns |
| GET | `/v1/campaign/list` | optional | campaignController.getUserCampaigns |
| GET | `/v1/campaign/details/:id` | optional | campaignController.getUserCampaignById |
| GET | `/v1/campaign/:id/products` | optional | campaignController.getCampaignProducts |

---

*End of document.*
