import { Locator, Page } from '@playwright/test';
import { CartPage } from './CartPage';

export type Build = 'reference' | 'release';
export type Size = 'Queen' | 'King';

const ORIGIN = process.env.CEDAR_ORIGIN || 'http://127.0.0.1:4173';

export class ProductPage {
  readonly root: Locator;
  readonly offerText: Locator;
  readonly sizeSelect: Locator;
  readonly quantityInput: Locator;
  readonly addToCartButton: Locator;

  constructor(private readonly page: Page, private readonly build: Build) {
    this.root = page.locator('#product');
    this.offerText = page.getByTestId('offer');
    this.sizeSelect = page.locator('#size');
    this.quantityInput = page.locator('#quantity');
    this.addToCartButton = page.getByTestId('purchase');
  }

  async goto() {
    await this.page.goto(`${ORIGIN}/${this.build}/`);
  }

  async addToCart(size: Size, quantity: number | string): Promise<CartPage> {
    await this.sizeSelect.selectOption(size);
    await this.quantityInput.fill(String(quantity));
    await this.addToCartButton.click();
    return new CartPage(this.page);
  }
}
