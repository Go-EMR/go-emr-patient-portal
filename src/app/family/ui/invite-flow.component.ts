import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

type InviteStatus = 'pending' | 'accepted' | 'declined' | 'not-sent';

interface InviteInfo {
  status: InviteStatus;
  sentAt?: Date;
  expiresAt?: Date;
  respondedAt?: Date;
}

const TODAY = new Date(2026, 1, 22);

function hoursUntil(target: Date): number {
  return Math.max(0, Math.ceil((target.getTime() - TODAY.getTime()) / (1000 * 60 * 60)));
}

@Component({
  selector: 'app-invite-flow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    CardModule,
    ConfirmDialogModule,
    DividerModule,
    TooltipModule,
  ],
  template: `
    <div class="invite-flow" [class]="'invite-flow--' + memberType">
      <div class="invite-header">
        <div class="invite-header-icon" [class]="'header-icon--' + memberType">
          <i [class]="memberType === 'spouse' ? 'pi pi-heart-fill' : 'pi pi-user'" aria-hidden="true"></i>
        </div>
        <div class="invite-header-content">
          <h3 class="invite-title">{{ memberType === 'spouse' ? 'Spouse / Partner Access' : 'Adult Child Access' }}</h3>
          <p class="invite-subtitle">{{ memberType === 'spouse' ? spouseSubtitle : adultChildSubtitle }}</p>
        </div>
        <p-tag
          [value]="getStatusLabel(currentStatus())"
          [severity]="getStatusSeverity(currentStatus())"
          styleClass="status-tag"
          [attr.aria-label]="'Invite status: ' + getStatusLabel(currentStatus())"
        ></p-tag>
      </div>

      <p-divider styleClass="invite-divider"></p-divider>

      <!-- Not sent state -->
      @if (currentStatus() === 'not-sent') {
        <div class="invite-body">
          <div class="invite-info-box">
            <i class="pi pi-info-circle" aria-hidden="true"></i>
            <div class="info-box-content">
              <strong>No invite sent yet.</strong>
              <p>{{ memberType === 'spouse' ? spouseDefaultNote : adultChildDefaultNote }}</p>
            </div>
          </div>
          <button
            pButton
            label="Send Invite"
            icon="pi pi-envelope"
            class="p-button-primary"
            (click)="sendInvite()"
            aria-label="Send invite to family member"
          ></button>
        </div>
      }

      <!-- Pending state -->
      @if (currentStatus() === 'pending') {
        <div class="invite-body">
          <div class="invite-countdown" role="status" [attr.aria-label]="'Invite expires in ' + hoursRemaining() + ' hours'">
            <div class="countdown-circle" [class.urgent]="hoursRemaining() < 12">
              <span class="countdown-value">{{ hoursRemaining() }}</span>
              <span class="countdown-unit">hrs</span>
            </div>
            <div class="countdown-text">
              <strong>Invite pending</strong>
              <p>Your invite expires in {{ hoursRemaining() }} hours. Invite links are valid for 72 hours.</p>
            </div>
          </div>

          <div class="invite-info-box">
            <i class="pi pi-shield" aria-hidden="true"></i>
            <div class="info-box-content">
              <strong>Default permissions when accepted</strong>
              <p>{{ memberType === 'spouse' ? spouseDefaultNote : adultChildDefaultNote }}</p>
            </div>
          </div>

          <div class="invite-actions">
            <button
              pButton
              label="Resend Invite"
              icon="pi pi-refresh"
              class="p-button-outlined"
              (click)="resendInvite()"
              aria-label="Resend the invite"
            ></button>
            <button
              pButton
              label="Cancel Invite"
              icon="pi pi-times"
              class="p-button-text p-button-danger"
              (click)="cancelInvite()"
              aria-label="Cancel the pending invite"
            ></button>
          </div>
        </div>
      }

      <!-- Accepted state -->
      @if (currentStatus() === 'accepted') {
        <div class="invite-body">
          <div class="invite-success-banner" role="status" aria-label="Invite accepted">
            <i class="pi pi-check-circle" aria-hidden="true"></i>
            <div>
              <strong>Access Active</strong>
              <p>This member has accepted the invite and has access to permitted records.</p>
            </div>
          </div>

          <div class="invite-info-box">
            <i class="pi pi-lock" aria-hidden="true"></i>
            <div class="info-box-content">
              <strong>Current permissions</strong>
              @if (memberType === 'spouse') {
                <ul class="perm-list" aria-label="Spouse permissions">
                  <li><i class="pi pi-check" aria-hidden="true"></i> Appointments: Visible</li>
                  <li><i class="pi pi-check" aria-hidden="true"></i> Medications: Visible</li>
                  <li><i class="pi pi-minus" aria-hidden="true"></i> Lab Results: Visible</li>
                  <li><i class="pi pi-times" aria-hidden="true"></i> Mental Health: Blocked</li>
                  <li><i class="pi pi-times" aria-hidden="true"></i> Reproductive: Blocked</li>
                  <li><i class="pi pi-times" aria-hidden="true"></i> Genetic: Blocked</li>
                </ul>
              } @else {
                <p>No access by default. Request access to specific records below.</p>
                <button
                  pButton
                  label="Request Access"
                  icon="pi pi-key"
                  class="p-button-outlined p-button-sm"
                  (click)="requestAccess()"
                  aria-label="Request access to records"
                ></button>
              }
            </div>
          </div>

          <p-divider></p-divider>

          <div class="remove-access-row">
            <span class="remove-label">
              <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
              Remove this member's access
            </span>
            <button
              pButton
              label="Remove Access"
              icon="pi pi-trash"
              class="p-button-danger p-button-outlined p-button-sm"
              (click)="confirmRemoveAccess()"
              aria-label="Remove access from this member"
            ></button>
          </div>
        </div>
      }

      <!-- Declined state -->
      @if (currentStatus() === 'declined') {
        <div class="invite-body">
          <div class="invite-declined-banner" role="status" aria-label="Invite declined">
            <i class="pi pi-times-circle" aria-hidden="true"></i>
            <div>
              <strong>Invite Declined</strong>
              <p>This member declined the portal access invite.</p>
            </div>
          </div>
          <button
            pButton
            label="Send New Invite"
            icon="pi pi-envelope"
            class="p-button-outlined"
            (click)="sendInvite()"
            aria-label="Send a new invite"
          ></button>
        </div>
      }
    </div>

    <p-confirmDialog
      header="Remove Access"
      icon="pi pi-exclamation-triangle"
      acceptLabel="Yes, Remove"
      rejectLabel="Cancel"
      acceptButtonStyleClass="p-button-danger"
      rejectButtonStyleClass="p-button-text"
      [closable]="true"
    ></p-confirmDialog>
  `,
  styles: [`
    .invite-flow {
      background: var(--surface-card);
      border-radius: 12px;
      border: 1px solid var(--surface-border);
      overflow: hidden;
    }

    .invite-header {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem 1.25rem;
    }

    .invite-header-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .header-icon--spouse {
      background: #fce7f3;
      color: #be185d;
    }

    .header-icon--adult-child {
      background: #eff6ff;
      color: #2563eb;
    }

    .invite-header-icon i {
      font-size: 1.25rem;
    }

    .invite-header-content {
      flex: 1;
    }

    .invite-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 0.125rem;
    }

    .invite-subtitle {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin: 0;
    }

    .invite-divider {
      margin: 0;
    }

    .invite-body {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Info box */
    .invite-info-box {
      display: flex;
      gap: 0.75rem;
      padding: 0.875rem;
      background: var(--blue-50);
      border-left: 4px solid var(--primary-300);
      border-radius: 0 8px 8px 0;
    }

    .invite-info-box > i {
      color: var(--primary-color);
      flex-shrink: 0;
      margin-top: 0.1rem;
      font-size: 1rem;
    }

    .info-box-content strong {
      font-size: 0.875rem;
      display: block;
      margin-bottom: 0.25rem;
    }

    .info-box-content p {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin: 0;
      line-height: 1.5;
    }

    /* Countdown */
    .invite-countdown {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.875rem;
      background: var(--orange-50);
      border-radius: 8px;
      border: 1px solid var(--orange-200);
    }

    .countdown-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--orange-100);
      border: 3px solid var(--orange-400);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: border-color 0.3s;
    }

    .countdown-circle.urgent {
      border-color: var(--red-400);
      background: var(--red-50);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .countdown-value {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1;
      color: var(--orange-700);
    }

    .countdown-unit {
      font-size: 0.65rem;
      color: var(--orange-600);
      text-transform: uppercase;
    }

    .countdown-text strong {
      font-size: 0.875rem;
      display: block;
      margin-bottom: 0.25rem;
    }

    .countdown-text p {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin: 0;
    }

    /* Actions */
    .invite-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Success banner */
    .invite-success-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem;
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      border-radius: 0 8px 8px 0;
    }

    .invite-success-banner > i {
      color: #16a34a;
      font-size: 1.25rem;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }

    .invite-success-banner strong {
      font-size: 0.875rem;
      display: block;
      margin-bottom: 0.25rem;
    }

    .invite-success-banner p {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin: 0;
    }

    /* Permissions list */
    .perm-list {
      list-style: none;
      padding: 0;
      margin: 0.375rem 0 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .perm-list li {
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .perm-list .pi-check { color: #16a34a; }
    .perm-list .pi-minus { color: #ca8a04; }
    .perm-list .pi-times { color: #dc2626; }

    /* Declined banner */
    .invite-declined-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem;
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      border-radius: 0 8px 8px 0;
    }

    .invite-declined-banner > i {
      color: #dc2626;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .invite-declined-banner strong {
      font-size: 0.875rem;
      display: block;
      margin-bottom: 0.25rem;
    }

    .invite-declined-banner p {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      margin: 0;
    }

    /* Remove access */
    .remove-access-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      background: var(--red-50);
      border-radius: 8px;
      border: 1px solid var(--red-200);
    }

    .remove-label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: var(--red-700);
      font-weight: 500;
    }

    .remove-label i {
      font-size: 0.875rem;
    }
  `],
})
export class InviteFlowComponent implements OnInit {
  private readonly confirmationService = inject(ConfirmationService);

