# RP Personal Loan

Personal-loan-only React Native module based on the supplied Vivifi journey and Regal Plum & Lavender reference. Open **Dashboard > Explore Services > View all > Personal Loan**.

## Design

Primary plum `#4C2D56`, lavender `#D3B8E5`, soft ivory surfaces, restrained gradients, thin borders and compact cards. The existing app theme preference is respected, including dark plum surfaces with lavender accents. Shared controls, status screens, PDF exports and the Explore entry use the same palette.

## Screen journey

Every module entry follows **Welcome → Enter Mobile Number → Verify OTP**, including users already signed into the main app. Get Started always opens mobile entry; Send OTP validates a 10-digit Indian number; the six OTP inputs support typing, paste, backspace, edit-number, a 30-second resend cooldown and two-minute expiry. Successful verification opens documents (or the existing loan dashboard within the current preview session).

Onboarding uses a dedicated responsive layout, the existing Reward Planners logo/wordmark, React Native MaterialIcons, and a bundled transparent 3D plum/lavender loan illustration at `assets/personal-loan-welcome.png`. The illustration was generated with the imagegen skill and copied into the module; it does not depend on a remote image URL. Terms and privacy links open readable preview information sheets. These screens do not send real SMS.

After onboarding, the application has five stages:

1. **Documents:** add PAN, masked Aadhaar, salary slip and bank statement. Pick PDF/JPG/PNG up to 10 MB, take a photo, replace files or use samples. The flow follows **Upload Documents → Verification in Progress → Details Fetched Successfully → Editable Details**. A sequential checklist automatically opens the dedicated results screen, which shows name, PAN, employment, monthly income and company. Verification completion is required before results appear. A matching bundled 3D document illustration, Material icons and plum/lavender surfaces tie these screens to onboarding. The file/camera sheet waits for native dismissal before opening a picker on Apple devices.
2. **Details:** follow **Personal Information → Employment & Income → Select Loan Amount**. Personal information shows full name, date of birth, PAN, current address and permanent address on one screen. “Same as current address” displays the linked address and saves it when continuing; otherwise a separate permanent address is required. Employment shows a fixed salaried type, employer, monthly income, optional designation and optional years of experience. Each screen validates its own fields and preserves edits when going back. Plum/lavender illustrations and Material icons match the onboarding screens; the employment illustration is bundled at `assets/loan-employment.png`.
3. **Offer review:** **Select Loan Amount → Your Loan Eligibility → Loan Summary → Repayment Schedule → Agreement**. Selection and eligibility share the same controls and selected terms, so users can fine-tune the amount and tenure. Summary shows EMI, interest, upfront fee, net disbursal and total repayment. The dedicated schedule has a principal/interest chart, month labels, totals and an expandable instalment breakdown. Active-loan schedules return to the dashboard.
4. **Agreement and e-sign:** view and download the sample agreement, acknowledge both consent boxes, then verify the six-digit preview OTP. E-sign cannot bypass agreement consent. Changing the amount or tenure clears acknowledgements, signing and bank authorisation for the old offer. The agreement artwork is bundled at `assets/loan-agreement.png`.
5. **Bank setup:** **Set Up Repayment Mandate → Verify Mandate with OTP → Mandate Setup Successful → Disbursement**. Review the sample account, monthly debit and consent before OTP. The success screen requires both signing and an active sample mandate. Bank artwork is bundled at `assets/loan-bank.png`.

Disbursement has processing, success, failed and pending states, with retry/status/support actions. The processing preview only advances after signing and mandate setup; displayed net credit deducts the upfront fee.

The redesigned dashboard shows outstanding principal, repayment progress, paid amount, next EMI and documents. Payment methods are UPI, net banking and debit card; the existing auto-debit mandate is explained separately. Payment success updates progress once, even after repeated taps; failed payments preserve the balance. Receipts require a recorded payment. After disbursement and the final repayment, the sample mandate is cancelled and the closure screen makes the sample NOC available. Closure artwork is bundled at `assets/loan-closure.png`.

All later screens use `LoanFlowUI` with the same branded layout, plum/lavender cards, gradient primary actions, Material icons and preview notes as onboarding.

Failure, pending and retry states are available under collapsed **Preview options**. Agreement, statement, receipt and NOC PDFs open the native share/save sheet and are clearly marked as samples.

## Preview boundary

This implements screens and interactions, not a live lender integration. Every screen carries a sample-journey note. OTP: **123456**, with a two-minute expiry and 30-second resend timer. Verification, eligibility, bank account, signing, mandate, transfers, repayments and closure are simulated. Use sample documents and details when reviewing. Selected files are not uploaded or read by OCR.

State stays in module memory and resets when the navigator unmounts. No identity details or documents are persisted to AsyncStorage. Sample PDFs exclude PAN and address; exports are written to app storage and may be saved/shared by the user.

Calculations use the brief's illustrative 12% annual reducing-balance interest and 2% upfront fee. For INR 1,00,000 over 12 months, EMI is approximately INR 8,884.88. Taxes, APR, extra charges, confirmed dates and underwriting must come from the lender. Net disbursal deducts the sample processing fee.

Live integration needs authenticated upload/OCR and verification endpoints, lender-confirmed eligibility and quotes, complete agreements and Key Fact Statements, e-sign and bank authorisation, transfer/payment reconciliation and idempotency, secure draft recovery and official lender documents. Confirm mandate activation before disbursement and payment settlement before changing balances.

## Validation

`npx jest __tests__/loanMath.test.ts __tests__/loanJourney.test.tsx --runInBand` covers calculations, date validation, consent, mandate ordering, payment safety, NOC availability, separate personal/employment validation, address synchronisation, amount limits, tenure changes and the review flow. Native picker, camera, PDF sharing and visual layout require device verification. Android uses external camera capture; a camera usage description is included for Apple devices.
