import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, from, BehaviorSubject, filter, take } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * HTTP interceptor that automatically refreshes expired access tokens.
 *
 * Flow:
 * 1. Request fails with 401 → check if we have a refresh token
 * 2. Call POST /api/v1/portal/auth/refresh with the refresh token
 * 3. On success → store new tokens, retry the original request
 * 4. On failure → redirect to login
 *
 * Handles concurrent requests: while refreshing, queues other 401 requests
 * and retries them all once the new token arrives.
 */
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Don't intercept auth endpoints (login, refresh) to avoid loops.
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      const refreshToken = localStorage.getItem('portal_refresh');
      if (!refreshToken) {
        // No refresh token — force re-login.
        clearSessionAndRedirect(router);
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
          clearSessionAndRedirect(router);
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

/**
 * Clears stored session and redirects to login.
 */
function clearSessionAndRedirect(router: Router): void {
  localStorage.removeItem('portal_token');
  localStorage.removeItem('portal_refresh');
  localStorage.removeItem('portal_patient_id');
  localStorage.removeItem('portal_session');
  router.navigate(['/auth/login']);
}
