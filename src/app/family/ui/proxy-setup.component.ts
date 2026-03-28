import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { AuthService } from '../../auth/data-access/auth.service';
import { CommonModule } from '@angular/common';
import { StepperModule } from 'primeng/stepper';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { MenuItem } from 'primeng/api';
import { FamilyMember, ProxyStatus } from '../data-access/family.models';

interface ProxyActionLog {
  id: string;
  date: Date;
  action: string;
  details: string;
  actor: string;
  category: string;
}

interface UploadedDocument {
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  status: 'uploading' | 'uploaded' | 'verified';
}

@Component({
  selector: 'app-proxy-setup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    StepperModule,
    FileUploadModule,
    MessageModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    CardModule,
    DividerModule,
  ],
  template: `
    <div class="proxy-setup" [attr.aria-label]="'Proxy management for ' + member?.firstName">

      <!-- Active Proxy Banner -->
      @if (isProxyActive()) {
        <div class="proxy-active-banner" role="alert" aria-live="polite">
          <div class="banner-content">
            <div class="banner-icon" aria-hidden="true">
              <i class="pi pi-user-edit"></i>
            </div>
            <div class="banner-text">
              <strong>Proxy Access Active</strong>
              <p>
                You are acting as proxy for
                <strong>{{ member?.firstName }} {{ member?.lastName }}</strong>.
                All actions performed on their behalf are recorded in the audit log below.
              </p>
            </div>
            <div class="banner-badge">
              <i class="pi pi-shield" aria-hidden="true"></i>
              HIPAA Compliant
            </div>
          </div>
        </div>
      }

      <!-- Proxy Status Header -->
      <div class="proxy-header">
        <div class="proxy-header-info">
          <h3 class="proxy-title">
            <i class="pi pi-user-edit" aria-hidden="true"></i>
            Proxy Setup
          </h3>
          <p class="proxy-subtitle">
            Manage proxy access for {{ member?.firstName }} {{ member?.lastName }}.
            A valid legal document (Power of Attorney or Court Order) is required.
          </p>
        </div>
        <div class="proxy-status-badge" [class]="'status-badge--' + currentProxyStatus()">
          <i [class]="getStatusIcon(currentProxyStatus())" aria-hidden="true"></i>
          {{ getStatusLabel(currentProxyStatus()) }}
        </div>
      </div>

      <!-- Progress Steps -->
      <div class="proxy-steps-container">
        <p-stepper [value]="getStepIndex(currentProxyStatus()) + 1" aria-label="Proxy setup progress">
          <p-step-list>
            @for (step of proxySteps; track step.label; let i = $index) {
              <p-step [value]="i + 1">{{ step.label }}</p-step>
            }
          </p-step-list>
        </p-stepper>
      </div>

      <p-divider></p-divider>

      <!-- Step Content -->
      <div class="proxy-step-content">

        <!-- Step 0: Upload Document -->
        @if (currentProxyStatus() === 'pending-upload') {
          <div class="step-panel" aria-label="Upload documents step">
            <h4 class="step-heading">
              <i class="pi pi-upload" aria-hidden="true"></i>
              Upload Legal Document
            </h4>
            <p class="step-desc">
              Upload a Power of Attorney (POA), healthcare proxy designation, or court order
              authorising you to manage this person's medical records.
            </p>

            <div class="upload-requirements">
              <h5 class="req-heading">Accepted document types:</h5>
              <ul class="req-list" aria-label="Accepted document types">
                <li><i class="pi pi-check" aria-hidden="true"></i> Durable Power of Attorney for Healthcare</li>
                <li><i class="pi pi-check" aria-hidden="true"></i> Healthcare Proxy Designation</li>
                <li><i class="pi pi-check" aria-hidden="true"></i> Court-Ordered Guardianship</li>
                <li><i class="pi pi-check" aria-hidden="true"></i> Notarised Authorisation Letter</li>
              </ul>
            </div>

            <p-fileUpload
              name="proxyDoc"
              [multiple]="false"
              accept=".pdf,.jpg,.jpeg,.png"
              [maxFileSize]="10485760"
              chooseLabel="Select Document"
              uploadLabel="Submit for Verification"
              cancelLabel="Cancel"
              (onUpload)="onDocumentUploaded($event)"
              (onSelect)="onDocumentSelected($event)"
              [customUpload]="true"
              (uploadHandler)="onUploadHandler($event)"
              styleClass="proxy-uploader"
              aria-label="Upload proxy document"
            >
              <ng-template pTemplate="content">
                <div class="upload-dropzone">
                  <i class="pi pi-cloud-upload" aria-hidden="true"></i>
                  <p>Drag and drop your document here, or click to browse</p>
                  <span class="upload-constraints">PDF, JPG, PNG &middot; Maximum 10 MB</span>
                </div>
              </ng-template>
            </p-fileUpload>

            @if (uploadedDocs().length > 0) {
              <div class="uploaded-docs" role="list" aria-label="Uploaded documents">
                @for (doc of uploadedDocs(); track doc.name) {
                  <div class="doc-item" role="listitem">
                    <i class="pi pi-file-pdf doc-icon" aria-hidden="true"></i>
                    <div class="doc-info">
                      <span class="doc-name">{{ doc.name }}</span>
                      <span class="doc-size">{{ formatFileSize(doc.size) }}</span>
                    </div>
                    <span class="doc-status" [class]="'doc-status--' + doc.status">
                      {{ doc.status | titlecase }}
                    </span>
                  </div>
                }
              </div>
              <button
                pButton
                label="Submit for Verification"
                icon="pi pi-send"
                class="p-button-primary"
                (click)="submitForVerification()"
                aria-label="Submit uploaded documents for verification"
              ></button>
            }
          </div>
        }

        <!-- Step 1: Pending Verification -->
        @if (currentProxyStatus() === 'pending-verification') {
          <div class="step-panel" aria-label="Pending verification step">
            <div class="verification-status">
              <div class="verification-icon" aria-hidden="true">
                <i class="pi pi-spin pi-spinner"></i>
              </div>
              <div class="verification-content">
                <h4>Document Under Review</h4>
                <p>
                  Your document has been submitted and is currently being reviewed by our
                  compliance team. This process typically takes 1-3 business days.
                </p>
                <div class="verification-timeline">
                  <div class="timeline-item done">
                    <i class="pi pi-check-circle" aria-hidden="true"></i>
                    <span>Document received</span>
                  </div>
                  <div class="timeline-item active">
                    <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                    <span>Identity verification in progress</span>
                  </div>
                  <div class="timeline-item pending">
                    <i class="pi pi-circle" aria-hidden="true"></i>
                    <span>Legal review</span>
                  </div>
                  <div class="timeline-item pending">
                    <i class="pi pi-circle" aria-hidden="true"></i>
                    <span>Proxy access activation</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              pButton
              label="Simulate: Mark as Verified"
              icon="pi pi-check"
              class="p-button-outlined p-button-success p-button-sm"
              (click)="simulateVerified()"
              pTooltip="Demo only — simulates verification completion"
              aria-label="Simulate verification completed (demo)"
            ></button>
          </div>
        }

        <!-- Step 2: Verified -->
        @if (currentProxyStatus() === 'verified') {
          <div class="step-panel" aria-label="Verified step">
            <div class="verified-status">
              <div class="verified-icon" aria-hidden="true">
                <i class="pi pi-check-circle"></i>
              </div>
              <div class="verified-content">
                <h4>Document Verified</h4>
                <p>
                  Your legal document has been verified. Proxy access is ready to be activated.
                  Once activated, you will be able to act on behalf of
                  {{ member?.firstName }} {{ member?.lastName }}.
                </p>
              </div>
            </div>
            <button
              pButton
              label="Activate Proxy Access"
              icon="pi pi-play"
              class="p-button-success"
              (click)="activateProxy()"
              aria-label="Activate proxy access"
            ></button>
          </div>
        }

        <!-- Step 3: Active -->
        @if (currentProxyStatus() === 'active') {
          <div class="step-panel" aria-label="Active proxy step">
            <div class="active-status">
              <div class="active-icon" aria-hidden="true">
                <i class="pi pi-user-edit"></i>
              </div>
              <div class="active-content">
                <h4>Proxy Access Active</h4>
                <p>
                  You have full proxy access for {{ member?.firstName }} {{ member?.lastName }}.
                  You can view and manage their medical records on their behalf.
                  All actions are logged for compliance and audit purposes.
                </p>
                <div class="active-permissions">
                  <span class="perm-chip perm-chip--green">
                    <i class="pi pi-check" aria-hidden="true"></i> Appointments
                  </span>
                  <span class="perm-chip perm-chip--green">
                    <i class="pi pi-check" aria-hidden="true"></i> Medications
                  </span>
                  <span class="perm-chip perm-chip--green">
                    <i class="pi pi-check" aria-hidden="true"></i> Lab Results
                  </span>
                  <span class="perm-chip perm-chip--green">
                    <i class="pi pi-check" aria-hidden="true"></i> All Records
                  </span>
                </div>
              </div>
            </div>
            <button
              pButton
              label="Revoke Proxy Access"
              icon="pi pi-times"
              class="p-button-danger p-button-outlined p-button-sm"
              (click)="revokeProxy()"
              aria-label="Revoke proxy access"
            ></button>
          </div>
        }

        <!-- Revoked -->
        @if (currentProxyStatus() === 'revoked') {
          <div class="step-panel" aria-label="Revoked proxy">
            <div class="revoked-status">
              <div class="revoked-icon" aria-hidden="true">
                <i class="pi pi-ban"></i>
              </div>
              <div class="revoked-content">
                <h4>Proxy Access Revoked</h4>
                <p>
                  Proxy access has been revoked. To re-establish proxy access,
                  you will need to submit a new legal document for verification.
                </p>
              </div>
            </div>
            <button
              pButton
              label="Request New Proxy Access"
              icon="pi pi-plus"
              class="p-button-outlined"
              (click)="resetProxy()"
              aria-label="Request new proxy access"
            ></button>
          </div>
        }
      </div>

      <p-divider></p-divider>

      <!-- Action Log Table -->
      <div class="action-log-section">
        <div class="log-header">
          <h4 class="log-title">
            <i class="pi pi-history" aria-hidden="true"></i>
            Proxy Action Log
          </h4>
          <button
            pButton
            label="Export CSV"
            icon="pi pi-download"
            class="p-button-outlined p-button-sm"
            (click)="exportCsv()"
            aria-label="Export action log as CSV"
          ></button>
        </div>

        <p-table
          [value]="actionLog()"
          [paginator]="actionLog().length > 10"
          [rows]="10"
          styleClass="p-datatable-sm proxy-table"
          [tableStyle]="{ 'min-width': '100%' }"
          aria-label="Proxy action log"
        >
          <ng-template pTemplate="header">
            <tr>
              <th scope="col" style="width: 160px">Date</th>
              <th scope="col">Action</th>
              <th scope="col">Details</th>
              <th scope="col" style="width: 120px">Category</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-entry>
            <tr>
              <td>{{ entry.date | date:'mediumDate' }}</td>
              <td>
                <span class="log-action">
                  <i [class]="getActionIcon(entry.action)" aria-hidden="true"></i>
                  {{ entry.action }}
                </span>
              </td>
              <td class="log-details">{{ entry.details }}</td>
              <td>
                <p-tag
                  [value]="entry.category"
                  severity="secondary"
                  styleClass="log-cat-tag"
                ></p-tag>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4" class="empty-log">
                <i class="pi pi-info-circle" aria-hidden="true"></i>
                No actions logged yet.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .proxy-setup {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* Active proxy banner */
    .proxy-active-banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 4px solid #2563eb;
      border-radius: 8px;
      margin-bottom: 1.25rem;
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1rem;
    }

    .banner-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #dbeafe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .banner-icon i {
      font-size: 1.125rem;
      color: #2563eb;
    }

    .banner-text {
      flex: 1;
    }

    .banner-text strong {
      font-size: 0.9rem;
      display: block;
      color: #1e40af;
      margin-bottom: 0.125rem;
    }

    .banner-text p {
      font-size: 0.8rem;
      color: #1d4ed8;
      margin: 0;
    }

    .banner-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: #dbeafe;
      border-radius: 16px;
      font-size: 0.7rem;
      font-weight: 700;
      color: #1e40af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      flex-shrink: 0;
    }

    .banner-badge i {
      font-size: 0.8rem;
    }

    /* Header */
    .proxy-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .proxy-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .proxy-title i {
      color: var(--primary-color);
    }

    .proxy-subtitle {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin: 0;
      line-height: 1.4;
    }

    .proxy-status-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .status-badge--pending-upload { background: #fef3c7; color: #92400e; }
    .status-badge--pending-verification { background: #dbeafe; color: #1e40af; }
    .status-badge--verified { background: #dcfce7; color: #166534; }
    .status-badge--active { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
    .status-badge--revoked { background: #fee2e2; color: #991b1b; }

    /* Steps */
    .proxy-steps-container {
      margin-bottom: 0.5rem;
    }

    .proxy-steps-container ::ng-deep .p-steps .p-steps-item .p-menuitem-link {
      padding: 0.625rem 0.5rem;
    }

    .proxy-steps-container ::ng-deep .p-steps-title {
      font-size: 0.7rem;
    }

    /* Step content */
    .proxy-step-content {
      padding: 1rem 0;
    }

    .step-panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .step-heading {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .step-heading i {
      color: var(--primary-color);
    }

    .step-desc {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin: 0;
      line-height: 1.5;
    }

    /* Upload requirements */
    .upload-requirements {
      background: var(--surface-ground);
      border-radius: 8px;
      padding: 0.875rem;
      border: 1px solid var(--surface-border);
    }

    .req-heading {
      font-size: 0.8rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .req-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .req-list li {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
    }

    .req-list i {
      color: #16a34a;
      font-size: 0.8rem;
    }

    /* Upload dropzone */
    .upload-dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      text-align: center;
      color: var(--text-color-secondary);
    }

    .upload-dropzone i {
      font-size: 2rem;
      margin-bottom: 0.75rem;
      color: var(--primary-300);
    }

    .upload-dropzone p {
      margin: 0 0 0.25rem;
      font-size: 0.875rem;
    }

    .upload-constraints {
      font-size: 0.75rem;
    }

    /* Uploaded docs */
    .uploaded-docs {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .doc-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface-ground);
      border-radius: 6px;
      border: 1px solid var(--surface-border);
    }

    .doc-icon {
      color: var(--red-500);
      font-size: 1.25rem;
    }

    .doc-info {
      flex: 1;
    }

    .doc-name {
      font-size: 0.875rem;
      font-weight: 500;
      display: block;
    }

    .doc-size {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .doc-status {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 10px;
    }

    .doc-status--uploading { background: #dbeafe; color: #1e40af; }
    .doc-status--uploaded { background: #fef9c3; color: #854d0e; }
    .doc-status--verified { background: #dcfce7; color: #166534; }

    /* Verification */
    .verification-status, .verified-status, .active-status, .revoked-status {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .verification-icon, .verified-icon, .active-icon, .revoked-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .verification-icon {
      background: #dbeafe;
      border: 2px solid #93c5fd;
    }

    .verification-icon i {
      font-size: 1.5rem;
      color: #2563eb;
    }

    .verified-icon {
      background: #dcfce7;
      border: 2px solid #86efac;
    }

    .verified-icon i {
      font-size: 1.5rem;
      color: #16a34a;
    }

    .active-icon {
      background: #d1fae5;
      border: 2px solid #6ee7b7;
    }

    .active-icon i {
      font-size: 1.5rem;
      color: #059669;
    }

    .revoked-icon {
      background: #fee2e2;
      border: 2px solid #fca5a5;
    }

    .revoked-icon i {
      font-size: 1.5rem;
      color: #dc2626;
    }

    .verification-content h4,
    .verified-content h4,
    .active-content h4,
    .revoked-content h4 {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
    }

    .verification-content p,
    .verified-content p,
    .active-content p,
    .revoked-content p {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin: 0 0 0.75rem;
      line-height: 1.5;
    }

    /* Timeline */
    .verification-timeline {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .timeline-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .timeline-item.done i { color: #16a34a; }
    .timeline-item.active i { color: #2563eb; }
    .timeline-item.pending { color: var(--text-color-secondary); }
    .timeline-item.pending i { color: var(--text-color-secondary); opacity: 0.5; }

    /* Active permissions */
    .active-permissions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-top: 0.5rem;
    }

    .perm-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.625rem;
      border-radius: 14px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .perm-chip--green {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }

    .perm-chip i {
      font-size: 0.65rem;
    }

    /* Action log */
    .action-log-section {
      padding-top: 0.5rem;
    }

    .log-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.875rem;
    }

    .log-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .log-title i {
      color: var(--text-color-secondary);
    }

    .log-action {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
    }

    .log-action i {
      color: var(--primary-color);
      font-size: 0.8rem;
    }

    .log-details {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      max-width: 280px;
    }

    .empty-log {
      text-align: center;
      padding: 1.5rem;
      color: var(--text-color-secondary);
      font-size: 0.875rem;
    }

    .empty-log i {
      margin-right: 0.375rem;
    }
  `],
})
export class ProxySetupComponent implements OnChanges {
  @Input({ required: true }) member!: FamilyMember;
  @Output() proxyStatusChanged = new EventEmitter<ProxyStatus>();

