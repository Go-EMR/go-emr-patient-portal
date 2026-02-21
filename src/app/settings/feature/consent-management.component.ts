import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DividerModule } from 'primeng/divider';
import { ConsentItem } from '../../shared/data-access';

@Component({
  selector: 'app-consent-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TagModule, InputSwitchModule, DividerModule],
  template: `
    <div class="consent-page">
      <header class="page-header">
        <h1>Consent Management</h1>
        <p>Review and manage your consents and data sharing preferences</p>
      </header>

      <!-- Required Consents -->
      <section class="consent-section">
        <div class="section-header">
          <h2>Required Consents</h2>
          <p-tag value="Mandatory" severity="danger"></p-tag>
        </div>
        <p class="section-subtitle">These consents are required to use the patient portal and cannot be revoked while your account is active.</p>

        <div class="consents-list">
          @for (consent of requiredConsents(); track consent.id) {
            <p-card styleClass="consent-card required-card">
              <div class="consent-layout">
                <div class="consent-icon required-icon">
                  <i class="pi pi-lock"></i>
                </div>
                <div class="consent-body">
                  <div class="consent-title-row">
                    <h3>{{ consent.name }}</h3>
                    <div class="consent-badges">
                      <p-tag [value]="'v' + consent.version" severity="secondary"></p-tag>
                      <p-tag value="Required" severity="danger"></p-tag>
                    </div>
                  </div>
                  <p class="consent-description">{{ consent.description }}</p>
                  @if (consent.grantedAt) {
                    <span class="granted-timestamp">
                      <i class="pi pi-check-circle"></i>
                      Accepted on {{ consent.grantedAt | date:'MMMM d, yyyy' }}
                    </span>
                  }
                </div>
                <div class="consent-toggle">
                  <p-inputSwitch [ngModel]="true" [disabled]="true"></p-inputSwitch>
                </div>
              </div>
            </p-card>
          }
        </div>
      </section>

      <p-divider></p-divider>

      <!-- Optional Consents -->
      <section class="consent-section">
        <div class="section-header">
          <h2>Optional Consents</h2>
          <p-tag value="Your Choice" severity="info"></p-tag>
        </div>
        <p class="section-subtitle">These consents are optional. You may enable or revoke them at any time without affecting your access to care.</p>

        <div class="consents-list">
          @for (consent of optionalConsents(); track consent.id) {
            <p-card styleClass="consent-card optional-card">
              <div class="consent-layout">
                <div class="consent-icon optional-icon">
                  <i class="pi pi-shield"></i>
                </div>
                <div class="consent-body">
                  <div class="consent-title-row">
                    <h3>{{ consent.name }}</h3>
                    <div class="consent-badges">
                      <p-tag [value]="'v' + consent.version" severity="secondary"></p-tag>
                      @if (consent.granted) {
                        <p-tag value="Active" severity="success"></p-tag>
                      } @else {
                        <p-tag value="Inactive" severity="secondary"></p-tag>
                      }
                    </div>
                  </div>
                  <p class="consent-description">{{ consent.description }}</p>
                  @if (consent.granted && consent.grantedAt) {
                    <span class="granted-timestamp">
                      <i class="pi pi-check-circle"></i>
                      Enabled on {{ consent.grantedAt | date:'MMMM d, yyyy' }}
                    </span>
                  }
                </div>
                <div class="consent-toggle">
                  <p-inputSwitch
                    [ngModel]="consent.granted"
                    (ngModelChange)="toggleConsent(consent.id, $event)"
                  ></p-inputSwitch>
                </div>
              </div>
            </p-card>
          }
        </div>
      </section>

      <div class="compliance-note">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>HIPAA Compliance Notice:</strong> Changes to your consent preferences are logged in your audit trail.
          Required consents are governed by applicable federal and state law and may not be withdrawn without terminating your portal account.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .consent-page { max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0; }
    .page-header p { color: var(--text-color-secondary); margin: 0.25rem 0 0; }
    .consent-section { margin-bottom: 1.5rem; }
    .section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .section-header h2 { margin: 0; font-size: 1.15rem; }
    .section-subtitle { color: var(--text-color-secondary); font-size: 0.875rem; margin: 0 0 1.25rem; line-height: 1.5; }
    .consents-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .consent-layout { display: flex; align-items: flex-start; gap: 1rem; }
    .consent-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
    .required-icon { background: var(--red-50); color: var(--red-500); }
    .optional-icon { background: var(--blue-50); color: var(--blue-500); }
    .consent-body { flex: 1; min-width: 0; }
    .consent-title-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.4rem; flex-wrap: wrap; }
    .consent-title-row h3 { margin: 0; font-size: 0.975rem; }
    .consent-badges { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .consent-description { margin: 0 0 0.5rem; font-size: 0.875rem; color: var(--text-color-secondary); line-height: 1.5; }
    .granted-timestamp { font-size: 0.8rem; color: var(--green-600); display: flex; align-items: center; gap: 0.35rem; }
    .granted-timestamp i { font-size: 0.8rem; }
    .consent-toggle { flex-shrink: 0; display: flex; align-items: center; padding-top: 0.15rem; }
    .required-card { border-left: 3px solid var(--red-400); }
    .optional-card { border-left: 3px solid var(--blue-400); }
    .compliance-note { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-color-secondary); line-height: 1.5; }
    .compliance-note i { color: var(--primary-500); font-size: 1rem; flex-shrink: 0; margin-top: 0.1rem; }
    @media (max-width: 600px) {
      .consent-layout { flex-wrap: wrap; }
      .consent-toggle { width: 100%; justify-content: flex-end; }
    }
  `]
})
export class ConsentManagementComponent {
  private _consents = signal<ConsentItem[]>([
    // Required consents
    {
      id: 'CON-001',
      name: 'HIPAA Notice of Privacy Practices',
      description: 'Acknowledgment that you have received and reviewed our Notice of Privacy Practices, which explains how we may use and disclose your protected health information.',
      version: '3.1',
      required: true,
      granted: true,
      grantedAt: new Date('2024-03-15')
    },
    {
      id: 'CON-002',
      name: 'Terms of Service',
      description: 'Agreement to the terms governing your use of the GoHealth patient portal, including acceptable use policies and your rights and responsibilities as a portal user.',
      version: '2.4',
      required: true,
      granted: true,
      grantedAt: new Date('2024-03-15')
    },
    {
      id: 'CON-003',
      name: 'Data Processing Agreement',
      description: 'Authorization for the processing of your personal health information necessary to provide portal services, maintain medical records, and coordinate your care.',
      version: '1.8',
      required: true,
      granted: true,
      grantedAt: new Date('2024-03-15')
    },
    // Optional consents
    {
      id: 'CON-004',
      name: 'Research Data Sharing',
      description: 'Allow de-identified health data to be used for medical research and population health studies. Your identity is never disclosed to researchers.',
      version: '1.2',
      required: false,
      granted: true,
      grantedAt: new Date('2024-04-01')
    },
    {
      id: 'CON-005',
      name: 'Marketing Communications',
      description: 'Receive personalized health tips, wellness newsletters, and information about new services from GoHealth. You may unsubscribe at any time.',
      version: '1.0',
      required: false,
      granted: false
    },
    {
      id: 'CON-006',
      name: 'Telehealth Services',
      description: 'Consent to receiving healthcare services via video or audio telecommunication, including acknowledgment of the limitations and risks of telehealth delivery.',
      version: '2.0',
      required: false,
      granted: true,
      grantedAt: new Date('2024-03-20')
    },
    {
      id: 'CON-007',
      name: 'Analytics & Quality Improvement',
      description: 'Allow usage data and portal interactions to be analyzed to improve system performance, user experience, and care quality metrics.',
      version: '1.1',
      required: false,
      granted: true,
      grantedAt: new Date('2024-03-15')
    },
    {
      id: 'CON-008',
      name: 'Third-Party Sharing',
      description: 'Allow sharing of relevant health information with integrated third-party applications you have authorized, such as fitness trackers and wellness platforms.',
      version: '1.3',
      required: false,
      granted: false
    },
    {
      id: 'CON-009',
      name: 'Data Localization Preference',
      description: 'Indicate your preference that your health data remain stored within your geographic region to the maximum extent permitted by applicable regulations.',
      version: '1.0',
      required: false,
      granted: false
    }
  ]);

  readonly requiredConsents = computed(() => this._consents().filter(c => c.required));
  readonly optionalConsents = computed(() => this._consents().filter(c => !c.required));

  toggleConsent(id: string, granted: boolean): void {
    this._consents.update(list =>
      list.map(c =>
        c.id === id
          ? { ...c, granted, grantedAt: granted ? new Date() : undefined }
          : c
      )
    );
  }
}
