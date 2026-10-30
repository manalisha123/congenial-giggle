# 🛏️ Cedar Promotion Tests

Playwright tests for the Cedar store **promotion** risk. Every test runs against both builds in Chromium at 402 × 600:

| Build | Role |
|-------|------|
| `reference` | Comparison baseline |
| `release` | Proposed change |

**Rule under test:** REST10 takes 10% off the mattress (AED 900 for Queen or King), the pillow gift stays AED 0, and the accepted total must carry into checkout.

> 🚦 **Verdict: do not ship the release.** Checkout drops the REST10 discount. See [Release risk](#-release-risk).

---

## 📊 At a glance

| | Reference | Release |
|---|:---:|:---:|
| Tests | 28 | 28 |
| Passed | 27 | 21 |
| Failed | 1 | 7 |

Total: **56 tests, 48 passed, 8 failed.**

---

## 🗂️ Project structure (Page Object Model)

```
pages/
├── ProductPage.ts    size, quantity, offer text, Add to cart  →  CartPage
├── CartPage.ts       promo code, status, checkout button      →  CheckoutPage
└── CheckoutPage.ts   checkout section + shared OrderSummary
fixtures/
└── cedar.ts          `build` option and `productPage` fixture
tests/
└── cedar-promotion.spec.ts   behaviour and assertions only
```

- Selectors live **only** in `pages/`.
- Tests pick the build with `test.use({ build })` and keep their assertions in the spec.

---

## ▶️ Run

```bash
npm start                                        # terminal 1 - serves http://127.0.0.1:4173
npx playwright test --project=chromium           # terminal 2
```

- Set `CEDAR_ORIGIN` to use a different host or port.
- Tests run headed (`headless: false` in `playwright.config.ts`).

---

## ✅ Coverage (per build)

### Happy path

| Test | Checks |
|------|--------|
| REST10 on Queen / King × 1, 2, 3 *(6 tests)* | Cart total before code, 10% discount, gift AED 0, and size, quantity and discounted total persist into checkout |
| REST10 on one mattress | Exactly AED 90 off (AED 900 → AED 810) |
| Case-insensitive code | `  rest10 ` is accepted |

### Negative: promo codes

| Test | Checks |
|------|--------|
| Invalid code | "Code not recognized"; total unchanged |
| Empty code | Rejected; total unchanged |
| Near-miss codes (`REST1`, `REST100`, `REST 10`, `REST10X`) | Each rejected; total unchanged |
| Unsafe or unknown codes (`<script>`, SQL-style, `rest11`, 500 characters) | Rejected; no discount; nothing injected |
| REST10 applied twice | Discount does not stack |
| Invalid code after REST10 | Discount is removed |

### Negative: quantity and flow

| Test | Checks |
|------|--------|
| Quantity above maximum | 5 is capped at 3; REST10 gives AED 2,430.00 |
| Invalid quantity (`0`, `-2`, blank) | Corrected to 1 |
| Fractional quantity (`1.5`) | Must not be priced as a partial mattress |
| Checkout without a code | Full price kept |
| Invalid code then checkout | Full price kept at checkout |
| Reload | Cart resets |

---

## ❌ Current results (Chromium)

| # | Where | Failures | Issue |
|---|-------|:--------:|-------|
| 1 | Release only | 6 | Checkout drops the REST10 discount |
| 2 | Both builds | 2 | Fractional quantity is accepted |

### 1. Release: checkout drops the REST10 discount

Affects Queen and King at quantity 1, 2 and 3. The cart shows the discount, but checkout charges full price.

| Case | Expected at checkout | Release shows |
|------|---------------------:|--------------:|
| Queen × 1 | AED 810.00 | AED 900.00 |
| King × 3 | AED 2,430.00 | AED 2,700.00 |

**Cause.** In `timed-case/builds/release.html`, `lines()` ignores the discount for checkout when a promo is active:

```js
const amount = checkout && state.promo ? state.quantity * 900 : total();
```

The reference uses `total()` in all cases. The line does not depend on size, so both sizes are affected.

### 2. Both builds: fractional quantity accepted

Entering `1.5` is clamped to the 1–3 range but not rounded, so a partial mattress is priced (AED 1,350.00). This also happens on the reference, so it is an existing issue, not a regression from this release. If the product treats it as acceptable, drop this test.

---

## 🚨 Release risk

> **Recommendation: do not ship the release until checkout uses the discounted total.**

| | |
|---|---|
| **Impact** | A customer sees AED 810.00 in the cart after REST10 but is charged AED 900.00 at checkout, for every quantity and both sizes. A pricing defect reaches the final amount. |
| **Why automated first** | The release changes promotional calculations, and one of the previous two releases had an escaped pricing issue. A shown price that differs from the charged price is also hard to spot by eye. |
| **Priority basis** | Release scope and escape history only. No traffic or loss figures were supplied, so none are claimed. |
| **Evidence** | The 6 failing REST10 tests on `release`. The `reference` passes the same tests, so this is a regression. |
| **Fix** | In `lines()` of `release.html`, use `total()` for checkout, as the reference does. |

---

## 🔗 Related

The timed-case runner check (`npm run check -- promotion`) is separate and lives in `timed-case/submission/Artifact/check.cjs`.
