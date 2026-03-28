import { Injectable, signal, computed, inject } from '@angular/core';
import { Notification } from '../../shared/data-access';
import { AuthService } from '../../auth/data-access/auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationsDataService {
  private readonly authService = inject(AuthService);

  private readonly _notifications = signal<Notification[]>([]);

  readonly notifications = this._notifications.asReadonly();

  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.isRead).length
  );

  markAsRead(id: string): void {
    this._notifications.update(notifications =>
      notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }

  markAllRead(): void {
    this._notifications.update(notifications =>
      notifications.map(n => ({ ...n, isRead: true }))
    );
  }

  deleteNotification(id: string): void {
    this._notifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
  }

  /** Load notifications from the backend for the current patient. */
  async loadNotifications(): Promise<void> {
    const patientId = this.authService.user()?.patientId
      ?? localStorage.getItem('portal_patient_id');
    if (!patientId) return;

    const token = localStorage.getItem('portal_token') || '';
    try {
      const resp = await fetch(
        `/api/v1/portal/patients/${patientId}/notifications`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      // 404 means the endpoint is not yet implemented — treat as empty
      if (resp.status === 404) return;
      if (resp.ok) {
        const data: { notifications?: Array<{
          id: string;
          type: string;
          title: string;
          body: string;
          is_read: boolean;
          created_at: string;
          related_id?: string;
        }> } = await resp.json();
        const validTypes = new Set<Notification['type']>(['lab_result', 'appointment', 'prescription', 'message']);
        const toType = (raw: string): Notification['type'] =>
          validTypes.has(raw as Notification['type']) ? (raw as Notification['type']) : 'message';
        const mapped: Notification[] = (data.notifications ?? []).map(n => ({
          id: n.id,
          type: toType(n.type),
          title: n.title,
          body: n.body ?? '',
          isRead: n.is_read ?? false,
          timestamp: new Date(n.created_at),
          relatedId: n.related_id,
        }));
        this._notifications.set(mapped);
      }
    } catch { /* network error — leave empty */ }
  }
}
