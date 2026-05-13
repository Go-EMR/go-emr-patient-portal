import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  private readonly http = inject(HttpClient);

  constructor(private router: Router) {
    this.checkStoredSession();
    this.checkStoredLockout();
  }

  private checkStoredSession(): void {
    // Try the new JWT-based session first (set after a real API login).
    const token = localStorage.getItem('portal_token');
    const patientId = localStorage.getItem('portal_patient_id');
    if (token && patientId) {
      // We have a live JWT — restore state from the stored user blob if present,
      // otherwise we'll hydrate from the profile API on next navigation.
      const stored = localStorage.getItem('portal_session');
      if (stored) {
        try {
          const session = JSON.parse(stored);
          if (session.expiresAt > Date.now()) {
            this._user.set(session.user);
            this._isAuthenticated.set(true);
            this._mfaRequired.set(false); // Real API logins skip MFA for now
            this._mfaVerified.set(true);
            if (session.role) {
              this._role.set(session.role);
            }
            return;
          }
        } catch { /* fall through to clearSession */ }
      }
      // Token exists but no valid session blob — treat as authenticated with
      // a minimal user; the dashboard will load the rest via API.
      this._isAuthenticated.set(true);
      this._mfaVerified.set(true);
      return;
    }

    // No valid JWT found — check for a previously saved API session blob.
    const stored = localStorage.getItem('portal_session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (session.expiresAt > Date.now() && session.user) {
          this._user.set(session.user);
          this._isAuthenticated.set(true);
          this._mfaRequired.set(false);
          this._mfaVerified.set(true);
          if (session.role) {
            this._role.set(session.role);
          }
          return;
        } else {
          this.clearSession();
        }
      } catch { this.clearSession(); }
    }

    // No JWT and no valid session blob — try the BFF cookie path. When the
    // browser is served via the patient-portal-bff (port 4611), ZITADEL has
    // already set an HttpOnly aura_bff_session cookie. A successful GET /me
    // means the BFF is present and the session is live; silently no-ops on 401.
    this.tryBootstrapBffSession();
  }

  /**
   * BFF cookie bootstrap: GET /api/v1/portal/auth/me with credentials. If a
   * valid aura_bff_session cookie is present the BFF proxies the request to
   * the portal-api /me endpoint and returns the PatientUser shape. On 200 we
   * populate auth state; on 401 we stay signed-out and the router will route
   * to /login, which the BFF intercepts and 302s to ZITADEL.
   */
  private tryBootstrapBffSession(): void {
    this.http
      .get<{
        patientId: string;
        mrn: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        dateOfBirth?: string;
        photoUrl?: string;
      }>('/api/v1/portal/auth/me', { withCredentials: true })
      .subscribe({
        next: (me) => {
          const user: PatientUser = {
            id: me.patientId || '',
            patientId: me.patientId || '',
            mrn: me.mrn || '',
            firstName: me.firstName || '',
            lastName: me.lastName || '',
            email: me.email || '',
            phone: me.phone,
            photoUrl: me.photoUrl,
            dateOfBirth: me.dateOfBirth ? new Date(me.dateOfBirth) : new Date(0),
            portalActivatedAt: new Date(),
            mfaEnabled: false,
            mfaVerified: true,
            role: 'patient',
            preferences: { language: 'en', timezone: 'UTC', paperlessStatements: true },
          };
          this._user.set(user);
          this._isAuthenticated.set(true);
          this._mfaRequired.set(false);
          this._mfaVerified.set(true);
        },
        error: () => {
          // 401 or network error — stay signed-out. The router will send the
          // user to /login, which the BFF rewrites to the OIDC authorize URL.
        },
      });
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

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (this.isLockedOut()) {
      const mins = Math.ceil(this.lockoutRemainingMs() / 60000);
      return { success: false, error: `Account locked. Try again in ${mins} minute(s).` };
    }

    this._isLoading.set(true);
    try {
      // --- Real API login ---
      try {
        const response = await fetch('/api/v1/portal/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (response.ok) {
          const data: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
            patientId: string;
            mrn: string;
            firstName: string;
            lastName: string;
            email: string;
          } = await response.json();

          // Persist JWT tokens for subsequent API calls.
          localStorage.setItem('portal_token', data.accessToken);
          localStorage.setItem('portal_refresh', data.refreshToken);
          localStorage.setItem('portal_patient_id', data.patientId);

          const user: PatientUser = {
            id: data.patientId,
            patientId: data.patientId,
            mrn: data.mrn || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || email,
            phone: '',
            dateOfBirth: new Date(0),
            portalActivatedAt: new Date(),
            mfaEnabled: false,
            mfaVerified: true,
            role: 'patient',
            preferences: { language: 'en', timezone: 'UTC', paperlessStatements: true }
          };

          this._user.set(user);
          this._isAuthenticated.set(true);
          this._mfaRequired.set(false);
          this._mfaVerified.set(true);
          this._failedAttempts.set(0);
          this._lockoutUntil.set(null);
          localStorage.removeItem('portal_lockout');

          this.saveSession(true);
          this.router.navigate(['/dashboard']);
          return { success: true };
        }

        // Non-2xx response — API login failed, fall through to error handling.
      } catch {
        // Network error or API unavailable.
      }

      // TODO: wire to backend API — remove when real auth is fully deployed
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

  /**
   * applyPasskeyLogin — public entry-point for the WebAuthn passkey
   * flow. PasskeyService verifies the assertion via the portal-api,
   * gets back identity tokens (no patientId yet), then calls this
   * with the {accessToken, refreshToken} pair. We persist the tokens
   * the same way the password flow does, fetch /auth/me to hydrate
   * patientId/mrn/etc., and flip the auth state so route guards pick
   * up the session immediately.
   */
  async applyPasskeyLogin(tokens: { accessToken: string; refreshToken: string }): Promise<{ success: boolean; error?: string }> {
    this._isLoading.set(true);
    try {
      localStorage.setItem('portal_token', tokens.accessToken);
      localStorage.setItem('portal_refresh', tokens.refreshToken);

      // Hydrate the portal-shaped user envelope.
      const meRes = await fetch('/api/v1/portal/auth/me', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (!meRes.ok) {
        return { success: false, error: 'Could not load profile after passkey login.' };
      }
      const me = await meRes.json() as {
        patientId: string; mrn: string;
        firstName: string; lastName: string; email: string;
      };
      if (me.patientId) {
        localStorage.setItem('portal_patient_id', me.patientId);
      }

      const user: PatientUser = {
        id: me.patientId || '',
        patientId: me.patientId || '',
        mrn: me.mrn || '',
        firstName: me.firstName || '',
        lastName: me.lastName || '',
        email: me.email || '',
        phone: '',
        dateOfBirth: new Date(0),
        portalActivatedAt: new Date(),
        mfaEnabled: false,
        mfaVerified: true,
        role: 'patient',
        preferences: { language: 'en', timezone: 'UTC', paperlessStatements: true },
      };

      this._user.set(user);
      this._isAuthenticated.set(true);
      this._mfaRequired.set(false);
      this._mfaVerified.set(true);
      this._failedAttempts.set(0);
      this._lockoutUntil.set(null);
      localStorage.removeItem('portal_lockout');

      this.saveSession(true);
      this.router.navigate(['/dashboard']);
      return { success: true };
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

  /** Feature 6.1: Verify OTP and complete phone-based login. */
  async loginWithPhone(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
    this._isLoading.set(true);
    try {
      // TODO: wire to /api/v1/portal/auth/phone/verify
      if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
        return { success: false, error: 'Please enter a valid 6-digit code.' };
      }
      return { success: false, error: 'Phone login requires backend API. Please use email/password.' };
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
      // TODO: wire to /api/v1/portal/auth/health-id with type parameter
      return { success: false, error: `Health ID login (${type}) requires backend API integration.` };
    } finally {
      this._isLoading.set(false);
    }
  }

  /** Feature 6.2: Social login (Google / Microsoft) - skips MFA entirely. */
  async socialLogin(provider: string): Promise<{ success: boolean; error?: string }> {
    this._isLoading.set(true);
    try {
      // TODO: wire to /api/v1/portal/auth/social/{provider} OAuth redirect
      return { success: false, error: `${provider} login requires backend OAuth integration.` };
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
    this.router.navigate(['/auth/login']);
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
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_refresh');
    localStorage.removeItem('portal_patient_id');
    this._user.set(null);
    this._isAuthenticated.set(false);
    this._mfaRequired.set(false);
    this._mfaVerified.set(false);
    this._role.set('patient');
  }
}
