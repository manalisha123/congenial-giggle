# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cedar-promotion.spec.ts >> release build - promotion >> REST10 on King x3 discounts 10% and persists to checkout
- Location: tests\cedar-promotion.spec.ts:20:9

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('#checkout').getByTestId('total')
Expected: "AED 2430.00"
Received: "AED 2700.00"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" locator('#checkout').getByTestId('total') with timeout 5000ms
  - waiting for locator('#checkout').getByTestId('total')
    14 × locator resolved to <span data-testid="total">AED 2700.00</span>
       - unexpected value "AED 2700.00"

```

```yaml
- text: AED 2700.00
```

# Test source

```ts
  1   | import { test, expect } from '../fixtures/cedar';
  2   | import { Build, Size } from '../pages/ProductPage';
  3   | 
  4   | const PRICE = 900;
  5   | const money = (n: number) => `AED ${n.toFixed(2)}`;
  6   | 
  7   | const builds: Build[] = ['reference', 'release'];
  8   | const sizes: Size[] = ['Queen', 'King'];
  9   | const quantities = [1, 2, 3];
  10  | 
  11  | for (const build of builds) {
  12  |   test.describe(`${build} build - promotion`, () => {
  13  |     test.use({ build, viewport: { width: 402, height: 600 } });
  14  | 
  15  |     for (const size of sizes) {
  16  |       for (const quantity of quantities) {
  17  |         const full = PRICE * quantity;
  18  |         const discounted = full * 0.9;
  19  | 
  20  |         test(`REST10 on ${size} x${quantity} discounts 10% and persists to checkout`, async ({ productPage }) => {
  21  |           const cart = await productPage.addToCart(size, quantity);
  22  |           await expect(cart.root).toBeVisible();
  23  |           await expect(cart.summary.item).toHaveText(`Cedar mattress - ${size}`);
  24  |           await expect(cart.summary.quantity).toHaveText(String(quantity));
  25  |           await expect(cart.summary.total).toHaveText(money(full));
  26  | 
  27  |           await cart.applyPromoCode('REST10');
  28  |           await expect(cart.promoStatus).toHaveText('Code applied');
  29  |           await expect(cart.summary.total).toHaveText(money(discounted));
  30  |           await expect(cart.summary.gift).toHaveText(money(0));
  31  | 
  32  |           const checkout = await cart.continueToCheckout();
  33  |           await expect(checkout.root).toBeVisible();
  34  |           await expect(checkout.summary.item).toHaveText(`Cedar mattress - ${size}`);
  35  |           await expect(checkout.summary.quantity).toHaveText(String(quantity));
  36  |           await expect(checkout.summary.gift).toHaveText(money(0));
> 37  |           await expect(checkout.summary.total).toHaveText(money(discounted));
      |                                                ^ Error: expect(locator).toHaveText(expected) failed
  38  |         });
  39  |       }
  40  |     }
  41  | 
  42  |     test('REST10 on a single mattress takes exactly AED 90 off, giving AED 810', async ({ productPage }) => {
  43  |       const cart = await productPage.addToCart('Queen', 1);
  44  |       const parse = async () => Number((await cart.summary.total.textContent())!.replace(/[^\d.]/g, ''));
  45  | 
  46  |       const before = await parse();
  47  |       await cart.applyPromoCode('REST10');
  48  |       await expect(cart.promoStatus).toHaveText('Code applied');
  49  |       await expect(cart.summary.total).toHaveText(money(810));
  50  |       const after = await parse();
  51  | 
  52  |       expect(before - after).toBe(90);
  53  |     });
  54  | 
  55  |     test('invalid code leaves the total unchanged', async ({ productPage }) => {
  56  |       const cart = await productPage.addToCart('Queen', 1);
  57  |       await cart.applyPromoCode('NOTACODE');
  58  |       await expect(cart.promoStatus).toHaveText('Code not recognized');
  59  |       await expect(cart.summary.total).toHaveText(money(PRICE));
  60  |     });
  61  | 
  62  |     test('promo code is case-insensitive and ignores surrounding spaces', async ({ productPage }) => {
  63  |       const cart = await productPage.addToCart('King', 1);
  64  |       await cart.applyPromoCode('  rest10 ');
  65  |       await expect(cart.promoStatus).toHaveText('Code applied');
  66  |       await expect(cart.summary.total).toHaveText(money(PRICE * 0.9));
  67  |     });
  68  | 
  69  |     test('invalid code after REST10 removes the discount', async ({ productPage }) => {
  70  |       const cart = await productPage.addToCart('Queen', 1);
  71  |       await cart.applyPromoCode('REST10');
  72  |       await cart.applyPromoCode('WRONG');
  73  |       await expect(cart.summary.total).toHaveText(money(PRICE));
  74  |     });
  75  | 
  76  |     test('checkout without a code keeps the full price', async ({ productPage }) => {
  77  |       const cart = await productPage.addToCart('King', 2);
  78  |       const checkout = await cart.continueToCheckout();
  79  |       await expect(checkout.summary.total).toHaveText(money(PRICE * 2));
  80  |     });
  81  | 
  82  |     test('empty promo code is rejected and does not discount', async ({ productPage }) => {
  83  |       const cart = await productPage.addToCart('Queen', 1);
  84  |       await cart.applyPromoCode('');
  85  |       await expect(cart.promoStatus).toHaveText('Code not recognized');
  86  |       await expect(cart.summary.total).toHaveText(money(PRICE));
  87  |     });
  88  | 
  89  |     test('applying REST10 twice does not stack the discount', async ({ productPage }) => {
  90  |       const cart = await productPage.addToCart('King', 1);
  91  |       await cart.applyPromoCode('REST10');
  92  |       await cart.applyPromoCode('REST10');
  93  |       await expect(cart.summary.total).toHaveText(money(PRICE * 0.9));
  94  |     });
  95  | 
  96  |     for (const code of ['REST1', 'REST100', 'REST 10', 'REST10X']) {
  97  |       test(`near-miss code "${code}" is not accepted`, async ({ productPage }) => {
  98  |         const cart = await productPage.addToCart('Queen', 1);
  99  |         await cart.applyPromoCode(code);
  100 |         await expect(cart.promoStatus).toHaveText('Code not recognized');
  101 |         await expect(cart.summary.total).toHaveText(money(PRICE));
  102 |       });
  103 |     }
  104 | 
  105 |     test('quantity above the maximum is capped at 3 before REST10 applies', async ({ productPage }) => {
  106 |       const cart = await productPage.addToCart('Queen', 5);
  107 |       await expect(cart.summary.quantity).toHaveText('3');
  108 |       await cart.applyPromoCode('REST10');
  109 |       await expect(cart.summary.total).toHaveText(money(PRICE * 3 * 0.9));
  110 |     });
  111 | 
  112 |     for (const invalid of ['0', '-2', '']) {
  113 |       test(`invalid quantity "${invalid}" is corrected to 1`, async ({ productPage }) => {
  114 |         const cart = await productPage.addToCart('Queen', invalid);
  115 |         await expect(cart.summary.quantity).toHaveText('1');
  116 |         await expect(cart.summary.total).toHaveText(money(PRICE));
  117 |       });
  118 |     }
  119 | 
  120 |     test('fractional quantity is not accepted as a partial mattress', async ({ productPage }) => {
  121 |       const cart = await productPage.addToCart('Queen', '1.5');
  122 |       await expect(cart.summary.quantity).toHaveText(/^\d+$/);
  123 |       await expect(cart.summary.total).not.toHaveText(money(PRICE * 1.5));
  124 |     });
  125 | 
  126 |     for (const code of ['<script>alert(1)</script>', "' OR 1=1 --", 'rest11', 'R'.repeat(500)]) {
  127 |       test(`unsafe or unknown code "${code.slice(0, 20)}" is rejected without discount`, async ({ productPage, page }) => {
  128 |         const cart = await productPage.addToCart('Queen', 1);
  129 |         await cart.applyPromoCode(code);
  130 |         await expect(cart.promoStatus).toHaveText('Code not recognized');
  131 |         await expect(cart.summary.total).toHaveText(money(PRICE));
  132 |         await expect(page.locator('#cart script')).toHaveCount(0);
  133 |       });
  134 |     }
  135 | 
  136 |     test('invalid code then checkout keeps the full price at checkout', async ({ productPage }) => {
  137 |       const cart = await productPage.addToCart('Queen', 2);
```