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

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly mfaRequired = this._mfaRequired.asReadonly();
  readonly mfaVerified = this._mfaVerified.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly isFullyAuthenticated = computed(() => 
    this._isAuthenticated() && (!this._mfaRequired() || this._mfaVerified())
  );

  constructor(private router: Router) {
    this.checkStoredSession();
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
        } else {
          this.clearSession();
        }
      } catch { this.clearSession(); }
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this._isLoading.set(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      
      if (email === 'patient@demo.com' && password === 'demo123') {
        const user: PatientUser = {
          id: 'USR-001', patientId: 'PAT-001', mrn: 'MRN-12345',
          firstName: 'John', lastName: 'Smith',
          email: 'patient@demo.com', phone: '(555) 123-4567',
          dateOfBirth: new Date('1980-05-15'),
          portalActivatedAt: new Date(), mfaEnabled: true, mfaVerified: false,
          preferences: { language: 'en', timezone: 'America/New_York', paperlessStatements: true }
        };
        
        this._user.set(user);
        this._isAuthenticated.set(true);
        this._mfaRequired.set(user.mfaEnabled);
        this._mfaVerified.set(false);
        
        this.saveSession(false);
        
        if (user.mfaEnabled) {
          this.router.navigate(['/mfa']);
        } else {
          this.router.navigate(['/dashboard']);
        }
        
        return { success: true };
      }
      
      return { success: false, error: 'Invalid credentials' };
    } finally {
      this._isLoading.set(false);
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
  }
}
