import { Component, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TextareaModule } from 'primeng/textarea';
import { PasswordModule } from 'primeng/password';
import { TooltipModule } from 'primeng/tooltip';
import { PdfAccessibilityService } from '../../shared/utils/pdf-accessibility.service';

interface DataRecord {
  type: string;
  count: number;
  size: string;
}

interface DeletionReason {
  label: string;
  value: string;
}

interface FhirExportResource {
  label: string;
  value: string;
  icon: string;
  checked: boolean;
}

interface FhirFormatOption {
  label: string;
  value: string;
}

interface ResearchStudy {
  id: string;
  title: string;
  institution: string;
  duration: string;
  dataCategories: string[];
  learnMoreUrl: string;
}

interface RecordTypeOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-data-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule, TagModule, DialogModule,
    TableModule, DropdownModule, DividerModule, ProgressBarModule, CheckboxModule,
    SelectButtonModule, InputTextModule, InputSwitchModule, TextareaModule, PasswordModule,
    TooltipModule
  ],
  template: `
    <div class="data-mgmt-page">
      <header class="page-header">
        <h1>Data Management</h1>
        <p>View, export, and manage your health data</p>
      </header>

      <!-- Data Summary -->
      <p-card header="Your Health Data Summary" styleClass="summary-card">
        <p class="card-description">
          An overview of the health records stored in your portal account.
        </p>
        <p-table [value]="dataRecords()" styleClass="p-datatable-sm p-datatable-striped" [tableStyle]="{ 'min-width': '100%' }">
          <ng-template pTemplate="header">
            <tr>
              <th>Record Type</th>
              <th class="text-right">Count</th>
              <th class="text-right">Size</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-record>
            <tr>
              <td>
                <span class="record-type-cell">
                  <i class="pi pi-file record-icon"></i>
                  {{ record.type }}
                </span>
              </td>
              <td class="text-right">
                <strong>{{ record.count }}</strong>
              </td>
              <td class="text-right text-secondary">{{ record.size }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="footer">
            <tr>
              <td><strong>Total</strong></td>
              <td class="text-right"><strong>{{ totalCount() }}</strong></td>
              <td class="text-right"><strong>{{ totalSize }}</strong></td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <p-divider></p-divider>

      <!-- FHIR Export - Enhanced Section -->
      <p-card styleClass="fhir-export-card">
        <ng-template pTemplate="header">
          <div class="card-header-content">
            <div class="card-header-text">
              <h3>FHIR Export &amp; Data Portability</h3>
              <div class="header-tags">
                <p-tag value="FHIR R4" severity="info"></p-tag>
                <p-tag value="Interoperable" severity="success"></p-tag>
              </div>
            </div>
          </div>
        </ng-template>

        <!-- Interoperability Info -->
        <div class="interop-banner">
          <i class="pi pi-info-circle"></i>
          <div>
            <strong>Your Right to Data Portability</strong>
            <p>
              Under the 21st Century Cures Act and ONC Information Blocking Rule, you have the right
              to access, export, and share your health data in standardized formats. FHIR (Fast Healthcare
              Interoperability Resources) exports work with most modern EHR systems, personal health apps,
              and care coordination platforms. C-CDA format is compatible with legacy systems.
            </p>
          </div>
        </div>

        <!-- Resource Selection -->
        <div class="export-section">
          <h4 class="section-title">Select Data to Export</h4>
          <div class="resource-grid">
            @for (resource of fhirResources(); track resource.value) {
              <div class="resource-item" [class.checked]="resource.checked">
                <p-checkbox
                  [(ngModel)]="resource.checked"
                  [binary]="true"
                  [inputId]="'res-' + resource.value"
                ></p-checkbox>
                <label [for]="'res-' + resource.value" class="resource-label">
                  <i [class]="'pi ' + resource.icon"></i>
                  <span>{{ resource.label }}</span>
                </label>
              </div>
            }
          </div>
          <div class="select-all-row">
            <button
              pButton
              label="Select All"
              icon="pi pi-check-square"
              class="p-button-text p-button-sm"
              (click)="selectAllResources()"
            ></button>
            <button
              pButton
              label="Clear All"
              icon="pi pi-times"
              class="p-button-text p-button-sm p-button-secondary"
              (click)="clearAllResources()"
            ></button>
            <span class="selection-count">{{ selectedResourceCount() }} of {{ fhirResources().length }} selected</span>
          </div>
        </div>

        <!-- Format Selector -->
        <div class="export-section">
          <h4 class="section-title">Export Format</h4>
          <p-selectButton
            [options]="fhirFormats"
            [(ngModel)]="selectedFhirFormat"
            optionLabel="label"
            optionValue="value"
          ></p-selectButton>
          <p class="format-desc">
            @if (selectedFhirFormat === 'fhir_json') {
              <span><strong>FHIR R4 JSON Bundle</strong> - Standard JSON format. Best for modern health apps, SMART on FHIR applications, and API integrations.</span>
            } @else if (selectedFhirFormat === 'fhir_xml') {
              <span><strong>FHIR R4 XML Bundle</strong> - XML format. Compatible with HL7 FHIR-based systems and enterprise healthcare integrations.</span>
            } @else {
              <span><strong>C-CDA (Consolidated Clinical Document Architecture)</strong> - XML format for legacy EMR/EHR systems. Useful for transferring records to older providers.</span>
            }
          </p>
        </div>

        <!-- Export Features Summary -->
        <div class="export-features">
          <span><i class="pi pi-check-circle"></i> End-to-end encrypted download</span>
          <span><i class="pi pi-check-circle"></i> Valid for 24 hours after generation</span>
          <span><i class="pi pi-check-circle"></i> Machine-readable &amp; structured</span>
          <span><i class="pi pi-check-circle"></i> Compatible with Apple Health, Google Health</span>
        </div>

        @if (exportProgress() > 0) {
          <div class="export-progress">
            <div class="progress-label">
              @if (exportProgress() < 100) {
                <span>Preparing your export... {{ exportProgress() }}%</span>
              } @else {
                <span class="export-done"><i class="pi pi-check-circle"></i> Export ready for download</span>
              }
            </div>
            <p-progressBar [value]="exportProgress()" [showValue]="false" styleClass="export-progress-bar"></p-progressBar>
          </div>
        }

        <div class="card-actions">
          @if (exportProgress() === 100) {
            <button
              pButton
              [label]="'Download ' + selectedFormatLabel()"
              icon="pi pi-download"
              class="p-button-success"
            ></button>
            <button
              pButton
              label="Request New Export"
              icon="pi pi-refresh"
              class="p-button-outlined"
              (click)="startFhirExport()"
            ></button>
          } @else {
            <button
              pButton
              [label]="'Export ' + selectedResourceCount() + ' Resource(s)'"
              icon="pi pi-upload"
              [disabled]="(exportProgress() > 0 && exportProgress() < 100) || selectedResourceCount() === 0"
              (click)="startFhirExport()"
            ></button>
          }
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Quick FHIR Export (legacy / simple) -->
      <p-card styleClass="export-card">
        <ng-template pTemplate="header">
          <div class="card-header-content">
            <div class="card-header-text">
              <h3>Quick Full Export (FHIR R4 JSON)</h3>
              <p-tag value="All Records" severity="secondary"></p-tag>
            </div>
          </div>
        </ng-template>
        <p class="card-description">
          Download a complete, portable copy of all your health records in FHIR R4 JSON format.
          This file is compatible with most electronic health record systems and personal health applications.
        </p>
        <div class="export-features">
          <span><i class="pi pi-check-circle"></i> FHIR R4 JSON bundle</span>
          <span><i class="pi pi-check-circle"></i> End-to-end encrypted download</span>
          <span><i class="pi pi-check-circle"></i> Includes all record types</span>
          <span><i class="pi pi-check-circle"></i> Valid for 24 hours after generation</span>
        </div>

        @if (quickExportProgress() > 0) {
          <div class="export-progress">
            <div class="progress-label">
              @if (quickExportProgress() < 100) {
                <span>Preparing your export... {{ quickExportProgress() }}%</span>
              } @else {
                <span class="export-done"><i class="pi pi-check-circle"></i> Export ready for download</span>
              }
            </div>
            <p-progressBar [value]="quickExportProgress()" [showValue]="false" styleClass="export-progress-bar"></p-progressBar>
          </div>
        }

        <div class="card-actions">
          @if (quickExportProgress() === 100) {
            <button
              pButton
              label="Download Export"
              icon="pi pi-download"
              class="p-button-success"
            ></button>
            <button
              pButton
              label="Request New Export"
              icon="pi pi-refresh"
              class="p-button-outlined"
              (click)="startExport()"
            ></button>
          } @else {
            <button
              pButton
              label="Request Full Export"
              icon="pi pi-upload"
              [disabled]="quickExportProgress() > 0 && quickExportProgress() < 100"
              (click)="startExport()"
            ></button>
          }
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Feature 12.7: Error Correction Request Form -->
      <p-card styleClass="correction-card">
        <ng-template pTemplate="header">
          <div class="card-header-content">
            <div class="card-header-text">
              <h3>Request Record Correction</h3>
              <p-tag value="Patient Right" severity="info"></p-tag>
            </div>
          </div>
        </ng-template>

        <div class="interop-banner correction-banner">
          <i class="pi pi-info-circle"></i>
          <div>
            <strong>Your Right to Request Corrections</strong>
            <p>
              Under HIPAA (45 CFR §164.526) and GDPR Article 16, you have the right to request correction of inaccurate
              or incomplete health records. We will review your request within 60 days and notify you of our decision.
            </p>
          </div>
        </div>

        @if (correctionSubmitted()) {
          <div class="success-banner">
            <i class="pi pi-check-circle"></i>
            <div>
              <strong>Correction Request Submitted</strong>
              <p>Your request has been received. Reference number: <strong>{{ correctionRefNumber() }}</strong>. You will be notified within 60 days.</p>
            </div>
          </div>
        } @else {
          <div class="correction-form">
            <div class="form-field">
              <label class="field-label" for="record-type">Record Type <span class="required-mark">*</span></label>
              <p-dropdown
                inputId="record-type"
                [options]="recordTypeOptions"
                [(ngModel)]="correctionRecordType"
                placeholder="Select record type"
                optionLabel="label"
                optionValue="value"
                [style]="{ width: '100%', maxWidth: '360px' }"
              ></p-dropdown>
            </div>
            <div class="form-field">
              <label class="field-label" for="error-desc">Description of Error <span class="required-mark">*</span></label>
              <textarea
                pTextarea
                id="error-desc"
                [(ngModel)]="correctionErrorDesc"
                placeholder="Describe what is incorrect or incomplete..."
                rows="3"
                class="correction-textarea"
              ></textarea>
            </div>
            <div class="form-field">
              <label class="field-label" for="suggested-correction">Suggested Correction <span class="required-mark">*</span></label>
              <textarea
                pTextarea
                id="suggested-correction"
                [(ngModel)]="correctionSuggested"
                placeholder="Describe the correct information..."
                rows="3"
                class="correction-textarea"
              ></textarea>
            </div>
            <div class="form-field">
              <label class="field-label" for="supporting-docs">Supporting Documentation (optional)</label>
              <div class="file-input-wrapper">
                <label class="file-input-label" for="correction-file-input">
                  <i class="pi pi-upload"></i>
                  <span>{{ correctionFileName() || 'Choose file or drag and drop' }}</span>
                </label>
                <input
                  type="file"
                  id="correction-file-input"
                  class="hidden-file-input"
                  (change)="onCorrectionFileSelected($event)"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </div>
              <span class="field-hint">Accepted: PDF, JPG, PNG, DOC (max 10 MB)</span>
            </div>
          </div>
          <div class="card-actions">
            <button
              pButton
              label="Submit Correction Request"
              icon="pi pi-send"
              [disabled]="!correctionRecordType || !correctionErrorDesc || !correctionSuggested"
              (click)="submitCorrectionRequest()"
            ></button>
          </div>
        }
      </p-card>

      <p-divider></p-divider>

      <!-- Feature 12.8: Research Participation Dashboard -->
      <p-card styleClass="research-card">
        <ng-template pTemplate="header">
          <div class="card-header-content">
            <div class="card-header-text">
              <h3>Research Participation</h3>
              <p-tag value="De-identified" severity="secondary"></p-tag>
            </div>
          </div>
        </ng-template>

        <div class="research-status-row">
          <div class="research-status-info">
            <i class="pi" [class]="researchOptIn() ? 'pi-users' : 'pi-user-minus'"
               [style]="{ color: researchOptIn() ? 'var(--green-600)' : 'var(--text-color-secondary)', fontSize: '1.5rem' }"></i>
            <div class="research-status-text">
              <span class="research-status-label">
                You are opted <strong>{{ researchOptIn() ? 'IN' : 'OUT' }}</strong> of de-identified research data sharing
              </span>
              <span class="research-status-sub">
                @if (researchOptIn()) {
                  Your anonymized data helps advance medical research. No personally identifiable information is shared.
                } @else {
                  Your data is not shared for research purposes.
                }
              </span>
            </div>
          </div>
          <div class="research-toggle-area">
            <span class="research-toggle-label">{{ researchOptIn() ? 'Opt Out' : 'Opt In' }}</span>
            <p-inputSwitch
              [ngModel]="researchOptIn()"
              (ngModelChange)="researchOptIn.set($event)"
            ></p-inputSwitch>
          </div>
        </div>

        @if (researchOptIn()) {
          <div class="research-opted-in-section">
            <h4 class="research-studies-title">
              <i class="pi pi-list-check"></i>
              Active Studies Your Data Contributes To
            </h4>
            <div class="research-studies-list">
              @for (study of researchStudies(); track study.id) {
                <div class="research-study-card">
                  <div class="study-icon">
                    <i class="pi pi-chart-bar"></i>
                  </div>
                  <div class="study-body">
                    <div class="study-title-row">
                      <h4 class="study-title">{{ study.title }}</h4>
                    </div>
                    <div class="study-meta">
                      <span class="study-meta-item">
                        <i class="pi pi-building"></i> {{ study.institution }}
                      </span>
                      <span class="study-meta-item">
                        <i class="pi pi-calendar"></i> {{ study.duration }}
                      </span>
                    </div>
                    <div class="study-data-categories">
                      <span class="data-cat-label">Data used:</span>
                      @for (cat of study.dataCategories; track cat) {
                        <span class="data-cat-chip">{{ cat }}</span>
                      }
                    </div>
                    <p class="study-desc">Your de-identified data contributes to advancing research in this area. No personally identifiable information is shared.</p>
                  </div>
                  <div class="study-actions">
                    <a [href]="study.learnMoreUrl" target="_blank" rel="noopener noreferrer" class="learn-more-link">
                      <i class="pi pi-external-link"></i> Learn More
                    </a>
                  </div>
                </div>
              }
            </div>

            <div class="research-transparency-note">
              <i class="pi pi-shield"></i>
              <span>
                <strong>Transparency Guarantee:</strong> Your data is fully de-identified per HIPAA Safe Harbor method (45 CFR §164.514(b)).
                No personally identifiable information — including name, date of birth, address, or MRN — is ever shared with researchers.
              </span>
            </div>
          </div>
        }
      </p-card>

      <p-divider></p-divider>

      <!-- Accessible Documents — WCAG 2.1 AA PDF Conversion -->
      <p-card styleClass="accessible-docs-card">
        <ng-template pTemplate="header">
          <div class="card-header-content">
            <div class="card-header-text">
              <h3>Accessible Documents</h3>
              <p-tag value="WCAG 2.1 AA" severity="success"></p-tag>
              <p-tag value="PDF Accessibility" severity="info"></p-tag>
            </div>
          </div>
        </ng-template>

        <p class="card-description">
          Convert your health documents to accessible tagged PDF format (WCAG 2.1 AA compliant).
          Tagged PDFs work with screen readers and assistive technologies so everyone can access their health information.
        </p>

        <!-- Batch Convert All Button -->
        <div class="accessible-docs-actions">
          <button
            pButton
            label="Convert All Untagged"
            icon="pi pi-refresh"
            class="p-button-outlined"
            [disabled]="pdfService.untaggedCount() === 0 || pdfService.isAnyProcessing()"
            (click)="pdfService.convertAll()"
          ></button>
          <span class="accessible-docs-stats">
            <span class="stat-tagged"><i class="pi pi-check-circle"></i> {{ pdfService.taggedCount() }} Tagged</span>
            <span class="stat-untagged"><i class="pi pi-circle"></i> {{ pdfService.untaggedCount() }} Not Tagged</span>
          </span>
        </div>

        <!-- Document List -->
        <div class="accessible-docs-list">
          @for (doc of pdfService.documents(); track doc.id) {
            <div class="accessible-doc-item" [class.accessible-doc-item--tagged]="doc.isTagged">
              <div class="accessible-doc-icon">
                <i class="pi pi-file-pdf"></i>
              </div>

              <div class="accessible-doc-info">
                <div class="accessible-doc-name">{{ doc.name }}</div>
                <div class="accessible-doc-meta">
                  <span><i class="pi pi-database"></i> {{ doc.fileSize }}</span>
                  @if (doc.isTagged && doc.appliedTags) {
                    <span class="doc-tags-row">
                      @for (tag of doc.appliedTags; track tag) {
                        <span class="doc-tag-chip">{{ tag }}</span>
                      }
                    </span>
                  }
                </div>
              </div>

              <div class="accessible-doc-status">
                @if (doc.isTagged) {
                  <span class="wcag-badge">
                    <i class="pi pi-check-circle"></i>
                    WCAG {{ doc.wcagLevel }}
                  </span>
                } @else if (doc.conversionStatus === 'processing') {
                  <div class="doc-conversion-progress">
                    <span class="doc-converting-label">Converting...</span>
                    <p-progressBar
                      [value]="doc.conversionProgress"
                      [showValue]="false"
                      styleClass="doc-progress-bar">
                    </p-progressBar>
                  </div>
                } @else {
                  <span class="not-tagged-badge">
                    <i class="pi pi-times-circle"></i>
                    Not Tagged
                  </span>
                }
              </div>

              <div class="accessible-doc-action">
                @if (!doc.isTagged && doc.conversionStatus !== 'processing') {
                  <button
                    pButton
                    label="Convert to Accessible PDF"
                    icon="pi pi-refresh"
                    class="p-button-sm p-button-outlined"
                    (click)="pdfService.convertDocument(doc.id)"
                  ></button>
                } @else if (doc.isTagged) {
                  <button
                    pButton
                    icon="pi pi-download"
                    label="Download"
                    class="p-button-sm p-button-text"
                    pTooltip="Download accessible PDF"
                  ></button>
                }
              </div>
            </div>
          }
        </div>

        <div class="accessible-docs-info-note">
          <i class="pi pi-info-circle"></i>
          <span>
            Tagged PDFs include semantic structure (headings, lists, tables, alt text, reading order) making them
            fully compatible with JAWS, NVDA, VoiceOver, and other assistive technologies.
            Conversion uses heuristic tagging and complies with PDF/UA-1 and WCAG 2.1 Level AA.
          </span>
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Feature 12.6: Right to Erasure / Account Deletion (Enhanced) -->
      <p-card styleClass="deletion-card">
        <ng-template pTemplate="header">
          <div class="card-header-content danger-header">
            <div class="card-header-text">
              <h3>Delete Account &amp; Right to Erasure</h3>
              <p-tag value="Irreversible" severity="danger"></p-tag>
            </div>
          </div>
        </ng-template>

        <!-- Feature 12.6: Warning Card with red border -->
        <div class="erasure-warning-card">
          <div class="erasure-warning-header">
            <i class="pi pi-exclamation-triangle"></i>
            <strong>Permanent Action — Cannot Be Undone</strong>
          </div>
          <ul class="erasure-consequences">
            <li>Your portal account and login credentials will be <strong>permanently deleted</strong></li>
            <li>All portal message history, e-documents, and preferences will be removed</li>
            <li>Scheduled appointment reminders and telehealth links will be cancelled</li>
            <li>Any pending billing notifications will no longer be sent to you</li>
            <li>Your <strong>clinical health records</strong> are retained by your healthcare provider as required by HIPAA and applicable state law (typically 7–10 years)</li>
            <li>You may request paper copies of your records from your provider after deletion</li>
          </ul>
          <p class="erasure-gdpr-note">
            <i class="pi pi-info-circle"></i>
            Under GDPR Article 17 and applicable law, your deletion request will be processed within 30 days.
          </p>
        </div>

        <!-- Feature 12.6: Confirmation Checkboxes -->
        <div class="erasure-checkboxes">
          <div class="erasure-checkbox-row">
            <p-checkbox
              [(ngModel)]="deletionConfirmedIrreversible"
              [binary]="true"
              inputId="chk-irreversible"
            ></p-checkbox>
            <label for="chk-irreversible" class="erasure-checkbox-label">
              I understand this action is irreversible and all my portal data will be permanently deleted
            </label>
          </div>
          <div class="erasure-checkbox-row">
            <p-checkbox
              [(ngModel)]="deletionConfirmedDownloaded"
              [binary]="true"
              inputId="chk-downloaded"
            ></p-checkbox>
            <label for="chk-downloaded" class="erasure-checkbox-label">
              I have downloaded or saved a copy of my health records before proceeding
            </label>
          </div>
        </div>

        <div class="card-actions">
          <button
            pButton
            label="Request Account Deletion"
            icon="pi pi-trash"
            class="p-button-danger p-button-outlined"
            [disabled]="!deletionConfirmedIrreversible || !deletionConfirmedDownloaded"
            (click)="showDeletionDialog.set(true)"
          ></button>
        </div>
      </p-card>

      <!-- Compliance Notes -->
      <div class="compliance-grid">
        <div class="compliance-item">
          <i class="pi pi-shield"></i>
          <div>
            <strong>GDPR Compliance</strong>
            <p>You have the right to access, correct, delete, and port your personal data under the General Data Protection Regulation (EU) 2016/679.</p>
          </div>
        </div>
        <div class="compliance-item">
          <i class="pi pi-shield"></i>
          <div>
            <strong>CCPA Compliance</strong>
            <p>California residents have the right to know what personal information is collected, request deletion, and opt out of the sale of personal information.</p>
          </div>
        </div>
        <div class="compliance-item">
          <i class="pi pi-shield"></i>
          <div>
            <strong>21st Century Cures Act</strong>
            <p>Prohibits information blocking and guarantees patients the right to access their electronic health information in standardized FHIR R4 format.</p>
          </div>
        </div>
        <div class="compliance-item">
          <i class="pi pi-shield"></i>
          <div>
            <strong>HIPAA Right of Access</strong>
            <p>Under HIPAA, you have the right to inspect, copy, and direct your health information to a third party within 30 days of request.</p>
          </div>
        </div>
      </div>

      <!-- Feature 12.6: Enhanced Deletion Confirmation Dialog -->
      <p-dialog
        header="Confirm Account Deletion Request"
        [(visible)]="showDeletionDialog"
        [modal]="true"
        [style]="{ width: '520px' }"
        [draggable]="false"
        [resizable]="false"
      >
        @if (!deletionRequestSubmitted()) {
          <div class="deletion-dialog-body">
            <div class="dialog-warning-icon">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <h3>Final Confirmation Required</h3>
            <p>
              To confirm your identity, please enter your current password. Your account deletion request will be submitted immediately.
            </p>
            <div class="form-field">
              <label class="field-label" for="confirm-password">Current Password</label>
              <p-password
                inputId="confirm-password"
                [(ngModel)]="deletionPassword"
                [feedback]="false"
                [toggleMask]="true"
                placeholder="Enter your password"
                styleClass="w-full"
              ></p-password>
            </div>
          </div>
          <ng-template pTemplate="footer">
            <button pButton label="Cancel" class="p-button-text" (click)="cancelDeletion()"></button>
            <button
              pButton
              label="Submit Deletion Request"
              icon="pi pi-trash"
              class="p-button-danger"
              [disabled]="!deletionPassword"
              (click)="submitDeletionRequest()"
            ></button>
          </ng-template>
        } @else {
          <div class="deletion-submitted-body">
            <div class="deletion-submitted-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <h3>Deletion Request Submitted</h3>
            <p>
              Your account will be deleted within <strong>30 days</strong> per regulatory requirements.
            </p>
            <div class="deletion-ref-box">
              <span class="deletion-ref-label">Reference Number</span>
              <span class="deletion-ref-number">{{ deletionRefNumber() }}</span>
            </div>
            <p class="deletion-submitted-note">
              You will receive a confirmation email. If you change your mind, contact support within 7 days.
            </p>
          </div>
          <ng-template pTemplate="footer">
            <button pButton label="Close" class="p-button-outlined" (click)="closeDeletionDialog()"></button>
          </ng-template>
        }
      </p-dialog>
    </div>
  `,
  styles: [`
    .data-mgmt-page { max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0; }
    .page-header p { color: var(--text-color-secondary); margin: 0.25rem 0 0; }
    .card-description { color: var(--text-color-secondary); margin: 0 0 1.25rem; font-size: 0.9rem; line-height: 1.6; }
    .record-type-cell { display: flex; align-items: center; gap: 0.5rem; }
    .record-icon { color: var(--primary-400); font-size: 0.875rem; }
    .text-right { text-align: right; }
    .text-secondary { color: var(--text-color-secondary); }
    .card-header-content { padding: 1rem 1rem 0; }
    .card-header-text { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .card-header-text h3 { margin: 0; font-size: 1.05rem; }
    .header-tags { display: flex; gap: 0.5rem; }
    .danger-header h3 { color: var(--red-600); }
    /* Interop Banner */
    .interop-banner { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.875rem 1rem; background: var(--blue-50); border: 1px solid var(--blue-200); border-radius: var(--border-radius); margin-bottom: 1.25rem; font-size: 0.85rem; color: var(--blue-800); }
    .interop-banner i { font-size: 1rem; color: var(--blue-500); flex-shrink: 0; margin-top: 0.1rem; }
    .interop-banner strong { display: block; margin-bottom: 0.25rem; }
    .interop-banner p { margin: 0; line-height: 1.55; }
    .correction-banner { background: var(--surface-ground); border-color: var(--surface-border); color: var(--text-color-secondary); }
    .correction-banner i { color: var(--primary-400); }
    /* Export Sections */
    .export-section { margin-bottom: 1.25rem; }
    .section-title { margin: 0 0 0.875rem; font-size: 0.9rem; font-weight: 600; color: var(--text-color); }
    .resource-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.5rem; margin-bottom: 0.75rem; }
    .resource-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.625rem 0.875rem; border: 1px solid var(--surface-border); border-radius: var(--border-radius); cursor: pointer; transition: border-color 0.2s, background 0.2s; }
    .resource-item.checked { background: var(--primary-50); border-color: var(--primary-300); }
    .resource-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem; }
    .resource-label i { color: var(--primary-400); font-size: 0.875rem; }
    .select-all-row { display: flex; align-items: center; gap: 0.5rem; }
    .selection-count { font-size: 0.8rem; color: var(--text-color-secondary); margin-left: auto; }
    .format-desc { font-size: 0.825rem; color: var(--text-color-secondary); margin: 0.75rem 0 0; line-height: 1.5; }
    /* Export Features */
    .export-features { display: flex; flex-wrap: wrap; gap: 0.75rem 1.5rem; margin-bottom: 1.25rem; }
    .export-features span { display: flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; color: var(--green-700); }
    .export-features i { font-size: 0.875rem; }
    .export-progress { margin: 1rem 0; }
    .progress-label { font-size: 0.875rem; margin-bottom: 0.5rem; color: var(--text-color-secondary); }
    .export-done { color: var(--green-600); display: flex; align-items: center; gap: 0.4rem; }
    .export-done i { font-size: 0.875rem; }
    .export-progress-bar { height: 8px; }
    .card-actions { margin-top: 1.25rem; display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .compliance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
    .compliance-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); font-size: 0.85rem; }
    .compliance-item i { color: var(--primary-500); font-size: 1rem; flex-shrink: 0; margin-top: 0.15rem; }
    .compliance-item strong { display: block; margin-bottom: 0.3rem; }
    .compliance-item p { margin: 0; color: var(--text-color-secondary); line-height: 1.5; }

    /* Feature 12.7: Correction Form Styles */
    .correction-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field-label { font-weight: 600; font-size: 0.875rem; color: var(--text-color); }
    .required-mark { color: var(--red-500); margin-left: 0.2rem; }
    .correction-textarea { width: 100%; resize: vertical; font-family: inherit; font-size: 0.875rem; }
    .file-input-wrapper { position: relative; }
    .file-input-label { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1rem; border: 2px dashed var(--surface-border); border-radius: var(--border-radius); cursor: pointer; font-size: 0.875rem; color: var(--text-color-secondary); transition: border-color 0.2s, background 0.2s; }
    .file-input-label:hover { border-color: var(--primary-300); background: var(--primary-50); color: var(--primary-700); }
    .file-input-label i { font-size: 1rem; }
    .hidden-file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
    .field-hint { font-size: 0.775rem; color: var(--text-color-secondary); }
    .success-banner { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--green-50); border: 1px solid var(--green-200); border-radius: var(--border-radius); color: var(--green-800); font-size: 0.875rem; margin-bottom: 0.5rem; }
    .success-banner i { font-size: 1.25rem; color: var(--green-600); flex-shrink: 0; margin-top: 0.1rem; }
    .success-banner strong { display: block; margin-bottom: 0.25rem; }
    .success-banner p { margin: 0; line-height: 1.5; }

    /* Feature 12.8: Research Styles */
    .research-status-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); margin-bottom: 1.25rem; flex-wrap: wrap; }
    .research-status-info { display: flex; align-items: flex-start; gap: 0.875rem; flex: 1; min-width: 0; }
    .research-status-text { display: flex; flex-direction: column; gap: 0.3rem; }
    .research-status-label { font-size: 0.9rem; font-weight: 500; color: var(--text-color); }
    .research-status-sub { font-size: 0.82rem; color: var(--text-color-secondary); line-height: 1.4; }
    .research-toggle-area { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
    .research-toggle-label { font-size: 0.85rem; font-weight: 600; color: var(--text-color-secondary); }
    .research-opted-in-section { margin-top: 0.5rem; }
    .research-studies-title { margin: 0 0 1rem; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; }
    .research-studies-title i { color: var(--primary-500); }
    .research-studies-list { display: flex; flex-direction: column; gap: 0.875rem; margin-bottom: 1.25rem; }
    .research-study-card { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.25rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); border-left: 3px solid var(--primary-400); }
    .study-icon { width: 40px; height: 40px; border-radius: 10px; background: var(--primary-50); color: var(--primary-600); display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
    .study-body { flex: 1; min-width: 0; }
    .study-title-row { margin-bottom: 0.4rem; }
    .study-title { margin: 0; font-size: 0.925rem; color: var(--text-color); }
    .study-meta { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; margin-bottom: 0.5rem; }
    .study-meta-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--text-color-secondary); }
    .study-meta-item i { font-size: 0.8rem; }
    .study-data-categories { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
    .data-cat-label { font-size: 0.75rem; font-weight: 600; color: var(--text-color-secondary); }
    .data-cat-chip { padding: 0.15rem 0.5rem; background: var(--surface-100); border: 1px solid var(--surface-border); border-radius: 12px; font-size: 0.72rem; color: var(--text-color-secondary); }
    .study-desc { margin: 0; font-size: 0.8rem; color: var(--text-color-secondary); line-height: 1.45; }
    .study-actions { flex-shrink: 0; }
    .learn-more-link { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--primary-500); text-decoration: none; }
    .learn-more-link:hover { text-decoration: underline; }
    .research-transparency-note { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.875rem 1rem; background: var(--green-50); border: 1px solid var(--green-100); border-radius: var(--border-radius); font-size: 0.8rem; color: var(--green-800); line-height: 1.5; }
    .research-transparency-note i { color: var(--green-600); flex-shrink: 0; margin-top: 0.1rem; }

    /* Feature 12.6: Erasure Warning */
    .erasure-warning-card { border: 2px solid var(--red-300); border-radius: var(--border-radius); padding: 1.25rem; background: var(--red-50); margin-bottom: 1.25rem; }
    .erasure-warning-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.875rem; color: var(--red-700); font-size: 0.95rem; }
    .erasure-warning-header i { font-size: 1.25rem; }
    .erasure-consequences { margin: 0 0 0.875rem; padding-left: 1.5rem; color: var(--red-800); font-size: 0.855rem; line-height: 1.85; }
    .erasure-gdpr-note { margin: 0; display: flex; align-items: flex-start; gap: 0.4rem; font-size: 0.8rem; color: var(--red-700); padding-top: 0.5rem; border-top: 1px solid var(--red-200); line-height: 1.5; }
    .erasure-gdpr-note i { flex-shrink: 0; margin-top: 0.15rem; }
    .erasure-checkboxes { display: flex; flex-direction: column; gap: 0.875rem; margin-bottom: 1rem; }
    .erasure-checkbox-row { display: flex; align-items: flex-start; gap: 0.75rem; }
    .erasure-checkbox-label { font-size: 0.875rem; color: var(--text-color); line-height: 1.5; cursor: pointer; }

    /* Deletion Dialog */
    .deletion-dialog-body { padding: 0.5rem 0 1rem; }
    .dialog-warning-icon { font-size: 3rem; color: var(--red-500); margin-bottom: 1rem; text-align: center; }
    .dialog-warning-icon i { font-size: 3rem; }
    .deletion-dialog-body h3 { margin: 0 0 0.75rem; text-align: center; }
    .deletion-dialog-body p { color: var(--text-color-secondary); margin: 0 0 1rem; line-height: 1.5; }
    /* Deletion submitted state */
    .deletion-submitted-body { text-align: center; padding: 1rem 0; }
    .deletion-submitted-icon { font-size: 3rem; color: var(--green-500); margin-bottom: 1rem; }
    .deletion-submitted-icon i { font-size: 3rem; }
    .deletion-submitted-body h3 { margin: 0 0 0.75rem; }
    .deletion-submitted-body p { color: var(--text-color-secondary); margin: 0 0 1rem; line-height: 1.5; }
    .deletion-ref-box { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; padding: 0.875rem 1.25rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); margin-bottom: 1rem; }
    .deletion-ref-label { font-size: 0.725rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-color-secondary); }
    .deletion-ref-number { font-size: 1.15rem; font-weight: 700; font-family: monospace; color: var(--text-color); }
    .deletion-submitted-note { font-size: 0.825rem; color: var(--text-color-secondary); margin: 0; line-height: 1.5; }

    /* Accessible Documents Section */
    .accessible-docs-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .accessible-docs-stats {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      font-size: 0.85rem;
    }
    .stat-tagged { display: flex; align-items: center; gap: 0.35rem; color: var(--green-700); font-weight: 600; }
    .stat-tagged i { font-size: 0.85rem; }
    .stat-untagged { display: flex; align-items: center; gap: 0.35rem; color: var(--text-color-secondary); font-weight: 500; }
    .stat-untagged i { font-size: 0.85rem; }

    .accessible-docs-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .accessible-doc-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      transition: border-color 0.15s;
    }
    .accessible-doc-item--tagged {
      border-left: 3px solid var(--green-500);
    }
    .accessible-doc-item:not(.accessible-doc-item--tagged) {
      border-left: 3px solid var(--surface-border);
    }

    .accessible-doc-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--red-50);
      color: var(--red-500);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      flex-shrink: 0;
    }
    .accessible-doc-item--tagged .accessible-doc-icon {
      background: var(--green-50);
      color: var(--green-600);
    }

    .accessible-doc-info { flex: 1; min-width: 0; }
    .accessible-doc-name { font-size: 0.9rem; font-weight: 600; color: var(--text-color); margin-bottom: 0.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .accessible-doc-meta { display: flex; align-items: center; gap: 0.75rem; font-size: 0.78rem; color: var(--text-color-secondary); flex-wrap: wrap; }
    .accessible-doc-meta span { display: flex; align-items: center; gap: 0.3rem; }
    .accessible-doc-meta i { font-size: 0.75rem; }

    .doc-tags-row { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }
    .doc-tag-chip {
      padding: 0.1rem 0.45rem;
      background: var(--green-50);
      border: 1px solid var(--green-200);
      border-radius: 10px;
      font-size: 0.7rem;
      color: var(--green-800);
      font-weight: 500;
    }

    .accessible-doc-status { flex-shrink: 0; min-width: 120px; text-align: center; }

    .wcag-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.75rem;
      background: var(--green-50);
      border: 1px solid var(--green-300);
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--green-700);
    }
    .wcag-badge i { font-size: 0.78rem; }

    .not-tagged-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.75rem;
      background: var(--surface-100);
      border: 1px solid var(--surface-border);
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-color-secondary);
    }
    .not-tagged-badge i { font-size: 0.78rem; }

    .doc-conversion-progress { display: flex; flex-direction: column; gap: 0.3rem; min-width: 120px; }
    .doc-converting-label { font-size: 0.75rem; color: var(--primary-600); font-weight: 600; text-align: center; }
    .doc-progress-bar { height: 6px; }

    .accessible-doc-action { flex-shrink: 0; }

    .accessible-docs-info-note {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.875rem 1rem;
      background: var(--blue-50);
      border: 1px solid var(--blue-200);
      border-radius: var(--border-radius);
      font-size: 0.8rem;
      color: var(--blue-800);
      line-height: 1.55;
    }
    .accessible-docs-info-note i { color: var(--blue-500); flex-shrink: 0; margin-top: 0.1rem; }

    @media (max-width: 640px) {
      .compliance-grid { grid-template-columns: 1fr; }
      .resource-grid { grid-template-columns: 1fr; }
      .research-status-row { flex-direction: column; }
      .accessible-doc-item { flex-wrap: wrap; }
      .accessible-doc-action { width: 100%; }
    }
  `]
})
export class DataManagementComponent {
  readonly pdfService: PdfAccessibilityService = inject(PdfAccessibilityService);

