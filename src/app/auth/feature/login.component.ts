import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../data-access';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, PasswordModule, ButtonModule, CheckboxModule],
  template: `
    <div class="login-container">
      <p-card styleClass="login-card">
        <ng-template pTemplate="header">
          <div class="login-header">
            <div class="logo">
              <i class="pi pi-heart-fill"></i>
              <span>GoHealth</span>
            </div>
            <h1>Patient Portal</h1>
            <p>Sign in to access your health information</p>
          </div>
        </ng-template>

        <div class="login-form">
          <div class="field">
            <label for="email">Email</label>
            <input id="email" type="email" pInputText [(ngModel)]="email" placeholder="patient@demo.com" class="w-full" />
          </div>

          <div class="field">
            <label for="password">Password</label>
            <p-password id="password" [(ngModel)]="password" [feedback]="false" [toggleMask]="true" placeholder="demo123" styleClass="w-full" inputStyleClass="w-full" />
          </div>

          <div class="field-checkbox">
            <p-checkbox [(ngModel)]="rememberMe" [binary]="true" inputId="remember" />
            <label for="remember">Remember me</label>
          </div>

          @if (errorMessage()) {
            <div class="error-message">
              <i class="pi pi-exclamation-circle"></i>
              {{ errorMessage() }}
            </div>
          }

          <button pButton label="Sign In" icon="pi pi-sign-in" class="w-full" [loading]="authService.isLoading()" (click)="login()"></button>

          <div class="demo-credentials">
            <p><strong>Demo:</strong> patient&#64;demo.com / demo123</p>
            <button pButton label="Use Demo Account" class="p-button-text p-button-sm" (click)="useDemoCredentials()"></button>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div class="trust-badges">
            <span><i class="pi pi-shield"></i> HIPAA Compliant</span>
            <span><i class="pi pi-lock"></i> 256-bit Encryption</span>
          </div>
        </ng-template>
      </p-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--teal-600) 0%, var(--teal-800) 100%);
      padding: 1rem;
    }
    :host ::ng-deep .login-card { width: 100%; max-width: 420px; }
    .login-header { text-align: center; padding: 2rem 2rem 1rem; }
    .logo { display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 1.5rem; font-weight: 700; color: var(--teal-600); margin-bottom: 1rem; }
    .logo i { font-size: 2rem; }
    .login-header h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
    .login-header p { margin: 0; color: var(--text-color-secondary); }
    .login-form { padding: 0 1rem; }
    .field { margin-bottom: 1.25rem; }
    .field label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .field-checkbox { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; }
    .error-message { background: var(--red-50); color: var(--red-700); padding: 0.75rem; border-radius: var(--border-radius); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .demo-credentials { margin-top: 1.5rem; text-align: center; padding: 1rem; background: var(--surface-50); border-radius: var(--border-radius); }
    .demo-credentials p { margin: 0 0 0.5rem; font-size: 0.875rem; }
    .trust-badges { display: flex; justify-content: center; gap: 1.5rem; padding: 1rem; border-top: 1px solid var(--surface-border); }
    .trust-badges span { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-color-secondary); }
    .w-full { width: 100%; }
  `]
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  
  email = '';
  password = '';
  rememberMe = false;
  errorMessage = signal<string | null>(null);

  async login(): Promise<void> {
    this.errorMessage.set(null);
    const result = await this.authService.login(this.email, this.password);
    if (!result.success) {
      this.errorMessage.set(result.error || 'Login failed');
    }
  }

  useDemoCredentials(): void {
    this.email = 'patient@demo.com';
    this.password = 'demo123';
  }
}
