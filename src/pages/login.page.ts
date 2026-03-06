import { $ } from 'playwright-elements';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly title = $('.login_logo');
  readonly usernameInput = $('#user-name');
  readonly passwordInput = $('#password');
  readonly loginButton = $('#login-button');
  readonly errorMessage = $('[data-test="error"]');
  readonly errorIcon = $('.error_icon');
  readonly errorCloseButton = $('.error-button');

  async goto(): Promise<void> {
    await this.navigate('/');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
