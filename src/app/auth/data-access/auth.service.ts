import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { PatientUser } from '../../shared/data-access';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<PatientUser | null>(null);
  private _isAuthenticated = signal(false);
  private _mfaRequired = signal(false);
  private _mfaVerified = signal(false);
  private _isLoading = signal(false);

  // Lockout tracking
  private _failedAttempts = signal(0);
  private _lockoutUntil = signal<number | null>(null);

  // Role management (Feature 6.3)
  private _role = signal<'patient' | 'caregiver' | 'proxy'>('patient');

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly mfaRequired = this._mfaRequired.asReadonly();
  readonly mfaVerified = this._mfaVerified.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly failedAttempts = this._failedAttempts.asReadonly();
  readonly lockoutUntil = this._lockoutUntil.asReadonly();
  readonly role = this._role.asReadonly();

  readonly isLockedOut = computed(() => {
    const until = this._lockoutUntil();
    return until !== null && Date.now() < until;
  });

  readonly lockoutRemainingMs = computed(() => {
    const until = this._lockoutUntil();
    if (until === null) return 0;
    return Math.max(0, until - Date.now());
  });

  readonly isFullyAuthenticated = computed(() =>
    this._isAuthenticated() && (!this._mfaRequired() || this._mfaVerified())
  );

  constructor(private router: Router) {
    this.checkStoredSession();
    this.checkStoredLockout();
  }

  private checkStoredSession(): void {
    const stored = localStorage.getItem('portal_session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (session.expiresAt > Date.now()) {
          this._user.set(session.user);
          this._isAuthenticated.set(true);
          this._mfaRequired.set(session.user.mfaEnabled);
          this._mfaVerified.set(session.mfaVerified);
          if (session.role) {
            this._role.set(session.role);
          }
        } else {
          this.clearSession();
        }
      } catch { this.clearSession(); }
    }
  }

  private checkStoredLockout(): void {
    const stored = localStorage.getItem('portal_lockout');
    if (stored) {
      try {
        const lockout = JSON.parse(stored);
        if (lockout.until > Date.now()) {
          this._lockoutUntil.set(lockout.until);
          this._failedAttempts.set(lockout.attempts);
        } else {
          localStorage.removeItem('portal_lockout');
        }
      } catch { localStorage.removeItem('portal_lockout'); }
    }
  }

  /** Builds the standard demo PatientUser object */
  private buildDemoUser(): PatientUser {
    return {
      id: 'USR-001', patientId: 'PAT-001', mrn: 'MRN-12345',
      firstName: 'John', lastName: 'Smith',
      email: 'patient@demo.com', phone: '(555) 123-4567',
      dateOfBirth: new Date('1980-05-15'),
      portalActivatedAt: new Date(), mfaEnabled: true, mfaVerified: false,
      role: 'patient',
      preferences: { language: 'en', timezone: 'America/New_York', paperlessStatements: true }
    };
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (this.isLockedOut()) {
      const mins = Math.ceil(this.lockoutRemainingMs() / 60000);
      return { success: false, error: `Account locked. Try again in ${mins} minute(s).` };
    }

    this._isLoading.set(true);
    try {
      await new Promise(r => setTimeout(r, 800));

      if (email === 'patient@demo.com' && password === 'demo123') {
        const user = this.buildDemoUser();

        this._user.set(user);
        this._isAuthenticated.set(true);
        this._mfaRequired.set(user.mfaEnabled);
        this._mfaVerified.set(false);
        this._failedAttempts.set(0);
        this._lockoutUntil.set(null);
        localStorage.removeItem('portal_lockout');

        this.saveSession(false);

        if (user.mfaEnabled) {
          this.router.navigate(['/mfa']);
        } else {
          this.router.navigate(['/dashboard']);
        }

        return { success: true };
      }

      // Track failed attempt
      const attempts = this._failedAttempts() + 1;
      this._failedAttempts.set(attempts);

      if (attempts >= 5) {
        const lockoutUntil = Date.now() + 15 * 60 * 1000;
        this._lockoutUntil.set(lockoutUntil);
        localStorage.setItem('portal_lockout', JSON.stringify({ until: lockoutUntil, attempts }));
        return { success: false, error: 'Too many failed attempts. Account locked for 15 minutes.' };
      }

      return { success: false, error: `Invalid credentials. ${5 - attempts} attempt(s) remaining.` };
    } finally {
      this._isLoading.set(false);
    }
  }

  /** Feature 6.1: Phone OTP login - sends an OTP to the given phone number (mocked). */
  async sendPhoneOtp(phone: string): Promise<{ success: boolean; error?: string }> {
    this._isLoading.set(true);
    try {
      await new Promise(r => setTimeout(r, 700));
      // Mock: any 10-digit phone number is accepted
      const digits = phone.replace(/\D/g, '');
      if (digits.length !== 10) {
        return { success: false, error: 'Please enter a valid 10-digit phone number.' };
      }
      return { success: true };
    } finally {
      this._isLoading.set(false);
    }
  }

  /** Feature 6.1: Verify OTP and complete phone-based login (mocked). */
  async loginWithPhone(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
    this._isLoading.set(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      // Mock: any 6-digit OTP passes
      if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        return { success: false, error: 'Please enter a valid 6-digit code.' };
      }

      const user = this.buildDemoUser();
      this._user.set(user);
      this._isAuthenticated.set(true);
      this._mfaRequired.set(false);
      this._mfaVerified.set(true);
      this.saveSession(true);
      this.router.navigate(['/dashboard']);
      return { success: true };
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Regional Health ID login — supports Australian IHI via myGov and
   * Romanian CNP / eID.  Both flows skip MFA as identity is verified
   * externally by the respective national identity system.
   */
  async loginWithHealthId(type: 'ihi' | 'cnp'): Promise<{ success: boolean; error?: string }> {
    this._isLoading.set(true);
    try {
      // Simulate redirect round-trip delay (1.5 s)
      await new Promise(r => setTimeout(r, 1500));
      const user = this.buildDemoUser();
      this._user.set(user);
      this._isAuthenticated.set(true);
      this._mfaRequired.set(false);
      this._mfaVerified.set(true);
      this.saveSession(true);
      this.router.navigate(['/dashboard']);
      return { success: true };
    } finally {
      this._isLoading.set(false);
    }
  }

  /** Feature 6.2: Social login (Google / Microsoft) - skips MFA entirely. */
  async socialLogin(provider: string): Promise<{ success: boolean; error?: string }> {
    this._isLoading.set(true);
    try {
      await new Promise(r => setTimeout(r, 900));
      const user = this.buildDemoUser();
      this._user.set(user);
      this._isAuthenticated.set(true);
      this._mfaRequired.set(false);
      this._mfaVerified.set(true);
      this.saveSession(true);
      this.router.navigate(['/dashboard']);
      return { success: true };
    } finally {
      this._isLoading.set(false);
    }
  }

  /** Feature 6.3: Update the active session role. */
  setRole(role: 'patient' | 'caregiver' | 'proxy'): void {
    this._role.set(role);
    // Persist role in session
    const stored = localStorage.getItem('portal_session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        session.role = role;
        localStorage.setItem('portal_session', JSON.stringify(session));
      } catch { /* ignore */ }
    }
  }

  async verifyMfa(code: string): Promise<{ success: boolean; error?: string }> {
    this._isLoading.set(true);
    try {
      await new Promise(r => setTimeout(r, 500));

      if (code === '123456' || code.length === 6) {
        this._mfaVerified.set(true);
        this.saveSession(true);
        this.router.navigate(['/dashboard']);
        return { success: true };
      }

      return { success: false, error: 'Invalid code' };
    } finally {
      this._isLoading.set(false);
    }
  }

  async resendMfaCode(method: 'sms' | 'email'): Promise<boolean> {
    await new Promise(r => setTimeout(r, 300));
    return true;
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private saveSession(mfaVerified: boolean): void {
    const session = {
      user: this._user(),
      mfaVerified,
      role: this._role(),
      expiresAt: Date.now() + 30 * 60 * 1000
    };
    localStorage.setItem('portal_session', JSON.stringify(session));
  }

  private clearSession(): void {
    localStorage.removeItem('portal_session');
    this._user.set(null);
    this._isAuthenticated.set(false);
    this._mfaRequired.set(false);
    this._mfaVerified.set(false);
    this._role.set('patient');
  }
}
