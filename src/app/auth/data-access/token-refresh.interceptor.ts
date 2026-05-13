import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError, from, BehaviorSubject, filter, take } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * HTTP interceptor that:
 *   - Clones every request with `withCredentials: true` so the BFF's
 *     HttpOnly aura_bff_session cookie rides along automatically.
 *   - On the legacy JWT path: automatically refreshes expired access tokens.
 *
 * Flow (legacy JWT path):
 * 1. Request fails with 401 → check if we have a refresh token
 * 2. Call POST /api/v1/portal/auth/refresh with the refresh token
 * 3. On success → store new tokens, retry the original request
 * 4. On failure → bubble the error; the router/guard routes to /login
 *
 * Handles concurrent requests: while refreshing, queues other 401 requests
 * and retries them all once the new token arrives.
 *
 * BFF path: /auth/me, /auth/logout, /auth/refresh are excluded from the
 * 401-refresh cascade. A 401 on /auth/me means there is no BFF session
 * (not "token expired"), so retrying after refresh would just loop.
 */
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  // Always send cookies — the BFF path needs aura_bff_session to ride along.
  // The legacy direct-frontend path is unaffected: the portal-api ignores the
  // cookie when a Bearer header is present.
  req = req.clone({ withCredentials: true });

  // Endpoints where a 401 must NOT trigger the refresh cascade. On the BFF
  // path these are owned by the BFF; a 401 means there is no session at all.
  const noRefreshOn401 = [
    '/auth/login',
    '/auth/refresh',
    '/auth/me',
    '/auth/logout',
  ];

  if (noRefreshOn401.some(p => req.url.includes(p))) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      const refreshToken = localStorage.getItem('portal_refresh');
      if (!refreshToken) {
        // No refresh token (BFF cookie path or expired legacy session).
        // Don't call clearSessionAndRedirect — that would POST /logout which
        // would also 401 and loop. Just bubble; the router will send the
        // user to /login, which the BFF intercepts → OIDC redirect.
        return throwError(() => error);
      }

      if (isRefreshing) {
        // Another request is already refreshing — wait for the new token.
        return refreshTokenSubject.pipe(
          filter(token => token !== null),
          take(1),
          switchMap(token => next(addToken(req, token!)))
        );
      }

      isRefreshing = true;
      refreshTokenSubject.next(null);

      return from(doRefresh(refreshToken)).pipe(
        switchMap(newToken => {
          isRefreshing = false;
          refreshTokenSubject.next(newToken);
          return next(addToken(req, newToken));
        }),
        catchError(refreshErr => {
          isRefreshing = false;
          // Refresh failed — bubble the error; do NOT call
          // clearSessionAndRedirect() as that navigates to /login and
          // calling logout() in clearSession would POST /logout, which
          // would also 401 (no valid token) and create a loop on the BFF.
          return throwError(() => refreshErr);
        })
      );
    })
  );
};

/**
 * Calls the refresh endpoint and updates localStorage with new tokens.
 */
async function doRefresh(refreshToken: string): Promise<string> {
  const resp = await fetch('/api/v1/portal/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!resp.ok) {
    throw new Error('Token refresh failed');
  }

  const data: { accessToken: string; refreshToken: string; expiresIn: number } = await resp.json();

  localStorage.setItem('portal_token', data.accessToken);
  localStorage.setItem('portal_refresh', data.refreshToken);

  return data.accessToken;
}

/**
 * Clones the request with the new access token in the Authorization header.
 */
function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