  @Input() memberType: 'spouse' | 'adult-child' = 'spouse';
  @Output() accessRemoved = new EventEmitter<void>();
  @Output() accessRequested = new EventEmitter<void>();

  protected readonly currentStatus = signal<InviteStatus>('not-sent');

  protected readonly inviteExpiry = signal<Date | null>(null);

  protected readonly spouseSubtitle = 'Linked portal account for your spouse or partner.';
  protected readonly adultChildSubtitle = 'Portal access for an adult child (18+).';

  protected readonly spouseDefaultNote =
    'Default permissions: Appointments and Medications are visible. ' +
    'Mental Health, Reproductive, and Genetic records are blocked by default. ' +
    'You can modify these in Permission Management.';

  protected readonly adultChildDefaultNote =
    'Default permissions: No access granted. Your adult child must request specific ' +
    'record access and you can approve or deny each category independently.';

  protected readonly hoursRemaining = computed(() => {
    const expiry = this.inviteExpiry();
    if (!expiry) return 0;
    return hoursUntil(expiry);
  });

  ngOnInit(): void {
    // Set a demo pending state for spouse
    if (this.memberType === 'spouse') {
      const expiry = new Date(TODAY.getTime() + 28 * 60 * 60 * 1000); // 28 hours from now
      this.inviteExpiry.set(expiry);
      this.currentStatus.set('pending');
    }
  }

