# BBPS client readiness review — 2026-10-06

Scope: mobile prepaid, mobile postpaid, electricity, and FASTag. Credit-card integration is excluded. Shared screen fixes also benefit other billers.

## Changes

- Restrict automatic transport retries to read-only HTTP methods. A timed-out create-order or payment-verification POST must not be silently replayed.
- Require positive, well-formed amounts and a transaction ID before opening checkout. Razorpay order amounts must be integer paise.
- Replace the checkout screen with transaction status so Back cannot reopen the same checkout. Provide a home action while a transaction remains pending.
- Stop using utility account numbers as checkout contact numbers.
- Add timeouts to raw BBPS requests, including catalog, field lookup, plans, bill fetch, and history.
- Prevent duplicate bill-fetch taps and preserve typed fields when the same operator's metadata refreshes.
- Normalize numeric/string bill-fetch flags and prevent non-prepaid billers from being routed to mobile recharge plans.
- Repair the recharge shortcut: select a biller before loading plans, retaining the entered number and circle.
- Ignore obsolete plan-fetch errors and prevent plan selection during loading.
- Remove authentication headers and request/response bodies from the shared API diagnostic logger; remove payment-signature logging. Restrict the recharge technical-error share action to development builds.

## Verification and release limits

12 focused checkout/retry guard tests pass. All 32 BBPS TypeScript files pass Babel compilation. The project TypeScript check (`tsc --noEmit`) passes. No live payment or refund was initiated during this review.

This review is not an end-to-end production approval. Before release, use authorized test accounts to check:

| Flow | Required device checks |
| --- | --- |
| Prepaid | Correct operator/circle, plan selection, changed/expired plans, successful recharge |
| Postpaid | Successful bill fetch and payment, no bill due, provider rejection (including Airtel Black) |
| Electricity | Provider-specific account fields, bill dates/amount, additional fields, successful payment |
| FASTag | Vehicle/account format, bill fetch, valid recharge amount, provider rejection |
| Every payment flow | Double taps, checkout cancellation, network loss before/after capture, app closure, reopening order history, pending/refund states, Android and iOS back navigation |

Backend idempotency, authoritative amount validation, webhook reconciliation, and provider availability remain server-side responsibilities. A client review cannot establish that those work in production. Provider schemas requiring list selection or additional field formats need biller-specific device testing; this review does not certify every operator returned by EKO.
