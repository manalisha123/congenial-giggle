import { test, expect } from '../fixtures/cedar';
import { Build, Size } from '../pages/ProductPage';

const PRICE = 900;
const money = (n: number) => `AED ${n.toFixed(2)}`;

const builds: Build[] = ['reference', 'release'];
const sizes: Size[] = ['Queen', 'King'];
const quantities = [1, 2, 3];

for (const build of builds) {
  test.describe(`${build} build - promotion`, () => {
    test.use({ build, viewport: { width: 402, height: 600 } });

    for (const size of sizes) {
      for (const quantity of quantities) {
        const full = PRICE * quantity;
        const discounted = full * 0.9;

        test(`REST10 on ${size} x${quantity} discounts 10% and persists to checkout`, async ({ productPage }) => {
          const cart = await productPage.addToCart(size, quantity);
          await expect(cart.root).toBeVisible();
          await expect(cart.summary.item).toHaveText(`Cedar mattress - ${size}`);
          await expect(cart.summary.quantity).toHaveText(String(quantity));
          await expect(cart.summary.total).toHaveText(money(full));

          await cart.applyPromoCode('REST10');
          await expect(cart.promoStatus).toHaveText('Code applied');
          await expect(cart.summary.total).toHaveText(money(discounted));
          await expect(cart.summary.gift).toHaveText(money(0));

          const checkout = await cart.continueToCheckout();
          await expect(checkout.root).toBeVisible();
          await expect(checkout.summary.item).toHaveText(`Cedar mattress - ${size}`);
          await expect(checkout.summary.quantity).toHaveText(String(quantity));
          await expect(checkout.summary.gift).toHaveText(money(0));
          await expect(checkout.summary.total).toHaveText(money(discounted));
        });
      }
    }

    test('REST10 on a single mattress takes exactly AED 90 off, giving AED 810', async ({ productPage }) => {
      const cart = await productPage.addToCart('Queen', 1);
      const parse = async () => Number((await cart.summary.total.textContent())!.replace(/[^\d.]/g, ''));

      const before = await parse();
      await cart.applyPromoCode('REST10');
      await expect(cart.promoStatus).toHaveText('Code applied');
      await expect(cart.summary.total).toHaveText(money(810));
      const after = await parse();

      expect(before - after).toBe(90);
    });

    test('invalid code leaves the total unchanged', async ({ productPage }) => {
      const cart = await productPage.addToCart('Queen', 1);
      await cart.applyPromoCode('NOTACODE');
      await expect(cart.promoStatus).toHaveText('Code not recognized');
      await expect(cart.summary.total).toHaveText(money(PRICE));
    });

    test('promo code is case-insensitive and ignores surrounding spaces', async ({ productPage }) => {
      const cart = await productPage.addToCart('King', 1);
      await cart.applyPromoCode('  rest10 ');
      await expect(cart.promoStatus).toHaveText('Code applied');
      await expect(cart.summary.total).toHaveText(money(PRICE * 0.9));
    });

    test('invalid code after REST10 removes the discount', async ({ productPage }) => {
      const cart = await productPage.addToCart('Queen', 1);
      await cart.applyPromoCode('REST10');
      await cart.applyPromoCode('WRONG');
      await expect(cart.summary.total).toHaveText(money(PRICE));
    });

    test('checkout without a code keeps the full price', async ({ productPage }) => {
      const cart = await productPage.addToCart('King', 2);
      const checkout = await cart.continueToCheckout();
      await expect(checkout.summary.total).toHaveText(money(PRICE * 2));
    });

    test('empty promo code is rejected and does not discount', async ({ productPage }) => {
      const cart = await productPage.addToCart('Queen', 1);
      await cart.applyPromoCode('');
      await expect(cart.promoStatus).toHaveText('Code not recognized');
      await expect(cart.summary.total).toHaveText(money(PRICE));
    });

    test('applying REST10 twice does not stack the discount', async ({ productPage }) => {
      const cart = await productPage.addToCart('King', 1);
      await cart.applyPromoCode('REST10');
      await cart.applyPromoCode('REST10');
      await expect(cart.summary.total).toHaveText(money(PRICE * 0.9));
    });

    for (const code of ['REST1', 'REST100', 'REST 10', 'REST10X']) {
      test(`near-miss code "${code}" is not accepted`, async ({ productPage }) => {
        const cart = await productPage.addToCart('Queen', 1);
        await cart.applyPromoCode(code);
        await expect(cart.promoStatus).toHaveText('Code not recognized');
        await expect(cart.summary.total).toHaveText(money(PRICE));
      });
    }

    test('quantity above the maximum is capped at 3 before REST10 applies', async ({ productPage }) => {
      const cart = await productPage.addToCart('Queen', 5);
      await expect(cart.summary.quantity).toHaveText('3');
      await cart.applyPromoCode('REST10');
      await expect(cart.summary.total).toHaveText(money(PRICE * 3 * 0.9));
    });

    for (const invalid of ['0', '-2', '']) {
      test(`invalid quantity "${invalid}" is corrected to 1`, async ({ productPage }) => {
        const cart = await productPage.addToCart('Queen', invalid);
        await expect(cart.summary.quantity).toHaveText('1');
        await expect(cart.summary.total).toHaveText(money(PRICE));
      });
    }

    test('fractional quantity is not accepted as a partial mattress', async ({ productPage }) => {
      const cart = await productPage.addToCart('Queen', '1.5');
      await expect(cart.summary.quantity).toHaveText(/^\d+$/);
      await expect(cart.summary.total).not.toHaveText(money(PRICE * 1.5));
    });

    for (const code of ['<script>alert(1)</script>', "' OR 1=1 --", 'rest11', 'R'.repeat(500)]) {
      test(`unsafe or unknown code "${code.slice(0, 20)}" is rejected without discount`, async ({ productPage, page }) => {
        const cart = await productPage.addToCart('Queen', 1);
        await cart.applyPromoCode(code);
        await expect(cart.promoStatus).toHaveText('Code not recognized');
        await expect(cart.summary.total).toHaveText(money(PRICE));
        await expect(page.locator('#cart script')).toHaveCount(0);
      });
    }

    test('invalid code then checkout keeps the full price at checkout', async ({ productPage }) => {
      const cart = await productPage.addToCart('Queen', 2);
      await cart.applyPromoCode('NOTACODE');
      const checkout = await cart.continueToCheckout();
      await expect(checkout.summary.total).toHaveText(money(PRICE * 2));
    });

    test('reload resets the cart', async ({ page, productPage }) => {
      const cart = await productPage.addToCart('Queen', 1);
      await page.reload();
      await expect(productPage.root).toBeVisible();
      await expect(cart.root).toBeHidden();
    });
  });
}
