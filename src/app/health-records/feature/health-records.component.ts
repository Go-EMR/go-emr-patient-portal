import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Medication, LabResult, LabComponent, Allergy, Immunization } from '../../shared/data-access';
import { getEducation, PatientEducation } from '../../shared/data-access/patient-education';
import { getPatientScreenings, ScreeningRecommendation } from '../../shared/data-access/screening-recommendations';

/* ── Types for new features ── */
interface ImagingStudy {
  id: string;
  title: string;
  modality: string;
  date: Date;
  physician: string;
  status: 'Final' | 'Preliminary';
  accession: string;
  reportFindings: string;
  reportImpression: string;
}

@Component({
  selector: 'app-health-records',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TabViewModule,
    TagModule,
    TableModule,
    DialogModule,
    ToastModule,
    InputTextModule,
    TooltipModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast position="top-right"></p-toast>
    <div class="records-page">
      <header class="page-header">
        <h1>Health Records</h1>
        <p>View your complete health information</p>
      </header>

      <p-tabView>

        <!-- ── Medications ── -->
        <p-tabPanel header="Medications">
          <div class="medications-grid">
            @for (med of medications(); track med.id) {
              <div class="medication-card" [class.controlled]="med.isControlled">
                <div class="med-header">
                  <h3>{{ med.medicationName }}</h3>
                  @if (med.isControlled) { <p-tag value="Controlled" severity="warning"></p-tag> }
                </div>
                <p class="generic">{{ med.genericName }}</p>
                <div class="med-details">
                  <p><strong>Dosage:</strong> {{ med.dosage }}</p>
                  <p><strong>Frequency:</strong> {{ med.frequency }}</p>
                  <p><strong>Prescriber:</strong> {{ med.prescribedBy }}</p>
                </div>
                <div class="med-refill">
                  <span>{{ med.refillsRemaining }} refills remaining</span>
                  @if (med.canRequestRefill) {
                    <button pButton label="Request Refill" icon="pi pi-refresh" class="p-button-sm"></button>
                  }
                </div>
              </div>
            }
          </div>
        </p-tabPanel>

        <!-- ── Lab Results ── -->
        <p-tabPanel>
          <ng-template pTemplate="header">
            <span class="lab-tab-header">
              Lab Results
              <button
                class="lab-settings-btn"
                pTooltip="Result notification settings"
                tooltipPosition="top"
                (click)="openNotifSettings($event)"
              ><i class="pi pi-cog"></i></button>
            </span>
          </ng-template>
          <p-table [value]="labResults()" [paginator]="true" [rows]="10" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Test Name</th>
                <th>Date</th>
                <th>Ordered By</th>
                <th>Status</th>
                <th></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-lab>
              <tr [class.highlight]="lab.isNew">
                <td>
                  {{ lab.testName }}
                  @if (lab.isNew) { <p-tag value="New" severity="info" class="ml-2"></p-tag> }
                </td>
                <td>{{ lab.resultDate | date:'MMM d, y' }}</td>
                <td>{{ lab.orderedBy }}</td>
                <td>
                  <p-tag [value]="lab.status" [severity]="lab.hasAbnormal ? 'danger' : 'success'"></p-tag>
                </td>
                <td class="lab-actions-cell">
                  <button
                    pButton
                    icon="pi pi-eye"
                    class="p-button-text p-button-sm"
                    pTooltip="View details"
                    (click)="viewLabDetail(lab)"
                  ></button>
                  <button
                    pButton
                    label="What does this mean?"
                    icon="pi pi-question-circle"
                    class="p-button-text p-button-sm p-button-help edu-btn"
                    pTooltip="Plain-language explanation"
                    (click)="showWhatDoesThisMean(lab.testName)"
                  ></button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-tabPanel>

        <!-- ── Allergies ── -->
        <p-tabPanel header="Allergies">
          <div class="allergies-list">
            @for (allergy of allergies(); track allergy.id) {
              <div class="allergy-card" [class]="allergy.severity">
                <i class="pi pi-exclamation-triangle"></i>
                <div>
                  <h4>{{ allergy.allergen }}</h4>
                  <p>{{ allergy.reaction }} • {{ allergy.severity }}</p>
                </div>
              </div>
            } @empty {
              <p class="empty">No allergies on file</p>
            }
          </div>
        </p-tabPanel>

        <!-- ── Immunizations ── -->
        <p-tabPanel header="Immunizations">
          <div class="imm-toolbar">
            <button
              pButton
              label="Download Certificate"
              icon="pi pi-download"
              class="p-button-outlined p-button-sm"
              [loading]="certificateDownloading()"
              (click)="downloadImmunizationCertificate()"
            ></button>
            <span class="imm-toolbar-hint">WHO-format immunization record</span>
          </div>
          <p-table [value]="immunizations()" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Vaccine</th>
                <th>Date</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-imm>
              <tr>
                <td>{{ imm.vaccineName }}</td>
                <td>{{ imm.administeredDate | date:'MMM d, y' }}</td>
                <td>{{ imm.location }}</td>
                <td>
                  <p-tag
                    [value]="imm.seriesComplete ? 'Complete' : 'In Progress'"
                    [severity]="imm.seriesComplete ? 'success' : 'warning'"
                  ></p-tag>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-tabPanel>

        <!-- ── Clinical Documents ── -->
        <p-tabPanel header="Clinical Documents">
          <div class="doc-filter-bar">
            <div class="doc-category-chips">
              @for (cat of docCategories; track cat) {
                <button
                  class="doc-chip"
                  [class.active]="docCategoryFilter() === cat.toLowerCase()"
                  (click)="docCategoryFilter.set(cat.toLowerCase())"
                >{{ cat }}</button>
              }
            </div>
            <span class="p-input-icon-left doc-search-wrap">
              <i class="pi pi-search"></i>
              <input
                pInputText
                type="text"
                placeholder="Search documents..."
                class="doc-search-input"
                [ngModel]="docSearchQuery()"
                (ngModelChange)="docSearchQuery.set($event)"
              />
            </span>
          </div>

          @if (filteredDocuments().length === 0) {
            <div class="doc-empty">
              <i class="pi pi-folder-open"></i>
              <p>No documents match your search.</p>
            </div>
          }

          <div class="doc-list">
            @for (doc of filteredDocuments(); track doc.id) {
              <div class="doc-card">
                <div class="doc-icon-wrap" [class]="'doc-icon-' + doc.type">
                  <i class="pi" [class]="getDocIcon(doc.type)"></i>
                </div>
                <div class="doc-info">
                  <div class="doc-title-row">
                    <span class="doc-title">{{ doc.title }}</span>
                    @if (doc.isNew) {
                      <span class="doc-new-badge">New</span>
                    }
                  </div>
                  <div class="doc-meta">
                    <span><i class="pi pi-user"></i> {{ doc.provider }}</span>
                    <span><i class="pi pi-calendar"></i> {{ doc.date | date:'MMM d, y' }}</span>
                    <span><i class="pi pi-tag"></i> {{ doc.category }}</span>
                    <span><i class="pi pi-database"></i> {{ doc.size }}</span>
                  </div>
                </div>
                <div class="doc-actions">
                  <button
                    pButton
                    icon="pi pi-download"
                    label="Download"
                    class="p-button-outlined p-button-sm"
                    pTooltip="Download document"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-eye"
                    label="View"
                    class="p-button-text p-button-sm"
                    pTooltip="View document"
                  ></button>
                  <!-- Feature 10.3: Report Error button -->
                  <button
                    pButton
                    icon="pi pi-flag"
                    class="p-button-text p-button-sm p-button-danger"
                    pTooltip="Report an error in this document"
                    (click)="openCorrectionRequest(doc)"
                  ></button>
                </div>
              </div>
            }
          </div>
        </p-tabPanel>

        <!-- ── Imaging (Feature 10.4) ── -->
        <p-tabPanel header="Imaging">
          <div class="imaging-list">
            @for (study of imagingStudies(); track study.id) {
              <div class="imaging-row">
                <div class="imaging-icon-wrap">
                  <i class="pi pi-image"></i>
                </div>
                <div class="imaging-info">
                  <div class="imaging-title-row">
                    <span class="imaging-title">{{ study.title }}</span>
                    <span class="imaging-status-badge" [class.imaging-status--final]="study.status === 'Final'" [class.imaging-status--prelim]="study.status === 'Preliminary'">
                      {{ study.status }}
                    </span>
                  </div>
                  <div class="imaging-meta">
                    <span><i class="pi pi-calendar"></i> {{ study.date | date:'MMM d, y' }}</span>
                    <span><i class="pi pi-user"></i> {{ study.physician }}</span>
                    <span><i class="pi pi-hashtag"></i> {{ study.accession }}</span>
                    <span><i class="pi pi-tag"></i> {{ study.modality }}</span>
                  </div>
                </div>
                <div class="imaging-actions">
                  <button
                    pButton
                    icon="pi pi-eye"
                    label="View"
                    class="p-button-sm"
                    (click)="openImagingViewer(study)"
                  ></button>
                </div>
              </div>
            }
          </div>
        </p-tabPanel>

        <!-- ── Preventive Care ── -->
        <p-tabPanel header="Preventive Care">
          <!-- Feature 10.8: Enhanced summary bar -->
          <div class="pcare-enhanced-banner">
            <div class="pcare-summary-text">
              <i class="pi pi-calendar"></i>
              <span>
                <strong>{{ screeningSummary().dueSoon + screeningSummary().overdue }}</strong> screenings due this year
                @if (screeningSummary().overdue > 0) {
                  , <strong class="overdue-count">{{ screeningSummary().overdue }} overdue</strong>
                }
              </span>
            </div>
            <div class="pcare-summary-stats">
              <span class="pcare-pill pcare-pill--green">{{ screeningSummary().upToDate }} Up to Date</span>
              <span class="pcare-pill pcare-pill--orange">{{ screeningSummary().dueSoon }} Due Soon</span>
              <span class="pcare-pill pcare-pill--red">{{ screeningSummary().overdue }} Overdue</span>
            </div>
          </div>

          <!-- Feature 10.8: Mini calendar heatmap -->
          <div class="pcare-calendar-section">
            <h3 class="pcare-calendar-title">
              <i class="pi pi-calendar-times"></i>
              Upcoming Screenings — {{ calendarYear }}
            </h3>
            <div class="pcare-calendar-grid">
              @for (month of calendarMonths; track month.label) {
                <div class="pcare-cal-month">
                  <span class="pcare-cal-month-label">{{ month.label }}</span>
                  <div class="pcare-cal-dots">
                    @for (dot of month.dots; track dot.id) {
                      <span
                        class="pcare-cal-dot"
                        [class]="'pcare-cal-dot--' + dot.status"
                        [pTooltip]="dot.name"
                        tooltipPosition="top"
                      ></span>
                    }
                    @if (month.dots.length === 0) {
                      <span class="pcare-cal-empty">—</span>
                    }
                  </div>
                </div>
              }
            </div>
            <div class="pcare-cal-legend">
              <span class="pcare-cal-dot pcare-cal-dot--up_to_date"></span> Up to Date
              <span class="pcare-cal-dot pcare-cal-dot--due_soon"></span> Due Soon
              <span class="pcare-cal-dot pcare-cal-dot--overdue"></span> Overdue
            </div>
          </div>

          <!-- Category Groups -->
          @for (group of screeningGroups(); track group.category) {
            <div class="pcare-group">
              <h3 class="pcare-group-title">
                <i class="pi" [class]="getCategoryIcon(group.category)"></i>
                {{ group.category }}
              </h3>
              <div class="pcare-cards">
                @for (s of group.items; track s.id) {
                  <div class="pcare-card" [class]="'pcare-card--' + s.status">
                    <div class="pcare-card-header">
                      <div class="pcare-name-row">
                        <span class="pcare-name">{{ s.name }}</span>
                        <span class="pcare-priority-dot" [class]="'pcare-priority--' + s.priority" [title]="s.priority"></span>
                      </div>
                      <span class="pcare-status-badge" [class]="'pcare-badge--' + s.status">
                        {{ getStatusLabel(s.status) }}
                      </span>
                    </div>
                    <p class="pcare-description">{{ s.description }}</p>
                    <div class="pcare-dates">
                      <div class="pcare-date-item">
                        <span class="pcare-date-label">Frequency</span>
                        <span class="pcare-date-value">{{ s.frequency }}</span>
                      </div>
                      <div class="pcare-date-item">
                        <span class="pcare-date-label">Last Completed</span>
                        <span class="pcare-date-value">
                          {{ s.lastCompleted ? (s.lastCompleted | date:'MMM d, y') : 'Never recorded' }}
                        </span>
                      </div>
                      <div class="pcare-date-item">
                        <span class="pcare-date-label">Next Due</span>
                        <span class="pcare-date-value" [class.pcare-overdue-text]="s.status === 'overdue'">
                          {{ s.nextDue ? (s.nextDue | date:'MMM d, y') : '—' }}
                        </span>
                      </div>
                    </div>
                    <!-- Feature 10.8: reminder button row -->
                    <div class="pcare-card-footer">
                      @if (s.status === 'due_soon' || s.status === 'overdue') {
                        <button
                          pButton
                          label="Schedule Now"
                          icon="pi pi-calendar-plus"
                          class="p-button-sm"
                          [class.p-button-warning]="s.status === 'due_soon'"
                          [class.p-button-danger]="s.status === 'overdue'"
                        ></button>
                      }
                      <button
                        pButton
                        [icon]="reminderSet(s.id) ? 'pi pi-bell' : 'pi pi-bell'"
                        [label]="reminderSet(s.id) ? 'Reminder Set' : 'Set Reminder'"
                        class="p-button-sm p-button-text"
                        [class.reminder-active]="reminderSet(s.id)"
                        (click)="toggleReminder(s.id)"
                        [pTooltip]="reminderSet(s.id) ? 'Click to remove reminder' : 'Click to set a reminder'"
                      ></button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </p-tabPanel>

      </p-tabView>

      <!-- ── Lab Detail / Comparison Dialog ── -->
      <p-dialog
        [header]="compareMode() ? 'Lab Result Comparison' : 'Lab Result Details'"
        [visible]="showLabDetail()"
        (visibleChange)="showLabDetail.set($event)"
        [modal]="true"
        [closable]="true"
        [style]="{ width: compareMode() ? '900px' : '600px', maxWidth: '98vw' }"
        styleClass="lab-dialog"
      >
        @if (selectedLab(); as lab) {
          <div class="dialog-subheader">
            <div class="dialog-lab-meta">
              <span class="lab-test-name">{{ lab.testName }}</span>
              <span class="lab-date">{{ lab.resultDate | date:'MMMM d, y' }}</span>
              <span class="lab-ordered-by">Ordered by {{ lab.orderedBy }}</span>
            </div>
            @if (previousLab()) {
              <button
                pButton
                [label]="compareMode() ? 'Show Single Result' : 'Compare with Previous'"
                [icon]="compareMode() ? 'pi pi-list' : 'pi pi-chart-bar'"
                class="p-button-outlined p-button-sm compare-toggle-btn"
                (click)="toggleCompareMode()"
              ></button>
            }
          </div>

          @if (!compareMode()) {
            <table class="result-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Value</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (comp of lab.components; track comp.name; let even = $even) {
                  <tr [class.row-even]="even">
                    <td class="comp-name">{{ comp.name }}</td>
                    <td class="comp-value" [class]="'flag-' + comp.flag">
                      {{ comp.value }} {{ comp.unit }}
                    </td>
                    <td class="ref-range">{{ comp.referenceRange }}</td>
                    <td>
                      <span class="flag-badge" [class]="'flag-badge--' + comp.flag">
                        {{ comp.flag | titlecase }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }

          @if (compareMode() && previousLab(); as prev) {
            <div class="compare-banner">
              <span class="compare-label prev-label">Previous: {{ prev.resultDate | date:'MMM d, y' }}</span>
              <span class="compare-arrow-legend">
                <span class="arrow-up">&#8593;</span> Increased &nbsp;
                <span class="arrow-down">&#8595;</span> Decreased &nbsp;
                <span class="arrow-same">&#8594;</span> No change
              </span>
              <span class="compare-label curr-label">Current: {{ lab.resultDate | date:'MMM d, y' }}</span>
            </div>
            <table class="result-table compare-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Previous</th>
                  <th>Current</th>
                  <th>Change</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (comp of lab.components; track comp.name; let even = $even) {
                  <tr [class.row-even]="even">
                    <td class="comp-name">{{ comp.name }}</td>
                    <td class="comp-value" [class]="'flag-' + getPreviousComponent(prev, comp.name)?.flag">
                      @if (getPreviousComponent(prev, comp.name); as prevComp) {
                        {{ prevComp.value }} {{ prevComp.unit }}
                      } @else {
                        <span class="no-data">—</span>
                      }
                    </td>
                    <td class="comp-value" [class]="'flag-' + comp.flag">
                      {{ comp.value }} {{ comp.unit }}
                    </td>
                    <td class="change-cell">
                      @if (getPreviousComponent(prev, comp.name); as prevComp) {
                        @let change = getComponentChange(comp.value, prevComp.value);
                        <span
                          class="change-indicator"
                          [class]="'change-' + getTrendClass(comp, change.direction)"
                        >
                          @if (change.direction === 'up') { <span class="arrow-up">&#8593;</span> }
                          @if (change.direction === 'down') { <span class="arrow-down">&#8595;</span> }
                          @if (change.direction === 'same') { <span class="arrow-same">&#8594;</span> }
                          {{ change.delta }}
                        </span>
                      } @else {
                        <span class="no-data">—</span>
                      }
                    </td>
                    <td class="ref-range">{{ comp.referenceRange }}</td>
                    <td>
                      <span class="flag-badge" [class]="'flag-badge--' + comp.flag">
                        {{ comp.flag | titlecase }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        }

        <ng-template pTemplate="footer">
          <button pButton label="Close" icon="pi pi-times" class="p-button-text" (click)="showLabDetail.set(false)"></button>
        </ng-template>
      </p-dialog>

      <!-- ── Patient Education Dialog ── -->
      <p-dialog
        header="What Does This Mean?"
        [visible]="showEducationDialog()"
        (visibleChange)="showEducationDialog.set($event)"
        [modal]="true"
        [closable]="true"
        [style]="{ width: '620px', maxWidth: '98vw' }"
        styleClass="edu-dialog"
      >
        @if (selectedEducation(); as edu) {
          <div class="edu-content">
            <h2 class="edu-test-name">{{ edu.testName }}</h2>
            <p class="edu-summary">{{ edu.summary }}</p>

            <div class="edu-section">
              <div class="edu-section-header">
                <i class="pi pi-microscope"></i>
                <h4>What It Measures</h4>
              </div>
              <p>{{ edu.whatItMeasures }}</p>
            </div>

            <div class="edu-section">
              <div class="edu-section-header">
                <i class="pi pi-heart"></i>
                <h4>Why It Matters</h4>
              </div>
              <p>{{ edu.whyItMatters }}</p>
            </div>

            <div class="edu-section edu-section--highlight">
              <div class="edu-section-header">
                <i class="pi pi-check-circle"></i>
                <h4>Normal Range</h4>
              </div>
              <p>{{ edu.normalRange }}</p>
            </div>

            <div class="edu-two-col">
              <div class="edu-section edu-section--high">
                <div class="edu-section-header">
                  <i class="pi pi-arrow-up"></i>
                  <h4>If High</h4>
                </div>
                <p>{{ edu.highMeaning }}</p>
              </div>
              <div class="edu-section edu-section--low">
                <div class="edu-section-header">
                  <i class="pi pi-arrow-down"></i>
                  <h4>If Low</h4>
                </div>
                <p>{{ edu.lowMeaning }}</p>
              </div>
            </div>

            <div class="edu-section">
              <div class="edu-section-header">
                <i class="pi pi-star"></i>
                <h4>Health Tips</h4>
              </div>
              <ul class="edu-tips-list">
                @for (tip of edu.tips; track tip) {
                  <li>{{ tip }}</li>
                }
              </ul>
            </div>
          </div>
        } @else {
          <div class="edu-no-content">
            <i class="pi pi-info-circle"></i>
            <p>No patient education content is available for this test yet. Ask your care team for more information.</p>
          </div>
        }

        <ng-template pTemplate="footer">
          <button pButton label="Close" icon="pi pi-times" class="p-button-text" (click)="showEducationDialog.set(false)"></button>
        </ng-template>
      </p-dialog>

      <!-- ── Feature 10.1 + 10.2: Result Notification Settings Dialog ── -->
      <p-dialog
        header="Result Notification Settings"
        [visible]="showNotifSettings()"
        (visibleChange)="showNotifSettings.set($event)"
        [modal]="true"
        [closable]="true"
        [style]="{ width: '520px', maxWidth: '98vw' }"
      >
        <div class="notif-settings-body">
          <section class="notif-section">
            <h4 class="notif-section-title">Release Preference</h4>
            <div class="notif-radio-group">
              <label class="notif-radio-label">
                <input
                  type="radio"
                  name="releaseMode"
                  value="immediate"
                  [ngModel]="notifReleaseMode()"
                  (ngModelChange)="notifReleaseMode.set($event)"
                />
                <span>
                  <strong>Release results immediately</strong>
                  <small>Results are available as soon as they are finalized by the lab.</small>
                </span>
              </label>
              <label class="notif-radio-label">
                <input
                  type="radio"
                  name="releaseMode"
                  value="hold"
                  [ngModel]="notifReleaseMode()"
                  (ngModelChange)="notifReleaseMode.set($event)"
                />
                <span>
                  <strong>Wait for provider review (up to 72 hours)</strong>
                  <small>Your provider reviews results before they appear in your portal.</small>
                </span>
              </label>
            </div>
            <div class="notif-policy-note">
              <i class="pi pi-info-circle"></i>
              Sensitive results (HIV, genetic testing) are always held for provider review per facility policy.
            </div>
          </section>

          <!-- Feature 10.2: Sensitive Result Categories -->
          <section class="notif-section">
            <h4 class="notif-section-title">Sensitive Result Categories</h4>
            <p class="notif-section-desc">Checked categories are always held for provider review, regardless of the setting above.</p>
            <div class="notif-checkbox-group">
              @for (cat of sensitiveCategories; track cat.key) {
                <label class="notif-check-label">
                  <input
                    type="checkbox"
                    [checked]="sensitiveCategorySet().has(cat.key)"
                    (change)="toggleSensitiveCategory(cat.key)"
                  />
                  <span>{{ cat.label }}</span>
                </label>
              }
            </div>
          </section>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" icon="pi pi-times" class="p-button-text" (click)="showNotifSettings.set(false)"></button>
          <button pButton label="Save Settings" icon="pi pi-check" (click)="saveNotifSettings()"></button>
        </ng-template>
      </p-dialog>

      <!-- ── Feature 10.3: Document Correction Request Dialog ── -->
      <p-dialog
        header="Request Record Correction"
        [visible]="showCorrectionDialog()"
        (visibleChange)="showCorrectionDialog.set($event)"
        [modal]="true"
        [closable]="true"
        [style]="{ width: '520px', maxWidth: '98vw' }"
      >
        @if (correctionSubmitted()) {
          <div class="correction-success">
            <i class="pi pi-check-circle"></i>
            <div>
              <strong>Correction request submitted.</strong>
              <p>Reference: {{ correctionReference() }}</p>
              <p>Your provider will review this request within 30 days as required by HIPAA.</p>
            </div>
          </div>
        } @else {
          <div class="correction-form">
            <div class="correction-field">
              <label class="correction-label">Which section has the error?</label>
              <select
                class="correction-select"
                [ngModel]="correctionSection()"
                (ngModelChange)="correctionSection.set($event)"
              >
                <option value="">-- Select a section --</option>
                <option value="Diagnosis">Diagnosis</option>
                <option value="Medications">Medications</option>
                <option value="Allergies">Allergies</option>
                <option value="Personal Info">Personal Info</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="correction-field">
              <label class="correction-label">Describe the error</label>
              <textarea
                class="correction-textarea"
                rows="3"
                placeholder="Explain what is incorrect..."
                [ngModel]="correctionDescription()"
                (ngModelChange)="correctionDescription.set($event)"
              ></textarea>
            </div>
            <div class="correction-field">
              <label class="correction-label">What should it say?</label>
              <textarea
                class="correction-textarea"
                rows="3"
                placeholder="Enter the correct information..."
                [ngModel]="correctionCorrectText()"
                (ngModelChange)="correctionCorrectText.set($event)"
              ></textarea>
            </div>
          </div>
        }

        <ng-template pTemplate="footer">
          @if (correctionSubmitted()) {
            <button pButton label="Close" icon="pi pi-times" class="p-button-text" (click)="closeCorrectionDialog()"></button>
          } @else {
            <button pButton label="Cancel" icon="pi pi-times" class="p-button-text" (click)="showCorrectionDialog.set(false)"></button>
            <button
              pButton
              label="Submit Request"
              icon="pi pi-send"
              [disabled]="!correctionSection() || !correctionDescription() || !correctionCorrectText()"
              (click)="submitCorrectionRequest()"
            ></button>
          }
        </ng-template>
      </p-dialog>

      <!-- ── Feature 10.4 + 10.5 + 10.6 + 10.7: DICOM Viewer Dialog ── -->
      <p-dialog
        [header]="selectedStudy()?.title || 'Imaging Study'"
        [visible]="showImagingViewer()"
        (visibleChange)="showImagingViewer.set($event)"
        [modal]="true"
        [closable]="true"
        [style]="{ width: '900px', maxWidth: '98vw' }"
        styleClass="imaging-dialog"
      >
        @if (selectedStudy(); as study) {
          <div class="dicom-viewer">
            <!-- Left: Mock image pane -->
            <div class="dicom-image-pane">
              <!-- Toolbar (Feature 10.7 download included) -->
              <div class="dicom-toolbar">
                <button class="dicom-tool-btn" pTooltip="Zoom In"><i class="pi pi-search-plus"></i></button>
                <button class="dicom-tool-btn" pTooltip="Zoom Out"><i class="pi pi-search-minus"></i></button>
                <button class="dicom-tool-btn" pTooltip="Pan"><i class="pi pi-arrows-alt"></i></button>
                <button class="dicom-tool-btn" pTooltip="Measure"><i class="pi pi-pencil"></i></button>
                <button class="dicom-tool-btn" pTooltip="Window / Level"><i class="pi pi-sliders-h"></i></button>
                <div class="dicom-toolbar-sep"></div>
                <button
                  class="dicom-tool-btn dicom-download-btn"
                  pTooltip="Download with watermark"
                  (click)="downloadImagingStudy(study)"
                >
                  <i class="pi pi-download"></i>
                  <span>Download</span>
                </button>
              </div>

              <!-- Mock image with CSS gradient simulating X-ray / CT -->
              <div class="dicom-image-area" [class]="'dicom-image--' + study.modality.toLowerCase().replace('/', '-')">
                <!-- Patient info overlay -->
                <div class="dicom-overlay dicom-overlay--tl">
                  <div>{{ 'Alex Johnson' }}</div>
                  <div>DOB: 1981-03-15</div>
                </div>
                <div class="dicom-overlay dicom-overlay--tr">
                  <div>{{ study.date | date:'yyyy-MM-dd' }}</div>
                  <div>{{ study.modality }}</div>
                  <div>Acc# {{ study.accession }}</div>
                </div>
                <div class="dicom-center-label">{{ study.modality }} — {{ study.title }}</div>
                <div class="dicom-overlay dicom-overlay--bl">
                  <div>{{ study.physician }}</div>
                </div>
                <div class="dicom-overlay dicom-overlay--br">
                  <span class="dicom-status-chip" [class.dicom-status--prelim]="study.status === 'Preliminary'">{{ study.status }}</span>
                </div>
                @if (imagingDownloadPending()) {
                  <div class="dicom-download-overlay">
                    <i class="pi pi-spin pi-spinner"></i>
                    Preparing download...
                  </div>
                }
              </div>
            </div>

            <!-- Right: Radiology report pane (Feature 10.5 + 10.6) -->
            <div class="dicom-report-pane">
              <div class="dicom-report-header">
                <i class="pi pi-file-edit"></i>
                Radiology Report
              </div>

              <!-- Feature 10.6: annotation legend -->
              <div class="report-legend">
                <span class="report-legend-item">
                  <span class="report-highlight report-highlight--green">A</span> Normal
                </span>
                <span class="report-legend-item">
                  <span class="report-highlight report-highlight--yellow">A</span> Note
                </span>
                <span class="report-legend-item">
                  <span class="report-highlight report-highlight--blue">A</span> Measurement
                </span>
              </div>

              <div class="dicom-report-body">
                <h5 class="report-section-title">FINDINGS</h5>
                <p class="report-text" [innerHTML]="annotateReport(study.reportFindings)"></p>
                <h5 class="report-section-title">IMPRESSION</h5>
                <p class="report-text" [innerHTML]="annotateReport(study.reportImpression)"></p>
                <div class="report-footer-meta">
                  <span>Signed by: {{ study.physician }}</span>
                  <span>{{ study.date | date:'MMMM d, y' }}</span>
                </div>
              </div>
            </div>
          </div>
        }

        <ng-template pTemplate="footer">
          <button pButton label="Close" icon="pi pi-times" class="p-button-text" (click)="showImagingViewer.set(false)"></button>
        </ng-template>
      </p-dialog>

    </div>
  `,
  styles: [`
    /* ── Page layout ── */
    .records-page { max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { margin: 0; }
    .page-header p { color: var(--text-color-secondary); margin: 0.5rem 0 0; }

    /* ── Medications ── */
    .medications-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .medication-card { padding: 1.25rem; background: var(--surface-card); border-radius: var(--border-radius); box-shadow: var(--card-shadow); }
    .medication-card.controlled { border-left: 4px solid var(--orange-500); }
    .med-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .med-header h3 { margin: 0; }
    .generic { color: var(--text-color-secondary); font-size: 0.875rem; margin: 0.25rem 0 1rem; }
    .med-details p { margin: 0.25rem 0; font-size: 0.875rem; }
    .med-refill { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--surface-border); }
    .med-refill span { font-size: 0.875rem; color: var(--text-color-secondary); }

    /* ── Allergies ── */
    .allergies-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .allergy-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--surface-card); border-radius: var(--border-radius); border-left: 4px solid var(--yellow-500); }
    .allergy-card.severe, .allergy-card.life_threatening { border-left-color: var(--red-500); }
    .allergy-card i { font-size: 1.5rem; color: var(--yellow-500); }
    .allergy-card.severe i, .allergy-card.life_threatening i { color: var(--red-500); }
    .allergy-card h4 { margin: 0; }
    .allergy-card p { margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--text-color-secondary); }
    .empty { text-align: center; padding: 2rem; color: var(--text-color-secondary); }

    /* ── Lab tab header with settings gear ── */
    .lab-tab-header { display: inline-flex; align-items: center; gap: 0.4rem; }
    .lab-settings-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.4rem;
      height: 1.4rem;
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--text-color-secondary);
      padding: 0;
      line-height: 1;
      transition: color 0.15s, background 0.15s;
    }
    .lab-settings-btn:hover { color: var(--primary-color); background: var(--primary-50, rgba(99,102,241,0.08)); }
    .lab-settings-btn i { font-size: 0.8rem; }

    /* ── Lab table ── */
    .highlight { background: var(--primary-50); }
    .ml-2 { margin-left: 0.5rem; }
    .lab-actions-cell { display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap; }
    .edu-btn { font-size: 0.75rem !important; white-space: nowrap; }

    /* ── Immunization toolbar ── */
    .imm-toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 0.75rem 1rem; background: var(--surface-ground); border-radius: var(--border-radius); }
    .imm-toolbar-hint { font-size: 0.8rem; color: var(--text-color-secondary); font-style: italic; }

    /* ── Clinical Documents ── */
    .doc-filter-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--surface-border);
    }
    .doc-category-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; flex: 1; }
    .doc-chip {
      padding: 0.3rem 0.9rem;
      border-radius: 9999px;
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      color: var(--text-color-secondary);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .doc-chip:hover { border-color: var(--primary-color); color: var(--primary-color); }
    .doc-chip.active { background: var(--primary-color); border-color: var(--primary-color); color: #fff; font-weight: 600; }
    .doc-search-wrap { display: flex; align-items: center; }
    .doc-search-input { width: 220px; font-size: 0.875rem; }

    .doc-empty { text-align: center; padding: 3rem; color: var(--text-color-secondary); }
    .doc-empty i { font-size: 2.5rem; margin-bottom: 0.75rem; display: block; }

    .doc-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .doc-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--surface-card);
      border-radius: var(--border-radius);
      box-shadow: var(--card-shadow, 0 1px 3px rgba(0,0,0,0.08));
      transition: box-shadow 0.15s;
    }
    .doc-card:hover { box-shadow: 0 3px 10px rgba(0,0,0,0.12); }

    .doc-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .doc-icon-wrap i { font-size: 1.4rem; }
    .doc-icon-visit_summary  { background: var(--blue-50,  #eff6ff); color: var(--blue-600); }
    .doc-icon-referral       { background: var(--purple-50, #faf5ff); color: var(--purple-600); }
    .doc-icon-discharge      { background: var(--orange-50, #fff7ed); color: var(--orange-600); }
    .doc-icon-lab_report     { background: var(--green-50,  #f0fdf4); color: var(--green-600); }
    .doc-icon-imaging        { background: var(--indigo-50, #eef2ff); color: var(--indigo-600); }
    .doc-icon-clinical_note  { background: var(--cyan-50,   #ecfeff); color: var(--cyan-700); }

    .doc-info { flex: 1; min-width: 0; }
    .doc-title-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
    .doc-title { font-weight: 600; font-size: 0.9rem; color: var(--text-color); }
    .doc-new-badge {
      background: var(--blue-500);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.1rem 0.45rem;
      border-radius: 9999px;
      letter-spacing: 0.03em;
    }
    .doc-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.78rem; color: var(--text-color-secondary); }
    .doc-meta i { margin-right: 0.2rem; font-size: 0.7rem; }
    .doc-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }

    /* ── Dialog sub-header ── */
    .dialog-subheader {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--surface-border);
    }
    .dialog-lab-meta { display: flex; flex-direction: column; gap: 0.2rem; }
    .lab-test-name { font-size: 1rem; font-weight: 600; color: var(--text-color); }
    .lab-date { font-size: 0.875rem; color: var(--text-color-secondary); }
    .lab-ordered-by { font-size: 0.8rem; color: var(--text-color-secondary); font-style: italic; }
    .compare-toggle-btn { white-space: nowrap; }

    /* ── Compare banner ── */
    .compare-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface-ground);
      border-radius: var(--border-radius);
      font-size: 0.8rem;
    }
    .compare-label { font-weight: 600; }
    .prev-label { color: var(--blue-600); }
    .curr-label { color: var(--primary-color); }

    /* ── Result table (shared) ── */
    .result-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .result-table th {
      text-align: left;
      padding: 0.6rem 0.75rem;
      background: var(--surface-ground);
      border-bottom: 2px solid var(--surface-border);
      font-weight: 600;
      color: var(--text-color-secondary);
      white-space: nowrap;
    }
    .result-table td {
      padding: 0.55rem 0.75rem;
      border-bottom: 1px solid var(--surface-border);
      vertical-align: middle;
    }
    .row-even td { background: var(--surface-50, rgba(0,0,0,0.02)); }
    .comp-name { font-weight: 500; color: var(--text-color); }
    .ref-range { color: var(--text-color-secondary); font-size: 0.8rem; }
    .no-data { color: var(--text-color-secondary); }

    /* ── Flag coloring ── */
    .flag-normal   { color: var(--green-700); }
    .flag-high     { color: var(--red-600); font-weight: 600; }
    .flag-low      { color: var(--blue-600); font-weight: 600; }
    .flag-critical { color: var(--red-800); font-weight: 700; }

    .flag-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .flag-badge--normal   { background: var(--green-100); color: var(--green-800); }
    .flag-badge--high     { background: var(--red-100);   color: var(--red-800); }
    .flag-badge--low      { background: var(--blue-100);  color: var(--blue-800); }
    .flag-badge--critical { background: var(--red-200);   color: var(--red-900); }

    /* ── Trend arrows ── */
    .arrow-up   { color: var(--red-500); font-weight: 700; }
    .arrow-down { color: var(--blue-500); font-weight: 700; }
    .arrow-same { color: var(--text-color-secondary); font-weight: 700; }
    .change-indicator { display: inline-flex; align-items: center; gap: 0.2rem; font-size: 0.8rem; font-weight: 600; }
    .change-improving { color: var(--green-600); }
    .change-worsening { color: var(--red-600); }
    .change-neutral   { color: var(--text-color-secondary); }
    .compare-table th:nth-child(1) { min-width: 130px; }
    .compare-table th:nth-child(2), .compare-table th:nth-child(3) { min-width: 110px; }
    .compare-table th:nth-child(4) { min-width: 90px; }

    /* ── Patient Education Dialog ── */
    .edu-content { padding: 0.25rem 0; }
    .edu-test-name { margin: 0 0 0.75rem; font-size: 1.2rem; color: var(--primary-color); }
    .edu-summary { margin: 0 0 1.25rem; line-height: 1.6; color: var(--text-color); font-size: 0.9rem; }
    .edu-section { margin-bottom: 1rem; padding: 0.75rem 1rem; border-radius: var(--border-radius); background: var(--surface-ground); }
    .edu-section--highlight { background: var(--green-50, #f0fdf4); border-left: 3px solid var(--green-500); }
    .edu-section--high      { background: var(--red-50, #fff5f5); border-left: 3px solid var(--red-400); }
    .edu-section--low       { background: var(--blue-50, #eff6ff); border-left: 3px solid var(--blue-400); }
    .edu-section-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
    .edu-section-header i { font-size: 0.9rem; color: var(--primary-color); }
    .edu-section-header h4 { margin: 0; font-size: 0.875rem; font-weight: 700; color: var(--text-color); }
    .edu-section p { margin: 0; font-size: 0.85rem; line-height: 1.55; color: var(--text-color); }
    .edu-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; }
    .edu-tips-list { margin: 0; padding-left: 1.25rem; }
    .edu-tips-list li { font-size: 0.85rem; line-height: 1.55; margin-bottom: 0.35rem; color: var(--text-color); }
    .edu-no-content { text-align: center; padding: 2rem; color: var(--text-color-secondary); }
    .edu-no-content i { font-size: 2rem; display: block; margin-bottom: 0.75rem; }

    /* ── Feature 10.1 + 10.2: Notification Settings ── */
    .notif-settings-body { display: flex; flex-direction: column; gap: 1.25rem; }
    .notif-section { padding: 1rem; background: var(--surface-ground); border-radius: var(--border-radius); }
    .notif-section-title { margin: 0 0 0.75rem; font-size: 0.9rem; font-weight: 700; color: var(--text-color); }
    .notif-section-desc { margin: 0 0 0.75rem; font-size: 0.8rem; color: var(--text-color-secondary); }
    .notif-radio-group { display: flex; flex-direction: column; gap: 0.75rem; }
    .notif-radio-label {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      cursor: pointer;
      padding: 0.6rem 0.75rem;
      border-radius: var(--border-radius);
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      transition: border-color 0.15s;
    }
    .notif-radio-label:hover { border-color: var(--primary-color); }
    .notif-radio-label input[type="radio"] { margin-top: 0.2rem; flex-shrink: 0; accent-color: var(--primary-color); }
    .notif-radio-label span { display: flex; flex-direction: column; gap: 0.15rem; }
    .notif-radio-label strong { font-size: 0.875rem; color: var(--text-color); }
    .notif-radio-label small { font-size: 0.78rem; color: var(--text-color-secondary); }
    .notif-policy-note {
      margin-top: 0.75rem;
      padding: 0.6rem 0.75rem;
      background: var(--blue-50, #eff6ff);
      border-left: 3px solid var(--blue-400);
      border-radius: var(--border-radius);
      font-size: 0.8rem;
      color: var(--blue-800, #1e40af);
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .notif-policy-note i { flex-shrink: 0; margin-top: 0.1rem; }
    .notif-checkbox-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .notif-check-label {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text-color);
      padding: 0.4rem 0.6rem;
      border-radius: var(--border-radius);
      transition: background 0.1s;
    }
    .notif-check-label:hover { background: var(--surface-card); }
    .notif-check-label input[type="checkbox"] { accent-color: var(--primary-color); width: 1rem; height: 1rem; }

    /* ── Feature 10.3: Correction Request ── */
    .correction-form { display: flex; flex-direction: column; gap: 1rem; }
    .correction-field { display: flex; flex-direction: column; gap: 0.35rem; }
    .correction-label { font-size: 0.875rem; font-weight: 600; color: var(--text-color); }
    .correction-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      background: var(--surface-card);
      color: var(--text-color);
      font-size: 0.875rem;
      width: 100%;
      outline: none;
      transition: border-color 0.15s;
    }
    .correction-select:focus { border-color: var(--primary-color); }
    .correction-textarea {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      background: var(--surface-card);
      color: var(--text-color);
      font-size: 0.875rem;
      width: 100%;
      resize: vertical;
      outline: none;
      font-family: inherit;
      transition: border-color 0.15s;
    }
    .correction-textarea:focus { border-color: var(--primary-color); }
    .correction-success {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--green-50, #f0fdf4);
      border-radius: var(--border-radius);
      border-left: 4px solid var(--green-500);
    }
    .correction-success i { font-size: 2rem; color: var(--green-600); flex-shrink: 0; margin-top: 0.1rem; }
    .correction-success strong { font-size: 0.95rem; color: var(--green-800); }
    .correction-success p { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--text-color-secondary); }

    /* ── Feature 10.4: Imaging list ── */
    .imaging-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .imaging-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--surface-card);
      border-radius: var(--border-radius);
      box-shadow: var(--card-shadow, 0 1px 3px rgba(0,0,0,0.08));
      transition: box-shadow 0.15s;
    }
    .imaging-row:hover { box-shadow: 0 3px 10px rgba(0,0,0,0.12); }
    .imaging-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--indigo-50, #eef2ff);
      color: var(--indigo-600);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1.5rem;
    }
    .imaging-info { flex: 1; min-width: 0; }
    .imaging-title-row { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem; }
    .imaging-title { font-weight: 600; font-size: 0.9rem; color: var(--text-color); }
    .imaging-status-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }
    .imaging-status--final { background: var(--green-100); color: var(--green-800); }
    .imaging-status--prelim { background: var(--orange-100); color: var(--orange-800); }
    .imaging-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.78rem; color: var(--text-color-secondary); }
    .imaging-meta i { margin-right: 0.2rem; font-size: 0.7rem; }
    .imaging-actions { flex-shrink: 0; }

    /* ── Feature 10.4 + 10.5: DICOM viewer dialog ── */
    .dicom-viewer {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      min-height: 460px;
      border-radius: var(--border-radius);
      overflow: hidden;
      border: 1px solid var(--surface-border);
    }

    /* Left pane: dark DICOM image area */
    .dicom-image-pane {
      background: #0a0a0a;
      display: flex;
      flex-direction: column;
    }
    .dicom-toolbar {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.5rem 0.6rem;
      background: #1a1a1a;
      border-bottom: 1px solid #333;
      flex-wrap: wrap;
    }
    .dicom-tool-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.3rem 0.5rem;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 4px;
      color: #ccc;
      cursor: pointer;
      font-size: 0.75rem;
      transition: background 0.15s, color 0.15s;
    }
    .dicom-tool-btn:hover { background: #3a3a3a; color: #fff; }
    .dicom-tool-btn i { font-size: 0.8rem; }
    .dicom-toolbar-sep { width: 1px; height: 1.4rem; background: #444; margin: 0 0.2rem; }
    .dicom-download-btn { border-color: #4ade80; color: #4ade80; }
    .dicom-download-btn:hover { background: rgba(74,222,128,0.1); color: #4ade80; }

    /* Mock DICOM image — CSS-only medical imaging simulation */
    .dicom-image-area {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      min-height: 360px;
    }
    /* Chest X-Ray gradient */
    .dicom-image--x-ray {
      background:
        radial-gradient(ellipse 55% 70% at 50% 48%, #c8c8c8 0%, #a0a0a0 15%, #606060 35%, #1e1e1e 65%, #050505 100%),
        radial-gradient(ellipse 20% 28% at 35% 52%, #e0e0e0 0%, transparent 70%),
        radial-gradient(ellipse 20% 28% at 65% 52%, #e0e0e0 0%, transparent 70%);
    }
    /* MRI gradient */
    .dicom-image--mri {
      background:
        radial-gradient(ellipse 40% 60% at 48% 55%, #b0b8c8 0%, #7080a0 20%, #303850 45%, #0d1020 70%, #020408 100%),
        radial-gradient(circle 12% at 55% 60%, #d0d8e8 0%, transparent 100%);
    }
    /* CT gradient */
    .dicom-image--ct {
      background:
        radial-gradient(ellipse 60% 65% at 50% 50%, #d4d4d4 0%, #909090 18%, #484848 38%, #181818 62%, #030303 100%),
        radial-gradient(circle 8% at 42% 48%, #f0f0f0 0%, transparent 100%),
        radial-gradient(circle 6% at 58% 52%, #e8e8e8 0%, transparent 100%);
    }

    /* Overlay text on DICOM image */
    .dicom-overlay {
      position: absolute;
      font-size: 0.65rem;
      color: #e0e0e0;
      font-family: monospace;
      line-height: 1.4;
      text-shadow: 0 0 4px rgba(0,0,0,0.9);
    }
    .dicom-overlay--tl { top: 0.5rem; left: 0.6rem; }
    .dicom-overlay--tr { top: 0.5rem; right: 0.6rem; text-align: right; }
    .dicom-overlay--bl { bottom: 0.5rem; left: 0.6rem; }
    .dicom-overlay--br { bottom: 0.5rem; right: 0.6rem; }
    .dicom-center-label {
      position: absolute;
      bottom: 1.8rem;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.7rem;
      color: rgba(200,200,200,0.5);
      font-family: monospace;
      white-space: nowrap;
    }
    .dicom-status-chip {
      font-size: 0.65rem;
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      background: rgba(74,222,128,0.2);
      color: #4ade80;
      border: 1px solid rgba(74,222,128,0.4);
      font-family: monospace;
    }
    .dicom-status-chip.dicom-status--prelim {
      background: rgba(251,191,36,0.2);
      color: #fbbf24;
      border-color: rgba(251,191,36,0.4);
    }
    .dicom-download-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      color: #fff;
      font-size: 0.9rem;
    }
    .dicom-download-overlay i { font-size: 1.4rem; }

    /* Right pane: report */
    .dicom-report-pane {
      background: var(--surface-card);
      border-left: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .dicom-report-header {
      padding: 0.6rem 1rem;
      background: var(--surface-ground);
      border-bottom: 1px solid var(--surface-border);
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .dicom-report-header i { color: var(--primary-color); }
    .dicom-report-body {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }
    .report-section-title {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-color-secondary);
      margin: 0.75rem 0 0.4rem;
    }
    .report-section-title:first-child { margin-top: 0; }
    .report-text {
      font-size: 0.82rem;
      line-height: 1.65;
      color: var(--text-color);
      margin: 0 0 0.5rem;
    }
    .report-footer-meta {
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--surface-border);
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    /* Feature 10.6: annotation legend */
    .report-legend {
      display: flex;
      gap: 0.75rem;
      padding: 0.4rem 0.75rem;
      background: var(--surface-ground);
      border-bottom: 1px solid var(--surface-border);
      font-size: 0.72rem;
      color: var(--text-color-secondary);
    }
    .report-legend-item { display: flex; align-items: center; gap: 0.3rem; }
    .report-highlight {
      display: inline;
      padding: 0 0.25rem;
      border-radius: 2px;
      font-weight: 700;
      font-size: 0.72rem;
    }
    .report-highlight--green  { background: #bbf7d0; color: #166534; }
    .report-highlight--yellow { background: #fef08a; color: #713f12; }
    .report-highlight--blue   { background: #bfdbfe; color: #1e3a8a; }

    /* ── Preventive Care ── */
    /* Feature 10.8: enhanced summary bar */
    .pcare-enhanced-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding: 0.9rem 1.25rem;
      background: var(--surface-card);
      border-radius: var(--border-radius);
      box-shadow: var(--card-shadow, 0 1px 4px rgba(0,0,0,0.08));
    }
    .pcare-summary-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-color);
    }
    .pcare-summary-text i { color: var(--primary-color); font-size: 1.1rem; }
    .overdue-count { color: var(--red-600); }
    .pcare-summary-stats { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .pcare-pill {
      padding: 0.2rem 0.7rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 600;
    }
    .pcare-pill--green  { background: var(--green-100); color: var(--green-800); }
    .pcare-pill--orange { background: var(--orange-100); color: var(--orange-800); }
    .pcare-pill--red    { background: var(--red-100); color: var(--red-800); }

    /* Feature 10.8: mini calendar heatmap */
    .pcare-calendar-section {
      margin-bottom: 1.75rem;
      padding: 1rem 1.25rem;
      background: var(--surface-card);
      border-radius: var(--border-radius);
      box-shadow: var(--card-shadow, 0 1px 3px rgba(0,0,0,0.07));
    }
    .pcare-calendar-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 1rem;
    }
    .pcare-calendar-title i { color: var(--primary-color); }
    .pcare-calendar-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 0.4rem;
      margin-bottom: 0.75rem;
    }
    .pcare-cal-month {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
    }
    .pcare-cal-month-label {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .pcare-cal-dots { display: flex; flex-direction: column; gap: 0.25rem; align-items: center; }
    .pcare-cal-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
      cursor: default;
    }
    .pcare-cal-dot--up_to_date { background: var(--green-500); }
    .pcare-cal-dot--due_soon   { background: var(--orange-500); }
    .pcare-cal-dot--overdue    { background: var(--red-500); }
    .pcare-cal-empty { font-size: 0.65rem; color: var(--surface-border); }
    .pcare-cal-legend {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.72rem;
      color: var(--text-color-secondary);
    }
    .pcare-cal-legend .pcare-cal-dot { width: 8px; height: 8px; cursor: default; }

    /* Existing preventive care styles preserved */
    .pcare-group { margin-bottom: 1.75rem; }
    .pcare-group-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.875rem;
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding-bottom: 0.4rem;
      border-bottom: 2px solid var(--surface-border);
    }
    .pcare-group-title i { color: var(--primary-color); }
    .pcare-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem; }
    .pcare-card {
      padding: 1.1rem 1.25rem;
      background: var(--surface-card);
      border-radius: var(--border-radius);
      border-left: 4px solid var(--surface-border);
      box-shadow: var(--card-shadow, 0 1px 3px rgba(0,0,0,0.07));
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .pcare-card--up_to_date { border-left-color: var(--green-500); }
    .pcare-card--due_soon   { border-left-color: var(--orange-500); }
    .pcare-card--overdue    { border-left-color: var(--red-500); }
    .pcare-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
    .pcare-name-row { display: flex; align-items: center; gap: 0.4rem; }
    .pcare-name { font-weight: 700; font-size: 0.9rem; color: var(--text-color); }
    .pcare-priority-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .pcare-priority--routine   { background: var(--text-color-secondary); }
    .pcare-priority--important { background: var(--orange-500); }
    .pcare-priority--urgent    { background: var(--red-500); }
    .pcare-status-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      white-space: nowrap;
    }
    .pcare-badge--up_to_date { background: var(--green-100); color: var(--green-800); }
    .pcare-badge--due_soon   { background: var(--orange-100); color: var(--orange-800); }
    .pcare-badge--overdue    { background: var(--red-100); color: var(--red-800); }
    .pcare-description { margin: 0; font-size: 0.8rem; line-height: 1.5; color: var(--text-color-secondary); }
    .pcare-dates {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      padding: 0.6rem 0.75rem;
      background: var(--surface-ground);
      border-radius: calc(var(--border-radius) - 2px);
    }
    .pcare-date-item { display: flex; flex-direction: column; gap: 0.15rem; }
    .pcare-date-label { font-size: 0.7rem; color: var(--text-color-secondary); text-transform: uppercase; letter-spacing: 0.03em; }
    .pcare-date-value { font-size: 0.8rem; font-weight: 500; color: var(--text-color); }
    .pcare-overdue-text { color: var(--red-600); font-weight: 700; }
    .pcare-card-footer { padding-top: 0.25rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .reminder-active { color: var(--primary-color) !important; font-weight: 600 !important; }
  `]
})
export class HealthRecordsComponent {

  constructor(private messageService: MessageService) {}

  /* ─────────────── Medications ─────────────── */
  medications = signal<Medication[]>([
    {
      id: 'MED-001', medicationName: 'Lisinopril', genericName: 'Lisinopril',
      dosage: '10mg', frequency: 'Once daily', route: 'Oral',
      prescribedDate: new Date(), prescribedBy: 'Dr. Johnson', startDate: new Date(),
      status: 'active', refillsRemaining: 3, refillsTotal: 6, lastFilledDate: new Date(),
      pharmacy: 'CVS', instructions: 'Take with water', isControlled: false, canRequestRefill: true
    },
    {
      id: 'MED-002', medicationName: 'Metformin', genericName: 'Metformin HCl',
      dosage: '500mg', frequency: 'Twice daily', route: 'Oral',
      prescribedDate: new Date(), prescribedBy: 'Dr. Johnson', startDate: new Date(),
      status: 'active', refillsRemaining: 2, refillsTotal: 6,
      pharmacy: 'CVS', instructions: 'Take with meals', isControlled: false, canRequestRefill: true
    }
  ]);

  /* ─────────────── Lab Results ─────────────── */
  labResults = signal<LabResult[]>([
    {
      id: 'LAB-001', orderId: 'O1', testName: 'Comprehensive Metabolic Panel',
      orderDate: new Date(Date.now() - 7 * 86400000), resultDate: new Date(Date.now() - 5 * 86400000),
      orderedBy: 'Dr. Johnson', status: 'resulted', hasAbnormal: false, isNew: true,
      components: [
        { name: 'Glucose',    value: '92',  unit: 'mg/dL',  referenceRange: '70-100',  flag: 'normal' },
        { name: 'BUN',        value: '15',  unit: 'mg/dL',  referenceRange: '7-20',    flag: 'normal' },
        { name: 'Creatinine', value: '1.0', unit: 'mg/dL',  referenceRange: '0.7-1.3', flag: 'normal' },
        { name: 'Sodium',     value: '140', unit: 'mEq/L',  referenceRange: '136-145', flag: 'normal' },
        { name: 'Potassium',  value: '4.2', unit: 'mEq/L',  referenceRange: '3.5-5.0', flag: 'normal' },
        { name: 'Calcium',    value: '9.5', unit: 'mg/dL',  referenceRange: '8.5-10.5',flag: 'normal' },
        { name: 'ALT',        value: '25',  unit: 'U/L',    referenceRange: '7-56',    flag: 'normal' },
        { name: 'AST',        value: '22',  unit: 'U/L',    referenceRange: '10-40',   flag: 'normal' }
      ]
    },
    {
      id: 'LAB-002', orderId: 'O2', testName: 'Lipid Panel',
      orderDate: new Date(Date.now() - 7 * 86400000), resultDate: new Date(Date.now() - 5 * 86400000),
      orderedBy: 'Dr. Johnson', status: 'resulted', hasAbnormal: true, isNew: true,
      components: [
        { name: 'Total Cholesterol', value: '225', unit: 'mg/dL', referenceRange: '<200', flag: 'high' },
        { name: 'LDL Cholesterol',   value: '165', unit: 'mg/dL', referenceRange: '<130', flag: 'high' },
        { name: 'HDL Cholesterol',   value: '45',  unit: 'mg/dL', referenceRange: '>40',  flag: 'normal' },
        { name: 'Triglycerides',     value: '150', unit: 'mg/dL', referenceRange: '<150', flag: 'normal' }
      ]
    },
    {
      id: 'LAB-003', orderId: 'O3', testName: 'Comprehensive Metabolic Panel',
      orderDate: new Date(Date.now() - 97 * 86400000), resultDate: new Date(Date.now() - 95 * 86400000),
      orderedBy: 'Dr. Johnson', status: 'resulted', hasAbnormal: false, isNew: false,
      components: [
        { name: 'Glucose',    value: '95',  unit: 'mg/dL',  referenceRange: '70-100',  flag: 'normal' },
        { name: 'BUN',        value: '17',  unit: 'mg/dL',  referenceRange: '7-20',    flag: 'normal' },
        { name: 'Creatinine', value: '1.1', unit: 'mg/dL',  referenceRange: '0.7-1.3', flag: 'normal' },
        { name: 'Sodium',     value: '138', unit: 'mEq/L',  referenceRange: '136-145', flag: 'normal' },
        { name: 'Potassium',  value: '4.5', unit: 'mEq/L',  referenceRange: '3.5-5.0', flag: 'normal' },
        { name: 'Calcium',    value: '9.8', unit: 'mg/dL',  referenceRange: '8.5-10.5',flag: 'normal' },
        { name: 'ALT',        value: '28',  unit: 'U/L',    referenceRange: '7-56',    flag: 'normal' },
        { name: 'AST',        value: '24',  unit: 'U/L',    referenceRange: '10-40',   flag: 'normal' }
      ]
    },
    {
      id: 'LAB-004', orderId: 'O4', testName: 'Lipid Panel',
      orderDate: new Date(Date.now() - 97 * 86400000), resultDate: new Date(Date.now() - 95 * 86400000),
      orderedBy: 'Dr. Johnson', status: 'resulted', hasAbnormal: true, isNew: false,
      components: [
        { name: 'Total Cholesterol', value: '240', unit: 'mg/dL', referenceRange: '<200', flag: 'high' },
        { name: 'LDL Cholesterol',   value: '175', unit: 'mg/dL', referenceRange: '<130', flag: 'high' },
        { name: 'HDL Cholesterol',   value: '42',  unit: 'mg/dL', referenceRange: '>40',  flag: 'normal' },
        { name: 'Triglycerides',     value: '165', unit: 'mg/dL', referenceRange: '<150', flag: 'high' }
      ]
    }
  ]);

  /* ─────────────── Allergies ─────────────── */
  allergies = signal<Allergy[]>([
    { id: 'A1', allergen: 'Penicillin', type: 'drug',  reaction: 'Hives, rash', severity: 'moderate',       status: 'active' },
    { id: 'A2', allergen: 'Peanuts',    type: 'food',  reaction: 'Anaphylaxis', severity: 'life_threatening', status: 'active' }
  ]);

  /* ─────────────── Immunizations ─────────────── */
  immunizations = signal<Immunization[]>([
    { id: 'I1', vaccineName: 'Influenza (Flu)',   vaccineCode: 'FLU',   administeredDate: new Date(Date.now() - 90 * 86400000),  administeredBy: 'Nurse Smith', location: 'Main Clinic', seriesComplete: true },
    { id: 'I2', vaccineName: 'COVID-19 Booster',  vaccineCode: 'COVID', administeredDate: new Date(Date.now() - 180 * 86400000), administeredBy: 'Nurse Jones', location: 'Pharmacy',   seriesComplete: true }
  ]);

  /* ─────────────── Lab detail / compare state ─────────────── */
  selectedLab   = signal<LabResult | null>(null);
  showLabDetail = signal(false);
  compareMode   = signal(false);

  previousLab = computed<LabResult | null>(() => {
    const selected = this.selectedLab();
    if (!selected?.resultDate) return null;
    return (
      this.labResults().find(
        l =>
          l.testName === selected.testName &&
          l.id !== selected.id &&
          l.resultDate != null &&
          l.resultDate < selected.resultDate!
      ) ?? null
    );
  });

  /* ─────────────── Patient Education ─────────────── */
  selectedEducation  = signal<PatientEducation | null>(null);
  showEducationDialog = signal(false);

  /* ─────────────── Immunization Certificate ─────────────── */
  certificateDownloading = signal(false);

  /* ─────────────── Clinical Documents ─────────────── */
  clinicalDocuments = signal<{
    id: string; title: string; type: string; date: Date;
    provider: string; category: string; size: string; isNew: boolean;
  }[]>([
    { id: 'DOC-001', title: 'Visit Summary - Annual Physical',  type: 'visit_summary', date: new Date(Date.now() - 5  * 86400000), provider: 'Dr. Sarah Johnson',  category: 'Visit Notes', size: '245 KB',  isNew: true  },
    { id: 'DOC-002', title: 'Cardiology Referral Letter',       type: 'referral',      date: new Date(Date.now() - 20 * 86400000), provider: 'Dr. Sarah Johnson',  category: 'Referrals',   size: '128 KB',  isNew: false },
    { id: 'DOC-003', title: 'Discharge Summary - ER Visit',     type: 'discharge',     date: new Date(Date.now() - 45 * 86400000), provider: 'Dr. Michael Chen',   category: 'Discharge',   size: '512 KB',  isNew: false },
    { id: 'DOC-004', title: 'Lab Report - Comprehensive Panel', type: 'lab_report',    date: new Date(Date.now() - 7  * 86400000), provider: 'City Lab Services',  category: 'Lab Reports', size: '189 KB',  isNew: true  },
    { id: 'DOC-005', title: 'Imaging Report - Chest X-Ray',     type: 'imaging',       date: new Date(Date.now() - 30 * 86400000), provider: 'Radiology Dept',     category: 'Imaging',     size: '1.2 MB',  isNew: false },
    { id: 'DOC-006', title: 'Clinical Notes - Follow-up',       type: 'clinical_note', date: new Date(Date.now() - 10 * 86400000), provider: 'Dr. Sarah Johnson',  category: 'Visit Notes', size: '156 KB',  isNew: false }
  ]);

  docCategoryFilter = signal<string>('all');
  docSearchQuery    = signal('');
  readonly docCategories = ['All', 'Visit Notes', 'Referrals', 'Discharge', 'Lab Reports', 'Imaging'];

  filteredDocuments = computed(() => {
    const catFilter = this.docCategoryFilter();
    const query     = this.docSearchQuery().trim().toLowerCase();
    return this.clinicalDocuments().filter(doc => {
      const matchesCat   = catFilter === 'all' || doc.category.toLowerCase() === catFilter;
      const matchesQuery = !query
        || doc.title.toLowerCase().includes(query)
        || doc.provider.toLowerCase().includes(query)
        || doc.category.toLowerCase().includes(query);
      return matchesCat && matchesQuery;
    });
  });

  /* ─────────────── Preventive Care ─────────────── */
  screenings = signal<ScreeningRecommendation[]>(getPatientScreenings(44, 'male'));

  screeningSummary = computed(() => {
    const list = this.screenings();
    return {
      upToDate: list.filter(s => s.status === 'up_to_date').length,
      dueSoon:  list.filter(s => s.status === 'due_soon').length,
      overdue:  list.filter(s => s.status === 'overdue').length,
    };
  });

  screeningGroups = computed(() => {
    const applicable = this.screenings().filter(s => s.status !== 'not_applicable');
    const groupMap   = new Map<string, ScreeningRecommendation[]>();
    for (const s of applicable) {
      const bucket = groupMap.get(s.category) ?? [];
      bucket.push(s);
      groupMap.set(s.category, bucket);
    }
    return Array.from(groupMap.entries()).map(([category, items]) => ({ category, items }));
  });

  /* ─────────────── Feature 10.1 + 10.2: Notification Settings ─────────────── */
  showNotifSettings  = signal(false);
  notifReleaseMode   = signal<'immediate' | 'hold'>('immediate');

  /** Default: HIV/STI and Genetic Testing checked */
  sensitiveCategorySet = signal<Set<string>>(new Set(['hiv_sti', 'genetic']));

  readonly sensitiveCategories: { key: string; label: string }[] = [
    { key: 'hiv_sti',       label: 'HIV / STI Tests' },
    { key: 'genetic',       label: 'Genetic Testing' },
    { key: 'mental_health', label: 'Mental Health Assessments' },
    { key: 'substance',     label: 'Substance Abuse Screening' },
    { key: 'pregnancy',     label: 'Pregnancy Tests' },
  ];

  /* ─────────────── Feature 10.3: Correction Request ─────────────── */
  showCorrectionDialog  = signal(false);
  correctionDocId       = signal<string | null>(null);
  correctionSection     = signal('');
  correctionDescription = signal('');
  correctionCorrectText = signal('');
  correctionSubmitted   = signal(false);
  correctionReference   = signal('');

  /* ─────────────── Feature 10.4: Imaging Studies ─────────────── */
  imagingStudies = signal<ImagingStudy[]>([
    {
      id: 'IMG-001',
      title: 'Chest X-Ray',
      modality: 'X-Ray',
      date: new Date('2024-01-15'),
      physician: 'Dr. Williams',
      status: 'Final',
      accession: 'ACC-2024-0115',
      reportFindings:
        'The heart is normal in size and contour. The lungs are clear bilaterally with no acute infiltrates or effusions. '
        + 'No acute findings are identified in the visualized bony thorax. The mediastinum is within normal limits. '
        + 'Costophrenic angles are sharp. Diaphragm is well defined.',
      reportImpression:
        'No acute findings. Normal chest radiograph. No acute cardiopulmonary process identified.',
    },
    {
      id: 'IMG-002',
      title: 'MRI Left Knee',
      modality: 'MRI',
      date: new Date('2024-02-20'),
      physician: 'Dr. Patel',
      status: 'Final',
      accession: 'ACC-2024-0220',
      reportFindings:
        'There is mild degenerative changes of the medial compartment with joint space narrowing. '
        + 'The anterior cruciate ligament (ACL) is intact. The posterior cruciate ligament (PCL) is intact. '
        + 'Medial and lateral menisci demonstrate mild degenerative signal without discrete tear. '
        + 'A small joint effusion measuring 2.3 cm in transverse diameter is present. '
        + 'The articular cartilage demonstrates mild thinning medially.',
      reportImpression:
        'Mild degenerative changes of the medial compartment of the left knee. '
        + 'Small joint effusion measuring 2.3 cm. No acute ligamentous injury identified.',
    },
    {
      id: 'IMG-003',
      title: 'CT Abdomen',
      modality: 'CT',
      date: new Date('2024-03-10'),
      physician: 'Dr. Johnson',
      status: 'Preliminary',
      accession: 'ACC-2024-0310',
      reportFindings:
        'The liver measures 16.4 cm in craniocaudal dimension and demonstrates homogeneous attenuation. '
        + 'No focal hepatic lesion is identified. The gallbladder is well distended with no evidence of cholelithiasis. '
        + 'The pancreas is normal in size and attenuation. No acute findings in the visualized bowel. '
        + 'A 1.8 cm simple cyst is noted in the left kidney, consistent with a Bosniak I cyst. '
        + 'No acute findings in the retroperitoneum.',
      reportImpression:
        'No acute abdominal findings. Simple left renal cyst measuring 1.8 cm, likely benign. '
        + 'Recommend follow-up imaging in 12 months per ACR guidelines.',
    },
  ]);

  showImagingViewer      = signal(false);
  selectedStudy          = signal<ImagingStudy | null>(null);
  imagingDownloadPending = signal(false);

  /* ─────────────── Feature 10.8: Calendar data ─────────────── */
  readonly calendarYear = 2026;

  /** Build calendar month data from screenings that have a nextDue date in 2026. */
  readonly calendarMonths: { label: string; dots: { id: string; name: string; status: string }[] }[] = (() => {
    const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const allScreenings = getPatientScreenings(44, 'male').filter(s => s.status !== 'not_applicable');
    return monthLabels.map((label, i) => {
      const dots = allScreenings
        .filter(s => {
          const d = s.nextDue;
          return d && d.getFullYear() === this.calendarYear && d.getMonth() === i;
        })
        .map(s => ({ id: s.id, name: s.name, status: s.status }));
      return { label, dots };
    });
  })();

  /* ─────────────── Feature 10.8: Reminder state ─────────────── */
  /** Set of screening IDs for which the patient has toggled a reminder. */
  private _reminderIds = signal<Set<string>>(new Set());

  reminderSet(id: string): boolean {
    return this._reminderIds().has(id);
  }

  toggleReminder(id: string): void {
    this._reminderIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
        this.messageService.add({ severity: 'info', summary: 'Reminder Removed', detail: 'Screening reminder has been cancelled.', life: 3000 });
      } else {
        next.add(id);
        this.messageService.add({ severity: 'success', summary: 'Reminder Set', detail: 'You will be reminded when this screening is due.', life: 3000 });
      }
      return next;
    });
  }

  /* ─────────────── Methods: Lab ─────────────── */

  viewLabDetail(lab: LabResult): void {
    this.selectedLab.set(lab);
    this.compareMode.set(false);
    this.showLabDetail.set(true);
  }

  toggleCompareMode(): void {
    this.compareMode.update(v => !v);
  }

  getPreviousComponent(prev: LabResult, componentName: string): LabComponent | undefined {
    return prev.components?.find(c => c.name === componentName);
  }

  getComponentChange(
    current: string,
    previous: string
  ): { direction: 'up' | 'down' | 'same'; delta: string } {
    const curr = parseFloat(current);
    const prev = parseFloat(previous);
    if (isNaN(curr) || isNaN(prev)) return { direction: 'same', delta: '' };
    const diff = curr - prev;
    if (Math.abs(diff) < 0.001) return { direction: 'same', delta: '' };
    const sign  = diff > 0 ? '+' : '';
    const delta = `${sign}${diff % 1 === 0 ? diff.toFixed(0) : diff.toFixed(2)}`;
    return { direction: diff > 0 ? 'up' : 'down', delta };
  }

  getTrendClass(
    comp: LabComponent,
    direction: 'up' | 'down' | 'same'
  ): 'improving' | 'worsening' | 'neutral' {
    if (direction === 'same') return 'neutral';
    const flag = comp.flag;
    if (flag === 'high' && direction === 'down') return 'improving';
    if (flag === 'high' && direction === 'up')   return 'worsening';
    if (flag === 'low'  && direction === 'up')   return 'improving';
    if (flag === 'low'  && direction === 'down') return 'worsening';
    return 'neutral';
  }

  showWhatDoesThisMean(testName: string): void {
    this.selectedEducation.set(getEducation(testName));
    this.showEducationDialog.set(true);
  }

  downloadImmunizationCertificate(): void {
    if (this.certificateDownloading()) return;
    this.certificateDownloading.set(true);
    this.messageService.add({
      severity: 'info',
      summary: 'Generating Certificate',
      detail: 'Your WHO-format immunization certificate is being prepared. The download will start shortly.',
      life: 3500,
    });
    setTimeout(() => {
      this.certificateDownloading.set(false);
      this.messageService.add({
        severity: 'success',
        summary: 'Certificate Ready',
        detail: 'Immunization certificate (WHO format) has been generated successfully.',
        life: 4000,
      });
    }, 2000);
  }

  getDocIcon(type: string): string {
    const iconMap: Record<string, string> = {
      visit_summary: 'pi-file-edit',
      referral:      'pi-send',
      discharge:     'pi-home',
      lab_report:    'pi-chart-bar',
      imaging:       'pi-image',
      clinical_note: 'pi-pencil',
    };
    return iconMap[type] ?? 'pi-file';
  }

  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'Cardiovascular':   'pi-heart',
      'Metabolic':        'pi-chart-line',
      'Cancer Screening': 'pi-shield',
      'Bone Health':      'pi-building',
      'Sensory Health':   'pi-eye',
      'Oral Health':      'pi-star',
    };
    return iconMap[category] ?? 'pi-circle';
  }

  getStatusLabel(status: ScreeningRecommendation['status']): string {
    const labels: Record<ScreeningRecommendation['status'], string> = {
      up_to_date:     'Up to Date',
      due_soon:       'Due Soon',
      overdue:        'Overdue',
      not_applicable: 'Not Applicable',
    };
    return labels[status];
  }

  /* ─────────────── Methods: Feature 10.1 + 10.2 ─────────────── */

  openNotifSettings(event: Event): void {
    event.stopPropagation();
    this.showNotifSettings.set(true);
  }

  toggleSensitiveCategory(key: string): void {
    this.sensitiveCategorySet.update(set => {
      const next = new Set(set);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  saveNotifSettings(): void {
    this.showNotifSettings.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Settings Saved',
      detail: 'Your result notification preferences have been updated.',
      life: 3000,
    });
  }

  /* ─────────────── Methods: Feature 10.3 ─────────────── */

  openCorrectionRequest(doc: { id: string; title: string }): void {
    this.correctionDocId.set(doc.id);
    this.correctionSection.set('');
    this.correctionDescription.set('');
    this.correctionCorrectText.set('');
    this.correctionSubmitted.set(false);
    this.correctionReference.set('');
    this.showCorrectionDialog.set(true);
  }

  submitCorrectionRequest(): void {
    const ref = 'COR-' + Math.floor(1000 + Math.random() * 9000);
    this.correctionReference.set(ref);
    this.correctionSubmitted.set(true);
  }

  closeCorrectionDialog(): void {
    this.showCorrectionDialog.set(false);
    this.correctionSubmitted.set(false);
  }

  /* ─────────────── Methods: Feature 10.4 + 10.5 + 10.7 ─────────────── */

  openImagingViewer(study: ImagingStudy): void {
    this.selectedStudy.set(study);
    this.imagingDownloadPending.set(false);
    this.showImagingViewer.set(true);
  }

  downloadImagingStudy(study: ImagingStudy): void {
    if (this.imagingDownloadPending()) return;
    this.imagingDownloadPending.set(true);
    setTimeout(() => {
      this.imagingDownloadPending.set(false);
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      this.messageService.add({
        severity: 'success',
        summary: 'Image Downloaded',
        detail: `Image downloaded with watermark: "PATIENT COPY - Alex Johnson - ${today}"`,
        life: 5000,
      });
    }, 1500);
  }

  /**
   * Feature 10.6 — Annotates radiology report text with colored highlights:
   * - "No acute findings" or "no ... findings" → green
   * - "mild degenerative changes" → yellow
   * - Measurements like "2.3 cm", "16.4 cm", "1.8 cm" → blue
   */
  annotateReport(text: string): string {
    // Order matters: longest/most-specific patterns first
    return text
      .replace(
        /\b(\d+\.?\d*\s*cm)\b/gi,
        '<span style="background:#bfdbfe;color:#1e3a8a;padding:0 2px;border-radius:2px;font-weight:600;">$1</span>'
      )
      .replace(
        /(mild degenerative changes)/gi,
        '<span style="background:#fef08a;color:#713f12;padding:0 2px;border-radius:2px;font-weight:600;">$1</span>'
      )
      .replace(
        /(No acute findings?[^.]*\.?)/gi,
        '<span style="background:#bbf7d0;color:#166534;padding:0 2px;border-radius:2px;font-weight:600;">$1</span>'
      );
  }
}