  showDeletionDialog = signal(false);
  exportProgress = signal(0);
  quickExportProgress = signal(0);
  selectedFhirFormat = 'fhir_json';

  // Feature 12.6: Enhanced deletion state
  deletionConfirmedIrreversible = false;
  deletionConfirmedDownloaded = false;
  deletionPassword = '';
  deletionRequestSubmitted = signal(false);
  deletionRefNumber = signal('');

  // Feature 12.7: Correction form state
  correctionRecordType = '';
  correctionErrorDesc = '';
  correctionSuggested = '';
  correctionFileName = signal('');
  correctionSubmitted = signal(false);
  correctionRefNumber = signal('');

  // Feature 12.8: Research participation state
  researchOptIn = signal(false);

  readonly dataRecords = signal<DataRecord[]>([
    { type: 'Medical Records', count: 47, size: '2.3 MB' },
    { type: 'Lab Results', count: 23, size: '1.1 MB' },
    { type: 'Imaging', count: 5, size: '15.2 MB' },
    { type: 'Messages', count: 128, size: '0.8 MB' },
    { type: 'Documents', count: 12, size: '4.5 MB' }
  ]);

  readonly fhirResources = signal<FhirExportResource[]>([
    { label: 'Patient Demographics', value: 'patient', icon: 'pi-user', checked: true },
    { label: 'Conditions & Diagnoses', value: 'conditions', icon: 'pi-heart', checked: true },
    { label: 'Medications', value: 'medications', icon: 'pi-box', checked: true },
    { label: 'Allergies', value: 'allergies', icon: 'pi-exclamation-triangle', checked: true },
    { label: 'Lab Results', value: 'labs', icon: 'pi-chart-bar', checked: true },
    { label: 'Immunizations', value: 'immunizations', icon: 'pi-shield', checked: true },
    { label: 'Procedures', value: 'procedures', icon: 'pi-wrench', checked: false },
    { label: 'Clinical Notes', value: 'notes', icon: 'pi-file-edit', checked: false },
    { label: 'Vital Signs', value: 'vitals', icon: 'pi-heart-fill', checked: false },
    { label: 'Encounters', value: 'encounters', icon: 'pi-calendar', checked: false },
    { label: 'Care Plans', value: 'careplans', icon: 'pi-list-check', checked: false },
    { label: 'Imaging Studies', value: 'imaging', icon: 'pi-image', checked: false }
  ]);

