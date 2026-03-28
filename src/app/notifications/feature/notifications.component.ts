import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { NotificationsDataService } from '../data-access';
import { Notification } from '../../shared/data-access';

@Component({
  selector: 'app-notifications',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, ButtonModule, TagModule, DialogModule],
  template: `
    <div class="notifications-page">
      <header class="page-header">
        <div class="header-title">
          <h1>Notifications</h1>
          <p>Stay up to date with your health activity</p>
        </div>
        <div class="header-actions">
          @if (service.unreadCount() > 0) {
            <span class="unread-badge">{{ service.unreadCount() }} unread</span>
          }
          <button
            pButton
            label="Mark All Read"
            icon="pi pi-check-circle"
            class="p-button-outlined p-button-sm"
            [disabled]="service.unreadCount() === 0"
            (click)="service.markAllRead()"
          ></button>
        </div>
      </header>

      @if (service.notifications().length === 0) {
        <div class="empty-state">
          <i class="pi pi-bell-slash"></i>
          <h3>No Notifications</h3>
          <p>You are all caught up. New notifications will appear here.</p>
        </div>
      } @else {
        <div class="notifications-list">
          @for (notification of service.notifications(); track notification.id) {
            <div
              class="notification-item"
              [class.unread]="!notification.isRead"
              (click)="onNotificationClick(notification)"
            >
              <div class="notification-icon" [class]="'icon-' + notification.type">
                <i [class]="getTypeIcon(notification.type)"></i>
              </div>

              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-title">{{ notification.title }}</span>
                  <p-tag
                    [value]="getTypeLabel(notification.type)"
                    [severity]="getTypeSeverity(notification.type)"
                    class="type-tag"
                  ></p-tag>
                </div>
                <p class="notification-body">{{ notification.body }}</p>
                <span class="notification-time">{{ notification.timestamp | date:'MMM d, y · h:mm a' }}</span>
              </div>

              <div class="notification-actions">
                @if (!notification.isRead) {
                  <div class="unread-dot" title="Unread"></div>
                }
                <button
                  pButton
                  icon="pi pi-trash"
                  class="p-button-text p-button-danger p-button-sm delete-btn"
                  pTooltip="Delete notification"
                  (click)="confirmDelete(notification, $event)"
                ></button>
              </div>
            </div>
          }
        </div>
      }

      <p-dialog
        header="Delete Notification"
        [(visible)]="showDeleteDialog"
        [modal]="true"
        [style]="{ width: '400px' }"
        [closable]="true"
      >
        <div class="delete-dialog-body">
          <i class="pi pi-exclamation-triangle"></i>
          <p>Are you sure you want to delete this notification?</p>
          @if (pendingDeleteNotification()) {
            <p class="delete-title">"{{ pendingDeleteNotification()!.title }}"</p>
          }
        </div>
        <ng-template pTemplate="footer">
          <button
            pButton
            label="Cancel"
            class="p-button-text"
            (click)="cancelDelete()"
          ></button>
          <button
            pButton
            label="Delete"
            icon="pi pi-trash"
            class="p-button-danger"
            (click)="confirmDeleteAction()"
          ></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .notifications-page { max-width: 900px; margin: 0 auto; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-header h1 { margin: 0; }
    .page-header p { color: var(--text-color-secondary); margin: 0.5rem 0 0; }

    .header-actions { display: flex; align-items: center; gap: 1rem; }

    .unread-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      background: var(--primary-100);
      color: var(--primary-700);
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .notifications-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .notification-item {
      display: flex;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: var(--surface-card);
      border-radius: var(--border-radius);
      box-shadow: var(--card-shadow);
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
      border-left: 4px solid transparent;
      align-items: flex-start;
    }
    .notification-item:hover { background: var(--surface-hover); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .notification-item.unread { border-left-color: var(--primary-500); background: var(--primary-50); }
    .notification-item.unread:hover { background: var(--primary-100); }

    .notification-icon {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .notification-icon.icon-lab_result { background: var(--teal-50); color: var(--teal-600); }
    .notification-icon.icon-appointment { background: var(--blue-50); color: var(--blue-600); }
    .notification-icon.icon-prescription { background: var(--orange-50); color: var(--orange-600); }
    .notification-icon.icon-message { background: var(--purple-50); color: var(--purple-600); }

    .notification-content { flex: 1; min-width: 0; }

    .notification-header { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.35rem; }
    .notification-title { font-weight: 600; font-size: 0.9375rem; color: var(--text-color); }

    .type-tag { flex-shrink: 0; }

    .notification-body {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      line-height: 1.5;
    }

    .notification-time { font-size: 0.75rem; color: var(--text-color-secondary); }

    .notification-actions { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; flex-shrink: 0; padding-top: 2px; }

    .unread-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--primary-500);
      flex-shrink: 0;
    }

    .delete-btn { opacity: 0; transition: opacity 0.15s; }
    .notification-item:hover .delete-btn { opacity: 1; }

    .empty-state {
      text-align: center;
      padding: 5rem 2rem;
      color: var(--text-color-secondary);
    }
    .empty-state i { font-size: 4rem; color: var(--surface-300); display: block; margin-bottom: 1rem; }
    .empty-state h3 { margin: 0 0 0.5rem; color: var(--text-color); }
    .empty-state p { margin: 0; }

    .delete-dialog-body { text-align: center; padding: 1rem 0.5rem; }
    .delete-dialog-body i { font-size: 2.5rem; color: var(--orange-500); display: block; margin-bottom: 1rem; }
    .delete-dialog-body p { margin: 0 0 0.5rem; }
    .delete-title { font-weight: 600; color: var(--text-color); }
  `]
})
export class NotificationsComponent implements OnInit {
  readonly service = inject(NotificationsDataService);

  showDeleteDialog = false;
  readonly pendingDeleteNotification = signal<Notification | null>(null);

  ngOnInit(): void {
    this.service.loadNotifications();
  }

  onNotificationClick(notification: Notification): void {
    if (!notification.isRead) {
      this.service.markAsRead(notification.id);
    }
  }

  confirmDelete(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteNotification.set(notification);
    this.showDeleteDialog = true;
  }

  confirmDeleteAction(): void {
    const notification = this.pendingDeleteNotification();
    if (notification) {
      this.service.deleteNotification(notification.id);
    }
    this.cancelDelete();
  }

  cancelDelete(): void {
    this.showDeleteDialog = false;
    this.pendingDeleteNotification.set(null);
  }

  getTypeIcon(type: Notification['type']): string {
    const icons: Record<Notification['type'], string> = {
      lab_result: 'pi pi-file',
      appointment: 'pi pi-calendar',
      prescription: 'pi pi-box',
      message: 'pi pi-envelope'
    };
    return icons[type];
  }

  getTypeLabel(type: Notification['type']): string {
    const labels: Record<Notification['type'], string> = {
      lab_result: 'Lab Result',
      appointment: 'Appointment',
      prescription: 'Prescription',
      message: 'Message'
    };
    return labels[type];
  }

  getTypeSeverity(type: Notification['type']): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<Notification['type'], 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      lab_result: 'info',
      appointment: 'success',
      prescription: 'warn',
      message: 'secondary'
    };
    return severities[type];
  }
}
