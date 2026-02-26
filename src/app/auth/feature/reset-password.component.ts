import { Component, inject, signal, computed, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';

interface PasswordRequirement {
  key: string;
  label: string;
  met: boolean;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterModule, CardModule, PasswordModule, ButtonModule],
  template: `
    <div class="auth-container" role="main">
      <p-card styleClass="auth-card">
        <ng-template pTemplate="header">
          <div class="auth-header">
            <div class="logo" aria-label="GoHealth Patient Portal">
              <i class="pi pi-heart-fill" aria-hidden="true"></i>
              <span>GoHealth</span>
            </div>
            @if (!success()) {
              <h1 id="reset-heading">Set New Password</h1>
              <p id="reset-subheading">Create a strong password to secure your account.</p>
            } @else {
              <div class="success-icon" aria-hidden="true">
                <i class="pi pi-check"></i>
              </div>
              <h1 id="reset-heading">Password Updated!</h1>
              <p id="reset-subheading">Your password has been changed successfully.</p>
            }
          </div>
        </ng-template>

        <div class="auth-body">
          @if (!success()) {
            <form (ngSubmit)="submit()" aria-labelledby="reset-heading reset-subheading" novalidate>

              <!-- New Password -->
              <div class="field">
                <label for="new-password">New Password</label>
                <p-password
                  id="new-password"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  [feedback]="true"
                  [toggleMask]="true"
                  placeholder="Enter new password"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                  [disabled]="isLoading()"
                  ariaLabel="New password"
                  ariaRequired="true"
                  (ngModelChange)="onPasswordChange($event)">
                </p-password>
              </div>

              <!-- Requirements checklist -->
              <div class="requirements-panel" aria-label="Password requirements" role="list">
                @for (req of requirements(); track req.key) {
                  <div
                    class="requirement-item"
                    [class.met]="req.met"
                    role="listitem"
                    [attr.aria-label]="req.label + (req.met ? ', requirement met' : ', not yet met')">
                    <span class="req-icon" aria-hidden="true">
                      @if (req.met) {
                        <i class="pi pi-check-circle"></i>
                      } @else {
                        <i class="pi pi-circle"></i>
                      }
                    </span>
                    <span class="req-label">{{ req.label }}</span>
                  </div>
                }
              </div>

              <!-- Confirm Password -->
              <div class="field" style="margin-top: 1.25rem;">
                <label for="confirm-password">Confirm Password</label>
                <p-password
                  id="confirm-password"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  [feedback]="false"
                  [toggleMask]="true"
                  placeholder="Re-enter new password"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                  [disabled]="isLoading()"
                  ariaLabel="Confirm new password"
                  ariaRequired="true">
                </p-password>
                @if (confirmPassword && !passwordsMatch()) {
                  <small class="mismatch-hint" role="alert">
                    <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                    Passwords do not match
                  </small>
                }
              </div>

              @if (errorMsg()) {
                <div class="error-msg" role="alert" aria-live="assertive">
                  <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                  {{ errorMsg() }}
                </div>
              }

              <button
                pButton
                type="submit"
                label="Update Password"
                icon="pi pi-lock"
                iconPos="right"
                class="w-full submit-btn"
                [loading]="isLoading()"
                [disabled]="!canSubmit()"
                aria-describedby="reset-subheading">
              </button>
            </form>
          } @else {
            <!-- Success state with countdown -->
            <div class="success-body" role="status" aria-live="polite">
              <div class="redirect-notice">
                <i class="pi pi-arrow-right-circle" aria-hidden="true"></i>
                <span>Redirecting to login in <strong>{{ countdown() }}</strong> second{{ countdown() !== 1 ? 's' : '' }}...</span>
              </div>

              <button
                pButton
                label="Go to Login Now"
                icon="pi pi-sign-in"
                class="w-full"
                routerLink="/login"
                aria-label="Go to login page immediately">
              </button>
            </div>
          }

          @if (!success()) {
            <div class="back-link">
              <a routerLink="/login" aria-label="Return to login page">
                <i class="pi pi-arrow-left" aria-hidden="true"></i>
                Back to Login
              </a>
            </div>
          }
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
      max-width: 440px;
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

    .logo i { font-size: 2rem; }

    .auth-header h1 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      color: var(--text-color);
    }

    .auth-header p {
      margin: 0;
      color: var(--text-color-secondary);
      font-size: 0.95rem;
    }

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
      margin-bottom: 1rem;
    }

    .field label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      font-size: 0.9rem;
    }

    .w-full { width: 100%; }

    /* Requirements panel */
    .requirements-panel {
      background: var(--surface-50);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      padding: 0.875rem 1rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem 1rem;
    }

    .requirement-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      transition: color 0.2s ease;
    }

    .requirement-item.met {
      color: var(--green-700);
    }

    .req-icon {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      font-size: 0.95rem;
    }

    .requirement-item .req-icon .pi-check-circle {
      color: var(--green-600);
      animation: checkPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes checkPop {
      from { transform: scale(0.6); }
      to   { transform: scale(1); }
    }

    .requirement-item .req-icon .pi-circle {
      color: var(--surface-400);
    }

    .req-label {
      line-height: 1.3;
    }

    .mismatch-hint {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--red-600);
      font-size: 0.8rem;
      margin-top: 0.375rem;
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

    .submit-btn {
      margin-top: 0.75rem;
    }

    /* Success state */
    .success-body {
      animation: fadeIn 0.35s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .redirect-notice {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--teal-50);
      border: 1px solid var(--teal-200);
      color: var(--teal-800);
      padding: 1rem;
      border-radius: var(--border-radius);
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
    }

    .redirect-notice i {
      font-size: 1.25rem;
      color: var(--teal-600);
      flex-shrink: 0;
    }

    .redirect-notice strong {
      font-size: 1.15rem;
      font-variant-numeric: tabular-nums;
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
export class ResetPasswordComponent implements OnDestroy {
  private readonly router = inject(Router);

  newPassword = '';
  confirmPassword = '';
  success = signal(false);
  isLoading = signal(false);
  errorMsg = signal<string | null>(null);
  countdown = signal(5);

  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  requirements = signal<PasswordRequirement[]>([
    { key: 'length',    label: '8+ characters',      met: false },
    { key: 'uppercase', label: 'Uppercase letter',    met: false },
    { key: 'number',    label: 'Number (0-9)',         met: false },
    { key: 'special',  label: 'Special character',    met: false },
  ]);

  passwordsMatch = computed(() =>
    this.confirmPassword.length > 0 && this.newPassword === this.confirmPassword
  );

  allRequirementsMet = computed(() =>
    this.requirements().every(r => r.met)
  );

  canSubmit = computed(() =>
    this.allRequirementsMet() && this.passwordsMatch() && !this.isLoading()
  );

  onPasswordChange(val: string): void {
    this.requirements.update(reqs => reqs.map(r => {
      switch (r.key) {
        case 'length':    return { ...r, met: val.length >= 8 };
        case 'uppercase': return { ...r, met: /[A-Z]/.test(val) };
        case 'number':    return { ...r, met: /[0-9]/.test(val) };
        case 'special':   return { ...r, met: /[^A-Za-z0-9]/.test(val) };
        default:          return r;
      }
    }));
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;

    this.errorMsg.set(null);
    this.isLoading.set(true);

    // Simulate API call
    await new Promise(r => setTimeout(r, 1400));

    this.isLoading.set(false);
    this.success.set(true);
    this.startCountdown();
  }

  private startCountdown(): void {
    this.countdownTimer = setInterval(() => {
      const current = this.countdown();
      if (current <= 1) {
        this.clearCountdown();
        this.router.navigate(['/login']);
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }
}
