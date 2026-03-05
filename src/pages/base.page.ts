import { BrowserInstance } from 'playwright-elements';

export abstract class BasePage {
  protected async navigate(path: string = ''): Promise<void> {
    await BrowserInstance.currentPage.goto(path);
  }
}
