import { ApplicationConfig, DEFAULT_CURRENCY_CODE, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenRefreshInterceptor } from './auth/data-access/token-refresh.interceptor';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([tokenRefreshInterceptor])),
    MessageService,
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'INR' },
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark-mode',
          cssLayer: { name: 'primeng', order: 'tailwind-base, primeng, tailwind-utilities' }
        }
      },
      ripple: true
    })
  ]
};
