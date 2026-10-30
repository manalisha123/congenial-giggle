import { Locator, Page } from '@playwright/test';

export class OrderSummary {
  readonly item: Locator;
  readonly quantity: Locator;
  readonly gift: Locator;
  readonly total: Locator;

  constructor(root: Locator) {
    this.item = root.getByTestId('item');
    this.quantity = root.getByTestId('quantity');
    this.gift = root.getByTestId('gift');
    this.total = root.getByTestId('total');
  }
}

export class CheckoutPage {
  readonly root: Locator;
  readonly summary: OrderSummary;

  constructor(page: Page) {
    this.root = page.locator('#checkout');
    this.summary = new OrderSummary(this.root);
  }
}