  readonly fhirFormats: FhirFormatOption[] = [
    { label: 'FHIR R4 JSON', value: 'fhir_json' },
    { label: 'FHIR R4 XML', value: 'fhir_xml' },
    { label: 'C-CDA', value: 'ccda' }
  ];

  readonly totalSize = '23.9 MB';

  // Feature 12.7: Record type options
  readonly recordTypeOptions: RecordTypeOption[] = [
    { label: 'Lab Results', value: 'lab_results' },
    { label: 'Medications', value: 'medications' },
    { label: 'Allergies', value: 'allergies' },
    { label: 'Personal Information', value: 'personal_info' },
    { label: 'Visit Notes', value: 'visit_notes' },
    { label: 'Immunization Records', value: 'immunizations' },
    { label: 'Vital Signs', value: 'vitals' },
    { label: 'Imaging Reports', value: 'imaging' },
  ];

  // Feature 12.8: Research studies data
  readonly researchStudies = signal<ResearchStudy[]>([
    {
      id: 'RS-001',
      title: 'Cardiovascular Health Outcomes Study',
      institution: 'UCSF School of Medicine',
      duration: '2024–2027',
      dataCategories: ['Vitals', 'Lab Results', 'Medications'],
      learnMoreUrl: '#'
    },
    {
      id: 'RS-002',
      title: 'National Diabetes Registry',
      institution: 'CDC National Center for Chronic Disease Prevention',
      duration: 'Ongoing',
      dataCategories: ['Lab Results (HbA1c)', 'Demographics (de-id)', 'Medications'],
      learnMoreUrl: '#'
    },
    {
      id: 'RS-003',
      title: 'COVID-19 Long-term Effects Study',
      institution: 'NIH National Institute of Allergy and Infectious Diseases',
      duration: '2023–2026',
      dataCategories: ['Diagnoses', 'Lab Results', 'Visit Encounters'],
      learnMoreUrl: '#'
    }
  ]);