  private readonly authService = inject(AuthService);

  protected readonly currentProxyStatus = signal<ProxyStatus>('pending-upload');
  protected readonly uploadedDocs = signal<UploadedDocument[]>([]);

  protected readonly isProxyActive = computed(
    () => this.currentProxyStatus() === 'active'
  );

  protected readonly actionLog = signal<ProxyActionLog[]>([]);

  protected readonly proxySteps: MenuItem[] = [
    { label: 'Upload Doc' },
    { label: 'Verification' },
    { label: 'Verified' },
    { label: 'Active' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['member'] && this.member) {
      const status = this.member.proxyStatus ?? 'pending-upload';
      this.currentProxyStatus.set(status);
      if (status === 'active') {
        this.loadActionLog();
      }
    }
  }

  private async loadActionLog(): Promise<void> {
    const patientId = this.authService.user()?.patientId
      ?? localStorage.getItem('portal_patient_id');
    if (!patientId) return;

    const token = localStorage.getItem('portal_token') || '';
    try {
      const resp = await fetch(
        `/api/v1/portal/patients/${patientId}/family`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      // Endpoint not yet implemented — silently leave action log empty
      if (!resp.ok) return;
      // Future: parse proxy-specific action log from response
    } catch { /* leave empty */ }
  }

  protected getStepIndex(status: ProxyStatus): number {
    const map: Record<ProxyStatus, number> = {
      'pending-upload': 0,
      'pending-verification': 1,
      verified: 2,
      active: 3,
      revoked: 0,
    };
    return map[status] ?? 0;
  }

  protected getStatusLabel(status: ProxyStatus): string {
    const map: Record<ProxyStatus, string> = {
      'pending-upload': 'Awaiting Upload',
      'pending-verification': 'Under Review',
      verified: 'Document Verified',
      active: 'Proxy Active',
      revoked: 'Access Revoked',
    };
    return map[status] ?? status;
  }

  protected getStatusIcon(status: ProxyStatus): string {
    const map: Record<ProxyStatus, string> = {
      'pending-upload': 'pi pi-upload',
      'pending-verification': 'pi pi-spinner pi-spin',
      verified: 'pi pi-verified',
      active: 'pi pi-user-edit',
      revoked: 'pi pi-ban',
    };
    return map[status] ?? 'pi pi-circle';
  }

  protected onDocumentSelected(event: { files: File[] }): void {
    const files = event.files;
    const docs: UploadedDocument[] = files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      uploadedAt: new Date(),
      status: 'uploaded',
    }));
    this.uploadedDocs.set(docs);
  }

  protected onDocumentUploaded(_event: unknown): void {
    // Handled via customUpload
  }

  protected onUploadHandler(event: { files: File[] }): void {
    this.onDocumentSelected(event);
  }

  protected submitForVerification(): void {
    this.currentProxyStatus.set('pending-verification');
    this.proxyStatusChanged.emit('pending-verification');
    this.addLogEntry(
      'Document submitted',
      `Document submitted for verification: ${this.uploadedDocs()[0]?.name ?? 'Unknown'}`,
      'document-management'
    );
  }

  protected simulateVerified(): void {
    this.currentProxyStatus.set('verified');
    this.proxyStatusChanged.emit('verified');
    this.addLogEntry(
      'Document verified',
      'Legal document verified by compliance team.',
      'proxy-management'
    );
  }

  protected activateProxy(): void {
    this.currentProxyStatus.set('active');
    this.proxyStatusChanged.emit('active');
    // TODO: wire to backend API — reload action log after activation
    this.addLogEntry(
      'Proxy access activated',
      `Proxy access activated for ${this.member.firstName} ${this.member.lastName}.`,
      'proxy-management'
    );
  }

  protected revokeProxy(): void {
    this.currentProxyStatus.set('revoked');
    this.proxyStatusChanged.emit('revoked');
    this.addLogEntry(
      'Proxy access revoked',
      `Proxy access revoked for ${this.member.firstName} ${this.member.lastName}.`,
      'proxy-management'
    );
  }

  protected resetProxy(): void {
    this.currentProxyStatus.set('pending-upload');
    this.uploadedDocs.set([]);
    this.proxyStatusChanged.emit('pending-upload');
  }

  protected exportCsv(): void {
    const log = this.actionLog();
    if (log.length === 0) return;

    const headers = ['Date', 'Action', 'Details', 'Actor', 'Category'];
    const rows = log.map(e => [
      e.date.toLocaleDateString(),
      `"${e.action}"`,
      `"${e.details}"`,
      `"${e.actor}"`,
      e.category,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxy-log-${this.member.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected getActionIcon(action: string): string {
    const lower = action.toLowerCase();
    if (lower.includes('view')) return 'pi pi-eye';
    if (lower.includes('document') || lower.includes('upload')) return 'pi pi-file';
    if (lower.includes('verified') || lower.includes('verif')) return 'pi pi-verified';
    if (lower.includes('activated') || lower.includes('activate')) return 'pi pi-user-edit';
    if (lower.includes('revoked') || lower.includes('revoke')) return 'pi pi-ban';
    if (lower.includes('created')) return 'pi pi-plus-circle';
    return 'pi pi-info-circle';
  }

  private addLogEntry(action: string, details: string, category: string): void {
    const entry: ProxyActionLog = {
      id: `pal-${Date.now()}`,
      date: new Date(),
      action,
      details,
      actor: 'Alex Johnson',
      category,
    };
    this.actionLog.update(log => [entry, ...log]);
  }
}
