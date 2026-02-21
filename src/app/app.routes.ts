import { Routes } from '@angular/router';
import { authGuard, mfaGuard, guestGuard } from './shared/utils';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'onboarding', loadComponent: () => import('./onboarding/feature/onboarding.component').then(m => m.OnboardingComponent) },
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
      { path: 'notifications', loadComponent: () => import('./notifications/feature/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'emergency-contacts', loadComponent: () => import('./settings/feature/emergency-contacts.component').then(m => m.EmergencyContactsComponent) },
      { path: 'consent-management', loadComponent: () => import('./settings/feature/consent-management.component').then(m => m.ConsentManagementComponent) },
      { path: 'data-management', loadComponent: () => import('./settings/feature/data-management.component').then(m => m.DataManagementComponent) },
      { path: 'privacy-policy', loadComponent: () => import('./settings/feature/privacy-policy.component').then(m => m.PrivacyPolicyComponent) },
      { path: 'settings', loadComponent: () => import('./settings/feature/settings.component').then(m => m.SettingsComponent) },
      { path: 'telehealth/:appointmentId', loadComponent: () => import('./telehealth/feature/telehealth.component').then(m => m.TelehealthComponent) },
      { path: 'telehealth', loadComponent: () => import('./telehealth/feature/telehealth.component').then(m => m.TelehealthComponent) },
      { path: 'symptom-checker', loadComponent: () => import('./symptom-checker/feature/symptom-checker.component').then(m => m.SymptomCheckerComponent) },
      { path: 'health-timeline', loadComponent: () => import('./health-timeline/feature/health-timeline.component').then(m => m.HealthTimelineComponent) },
      { path: 'lab-trends', loadComponent: () => import('./lab-trends/feature/lab-trends.component').then(m => m.LabTrendsComponent) },
      { path: 'prescriptions', loadComponent: () => import('./prescriptions/feature/prescriptions.component').then(m => m.PrescriptionsComponent) },
      { path: 'devices', loadComponent: () => import('./devices/feature/devices.component').then(m => m.DevicesComponent) },
      { path: 'insurance', loadComponent: () => import('./insurance/feature/insurance.component').then(m => m.InsuranceComponent) },
      { path: 'providers', loadComponent: () => import('./providers/feature/providers.component').then(m => m.ProvidersComponent) },
      { path: 'care-team', loadComponent: () => import('./care-team/feature/care-team.component').then(m => m.CareTeamComponent) }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