  readonly selectedResourceCount = computed(() =>
    this.fhirResources().filter(r => r.checked).length
  );

  readonly selectedFormatLabel = computed(() => {
    const labels: Record<string, string> = {
      fhir_json: 'FHIR R4 JSON',
      fhir_xml: 'FHIR R4 XML',
      ccda: 'C-CDA'
    };
    return labels[this.selectedFhirFormat] ?? 'Export';
  });

  totalCount(): number {
    return this.dataRecords().reduce((sum, r) => sum + r.count, 0);
  }

  selectAllResources(): void {
    this.fhirResources.update(resources => resources.map(r => ({ ...r, checked: true })));
  }

  clearAllResources(): void {
    this.fhirResources.update(resources => resources.map(r => ({ ...r, checked: false })));
  }

  startFhirExport(): void {
    this.exportProgress.set(0);
    const steps = [8, 20, 35, 50, 65, 78, 88, 95, 100];
    let i = 0;
    const advance = (): void => {
      if (i < steps.length) {
        this.exportProgress.set(steps[i]);
        i++;
        setTimeout(advance, 300);
      }
    };
    setTimeout(advance, 200);
  }

  startExport(): void {
    this.quickExportProgress.set(0);
    const steps = [10, 25, 40, 60, 75, 88, 95, 100];
    let i = 0;
    const advance = (): void => {
      if (i < steps.length) {
        this.quickExportProgress.set(steps[i]);
        i++;
        setTimeout(advance, 350);
      }
    };
    setTimeout(advance, 200);
  }

  // Feature 12.6: Deletion flow methods
  cancelDeletion(): void {
    this.showDeletionDialog.set(false);
    this.deletionPassword = '';
    this.deletionRequestSubmitted.set(false);
  }

  submitDeletionRequest(): void {
    const ref = 'DEL-' + Math.floor(1000 + Math.random() * 9000).toString();
    this.deletionRefNumber.set(ref);
    this.deletionRequestSubmitted.set(true);
    this.deletionPassword = '';
  }

  closeDeletionDialog(): void {
    this.showDeletionDialog.set(false);
    this.deletionRequestSubmitted.set(false);
    this.deletionConfirmedIrreversible = false;
    this.deletionConfirmedDownloaded = false;
  }

  // Feature 12.7: Correction form methods
  onCorrectionFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.correctionFileName.set(input.files[0].name);
    }
  }

  submitCorrectionRequest(): void {
    const ref = 'COR-' + Math.floor(10000 + Math.random() * 90000).toString();
    this.correctionRefNumber.set(ref);
    this.correctionSubmitted.set(true);
    // Reset form
    this.correctionRecordType = '';
    this.correctionErrorDesc = '';
    this.correctionSuggested = '';
    this.correctionFileName.set('');
  }
}
