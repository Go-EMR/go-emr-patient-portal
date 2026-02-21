import { Injectable, signal, computed } from '@angular/core';
import { Notification } from '../../shared/data-access';

@Injectable({ providedIn: 'root' })
export class NotificationsDataService {
  private readonly _notifications = signal<Notification[]>([
    {
      id: 'NOTIF-001',
      type: 'lab_result',
      title: 'Lab Results Ready',
      body: 'Your Complete Blood Count (CBC) results from January 15 are now available. Please review them in Health Records.',
      timestamp: new Date(Date.now() - 2 * 3600000),
      isRead: false,
      relatedId: 'LAB-2024-001'
    },
    {
      id: 'NOTIF-002',
      type: 'appointment',
      title: 'Appointment Reminder',
      body: 'You have an upcoming appointment with Dr. Sarah Johnson on February 24 at 10:00 AM for your Annual Physical.',
      timestamp: new Date(Date.now() - 6 * 3600000),
      isRead: false,
      relatedId: 'APT-001'
    },
    {
      id: 'NOTIF-003',
      type: 'prescription',
      title: 'Prescription Ready for Pickup',
      body: 'Your Lisinopril 10mg prescription is ready at Walgreens Pharmacy. Refills remaining: 3.',
      timestamp: new Date(Date.now() - 24 * 3600000),
      isRead: false,
      relatedId: 'MED-001'
    },
    {
      id: 'NOTIF-004',
      type: 'message',
      title: 'New Message from Dr. Johnson',
      body: 'Dr. Sarah Johnson replied to your message about medication side effects. Tap to read the full response.',
      timestamp: new Date(Date.now() - 2 * 86400000),
      isRead: true,
      relatedId: 'T1'
    },
    {
      id: 'NOTIF-005',
      type: 'lab_result',
      title: 'Abnormal Lab Value Flagged',
      body: 'Your Lipid Panel from January 10 has an out-of-range value. Dr. Johnson has been notified and will follow up.',
      timestamp: new Date(Date.now() - 5 * 86400000),
      isRead: true,
      relatedId: 'LAB-2024-002'
    },
    {
      id: 'NOTIF-006',
      type: 'appointment',
      title: 'Appointment Confirmed',
      body: 'Your cardiology follow-up with Dr. Michael Chen on March 7 at 2:00 PM has been confirmed.',
      timestamp: new Date(Date.now() - 7 * 86400000),
      isRead: true,
      relatedId: 'APT-002'
    }
  ]);

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
}
