import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterModule, CardModule, InputTextModule, ButtonModule],
  template: `
    <div class="auth-container" role="main">
      <p-card styleClass="auth-card">
        <ng-template pTemplate="header">
          <div class="auth-header">
            <div class="logo" aria-label="AuraHealth Patient Portal">
              <i class="pi pi-heart-fill" aria-hidden="true"></i>
              <span>AuraHealth</span>
            </div>
            @if (!submitted()) {
              <h1 id="forgot-heading">Forgot Password?</h1>
              <p id="forgot-subheading">Enter your email and we'll send you reset instructions.</p>
            } @else {
              <div class="success-icon" aria-hidden="true">
                <i class="pi pi-check"></i>
              </div>
              <h1 id="forgot-heading">Check Your Email</h1>
              <p id="forgot-subheading">Reset instructions sent to <strong>{{ email }}</strong></p>
            }
          </div>
        </ng-template>

        <div class="auth-body">
          @if (!submitted()) {
            <form (ngSubmit)="submit()" aria-labelledby="forgot-heading forgot-subheading" novalidate>
              <div class="field">
                <label for="reset-email">Email address</label>
                <input
                  id="reset-email"
                  type="email"
                  pInputText
                  [(ngModel)]="email"
                  name="email"
                  placeholder="patient@demo.com"
                  class="w-full"
                  aria-required="true"
                  [attr.aria-describedby]="errorMsg() ? 'email-error' : 'forgot-subheading'"
                  autocomplete="email"
                  [disabled]="isLoading()" />
              </div>

              @if (errorMsg()) {
                <div id="email-error" class="error-msg" role="alert" aria-live="assertive">
                  <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                  {{ errorMsg() }}
                </div>
              }

              <button
                pButton
                type="submit"
                label="Send Reset Instructions"
                icon="pi pi-send"
                iconPos="right"
                class="w-full submit-btn"
                [loading]="isLoading()"
                [disabled]="!email.trim()"
                aria-describedby="forgot-subheading">
              </button>
            </form>
          } @else {
            <div class="success-body" role="status" aria-live="polite">
              <ul class="success-steps" aria-label="Next steps">
                <li>
                  <span class="step-icon" aria-hidden="true"><i class="pi pi-envelope"></i></span>
                  <span>We've emailed a secure link to your inbox.</span>
                </li>
                <li>
                  <span class="step-icon" aria-hidden="true"><i class="pi pi-clock"></i></span>
                  <span>The link expires in <strong>15 minutes</strong>.</span>
                </li>
                <li>
                  <span class="step-icon" aria-hidden="true"><i class="pi pi-shield"></i></span>
                  <span>Check your spam folder if you don't see it.</span>
                </li>
              </ul>

              <button
                pButton
                label="Resend Email"
                icon="pi pi-refresh"
                class="w-full p-button-outlined resend-btn"
                (click)="resend()"
                [loading]="isLoading()"
                aria-label="Resend the password reset email">
              </button>
            </div>
          }

          <div class="back-link">
            <a routerLink="/auth/login" aria-label="Return to login page">
              <i class="pi pi-arrow-left" aria-hidden="true"></i>
              Back to Login
            </a>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div class="trust-badges" role="contentinfo" aria-label="Security certifications">
            <span><i class="pi pi-shield" aria-hidden="true"></i> HIPAA Compliant</span>
            <span><i class="pi pi-lock" aria-hidden="true"></i> 256-bit Encryption</span>
          </div>
        </ng-template>
      </p-card>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--teal-600) 0%, var(--teal-800) 100%);
      padding: 1rem;
    }

    :host ::ng-deep .auth-card {
      width: 100%;
      max-width: 420px;
    }

    .auth-header {
      text-align: center;
      padding: 2rem 2rem 1rem;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--teal-600);
      margin-bottom: 1.25rem;
    }

    .logo i {
      font-size: 2rem;
    }

    .auth-header h1 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      color: var(--text-color);
    }

    .auth-header p {
      margin: 0;
      color: var(--text-color-secondary);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .auth-header p strong {
      color: var(--teal-700);
    }

    /* Success icon animation */
    .success-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--teal-500), var(--teal-700));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .success-icon i {
      font-size: 1.75rem;
      color: white;
    }

    @keyframes popIn {
      from { transform: scale(0.5); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }

    .auth-body {
      padding: 0.5rem 1rem 0.5rem;
    }

    .field {
      margin-bottom: 1.25rem;
    }

    .field label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .w-full {
      width: 100%;
    }

    .submit-btn {
      margin-top: 0.25rem;
    }

    .error-msg {
      background: var(--red-50);
      color: var(--red-700);
      padding: 0.75rem;
      border-radius: var(--border-radius);
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    /* Success state */
    .success-body {
      animation: fadeIn 0.35s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .success-steps {
      list-style: none;
      margin: 0 0 1.5rem;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .success-steps li {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      color: var(--text-color);
      font-size: 0.9rem;
      line-height: 1.45;
    }

    .step-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--teal-50);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .step-icon i {
      color: var(--teal-600);
      font-size: 0.875rem;
    }

    .resend-btn {
      margin-bottom: 0.5rem;
    }

    .back-link {
      text-align: center;
      margin-top: 1.25rem;
      padding-bottom: 0.5rem;
    }

    .back-link a {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: var(--primary-600);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .back-link a:hover {
      color: var(--primary-700);
      text-decoration: underline;
    }

    .back-link a:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
      border-radius: 4px;
    }

    .trust-badges {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      padding: 1rem;
      border-top: 1px solid var(--surface-border);
    }

    .trust-badges span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }
  `]
})
export class ForgotPasswordComponent {
  email = '';
  submitted = signal(false);
  isLoading = signal(false);
  errorMsg = signal<string | null>(null);

  async submit(): Promise<void> {
    const trimmed = this.email.trim();
    if (!trimmed) {
      this.errorMsg.set('Please enter your email address.');
      return;
    }
    if (!trimmed.includes('@')) {
      this.errorMsg.set('Please enter a valid email address.');
      return;
    }

    this.errorMsg.set(null);
    this.isLoading.set(true);

    // Simulate API call
    await new Promise(r => setTimeout(r, 1200));

    this.isLoading.set(false);
    this.submitted.set(true);
  }

  async resend(): Promise<void> {
    this.isLoading.set(true);
    await new Promise(r => setTimeout(r, 1000));
    this.isLoading.set(false);
  }
}
