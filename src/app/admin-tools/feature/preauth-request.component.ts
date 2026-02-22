import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

type PreauthStatus = 'Pending' | 'Under Review' | 'Approved' | 'Denied' | 'Expired';

interface PreauthRequest {
  id: string;
  procedure: string;
  provider: string;
  submittedOn: Date;
  status: PreauthStatus;
  insuranceRef: string | null;
  estimatedDecision: Date | null;
}

interface MockDocument {
  name: string;
  size: string;
  type: string;
  uploaded: boolean;
}

@Component({
  selector: 'app-preauth-request',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TagModule,
    DropdownModule,
    TextareaModule,
    TooltipModule,
    InputTextModule
  ],
  template: `
    <div class="preauth-page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-shield"></i>
          </div>
          <div>
            <h1 class="page-title">Pre-Authorization Request</h1>
            <p class="page-subtitle">Submit insurance pre-authorization requests for procedures and specialist services</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-pill">
            <span class="stat-pill-num">{{ pendingCount() }}</span>
            <span class="stat-pill-label">Pending</span>
          </div>
          <div class="stat-pill">
            <span class="stat-pill-num">{{ approvedCount() }}</span>
            <span class="stat-pill-label">Approved</span>
          </div>
        </div>
      </div>

      <!-- Page Layout -->
      <div class="page-layout">

        <!-- Left: Form Column -->
        <div class="form-column">

          <!-- Insurance Info Card (Read-Only) -->
          <div class="insurance-info-card">
            <div class="insurance-info-header">
              <div class="insurance-logo">
                <i class="pi pi-id-card"></i>
              </div>
              <div class="insurance-info-text">
                <span class="insurance-label">Active Insurance</span>
                <strong class="insurance-name">Blue Cross Blue Shield PPO</strong>
              </div>
              <p-tag value="Active" severity="success"></p-tag>
            </div>
            <div class="insurance-details">
              <div class="insurance-detail">
                <span class="detail-key">Member ID</span>
                <span class="detail-val mono">XYZ123456</span>
              </div>
              <div class="insurance-detail">
                <span class="detail-key">Group #</span>
                <span class="detail-val mono">GRP-78901</span>
              </div>
              <div class="insurance-detail">
                <span class="detail-key">Plan Year</span>
                <span class="detail-val">2026</span>
              </div>
              <div class="insurance-detail">
                <span class="detail-key">Pre-Auth Line</span>
                <span class="detail-val">1-800-555-0192</span>
              </div>
            </div>
          </div>

          <!-- Submission Form -->
          @if (!submitted()) {
            <div class="form-card">
              <div class="form-card-header">
                <i class="pi pi-plus-circle"></i>
                <h2 class="form-card-title">New Pre-Auth Request</h2>
              </div>

              <div class="form-body">

                <!-- Procedure & Provider -->
                <div class="form-row-2col">
                  <div class="form-field">
                    <label class="field-label">Procedure / Service <span class="required">*</span></label>
                    <p-dropdown
                      [(ngModel)]="selectedProcedure"
                      [options]="procedureOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select procedure"
                      styleClass="w-full"
                    ></p-dropdown>
                  </div>
                  <div class="form-field">
                    <label class="field-label">Performing Provider <span class="required">*</span></label>
                    <p-dropdown
                      [(ngModel)]="selectedProvider"
                      [options]="providerOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select provider"
                      styleClass="w-full"
                    ></p-dropdown>
                  </div>
                </div>

                <!-- CPT Code (Optional) -->
                <div class="form-field">
                  <label class="field-label">CPT Code <span class="optional">(Optional)</span></label>
                  <input
                    pInputText
                    [(ngModel)]="cptCode"
                    placeholder="e.g., 70553"
                    class="w-full"
                    [maxlength]="10"
                  />
                </div>

                <!-- Justification -->
                <div class="form-field">
                  <label class="field-label">Medical Justification <span class="required">*</span></label>
                  <textarea
                    pTextarea
                    [(ngModel)]="justification"
                    rows="4"
                    placeholder="Describe the medical necessity for this procedure. Include symptoms, diagnosis codes, previous treatments tried, and why this procedure is required..."
                    class="w-full justification-area"
                  ></textarea>
                  <div class="char-hint">{{ justification.length }} characters (minimum 50 recommended)</div>
                </div>

                <!-- Supporting Documents -->
                <div class="form-section">
                  <h3 class="section-title">Supporting Documents</h3>
                  <div class="docs-list">
                    @for (doc of supportingDocs; track doc.name) {
                      <div class="doc-row" [class.uploaded]="doc.uploaded">
                        <div class="doc-icon">
                          <i [class]="getDocIcon(doc.type)"></i>
                        </div>
                        <div class="doc-info">
                          <span class="doc-name">{{ doc.name }}</span>
                          <span class="doc-size">{{ doc.size }}</span>
                        </div>
                        @if (doc.uploaded) {
                          <div class="doc-status">
                            <i class="pi pi-check-circle"></i>
                            <span>Attached</span>
                          </div>
                        } @else {
                          <button
                            pButton
                            label="Attach"
                            icon="pi pi-upload"
                            class="p-button-sm p-button-outlined"
                            (click)="mockUpload(doc)"
                            pTooltip="Attach this document"
                            tooltipPosition="top"
                          ></button>
                        }
                      </div>
                    }
                  </div>
                  <button
                    pButton
                    label="Upload Additional Document"
                    icon="pi pi-plus"
                    class="p-button-sm p-button-text upload-more-btn"
                  ></button>
                </div>

                <!-- Urgency Notice -->
                <div class="urgency-options">
                  <h3 class="section-title">Request Urgency</h3>
                  <div class="urgency-btns">
                    @for (u of urgencyOptions; track u.value) {
                      <button
                        class="urgency-btn"
                        [class.selected]="selectedUrgency === u.value"
                        [class]="'urgency-btn urgency-' + u.value + (selectedUrgency === u.value ? ' selected' : '')"
                        (click)="selectedUrgency = u.value"
                      >
                        <i [class]="u.icon"></i>
                        <span class="urgency-label">{{ u.label }}</span>
                        <span class="urgency-desc">{{ u.desc }}</span>
                      </button>
                    }
                  </div>
                </div>

                <!-- Actions -->
                <div class="form-actions">
                  <button
                    pButton
                    label="Clear"
                    icon="pi pi-refresh"
                    class="p-button-outlined p-button-secondary"
                    (click)="resetForm()"
                  ></button>
                  <button
                    pButton
                    label="Submit Request"
                    icon="pi pi-send"
                    [disabled]="!isFormValid()"
                    (click)="submitRequest()"
                  ></button>
                </div>

              </div>
            </div>
          }

          <!-- Success State -->
          @if (submitted()) {
            <div class="success-card">
              <div class="success-icon">
                <i class="pi pi-check-circle"></i>
              </div>
              <h3 class="success-title">Pre-Auth Request Submitted</h3>
              <p class="success-sub">Your request has been forwarded to Blue Cross Blue Shield for review.</p>
              <div class="success-ref">
                <span class="success-ref-label">Pre-Auth Request Number</span>
                <span class="success-ref-num">{{ referenceNumber() }}</span>
              </div>
              <p class="success-timeline">
                <i class="pi pi-clock"></i>
                Standard review time: 3–5 business days. Urgent requests: 24–48 hours.
              </p>
              <button
                pButton
                label="Submit Another Request"
                icon="pi pi-plus"
                class="p-button-outlined"
                (click)="resetForm()"
              ></button>
            </div>
          }

        </div>

        <!-- Right: Pending Requests -->
        <div class="requests-panel">
          <div class="requests-panel-header">
            <i class="pi pi-list-check"></i>
            <h2 class="requests-panel-title">Authorization Requests</h2>
          </div>

          <div class="requests-list">
            @for (req of pendingRequests(); track req.id) {
              <div class="request-card" [class]="'status-' + req.status.toLowerCase().replace(' ', '-')">
                <div class="request-card-top">
                  <div class="request-id-group">
                    <span class="request-id">{{ req.id }}</span>
                    <span class="request-procedure">{{ req.procedure }}</span>
                  </div>
                  <p-tag
                    [value]="req.status"
                    [severity]="getStatusSeverity(req.status)"
                  ></p-tag>
                </div>

                <div class="request-meta">
                  <div class="request-meta-item">
                    <i class="pi pi-user"></i>
                    <span>{{ req.provider }}</span>
                  </div>
                  <div class="request-meta-item">
                    <i class="pi pi-calendar"></i>
                    <span>Submitted {{ formatDate(req.submittedOn) }}</span>
                  </div>
                  @if (req.insuranceRef) {
                    <div class="request-meta-item">
                      <i class="pi pi-tag"></i>
                      <span>Ins. Ref: {{ req.insuranceRef }}</span>
                    </div>
                  }
                  @if (req.estimatedDecision) {
                    <div class="request-meta-item estimate-item">
                      <i class="pi pi-clock"></i>
                      <span>Decision est. {{ formatDate(req.estimatedDecision) }}</span>
                    </div>
                  }
                </div>

                @if (req.status === 'Approved') {
                  <div class="approval-notice">
                    <i class="pi pi-check-circle"></i>
                    Authorization approved — schedule within 90 days
                  </div>
                }
                @if (req.status === 'Denied') {
                  <div class="denial-notice">
                    <i class="pi pi-times-circle"></i>
                    Authorization denied — contact your provider about appeal options
                  </div>
                }

              </div>
            } @empty {
              <div class="empty-requests">
                <i class="pi pi-inbox"></i>
                <p>No requests yet</p>
              </div>
            }
          </div>

          <!-- Legend -->
          <div class="status-legend">
            @for (item of statusLegend; track item.label) {
              <div class="legend-item">
                <span class="legend-dot" [class]="'dot-' + item.color"></span>
                <span class="legend-label">{{ item.label }}</span>
              </div>
            }
          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    /* ===== Page ===== */
    .preauth-page {
      max-width: 1100px;
      margin: 0 auto;
    }

    /* ===== Page Header ===== */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--blue-500), var(--blue-700));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
    }

    .page-title {
      margin: 0 0 0.2rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .page-subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .header-stats {
      display: flex;
      gap: 0.75rem;
    }

    .stat-pill {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 0.625rem 1.125rem;
      min-width: 90px;
    }

    .stat-pill-num {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--primary-color);
      line-height: 1;
    }

    .stat-pill-label {
      font-size: 0.68rem;
      color: var(--text-color-secondary);
      margin-top: 0.2rem;
      text-align: center;
    }

    /* ===== Page Layout ===== */
    .page-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 1.5rem;
      align-items: start;
    }

    .form-column {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* ===== Insurance Info Card ===== */
    .insurance-info-card {
      background: linear-gradient(135deg, var(--blue-700), var(--blue-900));
      border-radius: var(--border-radius);
      padding: 1.25rem 1.5rem;
      color: white;
      box-shadow: 0 4px 16px rgba(30, 64, 175, 0.25);
    }

    .insurance-info-header {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      margin-bottom: 1rem;
    }

    .insurance-logo {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .insurance-info-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .insurance-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: rgba(255,255,255,0.65);
    }

    .insurance-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: white;
    }

    .insurance-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem 1.5rem;
    }

    .insurance-detail {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .detail-key {
      font-size: 0.6rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.55);
    }

    .detail-val {
      font-size: 0.8rem;
      font-weight: 600;
      color: white;
    }

    .mono {
      font-family: 'Courier New', monospace;
      letter-spacing: 0.04em;
    }

    /* ===== Form Card ===== */
    .form-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .form-card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.125rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);
      background: var(--surface-ground);
    }

    .form-card-header i {
      color: var(--primary-color);
      font-size: 1.1rem;
    }

    .form-card-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .form-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
    }

    /* ===== Form Fields ===== */
    .form-row-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .field-label {
      font-size: 0.83rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .required {
      color: var(--red-500);
    }

    .optional {
      font-size: 0.72rem;
      color: var(--text-color-secondary);
      font-weight: 400;
    }

    .char-hint {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
      text-align: right;
    }

    .justification-area {
      resize: vertical;
      font-family: inherit;
      font-size: 0.875rem;
    }

    /* ===== Documents ===== */
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .section-title {
      margin: 0;
      font-size: 0.83rem;
      font-weight: 700;
      color: var(--text-color);
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .docs-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .doc-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      background: var(--surface-ground);
      transition: border-color 0.15s;
    }

    .doc-row.uploaded {
      border-color: var(--green-300);
      background: var(--green-50, #f0fdf4);
    }

    .doc-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      color: var(--text-color-secondary);
      flex-shrink: 0;
    }

    .doc-row.uploaded .doc-icon {
      background: var(--green-100, #dcfce7);
      border-color: var(--green-200, #bbf7d0);
      color: var(--green-600);
    }

    .doc-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .doc-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .doc-size {
      font-size: 0.7rem;
      color: var(--text-color-secondary);
    }

    .doc-status {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--green-600);
    }

    .upload-more-btn {
      align-self: flex-start;
      font-size: 0.8rem;
    }

    /* ===== Urgency Options ===== */
    .urgency-options {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .urgency-btns {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.625rem;
    }

    .urgency-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.75rem 0.5rem;
      border: 2px solid var(--surface-border);
      border-radius: 10px;
      background: var(--surface-ground);
      cursor: pointer;
      font-family: inherit;
      text-align: center;
      transition: all 0.15s ease;
    }

    .urgency-btn i {
      font-size: 1rem;
      color: var(--text-color-secondary);
    }

    .urgency-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .urgency-desc {
      font-size: 0.62rem;
      color: var(--text-color-secondary);
    }

    .urgency-standard.selected {
      border-color: var(--blue-400);
      background: var(--blue-50, #eff6ff);
    }

    .urgency-standard.selected i,
    .urgency-standard.selected .urgency-label {
      color: var(--blue-600);
    }

    .urgency-urgent.selected {
      border-color: var(--orange-400);
      background: #fff7ed;
    }

    .urgency-urgent.selected i,
    .urgency-urgent.selected .urgency-label {
      color: var(--orange-600);
    }

    .urgency-emergency.selected {
      border-color: var(--red-400);
      background: var(--red-50, #fef2f2);
    }

    .urgency-emergency.selected i,
    .urgency-emergency.selected .urgency-label {
      color: var(--red-600);
    }

    /* ===== Form Actions ===== */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--surface-border);
    }

    /* ===== Success Card ===== */
    .success-card {
      background: var(--surface-card);
      border: 1px solid var(--green-200, #bbf7d0);
      border-radius: var(--border-radius);
      padding: 2.5rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.875rem;
      box-shadow: 0 4px 16px rgba(34, 197, 94, 0.1);
    }

    .success-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--green-50, #f0fdf4);
      color: var(--green-500);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }

    .success-title {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .success-sub {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-color-secondary);
      max-width: 380px;
    }

    .success-ref {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      padding: 0.875rem 1.5rem;
      background: var(--primary-50);
      border: 1px solid var(--primary-200, #a5b4fc);
      border-radius: 10px;
    }

    .success-ref-label {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text-color-secondary);
    }

    .success-ref-num {
      font-family: 'Courier New', monospace;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--primary-700);
      letter-spacing: 0.05em;
    }

    .success-timeline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.78rem;
      color: var(--text-color-secondary);
      margin: 0;
    }

    .success-timeline i {
      color: var(--orange-500);
    }

    /* ===== Requests Panel ===== */
    .requests-panel {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .requests-panel-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.125rem 1.25rem;
      border-bottom: 1px solid var(--surface-border);
      background: var(--surface-ground);
    }

    .requests-panel-header i {
      color: var(--primary-color);
    }

    .requests-panel-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .requests-list {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .request-card {
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      background: var(--surface-ground);
      overflow: hidden;
    }

    .request-card.status-approved {
      border-left: 3px solid var(--green-400);
    }

    .request-card.status-denied {
      border-left: 3px solid var(--red-400);
    }

    .request-card.status-pending,
    .request-card.status-under-review {
      border-left: 3px solid var(--orange-300);
    }

    .request-card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.875rem 1rem 0.5rem;
    }

    .request-id-group {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .request-id {
      font-family: 'Courier New', monospace;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-color-secondary);
      letter-spacing: 0.04em;
    }

    .request-procedure {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--text-color);
    }

    .request-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.5rem 1rem 0.875rem;
    }

    .request-meta-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.72rem;
      color: var(--text-color-secondary);
    }

    .request-meta-item i {
      font-size: 0.65rem;
      width: 12px;
    }

    .estimate-item {
      color: var(--orange-600);
      font-weight: 600;
    }

    .approval-notice,
    .denial-notice {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      font-size: 0.72rem;
      font-weight: 600;
      border-top: 1px solid var(--surface-border);
    }

    .approval-notice {
      color: var(--green-700);
      background: var(--green-50, #f0fdf4);
    }

    .denial-notice {
      color: var(--red-700);
      background: var(--red-50, #fef2f2);
    }

    .approval-notice i { color: var(--green-500); }
    .denial-notice i { color: var(--red-500); }

    .empty-requests {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: var(--text-color-secondary);
      gap: 0.4rem;
      font-size: 0.85rem;
    }

    .empty-requests i {
      font-size: 2rem;
      opacity: 0.2;
    }

    .empty-requests p {
      margin: 0;
      font-weight: 600;
      color: var(--text-color);
    }

    /* ===== Status Legend ===== */
    .status-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
      padding: 0.875rem 1.25rem;
      border-top: 1px solid var(--surface-border);
      background: var(--surface-ground);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .dot-pending { background: var(--orange-300); }
    .dot-review { background: var(--blue-400); }
    .dot-approved { background: var(--green-400); }
    .dot-denied { background: var(--red-400); }

    .legend-label {
      font-size: 0.68rem;
      color: var(--text-color-secondary);
    }

    /* ===== Utility ===== */
    .w-full { width: 100%; }

    /* ===== Responsive ===== */
    @media (max-width: 1000px) {
      .page-layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .form-row-2col,
      .urgency-btns {
        grid-template-columns: 1fr;
      }

      .insurance-details {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class PreauthRequestComponent {
  selectedProcedure: string = '';
  selectedProvider: string = '';
  cptCode: string = '';
  justification: string = '';
  selectedUrgency: string = 'standard';

  submitted = signal(false);
  referenceNumber = signal('');

  procedureOptions = [
    { label: 'MRI', value: 'MRI' },
    { label: 'CT Scan', value: 'CT Scan' },
    { label: 'Specialist Visit', value: 'Specialist Visit' },
    { label: 'Surgery', value: 'Surgery' },
    { label: 'Physical Therapy', value: 'Physical Therapy' },
    { label: 'Other', value: 'Other' }
  ];

  providerOptions = [
    { label: 'Dr. Sarah Johnson (Internal Medicine)', value: 'Dr. Sarah Johnson' },
    { label: 'Dr. Michael Chen (Cardiology)', value: 'Dr. Michael Chen' },
    { label: 'Dr. Emily Rodriguez (Dermatology)', value: 'Dr. Emily Rodriguez' },
    { label: 'Dr. Lisa Patel (Ophthalmology)', value: 'Dr. Lisa Patel' },
    { label: 'Dr. James Williams (Orthopedics)', value: 'Dr. James Williams' }
  ];

  urgencyOptions = [
    { value: 'standard', label: 'Standard', desc: '3–5 business days', icon: 'pi pi-calendar' },
    { value: 'urgent', label: 'Urgent', desc: '24–48 hours', icon: 'pi pi-exclamation-circle' },
    { value: 'emergency', label: 'Emergency', desc: 'Same day review', icon: 'pi pi-bolt' }
  ];

  supportingDocs: MockDocument[] = [
    { name: 'Physician Referral Letter', size: 'Required', type: 'pdf', uploaded: false },
    { name: 'Recent Lab Results', size: 'If applicable', type: 'lab', uploaded: true },
    { name: 'Imaging Reports', size: 'If applicable', type: 'image', uploaded: false },
    { name: 'Insurance Pre-Auth Form', size: 'Required', type: 'form', uploaded: false }
  ];

  pendingRequests = signal<PreauthRequest[]>([
    {
      id: 'PA-2025-0089',
      procedure: 'MRI - Lumbar Spine',
      provider: 'Dr. James Williams',
      submittedOn: new Date(Date.now() - 5 * 86400000),
      status: 'Under Review',
      insuranceRef: 'BCBS-AUT-20250221',
      estimatedDecision: new Date(Date.now() + 2 * 86400000)
    },
    {
      id: 'PA-2025-0071',
      procedure: 'Physical Therapy (12 sessions)',
      provider: 'Dr. Sarah Johnson',
      submittedOn: new Date(Date.now() - 30 * 86400000),
      status: 'Approved',
      insuranceRef: 'BCBS-AUT-20250125',
      estimatedDecision: null
    },
    {
      id: 'PA-2024-0215',
      procedure: 'Specialist Visit - Neurology',
      provider: 'Dr. Sarah Johnson',
      submittedOn: new Date(Date.now() - 120 * 86400000),
      status: 'Approved',
      insuranceRef: 'BCBS-AUT-20241018',
      estimatedDecision: null
    }
  ]);

  pendingCount = computed(() =>
    this.pendingRequests().filter(r => r.status === 'Pending' || r.status === 'Under Review').length
  );

  approvedCount = computed(() =>
    this.pendingRequests().filter(r => r.status === 'Approved').length
  );

  readonly statusLegend = [
    { label: 'Pending', color: 'pending' },
    { label: 'Under Review', color: 'review' },
    { label: 'Approved', color: 'approved' },
    { label: 'Denied', color: 'denied' }
  ];

  isFormValid(): boolean {
    return !!this.selectedProcedure && !!this.selectedProvider && this.justification.trim().length >= 10;
  }

  submitRequest(): void {
    if (!this.isFormValid()) return;
    const year = new Date().getFullYear();
    const num = String(Math.floor(Math.random() * 900 + 100)).padStart(4, '0');
    this.referenceNumber.set(`PA-${year}-${num}`);
    this.submitted.set(true);
  }

  resetForm(): void {
    this.selectedProcedure = '';
    this.selectedProvider = '';
    this.cptCode = '';
    this.justification = '';
    this.selectedUrgency = 'standard';
    this.supportingDocs.forEach(d => { if (d.name !== 'Recent Lab Results') d.uploaded = false; });
    this.submitted.set(false);
    this.referenceNumber.set('');
  }

  mockUpload(doc: MockDocument): void {
    doc.uploaded = true;
  }

  getDocIcon(type: string): string {
    const icons: Record<string, string> = {
      pdf: 'pi pi-file-pdf',
      lab: 'pi pi-chart-line',
      image: 'pi pi-image',
      form: 'pi pi-file-edit'
    };
    return icons[type] ?? 'pi pi-file';
  }

  getStatusSeverity(status: PreauthStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<PreauthStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Pending': 'warn',
      'Under Review': 'info',
      'Approved': 'success',
      'Denied': 'danger',
      'Expired': 'secondary'
    };
    return map[status];
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
