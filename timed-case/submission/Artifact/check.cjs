const assert = require('node:assert/strict');

const PRICE = 900;
const money = n => `AED ${n.toFixed(2)}`;

const scenarios = [
  { size: 'Queen', quantity: 1 },
  { size: 'King', quantity: 2 }
];

async function addToCart(page, baseURL, { size, quantity }) {
  await page.goto(baseURL);
  await page.locator('#size').selectOption(size);
  await page.locator('#quantity').fill(String(quantity));
  await page.getByTestId('purchase').click();
  await page.locator('#cart').waitFor({ state: 'visible' });
}

async function assertLines(page, { size, quantity, total }, stage, section) {
  const scope = page.locator(section);
  assert.equal(await scope.getByTestId('item').textContent(), `Cedar mattress - ${size}`, `${stage}: selected size`);
  assert.equal(await scope.getByTestId('quantity').textContent(), String(quantity), `${stage}: quantity`);
  assert.equal(await scope.getByTestId('gift').textContent(), money(0), `${stage}: pillow gift must stay AED 0.00`);
  assert.equal(await scope.getByTestId('total').textContent(), money(total), `${stage}: total`);
}

module.exports = async function check(page, baseURL) {
  for (const scenario of scenarios) {
    const { size, quantity } = scenario;
    const label = `${size} x${quantity}`;
    const undiscounted = PRICE * quantity;
    const discounted = undiscounted * 0.9;

    await addToCart(page, baseURL, scenario);
    await assertLines(page, { ...scenario, total: undiscounted }, `${label} cart before code`, '#cart');

    // Invalid code must not change the price.
    await page.locator('#code').fill('NOTACODE');
    await page.locator('#apply').click();
    assert.equal(await page.locator('#promo-status').textContent(), 'Code not recognized', `${label}: invalid code message`);
    await assertLines(page, { ...scenario, total: undiscounted }, `${label} cart after invalid code`, '#cart');

    // REST10 takes 10% off the mattress only.
    await page.locator('#code').fill('REST10');
    await page.locator('#apply').click();
    assert.equal(await page.locator('#promo-status').textContent(), 'Code applied', `${label}: valid code message`);
    await assertLines(page, { ...scenario, total: discounted }, `${label} cart after REST10`, '#cart');

    // Accepted cart total, size and quantity must persist into simulated checkout.
    await page.locator('#checkout-button').click();
    await page.locator('#checkout').waitFor({ state: 'visible' });
    await assertLines(page, { ...scenario, total: discounted }, `${label} checkout`, '#checkout');
  }
};
