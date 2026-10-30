import { test as base } from '@playwright/test';
import { Build, ProductPage } from '../pages/ProductPage';

type Fixtures = {
  build: Build;
  productPage: ProductPage;
};

export const test = base.extend<Fixtures>({
  build: ['reference', { option: true }],
  productPage: async ({ page, build }, use) => {
    const productPage = new ProductPage(page, build);
    await productPage.goto();
    await use(productPage);
  },
});

export { expect } from '@playwright/test';
