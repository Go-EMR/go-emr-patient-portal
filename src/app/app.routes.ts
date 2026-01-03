import { Routes } from '@angular/router';
import { authGuard, mfaGuard, guestGuard } from './shared/utils';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./auth/feature/login.component').then(m => m.LoginComponent) },
  { path: 'mfa', loadComponent: () => import('./auth/feature/mfa.component').then(m => m.MfaComponent) },
  {
    path: '',
    canActivate: [authGuard, mfaGuard],
    loadComponent: () => import('./shell/feature/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./dashboard/feature/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'appointments', loadComponent: () => import('./appointments/feature/appointments.component').then(m => m.AppointmentsComponent) },
      { path: 'records', loadComponent: () => import('./health-records/feature/health-records.component').then(m => m.HealthRecordsComponent) },
      { path: 'messages', loadComponent: () => import('./messages/feature/messages.component').then(m => m.MessagesComponent) },
      { path: 'messages/:id', loadComponent: () => import('./messages/feature/messages.component').then(m => m.MessagesComponent) },
      { path: 'billing', loadComponent: () => import('./billing/feature/billing.component').then(m => m.BillingComponent) },
      { path: 'forms', loadComponent: () => import('./forms/feature/forms.component').then(m => m.FormsComponent) },
      { path: 'settings', loadComponent: () => import('./settings/feature/settings.component').then(m => m.SettingsComponent) }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
