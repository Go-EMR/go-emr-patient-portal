import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConsentItem } from '../../shared/data-access';

interface AccessMapEntry {
  organization: string;
  categories: { name: string; granted: boolean }[];
}

interface AbdmArtifact {
  id: string;
  hospital: string;
  artifactId: string;
  purpose: string;
  validUntil: string;
}

interface HipaaAuthorization {
  id: string;
  authDate: string;
  recipient: string;
  purpose: string;
  expiresDate: string;
  revoked: boolean;
}

@Component({
  selector: 'app-consent-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MessageService],
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule, TagModule,
    ToggleSwitchModule, DividerModule, DatePickerModule, DialogModule, ToastModule
  ],
  template: `
    <p-toast position="top-right"></p-toast>

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
                  <p-toggleswitch [ngModel]="true" [disabled]="true"></p-toggleswitch>
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
                    <div class="granted-area">
                      <span class="granted-timestamp">
                        <i class="pi pi-check-circle"></i>
                        Enabled on {{ consent.grantedAt | date:'MMMM d, yyyy' }}
                      </span>

                      <!-- Expiry section -->
                      <div class="expiry-section">
                        @if (editingExpiryId() === consent.id) {
                          <!-- Inline date picker -->
                          <div class="expiry-picker-row">
                            <p-datepicker
                              [ngModel]="expiryDate()"
                              (ngModelChange)="expiryDate.set($event)"
                              [minDate]="today"
                              dateFormat="mm/dd/yy"
                              placeholder="Select expiry date"
                              [showIcon]="true"
                              inputStyleClass="expiry-calendar-input"
                            ></p-datepicker>
                            <button
                              type="button"
                              class="expiry-action-btn expiry-save-btn"
                              (click)="saveExpiry(consent.id)"
                            >Save</button>
                            <button
                              type="button"
                              class="expiry-action-btn expiry-cancel-btn"
                              (click)="editingExpiryId.set(null)"
                            >Cancel</button>
                          </div>
                        } @else if (consent.expiresAt) {
                          <!-- Expiry is set -->
                          <span class="expiry-label expiry-set">
                            <i class="pi pi-clock"></i>
                            Expires on {{ consent.expiresAt | date:'MMMM d, yyyy' }}
                          </span>
                          <button
                            type="button"
                            class="expiry-link"
                            (click)="startEditExpiry(consent.id, consent.expiresAt)"
                          >Change</button>
                          <span class="expiry-dot">·</span>
                          <button
                            type="button"
                            class="expiry-link expiry-link-danger"
                            (click)="removeExpiry(consent.id)"
                          >Remove</button>
                        } @else {
                          <!-- No expiry set -->
                          <span class="expiry-label expiry-none">
                            <i class="pi pi-minus-circle"></i>
                            No expiration set
                          </span>
                          <button
                            type="button"
                            class="expiry-link"
                            (click)="startEditExpiry(consent.id, null)"
                          >Set Expiry</button>
                        }
                      </div>
                    </div>
                  }
                </div>
                <div class="consent-actions-col">
                  @if (consent.granted) {
                    <!-- Feature 12.1: Revoke button for active optional consents -->
                    <button
                      pButton
                      label="Revoke"
                      icon="pi pi-times-circle"
                      class="p-button-danger p-button-outlined p-button-sm revoke-btn"
                      (click)="initiateRevoke(consent)"
                    ></button>
                  }
                  <p-toggleswitch
                    [ngModel]="consent.granted"
                    (ngModelChange)="toggleConsent(consent.id, $event)"
                  ></p-toggleswitch>
                </div>
              </div>
            </p-card>
          }
        </div>
      </section>

      <p-divider></p-divider>

      <!-- Feature 2.8: Data Access Map -->
      <section class="consent-section access-map-section">
        <div class="section-header">
          <h2>Data Access Map</h2>
          <p-tag value="Read Only" severity="secondary"></p-tag>
        </div>
        <p class="section-subtitle">See which organizations can access your health data categories</p>

        <div class="access-map-wrapper">
          <div class="access-map-scroll">
            <table class="access-map-table">
              <thead>
                <tr>
                  <th class="org-col-header">Organization</th>
                  @for (cat of accessMapCategories(); track cat) {
                    <th class="cat-col-header">{{ cat }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (entry of accessMap(); track entry.organization; let even = $even) {
                  <tr [class.row-even]="even" [class.row-odd]="!even">
                    <td class="org-cell">{{ entry.organization }}</td>
                    @for (category of entry.categories; track category.name) {
                      <td class="access-cell">
                        @if (category.granted) {
                          <i class="pi pi-check-circle access-granted" title="Access granted"></i>
                        } @else {
                          <i class="pi pi-times-circle access-denied" title="Access not granted"></i>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="access-map-legend">
            <span class="legend-item">
              <i class="pi pi-check-circle access-granted"></i> Access granted
            </span>
            <span class="legend-item">
              <i class="pi pi-times-circle access-denied"></i> Access not granted
            </span>
          </div>
        </div>
      </section>

      <p-divider></p-divider>

      <!-- Feature 12.2: ABDM Consent Manager (India) -->
      <section class="consent-section">
        <div class="section-header">
          <h2>ABDM Consent Manager (India)</h2>
          <span class="abdm-connected-badge">
            <i class="pi pi-check-circle"></i> Connected to ABDM
          </span>
        </div>
        <p class="section-subtitle">Manage consent artifacts under India's Ayushman Bharat Digital Mission (ABDM) per the Digital Health regulations.</p>

        <p-card styleClass="abdm-card">
          <div class="abdm-meta-row">
            <div class="abdm-meta-item">
              <span class="abdm-meta-label">Status</span>
              <span class="abdm-status-connected"><i class="pi pi-check-circle"></i> Connected to ABDM</span>
            </div>
            <div class="abdm-meta-item">
              <span class="abdm-meta-label">Last Sync</span>
              <span class="abdm-meta-value">Feb 20, 2026</span>
            </div>
            <div class="abdm-meta-item">
              <span class="abdm-meta-label">Active Artifacts</span>
              <span class="abdm-meta-value">{{ abdmArtifacts().length }}</span>
            </div>
            <div class="abdm-sync-action">
              <button
                pButton
                [label]="abdmSyncing() ? 'Syncing...' : abdmSynced() ? 'Synced successfully' : 'Sync Now'"
                [icon]="abdmSyncing() ? 'pi pi-spin pi-spinner' : abdmSynced() ? 'pi pi-check' : 'pi pi-refresh'"
                class="p-button-sm"
                [class]="abdmSynced() ? 'p-button-success' : 'p-button-outlined'"
                [disabled]="abdmSyncing()"
                (click)="syncAbdm()"
              ></button>
            </div>
          </div>

          <div class="abdm-artifacts-list">
            @for (artifact of abdmArtifacts(); track artifact.id) {
              <div class="abdm-artifact-row">
                <div class="abdm-artifact-icon">
                  <i class="pi pi-file-check"></i>
                </div>
                <div class="abdm-artifact-body">
                  <span class="abdm-artifact-name">{{ artifact.hospital }}</span>
                  <span class="abdm-artifact-id">Artifact ID: {{ artifact.artifactId }}</span>
                  <span class="abdm-artifact-purpose">Purpose: {{ artifact.purpose }}</span>
                </div>
                <div class="abdm-artifact-valid">
                  <span class="abdm-valid-label">Valid until</span>
                  <span class="abdm-valid-date">{{ artifact.validUntil }}</span>
                </div>
              </div>
            }
          </div>

          <div class="abdm-note">
            <i class="pi pi-info-circle"></i>
            <span>ABDM consent artifacts are governed by India's National Health Authority and Digital Personal Data Protection Act, 2023.
            Consent is granted through the ABDM Health Information Exchange and Consent Manager (HIE-CM).</span>
          </div>
        </p-card>
      </section>

      <p-divider></p-divider>

      <!-- Feature 12.3: GDPR Article 7 Consent Records (EU/Romania) -->
      <section class="consent-section">
        <div class="section-header">
          <h2>GDPR Consent Records</h2>
          <span class="gdpr-badge">
            <i class="pi pi-check-circle"></i> GDPR Article 7 Compliant
          </span>
        </div>
        <p class="section-subtitle">Full consent records as required under GDPR Regulation (EU) 2016/679, Article 7. You have the right to withdraw consent at any time.</p>

        <div class="gdpr-records-list">
          @for (consent of grantedConsentsForGdpr(); track consent.id) {
            <p-card styleClass="gdpr-record-card">
              <div class="gdpr-record-layout">
                <div class="gdpr-record-body">
                  <div class="gdpr-record-title-row">
                    <h3 class="gdpr-record-name">{{ consent.name }}</h3>
                    <span class="gdpr-compliant-chip">
                      <i class="pi pi-verified"></i> GDPR Art. 7
                    </span>
                  </div>
                  <div class="gdpr-record-fields">
                    <div class="gdpr-field">
                      <span class="gdpr-field-label">Date of Consent</span>
                      <span class="gdpr-field-value">{{ consent.grantedAt | date:'MMMM d, yyyy, h:mm a' }}</span>
                    </div>
                    <div class="gdpr-field">
                      <span class="gdpr-field-label">Method</span>
                      <span class="gdpr-field-value">Electronic form (patient portal)</span>
                    </div>
                    <div class="gdpr-field">
                      <span class="gdpr-field-label">Specific Purpose</span>
                      <span class="gdpr-field-value">{{ consent.description }}</span>
                    </div>
                    <div class="gdpr-field">
                      <span class="gdpr-field-label">Right to Withdraw</span>
                      <span class="gdpr-field-value gdpr-withdraw-note">
                        <i class="pi pi-info-circle"></i>
                        You may withdraw this consent at any time without affecting the lawfulness of processing prior to withdrawal.
                      </span>
                    </div>
                  </div>
                </div>
                <div class="gdpr-record-actions">
                  <button
                    pButton
                    label="Download Consent Record"
                    icon="pi pi-download"
                    class="p-button-outlined p-button-sm gdpr-download-btn"
                    (click)="downloadGdprRecord(consent.name)"
                  ></button>
                </div>
              </div>
            </p-card>
          }
        </div>

        @if (grantedConsentsForGdpr().length === 0) {
          <div class="empty-state-note">
            <i class="pi pi-info-circle"></i>
            No active consents to display. Enable optional consents above to see GDPR records.
          </div>
        }
      </section>

      <p-divider></p-divider>

      <!-- Feature 12.4: HIPAA Authorization Records (USA) -->
      <section class="consent-section">
        <div class="section-header">
          <h2>HIPAA Authorization Records</h2>
          <p-tag value="USA" severity="info"></p-tag>
        </div>
        <p class="section-subtitle">Formal HIPAA authorizations for disclosure of protected health information (PHI) per 45 CFR §164.508.</p>

        <div class="hipaa-auth-list">
          @for (auth of hipaaAuthorizations(); track auth.id) {
            <p-card styleClass="hipaa-auth-card" [class]="auth.revoked ? 'hipaa-auth-revoked' : ''">
              <div class="hipaa-auth-layout">
                <div class="hipaa-auth-icon" [class.revoked-icon]="auth.revoked">
                  <i class="pi pi-id-card"></i>
                </div>
                <div class="hipaa-auth-body">
                  <div class="hipaa-auth-title-row">
                    <h3 class="hipaa-auth-recipient">{{ auth.recipient }}</h3>
                    @if (auth.revoked) {
                      <p-tag value="Revoked" severity="danger"></p-tag>
                    } @else {
                      <p-tag value="Active" severity="success"></p-tag>
                    }
                  </div>
                  <div class="hipaa-auth-fields">
                    <div class="hipaa-auth-field">
                      <span class="hipaa-field-label">Authorization Date</span>
                      <span class="hipaa-field-value">{{ auth.authDate }}</span>
                    </div>
                    <div class="hipaa-auth-field">
                      <span class="hipaa-field-label">Purpose of Disclosure</span>
                      <span class="hipaa-field-value">{{ auth.purpose }}</span>
                    </div>
                    <div class="hipaa-auth-field">
                      <span class="hipaa-field-label">Expiration Date</span>
                      <span class="hipaa-field-value">{{ auth.expiresDate }}</span>
                    </div>
                    @if (auth.revoked) {
                      <div class="hipaa-auth-field">
                        <span class="hipaa-field-label">Revocation Status</span>
                        <span class="hipaa-field-value hipaa-revoked-text">Authorization revoked by patient</span>
                      </div>
                    }
                  </div>
                </div>
                <div class="hipaa-auth-actions">
                  <button
                    pButton
                    label="Download Form"
                    icon="pi pi-download"
                    class="p-button-outlined p-button-sm"
                    (click)="downloadHipaaForm(auth.id)"
                  ></button>
                </div>
              </div>
            </p-card>
          }
        </div>
      </section>

      <p-divider></p-divider>

      <!-- Australian Privacy Act 1988 Section -->
      <section class="consent-section">
        <div class="section-header">
          <h2>Australian Privacy Act 1988</h2>
          <span class="apa-badge">
            <i class="pi pi-shield"></i> Australian Privacy Act Compliant
          </span>
        </div>
        <p class="section-subtitle">
          AuraHealth Patient Portal complies with the <strong>Privacy Act 1988 (Cth)</strong> and the
          <strong>Australian Privacy Principles (APPs)</strong>. Your health information is also protected
          under the <strong>My Health Records Act 2012 (Cth)</strong>.
        </p>

        <!-- My Health Records Act notice -->
        <div class="mhr-notice">
          <div class="mhr-notice-icon">
            <i class="pi pi-file-check"></i>
          </div>
          <div class="mhr-notice-body">
            <strong>My Health Records Act 2012</strong>
            <p>
              Your My Health Record is governed by the My Health Records Act 2012.
              Only authorised healthcare providers and individuals you have nominated may access your
              My Health Record. You may cancel your My Health Record at any time by contacting the
              Australian Digital Health Agency.
            </p>
          </div>
        </div>

        <!-- Australian Privacy Principles summary -->
        <h3 class="apps-heading">Australian Privacy Principles (APPs) — Key Principles</h3>

        <div class="apps-list">

          <div class="app-item">
            <div class="app-number">APP 1</div>
            <div class="app-content">
              <h4>Open and transparent management of personal information</h4>
              <p>
                We manage your personal health information in an open and transparent way.
                Our Privacy Policy explains what information we collect, why we collect it,
                and how it is used, disclosed, and protected.
              </p>
            </div>
          </div>

          <div class="app-item">
            <div class="app-number">APP 6</div>
            <div class="app-content">
              <h4>Use or disclosure of personal information</h4>
              <p>
                We only use or disclose your personal information for the primary purpose
                for which it was collected — providing you with healthcare services — or
                for directly related secondary purposes you would reasonably expect,
                or with your consent.
              </p>
            </div>
          </div>

          <div class="app-item">
            <div class="app-number">APP 11</div>
            <div class="app-content">
              <h4>Security of personal information</h4>
              <p>
                We take reasonable steps to protect your personal information from misuse,
                interference, loss, unauthorised access, modification, and disclosure.
                This includes 256-bit TLS encryption, role-based access controls, and
                regular security audits.
              </p>
            </div>
          </div>

          <div class="app-item">
            <div class="app-number">APP 12</div>
            <div class="app-content">
              <h4>Access to personal information</h4>
              <p>
                You have the right to access the personal information we hold about you.
                You may request access at any time through this portal or by contacting
                our Privacy Officer. We will respond within 30 days.
              </p>
            </div>
          </div>

          <div class="app-item">
            <div class="app-number">APP 13</div>
            <div class="app-content">
              <h4>Correction of personal information</h4>
              <p>
                If you believe any personal information we hold about you is inaccurate,
                out-of-date, incomplete, irrelevant, or misleading, you may request a
                correction. We will take reasonable steps to correct it promptly.
              </p>
            </div>
          </div>

        </div>

        <!-- Your rights under the Privacy Act -->
        <div class="apa-rights-box">
          <h4 class="apa-rights-title">
            <i class="pi pi-user-check"></i>
            Your Rights Under the Privacy Act 1988
          </h4>
          <ul class="apa-rights-list">
            <li>
              <i class="pi pi-check-circle apa-rights-check"></i>
              <span><strong>Access:</strong> Request a copy of personal information we hold about you</span>
            </li>
            <li>
              <i class="pi pi-check-circle apa-rights-check"></i>
              <span><strong>Correction:</strong> Ask us to correct inaccurate or incomplete information</span>
            </li>
            <li>
              <i class="pi pi-check-circle apa-rights-check"></i>
              <span><strong>Complaint:</strong> Lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at <strong>oaic.gov.au</strong> or 1300 363 992</span>
            </li>
          </ul>
        </div>

        <!-- Download Privacy Statement -->
        <div class="apa-download-row">
          <button
            pButton
            label="Download Privacy Statement"
            icon="pi pi-download"
            class="p-button-outlined apa-download-btn"
            (click)="downloadAustralianPrivacyStatement()"
          ></button>
          <span class="apa-download-hint">
            <i class="pi pi-info-circle"></i>
            Includes full Privacy Policy and APP compliance summary (PDF, ~180 KB)
          </span>
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

    <!-- Feature 12.1: Revoke Confirmation Dialog -->
    <p-dialog
      [header]="'Revoke Consent'"
      [(visible)]="showRevokeDialog"
      [modal]="true"
      [style]="{ width: '480px' }"
      [draggable]="false"
      [resizable]="false"
    >
      @if (pendingRevokeConsent()) {
        <div class="revoke-dialog-body">
          <div class="revoke-warning-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <h3>Revoke Access?</h3>
          <p>
            Are you sure you want to revoke
            <strong>{{ pendingRevokeConsent()?.name }}</strong> consent?
            This takes effect immediately.
          </p>
          <div class="revoke-consequence">
            <i class="pi pi-info-circle"></i>
            <span>Revoking this consent may affect certain features and services. This action is logged in your audit trail.</span>
          </div>
        </div>
      }
      <ng-template pTemplate="footer">
        <button pButton label="Cancel" icon="pi pi-times" class="p-button-text" (click)="cancelRevoke()"></button>
        <button
          pButton
          label="Revoke Now"
          icon="pi pi-times-circle"
          class="p-button-danger"
          (click)="confirmRevoke()"
        ></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .consent-page { max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0; }
    .page-header p { color: var(--text-color-secondary); margin: 0.25rem 0 0; }
    .consent-section { margin-bottom: 1.5rem; }
    .section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
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
    .consent-toggle { flex-shrink: 0; display: flex; align-items: center; padding-top: 0.15rem; }

    /* Feature 12.1: Consent actions column */
    .consent-actions-col { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; padding-top: 0.1rem; }
    .revoke-btn { font-size: 0.78rem; white-space: nowrap; }

    .required-card { border-left: 3px solid var(--red-400); }
    .optional-card { border-left: 3px solid var(--blue-400); }

    /* Granted area: stacks timestamp and expiry */
    .granted-area { display: flex; flex-direction: column; gap: 0.3rem; }
    .granted-timestamp { font-size: 0.8rem; color: var(--green-600); display: flex; align-items: center; gap: 0.35rem; }
    .granted-timestamp i { font-size: 0.8rem; }

    /* Expiry section */
    .expiry-section { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .expiry-label { font-size: 0.775rem; display: flex; align-items: center; gap: 0.3rem; }
    .expiry-label i { font-size: 0.75rem; }
    .expiry-none { color: var(--text-color-secondary); }
    .expiry-set { color: var(--orange-600); }
    .expiry-dot { font-size: 0.75rem; color: var(--text-color-secondary); }
    .expiry-link {
      background: none; border: none; padding: 0; cursor: pointer;
      font-size: 0.775rem; color: var(--primary-500); text-decoration: underline;
      font-family: inherit; line-height: 1;
    }
    .expiry-link:hover { color: var(--primary-700); }
    .expiry-link-danger { color: var(--red-500); }
    .expiry-link-danger:hover { color: var(--red-700); }

    /* Inline date picker row */
    .expiry-picker-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.1rem; }
    .expiry-action-btn {
      font-size: 0.775rem; padding: 0.2rem 0.6rem; border-radius: 4px;
      cursor: pointer; font-family: inherit; border: 1px solid;
    }
    .expiry-save-btn {
      background: var(--primary-500); color: #fff;
      border-color: var(--primary-500);
    }
    .expiry-save-btn:hover { background: var(--primary-600); border-color: var(--primary-600); }
    .expiry-cancel-btn {
      background: var(--surface-ground); color: var(--text-color-secondary);
      border-color: var(--surface-border);
    }
    .expiry-cancel-btn:hover { background: var(--surface-hover); }

    /* Access Map */
    .access-map-section { margin-bottom: 1.5rem; }
    .access-map-wrapper { display: flex; flex-direction: column; gap: 0.75rem; }
    .access-map-scroll { overflow-x: auto; border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .access-map-table {
      width: 100%; border-collapse: collapse; font-size: 0.85rem;
      min-width: 600px;
    }
    .access-map-table thead tr {
      background: var(--surface-ground);
      border-bottom: 2px solid var(--surface-border);
    }
    .org-col-header {
      text-align: left; padding: 0.65rem 1rem;
      font-weight: 600; color: var(--text-color);
      white-space: nowrap; min-width: 180px;
    }
    .cat-col-header {
      text-align: center; padding: 0.65rem 0.6rem;
      font-weight: 600; color: var(--text-color);
      white-space: nowrap; font-size: 0.8rem;
    }
    .row-even { background: var(--surface-card); }
    .row-odd { background: var(--surface-ground); }
    .access-map-table tbody tr:not(:last-child) td {
      border-bottom: 1px solid var(--surface-border);
    }
    .org-cell {
      padding: 0.6rem 1rem; font-weight: 500; color: var(--text-color);
      white-space: nowrap; border-right: 1px solid var(--surface-border);
    }
    .access-cell { text-align: center; padding: 0.6rem 0.5rem; }
    .access-granted { color: var(--green-500); font-size: 1rem; }
    .access-denied { color: var(--red-400); font-size: 1rem; }
    .access-map-legend {
      display: flex; gap: 1.25rem; font-size: 0.8rem;
      color: var(--text-color-secondary); align-items: center;
    }
    .legend-item { display: flex; align-items: center; gap: 0.35rem; }

    /* Feature 12.2: ABDM Styles */
    .abdm-connected-badge {
      display: inline-flex; align-items: center; gap: 0.35rem;
      padding: 0.3rem 0.75rem; border-radius: 20px;
      background: var(--green-50); color: var(--green-700);
      border: 1px solid var(--green-200); font-size: 0.8rem; font-weight: 600;
    }
    .abdm-card { border-left: 3px solid var(--orange-400); }
    .abdm-meta-row { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--surface-border); }
    .abdm-meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .abdm-meta-label { font-size: 0.725rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-color-secondary); }
    .abdm-meta-value { font-size: 0.9rem; font-weight: 500; color: var(--text-color); }
    .abdm-status-connected { color: var(--green-600); font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.35rem; }
    .abdm-sync-action { margin-left: auto; }
    .abdm-artifacts-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
    .abdm-artifact-row { display: flex; align-items: center; gap: 0.875rem; padding: 0.75rem 1rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .abdm-artifact-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--orange-50); color: var(--orange-600); display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
    .abdm-artifact-body { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .abdm-artifact-name { font-weight: 600; font-size: 0.875rem; }
    .abdm-artifact-id, .abdm-artifact-purpose { font-size: 0.78rem; color: var(--text-color-secondary); }
    .abdm-artifact-valid { display: flex; flex-direction: column; gap: 0.2rem; align-items: flex-end; flex-shrink: 0; }
    .abdm-valid-label { font-size: 0.72rem; color: var(--text-color-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .abdm-valid-date { font-size: 0.825rem; font-weight: 600; color: var(--orange-700); }
    .abdm-note { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.75rem 1rem; background: var(--orange-50); border: 1px solid var(--orange-100); border-radius: var(--border-radius); font-size: 0.8rem; color: var(--orange-800); line-height: 1.5; margin-top: 0.5rem; }
    .abdm-note i { color: var(--orange-500); flex-shrink: 0; margin-top: 0.1rem; }

    /* Feature 12.3: GDPR Styles */
    .gdpr-badge {
      display: inline-flex; align-items: center; gap: 0.35rem;
      padding: 0.3rem 0.75rem; border-radius: 20px;
      background: var(--blue-50); color: var(--blue-700);
      border: 1px solid var(--blue-200); font-size: 0.8rem; font-weight: 600;
    }
    .gdpr-records-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .gdpr-record-card { border-left: 3px solid var(--blue-400); }
    .gdpr-record-layout { display: flex; align-items: flex-start; gap: 1rem; }
    .gdpr-record-body { flex: 1; min-width: 0; }
    .gdpr-record-title-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.875rem; flex-wrap: wrap; }
    .gdpr-record-name { margin: 0; font-size: 0.975rem; }
    .gdpr-compliant-chip { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.6rem; background: var(--blue-50); color: var(--blue-700); border: 1px solid var(--blue-200); border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
    .gdpr-record-fields { display: flex; flex-direction: column; gap: 0.5rem; }
    .gdpr-field { display: flex; gap: 0.75rem; align-items: flex-start; }
    .gdpr-field-label { font-size: 0.78rem; font-weight: 600; color: var(--text-color-secondary); min-width: 130px; flex-shrink: 0; padding-top: 0.1rem; }
    .gdpr-field-value { font-size: 0.825rem; color: var(--text-color); line-height: 1.5; }
    .gdpr-withdraw-note { color: var(--text-color-secondary); display: flex; align-items: flex-start; gap: 0.35rem; }
    .gdpr-withdraw-note i { color: var(--primary-400); flex-shrink: 0; margin-top: 0.15rem; font-size: 0.8rem; }
    .gdpr-record-actions { flex-shrink: 0; }
    .gdpr-download-btn { white-space: nowrap; }
    .empty-state-note { display: flex; align-items: center; gap: 0.5rem; padding: 1.25rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); font-size: 0.875rem; color: var(--text-color-secondary); }
    .empty-state-note i { color: var(--primary-400); }

    /* Feature 12.4: HIPAA Authorization Styles */
    .hipaa-auth-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .hipaa-auth-card { border-left: 3px solid var(--primary-400); }
    .hipaa-auth-revoked { border-left-color: var(--red-400) !important; opacity: 0.85; }
    .hipaa-auth-layout { display: flex; align-items: flex-start; gap: 1rem; }
    .hipaa-auth-icon { width: 40px; height: 40px; border-radius: 10px; background: var(--primary-50); color: var(--primary-600); display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
    .hipaa-auth-icon.revoked-icon { background: var(--red-50); color: var(--red-500); }
    .hipaa-auth-body { flex: 1; min-width: 0; }
    .hipaa-auth-title-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .hipaa-auth-recipient { margin: 0; font-size: 0.975rem; }
    .hipaa-auth-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .hipaa-auth-field { display: flex; flex-direction: column; gap: 0.15rem; }
    .hipaa-field-label { font-size: 0.725rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-color-secondary); }
    .hipaa-field-value { font-size: 0.845rem; color: var(--text-color); }
    .hipaa-revoked-text { color: var(--red-600); }
    .hipaa-auth-actions { flex-shrink: 0; }

    .compliance-note { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-color-secondary); line-height: 1.5; }
    .compliance-note i { color: var(--primary-500); font-size: 1rem; flex-shrink: 0; margin-top: 0.1rem; }

    /* Feature 12.1: Revoke Dialog */
    .revoke-dialog-body { text-align: center; padding: 0.5rem 0 1rem; }
    .revoke-warning-icon { font-size: 3rem; color: var(--red-500); margin-bottom: 1rem; }
    .revoke-warning-icon i { font-size: 3rem; }
    .revoke-dialog-body h3 { margin: 0 0 0.75rem; }
    .revoke-dialog-body p { color: var(--text-color-secondary); margin: 0 0 1rem; line-height: 1.5; text-align: left; }
    .revoke-consequence { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.875rem 1rem; background: var(--orange-50); border: 1px solid var(--orange-100); border-radius: var(--border-radius); font-size: 0.82rem; color: var(--orange-800); text-align: left; line-height: 1.5; }
    .revoke-consequence i { color: var(--orange-500); flex-shrink: 0; margin-top: 0.1rem; }

    /* Australian Privacy Act 1988 Styles */
    .apa-badge {
      display: inline-flex; align-items: center; gap: 0.35rem;
      padding: 0.3rem 0.75rem; border-radius: 20px;
      background: #f0fff4; color: #276749;
      border: 1px solid #9ae6b4; font-size: 0.8rem; font-weight: 600;
    }
    .mhr-notice {
      display: flex; align-items: flex-start; gap: 0.875rem;
      padding: 0.875rem 1rem; background: #ebf8ff;
      border: 1px solid #bee3f8; border-radius: var(--border-radius);
      margin-bottom: 1.25rem; line-height: 1.5;
    }
    .mhr-notice-icon {
      width: 38px; height: 38px; border-radius: 9px;
      background: #bee3f8; color: #2b6cb0;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
    }
    .mhr-notice-body strong { display: block; margin-bottom: 0.2rem; font-size: 0.9rem; color: #2b6cb0; }
    .mhr-notice-body p { margin: 0; font-size: 0.825rem; color: #2c5282; }
    .apps-heading {
      margin: 0 0 0.875rem; font-size: 0.9rem; font-weight: 700;
      color: var(--text-color); padding-bottom: 0.4rem;
      border-bottom: 2px solid #9ae6b4;
    }
    .apps-list { display: flex; flex-direction: column; gap: 0.625rem; margin-bottom: 1.25rem; }
    .app-item {
      display: flex; align-items: flex-start; gap: 0.875rem;
      padding: 0.75rem 0.875rem; background: var(--surface-ground);
      border: 1px solid var(--surface-border); border-left: 3px solid #48bb78;
      border-radius: var(--border-radius);
    }
    .app-number {
      flex-shrink: 0; min-width: 44px; height: 26px;
      background: #276749; color: white; border-radius: 4px;
      font-size: 0.72rem; font-weight: 800; letter-spacing: 0.03em;
      display: flex; align-items: center; justify-content: center;
    }
    .app-content h4 { margin: 0 0 0.2rem; font-size: 0.875rem; color: var(--text-color); }
    .app-content p { margin: 0; font-size: 0.8rem; color: var(--text-color-secondary); line-height: 1.5; }
    .apa-rights-box {
      padding: 1rem 1.125rem; background: #f7fafc;
      border: 1.5px solid #9ae6b4; border-radius: var(--border-radius);
      margin-bottom: 1.25rem;
    }
    .apa-rights-title {
      margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 700;
      display: flex; align-items: center; gap: 0.4rem; color: #276749;
    }
    .apa-rights-title i { font-size: 0.9rem; }
    .apa-rights-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .apa-rights-list li { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.825rem; color: var(--text-color); line-height: 1.5; }
    .apa-rights-check { color: #38a169; font-size: 0.875rem; flex-shrink: 0; margin-top: 0.15rem; }
    .apa-download-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .apa-download-btn { border-color: #276749 !important; color: #276749 !important; }
    .apa-download-btn:hover { background: #f0fff4 !important; }
    .apa-download-hint { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: var(--text-color-secondary); }
    .apa-download-hint i { color: var(--primary-400); font-size: 0.8rem; }

    @media (max-width: 600px) {
      .consent-layout { flex-wrap: wrap; }
      .consent-actions-col { width: 100%; flex-direction: row; justify-content: flex-end; }
      .hipaa-auth-fields { grid-template-columns: 1fr; }
      .gdpr-field { flex-direction: column; }
      .gdpr-field-label { min-width: unset; }
      .apa-download-row { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class ConsentManagementComponent {
  readonly today = new Date();

  // Feature 2.9 signals
  editingExpiryId = signal<string | null>(null);
  expiryDate = signal<Date | null>(null);

  // Feature 12.1: Revoke dialog state
  showRevokeDialog = signal(false);
  pendingRevokeConsent = signal<ConsentItem | null>(null);

  // Feature 12.2: ABDM sync state
  abdmSyncing = signal(false);
  abdmSynced = signal(false);

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
      description: 'Agreement to the terms governing your use of the AuraHealth patient portal, including acceptable use policies and your rights and responsibilities as a portal user.',
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
      description: 'Receive personalized health tips, wellness newsletters, and information about new services from AuraHealth. You may unsubscribe at any time.',
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

  // Feature 12.3: Granted consents for GDPR records (optional + granted only)
  readonly grantedConsentsForGdpr = computed(() =>
    this._consents().filter(c => !c.required && c.granted && c.grantedAt)
  );

  // Feature 2.8: Access Map data
  accessMap = signal<AccessMapEntry[]>([
    {
      organization: 'Primary Care (Dr. Johnson)',
      categories: [
        { name: 'Demographics', granted: true }, { name: 'Vitals', granted: true },
        { name: 'Medications', granted: true }, { name: 'Lab Results', granted: true },
        { name: 'Imaging', granted: true }, { name: 'Notes', granted: true }
      ]
    },
    {
      organization: 'Cardiology (Dr. Chen)',
      categories: [
        { name: 'Demographics', granted: true }, { name: 'Vitals', granted: true },
        { name: 'Medications', granted: true }, { name: 'Lab Results', granted: true },
        { name: 'Imaging', granted: true }, { name: 'Notes', granted: false }
      ]
    },
    {
      organization: 'City Lab Services',
      categories: [
        { name: 'Demographics', granted: true }, { name: 'Vitals', granted: false },
        { name: 'Medications', granted: false }, { name: 'Lab Results', granted: true },
        { name: 'Imaging', granted: false }, { name: 'Notes', granted: false }
      ]
    },
    {
      organization: 'CVS Pharmacy',
      categories: [
        { name: 'Demographics', granted: true }, { name: 'Vitals', granted: false },
        { name: 'Medications', granted: true }, { name: 'Lab Results', granted: false },
        { name: 'Imaging', granted: false }, { name: 'Notes', granted: false }
      ]
    },
    {
      organization: 'Health Insurance (BCBS)',
      categories: [
        { name: 'Demographics', granted: true }, { name: 'Vitals', granted: true },
        { name: 'Medications', granted: true }, { name: 'Lab Results', granted: true },
        { name: 'Imaging', granted: true }, { name: 'Notes', granted: false }
      ]
    }
  ]);

  // Derive the ordered category names from the first entry
  readonly accessMapCategories = computed(() =>
    this.accessMap()[0]?.categories.map(c => c.name) ?? []
  );

  // Feature 12.2: ABDM artifacts
  readonly abdmArtifacts = signal<AbdmArtifact[]>([
    {
      id: 'ABDM-001',
      hospital: 'AIIMS New Delhi',
      artifactId: 'HI-CM-2026-NDE-4821',
      purpose: 'Care Management - Ongoing Treatment',
      validUntil: 'Dec 31, 2026'
    },
    {
      id: 'ABDM-002',
      hospital: 'Metropolis Lab Services',
      artifactId: 'HI-CM-2026-MLS-9034',
      purpose: 'Diagnostic Reporting',
      validUntil: 'Jun 30, 2026'
    },
    {
      id: 'ABDM-003',
      hospital: 'Apollo Pharmacy',
      artifactId: 'HI-CM-2026-APL-6172',
      purpose: 'Prescription Dispensing',
      validUntil: 'Mar 31, 2026'
    }
  ]);

  // Feature 12.4: HIPAA Authorization Records
  readonly hipaaAuthorizations = signal<HipaaAuthorization[]>([
    {
      id: 'HIPAA-001',
      authDate: 'March 15, 2024',
      recipient: 'Blue Cross Blue Shield (BCBS)',
      purpose: 'Insurance claims adjudication and prior authorization',
      expiresDate: 'March 15, 2026',
      revoked: false
    },
    {
      id: 'HIPAA-002',
      authDate: 'June 1, 2024',
      recipient: 'National Health Research Institute',
      purpose: 'De-identified data for population health research study NCT-2024-4892',
      expiresDate: 'December 31, 2026',
      revoked: false
    },
    {
      id: 'HIPAA-003',
      authDate: 'January 10, 2024',
      recipient: 'Life Insurance Corp.',
      purpose: 'Underwriting review for life insurance application',
      expiresDate: 'January 10, 2025',
      revoked: true
    }
  ]);

  // Feature 2.9 methods
  startEditExpiry(id: string, currentExpiry: Date | null | undefined): void {
    this.expiryDate.set(currentExpiry ?? null);
    this.editingExpiryId.set(id);
  }

  saveExpiry(id: string): void {
    const date = this.expiryDate();
    this._consents.update(list =>
      list.map(c =>
        c.id === id
          ? { ...c, expiresAt: date ?? undefined }
          : c
      )
    );
    this.editingExpiryId.set(null);
    this.expiryDate.set(null);
  }

  removeExpiry(id: string): void {
    this._consents.update(list =>
      list.map(c =>
        c.id === id ? { ...c, expiresAt: undefined } : c
      )
    );
  }

  toggleConsent(id: string, granted: boolean): void {
    if (this.editingExpiryId() === id) {
      this.editingExpiryId.set(null);
      this.expiryDate.set(null);
    }
    this._consents.update(list =>
      list.map(c =>
        c.id === id
          ? { ...c, granted, grantedAt: granted ? new Date() : undefined, expiresAt: granted ? c.expiresAt : undefined }
          : c
      )
    );
  }

  // Feature 12.1: Revoke methods
  initiateRevoke(consent: ConsentItem): void {
    this.pendingRevokeConsent.set(consent);
    this.showRevokeDialog.set(true);
  }

  cancelRevoke(): void {
    this.pendingRevokeConsent.set(null);
    this.showRevokeDialog.set(false);
  }

  confirmRevoke(): void {
    const consent = this.pendingRevokeConsent();
    if (consent) {
      this._consents.update(list =>
        list.map(c =>
          c.id === consent.id
            ? { ...c, granted: false, grantedAt: undefined, expiresAt: undefined }
            : c
        )
      );
    }
    this.showRevokeDialog.set(false);
    this.pendingRevokeConsent.set(null);
  }

  // Feature 12.2: ABDM Sync
  syncAbdm(): void {
    this.abdmSyncing.set(true);
    this.abdmSynced.set(false);
    setTimeout(() => {
      this.abdmSyncing.set(false);
      this.abdmSynced.set(true);
      setTimeout(() => this.abdmSynced.set(false), 4000);
    }, 2200);
  }

  // Feature 12.3: GDPR Download (mock)
  downloadGdprRecord(consentName: string): void {
    console.log(`Mock: Generating GDPR consent record PDF for "${consentName}"`);
  }

  // Feature 12.4: HIPAA Download (mock)
  downloadHipaaForm(authId: string): void {
    console.log(`Mock: Downloading HIPAA authorization form ${authId}`);
  }

  // Australian Privacy Act 1988: Download Privacy Statement (mock)
  downloadAustralianPrivacyStatement(): void {
    console.log('Mock: Generating Australian Privacy Act 1988 compliance statement PDF');
  }
}