  protected sendInvite(): void {
    const expiry = new Date(TODAY.getTime() + 72 * 60 * 60 * 1000);
    this.inviteExpiry.set(expiry);
    this.currentStatus.set('pending');
  }

  protected resendInvite(): void {
    const expiry = new Date(TODAY.getTime() + 72 * 60 * 60 * 1000);
    this.inviteExpiry.set(expiry);
  }

  protected cancelInvite(): void {
    this.inviteExpiry.set(null);
    this.currentStatus.set('not-sent');
  }

  protected requestAccess(): void {
    this.accessRequested.emit();
  }

  protected confirmRemoveAccess(): void {
    this.confirmationService.confirm({
      message:
        'Are you sure you want to remove access for this member? ' +
        'They will no longer be able to view any of your health records. ' +
        'This action will be logged.',
      accept: () => {
        this.currentStatus.set('not-sent');
        this.inviteExpiry.set(null);
        this.accessRemoved.emit();
      },
    });
  }

  protected getStatusLabel(status: InviteStatus): string {
    const map: Record<InviteStatus, string> = {
      'not-sent': 'Not Sent',
      pending: 'Pending',
      accepted: 'Active',
      declined: 'Declined',
    };
    return map[status] ?? status;
  }

  protected getStatusSeverity(status: InviteStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | undefined {
    const map: Record<InviteStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'not-sent': 'secondary',
      pending: 'warn',
      accepted: 'success',
      declined: 'danger',
    };
    return map[status] ?? 'secondary';
  }
}
