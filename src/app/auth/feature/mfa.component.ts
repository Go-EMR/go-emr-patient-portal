import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputOtpModule } from 'primeng/inputotp';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../data-access';

@Component({
  selector: 'app-mfa',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputOtpModule, ButtonModule],
  template: `
    <div class="mfa-container">
      <p-card styleClass="mfa-card">
        <ng-template pTemplate="header">
          <div class="mfa-header">
            <i class="pi pi-shield"></i>
            <h1>Two-Factor Authentication</h1>
            <p>Enter the 6-digit code sent to your device</p>
          </div>
        </ng-template>

        <div class="mfa-form">
          <p-inputOtp [(ngModel)]="code" [length]="6" [integerOnly]="true" styleClass="otp-input" />

          @if (errorMessage()) {
            <div class="error-message">
              <i class="pi pi-exclamation-circle"></i>
              {{ errorMessage() }}
            </div>
          }

          @if (successMessage()) {
            <div class="success-message">
              <i class="pi pi-check-circle"></i>
              {{ successMessage() }}
            </div>
          }

          <button pButton label="Verify" icon="pi pi-check" class="w-full" [loading]="authService.isLoading()" (click)="verify()"></button>

          <div class="resend-options">
            <span>Didn't receive the code?</span>
            <button pButton label="Resend via SMS" class="p-button-text p-button-sm" (click)="resend('sms')"></button>
            <button pButton label="Resend via Email" class="p-button-text p-button-sm" (click)="resend('email')"></button>
          </div>

          <button pButton label="Back to Login" class="p-button-text w-full" icon="pi pi-arrow-left" (click)="authService.logout()"></button>
        </div>

        <ng-template pTemplate="footer">
          <div class="trust-message">
            <i class="pi pi-lock"></i>
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
    :host ::ng-deep .otp-input { justify-content: center; margin-bottom: 1.5rem; }
    .error-message { background: var(--red-50); color: var(--red-700); padding: 0.75rem; border-radius: var(--border-radius); margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .success-message { background: var(--green-50); color: var(--green-700); padding: 0.75rem; border-radius: var(--border-radius); margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .resend-options { margin: 1.5rem 0; }
    .resend-options span { display: block; color: var(--text-color-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; }
    .trust-message { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 1rem; border-top: 1px solid var(--surface-border); color: var(--text-color-secondary); font-size: 0.875rem; }
    .w-full { width: 100%; }
  `]
})
export class MfaComponent {
  readonly authService = inject(AuthService);
  
  code = '';
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

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
  }
}
