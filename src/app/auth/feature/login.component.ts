import { Component, inject, signal, computed, effect, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../data-access';
import { PasskeyService } from '../data-access/passkey.service';
import { ThemeService, ThemeMode } from '../../shared/data-access/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CardModule, InputTextModule, PasswordModule, ButtonModule, CheckboxModule],
  template: `
    <div class="login-container">
      <!-- Theme switcher -->
      <div class="theme-switcher">
        <span class="theme-label"><i class="pi pi-palette" aria-hidden="true"></i> Theme</span>
        <div class="theme-buttons" role="group" aria-label="Select color theme">
          <button class="theme-btn" [class.active]="themeService.activeTheme() === 'classic'" (click)="themeService.setTheme('classic')"
                  aria-label="Classic theme" [attr.aria-pressed]="themeService.activeTheme() === 'classic'">
            <i class="pi pi-desktop" aria-hidden="true"></i>
            <span class="theme-btn-label">Classic</span>
          </button>
          <button class="theme-btn" [class.active]="themeService.activeTheme() === 'beach'" (click)="themeService.setTheme('beach')"
                  aria-label="Beach theme" [attr.aria-pressed]="themeService.activeTheme() === 'beach'">
            <i class="pi pi-sun" aria-hidden="true"></i>
            <span class="theme-btn-label">Beach</span>
          </button>
          <button class="theme-btn" [class.active]="themeService.activeTheme() === 'dark'" (click)="themeService.setTheme('dark')"
                  aria-label="Dark theme" [attr.aria-pressed]="themeService.activeTheme() === 'dark'">
            <i class="pi pi-moon" aria-hidden="true"></i>
            <span class="theme-btn-label">Dark</span>
          </button>
        </div>
      </div>

      <p-card styleClass="login-card">
        <ng-template pTemplate="header">
          <div class="login-header">
            <div class="logo" aria-hidden="true">
              <i class="pi pi-heart-fill"></i>
              <span>AuraHealth</span>
            </div>
            <h1 id="login-heading">Patient Portal</h1>
            <p id="login-subheading">Sign in to access your health information</p>
          </div>
        </ng-template>

        <div class="login-form" role="main" aria-labelledby="login-heading">

          <!-- Aura Suite SSO (BFF flow). Shown when served by patient-portal-bff
               (port 4611). On the BFF the legacy /api/v1/portal/auth/login route
               is removed — password login would 404. On the direct frontend
               (port 4201) we keep showing the password form as a rollback path. -->
          @if (showSsoOption) {
            <div class="sso-only">
              <button type="button" class="sso-button" (click)="signInWithSSO()">
                <i class="pi pi-shield" aria-hidden="true"></i>
                <span>Continue with Aura SSO</span>
              </button>
              <p class="sso-hint">
                You'll be redirected to your organisation's identity provider
                to sign in securely.
              </p>
            </div>
          }

          <!-- Feature 6.3.1: Login mode tabs — hidden when BFF SSO is active -->
          @if (!showSsoOption) {
          <div class="mode-tabs" role="tablist" aria-label="Login method">
            <button
              role="tab"
              [attr.aria-selected]="loginMode() === 'email'"
              [class.active]="loginMode() === 'email'"
              class="mode-tab"
              (click)="setLoginMode('email')"
              aria-controls="email-panel"
              id="email-tab">
              <i class="pi pi-envelope" aria-hidden="true"></i>
              Email
            </button>
            <button
              role="tab"
              [attr.aria-selected]="loginMode() === 'phone'"
              [class.active]="loginMode() === 'phone'"
              class="mode-tab"
              (click)="setLoginMode('phone')"
              aria-controls="phone-panel"
              id="phone-tab">
              <i class="pi pi-mobile" aria-hidden="true"></i>
              Phone
            </button>
          </div>

          <!-- Feature 6.1: Lockout message with WCAG role="alert" -->
          @if (authService.isLockedOut()) {
            <div class="lockout-message" role="alert" aria-live="assertive">
              <i class="pi pi-lock" aria-hidden="true"></i>
              <div>
                <strong>Account Locked</strong>
                <p>Too many failed login attempts. Please try again in 15 minutes.</p>
              </div>
            </div>
          }

          <!-- EMAIL LOGIN PANEL -->
          @if (loginMode() === 'email') {
            <div id="email-panel" role="tabpanel" aria-labelledby="email-tab">
              <div class="field">
                <label for="email">Email address</label>
                <input
                  #emailInput
                  id="email"
                  type="email"
                  pInputText
                  [(ngModel)]="email"
                  placeholder="patient@demo.com"
                  class="w-full"
                  [disabled]="authService.isLockedOut()"
                  aria-required="true"
                  [attr.aria-describedby]="errorMessage() ? 'email-error' : 'login-subheading'"
                  aria-label="Email address"
                  autocomplete="email" />
              </div>

              <div class="field">
                <label for="password">Password</label>
                <p-password
                  id="password"
                  [(ngModel)]="password"
                  [feedback]="false"
                  [toggleMask]="true"
                  placeholder="demo123"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                  [disabled]="authService.isLockedOut()"
                  ariaLabel="Password"
                  ariaRequired="true" />
              </div>

              <div class="field-row">
                <div class="field-checkbox">
                  <p-checkbox [(ngModel)]="rememberMe" [binary]="true" inputId="remember" aria-label="Remember me on this device" />
                  <label for="remember">Remember me</label>
                </div>
                <a class="forgot-password-link" href="javascript:void(0)" (click)="showForgotPassword()"
                   aria-label="Reset your forgotten password">Forgot Password?</a>
              </div>

              <!-- Feature 6.5: WCAG error/info with role="alert" and aria-live -->
              @if (errorMessage()) {
                <div id="email-error" class="error-message" role="alert" aria-live="assertive">
                  <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                  {{ errorMessage() }}
                </div>
              }

              @if (forgotPasswordMessage()) {
                <div class="info-message" role="status" aria-live="polite">
                  <i class="pi pi-info-circle" aria-hidden="true"></i>
                  {{ forgotPasswordMessage() }}
                </div>
              }

              <button
                pButton
                label="Sign In"
                icon="pi pi-sign-in"
                class="w-full"
                [loading]="authService.isLoading()"
                [disabled]="authService.isLockedOut()"
                (click)="login()"
                aria-label="Sign in with email and password"
                aria-describedby="login-subheading"></button>

              @if (passkeySupported) {
                <button
                  pButton
                  label="Sign in with passkey"
                  icon="pi pi-key"
                  class="w-full p-button-outlined p-button-secondary"
                  style="margin-top: .5rem;"
                  [loading]="isPasskeyLoading()"
                  [disabled]="authService.isLockedOut() || authService.isLoading() || isPasskeyLoading()"
                  (click)="signInWithPasskey()"
                  aria-label="Sign in with passkey"></button>
              }

              <div class="demo-credentials" aria-label="Demo account credentials">
                <p><strong>Quick Demo Access</strong> (password: admin123)</p>
                <div class="demo-buttons">
                  <button
                    class="demo-btn"
                    (click)="fillCredentials('vivek.b@patient.in')"
                    aria-label="Vivek Bhardwaj - IzaDental patient">
                    <i class="pi pi-user"></i> Vivek (Dental)
                  </button>
                  <button
                    class="demo-btn"
                    (click)="fillCredentials('vikas.s@patient.in')"
                    aria-label="Vikas Sharma - Psychology patient">
                    <i class="pi pi-heart"></i> Vikas (Psych)
                  </button>
                  <button
                    class="demo-btn"
                    (click)="fillCredentials('aditi@patient.in')"
                    aria-label="Aditi - Ortho patient">
                    <i class="pi pi-shield"></i> Aditi (Ortho)
                  </button>
                  <button
                    class="demo-btn"
                    (click)="fillCredentials('rachana.a@patient.in')"
                    aria-label="Rachana Arora - Heart patient">
                    <i class="pi pi-heart-fill"></i> Rachana (Heart)
                  </button>
                </div>
              </div>

              <!-- Feature 6.2: Social login -->
              <div class="social-divider" role="separator" aria-label="Alternative sign-in options">
                <span>Or continue with</span>
              </div>

              <div class="social-buttons" aria-label="Social sign-in options">
                <button
                  class="social-btn google-btn"
                  (click)="socialLogin('google')"
                  [disabled]="authService.isLoading()"
                  aria-label="Sign in with Google"
                  type="button">
                  <!-- Google "G" logo SVG -->
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                    <path d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  class="social-btn microsoft-btn"
                  (click)="socialLogin('microsoft')"
                  [disabled]="authService.isLoading()"
                  aria-label="Sign in with Microsoft"
                  type="button">
                  <!-- Microsoft four-square logo SVG -->
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                    <path d="M0 0h8.571v8.571H0z" fill="#F25022"/>
                    <path d="M9.429 0H18v8.571H9.429z" fill="#7FBA00"/>
                    <path d="M0 9.429h8.571V18H0z" fill="#00A4EF"/>
                    <path d="M9.429 9.429H18V18H9.429z" fill="#FFB900"/>
                  </svg>
                  <span>Microsoft</span>
                </button>
              </div>

              @if (socialMessage()) {
                <div class="info-message" role="status" aria-live="polite">
                  <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                  {{ socialMessage() }}
                </div>
              }

              <!-- Regional Health ID Login -->
              <div class="regional-divider" role="separator" aria-label="Regional health identity login">
                <span>Regional Health ID Login</span>
              </div>

              <div class="regional-buttons" aria-label="Regional health identity sign-in options">

                <!-- IHI via myGov (Australia) -->
                <button
                  class="regional-btn ihi-btn"
                  (click)="regionalHealthLogin('ihi')"
                  [disabled]="authService.isLoading()"
                  aria-label="Sign in with Australian IHI via myGov"
                  type="button">
                  <span class="flag-icon" aria-hidden="true">
                    <!-- Australian flag: blue, Union Jack + stars -->
                    <svg width="22" height="15" viewBox="0 0 22 15" focusable="false" aria-hidden="true">
                      <rect width="22" height="15" fill="#00008B"/>
                      <rect x="0" y="0" width="8" height="6" fill="#00008B"/>
                      <line x1="0" y1="0" x2="8" y2="6" stroke="white" stroke-width="1.5"/>
                      <line x1="8" y1="0" x2="0" y2="6" stroke="white" stroke-width="1.5"/>
                      <line x1="4" y1="0" x2="4" y2="6" stroke="white" stroke-width="2"/>
                      <line x1="0" y1="3" x2="8" y2="3" stroke="white" stroke-width="2"/>
                      <line x1="0" y1="0" x2="8" y2="6" stroke="#CC0000" stroke-width="0.8"/>
                      <line x1="8" y1="0" x2="0" y2="6" stroke="#CC0000" stroke-width="0.8"/>
                    </svg>
                  </span>
                  <div class="regional-btn-text">
                    <span class="regional-btn-title">IHI via myGov</span>
                    <span class="regional-btn-sub">Australia</span>
                  </div>
                </button>

                <!-- CNP / eID (Romania) -->
                <button
                  class="regional-btn cnp-btn"
                  (click)="regionalHealthLogin('cnp')"
                  [disabled]="authService.isLoading()"
                  aria-label="Sign in with Romanian CNP / eID"
                  type="button">
                  <span class="flag-icon" aria-hidden="true">
                    <!-- Romanian flag: blue, yellow, red vertical bands -->
                    <svg width="22" height="15" viewBox="0 0 22 15" focusable="false" aria-hidden="true">
                      <rect x="0"  y="0" width="7.33" height="15" fill="#002B7F"/>
                      <rect x="7.33" y="0" width="7.34" height="15" fill="#FCD116"/>
                      <rect x="14.67" y="0" width="7.33" height="15" fill="#CE1126"/>
                    </svg>
                  </span>
                  <div class="regional-btn-text">
                    <span class="regional-btn-title">CNP / eID</span>
                    <span class="regional-btn-sub">Romania</span>
                  </div>
                </button>

              </div>

              @if (regionalMessage()) {
                <div class="info-message regional-status-msg" role="status" aria-live="polite">
                  @if (regionalSuccess()) {
                    <i class="pi pi-check-circle" aria-hidden="true"></i>
                  } @else {
                    <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                  }
                  {{ regionalMessage() }}
                </div>
              }
            </div>
          }

          <!-- PHONE OTP PANEL (Feature 6.1) -->
          @if (loginMode() === 'phone') {
            <div id="phone-panel" role="tabpanel" aria-labelledby="phone-tab">

              @if (!otpSent()) {
                <!-- Step 1: Enter phone number -->
                <div class="field">
                  <label for="phone-number">Mobile phone number</label>
                  <input
                    #phoneInput
                    id="phone-number"
                    type="tel"
                    pInputText
                    [(ngModel)]="phoneNumber"
                    placeholder="10-digit number"
                    class="w-full"
                    aria-required="true"
                    [attr.aria-describedby]="phoneErrorMessage() ? 'phone-error' : null"
                    aria-label="Mobile phone number"
                    autocomplete="tel"
                    (keydown.enter)="sendPhoneOtp()" />
                </div>

                @if (phoneErrorMessage()) {
                  <div id="phone-error" class="error-message" role="alert" aria-live="assertive">
                    <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                    {{ phoneErrorMessage() }}
                  </div>
                }

                <button
                  pButton
                  label="Send OTP"
                  icon="pi pi-send"
                  class="w-full"
                  [loading]="authService.isLoading()"
                  (click)="sendPhoneOtp()"
                  aria-label="Send one-time passcode to your phone"
                  aria-describedby="phone-number"></button>

                <p class="phone-hint" aria-live="polite">
                  A 6-digit verification code will be sent to your mobile number.
                </p>
              }

              @if (otpSent()) {
                <!-- Step 2: Enter OTP code -->
                <div class="otp-sent-notice" role="status" aria-live="polite">
                  <i class="pi pi-check-circle" aria-hidden="true"></i>
                  Code sent to {{ maskedPhone() }}
                </div>

                <div class="field">
                  <label for="phone-otp">6-digit verification code</label>
                  <input
                    #otpInput
                    id="phone-otp"
                    type="text"
                    inputmode="numeric"
                    pInputText
                    [(ngModel)]="phoneOtp"
                    placeholder="123456"
                    class="w-full otp-text-input"
                    maxlength="6"
                    aria-required="true"
                    [attr.aria-describedby]="phoneOtpErrorMessage() ? 'otp-error' : 'otp-hint'"
                    aria-label="6-digit verification code"
                    autocomplete="one-time-code"
                    (keydown.enter)="verifyPhoneOtp()" />
                  <small id="otp-hint" class="field-hint">Enter the 6-digit code from your SMS</small>
                </div>

                @if (phoneOtpErrorMessage()) {
                  <div id="otp-error" class="error-message" role="alert" aria-live="assertive">
                    <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
                    {{ phoneOtpErrorMessage() }}
                  </div>
                }

                <button
                  pButton
                  label="Verify"
                  icon="pi pi-check"
                  class="w-full"
                  [loading]="authService.isLoading()"
                  (click)="verifyPhoneOtp()"
                  aria-label="Verify the one-time passcode"></button>

                <button
                  pButton
                  label="Change number"
                  class="p-button-text w-full mt-1"
                  icon="pi pi-arrow-left"
                  (click)="resetPhoneOtp()"
                  aria-label="Go back and change phone number"></button>
              }
            </div>
          }
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
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--teal-600) 0%, var(--teal-800) 100%);
      padding: 1rem;
      position: relative;
    }

    /* Theme switcher — same as shell topbar */
    .theme-switcher {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .theme-label {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .theme-buttons {
      display: flex;
      gap: 0.25rem;
      background: var(--surface-100);
      border-radius: 20px;
      padding: 2px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .theme-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border: none;
      border-radius: 18px;
      background: transparent;
      color: var(--text-color-secondary);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
      white-space: nowrap;
    }

    .theme-btn.active {
      background: var(--surface-card);
      color: var(--primary-color);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      font-weight: 600;
    }

    .theme-btn:hover:not(.active) {
      color: var(--text-color);
    }

    .theme-btn-label {
      display: inline;
    }

    @media (max-width: 640px) {
      .theme-btn-label {
        display: none;
      }
      .theme-btn {
        padding: 0.375rem 0.625rem;
      }
      .theme-label {
        display: none;
      }
    }
    :host ::ng-deep .login-card { width: 100%; max-width: 440px; }
    .login-header { text-align: center; padding: 2rem 2rem 1rem; }
    .logo { display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 1.5rem; font-weight: 700; color: var(--teal-600); margin-bottom: 1rem; }
    .logo i { font-size: 2rem; }
    .login-header h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
    .login-header p { margin: 0; color: var(--text-color-secondary); }
    .login-form { padding: 0 1rem; }
    .field { margin-bottom: 1.25rem; }
    .field label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .field-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .field-checkbox { display: flex; align-items: center; gap: 0.5rem; }
    .forgot-password-link { font-size: 0.875rem; color: var(--primary-600); text-decoration: none; cursor: pointer; }
    .forgot-password-link:hover { text-decoration: underline; }
    .error-message { background: var(--red-50); color: var(--red-700); padding: 0.75rem; border-radius: var(--border-radius); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .info-message { background: var(--blue-50); color: var(--blue-700); padding: 0.75rem; border-radius: var(--border-radius); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .lockout-message { background: var(--orange-50); border: 1px solid var(--orange-200); color: var(--orange-800); padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1.5rem; display: flex; align-items: flex-start; gap: 0.75rem; }
    .lockout-message i { font-size: 1.5rem; margin-top: 0.125rem; }
    .lockout-message strong { display: block; margin-bottom: 0.25rem; }
    .lockout-message p { margin: 0; font-size: 0.875rem; }
    .demo-credentials { margin-top: 1.5rem; text-align: center; padding: 1rem; background: var(--surface-50); border-radius: var(--border-radius); }
    .demo-credentials p { margin: 0 0 0.75rem; font-size: 0.875rem; }
    .demo-buttons { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
    .demo-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      border: 1px solid var(--surface-border, #d1d5db);
      border-radius: 0.5rem;
      background: var(--surface-card, #fff);
      color: var(--text-color, #374151);
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .demo-btn:hover {
      background: var(--primary-color, #14b8a6);
      color: white;
      border-color: var(--primary-color, #14b8a6);
    }
    .trust-badges { display: flex; justify-content: center; gap: 1.5rem; padding: 1rem; border-top: 1px solid var(--surface-border); }
    .trust-badges span { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-color-secondary); }
    .w-full { width: 100%; }
    .mt-1 { margin-top: 0.5rem; }

    /* Feature 6.1: Login mode tabs */
    .mode-tabs {
      display: flex;
      gap: 0;
      margin-bottom: 1.5rem;
      border-radius: var(--border-radius);
      background: var(--surface-100);
      padding: 3px;
    }
    .mode-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: calc(var(--border-radius) - 2px);
      background: transparent;
      color: var(--text-color-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .mode-tab.active {
      background: var(--surface-card);
      color: var(--primary-color);
      box-shadow: 0 1px 4px rgba(0,0,0,0.12);
    }
    .mode-tab:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    /* Feature 6.2: Social login */
    .social-divider {
      position: relative;
      text-align: center;
      margin: 1.25rem 0 1rem;
    }
    .social-divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--surface-border);
    }
    .social-divider span {
      position: relative;
      background: var(--surface-card);
      padding: 0 0.75rem;
      font-size: 0.8rem;
      color: var(--text-color-secondary);
    }
    .social-buttons {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }
    .social-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 0.6rem 1rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      background: #ffffff;
      color: #3c3c3c;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: box-shadow 0.15s ease, border-color 0.15s ease;
    }
    .social-btn:hover:not(:disabled) {
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      border-color: var(--surface-400);
    }
    .social-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .social-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .google-btn:hover:not(:disabled) { border-color: #4285F4; }
    .microsoft-btn:hover:not(:disabled) { border-color: #00A4EF; }

    /* Regional Health ID Login */
    .regional-divider {
      position: relative;
      text-align: center;
      margin: 1rem 0 0.875rem;
    }
    .regional-divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--surface-border);
    }
    .regional-divider span {
      position: relative;
      background: var(--surface-card);
      padding: 0 0.75rem;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-color-secondary);
    }
    .regional-buttons {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }
    .regional-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0.625rem;
      padding: 0.6rem 0.875rem;
      border: 1.5px solid var(--surface-border);
      border-radius: var(--border-radius);
      background: var(--surface-card);
      color: var(--text-color);
      font-family: inherit;
      cursor: pointer;
      transition: box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
      text-align: left;
    }
    .regional-btn:hover:not(:disabled) {
      box-shadow: 0 2px 8px rgba(0,0,0,0.10);
    }
    .regional-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    .regional-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .ihi-btn { border-color: #00843D; }
    .ihi-btn:hover:not(:disabled) {
      border-color: #00843D;
      background: #f0fff4;
    }
    .cnp-btn { border-color: #002B7F; }
    .cnp-btn:hover:not(:disabled) {
      border-color: #CE1126;
      background: #fff8f8;
    }
    .flag-icon {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      border-radius: 2px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .regional-btn-text {
      display: flex;
      flex-direction: column;
      gap: 0;
      line-height: 1.2;
    }
    .regional-btn-title {
      font-size: 0.82rem;
      font-weight: 600;
    }
    .regional-btn-sub {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      font-weight: 400;
    }
    .regional-status-msg {
      margin-top: 0.5rem;
    }
    .regional-status-msg .pi-check-circle {
      color: var(--green-600);
    }

    /* Feature 6.1 phone panel */
    .phone-hint {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      text-align: center;
      margin-top: 0.75rem;
    }
    .otp-sent-notice {
      background: var(--green-50);
      color: var(--green-700);
      padding: 0.75rem;
      border-radius: var(--border-radius);
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    :host ::ng-deep .otp-text-input,
    .otp-text-input {
      text-align: center !important;
      letter-spacing: 0.25em;
      font-size: 1.25rem;
      font-weight: 600;
    }
    .field-hint {
      display: block;
      margin-top: 0.375rem;
      font-size: 0.775rem;
      color: var(--text-color-secondary);
    }

    /* BFF SSO button — shown when served via patient-portal-bff */
    .sso-only {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.5rem 0 1rem;
    }
    .sso-button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem 1rem;
      background: var(--teal-700, #0f766e);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms ease;
      font-family: inherit;
    }
    .sso-button:hover { background: var(--teal-600, #0d9488); }
    .sso-button i { font-size: 1.1rem; }
    .sso-hint {
      font-size: 0.85rem;
      line-height: 1.4;
      text-align: center;
      margin: 0;
      color: var(--text-color-secondary);
    }
  `]
})
export class LoginComponent implements AfterViewInit {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly passkeyService = inject(PasskeyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /**
   * Auto-navigate away from the login page once BFF cookie auth succeeds.
   * AuthService.tryBootstrapBffSession() resolves asynchronously after the
   * component is constructed; when isAuthenticated flips to true we redirect
   * to wherever the route guard wanted to send the user.
   */
  private readonly _redirectWhenAuthed = effect(() => {
    if (this.authService.isAuthenticated()) {
      const returnUrl =
        this.route.snapshot.queryParamMap.get('returnUrl') ??
        this.route.snapshot.queryParamMap.get('return_to') ??
        '/dashboard';
      this.router.navigateByUrl(returnUrl);
    }
  });

  /**
   * True when the portal is served via the patient-portal-bff (port 4611).
   * On the BFF the legacy password-login route is removed; show the SSO
   * button only. On the direct frontend (port 4201) keep the legacy form.
   */
  readonly showSsoOption = typeof window !== 'undefined' &&
    !!window.location.port &&
    window.location.port === '4611';

  /** Kicks off the BFF OIDC flow. The BFF intercepts /login server-side
   *  and 302s to ZITADEL; after sign-in ZITADEL redirects back to the BFF
   *  callback, the BFF sets aura_bff_session cookie and 302s to /. */
  signInWithSSO(): void {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = '/login?return_to=' + returnTo;
  }

  // Email login
  email = '';
  password = '';
  rememberMe = false;
  errorMessage = signal<string | null>(null);
  forgotPasswordMessage = signal<string | null>(null);
  socialMessage = signal<string | null>(null);

  /** Drives the visibility of the "Sign in with passkey" button. */
  readonly passkeySupported = this.passkeyService.isSupported();
  readonly isPasskeyLoading = signal(false);

  /** Discoverable passkey login. Browser shows every passkey saved
   *  for this RP; user picks; we hand the resulting tokens to
   *  AuthService.applyPasskeyLogin which fetches /auth/me to
   *  hydrate patientId+mrn and flips the auth state. */
  signInWithPasskey(): void {
    if (this.isPasskeyLoading() || this.authService.isLoading()) return;
    this.isPasskeyLoading.set(true);
    this.passkeyService.loginWithPasskey().subscribe({
      next: async (response) => {
        const result = await this.authService.applyPasskeyLogin({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        this.isPasskeyLoading.set(false);
        if (!result.success) {
          this.errorMessage.set(result.error ?? 'Passkey login failed.');
        }
      },
      error: (err: any) => {
        this.isPasskeyLoading.set(false);
        if (err?.cancelled) return; // user dismissed the OS prompt
        this.errorMessage.set(err?.message ?? err?.error?.error?.message ?? 'No matching passkey found.');
      },
    });
  }

  // Regional Health ID login signals
  regionalMessage = signal<string | null>(null);
  regionalSuccess = signal(false);

  // Feature 6.1: Phone OTP signals
  loginMode = signal<'email' | 'phone'>('email');
  phoneNumber = signal('');
  otpSent = signal(false);
  phoneOtp = signal('');
  phoneErrorMessage = signal<string | null>(null);
  phoneOtpErrorMessage = signal<string | null>(null);

  // Template ref for auto-focus
  @ViewChild('emailInput') emailInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('phoneInput') phoneInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('otpInput') otpInputRef?: ElementRef<HTMLInputElement>;

  // Computed masked phone for display
  maskedPhone = computed(() => {
    const digits = this.phoneNumber().replace(/\D/g, '');
    if (digits.length === 10) {
      return `(***) ***-${digits.slice(6)}`;
    }
    return this.phoneNumber();
  });

  ngAfterViewInit(): void {
    // Feature 6.5: Auto-focus first input on load
    setTimeout(() => {
      this.emailInputRef?.nativeElement?.focus();
    }, 100);
  }

  setLoginMode(mode: 'email' | 'phone'): void {
    this.loginMode.set(mode);
    this.errorMessage.set(null);
    this.forgotPasswordMessage.set(null);
    this.phoneErrorMessage.set(null);
    this.phoneOtpErrorMessage.set(null);
    // Auto-focus first input of newly selected tab
    setTimeout(() => {
      if (mode === 'email') {
        this.emailInputRef?.nativeElement?.focus();
      } else {
        this.phoneInputRef?.nativeElement?.focus();
      }
    }, 50);
  }

  // ---- Email login ----

  async login(): Promise<void> {
    this.errorMessage.set(null);
    this.forgotPasswordMessage.set(null);
    const result = await this.authService.login(this.email, this.password);
    if (!result.success) {
      this.errorMessage.set(result.error || 'Login failed');
    }
  }

  useDemoCredentials(): void {
    this.email = 'patient@demo.com';
    this.password = 'demo123';
  }

  fillCredentials(email: string): void {
    this.email = email;
    this.password = 'admin123';
  }

  showForgotPassword(): void {
    this.forgotPasswordMessage.set('Password reset instructions have been sent to your email address.');
    setTimeout(() => this.forgotPasswordMessage.set(null), 5000);
  }

  // ---- Feature 6.2: Social login ----

  async socialLogin(provider: string): Promise<void> {
    this.socialMessage.set(`Connecting to ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`);
    const result = await this.authService.socialLogin(provider);
    if (!result.success) {
      this.socialMessage.set(null);
      this.errorMessage.set(`${provider} sign-in failed. Please try again.`);
    }
    // On success the router navigates away; clear message anyway
    this.socialMessage.set(null);
  }

  // ---- Regional Health ID Login (IHI / CNP) ----

  async regionalHealthLogin(type: 'ihi' | 'cnp'): Promise<void> {
    this.regionalSuccess.set(false);
    const redirectMsg = type === 'ihi'
      ? 'Redirecting to myGov...'
      : 'Redirecting to eID portal...';
    this.regionalMessage.set(redirectMsg);

    const result = await this.authService.loginWithHealthId(type);
    if (result.success) {
      const successMsg = type === 'ihi'
        ? 'IHI Verified — Welcome back, Alex Johnson'
        : 'eID Verified — Welcome back, Alex Johnson';
      this.regionalSuccess.set(true);
      this.regionalMessage.set(successMsg);
      // Router will navigate; message clears on component destroy
    } else {
      this.regionalMessage.set(null);
      this.errorMessage.set('Regional identity verification failed. Please try again.');
    }
  }

  // ---- Feature 6.1: Phone OTP ----

  get phoneNumberValue(): string {
    return this.phoneNumber();
  }

  set phoneNumberValue(val: string) {
    this.phoneNumber.set(val);
  }

  get phoneOtpValue(): string {
    return this.phoneOtp();
  }

  set phoneOtpValue(val: string) {
    this.phoneOtp.set(val);
  }

  async sendPhoneOtp(): Promise<void> {
    this.phoneErrorMessage.set(null);
    const result = await this.authService.sendPhoneOtp(this.phoneNumber());
    if (result.success) {
      this.otpSent.set(true);
      // Auto-focus OTP input after state update
      setTimeout(() => this.otpInputRef?.nativeElement?.focus(), 100);
    } else {
      this.phoneErrorMessage.set(result.error || 'Failed to send OTP.');
    }
  }

  async verifyPhoneOtp(): Promise<void> {
    this.phoneOtpErrorMessage.set(null);
    const result = await this.authService.loginWithPhone(this.phoneNumber(), this.phoneOtp());
    if (!result.success) {
      this.phoneOtpErrorMessage.set(result.error || 'Verification failed.');
    }
  }

  resetPhoneOtp(): void {
    this.otpSent.set(false);
    this.phoneOtp.set('');
    this.phoneOtpErrorMessage.set(null);
    setTimeout(() => this.phoneInputRef?.nativeElement?.focus(), 50);
  }
}
