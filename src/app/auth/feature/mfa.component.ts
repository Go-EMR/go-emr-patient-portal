import { Component, inject, signal, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputOtpModule } from 'primeng/inputotp';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../data-access';

@Component({
  selector: 'app-mfa',
  standalone: true,
  imports: [FormsModule, CardModule, InputOtpModule, ButtonModule],
  template: `
    <div class="mfa-container">
      <p-card styleClass="mfa-card">
        <ng-template pTemplate="header">
          <div class="mfa-header">
            <!-- Feature 6.5: aria-hidden on decorative icon -->
            <i class="pi pi-shield" aria-hidden="true"></i>
            <h1 id="mfa-heading">Two-Factor Authentication</h1>
            <p id="mfa-subheading">Enter the 6-digit code sent to your device</p>
          </div>
        </ng-template>

        <div class="mfa-form" role="main" aria-labelledby="mfa-heading">
          <!-- Feature 6.5: aria-label, aria-required, aria-describedby on OTP input -->
          <div class="otp-wrapper">
            <label for="mfa-code" class="otp-label">Verification code</label>
            <!-- aria-label provided on the wrapper; individual cells are labelled by PrimeNG -->
            <p-inputOtp
              [(ngModel)]="code"
              [length]="6"
              [integerOnly]="true"
              styleClass="otp-input"
              (ngModelChange)="onCodeChange($event)"
              inputId="mfa-code"
              [attr.aria-describedby]="errorMessage() ? 'mfa-error' : 'mfa-subheading'"
              aria-required="true"
              aria-label="6-digit verification code" />
          </div>

          <!-- Feature 6.5: role="alert" on error, role="status" on success -->
          @if (errorMessage()) {
            <div id="mfa-error" class="error-message" role="alert" aria-live="assertive">
              <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
              {{ errorMessage() }}
            </div>
          }

          @if (successMessage()) {
            <div class="success-message" role="status" aria-live="polite">
              <i class="pi pi-check-circle" aria-hidden="true"></i>
              {{ successMessage() }}
            </div>
          }

          <button
            pButton
            label="Verify"
            icon="pi pi-check"
            class="w-full"
            [loading]="authService.isLoading()"
            (click)="verify()"
            aria-label="Verify the 6-digit code"
            [attr.aria-describedby]="errorMessage() ? 'mfa-error' : 'mfa-subheading'"></button>

          <!-- Feature 6.5: aria-live status for resend area -->
          <div class="resend-options" aria-label="Resend verification code options">
            <span id="resend-label" aria-live="polite">Didn't receive the code?</span>
            <button
              pButton
              [label]="resendSmsLabel()"
              class="p-button-text p-button-sm"
              [disabled]="resendCountdown() > 0"
              (click)="resend('sms')"
              aria-label="Resend code via SMS"
              [attr.aria-describedby]="'resend-label'"></button>
            <button
              pButton
              [label]="resendEmailLabel()"
              class="p-button-text p-button-sm"
              [disabled]="resendCountdown() > 0"
              (click)="resend('email')"
              aria-label="Resend code via email"
              [attr.aria-describedby]="'resend-label'"></button>
          </div>

          <button
            pButton
            label="Back to Login"
            class="p-button-text w-full"
            icon="pi pi-arrow-left"
            (click)="authService.logout()"
            aria-label="Return to the login page"></button>
        </div>

        <ng-template pTemplate="footer">
          <div class="trust-message" aria-label="Security information">
            <i class="pi pi-lock" aria-hidden="true"></i>
            Your session is protected with end-to-end encryption
          </div>
        </ng-template>
      </p-card>
    </div>
  `,
  styles: [`
    .mfa-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--teal-600) 0%, var(--teal-800) 100%);
      padding: 1rem;
    }
    :host ::ng-deep .mfa-card { width: 100%; max-width: 420px; }
    .mfa-header { text-align: center; padding: 2rem 2rem 1rem; }
    .mfa-header i { font-size: 3rem; color: var(--teal-600); margin-bottom: 1rem; }
    .mfa-header h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
    .mfa-header p { margin: 0; color: var(--text-color-secondary); }
    .mfa-form { padding: 0 1rem; text-align: center; }

    /* Feature 6.5: visually associate label with OTP input */
    .otp-wrapper { margin-bottom: 1.5rem; }
    .otp-label {
      display: block;
      margin-bottom: 0.75rem;
      font-weight: 500;
      font-size: 0.9rem;
      color: var(--text-color);
    }

    :host ::ng-deep .otp-input { justify-content: center; }
    .error-message { background: var(--red-50); color: var(--red-700); padding: 0.75rem; border-radius: var(--border-radius); margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .success-message { background: var(--green-50); color: var(--green-700); padding: 0.75rem; border-radius: var(--border-radius); margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .resend-options { margin: 1.5rem 0; }
    .resend-options span { display: block; color: var(--text-color-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; }
    .trust-message { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 1rem; border-top: 1px solid var(--surface-border); color: var(--text-color-secondary); font-size: 0.875rem; }
    .w-full { width: 100%; }
  `]
})
export class MfaComponent implements OnDestroy, AfterViewInit {
  readonly authService = inject(AuthService);

  code = '';
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  resendCountdown = signal(0);

  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private autoVerifying = false;

  resendSmsLabel = () => {
    const cd = this.resendCountdown();
    return cd > 0 ? `Resend via SMS (${cd}s)` : 'Resend via SMS';
  };

  resendEmailLabel = () => {
    const cd = this.resendCountdown();
    return cd > 0 ? `Resend via Email (${cd}s)` : 'Resend via Email';
  };

  ngAfterViewInit(): void {
    // Feature 6.5: Auto-focus the OTP first input on load
    // PrimeNG InputOtp renders internal inputs; focus the first one
    setTimeout(() => {
      const firstOtpInput = document.querySelector<HTMLInputElement>('.otp-input input');
      firstOtpInput?.focus();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  onCodeChange(value: string): void {
    if (value && value.length === 6 && !this.autoVerifying) {
      this.autoVerifying = true;
      setTimeout(() => {
        this.verify().finally(() => this.autoVerifying = false);
      }, 300);
    }
  }

  async verify(): Promise<void> {
    this.errorMessage.set(null);
    const result = await this.authService.verifyMfa(this.code);
    if (!result.success) {
      this.errorMessage.set(result.error || 'Verification failed');
    }
  }

  async resend(method: 'sms' | 'email'): Promise<void> {
    await this.authService.resendMfaCode(method);
    this.successMessage.set(`Code sent via ${method.toUpperCase()}`);
    setTimeout(() => this.successMessage.set(null), 3000);
    this.startCountdown();
  }

  private startCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.resendCountdown.set(42);
    this.countdownInterval = setInterval(() => {
      const current = this.resendCountdown();
      if (current <= 1) {
        this.resendCountdown.set(0);
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }
      } else {
        this.resendCountdown.set(current - 1);
      }
    }, 1000);
  }
}
