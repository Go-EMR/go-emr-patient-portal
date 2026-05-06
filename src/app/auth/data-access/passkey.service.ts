import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, from, switchMap, throwError, catchError, defer } from 'rxjs';
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
} from '@simplewebauthn/browser';

/** PasskeyLoginResult — same shape every product's identity-bundle login
 *  returns (accessToken, refreshToken, user, affiliations). The portal's
 *  AuthService maps this onto its local user model. */
export interface PasskeyLoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: any;
  affiliations?: any[];
}

export interface PasskeyCredentialView {
  id: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt?: string;
}

/**
 * PasskeyService — patient-portal copy of the GoEMR shell's
 * PasskeyService. Hits /api/v1/portal/auth/passkey/* on the
 * patient-portal-api, which mounts the same identity-bundle
 * passkey handler the EMR uses. Single RP across the suite means
 * a passkey enrolled here works on the EMR side and vice-versa.
 *
 * @see /root/Projects/go-emr/go-emr-fe/src/app/core/auth/passkey.service.ts
 *      for the canonical version + extensive doc comments.
 */
@Injectable({ providedIn: 'root' })
export class PasskeyService {
  private readonly http = inject(HttpClient);
  /** Override via env if your patient-portal mounts under a different prefix. */
  private readonly api = '/api/v1/portal/auth/passkey';

  isSupported(): boolean { return browserSupportsWebAuthn(); }
  async isAutofillSupported(): Promise<boolean> { return browserSupportsWebAuthnAutofill(); }

  registerPasskey(deviceName: string = ''): Observable<void> {
    return this.http.post(`${this.api}/register/begin`, null, { observe: 'response' }).pipe(
      switchMap((res: HttpResponse<unknown>) => {
        const sid = res.headers.get('X-Passkey-Session');
        if (!sid) return throwError(() => new Error('Missing X-Passkey-Session'));
        const options = (res.body as any).publicKey;
        return defer(() => from(startRegistration({ optionsJSON: options }))).pipe(
          switchMap((attestation) =>
            this.http.post(`${this.api}/register/finish`,
              { deviceName, response: attestation },
              { headers: { 'X-Passkey-Session': sid } }),
          ),
        );
      }),
      switchMap(() => from([void 0])),
      catchError(this.translateError),
    );
  }

  loginWithPasskey(email?: string): Observable<PasskeyLoginResult> {
    return this.http.post(`${this.api}/login/begin`,
      { email: email ?? '' }, { observe: 'response' },
    ).pipe(
      switchMap((res: HttpResponse<unknown>) => {
        const sid = res.headers.get('X-Passkey-Session');
        if (!sid) return throwError(() => new Error('Missing X-Passkey-Session'));
        const options = (res.body as any).publicKey;
        return defer(() => from(startAuthentication({ optionsJSON: options }))).pipe(
          switchMap((assertion) =>
            this.http.post<PasskeyLoginResult>(`${this.api}/login/finish`,
              assertion,
              { headers: { 'X-Passkey-Session': sid } }),
          ),
        );
      }),
      catchError(this.translateError),
    );
  }

  listMyPasskeys(): Observable<PasskeyCredentialView[]> {
    return this.http.get<PasskeyCredentialView[]>(`${this.api}/credentials`);
  }

  renamePasskey(id: string, deviceName: string): Observable<void> {
    return this.http.patch<void>(`${this.api}/credentials/${id}`, { deviceName });
  }

  revokePasskey(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/credentials/${id}`);
  }

  private translateError = (err: unknown) => {
    if (err instanceof Error) {
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        return throwError(() => ({ cancelled: true, message: err.message }));
      }
      if (err.name === 'InvalidStateError') {
        return throwError(() => ({ message: 'Passkey already registered.' }));
      }
    }
    return throwError(() => err);
  };
}
